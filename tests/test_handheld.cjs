'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const scope = { window: {} };
vm.runInNewContext(fs.readFileSync('adventure/handheld.js', 'utf8'), scope);
const { Handheld } = scope.window.BitboundHandheld;
function target() {
  return {
    listeners: new Map(), hidden: false, disabled: false,
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); },
    emit(type, event = {}) { this.listeners.get(type)?.forEach(fn => fn(event)); },
    focus() { this.focused = true; }
  };
}
function platform({ mobile = true, width = 390, height = 844, points = 5, coarse = mobile, hoverless = mobile, userAgent = '', platform = '', mobileHint = false } = {}) {
  const changes = [], classes = new Set(), calls = [];
  const mq = Object.assign(target(), { matches: coarse });
  const hover = Object.assign(target(), { matches: hoverless });
  const doc = Object.assign(target(), { activeElement: target(), fullscreenElement: null, documentElement: target() });
  doc.documentElement.classList = { toggle(k, on) { if (on) classes.add(k); else classes.delete(k); } };
  const win = Object.assign(target(), { innerWidth: width, innerHeight: height,
    navigator: { maxTouchPoints: points, userAgent, platform, userAgentData: { mobile: mobileHint } }, screen: { orientation: target() }, matchMedia: query => query.includes('pointer') ? mq : hover });
  const prompt = target(), enter = target(), stay = target(), status = target();
  const selectors = [target(), target()], indicators = [target(), target()];
  let coding = false;
  const controller = new Handheld({ window: win, document: doc, prompt, enter, stay, status, selectors, indicators,
    canRotate: () => !coding, onBlock: v => changes.push(v) });
  return { controller, win, doc, prompt, enter, stay, status, classes, calls, mq, changes, selectors, indicators,
    coding(value) { coding = value; controller.refresh(); },
    landscape() { win.innerWidth = 844; win.innerHeight = 390; win.emit('resize'); },
    portrait() { win.innerWidth = 390; win.innerHeight = 844; win.emit('resize'); }
  };
}
(async () => {
  const p = platform();
  assert.ok(p.prompt.hidden === false && p.controller.blocked, 'mobile opens immediately with portrait guidance');
  assert.ok(p.classes.has('handheld')); assert.deepEqual(p.changes, [true]);
  assert.ok(p.enter.focused); p.controller.refresh(); assert.equal(p.changes.length, 1, 'stable resize cannot multiply pause events');
  p.landscape(); assert.ok(p.prompt.hidden); assert.equal(p.controller.blocked, false);
  p.portrait(); p.stay.emit('click'); assert.ok(p.prompt.hidden, 'portrait fallback always reachable');
  p.controller.refresh(); assert.ok(p.prompt.hidden, 'viewport noise does not revoke user fallback');
  p.landscape(); p.portrait(); assert.equal(p.prompt.hidden, false, 'next rotation offers landscape again');
  p.coding(true); assert.equal(p.prompt.hidden, true, 'Python keyboard/portrait typing is not blocked');
  p.coding(false); assert.equal(p.prompt.hidden, false);
  p.doc.activeElement = p.stay; let tabs = 0; p.prompt.emit('keydown', { key: 'Tab', preventDefault() { tabs++; } }); assert.equal(tabs, 1);
  p.prompt.emit('keydown', { key: 'Escape', preventDefault() {}, stopPropagation() {} }); assert.ok(p.prompt.hidden, 'accessible escape is never trapped');

  const desktop = platform({ mobile: false, width: 1440, height: 900, points: 10, coarse: false, hoverless: false });
  desktop.doc.documentElement.requestFullscreen = () => { throw Error('Must not request fullscreen on a laptop'); };
  await desktop.controller.requestLandscape(); assert.equal(desktop.controller.blocked, false); assert.equal(desktop.classes.has('handheld'), false, 'touchscreen laptop with mouse stays desktop');
  const tablet = platform({ mobile: true, width: 1024, height: 768 }); assert.ok(tablet.classes.has('handheld')); assert.ok(tablet.prompt.hidden);

  // Desktop-mode mobile browsers and tablets with a mouse must still have a pad.
  for (const nav of [{userAgent: 'Mozilla/5.0 (Linux; Android 14)'}, {userAgent: 'iPhone'},
    {platform: 'MacIntel', points: 5}, {mobileHint: true}]) {
    const phone = platform({mobile: false, width: 844, height: 390, coarse: false, hoverless: false, ...nav});
    assert.ok(phone.classes.has('handheld'));
    assert.ok(phone.classes.has('touch-capable'), 'visibility and layout share the same detector');
  }
  desktop.win.emit('pointerdown', {pointerType: 'mouse'});
  assert.equal(desktop.classes.has('handheld'), false);
  desktop.win.emit('pointerdown', {pointerType: 'touch'});
  assert.ok(desktop.classes.has('handheld'), 'actual touch recovers an unrecognized mobile UA');
  desktop.selectors[0].value = 'keyboard'; desktop.selectors[0].emit('change');
  assert.equal(desktop.classes.has('handheld'), false);
  assert.equal(desktop.classes.has('touch-capable'), false);
  assert.equal(desktop.selectors[1].value, 'keyboard');
  desktop.win.emit('pointerdown', {pointerType: 'touch'});
  assert.equal(desktop.classes.has('handheld'), false, 'explicit keyboard preference wins');
  desktop.selectors[1].value = 'handheld'; desktop.selectors[1].emit('change');
  assert.ok(desktop.classes.has('handheld')); assert.equal(desktop.selectors[0].value, 'handheld');
  assert.match(desktop.indicators[0].textContent, /D-pad/);
  desktop.controller.setMode('invalid'); assert.equal(desktop.controller.mode, 'handheld');

  const locked = platform();
  locked.doc.documentElement.requestFullscreen = async () => {
    locked.calls.push('fullscreen'); locked.doc.fullscreenElement = locked.doc.documentElement;
  };
  locked.win.screen.orientation.lock = async mode => { locked.calls.push(mode); locked.landscape(); };
  locked.win.screen.orientation.unlock = () => locked.calls.push('unlock');
  await locked.controller.requestLandscape();
  assert.deepEqual(locked.calls, ['fullscreen', 'landscape']); assert.ok(locked.controller.locked); assert.ok(locked.prompt.hidden); assert.equal(locked.enter.disabled, false);
  locked.coding(true); assert.equal(locked.calls.at(-1), 'unlock'); assert.equal(locked.controller.locked, false, 'release lock for coding');
  locked.coding(false); await locked.controller.requestLandscape();
  locked.doc.fullscreenElement = null; locked.doc.emit('fullscreenchange'); assert.equal(locked.controller.locked, false);
  const count = locked.calls.length; locked.doc.emit('fullscreenchange'); assert.equal(locked.calls.length, count, 'fullscreen exit does not force re-entry');

  const unsupported = platform();
  unsupported.doc.documentElement.requestFullscreen = async () => { throw Error('NotAllowedError'); };
  unsupported.win.screen.orientation.lock = async () => { throw Error('NotSupportedError'); };
  await unsupported.controller.requestLandscape(); assert.equal(unsupported.enter.disabled, false); assert.equal(unsupported.prompt.hidden, false); assert.match(unsupported.status.textContent, /Turn your device sideways/);
  unsupported.landscape(); assert.ok(unsupported.prompt.hidden, 'manual rotation works despite rejected APIs');
  const noApi = platform(); await noApi.controller.requestLandscape(); assert.equal(noApi.enter.disabled, false);
  noApi.stay.emit('click'); assert.ok(noApi.prompt.hidden);

  const race = platform(); let release;
  race.doc.documentElement.requestFullscreen = () => new Promise(resolve => { release = resolve; });
  race.win.screen.orientation.lock = async () => race.calls.push('lock');
  const pending = race.controller.requestLandscape();
  await race.controller.requestLandscape(); assert.ok(race.enter.disabled, 'duplicate taps share the in-flight request');
  race.coding(true); release(); await pending; assert.deepEqual(race.calls, [], 'late fullscreen cannot lock an active editor');
  const late = platform(); let finish;
  late.win.screen.orientation.lock = () => new Promise(resolve => { finish = resolve; });
  late.win.screen.orientation.unlock = () => late.calls.push('unlock');
  const waiting = late.controller.requestLandscape(); late.controller.dispose(); finish(); await waiting;
  assert.deepEqual(late.calls, ['unlock'], 'late lock is released after teardown');
  assert.ok([...late.win.listeners.values()].every(set => set.size === 0));

  // Exercise pause ownership in the production game, not only the platform model.
  const { buildContext } = require('./helpers/game-harness.cjs');
  const { sandbox: s, elements } = buildContext('?quality=low');
  const a = s.TestAPI; a.startNew(); a.enterWorld();
  a.handheld.coarse.matches = true; s.innerWidth = 390; s.innerHeight = 844;
  a.state.keys.d = true; a.handheld.refresh();
  assert.equal(a.state.paused, true); assert.equal(a.state.keys.d, false); assert.ok(elements.get('shell').inert);
  const before = a.player.x; a.update(1); assert.equal(a.player.x, before, 'rotate prompt suspends combat and movement');
  a.show(a.UI.mentor); s.innerWidth = 844; s.innerHeight = 390; a.handheld.refresh();
  assert.ok(a.state.paused); assert.ok(a.UI.mentor.classList.contains('show'), 'rotation cannot close an open lesson');
  a.hide(a.UI.mentor); assert.equal(a.state.paused, false); assert.equal(elements.get('shell').inert, false);
  s.innerWidth = 390; s.innerHeight = 844; a.handheld.refresh();
  a.show(a.UI.puzzle); assert.equal(a.handheld.blocked, false); assert.ok(a.state.paused, 'editing remains a separate pause owner');
  a.hide(a.UI.puzzle); assert.ok(a.handheld.blocked); assert.ok(a.state.paused);
  console.log('PASS landscape: immediate mobile guidance, desktop/tablet detection, gesture fullscreen/lock, rejected/missing APIs, coding exception, focus/fallback, async cancellation, manual rotation and independent lesson/combat pause ownership.');
})().catch(error => { console.error(error); process.exitCode = 1; });
