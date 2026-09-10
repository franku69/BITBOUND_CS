/* Cosmetic player poses, advanced only by the existing simulation clock.
   One reusable pose; no timers, random calls, DOM writes or physics mutations. */
( () => {
  'use strict';
  class PlayerAnimator { constructor() {
      this.pose = {
        bodyY: 0,
        headX: 0,
        headY: 0,
        blink: false,
        arm: 0,
        smile: false,
        motion: 'idle',
        phase: 0
      };
      this.reset();
    } reset() {
      this.gait = 0;
      this.clock = 0;
      this.idle = 0;
      this.landing = 0;
      this.celebration = 0;
      this.neutral();
    } neutral() {
      const p = this.pose;
      p.bodyY = 0;
      p.headX = 0;
      p.headY = 0;
      p.blink = false;
      p.arm = 0;
      p.smile = false;
      p.motion = 'idle';
      p.phase = 0;
      return p;
    } land() {
      this.landing = .18;
    } celebrate() {
      this.celebration = 1.1;
    } update(dt, player, reduced = false, nearGuide = false) {
      dt = Math.max(0, Math.min(.1, dt));
      this.clock = (this.clock + dt) % 120;
      this.landing = Math.max(0, this.landing - dt);
      this.celebration = Math.max(0, this.celebration - dt);
      const p = this.neutral();
      const resting = player.onGround && Math.abs(player.vx) < .2 && player.attack <= 0 && player.dashTime <= 0;
      this.idle = resting ? this.idle + dt: 0;
      // Controls take priority; mannerisms never delay running, jumping or attacks.
      // Essential action silhouettes remain on in reduced-motion mode.
      if (player.dashTime > 0) {
        p.motion = 'dash';
        p.phase = 1 - player.dashTime / .18;
        return p;
      }
      if (player.attack > 0) {
        p.motion = 'attack';
        p.phase = Math.max(0, 1 - player.attack / .22);
        return p;
      }
      if (!player.onGround) {
        p.motion = player.vy < 0 ? 'jump': 'fall';
        return p;
      }
      if (!resting) {
        p.motion = Math.abs(player.vx) > 5 ? 'run': 'walk';
        // Integrate cadence. Multiplying total time by changing velocity made
        // the legs jump to unrelated frames whenever the player accelerated.
        this.gait = (this.gait + dt * Math.min(6, Math.max(1.6, Math.abs(player.vx) * .65))) % 1;
        p.phase = this.gait;
        return p;
      }
      if (reduced) return p;
      if (this.landing > 0) {
        p.motion = 'land';
        p.phase = 1 - this.landing / .18;
        p.bodyY = Math.ceil(this.landing / .18 * 2);
        return p;
      }
      if (this.celebration > 0) {
        p.motion = 'cheer';
        p.phase = (this.clock * 2) % 1;
        p.arm = 2.6;
        p.smile = true;
        p.bodyY = Math.sin( (1.1 - this.celebration) * Math.PI * 4) > 0 ? - 1: 0;
        return p;
      }
      if (this.idle < .7) return p;
      const phase = this.idle % 8;
      p.phase = (this.clock * .35) % 1;
      p.headY = Math.sin(this.clock * 2.2) > .65 ? - 1: 0;
      p.blink = (phase > 2.2 && phase < 2.34) || (phase > 5.3 && phase < 5.43);
      if (nearGuide && phase > 1 && phase < 2) {
        p.motion = 'wave';
        p.phase = (phase * 2) % 1;
        p.arm = 2.1 + Math.sin( (phase - 1) * Math.PI * 8) * .25;
        p.smile = true;
      } else if (phase > 4 && phase < 4.8) {
        p.headX = - 1;
        // A quick look back toward the companion.
      } else if (phase > 6.3 && phase < 7.1) {
        p.arm = .45;
        p.headY = - 1;
        // Loosen the shoulder after standing for a while.
      }
      return p;
    } }
  window.BitboundPlayerAnimation = Object.freeze({ PlayerAnimator });
})();
