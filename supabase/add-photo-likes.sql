-- Corazones en las fotos de la galería
-- Ejecutar una sola vez en el SQL Editor de Supabase.

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

-- Verificación
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('photo_like_counts', 'toggle_photo_like');
