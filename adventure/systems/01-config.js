const {compactInPlace,pushBounded,ObjectPool,LruCache,SpatialHash1D,DomWriteCache}=window.BitboundCore;
const {QUALITY,FixedStepClock,FrameScheduler,QualityGovernor}=window.BitboundPerformance;
const {TerrainCache}=window.BitboundTerrain;
const domWrites=new DomWriteCache();
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const qualityOverride = new URLSearchParams(location.search).get('quality');
const automaticLowPower = (navigator.hardwareConcurrency || 8) <= 4 ||
  (navigator.deviceMemory || 8) <= 4 ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  window.matchMedia('(pointer: coarse)').matches;
const LOW_POWER = qualityOverride === 'low' || (qualityOverride !== 'high' && automaticLowPower);
if (LOW_POWER) {
  canvas.width = 960;
  canvas.height = 540;
}
document.documentElement.classList.toggle('low-fx', LOW_POWER);
const ctx = canvas.getContext('2d',{alpha:false,desynchronized:true});
ctx.imageSmoothingEnabled = false;

const UI = {
  hud: $('hud'), hotbar: $('hotbar'), hudWorld: $('hudWorld'), hudTitle: $('hudTitle'), hudPilot: $('hudRunner'),
  questTitle: $('questTitle'), questText: $('questText'), hudHearts: $('hudHearts'), hudTime: $('hudTime'), hudAcademicPoints: $('hudAcademicPoints'), hudAttemptStatus: $('hudAttemptStatus'),
  interactPrompt: $('interactPrompt'), interactText: $('interactText'), toast: $('toast'), bossBar: $('bossBar'), bossName: $('bossName'), bossFill: $('bossFill'),
  start: $('startScreen'), startBtn: $('startBtn'), startError: $('startError'),
  intro: $('worldIntro'), introNumber: $('introNumber'), introTitle: $('introTitle'), introSubtitle: $('introSubtitle'), introPilot: $('introRunner'), introMission: $('introMission'), introBtn: $('introBtn'),
  puzzle: $('puzzleOverlay'), puzzleClose: $('puzzleClose'), puzzleEyebrow: $('puzzleEyebrow'), puzzleTitle: $('puzzleTitle'), puzzleLesson: $('puzzleLesson'), puzzleQuestion: $('puzzleQuestion'), puzzleOptions: $('puzzleOptions'), puzzleFeedback: $('puzzleFeedback'),
  mentor: $('mentorOverlay'),
  assess: $('assessmentOverlay'), assessClose: $('assessmentClose'), assessTitle: $('assessmentTitle'), assessBody: $('assessmentBody'), assessFeedback: $('assessmentFeedback'),
  guide: $('guideOverlay'), guideClose: $('guideClose'), guideWorld: $('guideWorld'), guideTabs: $('guideTabs'), guideContent: $('guideContent'),
  help: $('helpOverlay'), helpClose: $('helpClose'), unstuckBtn: $('unstuckBtn'), death: $('deathOverlay'), respawnBtn: $('respawnBtn'), deathCheckpoint: $('deathCheckpoint'), deathNextObjective: $('deathNextObjective'), deathInstruction: $('deathInstruction'),
  missionCompass: $('missionCompass'), objectiveDirection: $('objectiveDirection'), objectiveTitle: $('objectiveTitle'), objectiveAction: $('objectiveAction'), objectiveDistance: $('objectiveDistance'), routeTrack: $('routeTrack'), routePlayer: $('routePlayer'), respawnBanner: $('respawnBanner'), respawnBannerTitle: $('respawnBannerTitle'), respawnBannerText: $('respawnBannerText'),
  characterPreview: $('characterPreview'), hairStyle: $('hairStyle'), outfitStyle: $('outfitStyle'), skinSwatches: $('skinSwatches'), hairSwatches: $('hairSwatches'), eyeSwatches: $('eyeSwatches'), outfitSwatches: $('outfitSwatches'), accentSwatches: $('accentSwatches'), randomizeCharacter: $('randomizeCharacter'),
  final: $('finalOverlay'), reportTeam: $('reportTeam'), reportTime: $('reportTime'), reportAcademicPoints: $('reportAcademicPoints'), reportWrongAttempts: $('reportWrongAttempts'), reportRank: $('reportRank'), reportBestChain: $('reportBestChain'),
  instructor: $('instructorOverlay'), instructorClose: $('instructorClose'), answerKey: $('answerKey'), healBtn: $('healBtn'), coresBtn: $('coresBtn'), assessmentBtn: $('assessmentBtn'), bossBtn: $('bossBtn'), nextBtn: $('nextBtn'),
  torchCount: $('torchCount'), weaponSlot: $('weaponSlot'), weaponIcon: $('weaponIcon'), weaponName: $('weaponName'), weaponCount: $('weaponCount'),
  powerSlot: $('powerSlot'), powerIcon: $('powerIcon'), powerName: $('powerName'), powerStatus: $('powerStatus'), powerLevelBadge: $('powerLevelBadge'), powerCooldownFill: $('powerCooldownFill'),
  audioPanel: $('audioPanel'), musicToggle: $('musicToggle'), sfxToggle: $('sfxToggle'),
  mobilityHud: $('mobilityHud'), dashStatus: $('dashStatus'), airJumpStatus: $('airJumpStatus'),
  campaignHud: $('campaignHud'), campaignCount: $('campaignCount'), campaignFill: $('campaignFill'), hudStreak: $('hudStreak'), rewardBanner: $('rewardBanner'), rewardTitle: $('rewardTitle'), rewardMeta: $('rewardMeta')
};

