// "How it works" as a horizontal pinned scroll: the panel track slides
// sideways as you scroll vertically. Falls back to a stacked vertical layout
// on small screens / reduced motion (via the .howx--static class + CSS).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initHowHorizontal({ prefersReduced } = {}) {
  const section = document.querySelector('.howx');
  const pin = section?.querySelector('.howx__pin');
  const track = section?.querySelector('.howx__track');
  if (!section || !pin || !track) return;

  const small = window.matchMedia('(max-width: 940px)').matches;
  if (prefersReduced || small) {
    section.classList.add('howx--static');
    return;
  }

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => '+=' + distance(),
      pin: pin,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  ScrollTrigger.refresh();
}
