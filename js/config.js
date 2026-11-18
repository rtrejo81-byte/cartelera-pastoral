/* =========================================================
   Configuración del sitio
   ---------------------------------------------------------
   Todo lo que normalmente se edita a mano está aquí.
   Si más adelante conectas Supabase, estos valores siguen
   siendo los predeterminados y el panel puede sobrescribirlos.
   ========================================================= */

/**
 * Conexión a Supabase (opcional).
 * 1. Crea un proyecto gratis en https://supabase.com
 * 2. Ejecuta el archivo supabase/schema.sql en el editor SQL
 * 3. Pega aquí la URL del proyecto y la clave "anon public"
 * Mientras estén vacías, la web funciona en MODO DEMO local.
 */
export const SUPABASE = {
  url: '',
  anonKey: '',
};

/** Marca y textos base */
export const SITE = {
  name: 'Pastoral Familiar',
  shortName: 'Pastoral Familiar',
  parish: 'Parroquia Monte Tabor',
  city: 'Ciudad Merliot',
  country: 'El Salvador',
  heroTitle: 'Caminemos juntos como',
  heroAccent: 'familia',
  heroText:
    'Un solo lugar para encontrarnos: el calendario de nuestras actividades, los avisos importantes y todo lo que nuestra Pastoral Familiar de Monte Tabor va construyendo día con día.',
  email: '',
  phone: '',
  whatsapp: '',
  address: 'Ciudad Merliot, Santa Tecla, La Libertad',
  meetingSchedule: 'Misa de comunidad: viernes, 6:00 p. m. · Misa parroquial: primer domingo del mes',
  footerNote: 'Ante todo, amar y servir',
  instagram: '',
  facebook: '',
  youtube: '',
};

/** Categorías de actividades: color de texto y fondo suave */
export const CATEGORIES = [
  { id: 'familiar', label: 'Familiar', color: '#1F4D42', bg: '#E3EEE8' },
  { id: 'formacion', label: 'Formación', color: '#9A6B23', bg: '#F9EED6' },
  { id: 'retiro', label: 'Retiro', color: '#9E4B29', bg: '#F8E6DB' },
  { id: 'celebracion', label: 'Celebración', color: '#9C3F63', bg: '#F9E4EC' },
  { id: 'misa', label: 'Misa', color: '#8A5A2B', bg: '#F7EBDD' },
  { id: 'servicio', label: 'Servicio', color: '#2C6673', bg: '#E3EFF2' },
  { id: 'reunion', label: 'Reunión', color: '#556B67', bg: '#E9EDEA' },
];

/** Secciones del sitio. `nav: true` las muestra en el menú principal. */
export const SECTIONS = [
  { id: 'inicio', path: '/', label: 'Inicio', icon: 'home', nav: true },
  { id: 'calendario', path: '/calendario', label: 'Calendario', icon: 'calendar', nav: true },
  { id: 'avisos', path: '/avisos', label: 'Avisos', icon: 'megaphone', nav: true },
  { id: 'comunidad', path: '/comunidad', label: 'Comunidad', icon: 'users', nav: true },
  { id: 'recursos', path: '/recursos', label: 'Recursos', icon: 'book', nav: true },
  { id: 'cumpleanos', path: '/cumpleanos', label: 'Cumpleaños', icon: 'cake', nav: false },
  { id: 'galeria', path: '/galeria', label: 'Galería', icon: 'image', nav: false },
  { id: 'santisimo', path: '/santisimo', label: 'Santísimo', icon: 'sun', nav: false },
  { id: 'contactos', path: '/contactos', label: 'Contactos', icon: 'phone', nav: false },
  { id: 'oracion', path: '/oracion', label: 'Oración', icon: 'heart', nav: false },
  { id: 'proponer', path: '/proponer', label: 'Proponer actividad', icon: 'plus', nav: false },
];

/** Pestañas del panel de administración */
export const ADMIN_TABS = [
  { id: 'resumen', label: 'Resumen', icon: 'grid' },
  { id: 'actividades', label: 'Actividades', icon: 'calendar' },
  { id: 'avisos', label: 'Avisos', icon: 'megaphone' },
  { id: 'cumpleanos', label: 'Cumpleaños', icon: 'cake' },
  { id: 'santisimo', label: 'Santísimo', icon: 'sun' },
  { id: 'recursos', label: 'Recursos', icon: 'book' },
  { id: 'galeria', label: 'Galería', icon: 'image' },
  { id: 'contactos', label: 'Contactos', icon: 'phone' },
  { id: 'oracion', label: 'Oración', icon: 'heart' },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
];

/** Estados posibles de un contenido enviado por la comunidad */
export const STATUS = {
  pending: { label: 'Pendiente', badge: 'badge-gold' },
  approved: { label: 'Publicado', badge: 'badge-ok' },
  rejected: { label: 'Rechazado', badge: 'badge-danger' },
  archived: { label: 'Archivado', badge: 'badge' },
};

export const PRIORITIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'importante', label: 'Importante' },
  { id: 'urgente', label: 'Urgente' },
];

export const RESOURCE_KINDS = [
  { id: 'doc', label: 'Documento' },
  { id: 'link', label: 'Enlace' },
  { id: 'form', label: 'Formulario' },
  { id: 'video', label: 'Video' },
];

export const BIRTHDAY_KINDS = [
  { id: 'birthday', label: 'Cumpleaños' },
  { id: 'anniversary', label: 'Aniversario' },
];

/** Zona horaria para exportar al calendario del teléfono */
export const TIMEZONE = 'America/El_Salvador';

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
