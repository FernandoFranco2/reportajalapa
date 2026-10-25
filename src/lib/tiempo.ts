// Texto corto de cuánto tiempo pasó desde una fecha ("Ahora", "Hace 3 días").
export function diasDesde(fecha: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000));
}

export function haceCuanto(fecha: string): string {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Hace 1 día';
  if (dias < 30) return `Hace ${dias} días`;
  return new Date(fecha).toLocaleDateString('es-GT');
}
