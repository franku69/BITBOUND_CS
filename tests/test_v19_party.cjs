'use strict';
const assert=require('node:assert/strict');
const {buildContext}=require('./helpers/game-harness.cjs');
function setup(){const h=buildContext('?quality=standard'),a=h.sandbox.TestAPI;a.startNew();a.enterWorld();a.state.world.surface.fill(20);for(let c=0;c<a.state.world.surface.length;c++)for(let r=0;r<20;r++)a.setTile(c,r,0);a.player.x=2400;a.player.y=596;a.player.health=5;a.player.invuln=999;a.plotState().partyFreed=true;a.resetParty();return {h,a};}
for(const i of [0,1,2,3]){
 const {a}=setup(),actor=a.partyActors[i],role=a.PARTY_ROLES[i];
 for(const other of a.partyActors)other.cooldown=999;
 Object.assign(actor,{x:2500,y:592,onGround:true,cooldown:0});
 const target={id:8,x:2545,y:592,w:28,h:40,hp:100,maxHp:100,alive:true,type:'slime',vx:0,vy:0,t:0};a.state.enemies=[target];a.rebuildEnemyIndex();
 a.updateParty(1/60);assert.ok(actor.attack,`role ${i} enters windup`);assert.equal(target.hp,100);assert.equal(a.state.projectiles.length,0);
 while(actor.phase+1/60/role.duration<role.release)a.updateParty(1/60);
 assert.equal(target.hp,100,'no early melee damage');assert.equal(a.state.projectiles.length,0,'no early spell');
 a.updateParty(1/60);
 if(i===0||i===2){assert.equal(target.hp,100-role.damage);assert.equal(a.state.projectiles.length,0,'melee uses a real contact area');}
 else{
  assert.equal(a.state.projectiles.length,1);const shot=a.state.projectiles[0];assert.equal(shot.ally,i);assert.equal(shot.kind,'allySpell');
  assert.ok(Math.abs(shot.x-actor.x)<70&&Math.abs(shot.y-actor.y)<70,'spell releases from the animated actor');
  for(let n=0;n<40&&target.hp===100;n++)a.updateEnemies(1/60);
  assert.ok(target.hp<100,'projectile really damages a mob');
 }
 const damaged=target.hp;
 for(let n=0;n<15;n++)a.updateParty(1/60);
 assert.equal(target.hp,damaged,'one melee release per action');
}
// Healer support is an animated action with delayed effect and a cooldown.
{
 const {a}=setup();a.state.enemies=[];a.player.health=2;const fern=a.partyActors[3];Object.assign(fern,{x:a.player.x-30,y:592,cooldown:0,heal:0});
 a.updateParty(1/60);assert.equal(a.player.health,2);assert.ok(fern.attack?.heal);
 for(let n=0;n<35;n++)a.updateParty(1/60);assert.equal(a.player.health,3);
 for(let n=0;n<100;n++)a.updateParty(1/60);assert.equal(a.player.health,3,'healing cannot fire every frame');
}
// All four allies contribute in a real boss encounter, never after betrayal.
{
 const {a}=setup();a.state.enemies=[];a.state.level=1;a.player.x=202*32;a.player.y=596;a.spawnBoss();a.state.boss.hp=a.state.boss.maxHp=500;a.state.boss.hitGuard=0;a.resetParty();
 for(const ally of a.partyActors){ally.x=a.state.boss.x-45;ally.y=592;ally.cooldown=.1+ally.index*.3;}
 const hp=a.state.boss.hp;
 for(let n=0;n<480;n++){a.updateParty(1/60);a.updateEnemies(1/60);a.state.boss.hitGuard=Math.max(0,a.state.boss.hitGuard-1/60);}
 assert.ok(a.state.boss.hp<hp-10,'team provides meaningful boss support');
 a.plotState().betrayed=true;const before=a.state.projectiles.length,bossHp=a.state.boss.hp;
 for(let n=0;n<300;n++)a.updateParty(1/60);
 assert.equal(a.state.projectiles.length,before);assert.equal(a.state.boss.hp,bossHp);assert.ok(a.partyActors.every(ally=>!ally.attack));
}
// Equipment and hands recover to the exact idle grip at both attack endpoints.
{
 const {a}=setup(),idle=a.sampleRig('idle',0);
 for(const endpoint of [0,1]){const pose=a.sampleRig('attack',endpoint);assert.ok(Math.abs(pose.weapon-idle.weapon)<1e-9);assert.ok(Math.hypot(pose.hands[1].x-idle.hands[1].x,pose.hands[1].y-idle.hands[1].y)<.001);}
 let previous=a.sampleRig('attack',0);
 for(let n=1;n<=1000;n++){const pose=a.sampleRig('attack',n/1000);assert.ok(Math.abs(pose.weapon-previous.weapon)<.03);assert.ok(Math.hypot(pose.hands[1].x-previous.hands[1].x,pose.hands[1].y-previous.hands[1].y)<1);previous=pose;}
}
console.log('PASS v19: four combat roles, windup/release timing, real melee and projectile damage, healing cooldown, boss support, betrayal cutoff and continuous grips.');
// The finale has one ordered fight, not looping damage or resurrecting actors.
{
 const {h,a}=setup(),page=h.sandbox.BitboundQuestions.story.scenes.rivals.pages[9];
 for(const t of [0,.22,.37,.479]){const f=a.buildStoryFrame('greed',t,page);assert.equal(f.actors.get('rook').rotation,undefined);assert.equal(f.actors.get('mira').rotation,undefined);assert.ok(!f.actors.has('byte'));}
 const hit=a.buildStoryFrame('greed',.55,page);assert.equal(hit.actors.get('rook').motion,'hurt');assert.equal(hit.actors.get('mira').motion,'hurt');assert.equal(hit.actors.get('fern').motion,'cast');
 const fallen=a.buildStoryFrame('greed',1,page);assert.equal(fallen.actors.get('aster').motion,'guard');assert.equal(fallen.duel.empower,1);
 assert.equal(fallen.props.filter(p=>p.id==='fallenGear').length,3,'three fallen weapons remain visible');
 for(const id of ['mira','rook','fern']){assert.equal(fallen.actors.get(id).rotation,-Math.PI/2);assert.equal(fallen.actors.get(id).armed,false);}
 const next=a.buildStoryFrame('fallen',0,h.sandbox.BitboundQuestions.story.scenes.rivals.pages[10]);
 for(const id of ['mira','rook','fern'])assert.equal(next.actors.get(id).x,fallen.actors.get(id).x,'corpses remain in place across pages');
 const gift=h.sandbox.BitboundQuestions.story.scenes.rescue.pages[2],before=a.buildStoryFrame(gift.art,.61999,gift),after=a.buildStoryFrame(gift.art,.62001,gift);
 const p1=a.rigSocket(before.actors.get(before.props[0].holder)),p2=a.rigSocket(after.actors.get(after.props[0].holder));
 assert.ok(Math.hypot(p1.x-p2.x,p1.y-p2.y)<6,'gift transfers between touching hands');
}
console.log('PASS v19 finale: ordered impacts/deaths, Aster survives and absorbs power, dropped equipment persists, BYTE secrecy, and hand-to-hand prop transfer.');
