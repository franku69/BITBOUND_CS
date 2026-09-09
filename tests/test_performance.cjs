'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {buildContext}=require('./helpers/game-harness.cjs');
const scope={window:{}};vm.createContext(scope);
for(const file of ['performance.js','terrain-cache.js','core.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','adventure',file),'utf8'),scope);
const {FixedStepClock,FrameScheduler,QualityGovernor,QUALITY}=scope.window.BitboundPerformance;
const {TerrainCache}=scope.window.BitboundTerrain;

// Rendering at 20, 30, 60 or 120 Hz must advance the same physics trajectory.
function trajectory(fps){
  const clock=new FixedStepClock();let x=0,v=0,steps=0;
  for(let n=0;n<=fps*3;n++)clock.advance(n*1000/fps,dt=>{v+=9.8*dt;x+=v*dt;steps++;});
  return {x,v,steps};
}
for(const fps of [20,30,60,120])assert.deepEqual(trajectory(fps),trajectory(60));
const clock=new FixedStepClock();let updates=0;
clock.advance(0,()=>{});
assert.equal(clock.advance(60000,()=>updates++),4,'long stalls have a bounded catch-up');
clock.reset();assert.equal(clock.advance(120000,()=>updates++),0,'no hidden-time catch-up');

// An event-loop simulation checks refresh alignment, idle work, deduplication and cancellation.
function schedulerRun(refresh,fps){
  let now=0,serial=0,active=true,rafCalls=0,timerCalls=0;
  const pending=new Map(),draws=[];
  const enqueue=(kind,fn,time)=>{const id=++serial;pending.set(id,{kind,fn,time});return id;};
  const scheduler=new FrameScheduler({now:()=>now,frameMs:()=>1000/fps,
    shouldContinue:()=>active,render:ts=>draws.push(ts),
    requestFrame:fn=>{rafCalls++;return enqueue('raf',fn,(Math.floor((now+1e-6)*refresh/1000)+1)*1000/refresh);},
    cancelFrame:id=>pending.delete(id),setTimer:(fn,ms)=>{timerCalls++;return enqueue('timer',fn,now+ms);},clearTimer:id=>pending.delete(id)});
  scheduler.request();scheduler.request();assert.equal(pending.size,1);
  while(pending.size){
    const [id,event]=[...pending].sort((a,b)=>a[1].time-b[1].time)[0];
    if(event.time>2000)break;
    pending.delete(id);now=event.time;event.fn(now);
    assert.ok(pending.size<=1,'only one wake-up pending');
  }
  assert.ok(Math.abs(draws.length-fps*2)<=2,`${refresh} Hz / ${fps} FPS: ${draws.length} frames`);
  assert.ok(rafCalls<=draws.length+3,`avoid polling spare ${refresh} Hz display refreshes: ${rafCalls}/${draws.length}`);
  scheduler.stop();assert.equal(pending.size,0,'stop cancels timer or frame');
  active=false;scheduler.request();
  const [id,event]=[...pending][0];pending.delete(id);now=event.time;event.fn(now);
  assert.equal(pending.size,0,'paused scene draws once then sleeps');
  return {refresh,fps,frames:draws.length-1,rafCalls:rafCalls-1,timerCalls};
}
const schedulerResults=[];
for(const hz of [60,120,144])for(const fps of [20,30,60])schedulerResults.push(schedulerRun(hz,fps));
const governor=new QualityGovernor(10);
for(let n=0;n<9;n++)assert.equal(governor.record(n*16.67,10,16.67),false);
assert.equal(governor.record(150,10,16.67),true);
governor.reset();for(let n=0;n<10;n++)assert.equal(governor.record(n*16.67,1,16.67),false);
for(const profile of Object.values(QUALITY)){assert.equal(profile.projectiles,140);assert.equal(profile.loot,20);}

// Compare the production movement/collision code under all render profiles.
function gameTrajectory(fps){
  const {sandbox}=buildContext('?quality=low');const api=sandbox.TestAPI;
  api.startNew();api.hide(api.UI.intro);api.state.enemies=[];api.state.keys.d=true;
  for(let n=0;n<=fps*3;n++)api.loop(n*1000/fps);
  return {x:api.player.x,y:api.player.y,vx:api.player.vx,vy:api.player.vy,time:api.state.gameTime};
}
for(const fps of [20,30,60])assert.deepEqual(gameTrajectory(fps),gameTrajectory(60));

