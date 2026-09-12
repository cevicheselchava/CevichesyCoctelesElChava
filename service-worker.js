const CACHE_NAME = 'el-cubano-pwa-v5';
const STATIC_SHELL = ['/manifest.webmanifest','/pwa-icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(STATIC_SHELL.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('el-cubano-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function freshNetwork(request) {
  return fetch(new Request(request, { cache: 'no-store', redirect: 'follow' }));
}

async function freshCustomerPage() {
  const response = await fetch(new Request('/', { cache: 'no-store', redirect: 'follow' }));
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  let html = await response.text();
  html = html
    .replace('class="section promo-section open" data-group="promotions"', 'class="section promo-section" data-group="promotions"')
    .replace('class="section-title promo-title" type="button" aria-expanded="true"', 'class="section-title promo-title" type="button" aria-expanded="false"');
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return new Response(html, { status: 200, headers });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await freshNetwork(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/panel-next' || url.pathname.startsWith('/panel-next/')) return;
  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(freshCustomerPage());
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(freshCustomerPage());
    return;
  }
  const isAdminLegacy = ['/control.html','/control-fix.js','/control-theme.js'].includes(url.pathname);
  if (isAdminLegacy || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
