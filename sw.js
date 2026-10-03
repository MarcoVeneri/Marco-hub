const CACHE="marco-hub-v49";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon-v7.png","./icon-192-v6.png","./icon-512-v6.png","./assets/buoni-icon-v12.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(x=>x!==CACHE).map(x=>caches.delete(x)));await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;
 if(e.request.mode==="navigate"){
  e.respondWith((async()=>{try{const r=await fetch(e.request,{cache:"no-store"});if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put("./index.html",c)).catch(()=>{});return r}}catch(_){}
   return (await caches.match("./index.html")) || Response.redirect("./",302)})());
  return;
 }
 e.respondWith((async()=>{try{const r=await fetch(e.request,{cache:"no-store"});if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{});}return r}catch(_){return (await caches.match(e.request)) || new Response("",{status:504})}})());
});