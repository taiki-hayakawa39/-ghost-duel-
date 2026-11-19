/* ゴースト・デュエル：同一オリジン内の静的ファイルをオフライン保持 */
const CACHE_NAME='ghost-duel-shell-v20261119-13-18';
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
      fetch(request).then(response=>{
        if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)));}
        return response;
      }).catch(()=>caches.match('./index.html').then(cached=>cached||Response.error()))
    );
    return;
  }
  const pathname=url.pathname;
  if(!/\.(?:png|webmanifest|svg)$/.test(pathname))return;
  event.respondWith(
    caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));}
      return response;
    }))
  );
});
