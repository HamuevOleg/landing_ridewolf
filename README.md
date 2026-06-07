# landing_ridewolf

Cinematic vehicle-sharing landing page — a re-imagined Ridewolf product page.

Built with **Vite (vanilla JS)** + **GSAP/ScrollTrigger** + **Lenis** (smooth scroll) + **OGL** (WebGL shader hero).

## Features
- Scroll-scrubbed cinematic video intro that ends by flying the camera into the logo and to black
- WebGL shader hero (slate → Electric Indigo), mouse/scroll reactive
- Ambient particle field over the intro city
- Light/dark themes, fully responsive, `prefers-reduced-motion` aware

## Run locally
```bash
npm install
npm run dev      # http://localhost:5175
```

## Build
```bash
npm run build    # outputs static site to dist/
npm run preview  # preview the production build
```

## Stack
| | |
|---|---|
| Bundler | Vite 6 |
| Animation | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| WebGL | OGL |
| Fonts | Sora · Inter Tight · Geist Mono |
