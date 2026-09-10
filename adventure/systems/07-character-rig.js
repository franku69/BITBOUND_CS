/* Shared, foot-anchored articulation for the Stoneborn, BYTE and Dawn Company.
 * Animation changes poses only. Physics, combat and story state stay outside this module.
 * Every limb has two fixed-length segments. A character is painted once, never as afterimages.
 * Small reusable head/body textures preserve the pixel art; no per-frame raster cache churn. */
const rigParts = new LruCache(32);
const rigFrames = new LruCache(80);
// 80 × 112 × 128 × 4 = 4.38 MiB maximum.
const RIG_ACTIONS = Object.freeze(['idle', 'walk', 'run', 'jump', 'fall', 'land', 'dash', 'attack', 'cast', 'wave', 'reach', 'guard', 'brace', 'kneel', 'sit', 'hurt', 'sleep', 'laugh', 'salute', 'cheer', 'forge', 'prison', 'offer', 'drink', 'read', 'listen', 'crawl', 'punch', 'speak', 'stoop']);
function rigEase(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}
function rigPoint(x, y) {
  return { x, y };
}
function rigJoint(a, b, upper, lower, bend = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(.01, Math.min(Math.hypot(dx, dy), upper + lower - .01));
  const angle = Math.atan2(dy, dx), offset = Math.acos(clamp( (upper * upper + d * d - lower * lower) / (2 * upper * d), - 1, 1));
  return rigPoint(a.x + Math.cos(angle + bend * offset) * upper, a.y + Math.sin(angle + bend * offset) * upper);
}
function rigReach(a, b, length, minimum = 0) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  if (d < .001) return rigPoint(a.x, a.y + minimum);
  const k = clamp(d, minimum, length) / d;
  return rigPoint(a.x + dx * k, a.y + dy * k);
}
function sampleRig(action = 'idle', phase = 0, fromMotion = null, blend = 1, fromPhase = phase) {
  if (!RIG_ACTIONS.includes(action)) action = 'idle';
  const p = clamp(phase, 0, 1), wave = Math.sin(p * Math.PI * 2), stride = Math.sin(p * Math.PI * 2), pose = {
    hip: rigPoint(32, 62.1),
    tilt: 0,
    headTilt: 0,
    feet: [rigPoint(22, 94), rigPoint(42, 94)],
    hands: [rigPoint(17, 62), rigPoint(46, 62)],
    bend: [1, - 1],
    weapon: - .35
  };
  if (action === 'idle') {
    pose.hip.y -= Math.sin(p * Math.PI * 2) * .35;
    pose.headTilt = Math.sin(p * Math.PI * 2) * .015;
  }
  if (action === 'walk' || action === 'run') {
    // Each cycle has a planted stance and a lifted swing. The straight stance
    // path cancels the actor's travel, instead of skating sinusoidal feet.
    const fast = action === 'run', span = fast ? 15: 11;
    const step = (phase, center) => {
      const u = (phase + 1) % 1;
      return u < .6 ? rigPoint(center + span * (1 - 2 * u / .6), 94): rigPoint(center + span * (- 1 + 2 * rigEase( (u - .6) / .4)), 94 - Math.sin( (u - .6) / .4 * Math.PI) * (fast ? 13: 9));
    };
    pose.feet = [step(p, 23), step(p + .5, 41)];
    pose.hip.y = 64 + Math.sin(p * Math.PI * 4) * .65;
    pose.tilt = fast ? .13: .045;
    pose.hands = [rigPoint(17 - stride * 7, 62 - Math.abs(stride) * 3), rigPoint(46 + stride * 7, 62 - Math.abs(stride) * 3)];
    pose.headTilt = - pose.tilt * .3;
    pose.weapon = - .35 + stride * .09;
  }
  if (action === 'jump') {
    pose.hip.y = 62;
    pose.tilt = - .08;
    pose.feet = [rigPoint(16, 84), rigPoint(43, 91)];
    pose.hands = [rigPoint(7, 32), rigPoint(57, 29)];
    pose.weapon = - .9;
  }
  if (action === 'fall') {
    pose.hip.y = 61;
    pose.tilt = .07;
    pose.feet = [rigPoint(18, 91), rigPoint(47, 90)];
    pose.hands = [rigPoint(1, 39), rigPoint(63, 39)];
  }
  if (action === 'land') {
    const v = 1 - rigEase(p);
    pose.hip.y += 12 * v;
    pose.tilt = .14 * v;
    pose.hands = [rigPoint(5, 57), rigPoint(58, 59)];
  }
  if (action === 'dash') {
    pose.hip.y = 68;
    pose.tilt = .45;
    pose.feet = [rigPoint(10, 91), rigPoint(38, 88)];
    pose.hands = [rigPoint(3, 48), rigPoint(39, 50)];
    pose.weapon = .02;
  }
  if (action === 'attack') {
    // Anticipation -> contact -> follow-through -> recovery. The hand and blade
    // use the SAME pose, including the first/last idle pose (no angle snapping).
    const keys = [[0, 46, 62, - .35, 0], [.28, 40, 19, - 2.3, - .14], [.52, 64, 44, - .06, .16], [.72, 55, 64, .7, .2], [1, 46, 62, - .35, 0]];
    let k = 1;
    while (k < keys.length - 1 && p > keys[k][0]) k++;
    const a = keys[k - 1], b = keys[k], u = rigEase( (p - a[0]) / (b[0] - a[0]));
    pose.hands[1] = rigPoint(lerp(a[1], b[1], u), lerp(a[2], b[2], u));
    pose.weapon = lerp(a[3], b[3], u);
    pose.tilt = lerp(a[4], b[4], u);
    const brace = Math.sin(p * Math.PI);
    pose.hands[0] = rigPoint(17, 62 - 18 * brace);
    pose.feet = [rigPoint(22 - 5 * brace, 94), rigPoint(42 + 6 * brace, 94)];
  }
  if (action === 'forge') {
    const hit = rigEase(p < .55 ? p / .55: 1 - (p - .55) / .45);
    pose.hip = rigPoint(32, 64);
    pose.tilt = 0;
    pose.hands = [rigPoint(14, 54), rigPoint(50 + 7 * hit, 24 + 17 * hit)];
    pose.weapon = - 1.2 + 1.2 * hit;
  }
  if (action === 'wave' || action === 'cheer' || action === 'laugh') {
    const lift = rigEase(p / .18) * (1 - rigEase( (p - .8) / .2));
    pose.hands[1] = rigPoint(lerp(46, 53 + Math.sin(p * Math.PI * 6) * 3, lift), lerp(62, 17 + Math.cos(p * Math.PI * 6) * 1.5, lift));
    pose.headTilt = Math.sin(p * Math.PI * 4) * .035 * lift;
    if (action === 'cheer') {
      pose.hands[0] = rigPoint(6, 23);
      pose.hip.y -= Math.abs(wave) * 2;
    }
    if (action === 'laugh') {
      pose.hip.y += Math.abs(wave) * 2;
      pose.hands = [rigPoint(25, 50), rigPoint(46, 50)];
      pose.headTilt = - .06;
    }
  }
  if (action === 'salute') {
    pose.hands[1] = rigPoint(44, 18);
    pose.headTilt = - .02;
  }
  if (action === 'reach') {
    pose.hands = [rigPoint(14, 56), rigPoint(64, 48)];
    pose.tilt = .06;
  }
  if (action === 'cast') {
    const lift = rigEase(p < .48 ? p / .48: (1 - p) / .52);
    pose.hands = [rigPoint(17 - 11 * lift, 62 - 19 * lift), rigPoint(46 + 16 * lift, 62 - 30 * lift)];
    pose.tilt = - .08 * lift;
    pose.weapon = lerp(- .35, - 1.2, lift);
  }
  if (action === 'guard') {
    pose.hands = [rigPoint(24, 43), rigPoint(48, 39)];
    pose.hip.y = 68;
    pose.feet = [rigPoint(17, 94), rigPoint(47, 94)];
    pose.weapon = - 1;
  }
  if (action === 'brace') {
    pose.hip.y = 69;
    pose.hands = [rigPoint(13, 13), rigPoint(53, 13)];
    pose.feet = [rigPoint(15, 94), rigPoint(49, 94)];
    pose.tilt = .04;
  }
  if (['kneel', 'prison', 'hurt'].includes(action)) {
    pose.hip = rigPoint(30, 78);
    pose.feet = [rigPoint(13, 94), rigPoint(48, 94)];
    pose.bend = [- 1, 1];
    pose.tilt = .08;
    pose.hands = [rigPoint(18, 60), rigPoint(48, 55)];
    pose.headTilt = action === 'hurt' ? .2: action === 'prison' ? .14: .03;
    if (action === 'prison') pose.hands = [rigPoint(29, 60), rigPoint(36, 60)];
  }
  if (action === 'sit' || action === 'sleep') {
    pose.hip = rigPoint(32, 81);
    pose.feet = [rigPoint(6, 94), rigPoint(58, 94)];
    pose.bend = [- 1, 1];
    pose.hands = [rigPoint(19, 58), rigPoint(43, 58)];
    pose.headTilt = action === 'sleep' ? .2: .02;
  }
  if (action === 'offer') {
    const u = rigEase(p);
    pose.hands[1] = rigPoint(46 + 18 * u, 62 - 14 * u);
    pose.tilt = .06 * u;
    pose.headTilt = .015;
  }
  if (action === 'drink') {
    const u = rigEase(p < .4 ? p / .4: p < .72 ? 1: (1 - p) / .28);
    pose.hands[1] = rigPoint(46 - 4 * u, 62 - 39 * u);
    pose.headTilt = - .085 * u;
  }
  if (action === 'read') {
    const u = rigEase(p);
    pose.hands = [rigPoint(17 + 5 * u, 62 - 17 * u), rigPoint(46 - 4 * u, 62 - 17 * u)];
    pose.headTilt = .065;
  }
  if (action === 'listen') {
    pose.headTilt = Math.sin(p * Math.PI * 2) * .035;
    pose.hands = [rigPoint(17, 62), rigPoint(46, 62)];
    pose.hip.y += Math.sin(p * Math.PI * 2) * .35;
  }
  if (action === 'speak') {
    const gesture = Math.sin(p * Math.PI) * Math.sin(p * Math.PI);
    pose.hands[1] = rigPoint(46 + 10 * gesture, 62 - 18 * gesture);
    pose.hands[0] = rigPoint(17, 62);
    pose.headTilt = Math.sin(p * Math.PI * 2) * .04;
    pose.tilt = .025 * gesture;
  }
  if (action === 'crawl') {
    pose.hip = rigPoint(28, 79);
    pose.tilt = .52;
    pose.headTilt = - .36;
    pose.feet = [rigPoint(8 + stride * 6, 94), rigPoint(44 - stride * 6, 94)];
    pose.bend = [- 1, 1];
    pose.hands = [rigPoint(28 + stride * 7, 79), rigPoint(58 - stride * 7, 75)];
  }
  if (action === 'stoop') {
    pose.hip = rigPoint(32, 84);
    pose.tilt = .85;
    pose.headTilt = - .45;
    pose.feet = [rigPoint(13, 94), rigPoint(49, 94)];
    pose.bend = [- 1, 1];
    pose.hands = [rigPoint(25, 66), rigPoint(53, 66)];
  }
  if (action === 'punch') {
    const wind = rigEase(p / .32), hit = rigEase( (p - .32) / .16), recover = rigEase( (p - .65) / .35), hold = 1 - recover;
    pose.hip.y += 28 * hit * hold;
    pose.tilt = (- .12 * wind + .37 * hit) * hold;
    pose.hands[1] = rigPoint(49 - 10 * wind + 10 * hit, 60 - 32 * wind + 57 * hit);
    pose.hands[1].x = lerp(pose.hands[1].x, 49, recover);
    pose.hands[1].y = lerp(pose.hands[1].y, 60, recover);
    pose.hands[0] = rigPoint(13, 46);
    pose.feet = [rigPoint(17, 94), rigPoint(48, 94)];
    pose.headTilt = - .08 * hit * hold;
  }
  if (fromMotion && blend < 1) {
    const previous = sampleRig(fromMotion, fromPhase), u = clamp(blend, 0, 1), c = Math.cos(previous.tilt), s = Math.sin(previous.tilt);
    const localHands = previous.hands.map(h => rigPoint(32 + (h.x - previous.hip.x) * c + (h.y - previous.hip.y) * s, 64 - (h.x - previous.hip.x) * s + (h.y - previous.hip.y) * c));
    for (let i = 0; i < 2; i++) for (const k of ['x', 'y']) {
      pose.feet[i][k] = lerp(previous.feet[i][k], pose.feet[i][k], u);
      pose.hands[i][k] = lerp(localHands[i][k], pose.hands[i][k], u);
    }
    for (const k of ['x', 'y']) pose.hip[k] = lerp(previous.hip[k], pose.hip[k], u);
    pose.weapon = lerp(previous.weapon, pose.weapon, u);
    pose.tilt = lerp(previous.tilt, pose.tilt, u);
    pose.headTilt = lerp(previous.headTilt, pose.headTilt, u);
  }
  // Lower the pelvis just enough for a planted foot to remain on the floor.
  // Breathing/long strides must never lengthen the legs or lift both soles.
  for (let i = 0; i < 2; i++) if (pose.feet[i].y === 94) {
    const dx = pose.feet[i].x - (pose.hip.x + (i ? 8: - 8));
    pose.hip.y = Math.max(pose.hip.y, 94 - Math.sqrt(Math.max(0, 31.8 * 31.8 - dx * dx)));
  }
  const c = Math.cos(pose.tilt), s = Math.sin(pose.tilt);
  const bodyPoint = (x, y) => rigPoint(pose.hip.x + (x - 32) * c - (y - 64) * s, pose.hip.y + (x - 32) * s + (y - 64) * c);
  pose.shoulders = [bodyPoint(18, 36), bodyPoint(45, 36)];
  pose.hands = pose.hands.map(h => bodyPoint(h.x, h.y));
  pose.hands = pose.hands.map( (h, i) => rigReach(pose.shoulders[i], h, 26.9, 1.01));
  pose.elbows = pose.hands.map( (h, i) => rigJoint(pose.shoulders[i], h, 13, 14, 1));
  pose.hips = [rigPoint(pose.hip.x - 8, pose.hip.y), rigPoint(pose.hip.x + 8, pose.hip.y)];
  pose.feet = pose.feet.map( (f, i) => rigReach(pose.hips[i], f, 31.9));
  pose.knees = pose.feet.map( (f, i) => rigJoint(pose.hips[i], f, 16, 16, pose.bend[i]));
  return pose;
}
// One final pose supplies painting, weapon grips and all interaction sockets.
// World targets allow two actors to touch the same prop without stretching limbs.
function rigWorldPoint(actor, p) {
  const r = actor.rotation || 0, c = Math.cos(r), s = Math.sin(r), scale = actor.scale ?? 1, face = actor.face || 1;
  return { x: actor.x + ( (p.x - 32) * c - (p.y - 94) * s) * scale * face, y: actor.foot + ( (p.x - 32) * s + (p.y - 94) * c) * scale };
}
function rigLocalPoint(actor, p) {
  const r = actor.rotation || 0, c = Math.cos(r), s = Math.sin(r), scale = actor.scale ?? 1;
  const x = (p.x - actor.x) / ( (actor.face || 1) * scale), y = (p.y - actor.foot) / scale;
  return { x: 32 + x * c + y * s, y: 94 - x * s + y * c };
}
function rigPoseForActor(actor) {
  const p = sampleRig(actor.motion || 'idle', actor.phase || 0, actor.fromMotion, actor.blend ?? 1, actor.fromPhase ?? actor.phase ?? 0);
  if (actor.rotation) {
    // A fallen person settles out of the impact crouch onto their side. Rotating
    // the kneeling impact pose alone left both knees and elbows stuck in the air.
    const rest = sampleRig('idle', 0), u = rigEase(Math.abs(actor.rotation) / (Math.PI / 2));
    rest.hands = [rigPoint(26, 54), rigPoint(44, 59)];
    rest.feet[1] = rigPoint(46, 88);
    rest.headTilt = .07;
    for (const key of ['hip']) for (const axis of ['x', 'y']) p[key][axis] = lerp(p[key][axis], rest[key][axis], u);
    for (const key of ['feet', 'hands', 'shoulders', 'hips']) for (let i = 0; i < 2; i++) for (const axis of ['x', 'y']) p[key][i][axis] = lerp(p[key][i][axis], rest[key][i][axis], u);
    p.tilt = lerp(p.tilt, 0, u);
    p.headTilt = lerp(p.headTilt, rest.headTilt, u);
    // Put the shoulder's outer edge on the floor, not the centre of the face.
    const lift = - Math.sign(actor.rotation) * 10 * u;
    p.hip.x += lift;
    for (const key of ['feet', 'hands', 'shoulders', 'hips']) for (const q of p[key]) q.x += lift;
    for (let i = 0; i < 2; i++) {
      p.feet[i] = rigReach(p.hips[i], p.feet[i], 31.9);
      p.knees[i] = rigJoint(p.hips[i], p.feet[i], 16, 16, i ? 1: - 1);
    }
  }
  // Small role-specific resting gestures; all authored hand targets below still
  // win. Blend the rest attitude with actions rather than switching skeletons.
  const restWeight = (motion, phase) => ['idle', 'listen', 'wave'].includes(motion) ? 1: motion === 'speak' ? Math.pow(Math.cos(phase * Math.PI), 2): 0;
  let rest = restWeight(actor.motion || 'idle', actor.phase || 0);
  if (actor.fromMotion) rest = lerp(restWeight(actor.fromMotion, actor.fromPhase ?? 0), rest, actor.blend ?? 1);
  if (rest && !actor.rotation) {
    const offsets = actor.kind === 'byte' ? [[5, - 15], [0, 0]]: actor.kind === 'ally' ? [[[0, 0], [2, - 1]], [[3, - 3], [- 1, - 2]], [[- 2, - 1], [3, 0]], [[5, - 4], [- 5, - 3]]][actor.index]: [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++) {
      p.hands[i].x += offsets[i][0] * rest;
      p.hands[i].y += offsets[i][1] * rest;
    }
  }
  if (actor.idleTime && !actor.rotation) {
    const breathe = Math.sin(actor.idleTime * 1.7 + (ACTOR_PHASE[actor.id] || 0) * 6);
    p.headTilt += breathe * .018;
    for (let i = 0; i < 2; i++) p.hands[i].y += breathe * .22;
  }
  p.headTilt += actor.lookTilt || 0;
  if (actor.interactionProfile) p.shoulders[0].x = lerp(p.shoulders[0].x, p.hip.x, .75);
  for (let i = 0; i < 2; i++) {
    const target = actor.handTargets?.[i];
    if (target) {
      const q = rigLocalPoint(actor, target), w = target.weight ?? 1;
      p.hands[i] = rigPoint(lerp(p.hands[i].x, q.x, w), lerp(p.hands[i].y, q.y, w));
    }
    p.hands[i] = rigReach(p.shoulders[i], p.hands[i], 26.9, 1.01);
    p.elbows[i] = rigJoint(p.shoulders[i], p.hands[i], 13, 14, 1);
  }
  if (actor.footLift) for (let i = 0; i < 2; i++) {
    p.feet[i].y -= actor.footLift[i] || 0;
    p.feet[i] = rigReach(p.hips[i], p.feet[i], 31.9);
    p.knees[i] = rigJoint(p.hips[i], p.feet[i], 16, 16, p.bend[i]);
  }
  return p;
}
function rigBodySocket(actor, x, y) {
  const p = rigPoseForActor(actor), c = Math.cos(p.tilt), s = Math.sin(p.tilt);
  return rigWorldPoint(actor, { x: p.hip.x + (x - 32) * c - (y - 64) * s, y: p.hip.y + (x - 32) * s + (y - 64) * c });
}
function rigPalette(actor) {
  if (actor.kind === 'hero') {
    const a = actor.appearance || state.appearance;
    return {
      skin: a.skin,
      cloth: a.outfit,
      accent: a.accent,
      legs: shadeHex(a.outfit, - 32),
      cape: shadeHex(a.outfit, - 36)
    };
  }
  if (actor.kind === 'byte') return {
    skin: '#cf8c55',
    cloth: '#264970',
    accent: '#829b91',
    legs: '#606964',
    cape: null
  };
  const a = DAWN_COMPANY[actor.index];
  return {
    skin: a.skin,
    cloth: actor.elite ? '#8a779f': ['#718b9e', '#56416e', '#4c505b', '#728c7b'][actor.index],
    accent: a.color,
    legs: '#455563',
    cape: ['#77384f', '#382b56', '#603632', '#2e615b'][actor.index]
  };
}
function rigTextures(actor) {
  const appearance = actor.appearance || state.appearance;
  const mood = actor.mood || 'calm';
  const key = actor.kind + ':' + (actor.index ?? 0) + ':' + !!actor.elite + ':' + (actor.kind === 'hero' ? Object.values(appearance).join('|'): '') + ':' + mood;
  let parts = rigParts.get(key);
  if (parts) return parts;
  parts = {};
  for (const part of ['head', 'body']) parts[part] = createStorySurface(64, 96, g => {
    if (part === 'head') paintCharacterHead(g, actor); else if (actor.kind === 'hero') paintStoneborn(g, appearance, 'idle', mood, part); else if (actor.kind === 'byte') {
      const source = document.createElement('canvas');
      source.width = 48;
      source.height = 88;
      BitboundMentorSprite.paint(source, 'idle', part);
      g.drawImage(source, 8, 0, 48, 96);
    } else paintAlly(g, actor.index, mood === 'smile' ? 'grin': mood, !!actor.elite, part);
  });
  rigParts.set(key, parts);
  return parts;
}
function rigSegment(g, a, b, width, base, highlight) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x), dx = Math.sin(angle) * width / 2, dy = - Math.cos(angle) * width / 2;
  storyLine(g, '#101c29', width + 3, [[a.x, a.y], [b.x, b.y]]);
  storyPoly(g, base, [[a.x + dx, a.y + dy], [b.x + dx, b.y + dy], [b.x - dx, b.y - dy], [a.x - dx, a.y - dy]]);
  storyLine(g, highlight, 1, [[a.x + dx * .65, a.y + dy * .65], [b.x + dx * .65, b.y + dy * .65]]);
}
function drawRigEquipment(g, actor, pose) {
  if (!actor.armed || actor.kind === 'byte') return;
  const hand = pose.hands[1];
  g.save();
  g.translate(hand.x, hand.y);
  if (actor.kind === 'hero') {
    g.rotate(currentWeapon().type === 'ranged' ? - .08: pose.weapon);
    g.scale(1.55, 1.55);
    g.drawImage(weaponSprite(currentWeapon()), - 12, - 29);
  } else {
    const i = actor.index, c = DAWN_COMPANY[i].color;
    // Native sword points down, axe/staff up. Normalize their grip axis once.
    const angle = i === 0 ? pose.weapon - Math.PI / 2: i === 2 ? pose.weapon + Math.PI / 2: pose.weapon * .3 + .08;
    g.rotate(angle);
    paintAllyWeapon(g, i, c);
  }
  g.restore();
  // Fingers cover the grip, so it sits in the palm rather than hovering over it.
  storyRect(g, rigPalette(actor).skin, hand.x - 2, hand.y - 2, 5, 4);
  if (actor.kind === 'ally' && actor.index === 0) {
    const h = pose.hands[0];
    g.save();
    g.translate(h.x, h.y);
    storyPoly(g, '#132332', [[- 10, - 12], [0, - 16], [11, - 11], [10, 9], [0, 18], [- 10, 10]]);
    storyPoly(g, '#7798a6', [[- 7, - 10], [0, - 13], [8, - 9], [7, 7], [0, 14], [- 7, 7]]);
    storyLine(g, '#edd197', 2, [[- 5, - 8], [0, - 10], [6, - 7], [5, 6], [0, 11], [- 5, 6], [- 5, - 8]]);
    storyRect(g, '#f5d994', - 1, - 8, 3, 17);
    storyRect(g, '#f5d994', - 5, - 3, 10, 3);
    g.restore();
  }
}
function paintRigActor(g, actor) {
  const pose = rigPoseForActor(actor), parts = rigTextures(actor), color = rigPalette(actor), scale = actor.scale ?? 1;
  g.save();
  g.translate(actor.x, actor.foot);
  g.scale( (actor.face || 1) * scale, scale);
  if (actor.rotation) g.rotate(actor.rotation);
  g.translate(- 32, - 94);
  g.imageSmoothingEnabled = false;
  if (color.cape) {
    const drift = actor.motion === 'dash' ? - 14: Math.sin(actor.clothTime ?? (actor.phase || 0) * Math.PI * 2) * 2;
    storyPoly(g, '#131e2a', [[pose.hip.x - 13, pose.hip.y - 34], [pose.hip.x + 12, pose.hip.y - 34], [pose.hip.x + 16 + drift, pose.hip.y + 10], [pose.hip.x - 18 + drift, pose.hip.y + 9]]);
    storyPoly(g, color.cape, [[pose.hip.x - 11, pose.hip.y - 31], [pose.hip.x + 10, pose.hip.y - 31], [pose.hip.x + 12 + drift, pose.hip.y + 6], [pose.hip.x - 14 + drift, pose.hip.y + 5]]);
  }
  for (let i = 0; i < 2; i++) {
    rigSegment(g, pose.hips[i], pose.knees[i], 9, color.legs, shadeHex(color.legs, 28));
    rigSegment(g, pose.knees[i], pose.feet[i], 8, color.legs, shadeHex(color.legs, 20));
    const k = pose.knees[i], f = pose.feet[i];
    storyRect(g, color.cloth, k.x - 3, k.y - 3, 7, 5);
    storyRect(g, color.accent, k.x - 3, k.y - 3, 6, 1);
    storyPoly(g, '#11212b', [[f.x - 6, f.y - 6], [f.x + 4, f.y - 6], [f.x + 8, f.y - 2], [f.x + 8, f.y + 1], [f.x - 6, f.y + 1]]);
    storyRect(g, '#b6c9c6', f.x - 5, f.y - 1, 12, 2);
    storyRect(g, '#7997a0', f.x - 3, f.y - 5, 6, 1);
  }
  // Far arm -> torso -> near arm -> head. No neutral limbs under moving limbs.
  const arm = i => {
    const broad = actor.kind === 'ally' && actor.index === 2;
    rigSegment(g, pose.shoulders[i], pose.elbows[i], broad ? 8: 7, color.cloth, shadeHex(color.cloth, 24));
    rigSegment(g, pose.elbows[i], pose.hands[i], broad ? 6: 5, color.skin, shadeHex(color.skin, 20));
    const h = pose.hands[i], elbow = pose.elbows[i];
    if (actor.kind === 'ally' && actor.index === 0) {
      const cuff = { x: lerp(elbow.x, h.x, .72), y: lerp(elbow.y, h.y, .72) };
      rigSegment(g, cuff, h, 6, '#788e9d', '#bdcbd0');
    }
    g.save();
    g.translate(h.x, h.y);
    g.rotate(Math.atan2(h.y - elbow.y, h.x - elbow.x) - Math.PI / 2);
    const open = !actor.armed && ['wave', 'cheer', 'speak', 'offer', 'reach', 'cast'].includes(actor.motion);
    storyPoly(g, shadeHex(color.skin, - 27), [[- 2.5, - 3], [2.5, - 3], [2.5, open ? 4: 2], [- 1.5, open ? 4: 3], [- 3, 1]]);
    storyRect(g, color.skin, - 1.5, - 2, 3.5, open ? 5: 4);
    storyRect(g, shadeHex(color.skin, 18), - 1, - 2, 2, 1);
    if (open) storyRect(g, color.skin, - 4, - 1, 2, 3);
    g.restore();
  };
  arm(0);
  g.save();
  g.translate(pose.hip.x, pose.hip.y);
  g.rotate(pose.tilt);
  g.translate(- 32, - 64);
  g.drawImage(parts.body, 0, 0);
  g.restore();
  arm(1);
  g.save();
  g.translate(pose.hip.x, pose.hip.y);
  g.rotate(pose.tilt);
  g.translate(0, - 40);
  g.rotate(pose.headTilt);
  g.translate(- 32, - 24);
  if (actor.expression) paintCharacterHead(g, actor); else g.drawImage(parts.head, 0, 0);
  g.restore();
  if (actor.motion === 'prison' && !actor.precise) {
    const [l, r] = pose.hands;
    storyRect(g, '#6e7d86', l.x - 4, l.y - 2, 8, 3);
    storyRect(g, '#6e7d86', r.x - 4, r.y - 2, 8, 3);
    storyLine(g, '#93a3a6', 2, [[l.x, l.y + 2], [ (l.x + r.x) / 2, l.y + 9], [r.x, r.y + 2]]);
  }
  drawRigEquipment(g, actor, pose);
  g.restore();
  return pose;
}
// Cached gameplay poses and continuous cinematic poses share the same rig.
// Twenty-four attack samples keep the release tightly synchronized while
// the steady-state render performs a single body blit. Weapons stay on the hand.
function drawRigActor(g, actor) {
  if (actor.precise || actor.handTargets || actor.idleTime || actor.expression || actor.rotation) return paintRigActor(g, actor);
  const motion = RIG_ACTIONS.includes(actor.motion) ? actor.motion: 'idle';
  const phases = ['jump', 'fall', 'dash', 'prison', 'kneel', 'sit', 'guard', 'brace', 'reach', 'sleep'].includes(motion) ? 1: motion === 'forge' ? 10: motion === 'attack' ? 24: motion === 'cast' ? 16: motion === 'idle' ? 4: 8;
  const transition = actor.fromMotion ? Math.round(clamp(actor.blend ?? 1, 0, 1) * 5) / 5: 1;
  const phase = clamp(actor.phase || 0, 0, 1), bucket = Math.min(phases - 1, Math.floor(phase * phases)), sample = phases === 1 ? 0: bucket / (phases - 1);
  const appearance = actor.appearance || state.appearance;
  const key = [actor.kind, actor.index || 0, !!actor.elite, motion, bucket, transition < 1 ? actor.fromMotion: '', transition, transition < 1 ? actor.fromPhase ?? '': '', actor.mood || 'calm', actor.kind === 'hero' ? Object.values(appearance).join('|'): ''].join(':');
  let frame = rigFrames.get(key);
  if (!frame) {
    let pose;
    const image = createStorySurface(112, 128, c => {
      pose = paintRigActor(c, {
        ... actor,
        x: 56,
        foot: 118,
        scale: 1,
        face: 1,
        rotation: 0,
        motion,
        phase: sample,
        blend: transition,
        armed: false
      });
    });
    frame = { image, pose };
    rigFrames.set(key, frame);
  }
  const scale = actor.scale ?? 1;
  g.save();
  g.translate(actor.x, actor.foot);
  g.scale( (actor.face || 1) * scale, scale);
  if (actor.rotation) g.rotate(actor.rotation);
  g.imageSmoothingEnabled = false;
  g.drawImage(frame.image, - 56, - 118);
  if (actor.armed) {
    g.translate(- 32, - 94);
    drawRigEquipment(g, actor, frame.pose);
  }
  g.restore();
  return frame.pose;
}
// Attach story props / spell releases to the actual articulated hand, not a
// separately eased screen coordinate. Rotation and facing are applied once.
function rigSocket(actor, side = 1, offset = { x: 0, y: 0 }) {
  const p = rigPoseForActor(actor), h = p.hands[side];
  const ang = p.weapon, c = Math.cos(ang), s = Math.sin(ang), scale = actor.scale ?? 1, face = actor.face || 1;
  const x = h.x - 32 + offset.x * c - offset.y * s, y = h.y - 94 + offset.x * s + offset.y * c;
  const rot = actor.rotation || 0;
  return {
    x: actor.x + (x * Math.cos(rot) - y * Math.sin(rot)) * scale * face,
    y: actor.foot + (x * Math.sin(rot) + y * Math.cos(rot)) * scale,
    angle: ang
  };
}
function paintAllyWeapon(g, i, c = DAWN_COMPANY[i].color) {
  if (i === 0) {
    storyRect(g, '#5b4537', - 2, - 5, 4, 11);
    storyRect(g, c, - 8, 4, 16, 3);
    storyPoly(g, '#132232', [[- 4, 7], [4, 7], [4, 33], [0, 39], [- 4, 33]]);
    storyPoly(g, '#d0e2e4', [[- 2, 8], [2, 8], [2, 32], [0, 35], [- 2, 32]]);
  } else {
    storyRect(g, '#1b2430', - 3, - 27, 6, 58);
    storyRect(g, '#bda071', - 1, - 26, 2, 56);
    if (i === 2) {
      storyPoly(g, '#111e2a', [[- 3, - 23], [- 15, - 28], [- 16, - 13], [- 7, - 9], [3, - 13], [12, - 9], [15, - 17], [13, - 28], [7, - 23]]);
      storyPoly(g, '#aec6c9', [[- 4, - 20], [- 12, - 24], [- 12, - 15], [- 6, - 13], [2, - 17], [10, - 13], [12, - 18], [10, - 24], [5, - 19]]);
    } else {
      storyPoly(g, i === 1 ? '#8f74b9': '#509b86', [[0, - 36], [8, - 28], [4, - 18], [- 4, - 18], [- 8, - 28]]);
      storyPoly(g, i === 1 ? '#c2f1ff': '#ddffdc', [[0, - 34], [4, - 28], [0, - 22], [- 4, - 28]]);
    }
  }
}
window.BitboundCharacterRig = Object.freeze({ paint: paintRigActor });
// Build compatibility portraits only after the shared rig is initialized.
// Legacy world consumers use a small cached pair; richer poses are allocated on demand.
const partyFrames = DAWN_COMPANY.map( (_, i) => ['idle', 'talk'].map(p => createStorySurface(32, 48, g => g.drawImage(partySprite(i, p), 0, 0, 32, 48))));
