// Mapa con un marcador por reporte, coloreado según su estado.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import HojaReporte from '../components/HojaReporte';
import LeyendaEstados from '../components/LeyendaEstados';
import { Esqueleto } from '../components/motion';
import { TituloPantalla } from '../components/ui';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/aviso';
import { ESTILO_MAPA_OSCURO } from '../lib/estiloMapaOscuro';
import { CENTRO_JALAPA, COLOR_ESTADO, Reporte } from '../types';
import { colores, espacio, radio } from '../theme';

export default function MapaScreen() {
  const [reportes, setReportes] = useState<Reporte[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<Reporte | null>(null);
  // Los marcadores personalizados se dibujan una vez y luego se deja de rastrearlos (mejor rendimiento).
  const [rastrear, setRastrear] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase.from('reportes').select('*');
      if (error) {
        avisar('Error', error.message);
        setReportes([]);
        return;
      }
      setReportes(data as Reporte[]);
    }
    cargar();
  }, []);

  useEffect(() => {
    setRastrear(true);
    const t = setTimeout(() => setRastrear(false), 700);
    return () => clearTimeout(t);
  }, [reportes, seleccionado]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <TituloPantalla titulo="Mapa" detalle="Toca un punto para ver el reporte." />
        <LeyendaEstados />
      </View>

      <View style={estilos.marco}>
        {reportes === null ? (
          <Esqueleto style={StyleSheet.absoluteFill} />
        ) : (
          <MapView
            style={StyleSheet.absoluteFill}
            userInterfaceStyle="dark"
            customMapStyle={ESTILO_MAPA_OSCURO}
            initialRegion={{
              latitude: CENTRO_JALAPA.lat,
              longitude: CENTRO_JALAPA.lng,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            onPress={() => setSeleccionado(null)}
          >
            {reportes.map((r) => {
              const activo = seleccionado?.id === r.id;
              return (
                <Marker
                  key={r.id}
                  coordinate={{ latitude: r.lat, longitude: r.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={rastrear}
                  onPress={() => setSeleccionado(r)}
                >
                  <View style={[estilos.halo, activo && estilos.haloActivo]}>
                    <View style={[estilos.punto, { backgroundColor: COLOR_ESTADO[r.estado] }]} />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}
        <HojaReporte reporte={seleccionado} alCerrar={() => setSeleccionado(null)} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  cabecera: { paddingHorizontal: espacio.xl, paddingTop: espacio.sm, paddingBottom: espacio.lg, gap: espacio.md },
  // El mapa llega hasta abajo, por detrás de la barra flotante.
  marco: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: radio.xl,
    borderTopRightRadius: radio.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  halo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,20,27,0.55)',
  },
  haloActivo: { backgroundColor: 'rgba(230,237,244,0.28)', transform: [{ scale: 1.2 }] },
  punto: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colores.fondo },
});
