/* Browser presentation only. No game state, storage, physics or polling. */
(() => {
  'use strict';

  class Handheld {
    constructor({ window: win, document: doc, prompt, enter, stay, status,
      canRotate = () => true, onBlock = () => {} }) {
      Object.assign(this, { win, doc, prompt, enter, stay, status, canRotate, onBlock });
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
      // A touch-enabled laptop with a mouse retains its desktop presentation.
      return this.coarse.matches || (this.hoverless.matches &&
        (this.win.navigator?.maxTouchPoints || 0) > 0);
    }

    refresh() {
      if (this.disposed) return;
      this.mobile = this.isMobile();
      this.doc.documentElement.classList.toggle('handheld', this.mobile);
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
