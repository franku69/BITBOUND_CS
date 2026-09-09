'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s,elements,listeners,drawCalls}=buildContext('?quality=low');
const api=s.TestAPI;
const {finishTrailStage}=require('./helpers/learning.cjs');
const press=id=>elements.get(id).onclick();
api.startNew();api.enterWorld();
assert.equal(api.worlds.length,8);
assert.equal(api.mentorRect().w,36);assert.equal(api.mentorRect().h,56);assert.ok(api.mentorRect().h>api.player.h);
assert.equal(api.mentorRect().y+api.mentorRect().h,api.state.world.surface[api.mentorRect().col]*32,'taller Byte stands on the same ground');
assert.equal(api.mentorRect(),api.mentorRect(),'unchanged NPC uses a cached rectangle');
assert.equal(api.getObjective().short,'TALK TO BYTE');
api.player.x=api.mentorRect().x;api.player.y=api.mentorRect().y+api.mentorRect().h-api.player.h;api.updateInteractable();
assert.equal(api.state.currentInteract.type,'mentor');api.interact();assert.equal(api.UI.mentor.hidden,false);
api.closeMentor();assert.equal(api.state.tutorialRead.q01,undefined);
api.openShrine(0);assert.equal(api.UI.mentor.hidden,false);assert.equal(api.state.paused,true);
assert.equal(elements.get('puzzleOptions').children.length,0,'tutorial gates editor launch');
press('mentorNext');press('mentorNext');assert.equal(elements.get('mentorNext').disabled,true);
// Wrong answer and closing cannot mark a lesson read or restore a core.
elements.get('mentorChoices').children[1].onclick();assert.equal(elements.get('mentorNext').disabled,true);
press('mentorNext');assert.equal(api.state.tutorialRead.q01,undefined);
api.closeMentor();assert.equal(api.completedQuestionCount(),0);
let frame=null;
function finishLesson(id){
  assert.equal(api.UI.mentor.hidden,false,`${id} has its own tutorial gate`);
  press('mentorNext');press('mentorNext');
  const answer=s.BitboundQuestions.tutorials[id].answer;
  elements.get('mentorChoices').children[answer].onclick();
  assert.equal(elements.get('mentorNext').disabled,false);
  press('mentorNext');
  assert.equal(api.state.tutorialRead[id],true);
  assert.equal(api.UI.mentor.hidden,true);
}
function pass(id,keepOpen=false){
  const current=elements.get('puzzleOptions').children.at(-1);
  if(!frame){frame=current;for(const fn of listeners.message)fn({origin:s.location.origin,source:frame.contentWindow,data:{type:'bitbound:workspace-ready'}});}
  assert.equal(current,frame,'all 48 challenges share one iframe');
  const message=frame.contentWindow.messages.at(-1);
  assert.equal(message.taskId,id);
  const event={origin:s.location.origin,source:frame.contentWindow,data:{type:'bitbound:challenge-passed',taskId:id,session:message.session}};
  for(const fn of listeners.message)fn(event);
  assert.ok(api.playerAnimator.celebration>0,'accepted challenge queues player celebration');
  const count=api.completedQuestionCount();
  for(const fn of listeners.message)fn(event);
  assert.equal(api.completedQuestionCount(),count,'duplicate pass ignored');
  if(!keepOpen)api.hide(api.UI.puzzle);
}
function finishScene(expected){
  assert.equal(api.plotState().scene,expected);
  for(let count=0;api.plotState().scene===expected&&count<12;count++)api.advancePlotScene();
  assert.notEqual(api.plotState().scene,expected);
}
for(let level=0;level<8;level++){
  assert.equal(api.state.level,level);
  const ids=api.worlds[level].questionIds;
  for(let index=0;index<6;index++){
    const before=level*6+index;
    if(index<4){finishTrailStage(api,index+1);api.openShrine(index);}
    else {
      if(level===0&&index===4){api.openAssessment();finishScene('prisoners');}
      if(level===7&&index===5){
        assert.equal(api.plotState().scene,'rivals');finishScene('rivals');
        assert.equal(api.state.boss.storyKind,'paladin');
        api.openTerminalTask(7,1);assert.equal(api.UI.mentor.hidden,true,'barrier blocked before paladin');
        api.defeatBoss();assert.equal(api.state.bossDefeated[7],false,'paladin is not the final boss');
        finishScene('paladinFall');
      }
      api.openTerminalTask(level,index-4);
    }
    finishLesson(ids[index]);
    assert.equal(api.completedQuestionCount(),before,'reading does not count as passing');
    pass(ids[index],index===4);
    assert.equal(api.completedQuestionCount(),before+1);
    assert.equal(elements.get('campaignCount').textContent,`${before+1} / 48`);
    if(index===4){assert.equal(api.state.assessmentPassed[level],false);assert.equal(api.state.academicPoints,before+1);}
  }
  if(level===7)finishScene('barrier');
  assert.equal(api.mentorRect(),null,'no lesson marker during boss fight');
  assert.equal(api.state.boss.maxHp,[18,24,30,38,44,50,58,66][level]);
  api.state.camera.x=6200;api.state.camera.y=api.state.boss.y-100;api.draw();assert.ok(drawCalls.fillRect>0);
  api.defeatBoss();
  if(level===0){
    assert.equal(api.plotCanExit(),false);api.nextWorld();assert.equal(api.state.level,0,'must physically free prisoners');
    api.player.x=182*32;api.player.y=api.state.world.surface[182]*32-api.player.h;
    api.updateInteractable();assert.equal(api.state.currentInteract.type,'prisoners');api.interact();finishScene('rescue');
    assert.equal(api.plotState().partyFreed,true);assert.ok(api.state.weapons.includes('byte_dagger'));
  }
  if(level===7){
    assert.equal(api.state.bossDefeated[7],false);finishScene('fusion');assert.equal(api.state.boss.storyKind,'fused');
    api.defeatBoss();finishScene('ending');
  }else{
    api.openChapterEnding();press('mentorNext');assert.equal(api.state.chapterTalks[level],true);
    api.nextWorld();
    if(level===3){
      finishScene('betrayal');assert.equal(api.plotState().scene,'cell');
      elements.get('storyActions').children[0].onclick();elements.get('storyActions').children[0].onclick();
      assert.equal(api.forgePrisonKey(2),false,'cannot quench before heating');
      for(let step=0;step<3;step++)assert.equal(api.forgePrisonKey(step),true);
      elements.get('storyActions').children[0].onclick();finishScene('escape');
      assert.equal(api.plotState().escaped,true);api.nextWorld();
    }
    assert.equal(api.state.level,level+1);assert.equal(api.state.started,true);api.enterWorld();
    if(level<3)finishScene('camp'+(level+1));
  }
}
assert.equal(api.state.started,false);assert.equal(elements.get('reportAcademicPoints').textContent,'48/48');
assert.equal(Object.keys(api.state.encounterRead).length,268,'full campaign completes EVERY trail lesson, not only the shrines');
assert.equal(Object.keys(api.state.tutorialRead).length,48);
const finished=api.validateStorySnapshot(api.storySnapshot());
assert.equal(finished.finished,true,'final campaign is manually exportable');
const restored=buildContext('?quality=low').sandbox.TestAPI;
restored.restoreStorySnapshot(finished);
assert.equal(restored.completedQuestionCount(),48);
assert.equal(restored.state.finished,true);
assert.equal(restored.state.started,false);
assert.equal(restored.storySnapshot().chapterTalks.filter(Boolean).length,7);

