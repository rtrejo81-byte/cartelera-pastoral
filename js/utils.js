/* =========================================================
   Utilidades: DOM, texto, fechas en español y exportaciones
   ========================================================= */

import { MONTHS, WEEKDAYS, TIMEZONE } from './config.js';

/* ---------------- Texto y seguridad ---------------- */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripTags(value) {
  return String(value ?? '').replace(/<[^>]*>/g, '');
}

export function truncate(value, max = 120) {
  const s = String(value ?? '').trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function slug(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

/* ---------------- DOM ---------------- */
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function on(root, event, selector, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

/* ---------------- Fechas ---------------- */
/** Interpreta "2026-11-21" o "2026-11-21T19:30" como hora LOCAL. */
export function parseLocal(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getTime());
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0, 0);
}

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function daysBetween(a, b) {
  const ms = startOfDay(b) - startOfDay(a);
  return Math.round(ms / 86400000);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Matriz de 6 semanas (lunes a domingo) que cubre el mes indicado. */
export function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = addDays(first, -offset);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) row.push(addDays(start, w * 7 + d));
    weeks.push(row);
  }
  return weeks;
}

export function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toDateInput(value) {
  const d = parseLocal(value);
  return d ? ymd(d) : '';
}

export function toDateTimeInput(value) {
  const d = parseLocal(value);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${ymd(d)}T${hh}:${mm}`;
}

export function toTimeInput(value) {
  const d = parseLocal(value);
  if (!d) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Fecha y hora local en formato "YYYY-MM-DDTHH:mm". */
export function toLocalDateTime(value) {
  const d = value instanceof Date ? value : parseLocal(value);
  if (!d) return '';
  return `${ymd(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Formatea una hora suelta "07:00" o "07:00:00" como "7:00 a. m.". */
export function fmtClock(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  const h24 = Number(match[1]);
  const mm = match[2];
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}

export function fmtClockRange(start, end) {
  const a = fmtClock(start);
  const b = fmtClock(end);
  if (!a) return b;
  if (!b) return a;
  return `${a} – ${b}`;
}

export function fmtTime(value) {
  const d = parseLocal(value);
  if (!d) return '';
  const h24 = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}

export function fmtDateLong(value) {
  const d = parseLocal(value);
  if (!d) return '';
  const wd = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()];
  return `${wd} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function fmtDateMedium(value) {
  const d = parseLocal(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function fmtDateShort(value) {
  const d = parseLocal(value);
  if (!d) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function fmtMonthYear(date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function weekdayShort(date) {
  return WEEKDAYS[(date.getDay() + 6) % 7];
}

export function fmtRange(start, end) {
  const s = parseLocal(start);
  const e = parseLocal(end);
  if (!s) return '';
  if (!e || sameDay(s, e)) return `${fmtDateLong(s)} · ${fmtTime(s)}${e ? ' a ' + fmtTime(e) : ''}`;
  return `${fmtDateMedium(s)} ${fmtTime(s)} — ${fmtDateMedium(e)} ${fmtTime(e)}`;
}

export function relativeLabel(value) {
  const d = parseLocal(value);
  if (!d) return '';
  const diff = daysBetween(today(), d);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff > 1 && diff <= 6) return `En ${diff} días`;
  if (diff < -1) return `Hace ${Math.abs(diff)} días`;
  return fmtDateShort(d);
}

export function isPast(value) {
  const d = parseLocal(value);
  if (!d) return false;
  return d.getTime() < Date.now() - 1000 * 60 * 60 * 3;
}

/** Día del año (1-366), para ordenar cumpleaños. */
export function dayOfYear(month, day) {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let i = 0; i < month - 1; i++) total += days[i];
  return total + day;
}

/* ---------------- Números y textos auxiliares ---------------- */
export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function sortBy(list, key, dir = 1) {
  return [...list].sort((a, b) => {
    const va = typeof key === 'function' ? key(a) : a[key];
    const vb = typeof key === 'function' ? key(b) : b[key];
    if (va === vb) return 0;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    return va > vb ? dir : -dir;
  });
}

export function groupBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}

export function uniqueBy(list, keyFn) {
  const seen = new Set();
  return list.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/* ---------------- Exportar a calendario ---------------- */
function icsEscape(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function icsDate(value) {
  const d = parseLocal(value);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

export function buildICS(activities, calendarName = 'Pastoral Familiar') {
  const stamp = (() => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
  })();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pastoral Familiar//Cartelera//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    `X-WR-TIMEZONE:${TIMEZONE}`,
  ];

  for (const a of activities) {
    const start = parseLocal(a.starts_at);
    if (!start) continue;
    const end = parseLocal(a.ends_at) || new Date(start.getTime() + 90 * 60000);
    const uidBase = a.occurrence_date ? `${a.id}-${a.occurrence_date}` : a.id;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uidBase}@pastoral-familiar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TIMEZONE}:${icsDate(a.starts_at)}`,
      `DTEND;TZID=${TIMEZONE}:${icsDate(end)}`,
      `SUMMARY:${icsEscape(a.title)}`,
      `DESCRIPTION:${icsEscape(a.description || '')}`,
      a.location ? `LOCATION:${icsEscape(a.location)}` : '',
      a.category ? `CATEGORIES:${icsEscape(a.category)}` : '',
      `STATUS:${a.status === 'approved' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}

export function downloadFile(filename, content, mime = 'text/calendar;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function googleCalendarUrl(activity) {
  const start = parseLocal(activity.starts_at);
  if (!start) return '#';
  const end = parseLocal(activity.ends_at) || new Date(start.getTime() + 90 * 60000);
  const fmt = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  };
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title || '',
    dates: `${fmt(start)}/${fmt(end)}`,
    ctz: TIMEZONE,
    details: activity.description || '',
    location: activity.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function whatsappUrl(phone, message = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telUrl(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

/* ---------------- Imágenes ---------------- */
/** Reduce una imagen elegida por el usuario para que quepa en el navegador. */
export function compressImage(file, maxSide = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo abrir la imagen.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}
