-- ============================================================
--  Cartelera Pastoral Familiar · Esquema para Supabase
--  Ejecuta TODO este archivo en: Supabase → SQL Editor → Run
--  Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- ============================================================

-- ---------- 1. Perfiles y roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'viewer'
    check (role in ('admin', 'editor', 'coordinador', 'viewer')),
  phone text,
  created_at timestamptz not null default now()
);

-- ¿La persona que consulta puede editar la cartelera?
-- SECURITY DEFINER evita la recursión de RLS al leer profiles.
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor', 'coordinador')
  );
$$;

-- Perfil automático al crear un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 2. Contenido ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  image_url text default '',
  category text not null default 'familiar',
  starts_at timestamp not null,
  ends_at timestamp,
  location text default '',
  responsible text default '',
  contact text default '',
  capacity integer default 0,
  community text default '',
  recurrence text not null default 'none'
    check (recurrence in ('none', 'weekly', 'monthly_first_sunday')),
  recurrence_until date,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  submitted_by text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  image_url text default '',
  priority text not null default 'normal'
    check (priority in ('normal', 'importante', 'urgente')),
  pinned boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  author text default '',
  published_at timestamp default now(),
  expires_at timestamp,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.birthdays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'birthday'
    check (kind in ('birthday', 'anniversary')),
  date date not null,
  phone text default '',
  note text default '',
  community text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  category text default 'General',
  kind text not null default 'doc'
    check (kind in ('doc', 'link', 'form', 'video')),
  url text not null,
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text default '',
  area text default 'Equipo',
  phone text default '',
  whatsapp text default '',
  email text default '',
  notes text default '',
  sort integer default 99,
  created_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  date date not null default current_date,
  tone text default 'sage',
  community text default '',
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Me gusta por foto. La tabla no se expone directamente:
-- solo se lee/escribe mediante las funciones de abajo.
create table if not exists public.photo_likes (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  photo_key text not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (album_id, photo_key, visitor_id)
);

alter table public.photo_likes enable row level security;
create index if not exists photo_likes_album_photo_idx
  on public.photo_likes (album_id, photo_key);

