/* =========================================================
   Tarjetas y detalles reutilizables
   ========================================================= */

import { icon } from './icons.js';
import { store } from './store.js';
import {
  categoryMeta, categoryBadge, openModal, toast,
} from './ui.js';
import {
  esc, parseLocal, fmtTime, fmtDateLong, fmtDateMedium, fmtDateShort,
  relativeLabel, truncate, initials, googleCalendarUrl, buildICS, downloadFile,
  whatsappUrl, telUrl, isPast, pluralize, toLocalDateTime, ymd,
} from './utils.js';
import { recurrenceLabel, isRecurring } from './recurrence.js';
import { PRIORITIES } from './config.js';

export function toneClass(tone = 'sage') {
  const allowed = ['sage', 'clay', 'gold', 'teal', 'rose', 'ink'];
  return `tone-${allowed.includes(tone) ? tone : 'sage'}`;
}

/* ---------------- Actividad ---------------- */
export function activityCard(a, { hideDate = false, past = false } = {}) {
  const start = parseLocal(a.starts_at);
  if (!start) return '';
  const cat = categoryMeta(a.category);
  const time = a.ends_at ? `${fmtTime(a.starts_at)} – ${fmtTime(a.ends_at)}` : fmtTime(a.starts_at);
  return `
    <button type="button" class="activity-card ${past || isPast(a.starts_at) ? 'is-past' : ''}" data-activity="${esc(a.id)}" data-occurrence="${esc(a.starts_at)}" style="--ev:${cat.color}">
      ${hideDate ? '' : `<span class="date-badge" style="background:${cat.bg};color:${cat.color}">
        <span class="d">${start.getDate()}</span>
        <span class="m">${start.toLocaleDateString('es', { month: 'short' }).replace('.', '')}</span>
      </span>`}
      <span class="activity-body">
        <span class="cluster" style="gap:.4rem">
          <span class="badge" style="background:${cat.bg};color:${cat.color}">${esc(cat.label)}</span>
          <span class="text-sm text-muted">${esc(relativeLabel(a.starts_at))}</span>
        </span>
        <h3 class="activity-title">${esc(a.title)}</h3>
        <span class="activity-meta">
          <span>${icon('clock', 13)} ${esc(time)}</span>
          ${a.location ? `<span>${icon('map-pin', 13)} ${esc(truncate(a.location, 42))}</span>` : ''}
        </span>
      </span>
    </button>`;
}

export function activityDetailHTML(a) {
  const cat = categoryMeta(a.category);
  const start = parseLocal(a.starts_at);
  const end = parseLocal(a.ends_at);
  const seats = Number(a.capacity) > 0 ? `${a.capacity} personas` : '';
  const recurring = isRecurring(a.recurrence);
  return `
    <div class="event-detail">
      <div class="event-kicker">
        ${categoryBadge(a.category)}
        ${a.status === 'pending' ? '<span class="badge badge-gold">Propuesta pendiente</span>' : ''}
        ${recurring ? `<span class="badge badge-gold">${icon('repeat', 12)} ${esc(recurrenceLabel(a.recurrence))}</span>` : ''}
        <span class="badge badge-outline">${esc(relativeLabel(a.starts_at))}</span>
      </div>
      <h2>${esc(a.title)}</h2>
      <div class="event-facts">
        <div class="event-fact">${icon('calendar', 16)}<div><b>Fecha</b>${esc(fmtDateLong(a.starts_at))}</div></div>
        <div class="event-fact">${icon('clock', 16)}<div><b>Hora</b>${esc(fmtTime(a.starts_at))}${end ? ` a ${esc(fmtTime(a.ends_at))}` : ''}</div></div>
        ${a.location ? `<div class="event-fact">${icon('map-pin', 16)}<div><b>Lugar</b>${esc(a.location)}</div></div>` : ''}
        ${a.community ? `<div class="event-fact">${icon('users', 16)}<div><b>Comunidad asignada</b>${esc(a.community)}</div></div>` : ''}
        ${a.responsible ? `<div class="event-fact">${icon('user', 16)}<div><b>Responsable</b>${esc(a.responsible)}</div></div>` : ''}
        ${seats ? `<div class="event-fact">${icon('users', 16)}<div><b>Cupo</b>${esc(seats)}</div></div>` : ''}
        ${a.contact ? `<div class="event-fact">${icon('phone', 16)}<div><b>Informes</b>${esc(a.contact)}</div></div>` : ''}
      </div>
      ${a.description ? `<p class="event-desc">${esc(a.description)}</p>` : ''}
      ${recurring ? `<div class="inline-note mt-2">${icon('repeat', 16)}<span>Esta actividad se repite: <b>${esc(recurrenceLabel(a.recurrence))}</b>. Estás viendo la fecha del ${esc(fmtDateMedium(a.starts_at))}.</span></div>` : ''}
      ${a.status === 'pending' ? `<div class="inline-note mt-2">${icon('info', 16)}<span>Esta actividad fue propuesta por ${esc(a.submitted_by || 'un miembro de la comunidad')} y aún no aparece en el calendario público.</span></div>` : ''}
    </div>`;
}

