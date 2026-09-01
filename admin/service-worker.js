const CACHE='el-cubano-admin-v4';
const SHELL=[
  '/admin/',
  '/admin/manifest.webmanifest',
  '/pwa-icon.svg'
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
    await Promise.all(keys.filter(k=>k.startsWith('el-cubano-admin-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith((async()=>{
    try{
      return await fetch(new Request(event.request,{cache:'no-store'}));
    }catch(error){
      return (await caches.match(event.request))||(await caches.match('/admin/'));
    }
  })());
});
