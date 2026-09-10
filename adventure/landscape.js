/* A landscape-sized browsing context keeps CSS media queries and pointer
   coordinates consistent. Only the frame rotates; game/input code stays native. */
(() => {
  'use strict';
  function landscapeGeometry(width, height, handheld) {
    const rotated = handheld && height > width;
    return {width: rotated ? height : width, height: rotated ? width : height,
      rotated, transform: rotated ? `translateX(${width}px) rotate(90deg)` : 'none'};
  }
  class Landscape {
    constructor({window: win, document: doc, stage, frame, status}) {
      Object.assign(this, {win, doc, stage, frame, status});
      this.mode = 'auto'; this.touchUsed = false; this.listeners = [];
      this.epoch = 0; this.locked = false; this.requesting = false;
      this.refresh();
      const refresh = () => this.refresh();
      this.listen(win, 'resize', refresh);
      this.listen(win.screen?.orientation, 'change', refresh);
      this.listen(win.matchMedia('(pointer: coarse)'), 'change', refresh);
      this.listen(win.matchMedia('(hover: none)'), 'change', refresh);
      this.listen(doc, 'fullscreenchange', () => {
        if (!doc.fullscreenElement) this.unlock();
        this.refresh();
      });
      this.listen(win, 'pagehide', () => this.unlock());
      this.listen(win, 'pageshow', refresh);
      this.listen(frame, 'load', () => { status.hidden = true; this.notify(); });
    }
    listen(target, type, callback) {
      if (!target?.addEventListener) return;
      target.addEventListener(type, callback);
      this.listeners.push(() => target.removeEventListener?.(type, callback));
    }
    connect(child) {
      if (child !== this.frame.contentWindow) return null;
      this.status.hidden = true;
      return this;
    }
    setMode(mode) {
      if (!['auto', 'handheld', 'keyboard'].includes(mode)) return;
      this.mode = mode; this.refresh();
    }
    useTouch() { this.touchUsed = true; this.refresh(); }
    notify() {
      try {
        const child = this.frame.contentWindow;
        child.dispatchEvent(new child.Event('bitbound:landscape'));
      } catch { /* Frame may not have its same-origin document yet. */ }
    }
    refresh() {
      if (this.disposed) return;
      this.mobile = window.BitboundHandheld.detectHandheld(this.win, this.mode, this.touchUsed);
      // A phone keeps its landscape surface even with an attached keyboard.
      this.landscape = this.mode === 'handheld' || window.BitboundHandheld.detectHandheld(this.win, 'auto', this.touchUsed);
      const bounds = this.stage.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width)), height = Math.max(1, Math.round(bounds.height));
      const geometry = landscapeGeometry(width, height, this.landscape);
      const signature = [geometry.width, geometry.height, geometry.rotated, this.mode, this.mobile].join(':');
      if (signature === this.signature) return;
      this.signature = signature; this.geometry = geometry;
      this.frame.style.width = geometry.width + 'px';
      this.frame.style.height = geometry.height + 'px';
      this.frame.style.transform = geometry.transform;
      this.frame.style.visibility = 'visible';
      if (!this.landscape) this.unlock();
      // Release held input even if only the physical orientation has changed.
      this.notify();
    }
    async enter() {
      if (this.disposed || !this.landscape || this.requesting) return;
      this.requesting = true;
      const epoch = this.epoch;
      const current = () => !this.disposed && !this.doc.hidden && this.landscape && epoch === this.epoch;
      try {
        // Called from the existing Play/Fullscreen tap. There is no orientation
        // dialog, and API denial cannot block the landscape surface.
        if (!this.doc.fullscreenElement && this.doc.documentElement.requestFullscreen) {
          try { await this.doc.documentElement.requestFullscreen(); } catch { /* Keep the landscape surface. */ }
        }
        if (!current()) return;
        const orientation = this.win.screen?.orientation;
        if (orientation?.lock) {
          try {
            await orientation.lock('landscape');
            if (!current()) { orientation.unlock?.(); return; }
            this.locked = true;
          } catch { /* The frame already renders landscape without this API. */ }
        }
      } finally { this.requesting = false; this.refresh(); }
    }
    unlock() {
      this.epoch++;
      if (this.locked) {
        try { this.win.screen?.orientation?.unlock?.(); } catch { /* Optional API. */ }
      }
      this.locked = false;
    }
    dispose() { this.disposed = true; this.unlock(); this.listeners.splice(0).forEach(remove => remove()); }
  }
  window.BitboundLandscapeAPI = Object.freeze({Landscape, landscapeGeometry});
  const frame = document.getElementById('storyFrame');
  if (frame) {
    window.BitboundLandscape = new Landscape({window, document, frame,
      stage: document.getElementById('storyStage'), status: document.getElementById('storyLoading')});
    window.BitboundLandscape.notify();
  }
})();
