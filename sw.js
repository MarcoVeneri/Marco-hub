const VERSION="63";
const CACHE=`marco-hub-v${VERSION}`;
const SHELL=[
  "./",
  "./index.html",
  `./ios27.css?v=${VERSION}`,
  `./manifest.webmanifest?v=${VERSION}`,
  "./apple-touch-icon-v7.png?v=8",
  "./icon-192-v6.png",
  "./icon-512-v6.png",
  "./assets/buoni-icon-v12.png?v=12"
];

const TRAFFIC_SIDE=`
    <a class="sideLink" href="/Dashboard/" aria-label="Traffico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 5v3M12 11v3M12 17v2"/></svg>Traffico</a>
`;

const TRAFFIC_TILE=`
        <a class="appTile" href="/Dashboard/" aria-label="Traffico"><div class="appTop"><div class="appIcon iconTraffic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 5v3M12 11v3M12 17v2"/></svg></div><span class="appArrow">›</span></div><div><div class="appName">Traffico</div><div class="appSub">Percorso lavoro</div></div></a>
`;

function decorateHtml(html){
  // iOS mobile override, loaded after the embedded legacy styles.
  if(!html.includes(`ios27.css?v=${VERSION}`)){
    html=html.replace('</head>',`<link rel="stylesheet" href="./ios27.css?v=${VERSION}">\n</head>`);
  }

  // Remove the redundant quick card "Weekend con i figli". Keep the calendar app tile.
  html=html.replace(/\s*<section class="quickSection">[\s\S]*?<\/section>/,"\n");
  html=html.replace(/\$\("#kidsCalendarQuick"\)\.addEventListener\("click",openCalendar\);/g,"");

  // Add Dashboard as Traffic with a road/highway icon.
  if(!html.includes('class="sideLink" href="/Dashboard/"')){
    html=html.replace('<a class="sideLink" href="/To-Do/">',TRAFFIC_SIDE+'    <a class="sideLink" href="/To-Do/">');
  }
  if(!html.includes('class="appTile" href="/Dashboard/"')){
    html=html.replace('<a class="appTile" href="/To-Do/"',TRAFFIC_TILE+'        <a class="appTile" href="/To-Do/"');
  }
  return html;
}

async function decorateResponse(response){
  if(!response||!response.ok)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  const html=decorateHtml(await response.text());
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

function bust(url){
  const u=new URL(url,self.registration.scope);
  u.searchParams.set("__mhv",VERSION);
  u.searchParams.set("__t",Date.now().toString());
  return u.toString();
}

async function fetchFresh(url){
  return fetch(bust(url),{cache:"no-store",credentials:"same-origin"});
}

self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await Promise.all(SHELL.map(async key=>{
      try{
        const r=await fetchFresh(key);
        if(r&&r.ok)await c.put(key,r.clone());
      }catch(_){ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();

    // iOS can keep the already-rendered page from the previous service worker.
    // Once this version activates, reload open Hub windows once so the new UI is applied immediately.
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    await Promise.all(windows.map(async client=>{
      try{
        const u=new URL(client.url);
        if(u.origin===self.location.origin){
          u.searchParams.set("mhv",VERSION);
          await client.navigate(u.toString());
        }
      }catch(_){ }
    }));
  })());
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;

  if(e.request.mode==="navigate"){
    e.respondWith((async()=>{
      try{
        const liveUrl=new URL(e.request.url);
        liveUrl.searchParams.set("__mhv",VERSION);
        liveUrl.searchParams.set("__t",Date.now().toString());
        const r=await fetch(liveUrl.toString(),{cache:"no-store",credentials:"same-origin"});
        if(r&&r.ok){
          const decorated=await decorateResponse(r);
          const c=decorated.clone();
          caches.open(CACHE).then(x=>x.put("./index.html",c)).catch(()=>{});
          return decorated;
        }
      }catch(_){ }
      const cached=await caches.match("./index.html",{ignoreSearch:true});
      return cached?decorateResponse(cached):Response.redirect("./",302);
    })());
    return;
  }

  e.respondWith((async()=>{
    try{
      let request=e.request;
      if(u.origin===self.location.origin){
        const freshUrl=new URL(e.request.url);
        freshUrl.searchParams.set("__mhv",VERSION);
        request=new Request(freshUrl.toString(),e.request);
      }
      const r=await fetch(request,{cache:"no-store"});
      if(r&&r.ok){
        const c=r.clone();
        caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{});
      }
      return r;
    }catch(_){
      return caches.match(e.request,{ignoreSearch:true});
    }
  })());
});