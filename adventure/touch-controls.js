/* Pointer-owned controls. Multitouch actions never steal the movement pointer. */
(() => {
  'use strict';

  class DPad {
    constructor(element, buttons, { enabled, move, jump, drop, setTimer = (fn, ms) => window.setTimeout(fn, ms), clearTimer = id => window.clearTimeout(id) }) {
      Object.assign(this, { element, buttons, enabled, move, jump, drop, setTimer, clearTimer });
      this.pointerId = null;
      this.vertical = 0;
      this.timer = null;
      element.addEventListener('pointerdown', event => this.start(event));
      element.addEventListener('pointermove', event => this.drag(event));
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        element.addEventListener(type, event => {
          if (event.pointerId === this.pointerId) this.reset();
        });
      }
      for (const [direction, button] of Object.entries(buttons)) {
        button.addEventListener('keydown', event => {
          if (![' ', 'Enter'].includes(event.key) || !this.enabled()) return;
          event.preventDefault();
          event.stopPropagation();
          if (!event.repeat && this.pointerId === null) this.pressDirection(direction);
        });
        button.addEventListener('keyup', event => {
          if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); this.reset(); }
        });
        button.addEventListener('blur', () => { if (this.pointerId === null) this.reset(); });
        button.addEventListener('click', event => {
          if (event.detail !== 0 || !this.enabled() || this.pointerId !== null) return;
          this.pressDirection(direction);
          this.timer = this.setTimer(() => this.reset(), 160);
        });
      }
    }

    pressDirection(direction) {
      if (this.timer !== null) this.clearTimer(this.timer);
      this.timer = null;
      this.apply(direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
        direction === 'up' ? -1 : direction === 'down' ? 1 : 0);
    }

    start(event) {
      if (!this.enabled() || this.pointerId !== null || (event.button != null && event.button !== 0)) return;
      event.preventDefault();
      this.reset();
      this.bounds = this.element.getBoundingClientRect();
      this.pointerId = event.pointerId;
      this.element.setPointerCapture(event.pointerId);
      this.drag(event);
    }

    drag(event) {
      if (event.pointerId !== this.pointerId) return;
      event.preventDefault();
      if (!this.enabled()) { this.reset(); return; }
      const { left, top, width, height } = this.bounds;
      const x = (event.clientX - left) / Math.max(1, width);
      const y = (event.clientY - top) / Math.max(1, height);
      this.apply(x < 1 / 3 ? -1 : x > 2 / 3 ? 1 : 0, y < 1 / 3 ? -1 : y > 2 / 3 ? 1 : 0);
    }

    apply(axis, vertical) {
      this.move(axis, vertical === 1);
      if (vertical !== this.vertical) {
        if (vertical === -1) this.jump();
        if (vertical === 1) this.drop();
      }
      this.vertical = vertical;
      const pressed = { left: axis < 0, right: axis > 0, up: vertical < 0, down: vertical > 0 };
      for (const [key, button] of Object.entries(this.buttons)) {
        button.classList.toggle('pressed', pressed[key]);
        button.setAttribute('aria-pressed', String(pressed[key]));
      }
    }

    reset() {
      const pointer = this.pointerId;
      this.pointerId = null;
      this.bounds = null;
      if (this.timer !== null) this.clearTimer(this.timer);
      this.timer = null;
      this.apply(0, 0);
      if (pointer !== null && this.element.hasPointerCapture?.(pointer)) this.element.releasePointerCapture(pointer);
    }
  }

  class ActionButton {
    constructor(button, { enabled, press, held = () => {} }) {
      Object.assign(this, { button, enabled, press, held });
      this.pointerId = null;
      button.addEventListener('pointerdown', event => {
        if (!enabled() || this.pointerId !== null || (event.button != null && event.button !== 0)) return;
        event.preventDefault();
        this.pointerId = event.pointerId;
        button.setPointerCapture(event.pointerId);
        this.setHeld(true);
        press();
      });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        button.addEventListener(type, event => { if (event.pointerId === this.pointerId) this.reset(); });
      }
      button.addEventListener('click', event => {
        if (event.detail === 0 && enabled()) press();
      });
    }

    setHeld(value) {
      this.button.classList.toggle('pressed', value);
      this.button.setAttribute('aria-pressed', String(value));
      this.held(value);
    }

    reset() {
      const pointer = this.pointerId;
      this.pointerId = null;
      this.setHeld(false);
      if (pointer !== null && this.button.hasPointerCapture?.(pointer)) this.button.releasePointerCapture(pointer);
    }
  }

  window.BitboundTouch = Object.freeze({ DPad, ActionButton });
})();
