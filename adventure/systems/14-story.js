/* Story progression is separate from lesson checks, combat and presentation.
   Only explicit actions advance flags. The snapshot contains IDs, never callbacks. */
const { PLOT_FLAGS, FINAL_PHASES, newPlot } = PlotModel;
function plotState() {
  return state.plot || (state.plot = newPlot());
}
function validatePlot(raw, saved) {
  return PlotModel.validatePlot(raw, saved, QUESTIONS.story.scenes);
}
const plotUI = {
  overlay: $('storyOverlay'),
  title: $('storyTitle'),
  speaker: $('storySpeaker'),
  text: $('storyText'),
  page: $('storyPage'),
  picture: $('storyPicture'),
  actions: $('storyActions'),
  next: $('storyNext'),
  still: $('storyStill'),
  hint: $('storyHint')
};
const storyContext = plotUI.picture.getContext('2d');
let sceneTimer = null, sceneEpoch = 0, sceneArt = 'trail', scenePageData = {}, storyArtFailed = false;
const storyPortrait = $('storyPortrait');
function paintStoryFrame(art, time, ambient = 0) {
  if (storyArtFailed) return false;
  try {
    drawStoryPicture(storyContext, art, time, scenePageData, ambient);
    if (scenePageData.byteExit && time >= .82) {
      AudioEngine.setDialogue(false);
      storyPortrait.hidden = true;
      $('storyDialogue').classList.remove('has-portrait');
    }
    if (!storyPortrait.hidden) paintStoryPortrait(scenePageData, time);
    return true;
  } catch (error) {
    storyArtFailed = true;
    plotUI.picture.hidden = true;
    stopStoryAnimation();
    console.warn('Story illustration unavailable; narrative controls remain active.', error);
    return false;
  }
}
function stopStoryAnimation() {
  sceneEpoch++;
  if (sceneTimer !== null) window.clearTimeout(sceneTimer);
  sceneTimer = null;
}
// One bounded clock: full action at 20 FPS, then a gentle 8 FPS reading idle.
// Hidden tabs and Pause stop it. Resuming continues from the same instant.
let storyPlayback = null;
function storyDuration(art, page) {
  if (Number.isFinite(page.durationMs)) return clamp(page.durationMs, 4000, 16000);
  if (page.byteExit) return 12000;
  if (page.forgeAction) return 8000;
  if (page.rivalBeat === 9) return 12000;
  if (art === 'impact') return 10500;
  if (page.beat === 'falseForever') return 14000;
  if (['cloak', 'ribbon', 'mend', 'mendTogether', 'poison'].includes(page.beat)) return 8500;
  return page.beat && STORY_BEATS[page.beat] ? 6500: ['arrival', 'reunion', 'impact', 'leap', 'collapse', 'greed', 'fusion'].includes(art) ? 7200: 4800;
}
function scheduleStoryPlayback() {
  if (!storyPlayback || storyPlayback.paused || document.hidden) return;
  const epoch = sceneEpoch, p = storyPlayback;
  p.last = performance.now();
  const tick = () => {
    if (epoch !== sceneEpoch || p !== storyPlayback || p.paused || document.hidden) return;
    const progress = Math.min(1, p.elapsed / p.duration), ambient = Math.max(0, (p.elapsed - p.duration) / 1000);
    if (!paintStoryFrame(p.art, progress, ambient)) return;
    playStoryTimelineCue(scenePageData, p.previous, progress);
    p.previous = progress;
    const interval = progress < 1 ? 50: 125;
    sceneTimer = window.setTimeout( () => {
      const now = performance.now();
      p.elapsed += Math.max(interval, now - p.last);
      p.last = now;
      tick();
    }, interval);
  };
  tick();
}
function animateStoryPicture(art) {
  stopStoryAnimation();
  sceneArt = art;
  storyPlayback = {
    art,
    duration: storyDuration(art, scenePageData),
    elapsed: 0,
    previous: 0,
    paused: false
  };
  plotUI.still.textContent = 'Pause animation';
  if (reduceMentorMotion()) {
    storyPlayback.paused = true;
    storyPlayback.elapsed = storyPlayback.duration;
    plotUI.still.textContent = 'Play animation';
    paintStoryFrame(art, 1);
    return;
  }
  scheduleStoryPlayback();
}
let lastStoryCue = '';
function renderStoryPortrait(page) {
  storyPortrait.hidden = !DAWN_COMPANY.some(a => a.name === page.speaker) && page.speaker !== 'BYTE';
  $('storyDialogue').classList.toggle('has-portrait', !storyPortrait.hidden);
  if (!storyPortrait.hidden) paintStoryPortrait(page, 1);
}
function paintStoryPortrait(page, time = 1) {
  const index = DAWN_COMPANY.findIndex(a => a.name === page.speaker), g = storyPortrait.getContext('2d');
  g.clearRect(0, 0, 96, 144);
  g.imageSmoothingEnabled = false;
  g.fillStyle = index < 0 ? '#173641': DAWN_COMPANY[index].color + '18';
  g.fillRect(0, 0, 96, 144);
  // The portrait uses the same head, skeleton and equipment as the shot.
  const speaking = time < 1 && Math.floor(time * 18) % 4 !== 0;
  drawRigActor(g, {
    kind: index < 0 ? 'byte': 'ally',
    index: Math.max(0, index),
    x: 48,
    foot: 140,
    scale: 1.38,
    face: 1,
    motion: 'listen',
    phase: time % 1,
    mood: page.mood || 'calm',
    precise: true,
    elite: !!STORY_SHOTS[page.art]?.elite,
    armed: false,
    expression: { speaking, syllable: Math.floor(time * 32) % 4, blink: time < 1 && time % 0.4 > .385 }
  });
}
function playStoryCue(art) {
  if (lastStoryCue === art) return;
  lastStoryCue = art;
  const cues = {
    rescue: [{ freq: 520, dur: .07, gain: .023 }, { freq: 780, dur: .14, gain: .02 }],
    barrier: [{
      freq: 140,
      dur: .4,
      type: 'triangle',
      slide: 360,
      gain: .035
    }, {
      freq: 690,
      dur: .3,
      type: 'sine',
      slide: - 110,
      gain: .018
    }],
    barrierBreak: [{
      freq: 980,
      dur: .15,
      type: 'triangle',
      slide: - 440,
      gain: .035
    }, {
      freq: 140,
      dur: .3,
      type: 'sine',
      slide: - 70,
      gain: .035
    }],
    crown: [{
      freq: 170,
      dur: .25,
      type: 'triangle',
      slide: 210,
      gain: .03
    }],
    fusion: [{
      freq: 210,
      dur: .5,
      type: 'triangle',
      slide: - 100,
      gain: .035
    }]
  };
  if (cues[art]) AudioEngine.sequence(cues[art]);
}
function storyChoice(label, action) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.onclick = action;
  plotUI.actions.appendChild(b);
  return b;
}
function showPlotScene(id, resume = false) {
  if (id !== 'cell' && !QUESTIONS.story.scenes[id]) return;
  const p = plotState();
  if (!resume || p.scene !== id) {
    p.scene = id;
    p.scenePage = 0;
    markStoryChanged();
  }
  cacheStoryHero();
  closeMentor();
  for (const overlay of UI.overlays) if (overlay !== plotUI.overlay && overlay.classList.contains('show')) hide(overlay);
  show(plotUI.overlay);
  renderPlotScene();
  plotUI.title.focus?. ();
}
function renderPlotScene() {
  const p = plotState();
  AudioEngine.syncMusic();
  plotUI.actions.replaceChildren();
  plotUI.hint.textContent = 'Take your time. Save file keeps your place. Pause or resume the illustration anytime. Take as long as you like to read.';
  plotUI.next.hidden = false;
  plotUI.next.disabled = false;
  if (p.scene === 'cell') {
    renderPrison();
    return;
  }
  const scene = QUESTIONS.story.scenes[p.scene];
  if (!scene) return;
  const page = scene.pages[p.scenePage];
  plotUI.title.textContent = scene.title;
  const member = DAWN_COMPANY.find(a => a.name === page.speaker);
  plotUI.speaker.textContent = byteSays(page.speaker) + (member ? ' · ' + member.role: '');
  plotUI.text.textContent = byteSays(page.text);
  plotUI.page.textContent = `${p.scenePage+1} / ${scene.pages.length}`;
  plotUI.next.textContent = p.scenePage === scene.pages.length - 1 ? scene.finish: 'Next →';
  scenePageData = page;
  renderStoryPortrait(page);
  AudioEngine.setSpeaker(page.speaker);
  animateStoryPicture(page.art);
  playStoryCue(page.art);
}
function advancePlotScene() {
  const p = plotState();
  if (p.scene === 'cell' || !p.scene) return;
  const scene = QUESTIONS.story.scenes[p.scene];
  if (p.scenePage < scene.pages.length - 1) {
    p.scenePage++;
    markStoryChanged();
    renderPlotScene();
    return;
  }
  const id = p.scene;
  p.scene = null;
  p.scenePage = 0;
  stopStoryAnimation();
  AudioEngine.setDialogue(false);
  hide(plotUI.overlay);
  markStoryChanged();
  finishPlotScene(id);
}
function finishPlotScene(id) {
  const p = plotState();
  switch (id) {
    case 'origin':
    p.originSeen = true;
    showWorldIntro();
    break;
    case 'prisoners':
    p.prisonersMet = true;
    openAssessment();
    break;
    case 'rescue':
    p.partyFreed = true;
    grantWeapon('byte_dagger', { source: 'ROOK' });
    player.health = MAX_HEALTH;
    resetParty();
    break;
    case 'camp1':
    case 'camp2':
    case 'camp3':
    p.camps[Number(id.slice(- 1)) - 1] = true;
    break;
    case 'betrayal':
    p.betrayed = true;
    showPlotScene('cell');
    break;
    case 'escape':
    p.escaped = true;
    player.health = MAX_HEALTH;
    setCheckpoint(205, 'Prison escape');
    resetPlayer(true, 3);
    break;
    case 'rivals':
    p.rivalsSeen = true;
    p.finalPhase = 'paladin';
    startFinalBattle();
    break;
    case 'paladinFall':
    p.finalPhase = 'barrier';
    openAssessment();
    break;
    case 'barrier':
    p.finalPhase = 'demon';
    startFinalBattle();
    break;
    case 'fusion':
    p.fusionSeen = true;
    p.finalPhase = 'fused';
    startFinalBattle();
    break;
    case 'ending':
    p.immortal = true;
    p.finalPhase = 'complete';
    finishGame();
    break; }
  markStoryChanged();
  updateHud();
  canvas.focus?. ();
}
function startFinalBattle() {
  setCheckpoint(TERMINAL_COL + 4, 'Throne arena');
  resetPlayer(true, 3);
  spawnBoss();
  player.x = (TERMINAL_COL + 4) * TILE;
  state.needsRender = true;
}
function renderPrison() {
  const p = plotState();
  plotUI.title.textContent = 'The cell beneath Oathforge';
  plotUI.speaker.textContent = 'A locked door is still a problem';
  plotUI.page.textContent = 'Explore • forge • escape';
  plotUI.next.hidden = true;
  let text = 'BYTE lingered in the corridor, looking for a response you refused to give him. He nudged a fallen parchment with his shoe. A broken seal caught the torchlight: Veyr’s treasury. “So that was their price.” He kicked it under the door. “Four claims to one crown. They sold you cheaply.” The scroll stopped beside your knees. He backed away, then lifted from the floor as though the world owed him that convenience. “I am getting a snack. If you are breathing when I return, do it quietly.” You listened until the corridor was empty. Then you reached for the paper.';
  if (p.scrollRead) text = 'The scroll described a route: the catacombs beneath Oathforge, a chain of watch posts across the ravine, and the treasury beneath Veyr’s hall. Four different hands had written claims in the margin. You recognised Aster’s precise letters. Beside the old bones, someone had scratched another message: “Heat. Shape. Cool.” The cell had once been a smith’s punishment room. A hearth, an anvil, a water trough. A previous prisoner had left a way to think, if not a way out.';
  if (p.daggerFound) text = 'Boot pocket. Nobody checks boots. You eased out Rook’s little dagger and slipped its point beneath the corroded rivet holding your cuffs. A careful lever; a second try. The rivet gave before the blade did. You rubbed your wrists, then carried the dagger to the hearth. The door lock needed three teeth the blade did not yet have. “Axe for the big problems,” you whispered. “All right. This one is yours.”';
  if (p.forgeStep > 0) text = ['', 'You held the dagger’s edge over the old coals. Orange crept along the steel. You watched until it glowed evenly, then drew it out. The lock’s pattern had three notches; the anvil would keep the blade steady while you shaped them.', 'One careful blow for each notch. You checked the pattern between strokes instead of hitting harder. Three uneven teeth, but the spacing matched. The metal still needed cooling before it could bear the turn of the lock.'][p.forgeStep] || text;
  if (p.keyForged) text = 'The hot edge hissed in the trough. When the steam cleared, you lifted a key that still had Rook’s dagger grip. You ran a thumb beside the new teeth and thought of the nameless prisoner who had scratched instructions on the wall. “Thank you,” you told the bones. Then you went to the door.';
  plotUI.text.textContent = text;
  plotUI.hint.textContent = 'Your pack will be recovered after escape. This puzzle never removes your Python work or completed shrines.';
  scenePageData = {
    speaker: p.scrollRead ? 'Narrator': 'BYTE',
    mood: 'grin',
    hideByte: p.scrollRead,
    byteExit: !p.scrollRead,
    beat: p.daggerFound ? 'forge': p.scrollRead ? 'scroll': undefined,
    forgeStep: p.forgeStep,
    forgeAction: p.daggerFound ? ['inspect', 'heat', 'hammer', 'quench'][p.forgeStep]: undefined,
    art: 'prison'
  };
  renderStoryPortrait(scenePageData);
  AudioEngine.setDialogue(!p.scrollRead);
  animateStoryPicture('prison');
  if (!p.scrollRead) storyChoice('Read the discarded scroll', () => {
    p.scrollRead = true;
    markStoryChanged();
    renderPlotScene();
  }); else if (!p.daggerFound) storyChoice('Inspect your hidden dagger', () => {
    p.daggerFound = true;
    grantWeapon('byte_dagger', { equip: false, announce: false });
    markStoryChanged();
    renderPlotScene();
  }); else if (!p.keyForged) {
    ['Heat the blade', 'Hammer the notches', 'Quench in water'].forEach( (label, index) => storyChoice(label, () => forgePrisonKey(index)));
  } else storyChoice('Turn the key and leave the cell →', () => showPlotScene('escape'));
}
function forgePrisonKey(step) {
  const p = plotState();
  if (p.scene !== 'cell' || !p.scrollRead || !p.daggerFound || p.keyForged) return false;
  if (step !== p.forgeStep) {
    plotUI.hint.textContent = 'That would not hold its shape yet. Follow the note: Heat → Shape → Cool. Your work is still here.';
    return false;
  }
  p.forgeStep++;
  sfx.equip();
  if (p.forgeStep === 3) {
    p.keyForged = true;
    state.weapons = state.weapons.filter(id => id !== 'byte_dagger');
    normalizeWeaponState();
  }
  markStoryChanged();
  renderPlotScene();
  return true;
}
plotUI.next.onclick = advancePlotScene;
$('storySound').onclick = () => {
  ensureAudio();
  AudioEngine.toggleSfx();
  updateAudioButtons();
};
plotUI.still.onclick = () => {
  if (!storyPlayback) return;
  stopStoryAnimation();
  storyPlayback.paused = !storyPlayback.paused;
  plotUI.still.textContent = storyPlayback.paused ? 'Resume animation': 'Pause animation';
  if (!storyPlayback.paused) scheduleStoryPlayback();
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopStoryAnimation(); else if (plotUI.overlay.classList.contains('show')) scheduleStoryPlayback();
});
window.addEventListener('pagehide', stopStoryAnimation);
// Contain keyboard focus; game shortcuts must never open another overlay here.
plotUI.overlay.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [... plotUI.overlay.querySelectorAll('button:not([hidden]):not([disabled])')];
  if (!controls.length) return;
  const first = controls[0], last = controls.at(- 1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === plotUI.title)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
