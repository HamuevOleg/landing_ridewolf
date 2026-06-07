// Ambient particle field for the intro — soft glowing motes drifting up over
// the city so it feels alive. Sprite-based (pre-rendered dots) + 'lighter'
// blending for cheap glow. Pauses off-screen; honors reduced motion.

const COLORS = [
  [255, 255, 255],
  [138, 150, 255], // indigo
  [120, 220, 230], // cyan (matches the video's map markers)
];

function makeSprite(rgb) {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
  g.addColorStop(0.25, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`);
  g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  return c;
}

export function initParticles(canvas, { reduce = false } = {}) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const sprites = COLORS.map(makeSprite);

  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let opacity = 1;
  let visible = true;
  let raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function spawn(initial) {
    return {
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + Math.random() * 40,
      r: Math.random() * 1.6 + 0.5,
      vy: -(Math.random() * 0.22 + 0.06),
      vx: (Math.random() - 0.5) * 0.12,
      base: Math.random() * 0.45 + 0.18,
      tw: Math.random() * Math.PI * 2,
      tws: Math.random() * 0.025 + 0.006,
      sprite: sprites[(Math.random() * sprites.length) | 0],
    };
  }

  function seed() {
    const count = Math.min(Math.round((w * h) / 20000), 90);
    particles = Array.from({ length: count }, () => spawn(true));
  }

  function draw(step) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      if (step) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.tws;
        if (p.y < -20) Object.assign(p, spawn(false));
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
      }
      const tw = Math.sin(p.tw) * 0.5 + 0.5;
      const a = p.base * (0.4 + tw * 0.6) * opacity;
      if (a <= 0.001) continue;
      const s = p.r * 10;
      ctx.globalAlpha = a;
      ctx.drawImage(p.sprite, p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (visible && opacity > 0.001) draw(true);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Initial paint so the field is visible immediately (and in screenshots).
  draw(false);

  if (!reduce) {
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0,
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);
  }

  return {
    setOpacity(v) {
      opacity = v;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}
