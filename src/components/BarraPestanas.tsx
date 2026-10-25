// Barra de pestañas flotante en forma de píldora. El círculo de acento se desliza hasta la pestaña activa.
import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, espacio, medidas, movimiento, radio, sombra } from '../theme';
import { NATIVO, Tocable, useReducirMovimiento } from './motion';
import { Icono, NombreIcono, Txt } from './ui';

export type Pestana<T extends string> = { clave: T; texto: string; icono: NombreIcono };

const CIRCULO = 40;
const RELLENO = 6;

export default function BarraPestanas<T extends string>({
  pestanas,
  activa,
  onCambiar,
}: {
  pestanas: Pestana<T>[];
  activa: T;
  onCambiar: (clave: T) => void;
}) {
  const insets = useSafeAreaInsets();
  const reducir = useReducirMovimiento();
  const [ancho, setAncho] = useState(0);
  const posicion = useRef(new Animated.Value(0)).current;
  const colocado = useRef(false);

  const indice = Math.max(0, pestanas.findIndex((p) => p.clave === activa));
  const anchoPestana = ancho > 0 ? (ancho - 2 - RELLENO * 2) / pestanas.length : 0;
  const destino = anchoPestana * indice + (anchoPestana - CIRCULO) / 2;

  // El círculo se desliza; la primera vez se coloca sin animar.
  useEffect(() => {
    if (anchoPestana === 0) return;
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
  }, [destino, anchoPestana, posicion, reducir]);

  return (
    <View
      pointerEvents="box-none"
      style={[estilos.zona, { paddingBottom: Math.max(insets.bottom, 0) + medidas.barraMargen }]}
    >
      <View
        style={estilos.barra}
        onLayout={(e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width)}
        accessibilityRole="tablist"
      >
        {anchoPestana > 0 && <Animated.View style={[estilos.circulo, { transform: [{ translateX: posicion }] }]} />}
        {pestanas.map((p) => {
          const seleccionada = p.clave === activa;
          const color = seleccionada ? colores.acento : colores.textoSecundario;
          return (
            <Tocable
              key={p.clave}
              accessibilityRole="tab"
              accessibilityLabel={p.texto}
              accessibilityState={{ selected: seleccionada }}
              onPress={() => onCambiar(p.clave)}
              style={estilos.pestana}
            >
              <IconoPestana nombre={p.icono} color={color} seleccionada={seleccionada} />
              <Txt variante="pequeno" color={color} style={{ fontSize: 11, lineHeight: 14, fontWeight: seleccionada ? '600' : '500' }}>
                {p.texto}
              </Txt>
            </Tocable>
          );
        })}
      </View>
    </View>
  );
}

// Ícono que "respira" al quedar seleccionado: crece un poco desde un tamaño menor, sin rebote.
function IconoPestana({ nombre, color, seleccionada }: { nombre: NombreIcono; color: string; seleccionada: boolean }) {
  const reducir = useReducirMovimiento();
  const escala = useRef(new Animated.Value(1)).current;
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (!seleccionada || reducir) return;
    escala.setValue(0.8);
    Animated.timing(escala, {
      toValue: 1,
      duration: movimiento.normal,
      easing: movimiento.salida,
      useNativeDriver: NATIVO,
    }).start();
  }, [seleccionada, reducir, escala]);

  return (
    <Animated.View style={[estilos.icono, { transform: [{ scale: escala }] }]}>
      <Icono nombre={nombre} tamano={22} color={color} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  zona: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: espacio.lg,
  },
  barra: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    height: medidas.barraAltura,
    padding: RELLENO,
    borderRadius: radio.pildora,
    backgroundColor: colores.elevada,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra.flotante,
  },
  circulo: {
    position: 'absolute',
    top: RELLENO + 2,
    left: RELLENO,
    width: CIRCULO,
    height: CIRCULO,
    borderRadius: CIRCULO / 2,
    backgroundColor: colores.acentoSuave,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    minHeight: medidas.tactil,
  },
  icono: { width: CIRCULO, height: CIRCULO, alignItems: 'center', justifyContent: 'center' },
});