// Cache static DOM collections once instead of querying the document every frame.
UI.slots = [...document.querySelectorAll('.slot')];
UI.routeNodes = [...UI.routeTrack.querySelectorAll('.route-node')];
UI.overlays = [...document.querySelectorAll('.overlay')];
UI.petOptions = [...document.querySelectorAll('.pet-option')];
UI.performanceMode = $('performanceMode');
UI.petHud = $('petHud');UI.petHudIcon = $('petHudIcon');UI.petHudName = $('petHudName');UI.petHudPerk = $('petHudPerk');

const W = canvas.width;
const H = canvas.height;
// Visual quality changes leave combat limits and physics unchanged.
const PERF = {simulationRange:W*1.6};
const frameGovernor=new QualityGovernor();
function applyQuality(mode){
  const profile=QUALITY[mode];
  Object.assign(PERF,{mode,targetFps:profile.fps,frameMs:1000/profile.fps,
    uiInterval:profile.uiInterval,maxParticles:profile.particles,
    maxProjectiles:profile.projectiles,maxLoot:profile.loot,
    particleScale:profile.particleScale,starCount:profile.stars,richFx:profile.richFx});
  document.documentElement.classList.toggle('low-fx',mode!=='standard');
  document.documentElement.classList.toggle('eco-fx',mode==='eco');
  refreshPerformanceLabel();
}
function refreshPerformanceLabel(){
  domWrites.text(UI.performanceMode,`PERFORMANCE MODE: ${PERF.mode.toUpperCase()} (${PERF.targetFps} FPS)`);
}
function reduceVisualLoad(){
  if(PERF.mode==='eco')return;
  applyQuality(PERF.mode==='standard'?'low':'eco');
  frameGovernor.reset();
}
applyQuality(LOW_POWER?'low':'standard');
const TILE = 32;
const COLS = 224;
const ROWS = 42;
const GRAVITY = 0.62;
const SHRINE_COLS = [37, 77, 117, 157];
const TERMINAL_COL = 190;
const PORTAL_COL = 213;
const MAX_HEALTH = 5;

