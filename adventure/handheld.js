/* Browser presentation only. No game state, storage, physics or polling. */
(() => {
  'use strict';

  class Handheld {
    constructor({ window: win, document: doc, prompt, enter, stay, status, selectors = [], indicators = [],
      canRotate = () => true, onBlock = () => {} }) {
      Object.assign(this, { win, doc, prompt, enter, stay, status, selectors, indicators, canRotate, onBlock });
      this.mode = 'auto';
      this.touchUsed = false;
      this.coarse = win.matchMedia('(pointer: coarse)');
      this.hoverless = win.matchMedia('(hover: none)');
      this.blocked = false;
      this.portraitAllowed = false;
      this.requesting = false;
      this.locked = false;
      this.epoch = 0;
      this.disposed = false;
      this.listeners = [];
      const refresh = () => this.refresh();
      this.listen(win, 'resize', refresh);
      this.listen(win.screen?.orientation, 'change', refresh);
      this.listen(this.coarse, 'change', refresh);
      this.listen(this.hoverless, 'change', refresh);
      // One source of truth for detection, layout and control visibility.
      // A real touch also covers browsers requesting a desktop user agent.
      this.listen(win, 'pointerdown', event => {
        if (event.pointerType !== 'touch' || this.touchUsed) return;
        this.touchUsed = true;
        if (this.mode === 'auto') this.refresh();
      });
      selectors.forEach(select => this.listen(select, 'change', () => this.setMode(select.value)));
      this.listen(doc, 'fullscreenchange', () => {
        // Leaving fullscreen never immediately forces the browser back into it.
        if (!doc.fullscreenElement) this.unlock();
        this.refresh();
      });
      this.listen(win, 'pagehide', () => this.unlock());
      this.listen(enter, 'click', () => this.requestLandscape());
      this.listen(stay, 'click', () => {
        this.portraitAllowed = true;
        this.refresh();
      });
      this.listen(prompt, 'keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          this.portraitAllowed = true;
          this.refresh();
        } else if (event.key === 'Tab') {
          const first = enter.disabled ? stay : enter;
          if (event.shiftKey && doc.activeElement === first) {
            event.preventDefault(); stay.focus();
          } else if (!event.shiftKey && doc.activeElement === stay) {
            event.preventDefault(); first.focus();
          }
        }
      });
      this.refresh();
    }

    listen(target, type, callback) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, callback);
      this.listeners.push(() => target.removeEventListener?.(type, callback));
    }

    isMobile() {
      if (this.mode !== 'auto') return this.mode === 'handheld';
      const nav = this.win.navigator || {};
      const points = nav.maxTouchPoints || 0;
      return this.touchUsed || this.coarse.matches || (this.hoverless.matches && points > 0) ||
        nav.userAgentData?.mobile === true || /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '') ||
        (nav.platform === 'MacIntel' && points > 1);
    }

    setMode(mode) {
      if (!['auto', 'handheld', 'keyboard'].includes(mode)) return;
      this.mode = mode;
      this.refresh();
    }

    refresh() {
      if (this.disposed) return;
      this.mobile = this.isMobile();
      this.doc.documentElement.classList.toggle('handheld', this.mobile);
      this.doc.documentElement.classList.toggle('touch-capable', this.mobile);
      this.doc.documentElement.classList.toggle('keyboard-controls', !this.mobile);
      this.selectors.forEach(select => { select.value = this.mode; });
      this.indicators.forEach(label => {
        label.textContent = this.mobile ? 'Handheld controls ready · D-pad + A/B · v29' : 'Keyboard controls ready · v29';
      });
      const canRotate = this.canRotate();
      if (!canRotate || !this.mobile) this.unlock();
      const portrait = this.win.innerHeight > this.win.innerWidth;
      if (!portrait) this.portraitAllowed = false;
      const blocked = this.mobile && portrait && !this.portraitAllowed && canRotate;
      this.prompt.hidden = !blocked;
      if (blocked === this.blocked) return;
      this.blocked = blocked;
      if (blocked) {
        this.previousFocus = this.doc.activeElement;
        this.enter.focus();
      } else {
        this.previousFocus?.focus?.({ preventScroll: true });
      }
      this.onBlock(blocked);
    }

    async requestLandscape() {
      if (this.disposed || !this.isMobile() || this.requesting) return;
      const epoch = this.epoch;
      const current = () => !this.disposed && epoch === this.epoch && !this.doc.hidden && this.canRotate();
      this.requesting = true;
      this.enter.disabled = true;
      this.status.textContent = 'Opening landscape play…';
      try {
        // Call directly from a tap: fullscreen requires transient activation.
        if (!this.doc.fullscreenElement && this.doc.documentElement.requestFullscreen) {
          try { await this.doc.documentElement.requestFullscreen(); } catch { /* Rotation still works manually. */ }
        }
        if (!current()) return;
        const orientation = this.win.screen?.orientation;
        if (orientation?.lock) {
          try {
            await orientation.lock('landscape');
            if (!current()) { orientation.unlock?.(); return; }
            this.locked = true;
          } catch { /* Safari and restricted browser contexts can reject locking. */ }
        }
        this.status.textContent = this.locked
          ? 'Landscape ready. Hold your device sideways.'
          : 'Turn your device sideways. If needed, turn off your device’s rotation lock.';
      } finally {
        this.requesting = false;
        this.enter.disabled = false;
        this.refresh();
      }
    }

    unlock() {
      this.epoch++;
      if (this.locked) {
        try { this.win.screen?.orientation?.unlock?.(); } catch { /* Optional API. */ }
      }
      this.locked = false;
    }

    dispose() {
      this.disposed = true;
      this.unlock();
      this.listeners.splice(0).forEach(remove => remove());
    }
  }

  window.BitboundHandheld = Object.freeze({ Handheld });
})();
