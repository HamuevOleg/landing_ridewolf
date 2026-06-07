// Reusable scroll-scrubbed video section. Pins the stage and lerps
// video.currentTime toward a scroll-derived target for smooth scrubbing.
// A caption fades/translates in then out across the scrub. Lazily warms
// the video (preload metadata -> auto) when it nears the viewport.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function initScrollVideo(section, { pxPerSec = 100, lerp = 0.08 } = {}) {
  if (!section) return;
  const stage = section.querySelector('.svid__stage');
  const video = section.querySelector('.svid__video');
  const caption = section.querySelector('.svid__caption');
  if (!video) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.classList.add('svid--static');
    return;
  }

  let duration = 0;
  let target = 0;
  let current = 0;
  let seeking = false;

  video.addEventListener('seeked', () => {
    seeking = false;
  });
  video.addEventListener('error', () => {
    seeking = false;
  });

  // Smooth scrub — one in-flight seek at a time (avoids decode backlog lag).
  gsap.ticker.add(() => {
    if (!duration || video.readyState < 2) return;
    current += (target - current) * lerp;
    if (Math.abs(target - current) < 0.003) current = target;
    if (!seeking && Math.abs(video.currentTime - current) > 0.033) {
      seeking = true;
      try {
        video.currentTime = current;
      } catch (e) {
        seeking = false;
      }
    }
  });

  // Warm up: fully buffer the clip a bit before it pins.
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=120%',
    once: true,
    onEnter: () => {
      if (video.preload !== 'auto') {
        video.preload = 'auto';
        video.load();
      }
    },
  });

  function build() {
    duration = video.duration || 5;
    const dist = Math.round(duration * pxPerSec) + window.innerHeight * 0.4;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + dist,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        target = p * duration;
        if (caption) {
          const inP = clamp01((p - 0.06) / 0.16);
          const outP = clamp01((p - 0.78) / 0.16);
          caption.style.opacity = String(Math.min(inP, 1 - outP));
          caption.style.transform = `translateY(${(1 - inP) * 26 - outP * 26}px)`;
        }
      },
    });

    ScrollTrigger.refresh();
  }

  if (video.readyState >= 1 && video.duration) build();
  else video.addEventListener('loadedmetadata', build, { once: true });
}
