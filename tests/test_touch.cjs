'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const callbacks = [];
const sandbox = { window: { setTimeout: fn => { callbacks.push(fn); return callbacks.length; }, clearTimeout() {} } };
vm.runInNewContext(fs.readFileSync('adventure/touch-controls.js', 'utf8'), sandbox);
function node() {
  const classes = new Set();
  return {
    events: {}, attrs: {}, capture: null,
    addEventListener(type, fn) { this.events[type] = fn; },
    getBoundingClientRect: () => ({ left: 20, top: 30, width: 132, height: 132 }),
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; }, releasePointerCapture() { this.capture = null; },
    classList: { toggle(k, on) { if (on) classes.add(k); else classes.delete(k); } },
    setAttribute(k, v) { this.attrs[k] = v; }
  };
}
let axis = 0, down = false, jumps = 0, drops = 0, enabled = true;
const el = node(), buttons = Object.fromEntries(['up', 'down', 'left', 'right'].map(k => [k, node()]));
const dpad = new sandbox.window.BitboundTouch.DPad(el, buttons, {
  enabled: () => enabled, move: (a, d) => { axis = a; down = d; }, jump: () => jumps++, drop: () => drops++
});
const point = (pointerId, x, y = 96) => ({ pointerId, clientX: x, clientY: y, button: 0, preventDefault() {} });
el.events.pointerdown(point(1, 140)); assert.equal(axis, 1); assert.equal(el.capture, 1);
el.events.pointermove(point(2, 30)); assert.equal(axis, 1, 'another finger cannot steal movement');
el.events.pointerup(point(2, 30)); assert.equal(axis, 1);
el.events.pointermove(point(1, 30)); assert.equal(axis, -1, 'slide reverses movement');
el.events.pointermove(point(1, 86)); assert.equal(axis, 0, 'center releases movement');
el.events.pointermove(point(1, 140, 40)); assert.equal(axis, 1); assert.equal(jumps, 1, 'diagonal jump');
el.events.pointermove(point(1, 140, 42)); assert.equal(jumps, 1, 'held up does not consume both jumps');
el.events.pointermove(point(1, 86)); el.events.pointermove(point(1, 86, 40)); assert.equal(jumps, 2);
el.events.pointermove(point(1, 140, 150)); assert.equal(down, true); assert.equal(drops, 1);
el.events.pointercancel(point(1, 140)); assert.equal(axis, 0); assert.equal(down, false); assert.equal(el.capture, null);
assert.equal(buttons.right.attrs['aria-pressed'], 'false');
el.events.pointerdown(point(3, 140)); enabled = false; el.events.pointermove(point(3, 140)); assert.equal(axis, 0);
el.events.pointerdown(point(4, 140)); assert.equal(dpad.pointerId, null, 'paused inputs ignored');
enabled = true; el.events.pointerdown(point(5, 140)); el.events.lostpointercapture(point(5, 140)); assert.equal(axis, 0);
let stopped = 0;
const key = { key: ' ', preventDefault() {}, stopPropagation() { stopped++; } };
buttons.left.events.keydown(key); assert.equal(axis, -1); buttons.left.events.keyup(key); assert.equal(axis, 0); assert.equal(stopped, 2);
buttons.right.events.click({ detail: 0 }); assert.equal(axis, 1); callbacks.pop()(); assert.equal(axis, 0, 'assistive click has finite movement, never a stuck key');

const actionEl = node(); let attacks = 0, held = false;
const action = new sandbox.window.BitboundTouch.ActionButton(actionEl, { enabled: () => enabled, press: () => attacks++, held: value => held = value });
el.events.pointerdown(point(6, 140));
actionEl.events.pointerdown(point(7, 0)); assert.equal(attacks, 1); assert.ok(held); assert.equal(axis, 1, 'move + attack with independent fingers');
actionEl.events.click({ detail: 1 }); assert.equal(attacks, 1, 'pointer click never attacks twice');
actionEl.events.pointerup(point(8, 0)); assert.ok(held, 'foreign release ignored');
actionEl.events.pointercancel(point(7, 0)); assert.equal(held, false); assert.equal(axis, 1);
actionEl.events.click({ detail: 0 }); assert.equal(attacks, 2, 'keyboard/assistive activation');
actionEl.events.pointerdown(point(9, 0)); action.reset(); assert.equal(held, false); assert.equal(actionEl.capture, null);
enabled = false; actionEl.events.pointerdown(point(10, 0)); assert.equal(attacks, 3);

const { buildContext } = require('./helpers/game-harness.cjs');
const { sandbox: s, listeners, elements } = buildContext('?quality=low');
const api = s.TestAPI;
api.startNew(); api.enterWorld();
const gamePad = elements.get('moveDpad');
const drag = () => { gamePad.listeners.pointerdown[0](point(18, 180, 110)); assert.equal(api.state.touchAxis, 1); };
drag(); api.show(api.UI.help); assert.equal(api.state.touchAxis, 0); api.hide(api.UI.help);
drag(); listeners.blur.forEach(fn => fn()); assert.equal(api.state.touchAxis, 0);
drag(); listeners.resize.forEach(fn => fn()); assert.equal(api.state.touchAxis, 0);
drag(); s.document.hidden = true; listeners['document:visibilitychange'].forEach(fn => fn()); assert.equal(api.state.touchAxis, 0);
s.document.hidden = false;
const controls = s.document.querySelectorAll('[data-game-action]');
const attackButton = controls.find(b => b.dataset.gameAction === 'attack');
const jumpButton = controls.find(b => b.dataset.gameAction === 'jump');
drag();
jumpButton.listeners.pointerdown[0](point(19, 0)); assert.ok(api.player.vy < 0, 'A jumps while moving');
jumpButton.listeners.pointerup[0](point(19, 0));
attackButton.listeners.pointerdown[0](point(20, 0)); assert.ok(api.touchInput.attack); assert.ok(api.player.attackCd > 0);
api.player.attackCd = 0; api.update(1 / 60); assert.ok(api.player.attackCd > 0, 'held B attacks using the existing cooldown');
api.show(api.UI.help); assert.equal(api.touchInput.attack, false); assert.equal(api.state.touchAxis, 0); api.hide(api.UI.help);
const cycle = controls.find(b => b.dataset.gameAction === 'cycle');
api.grantWeapon(Object.keys(api.WEAPONS)[1]); api.state.weaponIndex = 0;
cycle.listeners.pointerdown[0](point(21, 0)); assert.equal(api.state.weaponIndex, 1);
cycle.listeners.click[0]({ detail: 1 }); assert.equal(api.state.weaponIndex, 1);
cycle.listeners.pointerup[0](point(21, 0)); cycle.listeners.click[0]({ detail: 0 }); assert.equal(api.state.weaponIndex, 0);
controls.find(b => b.dataset.gameAction === 'pause').listeners.pointerdown[0](point(22, 0));
assert.ok(api.state.paused); assert.ok(api.UI.help.classList.contains('show'), 'Start opens real pause/save/settings controls');
assert.doesNotMatch(fs.readFileSync('app/lab.html', 'utf8'), /moveDpad|handheldControls/);
console.log('PASS handheld input: sliding/diagonal D-pad, A jump, held B combat, independent fingers, capture cancellation, keyboard and assistive input, pause/blur/rotation/background resets, Select gear and Start pause.');
