/* Event-driven joystick: one captured pointer; no animation loop or polling. */
(() => {
  'use strict';
  class Joystick {
    constructor(element, knob, {enabled, move, deadZone = 0.16}) {
      this.element = element;
      this.knob = knob;
      this.enabled = enabled;
      this.move = move;
      this.deadZone = deadZone;
      this.pointerId = null;
      this.bounds = null;
      element.addEventListener('pointerdown', event => this.start(event));
      element.addEventListener('pointermove', event => this.drag(event));
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        element.addEventListener(type, event => {
          if (event.pointerId === this.pointerId) this.reset();
        });
      }
    }
    start(event) {
      if (!this.enabled() || this.pointerId !== null || (event.button != null && event.button !== 0)) return;
      event.preventDefault();
      this.bounds = this.element.getBoundingClientRect();
      this.pointerId = event.pointerId;
      this.element.setPointerCapture(event.pointerId);
      this.element.classList.add('active');
      this.drag(event);
    }
    drag(event) {
      if (event.pointerId !== this.pointerId) return;
      if (!this.enabled()) { this.reset(); return; }
      event.preventDefault();
      const box = this.bounds;
      const radius = Math.max(1, Math.min(box.width, box.height) * 0.32);
      const dx = event.clientX - box.left - box.width / 2;
      const dy = event.clientY - box.top - box.height / 2;
      const length = Math.hypot(dx, dy);
      const scale = length > radius ? radius / length : 1;
      const x = dx * scale, y = dy * scale;
      const axis = x / radius;
      const magnitude = Math.abs(axis);
      this.move(magnitude <= this.deadZone ? 0 : Math.sign(axis) * (magnitude - this.deadZone) / (1 - this.deadZone));
      this.knob.style.transform = `translate(${x}px, ${y}px)`;
    }
    reset() {
      const pointer = this.pointerId;
      this.pointerId = null;
      this.bounds = null;
      this.move(0);
      this.knob.style.transform = 'translate(0px, 0px)';
      this.element.classList.remove('active');
      if (pointer !== null && this.element.hasPointerCapture?.(pointer)) this.element.releasePointerCapture(pointer);
    }
  }
  window.BitboundTouch = Object.freeze({Joystick});
})();
