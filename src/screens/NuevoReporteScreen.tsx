// Pantalla para crear un reporte en cuatro pasos: foto, categoría, detalle y ubicación.
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/aviso';
import { capitalizar } from '../lib/texto';
import { useEsEscritorio } from '../lib/pantalla';
import {
  CATEGORIAS,
  CENTRO_JALAPA,
  Categoria,
  DESCRIPCION_MAX,
  DESCRIPCION_MIN,
  INDICACIONES_MAX,
  LIMITE_REPORTES_DIARIOS,
  MAX_FOTO_BYTES,
  TELEFONO_LARGO,
  TITULO_MAX,
  TITULO_MIN,
  estaEnJalapa,
} from '../types';
import { colores, espacio, medidas, movimiento, radio, sombra } from '../theme';
import { Entrada, NATIVO, useReducirMovimiento } from '../components/motion';
import { Boton, Campo, Icono, Medallon, Mosaico, NombreIcono, TituloPantalla, Txt } from '../components/ui';

type Props = {
  usuarioId: string;
  alTerminar: () => void; // se llama al crear el reporte (para ir a la lista)
};

type Coordenadas = { lat: number; lng: number };

export default function NuevoReporteScreen({ usuarioId, alTerminar }: Props) {
  const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [titulo, setTitulo] = useState(''); // solo para la categoría "Otro"
  const [descripcion, setDescripcion] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const escritorio = useEsEscritorio();

  // Guarda la foto elegida solo si es jpeg/png y pesa menos de 5 MB.
  function revisarFoto(resultado: ImagePicker.ImagePickerResult) {
    if (resultado.canceled) return;
    const imagen = resultado.assets[0];

    const tipo = imagen.mimeType ?? 'image/jpeg';
    if (tipo !== 'image/jpeg' && tipo !== 'image/png') {
      avisar('Foto no válida', 'Solo se permiten imágenes JPG o PNG.');
      return;
    }
    // El base64 ocupa ~4/3 del tamaño real, así que se calcula el tamaño aproximado.
    const bytes = imagen.fileSize ?? Math.floor(((imagen.base64 ?? '').length * 3) / 4);
    if (bytes > MAX_FOTO_BYTES) {
      avisar('Foto muy pesada', 'La foto no puede pasar de 5 MB.');
      return;
    }
    // En web el base64 puede venir con prefijo "data:...;base64,"; se quita.
    if (imagen.base64?.includes(",")) {
      imagen.base64 = imagen.base64.split(",")[1];
    }
    setFoto(imagen);
  }

  async function tomarFoto() {
    // En el navegador no hay cámara nativa: se abre el selector de archivos.
    if (Platform.OS === 'web') {
      await elegirDeGaleria();
      return;
    }
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      avisar('Permiso necesario', 'Permite el uso de la cámara para tomar la foto.');
      return;
    }
    // quality 0.6 reduce el peso de la foto sin perder mucha calidad.
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    revisarFoto(resultado);
  }

  async function elegirDeGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    revisarFoto(resultado);
  }

  async function usarMiUbicacion() {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) {
      avisar('Permiso necesario', 'Permite el acceso a tu ubicación.');
      return;
    }
    try {
      const posicion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coordenadas = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
      setUbicacion(coordenadas);
    } catch {
      avisar('Error', 'No se pudo obtener tu ubicación.');
    }
  }

  async function enviar() {
    // Validaciones en la app (la base de datos las vuelve a validar).
    if (!foto || !foto.base64) {
      avisar('Falta la foto', 'Toma o elige una foto del problema.');
      return;
    }
    if (!categoria) {
      avisar('Falta la categoría', 'Elige una categoría.');
      return;
    }
    const tituloLimpio = capitalizar(titulo.trim());
    if (categoria === 'Otro' && (tituloLimpio.length < TITULO_MIN || tituloLimpio.length > TITULO_MAX)) {
      avisar('Título', `Escribe un título de ${TITULO_MIN} a ${TITULO_MAX} caracteres.`);
      return;
    }
    const texto = capitalizar(descripcion.trim());
    if (texto.length < DESCRIPCION_MIN || texto.length > DESCRIPCION_MAX) {
      avisar('Descripción', `Debe tener entre ${DESCRIPCION_MIN} y ${DESCRIPCION_MAX} caracteres.`);
      return;
    }
    if (!ubicacion) {
      avisar('Falta la ubicación', 'Usa tu ubicación o la ubicación de prueba.');
      return;
    }

    // El teléfono es opcional, pero si se escribe debe tener 8 dígitos.
    if (telefono !== '' && telefono.length !== TELEFONO_LARGO) {
      avisar('Teléfono', `El teléfono debe tener ${TELEFONO_LARGO} dígitos.`);
      return;
    }

    setEnviando(true);
    try {
      // 0. Anti-spam. Estas revisiones evitan subir la foto para nada; la base de datos
      //    vuelve a exigir las mismas reglas (la app sola se podría saltar).
      // Huella (SHA-256) de la foto: dos fotos iguales dan la misma huella.
      const hashFoto = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, foto.base64);

      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('reportes')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .gte('creado_en', inicioDia.toISOString());
      if ((count ?? 0) >= LIMITE_REPORTES_DIARIOS) {
        avisar('Límite diario', `Solo puedes enviar ${LIMITE_REPORTES_DIARIOS} reportes por día. Intenta mañana.`);
        return;
      }

      const { data: repetidos } = await supabase
        .from('reportes')
        .select('id')
        .eq('foto_hash', hashFoto)
        .eq('descripcion', texto)
        .limit(1);
      if (repetidos && repetidos.length > 0) {
        avisar('Reporte repetido', 'Ya enviaste un reporte con la misma foto y el mismo texto.');
        return;
      }

      // 1. Subir la foto a la carpeta del usuario: <uid>/<fecha>.<extensión>
      const esPng = foto.mimeType === 'image/png';
      const ruta = `${usuarioId}/${Date.now()}.${esPng ? 'png' : 'jpg'}`;
      const { error: errorSubida } = await supabase.storage
        .from('fotos')
        .upload(ruta, decode(foto.base64), { contentType: esPng ? 'image/png' : 'image/jpeg' });
      if (errorSubida) throw errorSubida;

      const { data: publica } = supabase.storage.from('fotos').getPublicUrl(ruta);

      // 2. Insertar el reporte. No se envía "estado" ni "usuario_id":
      //    la base pone 'pendiente' y el usuario autenticado.
      const { error: errorInsert } = await supabase.from('reportes').insert({
        categoria,
        titulo: categoria === 'Otro' ? tituloLimpio : null,
        descripcion: texto,
        indicaciones: capitalizar(indicaciones.trim()) || null,
        telefono: telefono || null,
        foto_url: publica.publicUrl,
        foto_hash: hashFoto,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
      });
      if (errorInsert) throw errorInsert;

      // Confirmación visual; al terminar se limpia el formulario y se va a la lista.
      setEnviado(true);
    } catch (error: any) {
      avisar('Error', error.message);
    } finally {
      setEnviando(false);
    }
  }

  // Como esta pantalla se queda abierta al cambiar de pestaña, se limpia el formulario.
  function terminar() {
    setEnviado(false);
    setFoto(null);
    setCategoria(null);
    setTitulo('');
    setDescripcion('');
    setIndicaciones('');
    setTelefono('');
    setUbicacion(null);
    alTerminar();
  }

  const tituloListo = categoria !== 'Otro' || titulo.trim().length >= TITULO_MIN;
  const hecho = {
    foto: !!foto,
    categoria: !!categoria,
    detalle: descripcion.trim().length >= DESCRIPCION_MIN && tituloListo,
    ubicacion: !!ubicacion,
  };
  const completados = Object.values(hecho).filter(Boolean).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[estilos.contenedor, escritorio && { paddingBottom: espacio.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.columna}>
          <Entrada indice={0} style={{ gap: espacio.lg }}>
            <TituloPantalla titulo="Nuevo reporte" detalle="Cuéntanos qué está pasando en tu comunidad." />
            <View style={estilos.progreso} accessibilityLabel={`${completados} de 4 pasos completos`}>
              {[hecho.foto, hecho.categoria, hecho.detalle, hecho.ubicacion].map((listo, i) => (
                <View key={i} style={[estilos.segmento, listo && { backgroundColor: colores.acento }]} />
              ))}
            </View>
          </Entrada>

          {/* Paso 1: foto */}
          <Entrada indice={1} style={estilos.paso}>
            <Paso icono="camera-outline" titulo="Foto del problema" hecho={hecho.foto} />
            {foto ? (
              <View>
                <Image source={{ uri: foto.uri }} style={estilos.foto} accessibilityLabel="Vista previa de la foto" />
              </View>
            ) : (
              <View style={estilos.fotoVacia}>
                <Icono nombre="image-outline" tamano={32} color={colores.textoTenue} />
                <Txt variante="pequeno" color={colores.textoTenue}>
                  Una foto clara ayuda a atender más rápido
                </Txt>
              </View>
            )}
            <View style={estilos.fila}>
              {Platform.OS !== 'web' && (
                <Boton texto={foto ? 'Tomar otra' : 'Tomar foto'} icono="camera-outline" variante="secundario" onPress={tomarFoto} style={{ flex: 1 }} />
              )}
              <Boton texto={Platform.OS === 'web' ? (foto ? 'Cambiar foto' : 'Elegir foto') : 'Galería'} icono="images-outline" variante="secundario" onPress={elegirDeGaleria} style={{ flex: 1 }} />
            </View>
          </Entrada>

          {/* Paso 2: categoría */}
          <Entrada indice={2} style={estilos.paso}>
            <Paso icono="funnel-outline" titulo="Categoría" hecho={hecho.categoria} />
            <View style={estilos.mosaicos}>
              {CATEGORIAS.map((c) => (
                <Mosaico key={c} categoria={c} activo={categoria === c} onPress={() => setCategoria(c)} />
              ))}
            </View>
          </Entrada>

          {/* Paso 3: detalle */}
          <Entrada indice={3} style={estilos.paso}>
            <Paso icono="document-text-outline" titulo="Detalle" hecho={hecho.detalle} />
            {categoria === 'Otro' && (
              <Campo
                etiqueta="Título del problema"
                value={titulo}
                onChangeText={setTitulo}
                autoCapitalize="sentences"
                maxLength={TITULO_MAX}
                placeholder="Ej: accidente, bloqueo de calle"
              />
            )}
            <Campo
              etiqueta="Descripción"
              multiline
              autoCapitalize="sentences"
              value={descripcion}
              onChangeText={setDescripcion}
              maxLength={DESCRIPCION_MAX}
              placeholder={`Describe el problema (mínimo ${DESCRIPCION_MIN} caracteres)`}
              contador={`${descripcion.length}/${DESCRIPCION_MAX}`}
              style={{ minHeight: 84 }}
            />
            <Campo
              etiqueta="Indicaciones para llegar (opcional)"
              multiline
              autoCapitalize="sentences"
              value={indicaciones}
              onChangeText={setIndicaciones}
              maxLength={INDICACIONES_MAX}
              placeholder="Ej: frente a la escuela, portón verde"
              style={{ minHeight: 56 }}
            />
            <Campo
              etiqueta="Teléfono de contacto (opcional)"
              icono="call-outline"
              value={telefono}
              onChangeText={(t) => setTelefono(t.replace(/[^0-9]/g, ''))}
              maxLength={TELEFONO_LARGO}
              keyboardType="phone-pad"
              placeholder="8 dígitos"
              contador="Solo lo ve la municipalidad"
            />
          </Entrada>

          {/* Paso 4: ubicación */}
          <Entrada indice={4} style={estilos.paso}>
            <Paso icono="location-outline" titulo="Ubicación" hecho={hecho.ubicacion} />
            {ubicacion && (
              <View style={estilos.ubicacion}>
                <Medallon nombre="pin-outline" tamano={40} color={estaEnJalapa(ubicacion.lat, ubicacion.lng) ? colores.estado.resuelto : colores.estado['en proceso']} fondo={colores.elevada} />
                <View style={{ flex: 1, gap: 2 }}>
                  {/* "selectable" permite copiar las coordenadas */}
                  <Txt variante="cuerpoMedio" selectable>
                    {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
                  </Txt>
                  <Txt
                    variante="pequeno"
                    color={estaEnJalapa(ubicacion.lat, ubicacion.lng) ? colores.textoSecundario : colores.estado['en proceso']}
                  >
                    {estaEnJalapa(ubicacion.lat, ubicacion.lng)
                      ? 'Dentro de la zona de Jalapa'
                      : 'Fuera de Jalapa. Se enviará igual; si no es correcta, usa la ubicación de prueba.'}
                  </Txt>
                </View>
              </View>
            )}
            <View style={estilos.fila}>
              <Boton texto="Usar mi ubicación" icono="locate-outline" variante="secundario" onPress={usarMiUbicacion} style={{ flex: 1 }} />
              <Boton texto="Ubicación de prueba" icono="compass-outline" variante="secundario" onPress={() => setUbicacion(CENTRO_JALAPA)} style={{ flex: 1 }} />
            </View>
          </Entrada>

          <Boton texto="Enviar reporte" icono="arrow-forward-outline" onPress={enviar} cargando={enviando} />
        </View>
      </ScrollView>

      {enviado && <Confirmacion onListo={terminar} />}
    </View>
  );
}

