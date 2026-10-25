// Movimiento compartido: entrada escalonada, presión con escala sutil y esqueleto.
// Todo usa Animated de React Native, sin librerías, y respeta "reducir movimiento".
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colores, movimiento, radio } from '../theme';

// En web Animated no tiene driver nativo.
export const NATIVO = Platform.OS !== 'web';

// true si el sistema pide reducir el movimiento.
export function useReducirMovimiento(): boolean {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => vivo && setReducir(v));
    const escucha = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducir);
    return () => {
      vivo = false;
      escucha.remove();
    };
  }, []);
  return reducir;
}

// Aparece con desvanecimiento y un desplazamiento vertical mínimo; "indice" escalona la entrada.
export function Entrada({
  children,
  indice = 0,
  style,
}: {
  children: ReactNode;
  indice?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reducir = useReducirMovimiento();
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: 1,
      duration: reducir ? movimiento.rapido : movimiento.lento,
      delay: reducir ? 0 : Math.min(indice, 8) * 50,
      easing: movimiento.salida,
      useNativeDriver: NATIVO,
    }).start();
  }, [progreso, indice, reducir]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progreso,
          transform: reducir
            ? []
            : [
                {
                  translateY: progreso.interpolate({
                    inputRange: [0, 1],
                    outputRange: [movimiento.desplazamiento, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const CLAVES_EXTERIORES = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'width', 'maxWidth', 'minWidth', 'alignSelf',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
]);

function separarEstilo(style: StyleProp<ViewStyle>) {
  const plano = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const exterior: Record<string, unknown> = {};
  const interior: Record<string, unknown> = {};
  for (const clave of Object.keys(plano)) {
    (CLAVES_EXTERIORES.has(clave) ? exterior : interior)[clave] = plano[clave];
  }
  return { exterior: exterior as ViewStyle, interior: interior as ViewStyle };
}

// Botón o tarjeta táctil: al presionar se reduce un poco y se atenúa.
export function Tocable({
  children,
  style,
  ...resto
}: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducir = useReducirMovimiento();
  const valor = useRef(new Animated.Value(0)).current;

  // Baja rápido al tocar y vuelve un poco más despacio al soltar.
  function animar(hacia: number) {
    Animated.timing(valor, {
      toValue: hacia,
      duration: hacia === 1 ? 90 : movimiento.rapido,
      easing: movimiento.salida,
      useNativeDriver: NATIVO,
    }).start();
  }

  // El tamaño y la posición dentro del padre los lleva el Pressable; el aspecto, la vista animada.
  const { exterior, interior } = separarEstilo(style);

  return (
    <Pressable
      {...resto}
      style={exterior}
      onPressIn={(e) => {
        animar(1);
        resto.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animar(0);
        resto.onPressOut?.(e);
      }}
    >
      <Animated.View
        style={[
          interior,
          // Rellena todo el alto del Pressable: así dos botones en una misma fila
          // miden lo mismo aunque el texto de uno ocupe dos líneas.
          { flexGrow: 1 },
          {
            opacity: valor.interpolate({ inputRange: [0, 1], outputRange: [1, movimiento.opacidadPresionado] }),
            transform: reducir
              ? []
              : [
                  {
                    scale: valor.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, movimiento.escalaPresionado],
                    }),
                  },
                ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Al cambiar de pestaña el contenido entra deslizándose desde el lado hacia el que se avanza.
export function CambioPestana({
  clave,
  indice,
  children,
}: {
  clave: string;
  indice: number;
  children: ReactNode;
}) {
  const reducir = useReducirMovimiento();
  const progreso = useRef(new Animated.Value(1)).current;
  const anterior = useRef({ clave, indice });
  const direccion = useRef(1);
  const hayCambio = useRef(false);

  // Si la pestaña cambió, el nuevo contenido parte invisible y a un lado.
  if (anterior.current.clave !== clave) {
    direccion.current = indice >= anterior.current.indice ? 1 : -1;
    anterior.current = { clave, indice };
    progreso.setValue(0);
    hayCambio.current = true;
  }
  useEffect(() => {
    if (!hayCambio.current) return;
    hayCambio.current = false;
    Animated.timing(progreso, {
      toValue: 1,
      duration: reducir ? movimiento.rapido : movimiento.lento,
      easing: movimiento.salida,
      useNativeDriver: NATIVO,
    }).start();
  });

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: progreso,
        transform: reducir
          ? []
          : [
              {
                translateX: progreso.interpolate({
                  inputRange: [0, 1],
                  outputRange: [direccion.current * movimiento.cambioPestana, 0],
                }),
              },
            ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Marcador de posición con un brillo suave mientras carga el contenido.
export function Esqueleto({ style }: { style?: StyleProp<ViewStyle> }) {
  const reducir = useReducirMovimiento();
  const brillo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducir) return;
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(brillo, { toValue: 1, duration: 1100, easing: movimiento.salida, useNativeDriver: NATIVO }),
        Animated.timing(brillo, { toValue: 0, duration: 1100, easing: movimiento.salida, useNativeDriver: NATIVO }),
      ])
    );
    bucle.start();
    return () => bucle.stop();
  }, [brillo, reducir]);

  return (
    <Animated.View
      style={[
        { backgroundColor: colores.elevada, borderRadius: radio.md },
        style,
        { opacity: reducir ? 0.7 : brillo.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }) },
      ]}
    />
  );
}
