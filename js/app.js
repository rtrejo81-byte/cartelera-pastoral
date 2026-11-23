/* =========================================================
   Arranque de la aplicación y enrutamiento
   ========================================================= */

import { boot, store, onChange } from './store.js';
import { currentRoute, normalizePath } from './router.js';
import { renderHeader, renderFooter, toast, site, closeModal, openModal } from './ui.js';
import { icon } from './icons.js';
import { qs, debounce, esc } from './utils.js';
import { openActivity, openNotice, openAlbum, openImageLightbox } from './cards.js';

import homeView from './views/home.js';
import calendarView from './views/calendar.js';
import noticesView from './views/notices.js';
import shareView from './views/share.js';
import qrView from './views/qr.js';
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
  '/compartir': shareView,
  '/qr': qrView,
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
  '/compartir': 'Compartir',
  '/qr': 'Compartir QR',
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
  updateNotifyLabel();

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
  // No repintar mientras alguien escribe: evita perder datos o cerrar un modal.
  const loginOpen = Boolean(document.querySelector('#login-form'));
  const blocked =
    (document.querySelector('.modal.open, #main form') && !loginOpen) ||
    (!loginOpen && document.activeElement?.matches?.('input, textarea, select'));
  if (blocked) {
    setTimeout(() => softRefresh(), 2500);
    return;
  }
  renderRoute({ scroll: false, soft: true });
}, 180);

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  toast('La app quedó instalada en tu teléfono.', 'ok');
});

function updateNotifyLabel() {
  document.querySelectorAll('[data-notify]').forEach((button) => {
    let label = 'Activar notificaciones';
    if (!('Notification' in window) || typeof window.Notification.requestPermission !== 'function') label = 'Notificaciones no disponibles';
    else if (window.Notification.permission === 'granted') label = 'Notificaciones activas';
    else if (window.Notification.permission === 'denied') label = 'Notificaciones bloqueadas';
    button.innerHTML = `${icon('bell', 14)} ${label}`;
  });
}

async function showBrowserNotification(title, body, url = '#/') {
  if (!('Notification' in window) || window.Notification.permission !== 'granted') return;
  const options = {
    body,
    icon: 'assets/img/icon-192.png',
    badge: 'assets/img/icon-192.png',
    tag: 'pf-cartelera',
    data: { url },
  };
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(title, options);
        return;
      }
    }
    new window.Notification(title, options);
  } catch {
    /* el navegador puede bloquearlo sin avisar */
  }
}

async function enableNotifications() {
  if (!('Notification' in window) || typeof window.Notification.requestPermission !== 'function') {
    toast('Este navegador no permite notificaciones. En iPhone, agrega la web a la pantalla de inicio y ábrela desde ahí.', 'error', 8000);
    return;
  }
  if (window.Notification.permission === 'denied') {
    toast('Las notificaciones están bloqueadas. Actívalas desde la configuración del navegador para este sitio.', 'error', 8000);
    return;
  }
  if (window.Notification.permission === 'granted') {
    updateNotifyLabel();
    await showBrowserNotification('Notificaciones activas', 'Te avisaremos cuando haya algo nuevo en la cartelera.', '#/');
    toast('Las notificaciones ya están activas.', 'ok');
    return;
  }
  const permission = await window.Notification.requestPermission();
  updateNotifyLabel();
  if (permission === 'granted') {
    toast('Notificaciones activadas.', 'ok');
    await showBrowserNotification('Notificaciones activadas', 'Te avisaremos cuando se publique algo nuevo.', '#/');
  } else {
    toast('No se activaron las notificaciones. Puedes intentarlo de nuevo desde el pie de la página.', 'info', 6000);
  }
}

async function testNotification() {
  if (!('Notification' in window) || typeof window.Notification.requestPermission !== 'function') {
    toast('Este navegador no permite notificaciones. En iPhone debe estar instalada como app y con iOS actualizado.', 'error', 9000);
    return;
  }
  if (window.Notification.permission === 'denied') {
    toast('Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador para este sitio.', 'error', 9000);
    return;
  }
  if (window.Notification.permission !== 'granted') {
    const permission = await window.Notification.requestPermission();
    updateNotifyLabel();
    if (permission !== 'granted') {
      toast('No se dio permiso para las notificaciones.', 'info', 6000);
      return;
    }
  }
  toast('La notificación de prueba llegará en 7 segundos. Puedes bloquear el teléfono o cambiar de app.', 'info', 9000);
  setTimeout(() => {
    showBrowserNotification('Prueba de la Pastoral Familiar', 'Si ves este aviso, las notificaciones funcionan en este teléfono.', '#/');
  }, 7000);
}

