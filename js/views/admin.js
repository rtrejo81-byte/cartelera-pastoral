/* =========================================================
   Panel de administración
   ========================================================= */

import { icon } from '../icons.js';
import { store } from '../store.js';
import { ADMIN_TABS, SECTIONS, SUPABASE, BIRTHDAY_KINDS, PRIORITIES } from '../config.js';
import { openRecordForm } from './admin-forms.js';
import {
  toast, confirmDialog, statusBadge, categoryBadge, site, setBusy,
} from '../ui.js';
import {
  esc, fmtDateShort, fmtTime, fmtMonthYear, fmtClockRange, pluralize, truncate, relativeLabel, parseLocal,
} from '../utils.js';
import { recurrenceLabel, isRecurring } from '../recurrence.js';

export default function adminView(root, ctx) {
  if (!store.isAuthenticated()) {
    renderLogin(root);
    return;
  }
  if (!store.canEdit()) {
    renderNoAccess(root);
    return;
  }
  const tab = ADMIN_TABS.some((t) => t.id === ctx.path.split('/')[2]) ? ctx.path.split('/')[2] : 'resumen';
  renderShell(root, tab);
}

/* ---------------- Acceso ---------------- */
function renderLogin(root) {
  const demo = store.mode === 'demo';
  root.innerHTML = `
    <section class="login-shell">
      <div class="wrap" style="display:grid;place-items:center">
        <div class="login-card">
          <span class="brand" style="justify-content:center">
            <img class="brand-mark" src="assets/img/logo-mark.png" alt="" width="72" height="72">
            <span class="brand-text">
              <span class="brand-name">Pastoral Familiar</span>
              <span class="brand-sub">Panel de coordinadores</span>
            </span>
          </span>
          <h1>Bienvenido de nuevo</h1>
          <p class="login-sub">Entra para publicar actividades, avisos y cuidar la cartelera de la comunidad.</p>
          <p class="field-hint" style="text-align:center;margin:-.7rem 0 1.2rem">Coordinadores: pueden entrar con su número de teléfono y la contraseña asignada.</p>

          <form id="login-form" class="form-grid" novalidate>
            ${inputField('Correo o teléfono', 'email', 'text', 'Tu correo o tu número de teléfono', true, 'username')}
            ${inputField('Contraseña', 'password', 'password', '••••••••', true, 'current-password')}
            <button type="submit" class="btn btn-primary btn-block">${icon('lock', 16)} Entrar al panel</button>
          </form>

          ${
            demo
              ? `<div class="login-help" style="text-align:left">
                  <b>Estás en modo demostración.</b><br>
                  Puedes entrar con cualquier correo, teléfono o contraseña para conocer el panel. En este modo los datos viven solo en tu navegador.
                </div>`
              : `<div class="login-help">¿Olvidaste tu contraseña? <a href="#/contactos">Escribe a un administrador</a> y te asignará una temporal. Por seguridad, no se envía por correo.</div>`
          }
          <p style="text-align:center;margin-top:1rem"><a class="text-sm" href="#/">← Volver a la cartelera</a></p>
        </div>
      </div>
    </section>`;

  const form = root.querySelector('#login-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector('button[type="submit"]');
    setBusy(button, true, 'Entrando…');
    const result = await store.signIn(data.email, data.password);
    if (result.ok) {
      toast(demo ? 'Entraste en modo demostración.' : 'Bienvenido al panel.', 'ok');
      const requested = location.hash.split('/')[2];
      renderShell(root, ADMIN_TABS.some((t) => t.id === requested) ? requested : 'resumen');
    } else {
      setBusy(button, false);
      showLoginError(form, result.error || 'No se pudo iniciar sesión.');
    }
  });
}

function inputField(label, name, type, placeholder, required, autocomplete) {
  return `<div class="field">
    <label class="label" for="login-${name}">${esc(label)}${required ? ' <span class="req">*</span>' : ''}</label>
    <input class="input" id="login-${name}" name="${name}" type="${type}" placeholder="${esc(placeholder)}"${required ? ' required' : ''} autocomplete="${autocomplete}">
  </div>`;
}

function showLoginError(form, message) {
  let box = form.querySelector('.inline-note');
  if (!box) {
    box = document.createElement('div');
    box.className = 'inline-note';
    box.style.background = 'var(--danger-soft)';
    box.style.color = 'var(--danger)';
    form.prepend(box);
  }
  box.innerHTML = `${icon('alert', 16)}<span>${esc(message)}</span>`;
}

