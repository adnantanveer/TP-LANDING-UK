# Techpotam landing page

Cinematic scroll-driven landing page for **Techpotam Pvt Ltd** (software dev /
digital transformation agency, real site techpotam.com). Vanilla HTML/CSS/JS,
**no build step, no framework** — this is a deliberate, explicit constraint
from the user, confirmed multiple times. Do not introduce React, a bundler,
or npm scripts without asking first.

## Run it

```
python3 -m http.server 8934
```
then open `http://localhost:8934/index.html`.

## Stack

- `index.html` — all markup + two inline `mountScrollWorld()` configs (hero
  + a second "Infrastructure" instance further down the page).
- `site.css` — everything below the hero. Has a load-bearing global
  `*, *::before, *::after { box-sizing: border-box }` reset near the top —
  do not remove it (see "Fixed bugs" below).
- `site.js` — reveal-on-scroll, scroll-world release wiring, Services card
  focus-sweep, GSAP Process sticky-stack.
- `process-3d.js` — Three.js (ES modules via CDN import map in
  `index.html`) glass 3D shapes for the Process section's 4 step visuals.
  Fails soft: no-WebGL / `prefers-reduced-motion` / any error leaves the
  CSS/SVG fallback shapes visible instead.
- `scrub-engine.js` — vendored "scroll-world" engine (scroll-scrubbed
  video), patched in 3 places for multi-instance support — see comments at
  each patch site if touching this file. Don't re-vendor/overwrite it from
  the skill without re-applying those patches.
- `assets/`, `assets/vid/` — scrub-ready video encodes + posters + card
  images.

## Design system (locked)

- **Single accent color: `#7c5cfc` (violet).** The blue accent was
  explicitly removed — user disliked it. Do not reintroduce a second accent
  color anywhere on the page.
- Real glassmorphism on buttons/nav (`backdrop-filter` + translucent fill +
  inner highlight border) — user explicitly asked for this look.
- `design-taste-frontend` skill has been applied as an audit pass across
  the page (nav, buttons, Services cards) — AI-slop tells like em-dashes,
  3-equal-card grids, eyebrow overuse, scroll cues, section-number overlays
  were checked and fixed. Worth re-checking Industries / Engagement /
  Global Delivery / CTA copy if adding new sections.
- **No fabricated stats or testimonials.** User explicitly chose to skip
  both — only ever use real, user-supplied data for either.
- GSAP + ScrollTrigger (CDN) for scroll motion, not Framer Motion (that
  needs React, ruled out by the no-framework constraint). The Process
  section uses a genuine sticky-stack pin pattern
  (`start:'top top'`, `pin:true`, `endTrigger`) — the one deliberate
  scroll-hijack outside the hero.

## Process section — current state

4 steps (Discover / Design / Build / Ship & support), each with a
`.process__visual` containing BOTH:
1. A `<canvas class="process__canvas" data-shape="...">` — real Three.js
   glass shape (sphere / torusknot / cubes / dome respectively), driven by
   `process-3d.js`.
2. The original CSS/SVG shape (orb / rings / cubes / dome-wrap) as a
   fallback, shown until (or unless) the canvas renders — `site.css`
   `.process__visual.has-3d` toggles which one is visible.

**The Three.js shapes are QA'd and working correctly, but intentionally
disabled** — `process-3d.js`'s `<script>` tag is commented out in
`index.html`. Backstory: a `var`-hoisting ordering bug in `process-3d.js`
(instances were created before `SHAPES` was assigned, so `SHAPES[shape]`
was always `undefined`) meant the canvases threw on every load and the
CSS/SVG fallback was all that had ever actually rendered, unnoticed,
through multiple earlier sessions — the four reference images this was
built to match were never actually seen live. Once the ordering bug was
fixed and the real 3D shapes rendered for the first time, the user reviewed
them live and preferred the CSS/SVG fallback look, so 3D was switched back
off deliberately (not by the bug this time). Don't re-enable by
uncommenting that script tag without checking first — the CSS/SVG shapes
are the current intended look for this section.

## Fixed bugs worth knowing about (don't re-break these)

- **Global `box-sizing: border-box`** (`site.css` top) — its absence caused
  a real text-clipping bug (height:100% + padding overflowing its box).
- **Multi-instance scroll-world** — `scrub-engine.js` `layout()` adds a
  `base` scroll offset so a second `mountScrollWorld()` instance mid-page
  computes correctly; without this patch the embedded instance's math
  breaks.
- **`.sw-copylayer::before { background: none !important }`** — a hidden
  gradient pseudo-element was corrupting Chromium's text rendering
  elsewhere on the page. Do not remove this rule or reintroduce a gradient
  there without re-testing heading text rendering across the page.
- **SVG transform + CSS animation conflict** — a CSS `animation` that sets
  `transform` REPLACES an SVG element's `transform="translate(...)"`
  attribute rather than composing with it. Fixed for the Build step's cube
  cluster by nesting each cube's polygons in an inner `<g>` with no base
  transform, and scoping the float animation to `.process__cubes > g:nth-of-type(n) > g`
  (the inner group) instead of the outer positioned one. If adding more
  animated SVG groups with a base `transform` attribute, use this same
  inner-group pattern.

## Working style notes for this project

- The user has been very literal about scope — fix exactly what's asked,
  don't add unrelated polish. Several rounds of frustration happened when
  fixes were shallow/wrong (e.g. misdiagnosing a text-rendering bug as a
  font-weight issue) — when debugging a visual bug, prefer rigorous
  isolation (DOM measurement, single-variable bisection with Playwright)
  over guessing.
- The user often checks the live page themselves — don't assume a fix is
  confirmed working just because the code looks right; they will say if
  something's still off, and have explicitly said "don't verify, I will
  do it myself" at least once, so don't spend extra turns on Playwright
  QA unless asked.
