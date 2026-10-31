#version 300 es
struct Uniforms {
  vec2 size;
  float time;
  float speed;
  float radius;
  float zoom;
  float warp;
  float ridgeAmt;
  float sharp;
  float shade;
  float sheen;
  float gloss;
  float shellMidAlpha;
  float shellEdgeAlpha;
  float exposure;
  float style;
  float edgeSoftness;
  float edgeGlow;
  float paletteCount;
  float glassEnabled;
  float glassOpacity;
  float contourDeform;
  float bandDensity;
  float chromaticShift;
  float metalScale;
  float metalStretch;
  float metalAngle;
  float metalOffset;
  float metalPhase;
  float metalEvolution;
  float metalRoughness;
  float metalDepth;
  float particleDensity;
  float ribbonCount;
  float ribbonWidth;
  float ribbonTwist;
  float ribbonFold;
  float ribbonBreath;
  float particleSize;
  float particleBloom;
  vec4 colorA;
  vec4 colorB;
  vec4 colorC;
  vec4 colorD;
  vec4 highlightColor;
  vec4 shellInner;
  vec4 shellMid;
  vec4 shellEdge;
  vec4 sheenColor;
  vec4 specColor;
  vec4 canvasColor;
  vec4 glowColor;
  vec4 paletteStop0;
  vec4 paletteStop1;
  vec4 paletteStop2;
  vec4 paletteStop3;
  vec4 paletteStop4;
  vec4 paletteStop5;
  vec4 paletteStop6;
  vec4 paletteStop7;
  vec4 paletteStop8;
  vec4 paletteStop9;
  vec4 paletteStop10;
  vec4 paletteStop11;
};
uniform Uniforms u;
uniform float uLayerCount;   // clamp(ribbonCount, 2, 6), precomputed on the CPU
uniform float uUSegments;    // reduced particle grid (perf budget for WebGL2/CEP)
uniform float uVSegments;
uniform float uUserRotX;     // interactive orbit control (top-left dial in the preview)
uniform float uUserRotY;

out vec2 vLocal;
out vec3 vColor;
out float vOpacity;

float prHash(float value) {
  return fract(sin(value * 12.9898 + 78.233) * 43758.5453);
}

vec3 prRotateX(vec3 p, float angle) {
  float c = cos(angle); float s = sin(angle);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}
