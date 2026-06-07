// Custom lerp-follow cursor (danilodemarco-style): a small dot that trails the
// pointer with easing and expands into a ring over interactive elements.
// Enabled only on fine-pointer devices with motion allowed.
export function initCursor({ prefersReduced } = {}) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (prefersReduced || !fine) return;

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="cursor__ring"></span><span class="cursor__dot"></span>';
  document.body.appendChild(el);
  document.documentElement.classList.add('has-cursor');

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  const speed = 0.2;

  window.addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      el.style.opacity = '1';
    },
    { passive: true }
  );
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => (el.style.opacity = '0'));

  // Grow over interactive targets.
  const SEL = 'a, button, input, label, [data-cursor], .feature-card, .explore__card';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest && e.target.closest(SEL)) el.classList.add('is-hover');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest && e.target.closest(SEL)) el.classList.remove('is-hover');
  });

  function raf() {
    rx += (mx - rx) * speed;
    ry += (my - ry) * speed;
    el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(raf);
  }
  raf();
}
