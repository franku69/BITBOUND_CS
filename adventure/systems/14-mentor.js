/* Narrative lessons: one guide, one reusable dialog, one completion flag per task.
   Lesson completion never awards mission points; only Python checks do that. */
const mentorUI = {
  title: $('mentorTitle'),
  portrait: $('mentorPortrait'),
  page: $('mentorPage'),
  text: $('mentorText'),
  code: $('mentorCode'),
  output: $('mentorOutput'),
  question: $('mentorQuestion'),
  choices: $('mentorChoices'),
  feedback: $('mentorFeedback'),
  back: $('mentorBack'),
  next: $('mentorNext'),
  close: $('mentorClose')
};
const mentorFrames = window.BitboundMentorSprite.create(document);
const mentorMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMentorMotion = () => mentorMotionQuery.matches || PERF.mode === 'eco';
const mentorWorldFrames = window.BitboundMentorSprite.worldFrames(document, mentorFrames);
const portraitContext = mentorUI.portrait.getContext('2d');
portraitContext.imageSmoothingEnabled = false;
function paintMentorPortrait(frame) {
  portraitContext.clearRect(0, 0, mentorUI.portrait.width, mentorUI.portrait.height);
  portraitContext.drawImage(mentorFrames[frame], 0, 0, mentorUI.portrait.width, mentorUI.portrait.height);
}
const mentorAnimator = new window.BitboundMentorAnimation.PortraitAnimator({ paint: paintMentorPortrait, reduced: reduceMentorMotion, visible: () => !document.hidden && UI.mentor.classList.contains('show') });
// Optional presentation must never block answers, feedback or the continue button.
let mentorAnimationFailed = false;
function reactMentor(mood) {
  if (mentorAnimationFailed) return;
  try {
    mentorAnimator.play(window.BitboundMentorSprite.reactions[mood]);
  } catch (error) {
    mentorAnimationFailed = true;
    mentorAnimator.stop();
    console.warn('Byte reaction disabled; lessons remain available.', error);
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) mentorAnimator.stop();
});
window.addEventListener('pagehide', () => {
  mentorAnimator.stop();
  AudioEngine.setDialogue(false);
});
let mentorLesson = null, mentorPage = 0, mentorUnderstood = false, mentorOnReady = null, mentorEnding = false;
function storyChapter() {
  return QUESTIONS.story.chapters[state.level];
}
function byteSays(text) {
  return String(text).replaceAll('{name}', currentRunner());
}
function nextLessonTarget() {
  if (state.level === 7 && (['paladin', 'demon', 'fused', 'complete'].includes(plotState().finalPhase) || plotState().scene === 'rivals')) return null;
  const level = state.level, world = worldData();
  let id = null, col = 0;
  for (let index = 0; index < 4; index++) {
    if (!state.solved[level][index]) {
      id = world.questionIds[index];
      col = SHRINE_COLS[index] - 4;
      break;
    }
  }
  if (!id && !state.assessmentPassed[level]) {
    for (let index = 0; index < 2; index++) {
      if (!state.terminalSolved[level][index]) {
        id = world.questionIds[index + 4];
        col = TERMINAL_COL - 3;
        break;
      }
    }
  }
  let ending = false;
  if (!id && state.bossDefeated[level]) {
    id = 'chapter-end-' + level;
    col = PORTAL_COL - 4;
    ending = true;
  }
  if (!id) return null;
  const cached = state.world.mentor;
  if (cached?.id === id) return cached;
  const { WORLD_WIDTH: w, WORLD_HEIGHT: h } = window.BitboundMentorSprite;
  return state.world.mentor = {
    type: 'mentor',
    id,
    col,
    ending,
    x: col * TILE + (24 - w) / 2,
    y: surfaceAt(col) * TILE - h,
    w,
    h
  };
}
function mentorRect() {
  return nextLessonTarget();
}
function drawMentor() {
  if (!state.started) return;
  const npc = mentorRect();
  if (!npc || !onScreen(npc.x, npc.y, npc.w, npc.h)) return;
  const frame = window.BitboundMentorSprite.idleFrame(state.gameTime, reduceMentorMotion());
  drawRigActor(ctx, {
    kind: 'byte',
    x: npc.x + npc.w / 2,
    foot: npc.y + npc.h,
    scale: npc.h / 94,
    face: player.x < npc.x ? - 1: 1,
    motion: frame === 1 || frame === 2 ? 'wave': 'idle',
    phase: reduceMentorMotion() ? 0: (state.gameTime * 1.6) % 1,
    mood: frame === 5 ? 'blink': 'smile'
  });
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#061626';
  const centerX = npc.x + npc.w / 2;
  ctx.fillRect(centerX - 28, npc.y - 21, 56, 15);
  ctx.fillStyle = '#a7f2da';
  ctx.fillText('BYTE', centerX, npc.y - 10);
  ctx.textAlign = 'left';
  if (!state.paused && !reduceMentorMotion() && Math.abs(player.x - npc.x) < 150 && state.gameTime % 12 > 2 && state.gameTime % 12 < 4.8) {
    const text = plotState().betrayed ? 'Still walking? The hall will fix that.': storyChapter().quip;
    ctx.font = '8px monospace';
    const width = ctx.measureText(text).width + 12;
    ctx.fillStyle = '#092333';
    ctx.fillRect(centerX - width / 2, npc.y - 43, width, 16);
    ctx.fillStyle = '#e0efc1';
    ctx.textAlign = 'center';
    ctx.fillText(text, centerX, npc.y - 32);
    ctx.textAlign = 'left';
  }
}
function renderMentor() {
  const chapter = storyChapter();
  $('mentorJournal').textContent = `STONEBORN OATH · ${state.bossDefeated.filter(Boolean).length}/${worlds.length} guardians defeated · ${chapter.goal}`;
  mentorUI.back.hidden = mentorEnding;
  if (mentorEnding) {
    mentorUI.title.textContent = chapter.artifact;
    mentorUI.page.textContent = 'A moment on the trail';
    mentorUI.text.textContent = byteSays(chapter.ending);
    for (const element of [mentorUI.code, mentorUI.output, mentorUI.question, mentorUI.choices]) element.hidden = true;
    mentorUI.feedback.textContent = '';
    mentorUI.next.disabled = false;
    mentorUI.next.textContent = state.level === worlds.length - 1 ? 'Light the final portal →': 'Back to the road →';
    return;
  }
  const lesson = mentorLesson;
  mentorUI.title.textContent = QUESTIONS.get(lesson.id).topic;
  mentorUI.page.textContent = `${Number(lesson.id.slice(1))} / ${QUESTIONS.bank.length} lessons • ${['Meet the idea','Walk through the code','Check your understanding'][mentorPage]} • ${mentorPage+1}/3`;
  mentorUI.text.textContent = mentorPage === 0 ? byteSays(plotState().betrayed ? 'BYTE blocks the inscription with one hand. “Still collecting answers? Fine. This is ' + QUESTIONS.get(lesson.id).topic + '. Learn its rules. I want no excuses when the next guardian puts you down.”': lesson.story): mentorPage === 1 ? lesson.explain + ' This example is a rehearsal; follow the shrine task’s exact inputs, output and function name when you code.': 'Before you try it yourself, let’s check one idea. You can retry freely or go Back to read the example again.';
  mentorUI.code.hidden = mentorPage !== 1;
  mentorUI.output.hidden = mentorPage !== 1;
  mentorUI.code.textContent = lesson.code;
  mentorUI.output.textContent = 'Output:\n' + lesson.output;
  mentorUI.question.hidden = mentorPage !== 2;
  mentorUI.choices.hidden = mentorPage !== 2;
  mentorUI.question.textContent = lesson.question;
  mentorUI.choices.replaceChildren();
  mentorUI.feedback.textContent = '';
  if (mentorPage === 2) {
    lesson.choices.forEach( (choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice;
      button.onclick = () => {
        const correct = index === lesson.answer;
        for (const choice of mentorUI.choices.children) {
          choice.setAttribute('aria-pressed', String(choice === button));
          delete choice.dataset.result;
        }
        button.dataset.result = correct ? 'correct': 'incorrect';
        if (correct) mentorUnderstood = true;
        mentorUI.feedback.textContent = byteSays(plotState().betrayed ? (correct ? '“Another seal. Do not mistake it for safety.” ': '“The inscription will not bend for you. Read it again.” '): correct ? '“Correct, {name}. The inscription agrees. Go show it what you learned.”  ': '“Useful guess, {name}. Bugs are easier to catch here than on a rope bridge.” ') + lesson.feedback;
        mentorUI.next.disabled = !mentorUnderstood;
        reactMentor(correct ? 'success': 'oops');
      };
      mentorUI.choices.appendChild(button);
    });
  }
  mentorUI.back.disabled = mentorPage === 0;
  mentorUI.next.disabled = mentorPage === 2 && !mentorUnderstood;
  mentorUI.next.textContent = mentorPage < 2 ? 'Next →': mentorOnReady ? 'Open challenge →': 'Back to the trail →';
}
function openMentor(id, onReady = null) {
  mentorEnding = false;
  mentorLesson = QUESTIONS.tutorials[id];
  mentorPage = 0;
  mentorUnderstood = false;
  mentorOnReady = onReady;
  renderMentor();
  show(UI.mentor);
  AudioEngine.setDialogue(true);
  reactMentor('welcome');
  mentorUI.next.focus?. ();
}
function openChapterEnding() {
  mentorEnding = true;
  mentorOnReady = null;
  mentorLesson = null;
  renderMentor();
  show(UI.mentor);
  AudioEngine.setDialogue(true);
  reactMentor('success');
  mentorUI.next.focus?. ();
}
function closeMentor() {
  mentorAnimator.stop();
  mentorOnReady = null;
  mentorLesson = null;
  mentorEnding = false;
  hide(UI.mentor);
  canvas.focus?. ();
}
function withTutorial(id, onReady) {
  if (state.tutorialRead[id]) onReady(); else {
    if (UI.puzzle.classList.contains('show')) hide(UI.puzzle);
    openMentor(id, onReady);
  }
}
function advanceMentor() {
  if (mentorEnding) {
    state.chapterTalks[state.level] = true;
    markStoryChanged();
    closeMentor();
    updateMissionGPS();
    return;
  }
  if (!mentorLesson) return;
  if (mentorPage < 2) {
    mentorPage++;
    renderMentor();
    reactMentor(mentorPage === 2 ? 'think': 'explain');
    (mentorPage === 2 ? mentorUI.choices.children[0]: mentorUI.next)?.focus?. ();
    return;
  }
  if (!mentorUnderstood) return;
  state.tutorialRead[mentorLesson.id] = true;
  const ready = mentorOnReady;
  closeMentor();
  markStoryChanged();
  updateMissionGPS();
  if (ready) ready();
}
mentorUI.next.onclick = advanceMentor;
mentorUI.back.onclick = () => {
  if (mentorPage > 0) {
    mentorPage--;
    renderMentor();
  }
};
mentorUI.close.onclick = closeMentor;
$('mentorSound').onclick = () => {
  ensureAudio();
  AudioEngine.toggleSfx();
};
paintMentorPortrait(0);
// Keep Tab in the active dialog. Other gameplay shortcuts are ignored while reading.
UI.mentor.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const buttons = [mentorUI.close, $('mentorSound'), ... (!mentorEnding && mentorPage === 2 ? [... mentorUI.choices.children]: []), mentorUI.back, mentorUI.next].filter(button => !button.disabled && !button.hidden);
  const first = buttons[0], last = buttons.at(- 1);
  if (event.shiftKey && event.target === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && event.target === last) {
    event.preventDefault();
    first.focus();
  }
});
