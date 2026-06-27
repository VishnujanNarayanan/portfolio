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

### 2026-06-16 (flow rebuilt as a three.js horizontal parallax journey)
- Reference re-confirmed from the user's video (the "Board Arca" WebGL parallax site): a
  horizontal, scroll-driven journey — airy light sky, a big shifting stage title, a focal 3D
  object with smaller elements floating around it at depth, side vertical labels, and a wavy
  path with labelled station-nodes pinned at the bottom whose active node enlarges in indigo.
  User direction: use three.js for the parallax + scrolling; keep the Projects ("Selected
  work") and Skills sections unchanged. Light palette (indigo on light blue) per earlier answer.
- index.html: the flow section is now a 500vh outer / 100vh sticky wrapper. Inside: .flow__sky
  (gradient, hue cross-fades in JS) + .flow__horizon glow; a transparent three.js canvas
  (.flow__gl, created in flow.js); .flow__track (flex, 400vw) of four .flow-panel stages —
  Data Collection / Processing & Storage / ML & Analysis / Build & Ship — each with content
  (index, big title, subtitle, tool pills), 6 floating .flow-card (project + tool, one --focal),
  and .flow-panel__side vertical labels; and .flow-journey (wavy SVG path + 4 station nodes)
  pinned bottom. All card content mapped from master_profile.yaml by panel tag.
- styles.css: replaced the old .flow parallax-scene block entirely with the journey styles
  (track/panels/cards/sky/journey + a mobile fallback that drops the pin + GL and stacks the
  four stages vertically with per-stage gradients and static, full-width cards).
- flow.js (NEW, vanilla + three.js r134 global already loaded for Vanta): one rAF loop maps
  vertical scroll within the section to horizontal track translateX, cross-fades the sky hue,
  drives each card's fly-in → rest (idle sine float) → fly-out choreography with per-card
  depth parallax + lerp smoothing, advances the journey nodes + draws the path fill
  (stroke-dashoffset), and renders the three.js scene: a camera dollying along X past four
  rotating focal forms (icosahedron/torus/torus-knot/octahedron, indigo) through an indigo
  particle depth field — real 3D parallax. Click a node to jump (uses window.__lenis). Skips
  GL + pin on mobile and prefers-reduced-motion.
- main.js: removed the old flow step/parallax block (now in flow.js); exposed window.__lenis;
  reworked the hero exit so the title/subtitle mirror their entrance — they flew in from the
  right, so on scroll they exit to the LEFT with a slight upward lift + opposite tilt, giving a
  smooth hand-off into the flow. Projects/Skills/Services/Blog/CTA/footer untouched.

### 2026-06-16 (flow transition — fix card cut-off + disconnected feel; tips polish)
- Root cause of the "cards cut off mid-scroll between zones": `.flow-panel{overflow:hidden}`
  clipped each stage's cards at the panel boundary — which is exactly the seam between zones —
  so flying cards were sliced at the hand-off (and right-edge cards were clipped even at rest).
  styles.css: removed the per-panel overflow clip; the outer `.flow__wrapper{overflow:hidden}`
  still clips at the true screen edge, so cards now cross the seam unbroken.
- Root cause of the "disconnected" feel: the old fly-in/out windows barely overlapped, so the
  screen briefly emptied between zones. flow.js cardState() reworked — entry/exit windows are
  now LONG and overlap the neighbouring zone (e0 .14→e1 .36 / x0 .66→x1 .88), with smoothstep
  opacity (no hard clamps) and smaller travel (0.55×→0.4×). Zone A fades out while Zone B fades
  in over the same scroll band as panel B physically slides in → one continuous hand-off, never
  an empty screen. Verified the crossfade math: at the zone midpoint both zones' cards sit at
  ~0.5–0.6 opacity.
- Tips-file polish (premium feel without touching CSS vars/colours or removing animation):
  • subtle depth — cards now scale 0.9→1 on entry / 1→0.94 on exit (lerp-smoothed `csc`), a
    small "peak" micro-interaction as each card settles;
  • continuous travel — per-card depth parallax bumped 140→220 and applied across the whole
    visible window (not just entry/exit), so even at rest the scene reads as one space you move
    through rather than four discrete slides;
  • opacity hierarchy — stage titles hold full opacity near centre then smoothstep-fade (gone by
    |dd|≥.85) so the outgoing + incoming titles stay readable through the hand-off (no mid-dip);
  • journey nodes — added hover feedback (dot ring + zone label highlight) as a clear, polished
    micro-interaction on the one interactive element in the section.
- No HTML/markup changes; no CSS variables or colours changed; all four stages + GL scene + the
  journey spine behave as before, just without the seam clip and with the overlapping hand-off.

### 2026-06-16 (hero + zone titles reuse the hero appear animation; opposite exits)
- Reference appear animation = the .hero__title/.hero__subtitle reveal: from opacity 0 +
  `perspective(1000px) translate(50%) translate3d(-222.2px,88px,0) rotateY(60deg) rotateX(35deg)`
  to identity. The DISAPPEAR is now defined as the OPPOSITE of that appear (rotations reversed),
  redirected per-section.
- Hero title exit (main.js fadeHero): opposite-of-appear redirected UPWARD —
  translate3d(0,-e*12vh,0) rotateY(-e*60deg) rotateX(-e*35deg) + fade. Reversing the entrance
  rotations gives a matching 3D exit; the up displacement (12vh) is deliberately small (a gentle
  lift, far less than the entrance's horizontal throw). Entrance reveal untouched.
- Zone titles (flow.js, .flow-panel__content): now a scroll-driven copy of the hero appear.
  APPEAR (dd<0) uses the EXACT hero entrance values (translate(f*50%) translate3d(f*-222.2px,
  f*88px) rotateY(f*60) rotateX(f*35), f=smooth(min(|dd|,1))→0 at centre). DISAPPEAR (dd>0) is the
  opposite redirected LEFT: translate(f*-50%) translate3d(f*-222.2px,0) rotateY(f*-60) rotateX(f*-35).
  -58% folded into the translate3d Y (via calc) keeps the block vertically centred; opacity holds
  full near centre then eases out (readable hand-off). Replaces the earlier horizontal-only attempt.

### 2026-06-16 (exit rotation axis fix + scroll-cue jump fix)
- Same-axis exit: the entrance rotateY(60) rotateX(35) is matrix Ry·Rx; negating both signs in the
  SAME order (the previous exit) is NOT its inverse, so the tilt pivoted on the other diagonal. The
  true "same axis, opposite direction" is the inverse Rx(-35)·Ry(-60) — the rotateX/rotateY ORDER is
  swapped. Applied to both the hero title exit (main.js, + upward 12vh translate) and the zone-title
  disappear (flow.js leaving branch, + leftward translate). Entrances unchanged.
  [SUPERSEDED below — the 3D exit rotation itself read as messy.]

### 2026-06-16 (exit = the entrance mirrored, on the SAME elements)
- Root cause of the exit drifting to the wrong corner: the entrance animates .hero__title and
  .hero__subtitle INDIVIDUALLY (each translate(50%) is its own-width-relative; each rotates about its
  own centre), but the exit was transforming the PARENT .hero__content — a bigger box with a
  different centre/pivot, so the mirror was skewed. Fixed by driving the exit on the SAME elements
  (heroRevealEls = .hero__title, .hero__subtitle) instead of the container.
- Exit transform = each element's entrance mirrored vertically + horizontally = every value negated
  in the same order: translate(-e*50%) translate3d(e*222.2px,-e*88px,0) rotateY(-e*60) rotateX(-e*35)
  (this negate-all IS the point-reflection of the 3D tilt). With the correct per-element pivot it now
  leaves to the TOP-LEFT as the true reverse of the bottom-right entrance. transition:none while
  exiting so it tracks scroll; on return to top all inline props are cleared so the CSS entrance owns it.
- Zone titles (flow.js): already a self-consistent mirror — entrance and exit are both applied to the
  one .flow-panel__content block, leaving = the exact negation of entering (top-left, mirrored tilt).
  Restored the rotation on the leaving branch to match (rotateY(f*-60) rotateX(f*-35)).
- Hero scroll-cue ("scroll to see how I work") no longer jumps: it is centred by transform:
  translate(-50%), and the old exit set transform:translateY(...) which wiped that centring — so it
  jumped half its width sideways the moment scrolling started, and back when it returned to top. The
  container is now never transformed. Its exit is instead the REVERSE of its arrival: the label
  (.hsbtn-in, which rose up from below the clip) slides back DOWN, driven inline + scroll-tracked
  (transition:none); the underline retracts via a new .is-exiting class (styles.css,
  `.hero.show .hero__scroll-btn.is-exiting>span:after{scaleX(0)}`, specificity beats the draw-in rule).
  Reset (transition/transform removed, class dropped) at the top hands control back to the CSS arrival.

### 2026-06-16 (exit mirrors both translate3d axes — final spec)
- Iterated from y-only → x-only → both axes flipped, rotation always kept at its entrance value
  (rotateY(60), rotateX(35) never negated).
- Caught a bug on the first "both axes flipped" pass: translate(50%) and translate3d-x are opposite
  in sign in the entrance and nearly cancel (the entrance barely drifts in x — the bottom-right read
  comes mostly from the y offset + 3D tilt). Flipping only translate3d-x while leaving translate(50%)
  positive broke that cancellation, so the two terms stacked and the exit drifted right instead of
  mirroring. Fix: translate(%) is flipped too, so the cancellation pattern mirrors correctly.
- Hero title exit (main.js, heroRevealEls): translate(-e*50%) translate3d(e*222.2px,-e*88px,0)
  rotateY(e*60deg) rotateX(e*35deg) — both x-contributing terms (translate% and translate3d-x) and
  the y term flipped from their entrance signs; rotation stays at entrance values. Net effect: the
  title exits diagonally to the opposite corner from where it entered.
- Zone titles (flow.js, .flow-panel__content leaving branch): same change — txSelf = -f*50 (was
  +f*50), txPx = +f*222.2, tyPx = -f*88, rotation unchanged.
- Verified with `node --check` on both files.

### 2026-06-16 (zone text animation removed — stays static)
- User asked to remove the zone-title appear/disappear animation entirely and have it stick at its
  current position. Removed the per-frame opacity + transform block in flow.js's loop() that drove
  `.flow-panel__content` (the hero-entrance-style fly-in/out + fade); the now-empty panels.forEach
  was also dead code and removed.
- `.flow-panel__content` is no longer touched by JS at all — it sits at its CSS base position
  (styles.css: position:absolute; top:50%; transform:translateY(-58%)), fully opaque, static
  through the whole horizontal scroll. Cards (.flow-card) and the journey spine are unaffected.
- Verified with `node --check`.

### 2026-06-16 (zone text: stays screen-fixed, swaps instantly mid-scroll)
- Previous change (removing the fly-in/out animation) left `.flow-panel__content` static
  relative to its `.flow-panel` — which still rides the horizontal `.flow__track`, so the text
  was sliding off-screen with the panel instead of staying put. User wanted it pinned on screen
  and to swap to the next stage's text mid-scroll (at the zone boundary), not slide away.
- flow.js loop(): added a per-frame counter-translateX on each panel's `.flow-panel__content`
  equal to -(pi*vw + trackX) — i.e. the exact negative of that panel's current screen offset
  (its flex slot pi*vw plus the track's live translateX) — composed with the existing
  translateY(-58%) centering. This cancels the track's scroll motion so the text always renders
  at its CSS `left` position regardless of how far the track has slid. Only the active panel's
  content is shown (`display:none` on the rest); active = clamp(Math.round(global),0,N-1), which
  flips exactly at each zone's midpoint — an instant cut, no animation. Hoisted the existing
  `active` calc (previously computed later, just for the journey nodes) up to before this block
  and reused it for both.
- No HTML/CSS changes — mobile is unaffected (its `transform:none!important` rule on
  `.flow-panel__content` already guards against inline transforms, and the mobile code path
  returns before this loop logic ever runs).
- Verified with `node --check`.

### 2026-06-16 (zone-title swap → per-letter staggered up-slide)
- Replaced the instant display:none cut between zone texts with a SplitText-style per-letter
  transition (per the user's reference markup: char spans + aria-label, aria-hidden visual split).
- flow.js: new splitTitle() wraps every glyph of each .flow-panel__title as
  <span class="flow-char">(clip)<span class="char">(moves)</span></span>, sets each .char's
  transition-delay inline via --d (ci*0.03s, increasing left→right), preserves <br>, and moves the
  full text onto an aria-label (visual spans aria-hidden) so SR output is unchanged. Runs once at init
  for all four titles.
- Swap is now class-driven, not display-toggled: loop() flips .flow-panel--active / --passed only
  when `active` (= clamp(round(global))) changes — i.e. exactly at the zone midpoint — tracked via
  lastActive so the CSS transition isn't re-triggered every frame. The per-frame counter-translateX
  that keeps the text screen-fixed is unchanged and still runs every frame; display:none removed so
  the leaving + entering titles are both present for the hand-off (parked ones are clipped/opacity-0,
  so no visible overlap).
- styles.css (after .flow-panel__pill): .flow-char clips (overflow hidden + descender padding trick);
  .char slides on a plain .55s cubic-bezier transition with transition-delay:var(--d). Active panel →
  .char at translateY(0); not-yet-reached panels park BELOW (+115%); --passed panels leave UP (-115%)
  — so advancing the active zone runs a staggered up-slide out + up-slide in. index/sub/pills ride the
  same active/passed states as a grouped slide+fade with their own small delays (.06/.16/.24s).
- Mobile: added resets inside the existing @media(max-width:820px) flow block forcing .char transform
  none + .flow-char overflow visible + index/sub/pills visible, since the loop (which adds --active)
  never runs on mobile.
- Verified with `node --check` on flow.js.

### 2026-06-16 (zone-title reel — matched reference feel + pre-line whitespace)
- User shared the reference's `.text-nav-link` CSS: font-size 5.25rem / line-height .94 /
  `text-shadow:0 5.25rem` (a CLONE of the text one line below) + `[split-text]{white-space:pre-line}`
  + transition `.6s cubic-bezier(.19,1,.22,1)`. The reveal: the slot is never empty — a duplicate
  fills it as the letters roll. text-shadow only duplicates the SAME text (a same-text hover reel);
  our zone titles change text, so per the user's choice ("next zone's text rolls in") the slot is
  filled by the NEXT zone's real letters, not a self-clone.
- This already happens via coincident per-letter masks: on a zone change the OUTGOING (passed) letters
  roll 0→-115% up-and-out while the INCOMING (active) letters roll +115%→0 up-from-below, same timing,
  in masks pinned to the same screen slot — so the slot stays filled (verified the math: at mid-roll
  the slot shows the bottom of the outgoing letter + top of the incoming, a continuous reel).
- styles.css: adopted the reference feel — `.char` transition is now `.6s cubic-bezier(.19,1,.22,1)`
  (was .55s/.16,1,.3,1). Added `white-space:pre-line` to `.flow-panel__title`. Removed the
  `.flow-char--space{width:.28em}` nbsp hack.
- flow.js splitTitle(): spaces are now real " " text nodes and `<br>` becomes a "\n" text node;
  pre-line renders both (matches the reference's [split-text] handling) — no space spans, no wasted
  transitions on spaces, two-line titles preserved. Per-letter `--d` stagger (ci*0.03s) and the
  aria-label/aria-hidden split are unchanged.
- Mobile reset block unchanged (still forces .char transform none + .flow-char overflow visible).
- Verified with `node --check` on flow.js.

### 2026-06-16 (zone-title letters also fade in/out)
- User: the title text's entry/exit should fade. Added opacity to the per-letter reel — `.char` now
  defaults opacity:0 and transitions opacity alongside transform (same .6s cubic-bezier(.19,1,.22,1)
  + per-letter --d stagger). Active → opacity 1; passed/upcoming → opacity 0. So each letter now
  fades in as it rolls up into the slot and fades out as it rolls up and away.
- Mobile reset updated to force .char opacity:1!important (the loop that adds --active never runs on
  mobile, and the new default is opacity:0).
- CSS only; no JS change. styles.css edited.

### 2026-06-16 (fix hero↔flow + zone shade step — unify sky to hero bg)
- Reported: hero and zone transitions show a "different shade of colour background." Cause (pre-existing,
  from the journey rebuild, not the letter work): the hero is transparent over the Vanta scene
  (backgroundColor 0xd0e1eb = rgb 208,225,235), but the flow's opaque `.flow__sky` was painted from a
  LIGHTER set (TOP[0] #dbe6f4) and each zone used a different TOP/MID/BOT — so there was a step at
  hero→flow and again between zones.
- flow.js: TOP/MID/BOT now hold ONE shared gradient for all four zones, anchored to the hero colour —
  TOP = rgb(208,225,235) (exactly the Vanta bg, so the hero seam vanishes), easing slightly lighter to
  MID (223,233,242) / BOT (238,243,248) for soft depth. paintSky() cross-fade now produces no visible
  shift (all zones identical) — kills the zone-to-zone shade jump too.
- styles.css `.flow__sky` static gradient updated to match (#d0e1eb → #dfe9f2 → #eef3f8) so the
  pre-JS / first paint matches as well.
- Note: per the "never change colours" hard rule these are project-added sky values (not reference
  design tokens); changed on explicit user request to remove the seam. Vanta config + CSS variables
  untouched. Verified `node --check`.

### 2026-06-16 (dropped the "never change colours" hard rule)
- Per user, removed "Never change CSS variables or colors" from Hard rules. Colours/CSS variables are
  now editable when a change calls for it (e.g. the sky-unify fix above no longer needs a caveat).

### 2026-06-16 (compress card in/out scroll window)
- User: compress the scroll given for cards to animate in/out. cardState() entry/exit windows
  narrowed from 0.22 → 0.12 wide; entry now pp .24→.36 (was .14→.36), exit pp .64→.76 (was .66→.88).
  Cards snap into and out of place over less scroll with a wider rest band (.36–.64); still a small
  overlap with the neighbouring zone so the seam never goes fully empty. Comment updated; node --check OK.

### 2026-06-16 (flow 3D image objects — first milestone of the todo.md gallery)
- First milestone of todo.md's "3D image gallery" vision (planned scope: image objects + shadows +
  hanging-bulb lighting + mouse-tilt; later phases — scroll Z-depth/DOF, text lighting reaction,
  LOD/perf, glass clearcoat — deferred). NOTE: Three.js was NOT new — flow.js already ran a full
  scene (renderer, dollying camera, lights, focal geometry, particles); this AUGMENTS it.
- index.html: each .flow-panel gained data-img="images/flow/<slug>.jpg" (data-collection /
  processing-storage / ml-analysis / build-ship). Added a hanging .flow-bulb (cord + glow) inside
  .flow__wrapper. .flow-panel__floats DOM cards kept (mobile fallback).
- flow.js: createImageObject() loads each panel's image via THREE.TextureLoader into a hero
  PlaneGeometry (7×4.4 ≈16:10) at i*GAP; missing file → solid indigo placeholder material (graceful
  fallback so the scene works before assets exist). Each image: castShadow + a ShadowMaterial receiver
  plane behind it (receiveShadow) whose opacity fades with distance from its panel centre. Renderer
  shadowMap enabled (PCFSoft); key DirectionalLight now casts (ortho shadow cam) and its target tracks
  the active image. Added a warm PointLight tied to the HTML bulb (gentle breathing pulse, travels with
  the camera, warms near images via emissive). Images bob + idle-sway + mouse-tilt (pointermove → mx/my,
  lerped onto rotation). The old focal geometry demoted to smaller background accents (scale .55, pushed
  up/back). Desktop GL skips the DOM-card transform loop (if(!THREEok)); on initGL success flow gets a
  .flow--gl class.
- styles.css: @media(min-width:821px){.flow--gl .flow-panel__floats{display:none}} (hide DOM cards on
  desktop ONLY when GL initialized — so a WebGL failure still shows the cards). Added .flow-bulb /
  __cord / __glow; bulb display:none ≤820px. Mobile unchanged (GL + bulb off, cards stack).
- images/flow/ added with README listing expected filenames (user supplies placeholders).
- Verified: node --check flow.js OK; headless Chrome (desktop viewport) shows .flow__gl canvas + Vanta
  canvas (THREE CDN loads) + .flow-bulb, no JS exceptions (only swiftshader's "Error creating WebGL
  context" — a software-GL limitation, caught by the try/catch; needs a real GPU browser to see the
  shadows/float/tilt/bulb composited, per the standing headless caveat). Mobile viewport correctly
  skips GL.

### 2026-06-16 (bulb: global top-right + real bulb shape)
- User: bulb sat top-MIDDLE and looked like a "circle sun"; wants it top-RIGHT and persistent across
  every section (hero included), not just the flow scene.
- index.html: moved .flow-bulb out of .flow__wrapper to a body-level element (before <main>) so it's
  global. New markup: cord + __cap (screw base) + __glass (was cord + __glow).
- styles.css: .flow-bulb now position:fixed; top:0; right:clamp(28px,7vw,120px); z-index:40 — hangs
  top-right over all sections. Redesigned to read as a hanging bulb: thin cord, brass __cap (ridged
  via repeating-linear-gradient), pear-shaped __glass (border-radius 50% 50% 48% 48%/62% 62% 40% 40%,
  warm radial fill) with a MODEST halo (was a big 90px sun glow) + a gentle bulbGlow pulse
  (prefers-reduced-motion:none guard). Still display:none ≤820px.
- flow.js: removed the unused `bulb` query; moved bulbLight to the scene's top-right (init (9,7,9),
  per-frame x = gx+9) so the GL warm light direction matches the HTML bulb's corner.
- Verified via headless screenshot (CSS bulb renders without WebGL): bulb hangs top-right on the hero,
  bulb-shaped, modest glow. node --check flow.js OK.

### 2026-06-16 (image planes: real aspect ratio + made visible)
- User added real placeholder JPEGs to images/flow/ (varied aspect: portrait 1242×2326,
  landscape 5312×2988, etc.) and reported the images were not visible in the zones.
- flow.js: planes now adopt the texture's true aspect ratio. New fitPlane(grp, aspect) fits the
  image inside a BOX_W×BOX_H (12×7.6) box (no more fixed 7×4.4 stretch); called from the
  TextureLoader onLoad using tex.image.width/height. Image mesh, edge frame, and ShadowMaterial
  receiver all resize together (old geometries disposed). Stored edge/recv refs in userData.
- Visibility: images are now the clear hero — moved to IMG_Z=1 (in front), camera dollied closer
  (z 22→17) and re-centred on the plane (lookAt (gx,0,IMG_Z); key-light target + group baseY → y0).
  Material is side:DoubleSide (insurance against a back-facing plane). Initial placeholder is now the
  full BOX-sized indigo plane so something large shows before the texture loads.
- NOTE: still cannot verify the GL visuals headless — SwiftShader doesn't composite the WebGL canvas
  here (Vanta's canvas is invisible in headless shots too), so this needs a real-GPU browser to
  confirm. node --check flow.js OK.

### 2026-06-16 (THE images-invisible bug: global canvas{opacity:0}; + ?debug overlay)
- User reported images never appeared. Two stacked causes found by adding a `?debug` on-screen overlay
  (gated by location.search; flow.js builds a fixed <pre> reporting THREEok/flow--gl, canvas size +
  computed vis/op/disp/z, draws/tris, and per-image loaded/plane/src/screen%/topEl via elementFromPoint):
  1) On file:// the JPEG textures were CORS-blocked ("CORS request not http") — WebGL can't read
     file:// images into a texture. Fix = serve over HTTP (python3 -m http.server). Not a code issue;
     the indigo placeholder fallback was what showed.
  2) Over HTTP the debug showed THREEok=true, all textures loaded=Y, planes ON-screen, draws>0 — but
     `canvas op=0`. ROOT CAUSE: the reference's global rule `canvas{...;opacity:0}` (only
     `canvas.is-ready` is shown) was hiding BOTH our WebGL canvases (they never get .is-ready). This
     had also been hiding the Vanta background the whole time.
- styles.css fix: `.flow__gl,#vanta-bg canvas{opacity:1}` — higher specificity than the bare `canvas`
  selector (.class 0-1-0 and #id+el 1-0-1 both beat 0-0-1), so both canvases are forced visible;
  display/z-index/mobile rules untouched.
- flow.js: TextureLoader now also has an onError (sets userData.loaded=false/err) and records iw/ih on
  load; the `?debug` overlay + updateDebug() added (REMOVE before publishing — search "?debug"/dbg).

### 2026-06-16 (flow image motion: one-at-a-time, right→centre, quick left-swap)
- Iterated the image presentation with the user to a final model (earlier tries: all 4 spread along
  the dolly track = saw two at once; then pinned-centre with quick snap; then linear right→left full-
  width). FINAL spec from the user: only ONE image on screen; the active image is scroll-driven from
  the RIGHT to CENTRE using only the right half (clear of the left-aligned text); at the text change
  (zone midpoint) it does a QUICK switch — shoots off to the LEFT (allowed to use the left during the
  swap) while the NEXT image comes in from the RIGHT. First/last must not sit centred.
- flow.js renderGL image loop: imgActive = round(global); local = global-imgActive ∈[-0.5,0.5].
  targetX = active ? REST_X*(0.5-local) (right→centre; scrolling down moves it LEFT) : (passed ? OFF_L
  : OFF_R). u.off lerps toward targetX at 0.18 — tracks scroll within a zone, and resolves the big
  jump at the active flip as the quick left-exit / right-entry swap (same trigger as the per-letter
  title reel, so image + text switch together). Constants: REST_X=8, OFF_L=-22, OFF_R=22. Plane box
  narrowed to BOX_W=9.5×BOX_H=6 so the image stays on the right half. Camera still dollies in x for
  background (geometry/particles) parallax; images are positioned camera-relative (camera.x + u.off).
- node --check flow.js OK. Still needs a real-GPU browser over HTTP to view (headless WebGL caveat).

### 2026-06-17 (zone title: slide in from mid-right → stick, replacing the per-letter reel)
- User: change the zone title's entry/exit — it should enter from the RIGHT like the image but not the
  far right (from the mid-half), move LEFT with the image, REACH its rest position while the image is
  still moving, and then STICK there.
- flow.js: removed the per-letter reel entirely (deleted splitTitle() + its caller; titles now render
  as plain text). The main loop's title block now drives the WHOLE .flow-panel__content as a scroll
  position: baseline is still the counter-translateX that pins it to its CSS `left` rest spot, and ON
  TOP of that, per-panel distance d=global-pi maps entry/exit — d≤-0.5 parked at ENTER_X (=vw*0.22,
  mid-right) op0; d:-0.5→0 slides ENTER_X→0 + fades in (smoothstep), reaching rest at the zone midpoint
  while the image keeps sliding to centre (d:0→0.5 the title holds, sticky); d:0.5→1 slides to
  EXIT_X (=-vw*0.34, off-screen left) + fades out, handing off to the next title entering from the
  right over the same band. index/sub/pills keep their grouped fade via the active/passed classes.
- styles.css: dropped the dead .flow-char/.char reel rules (desktop + the mobile reset) since no per-
  letter spans exist anymore; kept white-space:pre-line so the <br> two-line titles still break.
- Mobile unaffected (early-return before the loop; .flow-panel__content transform/opacity still forced
  by the !important mobile rule). Verified node --check flow.js OK.

### 2026-06-17 (zone title exit → hero fly-out pose, quicker)
- User: make the zone title's EXIT like the hero text exit, but quicker. Entry/rest unchanged
  (mid-right slide → stick). Hero exit pose (from styles.css .hero--leaving): opacity→0,
  perspective(1000px) translate(-50%) translate3d(222.2px,-88px,0) rotateY(-35deg) rotateX(-60deg)
  — an opposite-corner 3D throw.
- flow.js: the leaving branch (d>0.5) now applies that exact hero pose on top of the screen-pin base,
  scrubbed by tx=smooth(clamp((d-0.5)/EXIT_SPAN,0,1)) with EXIT_SPAN=0.3 (was the full 0.5 band) so it
  completes over the first ~third of the leaving band → reads quicker than the hero's 0.35s timed exit.
  At tx=0 the pose is identity, so it joins the rest branch seamlessly. Replaced the old simple
  slide-left EXIT_X with this; opacity = 1-tx. node --check OK.

### 2026-06-17 (zone title exit → threshold-fired, snappy timed fly-out)
- User: the exit shouldn't be scroll-driven — it should be THRESHOLD-driven and snappy, fired at the
  same threshold where the images swap (the zone midpoint, where active=round(global) flips).
- flow.js: split the title forEach by panel vs `active` instead of by scrubbed `d` bands. pi>active =
  upcoming (parked mid-right, op0); pi===active = scroll-driven ENTRY (d<0 slides ENTER_X→0 + fades)
  then sticky rest (d≥0); pi<active = PASSED → snappy fly-out. The passed branch fires once at the
  crossing (panel._exitStart=now set only if unset; cleared whenever the panel is active/upcoming, so
  scrolling back up resets it) and ramps tx=easeOut(clamp((now-_exitStart)/EXIT_MS,0,1)), EXIT_MS=280
  — a fixed-duration timed animation independent of scroll, applying the hero fly-out pose
  (translate(-50%) translate3d(222.2,-88) rotateY(-35) rotateX(-60) + opacity 1-tx) on the screen-pin
  base. Hoisted `now=Date.now()` to the top of loop() (removed the duplicate lower decl). node --check OK.

### 2026-06-17 (zone title entry → hero APPEAR at the threshold, no fade-in)
- User: at that same swap threshold the NEXT zone's title should play the hero text APPEAR animation;
  remove the fade-in.
- flow.js: entry is no longer scroll-driven. Now BOTH entry and exit are threshold-fired timed
  animations at the active=round(global) flip (same point the images swap): the newly-active panel
  plays the hero APPEAR pose (translate(50%) translate3d(-222.2,88) rotateY(60) rotateX(35) → identity)
  over ENTER_MS=420, fired once via panel._enterStart (set when active, cleared otherwise so it re-fires
  on scroll-up). NO fade-in — opacity is forced 1 the moment it's active (upcoming panels sit at
  opacity 0, transform=base, hidden until their threshold), so the title appears at once and rotates
  into rest rather than fading. Exit branch unchanged (hero fly-out + fade, EXIT_MS=280). Removed the
  old ENTER_X mid-right slide. node --check OK.

### 2026-06-17 (zone title entry = slide-in + hero appear, combined)
- User asked why the mid-right slide-in was removed (the prior change replaced it with the hero appear).
  Per the user's choice, the entry now COMBINES both as one threshold-fired entrance: the active panel's
  content gets an extra translateX(f*ENTER_X) (ENTER_X=vw*0.22, mid-right slide decaying to rest)
  layered on top of the hero appear pose (translate(50%) translate3d(-222.2,88) rotateY(60) rotateX(35)),
  all scaled by f=1-easeOut(time/ENTER_MS). Still no fade-in (opacity forced 1 when active). Exit
  unchanged. node --check OK.

### 2026-06-17 (zone title entry: brief delay after threshold to kill overlap)
- User: at the threshold there's a subtle overlap between outgoing/incoming title; add a small delay so
  the new text shows slightly after the threshold (still threshold-fired, not scroll-position-fired).
- flow.js: _enterStart is still armed at the threshold crossing, but the appear now starts from
  elapsed = now - _enterStart - ENTER_DELAY; while elapsed<0 the new title is held hidden (opacity 0),
  so the outgoing fly-out clears first. ENTER_DELAY=90ms (the user said 5ms, but that's below one
  ~16ms frame so it wouldn't render as a delay; used 90ms as a subtle-but-visible value, single
  constant to tweak). node --check OK.

### 2026-06-17 (zone title transitions are direction-aware — reverse on scroll-up)
- User: scrolling back up should REVERSE the title transition; it was identical forward/backward.
- flow.js: replaced the _enterStart/_exitStart side logic with a pose model. Added buildPoses(vw)
  {REST, APPEAR (hero entrance origin: ex=vw*.22 slide + translate(50%) translate3d(-222.2,88)
  rotateY60 rotateX35), EXIT (opposite-corner fly-out)}, plus lerpPose/poseStr and poseOf() (a panel's
  live pose now — interpolated if mid-flight, else steady by side). On each active flip the direction
  (fwd = active>lastActive) picks poses: entering panel anim from=poseOf(...) → REST (no fade, after
  ENTER_DELAY=90); leaving panel anim from=REST → (fwd?EXIT:APPEAR) (fade out, EXIT_MS=280). So DOWN:
  enter from APPEAR, leave to EXIT; UP: the mirror — enter from EXIT, leave back to APPEAR. `from`
  captures the live pose so a mid-flight reversal continues without jumping. Steady non-active panels
  rest at EXIT (pi<active) or APPEAR (pi>active), opacity 0. node --check OK.

### 2026-06-17 (forward entrance = timed 3D appear-near-mid + scroll-driven slide to rest)
- User: on forward scroll the appear should make the text appear near mid, THEN be scroll-driven to its
  position and sticky — keeping all current animations.
- flow.js: the forward-entering _anim is now scrollX:true. Added scrollPose(AP,mx,f,s) = the hero
  APPEAR 3D part (sx/tx/ty/ry/rx) scaled by a TIMER factor f (1→0 over ENTER_MS — "appears near mid"),
  with the horizontal slide ex driven by SCROLL factor s=fwdS(pi,global)=smooth(clamp((d+0.5)/0.5)) from
  MID_X(=vw*.28)→0 (rest at d=0, sticky d≥0). Per-frame: scrollX branch resolves 3D on the timer + X on
  scroll, opacity 1 (no fade), clears _anim only when el≥dur AND s≥1. poseOf() handles scrollX so a
  mid-flight reversal captures the live hybrid pose. Backward entrance (timed EXIT→REST) and exits are
  unchanged (scrollX:false). node --check OK.

### 2026-06-17 (appear lands nearer rest; backward entrance now scroll-parallaxes too)
- User: the appear landed too far toward the middle (halve the distance), and backward scroll didn't
  trigger the text's scroll parallax (it was a fully timed entrance).
- flow.js: MID_X vw*0.28 → vw*0.14 (appear lands ~half as far from rest). The ENTERING _anim is now
  scrollX:true in BOTH directions, carrying back:!fwd + srcKind (APPEAR fwd / EXIT back). Generalized
  the helpers: scrollPose(src,…) takes the 3D source pose; slideS(pi,global,back) gives the scroll
  slide factor — forward enters from the d=-0.5 side (rest by d≥0), backward from the d=+0.5 side (rest
  by d≤0), sticky at rest either way; srcPose(P,a) resolves the kind. So scrolling up the returning
  title resolves its EXIT 3D on the timer while sliding to rest under scroll control, mirroring the
  forward entrance. Leaving (exit) stays timed both directions. node --check OK.

### 2026-06-17 (zone title = pure scroll-scrubbed pose → exact reverse on scroll-up)
- User: the backward behaviour was wrong — it triggered the previous text's scroll entrance instead of
  REVERSING the forward transition. Root cause: the title used timed/threshold-fired _anim with
  per-direction logic, which doesn't reverse cleanly.
- flow.js: scrapped the _anim/poseOf/slideS/srcPose machinery. The title pose+opacity is now titlePose(d)
  — a PURE FUNCTION of scroll position d=global-pi: d≤-.5+GAP hidden at mid; -.5<d<0 ENTER (APPEAR 3D
  resolves over W3D=.18 → appears near mid, slide mid→rest over the entry half, no fade); 0≤d≤.5 REST
  sticky; .5<d<.5+EXIT_W(.3) EXIT (fly to opposite corner + fade); beyond, gone. Because it's purely
  scrubbed, scrolling up walks the identical curve backwards — the entrance plays in reverse (slide out
  + un-appear), the exit un-exits — no separate per-direction animation, no "previous text" entrance.
  Per-frame just calls titlePose(global-pi); active/passed class toggle (for index/sub/pills) kept.
  Restored var now=Date.now() for the mobile card block. node --check OK.
- Trade-off: dropped the timed-snappy/threshold-delay model (incompatible with exact reversibility);
  snappiness now comes from short scrub windows (W3D/EXIT_W), tunable in titlePose().

### 2026-06-17 (zone title: threshold-driven appear + exit, scroll-driven slide)
- User: switch the appear and exit back to THRESHOLD-driven (timed); keep the sliding part scroll-driven;
  keep the current appear/exit positions; touch nothing else.
- flow.js: replaced the pure-scroll titlePose() with slideFactor(d) (the mid→rest sticky slide, still
  scroll-driven) + threshold timers. On the active flip, the newly-active panel gets _appearT=now and the
  newly-passed panel _exitT=now (upcoming cleared). Per frame: active = scrollPose(APPEAR, MID_X, f,
  slideFactor(d)) where f=1-easeOut((now-_appearT)/ENTER_MS=420) is the TIMED 3D appear and the slide is
  scroll-driven; passed = lerpPose(REST,EXIT, te=easeOut((now-_exitT)/EXIT_MS=280)) + opacity 1-te (timed
  fly-out + fade); upcoming hidden at mid. Poses (APPEAR/REST/EXIT, MID_X=vw*.14) unchanged. Removed the
  duplicate var now. node --check OK.

### 2026-06-17 (zone title appear/exit now direction-aware mirrors — keep threshold-timed)
- User: forward is fine, but scrolling back the returning previous zone should play the REVERSE of its
  forward EXIT, and the current zone leaving up should play the REVERSE of its forward APPEAR.
- flow.js: kept the threshold-timed appear/exit + scroll-driven slide, added direction tags. On each
  crossing fwd=active>lastActive; the becoming-active panel records _dir(fwd/back)+_appearT, the just-left
  panel records _ldir(fwd/back)+_leaveT. Per frame: active+_dir=fwd → scrollPose(APPEAR,MID_X,f,slideFactor)
  (unchanged forward appear); active+_dir=back → lerpPose(EXIT,REST,tb)+op tb (fade-in = reverse of exit);
  pi<active → lerpPose(REST,EXIT,te)+op 1-te (forward fly-out); pi>active & _ldir=back → lerpPose(REST,
  APPEAR,tu)+op 1→0 (reverse of appear); else upcoming hidden at APPEAR. ENTER_MS=420/EXIT_MS=280, poses
  unchanged. node --check OK.

### 2026-06-17 (fix backward-leave hitch — reverse of appear, continuous handoff)
- User: scrolling back, the current zone's exit still wasn't the reverse of its appear — a "hitch".
- Cause: while a panel is still ACTIVE and you scroll up, the forward-appear's scroll-driven slide
  (slideFactor) already walks it rest→mid; but the backward-leave then used lerpPose(REST,APPEAR,tu)
  which RESTARTS at REST → a jump. Also slide(scroll) + lerp(timed) don't compose.
- flow.js: backward-leave now continues the SAME scrollPose(APPEAR, MID_X, fu, slideFactor(d)) — the
  slide rest→mid already happened via scroll during the active phase, so the leave only re-raises the 3D
  (fu:0→1 timed) at mid = the exact reverse of the appear. Made every handoff pose coincide: upcoming =
  scrollPose(APPEAR,MID_X,1,0) (matches both fwd-enter start and back-leave end); the active branch now
  falls through to the scrollPose(+slideFactor) governance once the back-enter (EXIT→REST) completes
  (tb≥1), so a zone entered-backward-then-left-backward also slides continuously. node --check OK.

### 2026-06-17 (backward-leave: fade out so the rotated APPEAR pose doesn't flash)
- User: still a slight hitch on backward leave — a flash of the current text rotated in an awkward
  position at the leave threshold (the forward enter/rest look fine).
- Cause: the backward-leave re-raises the 3D to the full (extreme) APPEAR pose at mid and held op=1
  until fu=1 then popped to 0 — so the extreme rotated pose showed at full opacity right before hiding.
  (Forward enter rotates IN toward upright so the same pose reads as arriving, not awkward.)
- flow.js: backward-leave op is now 1-fu (fades out as the 3D un-resolves) instead of 1-then-pop, so the
  rotated pose is never visible at full opacity. Motion (reverse-of-appear) unchanged. node --check OK.
- If the rotated exit still reads wrong directionally, options: gentler exit pose, or fade faster
  (op = 1 - clamp(fu*1.5,0,1)). Not applied yet — awaiting feedback.

### 2026-06-18 (journey nodes flow ALONG the fixed curve with scroll)
- First attempt translated the whole spine (line+nodes) horizontally — wrong: user wants the CURVE
  FIXED and the NODES to traverse along it ("flow on top of where the line was laid out"), in unison,
  left on forward scroll / right on reverse, keeping the progress fill. Reverted that (buildPath +
  translate).
- flow.js loop(): per frame each node's x is driven directly by scroll —
  vbX = VBW/2 + (i - global)*SPACING (SPACING=VBW*0.42) — so the active node (global==i) sits dead-
  CENTRE and all four slide along as one (forward→left, back→right). y is read off the FIXED curve via
  yAtX() (a 240-sample {x,y} lookup of the spine built once at init, clamped flat past the ends for
  off-screen nodes). The strokeDashoffset progress fill is unchanged.
- Follow-up (same day): first cut used frac=(i+1-global)*step (step=1/(N+1)) so the active node sat at
  frac 0.2 (left) and spacing was tight → "activates too early / spacing too close". Re-centred on the
  node (active node centred at global==i, so Math.round(global) activation now coincides with centring)
  and widened spacing to 0.42*VBW. node --check OK.
- Follow-up: dropped the progress fill entirely — the spine is now ALWAYS fully drawn (strokeDasharray
  none, strokeDashoffset 0 at init; removed the per-frame strokeDashoffset update). Only the nodes move.
  node --check OK.

### 2026-06-18 (zone title: keep the appear/exit animations, drop only the SCROLL-driven part)
- User clarified: keep the zone-title animations, just remove the scroll-RELATED behaviour. So the
  appear/exit/direction-aware-mirror animations stay, but they're now purely TIMED (threshold-fired at
  the zone crossing) — no scroll-driven slide. flow.js loop() title block: every branch is now a plain
  timed lerpPose between REST and APPEAR/EXIT (forward enter APPEAR→REST no-fade; forward leave
  REST→EXIT fade; backward enter EXIT→REST fade-in; backward leave REST→APPEAR fade-out; upcoming hidden
  at APPEAR). Removed scrollPose()+slideFactor() usage and the MID_X scroll-slide; the appear's small
  horizontal slide is baked into APPEAR.ex and resolves on the ENTER_MS timer. scrollPose/slideFactor
  now unused (left in place). node --check OK.

### 2026-06-18 (background → custom Three.js shader in Lando palette)
- Replaced the Vanta NET background with a custom Three.js fullscreen fragment-shader scene to
  match the Lando (OFF+BRAND) reference look. Lando's actual bg is a proprietary three.js r174
  WebGL shader bundle (canvas.gl) we don't have source for — so this recreates the FEEL, not a copy.
- index.html: removed the vanta.net CDN <script>; the inline DOMContentLoaded init now builds a
  WebGLRenderer + fullscreen quad ShaderMaterial appended into #vanta-bg. Frag shader = 5-octave
  fbm flow, palette dark-green #282c20 / deeper #1b1e17 / lime #d2ff00 / off-white-green #dde1d2:
  vertical base gradient → fbm-warped dark → sparse lime threads (smoothstep glow) + faint off-white
  highlights + vignette. rAF loop drives u_time; resize updates u_res. Canvas gets .gl-bg class.
- styles.css: body background rgb(208,225,235)/var(--color-bg) → #282c20 (Lando --color--dark-green).
  Existing `#vanta-bg canvas{opacity:1}` already overrides the global canvas{opacity:0} so the new
  canvas shows. #vanta-bg container rule unchanged (fixed, inset:0, z-index:-1).
- Only index.html changed; project/blog pages still use the old Vanta bg (not requested).

### 2026-06-18 (hero = zoom-out image; flow bg revealed around it)
- Made the hero behave like a Lando-style full-screen IMAGE that zooms out on scroll, revealing
  the flow section's background around all four edges.
- index.html: moved #vanta-bg (the custom shader canvas) from a body-level fixed layer to INSIDE
  .hero, so it scales together with the hero as one rectangle.
- styles.css: #vanta-bg now position:absolute;inset:0;z-index:0 (fills the hero, was fixed z-index:-1);
  .hero__content position:relative;z-index:1 (over the shader). body background → #d0e1eb (flow
  __sky top colour) so the area revealed as the hero shrinks reads as the flow background.
- main.js updateHeroExit: scales the WHOLE .hero (origin centre) 1→0.5 over one viewport and shifts
  it up (shift=-(scale*vh/2)*e) so the finished rectangle occupies the upper half (bottom edge on the
  mid line). The shader shrinks with it from all edges; flow-colour body grows to fill the rest.
  Phase-2 lift unchanged. node --check OK.

### 2026-06-18 (header reacts to hero zoom-out: colour flip + shrink-to-edges)
- During the hero zoom-out the header no longer slides up/vanishes. main.js:
  • onScroll keeps the header .show while scrollY < innerHeight (the zoom phase).
  • updateHeroExit (driven by progress e): nav-left links + both .pill-btn-span texts colour
    white→black (Math.round(255*(1-e))); .header__nav-left scales 1→0.65 origin left, .header__nav-right
    scales 1→0.65 origin right (shrink anchored to the page edges); the dark "Get In Touch" pill bg
    interpolates #050419→#d0e1eb so its (now-black) text stays legible. All reverse on scroll-up.

### 2026-06-19 (theme recoloured green/lime → blue)
- Switched the accent/background theme from the Lando green-lime palette to blue, keeping the
  light/dark behaviour and all neutral greys (greys stay grey, just blue-tinted where they were
  green-tinted). Mappings applied across styles.css, main.js, index.html, flow.js:
  • dark base #282c20 → #1b2236 (navy): body + .subpage-body bg; index.html shader DARK/DARK2
    vec3(0.157,0.173,0.125)/(0.106,0.118,0.090) → (0.106,0.133,0.212)/(0.075,0.094,0.161).
  • lime accent #d2ff00 + rgba(210,255,0,*) → bright blue #4d8bff + rgba(77,139,255,*): flow zone
    titles, journey line/fill/dots/active/hover, .flow__horizon glow, main.js global contour colour,
    flow.js rim DirectionalLight 0x8aa800 → 0x4d8bff.
  • greenish-grey #989c8e → blue-grey #969ba8 (hero zoom-out landing bg + hero contour colour).
  • faint-green near-white hero gradient rgba(236,244,237)/(242,247,242)/(248,250,246) →
    faint-blue rgba(236,240,248)/(242,245,250)/(248,250,253).
- Untouched: --color-highlight #3932DC (already blue/indigo), the blue-grey light tokens
  (#fcfcfc/#d9e8f1/#eff4f4), the warm bulb PointLight 0xfff0d0, and lando-reference.html (reference).
- node --check passed on main.js + flow.js.

### 2026-06-19 (Writing section as scroll-triggered staggered panels — blog_reference)
- New branch `blog-panels`. Inserted a Writing section (`.writing#blog`) immediately AFTER the
  flow section (before `.features#projects`), per user request, adapting blog_reference's
  "PP Neue Montréal" scroll-triggered staggered panel animation.
- Structure: `.wpanels` column of four full-height `.wpanel`s (intro + 3 blog posts). Each panel
  = `.wpanel__grid` (120px rail / 1px divider / content). On scroll-in the `.wpanel__content`
  slides translateX(80px)→0 + fades and `.wpanel__divider` slides translateX(-12px)→0 + fades,
  3000ms cubic-bezier(.25,.46,.45,.94), 100ms stagger (panels nth-child 2/3/4 → delay 0/100/200ms),
  driven by the `.active` class. Panel 0 (`.wpanel--intro`) is always visible (transition:none).
  Panels are pointer-events:none; only the inner `.wpanel__link` "Read" links are interactive
  (pointer-events:auto) — matches the reference's no-hover-on-panels note.
- Theme adapted to the site's blue palette (reference's bright per-panel colours → deepening navy
  #141a2b → #1b2236 → #243049 → #2d3c63, white text, #4d8bff accent on meta/divider/links). Fonts
  use Inter weights (300/400/500) in place of the PP Neue Montreal weight variants. Left rail shows
  index top + vertical category bottom.
- Content from the existing blog posts (titles + excerpts + read-times pulled from blog/index.html):
  intro panel links to blog/index.html; three post panels link to the three blog/<slug>/ pages.
- Removed the OLD `.faq#blog` "Writing" accordion section (was section 7, between Services and CTA)
  to avoid a duplicate id="blog" and duplicated blog content. Nav/footer Blog links point to
  blog/index.html (separate page), unaffected.
- main.js: new IntersectionObserver block (threshold 0.3, animate-once, unobserve) adds `.active`
  with i*100ms stagger; no-IO fallback adds .active immediately. Mobile (≤820px): panels auto-height,
  stacked, content/divider forced visible (transform:none, transition:none) — no JS animation needed.
- styles.css supplemental block appended; node --check main.js OK; single id="blog" verified.

### 2026-06-19 (Writing rebuilt as sticky horizontal-stacking panels)
- The first cut stacked panels VERTICALLY (full-height blocks scrolled past one after another).
  User clarified from the reference image: panels must STACK ON TOP of each other horizontally —
  each slides in from the right and piles over the previous, leaving earlier panels as thin
  vertical colour strips. Rebuilt accordingly (replaces the IntersectionObserver staggered version).
- index.html: `.writing#blog` now has `style="--n:4"` → `.writing__pin` (sticky 100vh) → `.wstack`
  (absolute) → four absolutely-positioned `.wpanel`s. Each panel = `.wpanel__rail` (number +
  vertical label, the sliver left visible when covered) + `.wpanel__content`. Removed the
  grid/divider markup.
- styles.css: `.writing{--strip:clamp(54px,5.5vw,86px); height:calc(100vh + (var(--n)-1)*100vh)}`
  (one screenful of scroll per slide-in). `.wpanel` absolute, left=`i*--strip` via nth-child,
  z-index ascending (later on top), nth-child 2-4 start `translateX(100vw)`. Rail flex 0 0 --strip
  with `.wpanel__num` (bottom) + `.wpanel__vert` (vertical writing-mode). Mobile (≤820px): pin/stack
  dropped — panels become plain full-width vertical blocks, rail hidden, transforms cleared.
- main.js: replaced the IO staggered block with a scroll-scrubbed stack. Maps scroll past the pinned
  section to g∈[0,N-1]; panel i (i≥1) translateX = (1-easeOut(clamp(g-(i-1),0,1)))*(innerWidth - i*strip)
  → slides off-right→rest and reverses smoothly. Skips/clears transforms when innerWidth≤820.
- node --check main.js OK.

### 2026-06-19 (Writing → hover-driven horizontal accordion)
- User: it should be HOVER-driven (expand on hover) like the reference, not scroll-driven. Replaced
  the sticky scroll-stack with a CSS-only horizontal accordion (removed the main.js scroll block — no
  JS now; left a one-line note).
- index.html: dropped the `.writing__pin` sticky wrapper + `style="--n:4"`; `.writing` > `.wstack`
  (flex row) > four `.wpanel`s, each rail + content unchanged.
- styles.css: `.wstack{display:flex;height:clamp(560px,86vh,920px)}`; `.wpanel{flex:0 1 var(--strip)}`
  (collapsed strip clamp 56–92px). Open logic: first panel `flex-grow:1` by default; on
  `.wstack:hover`/`:focus-within` the first closes and the `:hover`/`:focus-within` panel grows to
  fill. Content is fixed-width (`--cw:min(720px,58vw)`, clipped by `overflow:hidden`) and fades
  opacity 0↔1 with the same open states (keyboard-accessible via :focus-within on the inner links).
  Mobile (≤820px): accordion dropped — `.wstack` block, panels full-width, content opacity 1, rails
  hidden.
- node --check main.js OK.

### 2026-06-19 (Writing accordion → right-anchored, fixed-width expansion)
- User clarified from 3 reference screenshots: the strip group is ANCHORED RIGHT with a heading on
  the left, and opening a panel expands it by only ONE fixed content column (not the full page);
  exactly one panel is open at a time.
- index.html: dropped the intro-as-panel. `.writing` now = `.writing__intro` (left heading "Notes
  from the build" + lead + "All writing" link) + `.wstack` (3 post strips). 
- styles.css: `.writing{display:flex;overflow:hidden;--strip:clamp(64px,7vw,108px);
  --cw:clamp(320px,32vw,460px)}`; `.writing__intro{flex:1}` pushes `.wstack{flex:0 0 auto}` to the
  right edge. Panels `flex:0 0 var(--strip)`; open = `flex-basis:calc(var(--strip)+var(--cw))`.
  First open by default; on `.wstack:hover`/`:focus-within` the first closes and the hovered/focused
  panel opens — total width constant (one open at a time), so the group neither grows nor reflows
  the page. Content fixed-width `--cw`, clipped while collapsed, fades opacity 0↔1 with the open
  state. Rail = vertical label (top) + number (bottom). Mobile (≤820px): block layout, heading +
  full-width post blocks, all open, rails hidden.

### 2026-06-19 (Writing accordion — right-anchor hardening + cache note)
- A screenshot showed the strips not reaching the right edge with a narrow clipped heading. Verified
  via an isolated headless render that the existing CSS was actually correct (full-width section,
  .wstack right-anchored, panel 1 open) — the broken look matched an OLDER cached styles.css applied
  to the new HTML (the file was rewritten several times). Root cause = browser cache; fix = hard
  refresh.
- Hardened anyway so right-anchoring can't depend on the intro growing: `.wstack` now has
  `margin-left:auto` (forces it to the right edge) and `.writing__intro{flex:1 1 0%}` (grows from 0,
  no min-content lock). Mobile resets `.wstack{margin-left:0}`. No HTML/JS change.

### 2026-06-19 (Writing — added placeholder panels to match reference's longer set)
- User: reference has ~9 panels; the 3-strip version looked sparse. Added 6 placeholder posts
  (panels 04–09: Backend / Scraping / Data eng / Quant-ML / Backend / DevOps) after the 3 real
  ones — 9 total. Placeholder excerpts (prefixed "Placeholder —"), links point to blog/index.html
  until real pages exist. Extended `.wpanel:nth-child` backgrounds to 9 navy→blue steps. With more
  strips the group now fills the right side like the reference (heading left, strips anchored right).

### 2026-06-19 (Writing — empty left + fill-width strips so last panel can't overflow)
- User: the heading/intro text was sitting in the left area that should be empty (remove it), and
  with 9 fixed-width panels the LAST panel ran off the right edge.
- index.html: removed `.writing__intro` (heading/lead/link); left side is now an empty
  `.writing__pad` spacer.
- styles.css: switched the strips from fixed-width to FILL-the-width. `.writing__pad{flex:0 0
  clamp(40px,10vw,220px)}` (empty gap); `.wstack{flex:1 1 auto;min-width:0}`. Panels collapsed =
  `flex:1 1 0` (share leftover width equally); open = `flex:0 0 calc(--strip + --cw)` (fixed content
  column). Because collapsed panels share whatever space remains, the set always fits the container
  — the last panel can never overflow regardless of count. Rail now `flex:1 1 auto;min-width:--strip`
  so the vertical label centres in a wide collapsed strip yet resolves to --strip when open. Removed
  the intro/heading rules + mobile `.writing__intro`; `.writing__pad{display:none}` on mobile.

### 2026-06-19 (Writing accordion — sticky-hover via JS to kill the jitter)
- Pure CSS :hover on the resizing strips flickered: opening a panel shifts the layout under the
  cursor, re-triggering :hover on a neighbour (feedback loop). Also confirmed animating flex-grow
  makes it worse, so kept the basis-only model.
- styles.css: open state now keys off `.wpanel.is-open` (plus `:focus-within` for keyboard) instead
  of `.wstack:hover .wpanel`. Removed the :hover open/close + content-opacity hover rules.
- main.js: new sticky-hover block — `mouseenter` on a panel sets `.is-open` (cleared from siblings);
  `.wstack` `mouseleave` reverts to the first panel. mouseenter fires once on cross-in, so a panel
  resizing under the cursor never re-fires → no flicker. First panel open on init. node --check OK.

### 2026-06-20 (header reel colour fix + nav-link per-letter hover weight)
- Fixed setHeaderTheme colour-snap: it set the __a letters to the destination colour at the same
  moment it toggled .is-rolled, so the pill/nav reel played new→new instead of old→new (white
  snapped to black, then animated black→black; Get In Touch did the mirror). Now the __a colour is
  only updated when NOT rolling to the light world (`!ease || !rolled`) — rolling to light keeps the
  source colour on __a (so it reels old→new), and unrolling back to dark still recolours __a so the
  returning letter arrives correct.
- Nav-link per-letter HOVER WEIGHT REEL (Projects/Skills/Services/Blog): hovering a link boldens the
  letter under the cursor and its neighbours with a gaussian falloff (SIGMA 1.45 letters, BASE 400 →
  PEAK 900). index.html loads Roboto Flex (variable, wght 100..900); styles.css gives .nav-char
  font-family Roboto Flex + font-variation-settings "wght" var(--w,400) with a .14s transition (snappy
  smooth interpolation). main.js buildNavReel: per-link pointerenter caches letter centre-x, pointermove
  finds the nearest letter and sets each letter's --w by distance, pointerleave resets to 400. node
  --check OK.

### 2026-06-20 (header buttons — per-letter HOVER REEL on all of them)
- Added a hover reel to every header button (nav links Projects/Skills/Services/Blog AND the two CTA
  pills Hire Me / Get In Touch). Hovering rolls each letter up to a clone with a per-letter stagger.
- Self-reel, not a world-flip: the clone (`__c`) is `color:inherit`, and since setHeaderTheme keeps
  each link/pill `color` synced to the current world's visible text colour, `__c` is ALWAYS legible
  in either world (white-on-dark at top, black-on-light after the flow flip) — a plain colour-flip
  reel would have shown black-on-dark at the top. So hover = same-letter, same-colour vertical roll.
- Structure (main.js buildNavReel + buildPillReel): each char is now
  `.nav-char`(clip) › `.nav-char__col`(hover roller) › [`.nav-char__face`(world-flip clip: __a/__b) +
  `.nav-char__c`(clone)]. The existing scroll world-flip still rolls __a/__b INSIDE __face; the hover
  rolls __col — independent, so the two compose. Same for `.pill-char*`.
- Stagger: new `--hd` (local per-button letter index × 0.022s) drives the hover-roll transition-delay,
  separate from `--d` (the global world-flip stagger) so a later link (Blog) doesn't lag on hover.
- styles.css: `.nav-char__col/.pill-char__col` transition transform .42s with delay var(--hd);
  `__face` overflow:hidden position:relative; `__c` absolute top:100% color:inherit; hover/focus-visible
  on the link/pill rolls __col translateY(-100%). Moved the font-variation-settings weight transition
  onto the glyph leaves (__a/__b/__c) so the inherited --w weight change animates (it renders on the
  leaves, not the .nav-char). node --check main.js OK.

### 2026-06-20 (hover reel: opposite-blue flip after thresholds; hero keeps same-colour)
- The header hover reel now rolls each letter to the OPPOSITE blue of its current colour: sky blue
  (#4d8bff) when the text is white, dark blue (#3932DC) when the text is black. The INITIAL HERO
  keeps the previous behaviour (same-colour self-reel).
- Driven by a `--hc` custom prop on the clone (`.nav-char__c`/`.pill-char__c{color:var(--hc,currentColor)}`).
  Unset → currentColor (same-colour, hero). Set at the threshold worlds:
  • setHeaderTheme: in the `ease` (threshold) branch sets the PILLS' --hc from their current visible
    colour (Hire Me: rolled→black→dblue / unrolled→c; Get In Touch inverted: rolled→white→sky /
    unrolled→c2). In the no-ease branch (hero zoom) it CLEARS --hc on nav + both pills → same-colour.
  • __navLight: owns the NAV --hc (threshold-driven) = on(light world, black)→#3932DC / off(dark,
    white)→#4d8bff. buildNavReel now collects the <a>s (navAs) to set it.
- c/c2 hoisted out of the colour-guard in setHeaderTheme so --hc can read them even when __a colour
  is intentionally not updated (rolling to light). node --check OK; top render verified unchanged.

### 2026-06-20 (hover accent: darker nav blue + CTA pills flip to opposite colour)
- Nav-link hover dark-blue accent changed #3932DC → #231d7a (the deep zone-3/4 title blue from
  flow.js:630). Sky blue (#4d8bff) for white text unchanged. Set in __navLight.
- The two CTA pills (Hire Me / Get In Touch) no longer roll to a blue on hover — they roll to the
  literal OPPOSITE colour (white<->black), computed in setHeaderTheme's ease branch from each pill's
  current visible channel (Hire Me __b black / Get In Touch __b white).
- KNOWN ISSUE flagged to user: Get In Touch sits on a SOLID contrasting bg (var(--color-dark) →
  light), so its text's "opposite" colour ≈ its background → the hover clone is low-contrast/illegible
  there. Hire Me (translucent glass) is fine. Pending user decision: full button-invert (swap bg too)
  or keep GIT on a legible colour.

### 2026-06-20 (hover flip: gate hero same-colour by class so it flips the moment you scroll)
- Edge case: between the hero zoom ending and the first reel threshold, the hover clone stayed
  same-colour (white→white) instead of flipping to light blue; it only corrected after a threshold.
- Root cause: setHeaderTheme CLEARED --hc in its no-ease branch (hero), and past the zoom it isn't
  called again, so --hc stayed cleared until __navLight fired.
- Fix: --hc is now set UNCONDITIONALLY to the flip target (pills opposite white/black; nav sky/deep
  blue from the live text channel in the no-ease branch). The hero same-colour reel is gated by a new
  `header.is-hero` class (CSS `header.is-hero …__c{color:currentColor}` overrides the --hc colour).
  updateHeroExit toggles `is-hero` ON only at the very top (scrollY<=0); the moment a scroll is
  detected it drops off and the clone carries the flip colour — no wait for a threshold. styles.css +
  main.js. node --check OK; top render unchanged.

### 2026-06-21 (features grid → animated terminal demo)
- Replaced the Selected-work project grid inside `.features#projects` with a faux Linux terminal
  window. The section structure (sticky 100vh + margin-top:-100svh cover-scroll over the pinned
  blog + its navy `.section-contours` canvas) is unchanged, so the terminal keeps the exact
  scroll-up-into-sticky cover the grid had. (Considered a scroll-driven video first; user scrapped
  it for a built component.)
- index.html: `.features__sticky` now holds `.terminal` (title bar with traffic-light `.terminal__dot`s
  + `.terminal__title` "vishnu@ASUS-TUF-F16-Vishnu: ~") and an empty `#term-body` filled by JS. Old
  feature-item markup removed; id="projects" kept for the nav link.
- styles.css (supplemental): medium-blue window (#1d2c54 body / #16224a bar) per user request, monospace
  stack, rounded + shadowed, fixed height (min(70vh,640px)); `.features__sticky{align-items:center}`
  centres it. `.term-user` green / `.term-path` blue prompt; `.term-cursor.is-blink` keyframe. Mobile
  shrinks font/height. Old `.features .feature-item*` colour rules left in place (now unused, harmless).
- main.js: new terminalDemo() IIFE. Scripted lines (cmd = typed char-by-char after the prompt; out =
  printed) reproduce the user's session — `systemctl statius` typo + error, `systemctl status` +
  systemd error, `service mysql status`, then `apt install mysql-server -y` with a TRIMMED slice of the
  install output (header, a few Get:/Unpacking/Setting up lines) — body auto-scrolls, then parks at a
  blinking prompt waiting for the next command. Plays once via IntersectionObserver (threshold .35);
  prefers-reduced-motion / no-IO renders all lines instantly. HTML-escapes output. node --check OK.

### 2026-06-21 (terminal: full-screen, scroll-driven, trimmed)
- Terminal now fills the whole sticky window: `.features__sticky` padding/gap → 0, align stretch;
  `.terminal` width 100% / height 100vh, no radius/border/shadow. Body padding/font bumped (26px/15px).
- Dropped the three opening commands (systemctl statius / status / service status). Script now starts
  at `sudo apt install mysql-server -y` and the install output is trimmed to ~12 short lines, ending
  with a blinking prompt.
- Printing is now SCROLL-DRIVEN, not time-based: `.features` height → 260vh; terminalDemo() maps the
  section's pinned scroll progress (−rect.top / (height−innerHeight)) to a character count across all
  lines and renderChars() draws that many chars (whole lines + the live partially-typed line with a
  cursor), auto-scrolling the body. Reverses on scroll-up; reduced-motion shows it all at once.
  rAF-throttled scroll/resize listeners. node --check OK.

### 2026-06-21 (terminal: finishes earlier + SELECT renders project cards)
- Typing now finishes slightly before the terminal fully pins (progress endTop vh*0 → vh*0.14).
- Extended the script past the install: `sudo mysql` → monitor welcome → `USE portfolio;` →
  `SELECT * FROM projects;`. The SELECT line is flagged `proj:true`; renderChars() renders the
  projects as the query result under it — 4 clickable `.term-proj` cards (id, title, desc, tags,
  arrow → project page) from a PROJECTS array, plus a "4 rows in set" meta line. Final waiting
  prompt switched from the bash prompt to the `mysql>` prompt. Added prefixOf() ("cmd"=bash,
  "sql"=mysql>, "out"=none) and the MYSQL prompt span.
- styles.css: .term-mysql prompt colour; .term-result / .term-projects (2-col grid, 1-col mobile) /
  .term-proj card styling in the terminal's blue palette (reuses .proj-tag). node --check OK.

### 2026-06-21 (project cards restyled to Lando "helmet-grid" reference)
- Reworked the SELECT result cards to match projects_reference (Lando "Helmets" grid) using its
  hover animation from lando-css-reference: image-base cards with a NOTCHED-corner SVG frame
  (base outline + brighter overlay that fades in on hover — same viewBox/path as the ref), a
  hover image-reveal WIPE (clip-path: ellipse(100% 0% at 50% 0) → ellipse(142% 120% at 50% 0))
  exposing a blue panel with the description + tags + CTA, base image scale/darken on hover, and a
  bottom label (title left, 0N index accent right). 4-col grid → 2-col ≤1100px.
- main.js: PROJECTS gained `img` (mapped to the four images/flow/*.jpg placeholders). projectsHtml()
  rewritten to emit `.proj-card` markup with frameSvg() (F_BASE/F_OVER path constants). Body split
  into linesEl + a persistent projEl (built ONCE so card images don't reload/flicker as the typed
  text re-renders each scroll frame) + tailEl; renderChars() updates linesEl.innerHTML and toggles
  projEl/tailEl visibility instead of rebuilding the whole body.
- styles.css: replaced the old flat `.term-proj` list rules with `.proj-card*` (frame/media/img/
  reveal/label) styles in the blue palette. Verified via headless Chrome over HTTP: 4 cards render
  with frames, and hover wipes in the description panel + lights the frame blue.
- NOTE: card images are the flow placeholders (basketball stills) — swap for real project images.

### 2026-06-21 (terminal: two-phase — type to full-cover, then fade pre + ease SELECT to top)
- Extended .features 260vh → 360vh (more scroll room for the new phase-2 motion).
- FIX: .features__sticky was computing to position:relative (a later base rule
  ".features__sticky,.standards__container,.faq__container{position:relative}" overrode the sticky),
  so the terminal never pinned — it scrolled away. Supplemental rule now sets
  position:sticky;top:0;height:100vh;z-index:1 (wins, being last in source).
- Two-phase scroll model in terminalDemo():
  • Phase 1 (rect.top 6/7·vh → 0, the slide-in): type the WHOLE script; at full cover the last
    line shown is `mysql> SELECT * FROM projects;` and NO projects are visible yet.
  • Phase 2 (rect.top 0 → −1.15·vh, while pinned): the pre-SELECT block (install + monitor lines)
    collapses (max-height) + fades (opacity) to nothing while the SELECT line eases to the top and
    the project cards expand + fade in — one continuous easeInOut motion.
- Body restructured into preEl (pre-SELECT lines) + selEl (the SELECT line) + projEl (cards, built
  once). renderText() routes char-revealed lines into pre/sel; applyPhase(bT) drives the collapse/
  reveal via measured scrollHeight. .term-result margin 0 + .term-projects padding-top:24px so the
  collapsed (max-height:0) state shows no gap. reduced-motion → final state. Verified all 3 phases
  via headless Chrome. node --check OK.

### 2026-06-21 (terminal phase-2 → threshold-fired TIMED reveal, not scroll-scrubbed)
- Per user: reaching the top is a THRESHOLD; phase 2 is no longer scroll-driven. Phase 1 (typing)
  stays scroll-driven up to full cover. When rect.top ≤ 0 (terminal reaches the top), update()
  toggles `.terminal.is-revealing`, firing a TIMED CSS reveal; scrolling back above the threshold
  removes the class and reverses it. Removed the scroll-scrubbed applyPhase()/bT/easeInOut + B_SPAN.
- Sequencing (projects don't appear until the text has moved up): styles.css drives it via the class
  — .term-pre collapses (max-height 60vh→0) + fades (opacity) over .6s so SELECT eases to the top;
  .term-result fades+slides in (opacity/transform) with transition-delay .5s so the cards come in
  AFTER the pre-block clears. reduced-motion adds the class immediately (final state).
- Verified via headless Chrome: pre-threshold = full script typed, no projects; just after threshold
  = pre fading while SELECT holds; settled = pre gone, SELECT at top, 4 cards revealed. node --check OK.

### 2026-06-21 (terminal bg → dark contour-line field)
- Per user: terminal now uses the dark navy "contour lines" background (the section's own
  .section-contours canvas, z-index 0) instead of the solid medium-blue fill. styles.css:
  .terminal background #1d2c54 → transparent so the canvas behind shows through; .terminal__bar
  bg → rgba(15,22,40,.72) (translucent) to sit on the field. Verified via headless Chrome.

### 2026-06-21 (header world flip → unified to the features-hit threshold)
- Branch `features-threshold-header-switch`. User: in the features section, the nav buttons
  (Projects/Skills/…) AND the CTA pills should switch the moment the section HITS its threshold —
  not the two separate, later thresholds previously used.
- main.js contour frame loop: the world flip (light blog → dark features) was driven by blog
  scroll-progress at TWO points — nav reel re-whitened at blogProg 0.60, CTA pills flipped at 0.07.
  Replaced both with a SINGLE threshold off the `.features` section: `wantDark = featuresEl
  .getBoundingClientRect().top <= 0` — the same rect.top≤0 point at which the dark navy bg covers
  the fixed header and the terminal reveals (is-revealing). Both __navLight and __headerTheme now
  fire together at this one threshold (and reverse together on scroll-up). Added `featuresEl` ref
  near `writingPin`. node --check OK.

### 2026-06-21 (blog cover-scroll waits for the panel reveal to finish)
- Branch `features-wait-blog-anim`. Bug: the blog (.writing) panel reveal is TIMED (DUR 2.6s,
  latched), but the features section rides up over the pinned blog purely on scroll (margin-top
  :-100svh + sticky during .writing's second 100vh). So scrolling fast pushed features up and
  overlapped panels that were still animating.
- Fix (main.js, the writing IIFE): added a cover-scroll LOCK. While the reveal is still playing
  (T<1 && latched) and the pin has reached the top (section rect.top ≤ 0 = cover-start), engageLock()
  freezes the page in place — lenis.stop() (when Lenis is active) + preventDefault on wheel/touchmove
  /scroll-keys + a window `scroll` clamp back to lockY (catches scrollbar drags / native/reduced-
  motion). The instant the panels settle (T≥1) releaseLock() runs (lenis.start() + listeners removed)
  so features can begin covering. Lock never engages on mobile (releaseLock() in the ≤820 branch; no
  cover-scroll there) and never for slow scrollers whose reveal finishes before rect.top hits 0.
  node --check OK.

### 2026-06-21 (terminal title bar swipes up + vanishes at the threshold)
- Branch `fix-features-window-top-bar`. User: when the terminal hits its threshold the mac-style
  title bar (traffic lights + `vishnu@…:~`) should swipe UP and vanish.
- styles.css only: `.terminal__bar` gained max-height:64px + overflow:hidden + a transition on
  transform/opacity/max-height/padding/border-bottom-width (.4–.5s). New rule
  `.terminal.is-revealing .terminal__bar{transform:translateY(-100%);opacity:0;max-height:0;
  padding:0;border-bottom-width:0;pointer-events:none}` — fired by the same `.is-revealing` class
  as phase 2, so it's threshold-timed and reverses when the class is removed. The bar slides up
  while collapsing so the terminal body reclaims the space.
- Follow-ups (same branch):
  • Bar background `rgba(15,22,40,.72)` → solid `#0f1628` so the section's flowy contour-line field
    no longer shows THROUGH the bar (user: the bar shouldn't have the flowy lines behind it).
  • SELECT text position: the `.term-pre` collapse (which moves the `mysql> SELECT * FROM projects;`
    line + cards UP as the install lines fade) is kept — but with the bar gone the content was sliding
    UNDER the fixed 80px header and overlapping the Projects/Skills/… nav buttons. Fix: on
    `.is-revealing`, `.terminal__body` gains `padding-top:var(--header-height)` (transitioned), so the
    moved-up SELECT/cards stop just below the header instead of behind the nav. (Briefly tried a
    fade-only pre that left SELECT mid-screen — reverted; user wanted it to move up like before, just
    clear of the header.)
- Verified via headless screenshots: rest = solid bar visible; is-revealing = bar gone, SELECT risen
  to just below an 80px header (nav buttons clear, no overlap), cards below.

### 2026-06-21 (remove the hanging top-right bulb)
- Branch `remove-bulb`. User: remove the bulb from the top-right completely.
- index.html: deleted the `.flow-bulb` element (cord/cap/glass). styles.css: deleted the entire
  `.flow-bulb*` block, the `@keyframes bulbGlow`, and its reduced-motion + mobile rules. Verified
  via headless screenshot — the top-right now shows only the HIRE ME / GET IN TOUCH buttons, no bulb.
- Left intact: flow.js `bulbLight` (an invisible Three.js PointLight that warms the flow image
  planes). It renders no visible bulb, so the top-right is fully clear; removing it would only darken
  the flow scene. Can be stripped later if a truly complete removal is wanted.

### 2026-06-22 (handwritten "Check out my Certificates" CTA over the hero video)
- New scroll-driven handwriting CTA on the hero, branch `hero-cert-signature`. A `.cert-layer`
  (fixed, full-screen) holds an `<a href="#certificates">` (real link text for SR; SVG aria-hidden)
  with the user-supplied cursive artwork (`images/handwriting_traced.svg`). The letters are FILLED
  paths; the reveal is a `<mask>` built from the user's TRACED CENTRE-LINE pen path, split into 11
  ordered strokes (`path3`→`path13` in the trace = true writing order), each `.cert-cta__seg`.
- Genuine pen-tracking: main.js measures each stroke, reveals them in sequence by cumulative length
  (stroke dash-offset), so a tip inks each stroke in writing order — not a left-to-right wipe. Mask
  stroke-width 9 (thin enough to hug the path without bleeding onto nearby later strokes, still full
  coverage at completion). Hidden until its ink reaches it (kills round-cap dots on un-started strokes).
- Trigger: scroll-scrubbed against the hero zoom-out, mirroring updateHeroExit's phase B/C math.
  Hidden until the zoom-out midpoint (pB .5), writes over pB .5→1 (done as the zoom-out finishes),
  fully reversible (un-writes on scroll-up). The layer takes the SAME translateY()+scale() as the
  `.hero-video`, so once written it rides up with the paused, shrunken video. prefers-reduced-motion
  snaps to written. Does not touch the existing hero/header behaviour.
- Path explored then dropped (all scratch removed): a hand-authored monoline path and a Yellowtail
  font + thick-stroke mask — both looked like a font / whole-letter wipe, not a pen. The user's
  traced centre-line gives real per-stroke pen tracking. Asset coords kept in the trace's own
  338×155 viewBox so fill + centre-line align exactly.

### 2026-06-22 (cert CTA → new ballet-script artwork + bleed fix, branch cert-text-fill)
- Swapped the cert handwriting artwork to `images/Certificates_ballet_traced.svg` (viewBox
  397×192). path1 = the filled ballet-script "Certificates" (→ `.cert-cta__fill`); the `Trace`
  group's path2→path12 = 11 ordered centre-line pen strokes (→ `.cert-cta__seg`). Rebuilt the
  inline SVG mask in index.html from the file (one-shot splice script, removed after).
- Fixed the reported reveal BLEED (thick mask line uncovering a neighbour's fill early — crossbar
  spilling past the t-stem, adjacent lines filling before the pen reached them). User chose "keep
  the filled calligraphy" over a monoline pen. Two changes, no JS edit (main.js's seg-sequencing is
  width-agnostic):
  • `stroke-linecap:round` → `butt` on every `.cert-cta__seg` — removes the half-width (~4.5u)
    round-cap blob that overshot each stroke's endpoints (the "crossbar bleeds beyond the stem").
  • per-stroke reveal width via `--ink-w` (styles.css): main strokes 9, the four thin
    connector/cross bars + short ticks (path9–path12, marked `data-thin`) 4.5 — a narrow band so
    those long bars can't reveal the stems they cross over. Approximates a "nearest centre-line owns
    the ink" partition; tune via `--ink-w`.
- Verified by rendering the real markup in headless Chrome at p=1/0.45/0.7: full reveal is fully
  covered (no gaps), and mid-reveal writes "Cert"→"Certifi" cleanly in pen order with no downstream
  bleed and no crossbar overshoot. (`.cert-cta` still rotate(-13deg); kept from the old artwork.)

### 2026-06-22 (cert mask → per-stroke thickness artwork, finer anti-bleed)
- Swapped the reveal mask to the new `images/Certificates_ballet_thick_thin.svg` (viewBox 397×192).
  The filled "Certificates" calligraphy (path1 → `.cert-cta__fill`) is IDENTICAL to the old artwork,
  so the fill markup is unchanged; only the centre-line TRACE changed. The new `trace` layer has 46
  ordered pen strokes (was 11), each Inkscape-LABELLED with its local thickness (Thin1/Thick2/
  thin_to_thick6/medium43/…) so a stroke's reveal band can hug just its own region and not spill
  onto a neighbouring letter's fill at intersections (the t/f crossbars, e loops the user called out).
- index.html: regenerated the `<mask id="certInk">` segments from the file (one-shot Python splice,
  document order = writing order). Each `.cert-cta__seg` now carries `data-w="thin|medium|thick"`,
  classified from its label (transitions like thin_to_thick → medium; "think14" typo → thick; circle
  dots → thin). 46 segs: 13 thin / 12 medium / 21 thick. main.js cert sequencing is unchanged — it's
  width- and count-agnostic (cumulative getTotalLength over all `.cert-cta__seg`), so it just works.
- styles.css: replaced the single `[data-thin]` rule with a 3-tier width map —
  `[data-w=thin]{--ink-w:4.5}` / `medium{8}` / `thick{12}`, default 8. Plus a hairline override for the
  opening flourish `[data-i="0"]{--ink-w:3}` (Thin1 = the big looping pen-in on the C; user wanted its
  start even thinner). butt caps kept.
- Verified the full reveal (p=1) in headless Chrome over file://: clean "Certificates", every glyph
  fully covered, no inter-letter bleed and no crossbar overshoot.

### 2026-06-22 (cert CTA: clickable + hover only after the word "pops"; hover = colour + blue text)
- Branch `cert-cta-hover-activate`. The hero video already DESATURATES to grey across the zoom-out
  (updateHeroExit: grey=eB → grayscale(grey)). New: the CTA (the handwriting AND the video) only
  becomes clickable + hoverable once the word "pops" (pB≥.97, the same threshold as is-written), and
  hovering brings the grey video back to full colour + turns the handwriting blue.
- main.js cert IIFE: added active/hovering state. setActive(pB≥.97) (called in update() where pB is
  computed) toggles `.cert-layer.is-active` and flips the video's pointer-events/cursor on. Hover wiring
  on BOTH the `.cert-cta` link and the `.hero-video` (pointerenter/leave → setHover): when active,
  hovering either adds `.cert-layer.is-hover` + `.hero-video.is-color`. The video also gets a click
  handler that forwards to link.click() so the image is clickable (link still carries the real SR text).
- styles.css: `.cert-cta` pointer-events auto→none, re-enabled via `.cert-layer.is-active .cert-cta`.
  `.hero-video.is-color{filter:none!important}` (beats the inline scroll-driven grey filter so colour
  wins while hovered). `.cert-layer.is-hover .cert-cta__fill{fill:#4d8bff}` (+ fill added to the fill's
  transition) turns the text blue on hover. node --check main.js OK.
- href still `#certificates` (where it leads is TODO, per the user).

### 2026-06-22 (cert CTA click → pull-IN transition video, position-aware zoom to full screen)
- Clicking the active CTA (link or video) now plays a pull-IN transition instead of navigating:
  `videos/pullout_animation.mp4` (1.5s) zooms FROM the hero video's current on-screen rectangle
  (position-aware) TO full screen — the reverse of the scroll zoom-out — and plays exactly once
  over its own duration. (Closing animation is a later step.)
- index.html: body-level `<video class="pullout-video" src="videos/pullout_animation.mp4" muted
  playsinline preload="auto">` (body-level so it covers the header; the hero's transform makes it a
  stacking context, so an in-hero overlay couldn't).
- styles.css: `.pullout-video` fixed inset:0, z-index:50 (above header 11), object-fit:cover,
  transform-origin:50% 50%, hidden until `.is-playing`.
- main.js cert IIFE: link/video click handlers (when active) preventDefault + playPullout().
  playPullout() captures the hero video's live transform via DOMMatrix decomposition (heroXf →
  {scale, translateY}), shows the clip at that exact rectangle, plays it once, and a rAF synced to
  the clip's currentTime/duration lerps transform start→identity with smoothstep (mirrors the
  zoom-out easing). On `ended` it settles to translateY(0) scale(1). lockScroll() stops Lenis +
  html overflow:hidden during the transition (stays locked as a modal until the future closing).
  node --check OK.
- Also removed the two `*.mp4:Zone.Identifier` WSL metadata files from videos/.

### 2026-06-22 (certificate gallery — sticky cover-scroll stack after the pull-in)
- After the pull-in zoom finishes, a certificate gallery opens: each certificate is a sticky
  full-screen slide and scrolling brings the next up to COVER the previous — the same cover-scroll
  the features section does over the blog (position:sticky;top:0;height:100vh + DOM-order paint).
  (Scaffold only — the user supplies the images.)
- index.html: body-level `.cert-gallery` > `.cert-gallery__scroll[data-lenis-prevent]` (its OWN
  overflow:auto scroll container, so it scrolls while the page behind stays scroll-locked; the
  lenis-prevent attr keeps Lenis off it).
- styles.css: `.cert-gallery` fixed inset:0 z-index:60 (above the pullout's 50), hidden until
  `.is-open` (opacity/visibility, .5s fade). `.cert-slide` sticky top:0 height:100vh, opaque
  var(--color-dark) bg so later slides cover earlier ones; `.cert-slide__img` contained,
  max 1100px/90vw × 88vh, rounded + shadow. Mobile tightens padding/size.
- main.js cert IIFE: `CERT_IMAGES` array (placeholder certificate-1..4.jpg — edit to list real
  files) → buildGallery() injects one `.cert-slide` per entry (built once). finishPullout() (fired
  when the zoom reaches t=1, with the clip's `ended` as a fallback, guarded by pullDone) settles the
  pullout full-screen and calls openCertGallery() (adds .is-open, resets scrollTop). Scroll stays
  locked (modal) — closing is the next step.
- images/certificates/ created with a README documenting the expected filenames + how to add more.

### 2026-06-22 (certificate gallery shows the real PDFs)
- The certificates are PDFs (the user uploaded 7 to images/certificates/). Replaced the placeholder
  image slides with embedded PDFs. `CERT_IMAGES` → `CERT_DOCS` ({src,title}), listing the 7 real
  files in display order. buildGallery() now emits, per slide, an `<iframe class="cert-slide__doc"
  src="<encodeURI(pdf)>#toolbar=0&navpanes=0&scrollbar=0&view=FitH">` (filenames have spaces → URL-
  encoded; viewer chrome hidden, page fit-to-width) + an "Open ↗" link (`.cert-slide__open`, new tab).
- styles.css: `.cert-slide__img` rule replaced by `.cert-slide__fig` sized (min(1100px,90vw)×88vh) +
  `.cert-slide__doc` (fills it, rounded, shadow, `pointer-events:none` so the embedded viewer doesn't
  swallow the gallery's cover-scroll) + `.cert-slide__open` (caption link, blue on hover). Mobile sizes.
- Removed the WSL `*.pdf:Zone.Identifier` metadata files; README updated for the PDF flow. node --check OK.

### 2026-06-22 (certificate gallery → PNG renders instead of PDF embeds)
- The PDF `<iframe>` embeds didn't display full-size cleanly, so switched to showing PNGs rendered
  from each PDF's first page (kept the PDFs + an "Open ↗" link per slide to the original).
- Rendered page 1 of each PDF via Ghostscript (`gs -sDEVICE=png16m -r200 -dFirstPage=1 -dLastPage=1`,
  with TextAlphaBits/GraphicsAlphaBits 4 for smoothing) — ImageMagick's PDF policy is blocked here.
  The three NPTEL renders came out 7090×5079 (~2MB); downscaled those to ≤2400px via `convert
  -resize 2400x2400>` (PNG resize is policy-allowed). 7 PNGs in images/certificates/.
- main.js `CERT_DOCS` entries are now `{img,pdf,title}`; buildGallery() emits `<img class="cert-
  slide__img" src="<png>">` + the "Open ↗" link to the pdf (both encodeURI'd for the spaced names).
- styles.css: `.cert-slide__doc` (iframe) rule replaced by `.cert-slide__img` (contained, max
  min(1100px,92vw)×86vh, white card bg, rounded, shadow) + `.cert-slide__fig` sized to content so
  the `.cert-slide__open` caption sits centred just below. Mobile sizes. node --check OK.

### 2026-06-22 (cert gallery: full-screen fit + closing transition back to the hero)
- Certificates now FIT THE SCREEN (no navy card): `.cert-slide` padding removed, `.cert-slide__fig`
  100vw×100vh, `.cert-slide__img` object-fit:contain on a WHITE surround (gallery + slide bg → #fff,
  was var(--color-dark)). The "Open ↗" link became a small bottom-centre pill (dark text on a faint
  backdrop) so it stays legible over white.
- Removed the internship entry from CERT_DOCS (user deleted those files) → 6 certificates.
- CLOSING transition (the deferred step): zooms the gallery back OUT to the hero rectangle it came
  from while `videos/recieve_animation.mp4` plays. New body-level `.receive-video` (z-index 70, above
  the gallery's 60). main.js: playPullout now stores the captured hero transform in `pullStart`;
  closeCertGallery() plays the receive clip full-screen, hides the gallery under it, and a wall-clock
  rAF lerps the receive transform identity→pullStart (smoothstep, reverse of the pull-in, ~1.07s at
  1.5× rate); finishClose() (fired at t=1, `ended` as fallback, guarded by `closing`) clears the
  overlays, resets pullDone/pullActive, and unlocks scroll — landing back exactly where it came from
  (scrollY was never moved while modal). Re-openable (click) afterward.
- Triggers: (a) END OF SCROLL — wheel down / further upward touch-swipe while at the bottom of
  `.cert-gallery__scroll`; (b) ESC key; (c) a new `.cert-gallery__back` "Back to home ↩" button pinned
  top-right (styles.css: pill, blurred faint bg, highlight on hover; mobile inset). node --check OK.
- Follow-ups: pull-in RATE 1.5→1.2 (slower); closing CLOSE_RATE → 2.0.
- Last-certificate RESISTANCE (final): non-passive wheel/touchmove listeners `preventDefault` the
  over-scroll at the bottom to actively STOP the fling/momentum; `momAbsorbed` flips true only once
  the scroll has been idle for IDLE=120ms (momentum reached 0), recording `armedAt`. After that, the
  next fresh scroll-down (`closeAfterAbsorb`: momAbsorbed && now-armedAt>1ms) collapses. So a fling
  can't carry you out, and it never auto-closes (close is event-driven). Resets on leaving the bottom.
  node --check OK.

### 2026-06-22 (cert write/video: "thin24" threshold → timed completion + pop at the end)
- Branch `cert-write-image-sync`. Reworked how the handwriting WRITE and the hero VIDEO (image) are
  coupled. Before: both were scroll-scrubbed over the zoom-out (writing pB .5→1, video zoom/grey),
  the word "popped" at pB .97, and the last four strokes drew on a SEPARATE post-pop timer (animTail)
  that could run after you'd scrolled past 100%.
- Now there is a single THRESHOLD at the stroke "thin24" (= data-i 23; its centre-line path matches
  the SVG label `thin24`). The scroll-driven pen lays down only the strokes BEFORE thin24 (data-i
  0..22); the moment the pen reaches thin24 a threshold fires and the REST of the writing (strokes
  23..45, INCLUDING the four tail strokes) plays as ONE TIMED completion (cT 0→1 over DUR=1100ms),
  no longer scrubbed by scroll. The word POPS (fills solid + becomes clickable/hoverable) only at the
  END of that timer — i.e. once the last four strokes finish (no more separate tail timer; animTail/
  TAIL_STAGGER/TAIL_DUR removed). Fully reversible: scrolling back above the threshold ramps cT→0.
- The VIDEO is driven off the SAME threshold. updateHeroExit's phase-B now computes `prog`: scroll
  =pB until the threshold (window.__certWrite.pBThr ≈ 0.807, measured = 0.5+0.5·thrLen/total where
  thrLen/total≈0.613), then `prog = pBThr + (1-pBThr)·smoothstep(cT)` — so the video's zoom-out, grey,
  blue tint and 92%→97% deceleration/PAUSE all finish on the cert timer, landing with the last
  strokes at the pop. The cert IIFE owns the rAF clock and calls window.__updateHeroExit each frame so
  the video advances even with no scroll; the layer's translateY lift (phase C) stays scroll-driven.
- main.js: cert IIFE rewritten — measure() also sums thrLen (length of data-i<23); new
  scrollInk()/render(inkedScroll)/tick()/kickRAF()/update(); window.__certWrite={crossed,t,pBThr}
  shared with the video; window.__updateHeroExit exposed from the hero IIFE. node --check OK; verified
  no JS errors on a real http load; threshold length measured in headless Chrome. DUR (1100ms) tunable.

### 2026-06-22 (cert: backward = scroll-driven; forward stays the timed threshold completion)
- Forward is unchanged (scroll-driven to the thin24 threshold, then a TIMED completion to the pop).
  But scrolling BACK after the pop is now SCROLL-DRIVEN, not the old behaviour (frozen-popped from pB 1
  down to the threshold, then a timed reverse). main.js cert IIFE: update() is now direction-aware
  (up/down vs prevPB). On scroll-up while crossed, reversing=true and cT = min(cT, reverseCT()), where
  reverseCT() maps the band [threshold, pBMax] back to [0,1] (pBMax = furthest pB reached while
  crossed) — so the writing + video un-wind in step with the scroll and leave the popped state without
  a jump. On scroll-down it re-arms the forward timer (kickRAF). tick() now only ramps FORWARD (never
  reverses). The video (updateHeroExit, prog from cT) follows automatically; update() also calls
  window.__updateHeroExit() so the video tracks the fresh cT within the same scroll frame. node --check OK.

### 2026-06-22 (cert: clickable from the threshold, both directions — decoupled from the pop)
- Clickability/hover (setActive) was tied to the visual pop (written = cT≥.999). Now it tracks
  `crossed` (the thin24 threshold) instead: forward, the CTA becomes clickable + hoverable the moment
  the threshold is hit (not only at the pop); backward, it stays clickable through the reverse and only
  deactivates when you scroll back above the threshold. The visual pop/fill (is-written, width-26 snap)
  remains tied to cT. main.js: render() now calls setActive(crossed). node --check OK.

### 2026-06-22 (cert hover colour: gradual, gated by completion — no instant flip)
- Hover no longer flips the text fully blue / the video fully colour instantly. Both are now driven
  by colorStr = hoverAmt·cT (hoverAmt eases 0→1 over HOVER_DUR=360ms on its own rAF; cT = writing
  completion). So from the thin24 threshold (cT≈0) hovering barely tints, the handwriting reaches FULL
  blue only at the pop, and the video reaches TRUE colour only at cT≥1 ("100% or more").
- main.js cert IIFE: setHover() now just sets the target + kicks colorTick() (the ease loop);
  applyColor() sets window.__certColor and lerps the fill #fff→#4d8bff by colorStr (also called from
  render() so the blue tracks cT as it changes). updateHeroExit folds the de-grey in: dg = 1−colorStr
  scales grayscale/brightness/sepia/hue-rotate/saturate, so at colorStr=1 the filter is none (true
  colour). Removed the old binary `.hero-video.is-color{filter:none!important}` + `.cert-layer.is-hover
  .cert-cta__fill{fill:#4d8bff}` CSS (and the now-unused class toggles); dropped the CSS `fill` transition
  (the inline per-frame value is already eased). node --check OK.

### 2026-06-22 (cert: video hover = quick snap at 100%+, only; text stays gradual)
- Split the hover colour: the TEXT still eases blue gradually (hoverAmt·cT). The VIDEO no longer fades
  in/out — it QUICK-SNAPS to true colour on hover and ONLY at the pop (cT≥1 / "100% or more"); below
  that, hovering doesn't touch the video. main.js: window.__certColor is now binary (hovering && cT≥.999
  ? 1 : 0); updateHeroExit's dg = 1−__certColor (no transition on the filter → instant snap). setHover()
  applies it + calls updateHeroExit immediately (snap); colorTick() now only eases the text blue (its
  updateHeroExit call removed). node --check OK.

### 2026-06-22 (cert text blue: gradual while animating, snap once popped)
- The text hover blue now eases (gradual) only WHILE the writing is still animating (cT<1); once
  popped (cT≥1) it SNAPS with hover instead. main.js applyColor(): amt = animating ? hoverAmt :
  (hovering?1:0), then fill = mixFill(amt·min(cT,1)). (Video unchanged — always a snap, 100%+ only.)
  node --check OK.

### 2026-06-22 (cert gallery: diagnosed the spam-no-collapse bug, then replaced absorption with a looping collapse end-slide)
- DIAGNOSIS (the reported bug — at the last cert, spamming scroll-downs never collapsed; waiting 2–3s
  then scrolling worked but felt random): the old resistance armed via `absorb()` which did
  `clearTimeout(idleT)` + a fresh 120ms timer on EVERY wheel/touch event, so `momAbsorbed` only
  latched after a full 120ms with NO events. Continuous input — a momentum fling tail, rapid mouse-
  wheel spam, or even one smooth-scroll notch's event burst — kept resetting the timer, so it never
  armed (spam → absorbs forever). Waiting let the stream go silent → armed; "random" = the variable
  momentum tail + the `scroll` handler's `reset()` firing on any sub-pixel `!atBottom()` wobble
  (no `overscroll-behavior`). [Interim fix built then superseded below: a set-once `armedAt` + GRACE
  window. Per the user it was removed in favour of the end-slide model.]
- NEW BEHAVIOUR (user decision: "Scroll-down, no resistance"): added a 7th, special gallery slide —
  `.cert-slide--end` containing `.cert-slide__loop`, a muted/loop/autoplay `<video>` of the collapse
  clip (videos/recieve_animation.mp4). It cover-scrolls up like any certificate and loops "over and
  over". Reaching the bottom (it fully covered) and scrolling DOWN (or swiping up past the end)
  collapses the gallery IMMEDIATELY — no absorption/grace at all (wheel/touch listeners are now
  passive, just `if (deltaY>0 && atBottom()) closeCertGallery()`).
- "Close from where the video is playing, different every time": closeCertGallery() seeds the
  body-level `.receive-video` from `loopVid.currentTime` (instead of `currentTime=0`), so the closing
  zoom-out CONTINUES the collapse clip from whatever frame the loop is on (you land on the end slide
  at a different loop position each visit → different start frame every time). `receive.loop=true`
  during the close so it never ENDS mid-zoom; `playbackRate=1` (matches the loop → no speed jump);
  the zoom DUR is decoupled to a fixed 700ms; the old `ended`→finishClose listener is removed;
  finishClose() resets `receive.loop=false`. openCertGallery() calls `loopVid.play()` (free-running,
  no currentTime reset). loopVid captured in buildGallery().
- styles.css: `.cert-slide--end{padding:0;background:#000}` + `.cert-slide__loop{position:absolute;
  inset:0;width/height:100%;object-fit:cover;background:#000}` — full-screen `cover` matching the
  `.receive-video` framing so the slide→close hand-off lines up. Also kept `overscroll-behavior:
  contain` on `.cert-gallery__scroll` (belt-and-suspenders against scroll chaining).
- Verified: node --check OK; no orphaned refs to the removed absorb/grace code; end-slide markup
  balanced; headless load over HTTP has no JS errors. The video autoplay/loop + the seamless
  frame-continuation hand-off + the zoom-out are visual and need a real-GPU browser to confirm
  (headless can't composite <video>/WebGL, per the standing caveat) — worth an eyeball on whether the
  receive clip's seek shows any flash at the hand-off and whether 1× during the 700ms zoom reads right.

### 2026-06-22 (cert close: collapse plays from start, freezes on last frame; scroll-back plays hero from start)
- User: don't remember the frame the gallery was closed at — remember only the rectangle position;
  freeze the collapse on its LAST frame as the new pause image; scrolling backward plays the hero
  video from the start.
- main.js cert IIFE:
  • closeCertGallery() no longer seeds `receive.currentTime` from `loopVid.currentTime` — it starts the
    receive (collapse) clip from 0 and sets `receive.loop=false` (so it ENDS and holds its last frame).
    pullStart (the hero rectangle) is still captured/used as the zoom-out target — only the rectangle
    position is remembered.
  • finishClose() no longer hides the receive clip / hands back to the live hero video. It pauses the
    clip IN PLACE — on whatever frame the 700ms zoom-out ENDED on (NOT the video's final frame, so it's
    dynamic/different each time per real play+decode timing) — and parks it at the hero rectangle
    (pullStart transform) with `.is-playing` kept → that frozen frame is the new pause image. It does
    NOT touch the hero video here.
  • New armHeroHandoff()/heroHandoff()/disarmHeroHandoff(): after a close, scroll/wheel/touch listeners
    are armed but only fire on a BACKWARD (upward) scroll — wheel deltaY<0, touch finger-down, or scrollY
    dropping below the armed baseline (forward/sideways events just keep the frozen frame). On a backward
    scroll it removes the frozen collapse frame, resets the hero video to currentTime 0, and calls
    window.__updateHeroExit() — so the real hero video is revealed and plays forward from the start as the
    zoom reverses. playPullout() calls disarmHeroHandoff() on re-open so the frozen frame can't linger.
- buildGallery() comment updated (no more loopVid.currentTime seeding). node --check OK. Visual hand-off
  (frozen collapse last frame ↔ hero frame 0) needs a real-GPU browser to confirm, per the standing caveat.

### 2026-06-22 (cert close: freeze the zoom-out's end frame, dismiss on ANY scroll, CTA text fades in mid-collapse)
- Three follow-ups on the collapse close:
  • The pause is no longer the VIDEO's last frame. finishClose() just pauses the receive clip IN PLACE
    on whatever frame the 700ms zoom-out ended on (dynamic, different each time) — removed the
    seek-to-(duration−0.04). No cut.
  • The frozen frame is now dismissed on ANY scroll (forward OR backward), not just backward. Removed the
    direction gate in heroHandoff (and the wheel/touch/scroll baseline tracking + touchstart listener);
    any scroll/wheel/touchmove drops the frozen frame, resets the hero video to currentTime 0, and reveals
    it via window.__updateHeroExit(). (Fixes the frozen frame lingering ~2s on a downward scroll.)
  • Around the MIDPOINT of the collapse the handwritten "Certificates" CTA (.cert-layer) fades in ON TOP
    of the receive clip: the close frame loop adds `.cert-layer.is-collapsing` (styles.css: z-index 80,
    above the receive clip's 70) and drives layer opacity 0→1 over the second half of the zoom (t≥0.5).
    It stays on the frozen pause frame; disarmHeroHandoff() removes `.is-collapsing` on the next scroll so
    the cert IIFE's render() resumes normal z-index/opacity. node --check OK.

### 2026-06-22 (branch cert-collapse-frame-behavior: frozen-frame lift/hover/gradient + CTA position fix)
- Branch `cert-collapse-frame-behavior`. Reworked the post-collapse FROZEN pause-frame so it behaves
  like a real paused hero, per the user:
  • FORWARD scroll no longer dismisses the frozen frame. It rides UP with the cert text (liftFrozen()
    lifts the receive clip by the same scroll delta the CTA gets from render()'s phase-C lift — both
    move 1:1, staying coincident). Only a BACKWARD scroll swaps back to the REAL hero video (reset to
    currentTime 0, revealed via __updateHeroExit) — heroHandoff() now compares scrollY to lastHandoffY
    for direction instead of dismissing on any scroll.
  • HOVER on the frozen frame (the receive clip, pointer-events flipped to auto, OR the CTA link)
    re-colours it (snap to true colour); leaving returns it to grey+blue. setFrozenHover() + a window
    pointermove tracker (lastPX/lastPY) + pointerOverFrame() so finishClose can detect a stationary
    hover at the END of the collapse (pointerenter won't fire then) and snap to colour if hovered.
  • COLLAPSE animation now carries the SAME grey + blue "blush" filter as the hero zoom-out: new
    vidFilter(grey,blue,colorOn) replicates updateHeroExit's grayscale/brightness/sepia/hue-rotate/
    saturate formula; the close frame loop ramps grey/blue with the zoom progress e (colour → grey+blue
    as it recedes), and the frozen frame holds grey+blue (or colour if hovered).
  • CTA TEXT POSITION FIX: an earlier attempt forced the CTA to translateY(0) on the frozen frame,
    which put it "out of place." Removed that override — scroll is locked at the click position, so
    render() already left the CTA transform at the remembered click spot. The CTA now appears exactly
    where it was when the gallery was opened, and (since render() drives it on scroll) lifts in lockstep
    with the frame on forward scroll.
- finishClose() now sets frozen=true/freezeY and keeps the receive clip visible+hoverable instead of
  hiding it; dismissFrozen() (replaces disarmHeroHandoff, called from playPullout on re-open) tears it
  all down. Confirmed .cert-layer is a sibling of .hero (no transformed ancestor), so .is-collapsing's
  z-index 80 correctly sits above the receive clip's 70. node --check OK. Visual behaviour (video
  compositing/hover/lift) needs a real-GPU browser to confirm, per the standing headless caveat.
- Follow-up — the switch to the hero video is now gated on the 97% PAUSE THRESHOLD, not the first
  backward scroll. New heroProg() mirrors updateHeroExit's phase-B `prog` (= pBThreshold + (1−pBThr)·
  smoothstep(cT) while crossed, else pBNow()). heroHandoff() keeps the frozen frame while heroProg() ≥
  HERO_RESUME (0.97) — the whole paused zone — and only calls dismissFrozen()+reveal-hero (currentTime
  0) once a backward scroll drops it below 0.97 (where the office video resumes playing). Forward scroll
  keeps prog at 1 (cT ramps/stays 1), so it never switches — it just lifts the frozen frame. Removed the
  old lastHandoffY direction check. node --check OK.
- Fix — the CTA text was stuck BLUE after a collapse: if the cursor was over the CTA during the closing
  zoom, onEnter set hovering=true, and once frozen the frozen-mode hover handlers never reset it, so
  applyColor() kept painting it blue. Now applyColor() uses frozenHover (not hovering) while frozen →
  text is WHITE when not hovering the frozen frame and blue only on hover; setFrozenHover() calls
  applyColor() so the text tracks the frozen hover; onEnter/onLeave ignore hover while `closing` (so
  hovering can't get stuck into the frozen state); dismissFrozen() clears hovering before the hero takes
  over. node --check OK.
- Size — shrink BOTH the collapsed frame and the CTA text by the SAME factor, consistently across the
  collapse animation and the frozen state (no jump). New COLLAPSE_SCALE (0.7) + helpers: frameScale()
  (= pullStart.s × COLLAPSE_SCALE) used by the collapse loop's end target, finishClose freeze, and
  liftFrozen; layerTransform() (= remembered translateY + scale(COLLAPSE_SCALE) when frozen/.is-collapsing,
  else scale 1) now drives the CTA transform in render(), the collapse loop, and finishClose — so the text
  scales by the same proportion as the frame in every collapse rectangle, before and after, and reverts to
  full size once dismissed back to the hero. node --check OK. (Tune via COLLAPSE_SCALE.)
- Follow-up — make ALL rectangles consistent before AND after the threshold (user: "reduce all rectangles
  after collapse and before"). The first pass only shrank the frozen frame (×0.7), so it mismatched the
  hero video at the 97% hand-off. Now the hero zoom-out itself is reduced by the same factor:
  EXIT_MIN_SCALE 0.33 → 0.231 (= 0.33×0.7). Since pullStart.s is captured from the already-shrunk hero,
  frameScale() now returns pullStart.s directly (no extra ×COLLAPSE_SCALE — that would double-shrink and
  re-introduce the jump). COLLAPSE_SCALE (0.7) now only scales the CTA text (layerTransform), matching the
  hero's reduction. Net: hero rectangle, collapse frame, frozen frame, and text are all ×0.7 of their old
  sizes, so the 97% switch is seamless. node --check OK.
- Tweak — frame felt too small; bumped the shared factor 0.7 → 0.85: EXIT_MIN_SCALE 0.231 → 0.28
  (0.33×0.85) and COLLAPSE_SCALE 0.7 → 0.85. Hero/frame/text stay matched, just larger. node --check OK.
- DECOUPLED text and image (they are NOT the same proportion):
  • IMAGE — size is purely EXIT_MIN_SCALE (0.28 → 0.35, bigger; was too small). The frozen frame uses the
    same hero rectangle (frameScale() = pullStart.s), so the image is EQUAL before and after collapse.
  • TEXT — renamed COLLAPSE_SCALE → TEXT_SCALE (0.85) and layerTransform() now applies it ALWAYS (dropped
    the frozen/.is-collapsing gate), so the CTA text is the SAME size before AND after collapse (previously
    full-size before / 0.85 after — the "before" read too big). Independent of the image now.
  • Updated the stale COLLAPSE_SCALE comments. node --check OK. (Image size = EXIT_MIN_SCALE; text size =
    TEXT_SCALE — tune the two independently.)

### 2026-06-23 (projects section: added all 10 remaining master_profile projects + per-card "View code" notch button)
- Branch `projects-add-yaml-projects`. The terminal `SELECT * FROM projects` result (main.js PROJECTS
  array → projectsHtml()) showed only 4 cards. Added the other 10 projects from master_profile.yaml's
  `projects:` block — Trader Sentiment Analysis, Nexora Semantic Vibe Matcher, Support Ticket Classifier,
  Semantic Quote Retrieval, Age & Gender Classifier, Neural Network From Scratch, Multi-Task Face Network,
  Linear Regression From Scratch, Binance Futures Trading Bot, Professional Directory App — for 14 total.
  Each card's name/description (first outcome bullet)/tech tags come from the yaml; images cycle the 4
  existing images/flow/*.jpg placeholders (no per-project art yet).
- New cards have no dedicated subpage (only the original 4 do). Per user: each card gets a "View code ↗"
  button parked in the frame's notched bottom-right shelf, linking to the project's GitHub repo (yaml
  `link:`). Existing 4 keep their subpage; fraud + nse also got a `code:` GitHub link, market-data +
  product-explorer have none (work entry / empty yaml link).
- Restructured projectsHtml(): the card is now a `<div>` (was a full-card `<a>` — can't nest the code
  anchor inside an anchor). `.proj-card__media` is the primary link (subpage if `h`, else the GitHub repo
  in a new tab); `.proj-card__code` is a separate absolutely-positioned anchor (z-index 11, above the
  frame). CTA text is "View project →" for subpage cards / "View code ↗" otherwise. Index number now
  zero-pads (01–09, then 10–14) instead of the old `'0'+(n+1)` which would print "010".
- styles.css: `.proj-card__label` relaid out to a left-aligned id+title column constrained to the LEFT
  ~60% (the notch only drops the bottom-left, so the title sits on the taller left and the raised right
  shelf stays clear for the button). Added `.proj-card__code` (pill: blue border, dark translucent bg,
  hover fills blue) positioned right:7%/bottom:12.5% to sit on that shelf. Reveal/frame hover selectors
  switched `:focus-visible` → `:focus-within` since focus now lands on the inner links, not the card div.
- node --check main.js OK; card markup logic verified via a node simulation (padded id, new-tab GitHub
  media link, button present). Visual placement in the notch needs an eyeball in a real browser.

### 2026-06-23 (project cards pop in with the zone-title APPEAR animation, anti-diagonal wave)
- The project cards (terminal `SELECT * FROM projects` result) now enter with the SAME animation the
  flow zone titles play on forward scroll — the hero APPEAR pose (`perspective(1000px) translate(50%)
  translate3d(-222.2px,88px,0) rotateY(60deg) rotateX(35deg)` → identity, from flow.js buildPoses). Dropped
  the flow-only `ex` mid-slide so each card resolves in place rather than sliding from mid-right.
- Stagger = anti-diagonal (row+col): the top-left card [0,0] pops first, then the [0,1]+[1,0] wave, then
  [0,2]+[1,1]+[2,0], … out to the far bottom-right corner last. Cards on the same diagonal fire together.
- styles.css: removed the old whole-block `.term-result` opacity/translateY fade; the entrance now lives on
  each `.term-projects .proj-card` (APPEAR pose → `.terminal.is-revealing` rest, transition .55/.7s,
  transition-delay var(--cd)). Meta line ("N rows in set") gated separately with var(--meta-d) so it
  appears after the last wave. prefers-reduced-motion guard added on both (static, no transition).
- main.js (terminal IIFE): layoutCardStagger() reads the LIVE column count from the rendered grid
  (getComputedStyle gridTemplateColumns — robust to the responsive 4→2 col media queries) and sets each
  card's --cd = (row+col)*CARD_STEP (0.07s), plus --meta-d = maxDiag*STEP+0.35s. Called once after building
  projEl and on resize. Same is-revealing threshold drives it (reverses on scroll back up). Verified the
  wave ordering for 4-col and 2-col via a node simulation; node --check OK.

### 2026-06-23 (card pop = EXACT zone-title appear values — fixed fly-in direction)
- The cards were flying in from the wrong direction (bottom-LEFT). Cause: I'd dropped the flow-only
  `ex` (= vw*0.22) translateX from the APPEAR pose, which is exactly the term that throws the title in
  from the RIGHT — without it translate(50%)+translate3d(-222.2) netted a leftward start.
- Copied the values verbatim from flow.js (poseStr + APPEAR): start transform is now
  `translateX(22vw) perspective(1000px) translate(50%) translate3d(-222.2px,88px,0) rotateY(60deg)
  rotateX(35deg)` → identity (22vw == ex). Duration ENTER_MS=420ms; easing easeOut cubic
  (1−(1−t)³ ≈ cubic-bezier(.215,.61,.355,1)); no fade-in — opacity transitions over 0s at var(--cd) so
  the card is hidden through its stagger delay then enters un-faded, matching the title's "entering =
  no fade-in". Anti-diagonal --cd stagger + meta-line gating unchanged (meta delay bumped to +0.5s for
  the 420ms entrance). node --check OK.

### 2026-06-23 (card pop: wait for the threshold collapse + slower diagonal stagger)
- Cards were starting at the threshold while the pre-text was still vanishing. Added BASE_DELAY =
  PRE_COLLAPSE(0.6s, the .term-pre collapse) + GAP(0.3s) = 0.9s, folded into every card's --cd, so the
  first card pops 0.3s AFTER the collapse animation finishes. CARD_STEP 0.07s → 0.18s (the diagonal wave
  was finishing too quick). meta-d now BASE_DELAY + maxDiag*STEP + 0.5. node --check OK.

### 2026-06-23 (card reveal latches; trimmed pinned dead-zone; step 0.2s)
- CARD_STEP 0.18s → 0.2s (per request).
- Cards no longer collapse on scroll-up: the terminal reveal is now LATCHED. update() fires
  is-revealing + renderText(total) ONCE when rect.top ≤ 0, then early-returns on every later frame —
  so scrolling back up keeps the cards, and the per-frame re-typing stops fighting the scroll.
- "Scrolling down doesn't scroll": the cause was .features being 360vh with a 100vh sticky pin, leaving
  ~260vh of pinned dead-zone after the reveal where scrolling moved nothing. Trimmed .features 360vh →
  200vh (~100vh approach/typing + ~100vh pin for the latched timed reveal), so scrolling down progresses
  to the next section instead of sitting stuck. node --check OK.

### 2026-06-23 (fix cards clipped at the Skills handoff — scroll-pan the card wrapper)
- Real cause of "cards stay where they are and cut off when scrolling to What I Build With": 14 cards
  overflow the pinned 100vh terminal (overflow:hidden), so the lower rows were never reachable — the pin
  released to Skills with them still clipped.
- Wrapped preEl+selEl+projEl in a `.term-scroll` div. Once the reveal latches, panCards() maps the
  remaining pinned scroll to a translateY pan of that wrapper (over 85% of the pin, with a brief end-hold),
  so every row scrolls into view and the last card + "N rows in set" land just before the pin hands off to
  Skills. overflowPx = scrollWrap.scrollHeight − visible body height (+24 breathing room); past =
  −features.top / (0.85·pinRange). Desktop only (guarded >820 + panRange>0).
- styles.css: `.term-scroll{will-change:transform}`; mobile (≤820) safety — `.terminal{height:auto}` +
  `.terminal__body{overflow:visible}` + `.term-scroll{transform:none}` so the 14 cards flow naturally
  instead of clipping (mobile isn't pinned). .features stays 200vh. node --check OK.

### 2026-06-26 (project cards: Lando "helmet-grid" rise-in replaces the 3D pop)
- Branch `cards-lando-scroll`. Reworked the project cards' reveal to match the Lando website's
  helmet-grid scroll effect (the grid items RISE up from below + fade in, rest = translate(0),
  staggered as the grid scrolls into view) — replacing the busy 3D APPEAR pose (translateX(22vw) +
  perspective/translate3d/rotateY60/rotateX35).
- styles.css `.term-projects .proj-card`: initial transform → translateY(64px) + opacity 0; revealed
  (.terminal.is-revealing) → translate(0)+opacity 1; transition now transform+opacity .9s
  cubic-bezier(.19,1,.22,1) with per-card delay var(--cd) (was a .42s transform + 0s opacity snap).
  So cards fade UP into place rather than rotating in. Hover image-reveal/frame + reduced-motion
  guard unchanged.
- main.js (terminal IIFE): CARD_STEP 0.2s → 0.09s (gentler/flowing cascade for the slower rise);
  --meta-d trailing gap 0.5 → 0.9s so the "N rows in set" line follows after the last rise finishes.
  Anti-diagonal stagger + the latched is-revealing threshold trigger unchanged. node --check OK.

### 2026-06-26 (projects: remove contour lines; top bar reversible at threshold)
- Branch `projects-bg-and-topbar`. Two fixes:
  • REMOVE BACKGROUND LINES in the projects section. The .features section's .section-contours
    canvas drew solid navy + blue iso-contour lines. main.js: the darkSecs entry for `.features` is
    now tagged `noLines:true`; the draw loop fills the solid navy (rgb 27,34,54) backing then
    `continue`s before strokeIso — so the terminal keeps its dark field with NO contour lines (Skills
    /Services keep theirs).
  • TOP BAR comes back on scroll-up at the SAME threshold it left. The bar's collapse was keyed off
    the LATCHED `.terminal.is-revealing` (added once at rect.top≤0, never removed) so it never
    returned. Split it onto a new reversible `.terminal.is-covered` class: styles.css rule moved
    is-revealing→is-covered; main.js update() now toggles `is-covered` every frame on `r.top<=0`
    (independent of the still-latched card reveal), so scrolling back up past the threshold restores
    the title bar. reduced-motion path adds is-covered too. node --check OK.

### 2026-06-26 (projects: black terminal bar + bar-coloured background)
- User: make the terminal top bar black and the projects background the colour the bar USED to be.
  styles.css `.terminal__bar` background #0f1628 → #000 (black). main.js darkSecs: the `.features`
  entry now carries `fill: rgb(15,22,40)` (= #0f1628, the bar's old navy) used by the draw loop
  (`sg.fillStyle = sec.fill`); Skills/Services keep rgb(27,34,54). So the projects field reads as the
  former-bar navy under a now-black bar. node --check OK.

### 2026-06-26 (projects: stick/pin at the threshold until the card reveal finishes)
- Branch `projects-stick-threshold`. User: at the projects threshold the section should STICK a bit,
  at least until the card animation finishes. Added a timed scroll LOCK to the terminal IIFE: when the
  reveal threshold fires (r.top≤0, atTop latches), engageStick() freezes the page (lenis.stop() +
  preventDefault on wheel/touchmove/scroll-keys + a scroll-clamp back to lockY) and a setTimeout
  releases it after STICK_MS — the full reveal duration (BASE_DELAY + maxDiag·CARD_STEP + RISE_DUR(0.9s)
  + 150ms buffer), computed in layoutCardStagger alongside --meta-d. So the cards rise + settle in place
  before any pan/scroll-through; then the lock releases and panCards resumes as before. Guarded off on
  mobile (≤820, no pin). node --check OK.

### 2026-06-26 (project cards: clip image to the notched frame + View-code button in the notch)
- Branch `cards-notch-clip`. User: the bottom-right notch outline was there but the image spilled
  past it, and the "View code" button should sit in that spilled space.
- styles.css `.proj-card__media`: added clip-path:polygon(0 0,100% 0,100% 90.5%,64.7% 90.5%,51.8%
  100%,0 100%) — the frame path's notch as % of the 407×411 viewBox (shelf top y=371.983→90.5%,
  ledge x=263.329→64.7%, bevel x=210.862→51.8%), so the image (+ hover-reveal) is clipped to the
  notched outline and no longer spills past the bottom-right. Applied to media (not the whole card)
  so the code button — a sibling in the cut space — isn't clipped.
- `.proj-card__code`: moved from the old right:7%/bottom:12.5% shelf into the notch
  (right:3.5%/bottom:1.5%) and shrunk (padding 4px 11px, font 10px, gap 4px) to fit the ~9.5%-tall
  notch band. Verified with a standalone headless Chrome render — image clips along the bevel, button
  sits in the notch.

### 2026-06-26 (projects side panel = "Filter by" facets + own scroll; card filter animation)
- Branch `side-panel-filter`. Built the left side panel into a "Filter by" faceted filter:
  • PROJECTS gained `tools` (full stack from master_profile.yaml, fuller than the visible `t` tags)
    and `dom` (domains) arrays; cards emit data-tools/data-dom (slugged, |-joined).
  • panelHtml(): "FILTER BY" head + two collapsible folders — Tools + Domain — whose items are
    derived from facetCounts(key) (unique values + per-facet project count, sorted by count). Each
    item = a checkbox chip; a "Clear all" button shows when any facet is active.
  • wireFilter(): faceted filter — a card shows if it matches the selected Tools (any) AND Domains
    (any); folder buttons toggle .is-open (chevron rotates, items collapse via max-height); meta line
    updates to the filtered count.
- styles.css: full .filter* styling (folders, chevron, custom checkbox, counts, clear pill). Panel
  appears with the SAME rise+fade as the cards (translateY(64px)+fade, .9s cubic-bezier(.19,1,.22,1),
  +.5s delay) keyed to the REVERSIBLE .terminal.is-covered threshold class, so it also VANISHES
  (reverse) on scroll-up. Reduced-motion static.
- Bug fixes: (a) grid gaps spread when Tools open — the tall panel stretched the grid taller than its
  content and CSS grid distributed the slack into row gaps; fixed with align-content:start;
  align-items:start on .term-projects. (b) filter now ANIMATES: setHidden() sinks+fades a card out
  (reverse of appear) then collapses it (display:none), and rises+fades it back in — instead of an
  instant display toggle.
- Side panel has its OWN scroll: align-self:flex-start + max-height:calc(100vh - header - 64px) +
  overflow-y:auto + overscroll-behavior:contain + data-lenis-prevent (Lenis won't hijack), slim themed
  scrollbar; mobile resets to natural flow. node --check OK.

### 2026-06-26 (terminal top bar stays visible — no vanish, no shift)
- Branch `topbar-keep-visible` (off main). User: keep the mac-style terminal title bar
  visible at the top of the screen — do NOT make it swipe away/vanish at the threshold, and
  do NOT shift it (the reposition-at-threshold behaviour from the abandoned projects-threshold-snap
  branch). styles.css only:
  • Removed `.terminal.is-covered .terminal__bar{transform:translateY(-100%);opacity:0;…}` — the
    swipe-up/collapse that hid the bar once the terminal covered the top.
  • Removed `.terminal.is-revealing .terminal__body{padding-top:var(--header-height)}` — the content
    shift that pushed SELECT/cards below the header when the bar used to vanish (no longer needed).
  • Simplified `.terminal__bar` (dropped the now-dead will-change/transition for transform/max-height/
    opacity) — the bar is static.
- `.terminal.is-covered` is still toggled in main.js and still drives the `.term-side` panel reveal —
  left untouched. No JS changes.

### 2026-06-26 (terminal: snap-to-threshold from the pre-threshold buffer)
- User: add a "threshold before the threshold" — if a scroll lands in a buffer just BEFORE the
  full-cover position, auto-complete the rest of the scroll up so it lands at that position.
- main.js (terminal IIFE): new maybeSnap(), debounced 140ms after the scroll settles (via onScroll).
  When the scroll stops with the section still APPROACHING DOWN (dir≥0) and its rect.top is within
  the buffer (vh·0.13) above the full-cover line, it eases to the scrollY that makes rect.top = 0
  (lenis.scrollTo duration .5, fallback window.scrollTo smooth). Guards: skips once atTop/locked,
  on mobile (≤820), and when leaving upward (dir<0). onScroll now also tracks scroll direction.
  node --check OK.

### 2026-06-26 (snap earlier + always; side panel latches)
- Snap-to-threshold buffer vh·0.13 → vh·0.2 (fires a little earlier).
- Snap now happens EVERY time, including after scrolling back up and returning: removed the `atTop`
  guard in maybeSnap() — its `r.top > 0 && r.top <= buffer` test already only matches when approaching
  from above (pinned/panning has r.top ≤ 0), so re-entering the buffer from above re-snaps.
- Filter side panel no longer disappears once shown: `.term-side` reveal moved from the reversible
  `.terminal.is-covered` to the LATCHED `.terminal.is-revealing` (same trigger as the cards). node --check OK.

### 2026-06-26 (SELECT line sticks under the top bar)
- User: `mysql> SELECT * FROM projects;` should stay with the top bar. It was inside the panned
  `.term-scroll` wrapper, so it scrolled away with the cards. main.js: moved preEl + selEl OUT of
  scrollWrap into body flow (scrollWrap now holds only projEl/the cards), so selEl holds just under
  the bar while only the cards pan up. panCards() `visible` now also subtracts selEl.offsetHeight +
  preEl.offsetHeight (the collapsed pre ≈ 0) so the pan range still lands the last card correctly.
  node --check OK.

### 2026-06-26 (cards fade-out at the top; side panel no longer pans with the cards)
- User: when scrolling down, the panning cards/side panel must not OVERLAP the pinned text — they
  should cut off with a FADEOUT; and scrolling the cards must NOT move the side panel.
- Restructured the SELECT result (main.js projectsHtml + body layout):
  • The side panel (.term-side) is now a sibling of a new .term-cards-view; only the cards pan, so
    the panel STAYS PUT (it no longer rides the pan transform). Scrolling the cards area doesn't move
    it (its own data-lenis-prevent scroll is unchanged).
  • Cards live in .term-cards-view (clipped, overflow:hidden) → .term-cards-pan (the layer that gets
    the translateY pan). The viewport carries a top FADE MASK (mask-image linear-gradient transparent
    0 → #000 52px), so cards dissolve out at the top instead of overlapping the SELECT line above.
  • Moved the "N rows in set" meta line inside .term-cards-pan so it pans in after the last card.
- CSS: .terminal__body is now a flex column; .term-result + .term-pgrid flex:1/min-height:0 so the
  cards viewport gets a bounded height to clip + pan within. panCards() now translates .term-cards-pan
  and sizes the pan from panEl.scrollHeight − viewEl.clientHeight (was the body-minus-SELECT calc).
  Mobile resets: body display:block, cards-view mask none + overflow visible, pan transform none.
- node --check OK; no stale scrollWrap/term-scroll refs. Visual (the fade + the panel holding while
  cards pan) needs an eyeball in a real browser per the standing headless caveat.

### 2026-06-26 (cards: remove the top fade-out, keep the hard clip)
- User: remove the fade out. Dropped the .term-cards-view top mask-image (and its mobile reset).
  Kept overflow:hidden so the panning cards still HARD-cut off at the viewport's top edge instead
  of overlapping the SELECT line / panel above — just no gradient fade now.

### 2026-06-26 (branch cards-vanish-reappear-on-click: filter click = vanish all → reappear new set)
- Reverted the abandoned `cards-disappear-reappear` scroll experiment (it broke the scroll animation).
  Scroll/threshold reveal is back to the original LATCHED behaviour, untouched.
- New branch `cards-vanish-reappear-on-click`. User: on a filter CLICK, COMPLETELY vanish ALL
  currently-shown cards and reappear the new (filtered) set with the same animation the cards play
  initially at the threshold. The old filter swapped cards per-card (out/in simultaneously).
- main.js wireFilter(): replaced setHidden()/apply() with a two-phase apply():
  • vanishAll(done) — every currently-visible card sinks +64px + fades out together (FADE 550ms),
    then after FADE fires `done`.
  • showFiltered() — drops the non-matching cards (is-filtered-out), resets the matching set to the
    appear "from" state (opacity 0, translateY 64, transition none) + reflow, then replays the
    threshold appear (rise + fade) with an anti-diagonal stagger (CLICK_STEP 0.06s) recomputed over
    the FILTERED grid's live column count. Meta line updated to the filtered count.
  • apply() = vanishAll(showFiltered); clear-pill visibility updated immediately. Fires on facet
    change + clear (folder open/close unchanged). Removed the per-card _fhidden/_ft machinery.
- node --check OK. Visual vanish→reappear needs a real browser to eyeball.

### 2026-06-26 (filter reappear: reset pan so the new set starts fresh at the top)
- User: after scrolling/panning the cards, clicking a new filter showed the reappearing set still at
  the scrolled (panned) position — e.g. a 1-card result was panned off and you had to scroll up to
  see it. The new set must appear FRESH from the top, ignoring the prior scroll/pan.
- main.js wireFilter() showFiltered(): before replaying the appear, reset panEl transform to
  translateY(0) AND realign the page scroll to the cover threshold (scrollY where rect.top = 0, via
  __lenis.scrollTo immediate / window.scrollTo fallback) — so panCards() recomputes to 0 and the
  filtered cards (even a single one) reappear at the top without needing to scroll up. node --check OK.

### 2026-06-26 (projects: dynamic pin length = card overflow, not a fixed 200vh)
- User: scrolling the projects part should scroll down further only if more projects are below; if all
  projects already fit, treat it as the bottom and scroll on normally (no fixed dead-zone). The pin was
  a fixed .features{height:200vh} → always ~100vh of pinned scroll even for a 1-card filter result.
- main.js (terminal IIFE): the section height is now set from JS to window.innerHeight + cardOverflow()
  (cardOverflow = panEl.scrollHeight − viewEl.clientHeight + 24, or 0 when the cards already fit), via a
  new sizeSection() called on init (layoutCardStagger), resize, and every filter change (showFiltered).
  So the PINNED scroll length == the card overflow: more cards → longer pin (scroll reveals them); all
  visible → overflow 0 → height 100vh → the section releases immediately and you scroll on out.
- panCards() reworked to map pinScroll (= sec.offsetHeight − innerHeight == cardOverflow) 1:1 to the
  pan (dropped the old 0.85 factor + separate overflow calc), so the last card lands exactly as the pin
  releases regardless of count. Inline sec.style.height overrides the CSS 200vh; mobile clears it
  (natural flow). node --check OK; needs a real-browser eyeball (incl. a heavily-filtered 1–2 card set).

### 2026-06-26 (fix the scroll-driven terminal printing regression)
- User: the features/projects slide-in TEXT PRINTING (the typed script as the section covers the
  blog) looked correct ~10–15 merges ago but went "weird". Bisected: renderText() + the typing
  mapping (typeStart vh*6/7 → typeT → reveal) are byte-IDENTICAL across that whole range — so it was
  CSS, not JS. The culprit was THIS session's `.terminal__body{display:flex;flex-direction:column}`
  (added for the cards-view clip/pan) combined with `.term-result{flex:1 1 auto}`: flex-basis auto =
  the cards' tall content (~2000px) as the basis pushed the body's flex column into SHRINK mode, and
  `.term-pre` (the typed lines, flex-shrink:1 + overflow:hidden) got shrunk → the install text was
  squashed/clipped while typing.
- Fix (styles.css, CSS only): `.term-result` flex-basis auto → 0 (`flex:1 1 0`) so the tall card
  content no longer forces shrink (it still grows to fill, keeping cards-view bounded for clip/pan);
  + `.term-pre{flex:0 0 auto}` so the typed-text block can never be shrunk/clipped (the is-revealing
  max-height:0 collapse still works). Printing is back to natural top-down terminal output.

### 2026-06-26 (cert auto-play: speed up the threshold completion + matching video)
- Branch `cert-autoplay-speedup`. User: speed up the certificates part that auto-plays when the
  thin24 threshold is hit, and the video should match. The forward timed completion (strokes 23..45)
  ramps cT 0→1 over DUR; the hero video's zoom-out/grey/blue/pause is computed purely from cT
  (updateHeroExit reads window.__certWrite.t — no separate video timer), so DUR is the single knob.
- main.js cert IIFE: DUR 1100 → 550 ms. Writing completion AND the video finish are now ~2× faster
  and stay in lock-step (they land together at the pop, as before). node --check OK.

### 2026-06-27 (What's Up On Socials — Lando fanned-card spread)
- Branch work: replicated Lando's "WHAT'S UP / ON SOCIALS" section (the fanned peacock
  card spread) and placed it BELOW the projects terminal, AFTER the dark `.projects-tail`
  breathing strip and BEFORE skills (order: dark terminal → dark tail → light socials →
  light skills, so the tail still bridges the two dark areas and socials/skills both read
  light — inserting it before the tail would have stranded the dark tail between two light
  sections).
- index.html: new `<section class="s is-callout-socials" id="socials">` — heading
  ("What's Up" + highlighted "On Socials"), `.callout-socials-card-layout` with 7
  `.callout-socials-card-w` cards (z-index 1,2,3,10,3,2,1 = centre on top, exactly as the
  reference), placeholder images cycling images/flow/*.jpg, and a "Follow me on social media"
  intro with GitHub / LinkedIn / Email links (from master_profile.yaml).
- styles.css (supplemental): exact reference card dimensions — `.callout-socials-card-w`
  border-radius 3.31625rem, width 20rem, height 35rem, position absolute, overflow clip,
  transform-origin 50% 50%; `.callout-socials-card-layout` max-width 80rem, height 36rem;
  `.image.is-social-card` inset:0 object-fit:cover. Section bg var(--color-bg-muted), heading
  + follow line use the blue --color-highlight (theme) in place of Lando's lime. Mobile
  (≤820px): cards drop to a static wrapped flex grid (transform:none!important).
- main.js: new self-contained `socialsFan()` IIFE (appended after the main IIFE). The fan is
  scroll-driven (pure function of scroll → reverses on scroll-up): cards start STACKED at
  centre pushed down 10rem upright (matches the reference inline translate(0,10rem)) and lerp
  to a symmetric fanned pose as the layout scrolls from ~.95vh to ~.45vh (easeOutCubic).
  Per-card FAN table (x/y rem, rot deg, scale): centre upright/highest/largest (s1.0),
  outermost x±31rem y+9.5rem rot±18° s0.8 — symmetric peacock. Skips on mobile (≤820) +
  prefers-reduced-motion (snaps to fanned). Hooks window scroll/resize + __lenis scroll.
- Verified: node --check main.js OK; markup served (7 cards / section / 3 links); fan pose
  math confirmed symmetric. Visual fan needs a real-GPU browser to eyeball (chromium-snap
  screenshots are flaky in this WSL env, per the standing headless caveat).

### 2026-06-27 (socials cards — exact hover reaction from captured matrices; branch socials-fan-cards)
- Branch `socials-fan-cards`. User captured the live Lando socials hover via a console snippet
  (lando_social_hover_matrix). Decoded the matrix() values:
  • REST fan (exact): rot = 7°×slot → [-21,-14,-7,0,7,14,21]; scale [0.776,0.850,0.935,1,…];
    x [-380,-278.7,-139.3,0,…]px; y [92.5,50.7,16.5,0,…]px (the arrival/exit fan I already had
    is KEPT per user instruction — this hover layer sits on top of it, not replacing it).
  • HOVERED card: scale ×1.08, lift −31.67px (≈1.98rem), keeps its rest x/rotation.
  • OTHER cards: SLIDE AWAY in x from the hovered card, magnitude decaying with distance
    (≈94.6px adjacent → 40.5px next → clamped at the ±edge), y/scale unchanged, small rot splay.
- main.js socialsFan(): added a hover layer (FAN/START_Y/easeOut/scroll-mapping for arrival+exit
  UNCHANGED). New constants POP_SCALE 1.08, LIFT_REM 1.98, PUSH_REM 6.6, DECAY 0.45 (=40.5/94.6),
  SPLAY 0.25°/rem, LERP 0.18. Per-card animated push (hx) + pop (pop) lerp toward targets in a
  rAF loop (GSAP-like ease-out); drawCard() composes base-fan + hover, scaled by reveal p so hover
  only acts once arrived. pointerenter on each card sets the hovered index (others compute a
  decaying push clamped to the fan edge ±EDGE_X, hovered pops + z-index 30); pointerleave on the
  layout resets. Mobile (≤820) + reduced-motion skip hover. Verified node --check OK and the push
  table (center: ±6.6/±3.0/edge-pinned, mirrors the decoded 94.6/40.5/clamp pattern).
- NOTE: off-centre hovers are slightly approximated (the live values were noisy/mid-tween and the
  real redistribution is room-weighted/asymmetric); the dominant, perceptible behaviour — hovered
  pops & lifts, neighbours part away decaying + edges pinned — matches. Couldn't screenshot to
  eyeball (chromium-snap is broken in this WSL env: "timeout waiting for snap system profiles").

### 2026-06-27 (socials hover — matrix-EXACT rest + per-card tilt + spring bounce)
- User captured time-series hover data (lando_social_hover_bouncy_matrix) → rebuilt the hover
  to the exact site values (replaces the earlier symmetric-decay approximation; arrival/exit
  scroll reveal mechanism kept, but REST values upgraded to the captured ones so arrival is
  now exact too).
- Decoded findings (main.js socialsFan, fully rewritten fan/hover block):
  • REST fan = captured verbatim (px@rem16): x[-380,-278.67,-139.33,0,…], y[92.47,50.67,16.47,0,…],
    rot = exactly 7°×slot, scale[0.7756,0.8498,0.9346,1,…].
  • HOVERED card: lifts −31.67px, scale ×1.08, keeps its x/rotation (matrix-exact, constant).
  • Δrotation of every other card = closed form sign(i−h)·3/(|i−h|+1)° — verified EXACT against
    all 7 hovered states (this is the "cards tilt when another is selected", different per card).
  • Δx (slide-away) is room-dependent (asymmetric, not a clean decay) → hardcoded the 7×7 px table
    DX[h][i] straight from the settled matrices (rows 4–6 mirror 2–0).
  • BOUNCE: the tweens overshoot then settle (~3.5% in data) → replaced the plain lerp with an
    underdamped SPRING per card per prop (x,y,r,s): STIFF 150 / DAMP 15 (ζ≈0.61, ~6.5% overshoot,
    ~0.6s settle — nudged a touch livelier than the raw capture per the user's "bouncier" ask).
    Spring handles hover interruption (mouse moving between cards) continuously.
- Responsive: captured values are at 20rem cards; offsets scale by sizeFactor()=cardWidth/(20rem)
  so the fan stays proportional on smaller screens. Mobile (≤820)/reduced-motion unchanged.
  Frame loop runs only while the spring is settling; scroll/resize just repaint the current pose.
- node --check OK; spring overshoot/settle verified numerically. Couldn't eyeball (chromium-snap
  still broken in this WSL env). Committed the capture file lando_social_hover_bouncy_matrix.

### 2026-06-27 (socials: snappier hover + bouncy fan-out arrival)
- User: site feels snappier and the INITIAL fan-out also bounces. Two changes in socialsFan():
  • Hover spring stiffer/snappier: STIFF 150→320, DAMP 15→21 (zeta ~0.59, ~7-10% overshoot,
    settle ~0.32s, was ~0.6s).
  • Arrival/exit reveal is no longer a scroll-SCRUB — it's now a triggered REVEAL SPRING. pCur
    springs 0<->1 (PR_STIFF 260 / PR_DAMP 20, ~5% overshoot) when the card layout passes ~0.85vh
    (evalReveal sets pT 0/1 on scroll); p can overshoot past 1 so the cards spring slightly past
    their fanned pose then settle = the fan-out BOUNCE (matches the reference ScrollTrigger tween).
    Folds back with a bounce when scrolled above the trigger. paint() now uses pCur (not easeOut
    scrub). Reduced-motion pins p=1; mobile unchanged. node --check OK; both springs verified
    numerically (hover 7%/0.32s, reveal 5.4%/0.33s).

### 2026-06-27 (socials moved after the bulge → after Skills)
- The "bulge" is the .skills-curve (dark scroll-animated curved seam at the top of the Skills
  section; renders on desktop, display:none ≤820px). User wanted Socials AFTER the bulge.
  Moved the .is-callout-socials section from between projects-tail and Skills to AFTER the
  Skills section. New order: Projects → projects-tail (dark spacer) → [bulge] Skills → Socials
  → Services. projects-tail now sits directly before Skills (dark→bulge→skills flow intact);
  Socials (light) follows Skills (light). Verified single socials section + balanced <section> tags.

### 2026-06-27 (Skills "What I Build With" → light contour bg + no placeholder box)
- User: remove the rounded-rectangle placeholder from the left of the Skills section and put the
  text there; the background should be the LIGHT contour field (light-blue fill + dark indigo
  contour lines) — the SAME one the blog (.writing) section uses — NOT the dark navy flowy field.
  (First pass mistakenly stripped the contour canvas entirely → flat white; corrected here.)
- main.js: .standards stays in the darkSecs list, tagged `isSkills` so it draws the BLOG palette —
  fill rgb(208,225,235) (was navy rgb(27,34,54)) + line rgba(57,50,220,0.5) (dark indigo, was
  light-blue rgba(77,139,255,0.45)). Added a per-section `line` field; the draw loop uses sec.line
  instead of the hardcoded light-blue. .features (navy/no-lines) + .faq (navy/light-blue) unchanged.
- index.html: removed the `.standards__image.placeholder-box` (the "VJ" rounded box) from
  `.standards__container`; only `.standards__content` (title + skill groups) remains.
- styles.css: .standards stays transparent (the contour canvas provides the light fill). Skills
  text overrides reverted to DARK tokens (title --color-text, desc/group --color-text-muted,
  skill-tag border #e6e6e8) since the field is now light. `.standards__container` is single-column
  (flex-direction:column, align-items:flex-start) and `.standards__content` max-width 760 / full
  width so the title + skill groups take the whole area. Dead .placeholder-box rules removed. node
  --check main.js OK.

### 2026-06-27 (Skills: Linux logo on the right, 50/50 split)
- User: place images/logos/Linux.svg to the RIGHT of the "What I Build With" text, taking 50% of
  the page.
- index.html: added `.standards__image.standards__logo.reveal` (img → images/logos/Linux.svg,
  aria-hidden, lazy) as the second child of `.standards__container`, after `.standards__content`.
- styles.css: reverted the single-column override — `.standards__container` is a centered row
  (gap --space-3xl); `.standards__content` flex 1 1 50% (text half), `.standards__logo` flex 0 0
  50% (logo half), img width 100% / max 420px / contain. Overrides the base `.standards__image`
  (800×400 cover box). Mobile (≤820): stacks column, both full-width, logo img max 280px.
- Follow-up: bigger logo (img max-width 420→620px desktop / 280→360px mobile) and the whole
  `.standards__container` (text + logo) shifted up via transform:translateY(-20%).
- Follow-up: text kept at -20%; the LOGO sits a touch higher via its own
  `.standards__logo{transform:translateY(-10%)}` (net ~-30%, iterated by the user), and on TOP
  of the dark bulge (.skills-curve z-index:3 < container z-index:4 < logo z-index:5). Removed the
  logo's `reveal` class — `.reveal.show{transform:none}` was overriding the logo's static transform.

### 2026-06-27 (Skills: small skill logos parallax around Linux)
- User: scatter AWS/Docker/Git/Python/Vim/GitHub SVGs in and around the Linux logo, each ~5% of
  Linux's size, all drifting UPWARD on scroll at different speeds.
- index.html: wrapped the Linux img in `.standards__logo-stack` (the Linux img is now
  `.standards__logo-main`) and added six `.skill-float` imgs, each with an inline top/left base
  position (scattered in/around Linux) + a `data-speed` (0.09–0.30).
- styles.css: `.standards__logo-stack{position:relative;width:100%;max-width:620px}` anchors the
  floats; `.skill-float{position:absolute;width:5%;...drop-shadow}` (5% of the stack = ~5% of the
  Linux logo). Replaced the old `.standards__logo img` sizing rule (now main vs floats). Mobile
  caps the stack at 360px so floats scale with it.
- main.js: new self-contained parallax IIFE — on scroll (window + Lenis), each float gets
  translateY(-progress*speed) where progress = vh*0.7 − stackCentreY (px); higher data-speed = more
  lift, so they part at different depths. rAF-throttled; prefers-reduced-motion leaves them static.
  node --check OK.
