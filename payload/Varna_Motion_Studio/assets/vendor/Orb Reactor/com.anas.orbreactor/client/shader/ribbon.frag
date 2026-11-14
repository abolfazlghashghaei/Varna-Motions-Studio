#version 300 es
precision highp float;

in vec2 vLocal;
in vec3 vColor;
in float vOpacity;
out vec4 fragColor;

uniform float uExposure;
uniform float uParticleBloom;
uniform float uEdgeGlow;
uniform vec3 uGlowColor;

void main() {
  float distanceSquared = dot(vLocal, vLocal);
  if (distanceSquared > 1.0) discard;
  float core = exp(-distanceSquared * 4.8);
  float halo = exp(-distanceSquared * 1.35);
  float bloom = clamp(uParticleBloom, 0.0, 2.0);
  float intensity = vOpacity * (core * 1.9 + halo * bloom * 0.72) * max(uExposure, 0.0);
  float glowMix = clamp((halo - core * 0.45) * (0.18 + uEdgeGlow * 0.5), 0.0, 0.7);
  vec3 color = mix(vColor, uGlowColor, glowMix);
  float alpha = clamp(intensity, 0.0, 1.0);
  fragColor = vec4(color * alpha, alpha);
}