/* ------------------------ Classroom Race Mode -------------- */
const CLASSROOM_RACE = Object.freeze({
  bossHp:[18,24,30,38,44,50,58,66],
  pilotMemberIndex:0,
  timerStartsOnFirstWorldEntry:true,
  preserveBossHpAfterDeath:false,
  recommendedSlotMinutes:20
});
const ACADEMIC_SCORING = Object.freeze({
  maximumPoints:window.BitboundQuestions.bank.length,
  freeWrongAttempts:2,
  pointsLostPerExtraWrong:0
});
function bossMaxHp(level=state.level){return CLASSROOM_RACE.bossHp[clamp(level,0,CLASSROOM_RACE.bossHp.length-1)];}

/* ------------------------ Tactical Mobility ---------------- */
const MOBILITY = Object.freeze({
  runSpeed:3.3,
  groundJump:-11.8,
  airJump:-10.4,
  airJumps:1,
  dashSpeed:10.6,
  dashDuration:.18,
  dashCooldown:1.05,
  dashInvuln:.28,
  fastFallAccel:1.05,
  fastFallMax:18,
  dropThroughTime:.25
});
const BOSS_PROFILES = Object.freeze([
  {move:1.08,movement:'stalker',volley:'xorSplit',shotSpeed:3.05,volleyCd:1.75,specials:['xorBlink'],firstSpecial:1.00,specialCd:3.35,tip:'XOR BLINK: it swaps sides and fires crossing bolts — watch both sides.'},
  {move:.86,movement:'tank',volley:'heavyBlock',shotSpeed:2.55,volleyCd:1.90,specials:['nandSlam'],firstSpecial:1.10,specialCd:3.75,tip:'NAND SLAM: when it jumps, get airborne before the ground wave.'},
  {move:1.02,movement:'kite',volley:'cacheTriple',shotSpeed:2.75,volleyCd:1.75,specials:['cacheMines'],firstSpecial:1.05,specialCd:3.55,tip:'CACHE MINES: keep moving and do not stand on the glowing memory markers.'},
  {move:1.20,movement:'rush',volley:'storageFan',shotSpeed:3.55,volleyCd:1.55,specials:['dataRain'],firstSpecial:1.05,specialCd:3.35,tip:'DATA RAIN: use the platforms as cover or dash out of the marked columns.'},
  {move:1.20,movement:'duelist',volley:'chronoAim',shotSpeed:3.75,volleyCd:1.35,specials:['chronoBurst','bladeStorm','timeLock','crushingDescent','afterimageRush'],firstSpecial:.35,specialCd:1.45,tip:'GUARDIAN OVERDRIVE: read the telegraphs — Time Fracture, Blade Array, Time Lock, Crushing Descent, and Afterimage Rush rotate in order.'},
  {move:1.08,movement:'kite',volley:'xorSplit',shotSpeed:3.2,volleyCd:1.65,specials:['xorBlink','cacheMines'],firstSpecial:1.2,specialCd:2.8,tip:'LINK KEEPER: watch the blink, then move out of the glowing link markers.'},
  {move:1.08,movement:'stalker',volley:'cacheTriple',shotSpeed:3.1,volleyCd:1.65,specials:['chronoBurst','timeLock'],firstSpecial:1.2,specialCd:2.8,tip:'CALL GUARDIAN: wait for an opening between the marked time rings.'},
  {move:1.2,movement:'duelist',volley:'chronoAim',shotSpeed:3.6,volleyCd:1.5,specials:['dataRain','bladeStorm','afterimageRush'],firstSpecial:1.1,specialCd:2.6,tip:'GRAPH GUARDIAN: read the marked paths, jump the blades and dash away from the charge.'}
]);
function bossProfile(level=state.level){return level===7&&STORY_BOSS_PROFILES[plotState().finalPhase]||BOSS_PROFILES[clamp(level,0,BOSS_PROFILES.length-1)];}
function bossFightActive(){return !!(state.boss&&state.boss.active&&!state.boss.dead&&!state.bossDefeated[state.level]);}

