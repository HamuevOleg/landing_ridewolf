import './styles/tokens.css';
import './styles/base.css';
import './styles/header.css';
import './styles/cursor.css';
import './styles/anim.css';
import './styles/cinematic.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/pro.css';
import './styles/lamp.css';
import './styles/showcase.css';
import './styles/footer.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { features, exploreLinks } from './data.js';
import { icon } from './icons.js';
import { initHeroShader } from './hero-shader.js';
import { initOpener } from './opener.js';
import { initCursor } from './cursor.js';
import { initSplit, initParallax } from './anim.js';
import { initMagnetic } from './effects.js';
import { initHowHorizontal } from './how-horizontal.js';
import { initBentoMap } from './bento-map.js';
import { initLamp, initLoader } from './lamp.js';
import { initShowcase } from './showcase.js';

gsap.registerPlugin(ScrollTrigger);

let heroShader = null;

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Render data-driven cards ---------- */
function renderFeatures() {
  const grid = document.getElementById('featuresGrid');
  if (!grid) return;
  grid.innerHTML = features
    .map((f, i) => {
      const variant = i === 0 ? ' feature-card--xl' : i === 1 ? ' feature-card--wide' : '';
      const head =
        i === 0
          ? `<div class="feature-card__viz" aria-hidden="true"><canvas id="bentoMap"></canvas></div>
        <span class="feature-card__live">Live</span>`
          : `<div class="feature-card__icon">${icon(f.icon)}</div>`;
      return `
      <article class="feature-card reveal${variant}">
        ${head}
        <h3>${f.title}</h3>
        <p>${f.text}</p>
      </article>`;
    })
    .join('');
}

function renderExplore() {
  const grid = document.getElementById('exploreGrid');
  if (!grid) return;
  grid.innerHTML = exploreLinks
    .map((l) => {
      const key = l.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const media = l.image
        ? `<img src="${l.image}" alt="" loading="lazy" decoding="async" />`
        : `<span class="xcard__tag">image · ${key}</span>`;
      return `
      <a href="#" class="xcard reveal" data-explore="${key}">
        <div class="xcard__media">${media}</div>
        <div class="xcard__body">
          <h3 class="xcard__title">${l.title}<span class="xcard__arrow">${icon('arrow')}</span></h3>
          <p class="xcard__text">${l.text}</p>
        </div>
      </a>`;
    })
    .join('');
}

/* ---------- Smooth scroll (Lenis) ---------- */
function initSmoothScroll() {
  if (prefersReduced) return;
  // Continuous exponential smoothing (lerp mode) — very fluid, no abrupt stops,
  // which keeps the scrubbed hero video gliding without jerks.
  const lenis = new Lenis({
    lerp: 0.055,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.2,
  });
  lenis.on('scroll', ({ scroll }) => {
    ScrollTrigger.update();
    if (heroShader) heroShader.setScroll(scroll / window.innerHeight);
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: -90 });
      }
    });
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = gsap.utils.toArray('.reveal');
  if (prefersReduced) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  items.forEach((el) => {
    const siblings = el.parentElement?.hasAttribute('data-stagger')
      ? Array.from(el.parentElement.children).indexOf(el)
      : 0;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: siblings * 0.08,
          ease: 'power3.out',
          onStart: () => el.classList.add('is-visible'),
        });
      },
    });
  });
}

/* ---------- Header scrolled state ---------- */
function initHeader() {
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  if (!burger || !menu) return;
  const setOpen = (open) => {
    menu.hidden = !open;
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setOpen(menu.hidden));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      burger.focus();
    }
  });
}

/* ---------- Theme toggle ---------- */
function initTheme() {
  const btn = document.getElementById('themeToggle');
  btn?.addEventListener('click', () => {
    const next =
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
  });
}

/* ---------- Animated stat counters ---------- */
function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) {
      el.textContent = target + suffix;
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(obj.v) + suffix),
        }),
    });
  });
}

/* ---------- Feature-card cursor spotlight ---------- */
function initSpotlight() {
  document.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- Hero parallax ---------- */
function initHeroParallax() {
  if (prefersReduced) return;
  gsap.to('.hero__text', {
    y: -30,
    opacity: 0.6,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__visual', {
    y: -60,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ---------- Boot ---------- */
renderFeatures();
renderExplore();
heroShader = initHeroShader(document.getElementById('heroBg'));
initSmoothScroll();
initCursor({ prefersReduced });
initOpener({ prefersReduced });
initHowHorizontal({ prefersReduced });
initShowcase({ prefersReduced });
initBentoMap(document.getElementById('bentoMap'));
initSplit({ prefersReduced });
initParallax({ prefersReduced });
initReveal();
initHeader();
initMobileMenu();
initTheme();
initCounters();
initSpotlight();
initLamp();
initLoader({ prefersReduced });
initMagnetic({ prefersReduced });

// Recompute pin distances once fonts / images settle.
window.addEventListener('load', () => ScrollTrigger.refresh());
