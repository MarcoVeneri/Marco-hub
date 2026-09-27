const CACHE="marco-hub-v39";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon-v7.png","./icon-192-v6.png","./icon-512-v6.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  if(e.request.mode==="navigate"){
    e.respondWith(
      fetch(e.request,{cache:"no-store"})
        .then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return r})
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});