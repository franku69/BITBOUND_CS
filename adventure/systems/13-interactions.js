/* ------------------------ Particles ------------------------- */
function burst(x, y, color, n = 10) {
  const capacity = Math.max(0, PERF.maxParticles - state.particles.length);
  n = Math.min(capacity, Math.ceil(n * PERF.particleScale));
  for (let i = 0; i < n; i++) state.particles.push(particlePool.acquire({
    x,
    y,
    vx: (Math.random() - .5) * 4,
    vy: (Math.random() - .8) * 4,
    life: .5 + Math.random() * .7,
    color,
    size: 2 + Math.floor(Math.random() * 4)
  }));
}
function updateParticles(dt) {
  for (const p of state.particles) {
    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;
    p.vy += .12 * 60 * dt;
    p.life -= dt;
  }
  compactInPlace(state.particles, p => p.life > 0, p => particlePool.release(p));
}
/* ------------------------ Interactables --------------------- */ // Six fixed landmarks per world: reuse their rectangles for physics and drawing.
function landmarkRects() {
  if (!state.world.landmarks) {
    const shrines = SHRINE_COLS.map( (c, index) => ({
      x: c * TILE - 20,
      y: surfaceAt(c) * TILE - 68,
      w: 40,
      h: 68,
      type: 'shrine',
      index
    }));
    state.world.landmarks = {
      shrines,
      terminal: {
        x: TERMINAL_COL * TILE - 26,
        y: surfaceAt(TERMINAL_COL) * TILE - 78,
        w: 52,
        h: 78,
        type: 'terminal'
      },
      portal: {
        x: PORTAL_COL * TILE - 30,
        y: surfaceAt(PORTAL_COL) * TILE - 96,
        w: 60,
        h: 96,
        type: 'portal'
      }
    };
  }
  return state.world.landmarks;
}
function shrineRect(i) {
  return landmarkRects().shrines[i];
}
function terminalRect() {
  return landmarkRects().terminal;
}
function portalRect() {
  return landmarkRects().portal;
}
function previousShrinePending(index) {
  for (let i = 0; i < index; i++) if (!state.solved[state.level][i]) return true;
  return false;
}
const interactionBounds = {
  x: 0,
  y: 0,
  w: 0,
  h: 0
};
function updateInteractable() {
  state.currentInteract = null;
  const p = interactionBounds;
  p.x = player.x - 14;
  p.y = player.y - 18;
  p.w = player.w + 28;
  p.h = player.h + 36;
  for (let i = 0; i < 4; i++) {
    const s = shrineRect(i);
    if (rects(p, s)) {
      state.currentInteract = s;
      break;
    }
  }
  if (trailStageStatus.level !== state.level) refreshTrailStatus();
  if (!state.currentInteract) {
    for (let i = 0; i < 4; i++) {
      if (trailStageStatus.pending[i]) {
        const sentry = trailSentryRect(i);
        if (rects(p, sentry)) {
          state.currentInteract = sentry;
          break;
        }
      }
    }
  }
  if (!state.currentInteract) {
    const npc = mentorRect();
    if (npc && rects(p, npc)) state.currentInteract = npc;
  }
  if (!state.currentInteract) {
    const cage = storyCageRect();
    if (cage && rects(p, cage)) state.currentInteract = cage;
  }
  if (!state.currentInteract) {
    const t = terminalRect();
    if (rects(p, t)) state.currentInteract = t;
  }
  if (!state.currentInteract) {
    const po = portalRect();
    if (rects(p, po)) state.currentInteract = po;
  }
  if (!state.currentInteract) {
    for (const c of state.chests) {
      if (!c.opened && rects(p, c)) {
        state.currentInteract = c;
        break;
      }
    }
  }
  if (state.currentInteract) {
    let txt = 'INTERACT';
    const o = state.currentInteract;
    if (o.type === 'shrine') {
      const blocked = previousShrinePending(o.index);
      txt = state.solved[state.level][o.index] ? 'CORE RESTORED': blocked ? 'SHRINE LOCKED — CLEAR PREVIOUS SHRINE': 'ACTIVATE KNOWLEDGE SHRINE';
    }
    if (o.type === 'terminal') txt = allCores() ? 'OPEN ASSESSMENT TERMINAL': `TERMINAL LOCKED — ${solvedCoreCount()}/4 CORES`;
    if (o.type === 'portal') txt = state.bossDefeated[state.level] ? 'ENTER DATA PORTAL': 'PORTAL SEALED — DEFEAT BOSS';
    if (o.type === 'trailSentry') txt = `STAGE ${o.stage} LESSON SENTRY — ANSWER EVERY SEAL`;
    if (o.type === 'mentor') txt = 'TALK TO BYTE — LEARN THE NEXT CONCEPT';
    if (o.type === 'prisoners') txt = plotState().cageKey ? 'UNLOCK THE PRISONERS — WARDEN KEY': 'TALK TO THE PRISONERS';
    if (o.type === 'chest') txt = 'OPEN DATA CACHE';
    domWrites.text(UI.interactText, txt);
    domWrites.toggle(UI.interactPrompt, 'hidden', false);
  } else domWrites.toggle(UI.interactPrompt, 'hidden', true);
}
function interact() {
  if (state.paused || !state.currentInteract) return;
  ensureAudio();
  const o = state.currentInteract;
  if (o.type === 'trailSentry') {
    requireWorldLessons(o.stage);
  } else if (o.type === 'prisoners') {
    talkToPrisoners();
  } else if (o.type === 'mentor') {
    if (o.ending) openChapterEnding(); else openMentor(o.id);
  } else if (o.type === 'shrine') {
    if (state.solved[state.level][o.index]) {
      toast('This Knowledge Core is already restored.', '#9bdcff');
      return;
    }
    if (previousShrinePending(o.index)) {
      const first = state.solved[state.level].findIndex(v => !v);
      toast(`This shrine is locked. Follow the GOLD beacon to Shrine ${first+1} first.`, '#ffcf84');
      return;
    }
    if (!requireWorldLessons(o.index + 1)) return;
    openShrine(o.index);
  } else if (o.type === 'terminal') {
    if (!allCores()) {
      toast(`Recover all 4 Knowledge Cores first (${solvedCoreCount()}/4).`, '#ffcf84');
      return;
    }
    openAssessment();
  } else if (o.type === 'portal') {
    if (!state.bossDefeated[state.level]) {
      toast('The portal is sealed by the world boss.', '#ff9c9c');
      return;
    }
    nextWorld();
  } else if (o.type === 'chest') {
    o.opened = true;
    markStoryChanged();
    state.torches += 2;
    state.score += 20;
    player.health = Math.min(MAX_HEALTH, player.health + 1);
    sfx.chest();
    burst(o.x + 13, o.y + 10, '#ffd166', 15);
    toast('DATA CACHE: +2 torches, +20 score.', '#ffd166');
    updateHotbar();
  }
}
