'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
const h=buildContext('?quality=standard'),a=h.sandbox.TestAPI,book=h.sandbox.BitboundQuestions.story;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
let samples=0;
for(const action of a.RIG_ACTIONS)for(let frame=0;frame<=100;frame++){
  const pose=a.sampleRig(action,frame/100);
  for(let i=0;i<2;i++){
    for(const [from,to,length] of [[pose.shoulders[i],pose.elbows[i],13],[pose.elbows[i],pose.hands[i],14],[pose.hips[i],pose.knees[i],16],[pose.knees[i],pose.feet[i],16]])assert.ok(Math.abs(dist(from,to)-length)<.001,`${action} never stretches a limb`);
  }
  if(['idle','walk','run','kneel','sit','prison'].includes(action))assert.ok(Math.abs(Math.max(...pose.feet.map(p=>p.y))-94)<.01,`${action} has a planted foot`);
  samples++;
}
const drawing=h.sandbox.document.createElement('canvas').getContext('2d');
let pages=0,storySamples=0;
for(const [sceneName,scene] of Object.entries(book.scenes))for(const page of scene.pages){
  pages++;
  for(let n=0;n<=100;n++){
    const f=a.buildStoryFrame(page.art,n/100,page),actors=[...f.actors.values()],ids=actors.map(a=>a.id);
    assert.equal(new Set(ids).size,ids.length,'each character has one identity/pose');
    for(const actor of actors){for(const key of ['x','foot','scale','phase'])assert.ok(Number.isFinite(actor[key]),`${sceneName}: ${key}`);}
    if(['prisoners','rescue','camp1','camp2','camp3','rivals','paladinFall','barrier'].includes(sceneName))assert.ok(!ids.includes('byte'),`${sceneName}: no uninvited BYTE`);
    if(sceneName==='origin')assert.ok(!actors.some(a=>a.kind==='ally'),'no opening spoilers');
    if(page.art==='reunion'){
      const xs=actors.filter(a=>a.kind==='ally').map(a=>a.x).sort((a,b)=>a-b);
      for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=69.99,'entrance formation never intersects or overtakes');
    }
    if(sceneName==='escape'&&page.escapeBeat===0){assert.ok(!ids.includes('byte'),'BYTE is away getting his snack');assert.ok(f.gate,'door is still staged');if(f.gate.open<.99)assert.ok(f.actors.get('hero').x>=242,'waits inside for the lock to open');}
    if(page.art==='greed'&&page.rivalBeat===8)assert.ok(!actors.some(a=>a.rotation),'threats do not replay the deaths from the next page');
    if(sceneName==='fusion'&&page.fusionStage<5)assert.notEqual(f.actors.get('demon').boss,'fused','no premature fusion');
    storySamples++;
  }
  for(const time of [0,.25,.5,.75,1]){
    const f=a.drawStoryPicture(drawing,page.art,time,page);assert.equal(new Set(f.rendered).size,f.rendered.length,'one renderer pass per visible actor');
  }
}
for(const beat of ['scroll','forge'])for(let step=0;step<4;step++)for(const t of [0,.25,.5,.75,1]){
  const f=a.drawStoryPicture(drawing,'prison',t,{beat,forgeStep:step,hideByte:true});
  assert.equal(f.stage,'prison');assert.equal(f.gate.open,0);assert.ok(!f.actors.has('byte'));assert.ok(f.actors.get('hero').x>=242,'forging and reading stay inside');
}
const departed=a.buildStoryFrame('prison',1,{byteExit:true});assert.ok(departed.actors.get('byte').x<-60);
const fresh=a.buildStoryFrame('prison',0,{byteExit:true});assert.ok(fresh.actors.get('hero').x>215&&fresh.actors.get('byte').x<177,'visitor stays outside bars');
// Gameplay routes all essential actions to the same rig even with reduced motion.
a.startNew();a.enterWorld();const p=a.player;
for(const [state,motion] of [[{onGround:true,vx:3,vy:0,attack:0,dashTime:0},'walk'],[{onGround:false,vx:0,vy:-7,attack:0,dashTime:0},'jump'],[{onGround:false,vx:0,vy:7,attack:0,dashTime:0},'fall'],[{onGround:true,vx:8,vy:0,attack:0,dashTime:.1},'dash'],[{onGround:true,vx:0,vy:0,attack:.1,dashTime:0},'attack']]){
 Object.assign(p,state);assert.equal(a.playerAnimator.update(1/60,p,true).motion,motion);
}
// Companions really step/jump over a higher tile instead of changing y instantly.
a.state.level=1;a.generateWorld(1);a.plotState().partyFreed=true;a.plotState().betrayed=false;a.resetParty();
const ally=a.partyActors[0],grid=a.state.world.surface;
grid.fill(20);grid[11]=18;p.x=520;p.y=500;p.dir=1;
Object.assign(ally,{x:320,y:592,vx:0,vy:0,onGround:true,cooldown:9,heal:9,actionTime:0});
let jumped=false,stepped=false,oldY=ally.y;
for(let n=0;n<30;n++){a.updateParty(1/60);jumped ||= ally.motion==='jump';stepped ||= ally.x>320;assert.ok(Math.abs(ally.y-oldY)<12,'no instantaneous ledge teleport');oldY=ally.y;}
assert.ok(jumped&&stepped,'visible companion moves and jumps over the ledge');
assert.ok(a.rigFrames.values.size<=80,'body frame cache remains bounded');
assert.ok(a.rigParts.values.size<=32,'texture cache remains bounded');
assert.equal(h.sandbox.localStorage.writes.length,0,'animation never introduces automatic saves');
console.log(`PASS animation continuity: ${pages} story pages, ${storySamples} timeline samples, ${samples} fixed-limb poses; formation spacing, unique actors, prison/escape cast, action priority and bounded caches.`);
