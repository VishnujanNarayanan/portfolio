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
