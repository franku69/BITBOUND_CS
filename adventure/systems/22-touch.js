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
handheld = new window.BitboundHandheld.Handheld({
  window, document,
  selectors: [$('setupControlMode'), $('helpControlMode')],
  indicators: [$('setupControlStatus'), $('helpControlStatus')]
});
// The host already presents landscape. Native fullscreen is optional on Play.
UI.startBtn.addEventListener('click', () => handheld.requestLandscape());
$('handheldFullscreen').addEventListener('click', () => handheld.requestLandscape());
$('puzzleClose').addEventListener('click', () => {
  if (document.fullscreenElement) handheld.requestLandscape();
});
window.addEventListener('resize', resetTouchInput);
window.addEventListener('bitbound:landscape', () => {
  resetTouchInput();
  resetFrameTiming();
  scheduleFrame();
});
window.addEventListener('blur', resetTouchInput);
window.addEventListener('pagehide', () => {
  resetTouchInput();
  resetFrameTiming();
  AudioEngine.setBackground(true);
});
document.addEventListener('visibilitychange', () => {
  resetTouchInput();
  resetFrameTiming();
  AudioEngine.setBackground(document.hidden);
  if (document.hidden) {
    for (const key of Object.keys(state.keys)) state.keys[key] = false;
  } else {
    AudioEngine.setDuck(state.paused);
    scheduleFrame();
  }
});
window.addEventListener('pageshow', () => {
  handheld.refresh();
  AudioEngine.setBackground(document.hidden);
  resetFrameTiming();
  scheduleFrame();
});