// Migrate an actual-shaped legacy five-world checkpoint, including one terminal pass.
const m=buildContext('?quality=low').sandbox;const old=m.TestAPI;old.startNew();
const saved=old.storySnapshot();
saved.level=4;saved.solved=saved.solved.slice(0,5);saved.assessmentPassed=saved.assessmentPassed.slice(0,5);saved.bossDefeated=saved.bossDefeated.slice(0,5);saved.terminalSolved=saved.terminalSolved.slice(0,5);
saved.solved[0][0]=true;saved.terminalSolved[4]=[true,false];delete saved.tutorialRead;delete saved.plot;
old.restoreStorySnapshot(old.validateStorySnapshot(saved));
assert.equal(old.state.solved.length,8);assert.equal(old.state.solved[0][0],true);assert.equal(old.state.terminalSolved[4][0],true);
assert.deepEqual(Array.from(old.state.terminalSolved[7]),[false,false]);
old.state.level=7;old.state.tutorialRead.q48=true;
assert.equal(old.validateStorySnapshot(old.storySnapshot()).level,7);assert.equal(old.validateStorySnapshot(old.storySnapshot()).tutorialRead.q48,true);
console.log('PASS Stoneborn story: prisoner rescue, party, betrayal/forging escape, paladin/BFS barrier, BYTE fusion, immortal ending; all 48 tutorial gates and challenge awards across eight worlds; NPC size/interaction/cache; partial terminals; guardian progression; 48/48 ending; five-world checkpoint migration.');
