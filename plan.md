# trial-rooms.ai — Site Plan v2

## Current state

- 4 pages (`index.html` + `vitals.html` / `frame.html` / `pathway.html`), dark theme with lime accent, Lenis smooth scroll + GSAP reveals.
- Hero is a Three.js scroll-pinned rotating figure (to be reverted).
- Sub-pages have dark live UI mockups (to be replaced or converted).
- `assets/` empty. Legal links and demo CTAs still placeholder. No favicon, no OG, no sitemap.

## Direction

**ai.io structure + elite11plus copy energy + light theme.**

- Multi-product B2B shell from ai.io: product grid, partner logos, case studies, established-vendor feel.
- Tighter, more emotional copy register from elite11plus ("Your Game. Elevated" energy) — drop the feature-list voice.
- Off-white background with charcoal ink; lime kept as a single tight accent (chip borders, score badges, hover).
- Annotated video as the visual centrepiece — not 3D animation.

## Keep / change / drop

**Keep**
- 3-module model (Vitals · Frame · Pathway).
- Bricolage Grotesque (display) + Sora (body) + JetBrains Mono (data).
- Lime `#c6f24e` as a sparing accent.
- 5-step "how it works" section.
- Existing JS visuals (skeleton, ring, ranking nodes) — repurposed as light-theme placeholders.

**Change**
- Theme: dark → off-white + charcoal ink. All tokens in `base.css` flipped.
- Hero: 3D scroll-pin figure → text left, annotated-video tile right.
- Mockups: dark editorial → light, simpler, image-led.
- Copy: feature-listy → emotional / direct, shorter lines.
- Type weights: lighter, more whitespace, less ornament.

**Drop**
- 3D scroll-pinned hero + Three.js script.
- Marquee.
- Dark live UI mockups (replaced with annotated video / static frames).
- Grain overlay.
- Half the FAQ entries.

**Add**
- Hero annotated-video tile (right side).
- Proof wall — 4 annotated-frame tiles.
- Trusted-by partner logo strip.
- Voices — 2–3 testimonial / case-study cards.

## Phases

### 1. Reset & theme flip
- Revert 3D hero in `index.html` to simpler markup.
- Invert tokens in `css/base.css` for light mode (`--bg`, `--ink`, `--line`, surfaces).
- Remove Three.js CDN, `initHero3D` JS, marquee.
- Audit contrast on every existing component on light bg.

### 2. Hero rebuild
- Two-column layout: headline + lede + CTA left, annotated-video tile right.
- Rewrite headline + lede in tighter, emotional register.
- Scaffold the video tile with animated skeleton + 2–3 pulsing metric chips ("8.42 m/s", "knee 142°", "contact 92 ms").

### 3. New sections
- Proof wall: 4 SVG annotated frames (sprint, jump, dribble, agility), one metric label each.
- Trusted-by: 6–8 partner logo slots.
- Voices: 2 testimonial cards (quote + role + monogram).
- Trim FAQ to 4 questions.

### 4. Sub-page conversion
- Vitals / Frame / Pathway: light theme + tightened content.
- Replace each dark mockup with a light annotated-video tile + 3 feature bullets.
- Cross-link footer/nav consistency.

### 5. Launch essentials
- Favicon set (SVG + apple-touch).
- Per-page canonical / OG / Twitter meta + JSON-LD `Organization`.
- `robots.txt`, `sitemap.xml`.
- Real Privacy / Terms / Data pages (or coming-soon stubs).
- Replace `mailto:` with a real form endpoint (Formspree / Tally / own).

### 6. Real assets swap-in
- Replace placeholders once hero loop / module thumbnails / proof frames / logos / photos are supplied.

## Annotated video & image plan

| Asset | Slot | Placeholder (now) | Final spec (later) |
|---|---|---|---|
| Hero loop | Right of hero | CSS+SVG skeleton + pulsing metric chips | 4–6s muted MP4, ~900×1100 portrait, <2 MB, seamless |
| Module thumbnails | 3 product cards | Existing ring / skeleton / ranking visuals at thumbnail size | 3–4s MP4 loops, ~600×600, <500 KB each |
| Proof wall frames | Section after hero | 4 static SVG annotated frames, one metric label each | WebP, ~700×500, real drill frames |
| Partner logos | Trusted-by row | 6–8 light-grey rectangles | SVG logos supplied by partners |
| Testimonial photos | Voices section | Monogram tiles | 1:1, 800×800, real headshots |

## Open questions

- Lime accent — keep as single accent, swap to something more corporate, or drop entirely?
- Real partner logos available now, or full placeholder pass for v1?
- Pricing page in scope for v1, or post-launch?
- Copy: I draft and you edit, or you supply final copy?
- Demo CTA destination: form (which provider?) or stay on `mailto:`?
