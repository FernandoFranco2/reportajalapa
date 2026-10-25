// Fila con las categorías que se pueden reportar: una se ilumina cada pocos segundos
// y su nombre aparece debajo con un desvanecimiento.
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CATEGORIAS, Categoria } from '../types';
import { colores, espacio, movimiento } from '../theme';
import { Entrada, useReducirMovimiento } from './motion';
import { ICONO_CATEGORIA, Icono, Txt } from './ui';

const CADA_MS = 2000;

export default function CategoriasRotativas() {
  const reducir = useReducirMovimiento();
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    if (reducir) return;
    const t = setInterval(() => setActiva((i) => (i + 1) % CATEGORIAS.length), CADA_MS);
    return () => clearInterval(t);
  }, [reducir]);

  return (
    <View style={estilos.contenedor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={estilos.fila}>
        {CATEGORIAS.map((c, i) => (
          <Punto key={c} categoria={c} encendido={i === activa} />
        ))}
      </View>
      <View style={estilos.etiqueta}>
        <Entrada key={activa} indice={0}>
          <Txt variante="cuerpoMedio" color={colores.textoSecundario}>
            {CATEGORIAS[activa]}
          </Txt>
        </Entrada>
      </View>
    </View>
  );
}

function Punto({ categoria, encendido }: { categoria: Categoria; encendido: boolean }) {
  const valor = useRef(new Animated.Value(encendido ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(valor, {
      toValue: encendido ? 1 : 0,
      duration: movimiento.lento,
      easing: movimiento.salida,
      useNativeDriver: false, // el color de fondo no admite driver nativo
    }).start();
  }, [encendido, valor]);

  return (
    <Animated.View
      style={[
        estilos.punto,
        {
          backgroundColor: valor.interpolate({ inputRange: [0, 1], outputRange: ['rgba(127,167,201,0)', colores.acentoSuave] }),
          transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
        },
      ]}
    >
      <Icono nombre={ICONO_CATEGORIA[categoria]} tamano={18} color={encendido ? colores.acento : colores.textoTenue} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', gap: espacio.sm },
  fila: { flexDirection: 'row', justifyContent: 'center', gap: 2 },
  // 9 puntos de 32 px caben en una sola fila incluso en teléfonos de 360 px de ancho.
  punto: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { minHeight: 22, justifyContent: 'center' },
});
