-- ============================================================
--  Muro de la comunidad: saludos, mensajes y videos
--  Ejecutar una vez en: Supabase → SQL Editor → Run
--  Los mensajes entran como "pending" y un coordinador los
--  aprueba o rechaza desde el panel.
-- ============================================================

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

create index if not exists shares_status_idx on public.shares (status, created_at desc);

alter table public.shares enable row level security;

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

grant select, insert, update, delete on public.shares to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.shares;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Verificación
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'shares'
order by ordinal_position;
