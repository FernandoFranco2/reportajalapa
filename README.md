# ReportaJalapa

App móvil (React Native + Expo + Supabase) para reportar problemas de la comunidad en Jalapa.

## Tecnologías

- React Native 0.88 + Expo 58 + TypeScript
- Supabase (autenticación, base de datos PostgreSQL con RLS y almacenamiento de imágenes)
- react-native-maps y expo-location (mapa y ubicación del reporte)
- expo-image-picker (fotos del reporte)
- AsyncStorage para la persistencia de la sesión

## Integrantes

- Fernando Franco: desarrollo de la aplicación.
- Kevin Hernandez: apoyo en el desarrollo del frontend.

## Requisitos

- Node.js 18 o superior y npm
- App **Expo Go** en el teléfono (o un emulador Android/iOS)
- Un proyecto propio en Supabase

## Instalación

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear un proyecto en [supabase.com](https://supabase.com) y ejecutar todo `supabase/schema.sql` en **SQL Editor**.
3. Copiar `.env.example` como `.env` y poner la URL y la clave **anon** (Project Settings > API). Nunca la `service_role`.
4. Iniciar y abrir con **Expo Go** en el teléfono (escanear el QR):
   ```bash
   npx expo start
   ```

## Cuenta de municipalidad

Todos se registran como vecinos. Para convertir una cuenta, registrarla en la app y ejecutar en SQL Editor:

```sql
update public.profiles set rol = 'municipalidad'
where id = (select id from auth.users where email = 'correo@ejemplo.com');
```

## Verificar tipos

```bash
npx tsc --noEmit
```
