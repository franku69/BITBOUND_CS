'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {buildContext}=require('./helpers/game-harness.cjs');
const h=buildContext('?quality=standard'),s=h.sandbox,a=s.TestAPI,{state,player,pet,petSupport}=a;
a.startNew();a.enterWorld();state.paused=false;
const book=s.BitboundQuestions.story;
for(const name of ['prisoners','rescue','camp1','camp2','camp3'])for(const p of book.scenes[name].pages){
 assert.ok(!a.STORY_SHOTS[p.art].cast.includes('byte'),name);assert.doesNotMatch(p.text,/BYTE/);assert.ok(a.STORY_BEATS[p.beat],p.beat);
}
for(const name of ['rivals','paladinFall','barrier'])for(const p of book.scenes[name].pages)assert.ok(!a.STORY_SHOTS[p.art].cast.includes('byte'));
assert.ok(a.STORY_SHOTS.fusion.cast.includes('byte'));assert.ok(book.scenes.betrayal.pages.at(-1).speaker==='BYTE');
assert.ok(book.scenes.camp2.pages[0].beat==='gateRecall');assert.ok(book.scenes.paladinFall.pages[1].beat==='shieldMemory');
// Genuine effects, once per cooldown; no changes to equipment or automatic saves.
state.petId='index_fox';a.resetPetSupport();state.loot=[{alive:true,weaponId:'byte_dagger',x:player.x+220,y:player.y,w:24,h:24,source:'TEST'}];
a.updatePetSupport(.21);assert.equal(petSupport.target,state.loot[0]);pet.x=state.loot[0].x;pet.y=state.loot[0].y;
const equip=state.weaponIndex;a.updatePetSupport(.21);assert.equal(state.loot[0].alive,false);assert.ok(state.weapons.includes('byte_dagger'));assert.equal(state.weaponIndex,equip);
state.petId='append_slime';a.resetPetSupport();player.health=2;a.updatePetSupport(3.1);assert.equal(player.health,3);a.updatePetSupport(.21);assert.equal(player.health,3);a.updatePetSupport(16.1);assert.equal(player.health,4);
state.petId='slice_owl';a.resetPetSupport();state.projectiles=[{alive:true,friendly:true,x:player.x,y:player.y},{alive:true,friendly:false,x:player.x+70,y:player.y},{alive:true,friendly:false,x:player.x+80,y:player.y}];
a.updatePetSupport(3.1);assert.equal(state.projectiles[0].alive,true);assert.equal(state.projectiles[1].alive,false);assert.equal(state.projectiles[2].alive,true);a.updatePetSupport(.21);assert.equal(state.projectiles[2].alive,true);a.updatePetSupport(8.1);assert.equal(state.projectiles[2].alive,false);
state.petId='sort_bot';a.resetPetSupport();state.boss={active:true,dead:false,x:player.x+500,y:player.y,hp:50,w:62,h:64};a.updatePetSupport(3.1);assert.equal(petSupport.overclock,3);player.attackCd=0;a.attack();assert.ok(player.attackCd<.34*.9);a.updatePetSupport(3.1);assert.equal(petSupport.overclock,0);assert.ok(petSupport.cooldown>0);
const before={...petSupport};state.paused=true;a.update(30);assert.equal(petSupport.cooldown,before.cooldown);state.paused=false;
// An enemy commits to a target after a visible wind-up; moving away can evade it.
state.level=7;a.generateWorld(7);state.enemies=[];a.addEncounter(23,'bat');let e=state.enemies[0];e.questionMob=false;e.cooldown=0;
let target={x:e.x+80,y:e.y+10};a.moveEncounter(e,1/60,target);assert.equal(e.intent,'windup');const aim={...e.aim};
for(let n=0;n<42;n++)a.moveEncounter(e,1/60,{x:e.x-400,y:e.y-200});assert.equal(e.aim.x,aim.x);assert.ok(['dive','recover'].includes(e.intent));
// Sight rays stop at terrain. No whole-world graph search on each frame.
const col=25,row=8;a.setTile(col,row,2);assert.equal(a.mobCanSee({x:24*32,y:row*32,w:8,h:8},{x:27*32,y:row*32+4}),false);
// Sprite and spell caches are bounded and invalidated with explorer appearance.
const old=a.avatarFrame(state.appearance,0,{motion:'wave'}),same=a.avatarFrame(state.appearance,0,{motion:'wave'});assert.equal(old,same);
assert.notEqual(old,a.avatarFrame(state.appearance,0,{motion:'brace'}));assert.notEqual(old,a.avatarFrame({...state.appearance,hair:'#aabbee'},0,{motion:'wave'}));
for(const w of Object.values(a.WEAPONS))assert.equal(a.weaponSprite(w),a.weaponSprite(w));assert.equal(a.weaponArt.size,20);
for(const id of Object.keys(a.CONCEPT_POWERS))assert.equal(a.skillSprite(id),a.skillSprite(id));assert.equal(a.skillArt.size,21);assert.equal(new Set(Object.values(a.SKILL_SHAPES)).size,21);
assert.equal(s.localStorage.writes.length,0);
console.log('PASS v17: private cast/secrecy, directed memories, four useful pet abilities/cooldowns, pause, aim commitment, terrain sight checks, appearance invalidation and bounded equipment caches.');
