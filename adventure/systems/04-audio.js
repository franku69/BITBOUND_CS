/* ------------------------ Audio Engine ---------------------- */
const NOTE_OFFSETS = Object.freeze({C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11});
function noteFreq(note){
  if(!note || note==='-') return 0;
  const m=String(note).match(/^([A-G](?:#|b)?)(-?\d)$/);
  if(!m) return 0;
  const midi=(Number(m[2])+1)*12+NOTE_OFFSETS[m[1]];
  return 440*Math.pow(2,(midi-69)/12);
}

const SFX_LIBRARY = Object.freeze({
  jump:[{freq:250,dur:.06,type:'square',gain:.035,slide:100}],
  footstep:[{freq:92,dur:.035,type:'triangle',gain:.016,slide:-12}],
  land:[{freq:78,dur:.07,type:'triangle',gain:.026,slide:-25}],
  swing:[{freq:175,dur:.055,type:'triangle',gain:.034,slide:150}],
  shoot:[{freq:430,dur:.045,type:'square',gain:.031,slide:170,wait:.028},{freq:610,dur:.055,type:'square',gain:.021,slide:-90}],
  impact:[{freq:125,dur:.055,type:'sawtooth',gain:.032,slide:-55}],
  hurt:[{freq:155,dur:.12,type:'sawtooth',gain:.037,slide:-80}],
  enemyDown:[{freq:220,dur:.055,type:'square',gain:.025,slide:-80,wait:.035},{freq:125,dur:.09,type:'triangle',gain:.025,slide:-55}],
  pickup:[{freq:660,dur:.06,type:'square',gain:.032,slide:120,wait:.04},{freq:880,dur:.085,type:'triangle',gain:.027,slide:90}],
  chest:[{freq:390,dur:.05,type:'square',gain:.026,slide:55,wait:.04},{freq:590,dur:.07,type:'triangle',gain:.028,slide:95}],
  correct:[{freq:520,dur:.07,type:'square',gain:.03,slide:45,wait:.055},{freq:700,dur:.08,type:'square',gain:.028,slide:55,wait:.055},{freq:900,dur:.11,type:'triangle',gain:.025,slide:70}],
  wrong:[{freq:135,dur:.18,type:'sawtooth',gain:.038,slide:-55}],
  shrine:[{freq:470,dur:.05,type:'sine',gain:.024,slide:50,wait:.045},{freq:650,dur:.07,type:'sine',gain:.025,slide:80}],
  terminal:[{freq:260,dur:.04,type:'square',gain:.024,slide:90,wait:.035},{freq:480,dur:.055,type:'square',gain:.022,slide:110}],
  portal:[{freq:320,dur:.22,type:'sine',gain:.036,slide:500}],
  portalOpen:[{freq:300,dur:.07,type:'sine',gain:.026,slide:120,wait:.05},{freq:520,dur:.10,type:'sine',gain:.026,slide:160}],
  mine:[{freq:145,dur:.035,type:'square',gain:.024,slide:-30}],
  place:[{freq:310,dur:.045,type:'square',gain:.021,slide:-30}],
  boss:[{freq:78,dur:.16,type:'sawtooth',gain:.037,slide:18,wait:.10},{freq:112,dur:.20,type:'sawtooth',gain:.035,slide:32}],
  bossDefeat:[{freq:230,dur:.09,type:'triangle',gain:.033,slide:140,wait:.06},{freq:430,dur:.11,type:'triangle',gain:.031,slide:190,wait:.07},{freq:760,dur:.19,type:'sine',gain:.03,slide:100}],
  uiOpen:[{freq:500,dur:.04,type:'sine',gain:.018,slide:75}],
  uiClose:[{freq:420,dur:.04,type:'sine',gain:.016,slide:-65}],
  checkpoint:[{freq:430,dur:.045,type:'square',gain:.024,slide:35,wait:.035},{freq:575,dur:.07,type:'square',gain:.025,slide:45}],
  respawn:[{freq:250,dur:.075,type:'sine',gain:.028,slide:100,wait:.045},{freq:390,dur:.10,type:'sine',gain:.026,slide:130}],
  enemyShoot:[{freq:205,dur:.04,type:'square',gain:.018,slide:55}],
  weaponDrop:[{freq:310,dur:.055,type:'triangle',gain:.025,slide:90,wait:.04},{freq:500,dur:.09,type:'triangle',gain:.026,slide:130}],
  worldAdvance:[{freq:265,dur:.06,type:'sine',gain:.024,slide:100,wait:.045},{freq:400,dur:.08,type:'sine',gain:.025,slide:120,wait:.045},{freq:580,dur:.11,type:'sine',gain:.026,slide:150}],
  dash:[{freq:190,dur:.045,type:'sawtooth',gain:.026,slide:240,wait:.02},{freq:420,dur:.055,type:'triangle',gain:.020,slide:120}],
  doubleJump:[{freq:330,dur:.05,type:'square',gain:.026,slide:150,wait:.035},{freq:560,dur:.06,type:'triangle',gain:.020,slide:110}],
  drop:[{freq:210,dur:.055,type:'triangle',gain:.021,slide:-110}],
  bossWarn:[{freq:620,dur:.055,type:'square',gain:.024,slide:-40,wait:.055},{freq:620,dur:.055,type:'square',gain:.024,slide:-40}],
  bossCharge:[{freq:145,dur:.12,type:'sawtooth',gain:.034,slide:260}],
  shockwave:[{freq:95,dur:.10,type:'triangle',gain:.035,slide:-25,wait:.04},{freq:150,dur:.13,type:'sawtooth',gain:.026,slide:-50}],
  equip:[{freq:540,dur:.045,type:'square',gain:.021,slide:35}],
  powerCast:[{freq:310,dur:.05,type:'square',gain:.026,slide:220,wait:.035},{freq:640,dur:.09,type:'triangle',gain:.025,slide:160}],
  powerUp:[{freq:420,dur:.06,type:'square',gain:.027,slide:90,wait:.045},{freq:620,dur:.08,type:'triangle',gain:.028,slide:130,wait:.045},{freq:880,dur:.12,type:'sine',gain:.026,slide:100}]
});

const AudioEngine = {
  ctx:null, master:null, sfxBus:null, musicBus:null,
  musicTimer:null, musicStep:0, musicMode:'world', level:0,
  musicPlayer:null, musicTrack:'setup', musicPhase:null,
  musicEnabled:window.BitboundMusic.preference(), sfxEnabled:true, ducked:true, background:false,
  musicRequested:false, suspendTimer:null, voices:new Set(), resumePending:false,
  dialogueOpen:false, dialogueVoice:null, dialogueFailed:false, dialogueSpeaker:'BYTE', dialogueVoices:Object.create(null),
  init(){
    if(this.background||document.hidden)return null;
    if(!this.ctx){
      try{
        this.ctx=new (window.AudioContext||window.webkitAudioContext)();
        this.master=this.ctx.createGain(); this.sfxBus=this.ctx.createGain(); this.musicBus=this.ctx.createGain();
        this.sfxBus.connect(this.master); this.musicBus.connect(this.master); this.master.connect(this.ctx.destination);
        this.master.gain.value=.9;
        this.musicPlayer=new window.BitboundMusic.Player(this.ctx,this.musicBus);
        this.musicPlayer.setEnabled(this.musicEnabled);this.musicPlayer.setTrack(this.musicTrack);
        this.ctx.addEventListener?.('statechange',()=>{if(this.ctx.state==='running'&&!this.background&&!document.hidden)this.musicPlayer.start();});
        this.refreshMix();
      }catch(e){ return null; }
    }
    if((this.ctx.state==='suspended'||this.ctx.state==='interrupted')&&!this.resumePending){
      this.resumePending=true;
      Promise.resolve(this.ctx.resume()).catch(()=>{}).finally(()=>{this.resumePending=false;if(!this.background&&!document.hidden)this.musicPlayer?.start();});
    }
    if(this.ducked&&!this.musicEnabled&&this.suspendTimer===null)this.scheduleSuspend();
    return this.ctx;
  },
  refreshMix(){
    if(!this.ctx) return;
    const now=this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(this.sfxEnabled?1:0,now,.02);
    const musicLevel=this.musicEnabled&&!this.background?(this.dialogueOpen?.40:.78):0;
    this.musicBus.gain.setTargetAtTime(musicLevel,now,.08);
    updateAudioButtons();
  },
  tone({freq=440,dur=.08,type='square',gain=.03,slide=0,start=0}={},bus='sfx'){
    if(!this.ctx||this.background||document.hidden||!freq||this.voices.size>=48)return;
    if(bus==='sfx'&&!this.sfxEnabled) return;
    if(bus==='music'&&(!this.musicEnabled||this.ducked)) return;
    const begin=this.ctx.currentTime+Math.max(0,start);
    const osc=this.ctx.createOscillator(), amp=this.ctx.createGain();
    osc.type=type; osc.frequency.setValueAtTime(freq,begin);
    if(slide) osc.frequency.linearRampToValueAtTime(Math.max(35,freq+slide),begin+dur);
    amp.gain.setValueAtTime(Math.max(.0001,gain),begin); amp.gain.exponentialRampToValueAtTime(.0001,begin+dur);
    this.voices.add(osc);
    osc.onended=()=>{osc.disconnect();amp.disconnect();this.voices.delete(osc);};
    osc.connect(amp); amp.connect(bus==='music'?this.musicBus:this.sfxBus); osc.start(begin); osc.stop(begin+dur+.01);
  },
  sequence(seq=[]){
    if(!this.sfxEnabled||!this.init())return;
    let offset=0; for(const t of seq){this.tone({...t,start:offset},'sfx'); offset+=t.wait??t.dur??.05;}
    if(this.ducked)this.scheduleSuspend();
  },
  theme(){return window.BitboundMusic.catalog[this.musicTrack];},
  tick(){this.musicPlayer?.pump();},
  pauseMusic(){this.musicPlayer?.halt(.04);},
  syncMusic(){
    this.musicTrack=storyMusicRoute();
    this.musicPlayer?.setTrack(this.musicTrack);
    this.musicPlayer?.setEnabled(this.musicEnabled);
    if(this.musicEnabled)this.cancelSuspend();
    updateAudioButtons();
  },
  restart(){this.syncMusic();},
  playWorld(level=0){this.level=level;this.musicMode='world';this.musicRequested=true;this.syncMusic();},
  playBoss(level=0,phase=state.boss?.storyKind){this.level=level;this.musicMode='boss';this.musicPhase=phase;this.musicRequested=true;this.syncMusic();},
  stopMusic(){this.musicRequested=false;this.pauseMusic();},
  cancelSuspend(){if(this.suspendTimer!==null){clearTimeout(this.suspendTimer);this.suspendTimer=null;}},
  suspend(){
    this.cancelSuspend();
    this.dialogueVoice?.stop();
    this.musicPlayer?.halt(0);
    for(const osc of this.voices){try{osc.stop();}catch{}osc.onended?.();osc.onended=null;}
    if(this.ctx&&this.ctx.state!=='closed')Promise.resolve(this.ctx.suspend()).catch(()=>{});
  },
  scheduleSuspend(){
    this.cancelSuspend();
    if(this.musicEnabled&&!this.background&&!document.hidden)return;
    if(this.dialogueOpen&&this.sfxEnabled&&!this.dialogueFailed&&!this.background&&!document.hidden)return;
    // Let short feedback sounds finish, then stop the idle audio graph.
    this.suspendTimer=setTimeout(()=>{this.suspendTimer=null;if(this.ducked||this.background)this.suspend();},1200);
  },
  toggleMusic(){this.musicEnabled=!this.musicEnabled;window.BitboundMusic.preference(this.musicEnabled);this.syncMusic();if(!this.musicEnabled&&this.ducked)this.scheduleSuspend();this.refreshMix();return this.musicEnabled;},
  setDialogue(open){if(open)this.setSpeaker('BYTE');else{this.dialogueOpen=false;this.syncDialogue();}},
  setSpeaker(speaker){
    const valid=Object.hasOwn(window.BitboundMentorVoice.VOICE_PROFILES,speaker);
    if(!valid){this.dialogueOpen=false;this.syncDialogue();return;}
    if(this.dialogueSpeaker!==speaker){this.dialogueVoice?.stop();this.dialogueSpeaker=speaker;this.dialogueVoice=this.dialogueVoices[speaker]||null;}
    this.dialogueOpen=true;this.syncDialogue();
  },
  syncDialogue(){
    this.refreshMix();
    // Keep dialogue sound optional: unsupported or blocked audio cannot trap a lesson.
    const speak=this.dialogueOpen&&this.sfxEnabled&&!this.background&&!document.hidden&&!this.dialogueFailed;
    if(!speak){this.dialogueVoice?.stop();if(this.ducked&&!this.background)this.scheduleSuspend();return;}
    try{
      const context=this.init();if(!context)return;
      if(!this.dialogueVoice)this.dialogueVoice=this.dialogueVoices[this.dialogueSpeaker]=new window.BitboundMentorVoice.GibberishVoice(this.dialogueSpeaker);
      this.cancelSuspend();this.dialogueVoice.play(context,this.sfxBus);
    }catch(error){
      this.dialogueFailed=true;this.dialogueVoice?.stop();this.scheduleSuspend();
      console.warn('Character voice unavailable; dialogue remains usable.',error);
    }
  },
  toggleSfx(){this.sfxEnabled=!this.sfxEnabled;this.syncDialogue();this.refreshMix();return this.sfxEnabled;},
  setDuck(value){
    this.ducked=!!value;this.syncMusic();
    if(this.ducked&&!this.musicEnabled)this.scheduleSuspend();
    this.refreshMix();
  },
  setBackground(value){
    this.background=!!value;this.musicPlayer?.setBackground(this.background);
    if(this.background)this.suspend();
    else{if(this.ctx)this.init();this.syncMusic();if(this.dialogueOpen)this.syncDialogue();}
    this.refreshMix();
  }
};
// Overlay precedence is explicit: a question or scene never inherits combat music.
function storyMusicRoute(){
  const visible=id=>$(id)?.classList.contains('show');
  if(visible('startScreen'))return 'setup';
  if(visible('storyOverlay')){
    const scene=plotState().scene;
    if(scene==='cell')return 'prison';
    if(scene==='prisoners')return 'prison';
    if(scene==='rescue'||/^camp/.test(scene))return 'camp';
    if(scene==='paladinFall')return 'betrayal';
    if(['origin','betrayal','escape','rivals','barrier','fusion','ending'].includes(scene))return scene;
    return 'camp';
  }
  if(visible('deathOverlay'))return 'defeat';
  if(visible('finalOverlay'))return 'ending';
  if(visible('puzzleOverlay')||visible('assessmentOverlay'))return 'practice';
  if(visible('mentorOverlay'))return 'lesson';
  if(visible('encounterOverlay'))return 'encounter';
  if(visible('guideOverlay')||visible('helpOverlay')||visible('instructorOverlay'))return 'lesson';
  if(visible('worldIntro'))return 'world'+state.level;
  if(AudioEngine.musicMode==='boss')return AudioEngine.level===7&&['paladin','fused'].includes(AudioEngine.musicPhase)?AudioEngine.musicPhase:'boss'+AudioEngine.level;
  return 'world'+AudioEngine.level;
}
function ensureAudio(){return AudioEngine.init();}
function updateAudioButtons(){
  for(const button of document.querySelectorAll('[data-story-music]')){
    domWrites.text(button,AudioEngine.musicEnabled?'♫ Music on':'♫ Music off');
    button.setAttribute('aria-pressed',String(AudioEngine.musicEnabled));button.title=AudioEngine.theme()?.name||'Music';
  }
  if(UI.musicToggle){UI.musicToggle.title=AudioEngine.theme()?.name||'Music';UI.musicToggle.setAttribute('aria-pressed',String(AudioEngine.musicEnabled));UI.musicToggle.dataset.musicTrack=AudioEngine.musicTrack;domWrites.text(UI.musicToggle,AudioEngine.musicEnabled?'♫ MUSIC ON':'♫ MUSIC OFF');domWrites.toggle(UI.musicToggle,'off',!AudioEngine.musicEnabled);}
  if(UI.sfxToggle){domWrites.text(UI.sfxToggle,AudioEngine.sfxEnabled?'✦ SFX ON':'✦ SFX OFF');domWrites.toggle(UI.sfxToggle,'off',!AudioEngine.sfxEnabled);}
  const storySound=$('storySound');if(storySound){domWrites.text(storySound,AudioEngine.sfxEnabled?'Sound: on':'Sound: off');storySound.setAttribute('aria-pressed',String(AudioEngine.sfxEnabled));}
  const dialogueSound=$('mentorSound');
  if(dialogueSound){domWrites.text(dialogueSound,AudioEngine.sfxEnabled?'Sound effects: on':'Sound effects: off');dialogueSound.setAttribute('aria-pressed',String(AudioEngine.sfxEnabled));}
}
const sfx=Object.freeze(Object.fromEntries(Object.entries(SFX_LIBRARY).map(([name,seq])=>[name,()=>AudioEngine.sequence(seq)])));
