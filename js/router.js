/* =========================================================
   Router por hash (funciona en GitHub Pages sin configuración)
   ========================================================= */

export function normalizePath(path = '/') {
  let clean = String(path).split('?')[0].trim();
  if (!clean.startsWith('/')) clean = '/' + clean;
  clean = clean.replace(/\/+$/, '') || '/';
  return clean;
}

export function currentRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return {
    path: normalizePath(path),
    params: new URLSearchParams(query),
  };
}

export function navigate(path, { replace = false, keepScroll = false } = {}) {
  const target = `#${path.startsWith('/') ? path : '/' + path}`;
  if (replace) history.replaceState(null, '', target);
  else location.hash = target;
  if (!keepScroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

export function onRouteChange(callback) {
  window.addEventListener('hashchange', () => callback(currentRoute()));
}

export function href(path) {
  return `#${path}`;
}
