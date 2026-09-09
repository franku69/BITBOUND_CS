/* ------------------------ Enemies / Boss -------------------- */
function rebuildEnemyIndex(){enemyIndex.rebuild(state.enemies);}
function projectileEnemyHit(projectile){
  return enemyIndex.some(projectile.x,projectile.x+projectile.w,enemy=>{
    if(!enemy.alive||enemy.id===projectile.lastHitEnemyId||!rects(projectile,enemy))return false;
    if(runeContact(enemy))return true;
    enemy.hp-=projectile.damage||1;enemy.vx+=Math.sign(projectile.vx)*1.4;
    projectile.lastHitEnemyId=enemy.id;
    burst(enemy.x+enemy.w/2,enemy.y+enemy.h/2,projectile.color||worldData().accent,7);
    state.score+=3;if(enemy.hp<=0)killEnemy(enemy);return true;
  });
}
function updateEnemies(dt){
  const p=playerCenter();
  activeEnemyBuffer.length=0;enemyIndex.forEach(p.x-PERF.simulationRange,p.x+PERF.simulationRange,e=>activeEnemyBuffer.push(e));
  for(const e of activeEnemyBuffer){
    if(state.paused)return;
    if(!e.alive)continue;e.t+=dt;
    moveEncounter(e,dt,p);
    if(rects(player,e)&&!playerInSanctuary()){
      if(runeContact(e))continue;
      if(player.invuln<=0)mobCue(e);
      hurtPlayer(1,5);
    }
  }
  rebuildEnemyIndex();
  for(const q of state.projectiles){
    if(state.paused)return;
    if(!q.alive)continue;q.x+=q.vx*60*dt;q.y+=q.vy*60*dt;q.life-=dt;
    if(q.kind==='dataBlock')q.vy=Math.min(8.2,q.vy+.055*60*dt);
    if(q.life<=0||(!q.noTile&&tileCollisionRect(q.x,q.y,q.w,q.h))){q.alive=false;continue;}
    if(q.friendly){
      let hit=projectileEnemyHit(q);
      if(!hit&&state.boss&&state.boss.active&&!state.boss.dead&&rects(q,state.boss)){const b=state.boss;if(applyBossDamage(b,q.damage||1,Math.sign(q.vx)*.45,q.color||'#ff7b9d')){state.score+=3;q.pierce=0;hit=true;}}
      if(hit){if(q.pierce>0)q.pierce--;else q.alive=false;sfx.impact();}
    }else if(rects(player,q)){q.alive=false;if(!playerInSanctuary())hurtPlayer(1,4);}
  }
  compactInPlace(state.projectiles,q=>q.alive);
}
function shootOrb(x,y,tx,ty,color,speed=2.5,sound=true){const a=Math.atan2(ty-y,tx-x);queueProjectile({x,y,w:9,h:9,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,color,life:4,alive:true});if(sound)sfx.enemyShoot();}
function spawnAmbush(){
  // v3 reliability change: wrong answers create a harmless corruption pulse instead of spawning enemies on top of students.
  burst(player.x+player.w/2,player.y+20,'#ff6b9d',24);state.camera.shake=5;toast('CORRUPTION PULSE — discuss the answer and try again. No progress was lost.','#ff9ab4');
}
function resetBossCombatState(b,clean=false){
  const profile=bossProfile(),keepIndex=clean&&Number.isFinite(b.specialIndex)?b.specialIndex:0;b.action='chase';b.actionTimer=0;b.volley=clean?1.15:.75;b.special=profile.firstSpecial;b.specialIndex=keepIndex;b.specialData=null;b.phase=0;b.jumpClock=.9;b.hitGuard=0;if(!Array.isArray(b.skillThresholds))b.skillThresholds=[false,false,false,false];if(clean)b.shoot=1.5;
}
function spawnBoss(){
  if(state.bossDefeated[state.level]) return;
  if(state.level===7&&!['paladin','demon','fused'].includes(plotState().finalPhase))return;
  const col=202, sy=surfaceAt(col), profile=bossProfile(), max=state.level===7?(plotState().finalPhase==='paladin'?44:plotState().finalPhase==='fused'?70:66):bossMaxHp(state.level);
  state.boss={active:true,dead:false,x:col*TILE,y:sy*TILE-64,w:62,h:64,vx:-1.1,vy:0,hp:max,maxHp:max,t:0,shoot:1.5,phase:0,action:'chase',actionTimer:0,volley:.75,special:profile.firstSpecial,specialIndex:0,specialData:null,jumpClock:.9,hitGuard:0,skillThresholds:[false,false,false,false]};
  state.boss.storyKind=state.level===7?plotState().finalPhase:null;state.boss.name=storyBossName();
  state.bossUnlocked=true; UI.bossName.textContent=state.boss.name; UI.bossBar.classList.remove('hidden'); AudioEngine.playBoss(state.level); sfx.boss(); toast(`${state.boss.name} AWAKENS! ${profile.tip}`,'#ff9fb3');
}
function arenaBounds(){return {left:(TERMINAL_COL+3)*TILE,right:(PORTAL_COL-3)*TILE};}
function arenaGroundAtX(x){return surfaceAt(clamp(Math.floor(x/TILE),0,COLS-1))*TILE;}
function bossPushProjectile(spec){return queueProjectile({alive:true,friendly:false,life:4,...spec});}
function aimedAngle(fromX,fromY,toX,toY){return Math.atan2(toY-fromY,toX-fromX);}
function spawnBossShockwaves(b,phase){
  const ground=arenaGroundAtX(b.x+b.w/2),y=ground-11,speed=phase?5.0:4.4;
  for(const dir of [-1,1])bossPushProjectile({kind:'shockwave',x:b.x+b.w/2-12,y,w:24,h:10,vx:dir*speed,vy:0,color:'#ffb14f',life:3.3});
  sfx.shockwave();state.camera.shake=5;
}
function prepareSpecialData(kind,b,p){
  const bounds=arenaBounds();
  if(kind==='cacheMines'){
    const base=clamp(p.x,bounds.left+46,bounds.right-46);
    b.specialData=[-92,0,92].map((off,i)=>{const x=clamp(base+off,bounds.left+24,bounds.right-24);return {x,y:arenaGroundAtX(x)-14,index:i};});
  }else if(kind==='dataRain'){
    const base=clamp(p.x,bounds.left+70,bounds.right-70), offsets=[-120,-40,40,120];
    b.specialData=offsets.map(off=>{const x=clamp(base+off,bounds.left+20,bounds.right-20);return {x,ground:arenaGroundAtX(x)};});
  }else if(kind==='timeLock'){
    b.specialData={x:clamp(p.x,bounds.left+55,bounds.right-55),y:p.y};
  }else if(kind==='crushingDescent'){
    b.specialData={x:clamp(p.x,bounds.left+42,bounds.right-42)};
  }else if(kind==='afterimageRush'){
    const left=bounds.left+28,right=bounds.right-b.w-28,mid=(left+right)/2;
    b.specialData={positions:[left,right,mid],targetX:p.x,targetY:p.y};
  }else b.specialData=null;
}
function beginBossSpecial(b,p,profile){
  const kind=profile.specials[b.specialIndex%profile.specials.length];b.specialIndex++;b.special=999;prepareSpecialData(kind,b,p);b.vx=0;sfx.bossWarn();
  const actionMap={xorBlink:'telegraph-xor',nandSlam:'telegraph-slam',cacheMines:'telegraph-mines',dataRain:'telegraph-rain',chronoBurst:'telegraph-chrono',bladeStorm:'telegraph-blades',timeLock:'telegraph-lock',crushingDescent:'telegraph-crush',afterimageRush:'telegraph-afterimage'};
  b.action=actionMap[kind]||'recover';
  const timing={chronoBurst:.62,bladeStorm:.56,timeLock:.68,crushingDescent:.62,afterimageRush:.54,nandSlam:.65};
  b.actionTimer=Math.max(.78,timing[kind]??.78);
}
function finishBossSpecial(b,profile,phase){b.action='chase';b.actionTimer=0;b.special=profile.specialCd*(phase?.84:1);b.volley=Math.max(b.volley,.42);b.specialData=null;}
function performXorBlink(b,p,phase){
  const bounds=arenaBounds(),mid=(bounds.left+bounds.right-b.w)/2;
  b.x=b.x<mid?bounds.right-b.w-18:bounds.left+18;b.y=arenaGroundAtX(b.x+b.w/2)-b.h-1;b.vx=0;b.vy=0;
  const cx=b.x+b.w/2,cy=b.y+24,a=aimedAngle(cx,cy,p.x,p.y),spread=phase?.34:.28;
  for(const off of [-spread,-.08,.08,spread])bossPushProjectile({kind:'xorBolt',x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(a+off)*3.45,vy:Math.sin(a+off)*3.45,color:'#65e7ff',life:3.5});
  burst(cx,cy,'#b67cff',22);sfx.enemyShoot();state.camera.shake=3;
}
function startNandSlam(b){b.action='slam-rise';b.actionTimer=.38;b.vy=-12.2;b.vx=0;sfx.bossCharge();}
function spawnCacheMines(b,phase){
  const mines=b.specialData||[];
  for(const m of mines)bossPushProjectile({kind:'cacheMine',x:m.x-12,y:m.y-10,w:24,h:20,vx:0,vy:0,color:'#c77dff',life:phase?2.7:2.3,noTile:true});
  sfx.shockwave();
}
function spawnDataRain(b,phase){
  const marks=b.specialData||[];
  marks.forEach((m,i)=>bossPushProjectile({kind:'dataBlock',x:m.x-10,y:m.ground-(phase?310:275)-i*14,w:20,h:20,vx:0,vy:phase?4.8:4.2,color:'#7dffae',life:3.6}));
  sfx.enemyShoot();
}
function spawnChronoBurst(b,phase){
  const cx=b.x+b.w/2,cy=b.y+24,count=phase?12:10,speed=phase?3.15:2.85,offset=(b.specialIndex%2)*Math.PI/count;
  for(let i=0;i<count;i++){const a=offset+i*Math.PI*2/count;bossPushProjectile({kind:'chronoBolt',x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,color:'#ff8fd8',life:4.3,noTile:true});}
  burst(cx,cy,'#8db8ff',28);sfx.portal();state.camera.shake=4;
}
function spawnBladeStorm(b,p,phase){
  const cx=b.x+b.w/2,cy=b.y+22,a=aimedAngle(cx,cy,p.x,p.y),count=phase?9:7,spread=phase?.72:.58;
  for(let i=0;i<count;i++){
    const off=count===1?0:lerp(-spread,spread,i/(count-1)),ang=a+off;
    bossPushProjectile({kind:'timeBlade',x:cx-4,y:cy-10,w:8,h:20,vx:Math.cos(ang)*(phase?4.7:4.25),vy:Math.sin(ang)*(phase?4.7:4.25),color:'#ffe9a8',life:3.8,noTile:true});
  }
  burst(cx,cy,'#f6cd58',22);sfx.enemyShoot();state.camera.shake=3;
}
function spawnTimeLock(b,phase){
  const d=b.specialData||{x:player.x,y:player.y},cx=d.x+player.w/2,cy=d.y+player.h/2,count=phase?10:8,radius=phase?135:118,speed=phase?3.7:3.25;
  for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count, sx=cx+Math.cos(a)*radius, sy=cy+Math.sin(a)*radius, aim=Math.atan2(cy-sy,cx-sx);
    bossPushProjectile({kind:'lockedBlade',x:sx-5,y:sy-9,w:10,h:18,vx:Math.cos(aim)*speed,vy:Math.sin(aim)*speed,color:'#9dd8ff',life:4,noTile:true});
  }
  burst(cx,cy,'#8db8ff',20);sfx.portal();state.camera.shake=3;
}
function startCrushingDescent(b){
  const d=b.specialData||{x:player.x},bounds=arenaBounds();
  b.x=clamp(d.x-b.w/2,bounds.left,bounds.right-b.w);b.y=arenaGroundAtX(b.x+b.w/2)-230;b.vx=0;b.vy=15.8;b.action='crush-fall';b.actionTimer=1.15;sfx.bossCharge();
}
function finishCrushingDescent(b,phase){
  spawnBossShockwaves(b,phase);
  const cx=b.x+b.w/2,ground=arenaGroundAtX(cx);
  for(const dir of [-1,1])bossPushProjectile({kind:'crushShard',x:cx-6,y:ground-22,w:12,h:12,vx:dir*(phase?4.2:3.7),vy:-2.5,color:'#f6cd58',life:2.6});
  burst(cx,ground-8,'#ffb14f',30);sfx.shockwave();state.camera.shake=7;
}
function performAfterimageRush(b,p,phase){
  const d=b.specialData||{},pos=d.positions||[arenaBounds().left+28,arenaBounds().right-b.w-28],targetX=d.targetX??p.x,targetY=d.targetY??p.y;
  const shots=phase?3:2;
  pos.forEach((px,index)=>{
    const py=arenaGroundAtX(px+b.w/2)-b.h-1,cx=px+b.w/2,cy=py+22,a=aimedAngle(cx,cy,targetX,targetY);
    burst(cx,cy,index%2?'#ff8fd8':'#8db8ff',12);
    for(let j=0;j<shots;j++){const off=(j-(shots-1)/2)*.15;bossPushProjectile({kind:'afterimageBolt',x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(a+off)*(phase?4.3:3.9),vy:Math.sin(a+off)*(phase?4.3:3.9),color:index%2?'#ff8fd8':'#8db8ff',life:3.4,noTile:true});}
  });
  b.x=pos[pos.length-1];b.y=arenaGroundAtX(b.x+b.w/2)-b.h-1;b.vx=0;b.vy=0;sfx.enemyShoot();state.camera.shake=4;
}