function renderNoAccess(root) {
  root.innerHTML = `
    <section class="section">
      <div class="wrap wrap-narrow">
        <div class="card card-pad-lg" style="text-align:center">
          <span class="empty-icon" style="margin-inline:auto">${icon('lock', 24)}</span>
          <h1 class="page-title" style="font-size:1.7rem;margin-top:.8rem">Tu cuenta no tiene permisos de edición</h1>
          <p class="page-sub" style="margin-inline:auto">Pide a un administrador que te asigne el rol de coordinador o editor desde Supabase.</p>
          <div class="cluster" style="justify-content:center;margin-top:1.4rem">
            <a class="btn btn-ghost" href="#/">Volver al sitio</a>
            <button type="button" class="btn btn-primary" data-signout>${icon('logout', 16)} Cerrar sesión</button>
          </div>
        </div>
      </div>
    </section>`;
  root.querySelector('[data-signout]').addEventListener('click', async () => {
    await store.signOut();
    renderLogin(root);
  });
}

/* ---------------- Estructura ---------------- */
function renderShell(root, tab) {
  const pending = store.pendingCount();

  root.innerHTML = `
    <div class="wrap">
      <div class="admin-wrap">
        <aside class="admin-side">
          <p class="admin-side-title">Panel</p>
          <nav class="admin-nav" aria-label="Secciones del panel">
            ${ADMIN_TABS.map((t) => {
              const active = t.id === tab;
              const badge = t.id === 'resumen' && pending ? `<span class="pill-count">${pending}</span>` : '';
              return `<a href="#/admin${t.id === 'resumen' ? '' : '/' + t.id}"${active ? ' aria-current="page"' : ''}>
                ${icon(t.icon, 17)}<span class="label">${esc(t.label)}</span>${badge}
              </a>`;
            }).join('')}
          </nav>
          <div class="admin-side-foot">
            <a class="btn btn-quiet" href="#/">${icon('arrow-left', 16)} Ver el sitio</a>
            <button type="button" class="btn btn-quiet" data-signout>${icon('logout', 16)} Cerrar sesión</button>
          </div>
        </aside>
        <main id="admin-main" style="min-width:0">${renderTab(tab)}</main>
      </div>
    </div>`;

  root.querySelector('[data-signout]').addEventListener('click', async () => {
    await store.signOut();
    toast('Cerraste sesión.', 'ok');
    renderLogin(root);
  });

  bindAdmin(root, tab);
}

function renderTab(tab) {
  switch (tab) {
    case 'resumen':
      return resumenTab();
    case 'ajustes':
      return settingsTab();
    case 'actividades':
      return tableTab('activities');
    case 'avisos':
      return tableTab('notices');
    case 'cumpleanos':
      return tableTab('birthdays');
    case 'recursos':
      return tableTab('resources');
    case 'contactos':
      return tableTab('contacts');
    case 'oracion':
      return tableTab('prayers');
    case 'santisimo':
      return tableTab('holyHours');
    case 'servicios':
      return tableTab('serviceAssignments');
    case 'galeria':
      return tableTab('albums');
    default:
      return resumenTab();
  }
}

