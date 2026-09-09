/* ------------------------ HUD / Hotbar ---------------------- */
function updateAcademicHud(){
  if(!UI.hudAcademicPoints)return;
  domWrites.text(UI.hudAcademicPoints,`${state.academicPoints}/${ACADEMIC_SCORING.maximumPoints}`);
  domWrites.toggle(UI.hudAcademicPoints,'reduced',state.academicPoints<ACADEMIC_SCORING.maximumPoints);
  domWrites.text(UI.hudAttemptStatus,academicAttemptStatus().toUpperCase());
}
function setQuestHud(title,text){domWrites.text(UI.questTitle,title);domWrites.text(UI.questText,text);}
function updateHud(){
  refreshTrailStatus();const trail=worldLessonProgress();domWrites.text($('trailProgress'),`TRAIL LESSONS ${trail.done}/${trail.total} · ${trail.next?'STAGE '+trail.next.stage+'/4':'COMPLETE'}`);
  const w=worldData();domWrites.text(UI.hudWorld,`WORLD ${state.level+1}/${worlds.length}`);domWrites.text(UI.hudTitle,w.name);domWrites.style(UI.hudTitle,'color',w.accent);domWrites.text(UI.hudPilot,`Explorer: ${currentRunner()}`);const c=solvedCoreCount();
  if(!allCores())setQuestHud('LEARN WITH BYTE',`Cores ${c}/4 • Talk to Byte before each coding challenge.`);
  else if(!state.assessmentPassed[state.level])setQuestHud('BOSS CHALLENGE TERMINAL ONLINE','Reach the terminal and answer the Python challenges.');
  else if(!state.bossDefeated[state.level]){const bp=bossProfile();setQuestHud(`DEFEAT ${state.boss?.name||w.boss}`,`${bp.tip} • SHIFT dash • SPACE twice double-jump • S fast-fall/drop.`);}
  else setQuestHud('PYTHON PORTAL OPEN',state.level===worlds.length-1?'Enter the portal to finish all 48 story missions.':'Enter the portal to reach the next world.');
  const objective=plotObjective();if(objective)setQuestHud(objective.short,objective.action);
  domWrites.text(UI.hudHearts,'♥'.repeat(player.health)+'♡'.repeat(MAX_HEALTH-player.health));domWrites.text(UI.hudTime,raceTimeFmt(elapsedPrecise()));updateAcademicHud();updateCampaignHud();updateHotbar();updateMissionGPS();updateMobilityHud();
}
function updateMobilityHud(){
  if(!UI.mobilityHud)return;const active=bossFightActive();UI.mobilityHud.classList.toggle('hidden',!active);if(!active)return;
  if(UI.dashStatus){UI.dashStatus.textContent=player.dashCd<=.02?'READY':`${player.dashCd.toFixed(1)}s`;UI.dashStatus.classList.toggle('cooling',player.dashCd>.02);}
  if(UI.airJumpStatus){const ready=player.onGround||player.airJumps>0;UI.airJumpStatus.textContent=ready?'READY':'USED';UI.airJumpStatus.classList.toggle('used',!ready);}
}
function updateHotbar(){
  UI.slots.forEach((s,i)=>s.classList.toggle('selected',i===state.selected));UI.torchCount.textContent=state.torches;const w=currentWeapon(),p=currentPower(),lv=powerLevel(),next=nextPowerXp();
  if(UI.weaponName)UI.weaponName.textContent=w.name;
  if(UI.weaponIcon){UI.weaponIcon.textContent=w.icon;UI.weaponIcon.style.color=w.color;}
  if(UI.weaponCount)UI.weaponCount.textContent=`DMG ${w.damage} • ${w.rarity.toUpperCase()} • Q CYCLE`;
  if(UI.weaponSlot){UI.weaponSlot.style.setProperty('--weapon-color',w.color);UI.weaponSlot.dataset.weapon=w.id;UI.weaponSlot.title=`${w.name}: ${w.damage} damage • ${w.type==='ranged'?'ranged':w.reach+'px reach'} • ${w.rarity} • Q cycles collected weapons`;}
  if(UI.powerName)UI.powerName.textContent=p.name;
  if(UI.powerIcon){UI.powerIcon.textContent=p.icon;UI.powerIcon.style.color=p.color;}
  if(UI.powerSlot){
    UI.powerSlot.style.setProperty('--power-color',p.color);
    UI.powerSlot.dataset.power=p.id;
    UI.powerSlot.classList.toggle('cooldown',state.powerCooldown>.02);
    UI.powerSlot.title=`${p.name}: ${p.description} Concept: ${p.concept}. Press 2 then click, or K to cast instantly without unequipping your weapon. Defeat mobs (+1 XP) and bosses (+4 XP) to upgrade.`;
  }
  const cdMax=Math.max(.001,powerCooldownMax()),cdRatio=clamp(state.powerCooldown/cdMax,0,1);
  if(UI.powerCooldownFill){UI.powerCooldownFill.style.width=`${Math.round(cdRatio*100)}%`;UI.powerCooldownFill.style.background=p.color;}
  if(UI.powerLevelBadge){UI.powerLevelBadge.textContent=`LV ${lv}`;UI.powerLevelBadge.style.borderColor=p.color;UI.powerLevelBadge.style.color=p.color;}
  if(UI.powerStatus){const cd=state.powerCooldown>.02?`${state.powerCooldown.toFixed(1)}s`:'READY',xp=next===null?'MAX':`${state.powerXp}/${next} XP`;UI.powerStatus.textContent=`${cd} • ${xp}`;}
}
function selectSlot(n){
  n=clamp(n,0,3);
  if(n===3){openGuide();return;}
  state.selected=n;
  // Slot changes only change the active action. Power cooldowns never lock the weapon.
  // This makes switching back to slot 1 immediately reliable after a Concept Power cast.
  if(n===0){player.attack=Math.min(player.attack,.02);}
  updateHotbar();
}

function openInstructor(){
  UI.answerKey.innerHTML='<h3>PRACTICE CONTROLS</h3><p>These are game shortcuts, not secure teacher permissions. Exercise solutions and progress reports are available in the Python lab.</p>';
  sfx.uiOpen();show(UI.instructor);
}
