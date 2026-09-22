const CACHE="marco-hub-v8-1";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon-v5.png","./icon-192-v5.png","./icon-512-v5.png","./assets/app-casa-v8.webp","./assets/app-alice-v8.webp","./assets/app-english-v8.webp","./assets/app-train-v8.webp","./assets/app-ricette-v8.webp"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;
 if(e.request.mode==="navigate"){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put("./index.html",c));return r}).catch(()=>caches.match("./index.html")));return}
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});