/* ---------------- Resumen ---------------- */
function resumenTab() {
  const pendingActivities = store.all('activities').filter((i) => i.status === 'pending');
  const pendingNotices = store.all('notices').filter((i) => i.status === 'pending');
  const pendingPrayers = store.all('prayers').filter((i) => i.status === 'pending');
  const pendingAlbums = store.all('albums').filter((i) => i.status === 'pending');
  const pendingTotal = pendingActivities.length + pendingNotices.length + pendingPrayers.length + pendingAlbums.length;
  const upcoming = store.upcomingUnique(5);
  const notices = store.publicList('notices').length;
  const prayers = store.publicList('prayers').length;

  const queue = [
    ...pendingActivities.map((item) => ({ name: 'activities', item, kind: 'Actividad' })),
    ...pendingNotices.map((item) => ({ name: 'notices', item, kind: 'Aviso' })),
    ...pendingPrayers.map((item) => ({ name: 'prayers', item, kind: 'Intención' })),
    ...pendingAlbums.map((item) => ({ name: 'albums', item, kind: 'Álbum' })),
  ];

  return `
    <div class="admin-head">
      <div>
        <h1>Resumen</h1>
        <p>Hola${store.profile?.full_name ? `, ${esc(store.profile.full_name.split(' ')[0])}` : ''}. Este es el estado de la cartelera hoy.</p>
      </div>
      <div class="admin-head-actions">
        <a class="btn btn-ghost" href="#/calendario">${icon('eye', 16)} Ver sitio</a>
        <button type="button" class="btn btn-primary" data-new="activities">${icon('plus', 16)} Nueva actividad</button>
      </div>
    </div>

    <div class="stat-grid">
      ${statCard('alert', pendingTotal, 'Por revisar', 'clay')}
      ${statCard('calendar', store.upcoming(99).length, 'Fechas próximas', 'green')}
      ${statCard('megaphone', notices, 'Avisos activos', 'gold')}
      ${statCard('heart', prayers, 'Intenciones públicas', 'ink')}
    </div>

    <section class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Por revisar</h2>
          <p>Propuestas enviadas desde la web que esperan tu aprobación.</p>
        </div>
        ${pendingTotal ? `<span class="badge badge-gold">${esc(pluralize(pendingTotal, 'elemento', 'elementos'))}</span>` : ''}
      </div>
      ${
        queue.length
          ? `<div class="approve-list">${queue
              .map(
                ({ name, item, kind }) => `
                <article class="approve-card">
                  <div style="min-width:0">
                    <div class="cluster" style="gap:.4rem;margin-bottom:.25rem">
                      <span class="badge badge-outline">${esc(kind)}</span>
                      ${name === 'activities' && item.category ? categoryBadge(item.category) : ''}
                    </div>
                    <h3>${esc(item.title || item.name || truncate(item.text, 70))}</h3>
                    <div class="meta">
                      ${item.submitted_by ? `<span>${icon('user', 12)} ${esc(item.submitted_by)}</span>` : ''}
                      ${item.starts_at ? `<span>${icon('calendar', 12)} ${esc(fmtDateShort(item.starts_at))} · ${esc(fmtTime(item.starts_at))}</span>` : ''}
                      ${item.created_at ? `<span>${icon('clock', 12)} ${esc(relativeLabel(item.created_at))}</span>` : ''}
                    </div>
                    ${item.description ? `<p>${esc(truncate(item.description, 150))}</p>` : item.text ? `<p>“${esc(truncate(item.text, 150))}”</p>` : ''}
                  </div>
                  <div class="approve-actions">
                    <button type="button" class="btn btn-ghost btn-sm" data-reject="${name}:${esc(item.id)}">Rechazar</button>
                    <button type="button" class="btn btn-primary btn-sm" data-approve="${name}:${esc(item.id)}">${icon('check', 14)} Aprobar</button>
                  </div>
                </article>`
              )
              .join('')}</div>`
          : `<div class="empty" style="padding:2rem 1rem">
              <span class="empty-icon" style="background:var(--ok-soft);color:var(--ok)">${icon('check-circle', 24)}</span>
              <h3>Todo al día</h3>
              <p>No hay propuestas pendientes de revisión.</p>
            </div>`
      }
    </section>

    <section class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Próximas actividades</h2>
          <p>Lo que viene en el calendario.</p>
        </div>
        <a class="section-link" href="#/admin/actividades">Administrar ${icon('arrow-right', 15)}</a>
      </div>
      ${
        upcoming.length
          ? `<div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Actividad</th><th>Fecha</th><th>Tipo</th><th></th></tr></thead>
                <tbody>
                  ${upcoming
                    .map(
                      (a) => `<tr>
                        <td class="strong">${esc(a.title)}</td>
                        <td>${esc(fmtDateShort(a.starts_at))} · ${esc(fmtTime(a.starts_at))}</td>
                        <td>${categoryBadge(a.category)}</td>
                        <td><div class="actions"><a class="btn-icon" href="#/calendario" aria-label="Ver en el calendario">${icon('eye', 15)}</a></div></td>
                      </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>`
          : `<p class="text-sm text-muted">No hay actividades próximas publicadas.</p>`
      }
    </section>

    ${
      store.mode === 'demo'
        ? `<div class="inline-note">
            ${icon('sparkles', 16)}
            <span><b>Modo demostración.</b> Los cambios se guardan solo en este navegador. Para que el equipo edite desde sus teléfonos, conecta Supabase en <a href="#/admin/ajustes">Ajustes</a>.</span>
          </div>`
        : `<div class="inline-note" style="background:var(--ok-soft);color:var(--ok)">
            ${icon('check-circle', 16)}
            <span><b>Conectado a Supabase.</b> Los cambios se sincronizan en tiempo real con todos los dispositivos.</span>
          </div>`
    }`;
}

function statCard(iconName, value, label, tone) {
  return `<div class="stat-card">
    <span class="stat-ico ${tone === 'green' ? '' : tone}">${icon(iconName, 18)}</span>
    <div><b>${esc(String(value))}</b><span>${esc(label)}</span></div>
  </div>`;
}

/* ---------------- Tablas ---------------- */
const TABLE_DEFS = {
  activities: {
    label: 'Actividades',
    intro: 'El calendario de la pastoral. Puedes publicar actividades directamente o aprobar las propuestas.',
    icon: 'calendar',
    newLabel: 'Nueva actividad',
    head: ['Actividad', 'Fecha', 'Tipo', 'Estado', ''],
    rows: (a) => [
      {
        html: `<span class="strong">${esc(a.title)}<small>${esc(truncate(a.description || '', 70))}${a.community ? ' · ' + esc(a.community) : ''}</small>${
          isRecurring(a.recurrence)
            ? `<span class="badge badge-gold" style="margin-top:.3rem">${icon('repeat', 11)} ${esc(recurrenceLabel(a.recurrence))}</span>`
            : ''
        }</span>`,
        cls: 'strong',
      },
      { html: `${esc(fmtDateShort(a.starts_at))}<br><small class="text-muted">${esc(fmtTime(a.starts_at))}</small>` },
      { html: categoryBadge(a.category) },
      { html: statusBadge(a.status) },
    ],
    sort: (list) =>
      [...list].sort((x, y) => {
        const px = x.status === 'pending' ? 0 : 1;
        const py = y.status === 'pending' ? 0 : 1;
        if (px !== py) return px - py;
        return (parseLocal(y.starts_at)?.getTime() || 0) - (parseLocal(x.starts_at)?.getTime() || 0);
      }),
  },
  notices: {
    label: 'Avisos',
    intro: 'Comunicados que aparecen en la portada y en la sección de avisos.',
    icon: 'megaphone',
    newLabel: 'Nuevo aviso',
    head: ['Aviso', 'Prioridad', 'Publicado', 'Estado', ''],
    rows: (n) => [
      { html: `<span class="strong">${esc(n.title)}<small>${n.pinned ? 'Fijado · ' : ''}${esc(truncate(n.body || '', 64))}</small></span>`, cls: 'strong' },
      { html: `<span class="badge ${n.priority === 'urgente' ? 'badge-danger' : n.priority === 'importante' ? 'badge-clay' : 'badge'}">${esc((PRIORITIES.find((p) => p.id === n.priority) || PRIORITIES[0]).label)}</span>` },
      { html: n.published_at ? esc(fmtDateShort(n.published_at)) : '—' },
      { html: statusBadge(n.status) },
    ],
    sort: (list) => [...list].sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1)),
  },
  birthdays: {
    label: 'Cumpleaños',
    intro: 'Fechas que celebramos con la comunidad.',
    icon: 'cake',
    newLabel: 'Nueva celebración',
    head: ['Nombre', 'Tipo', 'Fecha', 'Nota', ''],
    rows: (b) => [
      { html: `<span class="strong">${esc(b.name)}</span>`, cls: 'strong' },
      { html: esc((BIRTHDAY_KINDS.find((k) => k.id === b.kind) || BIRTHDAY_KINDS[0]).label) },
      { html: esc(fmtDateShort(b.date)) },
      { html: esc(b.note || '—') },
    ],
    sort: (list) => [...list].sort((a, b) => (parseLocal(a.date)?.getTime() || 0) - (parseLocal(b.date)?.getTime() || 0)),
  },
  resources: {
    label: 'Recursos',
    intro: 'Documentos, enlaces y formularios para las familias.',
    icon: 'book',
    newLabel: 'Nuevo recurso',
    head: ['Recurso', 'Categoría', 'Tipo', 'Estado', ''],
    rows: (r) => [
      { html: `<span class="strong">${esc(r.title)}<small>${esc(truncate(r.description || '', 60))}</small></span>`, cls: 'strong' },
      { html: esc(r.category || 'General') },
      { html: esc((r.kind || 'doc').toUpperCase()) },
      { html: statusBadge(r.status) },
    ],
    sort: (list) => [...list].sort((a, b) => String(a.category).localeCompare(String(b.category), 'es')),
  },
  contacts: {
    label: 'Contactos',
    intro: 'El directorio público de coordinadores y responsables.',
    icon: 'phone',
    newLabel: 'Nuevo contacto',
    head: ['Nombre', 'Rol', 'Teléfono', 'Orden', ''],
    rows: (c) => [
      { html: `<span class="strong">${esc(c.name)}<small>${esc(c.area || '')}</small></span>`, cls: 'strong' },
      { html: esc(c.role || '—') },
      { html: esc(c.phone || c.whatsapp || '—') },
      { html: esc(String(c.sort ?? '—')) },
    ],
    sort: (list) => [...list].sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99)),
  },
  prayers: {
    label: 'Oración',
    intro: 'Intenciones recibidas. Revísalas antes de publicarlas.',
    icon: 'heart',
    newLabel: 'Nueva intención',
    head: ['Intención', 'Visibilidad', 'Estado', 'Amén', ''],
    rows: (p) => [
      { html: `<span class="strong">${esc(p.name || 'Anónimo')}<small>${esc(truncate(p.text || '', 80))}</small></span>`, cls: 'strong' },
      { html: p.visibility === 'public' ? '<span class="badge badge-green">Pública</span>' : '<span class="badge badge-outline">Solo equipo</span>' },
      { html: statusBadge(p.status) },
      { html: esc(String(p.prayers || 0)) },
    ],
    sort: (list) => [...list].sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1)),
  },
  albums: {
    label: 'Galería',
    intro: 'Álbumes de fotos de nuestras actividades.',
    icon: 'image',
    newLabel: 'Nuevo álbum',
    head: ['Álbum', 'Fecha', 'Fotos', 'Estado', ''],
    rows: (a) => [
      { html: `<span class="strong">${esc(a.title)}<small>${a.community ? esc(a.community) + ' · ' : ''}${esc(truncate(a.description || '', 60))}</small></span>`, cls: 'strong' },
      { html: esc(fmtDateShort(a.date)) },
      { html: esc(String(Array.isArray(a.photos) ? a.photos.length : 0)) },
      { html: statusBadge(a.status) },
    ],
    sort: (list) => [...list].sort((a, b) => (parseLocal(b.date)?.getTime() || 0) - (parseLocal(a.date)?.getTime() || 0)),
  },
  holyHours: {
    label: 'Santísimo',
    intro: 'Horario mensual de adoración: una hora de acompañamiento por comunidad.',
    icon: 'sun',
    newLabel: 'Nuevo horario',
    head: ['Mes', 'Comunidad', 'Horario', 'Orden', ''],
    rows: (h) => [
      { html: `<span class="strong">${esc(fmtMonthYear(parseLocal(h.month) || new Date()))}</span>`, cls: 'strong' },
      { html: esc(h.community) },
      { html: esc(fmtClockRange(h.start_time, h.end_time)) },
      { html: esc(String(h.sort ?? 0)) },
    ],
    sort: (list) =>
      [...list].sort(
        (a, b) =>
          String(b.month || '').localeCompare(String(a.month || '')) ||
          (a.sort ?? 0) - (b.sort ?? 0)
      ),
  },
  serviceAssignments: {
    label: 'Servicios',
    intro: 'Comunidad que sirve en cada misa de viernes y en la misa parroquial del primer domingo.',
    icon: 'users',
    newLabel: 'Nueva asignación',
    head: ['Fecha', 'Servicio', 'Comunidad', 'Notas', ''],
    rows: (s) => [
      { html: `<span class="strong">${esc(fmtDateShort(s.date))}</span>`, cls: 'strong' },
      {
        html:
          s.kind === 'domingo'
            ? '<span class="badge badge-green">Domingo</span>'
            : '<span class="badge badge-gold">Viernes</span>',
      },
      { html: esc(s.community) },
      { html: esc(s.notes || '—') },
    ],
    sort: (list) => [...list].sort((a, b) => String(a.date).localeCompare(String(b.date))),
  },
};

function tableTab(name) {
  const def = TABLE_DEFS[name];
  const list = def.sort(store.every(name));
  const pending = list.filter((i) => i.status === 'pending').length;

  return `
    <div class="admin-head">
      <div>
        <h1>${esc(def.label)}</h1>
        <p>${esc(def.intro)}</p>
      </div>
      <div class="admin-head-actions">
        ${pending ? `<span class="badge badge-gold">${esc(pluralize(pending, 'pendiente', 'pendientes'))}</span>` : ''}
        <button type="button" class="btn btn-primary" data-new="${name}">${icon('plus', 16)} ${esc(def.newLabel)}</button>
      </div>
    </div>

    <section class="admin-card">
      ${
        list.length
          ? `<div class="table-wrap">
              <table class="data-table">
                <thead><tr>${def.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
                <tbody>
                  ${list
                    .map((item) => {
                      const cells = def.rows(item);
                      return `<tr>
                        ${cells.map((c) => `<td${c.cls ? ` class="${c.cls}"` : ''}>${c.html}</td>`).join('')}
                        ${actionsCell(name, item)}
                      </tr>`;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>`
          : `<div class="empty" style="border:0;background:transparent">
              <span class="empty-icon">${icon(def.icon, 24)}</span>
              <h3>Sin registros todavía</h3>
              <p>Crea el primero con el botón “${esc(def.newLabel)}”.</p>
              <button type="button" class="btn btn-primary btn-sm mt-1" data-new="${name}">${icon('plus', 15)} ${esc(def.newLabel)}</button>
            </div>`
      }
    </section>`;
}

function actionsCell(name, item) {
  const pending = item.status === 'pending';
  return `<td>
    <div class="actions">
      ${pending ? `<button type="button" class="btn-icon" data-approve="${name}:${esc(item.id)}" title="Aprobar" aria-label="Aprobar">${icon('check', 16)}</button>` : ''}
      <button type="button" class="btn-icon" data-edit="${name}:${esc(item.id)}" title="Editar" aria-label="Editar">${icon('edit', 16)}</button>
      <button type="button" class="btn-icon" data-delete="${name}:${esc(item.id)}" title="Eliminar" aria-label="Eliminar">${icon('trash', 16)}</button>
    </div>
  </td>`;
}

/* ---------------- Ajustes ---------------- */
function settingsTab() {
  const s = site();
  const flags = store.settings?.sections || {};

  return `
    <div class="admin-head">
      <div>
        <h1>Ajustes</h1>
        <p>Personaliza los textos del sitio y decide qué secciones están visibles.</p>
      </div>
      <div class="admin-head-actions">
        <a class="btn btn-ghost" href="#/">${icon('eye', 16)} Ver sitio</a>
      </div>
    </div>

    <form id="settings-form" class="admin-card form-grid" novalidate>
      <div class="form-section" style="margin-top:0;padding-top:0;border:0">
        <p class="form-section-title">Identidad</p>
        <div class="form-grid two">
          ${settingsInput('Nombre de la pastoral', 'name', s.name, true)}
          ${settingsInput('Parroquia', 'parish', s.parish)}
          ${settingsInput('Ciudad', 'city', s.city)}
          ${settingsInput('Correo de contacto', 'email', s.email, false, 'email')}
          ${settingsInput('Teléfono', 'phone', s.phone)}
          ${settingsInput('WhatsApp (con código de país)', 'whatsapp', s.whatsapp)}
          <div style="grid-column:1 / -1">${settingsInput('Dirección', 'address', s.address)}</div>
          <div style="grid-column:1 / -1">${settingsInput('Horario o reunión habitual', 'meetingSchedule', s.meetingSchedule)}</div>
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Portada</p>
        <div class="form-grid two">
          ${settingsInput('Título (primera parte)', 'heroTitle', s.heroTitle)}
          ${settingsInput('Palabra destacada', 'heroAccent', s.heroAccent)}
          <div style="grid-column:1 / -1">
            <div class="field">
              <label class="label" for="set_heroText">Texto de presentación</label>
              <textarea class="textarea" id="set_heroText" name="heroText" rows="3">${esc(s.heroText || '')}</textarea>
            </div>
          </div>
          <div style="grid-column:1 / -1">${settingsInput('Frase del pie de página', 'footerNote', s.footerNote)}</div>
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Redes sociales (opcional)</p>
        <div class="form-grid two">
          ${settingsInput('Instagram', 'instagram', s.instagram, false, 'url')}
          ${settingsInput('Facebook', 'facebook', s.facebook, false, 'url')}
        </div>
      </div>

      <div class="form-section">
        <p class="form-section-title">Secciones visibles</p>
        <p class="field-hint mb-2">Las secciones desactivadas dejan de aparecer en el menú y en el pie, sin borrar su contenido.</p>
        <div class="settings-grid">
          ${SECTIONS.filter((sec) => sec.id !== 'inicio').map((sec) => toggleRow(sec, flags[sec.id] !== false)).join('')}
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${icon('check', 16)} Guardar cambios</button>
      </div>
    </form>

    <section class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Mi contraseña</h2>
          <p>Cambia la contraseña con la que entras al panel.</p>
        </div>
      </div>
      ${
        store.mode === 'cloud'
          ? `<form id="password-form" class="form-grid" novalidate>
              <div class="field-row">
                <div class="field">
                  <label class="label" for="new_password">Nueva contraseña</label>
                  <input class="input" id="new_password" name="password" type="password" minlength="8" autocomplete="new-password" required>
                  <span class="field-hint">Mínimo 8 caracteres.</span>
                </div>
                <div class="field">
                  <label class="label" for="new_password_confirm">Repetir contraseña</label>
                  <input class="input" id="new_password_confirm" name="confirm" type="password" minlength="8" autocomplete="new-password" required>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">${icon('lock', 16)} Actualizar contraseña</button>
              </div>
            </form>`
          : `<p class="text-sm text-muted" style="margin:0">En modo demostración no hay contraseñas reales. Al conectar Supabase podrás cambiarla aquí.</p>`
      }
    </section>

    <section class="admin-card" data-storage-card>
      <div class="admin-card-head">
        <div>
          <h2>Almacenamiento de fotos</h2>
          <p>Cuánto espacio del plan Free estás usando.</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-storage-refresh>Actualizar</button>
      </div>
      <div class="storage-meter">
        <div class="storage-meter-top">
          <strong data-storage-used>Calculando…</strong>
          <span data-storage-percent>—</span>
        </div>
        <div class="storage-track"><span class="storage-fill" data-storage-bar></span></div>
        <div class="storage-meter-foot">
          <span data-storage-count>—</span>
          <span>Plan Free · 1 GB</span>
        </div>
        <p class="field-hint" data-storage-note style="margin:.55rem 0 0"></p>
      </div>
    </section>

    <section class="admin-card">
      <div class="admin-card-head">
        <div>
          <h2>Conexión y datos</h2>
          <p>Cómo se guarda la información de la cartelera.</p>
        </div>
        <span class="badge ${store.mode === 'cloud' ? 'badge-ok' : 'badge-gold'}">${store.mode === 'cloud' ? 'Supabase conectado' : 'Modo demo local'}</span>
      </div>

      <div class="settings-grid">
        <div class="toggle-row">
          <div><b>Modo actual</b><small>${store.mode === 'cloud' ? 'Los datos se sincronizan entre dispositivos en tiempo real.' : 'Los datos se guardan solo en este navegador.'}</small></div>
          <span class="badge badge-outline">${store.mode === 'cloud' ? 'Nube' : 'Local'}</span>
        </div>
        <div class="toggle-row">
          <div><b>Proyecto Supabase</b><small>${SUPABASE.url ? esc(SUPABASE.url) : 'Sin configurar. Edita js/config.js con tu URL y tu clave anon.'}</small></div>
          <span class="badge ${SUPABASE.url ? 'badge-ok' : 'badge'}">${SUPABASE.url ? 'Configurado' : 'Pendiente'}</span>
        </div>
        ${
          store.mode === 'demo'
            ? `<div class="toggle-row">
                <div><b>Restablecer datos de ejemplo</b><small>Borra los cambios locales y vuelve a cargar la demostración.</small></div>
                <button type="button" class="btn btn-danger btn-sm" data-reset-demo>Restablecer</button>
              </div>`
            : ''
        }
        <div class="toggle-row">
          <div><b>Guía de instalación</b><small>Los pasos para publicar en GitHub Pages y conectar Supabase están en la carpeta docs.</small></div>
          <a class="btn btn-light btn-sm" href="docs/GUIA-DESPLIEGUE.md" target="_blank" rel="noopener">Abrir guía</a>
        </div>
      </div>
    </section>`;
}

function settingsInput(label, name, value, required = false, type = 'text') {  return `<div class="field">
    <label class="label" for="set_${name}">${esc(label)}${required ? ' <span class="req">*</span>' : ''}</label>
    <input class="input" id="set_${name}" name="${name}" type="${type}" value="${esc(value ?? '')}"${required ? ' required' : ''}>
  </div>`;
}

function toggleRow(section, checked) {
  return `<div class="toggle-row">
    <div><b>${esc(section.label)}</b><small>/${esc(section.path.replace(/^\//, ''))}</small></div>
    <label class="switch">
      <input type="checkbox" name="section_${section.id}"${checked ? ' checked' : ''} aria-label="Mostrar ${esc(section.label)}">
      <span class="track"></span>
    </label>
  </div>`;
}

function paintStorage(main) {
  const card = main.querySelector('[data-storage-card]');
  if (!card) return;
  const used = card.querySelector('[data-storage-used]');
  const percent = card.querySelector('[data-storage-percent]');
  const bar = card.querySelector('[data-storage-bar]');
  const count = card.querySelector('[data-storage-count]');
  const note = card.querySelector('[data-storage-note]');
  const refresh = card.querySelector('[data-storage-refresh]');

  const load = async () => {
    if (store.mode !== 'cloud') {
      used.textContent = 'Modo demo';
      percent.textContent = '—';
      bar.style.width = '0%';
      count.textContent = 'Las fotos viven en este navegador';
      note.textContent = 'Al conectar Supabase verás aquí el consumo real del bucket de fotos.';
      return;
    }
    refresh.disabled = true;
    used.textContent = 'Calculando…';
    note.textContent = 'Leyendo los archivos del bucket…';
    try {
      const usage = await store.storageUsage();
      if (!usage) throw new Error('No se pudo leer el almacenamiento.');
      const mb = usage.bytes / (1024 * 1024);
      const pct = Math.min(100, (usage.bytes / usage.limit) * 100);
      used.textContent = mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB usados` : `${mb.toFixed(1)} MB usados`;
      percent.textContent = `${pct.toFixed(1)} %`;
      bar.style.width = `${usage.bytes ? Math.max(pct, 1) : 0}%`;
      bar.dataset.level = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'ok';
      count.textContent = `${usage.count} ${usage.count === 1 ? 'archivo' : 'archivos'} en el bucket`;
      const free = Math.max(0, 1024 - mb);
      note.textContent =
        free > 0
          ? `Quedan unos ${free.toFixed(0)} MB libres. Las fotos se comprimen a 1600 px para que rindan más.`
          : 'No queda espacio libre. Borra álbumes antiguos o archiva fotos en Drive.';
    } catch (err) {
      used.textContent = 'No disponible';
      percent.textContent = '—';
      bar.style.width = '0%';
      count.textContent = 'No se pudo consultar el bucket';
      note.textContent = err.message || 'Revisa la conexión con Supabase.';
    } finally {
      refresh.disabled = false;
    }
  };

  refresh?.addEventListener('click', load);
  load();
}

/* ---------------- Eventos ---------------- */
function bindAdmin(root, tab) {
  const main = root.querySelector('#admin-main');
  if (!main) return;

  main.addEventListener('click', async (event) => {
    const newBtn = event.target.closest('[data-new]');
    if (newBtn) {
      openRecordForm(newBtn.dataset.new, null);
      return;
    }

    const editBtn = event.target.closest('[data-edit]');
    if (editBtn) {
      const [name, id] = editBtn.dataset.edit.split(':');
      const record = store.byId(name, id);
      if (record) openRecordForm(name, record);
      return;
    }

    const deleteBtn = event.target.closest('[data-delete]');
    if (deleteBtn) {
      const [name, id] = deleteBtn.dataset.delete.split(':');
      const record = store.byId(name, id);
      const ok = await confirmDialog({
        title: '¿Eliminar este registro?',
        message: `Se eliminará “${record?.title || record?.name || 'este registro'}” de forma permanente. Esta acción no se puede deshacer.`,
        confirmLabel: 'Sí, eliminar',
        danger: true,
      });
      if (!ok) return;
      try {
        await store.remove(name, id);
        toast('Registro eliminado.', 'ok');
      } catch (err) {
        toast(err.message || 'No se pudo eliminar.', 'error');
      }
      return;
    }

    const actionBtn = event.target.closest('[data-approve], [data-reject]');
    if (actionBtn) {
      const approve = actionBtn.hasAttribute('data-approve');
      const [name, id] = (approve ? actionBtn.dataset.approve : actionBtn.dataset.reject).split(':');
      try {
        await store.setStatus(name, id, approve ? 'approved' : 'rejected');
        toast(approve ? 'Publicado. Ya aparece en la web.' : 'La propuesta fue rechazada.', approve ? 'ok' : 'info');
      } catch (err) {
        toast(err.message || 'No se pudo actualizar.', 'error');
      }
      return;
    }

    if (event.target.closest('[data-reset-demo]')) {
      const ok = await confirmDialog({
        title: 'Restablecer la demostración',
        message: 'Se borrarán los cambios que hayas hecho en este navegador y se cargarán de nuevo los datos de ejemplo.',
        confirmLabel: 'Restablecer',
        danger: true,
      });
      if (!ok) return;
      await store.resetDemo();
      toast('Datos de ejemplo restablecidos.', 'ok');
      renderShell(root, 'ajustes');
    }
  });

  const settingsForm = main.querySelector('#settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(settingsForm));
      const sitePatch = {};
      for (const key of ['name', 'parish', 'city', 'email', 'phone', 'whatsapp', 'address', 'meetingSchedule', 'heroTitle', 'heroAccent', 'heroText', 'footerNote', 'instagram', 'facebook']) {
        sitePatch[key] = String(data[key] || '').trim();
      }
      if (!sitePatch.name) {
        toast('El nombre de la pastoral es obligatorio.', 'error');
        return;
      }
      const sections = {};
      for (const section of SECTIONS) {
        if (section.id === 'inicio') continue;
        sections[section.id] = Boolean(data[`section_${section.id}`]);
      }
      const btn = settingsForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        await store.saveSettings({ site: sitePatch, sections });
        toast('Ajustes guardados.', 'ok');
      } catch (err) {
        toast(err.message || 'No se pudieron guardar los ajustes.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  const passwordForm = main.querySelector('#password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(passwordForm));
      if (!data.password || data.password.length < 8) {
        toast('La contraseña debe tener al menos 8 caracteres.', 'error');
        return;
      }
      if (data.password !== data.confirm) {
        toast('Las contraseñas no coinciden.', 'error');
        return;
      }
      const btn = passwordForm.querySelector('button[type="submit"]');
      setBusy(btn, true, 'Actualizando…');
      try {
        await store.changePassword(data.password);
        passwordForm.reset();
        toast('Contraseña actualizada.', 'ok');
      } catch (err) {
        toast(err.message || 'No se pudo cambiar la contraseña.', 'error');
      } finally {
        setBusy(btn, false);
      }
    });
  }

  paintStorage(main);
}
