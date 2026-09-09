/* ------------------------ Events ---------------------------- */
UI.startBtn.onclick=startNew;UI.introBtn.onclick=enterWorld;UI.puzzleClose.onclick=()=>{sfx.uiClose();hide(UI.puzzle);};UI.assessClose.onclick=()=>{sfx.uiClose();hide(UI.assess);};UI.guideClose.onclick=()=>{sfx.uiClose();hide(UI.guide);};UI.helpClose.onclick=()=>{sfx.uiClose();hide(UI.help);};UI.unstuckBtn.onclick=unstuckPlayer;UI.respawnBtn.onclick=respawnPlayer;UI.instructorClose.onclick=()=>{sfx.uiClose();hide(UI.instructor);};
UI.musicToggle.onclick=()=>{ensureAudio();AudioEngine.toggleMusic();};UI.sfxToggle.onclick=()=>{ensureAudio();AudioEngine.toggleSfx();};updateAudioButtons();
UI.healBtn.onclick=()=>{player.health=MAX_HEALTH;toast('Instructor: health restored.','#7dff9b');};UI.coresBtn.onclick=()=>{state.solved[state.level]=[true,true,true,true];updateCampaignHud();markStoryChanged();toast('Instructor: 4 cores granted.','#7dff9b');};UI.assessmentBtn.onclick=()=>openAssessment();UI.bossBtn.onclick=()=>{if(!state.boss||state.boss.dead){state.assessmentPassed[state.level]=true;updateCampaignHud();spawnBoss();}else defeatBoss();};UI.nextBtn.onclick=()=>{hide(UI.instructor);state.bossDefeated[state.level]=true;nextWorld();};

UI.slots.forEach((b,i)=>b.onclick=()=>selectSlot(i));
window.addEventListener('keydown',(e)=>{
  const k=e.key.toLowerCase();
  if(questionDirector.active){
    if(k==='escape'){e.preventDefault();showEncounterHint();}
    // Keep Space/Enter and Tab native for the focused answer control.
    if(!e.repeat&&!e.ctrlKey&&!e.altKey&&['a','b','c'].includes(k)){e.preventDefault();answerQuestionEncounter(k.charCodeAt(0)-97);}
    return;
  }
  if(plotUI.overlay.classList.contains('show')){if(k==='escape'){e.preventDefault();if(storyPlayback&&!storyPlayback.paused)plotUI.still.onclick();}return;}
  if(UI.mentor.classList.contains('show')){if(k==='escape'){e.preventDefault();closeMentor();}return;}
  if(e.ctrlKey&&e.shiftKey&&e.key==='9'){e.preventDefault();openInstructor();return;}
  const tag=(e.target&&e.target.tagName)||'';if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
  if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k)||e.key===' ')e.preventDefault();
  state.keys[k]=true;
  if(e.repeat)return;
  if(e.key===' '||k==='w'||k==='arrowup')jump();
  if(k==='shift')dash();
  if(k==='s'||k==='arrowdown')dropOrFastFall();
  if(k==='j')attack();
  if(k==='k')castConceptPower();
  if(k==='q')cycleWeapon();
  if(k==='m'){ensureAudio();AudioEngine.toggleMusic();}
  if(k==='n'){ensureAudio();AudioEngine.toggleSfx();}
  if(k==='e')interact();
  if(k==='c')openGuide();
  if(k==='h')show(UI.help);
  if(['1','2','3','4'].includes(k))selectSlot(Number(k)-1);
  if(k==='escape'){
    const open=[UI.puzzle,UI.assess,UI.guide,UI.help,UI.instructor].find(x=>x.classList.contains('show'));
    if(open)hide(open);else show(UI.help);
  }
});
window.addEventListener('keyup',(e)=>state.keys[e.key.toLowerCase()]=false);
canvas.addEventListener('mousemove',(e)=>{const r=canvas.getBoundingClientRect();state.mouse.x=(e.clientX-r.left)*canvas.width/r.width;state.mouse.y=(e.clientY-r.top)*canvas.height/r.height;});
canvas.addEventListener('mousedown',(e)=>{e.preventDefault();handleWorldClick(e.button);});canvas.addEventListener('contextmenu',(e)=>e.preventDefault());
window.addEventListener('blur',()=>{for(const k of Object.keys(state.keys))state.keys[k]=false;});
