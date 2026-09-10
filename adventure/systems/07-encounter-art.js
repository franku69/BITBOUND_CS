/* A finite battle vignette. Uses existing pixel atlases and the shared rig;
   no gameplay simulation runs behind an encounter and no images are fetched. */
function drawEncounterBattle(g, session, progress = 1) {
  const p = clamp(progress, 0, 1), mode = session.visual || 'intro', win = mode === 'win', retry = mode === 'retry';
  const backdrop = getStoryBackdrop(REGION_BIOMES[session.world]);
  g.save();
  g.clearRect(0, 0, 640, 224);
  g.imageSmoothingEnabled = false;
  g.drawImage(backdrop, 0, - 76);
  g.fillStyle = '#06111b44';
  g.fillRect(0, 0, 640, 224);
  g.fillStyle = '#0c2838';
  g.beginPath();
  g.ellipse(140, 204, 100, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#214039';
  g.beginPath();
  g.ellipse(470, 174, 78, 10, 0, 0, Math.PI * 2);
  g.fill();
  const hero = {
    kind: 'hero',
    appearance: session.appearance,
    x: mode === 'intro' ? lerp(- 50, 135, rigEase(p / .55)): 135,
    foot: 201,
    scale: 1.02,
    face: 1,
    motion: win ? 'cast': retry ? 'guard': p < .55 ? 'run': 'guard',
    phase: win ? p: retry ? .4: p < .55 ? p * 2 % 1: 0,
    armed: !win,
    precise: true,
    mood: win ? 'smile': 'calm'
  };
  drawRigActor(g, hero);
  const mx = mode === 'intro' ? lerp(730, 470, rigEase( (p - .08) / .65)): retry ? 470 - Math.sin(p * Math.PI) * 24: 470;
  const dissolve = win ? rigEase( (p - .64) / .36): 0;
  g.save();
  g.globalAlpha = 1 - dissolve;
  creatureSprites.draw(g, session.enemy.type, mx - 44, 92 + (retry ? Math.sin(p * Math.PI) * - 5: 0), 88, 80, win ? 5: Math.min(3, Math.floor(p * 8) % 4), - 1);
  g.restore();
  if (!win || p < .68) {
    g.save();
    g.globalAlpha = win ? 1 - rigEase( (p - .48) / .2): .8;
    g.strokeStyle = retry ? '#edc08b': '#91e7d2';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(mx, 135, 55, 48, 0, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + (win ? p: 0), x = mx + Math.cos(a) * 55, y = 135 + Math.sin(a) * 48;
      storyRect(g, '#dbefad', x - 3, y - 3, 6, 6);
    }
    g.restore();
  }
  if (win && p > .46) {
    const hand = rigSocket(hero), u = rigEase( (p - .46) / .2), x = lerp(hand.x, 470, u), y = lerp(hand.y, 134, u);
    if (p < .68) {
      storyLine(g, '#5abdb1', 6, [[hand.x, hand.y], [x, y]]);
      storyLine(g, '#e8ffe4', 2, [[hand.x, hand.y], [x, y]]);
    }
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, dist = 8 + dissolve * 80;
      g.globalAlpha = 1 - dissolve;
      storyRect(g, i % 2 ? '#fff0b0': '#87edda', 470 + Math.cos(a) * dist, 134 + Math.sin(a) * dist, 3, 5);
    }
    g.globalAlpha = 1;
  }
  // Camera-frame corners and a single readable identification strip.
  g.fillStyle = '#081520e8';
  g.fillRect(0, 0, 640, 27);
  g.font = 'bold 12px monospace';
  g.fillStyle = '#d9efe2';
  g.textAlign = 'left';
  g.fillText(`WORLD ${session.world+1} · ${(MOBS[session.enemy.type]?.name||'Rune creature').toUpperCase()}`, 14, 18);
  g.fillStyle = '#e3ce92';
  g.textAlign = 'right';
  g.fillText(win ? 'SEAL BROKEN': retry ? 'READ · THINK · RETRY': 'RUNE ENCOUNTER', 626, 18);
  g.textAlign = 'left';
  if (mode === 'intro' && p < .26) {
    g.fillStyle = '#081420';
    for (let i = 0; i < 8; i++) {
      const width = 640 * (1 - rigEase(p / .26));
      g.fillRect(i % 2 ? 640 - width: 0, 27 + i * 25, width, 26);
    }
  }
  g.restore();
}
