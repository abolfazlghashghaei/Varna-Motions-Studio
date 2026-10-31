#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

// AUTO-GENERATED lean per-preset variant - see build2/make_variants.py.

// Only the shared helpers plus this one preset's functions are included,

// so the shader compiler only ever has to deal with a small, linear

// program instead of a 13-way branchy uber-shader.


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

struct MfRamp {
  float n;
  vec3 s0;
  vec3 s1;
  vec3 s2;
  vec3 s3;
  vec3 s4;
  vec3 s5;
  vec3 s6;
  vec3 s7;
  vec3 s8;
  vec3 s9;
  vec3 s10;
  vec3 s11;
};

const float GL_FU = 0.88172043;
const float GL_BSIG_CLEAR = 0.01800000;
const float GL_BSIG_GLASS = 0.03990000;
const float GL_KA = 6.0;
const float GL_KG = 4.1209;
const float GL_KWA = 0.5;
const float GL_KR = 0.32;
const float GL_GH = 1.73205081;
const float GL_CLEAR_EA = 0.995;
const float GL_CLEAR_EB = 1.04;

uniform Uniforms u;


float wgsl_select(float a, float b, bool c) { return c ? b : a; }
vec2  wgsl_select(vec2  a, vec2  b, bool c) { return c ? b : a; }
vec3  wgsl_select(vec3  a, vec3  b, bool c) { return c ? b : a; }
vec4  wgsl_select(vec4  a, vec4  b, bool c) { return c ? b : a; }

float mfEdgeD(float soft) {
return soft - 0.005;
}

vec3 mfEdgeGlow(vec3 col, vec2 uv, vec2 ctr, float rad, float soft, float glow, vec3 glowRGB) {
if (glow <= 0.0) {
return col;
}
float r = length (uv - ctr);
// Keep the halo proportional to the orb radius. The previous fixed falloff
// made the glow look increasingly squashed as the radius slider grew.
float radiusScale = clamp(rad / 0.72, 0.65, 1.65);
float glowSoft = max(soft * radiusScale, 0.0045 * radiusScale);
float outside = smoothstep (rad - glowSoft, rad + glowSoft, r);
float falloff = 11.0 / radiusScale;
return col + glowRGB * (glow * exp (- max (r - rad, 0.0) * falloff) * outside);
}

vec3 mfRampPick(float idx, vec3 s0, vec3 s1, vec3 s2, vec3 s3, vec3 s4, vec3 s5, vec3 s6, vec3 s7, vec3 s8, vec3 s9, vec3 s10, vec3 s11) {
vec3 r = s0;
r = wgsl_select (r, s1, idx == 1.0);
r = wgsl_select (r, s2, idx == 2.0);
r = wgsl_select (r, s3, idx == 3.0);
r = wgsl_select (r, s4, idx == 4.0);
r = wgsl_select (r, s5, idx == 5.0);
r = wgsl_select (r, s6, idx == 6.0);
r = wgsl_select (r, s7, idx == 7.0);
r = wgsl_select (r, s8, idx == 8.0);
r = wgsl_select (r, s9, idx == 9.0);
r = wgsl_select (r, s10, idx == 10.0);
r = wgsl_select (r, s11, idx == 11.0);
return r;
}

vec3 mfRampCyc(float tIn, float n, vec3 s0, vec3 s1, vec3 s2, vec3 s3, vec3 s4, vec3 s5, vec3 s6, vec3 s7, vec3 s8, vec3 s9, vec3 s10, vec3 s11) {
float k = clamp (floor (n + 0.5), 1.0, 12.0);
float x = fract (tIn) * k;
float i0 = min (floor (x), k - 1.0);
float i1 = wgsl_select (i0 + 1.0, 0.0, i0 + 1.0 >= k);
return mix (mfRampPick (i0, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11), mfRampPick (i1, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11), x - i0);
}

vec3 mfRampLin(float tIn, float n, vec3 s0, vec3 s1, vec3 s2, vec3 s3, vec3 s4, vec3 s5, vec3 s6, vec3 s7, vec3 s8, vec3 s9, vec3 s10, vec3 s11) {
float k = clamp (floor (n + 0.5), 1.0, 12.0);
float x = clamp (tIn, 0.0, 1.0) * (k - 1.0);
float i0 = clamp (floor (x), 0.0, max (k - 2.0, 0.0));
return mix (mfRampPick (i0, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11), mfRampPick (i0 + 1.0, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11), x - i0);
}

