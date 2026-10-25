// Tipos y constantes compartidas por toda la app.
import { colores } from './theme';

export type Rol = 'vecino' | 'municipalidad';

export type Perfil = {
  id: string;
  nombre: string;
  rol: Rol;
};

// Categorías y estados permitidos (deben coincidir con los "check" de schema.sql).
// "Otro" permite escribir un título propio (accidente, bloqueo de calle, etc.).
export const CATEGORIAS = [
  'Baches',
  'Basura',
  'Alumbrado',
  'Fugas de agua',
  'Drenaje tapado',
  'Árbol caído',
  'Animales',
  'Inseguridad',
  'Otro',
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ESTADOS = ['pendiente', 'en proceso', 'resuelto'] as const;
export type Estado = (typeof ESTADOS)[number];

export type Reporte = {
  id: string;
  usuario_id: string;
  categoria: Categoria;
  titulo: string | null; // solo se llena cuando la categoría es "Otro"
  descripcion: string;
  foto_url: string;
  lat: number;
  lng: number;
  estado: Estado;
  indicaciones: string | null; // referencias para llegar al lugar
  telefono: string | null; // contacto del vecino (8 dígitos); solo lo ve la municipalidad
  respuesta: string | null; // mensaje de la municipalidad para el vecino
  creado_en: string;
};

// Zona de Jalapa. Un reporte fuera de la zona se acepta, pero se marca como "fuera de Jalapa".
export const ZONA_JALAPA = {
  latMin: 14.55,
  latMax: 14.72,
  lngMin: -90.08,
  lngMax: -89.9,
};

// Centro de referencia de Jalapa (también sirve como ubicación de prueba).
export const CENTRO_JALAPA = { lat: 14.6339, lng: -89.9885 };

// Revisa si unas coordenadas caen dentro de la zona de Jalapa.
export function estaEnJalapa(lat: number, lng: number): boolean {
  return (
    lat >= ZONA_JALAPA.latMin &&
    lat <= ZONA_JALAPA.latMax &&
    lng >= ZONA_JALAPA.lngMin &&
    lng <= ZONA_JALAPA.lngMax
  );
}

// Color de cada estado (se usa en etiquetas y en los marcadores del mapa).
export const COLOR_ESTADO: Record<Estado, string> = colores.estado;

// Límites para las fotos y la descripción.
export const MAX_FOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const TITULO_MIN = 3;
export const TITULO_MAX = 50;
export const DESCRIPCION_MIN = 10;
export const DESCRIPCION_MAX = 300;
export const RESPUESTA_MAX = 300;
export const INDICACIONES_MAX = 200;
// Máximo de reportes por cuenta por día (también lo exige la base de datos).
export const LIMITE_REPORTES_DIARIOS = 5;
export const TELEFONO_LARGO = 8; // teléfonos de Guatemala
