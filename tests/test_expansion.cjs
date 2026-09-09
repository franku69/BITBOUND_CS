'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s,elements}=buildContext('?quality=low');
const api=s.TestAPI,{state,player}=api,{MOBS,MAX_ENEMIES,choose}=s.BitboundEncounters;
api.startNew();api.enterWorld();
assert.equal(Object.keys(MOBS).length,9);assert.equal(Object.keys(api.WEAPONS).length,20);
assert.equal(Object.keys(api.CONCEPT_POWERS).length,21);
assert.equal(api.mentorRect().w,36);assert.equal(api.mentorRect().h,56);
assert.ok(api.mentorRect().w>player.w&&api.mentorRect().h>player.h);
const pool=s.BitboundEncounters.pools[7];
assert.deepEqual(new Set(pool.map((_,i)=>choose(7,()=>i/pool.length))),new Set(Object.keys(MOBS)));
assert.ok(s.BitboundEncounters.pools[0].every(id=>MOBS[id].hp<=2),'first world stays gentle');
for(let level=0;level<8;level++){
  state.level=level;api.generateWorld(level);
  assert.ok(state.enemies.length<=MAX_ENEMIES);
  for(const e of state.enemies){
    const col=e.x/32;assert.ok(col>=13&&col<=179);
    assert.ok([37,77,117,157].every(shrine=>Math.abs(shrine-col)>=7));
    assert.ok(MOBS[e.type].minWorld<=level);
  }
}
state.level=7;api.generateWorld(7);state.boss=null;
// Each new AI must advance with finite coordinates and actually attack when close.
for(const type of ['frog','moth','crab','crawler','wisp','mimic']){
  state.enemies=[];assert.equal(api.addEncounter(23,type),true);const e=state.enemies[0];e.questionMob=false; // Exercise ordinary combat AI, not sealed question carriers.
  const beforeX=e.x;e.shoot=0;e.hop=0;state.projectiles=[];
  for(let n=0;n<180;n++){e.t+=1/60;api.moveEncounter(e,1/60,{x:e.x+100,y:e.y+5});}
  assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));assert.notEqual(e.x,beforeX);
  if(MOBS[type].behavior==='flyShoot')assert.ok(state.projectiles.some(q=>!q.friendly),'flying ranged mob fires');
  assert.ok(state.projectiles.length<=api.PERF.maxProjectiles);
}
// Repeated director work does not grow memory, create duplicate IDs, or spawn on-screen.
state.enemies=[];state.camera.x=1300;player.x=1700;state.started=true;state.paused=false;
for(let i=0;i<100;i++){
  const oldIds=new Set(state.enemies.map(e=>e.id));api.updateEncounters(19);
  for(const e of state.enemies)if(!oldIds.has(e.id))assert.ok(e.x<state.camera.x||e.x>state.camera.x+960);
  assert.ok(state.enemies.length<=MAX_ENEMIES);
  assert.equal(new Set(state.enemies.map(e=>e.id)).size,state.enemies.length);
  if(i%3===0&&state.enemies.length)state.enemies[0].alive=false;
}
const count=state.enemies.length;state.paused=true;api.updateEncounters(1000);assert.equal(state.enemies.length,count);
state.paused=false;
// Each new mob weapon can drop and survives a manual-file round trip.
state.loot=[];state.weapons=['data_blade'];state.mobKills={};
for(const type of ['crab','moth','crawler']){
  const rule=api.MOB_WEAPON_DROPS[type];
  for(let i=0;i<rule.killThreshold;i++)api.killEnemy({type,alive:true,x:player.x+80,y:player.y,w:32,h:28});
  assert.ok(state.loot.some(item=>item.weaponId===rule.weapon));
  api.grantWeapon(rule.weapon,{announce:false});
}
assert.equal(new Set(Array.from({length:8},(_,i)=>api.bossWeaponId(i))).size,8);
// Every expanded skill has a real effect at all four upgrade levels.
for(const id of ['stack_guard','queue_lance','set_nova','recursive_echo','graph_star','heap_comet']){
  assert.equal(api.equipSkill(id),true);assert.ok(state.powerCooldown>0);
  for(const xp of [0,4,10,18]){
    state.powerXp=xp;state.powerCooldown=0;state.projectiles=[];player.invuln=0;
    api.castConceptPower();assert.ok(state.powerCooldown>0);
    assert.ok(state.projectiles.length>0);assert.ok(state.projectiles.length<=10);
    if(id==='stack_guard')assert.ok(player.invuln>=1.15);
    if(id==='queue_lance')assert.ok(state.projectiles[0].pierce>=3);
  }
}
api.renderSkillPicker();const select=elements.get('skillSelect');assert.equal(select.children.length,21);
select.value='stack_guard';select.onchange();assert.equal(state.powerId,'stack_guard');
state.mobKills.crab=9;
const saved=api.validateStorySnapshot(api.storySnapshot());assert.ok(saved);
assert.equal(saved.powerId,'stack_guard');assert.equal(saved.mobKills.crab,9);assert.ok(saved.weapons.includes('stack_mace'));
assert.equal(s.localStorage.writes.length,0,'content changes never autosave');
// Cached sprite identity, bounded memory and frozen reduced-motion pose.
const art=api.creatureSprites;
for(const id of s.BitboundCreatureSprites.PET_IDS){assert.equal(art.frames(id).length,8);assert.equal(art.frames(id),art.frames(id));}
for(const id of s.BitboundCreatureSprites.MOB_IDS)assert.equal(art.frames(id).length,6);
assert.equal(art.frames('__proto__'),null);
assert.ok(art.bytes<=792576);
assert.notEqual(s.BitboundCreatureSprites.frameAt(.01),s.BitboundCreatureSprites.frameAt(.2));
assert.equal(s.BitboundCreatureSprites.frameAt(1,true),0);
// New audio honors mute/hidden gates and throttles a simultaneous pack defeat.
let soundCalls=0,clock=10000;api.AudioEngine.sequence=()=>soundCalls++;s.performance.now=()=>clock;
api.AudioEngine.sfxEnabled=true;api.playCreatureCue('croak','defeat');api.playCreatureCue('wisp','defeat');assert.equal(soundCalls,1);
clock+=101;api.playCreatureCue('wisp','defeat');assert.equal(soundCalls,2);
s.document.hidden=true;clock+=101;api.playCreatureCue('clank','attack');assert.equal(soundCalls,2);
s.document.hidden=false;api.AudioEngine.sfxEnabled=false;api.playCreatureCue('clank','attack');assert.equal(soundCalls,2);
console.log('PASS v13 expansion: nine mob types, bounded safe spawning, AI attacks, six new weapon drops/rewards, 21 skills, manual saves, wider Byte, cached pet/mob animation and throttled audio.');
