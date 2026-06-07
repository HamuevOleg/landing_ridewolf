// Cinematic hero background — fullscreen-quad simplex-noise shader (OGL).
// slate -> coral gradient mesh, mouse + scroll reactive.
// Falls back to a static CSS gradient when WebGL is unavailable or the
// user prefers reduced motion.
import { Renderer, Triangle, Program, Mesh, Vec2 } from 'ogl';

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Ashima simplex noise 2D
  vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = uv;
    p.x *= aspect;

    vec2 m = uMouse * 0.3;
    float t = uTime * 0.05 + uScroll * 0.4;

    float n = 0.0;
    n += 0.60 * snoise(p * 1.1 + t + m);
    n += 0.30 * snoise(p * 2.4 - t * 1.3 + m * 0.5);
    n += 0.12 * snoise(p * 5.0 + t * 1.7);

    vec3 slate   = vec3(0.094, 0.106, 0.129);  // #181b21 deep slate
    vec3 coral   = vec3(1.0, 0.420, 0.341);     // #ff6b57 brand
    vec3 warm    = vec3(1.0, 0.486, 0.420);     // #ff7c6b highlight

    vec3 color = mix(slate, coral, smoothstep(-0.65, 0.75, n));
    color = mix(color, warm, smoothstep(0.35, 0.95, n) * 0.6);

    // radial vignette focusing the upper-left where the headline sits
    float v = smoothstep(1.35, 0.2, length(uv - vec2(0.42, 0.5)));
    color *= 0.55 + 0.5 * v;

    // film grain
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.03;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function initHeroShader(container) {
  if (!container) return null;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl;
  try {
    const probe = document.createElement('canvas');
    gl = probe.getContext('webgl2') || probe.getContext('webgl');
  } catch (e) {
    gl = null;
  }

  // No WebGL or reduced motion -> keep the static CSS fallback already in the DOM.
  if (!gl || reduce) {
    container.classList.add('hero__bg--static');
    return null;
  }

  const renderer = new Renderer({
    alpha: false,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio, 1.75),
  });
  const ctx = renderer.gl;
  ctx.canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(ctx.canvas);

  const geometry = new Triangle(ctx);
  const program = new Program(ctx, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new Vec2(0, 0) },
      uResolution: { value: new Vec2(1, 1) },
    },
  });
  const mesh = new Mesh(ctx, { geometry, program });

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h);
    program.uniforms.uResolution.value.set(w, h);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Smoothed mouse parallax
  const target = new Vec2(0, 0);
  window.addEventListener(
    'pointermove',
    (e) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    },
    { passive: true }
  );

  // Pause when the hero scrolls off-screen
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 }
  );
  io.observe(container);

  const start = performance.now();
  let raf;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    program.uniforms.uTime.value = (performance.now() - start) / 1000;
    program.uniforms.uMouse.value.lerp(target, 0.05);
    renderer.render({ scene: mesh });
  }
  raf = requestAnimationFrame(frame);

  return {
    setScroll(v) {
      program.uniforms.uScroll.value = v;
    },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      ctx.canvas.remove();
    },
  };
}
