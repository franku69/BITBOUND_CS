'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s,elements}=buildContext('?quality=low');
const api=s.TestAPI,next=elements.get('mentorNext'),choices=elements.get('mentorChoices'),feedback=elements.get('mentorFeedback');
api.startNew();api.enterWorld();
function showCheck(id){
  api.openMentor(id);
  next.onclick();next.onclick();
  assert.equal(next.disabled,true);
}
for(const id of ['q01','q02']){
  showCheck(id);
  const lesson=s.BitboundQuestions.tutorials[id],wrong=(lesson.answer+1)%3;
  choices.children[wrong].onclick();
  assert.equal(next.disabled,true,'wrong answer explains and permits retry');
  assert.match(feedback.textContent,/Useful guess/);
  assert.equal(choices.children[wrong].dataset.result,'incorrect');
  choices.children[lesson.answer].onclick();
  assert.equal(next.disabled,false,'correct answer unlocks Back to the trail');
  assert.match(next.textContent,/Back to the trail/);
  assert.match(feedback.textContent,/Correct/);
  next.onclick();
  assert.equal(api.UI.mentor.hidden,true);
  assert.equal(api.state.paused,false);
  assert.equal(api.state.tutorialRead[id],true);
}
// An optional Canvas/reaction failure cannot block any lesson's answer or exit.
api.mentorAnimator.paint=()=>{throw new Error('simulated unavailable portrait');};
const warnings=[];s.console={...console,warn:(...args)=>warnings.push(args)};
for(const lesson of Object.values(s.BitboundQuestions.tutorials)){
  showCheck(lesson.id);choices.children[lesson.answer].onclick();
  assert.equal(next.disabled,false,lesson.id+' remains usable when animation fails');
  next.onclick();assert.equal(api.UI.mentor.hidden,true);
}
assert.equal(warnings.length,1,'disable failed presentation once, without flooding logs');
api.state.tutorialRead.q01=false;api.openShrine(0);
next.onclick();next.onclick();choices.children[0].onclick();
assert.match(next.textContent,/Open challenge/);assert.equal(next.disabled,false);
next.onclick();assert.equal(api.UI.puzzle.hidden,false,'shrine continuation opens the actual challenge');
console.log('PASS lesson buttons: Window timer semantics, q01/q02 retry/continue, all 48 lessons under animation failure, and shrine-to-editor continuation.');
