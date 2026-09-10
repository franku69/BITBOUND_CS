'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', '..', 'adventure');
const html = fs.readFileSync(path.join(root, '..', 'story.html'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'core.js'), 'utf8');
const questionsSource = fs.readFileSync(path.join(root, 'questions.js'), 'utf8');
const gameSource = fs.readFileSync(path.join(root, 'game.js'), 'utf8').replace(/\n\}\)\(\);\s*$/, '\nwindow.TestAPI={worldLessonProgress,runeLessonSet,trailSentryRect,requireWorldLessons,drawTrailSentries,RUNE_SET_SIZE,rigPoseForActor,rigWorldPoint,rigLocalPoint,rigBodySocket,applyStoryAmbient,scheduleStoryPlayback,storyDuration,getStoryPlayback:()=>storyPlayback,runeProtects,runeContact,showEncounterHint,drawEncounterBattle,stopEncounterAnimation,questionDirector,ENCOUNTER_BANK,ENCOUNTER_WORLDS,questionsAllowed,takeEncounterQuestion,openQuestionEncounter,answerQuestionEncounter,closeQuestionEncounter,updateQuestionEncounters,resetQuestionEncounters,encounterUI,PARTY_ROLES,partyRig,partyTarget,rigSocket,releasePartyAttack,sampleRig,rigParts,rigFrames,RIG_ACTIONS,drawRigActor,buildStoryFrame,renderStoryGraph,drawDemonActor,STORY_BEATS,avatarFrames,avatarFrame,paintStoneborn,heroPoseImages,weaponArt,skillArt,skillSprite,weaponSprite,pet,petSupport,resetPetSupport,updatePetSupport,mobCanSee,SKILL_SHAPES,REGION_BIOMES,STORY_SHOTS,PARTY_POSES,DAWN_COMPANY,partySprite,partyAtlas,storyBackdrops,storyEntrance,drawBackground,drawCastleWorldBackdrop,getStoryBackdrop,drawCastleCollapse,drawArcaneBarrier,state,player,startNewRaw:startNew,startNew(){startNew();while(plotState().scene==="origin")advancePlotScene();},plotUI,plotState,advancePlotScene,showPlotScene,forgePrisonKey,plotCanExit,drawStoryPicture,partyFrames,storyBossFrames,applyBossDamage,updateBoss,partyActors,updateParty,resetParty,stopStoryAnimation,restoreCheckpointFromProgress,respawnPlayer,startFinalBattle,openShrine,openAssessment,storySnapshot,validateStorySnapshot,restoreStorySnapshot,markStoryChanged,hide,show,update,loop,draw,drawWorld,generateWorld,setTile,getTile,PERF,UI,AudioEngine,terrainCache,simulationClock,frameScheduler,applyQuality,resetFrameTiming,updateInteractable,interact,openMentor,closeMentor,advanceMentor,mentorRect,nextLessonTarget,getObjective,completedQuestionCount,openTerminalTask,spawnBoss,defeatBoss,nextWorld,enterWorld,worlds,resetTouchInput,dpad,touchInput,handheld,drawMentor,mentorAnimator,mentorFrames,mentorWorldFrames,openChapterEnding,playerAnimator,drawAvatarSprite,drawPlayer,spawnEnemies,addEncounter,updateEncounters,moveEncounter,killEnemy,rebuildEnemyIndex,updateEnemies,WEAPONS,MOB_WEAPON_DROPS,CONCEPT_POWERS,castConceptPower,equipSkill,renderSkillPicker,creatureSprites,drawEnemies,drawPet,firePlayerProjectile,attack,grantWeapon,bossWeaponId,playCreatureCue,playActionCue,drawPixelWeapon};\n})();');

class ClassList {
  constructor(initial = []) { this.values = new Set(initial); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const next = force === undefined ? !this.contains(name) : Boolean(force);
    if (next) this.add(name); else this.remove(name);
    return next;
  }
}

const drawCalls = Object.create(null);
const gradient = { addColorStop() {} };
const canvasContext = new Proxy({}, {
  get(target, property) {
    if (property === 'measureText') return text => ({ width: String(text).length * 7 });
    if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => gradient;
    if (!(property in target)) target[property] = () => {drawCalls[property]=(drawCalls[property]||0)+1;};
    return target[property];
  },
  set(target, property, value) { target[property] = value; return true; }
});

class Element {
  constructor(id = '', tagName = 'DIV', classes = []) {
    this.id = id;
    this.tagName = tagName;
    this.classList = new ClassList(classes);
    this.style = { setProperty() {} };
    this.dataset = {};
    this.children = [];
    this.value = '';
    this.textContent = '';
    this.attributes = {};
    this.listeners = {};
    this.hidden = false;
    this.innerHTML = '';
    this.contentWindow = {messages:[],postMessage(message){this.messages.push(message);}};
    this.width = id === 'game' ? 1280 : 180;
    this.height = id === 'game' ? 720 : 220;
  }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(type,handler) { (this.listeners[type] ||= []).push(handler); }
  replaceChildren(...children) { this.children=children; }
  focus() { this.focused=true; }
  getContext() { return canvasContext; }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
  querySelectorAll(selector) { return selector === '.route-node' ? this.routeNodes || [] : []; }
  setAttribute(name,value) { this.attributes[name]=value; }
  remove(){this.removed=true;}
  setPointerCapture(){}
}

