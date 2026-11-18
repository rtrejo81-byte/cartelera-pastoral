-- ============================================================
--  Columnas nuevas para imágenes y para el alta de recursos
--  Ejecutar una vez en: Supabase → SQL Editor → Run
-- ============================================================

alter table public.activities
  add column if not exists image_url text default '';

alter table public.notices
  add column if not exists image_url text default '';

-- La tabla resources no tenía created_at y el panel la necesitaba.
alter table public.resources
  add column if not exists created_at timestamptz not null default now();

-- Verificación: deben aparecer las columnas nuevas.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name in ('activities', 'notices') and column_name = 'image_url')
    or (table_name = 'resources' and column_name = 'created_at')
  )
order by table_name, column_name;
