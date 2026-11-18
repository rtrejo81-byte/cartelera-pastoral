/* =========================================================
   Arranque de la aplicación y enrutamiento
   ========================================================= */

import { boot, store, onChange } from './store.js';
import { currentRoute, normalizePath } from './router.js';
import { renderHeader, renderFooter, toast, site, closeModal } from './ui.js';
import { icon } from './icons.js';
import { qs, debounce } from './utils.js';
import { openActivity, openNotice, openAlbum } from './cards.js';

import homeView from './views/home.js';
import calendarView from './views/calendar.js';
import noticesView from './views/notices.js';
import communityView from './views/community.js';
import resourcesView from './views/resources.js';
import birthdaysView from './views/birthdays.js';
import galleryView from './views/gallery.js';
import photosView from './views/photos.js';
import santisimoView from './views/santisimo.js';
import contactsView from './views/contacts.js';
import prayerView from './views/prayer.js';
import proposeView from './views/propose.js';
import adminView from './views/admin.js';

const ROUTES = {
  '/': homeView,
  '/calendario': calendarView,
  '/avisos': noticesView,
  '/comunidad': communityView,
  '/recursos': resourcesView,
  '/cumpleanos': birthdaysView,
  '/galeria': galleryView,
  '/fotos': photosView,
  '/santisimo': santisimoView,
  '/contactos': contactsView,
  '/oracion': prayerView,
  '/proponer': proposeView,
  '/admin': adminView,
};

const TITLES = {
  '/': 'Inicio',
  '/calendario': 'Calendario',
  '/avisos': 'Avisos',
  '/comunidad': 'Comunidad',
  '/recursos': 'Recursos',
  '/cumpleanos': 'Cumpleaños',
  '/galeria': 'Galería',
  '/fotos': 'Fotos por comunidad',
  '/santisimo': 'Santísimo',
  '/contactos': 'Contactos',
  '/oracion': 'Oración',
  '/proponer': 'Proponer una actividad',
  '/admin': 'Panel de coordinadores',
};

let renderToken = 0;
let lastPath = null;

function notFoundView(root) {
  root.innerHTML = `
    <section class="section">
      <div class="wrap wrap-narrow" style="text-align:center">
        <p class="eyebrow" style="justify-content:center">Error 404</p>
        <h1 class="page-title">No encontramos esta página</h1>
        <p class="page-sub" style="margin-inline:auto">Puede que el enlace haya cambiado o que la sección ya no exista.</p>
        <div class="cluster" style="justify-content:center;margin-top:1.6rem">
          <a class="btn btn-primary" href="#/">${icon('home', 16)} Volver al inicio</a>
          <a class="btn btn-ghost" href="#/calendario">${icon('calendar', 16)} Ver calendario</a>
        </div>
      </div>
    </section>`;
}

export async function renderRoute({ scroll = true, soft = false } = {}) {
  const token = ++renderToken;
  const ctx = currentRoute();
  const base = ctx.path === '/admin' || ctx.path.startsWith('/admin/') ? '/admin' : ctx.path;
  const view = ROUTES[base] || notFoundView;

  const main = qs('#main');
  if (!main) return;

  if (!soft) {
    main.classList.add('is-swapping');
    document.body.classList.add('is-navigating');
  }

  try {
    await view(main, ctx);
  } catch (err) {
    console.error('[app] error al renderizar', err);
    main.innerHTML = `
      <section class="section">
        <div class="wrap wrap-narrow">
          <div class="inline-note" style="background:var(--danger-soft);color:var(--danger)">
            ${icon('alert', 18)}
            <div>
              <strong>Algo salió mal al mostrar esta sección.</strong><br>
              ${String(err?.message || err)}
            </div>
          </div>
          <p class="mt-3"><a class="btn btn-ghost" href="#/">Volver al inicio</a></p>
        </div>
      </section>`;
  }

  if (token !== renderToken) return;

  renderHeader();
  renderFooter();

  const title = TITLES[base] || TITLES[ctx.path] || 'Cartelera';
  document.title = `${title} · ${site().name}`;

  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
  else if (lastPath !== ctx.path) window.scrollTo({ top: 0, behavior: 'auto' });

  lastPath = ctx.path;
  main.classList.remove('is-swapping');
  document.body.classList.remove('is-navigating');

  if (!store.ready) return;
}

const softRefresh = debounce(() => {
  if (!store.ready) return;
  renderRoute({ scroll: false, soft: true });
}, 180);

async function start() {
  try {
    await boot();
  } catch (err) {
    console.error('[app] fallo el arranque', err);
    toast('No se pudieron cargar los datos. Revisa tu conexión.', 'error', 7000);
  }

  const app = qs('#app');
  const bootScreen = qs('#boot');
  if (bootScreen) bootScreen.remove();
  if (app) app.hidden = false;

  await renderRoute({ scroll: false });

  if (store.mode === 'demo' && store.cloudError) {
    toast(`No se pudo conectar con Supabase (${store.cloudError}). Seguimos en modo local.`, 'error', 8000);
  }

  window.addEventListener('hashchange', () => {
    closeModal({ silent: true });
    document.querySelectorAll('.lightbox').forEach((el) => el.remove());
    document.body.classList.remove('no-scroll');
    renderRoute({ scroll: true });
  });

  // Delegación global: cualquier tarjeta abre su detalle
  qs('#main').addEventListener('click', (event) => {
    const activity = event.target.closest('[data-activity]');
    if (activity) {
      openActivity(activity.dataset.activity, activity.dataset.occurrence || null);
      return;
    }
    const notice = event.target.closest('[data-notice]');
    if (notice) {
      openNotice(notice.dataset.notice);
      return;
    }
    const album = event.target.closest('[data-album]');
    if (album) {
      openAlbum(album.dataset.album);
    }
  });

  onChange((type, detail) => {
    if (type === 'error') {
      toast(detail?.message || 'Ocurrió un error.', 'error', 6000);
      return;
    }
    if (type === 'auth') {
      renderHeader();
      softRefresh();
      return;
    }
    softRefresh();
  });

  window.addEventListener('online', () => toast('Conexión restablecida.', 'ok'));
  window.addEventListener('offline', () => toast('Sin conexión. Algunas funciones no estarán disponibles.', 'error'));

  if (store.mode === 'demo') {
    console.info('%cPastoral Familiar · modo demo local', 'color:#C0643C;font-weight:bold');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
