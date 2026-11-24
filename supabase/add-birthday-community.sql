-- Comunidad para cumpleaños y aniversarios
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- Las fechas existentes quedan como "General · Toda la pastoral".

alter table public.birthdays
  add column if not exists community text default '';

create index if not exists birthdays_community_idx
  on public.birthdays (community);

-- Verificación: debe mostrar la columna community
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'birthdays'
order by ordinal_position;
