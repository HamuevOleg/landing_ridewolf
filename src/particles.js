// Drifting light particles — an ambient layer that makes the darkened city
// footage feel alive. Soft glowing motes rise and sway; density scales with the
// viewport. setOpacity() lets the hero fade them out during the logo dive.
export function initParticles(canvas, { reduce = false } = {}) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let parts = [];
  let opacity = 1;
  let raf = null;

  function spawn(seedY) {
    const r = Math.random();
    return {
      x: Math.random() * w,
      y: seedY != null ? seedY : Math.random() * h,
      r: 0.6 + r * r * 2.4,
      vy: -(0.08 + Math.random() * 0.5),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.002 + Math.random() * 0.006,
      swayAmt: 0.2 + Math.random() * 0.8,
      a: 0.12 + Math.random() * 0.5,
      warm: Math.random() < 0.62,
    };
  }

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(120, (w * h) / 13000));
    parts = new Array(count).fill(0).map(() => spawn());
  }

  function draw(animated) {
    ctx.clearRect(0, 0, w, h);
    if (opacity <= 0.01) return;
    for (const p of parts) {
      if (animated) {
        p.y += p.vy;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * p.swayAmt * 0.4;
        if (p.y < -12) {
          p.y = h + 12;
          p.x = Math.random() * w;
        }
        if (p.x < -12) p.x = w + 12;
        else if (p.x > w + 12) p.x = -12;
      }
      const alpha = p.a * opacity;
      const col = p.warm
        ? `rgba(255,124,107,${alpha})`
        : `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.fillStyle = col;
      ctx.shadowBlur = p.r * 4;
      ctx.shadowColor = col;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  if (reduce) {
    draw(false);
    return { setOpacity() {}, destroy() { window.removeEventListener('resize', resize); } };
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    draw(true);
  }
  raf = requestAnimationFrame(frame);

  return {
    setOpacity(v) {
      opacity = v < 0 ? 0 : v > 1 ? 1 : v;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}
