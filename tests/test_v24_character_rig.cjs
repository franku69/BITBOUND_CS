'use strict';
const assert=require('node:assert/strict'),{buildContext}=require('./helpers/game-harness.cjs');
const {sandbox}=buildContext('?quality=standard'),a=sandbox.TestAPI;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// A conversational hand is extended from a lowered elbow, not a raised chicken wing.
const spoken=a.sampleRig('speak',.5);
assert.ok(spoken.elbows[1].y>spoken.shoulders[1].y+5);
assert.ok(spoken.hands[1].x>spoken.elbows[1].x+5);
// A rotated/fallen character must take the same exact path for pixels and sockets.
// Cached upright art formerly ignored the settling pose of rotated actors.
let checks=0;
for(const kind of ['hero','byte','ally'])for(let index=0;index<(kind==='ally'?4:1);index++){
 for(let n=0;n<=100;n++){
  const actor={kind,index,x:220,foot:264,scale:1.1,face:n%2?1:-1,motion:'hurt',phase:n/100,rotation:-Math.PI/2*n/100};
  const pose=a.rigPoseForActor(actor);
  for(let i=0;i<2;i++){
   assert.ok(Math.abs(distance(pose.shoulders[i],pose.elbows[i])-13)<.001);
   assert.ok(Math.abs(distance(pose.elbows[i],pose.hands[i])-14)<.001);
   assert.ok(Math.abs(distance(pose.hips[i],pose.knees[i])-16)<.001);
   assert.ok(Math.abs(distance(pose.knees[i],pose.feet[i])-16)<.001);
   assert.ok(distance(a.rigWorldPoint(actor,pose.hands[i]),a.rigSocket(actor,i))<.001);
  }
  if(n>0){const painted=a.drawRigActor(sandbox.document.createElement('canvas').getContext('2d'),actor);assert.ok(distance(painted.hands[1],pose.hands[1])<.001);}
  checks++;
 }
}
// Byte's first greeting remains continuous when the walk stops and the wave starts.
const page=sandbox.BitboundQuestions.story.scenes.origin.pages[4];let last;
for(let n=530;n<=570;n++){
 const f=a.buildStoryFrame(page.art,n/1000,page),b=f.actors.get('byte'),hands=[a.rigSocket(b,0),a.rigSocket(b,1)];
 if(last)for(let i=0;i<2;i++)assert.ok(distance(hands[i],last[i])<3,'greeting has no wrist snap');last=hands;
}
console.log(`PASS v24 rig: ${checks} fallen poses keep fixed limbs and exact painted sockets; natural conversation elbow and continuous BYTE greeting.`);

// Acceleration changes cadence, not the phase origin. At 60 Hz the stride
// advances by at most 0.1 cycles, even late in a session and when reversing.
const animator=new sandbox.BitboundPlayerAnimation.PlayerAnimator();
const player={onGround:true,vx:3,vy:0,attack:0,dashTime:0};let previous=0;
for(let n=0;n<9000;n++){
 player.vx=(n%47<24?1:-1)*(1+(n%13)*.45);
 const phase=animator.update(1/60,player).phase,advance=(phase-previous+1)%1;
 assert.ok(advance>0&&advance<=.100001,'cadence remains continuous across speed changes');previous=phase;
}
console.log('PASS v24 cadence: 9,000 accelerating/reversing frames with no walk-cycle phase jumps.');