vec3 prRotateY(vec3 p, float angle) {
  float c = cos(angle); float s = sin(angle);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 prCurve(float theta, float layer, float phase) {
  float local = theta + layer * 0.11;
  float foldPhase = 2.0 * local + phase * (0.72 + layer * 0.025);
  float fold = clamp(u.ribbonFold, 0.0, 1.2);
  float radial = 0.4 + (0.085 + fold * 0.04) * cos(foldPhase);
  float orbit = local + phase * 0.13 + sin(local - phase * 0.22 + layer) * fold * 0.13;
  float vertical = (0.235 + fold * 0.085) * sin(foldPhase)
                   + 0.055 * sin(local * 3.0 - phase * 0.46 + layer * 0.7);
  return vec3(radial * cos(orbit), vertical, radial * sin(orbit));
}

vec3 prPalette(float valueIn) {
  float value = fract(valueIn) * 4.0;
  if (value < 1.0) return mix(u.colorA.rgb, u.colorB.rgb, value);
  if (value < 2.0) return mix(u.colorB.rgb, u.colorC.rgb, value - 1.0);
  if (value < 3.0) return mix(u.colorC.rgb, u.colorD.rgb, value - 2.0);
  return mix(u.colorD.rgb, u.colorA.rgb, value - 3.0);
}

void main() {
  vec2 corners[6] = vec2[6](
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
  );

  float particlesPerLayer = uUSegments * uVSegments;
  float instanceIndex = float(gl_InstanceID);
  float layer = floor(instanceIndex / particlesPerLayer);
  float particleIndex = mod(instanceIndex, particlesPerLayer);
  float uIndex = floor(particleIndex / uVSegments);
  float vIndex = mod(particleIndex, uVSegments);
  float random = prHash(instanceIndex);
  bool activeLayer = layer < floor(uLayerCount + 0.5);

  float uCoord = (uIndex + prHash(instanceIndex + 11.0) * 0.56) / uUSegments;
  float vCoord = (vIndex + prHash(instanceIndex + 29.0) * 0.46) / uVSegments;
  float strip = vCoord * 2.0 - 1.0;
  float t = u.time * u.speed;
  float phase = t * 0.48;
  float arc = fract(uCoord + layer * 0.211 - phase * 0.019);
  float arcLength = 0.76 + 0.055 * sin(t * 0.23 + layer * 1.71);
  float arcPosition = arc / arcLength;
  float arcEnvelope = smoothstep(0.0, 0.075, arcPosition) * (1.0 - smoothstep(0.88, 1.0, arcPosition));
  bool particleVisible = activeLayer && arc <= arcLength
                          && random <= clamp(u.particleDensity, 0.2, 1.0);

  float theta = uCoord * 6.28318530718;
  vec3 center = prCurve(theta, layer, phase);
  vec3 ahead = prCurve(theta + 0.006, layer, phase);
  vec3 tangent = normalize(ahead - center);
  vec3 radial = normalize(center + vec3(0.001, 0.013, 0.007));
  vec3 side = normalize(cross(tangent, radial));
  vec3 surfaceNormal = normalize(cross(side, tangent));
  float twist = theta * (0.72 + u.ribbonTwist * 0.58) + phase * 0.74 + layer * 1.17;
  vec3 ribbonDirection = normalize(side * cos(twist) + surfaceNormal * sin(twist));
  float widthEnvelope = (0.72 + 0.28 * pow(sin(theta * 1.5 + phase + layer), 2.0))
                        * mix(0.42, 1.0, sqrt(max(arcEnvelope, 0.0)));
  vec3 position = center + ribbonDirection * strip * u.ribbonWidth * 0.5 * widthEnvelope;

  float pulse = sin(t * 0.73 + layer * 1.71) + 0.44 * sin(t * 1.17 + layer * 0.83 + 1.2);
  position *= 1.0 + u.ribbonBreath * pulse * 0.16;
  float layerCenter = layer - (floor(uLayerCount + 0.5) - 1.0) * 0.5;
  position = prRotateY(position, layerCenter * 0.24 + sin(t * 0.19 + layer * 1.3) * 0.055);
  position = prRotateX(position, layerCenter * 0.14 + cos(t * 0.17 + layer * 0.9) * 0.04);
  position = prRotateY(position, t * 0.105 + sin(t * 0.21) * 0.11);
  position = prRotateX(position, -0.2 + sin(t * 0.16 + layer * 0.1) * 0.16);
  // Interactive user orbit, applied on top of the automatic drift.
  position = prRotateY(position, uUserRotY);
  position = prRotateX(position, uUserRotX);

  float minSize = max(min(u.size.x, u.size.y), 1.0);
  float depthScale = 0.88 + position.z * 0.16;
  vec2 orbPosition = position.xy * u.radius * 1.45 * depthScale;
  vec2 clip = vec2(
    orbPosition.x * minSize / max(u.size.x, 1.0),
    orbPosition.y * minSize / max(u.size.y, 1.0)
  );
  // NOTE: this used to scale with absolute output resolution (clamp(minSize/640,...)),
  // which made particles/opacity look different at preview size (512px, under the
  // clamp's saturation point) vs a typical export resolution (usually well over
  // 640px, so it saturated to 1.0) - i.e. exports always came out brighter/bigger
  // than what was on screen. Particle appearance is now fully independent of
  // output resolution, so preview and export always match exactly.
  float canvasParticleScale = 1.0;
  float pointPixels = max(0.6, u.particleSize) * (1.5 + u.particleBloom * 2.5)
                      * (0.92 + position.z * 0.18) * canvasParticleScale;
  vec2 corner = corners[gl_VertexID];
  vec2 pointOffset = corner * pointPixels * 2.0 / max(u.size, vec2(1.0));

  float colorPhase = uCoord * 0.32 + layer * 0.19 + phase * 0.025 + position.z * 0.08;
  float stripEdge = smoothstep(0.58, 1.0, abs(strip));
  float front = clamp(0.78 + position.z * 0.54, 0.5, 1.24);
  float baseOpacity = mix(0.025, 0.009, clamp(u.shade / 1.5, 0.0, 1.0));

  if (particleVisible) {
    gl_Position = vec4(clip + pointOffset, clamp(0.5 - position.z * 0.12, 0.05, 0.95), 1.0);
  } else {
    gl_Position = vec4(2.0, 2.0, 1.0, 1.0);
  }
  vLocal = corner;
  vColor = pow(mix(prPalette(colorPhase), u.highlightColor.rgb, stripEdge * 0.56), vec3(0.72)) * front;
  vOpacity = particleVisible
      ? baseOpacity * (0.72 + stripEdge * 1.28) * arcEnvelope * pow(canvasParticleScale, 1.35)
      : 0.0;
}
