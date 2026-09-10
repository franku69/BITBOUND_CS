/* One complete human head for world sprites, cinematics and portraits.
 * Paint once: expressions never erase or patch a cached face. Coordinates stay
 * inside the 64×96 rig. Movement, prop ownership and story state live elsewhere. */
function characterFaceStyle(actor) {
  const hero = actor.kind === 'hero', byte = actor.kind === 'byte', index = actor.index ?? 0;
  const a = hero ? (actor.appearance || state.appearance): byte ? { skin: '#cc915f', hair: '#19272c', eyes: '#354f4c' }: DAWN_COMPANY[index];
  return {
    skin: a.skin,
    hair: a.hair,
    eyes: a.eyes || ['#516b79', '#786697', '#654b36', '#557665'][index],
    style: hero ? (a.hairStyle || 'short'): byte ? 'messy': ['swept', 'mage', 'cropped', 'braid'][index],
    broad: !hero && !byte && index === 2,
    byte,
    hero,
    index
  };
}
function paintCharacterHead(g, actor) {
  const f = characterFaceStyle(actor), e = actor.expression || {}, m = actor.mood || 'calm';
  const ink = '#182532', skin = f.skin, shadow = shadeHex(skin, - 27), light = shadeHex(skin, 16), hair = f.hair, hairLight = shadeHex(hair, 25);
  const r = (c, x, y, w, h) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  const p = (c, points) => {
    g.fillStyle = c;
    g.beginPath();
    points.forEach( ([x, y], i) => i ? g.lineTo(x, y): g.moveTo(x, y));
    g.closePath();
    g.fill();
  };
  const line = (c, points) => {
    g.strokeStyle = c;
    g.lineWidth = 1;
    g.beginPath();
    points.forEach( ([x, y], i) => i ? g.lineTo(x, y): g.moveTo(x, y));
    g.stroke();
  };
  // Hair behind the jaw, small ears and a tapered jaw connecting to the neck.
  if (['long', 'mage', 'braid'].includes(f.style)) p(shadeHex(hair, - 12), [[22, 7], [38, 7], [43, 15], [43, 35], [37, 32], [38, 18], [24, 18], [24, 32], [20, 34], [20, 15]]);
  r(shadow, 29, 24, 7, 7);
  r(skin, 30, 25, 5, 5);
  p(ink, [[24, 7], [30, 4], [38, 7], [42, 13], [41, 22], [37, 28], [29, 29], [23, 24], [21, 15]]);
  r(shadow, 20, 16, 3, 4);
  r(skin, 21, 16, 2, 3);
  r(shadow, 40, 16, 3, 4);
  r(skin, 40, 16, 2, 3);
  p(shadow, [[24, 10], [30, 7], [37, 9], [40, 14], [39, 22], [36, 26], [30, 27], [24, 23], [22, 16]]);
  p(skin, [[25, 11], [31, 8], [37, 11], [39, 15], [38, 22], [35, 26], [30, 26], [25, 22], [24, 16]]);
  p(light, [[26, 12], [32, 10], [37, 13], [37, 20], [34, 23], [29, 23], [26, 19]]);
  r(skin, 29, 22, 7, 4);
  r(shadow, 31, 27, 4, 1);
  const hairShapes = {
    short: [[21, 19], [20, 11], [24, 6], [31, 4], [39, 7], [42, 13], [39, 15], [36, 11], [32, 13], [30, 10], [26, 14], [23, 14], [23, 19]],
    spiky: [[21, 19], [20, 10], [23, 9], [22, 3], [28, 6], [31, 1], [34, 6], [40, 3], [40, 9], [44, 12], [39, 15], [36, 11], [32, 13], [28, 10], [24, 14], [23, 19]],
    messy: [[21, 19], [20, 12], [22, 8], [22, 4], [27, 6], [30, 2], [33, 5], [38, 4], [41, 9], [43, 12], [39, 15], [37, 10], [34, 13], [31, 10], [27, 14], [24, 12], [23, 19]],
    long: [[20, 25], [20, 12], [24, 6], [31, 4], [38, 6], [42, 13], [41, 27], [39, 25], [38, 16], [35, 10], [31, 13], [27, 10], [24, 15], [23, 25]],
    ponytail: [[13, 33], [13, 21], [17, 13], [21, 11], [24, 6], [31, 4], [39, 7], [42, 13], [38, 15], [34, 10], [29, 12], [24, 14], [21, 19], [18, 20], [17, 31]],
    mohawk: [[21, 19], [20, 12], [25, 9], [28, 2], [33, 2], [37, 9], [40, 11], [41, 17], [38, 18], [36, 13], [27, 12], [24, 15], [23, 19]],
    swept: [[21, 17], [20, 10], [23, 6], [29, 3], [36, 4], [40, 8], [42, 13], [38, 14], [35, 10], [31, 15], [27, 16], [28, 11], [24, 13], [23, 18]],
    mage: [[21, 24], [20, 12], [25, 6], [37, 6], [41, 12], [40, 29], [38, 27], [38, 17], [36, 11], [32, 15], [27, 17], [28, 12], [24, 16], [23, 25]],
    cropped: [[21, 18], [20, 11], [24, 8], [24, 4], [28, 7], [32, 3], [35, 7], [39, 6], [41, 12], [40, 17], [38, 17], [37, 12], [31, 11], [27, 13], [24, 12], [23, 19]],
    braid: [[21, 21], [20, 13], [23, 7], [30, 4], [37, 7], [41, 13], [39, 18], [37, 13], [33, 10], [30, 14], [27, 11], [24, 15], [23, 22]]
  };
  p(hair, hairShapes[f.style] || hairShapes.short);
  p(hairLight, [[23, 10], [27, 7], [32, 6], [29, 9], [26, 10], [23, 14]]);
  r(shadeHex(hair, 12), 36, 8, 3, 2);
  if (f.style === 'braid') {
    for (let n = 0; n < 5; n++) {
      r(shadeHex(hair, - 12), 21 - n % 2, 24 + n * 3, 4, 4);
      r(hairLight, 21 - n % 2, 24 + n * 3, 2, 2);
    }
    r('#dfc58a', 20, 38, 4, 2);
    p('#e8e4cb', [[28, 6], [31, 3], [34, 5], [34, 8], [31, 10], [28, 8]]);
    r('#579484', 30, 5, 2, 3);
  }
  if (f.style === 'mage') {
    p('#251c37', [[17, 11], [26, 0], [34, 0], [39, 8], [45, 12], [42, 15], [20, 15], [16, 13]]);
    p('#473452', [[20, 11], [28, 3], [33, 3], [36, 9], [39, 11]]);
    line('#af8dca', [[21, 11], [29, 9], [39, 12]]);
    r('#e9c982', 34, 10, 3, 2);
  }
  // Compact eyes, single lids and subtle mouths instead of toothy muzzle masks.
  const closed = e.blink || m === 'blink' || actor.motion === 'sleep', gaze = clamp(e.gaze || 0, - 1, 1);
  for (const [i, x] of [26, 35].entries()) {
    if (closed) {
      r('#454038', x, 18, 3, 1);
      continue;
    }
    r('#efdfc9', x, 16, 3, m === 'shock' ? 4: 3);
    r(f.eyes, x + 1 + gaze * .5, 16, 1.5, m === 'shock' ? 3: 2);
    r('#23313a', x + 1 + gaze * .5, 17, 1, 1);
    r(shadeHex(hair, - 8), x, 15, 3, 1);
    if (m === 'angry') line(shadeHex(hair, - 5), [[x, 13 + (i ? 1: 0)], [x + 3, 13 + (i ? 0: 1)]]); else if (m === 'sad') line(shadeHex(hair, - 5), [[x, 14 - (i ? 1: 0)], [x + 3, 14 - (i ? 0: 1)]]); else r(shadeHex(hair, 3), x, 13, 3, 1);
  }
  r(shadow, 32, 19, 1, 3);
  r(light, 33, 19, 1, 2);
  r(shadow, 33, 22, 1, 1);
  const lip = shadeHex(skin, - 65), smile = ['smile', 'grin', 'cheer'].includes(m);
  if (e.speaking && e.syllable !== 0) {
    const open = e.syllable === 1 ? 2: 1;
    r(lip, 31, 24, 3, open);
    if (open === 2) r(shadeHex(skin, - 8), 32, 25, 1, 1);
  } else if (m === 'shock') r(lip, 32, 24, 2, 2); else if (smile) {
    r(lip, 30, 24, 1, 1);
    r(lip, 31, 25, 3, 1);
    r(lip, 34, 24, 1, 1);
  } else {
    r(lip, 31, 24, 4, 1);
    if (m === 'angry' || m === 'sad') r(lip, 30, 25, 1, 1);
  }
  if (f.broad) {
    r(shadow, 25, 22, 1, 2);
    r(shadow, 38, 22, 1, 2);
    r(shadow, 28, 26, 1, 1);
    r(shadow, 36, 26, 1, 1);
  }
  if (actor.elite && !f.hero && !f.byte && f.index === 0) {
    p('#977248', [[24, 9], [24, 5], [28, 8], [32, 3], [35, 8], [39, 5], [39, 10]]);
    line('#ead093', [[25, 9], [29, 10], [35, 10], [38, 9]]);
    r('#b269aa', 31, 7, 2, 2);
  }
}
window.BitboundFaceArt = Object.freeze({ paint: paintCharacterHead });