function buildContext(search, randomValue = 0, initialStorage = {}) {
  const elements = new Map();
  const idPattern = /\bid="([^"]+)"/g;
  for (const match of html.matchAll(idPattern)) elements.set(match[1], new Element(match[1]));
  elements.get('startScreen').classList.add('overlay', 'show');
  elements.get('puzzleOverlay').hidden=true;
  for (const id of ['worldIntro','puzzleOverlay','assessmentOverlay','guideOverlay','helpOverlay','deathOverlay','finalOverlay','instructorOverlay','mentorOverlay','storyOverlay','encounterOverlay']) {
    elements.get(id).classList.add('overlay');
  }
  for (const id of ['hud','hotbar','missionCompass','mobilityHud','bossBar']) elements.get(id).classList.add('hidden');

  const members = Array.from({ length: 5 }, () => new Element('', 'INPUT', ['member']));
  const slots = Array.from({ length: 4 }, (_, index) => {
    const element = new Element('', 'BUTTON', ['slot']);
    element.dataset.slot = String(index);
    return element;
  });
  const petOptions = ['index_fox','append_slime','slice_owl','sort_bot'].map((id,index) => {
    const element = new Element('', 'BUTTON', ['pet-option', ...(index===0?['selected']:[])]);
    element.dataset.pet = id;return element;
  });
  const touchButtons=[...html.matchAll(/<button\b([^>]*data-game-action="([^"]+)"[^>]*)>/g)].map(match=>{
    const id=match[1].match(/\bid="([^"]+)"/)?.[1];
    const button=id?elements.get(id):new Element('', 'BUTTON');
    button.dataset.gameAction=match[2];return button;
  });
  const overlays = [...elements.values()].filter(element => element.classList.contains('overlay'));
  const routes = ['spawn','shrine0','shrine1','shrine2','shrine3','terminal','boss','portal'].map(route => {
    const element = new Element('', 'SPAN', ['route-node']);
    element.dataset.route = route;
    return element;
  });
  elements.get('routeTrack').routeNodes = routes;

  const listeners = Object.create(null);
  const document = {
    documentElement: new Element('html', 'HTML'),
    body: new Element('body','BODY'),
    addEventListener(type,handler){(listeners['document:'+type]||=[]).push(handler);},
    hidden:false,
    checkedAnswers: null,
    getElementById(id) { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); },
    createElement(tag) { return new Element('', String(tag).toUpperCase()); },
    querySelectorAll(selector) {
      if (selector === '.member') return members;
      if (selector === '[data-game-action]') return touchButtons;
      if (selector === '.slot') return slots;
      if (selector === '.pet-option') return petOptions;
      if (selector === '.overlay') return overlays;
      return [];
    },
    querySelector(selector) {
      const match = String(selector).match(/name="bossq(\d+)"/);
      if (!match || !this.checkedAnswers) return null;
      const value = this.checkedAnswers[Number(match[1])];
      return value === undefined ? null : { value: String(value) };
    }
  };
  const sandbox = {
    console, document, location: { search, origin:'http://example.test' }, URLSearchParams,
    navigator: { hardwareConcurrency: 2, deviceMemory: 2 },
    performance: { now: () => 1000 },
    localStorage: {data:new Map(Object.entries(initialStorage)),reads:[],writes:[],removeItem(k){this.writes.push(k);this.data.delete(k)},setItem(k,v){this.writes.push(k);this.data.set(k,v)},getItem(k){this.reads.push(k);return this.data.get(k)||null;}},
    crypto: { getRandomValues(array) { array[0] = randomValue; return array; } },
    Image: class { constructor(){this.complete=true;this.naturalWidth=1280;this.naturalHeight=960;this.width=1280;this.height=960;} },
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    queued:[],
    setTimeout(fn) { sandbox.queued.push(fn);return sandbox.queued.length; }, clearTimeout() {}, setInterval() { return 1; }, clearInterval() {},
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    matchMedia() { return { matches: false }; },
    innerWidth: 1280, innerHeight: 720
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  // Model Web API receiver checks; loose Node timers hid the v10 lesson bug.
  vm.runInContext(`{
    const start=setTimeout,cancel=clearTimeout;
    globalThis.setTimeout=function(){'use strict';if(this!==undefined&&this!==globalThis)throw new TypeError('Illegal invocation: setTimeout');return Reflect.apply(start,globalThis,arguments);};
    globalThis.clearTimeout=function(){'use strict';if(this!==undefined&&this!==globalThis)throw new TypeError('Illegal invocation: clearTimeout');return Reflect.apply(cancel,globalThis,arguments);};
  }`,sandbox);

  for(const name of ['../app/music-score.js','performance.js','terrain-cache.js','touch-controls.js','handheld.js','mentor-sprite.js','mentor-animation.js','player-animation.js','mentor-voice.js','encounter-catalog.js','creature-sprites.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),sandbox,{filename:name});
  vm.runInContext(coreSource, sandbox, { filename: 'core.js' });
  vm.runInContext(questionsSource, sandbox, { filename: 'questions.js' });
  vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
  return { sandbox, elements, members, petOptions, listeners, drawCalls };
}

module.exports={buildContext};