function bossFireVolley(b,p,profile,phase){
  const cx=b.x+b.w/2,cy=b.y+20,a=aimedAngle(cx,cy,p.x,p.y);
  if(profile.volley==='xorSplit'){
    for(const off of [-.13,.13])bossPushProjectile({kind:'xorBolt',x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(a+off)*profile.shotSpeed,vy:Math.sin(a+off)*profile.shotSpeed,color:'#65e7ff',life:4});
  }else if(profile.volley==='heavyBlock'){
    bossPushProjectile({kind:'heavyBlock',x:cx-8,y:cy-8,w:16,h:16,vx:Math.cos(a)*profile.shotSpeed,vy:Math.sin(a)*profile.shotSpeed,color:'#ffad55',life:4.4});
  }else if(profile.volley==='cacheTriple'){
    for(const off of [-.18,0,.18])bossPushProjectile({kind:'cacheOrb',x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(a+off)*profile.shotSpeed,vy:Math.sin(a+off)*profile.shotSpeed,color:'#c77dff',life:4.2});
  }else if(profile.volley==='storageFan'){
    for(const off of [-.22,0,.22])bossPushProjectile({kind:'storageShot',x:cx-5,y:cy-4,w:11,h:8,vx:Math.cos(a+off)*profile.shotSpeed,vy:Math.sin(a+off)*profile.shotSpeed,color:'#7dffae',life:3.8});
  }else{
    bossPushProjectile({kind:'chronoBolt',x:cx-5,y:cy-5,w:10,h:10,vx:Math.cos(a)*profile.shotSpeed,vy:Math.sin(a)*profile.shotSpeed,color:'#ff8fd8',life:4,noTile:true});
  }
  sfx.enemyShoot();b.volley=profile.volleyCd*(phase?.86:1);
}
function applyBossMovement(b,p,profile,phase,dt){
  const center=b.x+b.w/2,dx=p.x-center,dist=Math.abs(dx),dir=Math.sign(dx)||1;b.jumpClock-=dt;
  if(profile.movement==='tank'){
    b.vx=lerp(b.vx,dir*profile.move,.014);
  }else if(profile.movement==='kite'){
    const desired=dist<165?-dir:dist>285?dir:Math.sign(Math.sin(b.t*1.7));b.vx=lerp(b.vx,desired*profile.move,.024);
  }else if(profile.movement==='rush'){
    const weave=Math.sin(b.t*2.3)*.22;b.vx=lerp(b.vx,(dir+weave)*profile.move*(phase?1.14:1),.026);
    if(b.jumpClock<=0&&p.y<b.y-45){b.vy=-8.8;b.jumpClock=1.15;}
  }else if(profile.movement==='duelist'){
    const desired=dist<150?-dir:dist>245?dir:Math.sign(Math.sin(b.t*1.9));b.vx=lerp(b.vx,desired*profile.move*(phase?1.10:1),.028);
    if(b.jumpClock<=0&&Math.abs(p.y-b.y)>55){b.vy=-9.4;b.jumpClock=1.05;}
  }else{
    b.vx=lerp(b.vx,dir*profile.move*(phase?1.08:1),.020);
  }
}