// Encabezado de cada paso: ícono en círculo que pasa a check cuando el paso está completo.
function Paso({ icono, titulo, hecho }: { icono: NombreIcono; titulo: string; hecho: boolean }) {
  return (
    <View style={estilos.pasoTitulo}>
      <Medallon
        nombre={hecho ? 'checkmark-outline' : icono}
        tamano={32}
        color={hecho ? colores.sobreAcento : colores.textoSecundario}
        fondo={hecho ? colores.acento : colores.elevada}
      />
      <Txt variante="subtitulo">{titulo}</Txt>
    </View>
  );
}

// Check de confirmación: aparece con un desvanecimiento discreto y luego cierra solo.
function Confirmacion({ onListo }: { onListo: () => void }) {
  const reducir = useReducirMovimiento();
  const aparece = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(aparece, {
      toValue: 1,
      duration: movimiento.lento,
      easing: movimiento.salida,
      useNativeDriver: NATIVO,
    }).start();
    const temporizador = setTimeout(onListo, reducir ? 1200 : 1600);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[estilos.velo, { opacity: aparece }]} accessibilityLiveRegion="polite">
      <View style={estilos.confirmacion}>
        <Medallon nombre="checkmark-outline" tamano={72} color={colores.estado.resuelto} fondo="rgba(147,187,160,0.16)" />
        <Txt variante="tituloMedio">Reporte enviado</Txt>
        <Txt variante="cuerpo" color={colores.textoSecundario} style={{ textAlign: 'center' }}>
          Puedes seguirlo en la pestaña Reportes.
        </Txt>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: espacio.xl, paddingBottom: medidas.espacioBarra },
  columna: { width: '100%', maxWidth: medidas.anchoLectura, alignSelf: 'center', gap: espacio.xxxl },
  progreso: { flexDirection: 'row', gap: espacio.xs },
  segmento: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colores.borde },
  paso: { gap: espacio.lg },
  pasoTitulo: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  fila: { flexDirection: 'row', gap: espacio.md },
  foto: { width: '100%', height: 240, borderRadius: radio.xl, backgroundColor: colores.elevada },
  fotoVacia: {
    height: 160,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colores.bordeFuerte,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
  },
  mosaicos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: espacio.md },
  ubicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    padding: espacio.md,
    borderRadius: radio.lg,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  velo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colores.velo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.xl,
  },
  confirmacion: {
    alignItems: 'center',
    gap: espacio.md,
    paddingVertical: espacio.xxxl,
    paddingHorizontal: espacio.xxxl,
    borderRadius: radio.xl,
    backgroundColor: colores.elevada,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra.flotante,
  },
});
