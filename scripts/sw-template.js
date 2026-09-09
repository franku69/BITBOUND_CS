/* Automatic offline pack. One bounded job and shared fetches avoid duplicate downloads. */
const CACHE='__CACHE_VERSION__';
const BASE=new URL('./',self.location);
const ASSET_REVISIONS=__ASSET_REVISIONS__;
const PYTHON_CACHE='bitbound-python-0.27.7';
const EDITOR_CACHE='bitbound-editor-5.65.20';
const MANIFEST_URL=new URL('offline-manifest.json',BASE).href;
const READY_URL=new URL('.bitbound-offline-ready',BASE).href;
const SHELL=['index.html','mode-select.css','app/mode-select.js','app/studio-intro.js','app/assets/guild-logo.png','app/assets/guild-wordmark.svg','app/offline-session.js','app/offline.js','manifest.webmanifest'];
const inflight=new Map();
let offlineJob=null;
const subscribers=new Set();
const cacheName=path=>path.startsWith('runtime/')?PYTHON_CACHE:path.startsWith('vendor/codemirror/')?EDITOR_CACHE:CACHE;
const relative=url=>new URL(url).pathname.slice(BASE.pathname.length);
async function fetchStored(url){
  const cache=await caches.open(cacheName(relative(url)));
  const existing=await cache.match(url);if(existing)return existing;
  if(!inflight.has(url))inflight.set(url,(async()=>{
    const response=await fetch(url,{cache:'no-cache'});
    if(!response.ok)throw new Error('Could not download '+relative(url)+'. Reconnect and retry.');
    await cache.put(url,response.clone());return response;
  })().finally(()=>inflight.delete(url)));
  return (await inflight.get(url)).clone();
}
async function getManifest(){
  const cache=await caches.open(CACHE);
  let response=await cache.match(MANIFEST_URL);
  if(!response){response=await fetch(MANIFEST_URL,{cache:'no-store'});if(!response.ok)throw new Error('The offline file list is unavailable. Reconnect and retry.');await cache.put(MANIFEST_URL,response.clone());}
  const manifest=await response.json();
  if(manifest.version!==CACHE)throw new Error('A game update is available. Close old game tabs and reopen the link.');
  return manifest;
}
function broadcast(message){for(const port of subscribers){try{port.postMessage(message);}catch{/* A closed tab may leave a port behind. */}}}
async function verify(response,expected){
  const hash=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
  return [...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,'0')).join('')===expected;
}
async function downloadPack(){
  const manifest=await getManifest(),appCache=await caches.open(CACHE);
  const groups=await Promise.all([caches.open(CACHE),caches.open(PYTHON_CACHE),caches.open(EDITOR_CACHE)]);
  const group=new Map([[CACHE,groups[0]],[PYTHON_CACHE,groups[1]],[EDITOR_CACHE,groups[2]]]);
  // Once verified, only check presence on later visits, without reading/re-hashing
  // the 10 MB WASM file. A missing/evicted entry falls back to verification.
  const marker=await appCache.match(READY_URL);
  if(marker){
    let intact=true;
    for(const file of manifest.files){if(!(await group.get(cacheName(file)).match(new URL(file,BASE).href))){intact=false;break;}}
    if(intact)return {type:'complete',files:manifest.files.length,bytes:manifest.bytes};
  }
  let cursor=0,done=0,bytes=0;
  broadcast({type:'progress',done,total:manifest.files.length,bytes,totalBytes:manifest.bytes});
  // Two consumers cap network and hashing pressure on low-memory phones.
  async function consume(){
    while(cursor<manifest.files.length){
      const file=manifest.files[cursor++],url=new URL(file,BASE);
      if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))throw new Error('Invalid offline file path.');
      const cache=group.get(cacheName(file));let response=await cache.match(url.href);
      if(response&&!(await verify(response,manifest.hashes[file]))){await cache.delete(url.href);response=null;}
      if(!response){response=await fetchStored(url.href);if(!(await verify(response,manifest.hashes[file]))){await cache.delete(url.href);throw new Error('Game files changed during download. Close old tabs and reopen the link.');}}
      done++;bytes+=manifest.sizes[file];
      broadcast({type:'progress',done,total:manifest.files.length,bytes,totalBytes:manifest.bytes});
    }
  }
  // allSettled keeps partial workers attached to this job until both finish.
  const results=await Promise.allSettled([consume(),consume()]);
  const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
  await appCache.put(READY_URL,new Response(JSON.stringify({version:CACHE}),{headers:{'Content-Type':'application/json'}}));
  return {type:'complete',files:done,bytes};
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const manifest=await getManifest();
  for(const file of SHELL){const response=await fetchStored(new URL(file,BASE).href);if(!(await verify(response,manifest.hashes[file])))throw new Error('Mixed game version during installation');}
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if((key.startsWith('bitbound-dsa-')||key.startsWith('bitbound-list-basics-'))&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{
  if(event.data?.type!=='bitbound:cache-offline'||!event.ports?.[0])return;
  const port=event.ports[0];subscribers.add(port);
  port.postMessage({type:'progress',done:0,total:1,bytes:0,totalBytes:1});
  if(!offlineJob)offlineJob=downloadPack().then(result=>broadcast(result)).catch(error=>broadcast({type:'error',message:error.message||'Offline download interrupted. Retry when connected.'})).finally(()=>{
    for(const channel of subscribers)channel.close();subscribers.clear();offlineJob=null;
  });
  event.waitUntil(offlineJob);
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.pathname.endsWith('/sw.js'))return;
  const path=relative(url);
  if(request.cache==='reload')return;
  if(['','index.html','story.html','app/lab.html'].includes(path)&&request.mode==='navigate'){
    // Online visits see the latest entry; offline visits get the saved game.
    event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match(new URL(path||'index.html',BASE).href))));return;
  }
  const normalized=new URL(url);
  // Known revision URLs share the verified canonical cache. Other revisions
  // keep their full URL so they cannot silently receive stale entry assets.
  if(ASSET_REVISIONS[path]&&url.searchParams.get('v')===ASSET_REVISIONS[path]&&[...url.searchParams].length===1)normalized.search='';
  if(path==='app/workspace.html')normalized.search='';
  if(path==='adventure/')normalized.pathname+='index.html';
  event.respondWith(fetchStored(normalized.href).catch(()=>Response.error()));
});
