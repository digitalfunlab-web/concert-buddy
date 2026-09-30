/* Concert Buddy service worker: caches only the app shell (never user data, which lives in localStorage).
   Bump CACHE_VERSION whenever you upload changed files so returning users get the update. */
const CACHE_VERSION='v1',V='concert-buddy-'+CACHE_VERSION;
const SHELL=['./','index.html','styles.css','app.js','manifest.json','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('concert-buddy-')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
/* Stale-while-revalidate for same-origin GETs: instant/offline loads, refreshed in the background. */
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
  const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
  if(hit)e.waitUntil(net.catch(()=>{}));return hit||net}))});
