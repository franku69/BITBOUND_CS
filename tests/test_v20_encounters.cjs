'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
function setup(){const h=buildContext('?quality=standard'),a=h.sandbox.TestAPI;a.startNew();a.enterWorld();a.player.invuln=999;return {h,a};}
const {finishRuneSet:clear}=require('./helpers/learning.cjs');
function carrier(a,dx=40){return {id:999,x:a.player.x+dx,y:a.player.y,w:28,h:25,type:'slime',alive:true,questionMob:true,hp:3,maxHp:3,vx:0,vy:0,t:0};}
// Regression: use the real movement/attack/update path, without invoking the dialog.
// Across different terrain seeds and worlds, encounter before shrine one.
for(let world=0;world<8;world++)for(let run=0;run<4;run++){
 const {a}=setup();a.state.level=world;a.generateWorld(world);a.state.boss=null;
 let triggered=false;
 for(let frame=0;frame<600;frame++){
  a.state.keys.d=true;if(frame%34===0)a.attack();a.update(1/60);
  if(a.questionDirector.active){triggered=true;break;}
 }
 assert.ok(triggered,`world ${world+1}, traversal ${run}: walking/attacking opens the battle`);
 assert.equal(a.questionDirector.active.question.world,world);assert.ok(a.player.x<37*32,'encounter before shrine one');
 const x=a.player.x,clock=a.state.gameTime,health=a.player.health;
 for(let f=0;f<120;f++)a.update(1/60);
 assert.equal(a.player.x,x);assert.equal(a.state.gameTime,clock);assert.equal(a.player.health,health,'world frozen while reading');
 clear(a);assert.equal(a.state.paused,false);
}
// Melee, ranged fire, ally collateral and direct kill calls cannot destroy a seal.
for(const method of ['melee','projectile','ally','kill']){
 const {a}=setup();a.player.x=720;a.player.y=200;a.player.dir=1;
 const e=carrier(a,27);a.state.enemies=[e];a.rebuildEnemyIndex();
 if(method==='melee')a.attack();
 else if(method==='kill')a.killEnemy(e);
 else{a.state.projectiles=[{x:e.x,y:e.y,w:12,h:12,vx:0,vy:0,life:2,alive:true,friendly:true,damage:999,noTile:true,...(method==='ally'?{ally:1}:{})}];a.updateEnemies(1/60);}
 assert.ok(e.alive,method);assert.equal(e.hp,3,method);assert.ok(a.questionDirector.active,method);
 assert.equal(a.closeQuestionEncounter(true),false);clear(a);
}
// Native keyboard activation stays available; game shortcuts cannot open other overlays.
{
 const {h,a}=setup();a.player.x=720;a.player.y=200;a.openQuestionEncounter(carrier(a));
 const expected=a.questionDirector.active.question.answer;
 for(const key of ['Escape','h','e','q','j','k','9']){
  let prevented=false;const event={key,target:{tagName:'BUTTON'},ctrlKey:key==='9',shiftKey:key==='9',preventDefault(){prevented=true;}};
  for(const f of h.listeners.keydown)f(event);
  assert.ok(a.questionDirector.active);assert.equal(a.UI.overlays.filter(e=>e.classList.contains('show')).length,1,key);
 }
 for(const key of [' ','Enter','Tab']){
  let prevented=false;for(const f of h.listeners.keydown)f({key,target:{tagName:'BUTTON'},preventDefault(){prevented=true;}});
  assert.equal(prevented,false,'native '+key+' reaches focused control');
 }
 const wrong=(expected+1)%3;for(const f of h.listeners.keydown)f({key:'abc'[wrong],target:{tagName:'BUTTON'},preventDefault(){}});
 assert.equal(a.encounterUI.next.disabled,true);
 for(const f of h.listeners.keydown)f({key:'abc'[expected],target:{tagName:'BUTTON'},preventDefault(){}});
 assert.equal(a.encounterUI.next.disabled,false);clear(a);
}
// An ordinary nearby creature reveals a rune after travel; no additional enemies spawn.
{
 const {a}=setup();a.player.x=720;a.player.y=100;a.state.enemies=[carrier(a,90)];a.state.enemies[0].questionMob=false;
 a.questionDirector.cooldown=0;a.questionDirector.distance=500;a.questionDirector.scan=0;a.questionDirector.lastX=720;
 a.updateQuestionEncounters(.2);assert.equal(a.state.enemies.length,1);assert.equal(a.state.enemies[0].questionMob,true);
 a.updateQuestionEncounters(.2);assert.ok(a.questionDirector.active);clear(a);
}
// No interruption at ANY boss stage, even carrier contact or weapon hits.
for(const kind of ['guardian','paladin','demon','fused']){
 const {a}=setup();a.player.x=720;a.player.y=100;a.state.boss={active:true,dead:false,storyKind:kind};
 const e=carrier(a);a.state.enemies=[e];a.questionDirector.cooldown=0;a.updateQuestionEncounters(10);a.runeContact(e);
 assert.equal(a.questionDirector.active,null,kind);assert.equal(a.runeProtects(e),false);
}
// Art failure or a backgrounded tab must NEVER make an invisible blocking battle.
{
 const {h,a}=setup();a.player.x=720;a.player.y=100;let warnings=0;
 h.sandbox.console={...console,warn(message){assert.match(message,/answer controls remain active/);warnings++;}};
 a.encounterUI.portrait.getContext=()=>{throw new Error('test: unavailable graphics context');};
 assert.equal(a.openQuestionEncounter(carrier(a)),true);assert.ok(a.encounterUI.overlay.classList.contains('show'));
 assert.equal(a.encounterUI.choices.children.length,3);assert.equal(warnings,1);clear(a);assert.equal(a.state.paused,false);
}
console.log('PASS v20: 32 real world traversals; pause/resume, shield/contact/melee/projectile paths, keyboard containment, required completion, travel fallback, boss exclusions and art-failure recovery.');
