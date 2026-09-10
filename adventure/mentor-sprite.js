/* Byte: six cached, reference-inspired poses. The world sprite stands one head taller than the player.
   Source art is 48 × 88 for a readable portrait; no images/fonts/network needed. */
( () => {
  'use strict';
  const WIDTH = 24, HEIGHT = 44, SCALE = 2, WORLD_WIDTH = 36, WORLD_HEIGHT = 56, POSES = ['idle', 'wave', 'wave-high', 'shrug', 'cheer', 'blink'];
  function paint(canvas, pose, part = null) {
    const g = canvas.getContext('2d');
    if (!part && window.BitboundCharacterRig) {
      const motion = pose === 'cheer' ? 'cheer': pose.startsWith('wave') ? 'wave': pose === 'shrug' ? 'speak': 'listen';
      window.BitboundCharacterRig.paint(g, {
        kind: 'byte',
        x: 24,
        foot: 86,
        scale: .88,
        face: 1,
        motion,
        phase: pose === 'wave-high' ? .6: pose === 'wave' ? .32: .5,
        mood: pose === 'blink' ? 'blink': pose === 'shrug' ? 'shock': 'smile',
        armed: false,
        precise: true,
        expression: { blink: pose === 'blink', speaking: pose === 'shrug', syllable: 1 }
      });
      return;
    }
    const ink = '#101c25', skin = '#cf8c55', lit = '#f1b976', shade = '#a9643a', navy = '#1e3b62';
    const rect = (c, x, y, w, h) => {
      g.fillStyle = c;
      g.fillRect(x, y, w, h);
    };
    const poly = (c, points) => {
      g.fillStyle = c;
      g.beginPath();
      points.forEach( ([x, y], i) => i ? g.lineTo(x, y): g.moveTo(x, y));
      g.closePath();
      g.fill();
    };
    const line = (c, width, points) => {
      g.strokeStyle = c;
      g.lineWidth = width;
      g.beginPath();
      points.forEach( ([x, y], i) => i ? g.lineTo(x, y): g.moveTo(x, y));
      g.stroke();
    };
    const lift = pose === 'cheer' ? - 2: pose === 'shrug' ? 1: 0;
    if (!part) {
      // Shoes and separated trouser legs: soft gray folds and visible cargo pockets.
      poly(ink, [[12, 58], [38, 58], [37, 80], [42, 84], [42, 88], [28, 88], [25, 72], [23, 86], [9, 87], [7, 83], [12, 79]]);
      poly('#626764', [[13, 58], [25, 61], [22, 80], [11, 81]]);
      poly('#77786d', [[26, 61], [37, 58], [35, 80], [28, 82]]);
      poly('#454f50', [[21, 65], [24, 63], [22, 80], [18, 81]]);
      poly('#4b5351', [[30, 71], [35, 68], [33, 81], [29, 82]]);
      rect('#8b8d7e', 14, 64, 5, 2);
      rect('#3b484d', 12, 67, 6, 6);
      rect('#777d70', 13, 67, 5, 2);
      rect('#545e5a', 31, 62, 5, 6);
      poly('#14232d', [[11, 79], [21, 80], [22, 86], [8, 86], [8, 83]]);
      poly('#14232d', [[28, 80], [35, 78], [40, 83], [41, 86], [28, 86]]);
      rect('#cad2cb', 8, 85, 14, 2);
      rect('#c2cfcd', 29, 85, 12, 2);
      rect('#91adb9', 11, 81, 7, 1);
      rect('#91adb9', 30, 81, 5, 1);
    }
    g.save();
    g.translate(0, lift);
    if (!part || part === 'body') {
      // Blue hood and short-sleeved shirt, a little wider than the backpack.
      poly(ink, [[14, 25], [32, 25], [41, 32], [40, 60], [35, 65], [14, 64], [8, 58], [7, 34]]);
      poly(navy, [[14, 27], [32, 27], [39, 33], [37, 58], [34, 62], [15, 61], [10, 55], [9, 34]]);
      poly('#2f5380', [[11, 31], [16, 29], [15, 44], [8, 45], [7, 35]]);
      poly('#294972', [[33, 29], [39, 32], [42, 42], [34, 45]]);
      line('#142944', 3, [[13, 29], [19, 35], [26, 37], [34, 29]]);
      line('#466583', 1, [[16, 29], [22, 33], [27, 33], [31, 29]]);
    }
    if (!part) {
      // Arms have distinct gestures, leaving the face and pack readable.
      if (pose === 'wave' || pose === 'wave-high' || pose === 'cheer') {
        poly(ink, [[7, 40], [14, 43], [10, 55], [4, 55], [1, 41], [0, 31], [6, 29]]);
        poly(skin, [[8, 42], [12, 43], [8, 51], [5, 49], [3, 38], [7, 37]]);
        const handY = pose === 'wave-high' ? 22: 28;
        poly(lit, [[2, handY], [4, handY - 4], [6, handY - 3], [6, handY + 5], [8, handY + 2], [10, handY + 3], [8, handY + 11], [4, handY + 12], [1, handY + 7], [0, handY + 1]]);
        rect(shade, 4, handY + 4, 1, 5);
        rect('#ffcf90', 2, handY + 1, 2, 5);
      } else {
        poly(ink, [[7, 41], [14, 43], [11, 56], [3, 57], [0, 48], [3, 42]]);
        poly(skin, [[8, 43], [12, 44], [9, 53], [5, 54], [2, 49], [3, 45]]);
        poly(lit, pose === 'shrug' ? [[1, 42], [3, 39], [5, 43], [9, 44], [9, 49], [5, 51], [1, 48]]: [[1, 46], [3, 44], [5, 48], [9, 49], [8, 54], [4, 54], [1, 51]]);
        rect(shade, 5, 49, 1, 3);
      }
      if (pose === 'cheer') {
        poly(ink, [[34, 41], [41, 39], [45, 30], [46, 19], [41, 17], [37, 22], [39, 31]]);
        poly(lit, [[38, 40], [41, 40], [45, 31], [44, 25], [40, 26], [41, 32]]);
        poly(skin, [[39, 18], [45, 17], [47, 22], [44, 27], [39, 26], [37, 22]]);
        rect(lit, 40, 18, 4, 3);
      } else {
        poly(ink, [[34, 42], [41, 40], [44, 48], [47, 46], [48, 54], [42, 58], [37, 55]]);
        poly(skin, [[36, 43], [40, 42], [42, 52], [45, 50], [46, 54], [42, 56], [39, 53]]);
        poly(lit, pose === 'shrug' ? [[39, 46], [39, 42], [41, 41], [43, 45], [45, 42], [47, 44], [47, 50], [43, 52], [40, 50]]: [[41, 49], [41, 45], [43, 44], [44, 49], [47, 46], [48, 48], [47, 54], [43, 56]]);
      }
    }
    if (!part || part === 'body') {
      // Broad charcoal backpack, with a curved top, double seams and a zipped pocket.
      line('#0d1920', 5, [[13, 29], [18, 40], [20, 52]]);
      line('#738078', 1, [[13, 30], [17, 40]]);
      line('#0c171d', 5, [[33, 29], [29, 40], [29, 50]]);
      line('#6f7e74', 1, [[33, 30], [30, 38]]);
      poly('#0c171c', [[20, 34], [28, 34], [34, 39], [36, 48], [36, 59], [32, 63], [18, 64], [12, 60], [12, 46], [15, 38]]);
      poly('#3d4646', [[20, 37], [28, 36], [32, 40], [34, 48], [33, 58], [30, 61], [18, 61], [15, 58], [15, 45], [17, 40]]);
      poly('#505750', [[19, 39], [28, 38], [31, 41], [31, 44], [17, 45], [17, 42]]);
      line('#748077', 1, [[16, 58], [15, 47], [17, 41], [21, 38], [28, 38], [32, 43], [33, 56], [31, 60], [20, 61], [16, 58]]);
      poly('#252f32', [[18, 46], [30, 45], [32, 49], [31, 57], [28, 59], [18, 59], [16, 55], [16, 49]]);
      line('#727d73', 1, [[18, 48], [29, 47], [31, 49]]);
      rect('#c0c8b4', 28, 48, 1, 4);
      rect('#a0b09d', 28, 51, 2, 1);
      rect('#16242b', 13, 49, 2, 7);
      rect('#8b9480', 32, 49, 1, 3);
      rect('#5d726c', 19, 59, 9, 1);
    }
    if ( (!part || part === 'head') && window.BitboundFaceArt) {
      g.save();
      g.translate(- 8, 0);
      g.scale(1, 88 / 96);
      window.BitboundFaceArt.paint(g, { kind: 'byte', mood: pose === 'blink' ? 'blink': pose === 'shrug' ? 'shock': 'smile' });
      g.restore();
    } else if (!part || part === 'head') {
      // Tan face, ears, an open smile and chunky, tousled black hair.
      rect(shade, 20, 24, 9, 6);
      rect(skin, 22, 24, 6, 5);
      poly(ink, [[13, 8], [17, 4], [30, 4], [35, 9], [35, 22], [31, 28], [23, 30], [16, 26], [12, 19]]);
      poly(skin, [[15, 10], [20, 6], [29, 7], [33, 11], [32, 23], [28, 27], [22, 27], [17, 24], [14, 19]]);
      poly(lit, [[18, 11], [29, 10], [31, 13], [31, 22], [27, 25], [21, 24], [17, 20], [17, 14]]);
      rect(skin, 11, 15, 4, 7);
      rect('#e9ac6b', 12, 16, 2, 4);
      rect(skin, 33, 14, 3, 7);
      rect(lit, 33, 15, 2, 3);
      poly('#131e20', [[12, 16], [10, 11], [13, 6], [12, 4], [17, 4], [18, 0], [22, 2], [25, 0], [28, 2], [32, 1], [33, 5], [36, 8], [35, 15], [32, 16], [31, 10], [28, 8], [26, 12], [24, 9], [21, 11], [20, 8], [17, 10], [15, 10], [15, 17]]);
      poly('#334139', [[14, 6], [18, 3], [20, 4], [17, 6], [14, 10]]);
      poly('#344139', [[23, 4], [26, 2], [29, 4], [27, 5]]);
      rect('#263831', 31, 6, 2, 2);
      rect('#34352a', 18, 13, 5, 1);
      rect('#34352a', 27, 12, 4, 1);
      if (pose === 'blink') {
        rect('#373f33', 19, 16, 4, 1);
        rect('#373f33', 27, 15, 4, 1);
      } else {
        rect('#fff1d4', 18, 15, 5, 5);
        rect('#fff1d4', 27, 14, 4, 5);
        rect('#172a31', 20, 15, 2, 4);
        rect('#172a31', 28, 14, 2, 4);
        rect('#fffce4', 20, 15, 1, 1);
        rect('#fffce4', 28, 14, 1, 1);
      }
      rect('#be783f', 24, 18, 2, 3);
      rect('#e7a363', 23, 21, 4, 1);
      if (pose === 'shrug') {
        poly('#633d29', [[21, 23], [25, 22], [29, 23], [28, 25], [22, 25]]);
      } else {
        poly('#78432f', [[19, 21], [24, 23], [30, 21], [29, 25], [26, 27], [22, 26]]);
        poly('#fff4da', [[20, 22], [25, 23], [29, 22], [27, 24], [23, 24]]);
        rect('#d87c57', 24, 25, 3, 1);
      }
    }
    g.restore();
  }
  function create(document) {
    return Object.freeze(POSES.map(pose => {
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH * SCALE;
      canvas.height = HEIGHT * SCALE;
      paint(canvas, pose);
      return canvas;
    }));
  }
  function worldFrames(document, frames) {
    return Object.freeze(frames.map( (frame, index) => {
      const small = document.createElement('canvas');
      small.width = WORLD_WIDTH;
      small.height = WORLD_HEIGHT;
      const g = small.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(frame, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      // Align the small smile with the resized face.
      if (!window.BitboundFaceArt && POSES[index] !== 'shrug') {
        g.fillStyle = '#77432d';
        g.fillRect(14, 14, 8, 3);
        g.fillStyle = '#fff2d5';
        g.fillRect(15, 14, 6, 1);
        g.fillStyle = '#d48754';
        g.fillRect(17, 16, 3, 1);
      }
      return small;
    }));
  }
  function idleFrame(seconds, reduced = false) {
    if (reduced) return 0;
    const phase = seconds % 9;
    if (phase < .9) return [1, 2, 1, 2, 0][Math.min(4, Math.floor(phase / .18))];
    return phase > 5 && phase < 5.18 ? 5: 0;
  }
  const reactions = Object.freeze({
    welcome: [0, 1, 2, 1, 2, 0],
    think: [0, 3, 5, 3, 0],
    success: [1, 4, 4, 1, 0],
    oops: [3, 5, 3, 0],
    explain: [1, 0]
  });
  window.BitboundMentorSprite = Object.freeze({
    WIDTH,
    HEIGHT,
    SCALE,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    POSES,
    paint,
    create,
    worldFrames,
    idleFrame,
    reactions
  });
})();