const Tile = Object.freeze({ AIR:0, DIRT:1, STONE:2, ORE:3, BRICK:4, WOOD:5, PLATFORM:6, METAL:7, CRYSTAL:8, ASH:9 });
const SOLID = new Set([Tile.DIRT,Tile.STONE,Tile.ORE,Tile.BRICK,Tile.WOOD,Tile.PLATFORM,Tile.METAL,Tile.CRYSTAL,Tile.ASH]);
const MINEABLE = new Set([Tile.DIRT,Tile.STONE,Tile.ORE,Tile.BRICK,Tile.WOOD,Tile.METAL,Tile.CRYSTAL,Tile.ASH]);

/* ------------------------ Weapons / Loot ------------------- */
const WEAPONS = Object.freeze({
  stack_mace:{id:'stack_mace',name:'Stack Mace',icon:'▤',design:'stackMace',type:'melee',damage:3,cooldown:.65,reach:54,color:'#88d1bf',rarity:'Moss Crab Drop',sound:'heavy'},
  spark_staff:{id:'spark_staff',name:'Spark Staff',icon:'✺',design:'sparkStaff',type:'ranged',damage:1,cooldown:.48,speed:7.7,life:1.5,pellets:2,spread:.18,color:'#ffcf7e',rarity:'Spark Moth Drop',sound:'arc'},
  gear_saw:{id:'gear_saw',name:'Gear Saw',icon:'⚙',design:'gearSaw',type:'melee',damage:2,cooldown:.24,reach:40,color:'#e6b57d',rarity:'Gear Crawler Drop',sound:'saw'},
  link_lance:{id:'link_lance',name:'Link Lance',icon:'↔',design:'linkLance',type:'melee',damage:3,cooldown:.46,reach:98,color:'#80e8d5',rarity:'Chapter 6 / Mission 34',sound:'arc'},
  recursion_prism:{id:'recursion_prism',name:'Recursion Prism',icon:'◇',design:'recursionPrism',type:'ranged',damage:2,cooldown:.62,speed:8.4,life:1.6,pellets:3,spread:.16,color:'#d2a3ff',rarity:'Chapter 7 / Mission 40',sound:'arc'},
  graph_trident:{id:'graph_trident',name:'Graph Trident',icon:'Ψ',design:'graphTrident',type:'ranged',damage:3,cooldown:.55,speed:10,life:1.45,pierce:2,color:'#91e3a1',rarity:'Chapter 8 / Mission 46',sound:'heavy'},
  data_blade:   {id:'data_blade',name:'Data Blade',icon:'✦',design:'blade',type:'melee', damage:1,cooldown:.34,reach:48,color:'#78d7ff',rarity:'Starter'},
  byte_dagger:  {id:'byte_dagger',name:'Byte Dagger',icon:'†',design:'dagger',type:'melee', damage:1,cooldown:.18,reach:36,color:'#7dffae',rarity:'Mob Drop'},
  pulse_wand:   {id:'pulse_wand',name:'Pulse Wand',icon:'◈',design:'wand',type:'ranged',damage:1,cooldown:.32,speed:7.4,life:2.0,color:'#8de7ff',rarity:'Mob Drop'},
  logic_spear:  {id:'logic_spear',name:'Logic Spear',icon:'↟',design:'spear',type:'melee', damage:2,cooldown:.46,reach:76,color:'#ffe274',rarity:'Mob Drop'},
  xor_saber:    {id:'xor_saber',name:'XOR Saber',icon:'✧',design:'saber',type:'melee', damage:2,cooldown:.30,reach:60,color:'#65e7ff',rarity:'Boss Drop'},
  nand_blaster: {id:'nand_blaster',name:'NAND Blaster',icon:'▰',design:'blaster',type:'ranged',damage:2,cooldown:.50,speed:7.0,life:2.2,color:'#ffad55',rarity:'Boss Drop'},
  cache_hammer: {id:'cache_hammer',name:'Cache Hammer',icon:'◆',design:'hammer',type:'melee', damage:3,cooldown:.64,reach:58,color:'#c77dff',rarity:'Boss Drop'},
  storage_rifle:{id:'storage_rifle',name:'Storage Rifle',icon:'⌁',design:'rifle',type:'ranged',damage:2,cooldown:.26,speed:9.0,life:2.0,color:'#7dffae',rarity:'Boss Drop'},
  parity_edge:  {id:'parity_edge',name:'Parity Edge',icon:'✣',design:'edge',type:'melee', damage:4,cooldown:.38,reach:72,color:'#ff8fd8',rarity:'Boss Drop'},
  append_axe:   {id:'append_axe',name:'Append Axe',icon:'+',design:'appendAxe',type:'melee',damage:2,cooldown:.46,reach:60,color:'#66f0a7',rarity:'Mastery 4'},
  slice_scythe: {id:'slice_scythe',name:'Slice Scythe',icon:'[:]',design:'sliceScythe',type:'melee',damage:2,cooldown:.40,reach:90,color:'#c887ff',rarity:'Mastery 10'},
  index_bow:    {id:'index_bow',name:'Index Bow',icon:'[0]',design:'indexBow',type:'ranged',damage:1,cooldown:.22,speed:10.2,life:2.0,color:'#62b8ff',rarity:'Mastery 16'},
  extend_launcher:{id:'extend_launcher',name:'Extend Launcher',icon:'EXT',design:'extendLauncher',type:'ranged',damage:1,cooldown:.56,speed:8.0,life:1.8,pellets:3,spread:.12,color:'#ffb45f',rarity:'Mastery 22'},
  sort_disc:    {id:'sort_disc',name:'Sort Disc',icon:'SRT',design:'sortDisc',type:'ranged',damage:2,cooldown:.42,speed:8.8,life:1.7,pierce:2,color:'#ffe36b',rarity:'Mastery 28'}
});
const BOSS_WEAPON_BY_WORLD = ['xor_saber','nand_blaster','cache_hammer','storage_rifle','parity_edge','link_lance','recursion_prism','graph_trident'];
const MOB_WEAPON_DROPS = Object.freeze({
  crab:{weapon:'stack_mace',minLevel:2,killThreshold:2},
  moth:{weapon:'spark_staff',minLevel:1,killThreshold:2},
  crawler:{weapon:'gear_saw',minLevel:3,killThreshold:2},
  slime:{weapon:'byte_dagger',minLevel:0,killThreshold:3},
  bat:{weapon:'pulse_wand',minLevel:1,killThreshold:2},
  bug:{weapon:'logic_spear',minLevel:2,killThreshold:2}
});
const MASTERY_WEAPON_REWARDS = Object.freeze({4:'append_axe',10:'slice_scythe',16:'index_bow',22:'extend_launcher',28:'sort_disc',34:'link_lance',40:'recursion_prism',46:'graph_trident'});

/* ------------------------ List Companions ----------------- */
const PETS = Object.freeze({
  index_fox:{id:'index_fox',name:'Index Fox',icon:'[0]',color:'#69c8ff',perk:'Loot Magnet',description:'Fetches weapon drops up to 300 pixels away without changing your equipped weapon.',pickupBonus:30},
  append_slime:{id:'append_slime',name:'Append Slime',icon:'APP',color:'#72f0a6',perk:'Healing Bloom',description:'Restores one heart every 16 seconds when injured; bonus healing after three mob defeats.',healEvery:3},
  slice_owl:{id:'slice_owl',name:'Slice Owl',icon:'[:]',color:'#c38aff',perk:'Projectile Guard',description:'Intercepts one nearby enemy projectile every 8 seconds; also reduces dash cooldown.',dashScale:.82},
  sort_bot:{id:'sort_bot',name:'Sort Bot',icon:'SRT',color:'#ffe36b',perk:'Overclock',description:'Overclocks attacks for 3 seconds every 12 seconds of nearby combat.',attackScale:.9}
});
const PET_IDS=Object.freeze(Object.keys(PETS));
const DEFAULT_PET_ID='index_fox';
