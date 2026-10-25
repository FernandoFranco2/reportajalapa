// Marca de ReportaJalapa: un pin de ubicación con una J en su interior.
// Con "animada" el trazo se dibuja, la J aparece, el pin flota con suavidad y una onda se
// expande en el suelo como un aviso de ubicación. Sin "animada" es un dibujo fijo.
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { colores, movimiento } from '../theme';
import { NATIVO, useReducirMovimiento } from './motion';

const AnimadoPath = Animated.createAnimatedComponent(Path);
const AnimadoElipse = Animated.createAnimatedComponent(Ellipse);

// Contorno del pin y trazo de la J (viewBox 64 x 72).
const PIN = 'M32 60 C32 60 12 42 12 26 A20 20 0 0 1 52 26 C52 42 32 60 32 60 Z';
const J = 'M30.5 17 H41 M36 17 V28 C36 32.6 33.2 35.2 29.2 35.2 C27.6 35.2 26.3 34.8 25 33.9';
const LARGO_PIN = 150;
const LARGO_J = 52;

export default function MarcaJ({ tamano = 64, animada = false }: { tamano?: number; animada?: boolean }) {
  const reducir = useReducirMovimiento();
  const vivo = animada && !reducir;

  const trazoPin = useRef(new Animated.Value(vivo ? LARGO_PIN : 0)).current;
  const trazoJ = useRef(new Animated.Value(vivo ? LARGO_J : 0)).current;
  const relleno = useRef(new Animated.Value(vivo ? 0 : 1)).current;
  const flota = useRef(new Animated.Value(0)).current;
  const onda = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!vivo) {
      trazoPin.setValue(0);
      trazoJ.setValue(0);
      relleno.setValue(1);
      return;
    }
    const salida = movimiento.salida;
    Animated.sequence([
      Animated.timing(trazoPin, { toValue: 0, duration: 900, easing: salida, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(trazoJ, { toValue: 0, duration: 550, easing: salida, useNativeDriver: false }),
        Animated.timing(relleno, { toValue: 1, duration: 600, easing: salida, useNativeDriver: false }),
      ]),
    ]).start();

    // Flotación lenta y onda en el suelo, en bucle.
    const sube = Animated.loop(
      Animated.sequence([
        Animated.timing(flota, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
        Animated.timing(flota, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
      ])
    );
    const ping = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(onda, { toValue: 1, duration: 1900, easing: salida, useNativeDriver: false }),
        Animated.delay(500),
        Animated.timing(onda, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    sube.start();
    ping.start();
    return () => {
      sube.stop();
      ping.stop();
    };
  }, [vivo, trazoPin, trazoJ, relleno, flota, onda]);

  const alto = (tamano * 72) / 64;
  return (
    <View style={{ width: tamano, height: alto }}>
      <Animated.View
        style={{
          transform: [{ translateY: flota.interpolate({ inputRange: [0, 1], outputRange: [0, vivo ? -3 : 0] }) }],
        }}
      >
        <Svg width={tamano} height={alto} viewBox="0 0 64 72">
          {vivo && (
            <AnimadoElipse
              cx={32}
              cy={64}
              rx={onda.interpolate({ inputRange: [0, 1], outputRange: [5, 26] })}
              ry={onda.interpolate({ inputRange: [0, 1], outputRange: [1.8, 7] })}
              fill="none"
              stroke={colores.acento}
              strokeWidth={1.5}
              strokeOpacity={onda.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] })}
            />
          )}
          <AnimadoPath
            d={PIN}
            fill={colores.acento}
            fillOpacity={relleno.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] })}
            stroke={colores.acento}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={`${LARGO_PIN} ${LARGO_PIN}`}
            strokeDashoffset={trazoPin}
          />
          <AnimadoPath
            d={J}
            fill="none"
            stroke={colores.texto}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={`${LARGO_J} ${LARGO_J}`}
            strokeDashoffset={trazoJ}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