MfRamp mfRampOf(float n, vec3 s0, vec3 s1, vec3 s2, vec3 s3, vec3 s4, vec3 s5, vec3 s6, vec3 s7, vec3 s8, vec3 s9, vec3 s10, vec3 s11) {
return MfRamp (n, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11);
}

vec3 mfRampCycR(float t, MfRamp r) {
return mfRampCyc (t, r.n, r.s0, r.s1, r.s2, r.s3, r.s4, r.s5, r.s6, r.s7, r.s8, r.s9, r.s10, r.s11);
}

vec3 mfRampLinR(float t, MfRamp r) {
return mfRampLin (t, r.n, r.s0, r.s1, r.s2, r.s3, r.s4, r.s5, r.s6, r.s7, r.s8, r.s9, r.s10, r.s11);
}

float lqHash(vec2 pIn) {
vec2 p = fract (pIn * vec2 (123.34, 456.21));
p = p + vec2 (dot (p, p + vec2 (45.32)));
return fract (p.x * p.y);
}

float lqNoise(vec2 p) {
vec2 i = floor (p);
vec2 f = fract (p);
f = f * f * (3.0 - 2.0 * f);
return mix (mix (lqHash (i), lqHash (i + vec2 (1.0, 0.0)), f.x), mix (lqHash (i + vec2 (0.0, 1.0)), lqHash (i + vec2 (1.0, 1.0)), f.x), f.y);
}

vec2 lqFbm(vec2 pIn, float bs) {
vec2 p = pIn;
float s = 0.0;
float a = 0.5;
float m = 0.0;
float vr = 0.0;
float e = - GL_KA * bs * bs;
float g = 1.0;
for (int i = 0; i < 5; i = i + 1) {
float b = exp (e * g);
s = s + a * (0.5 + b * (lqNoise (p) - 0.5));
vr = vr + a * a * (1.0 - b * b);
m = m + a;
a = a * 0.5;
g = g * GL_KG;
p = vec2 (0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y) * 2.03;
}
return vec2 (s / m, GL_KR * sqrt (vr) / m);
}

float lqRidge(float v, float k) {
return pow (clamp (1.0 - abs (v * 2.0 - 1.0), 0.0, 1.0), k);
}

vec3 lqRamp(float v, vec3 cA, vec3 cB, vec3 cC, vec3 cD) {
vec3 c = mix (cA, cB, smoothstep (0.0, 0.45, v));
c = mix (c, cC, smoothstep (0.38, 0.72, v));
c = mix (c, cD, smoothstep (0.68, 1.0, v));
return wgsl_select (c, mfRampLin (v, u.paletteCount, u.paletteStop0.rgb, u.paletteStop1.rgb, u.paletteStop2.rgb, u.paletteStop3.rgb, u.paletteStop4.rgb, u.paletteStop5.rgb, u.paletteStop6.rgb, u.paletteStop7.rgb, u.paletteStop8.rgb, u.paletteStop9.rgb, u.paletteStop10.rgb, u.paletteStop11.rgb), u.paletteCount > 0.5);
}

float lqRidgeS(vec2 vs, float k) {
float d = GL_GH * vs.y;
return (lqRidge (vs.x - d, k) + 4.0 * lqRidge (vs.x, k) + lqRidge (vs.x + d, k)) / 6.0;
}

float lqStepS(vec2 vs, float a, float b) {
float d = GL_GH * vs.y;
return (smoothstep (a, b, vs.x - d) + 4.0 * smoothstep (a, b, vs.x) + smoothstep (a, b, vs.x + d)) / 6.0;
}

float lqPowS(vec2 vs, float k) {
float d = GL_GH * vs.y;
return (pow (clamp (vs.x - d, 0.0, 1.0), k) + 4.0 * pow (clamp (vs.x, 0.0, 1.0), k) + pow (clamp (vs.x + d, 0.0, 1.0), k)) / 6.0;
}

vec3 glsFinishPresetFluid(vec3 colorIn, vec2 p) {
vec3 color = colorIn;
color = mix (color, u.highlightColor.rgb, u.shade * 0.22 * smoothstep (0.15, 1.15, dot (p, vec2 (- 0.32, 0.78))));
color = color * (1.0 - u.shade * 0.34 * smoothstep (- 0.1, 1.2, dot (p, vec2 (0.45, - 0.62))));
color = color * (1.0 - u.shade * 0.22 * smoothstep (0.72, 1.08, length (p)));
return clamp (color, vec3 (0.0), vec3 (1.0));
}

