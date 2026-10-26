/* Unlike a simple idle/thinking on-off switch, this follows the audio level
 * continuously (attack/release smoothing, like a compressor's envelope
 * follower) and feeds that 0..1 value straight into interpolateParams as the
 * blend amount. That's what makes the waves actually track loudness -
 * silent audio blends fully to the (near-zero-motion) idle profile, and the
 * "wave" amplitude scales continuously with how loud the talking is, for
 * every preset, since every preset already has an idle/thinking profile. */
(function (global) {
  'use strict';

  // Fields where "not talking" should read as essentially flat/still, not
  // just subdued - this is what makes the waves actually hit zero at silence
  // instead of merely calming down. (radius already gets a per-style idle
  // multiplier from createIdleParams; this pushes the wave-shape fields much
  // further down specifically for audio reactivity.)
  const SILENCE_FIELDS = ['warp', 'ridgeAmt', 'contourDeform', 'edgeGlow',
    'ribbonWidth', 'ribbonBreath', 'ribbonTwist', 'chromaticShift', 'metalDepth'];
  const SILENCE_FLOOR = 0.03;

  function makeSilentBaseline(idleParams) {
    const silent = Object.assign({}, idleParams);
    for (const key of SILENCE_FIELDS) {
      if (silent[key] !== undefined) silent[key] = silent[key] * SILENCE_FLOOR;
    }
    return silent;
  }

  class VoiceEnvelope {
    constructor(style, thinkingParams, attackSeconds, releaseSeconds) {
      this.style = style;
      this.thinkingParams = thinkingParams;
      this.idleParams = makeSilentBaseline(global.OrbPresets.createIdleParams(style, thinkingParams));
      this.attackSeconds = Math.max(0.001, attackSeconds);
      this.releaseSeconds = Math.max(0.001, releaseSeconds);
      this.smoothed = 0;
    }

    setTimings(attackSeconds, releaseSeconds) {
      this.attackSeconds = Math.max(0.001, attackSeconds);
      this.releaseSeconds = Math.max(0.001, releaseSeconds);
    }

    /** target: 0..1 "how talkative right now" (see levelToTarget). dt: seconds
     *  since the last call. Internally follows target with attack/release
     *  smoothing, like a compressor envelope. */
    step(target, dt) {
      const coeff = target > this.smoothed ? this.attackSeconds : this.releaseSeconds;
      const alpha = 1 - Math.exp(-dt / coeff);
      this.smoothed += (target - this.smoothed) * alpha;
      this.smoothed = Math.min(1, Math.max(0, this.smoothed));
      return this.smoothed;
    }

    /** Full params for the current smoothed envelope value, eased in/out
     *  (smoothstep) rather than linear, so motion doesn't snap at the ends. */
    sample() {
      const eased = global.OrbPresets.smoothProgress(this.smoothed);
      return global.OrbPresets.interpolateParams(this.idleParams, this.thinkingParams, eased);
    }

    reset() { this.smoothed = 0; }
  }

  /** Turns a raw normalized RMS level into a 0..1 "how talkative right now"
   *  target, with a soft knee above the sensitivity threshold so quiet
   *  breathing/room noise doesn't twitch the orb but real speech saturates
   *  to a full, expressive wave quickly. */
  function levelToTarget(level, threshold) {
    if (level <= threshold) return 0;
    const span = Math.max(0.05, 1 - threshold);
    return Math.min(1, (level - threshold) / span);
  }

  global.VoiceEnvelope = VoiceEnvelope;
  global.levelToTarget = levelToTarget;
})(window);
