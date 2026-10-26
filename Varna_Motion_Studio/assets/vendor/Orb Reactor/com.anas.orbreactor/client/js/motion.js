/* The source app doesn't feed `time` straight to the shader - it integrates
 * `speed` into a running "motion phase" and then divides by the *current*
 * speed, so the animation doesn't jump when speed changes (e.g. during an
 * idle -> thinking transition). We reproduce that exactly so exported frames
 * match what you'd see live, at any frame rate. */
(function (global) {
  'use strict';

  class MotionClock {
    constructor() {
      this.phase = 0;
    }
    /** Advance by dtSeconds at the given (possibly time-varying) speed, and
     *  return the "shaderTime" to feed into the orb uniforms this frame. */
    step(dtSeconds, speed) {
      this.phase += dtSeconds * Math.max(speed, 0);
      return this.phase / Math.max(speed, 0.001);
    }
    reset() { this.phase = 0; }
  }

  global.MotionClock = MotionClock;
})(window);
