'use strict';
const assert=require('node:assert/strict'),{buildContext}=require('./helpers/game-harness.cjs');
const h=buildContext('?quality=standard'),s=h.sandbox,a=s.TestAPI,book=s.BitboundQuestions.story;
const page=(scene,n)=>book.scenes[scene].pages[n],frame=(scene,n,t)=>a.buildStoryFrame(page(scene,n).art,t,page(scene,n));
const distance=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
let total=0;
for(const [name,scene] of Object.entries(book.scenes))for(const p of scene.pages)for(let n=0;n<=200;n++){
 const f=a.buildStoryFrame(p.art,n/200,p);total++;
 for(const actor of f.actors.values()){
  if(actor.kind==='boss')continue;const pose=a.rigPoseForActor(actor);
  for(let i=0;i<2;i++){
   assert.ok(Math.abs(distance(pose.shoulders[i],pose.elbows[i])-13)<.001,`${name} upper arm`);
   assert.ok(Math.abs(distance(pose.elbows[i],pose.hands[i])-14)<.001,`${name} forearm`);
   assert.ok(Math.abs(distance(pose.hips[i],pose.knees[i])-16)<.001,`${name} thigh`);
   assert.ok(Math.abs(distance(pose.knees[i],pose.feet[i])-16)<.001,`${name} lower leg`);
   const socket=a.rigSocket(actor,i),painted=a.rigWorldPoint(actor,pose.hands[i]);
   assert.ok(distance(socket,painted)<1e-8,'props and rendered palms use exactly the same final pose');
  }
 }
 const still=a.buildStoryFrame(p.art,1,p),idle=a.applyStoryAmbient(a.buildStoryFrame(p.art,1,p),8);
 assert.deepEqual([...still.actors.keys()],[...idle.actors.keys()],'ambient never adds a character');
 for(const [id,v] of still.actors){const next=idle.actors.get(id);assert.equal(next.x,v.x);assert.equal(next.foot,v.foot);assert.equal(next.rotation,v.rotation);assert.equal(next.armed,v.armed);}
 assert.deepEqual(JSON.parse(JSON.stringify(still.props)),JSON.parse(JSON.stringify(idle.props)),'no transfer or dropped prop replays');
}
// The reported cloak is carried by Aster, unfolds at contact, then remains on the shoulders.
for(const t of [0,.1,.29,.4,.59]){const f=frame('camp1',3,t);assert.equal(f.interaction.phase,'carried');assert.ok(!f.effects.includes('cloak'),'old fixed polygon removed');}
assert.equal(frame('camp1',3,.66).interaction.phase,'draping');assert.equal(frame('camp1',3,1).interaction.phase,'settled');
for(const t of [.6,.65,.69]){const f=frame('camp1',3,t);const palm=a.rigSocket(f.actors.get('aster')),shoulder=a.rigBodySocket(f.actors.get('hero'),45,34);assert.ok(distance(palm,shoulder)<5,'Aster reaches the shoulder before releasing the cloth');}
for(const id of ['mira','rook','fern'])assert.equal(frame('camp1',3,1).actors.get(id).motion,'sleep');
// A sewing action uses a small needle beside the sleeve, with a visible working interval.
for(const n of [3,4])for(let k=45;k<=80;k++){
 const f=frame('camp2',n,k/100),partner=f.actors.get(f.interaction.actor),sleeve=a.rigBodySocket(f.actors.get('hero'),45,46);
 assert.equal(f.interaction.kind,'sew');assert.ok(distance(a.rigSocket(partner),sleeve)<18,'no hook-like long thread');
 assert.ok(!f.effects.includes('sewing'));
}
for(const [t,phase] of [[.2,'held'],[.67,'wrapping'],[.85,'tying'],[.97,'secured']])assert.equal(frame('camp2',1,t).interaction.phase,phase);
assert.equal(frame('camp2',1,.4).interaction.tie,0,'no premature knot');
const hesitation=frame('camp3',2,1);assert.equal(hesitation.interaction.kind,'wristRibbon');assert.equal(hesitation.actors.get('fern').handTargets[1].weight,0,'Fern withdraws without retying');
const c0=frame('camp2',2,.1),c1=frame('camp2',2,1);assert.equal(c0.props.filter(p=>p.id==='cup').length,2);assert.equal(c1.props.filter(p=>p.id==='cup').length,2);assert.ok(c1.props.every(p=>p.id!=='cup'||!p.holder),'two cups are placed beside one another');
for(const t of [.45,.55,.65]){const f=frame('rescue',1,t),hero=f.actors.get('hero'),fern=f.actors.get('fern');for(const side of [0,1])assert.ok(distance(a.rigSocket(hero,side),a.rigSocket(fern,side))<4,'Fern takes both hands');}
for(const t of [.54,.56]){const f=frame('origin',5,t);assert.equal(f.props.find(p=>p.id==='pebble').holder,t<.55?'hero':'byte');}
for(const motion of ['wave']){const begin=a.sampleRig(motion,0),end=a.sampleRig(motion,1),lift=a.sampleRig(motion,.35);assert.ok(distance(begin.hands[1],end.hands[1])<.001);assert.ok(lift.hands[1].y<begin.hands[1].y-20,'wave lifts, gestures, lowers');}
for(const t of [.562,.8492]){const f=frame('ending',4,t);assert.ok(Math.abs(a.rigSocket(f.actors.get('hero')).y-264)<4,'both punches contact the foundation');assert.equal(f.actors.get('hero').footLift[0],7);}
// Clock lifecycle: exactly one slow idle timer, no replay, pause/hidden/close cancel it.
const timers=new Map();let id=0;s.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};s.clearTimeout=i=>timers.delete(i);
a.showPlotScene('camp1');a.plotState().scenePage=3;a.showPlotScene('camp1',true);
const pump=ms=>{const found=[...timers].find(([,v])=>v.ms===ms);assert.ok(found,`timer ${ms}`);timers.delete(found[0]);found[1].fn();};
for(let k=0;k<200&&[...timers.values()].some(v=>v.ms===50);k++)pump(50);
assert.equal([...timers.values()].filter(v=>v.ms===125).length,1,'one 8 FPS reading timer');assert.equal(a.getStoryPlayback().previous,1);
for(let k=0;k<20;k++)pump(125);assert.equal(a.getStoryPlayback().previous,1,'ambient cannot reset the action clock');
a.plotUI.still.onclick();const saved=a.getStoryPlayback().elapsed;assert.ok(![...timers.values()].some(v=>v.ms===125||v.ms===50));
a.plotUI.still.onclick();assert.equal(a.getStoryPlayback().elapsed,saved);pump(125);
s.document.hidden=true;for(const fn of h.listeners['document:visibilitychange'])fn();assert.ok(![...timers.values()].some(v=>v.ms===125||v.ms===50));
s.document.hidden=false;for(const fn of h.listeners['document:visibilitychange'])fn();assert.equal([...timers.values()].filter(v=>v.ms===125).length,1);
a.hide(a.plotUI.overlay);assert.ok(![...timers.values()].some(v=>v.ms===125||v.ms===50));
assert.equal(s.localStorage.writes.length,0);
console.log(`PASS v21: ${total} full-scene pose checks; cloak ownership, short stitching, ribbon phases, dual hand healing, greetings, two impacts, static plot/animated idle and timer lifecycle.`);
