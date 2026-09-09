/* Touch controls share actions with keyboard input, but own their movement axis. */

const touchActions={jump,attack,interact,dash,drop:dropOrFastFall,power:castConceptPower,cycle:cycleWeapon};
const joystick=new window.BitboundTouch.Joystick($('moveJoystick'),$('joystickKnob'),{
  enabled:()=>state.started&&!state.paused,
  move:axis=>{state.touchAxis=axis;}
});
function resetTouchInput(){
  state.touchAxis=0;
  // Boot draws once before this component is constructed; no reset is needed then.
  joystick.reset();
}
function detectTouch(){
  document.documentElement.classList.toggle('touch-capable',
    window.matchMedia('(any-pointer: coarse)').matches||(navigator.maxTouchPoints||0)>0);
}
detectTouch();
window.matchMedia('(any-pointer: coarse)').addEventListener?.('change',detectTouch);
for(const button of document.querySelectorAll('[data-game-action]')){
  const action=button.dataset.gameAction;
  button.addEventListener('pointerdown',event=>{
    event.preventDefault();if(state.paused||!state.started)return;
    button.setPointerCapture(event.pointerId);touchActions[action]?.();
  });
  // Keyboard and assistive activation do not emit pointerdown.
  button.addEventListener('click',event=>{
    if(event.detail===0&&!state.paused&&state.started)touchActions[action]?.();
  });
}
window.addEventListener('resize',resetTouchInput);
window.addEventListener('blur',resetTouchInput);
window.addEventListener('pagehide',()=>{resetTouchInput();resetFrameTiming();AudioEngine.setBackground(true);});
document.addEventListener('visibilitychange',()=>{
  resetTouchInput();resetFrameTiming();
  AudioEngine.setBackground(document.hidden);
  if(document.hidden){for(const key of Object.keys(state.keys))state.keys[key]=false;}
  else{AudioEngine.setDuck(state.paused);scheduleFrame();}
});
window.addEventListener('pageshow',()=>{AudioEngine.setBackground(document.hidden);resetFrameTiming();scheduleFrame();});
