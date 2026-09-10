const ENCOUNTER_BANK = Object.freeze(QUESTIONS.encounters);
const RUNE_SET_SIZE = 4;
const learningPath = LearningModel.createLearningPath(ENCOUNTER_BANK, worlds.length, RUNE_SET_SIZE);
const ENCOUNTER_BY_ID = learningPath.byId;
const ENCOUNTER_WORLDS = learningPath.worlds;
const TRAIL_SENTRIES = ['slime', 'frog', 'crab', 'moth'];
function worldLessonProgress(level = state.level, stage = 4) {
  return learningPath.progress(level, state.encounterRead, stage);
}
function runeLessonSet(level, limitStage = 4) {
  return learningPath.lessonSet(level, state.encounterRead, limitStage);
}
function trailSentryRect(index) {
  if (!state.world.trailSentries) state.world.trailSentries = [];
  if (state.world.trailSentries[index]) return state.world.trailSentries[index];
  const col = SHRINE_COLS[index] - 3, spec = MOBS[TRAIL_SENTRIES[index]];
  return state.world.trailSentries[index] = {
    id: 'sentry-' + state.level + '-' + index,
    type: 'trailSentry',
    mobType: TRAIL_SENTRIES[index],
    stage: index + 1,
    col,
    x: col * TILE,
    y: surfaceAt(col) * TILE - spec.h,
    w: spec.w,
    h: spec.h,
    index
  };
}
function lessonSentry(stage) {
  const r = trailSentryRect(clamp(stage - 1, 0, 3));
  return {
    ... r,
    type: r.mobType,
    alive: true,
    questionMob: true,
    lessonSentry: true,
    hp: 1,
    maxHp: 1,
    vx: 0,
    vy: 0
  };
}
function requireWorldLessons(stage = 4) {
  const progress = worldLessonProgress(state.level, stage);
  if (!progress.remaining) return true;
  if (!state.started || state.paused || bossFightActive() || plotState().scene) return false;
  const enemy = lessonSentry(progress.next.stage);
  openQuestionEncounter(enemy, { guard: true, limitStage: stage });
  return false;
}
let trailStageStatus = { level: - 1, pending: [] };
function refreshTrailStatus() {
  trailStageStatus = { level: state.level, pending: [1, 2, 3, 4].map(stage => worldLessonProgress(state.level, stage).remaining > 0) };
}
function drawTrailSentries() {
  if (trailStageStatus.level !== state.level) refreshTrailStatus();
  for (let i = 0; i < 4; i++) {
    if (!trailStageStatus.pending[i]) continue;
    const e = trailSentryRect(i);
    if (!onScreen(e.x, e.y - 32, e.w, e.h + 32)) continue;
    const phase = mentorMotionQuery.matches ? 0: Math.floor(state.gameTime * 6 + i) % 4;
    creatureSprites.draw(ctx, e.mobType, e.x - 4, e.y - 5, e.w + 8, e.h + 5, phase, player.x < e.x ? - 1: 1);
    ctx.fillStyle = '#072332';
    ctx.fillRect(e.x - 14, e.y - 33, 60, 19);
    ctx.strokeStyle = '#80d8cb';
    ctx.strokeRect(e.x - 14, e.y - 33, 60, 19);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#e3fff1';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE ' + (i + 1), e.x + 16, e.y - 20);
    ctx.textAlign = 'left';
  }
}
