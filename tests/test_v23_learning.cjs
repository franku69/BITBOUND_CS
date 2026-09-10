'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {buildContext}=require('./helpers/game-harness.cjs'),{finishRuneSet,finishTrailStage}=require('./helpers/learning.cjs');
function setup(world=0){const h=buildContext('?quality=low'),a=h.sandbox.TestAPI;a.startNew();a.enterWorld();a.state.level=world;a.generateWorld(world);a.state.boss=null;a.state.enemies=[];return {h,a};}
let total=0,sets=0;
// No random spawns, combat kills, or probability: the physical route still
// requires every authored question before each real shrine can be activated.
for(let w=0;w<8;w++){
 const {h,a}=setup(w);
 for(let stage=1;stage<=4;stage++){
  const r=a.trailSentryRect(stage-1);assert.equal(r,a.trailSentryRect(stage-1),'cached static sentry');
  a.player.x=r.x+3*32-20;a.player.y=r.y+r.h-a.player.h;
  a.updateInteractable();assert.equal(a.state.currentInteract.type,'shrine');
  assert.equal(a.state.currentInteract.index,stage-1);a.interact();
  assert.ok(a.questionDirector.active,'unsolved curriculum intercepts shrine');
  assert.equal(a.state.solved[w][stage-1],false,'lesson alone never awards shrine');
  assert.equal(a.questionDirector.active.question.world,w);
  assert.equal(a.questionDirector.active.question.stage,stage);
  const count=finishRuneSet(a);total+=count;sets++;
  const before=a.worldLessonProgress(w,stage).done;sets+=finishTrailStage(a,stage);
  total+=a.worldLessonProgress(w,stage).done-before;
  assert.equal(a.worldLessonProgress(w,stage).remaining,0);
  assert.ok(a.requireWorldLessons(stage),'completed stage unlocks');
  a.state.solved[w][stage-1]=true;
 }
 assert.equal(a.worldLessonProgress(w).done,a.ENCOUNTER_WORLDS[w].length);
 assert.equal(a.state.enemies.length,0,'sentries do not spawn extra combat enemies');
 assert.equal(h.sandbox.localStorage.writes.length,0,'new students never inherit progress automatically');
}
assert.equal(total,268);
// Four sequential rounds are one paused encounter, wrong answers cannot advance,
// and manual saves resume at the exact first unfinished lesson.
{
 const {h,a}=setup(3),r=a.trailSentryRect(0);a.player.x=r.x;a.player.y=r.y+r.h-a.player.h;a.updateInteractable();a.interact();
 assert.equal(a.questionDirector.active.set.length,4);
 const first=a.questionDirector.active.question,initialHp=a.player.health=2;
 a.answerQuestionEncounter((first.answer+1)%first.choices.length);assert.equal(a.closeQuestionEncounter(),false);
 assert.equal(a.questionDirector.active.question.id,first.id);assert.equal(a.player.health,initialHp);
 a.answerQuestionEncounter(first.answer);assert.equal(a.encounterUI.next.disabled,false);a.closeQuestionEncounter();
 assert.equal(a.state.paused,true);assert.equal(a.player.health,initialHp,'healing occurs once at set end');
 assert.equal(a.encounterUI.round.textContent,'ROUND 2 / 4 · WORLD LESSONS 1 / 32');
 const second=a.questionDirector.active.question,saved=a.validateStorySnapshot(a.storySnapshot());
 assert.equal(saved.encounterVersion,4);assert.equal(saved.encounterRead[first.id],true);assert.equal(saved.encounterRead[second.id],undefined);
 const {a:b}=setup(3);b.restoreStorySnapshot(saved);assert.equal(b.takeEncounterQuestion(3).id,second.id);
 assert.equal(b.questionDirector.active,null,'restore never auto-opens a question');
 finishRuneSet(a);assert.equal(a.player.health,3);assert.equal(a.state.paused,false);
 assert.equal(h.sandbox.localStorage.writes.length,0);
}
// A previous version's elementary World 4 completions cannot satisfy new applied
// lessons, but imported shrines, equipment and other-world answers survive.
{
 const {a}=setup(3),s=a.storySnapshot();s.encounterVersion=3;s.solved[3][0]=true;
 s.encounterRead={[a.ENCOUNTER_WORLDS[3][0].id]:true,[a.ENCOUNTER_WORLDS[2][0].id]:true};
 const migrated=a.validateStorySnapshot(s);assert.equal(migrated.solved[3][0],true);assert.deepEqual([...migrated.weapons],[...s.weapons]);
 assert.equal(migrated.encounterRead[a.ENCOUNTER_WORLDS[3][0].id],undefined);
 assert.equal(migrated.encounterRead[a.ENCOUNTER_WORLDS[2][0].id],true);assert.equal(migrated.lessonUpgrade,true);
}
// The terminal and portal have their own curriculum gates, even when old saves
// or developer fixtures already contain four solved shrine flags.
for(const action of ['openAssessment','nextWorld']){
 const {a}=setup(3);a.state.solved[3].fill(true);a.state.bossDefeated[3]=true;
 a[action]();assert.equal(a.state.level,3);assert.ok(a.questionDirector.active);assert.equal(a.questionDirector.active.question.world,3);
}
for(const kind of ['guardian','paladin','demon','fused']){
 const {a}=setup(3);a.state.boss={active:true,dead:false,storyKind:kind};
 assert.equal(a.requireWorldLessons(4),false);assert.equal(a.questionDirector.active,null,'sentries never interrupt '+kind);
}
const html=fs.readFileSync(path.join(__dirname,'../story-game.html'),'utf8');
assert.match(html,/id="encounterSave"[^>]*data-save-session/);
console.log(`PASS v23 educational route: all ${total} questions required through physical shrines/sentries in ${sets} sets, with zero random mobs; multi-round pause/retries, save/resume, migration, terminal/portal gates and all boss exclusions.`);