vec3 glsFinishEmissionFluid(vec3 colorIn, vec2 p) {
vec3 color = colorIn;
if (u.glassEnabled > 0.5) {
color = mix (color, u.highlightColor.rgb, u.shade * 0.22 * smoothstep (0.15, 1.15, dot (p, vec2 (- 0.32, 0.78))));
}
color = color * (1.0 - u.shade * 0.34 * smoothstep (- 0.1, 1.2, dot (p, vec2 (0.45, - 0.62))));
color = color * (1.0 - u.shade * 0.22 * smoothstep (0.72, 1.08, length (p)));
return clamp (color, vec3 (0.0), vec3 (1.0));
}

float glsSpectrumHeight(vec2 q, float t, float frequency, float phaseOffset, float amplitude) {
float x = q.x * 2.15;
float envelope = pow (4.0 / (4.0 + x * x), 4.0);
float breathing = 0.82 + 0.18 * sin (t * 0.48 + phaseOffset * 0.7);
float wave = abs (sin (frequency * x - t * 1.36 + phaseOffset));
return envelope * amplitude * breathing * (0.28 + 0.72 * wave);
}

float glsSpectrumLayer(vec2 q, float height, float softness) {
return (1.0 - smoothstep (max (height - softness, 0.0), height + softness, abs (q.y))) * smoothstep (0.0, 0.045, height);
}

vec3 glsSpectrumFluid(vec2 p, float t) {
float scale = 0.74 + u.zoom * 0.34;
vec2 q = p / scale;
float amplitude = 0.26 + u.ridgeAmt * 0.27;
float frequency = 0.72 + u.warp * 0.095;
float softness = 0.026 + (1.0 - u.ridgeAmt) * 0.032;
float h0 = glsSpectrumHeight (q, t, frequency * 0.82, - 1.2, amplitude * 0.72);
float h1 = glsSpectrumHeight (q, t, frequency, 0.45, amplitude);
float h2 = glsSpectrumHeight (q, t, frequency * 1.17, 2.05, amplitude * 0.82);
float l0 = glsSpectrumLayer (q, h0, softness);
float l1 = glsSpectrumLayer (q, h1, softness);
float l2 = glsSpectrumLayer (q, h2, softness);
float spectrumX = q.x * 2.15;
float envelope = pow (4.0 / (4.0 + spectrumX * spectrumX), 4.0);
float support = exp (- q.y * q.y / 0.00072) * envelope;
float total = l0 + l1 + l2;
vec3 spectral = (u.colorB.rgb * l0 + u.colorC.rgb * l1 + u.colorD.rgb * l2) / max (total, 0.001);
float glassFill = wgsl_select (0.0, 1.0, u.glassEnabled > 0.5);
vec3 color = u.colorD.rgb * 0.025 * glassFill + spectral * (1.0 - exp (- total * 0.86));
color = color + u.colorA.rgb * support * 0.58;
color = color / (vec3 (1.0) + color * 0.2);
return glsFinishEmissionFluid (color, p);
}

vec2 glsRotate(vec2 p, float angle) {
float c = cos (angle);
float s = sin (angle);
return vec2 (c * p.x - s * p.y, s * p.x + c * p.y);
}

vec3 glsOver(vec3 dst, vec3 src, float a) {
float k = clamp (a, 0.0, 1.0);
return src * k + dst * (1.0 - k);
}

float glsRefractionProfile(float t) {
float depth = clamp (t, 0.0, 1.0);
float circular = sqrt (max (1.0 - (1.0 - depth) * (1.0 - depth), 0.0));
return 1.0 - circular;
}

float glsHighlightLobe(vec2 normal, vec2 direction, float cut, float power) {
float angular = clamp ((dot (normal, direction) - cut) / max (1.0 - cut, 0.001), 0.0, 1.0);
return pow (angular, power);
}

