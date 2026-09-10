/* Offline assets are verified as a resumable job, never as a blocking install. */
const VERSION='bitbound-dsa-78c0a86b84f4';
const BASE=new URL('./',self.location);
// Repositories on the same GitHub Pages origin must not delete each other's packs.
const SCOPE_PREFIX='bitbound-app:'+BASE.pathname+':';
const CACHE=SCOPE_PREFIX+VERSION;
const ASSET_REVISIONS={"app/editor.js": "5ce3c7231c2c", "app/offline.js": "20172dc4b8c7", "app/offline-session.js": "34ba92aa5025", "app/storage.js": "36b40012af2b", "app/session-file.js": "6056f6bc5e88", "app/session-controls.js": "dbc525e82702", "app/game-session.js": "9248311693fa", "app/lab/catalog.js": "f0f80a5ca921", "shared/protocol.js": "df9ccbf32de4", "app/page-music.js": "6a7687a0e20b", "app/report.js": "acd68343c2ee", "app/lab/mission-view.js": "a0228cfd5404", "app/lab/results-view.js": "66a83e304519", "app/lab/files.js": "410dd122497f", "app/runner.js": "691cc513495f", "app/lab/execution.js": "e4292ccfd403", "app/lab/controller.js": "e97f2d2bef48", "app/main.js": "25d8c5851b50", "app/studio-intro.js": "f597bc298277", "app/mode-select.js": "22bfef50d1de", "app/music-score.js": "76b8a8ae162a", "app/python-worker.js": "1d1d3dc0c3e3", "mode-select.css": "1f5b1bcf274b", "mobile-refinements.css": "db6b66c06b09", "adventure/style.css": "d07c5978cc4b", "adventure/mobile.css": "b32d0b71480f", "game-windows.css": "67c9cf63e671", "adventure/story-controls.css": "c2a6a29bf3e7", "adventure/handheld.css": "999a06f3179f", "adventure/encounter.css": "654fdbf91654", "adventure/engine.js": "88af5b43e7d4", "adventure/questions.js": "1bf047666f6d", "adventure/game.js": "2c3fdc39e1bd", "vendor/codemirror/lib/codemirror.css": "eb494ea972d2", "vendor/codemirror/addon/hint/show-hint.css": "9058c1c14fcd", "vendor/codemirror/addon/dialog/dialog.css": "5df690d771f1", "styles.css": "59087e571131"};
const PYTHON_CACHE='bitbound-python-0.27.7';
const EDITOR_CACHE='bitbound-editor-5.65.20';
const MANIFEST_URL=new URL('offline-manifest.json',BASE).href;
const READY_URL=new URL('.bitbound-offline-ready',BASE).href;
const inflight=new Map(),subscribers=new Set();
let offlineJob=null;
const cacheName=path=>path.startsWith('runtime/')?PYTHON_CACHE:path.startsWith('vendor/codemirror/')?EDITOR_CACHE:CACHE;
const relative=url=>new URL(url).pathname.slice(BASE.pathname.length);
const failure=(code,message,file)=>Object.assign(new Error(message),{code,file});
async function fetchWithTimeout(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),90000);
  try{
    const response=await fetch(url,{...options,signal:controller.signal});
    // Keep the timeout alive until the body finishes, not just until headers.
    // Blob backing avoids expanding the binary Python runtime into JS strings.
    const body=await response.blob();
    return new Response([204,205,304].includes(response.status)?null:body,{status:response.status,statusText:response.statusText,headers:response.headers});
  }
  catch{throw failure('network','Could not finish the offline download. Check your connection and retry; downloaded files are kept.',relative(url));}
  finally{clearTimeout(timer);}
}
async function fetchStored(url){
  const cache=await caches.open(cacheName(relative(url)));
  const existing=await cache.match(url);if(existing)return existing;
  if(!inflight.has(url))inflight.set(url,(async()=>{
    const response=await fetchWithTimeout(url,{cache:'no-cache'});
    if(!response.ok)throw failure(response.status===404?'deployment':'network','Could not download '+relative(url)+'. The site may still be updating; retry shortly.',relative(url));
    // Storage denial must not break ordinary online play. The verified pack's
    // required cache.put below reports it accurately as an offline-only error.
    try{await cache.put(url,response.clone());}catch{/* Online response is usable. */}
    return response;
  })().finally(()=>inflight.delete(url)));
  return (await inflight.get(url)).clone();
}
async function getManifest(){
  const cache=await caches.open(CACHE);
  const existing=await cache.match(MANIFEST_URL);
  if(existing){
    try{const manifest=await existing.json();if(manifest.version===VERSION)return manifest;}catch{/* Refetch a damaged manifest. */}
    await cache.delete(MANIFEST_URL);
  }
  const response=await fetchWithTimeout(MANIFEST_URL,{cache:'no-store'});
  if(!response.ok)throw failure('deployment','The offline file list is unavailable. Retry after the website finishes updating.','offline-manifest.json');
  const manifest=await response.clone().json();
  // Never store an update from a different build: it would poison every retry.
  if(manifest.version!==VERSION)throw failure('update','The website is updating. Retry to install its latest offline files.','offline-manifest.json');
  if(!Array.isArray(manifest.files)||!manifest.hashes||!manifest.sizes)throw failure('deployment','The offline file list is invalid.','offline-manifest.json');
  await cache.put(MANIFEST_URL,response);
  return manifest;
}
function broadcast(message){for(const port of subscribers){try{port.postMessage(message);}catch{/* A closed tab can leave a port behind. */}}}
async function verify(response,expected){
  const hash=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
  return [...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,'0')).join('')===expected;
}
async function pruneCompletedPacks(){
  // Keep the previous scoped pack until the replacement is entirely verified.
  // Legacy unscoped caches may contain another repository and are left alone.
  const previous=(await caches.keys()).filter(key=>key.startsWith(SCOPE_PREFIX)&&key!==CACHE);
  for(const key of previous.slice(0,-1))await caches.delete(key);
}
async function downloadPack(){
  const manifest=await getManifest(),appCache=await caches.open(CACHE);
  const groups=await Promise.all([caches.open(CACHE),caches.open(PYTHON_CACHE),caches.open(EDITOR_CACHE)]);
  const group=new Map([[CACHE,groups[0]],[PYTHON_CACHE,groups[1]],[EDITOR_CACHE,groups[2]]]);
  // Verified visits check presence, without repeatedly hashing the 10 MB WASM.
  if(await appCache.match(READY_URL)){
    let intact=true;
    for(const file of manifest.files){if(!(await group.get(cacheName(file)).match(new URL(file,BASE).href))){intact=false;break;}}
    if(intact)return {type:'complete',files:manifest.files.length,bytes:manifest.bytes};
    await appCache.delete(READY_URL);
  }
  let cursor=0,done=0,bytes=0;
  broadcast({type:'progress',done,total:manifest.files.length,bytes,totalBytes:manifest.bytes});
  // Two consumers cap network and hashing pressure on low-memory phones.
  async function consume(){
    while(cursor<manifest.files.length){
      const file=manifest.files[cursor++],url=new URL(file,BASE);
      if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.search)throw failure('deployment','Invalid offline file path.',file);
      const cache=group.get(cacheName(file));let response=await cache.match(url.href);
      if(response&&!(await verify(response,manifest.hashes[file]))){await cache.delete(url.href);response=null;}
      if(!response){
        response=await fetchStored(url.href);
        if(!(await verify(response,manifest.hashes[file]))){
          await cache.delete(url.href);
          throw failure('deployment','The published '+file+' does not match this release. Rebuild and upload the complete release before retrying.',file);
        }
        await cache.put(url.href,response.clone());
      }
      done++;bytes+=manifest.sizes[file];
      broadcast({type:'progress',done,total:manifest.files.length,bytes,totalBytes:manifest.bytes});
    }
  }
  const results=await Promise.allSettled([consume(),consume()]);
  const rejected=results.find(result=>result.status==='rejected');if(rejected)throw rejected.reason;
  await appCache.put(READY_URL,new Response(JSON.stringify({version:VERSION}),{headers:{'Content-Type':'application/json'}}));
  await pruneCompletedPacks();
  return {type:'complete',files:done,bytes};
}
// A changed homepage, slow Python download or denied Cache Storage must never
// leave .ready pending forever or prevent online access to the game.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
  if(event.data?.type!=='bitbound:cache-offline'||!event.ports?.[0])return;
  const port=event.ports[0];subscribers.add(port);
  port.postMessage({type:'progress',done:0,total:0,bytes:0,totalBytes:0});
  if(!offlineJob)offlineJob=downloadPack().then(result=>broadcast(result)).catch(error=>broadcast({
    type:'error',code:error.name==='QuotaExceededError'?'storage':error.code||'unavailable',file:error.file,
    message:error.message||'Offline access is unavailable. Retry when connected.'
  })).finally(()=>{
    for(const channel of subscribers)channel.close();subscribers.clear();offlineJob=null;
  });
  event.waitUntil(offlineJob);
});
async function savedResponse(url){
  const path=relative(url),revision=new URL(url).searchParams.get('v');
  const names=await caches.keys();
  // Only complete packs can supply fallback navigation during an update.
  for(const name of [CACHE,...names.filter(name=>name!==CACHE).reverse()]){
    if(name!==CACHE&&!name.startsWith(SCOPE_PREFIX))continue;
    const cache=await caches.open(name);
    if(!(await cache.match(READY_URL)))continue;
    if(revision){
      const response=await cache.match(MANIFEST_URL);if(!response)continue;
      const manifest=await response.json();if(manifest.assetRevisions?.[path]!==revision)continue;
    }
    const response=await cache.match(new URL(path||'index.html',BASE).href);
    if(response)return response;
  }
}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.pathname.endsWith('/sw.js'))return;
  const path=relative(url);
  if(request.cache==='reload')return;
  if(['','index.html','story.html','app/lab.html'].includes(path)&&request.mode==='navigate'){
    event.respondWith(fetch(request).catch(async()=>await savedResponse(url.href)||Response.error()));return;
  }
  const normalized=new URL(url);
  // Unknown revision URLs retain their query; never mix new code with old code.
  if(ASSET_REVISIONS[path]&&url.searchParams.get('v')===ASSET_REVISIONS[path]&&[...url.searchParams].length===1)normalized.search='';
  if(path==='app/workspace.html')normalized.search='';
  if(path==='adventure/')normalized.pathname+='index.html';
  event.respondWith(fetchStored(normalized.href).catch(async()=>{
    let saved;
    try{saved=await savedResponse(url.href);}catch{/* Cache Storage can be denied in private/restricted browsers. */}
    if(saved)return saved;
    try{return await fetch(request);}catch{return Response.error();}
  }));
});
