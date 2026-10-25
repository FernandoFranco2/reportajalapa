// Piezas de interfaz reutilizables. Todo el estilo viene de theme.ts.
import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Categoria, Estado } from '../types';
import { FUENTE, VarianteTipo, colores, conAlpha, espacio, medidas, movimiento, radio, tipo } from '../theme';
import { etiquetaEstado } from '../lib/texto';
import { Tocable } from './motion';

export type NombreIcono = ComponentProps<typeof Ionicons>['name'];

// ---------- Texto ----------
export function Txt({
  variante = 'cuerpo',
  color = colores.texto,
  style,
  ...resto
}: TextProps & { variante?: VarianteTipo; color?: string }) {
  return <Text {...resto} style={[FUENTE, tipo[variante] as TextStyle, { color }, style]} />;
}

// ---------- Íconos (línea fina, mismo trazo en toda la app) ----------
export function Icono({
  nombre,
  tamano = 22,
  color = colores.textoSecundario,
}: {
  nombre: NombreIcono;
  tamano?: number;
  color?: string;
}) {
  return <Ionicons name={nombre} size={tamano} color={color} />;
}

export const ICONO_CATEGORIA: Record<Categoria, NombreIcono> = {
  Baches: 'warning-outline',
  Basura: 'trash-outline',
  Alumbrado: 'bulb-outline',
  'Fugas de agua': 'water-outline',
  'Drenaje tapado': 'funnel-outline',
  'Árbol caído': 'leaf-outline',
  Animales: 'paw-outline',
  Inseguridad: 'shield-outline',
  Otro: 'ellipsis-horizontal-circle-outline',
};

// Icono dentro de un círculo suave.
export function Medallon({
  nombre,
  tamano = 44,
  color = colores.acento,
  fondo = colores.acentoSuave,
}: {
  nombre: NombreIcono;
  tamano?: number;
  color?: string;
  fondo?: string;
}) {
  return (
    <View
      style={{
        width: tamano,
        height: tamano,
        borderRadius: tamano / 2,
        backgroundColor: fondo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icono nombre={nombre} tamano={Math.round(tamano * 0.5)} color={color} />
    </View>
  );
}

// ---------- Botones ----------
type VarianteBoton = 'primario' | 'secundario' | 'fantasma';

export function Boton({
  texto,
  onPress,
  icono,
  variante = 'primario',
  cargando = false,
  deshabilitado = false,
  style,
}: {
  texto: string;
  onPress: () => void;
  icono?: NombreIcono;
  variante?: VarianteBoton;
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colorTexto = variante === 'primario' ? colores.sobreAcento : variante === 'fantasma' ? colores.acento : colores.texto;
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado || cargando }}
      disabled={deshabilitado || cargando}
      onPress={onPress}
      style={[
        estilos.boton,
        variante === 'primario' && { backgroundColor: colores.acento },
        variante === 'secundario' && { backgroundColor: colores.elevada, borderWidth: 1, borderColor: colores.borde },
        variante === 'fantasma' && { backgroundColor: 'transparent' },
        (deshabilitado || cargando) && { opacity: 0.55 },
        style,
      ]}
    >
      {icono && <Icono nombre={icono} tamano={20} color={colorTexto} />}
      <Txt variante="cuerpoMedio" color={colorTexto} style={{ fontWeight: '600' }}>
        {cargando ? 'Espera…' : texto}
      </Txt>
    </Tocable>
  );
}

// Botón redondo solo con ícono (área táctil de 44 px).
export function BotonIcono({
  nombre,
  onPress,
  etiqueta,
  color = colores.textoSecundario,
}: {
  nombre: NombreIcono;
  onPress: () => void;
  etiqueta: string;
  color?: string;
}) {
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={estilos.botonIcono}
    >
      <Icono nombre={nombre} tamano={22} color={color} />
    </Tocable>
  );
}

// ---------- Campo de texto ----------
export function Campo({
  etiqueta,
  error,
  icono,
  contador,
  style,
  ...resto
}: TextInputProps & {
  etiqueta?: string;
  error?: string | null;
  icono?: NombreIcono;
  contador?: string;
}) {
  const [enfocado, setEnfocado] = useState(false);
  const multilinea = !!resto.multiline;
  return (
    <View style={{ gap: espacio.sm }}>
      {etiqueta && (
        <Txt variante="etiqueta" color={colores.textoTenue}>
          {etiqueta}
        </Txt>
      )}
      <View
        style={[
          estilos.campo,
          multilinea && { alignItems: 'flex-start', paddingVertical: espacio.md },
          { borderColor: error ? colores.error : enfocado ? colores.acento : colores.borde },
        ]}
      >
        {icono && (
          <View style={multilinea ? { marginTop: 2 } : undefined}>
            <Icono nombre={icono} tamano={20} color={enfocado ? colores.acento : colores.textoTenue} />
          </View>
        )}
        <TextInput
          placeholderTextColor={colores.textoTenue}
          selectionColor={colores.acento}
          cursorColor={colores.acento}
          {...resto}
          onFocus={(e) => {
            setEnfocado(true);
            resto.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            resto.onBlur?.(e);
          }}
          style={[
            FUENTE,
            tipo.cuerpo as TextStyle,
            estilos.entrada,
            multilinea && { textAlignVertical: 'top' },
            style,
          ]}
        />
      </View>
      {(error || contador) && (
        <Txt variante="pequeno" color={error ? colores.error : colores.textoTenue} style={error ? undefined : { textAlign: 'right' }}>
          {error ?? contador}
        </Txt>
      )}
    </View>
  );
}

