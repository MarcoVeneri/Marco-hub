from pathlib import Path
import base64
import re
from PIL import Image, ImageDraw

BUILD = "64"


def make_icon(size: int, out: str):
    top = (105, 173, 240)
    bottom = (59, 131, 201)
    im = Image.new("RGB", (size, size))
    px = im.load()
    for y in range(size):
        t = y / max(1, size - 1)
        row = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(size):
            px[x, y] = row
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((size*.06, size*.05, size*.94, size*.47), radius=size*.16, fill=(255,255,255,18))
    tile = size * .19
    gap = size * .075
    total = tile*2 + gap
    x0 = (size-total)/2
    y0 = (size-total)/2
    r = size*.045
    for row in range(2):
        for col in range(2):
            x = x0 + col*(tile+gap)
            y = y0 + row*(tile+gap)
            d.rounded_rectangle((x,y,x+tile,y+tile), radius=r, fill=(255,255,255,245))
    im.save(out, optimize=True)


for size, name in [(180, "hub-icon-180-v64.png"), (192, "hub-icon-192-v64.png"), (512, "hub-icon-512-v64.png")]:
    make_icon(size, name)

icon_data_uri = "data:image/png;base64," + base64.b64encode(Path("hub-icon-180-v64.png").read_bytes()).decode("ascii")

p = Path("index.html")
s = p.read_text(encoding="utf-8")

s = re.sub(r'<link rel="manifest" href="[^"]+">', f'<link rel="manifest" href="./manifest.webmanifest?v={BUILD}">', s, count=1)
s = re.sub(r'<link rel="icon"[^>]*>', f'<link rel="icon" sizes="180x180" href="./hub-icon-180-v64.png?v={BUILD}" type="image/png">', s, count=1)

# iOS 27.2: use exactly one Apple touch icon, embedded in the real Hub HTML.
s = re.sub(r'\s*<link rel="apple-touch-icon(?:-precomposed)?"[^>]*>', '', s)
inline_touch = f'<link rel="apple-touch-icon" sizes="180x180" href="{icon_data_uri}">'
s = s.replace('<title>Marco Hub</title>', inline_touch + '\n<title>Marco Hub</title>', 1)

native_css = f'<link rel="stylesheet" href="./hub-ui-v64.css?v={BUILD}">'
if native_css not in s:
    s = s.replace("</head>", native_css + "\n</head>", 1)

traffic_side = '''    <a class="sideLink" href="/Dashboard/" aria-label="Traffico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 5v3M12 11v3M12 17v2"/></svg>Traffico</a>\n'''
if 'class="sideLink" href="/Dashboard/"' not in s:
    s = s.replace('    <a class="sideLink" href="/To-Do/"', traffic_side + '    <a class="sideLink" href="/To-Do/"', 1)

traffic_tile = '''        <a class="appTile" href="/Dashboard/" aria-label="Traffico"><div class="appTop"><div class="appIcon iconTraffic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21 10 3M17 21 14 3M12 5v3M12 11v3M12 17v2"/></svg></div><span class="appArrow">›</span></div><div><div class="appName">Traffico</div><div class="appSub">Percorso lavoro</div></div></a>\n'''
if 'class="appTile" href="/Dashboard/"' not in s:
    s = s.replace('        <a class="appTile" href="/To-Do/"', traffic_tile + '        <a class="appTile" href="/To-Do/"', 1)

# Hub is only a dashboard: all old versioned links collapse to the one real To-Do PWA.
s = s.replace('href="/To-Do/app-v13/"', 'href="/To-Do/"')
s = s.replace('href="/To-Do/app-v14/"', 'href="/To-Do/"')
s = s.replace('href="/To-Do/app-v15/"', 'href="/To-Do/"')

# Fresh install identity for iOS, while still pointing to the SAME real /To-Do/ app.
s = s.replace('href="/To-Do/"', 'href="/To-Do/?pwa=20261015-2"')

s = re.sub(r'\s*<section class="quickSection">[\s\S]*?</section>', '\n', s, count=1)
s = s.replace('$("#kidsCalendarQuick").addEventListener("click",openCalendar);', '')

# Remove the legacy duplicate service-worker registration; keep the hardened one below.
s = s.replace('if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=60",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{}))', '')

marker = 'id="hub-native-build-64"'
if marker not in s:
    force = f'''<script {marker}>\n(function(){{\n  try{{\n    const u=new URL(location.href);\n    if(u.searchParams.get('hub')!=='{BUILD}'){{u.searchParams.set('hub','{BUILD}');location.replace(u.toString());return;}}\n  }}catch(e){{}}\n}})();\n</script>\n'''
    s = s.replace("</head>", force + "</head>", 1)

reg_marker = 'id="hub-sw-v64"'
if reg_marker not in s:
    reg = f'''<script {reg_marker}>\nif('serviceWorker' in navigator){{\n  window.addEventListener('load',async()=>{{\n    try{{const r=await navigator.serviceWorker.register('./sw.js?v={BUILD}',{{updateViaCache:'none'}});await r.update();}}catch(e){{}}\n  }});\n}}\n</script>\n'''
    s = s.replace("</body>", reg + "</body>", 1)

assert s.count('rel="apple-touch-icon"') == 1
assert 'data:image/png;base64,' in s
assert '/To-Do/app-v13/' not in s
assert '/To-Do/app-v14/' not in s
assert '/To-Do/app-v15/' not in s
assert 'href="/To-Do/?pwa=20261015-2"' in s

p.write_text(s, encoding="utf-8")

manifest = '''{
  "id": "./?hub=64",
  "name": "Marco Hub",
  "short_name": "Marco Hub",
  "start_url": "./?hub=64",
  "scope": "./",
  "display": "standalone",
  "background_color": "#edf4fb",
  "theme_color": "#edf4fb",
  "description": "Hub personale a icone.",
  "icons": [
    {"src":"./hub-icon-192-v64.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},
    {"src":"./hub-icon-512-v64.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}
  ]
}
'''
Path("manifest.webmanifest").write_text(manifest, encoding="utf-8")

sw = '''const VERSION="64";
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
'''
Path("sw.js").write_text(sw, encoding="utf-8")
