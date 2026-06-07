// Opening hero — one pinned timeline in two acts:
//   Act 1 (first ~78% of scroll): scrub the full 3-clip film (darkened, with
//     drifting particles for a "living city") while a split-text caption rises
//     word-by-word for each clip.
//   Act 2 (final ~22%): dive INTO the Ridewolf logo — it fades in, scales up,
//     and a black plane swallows the screen, handing off to the manifesto below.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initParticles } from './particles.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// One caption per concatenated clip, in play order (aerial 4s, city 6s, scooter 8s).
const SEGMENTS = [
  { dur: 4, eyebrow: 'Ridewolf', text: 'Your city, from above.' },
  { dur: 6, eyebrow: 'Real-time', text: 'Alive on every street.' },
  { dur: 8, eyebrow: 'Any vehicle', text: 'Every way to move.' },
];

const VIDEO_PORTION = 0.78; // first 78% of the scroll scrubs the film; rest dives into the logo
const PX_PER_SEC = 105;
const SCRUB_LERP = 0.075;

export function initOpener({ prefersReduced } = {}) {
  const section = document.querySelector('.opener');
  const stage = section?.querySelector('.opener__stage');
  const video = section?.querySelector('.opener__video');
  const capWrap = section?.querySelector('.opener__captions');
  const emblem = section?.querySelector('.opener__emblem');
  const black = section?.querySelector('.opener__black');
  const hint = section?.querySelector('.opener__hint');
  const canvas = section?.querySelector('.opener__particles');
  const header = document.getElementById('header');
  if (!section || !video || !capWrap) return;

  const segTotal = SEGMENTS.reduce((s, x) => s + x.dur, 0);

  // Build caption DOM: each word wrapped in a mask + inner span for a rise reveal.
  const caps = SEGMENTS.map((seg) => {
    const el = document.createElement('div');
    el.className = 'opener__caption';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'opener__eyebrow';
    eyebrow.textContent = seg.eyebrow;
    const line = document.createElement('h2');
    line.className = 'opener__line';
    const words = [];
    const parts = seg.text.split(' ');
    parts.forEach((word, i) => {
      const mask = document.createElement('span');
      mask.className = 'tw';
      const inner = document.createElement('span');
      inner.className = 'tw__i';
      inner.textContent = word;
      mask.appendChild(inner);
      line.appendChild(mask);
      if (i < parts.length - 1) line.appendChild(document.createTextNode(' '));
      words.push(inner);
    });
    el.append(eyebrow, line);
    capWrap.appendChild(el);
    return { el, eyebrow, words };
  });

  // Segment ranges as fractions of the *film* portion of progress.
  const ranges = [];
  let acc = 0;
  for (const s of SEGMENTS) {
    ranges.push([acc / segTotal, (acc + s.dur) / segTotal]);
    acc += s.dur;
  }

  const particles = initParticles(canvas, { reduce: prefersReduced });

  if (prefersReduced) {
    section.classList.add('opener--static');
    if (caps[0]) {
      caps[0].el.style.opacity = '1';
      caps[0].eyebrow.style.opacity = '1';
      caps[0].words.forEach((wd) => {
        wd.style.opacity = '1';
        wd.style.transform = 'translateY(0)';
      });
    }
    return;
  }

  header?.classList.add('header--hidden');
  video.pause();

  let duration = 0;
  let target = 0;
  let current = 0;
  let seeking = false;
  video.addEventListener('seeked', () => (seeking = false));
  video.addEventListener('error', () => (seeking = false));

  // Smooth scrub loop — one in-flight seek at a time avoids decode-backlog lag.
  gsap.ticker.add(() => {
    if (!duration || video.readyState < 2) return;
    current += (target - current) * SCRUB_LERP;
    if (Math.abs(target - current) < 0.003) current = target;
    if (!seeking && Math.abs(video.currentTime - current) > 0.04) {
      seeking = true;
      try {
        video.currentTime = current;
      } catch (e) {
        seeking = false;
      }
    }
  });

  function renderCaption(cap, local) {
    const N = cap.words.length;
    const win = 0.26; // each word's rise window length (in local progress)
    const stepEnd = 0.55; // all words in by local 0.55
    const step = N > 1 ? (stepEnd - win) / (N - 1) : 0;
    const fadeOut = clamp01((local - 0.82) / 0.16);
    for (let i = 0; i < N; i++) {
      const wp = clamp01((local - i * step) / win);
      cap.words[i].style.transform = `translateY(${(1 - wp) * 110}%)`;
      cap.words[i].style.opacity = String(wp * (1 - fadeOut));
    }
    const eyeIn = clamp01(local / 0.06);
    cap.eyebrow.style.opacity = String(eyeIn * (1 - fadeOut));
    cap.eyebrow.style.transform = `translateY(${(1 - eyeIn) * 14}px)`;
  }

  function render(p) {
    // ---- Act 1: film scrub + captions ----
    const videoP = clamp01(p / VIDEO_PORTION);
    target = videoP * duration;
    if (hint) hint.style.opacity = String(1 - clamp01(p / 0.05));

    const inDive = p > VIDEO_PORTION;
    for (let i = 0; i < caps.length; i++) {
      const [a, b] = ranges[i];
      const last = i === caps.length - 1;
      const active = !inDive && videoP >= a && videoP < (last ? 1.0001 : b);
      if (active) {
        caps[i].el.style.opacity = '1';
        renderCaption(caps[i], clamp01((videoP - a) / (b - a)));
      } else {
        caps[i].el.style.opacity = '0';
      }
    }

    // ---- Act 2: dive into the logo, iris to black ----
    // Logo only scales modestly (stays crisp); a black circular iris expands
    // from its centre to carry us into the black manifesto below.
    const dive = clamp01((p - VIDEO_PORTION) / (1 - VIDEO_PORTION));
    const emblemIn = clamp01(dive / 0.14);
    const emblemOut = clamp01((dive - 0.72) / 0.22);
    const eased = dive * dive; // accelerate inward
    if (emblem) {
      emblem.style.opacity = String(emblemIn * (1 - emblemOut));
      emblem.style.transform = `translate(-50%, -50%) scale(${0.85 + emblemIn * 0.15 + eased * 2.1})`;
    }
    if (black) {
      const iris = clamp01((dive - 0.3) / 0.7) * 150;
      black.style.clipPath = `circle(${iris}% at 50% 50%)`;
      black.style.webkitClipPath = `circle(${iris}% at 50% 50%)`;
    }
    particles?.setOpacity(1 - clamp01(dive / 0.5));
  }

  // The pin length is derived from the EXPECTED film length (segTotal), NOT the
  // late-arriving video.duration. This lets the pin — and its spacer — be created
  // synchronously during boot, in correct DOM order relative to the sections below
  // (howx / showcase / gallery). The old code deferred creation to `loadedmetadata`,
  // so on a slow (production / cold-cache) load the opener pin was inserted AFTER
  // the sections below it and a late refresh couldn't fully reposition them — which
  // is exactly why prod overlapped while local (instant metadata) looked fine.
  // segTotal (18s) yields the same scrub distance the real ~18s film produces.
  duration = segTotal;
  const dist = Math.round((segTotal * PX_PER_SEC) / VIDEO_PORTION);
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=' + dist,
    pin: stage,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => render(self.progress),
    onLeave: () => header?.classList.remove('header--hidden'),
    onEnterBack: () => header?.classList.add('header--hidden'),
  });
  render(0);

  // The real duration only refines the scrub seek target; the pin length is fixed,
  // so metadata arriving late never shifts layout.
  const syncDuration = () => {
    if (video.duration) duration = video.duration;
  };
  if (video.readyState >= 1 && video.duration) syncDuration();
  else video.addEventListener('loadedmetadata', syncDuration, { once: true });
  video.load();
}
