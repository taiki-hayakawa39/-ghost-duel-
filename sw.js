/* ゴースト・デュエル：同一オリジン内の静的ファイルをオフライン保持 */
const CACHE_NAME='ghost-duel-shell-v20261120-scout-mode-v2';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ghost-duel-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return; // PeerJS/CDNはキャッシュしない
  if(request.mode==='navigate'){
    event.respondWith(
      (async()=>{
        try{
          const response=await fetch(request);
          if(response.ok){
            const copy=response.clone();
            try{const cache=await caches.open(CACHE_NAME);await cache.put('./index.html',copy);}catch{}
          }
          return response;
        }catch{
          return (await caches.match('./index.html'))||Response.error();
        }
      })()
    );
    return;
  }
  const pathname=url.pathname;
  if(!/\.(?:png|webmanifest|svg)$/.test(pathname))return;
  event.respondWith(
    (async()=>{
      const cached=await caches.match(request);
      if(cached)return cached;
      const response=await fetch(request);
      if(response.ok){
        const copy=response.clone();
        try{const cache=await caches.open(CACHE_NAME);await cache.put(request,copy);}catch{}
      }
      return response;
    })()
  );
});