function applyBossDamage(b,amount,dir=0,color='#ffffff'){
  if(!b||b.dead||!b.active)return false;
  if(b.storyKind==='fused'&&b.action!=='recover')return false;
  if(b.hitGuard>0)return false;
  if(state.level>=4){
    if(b.hitGuard>0)return false;
    if(String(b.action).startsWith('telegraph')||b.action==='crush-fall'){
      burst(b.x+b.w/2,b.y+b.h/2,'#ff8fd8',7);return false;
    }
    amount=Math.min(amount,2);b.hitGuard=.16;
  }
  amount=Math.min(3,Math.max(0,amount));b.hitGuard=Math.max(b.hitGuard,.18);
  b.hp-=amount;b.vx+=dir*(1+amount*.15);burst(b.x+b.w/2,b.y+b.h/2,color,9);
  if(state.level>=4&&Array.isArray(b.skillThresholds)){
    const thresholds=[.8,.6,.4,.2].map(ratio=>b.maxHp*ratio);
    for(let i=0;i<thresholds.length;i++)if(!b.skillThresholds[i]&&b.hp<=thresholds[i]){b.skillThresholds[i]=true;b.special=Math.min(b.special,.08);break;}
  }
  if(b.storyKind==='demon'&&b.hp<=b.maxHp*.35){beginByteFusion();return true;}
  if(b.hp<=0)defeatBoss();
  return true;
}

