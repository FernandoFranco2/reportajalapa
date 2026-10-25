// Barra lateral para pantallas anchas: reemplaza a la barra flotante del teléfono.
// El resaltado de la pestaña activa se desliza de una a otra.
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, espacio, medidas, movimiento, radio } from '../theme';
import { Pestana } from './BarraPestanas';
import { NATIVO, Tocable, useReducirMovimiento } from './motion';
import MarcaJ from './MarcaJ';
import { BotonIcono, Icono, Medallon, Txt } from './ui';

const ALTO_ITEM = 48;
const SEPARACION = espacio.xs;

export default function BarraLateral<T extends string>({
  pestanas,
  activa,
  onCambiar,
  nombre,
  rol,
  onSalir,
}: {
  pestanas: Pestana<T>[];
  activa: T;
  onCambiar: (clave: T) => void;
  nombre: string;
  rol: string;
  onSalir: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reducir = useReducirMovimiento();
  const indice = Math.max(0, pestanas.findIndex((p) => p.clave === activa));
  const posicion = useRef(new Animated.Value(indice * (ALTO_ITEM + SEPARACION))).current;
  const colocado = useRef(false);

  // El resaltado se desliza hasta la pestaña activa; la primera vez se coloca sin animar.
  useEffect(() => {
    const destino = indice * (ALTO_ITEM + SEPARACION);
    if (!colocado.current || reducir) {
      posicion.setValue(destino);
      colocado.current = true;
      return;
    }
    Animated.timing(posicion, {
      toValue: destino,
      duration: movimiento.normal,
      easing: movimiento.salida,
      useNativeDriver: NATIVO,
    }).start();
  }, [indice, reducir, posicion]);

  return (
    <View
      style={[estilos.barra, { paddingTop: insets.top + espacio.xxl, paddingBottom: insets.bottom + espacio.lg }]}
      accessibilityRole="tablist"
    >
      {/* Marca */}
      <View style={estilos.marca}>
        <MarcaJ tamano={32} />
        <Txt variante="subtitulo">ReportaJalapa</Txt>
      </View>

      {/* Navegación */}
      <View style={estilos.lista}>
        <Animated.View pointerEvents="none" style={[estilos.resaltado, { transform: [{ translateY: posicion }] }]} />
        {pestanas.map((p) => (
          <Elemento key={p.clave} pestana={p} seleccionada={p.clave === activa} onPress={() => onCambiar(p.clave)} />
        ))}
      </View>

      {/* Usuario y salir */}
      <View style={estilos.usuario}>
        <Medallon nombre="person-outline" tamano={36} fondo={colores.elevada} color={colores.textoSecundario} />
        <View style={{ flex: 1 }}>
          <Txt variante="cuerpoMedio" numberOfLines={1}>
            {nombre}
          </Txt>
          <Txt variante="pequeno" color={colores.textoTenue}>
            {rol}
          </Txt>
        </View>
        <BotonIcono nombre="log-out-outline" etiqueta="Cerrar sesión" onPress={onSalir} />
      </View>
    </View>
  );
}

// Un elemento de la barra: cambia de fondo al pasar el cursor (solo web) y se reduce al presionar.
function Elemento<T extends string>({
  pestana,
  seleccionada,
  onPress,
}: {
  pestana: Pestana<T>;
  seleccionada: boolean;
  onPress: () => void;
}) {
  const [encima, setEncima] = useState(false);
  const color = seleccionada ? colores.acento : colores.textoSecundario;
  return (
    <Tocable
      accessibilityRole="tab"
      accessibilityLabel={pestana.texto}
      accessibilityState={{ selected: seleccionada }}
      onPress={onPress}
      onHoverIn={() => setEncima(true)}
      onHoverOut={() => setEncima(false)}
      style={[estilos.item, !seleccionada && encima && { backgroundColor: colores.elevada }]}
    >
      <Icono nombre={pestana.icono} tamano={22} color={color} />
      <Txt variante="cuerpoMedio" color={seleccionada ? colores.texto : colores.textoSecundario} style={{ fontWeight: seleccionada ? '600' : '500' }}>
        {pestana.texto}
      </Txt>
    </Tocable>
  );
}

const estilos = StyleSheet.create({
  barra: {
    width: medidas.anchoBarraLateral,
    paddingHorizontal: espacio.lg,
    backgroundColor: colores.superficie,
    borderRightWidth: 1,
    borderRightColor: colores.borde,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.md, paddingHorizontal: espacio.sm },
  lista: { flex: 1, gap: SEPARACION, marginTop: espacio.xxxl },
  resaltado: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ALTO_ITEM,
    borderRadius: radio.md,
    backgroundColor: colores.acentoSuave,
  },
  item: {
    minHeight: ALTO_ITEM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingHorizontal: espacio.md,
    borderRadius: radio.md,
  },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    paddingTop: espacio.lg,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
});
