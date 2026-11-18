-- ============================================================
--  Coordinadores de la Pastoral Familiar · Monte Tabor
--  Ejecutar DESPUÉS de crear los usuarios en Authentication.
--
--  Cada coordinador inicia sesión con su TELÉFONO y su
--  contraseña. La app convierte el teléfono en este correo:
--    503 + número @ coordinadores.pastoralfamiliar.org
--  Por eso los correos de abajo deben coincidir exactamente.
-- ============================================================

with coordinadores (email, full_name, phone, role) as (
  values
    ('50376540943@coordinadores.pastoralfamiliar.org', 'Ricardo Varela', '7654-0943', 'admin'),
    ('50377458014@coordinadores.pastoralfamiliar.org', 'Roberto Trejo',  '7745-8014', 'admin'),
    ('50376163574@coordinadores.pastoralfamiliar.org', 'Edward Minero',  '7616-3574', 'editor'),
    ('50379318852@coordinadores.pastoralfamiliar.org', 'Mariela',        '7931-8852', 'editor'),
    ('50378564788@coordinadores.pastoralfamiliar.org', 'Juan Trejo',     '7856-4788', 'editor'),
    ('50372400130@coordinadores.pastoralfamiliar.org', 'Gabriela Trejo', '7240-0130', 'editor'),
    ('50370113964@coordinadores.pastoralfamiliar.org', 'Isabel Luna',    '7011-3964', 'editor'),
    ('50369556753@coordinadores.pastoralfamiliar.org', 'Krissia Avalos', '6955-6753', 'editor'),
    ('50378850684@coordinadores.pastoralfamiliar.org', 'Manuel Figueroa','7885-0684', 'editor'),
    ('50369790977@coordinadores.pastoralfamiliar.org', 'Samuel Avelar',  '6979-0977', 'editor')
)
insert into public.profiles (id, full_name, phone, role)
select u.id, c.full_name, c.phone, c.role
from coordinadores c
join auth.users u on lower(u.email) = c.email
on conflict (id) do update
  set full_name = excluded.full_name,
      phone = excluded.phone,
      role = excluded.role;

-- Verificación: deben aparecer los 10 con su rol.
select p.full_name, p.phone, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) like '%@coordinadores.pastoralfamiliar.org'
order by p.role, p.full_name;
