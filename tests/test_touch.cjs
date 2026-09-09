'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('adventure/touch-controls.js','utf8'),sandbox);
const events={},classes=new Set(),knob={style:{}};
let capture=null,axis=0,enabled=true;
const element={
  addEventListener:(type,fn)=>events[type]=fn,
  getBoundingClientRect:()=>({left:20,top:30,width:100,height:100}),
  setPointerCapture:id=>capture=id,hasPointerCapture:id=>capture===id,releasePointerCapture:()=>capture=null,
  classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}
};
const stick=new sandbox.window.BitboundTouch.Joystick(element,knob,{enabled:()=>enabled,move:value=>axis=value});
const point=(pointerId,x,y=80)=>({pointerId,clientX:x,clientY:y,button:0,preventDefault(){}});
events.pointerdown(point(1,70));assert.equal(axis,0,'center dead zone');assert.equal(capture,1);
events.pointermove(point(1,74));assert.equal(axis,0,'small drift ignored');
events.pointermove(point(1,102));assert.equal(axis,1);
events.pointerdown(point(2,38));assert.equal(axis,1,'second finger cannot steal stick');
events.pointermove(point(2,38));assert.equal(axis,1);
events.pointerup(point(2,38));assert.equal(axis,1,'releasing an action finger leaves movement held');
events.pointermove(point(1,-200));assert.equal(axis,-1,'outside drag clamped');
events.pointercancel(point(1,-200));assert.equal(axis,0);assert.equal(capture,null);
events.pointerdown(point(3,86));assert.ok(axis>0&&axis<1,'analog movement');
events.lostpointercapture(point(3,86));assert.equal(axis,0);assert.equal(knob.style.transform,'translate(0px, 0px)');
enabled=false;events.pointerdown(point(4,102));assert.equal(stick.pointerId,null,'paused stick ignored');
enabled=true;events.pointerdown(point(5,102));enabled=false;events.pointermove(point(5,102));assert.equal(axis,0,'pause while dragging resets');
const {buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s,listeners,elements}=buildContext('?quality=low');const api=s.TestAPI;
api.startNew();api.enterWorld();
const gameStick=elements.get('moveJoystick');
const drag=()=>{gameStick.listeners.pointerdown[0]({pointerId:8,button:0,clientX:180,clientY:110,preventDefault(){}});assert.ok(api.state.touchAxis>0);};
drag();api.show(api.UI.help);assert.equal(api.state.touchAxis,0);api.hide(api.UI.help);
drag();for(const callback of listeners.blur)callback();assert.equal(api.state.touchAxis,0);
drag();for(const callback of listeners.resize)callback();assert.equal(api.state.touchAxis,0);
drag();s.document.hidden=true;for(const callback of listeners['document:visibilitychange'])callback();assert.equal(api.state.touchAxis,0);
assert.match(fs.readFileSync('story.html','utf8'),/id="moveJoystick"/);
assert.doesNotMatch(fs.readFileSync('app/lab.html','utf8'),/id="moveJoystick"/);
console.log('PASS touch: dead zone, analog bounds, pointer capture, second-finger isolation, cancellation, pause/blur/rotation/visibility resets; Story-only controls.');

// Touch users can change gear without a Q key, while moving with another finger.
const buttons=s.document.querySelectorAll('[data-game-action]');
assert.equal(buttons.length,7);
const cycle=buttons.find(button=>button.dataset.gameAction==='cycle');
api.state.started=true;api.state.paused=false;
api.grantWeapon(Object.keys(api.WEAPONS)[1]);api.state.weaponIndex=0;
const tap={pointerId:9,preventDefault(){}};
cycle.listeners.pointerdown[0](tap);assert.equal(api.state.weaponIndex,1);
cycle.listeners.click[0]({detail:1});assert.equal(api.state.weaponIndex,1,'pointer tap is not triggered a second time by click');
cycle.listeners.click[0]({detail:0});assert.equal(api.state.weaponIndex,0,'assistive and keyboard activation works');
api.show(api.UI.help);cycle.listeners.pointerdown[0](tap);assert.equal(api.state.weaponIndex,0,'gear cannot change through a lesson overlay');api.hide(api.UI.help);
api.UI.slots[3].onclick();assert.ok(api.state.paused);assert.ok(api.UI.guide.classList.contains('show'),'Field Guide gives touch users pause, skills, music and manual saves');
console.log('PASS mobile gear: touch cycle, no double activation, keyboard access, pause guard and Field Guide access.');
