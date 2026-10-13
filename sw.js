const VERSION="64";
const CACHE=`marco-hub-native-v${VERSION}`;
const SHELL=[
  "./?hub=64",
  "./index.html?hub=64",
  "./hub-ui-v64.css?v=64",
  "./manifest.webmanifest?v=64",
  "./hub-icon-180-v64.png?v=64",
  "./hub-icon-192-v64.png",
  "./hub-icon-512-v64.png"
];
function fresh(url){
  const u=new URL(url,self.registration.scope);
  u.searchParams.set("__mhv",VERSION);
  u.searchParams.set("__t",Date.now().toString());
  return fetch(u.toString(),{cache:"no-store",credentials:"same-origin"});
}
self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    for(const key of SHELL){try{const r=await fresh(key);if(r.ok)await c.put(key,r.clone())}catch(_){}}
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith("marco-hub")&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      try{
        const u=new URL(client.url);
        if(u.origin===self.location.origin&&u.searchParams.get("hub")!==VERSION){u.searchParams.set("hub",VERSION);await client.navigate(u.toString())}
      }catch(_){}
    }
  })());
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;
  if(e.request.mode==="navigate"){
    e.respondWith((async()=>{
      try{
        const live=new URL(e.request.url);live.searchParams.set("hub",VERSION);live.searchParams.set("__t",Date.now().toString());
        const r=await fetch(live.toString(),{cache:"no-store",credentials:"same-origin"});
        if(r.ok){const c=await caches.open(CACHE);c.put("./index.html?hub=64",r.clone()).catch(()=>{});return r}
      }catch(_){}
      return (await caches.match("./index.html?hub=64")) || (await caches.match("./?hub=64")) || Response.error();
    })());
    return;
  }
  if(u.origin===self.location.origin){
    e.respondWith((async()=>{
      try{const r=await fetch(e.request,{cache:"no-store"});if(r.ok){const c=await caches.open(CACHE);c.put(e.request,r.clone()).catch(()=>{})}return r}
      catch(_){return (await caches.match(e.request,{ignoreSearch:true})) || Response.error()}
    })());
  }
});
