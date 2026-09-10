const {
  compactInPlace,
  pushBounded,
  ObjectPool,
  LruCache,
  SpatialHash1D,
  DomWriteCache
} = window.BitboundCore;
const {
  QUALITY,
  FixedStepClock,
  FrameScheduler,
  QualityGovernor
} = window.BitboundPerformance;
const { TerrainCache } = window.BitboundTerrain;
const domWrites = new DomWriteCache();
const $ = (id) => document.getElementById(id);
const canvas = $('game');
const qualityOverride = new URLSearchParams(location.search).get('quality');
const automaticLowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches;
const LOW_POWER = qualityOverride === 'low' || (qualityOverride !== 'high' && automaticLowPower);
if (LOW_POWER) {
  canvas.width = 960;
  canvas.height = 540;
}
document.documentElement.classList.toggle('low-fx', LOW_POWER);
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
ctx.imageSmoothingEnabled = false;
const UI = {
  hud: $('hud'),
  hotbar: $('hotbar'),
  hudWorld: $('hudWorld'),
  hudTitle: $('hudTitle'),
  hudPilot: $('hudRunner'),
  questTitle: $('questTitle'),
  questText: $('questText'),
  hudHearts: $('hudHearts'),
  hudTime: $('hudTime'),
  hudAcademicPoints: $('hudAcademicPoints'),
  hudAttemptStatus: $('hudAttemptStatus'),
  interactPrompt: $('interactPrompt'),
  interactText: $('interactText'),
  toast: $('toast'),
  bossBar: $('bossBar'),
  bossName: $('bossName'),
  bossFill: $('bossFill'),
  start: $('startScreen'),
  startBtn: $('startBtn'),
  startError: $('startError'),
  intro: $('worldIntro'),
  introNumber: $('introNumber'),
  introTitle: $('introTitle'),
  introSubtitle: $('introSubtitle'),
  introPilot: $('introRunner'),
  introMission: $('introMission'),
  introBtn: $('introBtn'),
  puzzle: $('puzzleOverlay'),
  puzzleClose: $('puzzleClose'),
  puzzleEyebrow: $('puzzleEyebrow'),
  puzzleTitle: $('puzzleTitle'),
  puzzleLesson: $('puzzleLesson'),
  puzzleQuestion: $('puzzleQuestion'),
  puzzleOptions: $('puzzleOptions'),
  puzzleFeedback: $('puzzleFeedback'),
  mentor: $('mentorOverlay'),
  assess: $('assessmentOverlay'),
  assessClose: $('assessmentClose'),
  assessTitle: $('assessmentTitle'),
  assessBody: $('assessmentBody'),
  assessFeedback: $('assessmentFeedback'),
  guide: $('guideOverlay'),
  guideClose: $('guideClose'),
  guideWorld: $('guideWorld'),
  guideTabs: $('guideTabs'),
  guideContent: $('guideContent'),
  help: $('helpOverlay'),
  helpClose: $('helpClose'),
  unstuckBtn: $('unstuckBtn'),
  death: $('deathOverlay'),
  respawnBtn: $('respawnBtn'),
  deathCheckpoint: $('deathCheckpoint'),
  deathNextObjective: $('deathNextObjective'),
  deathInstruction: $('deathInstruction'),
  missionCompass: $('missionCompass'),
  objectiveDirection: $('objectiveDirection'),
  objectiveTitle: $('objectiveTitle'),
  objectiveAction: $('objectiveAction'),
  objectiveDistance: $('objectiveDistance'),
  routeTrack: $('routeTrack'),
  routePlayer: $('routePlayer'),
  respawnBanner: $('respawnBanner'),
  respawnBannerTitle: $('respawnBannerTitle'),
  respawnBannerText: $('respawnBannerText'),
  characterPreview: $('characterPreview'),
  hairStyle: $('hairStyle'),
  outfitStyle: $('outfitStyle'),
  skinSwatches: $('skinSwatches'),
  hairSwatches: $('hairSwatches'),
  eyeSwatches: $('eyeSwatches'),
  outfitSwatches: $('outfitSwatches'),
  accentSwatches: $('accentSwatches'),
  randomizeCharacter: $('randomizeCharacter'),
  final: $('finalOverlay'),
  reportTeam: $('reportTeam'),
  reportTime: $('reportTime'),
  reportAcademicPoints: $('reportAcademicPoints'),
  reportWrongAttempts: $('reportWrongAttempts'),
  reportRank: $('reportRank'),
  reportBestChain: $('reportBestChain'),
  instructor: $('instructorOverlay'),
  instructorClose: $('instructorClose'),
  answerKey: $('answerKey'),
  healBtn: $('healBtn'),
  coresBtn: $('coresBtn'),
  assessmentBtn: $('assessmentBtn'),
  bossBtn: $('bossBtn'),
  nextBtn: $('nextBtn'),
  torchCount: $('torchCount'),
  weaponSlot: $('weaponSlot'),
  weaponIcon: $('weaponIcon'),
  weaponName: $('weaponName'),
  weaponCount: $('weaponCount'),
  powerSlot: $('powerSlot'),
  powerIcon: $('powerIcon'),
  powerName: $('powerName'),
  powerStatus: $('powerStatus'),
  powerLevelBadge: $('powerLevelBadge'),
  powerCooldownFill: $('powerCooldownFill'),
  audioPanel: $('audioPanel'),
  musicToggle: $('musicToggle'),
  sfxToggle: $('sfxToggle'),
  mobilityHud: $('mobilityHud'),
  dashStatus: $('dashStatus'),
  airJumpStatus: $('airJumpStatus'),
  campaignHud: $('campaignHud'),
  campaignCount: $('campaignCount'),
  campaignFill: $('campaignFill'),
  hudStreak: $('hudStreak'),
  rewardBanner: $('rewardBanner'),
  rewardTitle: $('rewardTitle'),
  rewardMeta: $('rewardMeta')
};
// Cache static DOM collections once instead of querying the document every frame.
UI.slots = [... document.querySelectorAll('.slot')];
UI.routeNodes = [... UI.routeTrack.querySelectorAll('.route-node')];
UI.overlays = [... document.querySelectorAll('.overlay')];
UI.petOptions = [... document.querySelectorAll('.pet-option')];
UI.performanceMode = $('performanceMode');
UI.petHud = $('petHud');
UI.petHudIcon = $('petHudIcon');
UI.petHudName = $('petHudName');
UI.petHudPerk = $('petHudPerk');
const W = canvas.width;
const H = canvas.height;
// Visual quality changes leave combat limits and physics unchanged.
const PERF = { simulationRange: W * 1.6 };
const frameGovernor = new QualityGovernor();
function applyQuality(mode) {
  const profile = QUALITY[mode];
  Object.assign(PERF, {
    mode,
    targetFps: profile.fps,
    frameMs: 1000 / profile.fps,
    uiInterval: profile.uiInterval,
    maxParticles: profile.particles,
    maxProjectiles: profile.projectiles,
    maxLoot: profile.loot,
    particleScale: profile.particleScale,
    starCount: profile.stars,
    richFx: profile.richFx
  });
  document.documentElement.classList.toggle('low-fx', mode !== 'standard');
  document.documentElement.classList.toggle('eco-fx', mode === 'eco');
  refreshPerformanceLabel();
}
function refreshPerformanceLabel() {
  domWrites.text(UI.performanceMode, `PERFORMANCE MODE: ${PERF.mode.toUpperCase()} (${PERF.targetFps} FPS)`);
}
function reduceVisualLoad() {
  if (PERF.mode === 'eco') return;
  applyQuality(PERF.mode === 'standard' ? 'low': 'eco');
  frameGovernor.reset();
}
applyQuality(LOW_POWER ? 'low': 'standard');
// Composition adapter: data stays in the isolated game-config domain.
const {
  TILE,
  COLS,
  ROWS,
  GRAVITY,
  SHRINE_COLS,
  TERMINAL_COL,
  PORTAL_COL,
  MAX_HEALTH,
  CLASSROOM_RACE,
  MOBILITY,
  BOSS_PROFILES,
  Tile,
  SOLID,
  MINEABLE,
  WEAPONS,
  BOSS_WEAPON_BY_WORLD,
  MOB_WEAPON_DROPS,
  MASTERY_WEAPON_REWARDS,
  PETS,
  PET_IDS,
  DEFAULT_PET_ID
} = GameConfig;
const ACADEMIC_SCORING = Object.freeze({ maximumPoints: window.BitboundQuestions.bank.length, freeWrongAttempts: 2, pointsLostPerExtraWrong: 0 });
function bossMaxHp(level = state.level) {
  return CLASSROOM_RACE.bossHp[clamp(level, 0, CLASSROOM_RACE.bossHp.length - 1)];
}
function bossProfile(level = state.level) {
  return level === 7 && STORY_BOSS_PROFILES[plotState().finalPhase] || BOSS_PROFILES[clamp(level, 0, BOSS_PROFILES.length - 1)];
}
function bossFightActive() {
  return !!(state.boss && state.boss.active && !state.boss.dead && !state.bossDefeated[state.level]);
}
