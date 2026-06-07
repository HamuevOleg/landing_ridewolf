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

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  // Horizontal pin only on desktop + motion-OK; auto-torn-down on resize to
  // mobile / reduced-motion, where the CSS media query stacks the panels.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 941px) and (prefers-reduced-motion: no-preference)', () => {
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
      gsap.set(track, { clearProps: 'all' });
    };
  });
}