// Spatial candidates preserve wide/negative objects and skip inactive entries.
const hash=new scope.window.BitboundCore.SpatialHash1D(128);
const wide={x:120,w:150},near={x:130,w:5},negative={x:-10,w:15},dead={x:130,w:1,alive:false};
hash.rebuild([wide,near,negative,dead]);const candidates=[];
hash.forEach(120,300,item=>candidates.push(item));
assert.equal(candidates.filter(item=>item===wide).length,1);
assert.ok(candidates.includes(near));assert.ok(!candidates.includes(dead));
assert.equal(hash.some(-16,-1,item=>item===negative),true);
hash.rebuild([near],()=>[-200,-190]);assert.equal(hash.some(-200,-190,item=>item===near),true);

// Cache tests verify tile content, partial chunks, invalidation, reuse and allocation bounds.
let allocations=0;
function surface(){
  allocations++;
  return {width:256,height:256,tiles:new Map(),getContext(){const owner=this;return {setTransform(){},translate(){},clearRect(){owner.tiles.clear();},owner};}};
}
const world={tiles:Array.from({length:42},(_,r)=>Uint8Array.from({length:224},(_,c)=>(r+c)%10))};
const cache=new TerrainCache({limit:28,createSurface:surface,paintTile(ctx,c,r,id){ctx.owner.tiles.set(r*224+c,id);}});
const painted=[];const target={drawImage(surface,x,y){painted.push({surface,x,y});}};
function verifyVisible(x,y,width,height){
  painted.length=0;assert.equal(cache.draw(target,world,{},x,y,width,height),true);
  for(let r=Math.floor(y/32);r<Math.ceil((y+height)/32);r++)for(let c=Math.floor(x/32);c<Math.ceil((x+width)/32);c++){
    if(r>=42||c>=224)continue;
    const chunk=painted.find(p=>c*32>=p.x&&c*32<p.x+256&&r*32>=p.y&&r*32<p.y+256);
    assert.ok(chunk,'every visible tile has a chunk');
    assert.equal(chunk.surface.tiles.get(r*224+c)||0,world.tiles[r][c]);
  }
  assert.ok(cache.bytes<=28*256*256*4);assert.ok(allocations<=28);
}
verifyVisible(0,0,1280,720);const initial=cache.stats.builds;
verifyVisible(0,0,1280,720);assert.equal(cache.stats.builds,initial,'steady frames paint no terrain tiles');
for(let x=0;x<5800;x+=127)verifyVisible(x,400,1280,720);
verifyVisible(5787,624,1280,720);
verifyVisible(0,0,1280,720);world.tiles[7][0]=9;cache.invalidate(0,7);cache.invalidate(0,8);
const builds=cache.stats.builds;verifyVisible(0,0,1280,720);assert.equal(cache.stats.builds-builds,2,'tile and grass below cross the chunk edge');
cache.reset(world);verifyVisible(0,0,1280,720);assert.ok(allocations<=28,'world change reuses surface memory');
let failedAllocations=0;
const failed=new TerrainCache({createSurface(){failedAllocations++;throw Error('allocation denied');},paintTile(){}});
assert.equal(failed.draw(target,world,{},0,0,100,100),false);
assert.equal(failed.draw(target,world,{},0,0,100,100),false);assert.equal(failedAllocations,1,'failed allocation is not repeated each frame');

// Exercise the production renderer's cache invalidation, landmark reuse and lifecycle.
const {sandbox:s,elements,listeners}=buildContext('?quality=low');const api=s.TestAPI;
api.state.camera.x=0;api.state.camera.y=0;api.draw();
const invalid=api.terrainCache.stats.invalidations;
api.setTile(0,7,1);api.draw();assert.equal(api.getTile(0,7),1);
assert.equal(api.terrainCache.stats.invalidations-invalid,2);
api.startNew();api.hide(api.UI.intro);api.state.camera.shake=0;
api.player.x=api.state.chests[0].x;api.player.y=api.state.chests[0].y;
api.updateInteractable();assert.equal(api.state.currentInteract,api.state.chests[0]);
api.interact();assert.equal(api.state.chests[0].opened,true,'cached chest identity still awards loot');
const landmarks=api.state.world.landmarks;api.draw();assert.equal(api.state.world.landmarks,landmarks);
api.generateWorld(1);api.draw();assert.notEqual(api.state.world.landmarks,landmarks);
api.frameScheduler.request();s.document.hidden=true;
for(const handler of listeners['document:visibilitychange'])handler();
assert.equal(api.frameScheduler.frame,null);assert.equal(api.frameScheduler.timer,null);assert.equal(api.simulationClock.last,null);
s.document.hidden=false;for(const handler of listeners['document:visibilitychange'])handler();
assert.notEqual(api.frameScheduler.frame,null);
api.show(api.UI.puzzle);api.loop(5000);assert.equal(api.state.paused,true);assert.equal(api.state.needsRender,false);
console.log('PASS performance: fixed physics, frame pacing/idle cancellation, bounded terrain LRU, mining/grass invalidation, world reuse and interaction lifecycle.');
console.log(JSON.stringify(schedulerResults));
