// Detect hard pose jumps at action boundaries, independently of frame sampling.
const {buildContext}=require('./helpers/game-harness.cjs');const h=buildContext('?quality=standard'),a=h.sandbox.TestAPI,book=h.sandbox.BitboundQuestions.story;const faults=[];
for(const [scene,def] of Object.entries(book.scenes))for(const [index,p] of def.pages.entries()){
 let prev=new Map();
 for(let n=0;n<=1000;n++){
  const f=a.buildStoryFrame(p.art,n/1000,p),cur=new Map();
  for(const actor of f.actors.values())if(actor.kind!=='boss'){
   const hands=[a.rigSocket(actor,0),a.rigSocket(actor,1)];cur.set(actor.id,{hands,x:actor.x,foot:actor.foot,stage:f.stage});const old=prev.get(actor.id);
   if(old&&old.stage===f.stage){const jump=Math.max(...hands.map((p,i)=>Math.hypot(p.x-old.hands[i].x,p.y-old.hands[i].y)));if(jump>8 && !(f.transition>.5))faults.push({scene,page:index+1,beat:p.beat,actor:actor.id,t:n/1000,jump:+jump.toFixed(1)});}
  }prev=cur;
 }
}
require('node:assert/strict').deepEqual(faults,[],'no discontinuous hand jumps outside deliberate faded scene cuts');console.log('PASS v21 dense motion: all 81 story pages at 1,001 samples; no unmasked hand jumps over 8 pixels per sample.');
