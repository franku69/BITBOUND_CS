function drawMobHealth(e, x, y) {
  if (e.hp >= e.maxHp) return;
  const width = 28, fill = Math.max(0, Math.round(width * (e.hp / e.maxHp)));
  ctx.fillStyle = '#05080dcc';
  ctx.fillRect(x + 1, y - 7, width + 2, 5);
  ctx.fillStyle = '#ff5f6d';
  ctx.fillRect(x + 2, y - 6, fill, 3);
}
function drawEnemies() {
  for (const e of state.enemies) {
    if (!e.alive || !onScreen(e.x, e.y, e.w, e.h)) continue;
    const warning = e.intent === 'windup', frame = warning ? 4: mentorMotionQuery.matches ? 0: Math.floor(e.t * 8) % 4;
    creatureSprites.draw(ctx, e.type, e.x - 4, e.y - 5, e.w + 8, e.h + 5, frame, e.vx < 0 ? - 1: 1);
    if (warning) {
      ctx.fillStyle = '#e6bf78';
      ctx.fillRect(e.x + e.w / 2 - 1, e.y - 17, 3, 7);
      ctx.fillRect(e.x + e.w / 2 - 1, e.y - 7, 3, 2);
    }
    if (e.type === 'wisp' && warning && e.warp) {
      ctx.strokeStyle = '#c7abed';
      ctx.lineWidth = 1;
      ctx.strokeRect(e.warp.x, e.warp.y, e.w, e.h);
    }
    drawMobHealth(e, e.x, e.y);
    drawQuestionRune(e);
  }
}
function drawWeaponProjectile(q) {
  const cx = q.x + q.w / 2, cy = q.y + q.h / 2, angle = Math.atan2(q.vy, q.vx);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  if (q.weaponId === 'spark_staff' || q.weaponId === 'recursion_prism') {
    ctx.rotate(state.gameTime * 5);
    ctx.fillStyle = '#122536';
    ctx.beginPath();
    ctx.moveTo(0, - 8);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(- 11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f5eeff';
    ctx.fillRect(- 3, - 3, 6, 6);
  } else if (q.weaponId === 'graph_trident') {
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(- 11, 0);
    ctx.lineTo(8, - 6);
    ctx.moveTo(- 11, 0);
    ctx.lineTo(8, 6);
    ctx.stroke();
    for (const yy of [- 6, 6]) {
      ctx.fillStyle = '#c3ffd6';
      ctx.fillRect(6, yy - 2, 5, 5);
    }
    ctx.fillStyle = q.color;
    ctx.fillRect(- 13, - 2, 5, 5);
  } else if (q.weaponId === 'pulse_wand') {
    ctx.rotate(state.gameTime * 5);
    ctx.fillStyle = '#071722';
    ctx.beginPath();
    ctx.moveTo(0, - 7);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(- 7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#effcff';
    ctx.fillRect(- 2, - 2, 4, 4);
  } else if (q.weaponId === 'index_bow') {
    ctx.fillStyle = q.color;
    ctx.fillRect(- 13, - 2, 24, 4);
    ctx.fillStyle = '#eef8ff';
    ctx.fillRect(8, - 4, 4, 8);
    ctx.fillStyle = q.color + '66';
    ctx.fillRect(- 21, - 1, 9, 2);
  } else if (q.weaponId === 'extend_launcher') {
    ctx.fillStyle = '#241406';
    ctx.fillRect(- 9, - 6, 18, 12);
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(- 9, - 6, 18, 12);
    ctx.fillStyle = q.color;
    for (const yy of [- 4, 0, 4]) ctx.fillRect(- 6, yy - 1, 12, 2);
  } else if (q.weaponId === 'sort_disc') {
    ctx.rotate(state.gameTime * 10);
    ctx.fillStyle = '#241f05';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff8c8';
    ctx.fillRect(- 2, - 6, 4, 12);
    ctx.fillRect(- 6, - 2, 12, 4);
  } else if (q.weaponId === 'nand_blaster') {
    ctx.fillStyle = q.color + '55';
    ctx.fillRect(- 18, - 5, 26, 10);
    pixelRect(ctx, - 8, - 5, 16, 10, shadeHex(q.color, - 55), '#130905', 1);
    ctx.fillStyle = '#fff1c9';
    ctx.font = 'bold 5px Consolas';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NAND', 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(8, - 2, 6, 4);
  } else {
    ctx.fillStyle = q.color + '55';
    ctx.fillRect(- 20, - 4, 28, 8);
    pixelRect(ctx, - 7, - 4, 17, 8, shadeHex(q.color, - 65), '#03100b', 1);
    ctx.fillStyle = q.color;
    ctx.fillRect(- 4, - 2, 14, 4);
    ctx.fillStyle = '#effff7';
    ctx.fillRect(5, - 1, 8, 2);
  }
  ctx.restore();
}
function drawProjectiles() {
  for (const q of state.projectiles) {
    if (!onScreen(q.x, q.y, q.w, q.h)) continue;
    if (q.power) {
      drawConceptProjectile(q);
    } else if (q.friendly && q.weaponId) {
      drawWeaponProjectile(q);
    } else if (q.kind === 'allySpell') {
      ctx.save();
      ctx.translate(q.x + 4, q.y + 4);
      ctx.rotate(Math.atan2(q.vy, q.vx));
      storyPoly(ctx, q.color, [[- 12, 0], [- 3, - 4], [6, 0], [- 3, 4]]);
      storyRect(ctx, '#f1fff3', - 2, - 1, 6, 2);
      ctx.restore();
    } else if (q.kind === 'shockwave') {
      ctx.fillStyle = '#7c321c';
      ctx.fillRect(q.x, q.y + 5, q.w, 5);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x + 3, q.y + 2, q.w - 6, 6);
      ctx.fillStyle = '#fff3a0';
      ctx.fillRect(q.x + 8, q.y, q.w - 16, 4);
    } else if (q.kind === 'cacheMine') {
      const pulse = .55 + .45 * Math.sin(state.gameTime * 9 + q.x * .01);
      ctx.fillStyle = '#1b0c2a';
      ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(q.x + .5, q.y + .5, q.w - 1, q.h - 1);
      ctx.globalAlpha = .45 + .45 * pulse;
      ctx.fillStyle = '#ff83ec';
      ctx.fillRect(q.x + 7, q.y + 5, 10, 10);
      ctx.globalAlpha = 1;
    } else if (q.kind === 'dataBlock') {
      ctx.fillStyle = '#0b2a20';
      ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(q.x + .5, q.y + .5, q.w - 1, q.h - 1);
      ctx.fillStyle = '#d8fff0';
      ctx.font = 'bold 8px Consolas';
      ctx.textAlign = 'center';
      ctx.fillText( (Math.floor(q.x / 10) % 2) ? '01': '10', q.x + q.w / 2, q.y + 13);
    } else if (q.kind === 'heavyBlock') {
      ctx.fillStyle = '#472713';
      ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x + 3, q.y + 3, q.w - 6, q.h - 6);
      ctx.fillStyle = '#fff1a8';
      ctx.fillRect(q.x + 6, q.y + 6, 4, 4);
    } else if (q.kind === 'timeBlade' || q.kind === 'lockedBlade') {
      ctx.save();
      ctx.translate(q.x + q.w / 2, q.y + q.h / 2);
      ctx.rotate(Math.atan2(q.vy, q.vx) + Math.PI / 2);
      ctx.fillStyle = '#e6eef9';
      ctx.fillRect(- 2, - 9, 4, 14);
      ctx.fillStyle = q.color;
      ctx.fillRect(- 3, 4, 6, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(- 1, - 10, 2, 4);
      ctx.restore();
    } else if (q.kind === 'crushShard') {
      ctx.save();
      ctx.translate(q.x + q.w / 2, q.y + q.h / 2);
      ctx.rotate(state.gameTime * 5);
      ctx.fillStyle = '#5d3d10';
      ctx.fillRect(- 6, - 6, 12, 12);
      ctx.strokeStyle = q.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(- 5, - 5, 10, 10);
      ctx.restore();
    } else if (q.kind === 'afterimageBolt') {
      ctx.save();
      ctx.translate(q.x + q.w / 2, q.y + q.h / 2);
      ctx.rotate(Math.atan2(q.vy, q.vx));
      ctx.fillStyle = q.color;
      ctx.fillRect(- 8, - 2, 16, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, - 1, 5, 2);
      ctx.restore();
    } else if (q.kind === 'chronoBolt') {
      ctx.save();
      ctx.translate(q.x + q.w / 2, q.y + q.h / 2);
      ctx.rotate(state.gameTime * 4);
      ctx.fillStyle = q.color;
      ctx.fillRect(- 5, - 2, 10, 4);
      ctx.fillStyle = '#dff0ff';
      ctx.fillRect(- 2, - 5, 4, 10);
      ctx.restore();
    } else if (q.kind === 'xorBolt') {
      ctx.fillStyle = '#102b40';
      ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.strokeStyle = q.color;
      ctx.strokeRect(q.x + .5, q.y + .5, q.w - 1, q.h - 1);
      ctx.fillStyle = '#e7fbff';
      ctx.fillRect(q.x + 3, q.y + 3, 4, 4);
    } else {
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.fillStyle = '#fff9';
      ctx.fillRect(q.x + 3, q.y + 2, 3, 3);
    }
  }
}
function drawBossTelegraph(b, x, y, w) {
  ctx.save();
  ctx.font = 'bold 12px Consolas';
  ctx.textAlign = 'center';
  if (b.action === 'telegraph-xor') {
    ctx.strokeStyle = '#65e7ff';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(x - 16, y - 10, b.w + 32, b.h + 20);
    ctx.setLineDash([]);
    ctx.fillStyle = '#dffcff';
    ctx.fillText('XOR BLINK — WATCH BOTH SIDES!', x + b.w / 2, y - 24);
  } else if (b.action === 'telegraph-slam') {
    const gy = arenaGroundAtX(x + b.w / 2);
    ctx.fillStyle = '#ffad5555';
    ctx.fillRect( (TERMINAL_COL + 3) * TILE, gy - 9, (PORTAL_COL - TERMINAL_COL - 6) * TILE, 9);
    ctx.fillStyle = '#ffe4a8';
    ctx.fillText('NAND SLAM — GET AIRBORNE!', x + b.w / 2, y - 24);
  } else if (b.action === 'telegraph-mines') {
    ctx.strokeStyle = '#ff83ec';
    ctx.lineWidth = 3;
    for (const m of(b.specialData || [])) {
      ctx.strokeRect(m.x - 14, m.y - 12, 28, 24);
    }
    ctx.fillStyle = '#ffd4fb';
    ctx.fillText('CACHE MINES — KEEP MOVING!', x + b.w / 2, y - 24);
  } else if (b.action === 'telegraph-rain') {
    ctx.fillStyle = 'rgba(125,255,174,.18)';
    ctx.strokeStyle = '#7dffae';
    ctx.lineWidth = 2;
    for (const m of(b.specialData || [])) {
      ctx.fillRect(m.x - 14, m.ground - 280, 28, 280);
      ctx.strokeRect(m.x - 14, m.ground - 280, 28, 280);
    }
    ctx.fillStyle = '#d8fff0';
    ctx.fillText('DATA RAIN — USE COVER!', x + b.w / 2, y - 24);
  } else if (b.action === 'telegraph-chrono') {
    ctx.save();
    ctx.translate(x + b.w / 2, y + b.h / 2);
    ctx.strokeStyle = '#ff8fd8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = state.gameTime * 1.2 + i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.lineTo(Math.cos(a) * 60, Math.sin(a) * 60);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#ffe0f4';
    ctx.fillText('TIME FRACTURE — FIND THE GAP!', x + b.w / 2, y - 24);
  } else if (b.action === 'telegraph-blades') {
    ctx.strokeStyle = '#f6cd58';
    ctx.lineWidth = 2;
    for (let i = - 3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + b.w / 2, y + 22);
      ctx.lineTo(x + b.w / 2 + i * 22, y - 64);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff0b8';
    ctx.fillText('BLADE ARRAY — DASH BETWEEN GAPS!', x + b.w / 2, y - 24);
  } else if (b.action === 'telegraph-lock') {
    const d = b.specialData || { x: player.x, y: player.y }, cx = d.x + player.w / 2, cy = d.y + player.h / 2;
    ctx.strokeStyle = '#8db8ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 + Math.sin(state.gameTime * 8) * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#dbe9ff';
    ctx.fillText('TIME LOCK — MOVE BEFORE IT CLOSES!', cx, cy - 72);
  } else if (b.action === 'telegraph-crush') {
    const d = b.specialData || { x: player.x }, tx = d.x, ground = arenaGroundAtX(tx);
    ctx.fillStyle = 'rgba(246,205,88,.20)';
    ctx.fillRect(tx - 28, ground - 250, 56, 250);
    ctx.strokeStyle = '#f6cd58';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 28, ground - 250, 56, 250);
    ctx.fillStyle = '#fff0b8';
    ctx.fillText('CRUSHING DESCENT — MOVE!', tx, ground - 262);
  } else if (b.action === 'telegraph-afterimage') {
    const bounds = arenaBounds();
    ctx.strokeStyle = '#ff8fd8';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(bounds.left + 18, y + 18);
    ctx.lineTo(bounds.right - 18, y + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffe0f4';
    ctx.fillText('AFTERIMAGE RUSH — KEEP MOVING!', x + b.w / 2, y - 24);
  }
  ctx.restore();
}
function drawBossAura(b, x, y, w) {
  const pulse = .5 + .5 * Math.sin(state.gameTime * 5), charging = b.action.startsWith('telegraph') || b.action === 'charge' || b.action === 'slam-fall';
  ctx.fillStyle = 'rgba(0,0,0,.34)';
  ctx.fillRect(x + 9, y + 58, 44, 6);
  if (PERF.richFx) {
    const g = ctx.createRadialGradient(x + 31, y + 31, 5, x + 31, y + 31, charging ? 52: 43);
    g.addColorStop(0, w.accent2 + (charging ? '88': '55'));
    g.addColorStop(1, '#0000');
    ctx.fillStyle = g;
    ctx.fillRect(x - 24, y - 24, 110, 110);
  }
  ctx.globalAlpha = .38 + .28 * pulse;
  ctx.strokeStyle = charging ? '#fff0b8': w.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 4, y + 4, 54, 54);
  ctx.globalAlpha = 1;
}
function drawBossLabel(b, x, y, color) {
  ctx.font = 'bold 10px Consolas';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#05080dcc';
  const label = b.name || worldData().boss, tw = ctx.measureText(label).width + 10;
  ctx.fillRect(x + b.w / 2 - tw / 2, y - 18, tw, 13);
  ctx.fillStyle = color;
  ctx.fillText(label, x + b.w / 2, y - 8);
  if (b.phase) {
    ctx.fillStyle = '#ff5d80';
    ctx.fillRect(x + 23, y - 23, 16, 3);
  }
}
function drawControlSpecter(x, y, b, w) {
  const float = Math.round(Math.sin(state.gameTime * 4) * 2), yy = y + float, core = b.action === 'charge' ? '#fff3a8': w.accent;
  ctx.fillStyle = '#0a0d18';
  ctx.beginPath();
  ctx.moveTo(x + 12, yy + 18);
  ctx.lineTo(x + 50, yy + 18);
  ctx.lineTo(x + 55, yy + 49);
  ctx.lineTo(x + 44, yy + 57);
  ctx.lineTo(x + 37, yy + 50);
  ctx.lineTo(x + 30, yy + 59);
  ctx.lineTo(x + 22, yy + 50);
  ctx.lineTo(x + 12, yy + 56);
  ctx.lineTo(x + 7, yy + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#263052';
  ctx.fillRect(x + 12, yy + 19, 38, 31);
  ctx.fillStyle = '#394b78';
  ctx.fillRect(x + 17, yy + 23, 28, 24);
  ctx.fillStyle = '#08111e';
  ctx.fillRect(x + 22, yy + 27, 18, 15);
  ctx.strokeStyle = core;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 22.5, yy + 27.5, 17, 14);
  ctx.fillStyle = core;
  ctx.fillRect(x + 28, yy + 32, 6, 6);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 30, yy + 33, 2, 2);
  ctx.fillStyle = w.accent2;
  ctx.fillRect(x + 4, yy + 26, 9, 7);
  ctx.fillRect(x + 49, yy + 26, 9, 7);
  ctx.fillRect(x + 1, yy + 30, 6, 4);
  ctx.fillRect(x + 55, yy + 30, 6, 4);
  ctx.strokeStyle = w.accent;
  ctx.lineWidth = 2;
  for (const dx of [17, 25, 37, 45]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, yy + 19);
    ctx.lineTo(x + dx + (dx < 31 ? - 4: 4), yy + 8);
    ctx.stroke();
    ctx.fillStyle = core;
    ctx.fillRect(x + dx + (dx < 31 ? - 6: 2), yy + 5, 4, 4);
  }
  ctx.fillStyle = '#c8f8ff';
  ctx.font = 'bold 7px Consolas';
  ctx.textAlign = 'center';
  ctx.fillText('CU', x + 31, yy + 46);
}
function drawOpcodeColossus(x, y, b, w) {
  const hot = b.action === 'charge' || b.action === 'telegraph-slam', lava = hot ? '#fff09b': w.accent;
  ctx.fillStyle = '#120b09';
  ctx.fillRect(x + 4, y + 17, 54, 35);
  ctx.fillRect(x + 9, y + 8, 17, 15);
  ctx.fillRect(x + 36, y + 8, 17, 15);
  ctx.fillRect(x + 1, y + 32, 12, 21);
  ctx.fillRect(x + 49, y + 32, 12, 21);
  ctx.fillStyle = '#4a2922';
  ctx.fillRect(x + 8, y + 20, 46, 31);
  ctx.fillStyle = '#6f3826';
  ctx.fillRect(x + 14, y + 13, 34, 34);
  ctx.fillStyle = '#261311';
  ctx.fillRect(x + 20, y + 17, 22, 15);
  ctx.fillStyle = lava;
  ctx.fillRect(x + 24, y + 21, 14, 7);
  ctx.fillStyle = '#fff8cc';
  ctx.fillRect(x + 27, y + 22, 8, 3);
  ctx.fillStyle = w.accent2;
  ctx.fillRect(x + 9, y + 34, 9, 13);
  ctx.fillRect(x + 44, y + 34, 9, 13);
  ctx.fillStyle = lava;
  ctx.fillRect(x + 3, y + 47, 14, 9);
  ctx.fillRect(x + 45, y + 47, 14, 9);
  ctx.fillStyle = '#130c09';
  ctx.fillRect(x + 18, y + 35, 26, 15);
  ctx.strokeStyle = lava;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 18.5, y + 35.5, 25, 14);
  ctx.fillStyle = '#ffe5a3';
  ctx.font = 'bold 8px Consolas';
  ctx.textAlign = 'center';
  ctx.fillText('OP', x + 31, y + 46);
  ctx.fillStyle = hot ? '#fff4aa': '#ffad55';
  ctx.fillRect(x + 12, y + 5, 6, 10);
  ctx.fillRect(x + 44, y + 5, 6, 10);
  ctx.fillStyle = '#2b1611';
  ctx.fillRect(x + 13, y + 3, 4, 5);
  ctx.fillRect(x + 45, y + 3, 4, 5);
}
function drawCycleWarden(x, y, b, w) {
  const spin = state.gameTime * 2.2, core = b.action === 'charge' ? '#fff': w.accent2;
  ctx.save();
  ctx.translate(x + 31, y + 31);
  ctx.strokeStyle = '#0a0911';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#5b4773';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = spin + i * Math.PI / 4, cx = Math.cos(a) * 27, cy = Math.sin(a) * 27;
    ctx.fillStyle = i % 2 ? w.accent: w.accent2;
    ctx.fillRect(Math.round(cx) - 3, Math.round(cy) - 3, 6, 6);
  }
  ctx.fillStyle = '#161225';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = core;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(- spin * .35);
  ctx.strokeStyle = '#f1e8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, - 10);
  ctx.moveTo(0, 0);
  ctx.lineTo(8, 4);
  ctx.stroke();
  ctx.fillStyle = core;
  ctx.fillRect(- 3, - 3, 6, 6);
  ctx.restore();
  ctx.fillStyle = '#2c2440';
  ctx.fillRect(x + 2, y + 27, 9, 18);
  ctx.fillRect(x + 51, y + 27, 9, 18);
  ctx.fillStyle = w.accent2;
  ctx.fillRect(x + 4, y + 30, 5, 10);
  ctx.fillRect(x + 53, y + 30, 5, 10);
}
function drawSignalTitan(x, y, b, w) {
  const pulse = .5 + .5 * Math.sin(state.gameTime * 7), core = b.action === 'charge' ? '#fff7bb': w.accent;
  ctx.fillStyle = '#07110f';
  ctx.fillRect(x + 9, y + 16, 44, 40);
  ctx.fillRect(x + 3, y + 25, 12, 24);
  ctx.fillRect(x + 47, y + 25, 12, 24);
  ctx.fillStyle = '#173b35';
  ctx.fillRect(x + 13, y + 18, 36, 36);
  ctx.fillStyle = '#245a4e';
  ctx.fillRect(x + 18, y + 22, 26, 27);
  ctx.fillStyle = '#071613';
  ctx.fillRect(x + 23, y + 27, 16, 15);
  ctx.strokeStyle = core;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 23.5, y + 27.5, 15, 14);
  ctx.fillStyle = core;
  ctx.fillRect(x + 28, y + 32, 6, 5);
  ctx.globalAlpha = .45 + .5 * pulse;
  ctx.fillStyle = '#e9fff5';
  ctx.fillRect(x + 30, y + 31, 2, 7);
  ctx.globalAlpha = 1;
  ctx.fillStyle = w.accent2;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 4, y + 28 + i * 7, 8, 3);
    ctx.fillRect(x + 50, y + 28 + i * 7, 8, 3);
  }
  ctx.fillStyle = '#7dffae';
  ctx.fillRect(x + 18, y + 47, 7, 7);
  ctx.fillRect(x + 37, y + 47, 7, 7);
  ctx.strokeStyle = core;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 31, y + 18);
  ctx.lineTo(x + 31, y + 5);
  ctx.moveTo(x + 25, y + 19);
  ctx.lineTo(x + 18, y + 9);
  ctx.moveTo(x + 37, y + 19);
  ctx.lineTo(x + 44, y + 9);
  ctx.stroke();
  ctx.fillStyle = core;
  ctx.fillRect(x + 28, y + 1, 6, 6);
  ctx.fillRect(x + 15, y + 6, 5, 5);
  ctx.fillRect(x + 42, y + 6, 5, 5);
}
const BOSS_RENDERERS = [drawControlSpecter, drawOpcodeColossus, drawCycleWarden, drawSignalTitan, drawFinalBossSprite, drawCycleWarden, drawControlSpecter, drawFinalBossSprite];
function drawBoss() {
  const b = state.boss;
  if (!b || !b.active || b.dead) return;
  const x = Math.floor(b.x), y = Math.floor(b.y), w = worldData();
  drawBossTelegraph(b, x, y, w);
  drawBossAura(b, x, y, w);
  if (!drawPlotBoss(b, x, y)) BOSS_RENDERERS[state.level](x, y, b, w);
  drawBossLabel(b, x, y, state.level === worlds.length - 1 ? '#ffe9b0': w.accent2);
}
function drawFinalBossSprite(x, y, b, w) {
  const charging = b.action.startsWith('telegraph') || b.action === 'slam-fall';
  const cape = charging ? '#4e1f25': '#352044';
  const gold = '#f6cd58', blonde = '#f5d94a', hairShadow = '#c4a22d', skin = '#e3b187', green = '#66c765', greenDark = '#2f8d43', black = '#151519', magenta = '#ff80c4';
  ctx.save();
  // animated royal data-cape silhouette
  const capeWave = Math.sin(state.gameTime * 5) > 0 ? 2: 0;
  ctx.fillStyle = '#120d1c';
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 16);
  ctx.lineTo(x + 2, y + 24 + capeWave);
  ctx.lineTo(x + 10, y + 48);
  ctx.lineTo(x + 24, y + 37);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 48, y + 16);
  ctx.lineTo(x + 60, y + 24 + (2 - capeWave));
  ctx.lineTo(x + 52, y + 48);
  ctx.lineTo(x + 38, y + 37);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = magenta;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 27 + capeWave);
  ctx.lineTo(x + 18, y + 34);
  ctx.moveTo(x + 56, y + 27 + (2 - capeWave));
  ctx.lineTo(x + 44, y + 34);
  ctx.stroke();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(x + 14, y + 56, 36, 6);
  // boots
  ctx.fillStyle = gold;
  ctx.fillRect(x + 16, y + 48, 9, 11);
  ctx.fillRect(x + 37, y + 48, 9, 11);
  ctx.fillStyle = black;
  ctx.fillRect(x + 18, y + 56, 7, 3);
  ctx.fillRect(x + 37, y + 56, 7, 3);
  // legs and pants
  ctx.fillStyle = green;
  ctx.fillRect(x + 18, y + 35, 10, 15);
  ctx.fillRect(x + 34, y + 35, 10, 15);
  ctx.fillStyle = gold;
  ctx.fillRect(x + 17, y + 41, 12, 4);
  ctx.fillRect(x + 33, y + 41, 12, 4);
  ctx.fillStyle = greenDark;
  ctx.fillRect(x + 20, y + 37, 6, 10);
  ctx.fillRect(x + 36, y + 37, 6, 10);
  // belt / waist
  ctx.fillStyle = gold;
  ctx.fillRect(x + 23, y + 30, 16, 5);
  ctx.fillStyle = magenta;
  ctx.fillRect(x + 29, y + 31, 4, 3);
  // cape / aura panel
  ctx.fillStyle = cape;
  ctx.fillRect(x + 10, y + 14, 42, 24);
  ctx.fillStyle = charging ? 'rgba(255,143,216,.22)': 'rgba(141,184,255,.18)';
  ctx.fillRect(x + 8, y + 12, 46, 28);
  // torso
  ctx.fillStyle = black;
  ctx.fillRect(x + 22, y + 16, 18, 16);
  ctx.fillRect(x + 25, y + 12, 12, 4);
  ctx.fillStyle = gold;
  ctx.fillRect(x + 22, y + 16, 3, 16);
  ctx.fillRect(x + 37, y + 16, 3, 16);
  // arms
  ctx.fillStyle = skin;
  ctx.fillRect(x + 12, y + 19, 10, 14);
  ctx.fillRect(x + 40, y + 19, 10, 14);
  ctx.fillStyle = gold;
  ctx.fillRect(x + 12, y + 31, 10, 4);
  ctx.fillRect(x + 40, y + 31, 10, 4);
  ctx.fillStyle = skin;
  ctx.fillRect(x + 11, y + 33, 6, 10);
  ctx.fillRect(x + 45, y + 33, 6, 10);
  // neck/head
  ctx.fillStyle = skin;
  ctx.fillRect(x + 27, y + 10, 8, 5);
  ctx.fillRect(x + 22, y + 4, 18, 14);
  // hair
  ctx.fillStyle = blonde;
  ctx.fillRect(x + 20, y + 2, 22, 7);
  ctx.fillRect(x + 18, y + 6, 7, 8);
  ctx.fillRect(x + 37, y + 6, 7, 8);
  ctx.fillRect(x + 24, y + 0, 4, 4);
  ctx.fillRect(x + 32, y + 0, 4, 4);
  ctx.fillStyle = gold;
  ctx.fillRect(x + 22, y - 3, 4, 5);
  ctx.fillRect(x + 29, y - 6, 4, 7);
  ctx.fillRect(x + 36, y - 3, 4, 5);
  ctx.fillStyle = magenta;
  ctx.fillRect(x + 30, y - 4, 2, 2);
  ctx.fillStyle = hairShadow;
  ctx.fillRect(x + 20, y + 8, 22, 2);
  ctx.fillRect(x + 21, y + 10, 2, 4);
  ctx.fillRect(x + 39, y + 10, 2, 4);
  // face details
  ctx.fillStyle = black;
  ctx.fillRect(x + 26, y + 9, 3, 3);
  ctx.fillRect(x + 33, y + 9, 3, 3);
  ctx.fillStyle = magenta;
  ctx.fillRect(x + 27, y + 10, 1, 1);
  ctx.fillRect(x + 34, y + 10, 1, 1);
  ctx.fillRect(x + 29, y + 13, 4, 1);
  // shoulder pads / ornamental accents
  ctx.fillStyle = gold;
  ctx.fillRect(x + 20, y + 16, 4, 5);
  ctx.fillRect(x + 38, y + 16, 4, 5);
  ctx.fillStyle = green;
  ctx.fillRect(x + 21, y + 21, 3, 4);
  ctx.fillRect(x + 38, y + 21, 3, 4);
  // idle aura particles
  if (charging) {
    ctx.fillStyle = 'rgba(255,128,196,.5)';
    ctx.fillRect(x + 4, y + 14, 4, 4);
    ctx.fillRect(x + 52, y + 18, 4, 4);
    ctx.fillRect(x + 7, y + 30, 3, 3);
    ctx.fillRect(x + 50, y + 34, 3, 3);
  }
  // floating parity blades visually connect the boss to its reward weapon
  ctx.fillStyle = magenta;
  ctx.fillRect(x + 2, y + 9, 3, 14);
  ctx.fillRect(x + 57, y + 9, 3, 14);
  ctx.fillStyle = '#fff3ff';
  ctx.fillRect(x + 3, y + 6, 1, 15);
  ctx.fillRect(x + 58, y + 6, 1, 15);
  ctx.fillStyle = gold;
  ctx.fillRect(x, y + 21, 7, 3);
  ctx.fillRect(x + 55, y + 21, 7, 3);
  ctx.restore();
}
function drawParticles() {
  for (const p of state.particles) {
    if (!onScreen(p.x, p.y, p.size, p.size, 24)) continue;
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
function drawCrosshair() {
  if (!state.started || state.paused || state.selected === 1) return;
  const m = mouseWorld();
  const c = Math.floor(m.x / TILE), r = Math.floor(m.y / TILE);
  if (!withinReach(c * TILE + 16, r * TILE + 16)) return;
  ctx.save();
  ctx.translate(- state.camera.x, - state.camera.y);
  ctx.strokeStyle = state.selected === 2 ? '#ff9a4b': currentWeapon().color;
  ctx.lineWidth = 2;
  ctx.strokeRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4);
  ctx.restore();
}
