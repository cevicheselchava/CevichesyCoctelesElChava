const CACHE_NAME = 'panel-operativo-v4';
const APP_URL = '/panel-next/app';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(APP_URL, { cache:'reload' });
      if (response.ok) await cache.put(APP_URL, response.clone());
    } catch (_) {}
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

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/panel-next/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache:'no-store' });
        if (response && response.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(APP_URL, response.clone());
          } catch (_) {}
          return response;
        }
      } catch (_) {}

      try {
        const fallback = await fetch(APP_URL, { cache:'no-store' });
        if (fallback && fallback.ok) return fallback;
      } catch (_) {}

      const cached = await caches.match(APP_URL);
      if (cached) return cached;

      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panel Operativo</title><body style="font-family:Arial;padding:24px"><h2>Panel Operativo</h2><p>No se pudo cargar. Cierra y vuelve a abrir la app.</p></body>', {
        headers:{ 'Content-Type':'text/html; charset=utf-8' }
      });
    })());
  }
});
