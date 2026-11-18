/* =========================================================
   Actividades recurrentes
   ---------------------------------------------------------
   Una actividad puede repetirse cada semana o el primer
   domingo de cada mes. El calendario "expande" la regla en
   fechas concretas dentro del rango que se va a mostrar.
   ========================================================= */

import { parseLocal, ymd, addDays, startOfDay, toLocalDateTime } from './utils.js';

export const RECURRENCES = [
  { id: 'none', label: 'No se repite' },
  { id: 'weekly', label: 'Cada semana' },
  { id: 'monthly_first_sunday', label: 'Primer domingo de cada mes' },
];

export function recurrenceLabel(value) {
  const found = RECURRENCES.find((item) => item.id === (value || 'none'));
  return found ? found.label : 'No se repite';
}

export function isRecurring(value) {
  return Boolean(value) && value !== 'none';
}

/** Día del mes del primer domingo (1-7). */
export function firstSundayDay(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  return 1 + ((7 - first.getDay()) % 7);
}

/**
 * Devuelve las fechas concretas de una actividad dentro de un rango.
 * Cada resultado conserva los datos de la actividad y agrega
 * `occurrence_of` y `occurrence_date`.
 */
export function expandActivity(activity, rangeStart, rangeEnd) {
  const base = parseLocal(activity.starts_at);
  if (!base || !rangeStart || !rangeEnd) return [];

  const baseEnd = parseLocal(activity.ends_at);
  const duration = baseEnd ? Math.max(0, baseEnd.getTime() - base.getTime()) : 90 * 60000;
  const recurrence = activity.recurrence || 'none';
  const until = parseLocal(activity.recurrence_until);
  const untilEnd = until
    ? new Date(until.getFullYear(), until.getMonth(), until.getDate(), 23, 59, 59)
    : null;

  const make = (date) => {
    const start = new Date(date);
    const end = new Date(start.getTime() + duration);
    return {
      ...activity,
      occurrence_of: activity.id,
      occurrence_date: ymd(start),
      starts_at: toLocalDateTime(start),
      ends_at: activity.ends_at ? toLocalDateTime(end) : null,
    };
  };

  if (recurrence === 'none') {
    return base >= rangeStart && base <= rangeEnd ? [make(base)] : [];
  }

  const limit = untilEnd && untilEnd < rangeEnd ? untilEnd : rangeEnd;
  const occurrences = [];

  if (recurrence === 'weekly') {
    let cursor = new Date(base);
    if (cursor < rangeStart) {
      const weeks = Math.floor(
        (startOfDay(rangeStart).getTime() - startOfDay(cursor).getTime()) / (7 * 86400000)
      );
      cursor = addDays(cursor, Math.max(0, weeks) * 7);
      while (cursor < rangeStart) cursor = addDays(cursor, 7);
    }
    let guard = 0;
    while (cursor <= limit && guard < 520) {
      occurrences.push(make(cursor));
      cursor = addDays(cursor, 7);
      guard++;
    }
    return occurrences;
  }

  if (recurrence === 'monthly_first_sunday') {
    const lastYear = limit.getFullYear();
    for (let year = rangeStart.getFullYear(); year <= lastYear; year++) {
      for (let month = 0; month < 12; month++) {
        const day = firstSundayDay(year, month);
        const occurrence = new Date(year, month, day, base.getHours(), base.getMinutes(), 0, 0);
        if (occurrence < base || occurrence < rangeStart || occurrence > limit) continue;
        occurrences.push(make(occurrence));
      }
    }
  }

  return occurrences;
}
