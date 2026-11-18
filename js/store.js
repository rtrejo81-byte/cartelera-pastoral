/* =========================================================
   Capa de datos
   ---------------------------------------------------------
   Dos modos:
   · demo  → guarda en el navegador (localStorage). Ideal para
             probar y para mostrar sin configurar nada.
   · cloud → Supabase (Postgres + Auth + Storage), con cambios
             en vivo entre dispositivos.
   La interfaz pública es la misma en ambos modos.
   ========================================================= */

import { SUPABASE } from './config.js';
import { buildSeed, SEED_VERSION } from './seed.js';
import { compressImage, uid, parseLocal, addDays } from './utils.js';
import { expandActivity } from './recurrence.js';

const LS_KEY = 'pf_cartelera_demo_v1';
const SS_KEY = 'pf_cartelera_demo_session';

const TABLE = {
  activities: 'activities',
  notices: 'notices',
  birthdays: 'birthdays',
  resources: 'resources',
  contacts: 'contacts',
  albums: 'albums',
  prayers: 'prayer_requests',
  holyHours: 'holy_hours',
};

const COLLECTIONS = Object.keys(TABLE);

const state = {
  mode: 'demo',
  cloudError: '',
  ready: false,
  user: null,
  profile: null,
  data: {
    activities: [],
    notices: [],
    birthdays: [],
    resources: [],
    contacts: [],
    albums: [],
    prayers: [],
    holyHours: [],
  },
  settings: {},
  loading: false,
};

let client = null;
let channel = null;
const listeners = new Set();
let saveTimer = null;

/* ---------------- Suscripción a cambios ---------------- */
function emit(type = 'change', detail = {}) {
  for (const fn of listeners) {
    try {
      fn(type, detail);
    } catch (err) {
      console.error('[store] listener', err);
    }
  }
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ---------------- MODO DEMO ---------------- */
function loadDemoRaw() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.seedVersion !== SEED_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistDemo() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const payload = {
      seedVersion: SEED_VERSION,
      activities: state.data.activities,
      notices: state.data.notices,
      birthdays: state.data.birthdays,
      resources: state.data.resources,
      contacts: state.data.contacts,
      albums: state.data.albums,
      prayers: state.data.prayers,
      holyHours: state.data.holyHours,
      settings: state.settings,
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('[store] no se pudo guardar en el navegador', err);
      emit('error', {
        message: 'El almacenamiento del navegador está lleno. Borra fotos antiguas o conecta Supabase.',
      });
    }
  }, 60);
}

function initDemo() {
  const saved = loadDemoRaw();
  const seed = saved || buildSeed();
  for (const name of COLLECTIONS) state.data[name] = Array.isArray(seed[name]) ? seed[name] : [];
  state.settings = seed.settings || {};
  state.mode = 'demo';
  state.ready = true;

  try {
    const session = JSON.parse(sessionStorage.getItem(SS_KEY) || 'null');
    if (session) {
      state.user = { id: 'demo-user', email: session.email };
      state.profile = { id: 'demo-user', full_name: session.name || 'Coordinador de prueba', role: 'admin', demo: true };
    }
  } catch {
    /* sin sesión */
  }

  if (!saved) persistDemo();
}

function demoUpsert(name, row) {
  const list = state.data[name] || (state.data[name] = []);
  const idx = list.findIndex((item) => item.id === row.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...row };
  else list.unshift(row);
  persistDemo();
}

/* ---------------- MODO CLOUD (Supabase) ---------------- */
export function isCloudConfigured() {
  return Boolean(SUPABASE.url && SUPABASE.anonKey);
}

async function initCloud() {
  const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  client = mod.createClient(SUPABASE.url, SUPABASE.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  state.mode = 'cloud';

  const { data } = await client.auth.getSession();
  if (data?.session?.user) {
    state.user = { id: data.session.user.id, email: data.session.user.email };
    await loadProfile();
  }

  await refresh();

  client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      state.user = null;
      state.profile = null;
    } else if (session?.user) {
      state.user = { id: session.user.id, email: session.user.email };
      await loadProfile();
    }
    emit('auth');
  });

  channel = client
    .channel('pastoral-familiar-realtime')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      refresh().catch((err) => console.warn('[store] realtime', err));
    })
    .subscribe();
}