function notifyRealtime(detail) {
  if (!detail?.name || detail.eventType === 'DELETE') return;
  const row = detail.row || {};
  if (Object.prototype.hasOwnProperty.call(row, 'status') && row.status !== 'approved') return;
  if (detail.name === 'prayers' && row.visibility !== 'public') return;

  const verb = detail.eventType === 'INSERT' ? 'Nuevo' : 'Actualizado';
  const snippet = (value, limit = 90) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
  };

  let title = 'La cartelera se actualizó';
  let body = 'Hay novedades en la Pastoral Familiar.';
  let url = '#/';

  switch (detail.name) {
    case 'activities':
      title = detail.eventType === 'INSERT' ? 'Nueva actividad' : 'Actividad actualizada';
      body = snippet(row.title) || body;
      url = '#/calendario';
      break;
    case 'notices':
      title = detail.eventType === 'INSERT' ? 'Nuevo aviso' : 'Aviso actualizado';
      body = snippet(row.title) || body;
      url = '#/avisos';
      break;
    case 'shares':
      title = detail.eventType === 'INSERT' ? 'Nuevo mensaje en Compartir' : 'Mensaje actualizado';
      body = `${snippet(row.name || 'Anónimo', 30)}: ${snippet(row.message, 80)}`;
      url = '#/compartir';
      break;
    case 'albums':
      title = detail.eventType === 'INSERT' ? 'Nuevo álbum' : 'Galería actualizada';
      body = snippet(row.title) || body;
      url = '#/galeria';
      break;
    case 'birthdays':
      title = detail.eventType === 'INSERT' ? 'Nueva celebración' : 'Celebración actualizada';
      body = snippet(row.name) || body;
      url = '#/cumpleanos';
      break;
    case 'resources':
      title = detail.eventType === 'INSERT' ? 'Nuevo recurso' : 'Recurso actualizado';
      body = snippet(row.title) || body;
      url = '#/recursos';
      break;
    case 'contacts':
      title = 'Directorio actualizado';
      body = 'Se actualizaron los contactos de la pastoral.';
      url = '#/contactos';
      break;
    case 'prayers':
      title = 'Nueva intención';
      body = 'Alguien compartió una intención pública.';
      url = '#/oracion';
      break;
    case 'holyHours':
      title = 'Horario del Santísimo actualizado';
      body = 'Revisa el horario de adoración por comunidad.';
      url = '#/santisimo';
      break;
    case 'serviceAssignments':
      title = 'Servicios actualizados';
      body = 'Cambió la comunidad asignada a una misa.';
      url = '#/calendario';
      break;
    default:
      break;
  }

  if (document.visibilityState === 'visible' && document.hasFocus()) {
    toast(`${title}: ${body}`, 'info', 4500);
  } else {
    showBrowserNotification(title, body, url);
  }
}

function showInstallHelp() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) {
    toast('Ya estás usando la cartelera como app instalada.', 'info');
    return;
  }
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = /FBAN|FBAV|Instagram|Line|WhatsApp|Twitter|LinkedIn/i.test(ua);
  const url = `${location.origin}${location.pathname}`;

  let body;
  if (inApp) {
    body = `<p>Estás viendo la web dentro de otra aplicación (WhatsApp, Facebook, Instagram…). Para instalar la app:</p>
      <ol style="margin:.6rem 0 0;padding-left:1.2rem;display:grid;gap:.5rem">
        <li>Abre este enlace en <b>Chrome</b> (Android) o <b>Safari</b> (iPhone):<br><b>${esc(url)}</b></li>
        <li>Toca el menú del navegador.</li>
        <li>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li>
      </ol>`;
  } else if (ios) {
    body = `<p>En iPhone o iPad se instala desde <b>Safari</b>:</p>
      <ol style="margin:.6rem 0 0;padding-left:1.2rem;display:grid;gap:.5rem">
        <li>Abre esta página en <b>Safari</b>.</li>
        <li>Toca el botón <b>Compartir</b>.</li>
        <li>Elige <b>Agregar a pantalla de inicio</b> y confirma.</li>
      </ol>
      <p class="field-hint" style="margin-top:.7rem">Si estás en Chrome de iPhone, el menú puede no mostrar la opción; usa Safari.</p>`;
  } else {
    body = `<p>En Android o en la computadora se instala desde <b>Chrome</b>:</p>
      <ol style="margin:.6rem 0 0;padding-left:1.2rem;display:grid;gap:.5rem">
        <li>Abre esta página en <b>Chrome</b>.</li>
        <li>Toca el menú <b>⋮</b>.</li>
        <li>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li>
        <li>Confirma. El icono aparecerá como una app más.</li>
      </ol>
      <p class="field-hint" style="margin-top:.7rem">En computadora, el icono de instalar suele estar en la barra de direcciones. Si no aparece, asegúrate de no estar en una ventana de incógnito.</p>`;
  }

  openModal({
    title: 'Instalar la cartelera',
    subtitle: 'Un icono en tu teléfono, sin pasar por la tienda de apps.',
    body,
    footer: '<button type="button" class="btn btn-primary" data-close>Entendido</button>',
  });
}

