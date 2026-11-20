/* =========================================================
   Datos de ejemplo (MODO DEMO)
   ---------------------------------------------------------
   Se cargan la primera vez y quedan guardados en el navegador.
   Puedes editarlos o borrarlos desde el panel de administración.
   ========================================================= */

import { addDays, ymd, toLocalDateTime } from './utils.js';
import { firstSundayDay } from './recurrence.js';

export const SEED_VERSION = 11;

const pad = (n) => String(n).padStart(2, '0');

/** Fecha local relativa a hoy, a una hora concreta. */
function at(dayOffset, hour = 19, minute = 0) {
  const d = addDays(new Date(), dayOffset);
  d.setHours(hour, minute, 0, 0);
  return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Próximo día de la semana indicado (0 = domingo … 5 = viernes). */
function nextWeekday(weekday, hour, minute = 0) {
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  let diff = (weekday - d.getDay() + 7) % 7;
  if (diff === 0 && d.getTime() < now.getTime()) diff = 7;
  return addDays(d, diff);
}

/** Primer domingo del mes actual o del siguiente si ya pasó. */
function firstSundayAt(hour, minute = 0) {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), firstSundayDay(now.getFullYear(), now.getMonth()), hour, minute, 0, 0);
  if (target < now) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    target = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      firstSundayDay(nextMonth.getFullYear(), nextMonth.getMonth()),
      hour,
      minute,
      0,
      0
    );
  }
  return target;
}