// ---------- Estado: píldora translúcida con punto de color ----------
export function EstadoPill({ estado }: { estado: Estado }) {
  const progreso = useRef(new Animated.Value(1)).current;
  const previo = useRef(estado);
  const desde = useRef(estado);
  const hayCambio = useRef(false);

  // Si el estado cambió, la transición parte del color anterior.
  if (previo.current !== estado) {
    desde.current = previo.current;
    previo.current = estado;
    progreso.setValue(0);
    hayCambio.current = true;
  }
  useEffect(() => {
    if (!hayCambio.current) return;
    hayCambio.current = false;
    Animated.timing(progreso, {
      toValue: 1,
      duration: movimiento.normal,
      easing: movimiento.salida,
      useNativeDriver: false, // el color no admite driver nativo
    }).start();
  });

  const a = colores.estado[desde.current];
  const b = colores.estado[estado];
  const rango = { inputRange: [0, 1], outputRange: [a, b] };
  const rangoFondo = { inputRange: [0, 1], outputRange: [conAlpha(a, 0.14), conAlpha(b, 0.14)] };

  return (
    <Animated.View style={[estilos.pill, { backgroundColor: progreso.interpolate(rangoFondo) }]}>
      <Animated.View style={[estilos.punto, { backgroundColor: progreso.interpolate(rango) }]} />
      <Animated.Text style={[FUENTE, tipo.pequeno as TextStyle, { fontWeight: '600', color: progreso.interpolate(rango) }]}>
        {etiquetaEstado(estado)}
      </Animated.Text>
    </Animated.View>
  );
}

// ---------- Mosaico de categoría (filtro y selector) ----------
export function Mosaico({
  categoria,
  activo,
  onPress,
  compacto = false,
  style,
}: {
  categoria: Categoria;
  activo: boolean;
  onPress: () => void;
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={categoria}
      onPress={onPress}
      style={[
        estilos.mosaico,
        compacto && estilos.mosaicoCompacto,
        activo && { backgroundColor: colores.acentoSuave, borderColor: colores.acento },
        style,
      ]}
    >
      <Icono nombre={ICONO_CATEGORIA[categoria]} tamano={compacto ? 22 : 26} color={activo ? colores.acento : colores.textoSecundario} />
      <Txt
        variante="pequeno"
        numberOfLines={2}
        color={activo ? colores.texto : colores.textoSecundario}
        style={{ textAlign: 'center', fontWeight: activo ? '600' : '500' }}
      >
        {categoria}
      </Txt>
    </Tocable>
  );
}

// ---------- Título grande de pantalla ----------
export function TituloPantalla({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <View style={{ gap: espacio.xs }}>
      <Txt variante="titulo" accessibilityRole="header">
        {titulo}
      </Txt>
      {detalle && (
        <Txt variante="cuerpo" color={colores.textoSecundario}>
          {detalle}
        </Txt>
      )}
    </View>
  );
}

// ---------- Estado vacío ----------
export function EstadoVacio({ icono, titulo, texto }: { icono: NombreIcono; titulo: string; texto: string }) {
  return (
    <View style={estilos.vacio}>
      <Medallon nombre={icono} tamano={64} />
      <Txt variante="subtitulo" style={{ textAlign: 'center' }}>
        {titulo}
      </Txt>
      <Txt variante="cuerpo" color={colores.textoSecundario} style={{ textAlign: 'center', maxWidth: 320 }}>
        {texto}
      </Txt>
    </View>
  );
}

// Tarjeta base: superficie, borde fino y radio grande.
export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[estilos.tarjeta, style]}>{children}</View>;
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 48,
    paddingHorizontal: espacio.xl,
    borderRadius: radio.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
  },
  botonIcono: {
    width: medidas.tactil,
    height: medidas.tactil,
    borderRadius: medidas.tactil / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    minHeight: 52,
    paddingHorizontal: espacio.lg,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderRadius: radio.lg,
  },
  entrada: {
    flex: 1,
    color: colores.texto,
    paddingVertical: Platform.OS === 'web' ? espacio.md : espacio.sm,
    // El foco ya se ve en el borde del campo.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Sin alignSelf: la fila que la contiene decide su alineación (centrada con el título).
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radio.pildora,
  },
  punto: { width: 7, height: 7, borderRadius: 4 },
  mosaico: {
    width: '31.5%',
    minHeight: 84,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.sm,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mosaicoCompacto: { width: 100, minHeight: 76, paddingHorizontal: espacio.xs },
  vacio: { alignItems: 'center', gap: espacio.md, paddingVertical: espacio.enorme, paddingHorizontal: espacio.xl },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colores.borde,
    overflow: 'hidden',
  },
});
