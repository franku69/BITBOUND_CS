/* ------------------------ List Basics World Model ---------- */
const QUESTIONS = window.BitboundQuestions;
if (!QUESTIONS) throw new Error('questions.js must load before game.js.');
QUESTIONS.validate();
const WORLD_LESSONS = QUESTIONS.lessons;
function makeShrine(questionId, localIndex) {
  const item = QUESTIONS.get(questionId);
  return Object.freeze({ ... item, title: `SHRINE ${localIndex + 1} — ${item.topic.toUpperCase()}` });
}
const worlds = Object.freeze(WORLD_LESSONS.map( (lesson, level) => {
  const base = WORLD_PALETTES[level];
  const questionIds = QUESTIONS.worldIds[level];
  return Object.freeze({
    ... base,
    name: QUESTIONS.story.chapters[level].region || lesson.name,
    subtitle: lesson.subtitle,
    boss: QUESTIONS.story.chapters[level].boss || lesson.boss,
    runnerMission: lesson.mission,
    guide: lesson.guide,
    questionIds,
    shrines: Object.freeze(questionIds.slice(0, 4).map(makeShrine))
  });
}));
const state = CampaignModel.createCampaignState({ worldCount: worlds.length, defaultPetId: DEFAULT_PET_ID });
const player = CampaignModel.createPlayerState({ maxHealth: MAX_HEALTH, airJumps: MOBILITY.airJumps });
const pet = { x: 82, y: 0, phase: 0 };
const playerAnimator = new window.BitboundPlayerAnimation.PlayerAnimator();
const APPEARANCE_PALETTES = {
  skin: ['#f4d2b8', '#e7b58b', '#c98b62', '#a96643', '#7a452e', '#4e2e22'],
  hair: ['#20160f', '#4a2c1b', '#8b542e', '#d19a4a', '#d8d2c2', '#151a25', '#6f3a80', '#2e6c68'],
  eyes: ['#24170f', '#315c8a', '#3b774d', '#8a5d2a', '#6e3c87', '#b7d7e8'],
  outfit: ['#344c78', '#7b3048', '#2f6a55', '#765a2f', '#4c3b78', '#3c5d67', '#8a3f2a', '#424b5a'],
  accent: ['#63dfff', '#ffd166', '#ff7a9e', '#7dff9b', '#c77dff', '#ff9a4b', '#e7edf7', '#64f0d0']
};
const DEFAULT_APPEARANCE = {
  skin: '#e7b58b',
  hair: '#20160f',
  eyes: '#315c8a',
  outfit: '#344c78',
  accent: '#63dfff',
  hairStyle: 'short',
  outfitStyle: 'armor'
};
function cloneAppearance(a) {
  return { ... DEFAULT_APPEARANCE, ... (a || {}) };
}
state.appearance = cloneAppearance(DEFAULT_APPEARANCE);
const enemyIndex = new SpatialHash1D(128);
const activeEnemyBuffer = [];
const particlePool = new ObjectPool( () => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  color: '#fff',
  size: 2
}), (particle, seed) => {
  particle.x = seed.x;
  particle.y = seed.y;
  particle.vx = seed.vx;
  particle.vy = seed.vy;
  particle.life = seed.life;
  particle.color = seed.color;
  particle.size = seed.size;
}, 256);
function queueProjectile(projectile) {
  return pushBounded(state.projectiles, projectile, PERF.maxProjectiles, { replace: item => item.alive && !item.power });
}
// At most 6 MiB on low-power devices / 7 MiB on standard devices (RGBA pixels).
const terrainCache = new TerrainCache({
  tileSize: TILE,
  chunkTiles: 8,
  limit: LOW_POWER ? 24: 28,
  createSurface(width, height) {
    const surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;
    return surface;
  },
  paintTile(target, c, r, id, theme) {
    drawTile(c, r, id, theme, target);
  }
});