create or replace function public.photo_like_counts()
returns table (album_id uuid, photo_key text, likes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select pl.album_id, pl.photo_key, count(*)::bigint
  from public.photo_likes pl
  group by pl.album_id, pl.photo_key;
$$;

create or replace function public.toggle_photo_like(
  p_album_id uuid,
  p_photo_key text,
  p_visitor_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 then
    raise exception 'visitante inválido';
  end if;

  if exists (
    select 1 from public.photo_likes
    where album_id = p_album_id and photo_key = p_photo_key and visitor_id = p_visitor_id
  ) then
    delete from public.photo_likes
    where album_id = p_album_id and photo_key = p_photo_key and visitor_id = p_visitor_id;
  else
    insert into public.photo_likes (album_id, photo_key, visitor_id)
    values (p_album_id, p_photo_key, p_visitor_id);
  end if;

  select count(*)::integer into v_count
  from public.photo_likes
  where album_id = p_album_id and photo_key = p_photo_key;

  return v_count;
end;
$$;

revoke all on function public.photo_like_counts() from public;
revoke all on function public.toggle_photo_like(uuid, text, text) from public;
grant execute on function public.photo_like_counts() to anon, authenticated;
grant execute on function public.toggle_photo_like(uuid, text, text) to anon, authenticated;

create table if not exists public.prayer_requests (  id uuid primary key default gen_random_uuid(),
  name text default 'Anónimo',
  text text not null,
  visibility text not null default 'public'
    check (visibility in ('public', 'equipo')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  prayers integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  message text not null check (char_length(message) between 1 and 800),
  video_url text default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'archived')),
  moderated_at timestamptz,
  moderated_by text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

-- Horario mensual del Santísimo: una hora por comunidad
create table if not exists public.holy_hours (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  community text not null,
  start_time time not null,
  end_time time not null,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

-- Comunidad asignada a cada misa de viernes (o domingo) por fecha
create table if not exists public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  kind text not null default 'viernes'
    check (kind in ('viernes', 'domingo')),
  community text not null,
  notes text default '',
  created_at timestamptz not null default now(),
  unique (date, kind)
);

-- Migración para proyectos creados antes de las actividades recurrentes
alter table public.activities add column if not exists community text default '';
alter table public.activities add column if not exists recurrence text not null default 'none';
alter table public.activities add column if not exists recurrence_until date;
alter table public.activities add column if not exists image_url text default '';
alter table public.albums add column if not exists community text default '';
alter table public.notices add column if not exists image_url text default '';
alter table public.birthdays add column if not exists community text default '';
create index if not exists birthdays_community_idx on public.birthdays (community);

do $$
begin
  alter table public.activities
    add constraint activities_recurrence_check
    check (recurrence in ('none', 'weekly', 'monthly_first_sunday'));
exception
  when duplicate_object then null;
end $$;

-- ---------- 3. Índices ----------
create index if not exists activities_starts_idx on public.activities (starts_at);
create index if not exists activities_status_idx on public.activities (status);
create index if not exists notices_published_idx on public.notices (published_at desc);
create index if not exists notices_status_idx on public.notices (status);
create index if not exists birthdays_date_idx on public.birthdays (date);
create index if not exists resources_status_idx on public.resources (status);
create index if not exists albums_status_idx on public.albums (status);
create index if not exists prayers_status_idx on public.prayer_requests (status);
create index if not exists shares_status_idx on public.shares (status, created_at desc);
create index if not exists holy_hours_month_idx on public.holy_hours (month, sort);
create index if not exists service_assignments_date_idx on public.service_assignments (date);

-- ---------- 4. updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists activities_touch on public.activities;
create trigger activities_touch before update on public.activities
  for each row execute function public.touch_updated_at();

drop trigger if exists notices_touch on public.notices;
create trigger notices_touch before update on public.notices
  for each row execute function public.touch_updated_at();

drop trigger if exists resources_touch on public.resources;
create trigger resources_touch before update on public.resources
  for each row execute function public.touch_updated_at();

drop trigger if exists prayers_touch on public.prayer_requests;
create trigger prayers_touch before update on public.prayer_requests
  for each row execute function public.touch_updated_at();

-- ---------- 5. Seguridad por fila (RLS) ----------
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.notices enable row level security;
alter table public.birthdays enable row level security;
alter table public.resources enable row level security;
alter table public.contacts enable row level security;
alter table public.albums enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.shares enable row level security;
alter table public.holy_hours enable row level security;
alter table public.service_assignments enable row level security;
alter table public.settings enable row level security;

-- Perfiles
drop policy if exists "perfiles lectura" on public.profiles;
create policy "perfiles lectura" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_editor());

drop policy if exists "perfiles edicion" on public.profiles;
create policy "perfiles edicion" on public.profiles
  for update to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Actividades
drop policy if exists "actividades lectura" on public.activities;
create policy "actividades lectura" on public.activities
  for select using (status = 'approved' or public.is_editor());

drop policy if exists "actividades propuesta" on public.activities;
create policy "actividades propuesta" on public.activities
  for insert to anon
  with check (
    status = 'pending'
    and length(title) between 3 and 160
    and coalesce(submitted_by, '') <> ''
  );

drop policy if exists "actividades edicion" on public.activities;
create policy "actividades edicion" on public.activities
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Avisos
drop policy if exists "avisos lectura" on public.notices;
create policy "avisos lectura" on public.notices
  for select using (status = 'approved' or public.is_editor());

drop policy if exists "avisos edicion" on public.notices;
create policy "avisos edicion" on public.notices
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Cumpleaños
drop policy if exists "cumpleanos lectura" on public.birthdays;
create policy "cumpleanos lectura" on public.birthdays
  for select using (true);

drop policy if exists "cumpleanos edicion" on public.birthdays;
create policy "cumpleanos edicion" on public.birthdays
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Recursos
drop policy if exists "recursos lectura" on public.resources;
create policy "recursos lectura" on public.resources
  for select using (status = 'approved' or public.is_editor());

drop policy if exists "recursos edicion" on public.resources;
create policy "recursos edicion" on public.resources
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Contactos
drop policy if exists "contactos lectura" on public.contacts;
create policy "contactos lectura" on public.contacts
  for select using (true);

drop policy if exists "contactos edicion" on public.contacts;
create policy "contactos edicion" on public.contacts
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Álbumes
drop policy if exists "albumes lectura" on public.albums;
create policy "albumes lectura" on public.albums
  for select using (status = 'approved' or public.is_editor());

drop policy if exists "albumes edicion" on public.albums;
create policy "albumes edicion" on public.albums
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Oración
drop policy if exists "oracion lectura" on public.prayer_requests;
create policy "oracion lectura" on public.prayer_requests
  for select using (
    (status = 'approved' and visibility = 'public')
    or public.is_editor()
  );

drop policy if exists "oracion envio" on public.prayer_requests;
create policy "oracion envio" on public.prayer_requests
  for insert to anon
  with check (
    status = 'pending'
    and length(text) between 10 and 600
  );

drop policy if exists "oracion edicion" on public.prayer_requests;
create policy "oracion edicion" on public.prayer_requests
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Muro de la comunidad
drop policy if exists "compartir lectura" on public.shares;
create policy "compartir lectura" on public.shares
  for select using (status = 'approved' or public.is_editor());

drop policy if exists "compartir envio" on public.shares;
create policy "compartir envio" on public.shares
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and char_length(message) between 2 and 600
    and char_length(coalesce(name, '')) <= 80
  );

