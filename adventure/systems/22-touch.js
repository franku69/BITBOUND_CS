/* Story input adapter: the same actions and cooldowns serve keyboard and touch. */
const touchInput = { down: false, attack: false };
const touchActions = {
  jump, attack, interact, dash,
  power: castConceptPower,
  cycle: cycleWeapon,
  pause: () => show(UI.help)
};
const touchEnabled = () => state.started && !state.paused;
const dpad = new window.BitboundTouch.DPad($('moveDpad'), {
  up: $('dpadUp'), down: $('dpadDown'), left: $('dpadLeft'), right: $('dpadRight')
}, {
  enabled: touchEnabled,
  move: (axis, down) => { state.touchAxis = axis; touchInput.down = down; },
  jump, drop: dropOrFastFall
});
const touchButtons = [...document.querySelectorAll('[data-game-action]')].map(button => {
  const action = button.dataset.gameAction;
  return new window.BitboundTouch.ActionButton(button, {
    enabled: touchEnabled,
    press: () => touchActions[action]?.(),
    held: value => { if (action === 'attack') touchInput.attack = value; }
  });
});
function resetTouchInput() {
  dpad.reset();
  touchButtons.forEach(button => button.reset());
}
function detectTouch() {
  document.documentElement.classList.toggle('touch-capable', window.matchMedia('(any-pointer: coarse)').matches || (navigator.maxTouchPoints || 0) > 0);
}
detectTouch();
window.matchMedia('(any-pointer: coarse)').addEventListener?.('change', detectTouch);
handheld = new window.BitboundHandheld.Handheld({
  window, document,
  prompt: $('rotatePrompt'), enter: $('landscapeEnter'), stay: $('landscapeStay'), status: $('landscapeStatus'),
  canRotate: () => !UI.puzzle.classList.contains('show'),
  onBlock: blocked => {
    orientationPaused = blocked;
    $('shell').inert = blocked;
    resetTouchInput();
    syncPresentationPause();
    AudioEngine.setBackground(document.hidden || blocked);
    if (blocked) {
      stopStoryAnimation();
      stopEncounterAnimation();
      mentorAnimator.stop();
    } else if (plotUI.overlay.classList.contains('show')) {
      scheduleStoryPlayback();
    }
  }
});
// Startup detects portrait immediately. Browser locking is attempted on the first play tap.
UI.startBtn.addEventListener('click', () => handheld.requestLandscape());
$('handheldFullscreen').addEventListener('click', () => handheld.requestLandscape());
$('puzzleClose').addEventListener('click', () => {
  if (document.fullscreenElement) handheld.requestLandscape();
});
window.addEventListener('resize', resetTouchInput);
window.addEventListener('blur', resetTouchInput);
window.addEventListener('pagehide', () => {
  resetTouchInput();
  resetFrameTiming();
  AudioEngine.setBackground(true);
});
document.addEventListener('visibilitychange', () => {
  resetTouchInput();
  resetFrameTiming();
  AudioEngine.setBackground(document.hidden || orientationPaused);
  if (document.hidden) {
    for (const key of Object.keys(state.keys)) state.keys[key] = false;
  } else {
    AudioEngine.setDuck(state.paused);
    scheduleFrame();
  }
});
window.addEventListener('pageshow', () => {
  handheld.refresh();
  AudioEngine.setBackground(document.hidden || orientationPaused);
  resetFrameTiming();
  scheduleFrame();
});
