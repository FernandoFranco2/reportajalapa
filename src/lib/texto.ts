// Ayudas para mostrar textos con la primera letra en mayúscula.
import { Estado } from '../types';

// Pone en mayúscula la primera letra (los textos escritos por vecinos suelen empezar en minúscula).
export function capitalizar(texto: string | null | undefined): string {
  if (!texto) return '';
  const limpio = texto.trimStart();
  return limpio.charAt(0).toLocaleUpperCase('es') + limpio.slice(1);
}

// Los estados se guardan en minúscula en la base; en pantalla se muestran con mayúscula inicial.
export function etiquetaEstado(estado: Estado): string {
  return capitalizar(estado);
}