drop policy if exists "compartir edicion" on public.shares;
create policy "compartir edicion" on public.shares
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Ajustes
drop policy if exists "ajustes lectura" on public.settings;
create policy "ajustes lectura" on public.settings
  for select using (true);

drop policy if exists "ajustes edicion" on public.settings;
create policy "ajustes edicion" on public.settings
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Santísimo
drop policy if exists "santisimo lectura" on public.holy_hours;
create policy "santisimo lectura" on public.holy_hours
  for select using (true);

drop policy if exists "santisimo edicion" on public.holy_hours;
create policy "santisimo edicion" on public.holy_hours
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- Servicios asignados
drop policy if exists "servicios lectura" on public.service_assignments;
create policy "servicios lectura" on public.service_assignments
  for select using (true);

drop policy if exists "servicios edicion" on public.service_assignments;
create policy "servicios edicion" on public.service_assignments
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

-- ---------- 6. Contador de "Amén" ----------
create or replace function public.increment_prayer(prayer_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.prayer_requests
  set prayers = coalesce(prayers, 0) + 1
  where id = prayer_id
    and status = 'approved';
$$;

grant execute on function public.increment_prayer(uuid) to anon, authenticated;

-- ---------- 7. Cambios en vivo (Realtime) ----------
do $$
declare
  t text;
begin
  foreach t in array array[
    'activities', 'notices', 'birthdays', 'resources',
    'contacts', 'albums', 'prayer_requests', 'settings', 'holy_hours', 'service_assignments', 'shares'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;

-- ---------- 8. Imágenes (Storage) ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media lectura publica" on storage.objects;
create policy "media lectura publica" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media alta editores" on storage.objects;
create policy "media alta editores" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "media cambio editores" on storage.objects;
create policy "media cambio editores" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_editor())
  with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "media borrado editores" on storage.objects;
create policy "media borrado editores" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_editor());

-- ---------- 9. Permisos de API ----------
-- RLS sigue siendo la que decide qué filas ve o escribe cada quien.
-- Estos grants aseguran que la API funcione aunque el proyecto no
-- tenga activada la opción "Grant API access to new tables".
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- ============================================================
--  DESPUÉS DE EJECUTAR
--  1. Authentication → Users → Add user (crea a cada coordinador)
--  2. Convierte al primero en administrador:
--       update public.profiles
--       set role = 'admin'
--       where id = (select id from auth.users where email = 'TU-CORREO');
--  3. Copia Project URL y anon public key en js/config.js
-- ============================================================
