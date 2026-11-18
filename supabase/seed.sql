-- ============================================================
--  Contenido inicial OPCIONAL para Supabase
--  Ejecútalo solo si quieres que la web no empiece vacía.
--  No duplica registros: si ya hay actividades, no hace nada.
--  Cambia nombres, teléfonos y enlaces por los reales.
-- ============================================================

do $$
declare
  next_friday timestamp;
  next_sunday timestamp;
begin
  next_friday := date_trunc('day', now())
    + (((5 - extract(dow from now())::int) + 7) % 7) * interval '1 day'
    + interval '18 hours';
  if next_friday < now() then
    next_friday := next_friday + interval '7 days';
  end if;

  next_sunday := date_trunc('month', now())
    + (((7 - extract(dow from date_trunc('month', now()))::int) % 7) * interval '1 day')
    + interval '17 hours';
  if next_sunday < now() then
    next_sunday := date_trunc('month', now() + interval '1 month')
      + (((7 - extract(dow from date_trunc('month', now() + interval '1 month'))::int) % 7) * interval '1 day')
      + interval '17 hours';
  end if;

  if not exists (select 1 from public.activities) then
    insert into public.activities
      (title, description, category, starts_at, ends_at, location, responsible, contact, capacity, community, recurrence, status)
    values
      ('Misa de comunidad',
       'Misa de las 6:00 p. m. de cada viernes. Una comunidad de la Pastoral Familiar se encarga del servicio litúrgico.',
       'misa', next_friday, next_friday + interval '1 hour',
       'Templo parroquial Monte Tabor', 'Comunidades de la Pastoral Familiar', '', 0, '', 'weekly', 'approved'),
      ('Misa parroquial',
       'Misa parroquial del primer domingo de cada mes, a las 5:00 p. m. Una comunidad de la Pastoral Familiar apoya el servicio litúrgico.',
       'misa', next_sunday, next_sunday + interval '1 hour',
       'Templo parroquial Monte Tabor', 'Pastoral Familiar', '', 0, '', 'monthly_first_sunday', 'approved'),
      ('Reunión de coordinadores',
       'Revisión de la calendarización y organización del próximo retiro.',
       'reunion', (now() + interval '3 days')::timestamp, (now() + interval '3 days' + interval '90 minutes')::timestamp,
       'Casa parroquial · Salón 2', 'Equipo de coordinación', '7000-0001', 20, '', 'none', 'approved'),
      ('Taller: Los 5 lenguajes del amor',
       'Un espacio para descubrir cómo expresamos y recibimos amor en la familia.',
       'formacion', (now() + interval '7 days')::timestamp, (now() + interval '7 days' + interval '2 hours')::timestamp,
       'Salón parroquial', 'Matrimonio Hernández', '7000-0002', 40, 'Comunidad San Juan Pablo II', 'none', 'approved'),
      ('Rosario en familia',
       'Oramos juntos como Pastoral Familiar. Al final compartimos un refrigerio.',
       'familiar', (now() + interval '10 days')::timestamp, (now() + interval '10 days' + interval '1 hour')::timestamp,
       'Capilla de la Virgen', 'Comisión de espiritualidad', '', 0, 'Comunidad San José', 'none', 'approved'),
      ('Retiro Familiar',
       'Un día completo para preparar el corazón en familia: reflexiones, dinámicas y misa.',
       'retiro', (now() + interval '18 days')::timestamp, (now() + interval '18 days' + interval '9 hours')::timestamp,
       'Casa de retiros El Carmelo', 'Pastoral Familiar', '7000-0003', 80, '', 'none', 'approved');

    insert into public.holy_hours (month, community, start_time, end_time, sort)
    values
      (date_trunc('month', now())::date, 'Comunidad San Francisco de Asís', '07:00', '08:00', 1),
      (date_trunc('month', now())::date, 'Comunidad de Jóvenes', '08:00', '09:00', 2),
      (date_trunc('month', now())::date, 'Comunidad San Juan Pablo II', '09:00', '10:00', 3),
      (date_trunc('month', now())::date, 'Comunidad Santa Mónica', '10:00', '11:00', 4),
      (date_trunc('month', now())::date, 'Comunidad San José', '11:00', '12:00', 5);

    insert into public.service_assignments (date, kind, community)
    values
      (make_date(extract(year from current_date)::int, 11, 20), 'viernes', 'Comunidad San Juan Pablo II'),
      (make_date(extract(year from current_date)::int, 11, 27), 'viernes', 'Comunidad San José'),
      (make_date(extract(year from current_date)::int, 12, 4), 'viernes', 'Comunidad Santa Mónica'),
      (make_date(extract(year from current_date)::int, 12, 11), 'viernes', 'Comunidad de Jóvenes'),
      (make_date(extract(year from current_date)::int, 12, 18), 'viernes', 'Comunidad San Francisco de Asís')
    on conflict (date, kind) do nothing;

    insert into public.notices (title, body, priority, pinned, status, author, published_at, expires_at)
    values
      ('Inscripciones abiertas: Retiro Familiar',
       'Ya puedes reservar tu lugar. La colaboración incluye almuerzo y material. Cupo limitado.',
       'importante', true, 'approved', 'Coordinación', now() - interval '1 day', now() + interval '16 days'),
      ('Cambio de salón para el taller del sábado',
       'El taller se moverá al salón grande del segundo nivel. Misma hora.',
       'urgente', false, 'approved', 'Coordinación', now() - interval '6 hours', now() + interval '7 days'),
      ('Colecta de víveres',
       'Este mes hacen falta arroz, aceite y azúcar. Puedes dejarlos en la secretaría parroquial.',
       'normal', false, 'approved', 'Comisión de servicio', now() - interval '3 days', now() + interval '30 days');

    insert into public.birthdays (name, kind, date, phone, note)
    values
      ('María Elena de Hernández', 'birthday', current_date + interval '2 days', '7000-0010', 'Coordinadora de formación'),
      ('José Antonio Rivera', 'birthday', current_date + interval '9 days', '7000-0011', 'Coordinador general'),
      ('Familia Hernández López', 'anniversary', current_date + interval '14 days', '', 'Aniversario de matrimonio'),
      ('Sofía Martínez', 'birthday', current_date + interval '21 days', '', 'Enlace juvenil');

    insert into public.contacts (name, role, area, phone, whatsapp, email, notes, sort)
    values
      ('Coordinación General', 'Coordinador general', 'Equipo general', '', '', '', 'Coordina al equipo y acompaña los ejes. Nombre y contacto por confirmar.', 1),
      ('Eje de Matrimonios', 'Coordinador del eje', 'Equipo general', '', '', '', 'Acompaña a los matrimonios y su formación.', 2),
      ('Eje de Jóvenes', 'Coordinador del eje', 'Equipo general', '', '', '', 'Acompaña a los jóvenes de la pastoral.', 3),
      ('Eje de Encuentro y Convivencia', 'Coordinador del eje', 'Equipo general', '', '', '', 'Organiza encuentros y convivencias.', 4),
      ('Eje de Tema Fijo', 'Coordinador del eje', 'Equipo general', '', '', '', 'Prepara los temas de formación.', 5),
      ('Comunidad Santa Mónica', 'Coordinador de comunidad', 'Comunidades', '', '', '', 'Coordinador por confirmar.', 10),
      ('Comunidad San Juan Pablo II', 'Coordinador de comunidad', 'Comunidades', '', '', '', 'Coordinador por confirmar.', 11),
      ('Comunidad San José', 'Coordinador de comunidad', 'Comunidades', '', '', '', 'Coordinador por confirmar.', 12),
      ('Comunidad San Francisco de Asís', 'Coordinador de comunidad', 'Comunidades', '', '', '', 'Coordinador por confirmar.', 13),
      ('Comunidad de Jóvenes', 'Coordinador de comunidad', 'Comunidades', '', '', '', 'Coordinador por confirmar.', 14);

    insert into public.resources (title, description, category, kind, url, status)
    values
      ('Guía de oración en familia', 'Oraciones breves para rezar en casa durante la semana.', 'Espiritualidad', 'doc', 'https://example.com/guia-oracion.pdf', 'approved'),
      ('Plan de formación', 'Los temas, fechas y responsables de los encuentros del año.', 'Formación', 'doc', 'https://example.com/plan-formacion.pdf', 'approved'),
      ('Ficha de inscripción al retiro', 'Llena tus datos y entrégala a tu coordinador.', 'Inscripciones', 'form', 'https://example.com/inscripcion', 'approved');

    insert into public.albums (title, description, date, tone, community, status, photos)
    values
      ('Retiro Familiar', 'Un fin de semana para reencontrarnos como familia y con Dios.',
       current_date - interval '40 days', 'sage', '', 'approved',
       '[{"id":"ph1","caption":"La bienvenida","url":""},{"id":"ph2","caption":"Trabajo en grupos","url":""},{"id":"ph3","caption":"Misa de cierre","url":""}]'::jsonb),
      ('Convivencia de las familias', 'Juegos, comida compartida y muchas risas.',
       current_date - interval '18 days', 'clay', '', 'approved',
       '[{"id":"ph4","caption":"Los juegos para los niños","url":""},{"id":"ph5","caption":"La mesa compartida","url":""}]'::jsonb),
      ('Misa de la Sagrada Familia', 'Celebración con la bendición de las familias y sus velas.',
       current_date - interval '5 days', 'gold', 'Comunidad Santa Mónica', 'approved',
       '[{"id":"ph6","caption":"Entrada de las familias","url":""},{"id":"ph7","caption":"Bendición de las velas","url":""}]'::jsonb),
      ('Taller para matrimonios', 'Una mañana de formación y diálogo entre esposos.',
       current_date - interval '32 days', 'teal', 'Comunidad San Juan Pablo II', 'approved',
       '[{"id":"ph8","caption":"Bienvenida del matrimonio facilitador","url":""},{"id":"ph9","caption":"Trabajo en parejas","url":""}]'::jsonb),
      ('Noche de jóvenes', 'Música, testimonio y convivencia de la Comunidad de Jóvenes.',
       current_date - interval '20 days', 'clay', 'Comunidad de Jóvenes', 'approved',
       '[{"id":"ph10","caption":"La bienvenida","url":""},{"id":"ph11","caption":"El grupo de jóvenes","url":""}]'::jsonb);

    insert into public.prayer_requests (name, text, visibility, status, prayers)
    values
      ('Familia Rivera Gómez', 'Te pedimos Señor por la salud de nuestra abuela. Danos fortaleza y esperanza como familia.', 'public', 'approved', 12),
      ('Una mamá de la pastoral', 'Por mi hijo que está lejos de casa y atravesando una prueba. Que nunca le falte tu compañía.', 'public', 'approved', 9);
  end if;
end $$;
