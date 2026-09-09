'use strict';
const assert=require('node:assert/strict'),{buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s}=buildContext('?quality=standard'),a=s.TestAPI,book=s.BitboundQuestions.story;
let pages=0;
for(const scene of Object.values(book.scenes))for(const page of scene.pages){
 const f=a.applyStoryAmbient(a.buildStoryFrame(page.art,1,page),8);
 pages++;
 for(const actor of f.actors.values()){
  if(actor.kind==='boss')continue;
  assert.ok(actor.expression,'every visible character has facial acting');
  if(actor.rotation||actor.motion==='sleep'){assert.equal(actor.expression.speaking,false);assert.equal(actor.expression.blink,true);}
  assert.ok(Math.abs(actor.expression.gaze)<=1);
 }
 const later=a.applyStoryAmbient(a.buildStoryFrame(page.art,1,page),19);
 assert.deepEqual([...f.actors.keys()],[...later.actors.keys()],'reading never respawns a departed character');
 assert.equal(f.t,1);assert.equal(later.t,1,'reading never restarts a plotted action');
 if(f.gate)assert.equal(f.gate.open,later.gate.open);
}
const fuse=book.scenes.fusion.pages[5],duel=book.scenes.fusion.pages[6];
const end=a.buildStoryFrame(fuse.art,1,fuse),start=a.buildStoryFrame(duel.art,0,duel);
assert.equal(end.actors.get('demon').kneel,start.actors.get('demon').kneel,'standing fusion does not kneel again at next shot');
const warning=a.buildStoryFrame(duel.art,.32,duel),strike=a.buildStoryFrame(duel.art,.48,duel),recovery=a.buildStoryFrame(duel.art,.65,duel);
assert.ok(warning.fusion.warning>.8);assert.equal(warning.fusion.strike,0);
assert.ok(strike.actors.get('demon').clawImpact>.95,'visible claw contacts at strike');assert.ok(strike.fusion.strike>.95);
assert.ok(Math.abs(strike.fusion.impactPoint.y-264)<3,'impact originates where the claw touches the floor');
assert.ok(recovery.fusion.demo>.95,'crown opens after impact');assert.equal(recovery.fusion.strike,0);
for(const f of [end,start,warning,strike,recovery])assert.ok(!f.actors.has('byte'));
console.log(`PASS v23 story acting: all ${pages} pages have speaker/listener expressions; sleeping/fallen actors stay quiet, reading preserves plot/cast/doors, fusion-to-strike continuity and warning-impact-recovery timing.`);
