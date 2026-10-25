// Lista de reportes con filtros. La base de datos (RLS) decide qué filas llegan:
// el vecino solo recibe las suyas y la municipalidad recibe todas.
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import ReporteCard from '../components/ReporteCard';
import { Entrada, Esqueleto, Tocable } from '../components/motion';
import { EstadoVacio, Icono, Mosaico, Txt, TituloPantalla } from '../components/ui';
import { supabase } from '../lib/supabase';
import { avisar, notificar } from '../lib/aviso';
import { etiquetaEstado } from '../lib/texto';
import { useEsEscritorio } from '../lib/pantalla';
import { CATEGORIAS, COLOR_ESTADO, ESTADOS, Estado, Perfil, Reporte } from '../types';
import { colores, conAlpha, espacio, medidas, radio } from '../theme';

// soloResueltos = false: pestaña "Reportes" (pendientes y en proceso).
// soloResueltos = true: pestaña "Resueltos" (el historial).
type Props = { perfil: Perfil; soloResueltos: boolean };

const ESTADOS_ABIERTOS: Estado[] = ['pendiente', 'en proceso'];

export default function ListaScreen({ perfil, soloResueltos }: Props) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(false);
  const [primeraCarga, setPrimeraCarga] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  // Vista de prioridad (municipalidad): por defecto los más antiguos van primero.
  const [masAntiguosPrimero, setMasAntiguosPrimero] = useState(true);
  const { width } = useWindowDimensions();
  const escritorio = useEsEscritorio();
  // Las columnas dependen del ancho real del contenido (descontando la barra lateral):
  // 1 en teléfono, 2 en pantallas medianas y 3 en pantallas amplias.
  const anchoUtil = Math.min(escritorio ? width - medidas.anchoBarraLateral : width, medidas.anchoContenido);
  const columnas = anchoUtil >= 1000 ? 3 : anchoUtil >= 620 ? 2 : 1;
  const anchoColumna = `${Math.floor(100 / columnas) - 1}%` as `${number}%`;
  const rellenoInferior = escritorio ? espacio.xxxl : medidas.espacioBarra;

  const esMunicipalidad = perfil.rol === 'municipalidad';

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .order('creado_en', { ascending: false });
    setCargando(false);
    setPrimeraCarga(false);
    if (error) {
      avisar('Error', error.message);
      return;
    }
    setReportes(data as Reporte[]);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cambia el estado en la base; si no eres municipalidad, RLS lo rechaza.
  async function cambiarEstado(reporte: Reporte, nuevoEstado: Estado) {
    const { error } = await supabase
      .from('reportes')
      .update({ estado: nuevoEstado })
      .eq('id', reporte.id);
    if (error) {
      avisar('Error', error.message);
      return;
    }
    // Actualizamos la lista local para ver el cambio al instante.
    setReportes((actuales) =>
      actuales.map((r) => (r.id === reporte.id ? { ...r, estado: nuevoEstado } : r))
    );
    // Al resolverlo (o reabrirlo) el reporte cambia de pestaña, así que se avisa.
    if (nuevoEstado === 'resuelto') {
      notificar('El reporte pasó a "Resueltos".');
    } else if (reporte.estado === 'resuelto') {
      notificar('El reporte volvió a "Reportes".');
    }
  }

  // Guarda el mensaje de la municipalidad para el vecino.
  async function responder(reporte: Reporte, texto: string) {
    const { error } = await supabase
      .from('reportes')
      .update({ respuesta: texto === '' ? null : texto })
      .eq('id', reporte.id);
    if (error) {
      avisar('Error', error.message);
      return;
    }
    setReportes((actuales) =>
      actuales.map((r) => (r.id === reporte.id ? { ...r, respuesta: texto === '' ? null : texto } : r))
    );
    notificar('La respuesta fue guardada.');
  }

  // Estados que se muestran en esta pestaña.
  const estadosDeLaPestana: Estado[] = soloResueltos ? ['resuelto'] : ESTADOS_ABIERTOS;

  const filtrados = reportes.filter(
    (r) =>
      estadosDeLaPestana.includes(r.estado) &&
      (!filtroCategoria || r.categoria === filtroCategoria) &&
      (!filtroEstado || r.estado === filtroEstado)
  );

  // La prioridad solo aplica a lo que sigue sin resolverse y solo para la municipalidad.
  const verPrioridad = esMunicipalidad && !soloResueltos;
  if (verPrioridad) {
    filtrados.sort((a, b) => {
      const diferencia = new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime();
      return masAntiguosPrimero ? diferencia : -diferencia;
    });
  }

  const hayFiltros = !!filtroCategoria || !!filtroEstado;

  const encabezado = (
    <View style={estilos.encabezado}>
      <TituloPantalla
        titulo={soloResueltos ? 'Resueltos' : esMunicipalidad ? 'Reportes' : 'Mis reportes'}
        detalle={
          soloResueltos
            ? 'Historial de problemas atendidos'
            : esMunicipalidad
              ? 'Pendientes y en proceso en Jalapa'
              : 'Seguimiento de lo que has reportado'
        }
      />

      {/* Contadores por estado (solo municipalidad) */}
      {esMunicipalidad && (
        <View style={estilos.contadores}>
          {ESTADOS.map((estado) => (
            <View key={estado} style={estilos.contador}>
              <View style={[estilos.anillo, { borderColor: COLOR_ESTADO[estado] }]} />
              <Txt variante="numero">{reportes.filter((r) => r.estado === estado).length}</Txt>
              <Txt variante="pequeno" color={colores.textoSecundario}>
                {etiquetaEstado(estado)}
              </Txt>
            </View>
          ))}
        </View>
      )}

      {/* Filtro por categoría: mosaicos con ícono */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.filtros}
        contentContainerStyle={estilos.filtrosContenido}
      >
        {CATEGORIAS.map((c) => (
          <Mosaico
            key={c}
            categoria={c}
            compacto
            activo={filtroCategoria === c}
            onPress={() => setFiltroCategoria(filtroCategoria === c ? null : c)}
          />
        ))}
      </ScrollView>

      {/* En "Resueltos" no hace falta filtrar por estado: todos están resueltos */}
      {(!soloResueltos || verPrioridad) && (
        <View style={estilos.fila}>
          {!soloResueltos &&
            ESTADOS_ABIERTOS.map((e) => (
              <Opcion
                key={e}
                texto={etiquetaEstado(e)}
                color={COLOR_ESTADO[e]}
                activo={filtroEstado === e}
                onPress={() => setFiltroEstado(filtroEstado === e ? null : e)}
              />
            ))}
          {verPrioridad && (
            <Opcion
              texto={masAntiguosPrimero ? 'Más antiguos primero' : 'Más recientes primero'}
              icono="time-outline"
              activo={masAntiguosPrimero}
              onPress={() => setMasAntiguosPrimero(!masAntiguosPrimero)}
            />
          )}
        </View>
      )}
    </View>
  );

  if (primeraCarga) {
    return (
      <View style={estilos.contenedor}>
        <View style={[estilos.lista, { paddingBottom: rellenoInferior }]}>
          {encabezado}
          <Esqueleto style={estilos.esqueletoTarjeta} />
          <Esqueleto style={estilos.esqueletoTarjeta} />
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        key={columnas}
        numColumns={columnas}
        data={filtrados}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={encabezado}
        columnWrapperStyle={columnas > 1 ? { gap: espacio.lg } : undefined}
        renderItem={({ item, index }) => (
          <Entrada indice={index} style={{ flex: 1, maxWidth: columnas > 1 ? anchoColumna : '100%', marginBottom: espacio.lg }}>
            <ReporteCard
              reporte={item}
              onCambiarEstado={esMunicipalidad ? cambiarEstado : undefined}
              onResponder={esMunicipalidad ? responder : undefined}
            />
          </Entrada>
        )}
        refreshControl={
          <RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={colores.acento} colors={[colores.acento]} progressBackgroundColor={colores.elevada} />
        }
        ListEmptyComponent={
          <EstadoVacio
            icono={hayFiltros ? 'search-outline' : soloResueltos ? 'checkmark-circle-outline' : 'document-text-outline'}
            titulo={hayFiltros ? 'Sin resultados' : soloResueltos ? 'Aún no hay resueltos' : 'Todo en orden'}
            texto={
              hayFiltros
                ? 'Prueba quitando algún filtro para ver más reportes.'
                : soloResueltos
                  ? 'Cuando un problema se atienda, aparecerá aquí.'
                  : esMunicipalidad
                    ? 'No hay reportes pendientes por ahora.'
                    : 'No tienes reportes pendientes. Usa "Nuevo" para reportar un problema.'
            }
          />
        }
        contentContainerStyle={[estilos.lista, { paddingBottom: rellenoInferior }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// Opción de filtro en forma de píldora, con punto de color opcional.
function Opcion({
  texto,
  activo,
  onPress,
  color,
  icono,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
  color?: string;
  icono?: 'time-outline';
}) {
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        estilos.opcion,
        activo && { backgroundColor: color ? conAlpha(color, 0.16) : colores.acentoSuave, borderColor: color ?? colores.acento },
      ]}
    >
      {color && <View style={[estilos.punto, { backgroundColor: color }]} />}
      {icono && <Icono nombre={icono} tamano={16} color={activo ? colores.acento : colores.textoSecundario} />}
      <Txt variante="pequeno" color={activo ? colores.texto : colores.textoSecundario} style={{ fontWeight: activo ? '600' : '500' }}>
        {texto}
      </Txt>
    </Tocable>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  lista: { paddingHorizontal: espacio.xl, paddingBottom: medidas.espacioBarra },
  encabezado: { gap: espacio.lg, paddingTop: espacio.sm, paddingBottom: espacio.xl },
  contadores: { flexDirection: 'row', gap: espacio.md },
  contador: {
    flex: 1,
    gap: 2,
    padding: espacio.md,
    borderRadius: radio.lg,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  anillo: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, marginBottom: espacio.xs },
  filtros: { flexGrow: 0, marginHorizontal: -espacio.xl },
  filtrosContenido: { paddingHorizontal: espacio.xl, gap: espacio.sm },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  opcion: {
    minHeight: medidas.tactil,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espacio.lg,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  punto: { width: 7, height: 7, borderRadius: 4 },
  esqueletoTarjeta: { height: 280, borderRadius: radio.xl, marginBottom: espacio.lg },
});
