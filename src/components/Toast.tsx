// Aviso breve que aparece sobre la barra de pestañas y se retira solo.
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { registrarToast } from '../lib/aviso';
import { useEsEscritorio } from '../lib/pantalla';
import { colores, espacio, medidas, movimiento, radio, sombra } from '../theme';
import { NATIVO, useReducirMovimiento } from './motion';
import { Icono, Txt } from './ui';

export default function ToastHost() {
  const [texto, setTexto] = useState<string | null>(null);
  const escritorio = useEsEscritorio();
  const reducir = useReducirMovimiento();
  const progreso = useRef(new Animated.Value(0)).current;
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    registrarToast((mensaje) => {
      if (temporizador.current) clearTimeout(temporizador.current);
      setTexto(mensaje);
      Animated.timing(progreso, {
        toValue: 1,
        duration: movimiento.normal,
        easing: movimiento.salida,
        useNativeDriver: NATIVO,
      }).start();
      temporizador.current = setTimeout(() => {
        Animated.timing(progreso, {
          toValue: 0,
          duration: movimiento.normal,
          easing: movimiento.salida,
          useNativeDriver: NATIVO,
        }).start(() => setTexto(null));
      }, 2600);
    });
    return () => {
      registrarToast(null);
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [progreso]);

  if (!texto) return null;

  return (
    // En pantalla ancha no hay barra inferior, así que el aviso queda más cerca del borde.
    <View pointerEvents="none" style={[estilos.zona, escritorio && { bottom: espacio.xxl }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          estilos.toast,
          {
            opacity: progreso,
            transform: reducir
              ? []
              : [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [movimiento.desplazamiento, 0] }) }],
          },
        ]}
      >
        <Icono nombre="checkmark-circle-outline" tamano={20} color={colores.estado.resuelto} />
        <Txt variante="cuerpoMedio">{texto}</Txt>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  zona: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: medidas.barraAltura + medidas.barraMargen * 2 + espacio.md,
    alignItems: 'center',
    paddingHorizontal: espacio.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    paddingHorizontal: espacio.lg,
    paddingVertical: espacio.md,
    borderRadius: radio.pildora,
    backgroundColor: colores.elevada,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra.flotante,
  },
});
