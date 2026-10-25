// Mensajes para el usuario. Los errores usan una alerta del sistema; las confirmaciones
// breves se muestran como aviso discreto dentro de la app (ver components/Toast.tsx).
import { Alert, Platform } from 'react-native';

// En el teléfono usa Alert; en la web "Alert.alert" no hace nada, por eso se usa window.alert.
export function avisar(titulo: string, mensaje?: string) {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
  } else {
    Alert.alert(titulo, mensaje);
  }
}

type Escucha = (texto: string) => void;
let escucha: Escucha | null = null;

// Registra quién muestra los avisos (lo hace <ToastHost /> al montarse).
export function registrarToast(fn: Escucha | null) {
  escucha = fn;
}

// Confirmación breve y sin interrupción. Si no hay anfitrión, cae en la alerta normal.
export function notificar(texto: string) {
  if (escucha) escucha(texto);
  else avisar(texto);
}
