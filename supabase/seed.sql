-- ============================================================
--  Contenido inicial OPCIONAL para Supabase
--  Ejecútalo solo si quieres que la web no empiece vacía.
--  No duplica registros: si ya hay actividades, no hace nada.
--  Cambia nombres, teléfonos y enlaces por los reales.
-- ============================================================

do $$
begin
  if not exists (select 1 from public.activities) then
    insert into public.activities
      (title, description, category, starts_at, ends_at, location, responsible, contact, capacity, status)
    values
      ('Reunión de coordinadores',
       'Revisión de la calendarización y organización del próximo retiro.',
       'reunion', (now() + interval '3 days')::timestamp, (now() + interval '3 days' + interval '90 minutes')::timestamp,
       'Casa parroquial · Salón 2', 'Equipo de coordinación', '7000-0001', 20, 'approved'),
      ('Taller: Los 5 lenguajes del amor',
       'Un espacio para descubrir cómo expresamos y recibimos amor en la familia.',
       'formacion', (now() + interval '7 days')::timestamp, (now() + interval '7 days' + interval '2 hours')::timestamp,
       'Salón parroquial', 'Matrimonio Hernández', '7000-0002', 40, 'approved'),
      ('Rosario en familia',
       'Oramos juntos como Pastoral Familiar. Al final compartimos un refrigerio.',
       'familiar', (now() + interval '10 days')::timestamp, (now() + interval '10 days' + interval '1 hour')::timestamp,
       'Capilla de la Virgen', 'Comisión de espiritualidad', '', 0, 'approved'),
      ('Retiro Familiar',
       'Un día completo para preparar el corazón en familia: reflexiones, dinámicas y misa.',
       'retiro', (now() + interval '18 days')::timestamp, (now() + interval '18 days' + interval '9 hours')::timestamp,
       'Casa de retiros El Carmelo', 'Pastoral Familiar', '7000-0003', 80, 'approved');

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
      ('José Antonio Rivera', 'Coordinador general', 'Coordinación', '7000-0011', '50370000011', 'coordinacion@ejemplo.org', '', 1),
      ('María Elena de Hernández', 'Coordinadora de formación', 'Formación', '7000-0010', '50370000010', 'formacion@ejemplo.org', '', 2),
      ('Ana Lucía Martínez', 'Secretaria', 'Secretaría', '7000-0013', '50370000013', 'secretaria@ejemplo.org', 'Inscripciones y listas de asistencia.', 3);

    insert into public.resources (title, description, category, kind, url, status)
    values
      ('Guía de oración en familia', 'Oraciones breves para rezar en casa durante la semana.', 'Espiritualidad', 'doc', 'https://example.com/guia-oracion.pdf', 'approved'),
      ('Plan de formación', 'Los temas, fechas y responsables de los encuentros del año.', 'Formación', 'doc', 'https://example.com/plan-formacion.pdf', 'approved'),
      ('Ficha de inscripción al retiro', 'Llena tus datos y entrégala a tu coordinador.', 'Inscripciones', 'form', 'https://example.com/inscripcion', 'approved');

    insert into public.albums (title, description, date, tone, status, photos)
    values
      ('Retiro Familiar', 'Un fin de semana para reencontrarnos como familia y con Dios.',
       current_date - interval '40 days', 'sage', 'approved',
       '[{"id":"ph1","caption":"La bienvenida","url":""},{"id":"ph2","caption":"Trabajo en grupos","url":""},{"id":"ph3","caption":"Misa de cierre","url":""}]'::jsonb),
      ('Convivencia de las familias', 'Juegos, comida compartida y muchas risas.',
       current_date - interval '18 days', 'clay', 'approved',
       '[{"id":"ph4","caption":"Los juegos para los niños","url":""},{"id":"ph5","caption":"La mesa compartida","url":""}]'::jsonb);

    insert into public.prayer_requests (name, text, visibility, status, prayers)
    values
      ('Familia Rivera Gómez', 'Te pedimos Señor por la salud de nuestra abuela. Danos fortaleza y esperanza como familia.', 'public', 'approved', 12),
      ('Una mamá de la pastoral', 'Por mi hijo que está lejos de casa y atravesando una prueba. Que nunca le falte tu compañía.', 'public', 'approved', 9);
  end if;
end $$;