vec2 glsContourWave(float angle, float t) {
int style = int (u.style + 0.5);
if (style == 19) {
float wave = sin (angle * 2.0 + t * 0.27) * 0.72 + sin (angle * 4.0 - t * 0.16 + 2.1) * 0.28;
float slope = cos (angle * 2.0 + t * 0.27) * 1.44 + cos (angle * 4.0 - t * 0.16 + 2.1) * 1.12;
return vec2 (wave, slope);
}
float wave = sin (angle * 3.0 + t * 0.62) * 0.52 + sin (angle * 5.0 - t * 0.41 + 1.7) * 0.31 + sin (angle * 2.0 + t * 0.23 + 3.1) * 0.17;
float slope = cos (angle * 3.0 + t * 0.62) * 1.56 + cos (angle * 5.0 - t * 0.41 + 1.7) * 1.55 + cos (angle * 2.0 + t * 0.23 + 3.1) * 0.34;
return vec2 (wave, slope);
}

float glsContourStrength() {
if (u.style >= 18.5) {
return 0.11;
}
return wgsl_select (0.09, 0.16, u.style >= 15.5);
}

float glsContourScale(vec2 uv, float t, float amount) {
if (amount <= 0.0) {
return 1.0;
}
vec2 contour = glsContourWave (atan (uv.y, uv.x), t);
return 1.0 + clamp (amount, 0.0, 1.0) * glsContourStrength () * contour.x;
}

vec2 glsContourNormal(vec2 uv, float rad, float t, float amount) {
float distance = length (uv);
if (distance <= 0.0001) {
return vec2 (0.0);
}
vec2 radial = uv / distance;
vec2 contour = glsContourWave (atan (uv.y, uv.x), t);
float slope = clamp (amount, 0.0, 1.0) * glsContourStrength () * contour.y;
vec2 tangent = vec2 (- radial.y, radial.x);
return normalize (radial - tangent * (rad * slope / distance));
}

vec2 glsRefractionNormal(vec2 base, vec2 p, float t, int style) {
if (style != 23) {
return base;
}
vec2 tangent = vec2 (- base.y, base.x);
float a = lqFbm (p * 2.15 + vec2 (t * 0.061, - t * 0.043), 0.018).x;
float b = lqFbm (glsRotate (p, 1.37) * 2.55 + vec2 (- t * 0.037, t * 0.052), 0.021).x;
float wave = (a - b) * 0.76 + sin (atan (p.y, p.x) * 3.0 + t * 0.21) * 0.08;
return normalize (base + tangent * wave);
}

vec3 glsPresetFluid(vec2 p, int style, float t) {
if (style == 14) { return glsSpectrumFluid(p, t); }
return vec3(0.0);
}

