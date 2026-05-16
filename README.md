# trial-rooms.ai — marketing site

Static marketing site for **trial-rooms.ai**, an AI football performance platform
with three modules: **Vitals** (health), **Frame** (104-point biomechanical
analysis) and **Pathway** (scouting).

Built with vanilla HTML / CSS / JS, [Lenis](https://github.com/darkroomengineering/lenis)
smooth scroll, and [GSAP](https://gsap.com/) ScrollTrigger. No build step.

## Two versions live in this repo

| Version | Path | Aesthetic |
|---|---|---|
| **v1** | `/` (root) | Cinematic Dark — text-led hero, bento products, static sections |
| **v2** | `/v2/` | Cinematic Dark + scroll-told story — cursor-trail hero, sticky scroll-scrub pipeline, progressive 104-pt reveal, page-transition wipes |

After publishing to GitHub Pages:

- v1 → `https://aayushverma03.github.io/trail-room-website/`
- v2 → `https://aayushverma03.github.io/trail-room-website/v2/`

## Pages

- `index.html` — homepage
- `vitals.html` — Health module
- `frame.html` — Technical analysis module
- `pathway.html` — Scouting module
- `privacy.html` / `terms.html` / `gdpr.html` — legal stubs (coming soon)

## Stack

- Lenis `1.3.23` — smooth scroll (CDN)
- GSAP `3.12.5` + ScrollTrigger — scroll-driven reveals & pin/scrub (CDN)
- Fonts: **Fraunces** (display serif, variable opsz) + **Inter** (body) + **JetBrains Mono** (data overlays) — Google Fonts
- Palette: cinematic dark `#07080B` background, floodlight amber `#FFD23F`
  brand accent, electric pitch-blue `#3A6BFF` secondary

Everything degrades gracefully: GSAP missing → IntersectionObserver fallback;
Lenis missing → native scroll; `prefers-reduced-motion` → scroll-driven
animations skipped.

## Run locally

No build needed. Serve the folder:

```bash
# v1 (root)
python3 -m http.server 8000

# v2 (subdir)
cd v2 && python3 -m http.server 8001
```

## TODO before going live

- Replace `https://formspree.io/f/REPLACE_ME` in every `<form>` with a real
  Formspree (or other) endpoint
- Export `assets/og.svg` to `assets/og.png` (1200×630) for social previews
- Replace placeholder partner logos, testimonial photos and annotated drill video
- Replace the canonical / OG / sitemap URLs from `trial-rooms.ai` to the final domain

## File layout

```
trial-rooms-site/
├── index.html · vitals.html · frame.html · pathway.html · privacy.html ...
├── css/base.css · css/components.css
├── js/main.js
├── assets/             # logo SVGs, og.svg, placeholder slots
├── favicon.svg · site.webmanifest · robots.txt · sitemap.xml
├── plan.md             # design / direction log
└── v2/                 # v2 build (cursor-trail hero, scroll-scrub pipeline, etc.)
```
