/* ------------------------ Player / Physics ------------------ */
function setCheckpoint(col,label){
  state.checkpoint={col:clamp(Math.floor(col),2,COLS-3),label:label||'Checkpoint'};
}
function restoreCheckpointFromProgress(){
  if(state.level===7&&['paladin','demon','fused'].includes(plotState().finalPhase)){setCheckpoint(TERMINAL_COL+4,'Throne arena');return;}
  if(state.bossDefeated[state.level]){setCheckpoint(205,'Boss Arena');return;}
  if(state.assessmentPassed[state.level]){setCheckpoint(TERMINAL_COL+2,'Boss Challenge Terminal');return;}
  let last=-1;for(let i=0;i<4;i++)if(state.solved[state.level][i])last=i;
  if(last>=0)setCheckpoint(SHRINE_COLS[last]+2,`Knowledge Shrine ${last+1}`);else setCheckpoint(4,'World Start');
}
function resetPlayer(toCheckpoint=false,spawnProtection=0){
  playerAnimator.reset();
  const col=toCheckpoint?(state.checkpoint?.col??4):4;
  const sy=surfaceAt(col);
  player.x=col*TILE; player.y=sy*TILE-player.h-1; player.vx=0; player.vy=0; player.health=MAX_HEALTH; player.invuln=spawnProtection; player.attack=0; player.attackCd=0;player.onGround=false;player.airJumps=MOBILITY.airJumps;player.dashCd=0;player.dashTime=0;player.dashDir=player.dir||1;player.dropTimer=0;
  state.projectiles.length=0;
  state.camera.x=clamp(player.x-W*.42,0,COLS*TILE-W); state.camera.y=clamp(player.y-H*.55,0,ROWS*TILE-H);
  resetPetPosition();
}
function resetPetPosition(){resetPetSupport();pet.x=player.x-player.dir*38;pet.y=player.y+16;pet.phase=0;pet.cheer=0;}
function updatePet(dt){
  updatePetSupport(dt);const targetX=petSupport.target?.x??player.x-player.dir*43,targetY=petSupport.target?.y??player.y+10;
  if(Math.abs(pet.x-targetX)>W*.7||Math.abs(pet.y-targetY)>H*.7){pet.x=targetX;pet.y=targetY;}
  const follow=Math.min(1,dt*(petSupport.target?10:7));pet.x=lerp(pet.x,targetX,follow);pet.y=lerp(pet.y,targetY,follow);pet.phase+=dt;pet.cheer=Math.max(0,(pet.cheer||0)-dt);
}
function drawPet(){
  if(!onScreen(pet.x,pet.y,28,28,40))return;const bob=PERF.richFx&&!mentorMotionQuery.matches?Math.sin(pet.phase*4)*2:0;
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#02060b';ctx.fillRect(Math.floor(pet.x+3),Math.floor(pet.y+27),22,3);ctx.restore();drawPetSprite(ctx,state.petId,Math.floor(pet.x),Math.floor(pet.y+bob),1,petSupport.target?Math.sign(petSupport.target.x-pet.x)||1:player.dir,pet.phase);drawPetSupport();
}
function makeSpawnSafe(radiusTiles=7){
  const px=player.x+player.w/2, radius=radiusTiles*TILE;
  for(const e of state.enemies){
    if(!e.alive)continue;
    const ex=e.x+e.w/2;
    if(Math.abs(ex-px)<radius){
      const dir=ex<px?-1:1; const targetCol=clamp(Math.floor(px/TILE)+dir*(radiusTiles+3),6,TERMINAL_COL-10);
      e.x=targetCol*TILE; e.y=surfaceAt(targetCol)*TILE-e.h-1;e.vy=0;
    }
  }
  if(state.boss&&state.boss.active&&!state.boss.dead){
    const col=202,sy=surfaceAt(col),savedHp=state.boss.hp;state.boss.x=col*TILE;state.boss.y=sy*TILE-state.boss.h-1;state.boss.vx=-1.1;state.boss.vy=0;if(CLASSROOM_RACE.preserveBossHpAfterDeath)state.boss.hp=Math.max(1,savedHp);else state.boss.hp=state.boss.maxHp;resetBossCombatState(state.boss,true);
  }
  rebuildEnemyIndex();
}
function tileCollisionRect(x,y,w,h,ignorePlatforms=false){
  const left=Math.floor(x/TILE), right=Math.floor((x+w-1)/TILE), top=Math.floor(y/TILE), bottom=Math.floor((y+h-1)/TILE);
  for(let r=top;r<=bottom;r++)for(let c=left;c<=right;c++){
    const id=getTile(c,r);if(SOLID.has(id)&&!(ignorePlatforms&&id===Tile.PLATFORM))return true;
  }
  return false;
}
function movePlayerX(dx){
  const step=Math.sign(dx); let remain=Math.abs(dx);
  while(remain>0){
    const d=Math.min(1,remain)*step;
    if(!tileCollisionRect(player.x+d,player.y,player.w,player.h,true)){player.x+=d;}
    else{
      let climbed=false;
      if(player.onGround&&player.dashTime<=0){
        for(let rise=1;rise<=TILE+2;rise++){
          if(!tileCollisionRect(player.x+d,player.y-rise,player.w,player.h,true)){
            player.y-=rise;player.x+=d;player.onGround=false;climbed=true;break;
          }
        }
      }
      if(!climbed){player.vx=0;if(player.dashTime>0)player.dashTime=0;break;}
    }
    remain-=Math.abs(d);
  }
}
function movePlayerY(dy){
  const step=Math.sign(dy); let remain=Math.abs(dy); player.onGround=false;
  const ignorePlatforms=step<0||player.dropTimer>0;
  while(remain>0){const d=Math.min(1,remain)*step;if(!tileCollisionRect(player.x,player.y+d,player.w,player.h,ignorePlatforms))player.y+=d;else{if(step>0)player.onGround=true;player.vy=0;break;}remain-=Math.abs(d);}
  if(tileCollisionRect(player.x,player.y+1,player.w,player.h,player.dropTimer>0))player.onGround=true;
}
function standingOnPlatform(){
  const row=Math.floor((player.y+player.h+1)/TILE),left=Math.floor((player.x+2)/TILE),right=Math.floor((player.x+player.w-3)/TILE);
  for(let c=left;c<=right;c++)if(getTile(c,row)===Tile.PLATFORM)return true;return false;
}
function jump(){
  if(state.paused||!state.started)return;
  if(player.onGround){player.vy=MOBILITY.groundJump;player.onGround=false;player.airJumps=MOBILITY.airJumps;sfx.jump();return;}
  if(player.airJumps>0){player.airJumps--;player.vy=MOBILITY.airJump;sfx.doubleJump();burst(player.x+player.w/2,player.y+player.h,'#9bdcff',10);}
}
function dash(){
  if(state.paused||!state.started||player.dashCd>0)return;
  const held=(state.keys['a']||state.keys['arrowleft']?-1:0)+(state.keys['d']||state.keys['arrowright']?1:0);
  player.dashDir=held||player.dir||1;player.dir=player.dashDir;player.dashTime=MOBILITY.dashDuration;player.dashCd=MOBILITY.dashCooldown*(currentPet().dashScale||1);player.invuln=Math.max(player.invuln,MOBILITY.dashInvuln);player.vx=player.dashDir*MOBILITY.dashSpeed;player.vy*=.25;sfx.dash();burst(player.x+player.w/2,player.y+player.h/2,'#70e5ff',12);
}
function dropOrFastFall(){
  if(state.paused||!state.started)return;
  if(player.onGround&&standingOnPlatform()){player.dropTimer=MOBILITY.dropThroughTime;player.onGround=false;player.y+=3;player.vy=3;sfx.drop();return;}
  if(!player.onGround){player.vy=Math.max(player.vy,6);sfx.drop();}
}
function attack(){
  if(state.paused||!state.started||player.attackCd>0) return;
  if(state.boss&&state.boss.active&&!state.boss.dead)dismissRespawnBanner();
  state.selected=0;updateHotbar();const w=currentWeapon();player.attack=.22;player.attackCd=w.cooldown*(currentPet().attackScale||1)*(petSupport.overclock>0?.7:1);
  if(w.type==='ranged'){firePlayerProjectile(w);return;}
  if(w.sound)playActionCue(w.sound);else sfx.swing();
  const reach=w.reach||48,box={x:player.dir>0?player.x+player.w:player.x-reach,y:player.y+2,w:reach,h:40};let hits=0;
  enemyIndex.forEach(box.x,box.x+box.w,e=>{if(!state.paused&&e.alive&&rects(box,e)){if(runeContact(e))return;e.hp-=w.damage;e.vx+=player.dir*(2.2+w.damage*.35);hits++;burst(e.x+e.w/2,e.y+e.h/2,w.color,7);if(e.hp<=0)killEnemy(e);}});
  if(state.boss&&state.boss.active&&!state.boss.dead&&rects(box,state.boss)){if(applyBossDamage(state.boss,w.damage,player.dir,w.color)){hits++;}}
  if(hits){state.score+=hits*3;sfx.impact();}
}
function hurtPlayer(dmg=1,knock=0){
  if(player.invuln>0||state.paused) return;
  player.health-=dmg; player.invuln=1.0; player.vx=-player.dir*(knock||4.5); player.vy=-6; state.camera.shake=8; sfx.hurt(); burst(player.x+player.w/2,player.y+20,'#ff6b6b',10);
  if(player.health<=0){
    player.health=0;state.deaths++;state.score=Math.max(0,state.score-30);populateDeathOverlay();markStoryChanged();show(UI.death);
  }
}
function killEnemy(e){
  if(!e.alive)return;
  if(runeContact(e)){e.hp=e.maxHp;return;}
  e.alive=false;state.score+=12;state.totalMobKills++;maybeDropMobWeapon(e);
  const healEvery=currentPet().healEvery||4;
  if(state.totalMobKills%healEvery===0&&player.health<MAX_HEALTH){
    player.health++;pet.cheer=1;playActionCue('petHeal');
  }
  addPowerXp(1,'MOB');markStoryChanged();
  burst(e.x+e.w/2,e.y+e.h/2,worldData().accent2,14);mobCue(e,'defeat');
}

/* ------------------------ Mining / Torches ------------------ */
function mouseWorld(){return {x:state.mouse.x+state.camera.x,y:state.mouse.y+state.camera.y};}
function withinReach(wx,wy,range=150){const p=playerCenter(); return Math.hypot(wx-p.x,wy-p.y)<=range;}
function handleWorldClick(button){
  if(state.paused||!state.started)return;
  ensureAudio();
  if(state.selected===1&&button===0){castConceptPower();return;}
  if(state.selected===0&&button===0){attack();return;}
  if(state.selected!==2||button!==0)return;
  const m=mouseWorld(),c=Math.floor(m.x/TILE),r=Math.floor(m.y/TILE),cx=c*TILE+TILE/2,cy=r*TILE+TILE/2;
  if(!withinReach(cx,cy)){toast('Too far away. Move closer.','#ffcf84');return;}
  if(state.torches<=0){toast('No torches left. Open chests for more.','#ffcf84');return;}
  if(getTile(c,r)===Tile.AIR){state.torchesPlaced.push({x:cx,y:cy});state.torches--;sfx.place();updateHotbar();}
}
