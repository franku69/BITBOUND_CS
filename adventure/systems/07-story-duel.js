/* The throne-room fight is a finite, authored sequence. No looping attacks,
   duplicated actors or simulation damage: every impact has one time and place. */
const DUEL_TIMING = Object.freeze({
  windup: .1,
  release: .32,
  impact: .48,
  collapse: .58,
  drain: .7,
  lastFall: .8
});
function duelProgress(t, start, end) {
  return clamp( (t - start) / (end - start), 0, 1);
}
function stageGuildDuel(f) {
  const t = f.t, threat = f.page.rivalBeat === 8;
  stageActor(f, 'hero', {
    x: 380,
    face: - 1,
    motion: 'guard',
    armed: true,
    phase: 0,
    mood: 'shock'
  });
  stageActor(f, 'aster', {
    x: 308,
    face: - 1,
    motion: 'guard',
    armed: true,
    elite: true,
    phase: 0,
    mood: 'angry'
  });
  stageActor(f, 'mira', {
    x: 224,
    face: - 1,
    motion: 'guard',
    armed: true,
    elite: true,
    phase: 0,
    mood: 'angry'
  });
  stageActor(f, 'rook', {
    x: 140,
    face: 1,
    motion: 'guard',
    armed: true,
    elite: true,
    phase: 0,
    mood: 'angry'
  });
  stageActor(f, 'fern', {
    x: 56,
    face: 1,
    motion: 'cast',
    armed: true,
    elite: true,
    phase: .4,
    mood: 'shock'
  });
  if (threat) {
    f.duel = { warning: rigEase(t) };
    stageActor(f, 'rook', { x: 140 + rigEase(t) * 6, motion: 'attack', phase: t * .27 });
    stageActor(f, 'mira', { motion: 'cast', phase: t * .4 });
    return;
  }
  const strike = duelProgress(t, .2, .2 + (.48 - .2) / .52), impact = duelProgress(t, .48, .58), fall = rigEase(duelProgress(t, .54, .73));
  // Rook's axe reaches Mira as her released spell meets his chest. Both stay
  // upright through contact; bodies recoil, lose balance, then settle once.
  const rook = stageActor(f, 'rook', {
    x: lerp(146, 166, rigEase(duelProgress(t, .22, .46))),
    motion: 'attack',
    phase: strike,
    face: 1
  });
  const mira = stageActor(f, 'mira', { motion: 'cast', phase: duelProgress(t, .15, .15 + (.37 - .15) / .48), face: - 1 });
  if (t >= .48) {
    rook.motion = mira.motion = 'hurt';
    rook.phase = mira.phase = 1;
    rook.fromMotion = 'attack';
    rook.fromPhase = .52;
    rook.blend = storyWindow(t, .48, .57);
    mira.fromMotion = 'cast';
    mira.fromPhase = .72;
    mira.blend = rook.blend;
    rook.x = lerp(166, FALLEN_PARTY_X[2], fall);
    mira.x = lerp(224, FALLEN_PARTY_X[1], fall);
    rook.rotation = mira.rotation = - Math.PI / 2 * fall;
    rook.armed = mira.armed = fall < .3;
  }
  const fernFall = rigEase(duelProgress(t, .76, .92));
  stageActor(f, 'fern', {
    x: lerp(56, FALLEN_PARTY_X[3], fernFall),
    motion: fernFall ? 'hurt': 'cast',
    phase: fernFall ? 1: clamp(duelProgress(t, .32, .85), 0, .6),
    rotation: - Math.PI / 2 * fernFall,
    armed: !fernFall,
    mood: 'shock',
    fromMotion: 'cast',
    fromPhase: .58,
    blend: fernFall ? storyWindow(t, .76, .87): 1
  });
  // The player starts to intervene, then braces against the stolen-power wave.
  stageActor(f, 'hero', {
    x: 380 - rigEase(duelProgress(t, .42, .57)) * 12 + rigEase(duelProgress(t, .72, .95)) * 12,
    motion: t > .42 && t < .57 ? 'run': 'guard',
    phase: duelProgress(t, .42, .57),
    armed: true,
    fromMotion: t < .57 ? 'guard': 'run',
    fromPhase: t < .57 ? 0: 1,
    blend: t > .42 && t < .57 ? storyWindow(t, .42, .48): t >= .57 ? storyWindow(t, .57, .65): 1
  });
  f.duel = {
    bolt: duelProgress(t, .37, .48),
    impact,
    fall,
    drain: duelProgress(t, .59, .77),
    empower: rigEase(duelProgress(t, .76, 1)),
    t
  };
  const focus = Math.sin(t * Math.PI);
  f.camera = { zoom: 1 + focus * .16, x: 320 - focus * 23 + (t > .48 && t < .56 ? Math.sin( (t - .48) * 100) * 1.2: 0), y: 150 + focus * 10 };
  if (t > .78) stageActor(f, 'aster', { motion: 'guard', mood: 'grin', phase: 0 });
}
function drawDuelEffects(g, f) {
  const d = f.duel;
  if (!d) return;
  const t = f.t, fern = f.actors.get('fern'), mira = f.actors.get('mira'), rook = f.actors.get('rook'), aster = f.actors.get('aster');
  if (d.warning) {
    for (const id of ['mira', 'rook', 'fern']) {
      const a = f.actors.get(id), hand = rigSocket(a);
      g.globalAlpha = d.warning * .65;
      g.strokeStyle = a.index === 1 ? '#c0a1ff': a.index === 2 ? '#ffd390': '#a0edc2';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(hand.x, hand.y, 5 + d.warning * 4, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  if (d.bolt > 0 && d.bolt < 1) {
    const start = rigSocket({ ... mira, motion: 'cast', phase: .48 }), x = lerp(start.x, 167, d.bolt), y = lerp(start.y, 212, d.bolt);
    storyLine(g, '#7150bd', 6, [[start.x, start.y], [x, y]]);
    storyLine(g, '#ecdcff', 2, [[start.x, start.y], [x, y]]);
    storyPoly(g, '#f5e9ff', [[x - 6, y], [x, y - 5], [x + 8, y], [x, y + 5]]);
  }
  if (t > .43 && t < .56) {
    const p = duelProgress(t, .43, .56);
    g.save();
    g.globalAlpha = Math.sin(p * Math.PI) * .9;
    g.strokeStyle = '#ffde9d';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(187, 211, 29, - 2.1 + p * .8, .5 + p * .8);
    g.stroke();
    g.restore();
  }
  if (d.impact > 0 && d.impact < 1) {
    const p = d.impact;
    for (const x of [169, 222]) for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5, dist = 8 + p * 26;
      g.globalAlpha = 1 - p;
      storyLine(g, i % 2 ? '#f2ddba': '#c1adf5', 2, [[x + Math.cos(a) * dist, 211 + Math.sin(a) * dist], [x + Math.cos(a) * (dist + 5), 211 + Math.sin(a) * (dist + 5)]]);
    }
    g.globalAlpha = 1;
  }
  if (d.drain > 0 && d.drain < 1) {
    const hand = rigSocket({ ... fern, motion: 'cast', phase: .48 });
    for (const a of [rook, mira]) {
      const p = d.drain;
      storyLine(g, '#74c1a0', 2, [[a.x, 244], [lerp(a.x, hand.x, .5), 199], [hand.x, hand.y]]);
      for (let i = 0; i < 4; i++) {
        const u = (p + i / 4) % 1;
        storyRect(g, '#d8ffce', lerp(a.x, hand.x, u), lerp(244, hand.y, u) - Math.sin(u * Math.PI) * 24, 3, 3);
      }
    }
  }
  if (d.empower > 0) {
    const p = d.empower;
    for (let i = 0; i < 14; i++) {
      const u = (p + i / 14) % 1, angle = i * 2.4;
      storyRect(g, i % 2 ? '#ffd285': '#b6a0ee', aster.x + Math.cos(angle) * (34 - u * 20), 267 - u * 99, 2, 4);
    }
    g.save();
    g.globalAlpha = p * .7;
    g.strokeStyle = '#e9c681';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(aster.x, 265, 29, 6, 0, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
}
function addFallenEquipment(f) {
  for (const id of ['aster', 'mira', 'rook', 'fern']) {
    const actor = f.actors.get(id);
    if (!actor || actor.rotation === undefined || Math.abs(actor.rotation) < .35 || actor.armed) continue;
    const progress = clamp( (Math.abs(actor.rotation) - .35) / (Math.PI / 2 - .35), 0, 1);
    f.props.push({
      id: 'fallenGear',
      index: actor.index,
      x: actor.x - 20,
      y: lerp(219, 261, rigEase(progress)),
      angle: lerp(- .3, Math.PI / 2, rigEase(progress))
    });
  }
}
