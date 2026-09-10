'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const scope = {window: {}, document: {getElementById: () => null}};
vm.runInNewContext(fs.readFileSync('adventure/handheld.js', 'utf8'), scope);
vm.runInNewContext(fs.readFileSync('adventure/landscape.js', 'utf8'), scope);
const {Handheld} = scope.window.BitboundHandheld;
const {Landscape, landscapeGeometry} = scope.window.BitboundLandscapeAPI;
function target() {
  return {listeners: new Map(), style: {}, hidden: false,
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); },
    emit(type, e = {}) { this.listeners.get(type)?.forEach(fn => fn(e)); },
    dispatchEvent(e) { this.emit(e.type, e); }, Event: class {constructor(type) {this.type = type;}}
  };
}
function platform({mobile = true, width = 390, height = 844, points = 5, ua = '', ipad = false} = {}) {
  const mq = Object.assign(target(), {matches: mobile});
  const win = Object.assign(target(), {navigator: {maxTouchPoints: points, userAgent: ua, platform: ipad ? 'MacIntel' : ''},
    matchMedia: () => mq, screen: {orientation: target()}});
  const doc = Object.assign(target(), {documentElement: target(), fullscreenElement: null});
  const stage = {getBoundingClientRect: () => ({width, height})};
  const child = Object.assign(target(), {navigator: win.navigator, matchMedia: win.matchMedia});
  const classes = new Set(), childDoc = {documentElement: {classList: {toggle(k, on) {on ? classes.add(k) : classes.delete(k);}}}};
  const frame = Object.assign(target(), {contentWindow: child}), status = target();
  const host = new Landscape({window: win, document: doc, stage, frame, status});
  child.parent = {BitboundLandscape: host};
  const selectors = [Object.assign(target(), {value:'auto'}), Object.assign(target(), {value:'auto'})], indicators = [{}, {}];
  const controls = new Handheld({window: child, document: childDoc, selectors, indicators});
  return {win, doc, child, frame, host, controls, status, classes, mq, selectors, indicators,
    resize(w, h) {width = w; height = h; win.emit('resize');}};
}
(async () => {
  for (const [w, h] of [[320,568],[390,844],[430,932],[768,1024],[1024,768],[1440,900]]) {
    const g = landscapeGeometry(w, h, true);
    assert.ok(g.width >= g.height, 'landscape viewport on ' + w + 'x' + h);
    assert.equal(g.width * g.height, w * h, 'rotation never shrinks the available surface');
    for (const [x,y] of [[0,0],[g.width,0],[0,g.height],[g.width,g.height]]) {
      const px = g.rotated ? w-y : x, py = g.rotated ? x : y;
      assert.ok(px >= 0 && px <= w && py >= 0 && py <= h, 'transformed corners stay inside physical safe area');
    }
  }
  const p = platform();
  assert.equal(p.frame.style.width, '844px'); assert.equal(p.frame.style.height, '390px');
  assert.equal(p.frame.style.transform, 'translateX(390px) rotate(90deg)');
  assert.equal(p.frame.style.visibility, 'visible'); assert.ok(p.status.hidden);
  assert.ok(p.classes.has('handheld') && p.classes.has('touch-capable'));
  assert.match(p.indicators[0].textContent, /Landscape.*v30/);
  assert.equal(p.host.connect({}), null, 'an unrelated frame cannot use the bridge');
  let notifications = 0; p.child.addEventListener('bitbound:landscape', () => notifications++);
  p.host.refresh(); assert.equal(notifications, 0, 'stable viewport does not repeat work');
  p.resize(844,390); assert.equal(p.frame.style.transform, 'none'); assert.equal(notifications, 1);
  p.resize(390,844); assert.equal(p.frame.style.width, '844px'); assert.equal(notifications, 2);
  p.selectors[0].value='keyboard'; p.selectors[0].emit('change');
  assert.equal(p.classes.has('handheld'), false); assert.equal(p.selectors[1].value, 'keyboard');
  assert.equal(p.frame.style.width, '844px', 'phone with keyboard still uses landscape');
  p.selectors[1].value='auto'; p.selectors[1].emit('change'); assert.ok(p.classes.has('handheld'));

  const desktop = platform({mobile:false,width:1440,height:900,points:10});
  desktop.doc.documentElement.requestFullscreen = () => {throw Error('desktop must not request fullscreen');};
  await desktop.host.enter(); assert.equal(desktop.frame.style.transform, 'none');
  assert.equal(desktop.classes.has('handheld'), false);
  desktop.child.emit('pointerdown', {pointerType:'touch'}); assert.ok(desktop.classes.has('handheld'));
  for (const nav of [{ua:'Mozilla Android 14'}, {ua:'iPhone'}, {ipad:true}]) {
    const phone = platform({mobile:false,...nav}); assert.equal(phone.host.geometry.rotated, true);
    assert.ok(phone.classes.has('handheld'));
  }
  const denied = platform();
  denied.doc.documentElement.requestFullscreen = async () => {throw Error('NotAllowedError');};
  denied.win.screen.orientation.lock = async () => {throw Error('NotSupportedError');};
  await denied.host.enter(); assert.equal(denied.host.geometry.rotated, true);
  assert.equal(denied.host.requesting, false); assert.equal(denied.controls.blocked, undefined, 'no blocking orientation state');
  const absent = platform(); await absent.host.enter(); assert.equal(absent.host.geometry.rotated, true);
  const locked = platform(), calls=[];
  locked.doc.documentElement.requestFullscreen = async () => {calls.push('fullscreen'); locked.doc.fullscreenElement=locked.doc.documentElement;};
  locked.win.screen.orientation.lock = async mode => {calls.push(mode); locked.resize(844,390);};
  locked.win.screen.orientation.unlock = () => calls.push('unlock');
  await locked.host.enter(); assert.deepEqual(calls, ['fullscreen','landscape']); assert.ok(locked.host.locked);
  locked.doc.fullscreenElement=null; locked.doc.emit('fullscreenchange'); assert.equal(calls.at(-1),'unlock');
  locked.resize(390,844); assert.ok(locked.host.geometry.rotated, 'fullscreen exit never returns to portrait layout');
  const late = platform(); let release;
  late.doc.documentElement.requestFullscreen = () => new Promise(r => {release=r;});
  let attempts=0; late.win.screen.orientation.lock=async()=>attempts++;
  const wait=late.host.enter(); await late.host.enter(); late.host.dispose(); release(); await wait;
  assert.equal(attempts,0,'late fullscreen cannot lock a departed page');
  const lateLock=platform(); let finish, unlocks=0;
  lateLock.win.screen.orientation.lock=()=>new Promise(r=>{finish=r;});
  lateLock.win.screen.orientation.unlock=()=>unlocks++;
  const waiting=lateLock.host.enter(); lateLock.host.dispose(); finish(); await waiting;
  assert.equal(unlocks,1,'late native lock released after disposal');
  assert.ok([...late.win.listeners.values()].every(set=>set.size===0));

  // Connect the real game, including its actual D-pad and overlay pause ownership.
  const {buildContext} = require('./helpers/game-harness.cjs');
  const h=buildContext('?quality=low'), s=h.sandbox, a=s.TestAPI;
  const live=platform(); live.frame.contentWindow=a.handheld.win; s.parent={BitboundLandscape:live.host};
  s.Event=class {constructor(type){this.type=type;}};
  s.dispatchEvent=e=>h.listeners[e.type]?.forEach(fn=>fn(e));
  live.host.notify(); assert.ok(a.handheld.presentation===live.host,'late host handshake recovers');
  a.startNew(); a.enterWorld(); assert.equal(a.state.paused,false,'portrait hardware never pauses the game');
  const pad=h.elements.get('moveDpad');
  pad.listeners.pointerdown[0]({pointerId:4,button:0,clientX:175,clientY:110,preventDefault(){}});
  assert.equal(a.state.touchAxis,1);
  live.resize(844,390); assert.equal(a.state.touchAxis,0,'rotation releases held input even when logical dimensions match');
  a.show(a.UI.mentor); live.resize(390,844);
  assert.ok(a.state.paused && a.UI.mentor.classList.contains('show'),'rotating preserves an open lesson');
  a.hide(a.UI.mentor); assert.equal(a.state.paused,false);
  a.show(a.UI.puzzle); live.resize(844,390); assert.ok(a.state.paused && a.UI.puzzle.classList.contains('show'));
  a.hide(a.UI.puzzle); assert.equal(a.state.paused,false,'closing code returns directly to landscape play');
  assert.doesNotMatch(fs.readFileSync('story-game.html','utf8'), /rotatePrompt|landscapeStay|Continue in portrait/);
  console.log('PASS landscape: immediate full-size rotated surface, six viewport geometries, shared device detection, no portrait prompt, physical rotation/input reset, native API success/denial/absence, async cleanup, late host handshake and preserved lesson/editor pause ownership.');
})().catch(e=>{console.error(e);process.exitCode=1;});