async function autoRefreshContent() {
  if (store.mode !== 'cloud' || !store.ready) return;
  if (document.visibilityState !== 'visible') return;
  if (!navigator.onLine) return;
  if (location.hash.startsWith('#/qr')) return;
  if (document.querySelector('.modal.open, .lightbox.open')) return;
  if (document.querySelector('#main form')) return;
  const active = document.activeElement;
  if (active && active.matches && active.matches('input, textarea, select')) return;
  await store.refreshNow();
}

let assetTags = null;
let updateNoticeShown = false;

async function checkAppVersion() {
  if (document.visibilityState !== 'visible') return;
  try {
    const urls = ['index.html', 'js/app.js', 'assets/css/app.css'];
    const tags = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(`${url}?v=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        return response.headers.get('etag') || response.headers.get('last-modified') || response.headers.get('content-length') || '';
      })
    );
    const signature = tags.join('|');
    if (!assetTags) {
      assetTags = signature;
      return;
    }
    if (signature === assetTags) return;
    if (document.querySelector('.modal.open, #main form')) {
      if (!updateNoticeShown) {
        updateNoticeShown = true;
        toast('Hay una versión nueva de la cartelera. Cierra el formulario y recarga para verla.', 'info', 8000);
      }
      return;
    }
    assetTags = signature;
    toast('Actualizando a la última versión…', 'info', 1200);
    setTimeout(() => window.location.reload(), 600);
  } catch {
    /* si no hay red, se reintenta después */
  }
}

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

  // Las imágenes de actividades y avisos se abren en grande.
  document.addEventListener('click', (event) => {
    const image = event.target.closest('[data-image-open]');
    if (!image) return;
    event.preventDefault();
    event.stopPropagation();
    openImageLightbox(image.dataset.imageOpen, image.querySelector('img')?.alt || '');
  });

  // Botón "Instalar app" del pie.
  document.addEventListener('click', async (event) => {
    const install = event.target.closest('[data-install-app]');
    if (!install) return;
    event.preventDefault();
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        installPrompt = null;
        if (choice?.outcome === 'accepted') toast('Instalando la cartelera…', 'ok');
        else toast('Puedes instalarla cuando quieras desde el pie de página.', 'info');
      } catch {
        showInstallHelp();
      }
      return;
    }
    showInstallHelp();
  });

  // Activar notificaciones del navegador.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-notify]')) return;
    event.preventDefault();
    enableNotifications();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-test-notify]')) return;
    event.preventDefault();
    testNotification();
  });

  // Actualizar el contenido a pedido.
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-refresh-now]');
    if (!button) return;
    event.preventDefault();
    if (store.mode !== 'cloud') {
      toast('Estás en modo demo local; los cambios ya están en este navegador.', 'info');
      return;
    }
    button.disabled = true;
    try {
      const changed = await store.refreshNow();
      toast(changed ? 'Cartelera actualizada.' : 'No hay cambios nuevos.', 'ok');
    } catch {
      toast('No se pudo actualizar. Revisa la conexión.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  onChange((type, detail) => {
    if (type === 'error') {
      toast(detail?.message || 'Ocurrió un error.', 'error', 6000);
      return;
    }
    if (type === 'realtime') {
      notifyRealtime(detail);
      softRefresh();
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

  // Respaldo del tiempo real: revisa cambios cada minuto y al volver a la pestaña.
  setInterval(autoRefreshContent, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      autoRefreshContent();
      checkAppVersion();
    }
  });
  window.addEventListener('online', autoRefreshContent);
  window.addEventListener('online', checkAppVersion);

  // Si publicamos una versión nueva, la app abierta se actualiza sola.
  checkAppVersion();
  setInterval(checkAppVersion, 5 * 60 * 1000);

  if (store.mode === 'demo') {
    console.info('%cPastoral Familiar · modo demo local', 'color:#C0643C;font-weight:bold');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

if ('serviceWorker' in navigator) {
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (document.querySelector('.modal.open, #main form')) {
      toast('Hay una versión nueva de la cartelera. Cierra el formulario y recarga para verla.', 'info', 8000);
      return;
    }
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      const check = () => registration.update().catch(() => {});
      check();
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    }).catch((err) => {
      console.warn('[pwa] no se pudo registrar el service worker', err);
    });
  });
}
