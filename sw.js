const CACHE="marco-hub-v50";
const SHELL=["./","./index.html","./manifest.webmanifest","./apple-touch-icon-v7.png","./icon-192-v6.png","./icon-512-v6.png","./assets/buoni-icon-v12.png"];

const TODO_TILE=`
 <a class="appTile" href="/To-Do/" aria-label="To Do">
  <div class="appIcon" style="background:linear-gradient(180deg,#5b8cff,#347df5)">
   <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect x="9" y="8" width="30" height="32" rx="8"/>
    <path d="M16 18l3 3 6-7"/>
    <path d="M27 19h6"/>
    <path d="M16 29l3 3 6-7"/>
    <path d="M27 30h6"/>
   </svg>
  </div>
  <div class="appName">To Do</div><div class="appSub">Note sincronizzate</div>
 </a>
`;

async function decorateHub(response){
 if(!response || !response.ok)return response;
 const type=response.headers.get("content-type")||"";
 if(!type.includes("text/html"))return response;
 let html=await response.text();
 if(!html.includes('href="/To-Do/"') && html.includes('<button id="kidsCalendarBtn"')){
  html=html.replace('<button id="kidsCalendarBtn"',TODO_TILE+'<button id="kidsCalendarBtn"');
 }
 const headers=new Headers(response.headers);
 headers.delete("content-length");
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(x=>x!==CACHE).map(x=>caches.delete(x)));await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;
 if(e.request.mode==="navigate"){
  e.respondWith((async()=>{try{
    const r=await fetch(e.request,{cache:"no-store"});
    if(r&&r.ok){
      const decorated=await decorateHub(r);
      const c=decorated.clone();
      caches.open(CACHE).then(x=>x.put("./index.html",c)).catch(()=>{});
      return decorated;
    }
   }catch(_){}
   const cached=await caches.match("./index.html");
   return cached ? await decorateHub(cached) : Response.redirect("./",302)})());
  return;
 }
 e.respondWith((async()=>{try{const r=await fetch(e.request,{cache:"no-store"});if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{});}return r}catch(_){return (await caches.match(e.request)) || new Response("",{status:504})}})());
});