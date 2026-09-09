'use strict';
const assert=require('node:assert/strict'),{buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s}=buildContext('?quality=standard'),a=s.TestAPI;
const book=s.BitboundQuestions.story,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Prop ownership changes only at near-touching palms; lifting to the mouth is smooth.
for(const [scene,pageIndex] of [['rescue',2],['camp1',0],['camp2',2]]){
 const page=book.scenes[scene].pages[pageIndex];let previous=null;
 for(let n=0;n<=1000;n++){
  const f=a.buildStoryFrame(page.art,n/1000,page),prop=f.props.find(p=>p.holder);
  if(!prop)continue;const point=a.rigSocket(f.actors.get(prop.holder),prop.hand??1,prop.offset);
  if(previous)assert.ok(dist(point,previous)<6,`${scene}: hand-held prop never jumps away from its owner`);
  previous=point;
 }
}
// The hammer is attached to the same continuously sampled hand at every strike.
for(let n=0;n<=100;n++){
 const f=a.buildStoryFrame('prison',n/100,{beat:'forge',forgeStep:1,hideByte:true});
 const prop=f.props.find(p=>p.id==='hammer');assert.equal(prop.holder,'hero');assert.equal(prop.followAngle,true);
 assert.equal(f.actors.get('hero').motion,'forge');assert.ok(!f.actors.has('byte'));
}
// Proper crawling beneath the recall gate, rather than translating a kneeling sprite.
const recall=book.scenes.camp2.pages[0];let crawlers=0;
for(let n=0;n<=100;n++)for(const actor of a.buildStoryFrame(recall.art,n/100,recall).actors.values()){
 if(actor.kind==='ally'&&actor.x>235&&actor.x<398){assert.equal(actor.motion,'crawl');assert.equal(actor.foot,264);crawlers++;}
}
assert.ok(crawlers>20);
// A ground punch really touches the ground at the destruction contact time.
const page=book.scenes.ending.pages[4],f=a.buildStoryFrame(page.art,.25+.48*.65,page),palm=a.rigSocket(f.actors.get('hero'));
assert.ok(Math.abs(palm.y-264)<4,'fist meets masonry at contact');
// Key remains at the lock, then transfers smoothly to the walking explorer.
let last=null;
for(let n=560;n<=700;n++){
 const f=a.buildStoryFrame('escape',n/1000,{escapeBeat:0}),key=f.props.find(p=>p.id==='key');
 const point=key.holder?a.rigSocket(f.actors.get(key.holder)):key;
 if(last)assert.ok(dist(point,last)<6,'no lock-to-hand jump');last=point;
}
console.log('PASS v20 acting: continuous gifts/drinking, hand-attached forging, crawling below the gate, grounded punch contact and smooth key retrieval.');
