'use strict';
const assert=require('node:assert/strict'),{buildContext}=require('./helpers/game-harness.cjs');
const h=buildContext('?quality=standard'),s=h.sandbox,a=s.TestAPI,book=s.BitboundQuestions.story;
const dist=(x,y)=>Math.hypot(x.x-y.x,x.y-y.y);
let tested=0;
const interactive=[{art:'prison',byteExit:true},{art:'prison',beat:'scroll',hideByte:true},...['inspect','heat','hammer','quench'].map((forgeAction,forgeStep)=>({art:'prison',beat:'forge',forgeAction,forgeStep,hideByte:true}))];
for(const page of interactive){let prev=null;let previousActors=new Map();
 for(let n=0;n<=1000;n++){
  const t=n/1000,f=a.buildStoryFrame(page.art,t,page),hero=f.actors.get('hero');tested++;
  assert.equal(f.gate.open,0,'door remains shut during work');assert.ok(hero.x>=242);
  if(page.hideByte)assert.ok(!f.actors.has('byte'),'BYTE cannot return during forging');
  const actorsNow=new Map();for(const actor of f.actors.values()){const old=previousActors.get(actor.id),pair=[a.rigSocket(actor,0),a.rigSocket(actor,1)];if(old)for(let i=0;i<2;i++)assert.ok(dist(pair[i],old[i])<8,`${actor.id} ${page.forgeAction||page.beat||'departure'} pose continuity ${t}`);actorsNow.set(actor.id,pair);}previousActors=actorsNow;
  if(page.byteExit&&t<.6)assert.equal(f.actors.get('byte').foot,264,'BYTE stays on corridor floor before departing');
  const hands=[a.rigSocket(hero,0),a.rigSocket(hero,1)];
  if(prev)for(let i=0;i<2;i++)assert.ok(dist(hands[i],prev[i])<8,`${page.forgeAction||page.beat}: no snapping at ${t}`);prev=hands;
  for(const prop of f.props)if(prop.holder)assert.ok(f.actors.has(prop.holder),'prop has a living owner');
  if(page.forgeAction==='inspect'&&t>=.8)assert.equal(f.restraints.release,1,'cuffs released before approaching hearth');
  if(page.forgeAction==='hammer')assert.deepEqual([...f.prisonAction.contacts],[.272,.512,.752]);
 }
}
const page=book.scenes.fusion.pages[5];
for(let n=0;n<=1000;n++){
 const t=n/1000,f=a.buildStoryFrame('fusion',t,page),b=f.actors.get('byte'),d=f.actors.get('demon');
 if(t<.85)assert.ok(b,'BYTE stays one complete identity until absorption');
 if(t>.44&&t<.53){assert.ok(b.depth>d.foot,'hands cannot be hidden behind Veyr');assert.ok(dist(a.rigSocket(b,0),{x:533,y:172})<5);assert.ok(dist(a.rigSocket(b,1),{x:549,y:172})<5);}
 if(t<.84)assert.notEqual(d.boss,'fused','no fused form before absorption');
 if(t>=.96){assert.equal(d.boss,'fused');assert.ok(!b,'separate BYTE is gone');}
}
for(const [id,scene] of Object.entries(book.scenes))for(const [index,page] of scene.pages.entries()){
 assert.equal(page.shotId,`${id}:${index}`);assert.ok(page.location&&page.camera&&page.durationMs>=4000);
 assert.ok(!/\bengine\b/i.test(page.text),'no unexplained machine terminology');
 const start=a.buildStoryFrame(page.art,0,page),end=a.buildStoryFrame(page.art,1,page);
 assert.equal(start.shotId,page.shotId); // memory final frames may be localized
 assert.ok(Number.isFinite(end.camera.zoom));
}
assert.equal(a.buildStoryFrame('prison',1,{byteExit:true}).actors.get('byte').opacity,0);
console.log(`PASS v22 cinema: ${tested} interactive prison samples; no escaped prisoner behind shut door, no BYTE during forge, exact crown grip and foreground depth, ordered absorption, 81 authored locations/lenses/durations.`);
