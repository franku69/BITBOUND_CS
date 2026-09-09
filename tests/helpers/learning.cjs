const assert=require('node:assert/strict');
function finishRuneSet(a){let rounds=0;while(a.questionDirector.active){const q=a.questionDirector.active.question;a.answerQuestionEncounter(q.answer);assert.equal(a.closeQuestionEncounter(),true);assert.ok(++rounds<=4,'finite four-question maximum');}return rounds;}
function finishTrailStage(a,stage){
 let visits=0;while(a.worldLessonProgress(a.state.level,stage).remaining){
  const r=a.trailSentryRect(stage-1);a.player.x=r.x;a.player.y=r.y+r.h-a.player.h;a.updateInteractable();
  assert.equal(a.state.currentInteract.type,'trailSentry');a.interact();assert.ok(a.questionDirector.active,'the visible route sentry opens');
  assert.ok(a.questionDirector.active.question.stage<=stage);finishRuneSet(a);assert.ok(++visits<=12);
 }
 return visits;
}
module.exports={finishRuneSet,finishTrailStage};
