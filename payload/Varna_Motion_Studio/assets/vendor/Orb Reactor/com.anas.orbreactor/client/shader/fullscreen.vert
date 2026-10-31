#version 300 es
// Fullscreen triangle, no vertex buffer needed (matches the original vs_main).
out vec2 vUv;
void main() {
  vec2 p = vec2(
    (gl_VertexID == 2) ? 3.0 : -1.0,
    (gl_VertexID == 1) ? 3.0 : -1.0
  );
  gl_Position = vec4(p, 0.0, 1.0);
  vec2 uv01 = (p + vec2(1.0)) * 0.5;
  vUv = vec2(uv01.x, 1.0 - uv01.y);
}
