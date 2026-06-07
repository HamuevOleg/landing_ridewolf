// Lamp hero reveal (lights up when scrolled into view) + the smooth loader band.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initLamp() {
  const lamp = document.querySelector('.lamp');
  if (!lamp) return;
  // Light it immediately if it's already on screen, else on enter.
  ScrollTrigger.create({
    trigger: lamp,
    start: 'top 65%',
    once: true,
    onEnter: () => lamp.classList.add('is-lit'),
  });
  // Safety: if it starts in view before ScrollTrigger settles.
  requestAnimationFrame(() => {
    const r = lamp.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.65) lamp.classList.add('is-lit');
  });
}

export function initLoader({ prefersReduced } = {}) {
  const section = document.querySelector('.loader');
  const fill = section?.querySelector('.loader__fill');
  const pct = section?.querySelector('.loader__pct');
  if (!section || !fill || !pct) return;

  if (prefersReduced) {
    fill.style.width = '100%';
    pct.textContent = '100%';
    return;
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 72%',
    once: true,
    onEnter: () => {
      const obj = { v: 0 };
      gsap.to(obj, {
        v: 100,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          const val = Math.round(obj.v);
          fill.style.width = val + '%';
          pct.textContent = val + '%';
        },
      });
    },
  });
}