vec4 orbGlassLiquidAnim(vec2 uv01) {
vec2 fc = vec2 (uv01.x, 1.0 - uv01.y) * u.size;
vec2 uv = (2.0 * fc - u.size) / max (min (u.size.x, u.size.y), 1.0);
float rad = max (u.radius, 0.05);
float t = u.time * u.speed;
int s = int (u.style + 0.5);
bool emissionOnly = u.glassEnabled <= 0.5 && (s == 9 || s == 14 || s == 24);
float contourRad = rad * glsContourScale (uv, t, u.contourDeform);
if (length (uv) > contourRad * (1.01 + mfEdgeD (u.edgeSoftness))) {
vec3 halo = clamp (mfEdgeGlow (vec3 (0.0), uv, vec2 (0.0), contourRad, u.edgeSoftness, u.edgeGlow, u.glowColor.rgb), vec3 (0.0), vec3 (1.0));
float haloAlpha = max (halo.r, max (halo.g, halo.b));
return vec4 (halo, haloAlpha);
}
vec2 p = uv / contourRad;
float pd = length (p);
float clearFa = 1.0 - smoothstep (GL_CLEAR_EA, GL_CLEAR_EB, pd);
vec2 contourNormal = glsContourNormal (uv, rad, t, u.contourDeform);
vec2 normal = glsRefractionNormal (contourNormal, p, t, s);
float edgeDepth = max (1.0 - pd, 0.0);
float refractionWidth = 0.015 + 0.95 * clamp (u.shellMidAlpha, 0.0, 1.0);
float refractionT = edgeDepth / max (refractionWidth, 0.001);
float refractionProfile = pow (glsRefractionProfile (refractionT), 0.68);
float refractionAmount = 1.6 * clamp (u.glassOpacity, 0.0, 1.0) * refractionProfile;
vec2 refractedP = p - normal * refractionAmount;
vec3 fcol = vec3 (0.0);
if (clearFa > 0.0) {
if (u.glassEnabled > 0.5) {
float channelSplit = 0.14 * clamp (u.gloss, 0.0, 2.0) * clamp (u.glassOpacity, 0.0, 1.0) * refractionProfile;
vec3 redSample = glsPresetFluid (refractedP - normal * channelSplit, s, t);
vec3 greenSample = glsPresetFluid (refractedP, s, t);
vec3 blueSample = glsPresetFluid (refractedP + normal * channelSplit, s, t);
fcol = vec3 (redSample.r, greenSample.g, blueSample.b);
} else {
fcol = glsPresetFluid (p, s, t);
}
}
float lum = dot (fcol, vec3 (0.213, 0.715, 0.072));
vec3 clearSat = clamp (vec3 (lum) + (fcol - vec3 (lum)) * 1.22, vec3 (0.0), vec3 (1.0));
bool particleGlassOverlay = s == 24;
vec3 col = wgsl_select (glsOver (u.canvasColor.rgb, clearSat, 0.99 * clearFa), vec3 (0.0), particleGlassOverlay);
if (emissionOnly) {
float signal = max (clearSat.r, max (clearSat.g, clearSat.b));
float emissionCoverage = smoothstep (0.025, 0.16, signal);
col = clearSat * emissionCoverage;
}
if (u.glassEnabled > 0.5) {
float surfaceWidth = wgsl_select (0.026 + 0.055 * clamp (u.shellEdgeAlpha, 0.0, 1.0), 0.09 + 0.12 * clamp (u.shellEdgeAlpha, 0.0, 1.0), particleGlassOverlay);
float surfaceBand = (1.0 - smoothstep (0.0, surfaceWidth, edgeDepth)) * clearFa;
float opticalRim = pow (surfaceBand, wgsl_select (1.8, 1.3, particleGlassOverlay));
float innerRimAlpha = wgsl_select (opticalRim * u.glassOpacity * 0.45, opticalRim * u.glassOpacity * 0.14, particleGlassOverlay);
col = glsOver (col, u.shellInner.rgb, innerRimAlpha);
vec2 coolDirection = normalize (vec2 (0.84, 0.54));
vec2 warmDirection = normalize (vec2 (- 0.62, - 0.78));
float coolSplit = glsHighlightLobe (normal, coolDirection, - 0.32, 1.8);
float warmSplit = glsHighlightLobe (normal, warmDirection, - 0.28, 2.0);
float dispersion = opticalRim * clamp (u.gloss, 0.0, 2.0) * (0.8 + 0.8 * u.shellEdgeAlpha);
col = glsOver (col, u.shellMid.rgb, dispersion * coolSplit);
col = glsOver (col, u.shellEdge.rgb, dispersion * warmSplit);
float edgeShadow = opticalRim * (0.015 + 0.15 * u.shellEdgeAlpha) * (0.15 + 0.85 * max (dot (normal, vec2 (0.45, - 0.89)), 0.0));
col = col * (1.0 - edgeShadow);
vec2 keyDirection = normalize (vec2 (- 0.68, 0.73));
vec2 fillDirection = normalize (vec2 (0.74, - 0.67));
float key = opticalRim * glsHighlightLobe (normal, keyDirection, 0.2, 2.8) * clamp (u.sheen, 0.0, 2.0) * 1.4;
float fill = opticalRim * glsHighlightLobe (normal, fillDirection, 0.4, 3.6) * clamp (u.sheen, 0.0, 2.0) * 1.0;
col = glsOver (col, u.sheenColor.rgb, key);
col = glsOver (col, u.specColor.rgb, fill);
}
float ballA = 1.0 - smoothstep (0.99 - mfEdgeD (u.edgeSoftness), 1.01 + mfEdgeD (u.edgeSoftness), pd);
col = clamp (col * max (u.exposure, 0.0), vec3 (0.0), vec3 (1.0)) * ballA;
vec3 edged = mfEdgeGlow (col, uv, vec2 (0.0), contourRad, u.edgeSoftness, u.edgeGlow, u.glowColor.rgb);
vec3 finalColor = clamp (edged, vec3 (0.0), vec3 (1.0));
float emissionAlpha = max (finalColor.r, max (finalColor.g, finalColor.b));
float sphereAlpha = clamp (max (ballA, emissionAlpha), 0.0, 1.0);
float finalAlpha = wgsl_select (sphereAlpha, emissionAlpha, emissionOnly || particleGlassOverlay);
return vec4 (finalColor, finalAlpha);
}

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
