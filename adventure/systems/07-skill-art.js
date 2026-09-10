/* Fixed spell silhouettes, shared between bolts and the launch sigil. */
const SKILL_SHAPES = Object.freeze({
  binary_beam: 'sequence',
  xor_burst: 'crescent',
  ram_overclock: 'lightning',
  ascii_array: 'orbit',
  rle_compressor: 'gear',
  parity_pulse: 'ring',
  alu_surge: 'sun',
  control_command: 'target',
  bus_barrage: 'arrows',
  register_restore: 'heart',
  branch_warp: 'portal',
  shift_cannon: 'comet',
  load_store_link: 'chain',
  while_loop_volley: 'spiral',
  function_call: 'steps',
  stack_guard: 'shield',
  queue_lance: 'lance',
  set_nova: 'fan',
  recursive_echo: 'nested',
  graph_star: 'graph',
  heap_comet: 'crown'
});
const skillArt = new Map();
let skillFlash = null;
function skillSprite(id) {
  if (!skillArt.has(id)) {
    const power = CONCEPT_POWERS[id] || CONCEPT_POWERS.binary_beam;
    skillArt.set(id, createStorySurface(48, 48, g => paintSkillGlyph(g, SKILL_SHAPES[id] || 'sun', power.color)));
  }
  return skillArt.get(id);
}
function paintSkillGlyph(g, shape, c) {
  const line = pts => storyLine(g, c, 2, pts), poly = pts => storyPoly(g, c, pts), node = (x, y) => {
    storyRect(g, '#162e38', x - 4, y - 4, 8, 8);
    storyRect(g, c, x - 3, y - 3, 6, 6);
    storyRect(g, '#fff5d8', x - 2, y - 2, 2, 2);
  };
  const ring = (x, y, r) => {
    g.strokeStyle = c;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
  };
  switch (shape) {
    case 'sequence':
    for (let n = 0; n < 4; n++) {
      node(8 + n * 10, 24);
      if (n < 3) line([[12 + n * 10, 24], [15 + n * 10, 24]]);
    }
    break;
    case 'crescent':
    poly([[11, 6], [24, 10], [33, 21], [29, 34], [14, 42], [25, 27], [23, 18]]);
    storyPoly(g, '#fff4df', [[12, 7], [24, 14], [28, 25], [24, 33], [26, 21]]);
    break;
    case 'lightning':
    poly([[29, 3], [11, 26], [22, 25], [16, 44], [38, 18], [26, 20]]);
    break;
    case 'orbit':
    ring(24, 24, 14);
    node(11, 16);
    node(36, 17);
    node(24, 39);
    storyRect(g, '#fff4dc', 22, 21, 4, 6);
    break;
    case 'gear':
    for (let i = 0; i < 8; i++) {
      g.save();
      g.translate(24, 24);
      g.rotate(i * Math.PI / 4);
      storyRect(g, c, - 3, - 21, 6, 8);
      g.restore();
    }
    ring(24, 24, 13);
    node(24, 24);
    break;
    case 'ring':
    ring(24, 24, 17);
    ring(24, 24, 10);
    poly([[18, 24], [23, 28], [32, 17], [34, 20], [23, 32], [15, 26]]);
    break;
    case 'sun':
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      line([[24 + Math.cos(a) * 13, 24 + Math.sin(a) * 13], [24 + Math.cos(a) * 21, 24 + Math.sin(a) * 21]]);
    }
    poly([[24, 10], [37, 24], [24, 37], [11, 24]]);
    node(24, 24);
    break;
    case 'target':
    ring(24, 24, 12);
    for (let n = 0; n < 4; n++) {
      g.save();
      g.translate(24, 24);
      g.rotate(n * Math.PI / 2);
      line([[0, - 22], [0, - 8]]);
      g.restore();
    }
    node(24, 24);
    break;
    case 'arrows':
    for (let n = 0; n < 3; n++) line([[9 + n * 10, 10], [19 + n * 10, 24], [9 + n * 10, 38]]);
    break;
    case 'heart':
    poly([[24, 40], [7, 23], [7, 13], [15, 8], [24, 15], [33, 8], [41, 13], [41, 23]]);
    storyRect(g, '#f5ffe4', 22, 17, 4, 14);
    storyRect(g, '#f5ffe4', 17, 22, 14, 4);
    break;
    case 'portal':
    ring(24, 24, 18);
    line([[19, 10], [29, 10], [36, 17], [36, 28], [28, 35], [21, 35], [17, 30], [17, 23], [24, 20], [28, 24]]);
    break;
    case 'comet':
    poly([[5, 7], [34, 17], [42, 28], [35, 40], [23, 36]]);
    storyPoly(g, '#fff1c3', [[15, 15], [30, 21], [35, 29], [30, 34], [25, 29]]);
    break;
    case 'chain':
    for (let n = 0; n < 3; n++) {
      g.strokeStyle = c;
      g.lineWidth = 3;
      g.strokeRect(6 + n * 10, 10 + n * 8, 14, 12);
    }
    break;
    case 'spiral':
    line([[7, 35], [7, 15], [16, 7], [33, 7], [41, 15], [41, 32], [32, 41], [17, 41], [14, 35], [14, 19], [21, 14], [31, 15], [34, 23], [30, 31], [22, 31], [21, 24], [26, 22]]);
    break;
    case 'steps':
    for (let n = 0; n < 4; n++) {
      storyRect(g, c, 7 + n * 9, 34 - n * 7, 6, 8 + n * 7);
      storyRect(g, '#fff0cb', 7 + n * 9, 34 - n * 7, 6, 2);
    }
    break;
    case 'shield':
    poly([[7, 9], [24, 4], [41, 9], [38, 29], [24, 43], [10, 29]]);
    storyPoly(g, '#17323b', [[11, 12], [24, 9], [37, 12], [33, 28], [24, 37], [15, 28]]);
    line([[24, 12], [24, 33]]);
    line([[17, 20], [31, 20]]);
    break;
    case 'lance':
    poly([[4, 21], [31, 21], [31, 13], [45, 24], [31, 35], [31, 27], [4, 27]]);
    storyRect(g, '#fcf4dd', 11, 23, 28, 2);
    break;
    case 'fan':
    for (let n = 0; n < 5; n++) {
      g.save();
      g.translate(24, 40);
      g.rotate( (n - 2) * .34);
      storyPoly(g, c, [[- 2, 0], [- 3, - 24], [0, - 33], [3, - 24], [2, 0]]);
      g.restore();
    }
    break;
    case 'nested':
    for (let n = 0; n < 3; n++) {
      const z = 19 - n * 6;
      line([[24, 24 - z], [24 + z, 24], [24, 24 + z], [24 - z, 24], [24, 24 - z]]);
    }
    break;
    case 'graph':
    for (let n = 0; n < 5; n++) {
      const a = n * Math.PI * 2 / 5 - Math.PI / 2, x = 24 + Math.cos(a) * 17, y = 24 + Math.sin(a) * 17;
      line([[24, 24], [x, y]]);
      node(x, y);
    }
    node(24, 24);
    break;
    case 'crown':
    poly([[7, 13], [17, 22], [24, 5], [31, 22], [42, 13], [36, 39], [13, 39]]);
    storyPoly(g, '#684e55', [[15, 27], [24, 20], [33, 27], [30, 34], [18, 34]]);
    node(24, 27);
    break; }
}
function beginSkillFlash(power) {
  skillFlash = {
    id: power.id,
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    born: state.gameTime
  };
}
function drawSkillFlash() {
  if (!skillFlash) return;
  const age = state.gameTime - skillFlash.born;
  if (age > .65) {
    skillFlash = null;
    return;
  }
  const u = age / .65, g = ctx;
  g.save();
  g.translate(skillFlash.x, skillFlash.y);
  g.globalAlpha = (1 - u) * .7;
  g.drawImage(skillSprite(skillFlash.id), - 24 - u * 8, - 24 - u * 8, 48 + u * 16, 48 + u * 16);
  if (PERF.richFx) {
    g.strokeStyle = CONCEPT_POWERS[skillFlash.id].color;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 22, 20 + u * 25, 7 + u * 6, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
}
function drawConceptProjectile(q) {
  const x = q.x + q.w / 2, y = q.y + q.h / 2, size = Math.max(15, q.w + 6), angle = Math.atan2(q.vy, q.vx), id = q.powerId || 'binary_beam';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (PERF.richFx) {
    storyPoly(ctx, q.color + '44', [[- size * .3, - size * .32], [- size * 2, 0], [- size * .3, size * .32]]);
    storyLine(ctx, q.color + '88', 1, [[- size * 1.5, 0], [- size * .25, 0]]);
  }
  ctx.drawImage(skillSprite(id), - size / 2, - size / 2, size, size);
  ctx.restore();
}
