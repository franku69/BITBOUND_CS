/* ------------------------ Level Flow ------------------------ */
function resetCampaignState(team,members){
  for(const particle of state.particles)particlePool.release(particle);
  Object.assign(state,{
    started:true,finished:false,raceStarted:false,team,members,level:0,score:500,wrong:0,
    academicPoints:0,deaths:0,elapsedBase:0,startPerf:0,
    blocks:12,torches:6,answerStreak:0,bestStreak:0,powerXp:0,powerCooldown:0,powerBuff:0,
    weaponIndex:0,powerId:randomConceptPowerId(),appearance:cloneAppearance(state.appearance),petId:PETS[state.petId]?state.petId:DEFAULT_PET_ID,totalMobKills:0
  });
  resetQuestionEncounters(true);state.plot=newPlot();resetParty();state.tutorialRead={};state.chapterTalks=worlds.map(()=>false);state.terminalSolved=worlds.map(()=>[false,false]);state.solved=worlds.map(()=>[false,false,false,false]);state.assessmentPassed=worlds.map(()=>false);state.bossDefeated=worlds.map(()=>false);
  state.weapons=['data_blade'];state.mobKills={slime:0,bat:0,bug:0};state.particles.length=0;state.projectiles.length=0;
  markStoryChanged();frameGovernor.reset();setCheckpoint(4,'World Start');updateAcademicHud();updateCampaignHud();
}
function startNew(){
  const team=String($('explorerName').value||'Explorer').trim().slice(0,28)||'Explorer';const members=[team];
  ensureAudio();resetCampaignState(team,members);
  generateWorld(0);resetPlayer(false,2);hide(UI.start);UI.hud.classList.remove('hidden');UI.hotbar.classList.remove('hidden');UI.petHud.classList.remove('hidden');UI.missionCompass.classList.remove('hidden');UI.campaignHud.classList.remove('hidden');showPlotScene('origin');scheduleFrame();
}
function showWorldIntro(){
  if(state.boss&&state.boss.active&&!state.boss.dead)AudioEngine.playBoss(state.level);else AudioEngine.playWorld(state.level);
  const w=worldData();UI.introNumber.textContent=`WORLD ${state.level+1} / ${worlds.length}`;UI.introTitle.textContent=w.name;UI.introTitle.style.color=w.accent;UI.introSubtitle.textContent=storyChapter().title;
  $('introStory').textContent=byteSays(storyChapter().intro);UI.introPilot.textContent=currentRunner();UI.introMission.textContent=storyChapter().goal+` Complete all ${ENCOUNTER_WORLDS[state.level].length} trail lessons in four stages. Rune mobs carry up to four questions; the sentry before each shrine covers any you missed.`;show(UI.intro);
}
function enterWorld(){
  if(CLASSROOM_RACE.timerStartsOnFirstWorldEntry&&state.level===0&&!state.raceStarted){state.raceStarted=true;state.startPerf=performance.now();sfx.checkpoint();toast(`CONCEPT POWER: ${currentPower().name.toUpperCase()} — ${currentPower().concept}. PRESS 2/K TO USE.` ,currentPower().color);markStoryChanged();}
  hide(UI.intro);if(resumePlot())return;const camp=state.level-1;if(camp>=0&&camp<3&&plotState().partyFreed&&!plotState().camps[camp]){showPlotScene('camp'+(camp+1));return;}updateMissionGPS();const o=getObjective();UI.respawnBannerTitle.textContent=`WORLD ${state.level+1}: ${currentRunner().toUpperCase()} IS READY`;UI.respawnBannerText.textContent=`FIRST TARGET: ${o.title}. Follow the GOLD beacon and Mission GPS. Drag the joystick or use A/D to move. Jump / SPACE jumps; Use / E talks to Byte or activates a shrine.`;UI.respawnBanner.classList.remove('hidden');clearTimeout(state.respawnBannerTimer);state.respawnBannerTimer=setTimeout(()=>UI.respawnBanner.classList.add('hidden'),2200);
}
function nextWorld(){
  if(!requireWorldLessons(4))return;
  if(!tryPlotExit())return;
  if(state.bossDefeated[state.level])grantBossRewardIfMissing(state.level,false);sfx.portal();sfx.worldAdvance();if(state.level>=worlds.length-1){if(!plotState().immortal)showPlotScene('ending');else finishGame();return;}
  state.level++;setCheckpoint(4,'World Start');generateWorld(state.level);resetPlayer(false,2);resetParty();markStoryChanged();showWorldIntro();
}
function finishGame(){
  AudioEngine.stopMusic();sfx.worldAdvance();
  // Freeze the official race time only after the final portal is completed.
  state.elapsedBase=elapsedPrecise();state.startPerf=performance.now();state.started=false;state.raceStarted=false;
  UI.hud.classList.add('hidden');UI.hotbar.classList.add('hidden');UI.petHud.classList.add('hidden');UI.bossBar.classList.add('hidden');UI.missionCompass.classList.add('hidden');UI.campaignHud.classList.add('hidden');UI.respawnBanner.classList.add('hidden');UI.rewardBanner.classList.remove('show');
  const deductions=0;UI.reportTeam.textContent=state.team;UI.reportTime.textContent=raceTimeFmt(state.elapsedBase);UI.reportAcademicPoints.textContent=`${state.academicPoints}/${ACADEMIC_SCORING.maximumPoints}`;UI.reportWrongAttempts.textContent='All 48 Python challenges complete. The stoneborn is free. Save your file to keep the story, trail lessons and Python work.';
  $('finalByteStory').textContent=byteSays(storyChapter().ending);UI.reportRank.textContent=expeditionRank();UI.reportBestChain.textContent=`BEST KNOWLEDGE CHAIN ×${state.bestStreak}`;
  state.finished=true;markStoryChanged();show(UI.final);
}
