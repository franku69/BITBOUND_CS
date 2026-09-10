'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','story-game.html'),'utf8');
const {buildContext}=require('./helpers/game-harness.cjs');

const test=buildContext('?quality=low');
const {sandbox:s,elements,listeners}=test;
const api=s.TestAPI;
assert.equal(s.BitboundQuestions.validate(),true);
assert.equal(s.BitboundQuestions.bank.filter(q=>q.type==='code').length,48);
assert.equal(elements.get('game').width,960);
assert.equal(s.BitboundGameCatalog.pets.length,4);
assert.ok(s.BitboundGameCatalog.weaponDesigns.length>=14);
assert.equal(s.BitboundStory.snapshot(),null);assert.equal(s.BitboundStory.hasUnsaved(),false);
// Story setup appears immediately, but coding challenges remain closed during warmup.
assert.doesNotMatch(html,/game-dock|gameDock|data-open-lab|effectsMode|adventureHelp|pythonLabBtn|python-lab-launcher/);
assert.match(html,/<section id="puzzleOverlay" hidden/);
assert.equal(elements.get('puzzleOverlay').hidden,true);
s.BitboundChallenges.prewarm();
const warmedFrame=elements.get('puzzleOptions').children[0];
assert.equal(elements.get('puzzleOverlay').classList.contains('show'),false);
assert.equal(elements.get('puzzleOverlay').hidden,true);
// Solo start needs no five-name form, and a new save starts at zero completions.
api.startNew();
assert.equal(api.state.started,true);assert.equal(api.state.members.length,1);
assert.equal(api.state.academicPoints,0);
api.state.tutorialRead.q01=true;api.openShrine(0);
const frame=elements.get('puzzleOptions').children.at(-1);
assert.equal(frame.src,'app/lab.html');
assert.equal(frame,warmedFrame,'first story challenge reuses the prepared editor');
for(const listener of listeners.message)listener({origin:'http://example.test',source:frame.contentWindow,data:{type:'bitbound:workspace-ready'}});
const session=frame.contentWindow.messages.at(-1).session;
assert.equal(frame.contentWindow.messages.at(-1).taskId,'q01');
// Reject wrong origin and unrelated frame; accept only current iframe + mission.
for(const event of [{origin:'http://wrong.test',source:frame.contentWindow},{origin:'http://example.test',source:{}}]){
 for(const listener of listeners.message)listener({...event,data:{type:'bitbound:challenge-passed',taskId:'q01',session}});
}
assert.equal(api.state.solved[0][0],false);
for(const listener of listeners.message)listener({origin:'http://example.test',source:frame.contentWindow,data:{type:'bitbound:challenge-passed',taskId:'q01',session}});
assert.equal(api.state.solved[0][0],true);assert.equal(api.state.academicPoints,1);
const score=api.state.score;
for(const listener of listeners.message)listener({origin:'http://example.test',source:frame.contentWindow,data:{type:'bitbound:challenge-passed',taskId:'q01',session}});
assert.equal(api.state.score,score,'duplicate completion must not award twice');
const saved=api.storySnapshot();assert.equal(api.validateStorySnapshot(saved).solved[0][0],true);
api.hide(elements.get('puzzleOverlay'));assert.notEqual(frame.removed,true,'Closing keeps the editor and Python worker alive');
assert.equal(frame.contentWindow.messages.at(-1).type,'bitbound:hide-workspace');
api.state.tutorialRead.q02=true;api.openShrine(1);assert.equal(elements.get('puzzleOptions').children.at(-1),frame,'Reuse one iframe across missions');
api.restoreStorySnapshot(api.validateStorySnapshot(saved));assert.equal(api.state.solved[0][0],true);
// This terminal/UI fixture completes its prerequisite lessons first.
api.enterWorld();require("./helpers/learning.cjs").finishTrailStage(api,4);
api.openAssessment();
while(api.plotState().scene==='prisoners')api.advancePlotScene();
const taskButtons=elements.get('assessmentBody').children.filter(child=>child.tagName==='BUTTON');
assert.equal(taskButtons.length,2);
assert.ok(taskButtons.every(button=>typeof button.onclick==='function'));
for(let n=0;n<100;n++)api.update(1/30);
assert.ok(api.state.projectiles.length<=140);
console.log('PASS adventure: 48 coding missions, solo start, pets/weapons, iframe-origin validation, single awards, checkpoint resume, terminal and bounded updates.');
