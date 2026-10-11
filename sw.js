const CACHE="marco-hub-v60";
const SHELL=["./","./index.html","./manifest.webmanifest?v=60","./apple-touch-icon-v7.png?v=8","./icon-192-v6.png","./icon-512-v6.png","./assets/buoni-icon-v12.png?v=12"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put("./index.html",c)).catch(()=>{})}return r}).catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{})}return r}).catch(()=>caches.match(e.request)));
});