-- ReportaJalapa: tablas, seguridad (RLS) y bucket de fotos.
-- Ejecutar completo en Supabase > SQL Editor.

-- ============================================================
-- 1. Tabla de perfiles (un perfil por usuario registrado)
-- ============================================================
create table if not exists public.profiles (
  id     uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 60),
  rol    text not null default 'vecino' check (rol in ('vecino', 'municipalidad'))
);

-- Trigger: al registrarse un usuario se crea su perfil, SIEMPRE como vecino.
-- Así nadie puede hacerse "municipalidad" desde la app.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), 'Vecino'),
    'vecino'
  );
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Función auxiliar: ¿el usuario actual es de la municipalidad?
-- Es "security definer" para poder leer profiles dentro de las políticas sin bucles.
create or replace function public.es_municipalidad()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'municipalidad'
  );
$$;

alter table public.profiles enable row level security;

-- Cada quien lee su propio perfil; la municipalidad lee todos.
drop policy if exists "perfiles_select" on public.profiles;
create policy "perfiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.es_municipalidad());

-- Permiso de tabla: los proyectos nuevos de Supabase ya no lo dan solos.
-- Sin este GRANT sale "permission denied for table profiles".
grant select on public.profiles to authenticated;

-- No hay políticas de insert/update/delete: nadie puede cambiar su rol desde la app.

-- ============================================================
-- 2. Tabla de reportes
-- ============================================================
create table if not exists public.reportes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria   text not null check (categoria in (
    'Baches', 'Basura', 'Alumbrado', 'Fugas de agua',
    'Drenaje tapado', 'Árbol caído', 'Animales', 'Inseguridad', 'Otro'
  )),
  -- Título propio: obligatorio (3 a 50 caracteres) solo si la categoría es 'Otro'.
  titulo      text,
  descripcion text not null check (char_length(descripcion) between 10 and 300),
  foto_url    text not null,
  -- Se acepta cualquier coordenada válida: un GPS impreciso no debe bloquear al vecino.
  -- La app marca como "fuera de Jalapa" lo que cae fuera de lat 14.55 a 14.72 / lng -90.08 a -89.90.
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  -- Referencias para llegar y teléfono de contacto (8 dígitos). Ambos opcionales.
  indicaciones text check (indicaciones is null or char_length(indicaciones) <= 200),
  telefono    text check (telefono is null or telefono ~ '^[0-9]{8}$'),
  -- Huella SHA-256 de la foto (64 caracteres), para detectar reportes repetidos.
  foto_hash   text check (foto_hash is null or char_length(foto_hash) = 64),
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'en proceso', 'resuelto')),
  -- Mensaje de la municipalidad para el vecino (opcional).
  respuesta   text check (respuesta is null or char_length(respuesta) <= 300),
  creado_en   timestamptz not null default now(),
  constraint titulo_segun_categoria check (
    (categoria = 'Otro' and char_length(titulo) between 3 and 50)
    or (categoria <> 'Otro' and titulo is null)
  )
);

-- ============================================================
-- Anti-spam: límite diario y reportes repetidos
-- ============================================================
create or replace function public.validar_antispam()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inicio_dia timestamptz;
  reportes_hoy integer;
begin
  -- "Hoy" se cuenta con la hora de Guatemala.
  inicio_dia := date_trunc('day', now() at time zone 'America/Guatemala') at time zone 'America/Guatemala';

  select count(*) into reportes_hoy
  from public.reportes
  where usuario_id = new.usuario_id and creado_en >= inicio_dia;

  if reportes_hoy >= 5 then
    raise exception 'Límite diario alcanzado: máximo 5 reportes por día.';
  end if;

  -- Misma foto y mismo texto (sin importar mayúsculas ni espacios) de la misma cuenta.
  if new.foto_hash is not null and exists (
    select 1 from public.reportes
    where usuario_id = new.usuario_id
      and foto_hash = new.foto_hash
      and lower(trim(descripcion)) = lower(trim(new.descripcion))
  ) then
    raise exception 'Ya enviaste un reporte con la misma foto y el mismo texto.';
  end if;

  return new;
end;
$$;

drop trigger if exists antes_de_crear_reporte on public.reportes;
create trigger antes_de_crear_reporte
  before insert on public.reportes
  for each row execute function public.validar_antispam();

alter table public.reportes enable row level security;

-- Leer: el vecino solo ve los suyos; la municipalidad ve todos.
drop policy if exists "reportes_select" on public.reportes;
create policy "reportes_select" on public.reportes
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_municipalidad());

-- Crear: solo a nombre propio y siempre en estado 'pendiente'.
drop policy if exists "reportes_insert" on public.reportes;
create policy "reportes_insert" on public.reportes
  for insert to authenticated
  with check (usuario_id = auth.uid() and estado = 'pendiente');

-- Actualizar: solo la municipalidad.
drop policy if exists "reportes_update" on public.reportes;
create policy "reportes_update" on public.reportes
  for update to authenticated
  using (public.es_municipalidad())
  with check (public.es_municipalidad());

-- Permisos de tabla (RLS decide después qué filas). Sin "delete" a propósito.
-- Aunque sea municipalidad, solo puede modificar "estado" y "respuesta".
revoke update on public.reportes from authenticated;
grant select, insert on public.reportes to authenticated;
grant update (estado, respuesta) on public.reportes to authenticated;

-- No hay política de delete: nadie borra reportes desde la app.

-- ============================================================
-- 3. Storage: bucket público "fotos"
-- ============================================================
-- Solo jpeg/png y máximo 5 MB (5242880 bytes).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png'];

-- Cada usuario sube únicamente dentro de la carpeta <su-uid>/.
drop policy if exists "fotos_insert" on storage.objects;
create policy "fotos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Para crear una cuenta de municipalidad (hacerlo a mano, una sola vez):
--   1. Registrar el usuario normalmente desde la app.
--   2. Ejecutar:  update public.profiles set rol = 'municipalidad'
--                 where id = (select id from auth.users where email = 'correo@ejemplo.com');
-- ============================================================
