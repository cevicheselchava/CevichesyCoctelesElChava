const CACHE_NAME = 'el-chava-pwa-v4';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-icon.svg',
  '/logo.png',
  '/pwa-init.js',
  '/order-fix.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isAdmin = ['/control.html','/control-fix.js','/control-theme.js'].includes(url.pathname);

  if (isAdmin) {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(new Request(request, { cache: 'no-store' }));
      } catch (error) {
        return (await caches.match('/index.html')) || (await caches.match('/'));
      }
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then(async response => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    });

    return cached || network;
  })());
});
