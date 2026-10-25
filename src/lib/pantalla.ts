// Detecta si la pantalla es ancha (navegador de escritorio o tablet horizontal).
// Con pantalla ancha la app usa barra lateral y varias columnas en lugar del formato de teléfono.
import { useWindowDimensions } from 'react-native';
import { medidas } from '../theme';

export function useEsEscritorio(): boolean {
  const { width } = useWindowDimensions();
  return width >= medidas.puntoEscritorio;
}
