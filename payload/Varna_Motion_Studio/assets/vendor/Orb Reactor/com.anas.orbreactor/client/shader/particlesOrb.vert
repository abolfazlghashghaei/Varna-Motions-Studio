#version 300 es
precision highp float;

// Efficient GPU port of the Particles Orb: one instanced quad per particle.
// Fibonacci sphere distribution keeps the particles evenly spaced without
// requiring a 720-entry position buffer.

uniform vec2 uSize;
uniform float uTime;
uniform float uSpeed;
uniform float uRadius;
uniform float uParticleCount;
uniform float uParticleSize;
uniform float uParticleDensity;
uniform float uParticleBloom;
uniform float uExposure;
uniform float uUserRotX;
uniform float uUserRotY;
uniform vec4 uColorA;
uniform vec4 uColorB;

out vec2 vLocal;
out float vAlpha;
out float vDepth;
out float vTone;

const float PI = 3.14159265359;
const float GOLDEN_ANGLE = 2.39996322973;


float hash(float n) {
  return fract(sin(n * 12.9898 + 78.233) * 43758.5453);
}

vec3 rotX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

void main() {
  vec2 corners[6] = vec2[6](
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
  );

  float i = float(gl_InstanceID);
  float count = max(uParticleCount, 1.0);
  float y = 1.0 - 2.0 * ((i + 0.5) / count);
  float ring = sqrt(max(0.0, 1.0 - y * y));
  float theta = GOLDEN_ANGLE * i;
  vec3 p = vec3(cos(theta) * ring, y, sin(theta) * ring);

  float t = uTime * uSpeed;
  float motion = sin(t * 0.75 + i * 0.021) * 0.035
               + sin(t * 1.37 + i * 0.047) * 0.018;
  float audioPulse = 1.0 + motion + 0.10 * uParticleBloom * sin(t * 5.2 + i * 0.09);
  p *= audioPulse;

  // Gentle sphere rotation matching the supplied orb's 3D feel.
  p = rotY(p, t * 0.16 + uUserRotY);
  p = rotX(p, 0.32 + sin(t * 0.18) * 0.035 + uUserRotX);

  float depth = (p.z + 1.0) * 0.5;
  float densityMask = hash(i * 1.731 + 4.21);
  float density = clamp(uParticleDensity, 0.05, 1.0);
  float visible = step(densityMask, density);

  // Brighter, slightly larger particles face the camera.
  float depthScale = 0.72 + depth * 0.62;
  float tone = clamp(0.12 + depth * 0.88 + hash(i * 0.37) * 0.12, 0.0, 1.0);
  float alpha = visible * (0.22 + depth * 0.78) * (0.78 + 0.22 * sin(i * 0.41 + t * 2.0));

  // Fill more of the frame (was 0.43 — orb looked tiny). Leave a soft margin
  // so edge-glow / bloom halos stay inside the render area instead of squishing
  // against the canvas edge when Orb Size is maxed.
  float bloomPad = clamp(uParticleBloom, 0.0, 2.0) * 0.06;
  float radiusScale = 0.88 * (1.0 - bloomPad);
  float minSize = max(min(uSize.x, uSize.y), 1.0);
  vec2 pos = p.xy * uRadius * radiusScale * depthScale;
  vec2 clip = vec2(
    pos.x * minSize / max(uSize.x, 1.0),
    pos.y * minSize / max(uSize.y, 1.0)
  );

  // Particle quads are slightly larger so the soft glow lives inside the
  // orb radius budget rather than being clipped at the framebuffer edge.
  float px = max(0.55, uParticleSize) * (1.25 + clamp(uParticleBloom, 0.0, 2.0) * 2.1) * depthScale;
  vec2 offset = corners[gl_VertexID] * px * 2.0 / max(uSize, vec2(1.0));
  vec2 ndc = clip + offset;

  gl_Position = vec4(ndc, 0.0, 1.0);
  vLocal = corners[gl_VertexID];
  vAlpha = alpha * max(uExposure, 0.0);
  vDepth = depth;
  vTone = tone;
}
