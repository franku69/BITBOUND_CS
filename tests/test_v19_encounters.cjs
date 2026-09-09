'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
const {finishRuneSet}=require('./helpers/learning.cjs');
function setup(){const h=buildContext('?quality=standard'),a=h.sandbox.TestAPI;a.startNew();a.enterWorld();a.player.x=720;a.player.y=200;a.player.health=5;a.state.boss=null;return {h,a};}
const {h,a}=setup();
// Each world teaches a fixed path. Merely opening or reading cannot advance it.
for(let w=0;w<8;w++){
 const deck=a.ENCOUNTER_WORLDS[w],seen=new Set();
 for(let i=0;i<deck.length;i++){const q=a.takeEncounterQuestion(w);assert.equal(q.world,w);assert.equal(q.sequence,i+1);assert.ok(!seen.has(q.id));assert.equal(a.takeEncounterQuestion(w).id,q.id,'opening twice does not skip');seen.add(q.id);a.state.encounterRead[q.id]=true;}
 assert.equal(seen.size,deck.length);
}
a.questionDirector.reviewPosition=a.ENCOUNTER_WORLDS.map(()=>0);
const enemy=()=>({id:999,x:a.player.x+40,y:a.player.y,w:28,h:25,type:'slime',alive:true,questionMob:true,hp:3,maxHp:3});
const counts=JSON.stringify(a.state.solved),terminals=JSON.stringify(a.state.terminalSolved);
// Exercise the actual choice and continue callbacks for every authored question.
for(const q of a.ENCOUNTER_BANK){
 a.state.level=q.world;a.state.encounterRead=Object.fromEntries(a.ENCOUNTER_WORLDS[q.world].filter(item=>item.sequence<q.sequence).map(item=>[item.id,true]));
 const e=enemy();a.state.enemies=[e];assert.ok(a.openQuestionEncounter(e),q.id);
 assert.equal(a.state.paused,true);assert.equal(a.encounterUI.next.disabled,true);
 a.encounterUI.choices.children[(q.answer+1)%3].onclick();
 assert.equal(a.encounterUI.next.disabled,true);assert.equal(a.player.health,5);
 assert.equal(a.closeQuestionEncounter(),false,'cannot silently complete a wrong response');
 a.encounterUI.choices.children[q.answer].onclick();assert.equal(a.encounterUI.next.disabled,false);
 a.encounterUI.next.onclick();assert.equal(a.state.encounterRead[q.id],true);finishRuneSet(a);assert.equal(e.alive,false);assert.equal(a.state.paused,false);
 assert.equal(a.player.health,5,'reward respects health cap');
}
assert.equal(JSON.stringify(a.state.solved),counts);assert.equal(JSON.stringify(a.state.terminalSolved),terminals);
// Bosses, final phases, overlays, hidden tabs, sanctuary and death block launch.
for(const kind of [null,'paladin','demon','fused']){
 a.state.boss={active:true,dead:false,storyKind:kind};assert.equal(a.openQuestionEncounter(enemy()),false);
}
a.state.boss=null;a.player.x=202*32;assert.equal(a.questionsAllowed(),false);a.player.x=720;
a.state.paused=true;assert.equal(a.openQuestionEncounter(enemy()),false);a.state.paused=false;
a.plotState().scene='rivals';assert.equal(a.openQuestionEncounter(enemy()),false);a.plotState().scene=null;
h.sandbox.document.hidden=true;assert.equal(a.questionsAllowed(),false);h.sandbox.document.hidden=false;
a.player.health=0;assert.equal(a.questionsAllowed(),false);a.player.health=5;
// Proximity opens immediately; no warning timer can be canceled by movement.
a.questionDirector.cooldown=0;a.questionDirector.scan=0;a.state.enemies=[enemy()];
a.updateQuestionEncounters(.2);assert.ok(a.questionDirector.active,'nearby rune mob opens a required battle');
assert.equal(a.questionDirector.active.question.world,a.state.level);
assert.equal(a.closeQuestionEncounter(true),false,'legacy retreat argument cannot bypass the answer');
assert.equal(a.state.paused,true);
finishRuneSet(a);
// New student sessions start empty. Explicit snapshots keep valid question IDs.
a.state.encounterRead={'e01-01':true,'invalid':true};const saved=a.validateStorySnapshot(a.storySnapshot());assert.equal(saved.encounterRead['e01-01'],true);assert.equal(saved.encounterRead.invalid,undefined);
a.resetQuestionEncounters(true);assert.equal(Object.keys(a.state.encounterRead).length,0);
console.log('PASS encounters: all 268 answer/continue paths, world decks, required correct answer, boss and overlay guards, manual progress and unchanged shrine counts.');
