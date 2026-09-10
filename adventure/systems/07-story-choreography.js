/* Readable story blocking, separate from plot state and sprite painting.
   Each interaction has a verb, participant and physical prop. All motion is a
   pure function of a finite 0..1 scene clock; no new timers or per-frame caches. */
const STORY_BEATS = Object.freeze({
  scroll: { verb: 'scroll' },
  forge: { verb: 'forge' },
  wave: { verb: 'greet', actor: 3 },
  laugh: { verb: 'laugh', actor: 2 },
  salute: { verb: 'salute', actor: 0 },
  lockSpark: { verb: 'lock', actor: 1 },
  axeBoast: { verb: 'boast', actor: 2 },
  pledge: { verb: 'pledge', actor: 0 },
  warning: { verb: 'pledge', actor: 3 },
  openGate: { verb: 'unlock', actor: 2 },
  healHands: { verb: 'heal', actor: 3 },
  daggerGift: { verb: 'give', actor: 2, prop: 'dagger' },
  invite: { verb: 'invite', actor: 0 },
  handshake: { verb: 'shake', actor: 0 },
  joinHands: { verb: 'shake', actor: 0 },
  battlePlan: { verb: 'map', actor: 1 },
  soup: { verb: 'give', actor: 3, prop: 'bowl' },
  panTroll: { verb: 'troll', actor: 2 },
  cloak: { verb: 'cloak', actor: 0 },
  gateRecall: { verb: 'gate', actor: 1, recall: true },
  ribbon: { verb: 'heal', actor: 3, prop: 'ribbon' },
  tremblingCup: { verb: 'give', actor: 1, prop: 'cup' },
  mend: { verb: 'sew', actor: 2 },
  mendTogether: { verb: 'sew', actor: 1 },
  knuckles: { verb: 'boast', actor: 2 },
  promiseMeal: { verb: 'map', actor: 0 },
  hesitation: { verb: 'reach', actor: 3 },
  cups: { verb: 'cups', actor: 1 },
  poison: { verb: 'poison', actor: 0 },
  ribbonTaken: { verb: 'takeRibbon', actor: 3 },
  coldCaptain: { verb: 'judgment', actor: 0 },
  gateRegret: { verb: 'regret', actor: 1, recall: true },
  stolenPack: { verb: 'takePack', actor: 2 },
  abandon: { verb: 'leave', actor: 3 },
  shieldMemory: { verb: 'memories', actor: 0, recall: true },
  keepRibbon: { verb: 'recoverRibbon', actor: 3 },
  falseForever: { verb: 'memories', actor: 0, recall: true }
});
function sceneProp(g, id, x, y, angle = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  if (id === 'bowl' || id === 'cup') {
    storyPoly(g, '#302334', [[- 12, - 4], [12, - 4], [9, 9], [- 8, 9]]);
    storyRect(g, '#be8865', - 10, - 3, 20, 4);
    storyRect(g, '#f6d594', - 8, - 3, 16, 2);
    if (id === 'cup') storyLine(g, '#bb9675', 2, [[10, - 1], [16, - 1], [16, 5], [9, 6]]);
  }
  if (id === 'dagger') {
    storyPoly(g, '#e2f4e9', [[- 3, - 13], [3, - 10], [2, 7], [- 2, 7]]);
    storyRect(g, '#cfad6c', - 6, 6, 12, 3);
    storyRect(g, '#795740', - 2, 9, 4, 8);
    storyRect(g, '#83d6d5', - 1, - 7, 1, 11);
  }
  if (id === 'pack') {
    storyRect(g, '#18232b', - 13, - 15, 26, 32);
    storyRect(g, '#776850', - 11, - 13, 22, 27);
    storyRect(g, '#a9966b', - 9, - 11, 18, 3);
    storyRect(g, '#433d36', - 8, - 2, 16, 12);
    storyRect(g, '#c2ab79', - 2, - 4, 4, 4);
  }
  if (id === 'pan') {
    storyRect(g, '#594038', - 26, - 2, 20, 4);
    g.fillStyle = '#121d2a';
    g.beginPath();
    g.arc(0, 0, 13, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#91a0a4';
    g.lineWidth = 3;
    g.stroke();
  }
  g.restore();
}
function sceneFire(g, t) {
  storyRect(g, '#554037', 294, 265, 43, 5);
  for (let i = 0; i < 3; i++) storyPoly(g, i === 1 ? '#ffe6a2': '#d9784d', [[298 + i * 12, 264], [303 + i * 10, 236 - Math.sin(t * 28 + i) * 5], [311 + i * 10, 264]]);
  for (let i = 0; i < 5; i++) storyRect(g, '#ffc77b', 303 + i * 5 + Math.sin(t * 16 + i) * 5, 229 - ( (t * 75 + i * 19) % 45), 2, 3);
}
function sceneHealing(g, x, y, t) {
  for (let i = 0; i < 12; i++) {
    const u = (t * 2 + i / 12) % 1, a = i * 2.4 + t * 8;
    storyRect(g, '#adf4ce', x + Math.cos(a) * (9 + u * 21), y - 45 * u, 2, 5);
  }
  g.strokeStyle = '#9ff1c1';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(x, y + 13, 14 + Math.sin(t * Math.PI) * 9, 4, 0, 0, Math.PI * 2);
  g.stroke();
}
function drawOriginGoat(g, t, flee) {
  const x = flee ? 150 - smoothStory(t) * 230: 146 + Math.sin(t * 6) * 3, y = 221;
  g.save();
  g.translate(x, y);
  storyPoly(g, '#293438', [[0, 9], [7, 1], [23, 1], [28, 7], [31, 18], [6, 20], [- 2, 15]]);
  storyPoly(g, '#b9b7a1', [[3, 9], [9, 4], [22, 4], [26, 9], [25, 16], [6, 17]]);
  for (const n of [5, 20]) {
    storyRect(g, '#747f76', n, 16, 4, 13 - (flee ? Math.sin(t * 28 + n) * 3: 0));
    storyRect(g, '#1b2930', n - 1, 26, 6, 3);
  }
  storyPoly(g, '#b9b7a1', [[2, 9], [- 5, 3], [- 7, - 7], [0, - 12], [7, - 8], [8, 3]]);
  storyLine(g, '#d9cfb0', 2, [[- 5, - 7], [- 10, - 12], [- 6, - 17]]);
  storyLine(g, '#d9cfb0', 2, [[3, - 10], [6, - 16], [3, - 19]]);
  storyRect(g, '#18272d', - 5, - 4, 3, 2);
  g.restore();
}
function drawOriginBird(g, t) {
  const x = 460 - smoothStory(t) * 72, y = 126 + Math.sin(t * 11) * 7;
  storyPoly(g, '#dba565', [[x - 8, y], [x - 2, y - 5], [x + 7, y - 3], [x + 9, y + 4], [x - 5, y + 7]]);
  storyPoly(g, '#7d6677', [[x - 2, y], [x - 9, y - 9 - Math.sin(t * 30) * 6], [x + 5, y - 2]]);
  storyRect(g, '#f1d489', x + 8, y, 5, 2);
  storyRect(g, '#15252e', x + 5, y - 2, 1, 2);
}
/* A shot is a scene graph, not a sequence of character draw calls. Each actor ID
 * owns exactly one pose. Props and foreground occluders are independent layers. */
const heroPoseImages = new LruCache(24);
function storyHeroPose(motion = 'idle', mood = 'calm') {
  const key = motion + ':' + mood;
  if (!heroPoseImages.has(key)) heroPoseImages.set(key, createStorySurface(64, 100, g => drawRigActor(g, {
    kind: 'hero',
    x: 32,
    foot: 96,
    motion,
    mood,
    phase: .4,
    scale: 1
  })));
  return heroPoseImages.get(key);
}
function cacheStoryHero() {
  heroPoseImages.clear();
  rigParts.clear();
  rigFrames.clear();
}
function smoothStory(t) {
  return rigEase(t);
}
function storyEntrance(t) {
  return {
    hero: lerp(- 65, 342, smoothStory(t / .58)),
    party: DAWN_COMPANY.map( (_, i) => lerp(- 64 - (3 - i) * 74, 18 + i * 65, smoothStory( (t - .08 - (3 - i) * .12) / .48)))
  };
}
function makeStoryFrame(stage, t, page) {
  return {
    stage,
    t,
    page,
    actors: new Map(),
    props: [],
    effects: [],
    gate: null,
    caption: null
  };
}
function stageActor(frame, id, options = {}) {
  const existing = frame.actors.get(id), index = ['aster', 'mira', 'rook', 'fern'].indexOf(id);
  const actor = {
    id,
    kind: id === 'hero' ? 'hero': id === 'byte' ? 'byte': index >= 0 ? 'ally': 'boss',
    index,
    x: 240,
    foot: 264,
    scale: 1,
    face: 1,
    motion: 'idle',
    phase: (frame.t * 2) % 1,
    mood: 'calm',
    armed: false,
    ... existing,
    ... options
  };
  frame.actors.set(id, actor);
  return actor;
}
function stageWalk(frame, id, from, to, start = 0, end = .6, options = {}) {
  const u = rigEase( (frame.t - start) / (end - start)), x = lerp(from, to, u), walking = frame.t > start && frame.t < end;
  return stageActor(frame, id, {
    x,
    face: to < from ? - 1: 1,
    motion: walking ? 'walk': 'idle',
    phase: Math.abs(x - from) / 42 % 1,
    fromMotion: 'idle',
    blend: walking ? Math.min(1, (frame.t - start) / .1, (end - frame.t) / .1): 1,
    ... options
  });
}
const HALL_PARTY_X = Object.freeze([308, 224, 140, 56]);
const FALLEN_PARTY_X = Object.freeze(HALL_PARTY_X.map(x => x + 28));
function stageCompany(frame, {
  active = - 1,
  elite = false,
  sleep = false,
  hall = false
} = {}) {
  let slot = 0;
  for (let i = 0; i < 4; i++) if (i !== active) {
    const id = ['aster', 'mira', 'rook', 'fern'][i], speaking = frame.page.speaker === DAWN_COMPANY[i].name;
    stageActor(frame, id, {
      x: hall ? HALL_PARTY_X[i]: 430 + slot++* 68,
      elite,
      motion: sleep ? 'sleep': speaking ? 'reach': 'idle',
      mood: sleep ? 'blink': speaking ? frame.page.mood || 'smile': 'calm',
      armed: hall
    });
  }
}
function stagePrison(frame, mode) {
  frame.stage = 'prison';
  frame.gate = { kind: 'prison', open: 0 };
  stageActor(frame, 'hero', { x: 333, motion: 'prison', mood: 'sad' });
  // The corridor is left of the cell. Only explicitly present visitors go here.
  if (mode === 'taunt') stageActor(frame, 'byte', {
    x: 103,
    motion: 'laugh',
    scale: 1.14,
    mood: 'smile'
  });
  if (mode === 'depart') {
    const u = rigEase(frame.t / .82);
    stageActor(frame, 'byte', {
      x: lerp(103, - 75, u),
      foot: 264 - Math.sin(u * Math.PI / 2) * 75,
      motion: 'jump',
      face: - 1,
      scale: 1.14
    });
  }
}
function stageGateRecall(frame) {
  frame.stage = 'dungeon';
  frame.caption = 'EARLIER · UNDER THE FALLING GATE';
  frame.effects.push('gateRecall');
  stageActor(frame, 'hero', { x: 306, motion: 'brace', mood: 'angry' });
  const order = ['mira', 'fern', 'rook', 'aster'];
  order.forEach( (id, i) => {
    const start = .06 + i * .12, end = start + .52, from = 470 + i * 70, to = 55 + i * 50;
    const a = stageWalk(frame, id, from, to, start, end, { armed: false });
    if (a.x > 260 && a.x < 360) {
      a.motion = 'kneel';
      a.foot = 282;
      a.phase = frame.t * 4 % 1;
    }
  });
}
function stageDirectedBeat(frame, b) {
  const t = frame.t, v = b.verb, index = b.actor ?? 0, id = ['aster', 'mira', 'rook', 'fern'][index];
  if (v === 'memories' && frame.page.beat === 'falseForever') {
    if (t >= .72) return makeStoryFrame('hall', (t - .72) / .28, { ... frame.page });
    const n = Math.min(2, Math.floor(t / .24)), recall = makeStoryFrame(n === 0 ? 'prison': n === 1 ? 'camp': 'trail', t / .24 % 1, {});
    if (n === 0) {
      stagePrison(recall, 'alone');
      recall.caption = 'A COLD CELL';
    } else if (n === 1) {
      recall.page = { beat: 'cloak' };
      stageDirectedBeat(recall, STORY_BEATS.cloak);
      recall.caption = 'A WARM CAMPFIRE';
    } else {
      stageActor(recall, 'hero', { x: 316, motion: 'idle', mood: 'calm' });
      recall.effects.push('birth');
      recall.page.originBeat = 3;
      recall.caption = 'A MOUNTAIN THAT NEVER ASKED';
    }
    recall.transition = Math.max(0, 1 - recall.t / .07, 1 - (1 - recall.t) / .07);
    return recall;
  }
  if (v === 'memories') {
    if (t >= .78) {
      const u = (t - .78) / .22;
      frame.stage = 'hall';
      frame.props = [];
      frame.effects = [];
      stageActor(frame, 'hero', {
        x: 403,
        motion: 'kneel',
        face: - 1,
        mood: 'sad'
      });
      for (let i = 0; i < 4; i++) stageActor(frame, ['aster', 'mira', 'rook', 'fern'][i], {
        x: FALLEN_PARTY_X[i],
        motion: 'hurt',
        rotation: i ? - Math.PI / 2: - rigEase(u) * Math.PI / 2,
        elite: true,
        mood: 'sad'
      });
      frame.transition = Math.max(0, 1 - u / .15);
      return frame;
    }
    const segment = Math.min(2, Math.floor(t / .26)), local = t / .26 % 1;
    const recall = makeStoryFrame('camp', local, { beat: ['soup', 'mend', 'cloak'][segment] });
    stageDirectedBeat(recall, STORY_BEATS[recall.page.beat]);
    recall.caption = ['THE FIFTH BOWL', 'A BADLY MENDED SLEEVE', 'HALF A CLOAK'][segment];
    recall.transition = Math.max(0, 1 - local / .07, 1 - (1 - local) / .07);
    return recall;
  }
  if (v === 'gate' || v === 'regret' && t < .6) {
    stageGateRecall(frame);
    return frame;
  }
  if (v === 'scroll' || v === 'forge') {
    stagePrison(frame, 'alone');
    frame.effects.push(v);
    if (v === 'scroll') {
      const rise = rigEase( (t - .25) / .45);
      stageActor(frame, 'hero', { x: 325, motion: rise < .6 ? 'kneel': 'reach', mood: 'calm' });
      frame.props.push({ id: 'scroll', x: 350, y: lerp(251, 215, rise) });
    } else {
      const step = frame.page.forgeStep || 0;
      stageActor(frame, 'hero', {
        x: 445,
        motion: step === 1 ? 'forge': step === 2 ? 'kneel': 'reach',
        phase: t === 1 ? 1: (t * 3) % 1,
        mood: step === 3 ? 'smile': 'calm'
      });
      frame.props.push({
        id: step === 3 ? 'key': 'dagger',
        x: step === 2 ? 506: 495,
        y: step === 2 ? 245: 211,
        angle: step === 3 ? 0: Math.PI / 2
      });
      if (step === 3) {
        const a = stageWalk(frame, 'hero', 445, 242, .35, .92, { armed: false, mood: 'calm' });
        frame.props[0].x = a.x - 27;
        frame.props[0].y = 216;
      }
    }
    return frame;
  }
  const betrayal = ['poison', 'takeRibbon', 'judgment', 'regret', 'takePack', 'leave'].includes(v);
  if (betrayal) {
    frame.stage = 'dungeon';
    stageCompany(frame, { active: index });
    stageActor(frame, 'hero', {
      x: 203,
      foot: 263,
      motion: 'hurt',
      mood: 'sad',
      rotation: - Math.PI / 2
    });
    stageActor(frame, id, {
      x: 277,
      motion: v === 'takeRibbon' ? 'kneel': v === 'takePack' ? 'reach': 'idle',
      face: - 1,
      mood: 'sad'
    });
    if (v === 'poison') {
      const fall = rigEase( (t - .45) / .45);
      stageActor(frame, 'hero', {
        x: 213,
        rotation: - fall * Math.PI / 2,
        motion: fall ? 'hurt': 'reach',
        mood: fall ? 'shock': 'smile'
      });
      stageActor(frame, id, { motion: t < .5 ? 'reach': 'idle' });
      frame.props.push({
        id: 'cup',
        x: lerp(245, 215, rigEase(t / .3)) + fall * 40,
        y: fall ? lerp(205, 259, fall): 214 - Math.sin(clamp(t / .4, 0, 1) * Math.PI) * 18,
        angle: fall * 2
      });
    }
    if (v === 'takeRibbon') frame.props.push({ id: 'ribbon', x: lerp(212, 251, rigEase(t)), y: lerp(259, 237, rigEase(t)) });
    if (v === 'takePack') frame.props.push({ id: 'pack', x: lerp(267, 285, rigEase(t)), y: lerp(250, 217, rigEase(t)) });
    if (v === 'leave') for (let i = 0; i < 4; i++) stageWalk(frame, ['aster', 'mira', 'rook', 'fern'][i], 275 + i * 74, 710 + i * 74, i * .08, .72 + i * .08, { mood: 'sad', armed: false });
    return frame;
  }
  if (v === 'recoverRibbon') {
    frame.stage = 'hall';
    stageActor(frame, 'hero', {
      x: 124,
      motion: 'kneel',
      mood: 'sad',
      face: - 1
    });
    for (let i = 0; i < 4; i++) stageActor(frame, ['aster', 'mira', 'rook', 'fern'][i], {
      x: FALLEN_PARTY_X[i],
      foot: 264,
      rotation: - Math.PI / 2,
      motion: 'hurt',
      elite: true,
      mood: 'sad'
    });
    frame.props.push({ id: 'ribbon', x: lerp(96, 108, rigEase(t)), y: lerp(260, 237, rigEase(t)) });
    return frame;
  }
  if (frame.stage === 'cell') {
    frame.stage = 'holding';
    frame.gate = { kind: 'holding', open: v === 'unlock' ? rigEase(t): 0 };
    stageActor(frame, 'hero', { x: 145, motion: v === 'unlock' ? 'reach': 'idle', mood: 'calm' });
    for (let i = 0; i < 4; i++) stageActor(frame, ['aster', 'mira', 'rook', 'fern'][i], {
      x: 273 + i * 83,
      motion: i === index ? ({
        greet: 'wave',
        laugh: 'laugh',
        salute: 'salute',
        lock: 'cast',
        boast: 'cheer',
        pledge: 'reach',
        unlock: 'guard'
      } [v] || 'idle'): 'idle',
      face: i === index ? - 1: 1,
      mood: i === index ? 'smile': 'calm'
    });
    if (v === 'lock') frame.effects.push('lockSpark');
    if (v === 'unlock') {
      stageActor(frame, 'hero', { x: 174, motion: 'reach' });
      frame.props.push({ id: 'key', x: 203, y: 208 });
      for (let i = 0; i < 4; i++) stageWalk(frame, ['aster', 'mira', 'rook', 'fern'][i], 273 + i * 83, 110 + i * 84, .5 + i * .035, .95 + i * .015, { armed: false });
    }
    return frame;
  }
  frame.stage = 'camp';
  frame.effects.push('campfire');
  stageCompany(frame, { active: index, sleep: v === 'cloak' });
  stageActor(frame, 'hero', { x: 215, motion: ['heal', 'sew', 'cloak', 'invite', 'map'].includes(v) ? 'sit': 'idle', mood: 'smile' });
  const kneeling = ['heal', 'sew', 'invite', 'cloak'].includes(v);
  const partner = stageWalk(frame, id, 310, 277, 0, .26, { face: - 1, mood: 'smile' });
  if (t >= .26) {
    partner.motion = kneeling ? 'kneel': ({
      greet: 'wave',
      laugh: 'laugh',
      salute: 'salute',
      boast: 'cheer',
      pledge: 'reach',
      shake: 'reach',
      give: 'reach',
      map: 'kneel',
      cups: 'kneel',
      reach: 'reach'
    } [v] || 'idle');
    partner.phase = (t * 3) % 1;
    partner.fromMotion = 'idle';
    partner.fromPhase = 0;
    partner.blend = rigEase( (t - .26) / .17);
  }
  if (v === 'shake' || v === 'pledge') {
    stageActor(frame, 'hero', { motion: t < .3 ? 'idle': 'reach' });
    partner.x = 278;
    partner.motion = 'reach';
    partner.phase = (t * 2) % 1;
  }
  if (v === 'give') {
    stageActor(frame, 'hero', { motion: 'reach' });
    frame.props.push({ id: b.prop, holder: t < .62 ? id: 'hero', hand: 1 });
  }
  if (v === 'heal') {
    frame.effects.push('healing');
    if (t > .55) frame.props.push({ id: b.prop || 'ribbon', x: 241, y: 237 });
  }
  if (v === 'sew') {
    frame.effects.push('sewing');
    stageActor(frame, 'hero', { motion: 'sit' });
  }
  if (v === 'map') frame.props.push({ id: 'map', x: 249, y: 264 });
  if (v === 'cups') for (let n = 0; n < 5; n++) frame.props.push({ id: 'cup', x: 210 + n * 22, y: 263 });
  if (v === 'cloak') frame.effects.push('cloak');
  if (v === 'reach') {
    frame.props.push({ id: 'ribbon', x: 239, y: 220 });
    partner.motion = t < .6 ? 'reach': 'idle';
  }
  if (v === 'troll') {
    frame.actors.clear();
    frame.props = [];
    frame.effects = ['troll'];
    frame.stage = 'forest';
    frame.caption = 'ROOK’S VERY TACTICAL FLASHBACK';
    const approach = rigEase(t / .3);
    stageActor(frame, 'rook', {
      x: lerp(202, 341, approach),
      motion: t < .3 ? 'run': t < .76 ? 'attack': 'cheer',
      phase: t < .3 ? approach * 4 % 1: clamp( (t - .3) / .46, 0, 1),
      mood: 'angry'
    });
    const r = frame.actors.get('rook');
    if (t >= .3 && t < .42) {
      r.fromMotion = 'idle';
      r.fromPhase = 0;
      r.blend = storyWindow(t, .3, .42);
    }
    if (t >= .76) {
      r.phase = storyWindow(t, .76, 1);
      r.fromMotion = 'attack';
      r.fromPhase = 1;
      r.blend = storyWindow(t, .76, .9);
    }
    frame.props.push({
      id: 'pan',
      holder: 'rook',
      offset: { x: 24, y: 0 },
      followAngle: true
    });
  }
  return frame;
}
function buildStoryFrame(art, t = 1, page = {}) {
  t = clamp(t, 0, 1);
  const shot = STORY_SHOTS[art] || STORY_SHOTS.trail;
  let f = makeStoryFrame(shot.stage, t, page), action = shot.action || art;
  const directed = STORY_BEATS[page.beat];
  if (directed) {
    f = stageDirectedBeat(f, directed);
    addFallenEquipment(f);
    return Object.assign(finishStoryDirection(f), { shotId: page.shotId });
  }
  f.effects.push(action);
  if (shot.cast.includes('hero')) stageActor(f, 'hero', {
    x: shot.stage === 'hall' ? 380: 170,
    mood: page.speaker === '{name}' ? 'smile': 'calm',
    armed: shot.stage === 'hall' && !['arrival', 'reunion', 'throne', 'treasure'].includes(art)
  });
  if (shot.cast.includes('party')) stageCompany(f, { hall: true, elite: shot.elite });
  if (shot.cast.includes('demon') || shot.cast.includes('fused')) stageActor(f, 'demon', {
    kind: 'boss',
    boss: shot.cast.includes('fused') ? 'fused': 'demon',
    x: 541,
    foot: 264,
    scale: 1.2,
    motion: 'idle'
  });
  if (action === 'birth') stageActor(f, 'hero', {
    x: 316,
    foot: page.originBeat === 3 ? 264: 264 - Math.sin(t * Math.PI) * 18,
    motion: page.originBeat === 3 ? 'wave': t < .5 ? 'land': 'idle',
    phase: t,
    mood: 'shock'
  });
  if (action === 'byte' || action === 'trail') {
    stageActor(f, 'byte', {
      x: 443,
      scale: 1.14,
      motion: page.speaker === 'BYTE' ? 'wave': 'idle',
      mood: 'smile'
    });
    if (page.originBeat === 7) {
      stageWalk(f, 'hero', 170, 350, 0, .92);
      stageWalk(f, 'byte', 443, 603, 0, .85, { scale: 1.14 });
    }
    if (page.escapeBeat === 2) {
      f.stage = 'prison';
      f.gate = { kind: 'prison', open: 1 };
      stageActor(f, 'hero', { x: 155, face: - 1, motion: 'reach' });
      stageActor(f, 'byte', {
        x: 88,
        motion: 'guard',
        mood: 'shock',
        scale: 1.14
      });
    }
    if (page.escapeBeat === 3) {
      f.stage = 'dungeon';
      stageActor(f, 'hero', { x: 262, motion: t < .45 ? 'kneel': 'walk', phase: t * 3 % 1 });
      f.props.push({ id: 'pack', x: 281, y: t < .45 ? 250: 220 });
      stageActor(f, 'byte', {
        x: 426,
        motion: 'guard',
        mood: 'shock',
        scale: 1.14
      });
    }
  }
  if (action === 'prison') stagePrison(f, page.byteExit ? 'depart': page.hideByte ? 'alone': 'taunt');
  if (action === 'escape') {
    stagePrison(f, 'alone');
    f.gate.open = page.escapeBeat === 0 ? rigEase( (t - .15) / .45): 1;
    if (page.escapeBeat === 0) {
      const a = stageWalk(f, 'hero', 242, 155, .6, 1, { face: - 1 });
      if (t < .6) a.motion = 'reach';
      f.props.push({ id: 'key', x: t < .6 ? 211: a.x - 29, y: 215 });
    } else {
      stageActor(f, 'hero', { x: 155, face: - 1, motion: 'idle' });
      const byte = stageWalk(f, 'byte', - 70, 78, 0, .5, { scale: 1.14, mood: 'shock' });
      if (t >= .5) {
        byte.motion = 'guard';
        byte.fromMotion = 'idle';
        byte.fromPhase = 0;
        byte.blend = storyWindow(t, .5, .66);
      }
      f.props.push({
        id: 'snack',
        x: byte.x + 22,
        y: t < .5 ? 211: lerp(211, 263, rigEase( (t - .5) / .3)),
        angle: t > .5 ? t * 4: 0
      });
    }
  }
  if (action === 'arrival') stageWalk(f, 'hero', - 55, 380, 0, .8, { armed: false });
  if (action === 'reunion') for (let i = 0; i < 4; i++) stageWalk(f, ['aster', 'mira', 'rook', 'fern'][i], HALL_PARTY_X[i] - 425, HALL_PARTY_X[i], .08, .94, { elite: true, armed: true, mood: page.mood || 'shock' });
  if (action === 'throne') for (const a of f.actors.values()) if (a.kind === 'ally') {
    a.face = 1;
    if (page.speaker === DAWN_COMPANY[a.index].name) {
      a.motion = a.index === 3 ? 'reach': 'guard';
      a.mood = page.mood || 'shock';
    }
  }
  if (action === 'crown') for (const a of f.actors.values()) if (a.kind === 'ally') {
    a.motion = 'cast';
    a.mood = 'angry';
  }
  if (action === 'greed') stageGuildDuel(f);
  if (['fallen', 'paladin', 'oathEnd'].includes(action)) {
    for (let i = 0; i < 4; i++) stageActor(f, ['aster', 'mira', 'rook', 'fern'][i], {
      x: i > 0 || action === 'oathEnd' ? FALLEN_PARTY_X[i]: HALL_PARTY_X[i],
      rotation: i > 0 || action === 'oathEnd' ? - Math.PI / 2: 0,
      motion: i > 0 || action === 'oathEnd' ? 'hurt': 'guard',
      phase: 1,
      elite: true,
      armed: i === 0 && action !== 'oathEnd',
      mood: 'angry'
    });
    f.duel = { empower: 1 };
  }
  if (['barrier', 'barrierBreak', 'demon', 'fusion', 'fused', 'victory', 'treasure', 'impact', 'leap'].includes(action)) for (let i = 0; i < 4; i++) stageActor(f, ['aster', 'mira', 'rook', 'fern'][i], {
    x: FALLEN_PARTY_X[i],
    foot: 264,
    rotation: - Math.PI / 2,
    motion: 'hurt',
    mood: 'sad',
    elite: true,
    armed: false
  });
  if (action === 'fusion') {
    const merge = page.fusionStage === undefined || page.fusionStage === 5;
    stageActor(f, 'byte', {
      x: page.fusionStage === 0 ? lerp(695, 595, rigEase(t / .65)): merge ? lerp(595, 541, rigEase(t)): 595,
      foot: merge ? lerp(264, 177, rigEase(t)): 264,
      scale: 1.14,
      motion: merge ? 'jump': 'wave',
      mood: 'shock'
    });
    if (merge) {
      f.effects.push('merging');
      if (t > .86) {
        f.actors.delete('byte');
        stageActor(f, 'demon', { boss: 'fused' });
      }
    }
  }
  if (action === 'victory' && page.endingBeat === 0) stageActor(f, 'demon', {
    kind: 'boss',
    boss: 'fused',
    x: 541 + rigEase(t) * 15,
    foot: 264,
    scale: 1.2,
    motion: 'recover',
    opacity: 1 - rigEase( (t - .45) / .4)
  });
  if (action === 'treasure' && page.endingBeat === 2) stageActor(f, 'hero', { x: 450 });
  if (action === 'victory') {
    stageActor(f, 'hero', {
      x: page.endingBeat === 0 ? lerp(380, 450, rigEase(t / .45)): 450,
      motion: page.endingBeat === 0 ? 'attack': 'guard',
      phase: t,
      armed: page.endingBeat === 0
    });
  }
  if (action === 'impact') stageActor(f, 'hero', {
    x: lerp(391, 346, rigEase(t / .25)),
    motion: t < .25 ? 'run': 'punch',
    phase: t < .25 ? t * 3 % 1: clamp( (t - .25) / .65, 0, 1),
    armed: false,
    mood: 'angry'
  });
  if (action === 'leap') {
    const launch = rigEase( (t - .23) / .65);
    stageActor(f, 'hero', {
      x: 333 + launch * 24,
      foot: 264 - launch * 345,
      motion: t < .23 ? 'land': 'jump',
      phase: t < .23 ? 1 - t / .23: 0,
      armed: false,
      mood: 'angry'
    });
  }
  if (action === 'collapse') stageActor(f, 'hero', {
    x: 270 + t * 100,
    foot: 75 - t * 160,
    motion: 'jump',
    scale: .6
  });
  if (action === 'dawn') stageActor(f, 'hero', {
    x: 185 + t * 155,
    foot: 154 - t * 65,
    motion: 'jump',
    armed: false
  });
  addFallenEquipment(f);
  return Object.assign(finishStoryDirection(f), { shotId: page.shotId });
}
