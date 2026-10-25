// Sistema de diseño de ReportaJalapa: ninguna pantalla usa colores, tamaños ni sombras sueltas.
// Tema oscuro frío y apagado; el acento (azul hielo) se usa con moderación.
import { Easing, Platform, TextStyle } from 'react-native';

export const colores = {
  fondo: '#0E141B', // azul pizarra muy oscuro
  superficie: '#151D26', // tarjetas
  elevada: '#1C2630', // elementos elevados (barra de pestañas, hojas, campos)
  borde: '#263340', // borde fino de 1 px
  bordeFuerte: '#34455A', // borde de campo enfocado o de selección

  texto: '#E6EDF4', // casi blanco azulado
  textoSecundario: '#9CABBB', // gris azulado (6,9:1 sobre superficie)
  textoTenue: '#7C8D9F', // etiquetas y ayudas (4,8:1 sobre superficie)

  acento: '#7FA7C9', // azul hielo
  acentoSuave: 'rgba(127,167,201,0.16)', // fondo del círculo activo y de selección
  sobreAcento: '#0B1218', // texto sobre botones de acento (7,5:1)

  // Estados con significado, desaturados.
  estado: {
    pendiente: '#E58F98', // coral apagado
    'en proceso': '#DDB26A', // ámbar apagado
    resuelto: '#93BBA0', // verde salvia
  },
  // Prioridad (municipalidad): mismo lenguaje, otra familia visual.
  prioridad: {
    alta: '#E58F98',
    media: '#DDB26A',
    reciente: '#8DA2B8',
  },
  error: '#E58F98',
  velo: 'rgba(8,12,17,0.72)', // detrás de hojas y confirmaciones
} as const;

// Fondo translúcido para píldoras y puntos: el mismo color con poca opacidad.
export function conAlpha(hex: string, alfa: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alfa})`;
}

// Escala de 4 px.
export const espacio = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  enorme: 48,
} as const;

export const radio = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pildora: 999,
} as const;

// Sombras casi imperceptibles (offset y desenfoque suaves).
export const sombra = {
  suave: { boxShadow: '0px 4px 14px rgba(0,0,0,0.22)' },
  flotante: { boxShadow: '0px 10px 28px rgba(0,0,0,0.38)' },
} as const;

// Fuente del sistema: San Francisco en iOS, Roboto en Android y la pila nativa en web.
export const FUENTE: TextStyle = Platform.select<TextStyle>({
  web: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  },
  default: {},
}) as TextStyle;

// Jerarquía por tamaño y peso.
export const tipo = {
  titulo: { fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: -0.7 },
  tituloMedio: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.35 },
  subtitulo: { fontSize: 17, lineHeight: 23, fontWeight: '600', letterSpacing: -0.2 },
  cuerpo: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  cuerpoMedio: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  pequeno: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  etiqueta: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase' },
  numero: { fontSize: 26, lineHeight: 30, fontWeight: '600', letterSpacing: -0.5 },
} as const satisfies Record<string, TextStyle>;
export type VarianteTipo = keyof typeof tipo;

// Movimiento: sutil, sin rebotes.
export const movimiento = {
  rapido: 200,
  normal: 280,
  lento: 350,
  salida: Easing.out(Easing.cubic),
  desplazamiento: 8, // px de la entrada de tarjetas
  escalaPresionado: 0.95, // se nota al tocar, sin llegar a ser un salto
  opacidadPresionado: 0.7,
  cambioPestana: 16, // px de desplazamiento horizontal al cambiar de pestaña
} as const;

// Medidas compartidas.
export const medidas = {
  tactil: 44, // área táctil mínima
  anchoMaximo: 880, // ancho cómodo del contenido en web
  anchoLectura: 640, // formularios largos (nuevo reporte)
  anchoAcceso: 420, // login
  puntoEscritorio: 900, // desde este ancho se usa barra lateral y varias columnas
  anchoBarraLateral: 248,
  anchoContenido: 1180, // contenido máximo en pantallas anchas
  barraAltura: 72,
  barraMargen: 16,
  espacioBarra: 124, // relleno inferior para que la barra flotante no tape contenido
} as const;
