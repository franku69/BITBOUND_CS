/* Bounded encounter director. Uses the existing simulation clock, never timers. */
const {MOBS,MAX_ENEMIES,RESPAWN_SECONDS}=window.BitboundEncounters;
let nextEnemyId=0,encounterClock=RESPAWN_SECONDS;
function safeEncounterColumn(col){
  if(col<13||col>TERMINAL_COL-11||SHRINE_COLS.some(shrine=>Math.abs(col-shrine)<7))return false;
  const mentor=state.world?.mentor;
  return !mentor||Math.abs(col-mentor.col)>=5;
}
function addEncounter(col,type=window.BitboundEncounters.choose(state.level)){
  if(state.enemies.length>=MAX_ENEMIES||!safeEncounterColumn(col)||!Object.hasOwn(MOBS,type))return false;
  if(state.enemies.some(e=>e.alive&&Math.abs(e.x-col*TILE)<TILE*3))return false;
  const spec=MOBS[type],flying=window.BitboundEncounters.isFlying(spec),ground=surfaceAt(col)*TILE;
  const y=ground-spec.h-(flying?70:1),direction=Math.random()<.5?-1:1;
  if(tileCollisionRect(col*TILE,y,spec.w,spec.h))return false;
  state.enemies.push({id:nextEnemyId++,type,x:col*TILE,y,w:spec.w,h:spec.h,
    vx:direction*spec.speed,vy:0,hp:spec.hp,maxHp:spec.hp,alive:true,baseY:y,
    questionMob:!state.enemies.some(e=>e.alive&&e.questionMob&&Math.floor(e.x/TILE/40)===Math.floor(col/40)),quizWarning:0,t:Math.random()*6,shoot:2+Math.random()*2,hop:1+Math.random(),soundAt:0});
  return true;
}
function spawnEnemies(){
  resetQuestionEncounters();state.enemies=[];nextEnemyId=0;encounterClock=RESPAWN_SECONDS;
  for(let i=0;i<MAX_ENEMIES;i++)addEncounter(14+i*9+Math.floor(Math.random()*4));
  rebuildEnemyIndex();
}
function updateEncounters(dt){
  if(!state.started||state.paused||bossFightActive())return;
  encounterClock-=dt;if(encounterClock>0)return;
  encounterClock=RESPAWN_SECONDS;
  compactInPlace(state.enemies,e=>e.alive&&e.y<ROWS*TILE+80);
  if(state.enemies.length>=MAX_ENEMIES)return;
  // One off-screen visitor at most per interval; never beside a student or lesson.
  const edge=Math.random()<.5?state.camera.x-TILE*5:state.camera.x+W+TILE*5;
  const col=Math.floor(edge/TILE);
  if(Math.abs(col*TILE-player.x)>TILE*12&&addEncounter(col))rebuildEnemyIndex();
}
function mobCue(enemy,event='attack'){
  if(!AudioEngine.sfxEnabled||document.hidden||Math.abs(enemy.x-player.x)>W*.75)return;
  if(event!=='defeat'&&state.gameTime<(enemy.soundAt||0))return;
  enemy.soundAt=state.gameTime+1.5;
  const voice=MOBS[enemy.type]?.voice||'bubble';
  playCreatureCue(voice,event);
}
// Small state machines, not path searches: local tile probes and one sight ray
// at attack time. Eighteen enemies at most, simulated only near the player.
function mobCanSee(e,p){
  const x=e.x+e.w/2,y=e.y+e.h/2,dx=p.x-x,dy=p.y-y,steps=Math.min(24,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/TILE));
  for(let i=1;i<steps;i++)if(SOLID.has(getTile(Math.floor((x+dx*i/steps)/TILE),Math.floor((y+dy*i/steps)/TILE))))return false;
  return true;
}
function mobIntent(e,intent,time){e.intent=intent;e.intentTime=time;}
function aimMob(e,p,seconds){e.aim={x:p.x,y:p.y};e.facing=Math.sign(p.x-e.x)||1;mobIntent(e,'windup',seconds);}
function walkMob(e,dt){
  const dx=e.vx*60*dt;
  e.x+=dx;if(tileCollisionRect(e.x,e.y,e.w,e.h)){e.x-=dx;e.vx*=-1;}
  e.vy=Math.min(12,e.vy+GRAVITY*60*dt);const dy=e.vy*60*dt;e.y+=dy;
  if(tileCollisionRect(e.x,e.y,e.w,e.h)){e.y-=dy;e.grounded=e.vy>0;e.vy=0;}else e.grounded=false;
}
function moveEncounter(e,dt,p){
  if(e.quizWarning>0){e.vx=0;return;}
  const spec=MOBS[e.type]||MOBS.slime,dx=p.x-e.x,dy=p.y-e.y,near=Math.abs(dx)<380&&Math.abs(dy)<190,fly=window.BitboundEncounters.isFlying(spec);
  if(runeProtects(e)){
    // Sealed creatures approach for a knowledge battle, never fire damaging shots.
    e.intent='patrol';e.vx=near?Math.sign(dx)*Math.min(1.5,spec.speed):e.vx;
    if(fly){const nx=e.x+e.vx*60*dt,ny=near?lerp(e.y,p.y-e.h/2,Math.min(1,dt*2)):e.baseY+Math.sin(e.t*2)*12;if(!tileCollisionRect(nx,ny,e.w,e.h)){e.x=nx;e.y=ny;}}
    else{if(e.grounded&&near&&tileCollisionRect(e.x+(e.vx>0?e.w+3:-6),e.y,4,e.h-2))e.vy=-6;walkMob(e,dt);}
    return;
  }
  e.intent=e.intent||(e.type==='mimic'?'sleep':'patrol');e.intentTime=Math.max(0,(e.intentTime||0)-dt);e.cooldown=Math.max(0,(e.cooldown??.7)-dt);
  if(e.intent==='sleep'){
    e.vx=0;if(near&&Math.abs(dx)<160){aimMob(e,p,.65);mobCue(e);}
  }else if(e.intent==='windup'){
    e.vx*=.75;
    if(e.intentTime<=0){
      const aim=e.aim||p;
      if(e.type==='bat'){const a=Math.atan2(aim.y-e.y,aim.x-e.x);e.vx=Math.cos(a)*4.4;e.vy=Math.sin(a)*4.4;mobIntent(e,'dive',.42);}
      else if(e.type==='bug'||e.type==='moth'||e.type==='wisp'){
        if(mobCanSee(e,aim)){
          shootOrb(e.x+e.w/2,e.y+e.h/2,aim.x,aim.y,spec.color,e.type==='bug'?2.8:2.2,false);
          if(e.type==='moth')shootOrb(e.x+e.w/2,e.y+e.h/2,aim.x,aim.y+42,spec.color,2,false);
        }
        if(e.type==='wisp'&&e.warp&&!tileCollisionRect(e.warp.x,e.warp.y,e.w,e.h)){e.x=e.warp.x;e.y=e.warp.y;e.baseY=e.y;}
        mobIntent(e,'recover',.85);e.cooldown=e.type==='wisp'?4:2.4;
      }else if(e.type==='crab'||e.type==='crawler'){
        e.vx=e.facing*(e.type==='crab'?2.1:3.6);mobIntent(e,'rush',e.type==='crab'?.28:.45);
      }else{e.vy=-(spec.jump||6);e.vx=e.facing*(e.type==='frog'?2.7:e.type==='mimic'?2.2:1.4);e.grounded=false;mobIntent(e,'leap',.65);}
      mobCue(e);
    }
  }else if(e.intent==='dive'){
    const nx=e.x+e.vx*60*dt,ny=e.y+e.vy*60*dt;
    if(e.intentTime<=0||tileCollisionRect(nx,ny,e.w,e.h)){e.vx=0;e.vy=0;e.baseY=e.y;mobIntent(e,'recover',1.2);e.cooldown=2.4;}
    else{e.x=nx;e.y=ny;}
  }else if(e.intent==='leap'||e.intent==='rush'){
    if(e.intentTime<=0){mobIntent(e,'recover',e.type==='frog'?.65:.9);e.vx=0;e.cooldown=.7;}
  }else if(e.intent==='recover'){
    e.vx*=.85;if(e.intentTime<=0)mobIntent(e,'patrol',0);
  }else{
    if(fly){
      const desired=near?(Math.abs(dx)<170?-Math.sign(dx):Math.sign(dx))*spec.speed:Math.sin(e.t)*.5;
      e.vx=lerp(e.vx,desired,Math.min(1,dt*3));
    }else if(e.grounded){
      let dir=near?Math.sign(dx):Math.sign(e.vx)||1;
      const ahead=e.x+(dir>0?e.w+10:-10),groundAhead=SOLID.has(getTile(Math.floor(ahead/TILE),Math.floor((e.y+e.h+14)/TILE)));
      if(!groundAhead||tileCollisionRect(ahead,e.y,4,e.h-2))dir*=-1;
      e.vx=dir*spec.speed*(e.type==='crab'?.65:1);
    }
    const reach=e.type==='crab'?125:e.type==='crawler'?210:330;
    if(near&&Math.abs(dx)<reach&&!e.cooldown&&(fly||e.grounded)&&mobCanSee(e,p)){
      aimMob(e,p,e.type==='frog'?.5:e.type==='slime'?.38:.65);
      if(e.type==='wisp'){
        const x=clamp(p.x+(dx>0?-1:1)*170,TILE,COLS*TILE-64),y=Math.max(30,p.y-60);
        e.warp={x,y};
      }
    }
  }
  if(fly&&e.intent!=='dive'){
    const nx=e.x+e.vx*60*dt,ny=e.baseY+Math.sin(e.t*2.3)*17;
    if(!tileCollisionRect(nx,ny,e.w,e.h)){e.x=nx;e.y=ny;}else e.vx*=-1;
  }else if(!fly)walkMob(e,dt);
  e.x=clamp(e.x,TILE,COLS*TILE-e.w-TILE);
}
