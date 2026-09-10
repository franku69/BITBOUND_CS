/** A new page must not reuse a previous worker's automatic student store. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),base='https://class.example/game/';
const manifest=JSON.parse(await readFile(new URL('offline-manifest.json',root),'utf8'));
// Validate the complete import graph, not only entry script tags.
for(const [path,revision] of Object.entries(manifest.assetRevisions)){
  if(!['app/','shared/'].some(prefix=>path.startsWith(prefix))||!path.endsWith('.js'))continue;
  const text=await readFile(new URL(path,root),'utf8');
  assert.equal(createHash('sha256').update(text).digest('hex').slice(0,12),revision,path+' has its content hash');
  for(const match of text.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"](\.\.?\/[^'"]+\.js(?:\?v=[a-f0-9]+)?)['"]/g)){
    const dep=new URL(match[1],base+path),file=dep.pathname.slice('/game/'.length);
    assert.equal(dep.searchParams.get('v'),manifest.assetRevisions[file],path+' versions '+file);
    assert.ok(dep.searchParams.get('v'),'no unversioned dependency can revive autosave');
  }
}
const old=new Map([[base+'app/storage.js',new Response('OLD AUTOMATIC STUDENT STORE')]]);
const listeners={},network=[];
const caches={open:async()=>({match:async key=>old.get(String(key))?.clone(),put:async(key,response)=>old.set(String(key),response.clone())})};
// v9 uses this same request algorithm, with only entry assets in ASSET_REVISIONS.
const template=await readFile(new URL('scripts/sw-template.js',root),'utf8');
const context={URL,Response,Request,Map,Set,console,caches,AbortController,setTimeout,clearTimeout,self:{location:new URL(base+'sw.js'),addEventListener:(type,fn)=>listeners[type]=fn},
  fetch:async input=>{const url=new URL(String(input));network.push(url.href);return new Response(await readFile(new URL(url.pathname.slice('/game/'.length),root)));}};
vm.runInNewContext(template.replace('__CACHE_VERSION__','bitbound-dsa-old').replace('__ASSET_REVISIONS__',JSON.stringify({'app/main.js':'old-entry'})),context);
async function request(path){
  let result;listeners.fetch({request:{url:base+path,method:'GET',mode:'cors',cache:'default'},respondWith:r=>result=r});return (await result).text();
}
const path='app/storage.js?v='+manifest.assetRevisions['app/storage.js'];
assert.equal(await request(path),await readFile(new URL('app/storage.js',root),'utf8'));
assert.equal(await old.get(base+'app/storage.js').text(),'OLD AUTOMATIC STUDENT STORE','new dependency does not use canonical old record');
assert.equal(network.length,1);
assert.equal(await request(path),await readFile(new URL('app/storage.js',root),'utf8'));
assert.equal(network.length,1,'same revision is reused');
console.log('PASS update cache: complete module revision graph bypasses old automatic-storage code and reuses matching files.');
