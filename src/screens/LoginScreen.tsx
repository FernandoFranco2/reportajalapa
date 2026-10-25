// Pantalla para iniciar sesión o registrarse con correo y contraseña.
// En pantalla ancha (navegador) se divide en dos paneles: marca a la izquierda y formulario a la derecha.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useEsEscritorio } from '../lib/pantalla';
import { colores, espacio, medidas, radio } from '../theme';
import { Entrada, Tocable } from '../components/motion';
import { Boton, Campo, Icono, Medallon, NombreIcono, Txt } from '../components/ui';
import MarcaJ from '../components/MarcaJ';
import CategoriasRotativas from '../components/CategoriasRotativas';

type Errores = { nombre?: string; correo?: string; clave?: string; general?: string };

// Traduce los mensajes más comunes del servidor.
function mensajeDe(error: { message: string }): string {
  if (/invalid login credentials/i.test(error.message)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(error.message)) return 'Ese correo ya tiene una cuenta.';
  return error.message;
}

// Lo que ofrece la app, mostrado en el panel de marca (solo pantalla ancha).
const PUNTOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: 'camera-outline', titulo: 'Evidencia y lugar', texto: 'Cada reporte lleva foto y ubicación.' },
  { icono: 'pulse-outline', titulo: 'Seguimiento claro', texto: 'Pendiente, en proceso o resuelto, siempre a la vista.' },
  {
    icono: 'chatbubble-ellipses-outline',
    titulo: 'Respuesta de la municipalidad',
    texto: 'Verás su mensaje dentro de tu reporte.',
  },
];

