/* Manual session snapshots. No student data is read from or written to browser storage. */
const SAVE_FIELDS = ['level','team','members','score','wrong','deaths','blocks','torches','solved','assessmentPassed','bossDefeated','checkpoint','weapons','weaponIndex','powerId','powerXp','appearance','petId','totalMobKills','mobKills','answerStreak','bestStreak','terminalSolved','tutorialRead','chapterTalks','plot','encounterRead'];
let storyRevision=0,savedStoryRevision=0,pythonRevision=0,savedPythonRevision=0;
function markStoryChanged(){storyRevision++;}
function storySnapshot(){
  if(!state.started&&!state.finished)return null;
  const data={version:1,encounterVersion:4,elapsedBase:elapsedPrecise(),finished:!!state.finished};
  for(const field of SAVE_FIELDS)data[field]=state[field];
  return JSON.parse(JSON.stringify(data));
}
function validateStorySnapshot(raw){
  try{
    const data=JSON.parse(JSON.stringify(raw));
    if(!data||data.version!==1||!Number.isInteger(data.level)||data.level<0||data.level>=worlds.length)return null;
    const savedWorlds=data.solved?.length;
    if(![5,worlds.length].includes(savedWorlds)||data.level>=savedWorlds)return null;
    if(!Array.isArray(data.solved)||!data.solved.every(row=>Array.isArray(row)&&row.length===4&&row.every(value=>typeof value==='boolean')))return null;
    for(const key of ['assessmentPassed','bossDefeated'])if(!Array.isArray(data[key])||data[key].length!==savedWorlds||!data[key].every(value=>typeof value==='boolean'))return null;
    if(!Array.isArray(data.members)||data.members.length>5||!data.members.every(value=>typeof value==='string'))return null;
    if(!Array.isArray(data.weapons)||data.weapons.length>Object.keys(WEAPONS).length)return null;
    for(const key of ['score','wrong','deaths','blocks','torches','weaponIndex','powerXp','totalMobKills','answerStreak','bestStreak','elapsedBase'])if(!Number.isFinite(data[key])||data[key]<0||data[key]>1e8)return null;
    data.encounterRead=Object.fromEntries(QUESTIONS.encounters.filter(q=>data.encounterRead?.[q.id]===true).map(q=>[q.id,true]));
    if((data.encounterVersion||0)<4&&data.level===3){
      for(const q of ENCOUNTER_WORLDS[3])delete data.encounterRead[q.id];
      data.lessonUpgrade=true;
    }
    data.encounterVersion=4;
    data.finished=data.finished===true;
    data.team=String(data.team||'Explorer').slice(0,28);
    data.weapons=[...new Set(data.weapons.filter(id=>typeof id==='string'&&Object.hasOwn(WEAPONS,id)))];
    if(!data.weapons.length)data.weapons=['data_blade'];
    data.weaponIndex=clamp(Math.floor(data.weaponIndex),0,data.weapons.length-1);
    if(!Object.hasOwn(CONCEPT_POWERS,data.powerId))data.powerId='binary_beam';
    if(!Object.hasOwn(PETS,data.petId))data.petId=DEFAULT_PET_ID;
    const appearance=cloneAppearance();
    for(const key of ['skin','hair','eyes','outfit','accent'])if(/^#[0-9a-f]{6}$/i.test(data.appearance?.[key]||''))appearance[key]=data.appearance[key];
    if(['short','spiky','long','messy','mohawk','ponytail'].includes(data.appearance?.hairStyle))appearance.hairStyle=data.appearance.hairStyle;
    if(['armor','hoodie','scout','tech','casual'].includes(data.appearance?.outfitStyle))appearance.outfitStyle=data.appearance.outfitStyle;
    data.appearance=appearance;
    data.members=data.members.length?data.members.map(name=>name.slice(0,28)):['Explorer'];
    data.mobKills=Object.fromEntries(Object.keys(MOBS).map(type=>[type,Number.isFinite(data.mobKills?.[type])?clamp(Math.floor(data.mobKills[type]),0,1e8):0]));
    data.terminalSolved=worlds.map((_,level)=>{
      if(data.assessmentPassed[level])return [true,true];
      const row=data.terminalSolved?.[level];return Array.isArray(row)?[row[0]===true,row[1]===true]:[false,false];
    });
    while(data.solved.length<worlds.length)data.solved.push([false,false,false,false]);
    for(const key of ['assessmentPassed','bossDefeated'])while(data[key].length<worlds.length)data[key].push(false);
    if(data.finished&&(data.level!==worlds.length-1||!data.solved.flat().every(Boolean)||!data.assessmentPassed.every(Boolean)||!data.bossDefeated.every(Boolean)))return null;
    data.chapterTalks=worlds.map((_,level)=>data.chapterTalks?.[level]===true);
    data.tutorialRead=Object.fromEntries(QUESTIONS.bank.filter(task=>data.tutorialRead?.[task.id]===true).map(task=>[task.id,true]));
    data.checkpoint={col:clamp(Number(data.checkpoint?.col)||4,4,COLS-5),label:String(data.checkpoint?.label||'Checkpoint').slice(0,70)};
    data.plot=validatePlot(data.plot,data);if(!data.plot)return null;
    return data;
  }catch{return null;}
}
function restoreStorySnapshot(saved){
  stopStoryAnimation();closeMentor();
  for(const overlay of UI.overlays)if(overlay.classList.contains('show'))hide(overlay);
  ensureAudio();resetCampaignState(saved.team,saved.members);
  for(const field of SAVE_FIELDS)if(saved[field]!==undefined)state[field]=saved[field];
  state.elapsedBase=saved.elapsedBase;state.startPerf=performance.now();state.raceStarted=true;
  generateWorld(state.level);resetPlayer(true,3);resetParty();
  for(const element of [UI.hud,UI.hotbar,UI.petHud,UI.missionCompass,UI.campaignHud])element.classList.remove('hidden');
  updateCampaignHud();updateHotbar();
  if(saved.finished){finishGame();}else{if(!resumePlot())showWorldIntro();scheduleFrame();}
  if(saved.lessonUpgrade)toast('World 4 now has 32 applied lessons. Your shrines, equipment and story are kept.','#a4e3df');
  savedStoryRevision=storyRevision;
}
window.BitboundStory=Object.freeze({
  snapshot:storySnapshot,
  validate(raw){const saved=validateStorySnapshot(raw);if(!saved)throw new Error('Invalid story checkpoint. Choose a BITBOUND Story save file.');return saved;},
  restore:restoreStorySnapshot,
  pythonSnapshot:requestPythonSnapshot,
  restorePython:restorePythonSnapshot,
  revision:()=>storyRevision,
  hasUnsaved:()=>storyRevision!==savedStoryRevision||pythonRevision!==savedPythonRevision,
  markSaved(token){savedStoryRevision=token.story;savedPythonRevision=token.python;markPythonSaved(token.python);},
  markLoaded(){savedStoryRevision=storyRevision;savedPythonRevision=pythonRevision;},
  closeWorkspace(){if(UI.puzzle.classList.contains('show'))hide(UI.puzzle);}
});