function resumePlot() {
  const p = plotState();
  if (p.scene) {
    showPlotScene(p.scene, true);
    return true;
  }
  if (p.betrayed && !p.escaped) {
    showPlotScene('cell');
    return true;
  }
  return false;
}
function plotCanExit() {
  const p = plotState();
  return state.bossDefeated[state.level] && (state.level !== 0 || p.partyFreed) && (state.level !== 3 || p.escaped);
}
function tryPlotExit() {
  const p = plotState();
  if (!state.bossDefeated[state.level]) return false;
  if (state.level === 0 && !p.partyFreed) {
    toast('Take the warden’s key back to the prisoners.', '#ffe092');
    return false;
  }
  if (state.level === 3 && !p.escaped) {
    showPlotScene(p.betrayed ? 'cell': 'betrayal');
    return false;
  }
  return true;
}
function storyCageRect() {
  if (state.level !== 0 || plotState().partyFreed) return null;
  if (!state.world.prisonCage) state.world.prisonCage = {
    type: 'prisoners',
    col: 181,
    x: 181 * TILE,
    y: surfaceAt(181) * TILE - 65,
    w: 126,
    h: 65
  };
  return state.world.prisonCage;
}
function talkToPrisoners() {
  const p = plotState();
  if (p.cageKey && state.bossDefeated[0]) {
    showPlotScene('rescue');
    return;
  }
  showPlotScene('prisoners');
}
function plotObjective() {
  const p = plotState();
  if (state.level === 0 && state.bossDefeated[0] && !p.partyFreed) return {
    col: 182,
    route: 'portal',
    short: 'FREE THE COMPANY',
    title: 'Unlock the Dawn Company’s cage',
    action: 'Return to the prisoners and press E / Use. You have the warden’s key.'
  };
  if (state.level === 3 && state.bossDefeated[3] && !p.escaped) return {
    col: PORTAL_COL,
    route: 'portal',
    short: 'MEET THE COMPANY',
    title: 'A toast at the portal',
    action: 'Your companions are waiting to celebrate. Press E / Use.'
  };
  if (state.level === 7 && p.finalPhase === 'paladin') return {
    col: 202,
    route: 'boss',
    short: 'FALLEN PALADIN',
    title: 'Defeat Aster, the Fallen Paladin',
    action: 'Jump the ground wave, dodge his charge and strike during recovery.'
  };
  if (state.level === 7 && p.finalPhase === 'barrier') return {
    col: TERMINAL_COL,
    route: 'terminal',
    short: 'DSA BARRIER',
    title: 'Break the shortest-route barrier',
    action: 'Press E / Use at the terminal. Solve the breadth-first search challenge.'
  };
  return null;
}
function drawStoryActors() {
  const cage = storyCageRect();
  if (cage && onScreen(cage.x, cage.y, cage.w, cage.h)) {
    ctx.fillStyle = '#142438';
    ctx.fillRect(cage.x - 3, cage.y - 4, cage.w + 6, cage.h + 4);
    for (let i = 0; i < 4; i++) ctx.drawImage(partyFrames[i][0], cage.x + 2 + i * 30, cage.y + 17, 30, 48);
    ctx.fillStyle = '#8993a2';
    for (let i = 0; i < 9; i++) ctx.fillRect(cage.x + i * 15, cage.y, 3, cage.h);
    ctx.fillRect(cage.x, cage.y, cage.w, 4);
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe19a';
    ctx.fillText(plotState().cageKey ? 'KEY OBTAINED — E / USE': 'DAWN COMPANY • PRISONERS', cage.x + cage.w / 2, cage.y - 9);
  }
  if (partyActive()) for (const a of partyActors) if (onScreen(a.x, a.y, 28, 46)) {
    drawRigActor(ctx, partyRig(a));
    drawPartyCombatEffect(a);
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = a.color;
    ctx.fillText(a.name, a.x + 14, a.y - 5);
  }
  if (state.level === 7 && plotState().finalPhase === 'barrier') {
    const x = 198 * TILE, y = surfaceAt(198) * TILE;
    if (onScreen(x - 90, y - 180, 180, 180)) drawArcaneBarrier(ctx, x, y - 87, 87, reduceMentorMotion() ? 0: state.gameTime, 0);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#c2f5e8';
    ctx.textAlign = 'center';
    ctx.fillText('BFS BARRIER — SOLVE TERMINAL', x, y - 172);
  }
  ctx.textAlign = 'left';
}
// Cues cross the same timeline markers as the visible strikes; no separate
// delayed timers survive a page change or backgrounded browser tab.
function playStoryTimelineCue(page, previous, now) {
  if (document.hidden) return;
  const cues = page.forgeAction === 'hammer' ? [[.272, 'heavy'], [.512, 'heavy'], [.752, 'heavy']]: page.forgeAction === 'quench' ? [[.54, 'arc']]: page.forgeAction === 'inspect' ? [[.6, 'shield']]: page.forgeAction ? []: page.fusionStage === 5 ? [[.43, 'shield'], [.54, 'arc'], [.88, 'heavy']]: page.byteExit ? [[.25, 'hardLand'], [.61, 'dash']]: page.rivalBeat === 9 ? [[.22, 'heavy'], [.37, 'arc'], [.48, 'heavy'], [.7, 'arc'], [.8, 'hardLand'], [.9, 'shield']]: page.art === 'impact' ? [[.562, 'heavy'], [.8492, 'heavy']]: page.art === 'leap' ? [[.23, 'dash'], [.66, 'heavy']]: page.beat === 'forge' && page.forgeStep === 1 ? [[.55 / 3, 'heavy'], [1.55 / 3, 'heavy'], [2.55 / 3, 'heavy']]: page.beat === 'poison' ? [[.77, 'hardLand']]: [];
  for (const [at, cue] of cues) if (previous < at && now >= at) playActionCue(cue);
}
