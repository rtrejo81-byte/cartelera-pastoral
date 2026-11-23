/* Service worker de la Pastoral Familiar.
   Guarda el armazón de la web para que el icono abra rápido y
   siga funcionando sin conexión. Los datos de Supabase no se
   cachean: siempre se piden a la nube. */

const VERSION = 'pf-cartelera-v2';
const CACHE = `pf-cache-${VERSION}`;
const INDEX = new URL('./index.html', self.location).href;

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/base.css',
  './assets/css/app.css',
  './assets/css/calendar.css',
  './assets/css/admin.css',
  './assets/img/logo-mark.png',
  './assets/img/favicon.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/icon-maskable-512.png',
  './assets/img/apple-touch-icon.png',
  './assets/img/facebook.svg',
  './js/app.js',
  './js/config.js',
  './js/store.js',
  './js/router.js',
  './js/ui.js',
  './js/cards.js',
  './js/utils.js',
  './js/seed.js',
  './js/icons.js',
  './js/recurrence.js',
  './js/vendor/qrcode.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(CORE.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('pf-cache-') && key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          return (await caches.match(request)) || (await caches.match(INDEX)) || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '#/', self.registration.scope).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if ('focus' in client) {
          if ('navigate' in client) {
            try {
              await client.navigate(target);
            } catch {
              /* si no se puede navegar, solo enfocamos */
            }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })()
  );
});