/** Ajusta una actividad base a una fecha concreta de su serie. */
export function withOccurrence(base, startIso) {
  const date = parseLocal(startIso);
  if (!date) return base;
  const baseStart = parseLocal(base.starts_at);
  const baseEnd = parseLocal(base.ends_at);
  const duration = baseStart && baseEnd ? Math.max(0, baseEnd.getTime() - baseStart.getTime()) : 90 * 60000;
  return {
    ...base,
    occurrence_of: base.id,
    occurrence_date: ymd(date),
    starts_at: toLocalDateTime(date),
    ends_at: base.ends_at ? toLocalDateTime(new Date(date.getTime() + duration)) : null,
  };
}

export function openActivity(id, occurrenceStart = null) {
  const base = store.byId('activities', id);
  if (!base) return;
  const a = occurrenceStart ? withOccurrence(base, occurrenceStart) : base;
  const start = parseLocal(a.starts_at);
  const past = start && isPast(a.starts_at);
  const shareText = `${a.title} · ${fmtDateLong(a.starts_at)} · ${a.location || ''}`.trim();

  const { el } = openModal({
    title: a.title,
    subtitle: categoryMeta(a.category).label,
    wide: false,
    body: activityDetailHTML(a),
    footer: `
      <button type="button" class="btn btn-ghost left" data-share>${icon('share', 16)} Compartir</button>
      <button type="button" class="btn btn-ghost" data-ics>${icon('download', 16)} .ics</button>
      ${past ? '' : `<a class="btn btn-primary" href="${googleCalendarUrl(a)}" target="_blank" rel="noopener">${icon('calendar', 16)} Añadir a mi calendario</a>`}
    `,
  });

  el.querySelector('[data-ics]').addEventListener('click', () => {
    downloadFile(`${(a.title || 'actividad').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.ics`, buildICS([a]));
    toast('Descargamos el archivo para tu calendario.', 'ok');
  });

  el.querySelector('[data-share]').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}#/calendario`;
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, text: shareText, url });
        return;
      } catch {
        /* el usuario canceló */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      toast('Copiamos los datos de la actividad.', 'ok');
    } catch {
      window.open(whatsappUrl('', `${shareText} ${url}`), '_blank', 'noopener');
    }
  });
}

/* ---------------- Avisos ---------------- */
export function noticeCard(n, { full = false } = {}) {
  const priority = PRIORITIES.find((p) => p.id === n.priority) || PRIORITIES[0];
  const cls = n.pinned ? 'is-pinned' : n.priority === 'urgente' ? 'is-urgent' : '';
  return `
    <article class="notice-card ${cls}" data-priority="${esc(n.priority || 'normal')}">
      <div class="cluster" style="gap:.4rem">
        ${n.pinned ? `<span class="badge badge-gold">${icon('pin', 12)} Fijado</span>` : ''}
        ${n.priority && n.priority !== 'normal' ? `<span class="badge ${n.priority === 'urgente' ? 'badge-danger' : 'badge-clay'}">${esc(priority.label)}</span>` : ''}
        <span class="text-sm text-muted" style="margin-left:auto">${esc(fmtDateShort(n.published_at))}</span>
      </div>
      <h3 class="notice-title">${esc(n.title)}</h3>
      <p class="notice-body">${esc(full ? n.body || '' : truncate(n.body || '', 190))}</p>
      <div class="notice-meta">
        ${n.author ? `<span>${icon('user', 12)} ${esc(n.author)}</span>` : ''}
        ${n.expires_at ? `<span>${icon('clock', 12)} Vigente hasta ${esc(fmtDateMedium(n.expires_at))}</span>` : ''}
        ${!full ? `<button type="button" class="btn btn-quiet btn-sm" data-notice="${esc(n.id)}" style="color:var(--green);margin-left:auto">Leer aviso ${icon('arrow-right', 12)}</button>` : ''}
      </div>
    </article>`;
}

