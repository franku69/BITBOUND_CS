/** Entry/IDE music owns one context. Embedded IDEs use the parent game's mix. */
export function startPageMusic(initial = 'choose') {
  if (window.parent !== window || !window.BitboundMusic) return { select() {} };
  const { Player, preference, catalog } = window.BitboundMusic;
  const button = document.querySelector('[data-music-toggle]');
  let ctx = null, player = null, track = initial, enabled = preference(), pending = false, away = false;
  function paint() {
    if (!button) return;
    button.textContent = !enabled ? '♫ Music off': ctx?.state === 'running' ? '♫ Music on': '♫ Play music';
    button.setAttribute('aria-pressed', String(enabled && ctx?.state === 'running'));
    button.title = catalog[track].name;
    button.dataset.musicTrack = track;
  }
  function activate() {
    if (!enabled || away || document.hidden) return;
    try {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) {
          if (button) {
            button.textContent = 'Audio unavailable';
            button.disabled = true;
          }
          return;
        }
        ctx = new Audio();
        player = new Player(ctx, ctx.destination);
        player.setTrack(track);
        ctx.addEventListener?. ('statechange', () => {
          if (ctx.state === 'running' && !away && !document.hidden) player.start();
          paint();
        });
      }
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        if (!pending) {
          pending = true;
          Promise.resolve(ctx.resume()).catch( () => {}).finally( () => {
            pending = false;
            if (!away && !document.hidden) player.start();
            paint();
          });
        }
      } else player.start();
      paint();
    } catch {
      if (button) {
        button.textContent = '♫ Retry music';
      }
      /* Audio is optional. */
    }
  }
  function select(id) {
    if (!catalog[id] || track === id) return;
    track = id;
    player?.setTrack(id);
    paint();
  }
  // Only a real user gesture unlocks sound. No autoplay promise or silent loop.
  const unlock = event => {
    if (button?.contains(event.target)) return;
    activate();
  };
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);
  button?.addEventListener('click', () => {
    if (enabled && ctx?.state === 'running') enabled = false; else enabled = true;
    preference(enabled);
    player?.setEnabled(enabled);
    if (enabled) activate(); else if (ctx) {
      player.halt(0);
      Promise.resolve(ctx.suspend()).catch( () => {});
    }
    paint();
  });
  function background(hidden) {
    player?.setBackground(hidden);
    if (hidden) {
      if (ctx) Promise.resolve(ctx.suspend()).catch( () => {});
    } else if (ctx) activate();
    paint();
  }
  document.addEventListener('visibilitychange', () => background(document.hidden || away));
  window.addEventListener('pagehide', () => {
    away = true;
    background(true);
  });
  window.addEventListener('pageshow', () => {
    away = false;
    background(document.hidden);
  });
  paint();
  return Object.freeze({ select });
}