async function loadProfile() {
  if (!state.user || !client) return;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('id', state.user.id)
      .maybeSingle();
    if (error) throw error;
    state.profile = data || { id: state.user.id, full_name: state.user.email, role: 'viewer' };
  } catch (err) {
    console.warn('[store] perfil', err);
    state.profile = { id: state.user.id, full_name: state.user.email, role: 'viewer' };
  }
}

async function fetchTable(name) {
  const { data, error } = await client.from(TABLE[name]).select('*');
  if (error) throw new Error(`No se pudo leer "${name}": ${error.message}`);
  return data || [];
}

async function fetchSettings() {
  const { data, error } = await client.from('settings').select('key, value');
  if (error) {
    if (error.code === '42P01') return {};
    throw error;
  }
  const out = {};
  for (const row of data || []) out[row.key] = row.value;
  return out;
}

async function refresh() {
  if (state.mode !== 'cloud' || !client) return;
  state.loading = true;
  try {
    const [activities, notices, birthdays, resources, contacts, albums, prayers, holyHours, settings] = await Promise.all([
      fetchTable('activities'),
      fetchTable('notices'),
      fetchTable('birthdays'),
      fetchTable('resources'),
      fetchTable('contacts'),
      fetchTable('albums'),
      fetchTable('prayers'),
      fetchTable('holyHours'),
      fetchSettings(),
    ]);
    state.data = { activities, notices, birthdays, resources, contacts, albums, prayers, holyHours };
    state.settings = settings || {};
    emit('change', { source: 'cloud' });
  } catch (err) {
    console.error('[store] refresh', err);
    emit('error', { message: err.message });
  } finally {
    state.loading = false;
    state.ready = true;
    emit('ready');
  }
}

/* ---------------- Arranque ---------------- */
export async function boot() {
  if (isCloudConfigured()) {
    try {
      await initCloud();
      state.ready = true;
      return state.mode;
    } catch (err) {
      console.error('[store] fallo al conectar Supabase', err);
      state.cloudError = err?.message || 'No se pudo conectar con Supabase.';
      state.mode = 'demo';
    }
  }
  initDemo();
  return state.mode;
}

/* ---------------- Lectura ---------------- */
export function all(name) {
  return state.data[name] || [];
}

export function byId(name, id) {
  return all(name).find((item) => item.id === id) || null;
}

function sortActivities(list) {
  return [...list].sort((a, b) => {
    const da = parseLocal(a.starts_at);
    const db = parseLocal(b.starts_at);
    return (da?.getTime() || 0) - (db?.getTime() || 0);
  });
}

export function publicList(name) {
  const list = all(name);
  const now = Date.now();
  switch (name) {
    case 'activities':
      return sortActivities(list.filter((i) => !i.status || i.status === 'approved'));
    case 'notices': {
      const visible = list.filter((i) => (!i.status || i.status === 'approved'));
      const active = visible.filter((i) => {
        if (!i.expires_at) return true;
        const exp = parseLocal(i.expires_at);
        return !exp || exp.getTime() > now - 86400000;
      });
      return active.sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
        return (parseLocal(b.published_at)?.getTime() || 0) - (parseLocal(a.published_at)?.getTime() || 0);
      });
    }
    case 'birthdays':
      return [...list].sort((a, b) => {
        const da = parseLocal(a.date) || new Date(0);
        const db = parseLocal(b.date) || new Date(0);
        const ka = (da.getMonth() + 1) * 100 + da.getDate();
        const kb = (db.getMonth() + 1) * 100 + db.getDate();
        return ka - kb;
      });
    case 'resources':
      return [...list]
        .filter((i) => !i.status || i.status === 'approved')
        .sort((a, b) => String(a.category).localeCompare(String(b.category), 'es'));
    case 'contacts':
      return [...list].sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99));
    case 'albums':
      return [...list]
        .filter((i) => !i.status || i.status === 'approved')
        .sort((a, b) => (parseLocal(b.date)?.getTime() || 0) - (parseLocal(a.date)?.getTime() || 0));
    case 'prayers':
      return [...list]
        .filter((i) => i.status === 'approved' && i.visibility === 'public')
        .sort((a, b) => (parseLocal(b.created_at)?.getTime() || 0) - (parseLocal(a.created_at)?.getTime() || 0));
    default:
      return [...list];
  }
}

/** Todos los registros (incluye pendientes). Solo para el panel. */
export function every(name) {
  if (name === 'activities') return sortActivities(all(name));
  if (name === 'birthdays') return publicList('birthdays');
  if (name === 'contacts') return publicList('contacts');
  return all(name);
}

