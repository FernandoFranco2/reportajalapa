// Tarjeta que muestra un reporte. Si se pasa "onCambiarEstado" (solo la
// municipalidad) aparece el selector de estado, y con "onResponder" el mensaje para el vecino.
import { useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { COLOR_ESTADO, ESTADOS, Estado, RESPUESTA_MAX, Reporte, estaEnJalapa } from '../types';
import { colores, conAlpha, espacio, medidas, radio, sombra } from '../theme';
import { diasDesde, haceCuanto } from '../lib/tiempo';
import { capitalizar, etiquetaEstado } from '../lib/texto';
import { Tocable } from './motion';
import { Boton, Campo, EstadoPill, ICONO_CATEGORIA, Icono, Medallon, NombreIcono, Txt } from './ui';

type Props = {
  reporte: Reporte;
  onCambiarEstado?: (reporte: Reporte, nuevoEstado: Estado) => void;
  // Solo la municipalidad: guarda el mensaje para el vecino.
  onResponder?: (reporte: Reporte, texto: string) => void;
  alturaFoto?: number;
};

// Prioridad por antigüedad (solo municipalidad y solo si no está resuelto):
// 7 días o más = alta, 3 a 6 = media, menos = reciente.
function prioridadDe(dias: number): { texto: string; color: string; icono: NombreIcono } {
  if (dias >= 7) return { texto: 'Prioridad alta', color: colores.prioridad.alta, icono: 'chevron-up-circle-outline' };
  if (dias >= 3) return { texto: 'Prioridad media', color: colores.prioridad.media, icono: 'remove-circle-outline' };
  return { texto: 'Reciente', color: colores.prioridad.reciente, icono: 'sparkles-outline' };
}

export default function ReporteCard({ reporte, onCambiarEstado, onResponder, alturaFoto = 190 }: Props) {
  // Texto que escribe la municipalidad (empieza con la respuesta ya guardada, si hay).
  const [respuesta, setRespuesta] = useState(reporte.respuesta ?? '');

  const abrirEnMapa = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${reporte.lat},${reporte.lng}`);
  const comoLlegar = () =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${reporte.lat},${reporte.lng}`);
  const llamar = () => Linking.openURL(`tel:${reporte.telefono}`);

  const nombre = reporte.categoria === 'Otro' && reporte.titulo ? capitalizar(reporte.titulo) : reporte.categoria;
  const prioridad = prioridadDe(diasDesde(reporte.creado_en));

  return (
    <View style={estilos.tarjeta}>
      <Image
        source={{ uri: reporte.foto_url }}
        style={[estilos.foto, { height: alturaFoto }]}
        accessibilityLabel={`Foto del reporte: ${nombre}`}
      />
      <View style={estilos.cuerpo}>
        <View style={estilos.encabezado}>
          <Medallon nombre={ICONO_CATEGORIA[reporte.categoria]} tamano={40} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variante="subtitulo" numberOfLines={2}>
              {nombre}
            </Txt>
            <View style={estilos.meta}>
              <Icono nombre="time-outline" tamano={14} color={colores.textoTenue} />
              <Txt variante="pequeno" color={colores.textoTenue}>
                {haceCuanto(reporte.creado_en)}
              </Txt>
            </View>
          </View>
          <EstadoPill estado={reporte.estado} />
        </View>

        <Txt variante="cuerpo" color={colores.textoSecundario}>
          {capitalizar(reporte.descripcion)}
        </Txt>

        {reporte.indicaciones && (
          <View style={estilos.linea}>
            <Icono nombre="navigate-outline" tamano={18} color={colores.textoTenue} />
            <Txt variante="pequeno" color={colores.textoSecundario} style={{ flex: 1 }}>
              {capitalizar(reporte.indicaciones)}
            </Txt>
          </View>
        )}

        {!estaEnJalapa(reporte.lat, reporte.lng) && (
          <View style={estilos.linea}>
            <Icono nombre="alert-circle-outline" tamano={18} color={colores.estado['en proceso']} />
            <Txt variante="pequeno" color={colores.estado['en proceso']} style={{ flex: 1 }}>
              Ubicación fuera de la zona de Jalapa
            </Txt>
          </View>
        )}

        {onResponder && reporte.estado !== 'resuelto' && (
          <View style={estilos.linea}>
            <Icono nombre={prioridad.icono} tamano={18} color={prioridad.color} />
            <Txt variante="pequeno" color={prioridad.color} style={{ fontWeight: '600' }}>
              {prioridad.texto}
            </Txt>
          </View>
        )}

        {/* El vecino (y el mapa) ven la respuesta de la municipalidad */}
        {!onResponder && reporte.respuesta && (
          <View style={estilos.respuesta}>
            <Icono nombre="chatbubble-ellipses-outline" tamano={20} color={colores.acento} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variante="pequeno" color={colores.acento} style={{ fontWeight: '600' }}>
                Respuesta de la municipalidad
              </Txt>
              <Txt variante="cuerpo">{capitalizar(reporte.respuesta)}</Txt>
            </View>
          </View>
        )}

        <View style={estilos.acciones}>
          <Accion icono="map-outline" texto="Abrir en Google Maps" onPress={abrirEnMapa} />
          {/* Solo la municipalidad: ruta y teléfono de contacto */}
          {onResponder && <Accion icono="navigate-outline" texto="Cómo llegar" onPress={comoLlegar} />}
          {onResponder && reporte.telefono && <Accion icono="call-outline" texto="Llamar" onPress={llamar} />}
        </View>

        {onResponder && (
          <View style={estilos.contacto}>
            <Txt variante="pequeno" color={colores.textoTenue} selectable>
              {reporte.telefono ? `Teléfono: ${reporte.telefono}` : 'El vecino no dejó teléfono.'}
            </Txt>
            <Txt variante="pequeno" color={colores.textoTenue} selectable>
              Coordenadas: {reporte.lat.toFixed(5)}, {reporte.lng.toFixed(5)}
            </Txt>
          </View>
        )}

        {onCambiarEstado && (
          <View style={estilos.selector} accessibilityRole="radiogroup">
            {ESTADOS.map((estado) => {
              const activo = reporte.estado === estado;
              const color = COLOR_ESTADO[estado];
              return (
                <Tocable
                  key={estado}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activo }}
                  disabled={activo}
                  onPress={() => onCambiarEstado(reporte, estado)}
                  style={[
                    estilos.opcion,
                    activo && { backgroundColor: conAlpha(color, 0.16), borderColor: conAlpha(color, 0.5) },
                  ]}
                >
                  <View style={[estilos.punto, { backgroundColor: color, opacity: activo ? 1 : 0.55 }]} />
                  <Txt
                    variante="pequeno"
                    color={activo ? colores.texto : colores.textoSecundario}
                    style={{ fontWeight: activo ? '600' : '500' }}
                  >
                    {etiquetaEstado(estado)}
                  </Txt>
                </Tocable>
              );
            })}
          </View>
        )}

        {/* Mensaje para el vecino (solo municipalidad) */}
        {onResponder && (
          <View style={{ gap: espacio.sm }}>
            <Campo
              etiqueta="Mensaje para el vecino"
              value={respuesta}
              onChangeText={setRespuesta}
              maxLength={RESPUESTA_MAX}
              autoCapitalize="sentences"
              multiline
              placeholder="Ej: ya enviamos una cuadrilla"
              contador={`${respuesta.length}/${RESPUESTA_MAX}`}
              style={{ minHeight: 56 }}
            />
            <Boton
              texto="Guardar respuesta"
              variante="secundario"
              icono="checkmark-outline"
              onPress={() => onResponder(reporte, capitalizar(respuesta.trim()))}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// Acción secundaria en forma de píldora (mínimo 44 px de alto).
function Accion({ icono, texto, onPress }: { icono: NombreIcono; texto: string; onPress: () => void }) {
  return (
    <Tocable accessibilityRole="link" onPress={onPress} style={estilos.accion}>
      <Icono nombre={icono} tamano={18} color={colores.acento} />
      <Txt variante="pequeno" color={colores.acento} style={{ fontWeight: '600' }}>
        {texto}
      </Txt>
    </Tocable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colores.borde,
    overflow: 'hidden',
    ...sombra.suave,
  },
  foto: { width: '100%', backgroundColor: colores.elevada },
  cuerpo: { padding: espacio.lg, gap: espacio.md },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linea: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  respuesta: {
    flexDirection: 'row',
    gap: espacio.md,
    padding: espacio.md,
    borderRadius: radio.md,
    backgroundColor: colores.elevada,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  accion: {
    minHeight: medidas.tactil,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espacio.lg,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.elevada,
  },
  contacto: { gap: 2 },
  selector: { flexDirection: 'row', gap: espacio.sm },
  opcion: {
    flex: 1,
    minHeight: medidas.tactil,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: espacio.sm,
    borderRadius: radio.md,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.elevada,
  },
  punto: { width: 7, height: 7, borderRadius: 4 },
});
