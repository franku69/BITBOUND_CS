/* Independent timing and quality policy. No game state, DOM, or rendering code. */
( () => {
  'use strict';
  const QUALITY = Object.freeze({
    standard: Object.freeze({
      fps: 60,
      uiInterval: .12,
      particles: 180,
      projectiles: 140,
      loot: 20,
      particleScale: .85,
      stars: 36,
      richFx: true
    }),
    low: Object.freeze({
      fps: 30,
      uiInterval: .16,
      particles: 72,
      projectiles: 140,
      loot: 20,
      particleScale: .45,
      stars: 12,
      richFx: false
    }),
    eco: Object.freeze({
      fps: 20,
      uiInterval: .2,
      particles: 36,
      projectiles: 140,
      loot: 20,
      particleScale: .25,
      stars: 0,
      richFx: false
    })
  });
  /** Fixed 60 Hz physics regardless of display/quality rate. Catch-up work is bounded. */
  class FixedStepClock { constructor({ hz = 60, maxSteps = 4 } = {}) {
      this.step = 1 / hz;
      this.maxSteps = maxSteps;
      this.reset();
    } reset() {
      this.last = null;
      this.accumulator = 0;
    } advance(timestamp, update) {
      if (this.last === null) {
        this.last = timestamp;
        return 0;
      }
      const elapsed = Math.max(0, (timestamp - this.last) / 1000);
      this.last = timestamp;
      this.accumulator = Math.min(this.accumulator + elapsed, this.step * this.maxSteps);
      let steps = 0;
      while (this.accumulator + 1e-9 >= this.step && steps < this.maxSteps) {
        update(this.step);
        this.accumulator = Math.max(0, this.accumulator - this.step);
        steps++;
      }
      return steps;
    } }
  /** Sleep between render deadlines instead of polling every display refresh. */
  class FrameScheduler { constructor({
      render,
      shouldContinue,
      frameMs,
      now = () => performance.now(),
      requestFrame = fn => requestAnimationFrame(fn),
      cancelFrame = id => cancelAnimationFrame(id),
      setTimer = (fn, ms) => setTimeout(fn, ms),
      clearTimer = id => clearTimeout(id)
    }) {
      Object.assign(this, {
        render,
        shouldContinue,
        frameMs,
        now,
        requestFrame,
        cancelFrame,
        setTimer,
        clearTimer
      });
      this.frame = null;
      this.timer = null;
      this.deadline = null;
      this.onFrame = this.onFrame.bind(this);
      this.afterWait = () => {
        this.timer = null;
        this.frame = this.requestFrame(this.onFrame);
      };
    } request() {
      if (this.frame !== null || this.timer !== null) return;
      this.deadline = this.now();
      this.frame = this.requestFrame(this.onFrame);
    } arm() {
      if (this.frame !== null || this.timer !== null) return;
      // A sub-millisecond lead avoids waking multiple times on high-refresh displays.
      const wait = this.deadline - this.now() - .5;
      if (wait > 1) this.timer = this.setTimer(this.afterWait, wait); else this.frame = this.requestFrame(this.onFrame);
    } onFrame(timestamp) {
      this.frame = null;
      if (timestamp + .75 < this.deadline) {
        this.arm();
        return;
      }
      this.render(timestamp);
      if (!this.shouldContinue()) {
        this.stop();
        return;
      }
      const interval = this.frameMs();
      this.deadline = (this.deadline ?? timestamp) + interval;
      if (this.deadline <= timestamp) this.deadline = timestamp + interval;
      this.arm();
    } stop() {
      if (this.frame !== null) this.cancelFrame(this.frame);
      if (this.timer !== null) this.clearTimer(this.timer);
      this.frame = null;
      this.timer = null;
      this.deadline = null;
    } }
  /** Downgrade after sustained expensive frames; never oscillate quality per frame. */
  class QualityGovernor { constructor(windowSize = 60) {
      this.windowSize = windowSize;
      this.reset();
    } reset() {
      this.count = 0;
      this.total = 0;
      this.slow = 0;
      this.previous = null;
    } record(timestamp, costMs, budgetMs) {
      const gap = this.previous === null ? 0: timestamp - this.previous;
      this.previous = timestamp;
      this.total += Math.max(0, costMs);
      if (gap > budgetMs * 1.6) this.slow++;
      if (++this.count < this.windowSize) return false;
      const overloaded = this.total / this.count > budgetMs * .45 || this.slow / this.count > .2;
      this.count = 0;
      this.total = 0;
      this.slow = 0;
      return overloaded;
    } }
  window.BitboundPerformance = Object.freeze({
    QUALITY,
    FixedStepClock,
    FrameScheduler,
    QualityGovernor
  });
})();
