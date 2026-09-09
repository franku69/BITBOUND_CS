/* ------------------------ Utilities ------------------------- */
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function randHash(x,y,s=1){ let n = (x*374761393 + y*668265263 + s*69069) >>> 0; n = (n ^ (n>>13))*1274126177 >>>0; return ((n^(n>>16))>>>0)/4294967295; }
function rects(a,b){return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;}
function elapsedPrecise(){return Math.max(0,state.elapsedBase + (state.started&&state.raceStarted ? (performance.now()-state.startPerf)/1000 : 0));}
function elapsed(){return Math.floor(elapsedPrecise());}
function timeFmt(sec){sec=Math.max(0,Math.floor(sec)); return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function raceTimeFmt(sec){sec=Math.max(0,Number(sec)||0);const minutes=Math.floor(sec/60),seconds=Math.floor(sec%60),tenths=Math.floor((sec-Math.floor(sec))*10);return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${tenths}`;}
function updateRaceTimerDisplay(){if(UI.hudTime&&state.raceStarted)domWrites.text(UI.hudTime,raceTimeFmt(elapsedPrecise()));}
function allCores(){return state.solved[state.level].every(Boolean);}
function solvedCoreCount(level=state.level){
  let total=0;
  for(const restored of state.solved[level])if(restored)total++;
  return total;
}
function show(el){resetTouchInput();resetFrameTiming();scheduleFrame();el.hidden=false;el.classList.add('show');state.paused=true;state.needsRender=true;AudioEngine.setDuck(true);document.body.classList.add('adventure-paused');for(const k of Object.keys(state.keys))state.keys[k]=false;}
function hide(el){if(el===UI.mentor||el.id==='storyOverlay')AudioEngine.setDialogue(false);if(el.id==='storyOverlay')stopStoryAnimation();resetTouchInput();if(el===UI.puzzle)closePractice();el.classList.remove('show');el.hidden=true;state.paused=UI.overlays.some(overlay=>overlay.classList.contains('show'));state.needsRender=true;AudioEngine.setDuck(state.paused);document.body.classList.toggle('adventure-paused',state.paused);resetFrameTiming();scheduleFrame();for(const k of Object.keys(state.keys))state.keys[k]=false;}
function toast(msg,color='#d9edff'){ UI.toast.textContent=msg; UI.toast.style.color=color; UI.toast.classList.add('show'); clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>UI.toast.classList.remove('show'),1800); }
function completedQuestionCount(){
  let completed=0;
  for(const solved of state.solved)for(const answer of solved)if(answer)completed++;
  for(let level=0;level<worlds.length;level++){
    if(state.assessmentPassed[level])completed+=2;
    else for(const passed of state.terminalSolved[level])if(passed)completed++;
  }
  return Math.min(QUESTIONS.bank.length,completed);
}
function updateCampaignHud(){
  const completed=completedQuestionCount(),total=QUESTIONS.bank.length;
  state.academicPoints=completed; updateAcademicHud();
  domWrites.text(UI.campaignCount,`${completed} / ${total}`);
  domWrites.style(UI.campaignFill,'width',`${completed/total*100}%`);
  domWrites.text(UI.hudStreak,`×${state.answerStreak}`);
}
function showKnowledgeReward(title,bonus){
  if(!UI.rewardBanner)return;
  domWrites.text(UI.rewardTitle,title.toUpperCase());
  domWrites.text(UI.rewardMeta,`MISSION ${completedQuestionCount()} / ${QUESTIONS.bank.length} • CHAIN ×${state.answerStreak}${bonus?` • +${bonus} SCORE`:''}`);
  UI.rewardBanner.classList.add('show');clearTimeout(state.rewardTimer);
  state.rewardTimer=setTimeout(()=>UI.rewardBanner.classList.remove('show'),2100);
}
function recordCorrectAnswers(count,title){
  state.answerStreak+=count;state.bestStreak=Math.max(state.bestStreak,state.answerStreak);
  const bonus=Math.min(50,Math.max(0,state.answerStreak-1)*5);state.score+=bonus;
  const masteryId=MASTERY_WEAPON_REWARDS[completedQuestionCount()];
  if(masteryId)grantWeapon(masteryId,{equip:true,announce:true,source:'PYTHON PRACTICE'});
  updateCampaignHud();showKnowledgeReward(title,bonus);
}
function resetKnowledgeChain(){state.answerStreak=0;updateCampaignHud();}
function expeditionRank(){
  state.academicPoints=completedQuestionCount();
  const maximum=ACADEMIC_SCORING.maximumPoints;
  if(state.academicPoints>=maximum)return 'S';
  if(state.academicPoints>=Math.ceil(maximum*.9))return 'A';
  if(state.academicPoints>=Math.ceil(maximum*.8))return 'B';
  return 'C';
}
function academicAttemptStatus(){ return 'Practice freely. Retrying never deducts learning points'; }
function registerWrongSubmission(){state.wrong++;return {deducted:false,text:'Use a hint and retry. No learning points deducted.'};}
function worldData(){return worlds[state.level];}
function currentRunner(){return state.members[CLASSROOM_RACE.pilotMemberIndex] || 'Explorer';}
function surfaceAt(col){return state.world?.surface[clamp(Math.floor(col),0,COLS-1)] ?? 20;}
function setTile(c,r,id){
  if(c<0||c>=COLS||r<0||r>=ROWS||state.world.tiles[r][c]===id)return;
  state.world.tiles[r][c]=id;
  terrainCache.invalidate(c,r);
  // Grass on the next row depends on whether this tile is air.
  terrainCache.invalidate(c,r+1);
}
function getTile(c,r){ if(c<0||c>=COLS||r<0||r>=ROWS) return Tile.STONE; return state.world.tiles[r][c]; }
function isSolid(c,r){return SOLID.has(getTile(c,r));}
function playerCenter(){return {x:player.x+player.w/2,y:player.y+player.h/2};}
function playerInSanctuary(){
  const c=playerCenter().x/TILE;
  if(c<10)return true;
  if(SHRINE_COLS.some(sc=>Math.abs(sc-c)<4.2))return true;
  if(!bossFightActive()&&!state.assessmentPassed[state.level]&&Math.abs(TERMINAL_COL-c)<5.5)return true;
  if(state.bossDefeated[state.level]&&Math.abs(PORTAL_COL-c)<4.5)return true;
  return false;
}
function hashString(str){let h=2166136261>>>0; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return (h>>>0).toString(36).toUpperCase();}

function onScreen(x,y,w=0,h=0,pad=96){
  return x+w>=state.camera.x-pad && x<=state.camera.x+W+pad &&
    y+h>=state.camera.y-pad && y<=state.camera.y+H+pad;
}

function currentPet(){return PETS[state.petId]||PETS[DEFAULT_PET_ID];}
function selectPet(id){
  if(!PETS[id])return false;state.petId=id;
  for(const option of UI.petOptions){const selected=option.dataset.pet===id;option.classList.toggle('selected',selected);option.setAttribute('aria-pressed',String(selected));}
  updatePetHud();return true;
}
function updatePetHud(){const companion=currentPet();domWrites.text(UI.petHudIcon,companion.icon);domWrites.text(UI.petHudName,companion.name);domWrites.text(UI.petHudPerk,petSupport.label||companion.perk);}
