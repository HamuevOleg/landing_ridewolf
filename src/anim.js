// Page-wide motion: editorial "mask-up" split-text reveals + scroll parallax.
// [data-split]    — splits an element's PLAIN text into masked words that rise
//                   into place, staggered, when scrolled into view.
// [data-parallax] — translates an element on scroll (value = strength, e.g. 0.2).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Wrap each word in a mask (overflow:hidden) + inner span we can translate.
// Only safe on elements whose content is plain text (no child markup).
function splitWords(el) {
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  const frag = document.createDocumentFragment();
  const words = text.split(' ');
  words.forEach((word, i) => {
    const mask = document.createElement('span');
    mask.className = 'tw';
    const inner = document.createElement('span');
    inner.className = 'tw__i';
    inner.textContent = word;
    mask.appendChild(inner);
    frag.appendChild(mask);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
  });
  el.textContent = '';
  el.appendChild(frag);
  return el.querySelectorAll('.tw__i');
}

export function initSplit({ prefersReduced } = {}) {
  gsap.utils.toArray('[data-split]').forEach((el) => {
    const inners = splitWords(el);
    if (prefersReduced) {
      gsap.set(inners, { yPercent: 0, opacity: 1 });
      return;
    }
    gsap.set(inners, { yPercent: 118, opacity: 0 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.to(inners, {
          yPercent: 0,
          opacity: 1,
          duration: 0.95,
          ease: 'power4.out',
          stagger: 0.055,
        }),
    });
  });
}

export function initParallax({ prefersReduced } = {}) {
  if (prefersReduced) return;
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const strength = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(
      el,
      { yPercent: strength * 50 },
      {
        yPercent: -strength * 50,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}
