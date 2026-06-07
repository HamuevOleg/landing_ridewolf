// Product spotlight: a cut-out product pinned in the centre while info
// callouts reveal around it on scroll. The flat PNG is given a 3D feel via
// mouse tilt + contact shadow + glow. Drop a transparent PNG at
// /media/scooter-cutout.png and it replaces the placeholder automatically.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function initShowcase({ prefersReduced } = {}) {
  const section = document.querySelector('.showcase');
  if (!section) return;
  const pin = section.querySelector('.showcase__pin');
  const tilt = section.querySelector('.showcase__tilt');
  const scaleEl = section.querySelector('.showcase__scale');
  const img = section.querySelector('.showcase__img');
  const ph = section.querySelector('.showcase__placeholder');
  const infos = [...section.querySelectorAll('.showcase__info')];

  // Swap placeholder <-> real image depending on whether the PNG exists.
  function syncImg() {
    if (img && img.complete && img.naturalWidth > 0) {
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
    } else if (img) {
      img.style.display = 'none';
      if (ph) ph.style.display = 'grid';
    }
  }
  if (img) {
    img.addEventListener('load', syncImg);
    img.addEventListener('error', syncImg);
    syncImg();
  }

  // entry offset per corner
  const offset = (el) => {
    const left = el.classList.contains('showcase__info--tl') || el.classList.contains('showcase__info--bl');
    const top = el.classList.contains('showcase__info--tl') || el.classList.contains('showcase__info--tr');
    return { dx: (left ? -1 : 1) * 48, dy: (top ? -1 : 1) * 24 };
  };
  infos.forEach((el) => (el._off = offset(el)));

  // Desktop + motion-OK only: pinned scrub + mouse tilt. gsap.matchMedia
  // auto-reverts on resize to mobile / reduced-motion; the CSS media query
  // then renders the clean stacked layout. (Robust to window resizing.)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 941px) and (prefers-reduced-motion: no-preference)', () => {
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=220%',
      pin,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(scaleEl, { scale: 0.84 + p * 0.24, y: 24 - p * 36 });
        infos.forEach((el, i) => {
          const start = 0.12 + i * 0.18;
          const t = clamp01((p - start) / 0.16);
          gsap.set(el, { autoAlpha: t, x: el._off.dx * (1 - t), y: el._off.dy * (1 - t) });
        });
      },
    });

    const maxTilt = 9;
    const onMove = (e) => {
      const r = pin.getBoundingClientRect();
      tilt.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * maxTilt}deg`);
      tilt.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * maxTilt}deg`);
    };
    const onLeave = () => {
      tilt.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--rx', '0deg');
    };
    pin.addEventListener('pointermove', onMove);
    pin.addEventListener('pointerleave', onLeave);

    return () => {
      st.kill();
      pin.removeEventListener('pointermove', onMove);
      pin.removeEventListener('pointerleave', onLeave);
      // drop inline transforms/opacity so the stacked CSS layout is clean
      gsap.set([scaleEl, ...infos], { clearProps: 'all' });
      tilt.style.removeProperty('--rx');
      tilt.style.removeProperty('--ry');
    };
  });
}
