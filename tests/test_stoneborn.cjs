'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
const setup=()=>{const h=buildContext('?quality=low');return {...h,api:h.sandbox.TestAPI};};
const finish=(api,id)=>{assert.equal(api.plotState().scene,id);for(let n=0;api.plotState().scene===id&&n<12;n++)api.advancePlotScene();assert.notEqual(api.plotState().scene,id);};
const h=setup(),{api,sandbox:s,elements,listeners,drawCalls}=h;
api.startNewRaw();
assert.equal(api.plotState().scene,'origin');assert.equal(api.state.paused,true);
assert.equal(elements.get('puzzleOptions').children.length,0,'birth does not load Python');
api.advancePlotScene();api.advancePlotScene();
let saved=api.validateStorySnapshot(api.storySnapshot());assert.equal(saved.plot.scenePage,2);
let restored=setup();restored.api.restoreStorySnapshot(saved);
assert.equal(restored.api.plotState().scene,'origin');assert.equal(restored.api.plotState().scenePage,2);assert.equal(restored.api.state.paused,true);
// No background game shortcut can cover a required scene, including Escape.
for(const key of ['e','h','c','Escape'])for(const fn of listeners.keydown)fn({key,target:{tagName:'BODY'},preventDefault(){}});
assert.equal(api.plotState().scene,'origin');assert.equal(api.UI.help.classList.contains('show'),false);
api.stopStoryAnimation();const before=drawCalls.fillRect||0;
for(const fn of s.queued.splice(0))fn();assert.equal(drawCalls.fillRect||0,before,'cancelled scene callbacks draw nothing');
finish(api,'origin');api.enterWorld();assert.equal(api.state.paused,false);
// Prison is a persistent interaction, not a skippable ending paragraph.
api.state.level=3;api.state.encounterRead=Object.fromEntries(api.ENCOUNTER_WORLDS[3].map(q=>[q.id,true]));api.generateWorld(3);api.plotState().partyFreed=true;api.state.bossDefeated[3]=true;
api.nextWorld();assert.equal(api.state.level,3);finish(api,'betrayal');
assert.equal(api.plotState().betrayed,true);assert.equal(api.plotState().scene,'cell');
assert.equal(api.forgePrisonKey(0),false);api.advancePlotScene();assert.equal(api.plotState().scene,'cell');
elements.get('storyActions').children[0].onclick();elements.get('storyActions').children[0].onclick();
assert.equal(api.forgePrisonKey(0),true);assert.equal(api.forgePrisonKey(2),false);assert.equal(api.plotState().forgeStep,1);
saved=api.validateStorySnapshot(api.storySnapshot());restored=setup();restored.api.restoreStorySnapshot(saved);
assert.equal(restored.api.plotState().scene,'cell');assert.equal(restored.api.plotState().forgeStep,1);
assert.equal(restored.api.forgePrisonKey(1),true);assert.equal(restored.api.forgePrisonKey(2),true);
assert.equal(restored.api.state.weapons.includes('byte_dagger'),false,'dagger has become key');
restored.elements.get('storyActions').children[0].onclick();finish(restored.api,'escape');restored.api.nextWorld();assert.equal(restored.api.state.level,4);
// Ally contribution is bounded and stops immediately after betrayal.
const team=setup();team.api.startNew();team.api.enterWorld();team.api.plotState().partyFreed=true;team.api.resetParty();
team.api.state.enemies=[{id:200,x:team.api.player.x+100,y:team.api.player.y,hp:100,w:20,h:30,alive:true}];
team.api.player.health=2;for(let i=0;i<1000;i++)team.api.updateParty(1/60);
assert.ok(team.api.state.projectiles.length>0);assert.ok(team.api.state.projectiles.length<30);assert.ok(team.api.player.health>=3&&team.api.player.health<=5,'Fern heals within the health cap');
const shotCount=team.api.state.projectiles.length;team.api.plotState().betrayed=true;
for(let i=0;i<1000;i++)team.api.updateParty(1/60);assert.equal(team.api.state.projectiles.length,shotCount);
// Demon damage transitions exactly once into a separate shielded fusion battle.
const boss=setup();boss.api.startNew();boss.api.enterWorld();boss.api.state.level=7;boss.api.state.assessmentPassed[7]=true;
Object.assign(boss.api.plotState(),{finalPhase:'demon',rivalsSeen:true,paladinDefeated:true});boss.api.generateWorld(7);
let b=boss.api.state.boss;b.hp=b.maxHp*.35+1;b.action='recover';b.hitGuard=0;
assert.equal(boss.api.applyBossDamage(b,2),true);assert.equal(boss.api.plotState().scene,'fusion');assert.equal(boss.api.state.bossDefeated[7],false);
saved=boss.api.validateStorySnapshot(boss.api.storySnapshot());restored=setup();restored.api.restoreStorySnapshot(saved);
assert.equal(restored.api.plotState().scene,'fusion');finish(restored.api,'fusion');b=restored.api.state.boss;
assert.equal(b.storyKind,'fused');const hp=b.hp;b.action='chase';assert.equal(restored.api.applyBossDamage(b,20),false);assert.equal(b.hp,hp);
b.action='recover';assert.equal(restored.api.applyBossDamage(b,20),true);assert.equal(b.hp,hp-2,'damage cap keeps finale tactical');
assert.equal(restored.api.applyBossDamage(b,20),false,'hit guard prevents burst bypass');
// Dying retries the same final phase at full HP without repeating the paladin or questions.
restored.api.respawnPlayer();assert.equal(b.hp,b.maxHp);assert.equal(restored.api.state.checkpoint.col,194);assert.equal(restored.api.plotState().finalPhase,'fused');
// Finite attack telegraphs and reachable recovery windows on every boss profile.
for(const phase of ['paladin','demon','fused']){
 restored.api.plotState().finalPhase=phase;restored.api.startFinalBattle();b=restored.api.state.boss;
 restored.api.player.invuln=999;b.special=0;restored.api.updateBoss(1/60);
 assert.match(b.action,/^telegraph/);assert.ok(b.actionTimer>=.75);
 let recovery=false;for(let i=0;i<600;i++){restored.api.updateBoss(1/60);if(b.action==='recover'){recovery=true;assert.ok(b.actionTimer>=.9);break;}}
 assert.equal(recovery,true,phase+' leaves a usable opening');assert.ok(restored.api.state.projectiles.length<=140);
}
// Old files migrate explicitly; malformed scene/page/forge flags are rejected.
const old=api.storySnapshot();delete old.plot;old.level=5;
const migrated=api.validateStorySnapshot(old);assert.equal(migrated.plot.partyFreed,true);assert.equal(migrated.plot.escaped,true);
for(const change of [{scene:'missing'},{scenePage:999},{forgeStep:-1},{partyFreed:'yes'},{finalPhase:'not-a-phase'}]){
 const bad=structuredClone(saved);Object.assign(bad.plot,change);assert.equal(api.validateStorySnapshot(bad),null);
}
console.log('PASS Stoneborn events: origin/prison/fusion save-resume, shortcut isolation, finite animations, bounded allies, dagger forging, final-phase retries, telegraphs/recovery, shield damage and legacy migration.');