/** Fecha de cumpleaños dentro del mes actual (+meses). */
function birthdayDate(monthOffset, day, year = 1988) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, day);
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(day)}`;
}

function daysAgo(n, hour = 9) {
  return at(-n, hour, 0);
}

export function buildSeed() {
  const nowIso = new Date().toISOString();
  const today = new Date();
  const thisMonth = today.getMonth();
  const nextMonth = (thisMonth + 1) % 12;

  const activities = [
    {
      id: 'act_friday',
      title: 'Misa de comunidad',
      description:
        'Misa de las 6:00 p. m. de cada viernes. Una comunidad de la Pastoral Familiar se encarga del servicio litúrgico; consulta con tu comunidad la fecha que le corresponde.',
      category: 'misa',
      starts_at: toLocalDateTime(nextWeekday(5, 18, 0)),
      ends_at: toLocalDateTime(nextWeekday(5, 19, 0)),
      location: 'Templo parroquial Monte Tabor',
      responsible: 'Comunidades de la Pastoral Familiar',
      contact: '',
      capacity: 0,
      community: '',
      recurrence: 'weekly',
      recurrence_until: '',
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_sunday',
      title: 'Misa parroquial',
      description:
        'Misa parroquial del primer domingo de cada mes. Una comunidad de la Pastoral Familiar apoya el servicio litúrgico.',
      category: 'misa',
      starts_at: toLocalDateTime(firstSundayAt(17, 0)),
      ends_at: toLocalDateTime(firstSundayAt(18, 0)),
      location: 'Templo parroquial Monte Tabor',
      responsible: 'Pastoral Familiar',
      contact: '',
      capacity: 0,
      community: '',
      recurrence: 'monthly_first_sunday',
      recurrence_until: '',
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_1',
      title: 'Reunión de coordinadores',
      description:
        'Revisión de la calendarización del trimestre, confirmación de responsables por comisión y organización del retiro familiar. Traer el cronograma impreso que se compartió en el grupo.',
      category: 'reunion',
      starts_at: at(3, 19, 0),
      ends_at: at(3, 20, 30),
      location: 'Casa parroquial · Salón 2',
      responsible: 'Equipo de coordinación',
      contact: '7000-0001',
      capacity: 20,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_2',
      title: 'Taller: Los 5 lenguajes del amor',
      description:
        'Un espacio para descubrir cómo expresamos y recibimos amor en la familia. Dirigido a matrimonios y padres de familia. Habrá material impreso y refrigerio.',
      category: 'formacion',
      community: 'Comunidad San Juan Pablo II',
      starts_at: at(7, 18, 30),
      ends_at: at(7, 20, 30),
      location: 'Salón parroquial',
      responsible: 'Matrimonio Hernández',
      contact: '7000-0002',
      capacity: 40,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_3',
      title: 'Rosario en familia',
      description: 'Oramos juntos como Pastoral Familiar. Se recomienda llegar diez minutos antes. Al final compartiremos un pequeño refrigerio.',
      category: 'familiar',
      community: 'Comunidad San José',
      starts_at: at(10, 19, 0),
      ends_at: at(10, 20, 0),
      location: 'Capilla de la Virgen',
      responsible: 'Comisión de espiritualidad',
      contact: '',
      capacity: 0,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_4',
      title: 'Retiro Familiar de Adviento',
      description:
        'Un día completo para preparar el corazón en familia: reflexiones, dinámicas, confesión y misa. Incluye almuerzo. Inscripción previa con una colaboración de $5 por persona.',
      category: 'retiro',
      starts_at: at(18, 8, 0),
      ends_at: at(18, 17, 0),
      location: 'Casa de retiros El Carmelo',
      responsible: 'Pastoral Familiar',
      contact: '7000-0003',
      capacity: 80,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_5',
      title: 'Convivencia familiar de cierre de año',
      description: 'Trae un platillo para compartir y algo para la mesa. Habrá juegos para niños, música y un momento de acción de gracias.',
      category: 'celebracion',
      starts_at: at(24, 10, 0),
      ends_at: at(24, 15, 0),
      location: 'Jardín parroquial',
      responsible: 'Comisión de convivencia',
      contact: '7000-0004',
      capacity: 100,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_6',
      title: 'Colecta de víveres para familias',
      description: 'Recibimos arroz, frijol, aceite, azúcar y alimentos no perecederos. Lo recolectado se entregará a las familias acompañadas por la pastoral.',
      category: 'servicio',
      starts_at: at(31, 9, 0),
      ends_at: at(31, 13, 0),
      location: 'Atrio del templo',
      responsible: 'Comisión de servicio',
      contact: '',
      capacity: 0,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_7',
      title: 'Formación: Acompañar en el duelo',
      description: 'Segunda sesión del itinerario de formación. Abierta a coordinadores y a quienes acompañan familias en momentos difíciles.',
      category: 'formacion',
      starts_at: at(38, 18, 0),
      ends_at: at(38, 20, 0),
      location: 'Salón parroquial',
      responsible: 'P. Miguel Ángel',
      contact: '',
      capacity: 35,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_8',
      title: 'Misa de la Sagrada Familia',
      description: 'Celebración eucarística presidida por nuestro párroco. Las familias participantes llevan una vela para la bendición.',
      category: 'celebracion',
      starts_at: at(-5, 18, 0),
      ends_at: at(-5, 19, 30),
      location: 'Templo parroquial',
      responsible: 'Pastoral Familiar',
      contact: '',
      capacity: 0,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_9',
      title: 'Cine foro familiar',
      description: 'Proyección de una película sobre la vida en familia y conversatorio posterior. Palomitas incluidas.',
      category: 'familiar',
      community: 'Comunidad de Jóvenes',
      starts_at: at(-13, 17, 0),
      ends_at: at(-13, 20, 0),
      location: 'Salón parroquial',
      responsible: 'Comisión de convivencia',
      contact: '',
      capacity: 60,
      status: 'approved',
      submitted_by: '',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_10',
      title: 'Jornada de limpieza del templo',
      description: 'Propuesta de la comunidad para preparar el templo antes de la fiesta patronal. Se necesitan escobas, trapos y muchas manos.',
      category: 'servicio',
      community: 'Comunidad Santa Mónica',
      starts_at: at(12, 8, 0),
      ends_at: at(12, 12, 0),
      location: 'Templo parroquial',
      responsible: 'Ana Martínez',
      contact: '7000-0005',
      capacity: 0,
      status: 'pending',
      submitted_by: 'Ana Martínez',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'act_11',
      title: 'Noche de talentos familiares',
      description: 'Una noche para compartir los dones de nuestras familias: canto, poesía, música, teatro. Inscripciones con la comisión de convivencia.',
      category: 'celebracion',
      community: 'Comunidad de Jóvenes',
      starts_at: at(45, 18, 30),
      ends_at: at(45, 21, 0),
      location: 'Salón parroquial',
      responsible: 'Luis Rivera',
      contact: '7000-0006',
      capacity: 0,
      status: 'pending',
      submitted_by: 'Luis Rivera',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  const notices = [
    {
      id: 'not_1',
      title: 'Inscripciones abiertas: Retiro Familiar de Adviento',
      body: 'Ya puedes reservar tu lugar para el retiro del mes. La colaboración es de $5 por persona e incluye almuerzo y material.\n\nInscríbete con cualquier coordinador o desde el formulario de la web. Cupo limitado a 80 personas.',
      priority: 'importante',
      pinned: true,
      status: 'approved',
      author: 'Coordinación',
      published_at: daysAgo(1, 10),
      expires_at: at(16, 23, 59),
    },
    {
      id: 'not_2',
      title: 'Cambio de salón para el taller del sábado',
      body: 'El taller de los 5 lenguajes del amor se moverá al salón grande del segundo nivel, porque somos más familias de las previstas. Misma hora: 6:30 p. m.',
      priority: 'urgente',
      pinned: false,
      status: 'approved',
      author: 'Coordinación',
      published_at: daysAgo(1, 16),
      expires_at: at(7, 23, 59),
    },
    {
      id: 'not_3',
      title: 'Colecta de víveres: lo que más necesitamos',
      body: 'Gracias a quienes ya entregaron su donativo. Este mes hacen falta arroz, aceite y azúcar. Puedes dejarlos en la secretaría parroquial de lunes a viernes, de 8:00 a. m. a 4:00 p. m.',
      priority: 'normal',
      pinned: false,
      status: 'approved',
      author: 'Comisión de servicio',
      published_at: daysAgo(3, 9),
      expires_at: at(30, 23, 59),
    },
    {
      id: 'not_4',
      title: 'Nuevo horario de atención de la secretaría',
      body: 'A partir de este mes, la secretaría parroquial atiende de 8:00 a. m. a 4:00 p. m. Los sábados permanece cerrada. Para trámites de la pastoral, coordina directamente con tu coordinador de área.',
      priority: 'normal',
      pinned: false,
      status: 'approved',
      author: 'Secretaría parroquial',
      published_at: daysAgo(8, 11),
      expires_at: '',
    },
    {
      id: 'not_5',
      title: 'Gracias por acompañarnos en la Misa de la Sagrada Familia',
      body: 'Fue una celebración hermosa. Gracias a cada familia que llevó su vela, a los jóvenes que apoyaron en la liturgia y a quienes prepararon el refrigerio.',
      priority: 'normal',
      pinned: false,
      status: 'approved',
      author: 'Pastoral Familiar',
      published_at: daysAgo(4, 20),
      expires_at: '',
    },
  ];

  const birthdays = [
    { id: 'bday_1', name: 'María Elena de Hernández', kind: 'birthday', date: birthdayDate(0, 3, 1979), phone: '7000-0010', note: 'Coordinadora de formación' },
    { id: 'bday_2', name: 'José Antonio Rivera', kind: 'birthday', date: birthdayDate(0, 12, 1982), phone: '7000-0011', note: 'Coordinador general' },
    { id: 'bday_3', name: 'Sofía Martínez', kind: 'birthday', date: birthdayDate(0, 18, 1996), phone: '', note: 'Enlace juvenil' },
    { id: 'bday_4', name: 'Familia Hernández López', kind: 'anniversary', date: '2012-06-14', phone: '', note: 'Aniversario de matrimonio' },
    { id: 'bday_5', name: 'Carmen de López', kind: 'birthday', date: birthdayDate(0, 26, 1968), phone: '7000-0012', note: '' },
    { id: 'bday_6', name: 'Luis Fernando Rivera', kind: 'birthday', date: birthdayDate(1, 2, 1990), phone: '', note: 'Comisión de convivencia' },
    { id: 'bday_7', name: 'Ana Lucía Martínez', kind: 'birthday', date: birthdayDate(1, 9, 1985), phone: '7000-0013', note: '' },
    { id: 'bday_8', name: 'Familia Rivera Gómez', kind: 'anniversary', date: '2008-11-22', phone: '', note: 'Aniversario de matrimonio' },
    { id: 'bday_9', name: 'Padre Miguel Ángel', kind: 'birthday', date: birthdayDate(1, 21, 1972), phone: '', note: 'Asesor espiritual' },
  ];

  const resources = [
    {
      id: 'res_1',
      title: 'Guía de oración en familia',
      description: 'Oraciones breves para rezar en casa durante la semana, con espacios para escribir intenciones.',
      category: 'Espiritualidad',
      kind: 'doc',
      url: 'https://example.com/guia-oracion-familiar.pdf',
      status: 'approved',
      updated_at: nowIso,
    },
    {
      id: 'res_2',
      title: 'Plan de formación 2026',
      description: 'Los temas, fechas y responsables de los encuentros de formación del año.',
      category: 'Formación',
      kind: 'doc',
      url: 'https://example.com/plan-formacion-2026.pdf',
      status: 'approved',
      updated_at: nowIso,
    },
    {
      id: 'res_3',
      title: 'Ficha de inscripción al retiro',
      description: 'Llena tus datos y entrégala a tu coordinador junto con la colaboración.',
      category: 'Inscripciones',
      kind: 'form',
      url: 'https://example.com/inscripcion-retiro',
      status: 'approved',
      updated_at: nowIso,
    },
    {
      id: 'res_4',
      title: 'Documentos del Encuentro Matrimonial',
      description: 'Material complementario para matrimonios que participaron en el encuentro.',
      category: 'Matrimonios',
      kind: 'link',
      url: 'https://example.com/encuentro-matrimonial',
      status: 'approved',
      updated_at: nowIso,
    },
    {
      id: 'res_5',
      title: 'Cantos para nuestras celebraciones',
      description: 'Lista de reproducción con los cantos que usamos en las misas y convivencias.',
      category: 'Liturgia',
      kind: 'video',
      url: 'https://example.com/cantos',
      status: 'approved',
      updated_at: nowIso,
    },
    {
      id: 'res_6',
      title: 'Directorio de comisiones',
      description: 'Quién integra cada comisión y a quién dirigirse para cada tarea.',
      category: 'Organización',
      kind: 'doc',
      url: 'https://example.com/directorio-comisiones.pdf',
      status: 'approved',
      updated_at: nowIso,
    },
  ];

  const contacts = [
    // Equipo general: coordinación y ejes
    { id: 'con_team_1', name: 'Ricardo Varela', role: 'Coordinador general', area: 'Equipo general', phone: '7654-0943', email: '', whatsapp: '50376540943', notes: 'Coordina al equipo y acompaña los ejes.', sort: 1 },
    { id: 'con_team_2', name: 'Roberto Trejo', role: 'Coordinador del Eje de Encuentro y Convivencia', area: 'Equipo general', phone: '7745-8014', email: '', whatsapp: '50377458014', notes: 'Encuentros y convivencias de la pastoral.', sort: 2 },
    { id: 'con_team_3', name: 'Edward Minero', role: 'Coordinador del Eje de Tema Fijo', area: 'Equipo general', phone: '7616-3574', email: '', whatsapp: '50376163574', notes: 'Temas de formación.', sort: 3 },
    { id: 'con_team_4', name: 'Mariela', role: 'Coordinadora del Eje de Jóvenes', area: 'Equipo general', phone: '7931-8852', email: '', whatsapp: '50379318852', notes: 'Acompaña a los jóvenes.', sort: 4 },
    { id: 'con_team_5', name: 'Juan Trejo', role: 'Coordinador del Eje de Matrimonios', area: 'Equipo general', phone: '7856-4788', email: '', whatsapp: '50378564788', notes: 'Acompaña a los matrimonios.', sort: 5 },
    // Comunidades
    { id: 'con_com_1', name: 'Gabriela Trejo', role: 'Coordinadora de la Comunidad Santa Mónica', area: 'Comunidades', phone: '7240-0130', email: '', whatsapp: '50372400130', notes: '', sort: 10 },
    { id: 'con_com_2', name: 'Isabel Luna', role: 'Coordinadora de la Comunidad San Juan Pablo II', area: 'Comunidades', phone: '7011-3964', email: '', whatsapp: '50370113964', notes: '', sort: 11 },
    { id: 'con_com_3', name: 'Krissia Avalos', role: 'Coordinadora de la Comunidad San José', area: 'Comunidades', phone: '6955-6753', email: '', whatsapp: '50369556753', notes: '', sort: 12 },
    { id: 'con_com_4', name: 'Manuel Figueroa', role: 'Coordinador de la Comunidad San Francisco de Asís', area: 'Comunidades', phone: '7885-0684', email: '', whatsapp: '50378850684', notes: '', sort: 13 },
    { id: 'con_com_5', name: 'Samuel Avelar', role: 'Coordinador de la Comunidad de Jóvenes', area: 'Comunidades', phone: '6979-0977', email: '', whatsapp: '50369790977', notes: '', sort: 14 },
  ];

  const albums = [
    {
      id: 'alb_1',
      title: 'Retiro Familiar 2025',
      description: 'Un fin de semana para reencontrarnos como familia y con Dios.',
      date: ymd(addDays(new Date(), -95)),
      tone: 'sage',
      status: 'approved',
      photos: [
        { id: 'ph_1', caption: 'La bienvenida en la casa de retiros', url: '' },
        { id: 'ph_2', caption: 'Trabajo en grupos', url: '' },
        { id: 'ph_3', caption: 'Misa de cierre', url: '' },
        { id: 'ph_4', caption: 'La foto de todo el grupo', url: '' },
      ],
    },
    {
      id: 'alb_2',
      title: 'Convivencia de las familias',
      description: 'Juegos, comida compartida y muchas risas en el jardín parroquial.',
      date: ymd(addDays(new Date(), -48)),
      tone: 'clay',
      status: 'approved',
      photos: [
        { id: 'ph_5', caption: 'Los juegos para los niños', url: '' },
        { id: 'ph_6', caption: 'La mesa compartida', url: '' },
        { id: 'ph_7', caption: 'El equipo de cocina', url: '' },
      ],
    },
    {
      id: 'alb_3',
      title: 'Misa de la Sagrada Familia',
      description: 'Celebración con la bendición de las familias y sus velas.',
      date: ymd(addDays(new Date(), -5)),
      tone: 'gold',
      community: 'Comunidad Santa Mónica',
      status: 'approved',
      photos: [
        { id: 'ph_8', caption: 'Entrada de las familias', url: '' },
        { id: 'ph_9', caption: 'Bendición de las velas', url: '' },
        { id: 'ph_10', caption: 'El coro de la pastoral', url: '' },
      ],
    },
    {
      id: 'alb_4',
      title: 'Taller para matrimonios',
      description: 'Una mañana de formación y diálogo entre esposos.',
      date: ymd(addDays(new Date(), -32)),
      tone: 'teal',
      community: 'Comunidad San Juan Pablo II',
      status: 'approved',
      photos: [
        { id: 'ph_11', caption: 'Bienvenida del matrimonio facilitador', url: '' },
        { id: 'ph_12', caption: 'Trabajo en parejas', url: '' },
      ],
    },
    {
      id: 'alb_5',
      title: 'Noche de jóvenes',
      description: 'Música, testimonio y convivencia de la Comunidad de Jóvenes.',
      date: ymd(addDays(new Date(), -20)),
      tone: 'clay',
      community: 'Comunidad de Jóvenes',
      status: 'approved',
      photos: [
        { id: 'ph_13', caption: 'La bienvenida', url: '' },
        { id: 'ph_14', caption: 'El grupo de jóvenes', url: '' },
      ],
    },
  ];

  const prayers = [
    {
      id: 'pray_1',
      name: 'Familia Rivera Gómez',
      text: 'Te pedimos Señor por la salud de nuestra abuela, que está delicada. Danos fortaleza y esperanza como familia.',
      visibility: 'public',
      status: 'approved',
      prayers: 12,
      created_at: daysAgo(2, 8),
    },
    {
      id: 'pray_2',
      name: 'Una mamá de la pastoral',
      text: 'Por mi hijo que está lejos de casa y atravesando una prueba. Que nunca le falte tu compañía.',
      visibility: 'public',
      status: 'approved',
      prayers: 9,
      created_at: daysAgo(4, 21),
    },
    {
      id: 'pray_3',
      name: 'Matrimonio Hernández',
      text: 'Gracias por nuestro aniversario y por el camino recorrido. Ayúdanos a seguir cuidando nuestro amor cada día.',
      visibility: 'public',
      status: 'approved',
      prayers: 21,
      created_at: daysAgo(6, 19),
    },
    {
      id: 'pray_4',
      name: 'Ana Lucía',
      text: 'Por las familias que están pasando por una separación o un duelo. Que encuentren acompañamiento y paz.',
      visibility: 'public',
      status: 'approved',
      prayers: 7,
      created_at: daysAgo(9, 10),
    },
    {
      id: 'pray_5',
      name: 'Un joven de la pastoral',
      text: 'Por mi discernimiento vocacional y por la paz en mi familia.',
      visibility: 'equipo',
      status: 'approved',
      prayers: 3,
      created_at: daysAgo(1, 22),
    },
  ];

  const monthStart = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;

  // Rotación de comunidades para la misa de las 6:00 p. m. de los viernes.
  const serviceAssignments = [
    { id: 'sa_1', date: `${today.getFullYear()}-11-20`, kind: 'viernes', community: 'Comunidad San Juan Pablo II', notes: '', created_at: nowIso },
    { id: 'sa_2', date: `${today.getFullYear()}-11-27`, kind: 'viernes', community: 'Comunidad San José', notes: '', created_at: nowIso },
    { id: 'sa_3', date: `${today.getFullYear()}-12-04`, kind: 'viernes', community: 'Comunidad Santa Mónica', notes: '', created_at: nowIso },
    { id: 'sa_4', date: `${today.getFullYear()}-12-11`, kind: 'viernes', community: 'Comunidad de Jóvenes', notes: '', created_at: nowIso },
    { id: 'sa_5', date: `${today.getFullYear()}-12-18`, kind: 'viernes', community: 'Comunidad San Francisco de Asís', notes: '', created_at: nowIso },
  ];

  // Horario de ejemplo del Santísimo (domingos): una hora por comunidad.
  // Los horarios reales cambian cada mes y se editan desde el panel.
  const holyHours = [
    { id: 'hh_1', month: monthStart, community: 'Comunidad San Francisco de Asís', start_time: '07:00', end_time: '08:00', sort: 1, created_at: nowIso },
    { id: 'hh_2', month: monthStart, community: 'Comunidad de Jóvenes', start_time: '08:00', end_time: '09:00', sort: 2, created_at: nowIso },
    { id: 'hh_3', month: monthStart, community: 'Comunidad San Juan Pablo II', start_time: '09:00', end_time: '10:00', sort: 3, created_at: nowIso },
    { id: 'hh_4', month: monthStart, community: 'Comunidad Santa Mónica', start_time: '10:00', end_time: '11:00', sort: 4, created_at: nowIso },
    { id: 'hh_5', month: monthStart, community: 'Comunidad San José', start_time: '11:00', end_time: '12:00', sort: 5, created_at: nowIso },
  ];

  return {
    seedVersion: SEED_VERSION,
    activities,
    notices,
    birthdays,
    resources,
    contacts,
    albums,
    prayers,
    holyHours,
    serviceAssignments,
    shares: [],
    settings: {},
  };
}
