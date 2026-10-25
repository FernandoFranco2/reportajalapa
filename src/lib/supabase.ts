// Cliente de Supabase. Solo se usa la clave pública (anon): la seguridad real
// la dan las reglas RLS de la base de datos. NUNCA poner aquí la clave service_role.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. Revisa tu archivo .env');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage, // guarda la sesión en el teléfono
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no aplica en apps móviles
  },
});
