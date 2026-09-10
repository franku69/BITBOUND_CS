/** Regression for the actual Pages failure: edited HTML + unchanged manifest. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
const template=await readFile(new URL('../scripts/sw-template.js',import.meta.url),'utf8');
const hash=text=>createHash('sha256').update(text).digest('hex');
function environment(path='/BITBOUND_CS/'){
  const base='https://class.example'+path,version='bitbound-dsa-fixture';
  const app='bitbound-app:'+path+':'+version;
  const files={
    'index.html':'<h1>BITBOUND</h1><p>A WORLD BUILT FOR CURIOUS MINDS</p>',
    'story.html':'<h1>Story host</h1>', 'story-game.html':'<h1>Story</h1>', 'app/lab.html':'<h1>Python Lab</h1>',
    'app/main.js':'/* new code */', 'runtime/pyodide.asm.wasm':'runtime fixture'
  };
  const manifest={version,files:Object.keys(files),hashes:{},sizes:{},bytes:0,assetRevisions:{'app/main.js':'new-revision'}};
  for(const [file,body] of Object.entries(files)){manifest.hashes[file]=hash(body);manifest.sizes[file]=Buffer.byteLength(body);manifest.bytes+=manifest.sizes[file];}
  const stores=new Map(),counts=new Map(),events={},timers=new Map();let nextTimer=0;
  const control={online:true,quota:false,denyStorage:false,blocked:'',stallBody:'',hold:null,files:{...files},manifest:JSON.stringify(manifest)};
  const key=r=>typeof r==='string'?r:r instanceof URL?r.href:r.url;
  const caches={async open(name){if(control.denyStorage)throw new Error('Browser storage is blocked');if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {
    async match(request){return store.get(key(request))?.clone();},
    async put(request,response){if(control.quota)throw Object.assign(new Error('Storage full'),{name:'QuotaExceededError'});store.set(key(request),response.clone());},
    async delete(request){return store.delete(key(request));}
  };},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
  async function network(request,options={}){
    if(!control.online)throw new Error('disconnected');
    const file=new URL(key(request)).pathname.slice(path.length)||'index.html';counts.set(file,(counts.get(file)||0)+1);
    if(control.hold&&file===control.hold.file)await control.hold.wait;
    if(file===control.blocked)return new Response('404',{status:404});
    if(file===control.stallBody)return new Response(new ReadableStream({start(stream){options.signal.addEventListener('abort',()=>stream.error(new Error('aborted body')),{once:true});}}));
    const body=file==='offline-manifest.json'?control.manifest:control.files[file];
    return new Response(body||'404',{status:body===undefined?404:200});
  }
  vm.runInNewContext(template.replace('__CACHE_VERSION__',version).replace('__ASSET_REVISIONS__',JSON.stringify(manifest.assetRevisions)),{
    URL,Response,Request,crypto:webcrypto,AbortController,caches,fetch:network,console,
    setTimeout:(callback,ms)=>{timers.set(++nextTimer,{callback,ms});return nextTimer;},clearTimeout:id=>timers.delete(id),
    self:{location:new URL(base+'sw.js'),skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(name,fn)=>events[name]=fn}
  });
  async function lifecycle(type){let job;events[type]({waitUntil:promise=>job=promise});await job;}
  async function pack(){const messages=[];let job;events.message({data:{type:'bitbound:cache-offline'},ports:[{postMessage:message=>messages.push(message),close(){}}],waitUntil:promise=>job=promise});await job;assert.equal(timers.size,0,'all network timers cleaned up');return messages;}
  async function request(path,mode='navigate'){let job;events.fetch({request:{method:'GET',mode,cache:'default',url:base+path},respondWith:promise=>job=promise});return await job;}
  return {base,app,version,files,manifest,control,stores,counts,caches,lifecycle,pack,request,timers};
}
for(const path of ['/','/BITBOUND_CS/']){
  const e=environment(path);
  // This is the production defect, down to the removed tagline.
  e.control.files['index.html']=e.files['index.html'].replace('<p>A WORLD BUILT FOR CURIOUS MINDS</p>','');
  await e.lifecycle('install');await e.lifecycle('activate');
  assert.equal(e.counts.size,0,'an edited homepage cannot block worker installation');
  let messages=await e.pack();
  assert.equal(messages.at(-1).code,'deployment');assert.equal(messages.at(-1).file,'index.html');
  assert.ok(!e.stores.get(e.app).has(e.base+'.bitbound-offline-ready'),'never claim offline readiness for mixed files');
  e.control.files['index.html']=e.files['index.html'];
  assert.equal((await e.pack()).at(-1).type,'complete','retry recovers without clearing browser data');
  assert.equal(e.counts.get('index.html'),2,'only the changed homepage needs refetching');
  assert.equal(e.counts.get('runtime/pyodide.asm.wasm'),1,'preserve downloaded Python runtime');
  e.control.online=false;
  for(const page of ['index.html','story.html','story-game.html','app/lab.html'])assert.equal(await (await e.request(page)).text(),e.files[page]);
  e.control.online=true;
  // An evicted file + a failed request clears ready and recovers on retry.
  e.stores.get(e.app).delete(e.base+'story.html');e.control.blocked='story.html';
  assert.equal((await e.pack()).at(-1).type,'error');
  assert.ok(!e.stores.get(e.app).has(e.base+'.bitbound-offline-ready'));
  e.control.blocked='';assert.equal((await e.pack()).at(-1).type,'complete');
}
{
  const e=environment();
  e.control.manifest=JSON.stringify({...e.manifest,version:'wrong-version'});
  assert.equal((await e.pack()).at(-1).code,'update');
  assert.ok(!e.stores.get(e.app).has(e.base+'offline-manifest.json'),'wrong-version manifest is not persisted');
  e.control.manifest=JSON.stringify(e.manifest);
  assert.equal((await e.pack()).at(-1).type,'complete','retry can obtain the corrected manifest');
}
{
  const e=environment();e.control.quota=true;
  await e.lifecycle('install');await e.lifecycle('activate');
  assert.equal((await e.pack()).at(-1).code,'storage');
  assert.equal(await (await e.request('app/main.js','cors')).text(),e.files['app/main.js'],'storage-full browser can still play online');
  e.control.quota=false;assert.equal((await e.pack()).at(-1).type,'complete');
}
{
  const e=environment();
  const previous=e.app.replace('fixture','previous'),ancient=e.app.replace('fixture','ancient');
  const other='bitbound-app:/OTHER_REPO/:bitbound-dsa-other',legacy='bitbound-dsa-old';
  for(const name of [ancient,previous,other,legacy])await e.caches.open(name);
  for(const name of [ancient,previous]){
    const cache=await e.caches.open(name);
    await cache.put(e.base+'.bitbound-offline-ready',new Response('ready'));
    await cache.put(e.base+'index.html',new Response('previous complete homepage'));
    await cache.put(e.base+'app/main.js',new Response('previous module'));
    await cache.put(e.base+'offline-manifest.json',new Response(JSON.stringify({assetRevisions:{'app/main.js':'old-revision'}})));
  }
  await e.lifecycle('activate');
  assert.ok(e.stores.has(previous),'activation retains working previous release');
  e.control.online=false;
  assert.equal(await (await e.request('index.html')).text(),'previous complete homepage');
  assert.equal(await (await e.request('app/main.js?v=old-revision','cors')).text(),'previous module');
  assert.equal((await e.request('app/main.js?v=new-revision','cors')).type,'error','never return old code for a new hash');
  e.control.online=true;e.control.blocked='story.html';
  assert.equal((await e.pack()).at(-1).type,'error');assert.ok(e.stores.has(ancient),'incomplete update cannot prune old packs');
  e.control.blocked='';assert.equal((await e.pack()).at(-1).type,'complete');
  assert.ok(!e.stores.has(ancient));assert.ok(e.stores.has(previous));assert.ok(e.stores.has(other));assert.ok(e.stores.has(legacy),'never delete unscoped caches belonging to other repositories');
}
{
  const e=environment();let release;
  e.control.hold={file:'runtime/pyodide.asm.wasm',wait:new Promise(resolve=>release=resolve)};
  const first=e.pack(),second=e.pack();release();
  const result=await Promise.all([first,second]);
  assert.ok(result.every(messages=>messages.at(-1).type==='complete'),'two tabs share one completion');
  assert.equal(e.counts.get('runtime/pyodide.asm.wasm'),1);
}
{
  const e=environment();e.control.denyStorage=true;
  await e.lifecycle('install');await e.lifecycle('activate');
  assert.equal((await e.pack()).at(-1).type,'error');
  assert.equal(await (await e.request('app/main.js','cors')).text(),e.files['app/main.js'],'blocked Cache Storage still permits online scripts');
}
{
  const e=environment();e.control.stallBody='index.html';const job=e.pack();
  for(let i=0;i<100&&!(e.counts.has('runtime/pyodide.asm.wasm')&&e.timers.size===1);i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(e.timers.size,1,'only the stalled response body is still pending');
  [...e.timers.values()][0].callback();
  assert.equal((await job).at(-1).code,'network','timeout covers body transfer, not only response headers');
  e.control.stallBody='';assert.equal((await e.pack()).at(-1).type,'complete','stalled body cannot leave a stuck shared job');
}
console.log('PASS production recovery: edited index, root and Pages subpath, installation, retry, SHA mismatch, partial eviction, manifest repair, quota, online fallback, previous release, cross-repo cache isolation, concurrent tabs.');
