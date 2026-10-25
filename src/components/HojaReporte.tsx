// Hoja inferior con la tarjeta del reporte: sube con suavidad al tocar un marcador del mapa.
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Reporte } from '../types';
import { useEsEscritorio } from '../lib/pantalla';
import { colores, espacio, medidas, movimiento } from '../theme';
import ReporteCard from './ReporteCard';
import { NATIVO, useReducirMovimiento } from './motion';
import { BotonIcono } from './ui';

export default function HojaReporte({ reporte, alCerrar }: { reporte: Reporte | null; alCerrar: () => void }) {
  const reducir = useReducirMovimiento();
  const escritorio = useEsEscritorio();
  const progreso = useRef(new Animated.Value(0)).current;
  // Se conserva el último reporte para poder animar la salida antes de desmontar.
  const [mostrado, setMostrado] = useState<Reporte | null>(reporte);

  useEffect(() => {
    if (reporte) {
      setMostrado(reporte);
      Animated.timing(progreso, {
        toValue: 1,
        duration: movimiento.lento,
        easing: movimiento.salida,
        useNativeDriver: NATIVO,
      }).start();
    } else {
      Animated.timing(progreso, {
        toValue: 0,
        duration: movimiento.rapido,
        easing: movimiento.salida,
        useNativeDriver: NATIVO,
      }).start(({ finished }) => finished && setMostrado(null));
    }
  }, [reporte, progreso]);

  if (!mostrado) return null;

  return (
    // En pantalla ancha no hay barra flotante, así que la hoja baja hasta el margen.
    <View pointerEvents="box-none" style={[estilos.zona, escritorio && { bottom: espacio.xxl }]}>
      <Animated.View
        style={[
          estilos.hoja,
          {
            opacity: progreso,
            transform: reducir
              ? []
              : [{ translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ borderRadius: 22 }}>
          <ReporteCard reporte={mostrado} alturaFoto={150} />
        </ScrollView>
        <View style={estilos.cerrar}>
          <BotonIcono nombre="close-outline" etiqueta="Cerrar" color={colores.texto} onPress={alCerrar} />
        </View>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Queda por encima de la barra de pestañas flotante.
  zona: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: medidas.barraAltura + medidas.barraMargen * 2 + espacio.sm,
    alignItems: 'center',
    paddingHorizontal: espacio.lg,
  },
  hoja: { width: '100%', maxWidth: 520, maxHeight: 420 },
  cerrar: {
    position: 'absolute',
    top: espacio.sm,
    right: espacio.sm,
    borderRadius: medidas.tactil / 2,
    backgroundColor: 'rgba(14,20,27,0.7)',
  },
});