export function openNotice(id) {
  const n = store.byId('notices', id);
  if (!n) return;
  openModal({
    title: n.title,
    subtitle: n.published_at ? `Publicado el ${fmtDateLong(n.published_at)}` : '',
    body: `<p class="event-desc">${esc(n.body || '')}</p>
      <div class="cluster mt-3">
        ${n.author ? `<span class="badge badge-outline">${icon('user', 12)} ${esc(n.author)}</span>` : ''}
        ${n.expires_at ? `<span class="badge badge-outline">${icon('clock', 12)} Hasta ${esc(fmtDateMedium(n.expires_at))}</span>` : ''}
      </div>`,
    footer: `<button type="button" class="btn btn-ghost" data-close>Cerrar</button>`,
  });
}

/* ---------------- Cumpleaños ---------------- */
export function birthdayCard(b) {
  const d = parseLocal(b.date);
  if (!d) return '';
  const now = new Date();
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  const isAnniversary = b.kind === 'anniversary';
  let years = null;
  if (isAnniversary) years = now.getFullYear() - d.getFullYear();
  return `
    <div class="bday-card ${isToday ? 'is-today' : ''}">
      <span class="bday-day">${d.getDate()}</span>
      <div style="min-width:0">
        <div class="bday-name">${esc(b.name)}</div>
        <div class="bday-note">
          ${isAnniversary ? `${esc(pluralize(years, 'año', 'años'))} de matrimonio` : d.toLocaleDateString('es', { month: 'long' })}
          ${b.note ? ` · ${esc(b.note)}` : ''}
        </div>
      </div>
      ${isToday ? `<span class="badge badge-gold" style="margin-left:auto">${icon('cake', 12)} ¡Hoy!</span>` : ''}
    </div>`;
}

/* ---------------- Recursos ---------------- */
const RESOURCE_ICONS = { doc: 'file', link: 'link', form: 'edit', video: 'video' };

export function resourceCard(r) {
  const iconName = RESOURCE_ICONS[r.kind] || 'file';
  const kindClass = r.kind === 'link' ? 'is-link' : r.kind === 'doc' ? 'is-doc' : '';
  return `
    <a class="resource-card" href="${esc(r.url || '#')}" target="_blank" rel="noopener">
      <div class="resource-top">
        <span class="resource-icon ${kindClass}">${icon(iconName, 20)}</span>
        <span class="badge badge-outline">${esc(r.category || 'Recurso')}</span>
      </div>
      <h3 class="resource-title">${esc(r.title)}</h3>
      ${r.description ? `<p class="resource-desc">${esc(truncate(r.description, 120))}</p>` : ''}
      <div class="resource-foot">
        <span>${r.updated_at ? `Actualizado ${esc(fmtDateShort(r.updated_at))}` : ''}</span>
        <span style="color:var(--green);font-weight:600;display:inline-flex;align-items:center;gap:.25rem">Abrir ${icon('arrow-up-right', 13)}</span>
      </div>
    </a>`;
}

/* ---------------- Contactos ---------------- */
export function personCard(c) {
  return `
    <article class="person-card">
      <span class="avatar">${esc(initials(c.name))}</span>
      <div>
        <h3 class="person-name">${esc(c.name)}</h3>
        <p class="person-role">${esc(c.role || 'Coordinador')}</p>
        ${c.notes ? `<p class="text-sm text-muted" style="margin-top:.35rem">${esc(c.notes)}</p>` : ''}
      </div>
      <div class="person-actions">
        ${c.phone ? `<a class="btn-icon" href="${telUrl(c.phone)}" aria-label="Llamar a ${esc(c.name)}" title="${esc(c.phone)}">${icon('phone', 16)}</a>` : ''}
        ${c.whatsapp ? `<a class="btn-icon" href="${whatsappUrl(c.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp de ${esc(c.name)}">${icon('whatsapp', 16)}</a>` : ''}
        ${c.email ? `<a class="btn-icon" href="mailto:${esc(c.email)}" aria-label="Correo de ${esc(c.name)}">${icon('mail', 16)}</a>` : ''}
      </div>
    </article>`;
}

