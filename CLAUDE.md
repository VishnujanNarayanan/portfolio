# Portfolio Website Project

## What this is
Personal portfolio for Vishnujan Narayanan. Built by adapting vectrfl.com's
structure, animations, and interactions. All visual behavior must match the
reference exactly. Content comes from master_profile.yaml.

## Reference files in this directory
- `html_reference.html` — full reference HTML with all class names and structure
- `css_reference` — full CSS with design tokens, animations, component styles
- `master_profile.yaml` — single source of truth for all personal/professional content
- `scroll_animation.mp4` — video showing scroll behavior to replicate

## Live reference site
https://www.vectrfl.com/
Fetch this URL directly to inspect structure, layout, and section order.

## Output
**Multi-page** (decision 2026-06-15, overrides the original single-file rule — see
SEO.md, which requires separate indexable pages and no hash-only links for
project/blog content). Shared `styles.css` + `main.js` (CDN libs for Lenis,
Three.js, Vanta). Pages:
- `index.html` — hub (hero, flow, project cards, skills, services, blog previews, CTA)
- `projects/<slug>/index.html` ×4 — market-data-pipeline, product-explorer,
  fraud-detection, nse-stock-prediction
- `blog/index.html` + `blog/<slug>/index.html` ×3
- `sitemap.xml`, `robots.txt`
Reference CSS is pasted verbatim into `styles.css` (Soehne→Inter swap + dead
@font-face removal only); supplemental classes appended at the bottom.

## Hard rules
- Never simplify, stub, or remove any animation
- Never change CSS variables or colors
- All JS must be rewritten from scratch (no access to original Astro bundle)
- Font: replace Soehne Buch with Inter (Google Fonts), keep Roboto
- Background: replace Three.js canvas with Vanta.js NET (CDN)
- Vanta config: points 6, maxDistance 180, spacing 200, showDots true
- Use existing CSS classes exactly as named in css_reference
- All content from master_profile.yaml only — no invented content

## Page sections in order
1. Header — logo "VJ", nav: Projects Skills Services Blog, CTAs: "Hire Me" + "Get In Touch" (mailto:narayanan.vishnujan@gmail.com)
2. Hero — fixed, 3D entrance animation, title: "Building Systems That Scale", subtitle from data_s1 summary (first 2 sentences only)
3. Flow — sticky 01-04 scroll: "Understand the domain" / "Build the pipeline" / "Validate and harden" / "Ship and maintain"
4. Projects — features grid layout, 4 cards: market_data, product-explorer, Fraud_Transaction_Detection, nse_trade_quote. Each shows project name, first outcome bullet, tech tags.
5. Skills — standards layout, left placeholder box, right title "What I Build With", 3 skill groups from skills_pool
6. Services — faq layout, left title "What I Offer", 4 accordion items: Data Pipeline Engineering, Web Scraping & Data Acquisition, Backend API Development, ML & Quantitative Analysis
7. Blog — accordion-drawer layout, label "Writing", 3 placeholder post titles from work experience war stories
8. CTA — dark bg, title "Let's build something together.", button "Get In Touch" → mailto:narayanan.vishnujan@gmail.com
9. Footer — wipe-on-hover links: Projects Skills Services Blog, copyright "© 2026 Vishnujan Narayanan"

## JS to rewrite from scratch (vanilla only)
- IntersectionObserver for all .show reveals
- Flow section scroll-driven step activation and track-fill scaleY
- FAQ/accordion max-height toggle
- Header show/hide on scroll direction
- Mobile nav toggle
- Lenis smooth scroll via CDN
- Vanta.js NET background via CDN, destroy/reinit on resize

## Changelog
Keep this section updated after every change. Format:
### YYYY-MM-DD
- what changed and why

### 2026-06-15
- Project initialized
- CLAUDE.md created with full build spec
- Resolved SEO.md vs single-file conflict → chose multi-page architecture (user decision)
- Built full site: index.html hub, 4 project pages, blog index + 3 posts (~800+ words each),
  shared styles.css (reference CSS, Soehne→Inter) and vanilla main.js, sitemap.xml, robots.txt
