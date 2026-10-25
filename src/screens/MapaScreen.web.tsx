// Versión WEB del mapa. react-native-maps no funciona en navegador, así que
// aquí se usa Leaflet + OpenStreetMap (gratis, sin clave) dentro de un iframe.
// Metro elige este archivo automáticamente en web por llevar ".web" en el nombre.
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import HojaReporte from '../components/HojaReporte';
import LeyendaEstados from '../components/LeyendaEstados';
import { Esqueleto } from '../components/motion';
import { TituloPantalla } from '../components/ui';
import { supabase } from '../lib/supabase';
import { avisar } from '../lib/aviso';
import { useEsEscritorio } from '../lib/pantalla';
import { CENTRO_JALAPA, COLOR_ESTADO, Reporte } from '../types';
import { colores, espacio, radio } from '../theme';

// Arma la página HTML del mapa con un círculo de color por cada reporte.
// Las teselas de OpenStreetMap se oscurecen con un filtro CSS para que combinen con la app.
function crearHtml(reportes: Reporte[]): string {
  // Solo se pasan id, coordenadas y color (nunca texto del usuario) para no inyectar HTML.
  const puntos = reportes.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, color: COLOR_ESTADO[r.estado] }));
  return `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  html,body,#mapa{height:100%;margin:0;background:${colores.superficie}}
  .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.8) contrast(.9) saturate(.35)}
  /* Velo frío para igualar el mapa con la paleta pizarra de la app */
  #mapa::after{content:"";position:absolute;inset:0;z-index:450;pointer-events:none;background:rgba(21,29,38,.42)}
  .leaflet-container{background:${colores.superficie};font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif}
  .leaflet-bar{border:1px solid ${colores.borde}!important;box-shadow:none!important;border-radius:14px!important;overflow:hidden}
  .leaflet-bar a{background:${colores.elevada}!important;color:${colores.texto}!important;border-bottom:1px solid ${colores.borde}!important;width:36px!important;height:36px!important;line-height:36px!important}
  .leaflet-bar a:last-child{border-bottom:none!important}
  .leaflet-control-attribution{background:rgba(14,20,27,.7)!important;color:${colores.textoTenue}!important}
  .leaflet-control-attribution a{color:${colores.textoSecundario}!important}
  .leaflet-interactive{outline:none}
</style></head><body>
<div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var mapa = L.map('mapa').setView([${CENTRO_JALAPA.lat}, ${CENTRO_JALAPA.lng}], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(mapa);
  var puntos = ${JSON.stringify(puntos)};
  var marcadores = {};
  puntos.forEach(function (p) {
    marcadores[p.id] = L.circleMarker([p.lat, p.lng], { radius: 9, color: '${colores.fondo}', weight: 3, fillColor: p.color, fillOpacity: 1 })
      .addTo(mapa)
      .on('click', function (e) { L.DomEvent.stopPropagation(e); parent.postMessage({ reporteId: p.id }, '*'); });
  });
  mapa.on('click', function () { parent.postMessage({ reporteId: null }, '*'); });
  // El padre avisa cuál reporte está abierto para resaltarlo.
  window.addEventListener('message', function (e) {
    if (!e.data || !('seleccion' in e.data)) return;
    Object.keys(marcadores).forEach(function (id) {
      marcadores[id].setStyle({ radius: id === e.data.seleccion ? 13 : 9 });
    });
  });
</script></body></html>`;
}

export default function MapaScreen() {
  const [reportes, setReportes] = useState<Reporte[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<Reporte | null>(null);
  const marco = useRef<HTMLIFrameElement>(null);
  const escritorio = useEsEscritorio();

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

  // El iframe avisa con postMessage cuál marcador se tocó.
  useEffect(() => {
    function alRecibir(evento: MessageEvent) {
      if (!evento.data || !('reporteId' in evento.data)) return;
      const encontrado = (reportes ?? []).find((r) => r.id === evento.data.reporteId);
      setSeleccionado(encontrado ?? null);
    }
    window.addEventListener('message', alRecibir);
    return () => window.removeEventListener('message', alRecibir);
  }, [reportes]);

  // Resalta en el mapa el marcador abierto.
  useEffect(() => {
    marco.current?.contentWindow?.postMessage({ seleccion: seleccionado?.id ?? null }, '*');
  }, [seleccionado]);

  const html = useMemo(() => crearHtml(reportes ?? []), [reportes]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <TituloPantalla titulo="Mapa" detalle="Toca un punto para ver el reporte." />
        <LeyendaEstados />
      </View>

      {/* En pantalla ancha el mapa es un panel con margen y esquinas redondeadas en todos los lados */}
      <View style={[estilos.marco, escritorio && estilos.marcoAncho]}>
        {reportes === null ? (
          <Esqueleto style={StyleSheet.absoluteFill} />
        ) : (
          <iframe
            ref={marco}
            title="Mapa de reportes"
            srcDoc={html}
            style={{ border: 'none', width: '100%', height: '100%', colorScheme: 'dark' }}
          />
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
  marcoAncho: {
    marginHorizontal: espacio.xl,
    marginBottom: espacio.xl,
    borderRadius: radio.xl,
    borderBottomWidth: 1,
  },
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
});
