'use strict';
const assert=require('node:assert/strict'),{buildContext}=require('./helpers/game-harness.cjs');
const h=buildContext('?quality=standard'),s=h.sandbox,a=s.TestAPI;a.startNew();a.enterWorld();a.player.x=720;a.player.y=200;a.player.health=5;
const originalShrines=JSON.stringify(a.state.solved),originalTerminals=JSON.stringify(a.state.terminalSolved);
const enemy=()=>({id:400,x:a.player.x+25,y:a.player.y,w:28,h:25,type:'slime',alive:true,questionMob:true,hp:3,maxHp:3});
for(let w=0;w<8;w++){
 a.state.level=w;a.state.encounterRead={};a.questionDirector.reviewPosition[w]=0;
 const path=a.ENCOUNTER_WORLDS[w];let stage=1;
 for(const [index,q] of path.entries()){
  assert.equal(q.world,w);assert.equal(q.sequence,index+1);assert.ok(q.stage>=stage&&q.stage<=stage+1);stage=q.stage;
  assert.ok(q.worldContext.length>60&&q.stageTitle.length>3);
  const next=a.takeEncounterQuestion(w);assert.equal(next.id,q.id);assert.equal(a.takeEncounterQuestion(w).id,q.id,'no reservation skips');
  if(!a.questionDirector.active){const e=enemy();a.state.enemies=[e];assert.equal(a.openQuestionEncounter(e),true);}
  assert.ok(a.encounterUI.meta.textContent.includes(`LESSON ${index+1}/`));
  assert.ok(a.encounterUI.intro.textContent.startsWith(q.worldContext));
  a.answerQuestionEncounter((q.answer+1)%3);assert.equal(a.closeQuestionEncounter(),false);
  assert.equal(a.takeEncounterQuestion(w).id,q.id,'wrong answer does not advance');
  a.answerQuestionEncounter(q.answer);assert.equal(a.takeEncounterQuestion(w).id,q.id,'wait for explicit completion');
  a.closeQuestionEncounter();
 }
 assert.equal(stage,4);
 // Fully completed worlds review from their first principle, not a random item.
 for(let i=0;i<path.length+2;i++){
  if(!a.questionDirector.active){const e=enemy();a.state.enemies=[e];assert.equal(a.openQuestionEncounter(e),true);}
  const q=path[i%path.length];assert.equal(a.questionDirector.active.question.id,q.id);
  assert.ok(a.encounterUI.meta.textContent.includes('REVIEW'));
  a.answerQuestionEncounter(q.answer);a.closeQuestionEncounter();
 }
 // A pre-v22 save with scattered answers fills the earliest missing prerequisite.
 a.state.encounterRead=Object.fromEntries(path.filter((_,i)=>i!==2&&i!==5).map(q=>[q.id,true]));
 assert.equal(a.takeEncounterQuestion(w).id,path[2].id);a.state.encounterRead[path[2].id]=true;assert.equal(a.takeEncounterQuestion(w).id,path[5].id);
}
assert.equal(JSON.stringify(a.state.solved),originalShrines);assert.equal(JSON.stringify(a.state.terminalSolved),originalTerminals);
assert.equal(s.localStorage.writes.length,0);
console.log('PASS v22: 268 ordered lesson completions, all 8 review cycles, stage/context labels, wrong-answer blocking, legacy-save gaps, manual-only progress and unchanged shrines.');
