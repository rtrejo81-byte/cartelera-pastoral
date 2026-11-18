-- ============================================================
--  Agrega imagen opcional a actividades y avisos
--  Ejecutar una vez en: Supabase → SQL Editor → Run
-- ============================================================

alter table public.activities
  add column if not exists image_url text default '';

alter table public.notices
  add column if not exists image_url text default '';

-- Verificación: deben aparecer las dos columnas.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('activities', 'notices')
  and column_name = 'image_url'
order by table_name;
