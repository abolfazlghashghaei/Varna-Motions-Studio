#version 300 es
precision highp float;

in vec2 vLocal;
in float vAlpha;
in float vDepth;
in float vTone;
out vec4 fragColor;

uniform vec4 uColorA;
uniform vec4 uColorB;
uniform float uParticleBloom;
uniform float uEdgeGlow;
uniform vec4 uGlowColor;

void main() {
  float d2 = dot(vLocal, vLocal);
  // Soft outer falloff instead of a hard discard so edge glow has room
  // without being clipped into a ring at max orb size.
  if (d2 > 1.35) discard;

  float core = exp(-d2 * 5.8);
  float halo = exp(-d2 * 1.35);
  float outer = exp(-d2 * 0.55);
  float bloom = clamp(uParticleBloom, 0.0, 2.0);
  float edge = clamp(uEdgeGlow, 0.0, 2.0);
  float intensity = vAlpha * (core * 1.55 + halo * bloom * 0.85 + outer * edge * 0.45);

  vec3 base = mix(uColorA.rgb, uColorB.rgb, vTone);
  float edgeMix = clamp((halo - core * 0.35 + outer * 0.4) * (0.16 + edge * 0.55), 0.0, 0.9);
  vec3 color = mix(base, uGlowColor.rgb, edgeMix);
  color *= 0.82 + vDepth * 0.35;

  float alpha = clamp(intensity, 0.0, 1.0);
  fragColor = vec4(color * alpha, alpha);
}
