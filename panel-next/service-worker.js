const CACHE_NAME = 'panel-operativo-v3';
const APP_URL = '/panel-next/app';
const APP_SHELL = [
  APP_URL,
  '/panel-next/styles.css',
  '/panel-next/watermarks.css',
  '/panel-next/admin-shell.css',
  '/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(async url => {
      const response = await fetch(url, { cache:'reload' });
      if (response.ok) await cache.put(url, response.clone());
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('panel-operativo-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function fetchWithTimeout(request, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { cache:'no-store', signal:controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/panel-next/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        // Siempre abre la ruta estable del panel. Esto también corrige instalaciones
        // antiguas cuyo start_url todavía apunta a app.html.
        const response = await fetchWithTimeout(new Request(APP_URL, {
          headers: request.headers,
          credentials:'same-origin',
          redirect:'follow'
        }));
        if (response && response.ok) {
          await cache.put(APP_URL, response.clone());
          return response;
        }
      } catch (_) {}

      const cached = await cache.match(APP_URL);
      if (cached) return cached;
      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panel Operativo</title><body style="font-family:Arial;padding:24px"><h2>Panel Operativo</h2><p>No se pudo cargar. Revisa tu conexión y vuelve a abrir la app.</p></body>', {
        headers:{'Content-Type':'text/html; charset=utf-8'}
      });
    })());
    return;
  }

  const cacheable = ['/panel-next/styles.css','/panel-next/watermarks.css','/panel-next/admin-shell.css'];
  if (cacheable.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url.pathname);
      const networkPromise = fetch(request, {cache:'no-store'}).then(async response => {
        if (response.ok) await cache.put(url.pathname, response.clone());
        return response;
      }).catch(() => null);
      return cached || await networkPromise || Response.error();
    })());
  }
});
