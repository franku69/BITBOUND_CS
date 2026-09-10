/* Shared device policy and game-side controls. The landscape host owns geometry. */
(() => {
  'use strict';
  function detectHandheld(win, mode = 'auto', touchUsed = false) {
    if (mode !== 'auto') return mode === 'handheld';
    const nav = win.navigator || {}, points = nav.maxTouchPoints || 0;
    return touchUsed || win.matchMedia('(pointer: coarse)').matches ||
      (win.matchMedia('(hover: none)').matches && points > 0) ||
      nav.userAgentData?.mobile === true || /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '') ||
      (nav.platform === 'MacIntel' && points > 1);
  }
  class Handheld {
    constructor({window: win, document: doc, selectors = [], indicators = []}) {
      Object.assign(this, {win, doc, selectors, indicators});
      this.mode = 'auto'; this.touchUsed = false; this.listeners = [];
      // Accept only our same-origin host; no game or student state is exposed.
      try { this.presentation = win.parent?.BitboundLandscape?.connect(win) || null; }
      catch { this.presentation = null; }
      const refresh = () => this.refresh();
      this.listen(win, 'bitbound:landscape', refresh);
      this.listen(win, 'resize', refresh);
      this.listen(win.matchMedia('(pointer: coarse)'), 'change', refresh);
      this.listen(win.matchMedia('(hover: none)'), 'change', refresh);
      this.listen(win, 'pointerdown', event => {
        if (event.pointerType !== 'touch' || this.touchUsed) return;
        this.touchUsed = true;
        this.presentation?.useTouch();
        this.refresh();
      });
      selectors.forEach(select => this.listen(select, 'change', () => this.setMode(select.value)));
      this.refresh();
    }
    listen(target, type, callback) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, callback);
      this.listeners.push(() => target.removeEventListener?.(type, callback));
    }
    isMobile() { return this.presentation ? this.presentation.mobile : detectHandheld(this.win, this.mode, this.touchUsed); }
    setMode(mode) {
      if (!['auto', 'handheld', 'keyboard'].includes(mode)) return;
      this.mode = mode;
      this.presentation?.setMode(mode);
      this.refresh();
    }
    refresh() {
      if (this.disposed) return;
      // Recover if the frame's cached game booted before the host script.
      if (!this.presentation) {
        try { this.presentation = this.win.parent?.BitboundLandscape?.connect(this.win) || null; }
        catch { /* An unrelated cross-origin parent does not own our controls. */ }
      }
      if (this.presentation) this.mode = this.presentation.mode;
      this.mobile = this.isMobile();
      const classes = this.doc.documentElement.classList;
      classes.toggle('handheld', this.mobile);
      classes.toggle('touch-capable', this.mobile);
      classes.toggle('keyboard-controls', !this.mobile);
      this.selectors.forEach(select => { select.value = this.mode; });
      this.indicators.forEach(label => {
        label.textContent = this.mobile ? 'Landscape · D-pad + A/B · v30' : 'Keyboard controls ready · v30';
      });
    }
    requestLandscape() { return this.presentation?.enter() || Promise.resolve(); }
    dispose() { this.disposed = true; this.listeners.splice(0).forEach(remove => remove()); }
  }
  window.BitboundHandheld = Object.freeze({Handheld, detectHandheld});
})();
