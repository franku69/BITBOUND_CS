/** Run the actual service-worker cache logic with a repository subpath. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const root=new URL('../',import.meta.url),origin='https://class.example',base=origin+'/Basics_of_List/';
let online=true,broken='';const counts=new Map(),stores=new Map(),listeners={};
const key=request=>typeof request==='string'?request:request instanceof URL?request.href:request.url;
const caches={
 async open(name){if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {async match(request){return map.get(key(request))?.clone();},async put(request,response){map.set(key(request),response.clone());},async delete(request){return map.delete(key(request));}};},
 async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}
};
async function network(request){
 if(!online)throw new Error('Offline');
 const url=new URL(key(request)),file=url.pathname.slice('/Basics_of_List/'.length)||'index.html';counts.set(file,(counts.get(file)||0)+1);
 if(file===broken)return new Response('missing',{status:404});
 try{return new Response(await readFile(new URL(file,root)),{status:200});}catch{return new Response('missing',{status:404});}
}
const context={URL,Response,Request,TextEncoder,AbortController,setTimeout,clearTimeout,console,crypto:webcrypto,caches,fetch:network,location:{origin},self:{location:new URL(base+'sw.js'),clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(type,fn)=>listeners[type]=fn}};
vm.createContext(context);vm.runInContext(await readFile(new URL('sw.js',root),'utf8'),context);
async function lifecycle(type){const pending=[];listeners[type]({waitUntil:promise=>pending.push(promise)});await Promise.all(pending);}
await lifecycle('install');await lifecycle('activate');
async function navigate(file){let response;const pending=[];listeners.fetch({request:{method:'GET',url:base+file,mode:'navigate',cache:'default'},respondWith:value=>response=value,waitUntil:promise=>pending.push(promise)});const result=await response;await Promise.all(pending);return result;}
async function pack(){const messages=[],pending=[];listeners.message({data:{type:'bitbound:cache-offline'},ports:[{postMessage:message=>messages.push(message),close(){}}],waitUntil:promise=>pending.push(promise)});await Promise.all(pending);return messages;}
let messages=await pack();assert.equal(messages.at(-1).type,'complete');assert.ok(messages.at(-1).files>30);
assert.equal(counts.get('runtime/pyodide.asm.wasm'),1,'the runtime is fetched once for the full pack');
const previousCount=[...counts.values()].reduce((a,b)=>a+b,0);
messages=await pack();assert.equal(messages.at(-1).type,'complete');assert.equal([...counts.values()].reduce((a,b)=>a+b,0),previousCount,'revisits reuse the verified pack without downloading again');
const manifest=JSON.parse(await readFile(new URL('offline-manifest.json',root),'utf8'));
online=false;
let response=await navigate('index.html');assert.match(await response.text(),/Choose Your Mode/);
response=await navigate('story.html');assert.match(await response.text(),/id="startScreen"/);
response=await navigate('app/lab.html');assert.match(await response.text(),/Python Lab Mode/);
response=await navigate('app/workspace.html');assert.match(await response.text(),/url=lab.html/);
response=await navigate('runtime/pyodide.asm.wasm');assert.ok((await response.arrayBuffer()).byteLength>1e7);
response=await navigate('adventure/');assert.equal(response.ok,true);
// Revision-tagged entry assets must work offline without duplicate downloads.
for(const [file,revision] of Object.entries(manifest.assetRevisions)){
 response=await navigate(file+'?v='+revision);
 assert.equal(response.ok,true,file+' revision URL is cached');
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(await readFile(new URL(file,root))));
}
// Removing one file must invalidate readiness and keep failure honest.
online=true;
stores.get('bitbound-app:/Basics_of_List/:'+manifest.version).delete(base+'app/grader.py');broken='app/grader.py';
messages=await pack();assert.equal(messages.at(-1).type,'error');assert.match(messages.at(-1).message,/Could not download/);
broken='';messages=await pack();assert.equal(messages.at(-1).type,'complete');
// Shared fetches coalesce concurrent requests for one large asset.
stores.get('bitbound-python-0.27.7').delete(base+'runtime/pyodide.asm.wasm');const before=counts.get('runtime/pyodide.asm.wasm');
const responses=await Promise.all([navigate('runtime/pyodide.asm.wasm'),navigate('runtime/pyodide.asm.wasm')]);assert.ok(responses.every(item=>item.ok));assert.equal(counts.get('runtime/pyodide.asm.wasm'),before+1);
console.log('PASS: automatic full pack, SHA checks, no repeat downloads, root/subpath and workspace offline navigation, offline WASM, partial-download retry and request deduplication.');
