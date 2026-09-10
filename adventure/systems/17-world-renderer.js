/* ------------------------ Drawing --------------------------- */
function draw() {
  const w = worldData() || worlds[0];
  const shake = state.camera.shake ? ( (Math.random() - .5) * state.camera.shake): 0;
  const camX = Math.floor(state.camera.x + shake), camY = Math.floor(state.camera.y + shake * .5);
  drawBackground(w, camX, camY);
  ctx.save();
  ctx.translate(- camX, - camY);
  drawWorld(w, camX, camY);
  drawTorches();
  drawChests();
  drawShrines();
  drawTerminal();
  drawPortal();
  drawObjectiveBeacon();
  drawLoot();
  drawEnemies();
  drawTrailSentries();
  drawProjectiles();
  drawBoss();
  drawPet();
  drawMentor();
  drawStoryActors();
  drawSkillFlash();
  drawPlayer();
  drawParticles();
  ctx.restore();
  drawObjectiveEdgeArrow();
  drawCrosshair();
}
function drawBackground(w, camX, camY) {
  if (state.level >= 6) {
    drawCastleWorldBackdrop(state.level);
    return;
  }
  drawRegionalBackdrop(state.level);
}
function tileColors(id, w) {
  switch (id) {
    case Tile.DIRT:
    return [w.dirt, '#00000025'];
    case Tile.STONE:
    return [w.stone, '#ffffff10'];
    case Tile.ORE:
    return [w.stone, w.ore];
    case Tile.BRICK:
    return [w.brick, '#ffffff12'];
    case Tile.WOOD:
    return ['#684a31', '#8a6441'];
    case Tile.PLATFORM:
    return ['#8a6b49', '#c09b68'];
    case Tile.METAL:
    return ['#344b5c', '#6f8da0'];
    case Tile.CRYSTAL:
    return [w.stone, w.accent];
    case Tile.ASH:
    return ['#3a2f31', '#7d5151'];
    default:
    return ['#000', '#000']; }
}
function drawTile(c, r, id, w, target = ctx) {
  const x = c * TILE, y = r * TILE;
  const [base, detail] = tileColors(id, w);
  target.fillStyle = base;
  target.fillRect(x, y, TILE, TILE);
  if (state.level <= 1 && id === Tile.DIRT && getTile(c, r - 1) === Tile.AIR) {
    target.fillStyle = '#4f8644';
    target.fillRect(x, y, 32, 5);
    target.fillStyle = '#73b765';
    target.fillRect(x + 2, y + 1, 11, 2);
    target.fillRect(x + 18, y + 1, 10, 2);
  }
  if (id === Tile.PLATFORM) {
    target.fillStyle = detail;
    target.fillRect(x, y, 32, 6);
    target.fillStyle = '#0005';
    target.fillRect(x, y + 26, 32, 6);
    return;
  }
  const n = randHash(c, r, state.world.seed);
  target.fillStyle = '#00000018';
  target.fillRect(x, y + 24, TILE, 8);
  target.fillStyle = detail;
  if (id === Tile.ORE) {
    const pts = [[8, 8], [22, 13], [14, 24]];
    for (const p of pts) {
      target.fillRect(x + p[0], y + p[1], 5, 5);
      target.fillRect(x + p[0] + 2, y + p[1] - 2, 3, 3);
    }
  } else if (id === Tile.CRYSTAL) {
    target.fillRect(x + 12, y + 5, 8, 20);
    target.fillRect(x + 8, y + 10, 16, 10);
  } else if (id === Tile.BRICK || id === Tile.METAL) {
    target.fillRect(x + 1, y + 15, 30, 2);
    target.fillRect(x + (r % 2 ? 16: 8), y + 1, 2, 14);
    target.fillRect(x + (r % 2 ? 8: 22), y + 17, 2, 14);
  } else {
    target.fillRect(x + 5 + (n * 14 | 0), y + 6, 4, 3);
    target.fillRect(x + 18, y + 17 + (n * 6 | 0), 3, 3);
  }
  target.strokeStyle = '#00000035';
  target.strokeRect(x + .5, y + .5, TILE - 1, TILE - 1);
}
function drawWorld(w, camX, camY) {
  const c0 = clamp(Math.floor(camX / TILE) - 1, 0, COLS - 1), c1 = clamp(Math.ceil( (camX + W) / TILE) + 1, 0, COLS - 1), r0 = clamp(Math.floor(camY / TILE) - 1, 0, ROWS - 1), r1 = clamp(Math.ceil( (camY + H) / TILE) + 1, 0, ROWS - 1);
  if (!terrainCache.draw(ctx, state.world, w, camX, camY, W, H)) {
    // The original renderer remains available if a browser cannot allocate a surface.
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const id = getTile(c, r);
      if (id !== Tile.AIR) drawTile(c, r, id, w);
    }
  }
  // biome decorations along surface
  for (let c = c0; c <= c1; c++) if (c % 7 === 0) {
    const sy = surfaceAt(c), x = c * TILE, y = sy * TILE;
    if (state.level === 0) {
      if (randHash(c, sy, state.world.seed) > .45) drawWoodlandTree(x, y, w); else drawWoodlandBush(x, y, w);
    } else if (state.level === 1) drawPixelTree(x, y, w); else if (state.level === 2) drawRegionCrystal(x, y, w); else drawCastleSconce(x, y);
  }
  // underground darkness, lighter on surface; torches cut holes later via screen blend not full mask
  const surfaceScreenY = (18 * TILE) - state.camera.y;
  if (camY > 3 * TILE) {
    ctx.fillStyle = 'rgba(0,0,0,.11)';
    ctx.fillRect(camX, camY, W, H);
  }
}
function drawWoodlandTree(x, y, w) {
  ctx.fillStyle = '#6c4b2d';
  ctx.fillRect(x + 12, y - 42, 8, 42);
  ctx.fillStyle = '#1f6a39';
  ctx.fillRect(x + 2, y - 66, 28, 16);
  ctx.fillRect(x - 2, y - 54, 36, 14);
  ctx.fillStyle = '#2b8b47';
  ctx.fillRect(x + 6, y - 74, 18, 12);
  ctx.fillStyle = '#79c565';
  ctx.fillRect(x + 8, y - 69, 4, 4);
  ctx.fillRect(x + 20, y - 59, 4, 4);
  ctx.fillRect(x + 14, y - 78, 4, 4);
}
function drawWoodlandBush(x, y, w) {
  ctx.fillStyle = '#305c32';
  ctx.fillRect(x + 5, y - 10, 20, 10);
  ctx.fillRect(x + 1, y - 6, 28, 7);
  ctx.fillStyle = '#4a944d';
  ctx.fillRect(x + 9, y - 13, 8, 5);
  ctx.fillRect(x + 18, y - 11, 6, 4);
  ctx.fillStyle = '#e7c66a';
  ctx.fillRect(x + 7, y - 5, 3, 3);
  ctx.fillRect(x + 21, y - 7, 3, 3);
}
function drawPixelTree(x, y, w) {
  ctx.fillStyle = '#5d3e27';
  ctx.fillRect(x + 13, y - 48, 7, 48);
  ctx.fillStyle = '#2f7751';
  ctx.fillRect(x - 4, y - 68, 40, 20);
  ctx.fillRect(x + 4, y - 80, 24, 16);
  ctx.fillStyle = w.accent;
  ctx.fillRect(x + 7, y - 72, 4, 4);
  ctx.fillRect(x + 25, y - 61, 4, 4);
}
function drawTorches() {
  for (const t of state.torchesPlaced) {
    if (!onScreen(t.x, t.y, 1, 13)) continue;
    const f = 2 + Math.sin(state.gameTime * 9 + t.x) * 1.2;
    ctx.fillStyle = '#6b4525';
    ctx.fillRect(t.x - 2, t.y, 4, 13);
    ctx.fillStyle = '#ff8f32';
    ctx.fillRect(t.x - 4, t.y - 7 - f, 8, 9 + f);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(t.x - 2, t.y - 5 - f, 4, 6);
    if (PERF.richFx) {
      const g = ctx.createRadialGradient(t.x, t.y, 5, t.x, t.y, 95);
      g.addColorStop(0, '#ffcf6b33');
      g.addColorStop(1, '#0000');
      ctx.fillStyle = g;
      ctx.fillRect(t.x - 95, t.y - 95, 190, 190);
    }
  }
}
function drawChests() {
  for (const c of state.chests) {
    if (c.opened || !onScreen(c.x, c.y, c.w, c.h)) continue;
    ctx.fillStyle = '#7b552b';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#c89c48';
    ctx.fillRect(c.x, c.y + 7, c.w, 4);
    ctx.fillRect(c.x + 11, c.y + 8, 5, 7);
    ctx.strokeStyle = '#2f1d0e';
    ctx.strokeRect(c.x + .5, c.y + .5, c.w - 1, c.h - 1);
  }
}
function drawLoot() {
  for (const l of state.loot) {
    if (!l.alive || !onScreen(l.x, l.y, l.w, l.h)) continue;
    const w = WEAPONS[l.weaponId];
    if (!w) continue;
    const x = Math.floor(l.x), y = Math.floor(l.y - Math.sin(state.gameTime * 6 + l.x * .01) * 3), pulse = .55 + .45 * Math.sin(state.gameTime * 7 + l.x);
    if (PERF.richFx) {
      const g = ctx.createRadialGradient(x + 12, y + 12, 2, x + 12, y + 12, 30);
      g.addColorStop(0, w.color + '99');
      g.addColorStop(1, '#0000');
      ctx.fillStyle = g;
      ctx.fillRect(x - 18, y - 18, 60, 60);
    }
    ctx.fillStyle = '#07101ddd';
    ctx.fillRect(x, y, 24, 24);
    ctx.strokeStyle = w.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + .5, y + .5, 23, 23);
    ctx.globalAlpha = .7 + .3 * pulse;
    drawMiniWeapon(ctx, w, x + 12, y + 12);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 8px Consolas';
    const label = w.name.toUpperCase(), tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = '#070b11dd';
    ctx.fillRect(x + 12 - tw / 2, y - 15, tw, 11);
    ctx.fillStyle = l.guaranteed ? '#ffd166': '#d9edff';
    ctx.fillText(label, x + 12, y - 7);
  }
}
function drawShrines() {
  const w = worldData();
  for (let i = 0; i < 4; i++) {
    const s = shrineRect(i);
    if (!onScreen(s.x, s.y, s.w, s.h)) continue;
    const solved = state.solved[state.level][i], pulse = .5 + .5 * Math.sin(state.gameTime * 3 + i);
    ctx.fillStyle = '#0a1320';
    ctx.fillRect(s.x, s.y + 22, 40, 46);
    ctx.fillStyle = '#45617f';
    ctx.fillRect(s.x - 6, s.y + 64, 52, 5);
    ctx.fillStyle = solved ? w.accent: '#445467';
    ctx.fillRect(s.x + 14, s.y + 28, 12, 24);
    ctx.fillRect(s.x + 9, s.y + 35, 22, 10);
    if (PERF.richFx) {
      ctx.globalAlpha = solved ? .55 + pulse * .35: .18;
      const g = ctx.createRadialGradient(s.x + 20, s.y + 34, 2, s.x + 20, s.y + 34, 42);
      g.addColorStop(0, solved ? w.accent: '#687488');
      g.addColorStop(1, '#0000');
      ctx.fillStyle = g;
      ctx.fillRect(s.x - 22, s.y - 8, 84, 84);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = solved ? '#dffcff': '#8c9db2';
    ctx.font = 'bold 10px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText(solved ? 'CORE ONLINE': `SHRINE ${i+1}`, s.x + 20, s.y + 14);
  }
}
function drawTerminal() {
  const t = terminalRect();
  if (!onScreen(t.x, t.y, t.w, t.h)) return;
  const active = allCores();
  ctx.fillStyle = '#101b29';
  ctx.fillRect(t.x, t.y, t.w, t.h);
  ctx.fillStyle = '#314b67';
  ctx.fillRect(t.x + 5, t.y + 5, t.w - 10, t.h - 10);
  ctx.fillStyle = active ? worldData().accent: '#8d3c48';
  ctx.fillRect(t.x + 11, t.y + 13, t.w - 22, 24);
  ctx.fillStyle = '#071018';
  ctx.font = 'bold 9px Consolas';
  ctx.textAlign = 'center';
  ctx.fillText(active ? 'ONLINE': 'LOCKED', t.x + t.w / 2, t.y + 29);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = state.solved[state.level][i] ? worldData().accent: '#273446';
    ctx.fillRect(t.x + 8 + i * 10, t.y + 49, 6, 6);
  }
}
function drawPortal() {
  const p = portalRect();
  if (!onScreen(p.x, p.y, p.w, p.h)) return;
  const open = plotCanExit(), pulse = .5 + .5 * Math.sin(state.gameTime * 4);
  ctx.fillStyle = '#1b2330';
  ctx.fillRect(p.x + 5, p.y + 10, 50, 86);
  ctx.fillStyle = open ? worldData().accent: '#5e2734';
  ctx.fillRect(p.x, p.y + 10, 6, 86);
  ctx.fillRect(p.x + 54, p.y + 10, 6, 86);
  ctx.fillRect(p.x + 6, p.y + 4, 48, 6);
  if (open) {
    if (PERF.richFx) {
      const g = ctx.createRadialGradient(p.x + 30, p.y + 52, 4, p.x + 30, p.y + 52, 33);
      g.addColorStop(0, worldData().accent2);
      g.addColorStop(.6, worldData().accent + 'bb');
      g.addColorStop(1, '#0000');
      ctx.fillStyle = g;
      ctx.fillRect(p.x, p.y + 15, 60, 78);
    }
    ctx.globalAlpha = .4 + .4 * pulse;
    ctx.fillStyle = '#fff';
    ctx.fillRect(p.x + 26, p.y + 22, 8, 58);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#1a0c10';
    ctx.fillRect(p.x + 9, p.y + 15, 42, 75);
    ctx.fillStyle = '#ff6b7a';
    ctx.font = 'bold 9px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText('SEALED', p.x + 30, p.y + 58);
  }
}
function drawObjectiveBeacon() {
  if (!state.started) return;
  const o = getObjective();
  let bx = o.x, ground = surfaceAt(o.col) * TILE;
  if (o.route === 'boss' && state.boss && state.boss.active && !state.boss.dead) {
    bx = state.boss.x + state.boss.w / 2;
    ground = state.boss.y + state.boss.h;
  }
  if (!onScreen(bx, ground - 210, 1, 210, 24)) return;
  const pulse = .55 + .45 * Math.sin(state.gameTime * 5);
  ctx.save();
  if (PERF.richFx) {
    ctx.globalAlpha = .18 + .12 * pulse;
    const g = ctx.createLinearGradient(bx, ground - 210, bx, ground);
    g.addColorStop(0, '#ffd16600');
    g.addColorStop(.35, '#ffd16699');
    g.addColorStop(1, '#ffd16618');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 10, ground - 210, 20, 205);
    ctx.globalAlpha = 1;
  }
  const ay = ground - 110 - Math.sin(state.gameTime * 4) * 5;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(bx, ay + 16);
  ctx.lineTo(bx - 12, ay);
  ctx.lineTo(bx + 12, ay);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 10px Consolas';
  ctx.textAlign = 'center';
  const label = `NEXT: ${o.short}`;
  const tw = ctx.measureText(label).width + 18;
  ctx.fillStyle = '#080c12dd';
  ctx.fillRect(bx - tw / 2, ay - 31, tw, 20);
  ctx.strokeStyle = '#ffd166';
  ctx.strokeRect(bx - tw / 2 + .5, ay - 30.5, tw - 1, 19);
  ctx.fillStyle = '#fff1a8';
  ctx.fillText(label, bx, ay - 17);
  ctx.restore();
}
function drawObjectiveEdgeArrow() {
  if (!state.started || state.paused) return;
  const o = getObjective();
  const sx = o.x - state.camera.x;
  if (sx > 70 && sx < W - 70) return;
  const right = sx >= W - 70, x = right ? W - 118: 118, y = Math.floor(H * .58), arrow = right ? '→': '←';
  ctx.save();
  ctx.fillStyle = '#080c12e8';
  ctx.fillRect(x - 92, y - 27, 184, 54);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 91.5, y - 26.5, 183, 53);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px Consolas';
  ctx.fillText(arrow, x + (right ? 64: - 64), y + 8);
  ctx.font = 'bold 11px Consolas';
  ctx.fillStyle = '#fff1a8';
  ctx.fillText(o.short, x + (right ? - 18: 18), y - 3);
  ctx.font = '9px Consolas';
  ctx.fillStyle = '#b8c6d8';
  ctx.fillText(`${o.distance} tiles`, x + (right ? - 18: 18), y + 13);
  ctx.restore();
}
function drawRamOverclockAura(x, y) {
  const p = currentPower();
  if (!['ram_overclock', 'register_restore'].includes(p.id) || state.powerBuff <= 0) return;
  const cx = x + player.w / 2, cy = y + player.h / 2, pulse = .5 + .5 * Math.sin(state.gameTime * 8), register = p.id === 'register_restore';
  ctx.save();
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = .45 + .3 * pulse;
  if (register) {
    for (let i = 0; i < 4; i++) {
      const yy = cy - 23 + i * 12;
      ctx.strokeRect(cx - 25 - pulse * 2, yy, 50 + pulse * 4, 7);
      ctx.fillStyle = p.color;
      ctx.fillRect(cx - 19 + i * 10, yy + 2, 8, 3);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + i * 7 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = .9;
  ctx.fillStyle = '#07180f';
  ctx.fillRect(cx - 15, cy - 7, 30, 14);
  ctx.strokeRect(cx - 15, cy - 7, 30, 14);
  ctx.fillStyle = p.color;
  ctx.font = 'bold 8px Consolas';
  ctx.textAlign = 'center';
  ctx.fillText(register ? 'REG': 'RAM', cx, cy + 3);
  ctx.restore();
}
function drawPlayer() {
  if (player.invuln > 0 && player.invuln <= 1.05 && Math.floor(player.invuln * 12) % 2 === 0) return;
  const x = Math.floor(player.x), y = Math.floor(player.y);
  if (state.powerBuff > 0) drawRamOverclockAura(x, y);
  if (player.dashTime > 0) {
    // Velocity streaks imply speed without drawing duplicate bodies.
    ctx.save();
    ctx.strokeStyle = state.appearance.accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = .55;
    for (let i = 0; i < 3; i++) {
      const end = x + 12 - player.dashDir * (13 + i * 3);
      ctx.beginPath();
      ctx.moveTo(end, y + 17 + i * 7);
      ctx.lineTo(end - player.dashDir * (16 + i * 5), y + 17 + i * 7);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawAvatarSprite(ctx, x, y, 1, state.appearance, player.dir, player.runFrame, player.attack, playerAnimator.pose);
  ctx.font = 'bold 9px Consolas';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0008';
  ctx.fillText(currentRunner(), x + player.w / 2 + 1, y - 9 + 1);
  ctx.fillStyle = '#e9f7ff';
  ctx.fillText(currentRunner(), x + player.w / 2, y - 9);
  if (player.invuln > 1.1) {
    ctx.strokeStyle = '#9dffb3';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, player.w + 8, player.h + 8);
  }
}
