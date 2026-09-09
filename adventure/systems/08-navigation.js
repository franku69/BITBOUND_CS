function getObjective(fromX=null){
  const lvl=state.level,w=worldData();let route='';let title='';let short='';let action='';let col=4;
  const unsolved=state.solved[lvl].findIndex(v=>!v);
  if(unsolved>=0){col=SHRINE_COLS[unsolved];route=`shrine${unsolved}`;title=`Knowledge Shrine ${unsolved+1}: ${w.shrines[unsolved].title}`;short=`SHRINE ${unsolved+1}`;action='Reach the glowing shrine and press E. Read and solve its lesson puzzle.';}
  else if(!state.assessmentPassed[lvl]){col=TERMINAL_COL;route='terminal';title=`Boss Challenge Terminal ${lvl+1}`;short='BOSS QUIZ';action='Reach the terminal, press E, and solve the Python challenges on your own.';}
  else if(!state.bossDefeated[lvl]){col=202;route='boss';title=w.boss;short='BOSS';action=`Enter the boss arena. Select weapon [1], use ${currentWeapon().name}, and press J to attack. Press Q to cycle collected weapons.`;}
  else{col=PORTAL_COL;route='portal';title=state.level===worlds.length-1?'Final Data Portal':'Data Portal';short='PORTAL';action='Reach the open portal and press E to continue.';}
  const lesson=nextLessonTarget();
  if(lesson&&(lesson.ending?!state.chapterTalks[lvl]:!state.tutorialRead[lesson.id])){col=lesson.col;title='Byte: '+(lesson.ending?storyChapter().artifact:QUESTIONS.get(lesson.id).topic);short='TALK TO BYTE';action='Meet Byte and press E or tap Use for a short lesson before the challenge.';}
  const trail=worldLessonProgress(lvl,unsolved>=0?unsolved+1:4);
  if(trail.remaining&&(!lesson||lesson.ending||state.tutorialRead[lesson.id])){const sentry=trailSentryRect(trail.next.stage-1);col=sentry.col;route=unsolved>=0?`shrine${unsolved}`:'terminal';title=`Trail sentry: ${trail.next.stageTitle}`;short=`STAGE ${trail.next.stage} LESSONS`;action=`Press E / Use at the sentry. ${trail.remaining} required lessons remain before this gate, in sets of up to four.`;}
  const plot=plotObjective();if(plot){({col,route,title,short,action}=plot);}
  const x=col*TILE+TILE/2,y=surfaceAt(col)*TILE-60,baseX=fromX==null?playerCenter().x:fromX,delta=x-baseX,dir=Math.abs(delta)<TILE*1.3?'HERE':delta>0?'RIGHT':'LEFT';
  return {route,title,short,action,col,x,y,delta,dir,distance:Math.max(0,Math.round(Math.abs(delta)/TILE))};
}
function updateMissionGPS(){
  if(!state.started||!UI.missionCompass)return;const o=getObjective();UI.missionCompass.classList.remove('hidden');domWrites.text(UI.objectiveDirection,o.dir==='RIGHT'?'→':o.dir==='LEFT'?'←':'◆');domWrites.text(UI.objectiveTitle,`NEXT: ${o.title}`);domWrites.text(UI.objectiveAction,`${o.action} ${o.dir==='HERE'?'You are at the objective.':`Move ${o.dir.toLowerCase()}.`}`);domWrites.text(UI.objectiveDistance,o.dir==='HERE'?'OBJECTIVE HERE':`${o.distance} tiles • ${o.dir}`);
  const pct=clamp((playerCenter().x/(COLS*TILE))*100,1,99);domWrites.style(UI.routePlayer,'left',`${pct}%`);
  const routeVisual={spawn:3,shrine0:18,shrine1:33,shrine2:48,shrine3:63,terminal:77,boss:88,portal:98};
  for(const n of UI.routeNodes){const key=n.dataset.route;let done=false,current=key===o.route;if(key in routeVisual)domWrites.style(n,'left',`${routeVisual[key]}%`);if(key==='spawn')done=true;else if(key&&key.startsWith('shrine'))done=!!state.solved[state.level][Number(key.slice(-1))];else if(key==='terminal')done=state.assessmentPassed[state.level];else if(key==='boss')done=state.bossDefeated[state.level];else if(key==='portal')done=false;domWrites.toggle(n,'done',done);domWrites.toggle(n,'current',current);}
}
function populateDeathOverlay(){
  restoreCheckpointFromProgress();const fromX=(state.checkpoint.col+.5)*TILE,o=getObjective(fromX);const movement=o.dir==='HERE'?'You are already beside it.':`Move ${o.dir} about ${o.distance} tiles.`;UI.deathCheckpoint.textContent=state.checkpoint.label;UI.deathNextObjective.textContent=o.title;UI.deathInstruction.textContent=`${movement} Follow the GOLD beacon. ${o.route==='boss'?`Boss retry: SHIFT dash, SPACE twice for double-jump, S to fast-fall/drop through platforms, J attacks, Q cycles weapons.`:'Press [E] when you reach the objective.'}`;
}
function dismissRespawnBanner(){
  clearTimeout(state.respawnBannerTimer);UI.respawnBanner.classList.add('hidden');UI.respawnBanner.classList.remove('boss-respawn');
}
function showRespawnBanner(prefix='RESPAWNED'){
  const o=getObjective(),bossFight=(o.route==='boss')||(state.boss&&state.boss.active&&!state.boss.dead);
  UI.respawnBanner.classList.toggle('boss-respawn',!!bossFight);
  UI.respawnBannerTitle.textContent=`${prefix} AT ${state.checkpoint.label.toUpperCase()} • 3s PROTECTION`;
  UI.respawnBannerText.textContent=bossFight?`BOSS FIGHT RESUMED: ${worldData().boss}. Follow the GOLD beacon.`:`NEXT: ${o.title}. ${o.dir==='HERE'?'You are there now.':`Go ${o.dir} about ${o.distance} tiles.`} Follow the GOLD beacon.`;
  UI.respawnBanner.classList.remove('hidden');clearTimeout(state.respawnBannerTimer);
  state.respawnBannerTimer=setTimeout(dismissRespawnBanner,bossFight?1800:2400);
}
function respawnPlayer(){
  restoreCheckpointFromProgress();resetPlayer(true,3);makeSpawnSafe(8);hide(UI.death);sfx.respawn();showRespawnBanner();updateMissionGPS();toast('Spawn protection active. Follow the gold objective beacon.','#9dffb3');
}
function unstuckPlayer(){
  restoreCheckpointFromProgress();resetPlayer(true,3);makeSpawnSafe(8);hide(UI.help);sfx.respawn();showRespawnBanner('RETURNED');updateMissionGPS();toast('Returned to the latest checkpoint. No score penalty.','#9bdcff');
}
