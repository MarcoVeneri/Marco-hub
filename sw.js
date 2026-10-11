const CACHE="marco-hub-v62";
const SHELL=["./","./index.html","./ios27.css?v=62","./manifest.webmanifest?v=60","./apple-touch-icon-v7.png?v=8","./icon-192-v6.png","./icon-512-v6.png","./assets/buoni-icon-v12.png?v=12"];

const TRAFFIC_SIDE=`
    <a class="sideLink" href="/Dashboard/" aria-label="Traffico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 5v3M12 11v3M12 17v2"/></svg>Traffico</a>
`;

const TRAFFIC_TILE=`
        <a class="appTile" href="/Dashboard/" aria-label="Traffico"><div class="appTop"><div class="appIcon iconTraffic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 5v3M12 11v3M12 17v2"/></svg></div><span class="appArrow">›</span></div><div><div class="appName">Traffico</div><div class="appSub">Percorso lavoro</div></div></a>
`;

function decorateHtml(html){
  // iOS 27 mobile override, loaded after the embedded legacy styles.
  if(!html.includes('ios27.css?v=62')){
    html=html.replace('</head>','<link rel="stylesheet" href="./ios27.css?v=62">\n</head>');
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

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.pathname.includes("/Alice-Job-Radar/data/jobs.json"))return;

  if(e.request.mode==="navigate"){
    e.respondWith((async()=>{
      try{
        const r=await fetch(e.request,{cache:"no-store"});
        if(r&&r.ok){
          const decorated=await decorateResponse(r);
          const c=decorated.clone();
          caches.open(CACHE).then(x=>x.put("./index.html",c)).catch(()=>{});
          return decorated;
        }
      }catch(_){ }
      const cached=await caches.match("./index.html");
      return cached?decorateResponse(cached):Response.redirect("./",302);
    })());
    return;
  }

  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{
    if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c)).catch(()=>{})}
    return r;
  }).catch(()=>caches.match(e.request)));
});