export function pendingCount() {
  const count = (name) => all(name).filter((i) => i.status === 'pending').length;
  return count('activities') + count('notices') + count('prayers');
}

/** Actividades próximas (incluye las fechas recurrentes), primeras `limit`. */
export function upcoming(limit = 5) {
  const now = new Date(Date.now() - 3 * 3600 * 1000);
  const end = addDays(now, 180);
  return sortActivities(
    all('activities')
      .filter((a) => !a.status || a.status === 'approved')
      .flatMap((a) => expandActivity(a, now, end))
      .filter((a) => {
        const d = parseLocal(a.starts_at);
        return d && d >= now;
      })
  ).slice(0, limit);
}

export function nextActivity() {
  return upcoming(1)[0] || null;
}

/** Próximas fechas sin repetir la misma actividad recurrente. */
export function upcomingUnique(limit = 5) {
  const seen = new Set();
  const out = [];
  for (const item of upcoming(200)) {
    const key = item.occurrence_of || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function activitiesOn(date) {
  const iso = date instanceof Date ? date : parseLocal(date);
  if (!iso) return [];
  const start = new Date(iso.getFullYear(), iso.getMonth(), iso.getDate(), 0, 0, 0);
  const end = new Date(iso.getFullYear(), iso.getMonth(), iso.getDate(), 23, 59, 59);
  return activitiesInRange(start, end);
}

export function activitiesInRange(start, end) {
  const expanded = all('activities')
    .filter((a) => !a.status || a.status === 'approved')
    .flatMap((a) => expandActivity(a, start, end));
  return sortActivities(expanded);
}

/** Horarios del Santísimo de un mes ("YYYY-MM"). */
export function holyHoursFor(monthKey) {
  return all('holyHours')
    .filter((item) => String(item.month || '').slice(0, 7) === monthKey)
    .sort(
      (a, b) =>
        (a.sort ?? 0) - (b.sort ?? 0) ||
        String(a.start_time || '').localeCompare(String(b.start_time || ''))
    );
}

/** Cumpleaños del mes actual (o del mes indicado 0-11). */
export function birthdaysInMonth(month = new Date().getMonth()) {
  return publicList('birthdays').filter((b) => {
    const d = parseLocal(b.date);
    return d && d.getMonth() === month;
  });
}

/* ---------------- Escritura ---------------- */
function cleanPayload(row, { forInsert = false } = {}) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (forInsert && key === 'id') continue;
    if (key === 'created_at' && !forInsert) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

export async function create(name, row) {
  const nowIso = new Date().toISOString();
  const payload = cleanPayload({ ...row, created_at: row.created_at || nowIso }, { forInsert: true });

  if (state.mode === 'demo') {
    const record = { ...payload, id: row.id || uid(name) };
    demoUpsert(name, record);
    emit('change', { source: 'demo', name, action: 'create' });
    return record;
  }

  const { data, error } = await client.from(TABLE[name]).insert(payload).select().single();
  if (error) throw new Error(friendlyDbError(error, name));
  await refresh();
  return data;
}

export async function update(name, id, patch) {
  const payload = cleanPayload(patch);
  if (state.mode === 'demo') {
    const current = byId(name, id);
    if (!current) throw new Error('No se encontró el registro.');
    demoUpsert(name, { ...current, ...payload });
    emit('change', { source: 'demo', name, action: 'update' });
    return { ...current, ...payload };
  }

  const { data, error } = await client.from(TABLE[name]).update(payload).eq('id', id).select().single();
  if (error) throw new Error(friendlyDbError(error, name));
  await refresh();
  return data;
}

export async function remove(name, id) {
  if (state.mode === 'demo') {
    state.data[name] = all(name).filter((item) => item.id !== id);
    persistDemo();
    emit('change', { source: 'demo', name, action: 'remove' });
    return true;
  }
  const { error } = await client.from(TABLE[name]).delete().eq('id', id);
  if (error) throw new Error(friendlyDbError(error, name));
  await refresh();
  return true;
}

export async function setStatus(name, id, status) {
  return update(name, id, { status });
}

export async function incrementPrayer(id) {
  const row = byId('prayers', id);
  if (!row) return;
  if (state.mode === 'demo') {
    await update('prayers', id, { prayers: (row.prayers || 0) + 1 });
    return;
  }
  const { error } = await client.rpc('increment_prayer', { prayer_id: id });
  if (error) {
    await update('prayers', id, { prayers: (row.prayers || 0) + 1 });
    return;
  }
  await refresh();
}

/* ---------------- Ajustes del sitio ---------------- */
export async function saveSettings(patch) {
  state.settings = { ...state.settings, ...patch };

  if (state.mode === 'demo') {
    persistDemo();
    emit('change', { source: 'demo', name: 'settings' });
    return state.settings;
  }

  const rows = Object.entries(patch).map(([key, value]) => ({ key, value }));
  const { error } = await client.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(friendlyDbError(error, 'settings'));
  await refresh();
  return state.settings;
}

/* ---------------- Imágenes ---------------- */
export async function uploadImage(file) {
  if (!file) throw new Error('No seleccionaste ninguna imagen.');

  if (state.mode === 'demo') {
    return compressImage(file, 1400, 0.82);
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `galeria/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await client.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    throw new Error(
      'No se pudo subir la imagen. Revisa que el bucket "media" exista y sea público (ver docs/GUIA-SUPABASE.md).'
    );
  }
  const { data } = client.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- Autenticación ---------------- */
const ROLE_LABELS = {
  admin: 'Administrador',
  editor: 'Coordinador',
  coordinador: 'Coordinador',
  viewer: 'Solo lectura',
};

export function roleLabel() {
  return ROLE_LABELS[state.profile?.role] || 'Invitado';
}

export function canEdit() {
  const role = state.profile?.role;
  return role === 'admin' || role === 'editor' || role === 'coordinador';
}

export function isAuthenticated() {
  return Boolean(state.user);
}

export async function signIn(email, password) {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail || !password) {
    return { ok: false, error: 'Escribe tu correo y contraseña.' };
  }

  if (state.mode === 'demo') {
    state.user = { id: 'demo-user', email: cleanEmail };
    state.profile = {
      id: 'demo-user',
      full_name: cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      role: 'admin',
      demo: true,
    };
    sessionStorage.setItem(SS_KEY, JSON.stringify({ email: cleanEmail, name: state.profile.full_name }));
    emit('auth');
    return { ok: true };
  }

  const { error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }
  await loadProfile();
  await refresh();
  emit('auth');
  return { ok: true };
}

export async function signOut() {
  if (state.mode === 'demo') {
    state.user = null;
    state.profile = null;
    sessionStorage.removeItem(SS_KEY);
    emit('auth');
    return;
  }
  await client.auth.signOut();
  state.user = null;
  state.profile = null;
  emit('auth');
}

function translateAuthError(message = '') {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Tu correo aún no está confirmado. Revisa tu bandeja.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  return message || 'No se pudo iniciar sesión.';
}

function friendlyDbError(error, name) {
  if (error.code === '42501' || /row-level security/i.test(error.message)) {
    return 'No tienes permiso para esta acción. Inicia sesión como coordinador.';
  }
  if (error.code === 'PGRST205' || error.code === '42P01') {
    return `La tabla "${TABLE[name] || name}" no existe. Ejecuta supabase/schema.sql en tu proyecto.`;
  }
  return error.message || 'Ocurrió un error al guardar.';
}

/* ---------------- Demo ---------------- */
export async function resetDemo() {
  if (state.mode !== 'demo') throw new Error('Solo disponible en modo demo.');
  localStorage.removeItem(LS_KEY);
  const seed = buildSeed();
  for (const name of COLLECTIONS) state.data[name] = seed[name] || [];
  state.settings = seed.settings || {};
  persistDemo();
  emit('change', { source: 'demo', reset: true });
}

export const store = {
  get mode() { return state.mode; },
  get cloudError() { return state.cloudError; },
  get ready() { return state.ready; },
  get loading() { return state.loading; },
  get user() { return state.user; },
  get profile() { return state.profile; },
  get settings() { return state.settings; },
  get data() { return state.data; },
  all,
  byId,
  every,
  publicList,
  pendingCount,
  upcoming,
  nextActivity,
  upcomingUnique,
  activitiesOn,
  activitiesInRange,
  birthdaysInMonth,
  holyHoursFor,
  create,
  update,
  remove,
  setStatus,
  incrementPrayer,
  saveSettings,
  uploadImage,
  signIn,
  signOut,
  canEdit,
  isAuthenticated,
  roleLabel,
  resetDemo,
  refresh,
};
