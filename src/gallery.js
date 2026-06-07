// Diagonal-type gallery where the centre poster scales up to fill the screen
// as you scroll (pinned scrub). Words + scattered posters fade out first.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function initGallery({ prefersReduced } = {}) {
  const sec = document.querySelector('.gallery');
  const pin = sec?.querySelector('.gallery__pin');
  const center = sec?.querySelector('.gallery__img--center');
  if (!sec || !pin || !center) return;
  // On phones the scattered/zoom layout is cramped — fall back to a clean stack.
  const small = window.matchMedia('(max-width: 820px)').matches;
  if (prefersReduced || small) {
    sec.classList.add('gallery--static');
    return;
  }

  const others = [
    ...sec.querySelectorAll(
      '.gallery__word, .gallery__eyebrow, .gallery__img:not(.gallery__img--center)'
    ),
  ];

  let target = 2;
  function computeTarget() {
    const prev = center.style.transform;
    center.style.transform = 'translate(-50%, -50%) scale(1)';
    const r = center.getBoundingClientRect();
    center.style.transform = prev;
    if (r.width && r.height) {
      // grow into a big FRAME (fits within ~78% height / ~86% width), not full-bleed
      const t = Math.min((0.78 * window.innerHeight) / r.height, (0.86 * window.innerWidth) / r.width);
      target = Math.max(1.5, Math.min(t, 3));
    }
  }
  computeTarget();

  ScrollTrigger.create({
    trigger: sec,
    start: 'top top',
    end: '+=175%',
    pin,
    scrub: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onRefresh: computeTarget,
    onUpdate: (self) => {
      const p = self.progress;
      const fade = clamp01((p - 0.06) / 0.4);
      // dim the words + scattered posters, but keep them present
      for (const el of others) el.style.opacity = String(1 - fade * 0.62);
      const z = clamp01((p - 0.12) / 0.86);
      const scale = 1 + z * z * (target - 1); // ease-in into a larger framed image
      center.style.transform = `translate(-50%, -50%) scale(${scale})`;
    },
  });

  ScrollTrigger.refresh();
}