/* ---------------- Álbumes ---------------- */
export function albumCard(album) {
  const photos = Array.isArray(album.photos) ? album.photos : [];
  const cover = photos.find((p) => p.url)?.url || '';
  return `
    <button type="button" class="album-card" data-album="${esc(album.id)}">
      <span class="album-cover ${cover ? '' : toneClass(album.tone)}">
        ${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : `<span class="album-glyph">${icon('image', 44)}</span>`}
      </span>
      <span class="album-shade"></span>
      <span class="album-info">
        <h3>${esc(album.title)}</h3>
        <p>${esc(fmtDateMedium(album.date))} · ${esc(pluralize(photos.length, 'foto', 'fotos'))}</p>
      </span>
    </button>`;
}

export function openAlbum(id) {
  const album = store.byId('albums', id);
  if (!album) return;
  const photos = Array.isArray(album.photos) ? album.photos : [];
  const body = photos.length
    ? `<div class="photo-grid">${photos
        .map(
          (p, index) => `
          <button type="button" data-photo="${index}">
            ${p.url ? `<img src="${esc(p.url)}" alt="${esc(p.caption || '')}" loading="lazy">` : `<span class="photo-fallback ${toneClass(album.tone)}">${icon('image', 28)}</span>`}
          </button>`
        )
        .join('')}</div>
      <p class="field-hint mt-2">${esc(album.description || '')}</p>`
    : `<div class="empty"><span class="empty-icon">${icon('image', 24)}</span><h3>Este álbum aún no tiene fotos</h3><p>Los coordinadores pueden agregarlas desde el panel de administración.</p></div>`;

  const { el } = openModal({
    title: album.title,
    subtitle: `${fmtDateLong(album.date)} · ${pluralize(photos.length, 'foto', 'fotos')}`,
    body,
    wide: true,
    footer: `<button type="button" class="btn btn-ghost" data-close>Cerrar</button>`,
  });

  let current = 0;
  const openPhoto = (index) => {
    current = index;
    const p = photos[current];
    if (!p) return;
    const box = document.createElement('div');
    box.className = 'lightbox open';
    box.innerHTML = `
      <div class="lightbox-head">
        <h3>${esc(album.title)}</h3>
        <button type="button" class="btn-icon" data-lb-close aria-label="Cerrar">${icon('x', 18)}</button>
      </div>
      <div class="lightbox-stage">
        ${p.url ? `<img src="${esc(p.url)}" alt="${esc(p.caption || '')}">` : `<div class="lightbox-fallback ${toneClass(album.tone)}">${icon('image', 70)}</div>`}
      </div>
      <div class="lightbox-foot">
        <button type="button" class="btn btn-ghost" data-lb-prev ${photos.length < 2 ? 'disabled' : ''}>${icon('chevron-left', 16)} Anterior</button>
        <span>${esc(p.caption || '')} · ${current + 1}/${photos.length}</span>
        <button type="button" class="btn btn-ghost" data-lb-next ${photos.length < 2 ? 'disabled' : ''}>Siguiente ${icon('chevron-right', 16)}</button>
      </div>`;
    document.body.appendChild(box);
    document.body.classList.add('no-scroll');

    const close = () => {
      box.remove();
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey);
    };
    const go = (dir) => {
      current = (current + dir + photos.length) % photos.length;
      close();
      openPhoto(current);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    box.querySelector('[data-lb-close]').addEventListener('click', close);
    box.querySelector('[data-lb-prev]').addEventListener('click', () => go(-1));
    box.querySelector('[data-lb-next]').addEventListener('click', () => go(1));
    box.addEventListener('click', (e) => {
      if (e.target === box) close();
    });
  };

  el.querySelectorAll('[data-photo]').forEach((btn) => {
    btn.addEventListener('click', () => openPhoto(Number(btn.dataset.photo)));
  });
}
