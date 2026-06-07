// Scroll-scrubbed video intro with a logo "fly into black" ending.
// The video is never "played" — we pin the stage and lerp video.currentTime
// toward a scroll-derived target every frame for buttery-smooth scrubbing.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initParticles } from './particles.js';

// --- Tuning knobs ---------------------------------------------------------
const PX_PER_SEC = 60; // scroll px mapped to 1s of video (lower = more video per scroll)
const VIDEO_END = 0.82; // progress at which the video reaches its final frame
const LOGO_IN = [0.8, 0.9]; // progress range: logo fades/settles in
const FLY = [0.9, 1.0]; // progress range: dolly into the logo + black iris
const SCRUB_LERP = 0.08; // lower = smoother / heavier (extreme smoothness)
// -------------------------------------------------------------------------

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const range = (v, a, b) => clamp01((v - a) / (b - a));

export function initIntro({ prefersReduced } = {}) {
  const section = document.querySelector('.intro');
  const stage = document.querySelector('.intro__stage');
  const video = document.querySelector('.intro__video');
  const logo = document.querySelector('.intro__logo');
  const black = document.querySelector('.intro__black');
  const hint = document.querySelector('.intro__hint');
  const canvas = document.querySelector('.intro__particles');
  const header = document.getElementById('header');
  if (!section || !video) return;

  if (prefersReduced) {
    section.classList.add('intro--static');
    return;
  }

  header?.classList.add('header--hidden');
  video.pause();

  const particles = initParticles(canvas, { reduce: false });

  let duration = 0;
  let targetTime = 0;
  let currentTime = 0;
  let progress = 0;

  // Only allow one in-flight seek at a time — queuing seeks faster than the
  // decoder can serve them is what makes <video> scrubbing lag hard.
  let seeking = false;
  video.addEventListener('seeked', () => {
    seeking = false;
  });
  video.addEventListener('error', () => {
    seeking = false;
  });

  // Smooth scrub loop — decouples video time from raw scroll jitter.
  gsap.ticker.add(() => {
    if (!duration || video.readyState < 2) return;
    currentTime += (targetTime - currentTime) * SCRUB_LERP;
    if (Math.abs(targetTime - currentTime) < 0.003) currentTime = targetTime;
    // ~1 frame threshold; skip if a seek is still resolving
    if (!seeking && Math.abs(video.currentTime - currentTime) > 0.033) {
      seeking = true;
      try {
        video.currentTime = currentTime;
      } catch (e) {
        seeking = false;
      }
    }
  });

  function setEnding(p) {
    const lin = range(p, LOGO_IN[0], LOGO_IN[1]);
    const fly = range(p, FLY[0], FLY[1]);
    const flyEase = fly * fly; // ease-in so the dolly accelerates inward
    const scale = 0.7 + lin * 0.3 + flyEase * 7;
    logo.style.transform = `translate(-50%, -50%) scale(${scale})`;
    logo.style.opacity = String(Math.min(lin, 1 - fly * 0.85));
    const r = (flyEase * 90).toFixed(2) + '%';
    black.style.clipPath = `circle(${r} at 50% 50%)`;
    black.style.webkitClipPath = `circle(${r} at 50% 50%)`;
    // fade the ambient particles out as the logo takes over
    particles?.setOpacity(1 - lin * 0.9);
    // subtle camera push on the video itself as we approach the logo
    video.style.transform = `scale(${1.02 + lin * 0.06 + flyEase * 0.12})`;
  }

  function build() {
    duration = video.duration || 8;
    const dist = Math.round(duration * PX_PER_SEC) + window.innerHeight * 0.6;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + dist,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progress = self.progress;
        targetTime = clamp01(progress / VIDEO_END) * duration;
        if (hint) hint.style.opacity = String(clamp01(1 - progress / 0.12));
        setEnding(progress);
      },
      onLeave: () => header?.classList.remove('header--hidden'),
      onEnterBack: () => header?.classList.add('header--hidden'),
    });

    ScrollTrigger.refresh();
  }

  if (video.readyState >= 1 && video.duration) build();
  else video.addEventListener('loadedmetadata', build, { once: true });

  // Kick the loader (Safari sometimes needs an explicit load to expose duration)
  video.load();
}