export default function LoginScreen() {
  const escritorio = useEsEscritorio();
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [info, setInfo] = useState<string | null>(null);

  async function enviar() {
    // Validaciones básicas antes de llamar al servidor.
    const nuevos: Errores = {};
    if (esRegistro && nombre.trim().length < 2) nuevos.nombre = 'Escribe tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) nuevos.correo = 'Escribe un correo válido.';
    if (clave.length < 6) nuevos.clave = 'La contraseña debe tener al menos 6 caracteres.';
    setErrores(nuevos);
    setInfo(null);
    if (Object.keys(nuevos).length > 0) return;

    setCargando(true);
    try {
      if (esRegistro) {
        // El nombre viaja en "data"; un trigger de la base crea el perfil como vecino.
        const { error } = await supabase.auth.signUp({
          email: correo.trim(),
          password: clave,
          options: { data: { nombre: nombre.trim() } },
        });
        if (error) throw error;
        setInfo('Cuenta creada. Si te pedimos confirmar el correo, revisa tu bandeja.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: correo.trim(),
          password: clave,
        });
        if (error) throw error;
      }
      // Al iniciar sesión, App.tsx detecta el cambio y muestra la app.
    } catch (error: any) {
      setErrores({ general: mensajeDe(error) });
    } finally {
      setCargando(false);
    }
  }

  function cambiarModo() {
    setEsRegistro(!esRegistro);
    setErrores({});
    setInfo(null);
  }

  return (
    <View style={[estilos.fondo, escritorio && estilos.fila]}>
      {escritorio && <PanelMarca />}

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={estilos.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={estilos.columna}>
              {/* Teléfono: la marca va arriba. Pantalla ancha: ya está en el panel izquierdo. */}
              {escritorio ? (
                <Entrada indice={0} style={estilos.encabezadoForm}>
                  <Txt variante="titulo">{esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</Txt>
                  <Txt variante="cuerpo" color={colores.textoSecundario}>
                    {esRegistro ? 'Solo te tomará un minuto.' : 'Inicia sesión para ver tus reportes.'}
                  </Txt>
                </Entrada>
              ) : (
                <Entrada indice={0} style={estilos.marca}>
                  <MarcaJ tamano={84} animada />
                  <Txt variante="titulo" style={{ textAlign: 'center' }}>
                    ReportaJalapa
                  </Txt>
                  <Txt variante="cuerpo" color={colores.textoSecundario} style={{ textAlign: 'center' }}>
                    Reporta los problemas de tu comunidad
                  </Txt>
                  <View style={{ marginTop: espacio.sm }}>
                    <CategoriasRotativas />
                  </View>
                </Entrada>
              )}

              <Entrada indice={1} style={estilos.formulario}>
                {esRegistro && (
                  <Campo
                    etiqueta="Nombre"
                    icono="person-outline"
                    value={nombre}
                    onChangeText={setNombre}
                    maxLength={60}
                    placeholder="Cómo te llamas"
                    autoComplete="name"
                    error={errores.nombre}
                  />
                )}
                <Campo
                  etiqueta="Correo"
                  icono="mail-outline"
                  value={correo}
                  onChangeText={setCorreo}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="nombre@correo.com"
                  error={errores.correo}
                />
                <Campo
                  etiqueta="Contraseña"
                  icono="lock-closed-outline"
                  value={clave}
                  onChangeText={setClave}
                  secureTextEntry
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                  placeholder="Mínimo 6 caracteres"
                  onSubmitEditing={enviar}
                  error={errores.clave}
                />

                {errores.general && (
                  <View style={estilos.mensaje}>
                    <Icono nombre="alert-circle-outline" tamano={18} color={colores.error} />
                    <Txt variante="pequeno" color={colores.error} style={{ flex: 1 }}>
                      {errores.general}
                    </Txt>
                  </View>
                )}
                {info && (
                  <View style={estilos.mensaje}>
                    <Icono nombre="checkmark-circle-outline" tamano={18} color={colores.estado.resuelto} />
                    <Txt variante="pequeno" color={colores.estado.resuelto} style={{ flex: 1 }}>
                      {info}
                    </Txt>
                  </View>
                )}

                <Boton
                  texto={esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
                  onPress={enviar}
                  cargando={cargando}
                  style={{ marginTop: espacio.sm }}
                />
              </Entrada>

              <Entrada indice={2}>
                <Tocable accessibilityRole="button" onPress={cambiarModo} style={estilos.cambiar}>
                  <Txt variante="cuerpoMedio" color={colores.acento}>
                    {esRegistro ? 'Ya tengo cuenta: iniciar sesión' : 'No tengo cuenta: registrarme'}
                  </Txt>
                </Tocable>
              </Entrada>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Panel izquierdo (solo pantalla ancha): marca y lo que ofrece la app. Sin adornos de fondo.
function PanelMarca() {
  return (
    <View style={estilos.panel}>
      <View style={estilos.panelContenido}>
        <Entrada indice={0} style={{ gap: espacio.lg }}>
          <MarcaJ tamano={96} animada />
          <Txt variante="titulo" style={{ fontSize: 40, lineHeight: 46, letterSpacing: -1 }}>
            ReportaJalapa
          </Txt>
          <Txt variante="cuerpo" color={colores.textoSecundario} style={{ fontSize: 18, lineHeight: 26 }}>
            Reporta los problemas de tu comunidad y sigue su atención hasta que se resuelvan.
          </Txt>
          <View style={{ alignItems: 'flex-start' }}>
            <CategoriasRotativas />
          </View>
        </Entrada>

        <View style={{ gap: espacio.xl }}>
          {PUNTOS.map((punto, i) => (
            <Entrada key={punto.titulo} indice={i + 1} style={estilos.punto}>
              <Medallon nombre={punto.icono} tamano={40} fondo={colores.elevada} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variante="cuerpoMedio" style={{ fontWeight: '600' }}>
                  {punto.titulo}
                </Txt>
                <Txt variante="pequeno" color={colores.textoSecundario}>
                  {punto.texto}
                </Txt>
              </View>
            </Entrada>
          ))}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  fila: { flexDirection: 'row' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: espacio.xl },
  columna: { width: '100%', maxWidth: medidas.anchoAcceso, alignSelf: 'center', gap: espacio.xxxl },
  marca: { alignItems: 'center', gap: espacio.md },
  encabezadoForm: { gap: espacio.xs },
  formulario: { gap: espacio.lg },
  mensaje: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  cambiar: { minHeight: medidas.tactil, alignItems: 'center', justifyContent: 'center', borderRadius: radio.md },
  panel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacio.enorme,
    backgroundColor: colores.superficie,
    borderRightWidth: 1,
    borderRightColor: colores.borde,
  },
  panelContenido: { width: '100%', maxWidth: 460, gap: espacio.enorme },
  punto: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
});