function updateBoss(dt){
  const b=state.boss;if(!b||!b.active||b.dead)return;b.t+=dt;const profile=bossProfile(),p=playerCenter(),phase=b.hp<=b.maxHp*.5?1:0;b.phase=phase;b.volley-=dt;b.special-=dt;if(b.actionTimer>0)b.actionTimer-=dt;if(b.hitGuard>0)b.hitGuard-=dt;

  if(b.action==='telegraph-xor'&&b.actionTimer<=0){performXorBlink(b,p,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='telegraph-slam'&&b.actionTimer<=0)startNandSlam(b);
  else if(b.action==='slam-rise'&&b.actionTimer<=0){b.action='slam-fall';b.vy=15.5;}
  else if(b.action==='telegraph-mines'&&b.actionTimer<=0){spawnCacheMines(b,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='telegraph-rain'&&b.actionTimer<=0){spawnDataRain(b,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='telegraph-chrono'&&b.actionTimer<=0){spawnChronoBurst(b,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='telegraph-blades'&&b.actionTimer<=0){spawnBladeStorm(b,p,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='telegraph-lock'&&b.actionTimer<=0){spawnTimeLock(b,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='telegraph-crush'&&b.actionTimer<=0)startCrushingDescent(b);
  else if(b.action==='telegraph-afterimage'&&b.actionTimer<=0){performAfterimageRush(b,p,phase);b.action='recover';b.actionTimer=1.05;}
  else if(b.action==='recover'&&b.actionTimer<=0)finishBossSpecial(b,profile,phase);

  if(b.action==='chase'&&b.special<=0)beginBossSpecial(b,p,profile);
  if(b.action==='chase'&&b.volley<=0)bossFireVolley(b,p,profile,phase);

  if(b.action.startsWith('telegraph'))b.vx=lerp(b.vx,0,.25);
  else if(b.action==='recover')b.vx*=.88;
  else if(b.action!=='slam-rise'&&b.action!=='slam-fall'&&b.action!=='crush-fall')applyBossMovement(b,p,profile,phase,dt);

  b.vy+=GRAVITY*60*dt;const dxMove=b.vx*60*dt;b.x+=dxMove;
  if(tileCollisionRect(b.x,b.y,b.w,b.h,true)){b.x-=dxMove;b.vx*=-.55;}
  const bounds=arenaBounds(),arenaRight=bounds.right-b.w;
  if(b.x<bounds.left||b.x>arenaRight){b.x=clamp(b.x,bounds.left,arenaRight);b.vx*=-.45;}
  const dyMove=b.vy*60*dt;b.y+=dyMove;
  if(tileCollisionRect(b.x,b.y,b.w,b.h,true)){
    b.y-=dyMove;
    if(b.vy>0&&b.action==='slam-fall'){spawnBossShockwaves(b,phase);b.action='recover';b.actionTimer=1.05;}
    else if(b.vy>0&&b.action==='crush-fall'){finishCrushingDescent(b,phase);b.action='recover';b.actionTimer=1.05;}
    b.vy=0;
  }

  if(rects(player,b))hurtPlayer(1,(b.action==='slam-fall'||b.action==='crush-fall')?8:6);
  domWrites.style(UI.bossFill,'width',`${Math.max(0,b.hp/b.maxHp*100)}%`);
}
function defeatBoss(){
  const b=state.boss;if(!b||b.dead)return;if(handlePlotBossDefeat(b))return;const rewardId=bossWeaponId(state.level),rewardName=WEAPONS[rewardId]?.name||'weapon';b.dead=true;b.active=false;state.bossDefeated[state.level]=true;setCheckpoint(205,'Boss Arena');state.score+=120;UI.bossBar.classList.add('hidden');burst(b.x+b.w/2,b.y+b.h/2,'#ffd166',60);const dropped=dropBossWeapon(state.level,b.x+b.w/2,b.y+b.h/2);addPowerXp(4,'BOSS');AudioEngine.playWorld(state.level);sfx.bossDefeat();sfx.checkpoint();sfx.portalOpen();toast(dropped?`BOSS DEFEATED — ${rewardName.toUpperCase()} DROPPED! Portal open.`:'GUARDIAN DEFEATED — Portal open. +4 concept XP.','#7dff9b');markStoryChanged();
  afterPlotBossDefeat();
}
