// Live "fleet map" mini-visual for the big bento tile: a faint street grid with
// coral vehicle dots gliding along lanes, leaving short trails. Pauses offscreen.
export function initBentoMap(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let raf = null;
  let visible = true;
  let roads = [];
  let dots = [];

  function build() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const stepX = Math.max(54, w / 7);
    const stepY = Math.max(54, h / 5);
    roads = [];
    for (let x = stepX * 0.5; x < w; x += stepX) roads.push({ v: true, p: x });
    for (let y = stepY * 0.5; y < h; y += stepY) roads.push({ v: false, p: y });

    const lanesX = roads.filter((r) => r.v).map((r) => r.p);
    const lanesY = roads.filter((r) => !r.v).map((r) => r.p);
    const N = Math.round(Math.min(26, (w * h) / 9000));
    dots = [];
    for (let i = 0; i < N; i++) {
      const horiz = Math.random() < 0.5;
      const lane = horiz
        ? lanesY[(Math.random() * lanesY.length) | 0] || h / 2
        : lanesX[(Math.random() * lanesX.length) | 0] || w / 2;
      dots.push({
        horiz,
        lane,
        pos: Math.random() * (horiz ? w : h),
        sp: (0.3 + Math.random() * 0.9) * (Math.random() < 0.5 ? 1 : -1),
        r: 1.3 + Math.random() * 1.7,
        trail: 10 + Math.random() * 22,
      });
    }
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible || !w) return;
    ctx.clearRect(0, 0, w, h);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    for (const r of roads) {
      if (r.v) {
        ctx.moveTo(r.p, 0);
        ctx.lineTo(r.p, h);
      } else {
        ctx.moveTo(0, r.p);
        ctx.lineTo(w, r.p);
      }
    }
    ctx.stroke();

    for (const d of dots) {
      d.pos += d.sp;
      const len = d.horiz ? w : h;
      if (d.pos > len + 24) d.pos = -24;
      else if (d.pos < -24) d.pos = len + 24;
      const x = d.horiz ? d.pos : d.lane;
      const y = d.horiz ? d.lane : d.pos;
      const dir = Math.sign(d.sp) || 1;
      const tx = d.horiz ? x - dir * d.trail : x;
      const ty = d.horiz ? y : y - dir * d.trail;

      const g = ctx.createLinearGradient(x, y, tx, ty);
      g.addColorStop(0, 'rgba(255,107,87,0.85)');
      g.addColorStop(1, 'rgba(255,107,87,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = d.r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,150,130,1)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255,107,87,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  build();
  window.addEventListener('resize', build, { passive: true });
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
  io.observe(canvas);

  if (reduce) {
    frame();
    cancelAnimationFrame(raf);
    raf = null;
    return { destroy() { io.disconnect(); window.removeEventListener('resize', build); } };
  }

  raf = requestAnimationFrame(frame);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', build);
    },
  };
}
