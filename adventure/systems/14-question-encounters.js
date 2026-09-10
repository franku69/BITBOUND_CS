/* Required wild encounters: a carrier's seal is broken by knowledge, not HP.
   UI completion is synchronous; optional finite art can never lock the answers. */
const encounterUI = {
  overlay: $('encounterOverlay'),
  title: $('encounterTitle'),
  intro: $('encounterIntro'),
  code: $('encounterCode'),
  prompt: $('encounterPrompt'),
  choices: $('encounterChoices'),
  feedback: $('encounterFeedback'),
  next: $('encounterContinue'),
  hint: $('encounterHint'),
  meta: $('encounterMeta'),
  portrait: $('encounterPortrait'),
  round: $('encounterRound'),
  save: $('encounterSave')
};
const questionDirector = {
  cooldown: 1.5,
  scan: 0,
  pending: null,
  active: null,
  reviewPosition: worlds.map( () => 0),
  distance: 0,
  lastX: 0
};
let encounterAnimation = null, encounterEpoch = 0, encounterArtFailed = false;
function stopEncounterAnimation() {
  encounterEpoch++;
  if (encounterAnimation !== null) window.clearTimeout(encounterAnimation);
  encounterAnimation = null;
}
function paintEncounter(progress = 1) {
  if (!questionDirector.active || encounterArtFailed) return;
  try {
    drawEncounterBattle(encounterUI.portrait.getContext('2d'), questionDirector.active, progress);
  } catch (error) {
    encounterArtFailed = true;
    encounterUI.portrait.hidden = true;
    stopEncounterAnimation();
    console.warn('Encounter art disabled; answer controls remain active.', error);
  }
}
function animateEncounter(visual) {
  stopEncounterAnimation();
  const active = questionDirector.active;
  if (!active) return;
  active.visual = visual;
  if (document.hidden) return;
  if (reduceMentorMotion()) {
    paintEncounter(1);
    return;
  }
  const epoch = encounterEpoch, start = performance.now(), duration = visual === 'intro' ? 750: visual === 'win' ? 950: 420;
  let count = 0;
  const frame = () => {
    if (epoch !== encounterEpoch || document.hidden || questionDirector.active !== active) return;
    const p = Math.min(1, Math.max(performance.now() - start, count * 50) / duration);
    paintEncounter(p);
    if (p < 1 && !encounterArtFailed) {
      count++;
      encounterAnimation = window.setTimeout(frame, 50);
    } else encounterAnimation = null;
  };
  frame();
}
function resetQuestionEncounters(fresh = false) {
  trailStageStatus.level = - 1;
  stopEncounterAnimation();
  questionDirector.cooldown = 1.5;
  questionDirector.scan = 0;
  questionDirector.pending = null;
  questionDirector.active = null;
  questionDirector.distance = 0;
  questionDirector.lastX = player.x;
  if (fresh) {
    state.encounterRead = {};
    questionDirector.reviewPosition = worlds.map( () => 0);
  }
}
function questionsAllowed(guard = false) {
  return state.started && !state.finished && !state.paused && !document.hidden && player.health > 0 && !(state.boss?.active && !state.boss.dead) && (guard || player.x < (TERMINAL_COL - 7) * TILE) && !plotState().scene && !UI.overlays.some(el => el.classList.contains('show')) && (guard || !playerInSanctuary()) && !questionDirector.active;
}
function runeProtects(enemy) {
  return !!(enemy?.alive && enemy.questionMob && !(state.boss?.active && !state.boss.dead));
}
function runeContact(enemy) {
  if (!runeProtects(enemy)) return false;
  if (questionsAllowed() && Math.abs(enemy.x - player.x) < 210 && Math.abs(enemy.y - player.y) < 150) openQuestionEncounter(enemy);
  return true;
}
// At most 40 items, only when an encounter opens: no shuffle, cursor reservation
// or per-frame sorting. Reopening a lesson cannot skip its prerequisite. Manual
// saves from older versions resume at the first unfinished lesson in this path.
function takeEncounterQuestion(world) {
  return learningPath.nextQuestion(world, state.encounterRead, questionDirector.reviewPosition[world]);
}
function openQuestionEncounter(enemy, options = {}) {
  if (!questionsAllowed(!!options.guard) || !enemy?.alive || !enemy.questionMob) return false;
  let set = runeLessonSet(state.level, options.limitStage || 4), review = !set.length;
  if (review) {
    const q = takeEncounterQuestion(state.level);
    if (!q) return false;
    set = [q];
  }
  questionDirector.pending = null;
  questionDirector.active = {
    enemy,
    question: set[0],
    set,
    round: 0,
    world: state.level,
    appearance: { ... state.appearance },
    correct: false,
    review,
    visual: 'intro'
  };
  enemy.quizWarning = 0;
  enemy.vx = 0;
  enemy.vy = 0;
  renderEncounterQuestion();
  AudioEngine.setDialogue(false);
  show(encounterUI.overlay);
  encounterUI.title.focus?. ();
  animateEncounter('intro');
  playActionCue('arc');
  return true;
}
function renderEncounterQuestion() {
  const active = questionDirector.active, { question, enemy } = active, progress = worldLessonProgress(active.world);
  active.correct = false;
  encounterUI.title.textContent = question.topic;
  encounterUI.meta.textContent = `${question.id.toUpperCase()} · WORLD ${active.world+1} · ${active.review?'REVIEW':'LESSON'} ${question.sequence}/${ENCOUNTER_WORLDS[active.world].length} · ${question.stageTitle}`;
  encounterUI.round.textContent = `ROUND ${active.round+1} / ${active.set.length} · WORLD LESSONS ${progress.done} / ${progress.total}`;
  encounterUI.intro.textContent = `${question.worldContext} ${enemy.lessonSentry?'The trail sentry':MOBS[enemy.type]?.name||'A rune creature'} carries ${active.set.length} lesson seals. Complete this set, then return to the trail. Each shrine requires its stage; every lesson is required before the boss.`;
  encounterUI.prompt.textContent = question.prompt;
  encounterUI.code.textContent = question.code;
  encounterUI.code.hidden = !question.code;
  encounterUI.feedback.textContent = 'The world is paused. A wrong answer costs no health. Read the clue, then try again.';
  encounterUI.next.disabled = true;
  encounterUI.next.textContent = active.round + 1 < active.set.length ? 'Next question →': 'Back to the trail →';
  encounterUI.hint.disabled = false;
  encounterUI.choices.replaceChildren();
  question.choices.forEach( (text, index) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String.fromCharCode(65 + index) + '. ' + text;
    b.dataset.choice = String(index);
    b.onclick = () => answerQuestionEncounter(index);
    encounterUI.choices.appendChild(b);
  });
  encounterUI.title.focus?. ();
}
function answerQuestionEncounter(index) {
  const active = questionDirector.active;
  if (!active || active.correct || !Number.isInteger(index) || index < 0 || index >= active.question.choices.length) return false;
  const correct = index === active.question.answer;
  for (const b of encounterUI.choices.children) {
    b.setAttribute('aria-pressed', 'false');
    delete b.dataset.result;
  }
  const button = encounterUI.choices.children[index];
  button.dataset.result = correct ? 'correct': 'incorrect';
  button.setAttribute('aria-pressed', 'true');
  encounterUI.feedback.textContent = (correct ? 'Correct — the seal breaks. ': 'Not yet. Read the explanation and choose again. ') + active.question.explanation;
  if (correct) {
    active.correct = true;
    encounterUI.next.disabled = false;
    encounterUI.hint.disabled = true;
    for (const b of encounterUI.choices.children) b.disabled = true;
    sfx.checkpoint();
    animateEncounter('win');
  } else animateEncounter('retry');
  return correct;
}
function showEncounterHint() {
  const active = questionDirector.active;
  if (active && !active.correct) encounterUI.feedback.textContent = 'Clue: ' + active.question.explanation;
}
function closeQuestionEncounter() {
  const active = questionDirector.active;
  if (!active || !active.correct) return false;
  const { enemy, question } = active;
  if (active.review) questionDirector.reviewPosition[active.world] = (questionDirector.reviewPosition[active.world] + 1) % ENCOUNTER_WORLDS[active.world].length;
  state.encounterRead = state.encounterRead || {};
  if (!state.encounterRead[question.id]) {
    state.encounterRead[question.id] = true;
    markStoryChanged();
  }
  if (active.round + 1 < active.set.length) {
    active.round++;
    active.question = active.set[active.round];
    renderEncounterQuestion();
    animateEncounter('intro');
    updateCampaignHud();
    return true;
  }
  // Reward a whole set once. More questions must not inflate combat power.
  if (!active.review) {
    addPowerXp(1, 'RUNE SET');
    player.health = Math.min(MAX_HEALTH, player.health + 1);
  }
  enemy.questionMob = false;
  enemy.quizWarning = 0;
  enemy.alive = false;
  if (!enemy.lessonSentry) {
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#a3eadb', 12);
    rebuildEnemyIndex();
  }
  stopEncounterAnimation();
  questionDirector.active = null;
  questionDirector.pending = null;
  questionDirector.cooldown = 5;
  questionDirector.distance = 0;
  questionDirector.lastX = player.x;
  player.invuln = Math.max(player.invuln, 3);
  hide(encounterUI.overlay);
  updateHud();
  canvas.focus?. ();
  return true;
}
function updateQuestionEncounters(dt) {
  if (!questionsAllowed()) {
    questionDirector.lastX = player.x;
    questionDirector.pending = null;
    return;
  }
  const moved = Math.min(32, Math.abs(player.x - questionDirector.lastX));
  questionDirector.lastX = player.x;
  questionDirector.distance += moved;
  questionDirector.cooldown = Math.max(0, questionDirector.cooldown - dt);
  if (questionDirector.cooldown > 0) return;
  questionDirector.scan -= dt;
  if (questionDirector.scan > 0) return;
  questionDirector.scan = .1;
  let candidate = null, best = 145 * 145;
  for (const e of state.enemies) {
    if (!e.alive || !e.questionMob) continue;
    const d = (e.x + e.w / 2 - player.x - 12) ** 2 + (e.y + e.h / 2 - player.y - 22) ** 2;
    if (d < best && mobCanSee(e, playerCenter())) {
      best = d;
      candidate = e;
    }
  }
  if (candidate) {
    openQuestionEncounter(candidate);
    return;
  }
  // If nearby carriers were left behind, an eligible ordinary mob can reveal
  // its rune after enough travel. No spawn lottery can starve an entire world.
  if (questionDirector.distance > 480) {
    let nearest = null, distance = 240;
    for (const e of state.enemies) {
      if (!e.alive || e.questionMob || Math.abs(e.y - player.y) > 110) continue;
      const d = Math.abs(e.x - player.x);
      if (d < distance && mobCanSee(e, playerCenter())) {
        nearest = e;
        distance = d;
      }
    }
    if (nearest) {
      nearest.questionMob = true;
      nearest.quizWarning = 0;
    }
  }
}
function drawQuestionRune(e) {
  if (!runeProtects(e)) return;
  const x = e.x + e.w / 2, y = e.y - 24;
  ctx.fillStyle = '#082637';
  ctx.fillRect(x - 9, y - 10, 18, 20);
  ctx.strokeStyle = '#8ee6d8';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 9, y - 10, 18, 20);
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d3fff2';
  ctx.fillText('?', x, y + 5);
  ctx.textAlign = 'left';
}
encounterUI.next.onclick = closeQuestionEncounter;
encounterUI.hint.onclick = showEncounterHint;
encounterUI.overlay.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    showEncounterHint();
    return;
  }
  if (event.key !== 'Tab') return;
  const controls = [... encounterUI.choices.children, encounterUI.hint, encounterUI.save, encounterUI.next].filter(b => !b.disabled && !b.hidden);
  if (event.shiftKey && (document.activeElement === controls[0] || document.activeElement === encounterUI.title)) {
    event.preventDefault();
    controls.at(- 1)?.focus();
  } else if (!event.shiftKey && document.activeElement === controls.at(- 1)) {
    event.preventDefault();
    controls[0]?.focus();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopEncounterAnimation(); else if (questionDirector.active) paintEncounter(1);
});
window.addEventListener('pagehide', stopEncounterAnimation);
