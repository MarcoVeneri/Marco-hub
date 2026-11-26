const VERSION="66";
const CACHE=`marco-hub-native-v${VERSION}`;
const SHELL=[
  "./?hub=66",
  "./index.html?hub=66",
  "./hub-ui-v64.css?v=64",
  "./manifest.webmanifest?v=64",
  "./hub-icon-180-v64.png?v=64",
  "./hub-icon-192-v64.png",
  "./hub-icon-512-v64.png"
];

const FAST_CACHE=CACHE+"-fast3";
const scope=new URL(self.registration.scope);
const keyFor=req=>req.mode==="navigate"?new URL("index.html",scope).href:req;
self.addEventListener("install",e=>e.waitUntil((async()=>{
 const c=await caches.open(FAST_CACHE);
 await Promise.allSettled(SHELL.map(async path=>{const url=new URL(path,scope);const res=await fetch(url,{cache:"reload"});if(res.ok){await c.put(url,res.clone());if(url.pathname===scope.pathname||url.pathname===scope.pathname+"index.html")await c.put(new URL("index.html",scope),res.clone());}}));
 await self.skipWaiting();
})()));
self.addEventListener("activate",e=>e.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith("marco-hub")&&k!==FAST_CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
 const windows=await self.clients.matchAll({type:"window"}); await Promise.allSettled(windows.filter(c=>c.url.startsWith(scope.href)).map(c=>c.navigate(c.url)));
})()));
self.addEventListener("fetch",e=>{
 const req=e.request,u=new URL(req.url);
 if(req.method!=="GET"||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;
 const data=/\\.json$/i.test(u.pathname);
 const key=data?u.origin+u.pathname:keyFor(req);
 const c=caches.open(FAST_CACHE);
 const live=c.then(async cache=>{const res=await fetch(req,{cache:data?"no-store":"no-cache"});if(res.ok)await cache.put(key,res.clone());return res;});
 const cached=c.then(cache=>cache.match(key));
 if(data){e.respondWith(live.catch(async()=>await cached||Response.error()));return;}
 e.waitUntil(live.then(()=>{},()=>{}));
 e.respondWith(cached.then(hit=>hit||live).catch(()=>Response.error()));
});
