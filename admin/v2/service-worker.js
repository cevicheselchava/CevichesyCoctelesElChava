const CACHE='el-cubano-panel-v2-1';
const SHELL=[
  '/admin/v2/',
  '/admin/v2/index.html',
  '/admin/v2/styles.css?v=20260905-3',
  '/admin/v2/app.js?v=20260905-3',
  '/admin/v2/manifest.webmanifest',
  '/admin/v2/panel-icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('el-cubano-panel-v2-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    try{
      return await fetch(new Request(event.request,{cache:'no-store'}));
    }catch(error){
      return (await caches.match(event.request))||(await caches.match('/admin/v2/'));
    }
  })());
});
