/* =========================================================
   Calendario: vista mensual, agenda, filtros y exportación
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { CATEGORIES, COMMUNITIES, MONTHS, WEEKDAYS } from '../config.js';
import { pageHead, emptyState, openModal, closeModal, categoryMeta, categoryBadge, site, toast } from '../ui.js';
import {
  esc, parseLocal, fmtTime, fmtDateLong, fmtMonthYear, monthMatrix, startOfMonth,
  endOfMonth, addMonths, sameDay, today, ymd, buildICS, downloadFile,
  pluralize,
} from '../utils.js';
import { openActivity, zoomableImage } from '../cards.js';
import { openRecordForm } from './admin-forms.js';

function monthFromParam(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return new Date(Number(m[1]), Number(m[2]) - 1, 1);
}

function compactTime(value) {
  const d = parseLocal(value);
  if (!d) return '';
  const h = d.getHours();
  const mm = d.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mm === 0 ? `${h12} ${h < 12 ? 'a.m.' : 'p.m.'}` : `${h12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

export default function calendarView(root, ctx) {
  const params = ctx.params;
  const isNarrow = window.matchMedia('(max-width: 760px)').matches;
  const state = {
    cursor: monthFromParam(params.get('mes')),
    view: params.get('vista') === 'agenda' ? 'agenda' : params.get('vista') === 'mes' ? 'mes' : isNarrow ? 'agenda' : 'mes',
    cats: new Set(CATEGORIES.map((c) => c.id)),
    community: COMMUNITIES.some((c) => c.value === params.get('comunidad')) ? params.get('comunidad') : 'all',
  };

  const syncUrl = () => {
    const query = `mes=${state.cursor.getFullYear()}-${String(state.cursor.getMonth() + 1).padStart(2, '0')}&vista=${state.view}${
      state.community !== 'all' ? `&comunidad=${encodeURIComponent(state.community)}` : ''
    }`;
    history.replaceState(null, '', `#/calendario?${query}`);
  };

  const monthRange = () => [
    startOfMonth(state.cursor),
    new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 0, 23, 59, 59),
  ];

  const monthBase = () => {
    const [start, end] = monthRange();
    return store.activitiesInRange(start, end).filter(
      (a) => state.community === 'all' || a.community === state.community
    );
  };

  const monthActivities = () => monthBase().filter((a) => state.cats.has(a.category || 'familiar'));

  const paint = () => {
    const list = monthActivities();
    root.innerHTML = `
      ${pageHead({
        eyebrow: 'Agenda de la pastoral',
        title: 'Calendario de actividades',
        subtitle:
          'Entérate de los encuentros, talleres, retiros y celebraciones. Toca una actividad para ver los detalles y agregarla a tu calendario.',
        actions: `
          <button type="button" class="btn btn-ghost" data-export>${icon('download', 16)} Exportar .ics</button>
          <button type="button" class="btn btn-ghost" data-print>${icon('print', 16)} Imprimir</button>
          <a class="btn btn-primary" href="#/proponer">${icon('plus', 16)} Proponer actividad</a>`,
      })}

      <div class="wrap" style="padding-bottom:clamp(2rem,5vw,3.5rem)">
        <div class="cal-toolbar">
          <div class="cal-month">
            <h2>${esc(fmtMonthYear(state.cursor))}</h2>
            <span class="count">${esc(pluralize(list.length, 'actividad', 'actividades'))}</span>
          </div>
          <div class="cal-nav">
            <button type="button" class="btn-icon" data-prev aria-label="Mes anterior">${icon('chevron-left', 18)}</button>
            <button type="button" class="btn btn-ghost btn-sm" data-today>Hoy</button>
            <button type="button" class="btn-icon" data-next aria-label="Mes siguiente">${icon('chevron-right', 18)}</button>
          </div>
          <div class="segmented" role="group" aria-label="Vista del calendario">
            <button type="button" data-view="mes" aria-pressed="${state.view === 'mes'}">${icon('grid', 14)} Mes</button>
            <button type="button" data-view="agenda" aria-pressed="${state.view === 'agenda'}">${icon('list', 14)} Agenda</button>
          </div>
        </div>

        <div class="filters" aria-label="Filtrar por tipo de actividad">
          ${CATEGORIES.map((c) => {
            const count = monthBase().filter((a) => a.category === c.id).length;
            return `<button type="button" class="filter-chip" data-cat="${c.id}" aria-pressed="${state.cats.has(c.id)}">
              <span class="pill-dot" style="--dot:${c.color}"></span>${esc(c.label)}
              ${count ? `<span class="count">${count}</span>` : ''}
            </button>`;
          }).join('')}
          <div class="spacer"></div>
          <button type="button" class="btn btn-quiet btn-sm" data-cats-all>Todas</button>
          <button type="button" class="btn btn-quiet btn-sm" data-cats-none>Ninguna</button>
        </div>

        <div class="filters filters-community" aria-label="Filtrar por comunidad">
          <span class="filter-label">Comunidad</span>
          <button type="button" class="filter-chip" data-community="all" aria-pressed="${state.community === 'all'}">
            Todas
          </button>
          ${COMMUNITIES.map((c) => {
            const count = monthBase().filter((a) => a.community === c.value).length;
            return `<button type="button" class="filter-chip" data-community="${esc(c.value)}" aria-pressed="${state.community === c.value}">
              ${esc(c.label)}${count ? `<span class="count">${count}</span>` : ''}
            </button>`;
          }).join('')}
        </div>

        ${
          state.view === 'mes'
            ? `<div class="cal-shell">${monthGridHTML(list, state.cursor)}
                <div class="cal-legend">
                  ${CATEGORIES.map((c) => `<span><span class="pill-dot" style="--dot:${c.color}"></span>${esc(c.label)}</span>`).join('')}
                  <span style="margin-left:auto">${icon('info', 13)} Toca un día para ver su agenda</span>
                </div>
              </div>`
            : agendaHTML(list, state.cursor)
        }

        ${
          list.length === 0
            ? `<div class="mt-3">${emptyState({
                icon: 'calendar',
                title:
                  state.community === 'all'
                    ? 'No hay actividades en este mes'
                    : `No hay actividades de ${COMMUNITIES.find((c) => c.value === state.community)?.label || 'esta comunidad'}`,
                text: 'Prueba con otro mes, activa más filtros o propone una nueva actividad para la pastoral.',
                action: '<a class="btn btn-primary btn-sm mt-1" href="#/proponer">Proponer una actividad</a>',
              })}</div>`
            : ''
        }
      </div>`;

    bind();
  };

  function monthGridHTML(list, cursor) {
    const weeks = monthMatrix(cursor.getFullYear(), cursor.getMonth());
    const now = today();
    return `<div class="cal-scroll">
      <div class="cal-dow">${WEEKDAYS.map((d) => `<div>${d}</div>`).join('')}</div>
      <div class="cal-grid" role="grid" aria-label="Calendario de ${esc(fmtMonthYear(cursor))}">
        ${weeks
          .flat()
          .map((day) => {
            const key = ymd(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const events = list.filter((a) => {
              const d = parseLocal(a.starts_at);
              return d && sameDay(d, day);
            });
            const visible = events.slice(0, 3);
            const extra = events.length - visible.length;
            const isToday = sameDay(day, now);
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            return `<div class="cal-day ${inMonth ? '' : 'is-out'} ${isToday ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''}" data-day="${key}" role="gridcell">
              <button type="button" class="cal-daynum" data-day-open="${key}" aria-label="Ver agenda del ${esc(fmtDateLong(day))}">${day.getDate()}</button>
              <div class="cal-events">
                ${visible
                  .map((a) => {
                    const cat = categoryMeta(a.category);
                    return `<button type="button" class="cal-event" data-activity="${esc(a.id)}" data-occurrence="${esc(a.starts_at)}" title="${esc(a.title)} · ${esc(fmtTime(a.starts_at))}" style="--ev-bg:${cat.bg};--ev-fg:${cat.color}">
                      <span class="n">${esc(a.title)}</span>
                    </button>`;
                  })
                  .join('')}
                ${extra > 0 ? `<button type="button" class="cal-more" data-day-open="${key}">+${extra} más</button>` : ''}
              </div>
            </div>`;
          })
          .join('')}
      </div>
    </div>`;
  }

  function agendaHTML(list, cursor) {
    const now = today();
    const days = new Map();
    for (const a of list) {
      const key = ymd(parseLocal(a.starts_at));
      if (!days.has(key)) days.set(key, []);
      days.get(key).push(a);
    }
    if (!days.size) return '';

    const rows = [];
    const sortedKeys = [...days.keys()].sort();
    for (const key of sortedKeys) {
      const day = parseLocal(key);
      const isToday = sameDay(day, now);
      const weekday = day.toLocaleDateString('es', { weekday: 'long' });
      rows.push(`<div class="agenda-group">
        <div class="agenda-date ${isToday ? 'is-today' : ''}">
          ${isToday ? 'Hoy · ' : ''}${esc(weekday)} ${day.getDate()} de ${esc(MONTHS[day.getMonth()])}
        </div>
        ${days
          .get(key)
          .map((a) => {
            const cat = categoryMeta(a.category);
            return `<button type="button" class="agenda-item" data-activity="${esc(a.id)}" data-occurrence="${esc(a.starts_at)}" style="--ev-dot:${cat.color}">
              <span class="agenda-time">${esc(compactTime(a.starts_at))}</span>
              <span class="agenda-main">
                <h3>${esc(a.title)}</h3>
                <p>${esc(cat.label)}${a.location ? ' · ' + esc(a.location) : ''}${a.responsible ? ' · ' + esc(a.responsible) : ''}</p>
              </span>
              <span style="align-self:center;color:var(--muted)">${icon('chevron-right', 16)}</span>
            </button>`;
          })
          .join('')}
      </div>`);
    }
    return `<div class="agenda">${rows.join('')}</div>`;
  }

  function openDay(key) {
    const day = parseLocal(key);
    const events = store.activitiesOn(day).filter(
      (a) =>
        state.cats.has(a.category || 'familiar') &&
        (state.community === 'all' || a.community === state.community)
    );
    const body = events.length
      ? `<div class="day-list">${events
          .map((a) => {
            const cat = categoryMeta(a.category);
            return `<div class="day-item" style="--ev-dot:${cat.color}">
              <div class="cluster" style="margin-bottom:.3rem">
                ${categoryBadge(a.category)}
                <span class="badge badge-outline">${esc(fmtTime(a.starts_at))}${a.ends_at ? ' – ' + esc(fmtTime(a.ends_at)) : ''}</span>
              </div>
              <h3>${esc(a.title)}</h3>
              ${zoomableImage(a.image_url, a.title, 'day-thumb')}
              ${a.description ? `<p>${esc(a.description)}</p>` : ''}
              <div class="meta">
                ${a.location ? `<span>${icon('map-pin', 13)} ${esc(a.location)}</span>` : ''}
                ${a.community ? `<span>${icon('users', 13)} ${esc(a.community)}</span>` : ''}
                ${a.responsible ? `<span>${icon('user', 13)} ${esc(a.responsible)}</span>` : ''}
              </div>
              <div class="actions">
                <button type="button" class="btn btn-light btn-sm" data-day-activity="${esc(a.id)}" data-day-occurrence="${esc(a.starts_at)}">Ver detalle ${icon('arrow-right', 14)}</button>
                <a class="btn btn-quiet btn-sm" href="${googleLink(a)}" target="_blank" rel="noopener">${icon('calendar', 14)} Añadir</a>
              </div>
            </div>`;
          })
          .join('')}</div>`
      : emptyState({ icon: 'calendar', title: 'Día sin actividades', text: 'No hay nada programado para este día.' });

    const { el } = openModal({
      title: day.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
      subtitle: events.length ? pluralize(events.length, 'actividad', 'actividades') : '',
      body,
      footer: `${
        store.canEdit()
          ? `<button type="button" class="btn btn-primary" data-add-day>${icon('plus', 15)} Agregar actividad</button>`
          : `<a class="btn btn-ghost" href="#/proponer">${icon('plus', 15)} Proponer actividad</a>`
      }
        <button type="button" class="btn btn-ghost" data-close>Listo</button>`,
    });

    el.querySelectorAll('[data-day-activity]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.dayActivity;
        const occurrence = btn.dataset.dayOccurrence || null;
        closeModal();
        setTimeout(() => openActivity(id, occurrence), 160);
      });
    });

    el.querySelector('[data-add-day]')?.addEventListener('click', () => {
      closeModal();
      setTimeout(() => {
        openRecordForm('activities', null, {
          defaults: {
            starts_at: `${key}T19:00`,
            ends_at: `${key}T20:30`,
          },
        });
      }, 160);
    });
  }

  function googleLink(a) {
    const start = parseLocal(a.starts_at);
    if (!start) return '#';
    const end = parseLocal(a.ends_at) || new Date(start.getTime() + 5400000);
    const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: a.title || '',
      dates: `${f(start)}/${f(end)}`,
      ctz: 'America/El_Salvador',
      details: a.description || '',
      location: a.location || '',
    });
    return `https://calendar.google.com/calendar/render?${p}`;
  }

  function bind() {
    root.querySelector('[data-prev]')?.addEventListener('click', () => {
      state.cursor = addMonths(state.cursor, -1);
      syncUrl();
      paint();
    });
    root.querySelector('[data-next]')?.addEventListener('click', () => {
      state.cursor = addMonths(state.cursor, 1);
      syncUrl();
      paint();
    });
    root.querySelector('[data-today]')?.addEventListener('click', () => {
      const now = new Date();
      state.cursor = new Date(now.getFullYear(), now.getMonth(), 1);
      syncUrl();
      paint();
    });
    root.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.view = btn.dataset.view;
        syncUrl();
        paint();
      });
    });
    root.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cat;
        if (state.cats.has(id)) state.cats.delete(id);
        else state.cats.add(id);
        paint();
      });
    });
    root.querySelector('[data-cats-all]')?.addEventListener('click', () => {
      state.cats = new Set(CATEGORIES.map((c) => c.id));
      paint();
    });
    root.querySelector('[data-cats-none]')?.addEventListener('click', () => {
      state.cats.clear();
      paint();
    });
    root.querySelectorAll('[data-community]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.community = btn.dataset.community;
        syncUrl();
        paint();
      });
    });
    root.querySelectorAll('[data-day-open]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDay(btn.dataset.dayOpen);
      });
    });
    root.querySelectorAll('.cal-day').forEach((cell) => {
      cell.addEventListener('click', (e) => {
        if (e.target.closest('[data-activity], [data-day-open]')) return;
        openDay(cell.dataset.day);
      });
    });
    root.querySelector('[data-export]')?.addEventListener('click', () => {
      const list = monthActivities();
      if (!list.length) {
        toast('No hay actividades para exportar en este mes.', 'error');
        return;
      }
      downloadFile(`pastoral-familiar-${ymd(state.cursor).slice(0, 7)}.ics`, buildICS(list, site().name));
      toast('Descargamos el calendario del mes.', 'ok');
    });
    root.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  }

  paint();
}
