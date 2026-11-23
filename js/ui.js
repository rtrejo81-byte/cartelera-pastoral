/* =========================================================
   Interfaz compartida: cabecera, pie, modales, toasts
   ========================================================= */

import { icon } from './icons.js';
import { SECTIONS, SITE, STATUS, CATEGORIES } from './config.js';
import { store } from './store.js';
import { esc, qs, qsa } from './utils.js';

/* ---------------- Ajustes y utilidades del sitio ---------------- */
export function site() {
  return { ...SITE, ...(store.settings?.site || {}) };
}

export function sectionEnabled(id) {
  const flags = store.settings?.sections || {};
  return flags[id] !== false && flags[id] !== 'false';
}

export function navSections() {
  return SECTIONS.filter((s) => s.nav && sectionEnabled(s.id));
}

export function categoryMeta(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

export function categoryBadge(id) {
  const c = categoryMeta(id);
  return `<span class="badge" style="background:${c.bg};color:${c.color}"><span class="pill-dot" style="--dot:${c.color}"></span>${esc(c.label)}</span>`;
}

export function statusBadge(status = 'approved') {
  const meta = STATUS[status] || STATUS.approved;
  return `<span class="badge ${meta.badge}">${esc(meta.label)}</span>`;
}

/* ---------------- Toasts ---------------- */
export function toast(message, type = 'info', timeout = 4200) {
  const root = qs('#toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'is-error' : type === 'ok' ? 'is-ok' : ''}`;
  const glyph = type === 'error' ? 'alert' : type === 'ok' ? 'check-circle' : 'info';
  el.innerHTML = `${icon(glyph, 18)}<span>${esc(message)}</span>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  const remove = () => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 280);
  };
  el.addEventListener('click', remove);
  setTimeout(remove, timeout);
}

/* ---------------- Modal ---------------- */
let activeModal = null;
let lastFocused = null;

export function openModal({ title, subtitle = '', body = '', footer = '', wide = false, onMount, onClose } = {}) {
  closeModal({ silent: true });
  lastFocused = document.activeElement;

  const root = qs('#modal-root');
  const el = document.createElement('div');
  el.className = 'modal';
  el.innerHTML = `
    <div class="modal-dialog ${wide ? 'is-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <div>
          <h2 id="modal-title">${esc(title)}</h2>
          ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
        </div>
        <button type="button" class="btn-icon" data-close aria-label="Cerrar">${icon('x', 18)}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;

  root.appendChild(el);
  document.body.classList.add('no-scroll');
  activeModal = { el, onClose };

  el.addEventListener('click', (event) => {
    if (event.target === el) closeModal();
  });
  qsa('[data-close]', el).forEach((btn) => btn.addEventListener('click', () => closeModal()));

  requestAnimationFrame(() => el.classList.add('open'));

  const focusable = el.querySelector('input:not([type="hidden"]), textarea, select, button:not([data-close]), a[href]');
  setTimeout(() => focusable?.focus(), 60);

  onMount?.(el);
  return { el, close: () => closeModal() };
}

export function closeModal({ silent = false } = {}) {
  if (!activeModal) return;
  const { el, onClose } = activeModal;
  activeModal = null;
  el.classList.remove('open');
  document.body.classList.remove('no-scroll');
  setTimeout(() => el.remove(), 240);
  if (!silent) {
    onClose?.();
    lastFocused?.focus?.();
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeModal) {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== 'Tab' || !activeModal) return;
  const focusables = qsa(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    activeModal.el
  ).filter((n) => n.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

/* ---------------- Confirmación ---------------- */
export function confirmDialog({ title = '¿Estás seguro?', message = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const { el } = openModal({
      title,
      body: `<p style="margin:0;color:var(--ink-2);line-height:1.65">${esc(message)}</p>`,
      footer: `
        <button type="button" class="btn btn-ghost" data-cancel>${esc(cancelLabel)}</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${esc(confirmLabel)}</button>`,
      onClose: () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      },
    });
    el.querySelector('[data-cancel]').addEventListener('click', () => closeModal());
    el.querySelector('[data-confirm]').addEventListener('click', () => {
      settled = true;
      closeModal({ silent: true });
      resolve(true);
    });
  });
}

/* ---------------- Cabecera ---------------- */
export function renderHeader() {
  const s = site();
  const nav = navSections();
  const path = location.hash.replace(/^#/, '').split('?')[0] || '/';
  const link = (item, mobile = false) => {
    const active = path === item.path || (item.path !== '/' && path.startsWith(item.path));
    const cls = mobile ? 'drawer-link' : 'nav-link';
    const current = active ? ' aria-current="page"' : '';
    return `<a class="${cls}" href="#${item.path}"${current}>${mobile ? icon(item.icon, 18) : ''}${esc(item.label)}</a>`;
  };

  const secondary = SECTIONS.filter((sec) => !sec.nav && sec.id !== 'proponer' && sectionEnabled(sec.id));

  qs('#site-header').innerHTML = `
    ${store.mode === 'demo' ? demoBanner() : ''}
    <div class="wrap header-inner">
      <a class="brand" href="#/" aria-label="${esc(s.name)} · inicio">
        <img class="brand-mark" src="assets/img/logo-mark.png" alt="" width="54" height="54">
        <span class="brand-text">
          <span class="brand-name">${esc(s.name)}</span>
          <span class="brand-sub">${esc(s.parish)}</span>
        </span>
      </a>
      <nav class="nav" aria-label="Menú principal">
        ${nav.map((item) => link(item)).join('')}
      </nav>
      <div class="header-actions">
        <a class="btn btn-primary" href="#/proponer" aria-label="Proponer actividad" title="Proponer actividad">${icon('plus', 16)}<span>Proponer actividad</span></a>
        <a class="btn-icon" href="#/admin" aria-label="Panel de coordinadores" title="Panel de coordinadores">${icon('user', 18)}</a>
      </div>
      <button type="button" class="btn-icon nav-toggle" id="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="drawer">${icon('menu', 20)}</button>
    </div>
    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <aside class="drawer" id="drawer" aria-label="Menú">
      <div class="drawer-head">
        <span class="brand">
          <img class="brand-mark" src="assets/img/logo-mark.png" alt="" width="48" height="48">
          <span class="brand-text"><span class="brand-name">${esc(s.name)}</span></span>
        </span>
        <button type="button" class="btn-icon" id="drawer-close" aria-label="Cerrar menú">${icon('x', 18)}</button>
      </div>
      <nav class="drawer-nav">
        ${nav.map((item) => link(item, true)).join('')}
        <div class="divider" style="margin:.7rem 0"></div>
        ${secondary.map((item) => link(item, true)).join('')}
      </nav>
      <div class="drawer-foot">
        <a class="btn btn-primary btn-block" href="#/proponer">${icon('plus', 16)} Proponer actividad</a>
        <a class="btn btn-ghost btn-block" href="#/admin">${icon('user', 16)} Panel de coordinadores</a>
      </div>
    </aside>`;

  const drawer = qs('#drawer');
  const backdrop = qs('#drawer-backdrop');
  const toggle = qs('#nav-toggle');

  const setDrawer = (open) => {
    drawer.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  };

  toggle.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  qs('#drawer-close').addEventListener('click', () => setDrawer(false));
  backdrop.addEventListener('click', () => setDrawer(false));
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a')) setDrawer(false);
  });

  if (!renderHeader._scrollBound) {
    renderHeader._scrollBound = true;
    const onScroll = () => qs('#site-header')?.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

function demoBanner() {
  return `<div class="mode-banner no-print">
    <span>${icon('sparkles', 16)}</span>
    <span><b>Modo demostración:</b> los datos se guardan solo en este navegador. Conecta Supabase para que tu equipo edite desde cualquier dispositivo.</span>
    <a href="#/admin/ajustes">Configurar</a>
  </div>`;
}

/* ---------------- Pie ---------------- */
export function renderFooter() {
  const s = site();
  const year = new Date().getFullYear();
  const nav = SECTIONS.filter((sec) => sec.id !== 'proponer' && sectionEnabled(sec.id));
  const hasSocial = Boolean(s.instagram || s.facebook || s.whatsapp);

  qs('#site-footer').innerHTML = `
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <span class="brand">
            <img class="brand-mark" src="assets/img/logo-mark.png" alt="" width="54" height="54">
            <span class="brand-text">
              <span class="brand-name">${esc(s.name)}</span>
              <span class="brand-sub">${esc(s.parish)}</span>
            </span>
          </span>
          <p>${esc(s.heroText || '')}</p>
        </div>
        <div class="footer-col">
          <h4>Cartelera</h4>
          <ul>
            ${nav.slice(0, 5).map((item) => `<li><a href="#${item.path}">${esc(item.label)}</a></li>`).join('')}
            <li><a href="#/proponer">Proponer una actividad</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Comunidad</h4>
          <ul>
            ${nav.slice(5).map((item) => `<li><a href="#${item.path}">${esc(item.label)}</a></li>`).join('')}
            <li><button type="button" class="footer-install" data-install-app>${icon('download', 14)} Instalar app en el teléfono</button></li>
            <li><a href="#/admin">Panel de coordinadores</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contacto</h4>
          <ul>
            ${s.email ? `<li><a href="mailto:${esc(s.email)}">${icon('mail', 15)} ${esc(s.email)}</a></li>` : ''}
            ${s.phone ? `<li><a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${icon('phone', 15)} ${esc(s.phone)}</a></li>` : ''}
            ${s.address ? `<li><span>${icon('map-pin', 15)} ${esc(s.address)}</span></li>` : ''}
            ${s.meetingSchedule ? `<li><span>${icon('clock', 15)} ${esc(s.meetingSchedule)}</span></li>` : ''}
          </ul>
          ${
            hasSocial
              ? `<p class="footer-social-title">Redes sociales</p>
                 <div class="cluster" style="margin-top:.45rem">
                   ${s.instagram ? `<a class="btn-icon" href="${esc(s.instagram)}" target="_blank" rel="noopener" aria-label="Instagram" style="width:34px;height:34px;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#E9F0EC">${icon('instagram', 16)}</a>` : ''}
                   ${s.facebook ? `<a class="btn-icon" href="${esc(s.facebook)}" target="_blank" rel="noopener" aria-label="Facebook" style="width:34px;height:34px;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#E9F0EC"><img src="assets/img/facebook.svg" alt="" width="18" height="18"></a>` : ''}
                   ${s.whatsapp ? `<a class="btn-icon" href="https://wa.me/${esc(String(s.whatsapp).replace(/\D/g, ''))}" target="_blank" rel="noopener" aria-label="WhatsApp" style="width:34px;height:34px;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);color:#E9F0EC">${icon('whatsapp', 16)}</a>` : ''}
                 </div>`
              : ''
          }
          <div class="footer-notify">
            <p class="footer-social-title">Notificaciones</p>
            <button type="button" class="footer-install" data-notify>${icon('bell', 14)} Activar notificaciones</button>
            <button type="button" class="footer-install" data-test-notify>${icon('send', 14)} Probar notificación</button>
            <button type="button" class="footer-install" data-refresh-now>${icon('refresh', 14)} Actualizar ahora</button>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${year} ${esc(s.name)} · ${esc(s.parish)}</span>
        <span class="footer-note">${icon('heart', 13)} ${esc(s.footerNote || '')}</span>
      </div>
    </div>`;
}

/* ---------------- Encabezado de página ---------------- */
export function pageHead({ title, subtitle = '', actions = '', eyebrow = '', breadcrumb = '' } = {}) {
  return `
    <section class="page-head">
      <div class="wrap">
        ${breadcrumb ? `<nav class="breadcrumb" aria-label="Ruta">${breadcrumb}</nav>` : ''}
        <div class="page-head-inner">
          <div>
            ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
            <h1 class="page-title">${esc(title)}</h1>
            ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
          </div>
          ${actions ? `<div class="page-actions">${actions}</div>` : ''}
        </div>
      </div>
    </section>`;
}

/* ---------------- Estados vacíos ---------------- */
export function emptyState({ icon: iconName = 'sparkles', title = 'Aún no hay nada aquí', text = '', action = '' } = {}) {
  return `<div class="empty">
    <span class="empty-icon">${icon(iconName, 24)}</span>
    <h3>${esc(title)}</h3>
    ${text ? `<p>${esc(text)}</p>` : ''}
    ${action}
  </div>`;
}

export function loadingBlock(label = 'Cargando…') {
  return `<div class="empty"><span class="empty-icon">${icon('clock', 22)}</span><p>${esc(label)}</p></div>`;
}

/* ---------------- Campos de formulario ---------------- */
export function field({ label, name, type = 'text', value = '', required = false, placeholder = '', hint = '', options = null, rows = 4, min = '', max = '', maxlength = null, autocomplete = '' }) {
  const id = `f_${name}`;
  const req = required ? ' required' : '';
  const reqMark = required ? ' <span class="req">*</span>' : '';
  const maxLen = maxlength ? ` maxlength="${esc(maxlength)}"` : '';
  let control = '';

  if (type === 'textarea') {
    control = `<textarea class="textarea" id="${id}" name="${name}" rows="${rows}" placeholder="${esc(placeholder)}"${maxLen}${req}>${esc(value)}</textarea>`;
  } else if (type === 'select') {
    control = `<select class="select" id="${id}" name="${name}"${req}>
      ${(options || []).map((opt) => `<option value="${esc(opt.value)}"${String(opt.value) === String(value) ? ' selected' : ''}>${esc(opt.label)}</option>`).join('')}
    </select>`;
  } else if (type === 'checkbox') {
    return `<label class="check"><input type="checkbox" id="${id}" name="${name}"${value ? ' checked' : ''}><span>${esc(label)}</span></label>`;
  } else {
    control = `<input class="input" id="${id}" name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"${min !== '' ? ` min="${esc(min)}"` : ''}${max !== '' ? ` max="${esc(max)}"` : ''}${maxLen}${autocomplete ? ` autocomplete="${esc(autocomplete)}"` : ''}${req}>`;
  }

  return `<div class="field">
    <label class="label" for="${id}">${esc(label)}${reqMark}</label>
    ${control}
    ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}
  </div>`;
}

export function readForm(form) {
  const data = {};
  const els = qsa('input, select, textarea', form);
  for (const el of els) {
    if (!el.name) continue;
    if (el.type === 'checkbox') data[el.name] = el.checked;
    else if (el.type === 'number') data[el.name] = el.value === '' ? null : Number(el.value);
    else data[el.name] = el.value.trim();
  }
  return data;
}

export function showFormError(form, message) {
  let box = form.querySelector('.form-error');
  if (!box) {
    box = document.createElement('div');
    box.className = 'form-error inline-note';
    box.style.background = 'var(--danger-soft)';
    box.style.color = 'var(--danger)';
    form.prepend(box);
  }
  box.innerHTML = `${icon('alert', 16)}<span>${esc(message)}</span>`;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function setBusy(button, busy, busyLabel = 'Guardando…') {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `${icon('clock', 16)} ${esc(busyLabel)}`;
  } else {
    button.disabled = false;
    if (button.dataset.label) button.innerHTML = button.dataset.label;
  }
}