- main.js: IntersectionObserver reveals, flow scroll-step + scaleY fill, accordion,
  header show/hide, mobile nav, Lenis, Vanta NET (points 6 / maxDistance 180 / spacing 200 / showDots)
- Open items: placeholder copy in Services answers; canonical domain is a
  placeholder (vishnujannarayanan.com) — replace before publishing; add og.png for social cards

### 2026-06-15 (revision pass)
- Fixed asset paths: absolute (/styles.css) → relative, so pages work both double-clicked
  (file://) and served; cross-page links use explicit index.html (canonical/sitemap stay absolute)
- Fixed hero overlap: sections were static and painted behind the fixed hero. Now
  .flow/.features/.standards/.faq/.cta-section are position:relative z-index:2 over .hero (z-index:1)
- Added scroll-driven hero fade-out in main.js (title + subtitle + scroll-btn lift/fade by ~half screen)
- Shortened Projects (.features) scroll: 400vh → 150vh
- Repurposed Flow section: 01 Projects / 02 Skills / 03 Blog / 04 Services (titles link to sections),
  with real one-line teasers (replaces the process-step placeholders)
- Vanta NET color → navy 0x050419 on light 0xd9e8f1 (bolder, reference look); spec numbers unchanged

### 2026-06-15 (flow panel + dark Vanta)
- Flow section right panel: flow__wrapper is now 40% steps / 60% sticky visual; .flow__panel
  cards swap on active-step change (01 Projects 2x2 grid → 02 Skills cards → 03 Blog previews
  → 04 Services 2x2 grid). JS toggles .active on the matching [data-panel] in updateflow().
- Vanta reworked per request: #vanta-bg (first body child), three r134 + vanta@latest in <head>,
  inline VANTA.NET init on DOMContentLoaded (color 0x3932DC on backgroundColor 0x050419,
  points 6 / maxDistance 180 / spacing 200 / showDots) + resize destroy/reinit. Removed the
  old #app + main.js Vanta block to avoid double-init.
- body background → #050419 so the dark Vanta shows; hero stays transparent. Consequences:
  hero text + header (over hero) set to light; Flow given a solid light bg so its text stays
  readable (only the hero is transparent). Other sections already carry explicit backgrounds.

### 2026-06-15 (flow rebuilt to layered scene)
- Rebuilt the flow section only (per scroll_animation.mp4, now decodable with real ffmpeg).
  Reference confirmed: sticky full-screen scene with the numbered steps overlaid bottom-left,
  active step expanding its description — replaced the earlier two-column (steps left / panel
  right) layout with this layered structure.
- index.html flow markup: `.flow__wrapper` now holds two layers — Layer 1 `.flow__bg`
  (full-screen visual) wrapping the four `.flow__panel` (data-panel 1-4, added modifier
  classes --projects/--skills/--blog/--services); Layer 2 `.flow__steps` (exact reference
  step markup, unchanged classes/JS hooks). Project cards gained a `.flow-card__num`
  (01-04). Panel 02 switched from `.flow-stack` to `.flow-row` (3 cards in a row).
  Step descriptions shortened to the four one-liners from the new spec.
- styles.css flow block rewritten: `.flow{height:400vh}` (100vh/step), `.flow__wrapper`
  sticky top:0 height:100vh overflow:hidden; `.flow__bg` absolute inset:0 z-index:0
  background rgb(208,225,235); `.flow__panel` absolute inset:0 flex-centered, swap via
  opacity .5s + scale .97→1; `.flow__steps` absolute bottom/left var(--space-2xl) z-index:1.
  Cards: white #fff, border 1px #e6e6e8, radius 12px, padding 28px, shadow 0 2px 12px
  rgba(0,0,0,.06); grids max-width 800 (projects) / 700 (services), row 900, stack 600.
  `.flow` section bg also set to rgb(208,225,235). Mobile (≤820px) stacks to one column.
- main.js unchanged — existing updateflow() already splits the scroll into 4 equal zones
  (floor(progress*4)), toggles .flow__step--active, animates track-fill scaleY, and toggles
  .active on the matching .flow__panel. Verified via Playwright: panel↔step sync 1-4 correct,
  all four panels render their cards over the blue-grey scene with steps bottom-left.

### 2026-06-15 (light continuous scene — reverted dark Vanta)
- Verified from html_reference.html: the reference background is a fixed, full-screen
  Three.js WebGL <canvas> (position:fixed; z-index:-1) on body bg rgb(208,225,235) — NOT an
  SVG, NOT an image. One continuous scroll-driven scene; hero + flow are transparent over it,
  later sections (features etc.) are opaque #fcfcfc. The earlier dark (#050419) build did not
  match. Reverted to a light continuous scene (Vanta NET stays as the canvas substitute).
- styles.css: body background #050419 → rgb(208,225,235) (exact reference value). Removed the
  hero light-text override and ALL .header--on-dark rules (scene is light → hero/header text
  stay dark via base --color-text). .flow and .flow__bg backgrounds → transparent so the single
  fixed Vanta shows through both (continuous, like the reference canvas); body color is the
  fallback. Hero stays background:transparent.
- Fixed the "cards overlap the hero before scroll" bug: the fixed hero is 100svh but the
  hero-spacer was only 40svh, so the flow's sticky wrapper started 40svh down and painted over
  the hero. Set .hero-spacer{min-height:100svh} so the flow begins exactly at the fold —
  at scroll 0 only the hero shows; scrolling lifts the flow up over the continuous scene.
- index.html: Vanta backgroundColor 0x050419 → 0xd0e1eb (= rgb 208,225,235); color stays
  0x3932DC (highlight) net on the light scene. points/maxDistance/spacing/showDots unchanged.
- main.js: removed the now-dead onDark / header--on-dark toggle from the header block.
- Verified via Playwright: bodyBg rgb(208,225,235), hero title rgb(5,4,25) (dark), flow
  offsetTop == viewport height (below the fold, no overlap), clean hero at top + cards rising
  over the continuous light scene on scroll. (Headless can't composite the z-index:-1 WebGL
  net, but the scene colour is correct and the net animates in a real browser.)

### 2026-06-15 (flow rebuilt as a parallax scene)
- Rebuilt the flow section ONLY as a parallax depth scene (replaces the swapping-panel
  layout). Structure unchanged at the top level: .flow 400vh, .flow__wrapper sticky 100vh,
  overflow hidden; two layers inside.
- index.html: .flow__bg (Layer 1, z-index 0, aria-hidden, pointer-events none) now holds 14
  .flow-float cards scattered absolutely (not a grid) — some left/centre/right. Each carries
  data-step (1-4, which step it belongs to), data-speed (0.21–0.45, its parallax speed), and
  data-y (its target viewport top in vh). Cards are decorative duplicates of the real sections
  below (Projects/Skills/Blog/Services content). .flow__steps (Layer 2) is the exact reference
  step markup, unchanged — same classes, titles (Projects/Skills/Blog/Services) and JS hooks.
- styles.css: removed all .flow__panel/.flow-grid/.flow-row/.flow-stack/.flow-card rules.
  Added .flow-float per spec — white #fff, 1px solid #e6e6e8, radius 12px, padding 24px,
  box-shadow 0 4px 24px rgba(0,0,0,.08), fixed width 280px, will-change transform/opacity.
  Kept .flow-card__title/desc/tags/tag/read for inner type. .flow__bg gets pointer-events
  none + will-change transform. Mobile (≤820px): card width 230px.
- main.js updateflow() rewritten for parallax (steps behaviour preserved exactly — active
  class, track-fill scaleY, title scale). layoutCards() positions each card so it lands at
  its data-y at the centre of its step's scroll zone (recomputed on resize). On scroll: the
  background layer translates up at 0.3x scroll (LAYER_SPEED); each card gets an extra relative
  translate of -(speed-0.3)*scrolled so its NET speed = its own 0.2–0.45x (independent depths);
  opacity = active step (dist ≤ .5) → 1, neighbours fall off fast (×1.6), far → 0.12.
- Page background unchanged (rgb 208,225,235); no dark-theme changes.
- Verified via Playwright across all 4 step centres: active step 1-4 correct; bg translateY
  = -90/-270/-450/-630px (= 0.3 × scrolled) confirming the 0.3x layer parallax; opacity per
  step = {active:1, neighbour:0.2, far:0.12}; cards render scattered in depth with only the
  active step crisp and neighbours receding behind it.
