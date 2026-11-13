#version 300 es
// TEMPLATE ONLY - not loaded directly by the panel. scripts/make-shader-variants.py
// splices this file's main-function body onto each preset's own lean function
// library to produce client/shader/presets/orb-lib.<style>.frag, which is what
// actually gets compiled at runtime.
precision highp float;

in vec2 vUv;
out vec4 fragColor;

// %%ORB_LIB%% -- the full ported function library is injected here at build time.

void main() {
  vec4 c = orbGlassLiquidAnim(vUv);

  vec2 fc = vec2(vUv.x, 1.0 - vUv.y) * u.size;
  vec2 uv = (2.0 * fc - u.size) / max(min(u.size.x, u.size.y), 1.0);
  float rad = max(u.radius, 0.05);
  float t = u.time * u.speed;
  float contourRad = rad * glsContourScale(uv, t, u.contourDeform);
  vec2 q = (2.0 * fc - u.size) / u.size;
  float fitEnd = 1.0;
  float fitFeather = 2.0 / max(min(u.size.x, u.size.y), 1.0);
  float fitStart = min(mix(contourRad, fitEnd, 0.5), fitEnd - fitFeather);
  float fit = 1.0 - smoothstep(fitStart, fitEnd, max(abs(q.x), abs(q.y)));

  fragColor = vec4(c.rgb * fit, c.a * fit);
}
