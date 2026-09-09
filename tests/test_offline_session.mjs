/** Offline UI lifecycle: failed install, no interpreter gate, retries and dismissal. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const root=new URL('../',import.meta.url);
function target(properties={}){
  const events=new Map();return Object.assign({
    addEventListener(type,fn){if(!events.has(type))events.set(type,new Set());events.get(type).add(fn);},
    removeEventListener(type,fn){events.get(type)?.delete(fn);},
    emit(type,data){for(const fn of [...(events.get(type)||[])])fn(data);},
    listenerCount(){return [...events.values()].reduce((sum,list)=>sum+list.size,0);}
  },properties);
}
{
  const timers=new Map();let id=0,options;
  const active=target({state:'activated'}),registration=target({installing:null,waiting:null,active});
  const context=vm.createContext({URL,MessageChannel,Error,Promise,console,
    navigator:{serviceWorker:{register:async(url,opts)=>{options={url,opts};return registration;}}},location:{protocol:'https:'},
    setTimeout:(callback,ms)=>{timers.set(++id,{callback,ms});return id;},clearTimeout:key=>timers.delete(key)});
  const mod=new vm.SourceTextModule(await readFile(new URL('app/offline.js',root),'utf8'),{context,initializeImportMeta(meta){meta.url='https://class.example/BITBOUND_CS/app/offline.js';}});
  await mod.link(()=>{});await mod.evaluate();
  const {registerOffline,waitForOfflineWorker,prepareOffline}=mod.namespace;
  assert.equal(await registerOffline(),registration);assert.equal(options.url.href,'https://class.example/BITBOUND_CS/sw.js');assert.equal(options.opts.updateViaCache,'none');
  assert.equal(await waitForOfflineWorker(registration),active);
  assert.equal(registration.listenerCount(),0);assert.equal(timers.size,0);
  const installing=target({state:'installing'});registration.installing=installing;
  const waiting=waitForOfflineWorker(registration);await tick();
  installing.state='activated';registration.installing=null;registration.active=installing;installing.emit('statechange');
  assert.equal(await waiting,installing,'wait for the new worker rather than use an old controller');
  const broken=target({state:'installing'});registration.installing=broken;registration.active=null;
  const failed=assert.rejects(waitForOfflineWorker(registration),/did not finish installing/);
  broken.state='redundant';registration.installing=null;broken.emit('statechange');await failed;
  assert.equal(broken.listenerCount(),0);assert.equal(registration.listenerCount(),0);assert.equal(timers.size,0);
  registration.installing=target({state:'installing'});
  const expired=assert.rejects(waitForOfflineWorker(registration),/too long/);[...timers.values()][0].callback();await expired;
  assert.equal(timers.size,0);
  registration.installing=null;registration.active=active;
  active.postMessage=(data,ports)=>{assert.equal(data.type,'bitbound:cache-offline');ports[0].postMessage({type:'progress',done:1,total:2,bytes:4,totalBytes:8});ports[0].postMessage({type:'complete',files:2});ports[0].close();};
  let progress;assert.equal((await prepareOffline((...data)=>progress=data,registration)).files,2);assert.deepEqual(progress,[1,2,4,8]);assert.equal(timers.size,0);
  active.postMessage=(data,ports)=>{ports[0].postMessage({type:'error',code:'deployment',file:'index.html',message:'Changed HTML'});ports[0].close();};
  await assert.rejects(prepareOffline(()=>{},registration),error=>error.code==='deployment'&&error.file==='index.html');assert.equal(timers.size,0);
}
{
  const elements=new Map(),events=target(),timers=new Map();let id=0,registerCalls=0,packCalls=0,pythonCalls=0,resolvePack,rejectPack,progress;
  for(const name of ['offlineGameStatus','offlineBanner','retryOffline','dismissOffline','showOffline']){
    const classes=new Set();elements.set(name,{hidden:false,textContent:'',attrs:{},classList:{add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n)},setAttribute(n,v){this.attrs[n]=v;},focus(){this.focused=true;}});
  }
  let registrationFailure=null;
  const context=vm.createContext({document:{getElementById:id=>elements.get(id)},window:events,console:{warn(){}},
    setTimeout:(callback,ms)=>{timers.set(++id,{callback,ms});return id;},clearTimeout:id=>timers.delete(id)});
  const provider=new vm.SyntheticModule(['registerOffline','prepareOffline'],function(){
    this.setExport('registerOffline',async()=>{registerCalls++;if(registrationFailure)throw registrationFailure;return {active:{}};});
    this.setExport('prepareOffline',(onProgress,registration)=>{assert.ok(registration.active);packCalls++;progress=onProgress;return new Promise((resolve,reject)=>{resolvePack=resolve;rejectPack=reject;});});
  },{context});
  const mod=new vm.SourceTextModule(await readFile(new URL('app/offline-session.js',root),'utf8'),{context});
  await mod.link(()=>provider);await mod.evaluate();
  mod.namespace.startOfflineSession({preparePython(){pythonCalls++;return new Promise(()=>{});}});await tick();
  assert.equal(packCalls,1,'offline starts immediately, even if Python would never resolve');assert.equal(pythonCalls,0,'does not boot a hidden IDE');
  elements.get('retryOffline').onclick();events.emit('online');await tick();assert.equal(registerCalls,1,'concurrent retries do not spawn duplicate jobs');
  progress(5,10,500,1000);assert.match(elements.get('offlineGameStatus').textContent,/50%/);
  rejectPack(Object.assign(new Error('index differs'),{code:'deployment',file:'index.html'}));await tick();
  assert.equal(elements.get('retryOffline').hidden,false);assert.match(elements.get('offlineGameStatus').textContent,/website update is incomplete/);
  elements.get('dismissOffline').onclick();assert.equal(elements.get('offlineBanner').hidden,true);assert.equal(elements.get('showOffline').hidden,false);
  elements.get('showOffline').onclick();assert.equal(elements.get('offlineBanner').hidden,false);
  registrationFailure=new Error('Could not register');elements.get('retryOffline').onclick();await tick();assert.match(elements.get('offlineGameStatus').textContent,/Could not register/);assert.equal(elements.get('retryOffline').hidden,false);
  registrationFailure=null;elements.get('retryOffline').onclick();await tick();assert.equal(registerCalls,3,'retry registers again after a failed installation');assert.equal(packCalls,2);
  resolvePack({type:'complete'});await tick();assert.ok(elements.get('offlineBanner').classList.contains('ready'));assert.equal(elements.get('retryOffline').hidden,true);
  for(const timer of timers.values())timer.callback();assert.equal(elements.get('offlineBanner').hidden,true);assert.match(elements.get('showOffline').textContent,/Offline ready/);
  events.emit('online');await tick();assert.equal(registerCalls,3,'no repeated downloads after completion');
}
console.log('PASS offline session: new-worker readiness, redundant installs, finite timeout, port cleanup, error codes, no Python startup dependency, one job, fresh registration on retry, recoverable errors and status dismissal.');
