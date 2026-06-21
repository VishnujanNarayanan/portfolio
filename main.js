/* ============================================================
   Portfolio behaviour — vanilla JS, rewritten from scratch.
   Loaded with `defer` on every page; each feature guards on the
   elements it needs, so the same file is safe on sub-pages.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Lenis smooth scroll (CDN global: Lenis) ---------- */
  var lenis = null;
  if (typeof Lenis !== "undefined" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.__lenis = lenis; // exposed so flow.js can drive click-to-jump
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- Hero entrance reveal ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    requestAnimationFrame(function () {
      void hero.offsetWidth; // commit the pre-reveal state, then transition in
      hero.classList.add("show");
    });
    // Safety net: if the entrance transition fails to settle (some engines
    // stall a combined 3D-transform + opacity transition), force the end
    // state so the hero is never left invisible.
    setTimeout(function () {
      var t = hero.querySelector(".hero__title");
      if (t && parseFloat(getComputedStyle(t).opacity) < 0.9 && window.scrollY < 4) {
        hero.querySelectorAll(".hero__title, .hero__subtitle").forEach(function (el) {
          el.style.transition = "none";
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      }
    }, 1700);

    // Hero exit is a scroll-SCRUBBED sequence, in three phases, no fade:
    //   Phase A (0 → vh): the hero and the video scroll up together as a rigid pair —
    //     the video (.hero-video) sits directly BELOW the hero with its top edge glued
    //     to the hero's bottom edge, so it rises into view from below (1:1 with scroll)
    //     rather than being uncovered in place. No zoom yet.
    //   Phase B (vh → 2vh): once the video fully covers the screen, the Lando zoom-out
    //     applies to the VIDEO — it scales DOWN from centre, 1 → EXIT_MIN_SCALE.
    //   Phase C (2vh → 3vh): the zoomed video rides UP with the page, handing over to
    //     the flow below. The video plays at its own normal speed throughout — scroll
    //     only drives the pull-up / zoom / lift, never its playback position.
    // Purely scroll-linked, so scrolling back up reverses it exactly. The 3D text
    // entrance still plays on load at scroll 0 (no transform on .hero).
    var heroContent = hero.querySelector(".hero__content");
    var heroVid = document.querySelector(".hero-video");  // office video revealed beneath the hero
    var scrollCue = hero.querySelector(".hero__scroll-btn");  // vanishes (reverse of its entrance) on scroll
    // Header pieces that react to the zoom-out (color flip + shrink-to-edges).
    var hdr        = document.querySelector("header");
    var navLeft    = hdr && hdr.querySelector(".header__nav-left");
    var navRight   = hdr && hdr.querySelector(".header__nav-right");
    var navLinks   = hdr ? hdr.querySelectorAll(".header__nav-left a") : [];
    var glassPill  = hdr && hdr.querySelector(".pill-btn--glass");
    var darkPill   = hdr && hdr.querySelector(".pill-btn--dark");
    // Per-LETTER vertical REEL on each CTA pill: each letter is a clip with two copies — __a (the
    // current world, colour inherited from the span) and __b (the alt-world colour, fixed in CSS).
    // Letters stagger left→right (--d = i·step) like the nav, but with NO word gap, and BOTH pills
    // roll together (.is-rolled toggled on both at once) so the two buttons reel in unison.
    function buildPillReel(pill) {
      if (!pill) return null;
      var span = pill.querySelector(".pill-btn-span"); if (!span) return null;
      var txt = span.textContent;
      span.setAttribute("aria-label", txt); span.textContent = "";
      for (var i = 0; i < txt.length; i++) {
        var clip = document.createElement("span"); clip.className = "pill-char"; clip.setAttribute("aria-hidden", "true");
        clip.style.setProperty("--d", (i * 0.03).toFixed(3) + "s");   // world-flip stagger, no word gap
        clip.style.setProperty("--hd", (i * 0.022).toFixed(3) + "s"); // hover-reel stagger (local to the pill)
        var ch = txt[i] === " " ? " " : txt[i];
        // __col = hover roller; inside it __face (the world-flip clip: __a/__b) + __c (a same-colour
        // self-reel clone, color:inherit → always legible). Hover rolls __col up to reveal __c.
        var col = document.createElement("span"); col.className = "pill-char__col";
        var face = document.createElement("span"); face.className = "pill-char__face";
        var a = document.createElement("span"); a.className = "pill-char__a"; a.textContent = ch;
        var b = document.createElement("span"); b.className = "pill-char__b"; b.textContent = ch;
        var cl = document.createElement("span"); cl.className = "pill-char__c"; cl.textContent = ch;
        face.appendChild(a); face.appendChild(b);
        col.appendChild(face); col.appendChild(cl);
        clip.appendChild(col);
        span.appendChild(clip);
      }
      return span;   // colour is driven on the span; the __a letters inherit it
    }
    var hireSpan = buildPillReel(glassPill);   // Hire Me letters (__a inherits white in the dark world)
    var giSpan   = buildPillReel(darkPill);    // Get In Touch letters (__a inherits black in the dark world)
    var EXIT_MIN_SCALE = 0.38;      // how far the whole page-rectangle recedes (smaller = more zoom-out)
    var hdrFlipped = null;          // header flip state — THRESHOLD-fired (not scroll-scrubbed); null so it inits
    // Header THEME for a light(he=0) → dark(he=1) world: nav + Hire-Me text black→white and the
    // dark "Get In Touch" pill inverting (bg #050419→#d0e1eb, text white→black) so it stays legible.
    // Shared so the reel thresholds (flow + blog, via __navLight) can flip the SAME two pills the
    // hero zoom does — exposed on window so the nav-reel IIFE can reach it.
    function setHeaderTheme(he, ease) {
      // ease = reel-threshold flip (discrete) → animate colour + pill bg over ~.5s to match the
      // nav reel. Default (hero zoom) keeps the reference's snappy .3s colour (bg tracks scroll).
      var trans = ease ? "color .5s var(--ease-default),background-color .5s var(--ease-default)"
                       : "color .3s var(--ease-default)";
      var rolled = ease ? (he < 0.5) : false;
      var c = Math.round(255 * he);                         // current text channel: 0 (black) → 255 (white)
      var c2 = Math.round(255 * (1 - he));                  // Get In Touch is inverted
      // When rolling TO the light world (ease + rolled), do NOT update __a letter colours — __a
      // must stay at its current (source) colour so the reel shows old→new, not new→new.
      // Only update __a when unrolling back to the dark world, so the returning letter arrives
      // in the correct dark-world colour.
      if (!ease || !rolled) {
        var rgb = "rgb(" + c + "," + c + "," + c + ")";
        navLinks.forEach(function (a) { a.style.transition = trans; a.style.color = rgb; });
        if (hireSpan) { hireSpan.style.transition = trans; hireSpan.style.color = rgb; }
        if (giSpan) { giSpan.style.transition = trans; giSpan.style.color = "rgb(" + c2 + "," + c2 + "," + c2 + ")"; }
      }
      if (darkPill) {                                     // Get In Touch pill bg: dark #050419 → light #d0e1eb
        var dr = Math.round(5 + (208 - 5) * he), dg = Math.round(4 + (225 - 4) * he), db = Math.round(25 + (235 - 25) * he);
        darkPill.style.transition = trans; darkPill.style.backgroundColor = "rgb(" + dr + "," + dg + "," + db + ")";
      }
      // Reel roll — only on the discrete threshold flips (ease): the LIGHT world rolls both pills up
      // to their __b copy, in unison. During the hero zoom (no ease) stay unrolled so __a's colour
      // interpolates smoothly with the scroll.
      if (glassPill) glassPill.classList.toggle("is-rolled", rolled);
      if (darkPill) darkPill.classList.toggle("is-rolled", rolled);
      // Hover-reel clone colour (--hc) = the FLIP target, ALWAYS kept current here:
      //  • CTA pills roll to the literal OPPOSITE colour (white<->black).
      //  • nav links roll to the opposite blue of the text (sky #4d8bff from white, deep blue
      //    #231d7a — the zone-3/4 title blue — from black). At reel thresholds __navLight owns the
      //    nav --hc; during the hero zoom (no ease) we set it here from the live text channel.
      // The HERO same-colour reel is now GATED by the header.is-hero class (CSS forces currentColor
      // while it's on), toggled in updateHeroExit — so --hc is set unconditionally, and the moment
      // you scroll off the hero the clone already carries the flip colour (no wait for a threshold).
      var WHITE = "#fcfcfc", BLACK = "#050419";
      var hireVis = rolled ? 0   : c;    // visible channel: glass __b is black(0)
      var giVis   = rolled ? 255 : c2;   // dark-pill __b is white(255)
      if (hireSpan) hireSpan.style.setProperty("--hc", hireVis >= 128 ? BLACK : WHITE);   // opposite of current
      if (giSpan)   giSpan.style.setProperty("--hc",   giVis   >= 128 ? BLACK : WHITE);
      if (!ease) navLinks.forEach(function (a) { a.style.setProperty("--hc", c >= 128 ? "#4d8bff" : "#231d7a"); });
    }
    window.__headerTheme = setHeaderTheme;
    function updateHeroExit() {
      var vh = window.innerHeight;
      var y = window.scrollY;
      // Phase A (0 → vh): the hero rides UP 1:1 with scroll (linear, so the video glued
      // to its bottom edge tracks it exactly). Past vh it's parked off the top.
      if (heroContent) heroContent.style.transform = "";
      hero.style.transform = "translateY(" + (-Math.min(y, vh)) + "px)";
      // Phases B/C act on the video once it fully covers the screen (y ≥ vh):
      //   B (vh → 2vh): zoom OUT from the centre (camera pull-back), 1 → EXIT_MIN_SCALE.
      //   C (2vh → 3vh): ride UP with the page, handing over to the flow below.
      if (heroVid) {
        // Y: below the fold (top edge at the hero's bottom) → 0 (full screen) over phase A,
        // locked at 0 through the zoom, then rides up off the top in phase C.
        var vTy = (y < vh) ? (vh - y) : -Math.max(0, y - 2 * vh);
        var scale;
        if (y < vh) {
          // Phase A CONTENT zoom (a normal camera zoom; object-fit:cover keeps it full-frame):
          // held zoomed-in 1.55 for the first 50% of the pull-up, then eased back to 1.0 (full
          // view) between 50% and 100% (reaching 1.0 at the top). Distinct from the edge zoom below.
          var zt = Math.max(0, Math.min((y - 0.5 * vh) / (0.5 * vh), 1));
          var ze = zt * zt * (3 - 2 * zt);             // smoothstep
          scale = 1.55 - 0.55 * ze;                    // 1.55 → 1.0
        } else {
          // Phase B EDGE zoom-out (shrinks the whole rectangle, uncovering the marquee around it).
          var pB = Math.max(0, Math.min((y - vh) / vh, 1));
          var eB = pB * pB * (3 - 2 * pB);             // smoothstep
          scale = 1 - (1 - EXIT_MIN_SCALE) * eB;       // 1 → EXIT_MIN_SCALE (no opacity change)
        }
        heroVid.style.transformOrigin = "50% 50%";
        heroVid.style.transform = "translateY(" + vTy + "px) scale(" + scale + ")";
      }
      // Scroll cue plays its entrance in reverse the moment scrolling starts.
      if (scrollCue) scrollCue.classList.toggle("is-exiting", y > 0);
      // Hover-reel gate: through the whole pull-up (y < vh) the header stays in its hero
      // appearance, so the clone keeps the SAME colour (CSS forces currentColor). It only
      // flips once the edge zoom-out begins (--hc takes over) — same trigger as the theme below.
      if (hdr) hdr.classList.toggle("is-hero", y < vh);

      // Header reacts to the EDGE zoom-out (phase B), NOT to the initial pull-up. It's
      // THRESHOLD-fired (a timed flip, not scroll-scrubbed): the moment the video begins
      // zooming out from the edges (y ≥ vh) it plays its transition once, and reverses when
      // you scroll back above that line. Same look/speed as before, just one viewport later:
      //  - text colour flips as the light bg appears (CSS .3s color transition);
      //  - the left nav + right CTAs SHRINK in place, anchored to their page edges (.3s);
      //  - the dark "Get In Touch" pill inverts its bg (dark → light) so it stays legible.
      // While y > 2·vh the flow/blog reel thresholds own the theme (via window.__navLight),
      // so we only assert it up to the end of the edge zoom.
      var wantFlip = y >= vh;
      if (wantFlip !== hdrFlipped) {
        hdrFlipped = wantFlip;
        if (y <= 2 * vh) setHeaderTheme(wantFlip ? 1 : 0);   // timed (.3s), not scrubbed
        var hs = wantFlip ? 0.88 : 1;                        // shrink 1 ↔ 0.88 (subtle)
        if (navLeft)  { navLeft.style.transition  = "transform .3s var(--ease-default)"; navLeft.style.transformOrigin  = "left center";  navLeft.style.transform  = "scale(" + hs + ")"; }
        if (navRight) { navRight.style.transition = "transform .3s var(--ease-default)"; navRight.style.transformOrigin = "right center"; navRight.style.transform = "scale(" + hs + ")"; }
      }
    }
    window.addEventListener("scroll", updateHeroExit, { passive: true });
    window.addEventListener("resize", updateHeroExit, { passive: true });
    updateHeroExit();
  }

  /* ---------- Tool-logo marquee behind the hero (scroll-driven) ---------- */
  var marquee = document.querySelector(".tool-marquee");
  if (marquee) {
    var TOOLS = [
      "python/python-original", "javascript/javascript-original", "typescript/typescript-original",
      "react/react-original", "nextjs/nextjs-original", "nodejs/nodejs-original",
      "nestjs/nestjs-original", "tailwindcss/tailwindcss-original", "docker/docker-original",
      "postgresql/postgresql-original", "redis/redis-original", "git/git-original",
      "github/github-original", "amazonwebservices/amazonwebservices-original-wordmark",
      "vercel/vercel-original", "fastapi/fastapi-original", "pandas/pandas-original",
      "selenium/selenium-original", "playwright/playwright-original",
      "pytorch/pytorch-original", "tensorflow/tensorflow-original", "scikitlearn/scikitlearn-original"
    ];
    var CDN = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/";
    var HALF = Math.ceil(TOOLS.length / 2);
    var ROWS = [
      { dir: -1, speed: 90,  set: TOOLS.slice(0, HALF) },  // top row: first half of the tools
      { dir:  1, speed: 115, set: TOOLS.slice(HALF) }       // bottom row: the rest (no overlap)
    ];
    var COPIES = 4;                                          // repeats per row → seamless loop
    var rowEls = ROWS.map(function (cfg) {
      var row = document.createElement("div");
      row.className = "tool-marquee__row";
      for (var d = 0; d < COPIES; d++) {
        cfg.set.forEach(function (t) {
          var img = document.createElement("img");
          img.src = CDN + t + ".svg";
          img.alt = "";
          row.appendChild(img);
        });
      }
      marquee.appendChild(row);
      return { el: row, dir: cfg.dir, speed: cfg.speed, offset: 0, setW: 1, count: cfg.set.length };
    });
    // Cache each row's EXACT repeat stride = distance from the first item of copy 0 to the
    // first item of copy 1 (includes the inter-item gap). Using scrollWidth/COPIES was off by
    // the missing trailing gap, so the seam didn't line up → a jump at the wrap point.
    // Only re-measured on load/resize (per-frame measuring caused jitter while logos loaded).
    function measure() {
      rowEls.forEach(function (r) {
        var a = r.el.children[0], b = r.el.children[r.count];
        r.setW = (b && a) ? (b.offsetLeft - a.offsetLeft) || 1 : 1;
      });
    }
    // Vertical position + fade follow scroll; horizontal motion is time-based (constant).
    function updateMarquee() {
      var y = window.scrollY, vh = window.innerHeight;
      // The marquee sits BEHIND the video — hidden during the pull-up (phase A, y < vh),
      // it fades in as the video zooms out and uncovers it (phase B, vh → 1.55·vh)...
      marquee.style.opacity = Math.max(0, Math.min((y - vh) / (vh * 0.55), 1));
      // ...then rides UP with the video as it hands over to the flow (phase C, y > 2vh).
      var lift = Math.max(0, y - 2 * vh);
      marquee.style.transform = "translate3d(0," + (-lift) + "px,0)";
    }
    var lastT = 0;
    function tick(now) {
      var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0;  // clamp so a tab-resume can't jump
      lastT = now;
      rowEls.forEach(function (r) {
        var setW = r.setW;
        r.offset += r.dir * r.speed * dt;
        var wrapped = ((r.offset % setW) + setW) % setW; // 0 → setW, seamless wrap
        r.el.style.transform = "translate3d(" + (wrapped - setW) + "px,0,0)";
      });
      requestAnimationFrame(tick);
    }
    function onResize() { measure(); updateMarquee(); }
    window.addEventListener("scroll", updateMarquee, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);          // re-measure once logos affect layout
    measure();
    updateMarquee();
    requestAnimationFrame(tick);
  }

  /* ---------- Global background: animated topographic blue contours ----------
     One fixed full-viewport plane shared by the hero zoom-out reveal AND the flow
     section (so they read as the same continuous background). The contours are
     iso-lines (marching squares) of a moving scalar field built from drifting,
     pulsing metaballs — so they are CLOSED loops, never overlap (iso-lines of one
     field can't cross), and grow / shrink / vanish as the blobs pulse and move. */
  (function () {
    var cv = document.createElement("canvas");          // global plane (blue, dark bg)
    cv.id = "bg-contours";
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    // Same pattern rendered inside the hero in a DARKER shade (reads on the light hero
    // gradient). Both draw the identical field at the same screen coords, so scrolling
    // out of the hero is seamless — the hero pattern IS this background playing through.
    var heroBg = document.querySelector(".hero__bg");
    var hcv = null, hctx = null;
    if (heroBg) { hcv = document.createElement("canvas"); hcv.id = "hero-contours"; heroBg.appendChild(hcv); hctx = hcv.getContext("2d"); }
    // Writing section: its OWN contour plane (same shared field), painted with a vertical
    // gradient so the section reads as zone-4 (light blue, dark lines) at the TOP easing to
    // zone-1 (dark navy, light-blue lines) at the BOTTOM — the flow's light→dark, frozen
    // vertically. Inserted first so the strips paint on top of it.
    var writingPin = document.querySelector(".writing__pin");
    var featuresEl = document.querySelector(".features");
    var wcv = null, wctx = null;
    if (writingPin) { wcv = document.createElement("canvas"); wcv.id = "writing-contours"; writingPin.insertBefore(wcv, writingPin.firstChild); wctx = wcv.getContext("2d"); }
    // The content sections AFTER the blog (Selected work / Skills / Services) continue the
    // dark world: each gets its OWN contour canvas filled with zone-1 navy + light-blue lines,
    // drawn viewport-aligned so the field runs continuously out of the blog's dark bottom and
    // straight through them. Canvas is sized to the WHOLE section (handles tall / sticky / the
    // accordion growing) and inserted first so the section content paints on top.
    var darkSecs = [];
    [".features", ".standards", ".faq"].forEach(function (sel) {
      var el = document.querySelector(sel); if (!el) return;
      var c = document.createElement("canvas"); c.className = "section-contours";
      el.insertBefore(c, el.firstChild);
      darkSecs.push({ el: el, cv: c, ctx: c.getContext("2d"), w: 0, h: 0 });
    });
    var W = 0, H = 0, DPR = 1, CELL = 26, cols = 0, rows = 0, field = [];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    // tiny value noise (for domain-warping the field → breaks perfect circles/ovals)
    function vh(i, j) { var n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise2(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      var a = vh(ix, iy), b = vh(ix + 1, iy), c2 = vh(ix, iy + 1), d = vh(ix + 1, iy + 1);
      return (a * (1 - ux) + b * ux) * (1 - uy) + (c2 * (1 - ux) + d * ux) * uy;
    }
    // Metaballs (round, closed iso-loops) on a JITTERED GRID that EXTENDS BEYOND the
    // viewport (span -0.2..1.2) so blobs also live off-screen — contours then run off the
    // edges and merge/split at the borders too, not just in the centre (no big containing
    // outer loop). Larger orbits + heavy jitter → more random merging/splitting everywhere.
    var BLOBS = [];
    function seedBlobs() {
      BLOBS = []; var gx = 5, gy = 4, i, j, SPAN = 1.4, OFF = -0.2;
      for (j = 0; j < gy; j++) for (i = 0; i < gx; i++) {
        BLOBS.push({
          bx: OFF + (i + 0.5) / gx * SPAN + (Math.random() - 0.5) * 0.22,
          by: OFF + (j + 0.5) / gy * SPAN + (Math.random() - 0.5) * 0.22,
          ox: 0.07 + Math.random() * 0.13, oy: 0.07 + Math.random() * 0.13,  // larger orbit → real merging/splitting
          sx: 0.04 + Math.random() * 0.14, sy: 0.04 + Math.random() * 0.14,
          px: Math.random() * 6.28, py: Math.random() * 6.28,
          r: 0.12 + Math.random() * 0.1,
          pulse: 0.35 + Math.random() * 0.9,
          pph: Math.random() * 6.28
        });
      }
    }
    function sizeCanvas(canvas, context) {
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      context.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      sizeCanvas(cv, ctx); if (hcv) sizeCanvas(hcv, hctx); if (wcv) sizeCanvas(wcv, wctx);
      cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
    }
    seedBlobs(); resize();
    window.addEventListener("resize", resize, { passive: true });
    var LEVELS = [0.22, 0.36, 0.52, 0.7];              // fewer, rounded nested loops
    function lerp(a, b, t) { return a + (b - a) * t; }
    // marching squares over the shared field → closed, non-overlapping contours.
    // Pulled out so the section canvases (which fill their own full height) can reuse the
    // exact same iso-line pass without going through drawContours' viewport-sized clear/fill.
    function strokeIso(g) {
      var li, lv, r, c;
      for (li = 0; li < LEVELS.length; li++) {
        lv = LEVELS[li];
        g.beginPath();
        for (r = 0; r < rows; r++) {
          for (c = 0; c < cols; c++) {
            var x0 = c * CELL, y0 = r * CELL, x1 = x0 + CELL, y1 = y0 + CELL;
            var tl = field[r][c], tr = field[r][c + 1], br2 = field[r + 1][c + 1], bl = field[r + 1][c];
            var idx = (tl > lv ? 8 : 0) | (tr > lv ? 4 : 0) | (br2 > lv ? 2 : 0) | (bl > lv ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            var Tx = lerp(x0, x1, (lv - tl) / (tr - tl));
            var Ry = lerp(y0, y1, (lv - tr) / (br2 - tr));
            var Bx = lerp(x0, x1, (lv - bl) / (br2 - bl));
            var Ly = lerp(y0, y1, (lv - tl) / (bl - tl));
            switch (idx) {
              case 1: case 14: g.moveTo(x0, Ly); g.lineTo(Bx, y1); break;
              case 2: case 13: g.moveTo(Bx, y1); g.lineTo(x1, Ry); break;
              case 3: case 12: g.moveTo(x0, Ly); g.lineTo(x1, Ry); break;
              case 4: case 11: g.moveTo(Tx, y0); g.lineTo(x1, Ry); break;
              case 6: case 9:  g.moveTo(Tx, y0); g.lineTo(Bx, y1); break;
              case 7: case 8:  g.moveTo(x0, Ly); g.lineTo(Tx, y0); break;
              case 5:  g.moveTo(x0, Ly); g.lineTo(Tx, y0); g.moveTo(Bx, y1); g.lineTo(x1, Ry); break;
              case 10: g.moveTo(x0, Ly); g.lineTo(Bx, y1); g.moveTo(Tx, y0); g.lineTo(x1, Ry); break;
            }
          }
        }
        g.stroke();
      }
    }
    function drawContours(g, stroke, bgFill, oy) {
      g.clearRect(0, 0, W, H);
      if (bgFill) { g.fillStyle = bgFill; g.fillRect(0, 0, W, H); }
      // oy shifts the iso-lines into VIEWPORT space (the field is sampled in screen coords).
      // A scrolling canvas passes oy = -rect.top so its lines coincide exactly with the fixed
      // #bg-contours plane → the contour field reads as ONE continuous background across sections.
      g.save(); if (oy) g.translate(0, oy);
      g.lineCap = "round"; g.lineJoin = "round";
      g.strokeStyle = stroke; g.lineWidth = 0.45;
      strokeIso(g);
      g.restore();
    }
    var t = 0, last = 0, navDark = false, ctaDark = false;   // nav reel + CTA pills now flip TOGETHER at the features-hit threshold
    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
      t += dt * 0.5;                                     // drift speed
      var md = Math.min(W, H), wf = 2.6 / md, warp = md * 0.08; // gentle warp → rounded, not perfect circles
      var bx = [], by = [], br = [], bw = [], i, c, r;
      for (i = 0; i < BLOBS.length; i++) {
        var b = BLOBS[i];
        bx[i] = (b.bx + Math.cos(t * b.sx * 6.28 + b.px) * b.ox) * W;
        by[i] = (b.by + Math.sin(t * b.sy * 6.28 + b.py) * b.oy) * H;
        br[i] = b.r * md;
        bw[i] = 0.6 + 0.4 * Math.sin(t * b.pulse + b.pph);
      }
      for (r = 0; r <= rows; r++) {
        field[r] = field[r] || [];
        for (c = 0; c <= cols; c++) {
          var px = c * CELL, py = r * CELL;
          var wx = px + (noise2(px * wf + t * 0.1, py * wf) - 0.5) * 2 * warp;
          var wy = py + (noise2(px * wf + 5.2, py * wf - t * 0.1) - 0.5) * 2 * warp;
          var sum = 0;
          for (i = 0; i < BLOBS.length; i++) {
            var dx = wx - bx[i], dy = wy - by[i], rr = br[i];
            sum += bw[i] * Math.exp(-(dx * dx + dy * dy) / (2 * rr * rr));
          }
          field[r][c] = sum;
        }
      }
      // Flow lightening (shared from flow.js): lt 0 = dark navy world (lines stay
      // blue), lt 1 = light bg by end of zone 4 (canvas filled light, lines INVERT
      // to the darker site blue so they read on the light bg). lt 0 → no fill, so
      // the navy shader shows through unchanged outside/before the flow.
      var lt = window.__flowLight || 0;
      var bgFill = lt > 0
        ? "rgb(" + Math.round(lerp(27, 208, lt)) + "," + Math.round(lerp(34, 225, lt)) + "," + Math.round(lerp(54, 235, lt)) + ")"
        : null;
      var lineCol = "rgba(" + Math.round(lerp(77, 57, lt)) + "," + Math.round(lerp(139, 50, lt)) +
        "," + Math.round(lerp(255, 220, lt)) + "," + lerp(0.3, 0.5, lt).toFixed(2) + ")";
      drawContours(ctx, lineCol, bgFill);                // global: blue → inverted dark-blue on light
      if (hctx) drawContours(hctx, "#969ba8");           // hero: same blue-grey as end bg → lines vanish at full zoom
      // Header world flip, handed off from the (light) blog to the (dark) features
      // section: BOTH the nav reel AND the CTA pills switch together the MOMENT the
      // features section hits its threshold — rect.top ≤ 0, i.e. when its dark navy
      // bg reaches/covers the fixed header (the same threshold the terminal reveals
      // at). Previously nav flipped at blogProg 0.60 and CTA at 0.07 — two separate,
      // later points; now they're unified to this single features-hit threshold.
      var fTop = featuresEl ? featuresEl.getBoundingClientRect().top : (H || 1);
      var wantDark = fTop <= 0;
      if (wantDark !== navDark) {
        navDark = wantDark;
        if (window.__navLight) window.__navLight(!navDark, true);
      }
      if (wantDark !== ctaDark) {
        ctaDark = wantDark;
        if (window.__headerTheme) window.__headerTheme(ctaDark ? 1 : 0, true);
      }
      // Blog canvas: solid light blue (end-of-zone-4) + dark indigo lines (no gradient).
      if (wctx && writingPin) {
        var wtop = writingPin.getBoundingClientRect().top;
        drawContours(wctx, "rgba(57,50,220,0.5)", "rgb(208,225,235)", -wtop);
      }
      // Dark content sections (Selected work / Skills / Services): solid dark navy + light-blue lines.
      for (var ds = 0; ds < darkSecs.length; ds++) {
        var sec = darkSecs[ds], sr = sec.el.getBoundingClientRect();
        if (sr.bottom <= 0 || sr.top >= H) continue;
        var sh = sec.el.offsetHeight;
        if (sec.w !== W || sec.h !== sh) {
          sec.w = W; sec.h = sh;
          sec.cv.width = W * DPR; sec.cv.height = sh * DPR;
          sec.cv.style.width = W + "px"; sec.cv.style.height = sh + "px";
          sec.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        var sg = sec.ctx;
        sg.clearRect(0, 0, W, sh);
        sg.fillStyle = "rgb(27,34,54)"; sg.fillRect(0, 0, W, sh);
        sg.save(); sg.translate(0, -sr.top);
        sg.lineCap = "round"; sg.lineJoin = "round";
        sg.strokeStyle = "rgba(77,139,255,0.45)"; sg.lineWidth = 0.45;
        strokeIso(sg);
        sg.restore();
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- IntersectionObserver reveals ---------- */
  var revealTargets = document.querySelectorAll(".reveal, .feature-item__content");
  if ("IntersectionObserver" in window && revealTargets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("show"); });
  }

  /* ---------- Writing — threshold-driven timed intro, ONE overlapping right→left timeline ----------
     A SINGLE threshold (the section's top crossing mid-viewport, handing off from flow) fires the
     whole sequence on a TIMER over DUR seconds. Two waves overlap, both sweeping RIGHT→LEFT:
       • ARRIVAL — reversed gapless reveal: rightmost panel lands first (as the big absorber, then
         shrinks to size), the rest reveal leftward; the leftmost (opener) is NOT present until the
         reveal reaches it last.
       • RISE+SETTLE — each panel begins rising the moment it itself arrives (so rises overlap the
         arrivals still in flight and the settles in front of them), then settles into place.
     Scrolling back out the top reverses it; once landed it hands off to the live sticky-hover
     accordion. Stacking (rightmost on top) is the CSS default — unchanged. */
  (function () {
    var section = document.querySelector(".writing");
    var wstack = section && section.querySelector(".wstack");
    if (!section || !wstack) return;
    var panels = Array.prototype.slice.call(wstack.querySelectorAll(".wpanel"));
    if (!panels.length) return;
    var N = panels.length;
    var DUR = 2.6;                                      // whole sequence duration (s) — timed, not scrolled
    // ONE OVERLAPPING right→left timeline (no Part-1/Part-2 boundary). Two waves run at once:
    //   ARRIVAL — a reversed gapless reveal: the RIGHTMOST panel lands first, the rest reveal
    //     leftward, the leftmost (panel 0, the opener) being the big absorber that arrives last.
    //   RISE+SETTLE — a panel STARTS rising the moment it itself arrives (rise stagger === arrival
    //     stagger), so later panels begin adjusting earlier and rises overlap freely with the
    //     settles in front of them rather than waiting one-settle-per-rise.
    // Panel order j = (N-1)-i, j=0 = rightmost. rise-start(j) === arrival(j) === T_ARR*(j+1)/N;
    // settle-start(j) === rise-start(j)+rDur(j). Rise + settle windows both shrink with j (faster
    // leftward). All times are raw units normalised by L so the
    // timed progress T∈[0,1] covers the whole thing.
    var T_ARR = 0.6;                                    // raw time for all arrivals (single right→left sweep)
    // RISE has two INDEPENDENTLY-timed clip edges:
    //   LEFT edge  — progressively SLOWER toward the left (its window GROWS with j).
    //   RIGHT edge — CONSTANT window for EVERY panel (same rise rate left→right).
    var L_DUR0 = 0.16;                                  // rightmost panel's LEFT-edge rise window — quickest
    var L_DUR1 = 0.40;                                  // leftmost panel's LEFT-edge rise window — slowest
    var R_DURC = 0.22;                                  // RIGHT-edge rise window — identical for all panels
    var S_DUR0 = 0.28;                                  // FIRST (rightmost) panel's settle window (raw) — slowest
    var S_DUR1 = 0.06;                                  // LAST (leftmost) panel's settle window — fastest
    function ramp(a, b, j) { return lerp(a, b, N > 1 ? j / (N - 1) : 0); }      // progressively from a (j=0, rightmost) → b (j=N-1, leftmost)
    function lDur(j) { return ramp(L_DUR0, L_DUR1, j); }  // LEFT edge gets progressively SLOWER leftward (window grows with j)
    function rDur(j) { return lDur(j) + R_DURC; }       // rise is SEQUENTIAL: left edge fully first, THEN the right edge → drives settle-start + L
    function sDur(j) { return ramp(S_DUR0, S_DUR1, j); }  // settle gets progressively QUICKER leftward (j↑)
    var R_STEP = T_ARR / N;                             // rise stagger === arrival stagger → each panel rises the moment it arrives
    var riseStart0 = T_ARR / N;                         // rightmost rises as soon as it itself has arrived (not after N panels to its left)
    var L = riseStart0 + (N - 1) * R_STEP + rDur(N - 1) + sDur(N - 1);  // total raw length → normalises T∈[0,1]
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
    function smoother(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }  // ease-in + ease-out (pronounced)
    function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }   // nonzero slope at 0 → immediate start

    // Resolved geometry (clamps → px), cached; recomputed on resize.
    var G = { W: 0, H: 0, openBasis: 0, per: 0, stripW: 0, openW: 0, ph: [] };
    function geom() {
      var wr = wstack.getBoundingClientRect();
      G.W = wr.width; G.H = wr.height;
      var rail = panels[0].querySelector(".wpanel__rail");
      var content = panels[0].querySelector(".wpanel__content");
      var strip = rail ? parseFloat(getComputedStyle(rail).minWidth) : 90;     // = --strip
      var cw = content ? parseFloat(getComputedStyle(content).width) : 300;     // = --cw
      G.openBasis = strip + cw;                          // the open panel's extra basis (main accordion)
      G.per = G.W / N;                                   // equal width (Part-1 end)
      G.stripW = (G.W - G.openBasis) / N;                // a closed strip's final width (accordion)
      G.openW = G.openBasis + G.stripW;                  // the open (first) panel's final width
      G.ph = panels.map(function (p) {
        var v = parseFloat(getComputedStyle(p).getPropertyValue("--ph"));       // taper %, e.g. 91
        return isNaN(v) ? 100 : v;
      });
    }

    // Rail text (vertical label + number) per panel — repositioned to track the band edge.
    var TXT = panels.map(function (p) {
      return { vert: p.querySelector(".wpanel__vert"), num: p.querySelector(".wpanel__num") };
    });

    // BOTH parts render a panel identically: a FULL-height box clipped to a (possibly tapered)
    // band, with the right-edge bleed extended past the clip so seams can't reopen, AND the rail
    // text pinned to the band's edge (not the box edge) so it never jumps when the box height /
    // taper representation is the same across the Part-1 → Part-2 seam.
    //   tlPct/trPct = top inset (%) of the left/right edge; bleed = px of right-bleed; w = px width.
    function paintPanel(pan, i, w, tlPct, trPct, bleed) {
      var rx = (100 + bleed / Math.max(w, 1) * 100).toFixed(2);
      var tl = tlPct.toFixed(2), tr = trPct.toFixed(2);
      pan.style.height = G.H + "px";
      pan.style.boxShadow = bleed.toFixed(1) + "px 0 0 0 var(--bg)";
      pan.style.clipPath =
        "polygon(0% " + tl + "%, " + rx + "% " + tr + "%, " + rx + "% " + (100 - tr) + "%, 0% " + (100 - tl) + "%)";
      // text sits in the LEFT band (the strip zone): follow the left edge's top/bottom inset.
      var t = TXT[i], ins = tlPct / 100 * G.H;
      if (t.vert) t.vert.style.top = (30 + ins).toFixed(1) + "px";
      if (t.num) t.num.style.bottom = (26 + ins).toFixed(1) + "px";
    }

    var settled = null;                                 // tri-state: null/false/true
    function setSettled(on) {
      if (on === settled) return;
      settled = on;
      panels.forEach(function (p, i) {
        if (on) {                                        // hand off to the live CSS accordion
          p.style.transition = ""; p.style.transform = ""; p.style.transformOrigin = ""; p.style.clipPath = "";
          p.style.flexBasis = ""; p.style.flexGrow = ""; p.style.flexShrink = "";
          p.style.boxShadow = "";                        // back to the CSS base bleed
          p.style.height = G.H + "px";                   // uniform height (overrides the --ph taper)
          if (TXT[i].vert) { TXT[i].vert.style.top = ""; TXT[i].vert.style.opacity = ""; }  // rail text back to CSS (box edges, fully visible)
          if (TXT[i].num) { TXT[i].num.style.bottom = ""; TXT[i].num.style.opacity = ""; }
          p.classList.toggle("is-open", i === 0);
          var c = p.querySelector(".wpanel__content"); if (c) c.style.opacity = "";
        } else {
          p.style.transition = "none"; p.classList.remove("is-open");
        }
      });
    }

    // PAINT(T) — the whole sequence in ONE overlapping pass. For each panel we know three
    // progresses derived from the single timed clock t = T*L:
    //   • settle/target width (per → stripW) from its settle window;
    //   • a gapless ARRIVAL reveal (rightmost first) that grows each panel from 0 to its target,
    //     with panel 0 as the residual absorber (so freed settle-space and un-arrived space both
    //     flow into the opening panel) — guarantees the widths always sum to W with no gaps;
    //   • a RISE clip (trapezoid: LEFT edge first, then RIGHT edge to full height).
    function paint(T) {
      var W = G.W, per = G.per, t = T * L;
      var pA = clamp(t / T_ARR, 0, 1);
      var af = pA * N;                                  // revealed count from the RIGHT (fractional)
      var fl = Math.min(Math.floor(af), N - 1);         // frontier index (distance-from-right)
      var frac = clamp(af - fl, 0, 1);                  // progress of the frontier hand-off

      // settle width of an already-revealed strip (per → stripW over its own settle window).
      function settleWidth(i) {
        var j = (N - 1) - i;
        var sS = riseStart0 + j * R_STEP + rDur(j);     // settle starts right after this panel's rise
        var setP = clamp((t - sS) / sDur(j), 0, 1);     // window shrinks with j → progressively faster settle
        return lerp(per, G.stripW, smoother(setP));     // ease IN + ease INTO place
      }

      // Reversed gapless reveal. The RIGHTMOST panel (d=0) appears FIRST as the big absorber and
      // shrinks to per as the frontier sweeps LEFT; the LEFTMOST panel (panel 0) appears LAST and
      // ends as the opener — it is NOT special-cased and is never present until the frontier reaches
      // it. The frontier panel (d==fl) holds the remainder R; the next one (d==fl+1) grows into it;
      // as revealed strips settle (shrink) the freed width flows left into R → the opener.
      var rightSettled = 0, widths = new Array(N);
      panels.forEach(function (pan, i) {
        if ((N - 1 - i) < fl) { var w = settleWidth(i); widths[i] = w; rightSettled += w; }
      });
      var R = W - rightSettled;                         // space to the LEFT of the settled block
      var nextGrow = (fl + 1 <= N - 1) ? frac * (R - per) : 0;
      if (nextGrow < 0) nextGrow = 0;
      panels.forEach(function (pan, i) {
        var d = (N - 1) - i;
        if (d < fl) return;                             // already settled above
        widths[i] = d === fl ? (R - nextGrow)           // active absorber → shrinks toward per
          : d === fl + 1 ? nextGrow                     // next panel grows 0 → R-per
            : 0;                                        // not yet revealed
      });

      // bleed grows with how much the opener has OPENED UP, so the rise's clip can't reopen seams.
      var opened = widths[0] - per; if (opened < 0) opened = 0;
      var bleed = 18 + opened;

      var accRaw = 0, accSnap = 0;
      panels.forEach(function (pan, i) {
        var j = (N - 1) - i;
        var rS = riseStart0 + j * R_STEP;                // rise start per panel (staggered with arrival)
        var inset = (1 - G.ph[i] / 100) / 2;
        var eL = easeOut(clamp((t - rS) / lDur(j), 0, 1));            // LEFT edge — fully first; progressively SLOWER toward the left
        var eR = easeOut(clamp((t - rS - lDur(j)) / R_DURC, 0, 1));   // RIGHT edge — starts only after the left edge finishes; CONSTANT rate for all panels
        var tl = inset * (1 - eL) * 100;
        var tr = inset * (1 - eR) * 100;
        accRaw += widths[i];                             // explicit + integer-snapped → strips stay flush
        var snap = Math.round(accRaw);
        var bw = snap - accSnap;
        pan.style.flexGrow = "0"; pan.style.flexShrink = "0";
        pan.style.flexBasis = bw + "px";
        accSnap = snap;
        paintPanel(pan, i, bw, tl, tr, bleed);
        // RAIL TEXT: hidden through the entire rise — it only fades in once THIS panel has SETTLED
        // (its own settle window, after its rise). Plain opacity fade, no transform/clip. Reverses
        // on scroll-up (setP falls back to 0 → fades out).
        var setP = clamp((t - rS - rDur(j)) / sDur(j), 0, 1);
        var op = smooth(setP).toFixed(3);
        var tx = TXT[i];
        if (tx.num) tx.num.style.opacity = op;
        if (tx.vert) tx.vert.style.opacity = op;
        // opener's content fades in as it opens, gated by its OWN rise (eR) so it never shows
        // while still a clipped, tapered band.
        if (i === 0) {
          var c = pan.querySelector(".wpanel__content");
          var openFrac = clamp((widths[0] - per) / (G.openW - per), 0, 1);
          if (c) c.style.opacity = (openFrac * eR).toFixed(2);
        }
      });
    }

    var T = 0, lastT = 0, prepStart = 0, latched = false;  // single timed progress 0→1 + last frame stamp; reverse-handoff timer; one-shot latch
    var PREP_MS = 800;                                  // matches the .wpanel flex-basis transition (.8s)

    // ---- Cover-scroll lock --------------------------------------------------
    // The features section is pulled up 100vh (margin-top:-100svh) and rides OVER
    // the pinned blog during .writing's second (sticky) 100vh. The panel reveal,
    // though, is TIMED (DUR s) — so scrolling fast pushes features up over panels
    // that are still animating. While the reveal is playing we LOCK the scroll the
    // instant the pin reaches the top (rect.top ≤ 0 = cover-start), freezing in
    // place, and release it the moment the panels settle — so features can only
    // begin covering once the animation has finished.
    var locked = false, lockY = 0;
    var SCROLL_KEYS = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 38: 1, 40: 1 };  // space,pgup/dn,end,home,up,down
    function blockScroll(e) { e.preventDefault(); }
    function blockKeys(e) { if (SCROLL_KEYS[e.keyCode]) e.preventDefault(); }
    function clampScroll() { if (locked && window.scrollY !== lockY) window.scrollTo(0, lockY); }
    function engageLock() {
      if (locked) return; locked = true; lockY = window.scrollY;
      if (lenis) lenis.stop();
      window.addEventListener("wheel", blockScroll, { passive: false });
      window.addEventListener("touchmove", blockScroll, { passive: false });
      window.addEventListener("keydown", blockKeys, false);
      window.addEventListener("scroll", clampScroll, { passive: true });  // catch scrollbar drags too
    }
    function releaseLock() {
      if (!locked) return; locked = false;
      if (lenis) lenis.start();
      window.removeEventListener("wheel", blockScroll, { passive: false });
      window.removeEventListener("touchmove", blockScroll, { passive: false });
      window.removeEventListener("keydown", blockKeys, false);
      window.removeEventListener("scroll", clampScroll, { passive: true });
    }
    function render(now) {
      if (window.innerWidth <= 820) {
        releaseLock();                                   // never lock on mobile (no cover-scroll)
        if (settled !== null) { panels.forEach(function (p, i) {
          ["transition", "transform", "transformOrigin", "clipPath", "flexBasis", "flexGrow", "flexShrink", "height", "boxShadow"].forEach(function (k) { p.style[k] = ""; });
          if (TXT[i].vert) { TXT[i].vert.style.top = ""; TXT[i].vert.style.opacity = ""; }
          if (TXT[i].num) { TXT[i].num.style.bottom = ""; TXT[i].num.style.opacity = ""; }
          p.classList.remove("is-open");
        }); settled = null; }
        T = 0; lastT = 0;
        return;
      }
      var vh = window.innerHeight;
      var rect = section.getBoundingClientRect();
      // SINGLE THRESHOLD: as the section's top crosses the middle of the viewport (still rising
      // into view from flow) the WHOLE sequence plays on a TIMER over DUR seconds, regardless of
      // further scroll; scrolling back below it reverses.
      var triggered = rect.top <= vh * 0.5;
      if (triggered) latched = true;                               // ONE-SHOT: once it has played in, it never reverses
      if (!lastT) lastT = now;
      var dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;  // clamp dt (tab-switch safety)

      // REVERSE HANDOFF: when scrolling back up out of the live accordion with a NON-first panel
      // open, the reverse reveal (paint) assumes panel 0 is the opener — snapping there would jump.
      // First ease the open panel back to the canonical panel-0-open state (the CSS flex-basis
      // transition), holding the reverse, so it then animates backward continuously from there.
      if (settled === true && !latched) {
        var openI = -1;
        panels.forEach(function (p, i) { if (p.classList.contains("is-open")) openI = i; });
        if (openI > 0) {
          panels.forEach(function (p, i) { p.classList.toggle("is-open", i === 0); });
          if (!prepStart) prepStart = now;
        }
        if (prepStart && now - prepStart < PREP_MS) return;        // hold reverse during the ease
      }
      if (triggered) prepStart = 0;                                // re-entering forward → reset

      T = clamp(T + (latched ? 1 : -1) * dt / DUR, 0, 1);          // latched → always forward (no scroll-up reversal)

      // Hold the cover-scroll while the reveal is still playing: lock once the pin
      // reaches the top (rect.top ≤ 0), release the instant the panels settle.
      if (T < 1 && latched && rect.top <= 0) engageLock(); else if (T >= 1) releaseLock();

      if (T >= 1) { setSettled(true); return; }                    // landed → live accordion
      setSettled(false);
      paint(T);                                                    // one overlapping right→left timeline
    }

    function resize() { geom(); settled = null; }       // force a clean re-apply after a resize
    geom();
    function frame(now) { render(now || performance.now()); requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
    window.addEventListener("resize", resize, { passive: true });

    // Sticky-hover accordion — only active once settled (sequence complete).
    function open(p) { if (settled) panels.forEach(function (x) { x.classList.toggle("is-open", x === p); }); }
    panels.forEach(function (p) { p.addEventListener("mouseenter", function () { open(p); }); });
    wstack.addEventListener("mouseleave", function () { open(panels[0]); });
  })();

  /* ---------- Accordion (Services + any .faq-item) ---------- */
  document.querySelectorAll(".faq-item__header").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var content = item.querySelector(".faq-item__content");
      var isOpen = item.classList.contains("faq-item--open");
      if (isOpen) {
        item.classList.remove("faq-item--open");
        btn.setAttribute("aria-expanded", "false");
        content.style.maxHeight = "0px";
      } else {
        item.classList.add("faq-item--open");
        btn.setAttribute("aria-expanded", "true");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
  // open any item that starts open
  document.querySelectorAll(".faq-item--open .faq-item__content").forEach(function (c) {
    c.style.maxHeight = c.scrollHeight + "px";
  });

  /* ---------- Header: always visible (never hides on scroll) ---------- */
  var header = document.querySelector("header");
  if (header) header.classList.add("show");

  /* ---------- Split the top nav links into a per-letter VERTICAL REEL ----------
     Each letter is a clipped .nav-char holding two stacked copies: __a (current
     colour, on top) and __b (black, waiting just below). At the flow bg threshold
     At the flow bg threshold flow.js calls window.__navLight(true), which rolls each
     letter up (translateY -100%) so the black copy takes its place. Hire Me / Get In
     Touch are excluded (they get a different animation). */
  (function buildNavReel() {
    var LETTER_STEP = 0.015;    // per-letter stagger
    var WORD_GAP = 0.06;        // extra delay so each word starts after the one to its left
    var navClips = [], navAs = [], gi = 0, Dmax = 0;
    Array.prototype.forEach.call(document.querySelectorAll(".header__nav-left a"), function (a, w) {
      navAs.push(a);
      var text = a.textContent;
      a.setAttribute("aria-label", text);
      a.textContent = "";
      var linkClips = [];                                // this link's own letters (for the hover weight reel)
      for (var i = 0; i < text.length; i++) {
        var clip = document.createElement("span");
        clip.className = "nav-char";
        clip.setAttribute("aria-hidden", "true");
        // __col = hover roller; inside it __face (the world-flip clip: __a/__b) + __c (a same-colour
        // self-reel clone, color:inherit → always legible in either world). Hover rolls __col up to __c.
        var col  = document.createElement("span"); col.className  = "nav-char__col";
        var face = document.createElement("span"); face.className = "nav-char__face";
        var top = document.createElement("span"); top.className = "nav-char__a"; top.textContent = text[i];
        var bot = document.createElement("span"); bot.className = "nav-char__b"; bot.textContent = text[i];
        var cl  = document.createElement("span"); cl.className  = "nav-char__c"; cl.textContent  = text[i];
        face.appendChild(top); face.appendChild(bot);
        col.appendChild(face); col.appendChild(cl);
        clip.appendChild(col);
        a.appendChild(clip);
        var fd = gi * LETTER_STEP + w * WORD_GAP;        // world-flip delay (left->right, word by word)
        clip.style.setProperty("--d", fd.toFixed(3) + "s");
        clip.style.setProperty("--hd", (i * 0.022).toFixed(3) + "s");  // hover-reel stagger (local to this link)
        navClips.push({ clip: clip, fd: fd });
        linkClips.push(clip);
        if (fd > Dmax) Dmax = fd;
        gi++;
      }
      // Per-letter HOVER WEIGHT REEL: the letter under the cursor (and its neighbours, with a
      // gaussian falloff) boldens. Roboto Flex interpolates the weight; CSS transitions it snappily.
      var BASE_W = 400, PEAK_W = 900, SIGMA = 1.45;      // SIGMA in letter-units → how far the bold bleeds
      var centers = null;                                // cached letter centre-x (recomputed on enter)
      function measure() {
        centers = linkClips.map(function (cl) { var r = cl.getBoundingClientRect(); return r.left + r.width / 2; });
      }
      function paint(cx) {
        if (!centers) measure();
        // nearest letter index by cursor x → fractional, so the peak tracks between letters
        var nearest = 0, best = Infinity;
        for (var k = 0; k < centers.length; k++) { var d = Math.abs(centers[k] - cx); if (d < best) { best = d; nearest = k; } }
        for (var j = 0; j < linkClips.length; j++) {
          var dist = j - nearest;
          var f = Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));   // 1 at the hovered letter, falling off
          linkClips[j].style.setProperty("--w", Math.round(BASE_W + (PEAK_W - BASE_W) * f));
        }
      }
      a.addEventListener("pointerenter", function (e) { measure(); paint(e.clientX); });
      a.addEventListener("pointermove", function (e) { paint(e.clientX); });
      a.addEventListener("pointerleave", function () {
        for (var j = 0; j < linkClips.length; j++) linkClips[j].style.setProperty("--w", BASE_W);
      });
    });
    // Direction-aware: forward = left->right, word by word; reverse = mirror (Dmax-fd)
    // so the last letter of the last word leads and it unrolls back to the first word.
    window.__navLight = function (on, skipTheme) {
      for (var k = 0; k < navClips.length; k++) {
        var c = navClips[k];
        c.clip.style.setProperty("--d", (on ? c.fd : (Dmax - c.fd)).toFixed(3) + "s");
      }
      if (header) header.classList.toggle("header--on-light", on);
      // Hover-reel clone colour for the nav (threshold-driven, so always the opposite blue here):
      // on = light world (black text) → deep blue #231d7a (the zone-3/4 title blue); off = dark
      // world (white text) → sky blue #4d8bff. (The initial-hero same-colour reel is owned by
      // setHeaderTheme, which clears --hc during the zoom.)
      for (var n = 0; n < navAs.length; n++) navAs[n].style.setProperty("--hc", on ? "#231d7a" : "#4d8bff");
      // Flip the Hire-Me + Get-In-Touch pills to match (COLOUR only, no size change): on = light
      // world (he 0), off = dark world (he 1). skipTheme lets a caller drive the reel WITHOUT the
      // pills — the blog section does this so the pills can flip on their own, earlier, threshold.
      if (!skipTheme && window.__headerTheme) window.__headerTheme(on ? 0 : 1, true);
    };
  })();

  /* ---------- Mobile nav toggle ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileNav = document.querySelector(".mobile-nav");
  var overlay = document.querySelector(".mobile-nav__overlay");
  var closeBtn = document.querySelector(".mobile-nav__close");
  function setNav(open) {
    if (!mobileNav) return;
    document.body.classList.toggle("nav-open", open);
    mobileNav.classList.toggle("is-open", open);
    if (header) header.classList.toggle("menu-open", open);
    if (overlay) overlay.classList.toggle("show", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menuBtn) menuBtn.addEventListener("click", function () {
    setNav(!document.body.classList.contains("nav-open"));
  });
  if (closeBtn) closeBtn.addEventListener("click", function () { setNav(false); });
  if (overlay) overlay.addEventListener("click", function () { setNav(false); });
  document.querySelectorAll(".mobile-nav__item a, .mobile-nav__cta").forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); });
  });

  /* ---------- Terminal demo (features section) ---------- */
  /* SCROLL-DRIVEN: the command + a trimmed apt-install slice is revealed
     character-by-character as you scroll through the pinned .features
     section. Progress maps to a character count, so the typing tracks
     scroll exactly (reverses on scroll-up); at the end it parks at a
     blinking prompt waiting for the next command. */
  (function terminalDemo() {
    var body = document.getElementById("term-body");
    var sec = document.querySelector(".features");
    if (!body || !sec) return;
    var PROMPT =
      '<span class="term-user">vishnu@ASUS-TUF-F16-Vishnu</span>' +
      '<span class="term-path">:~</span>$ ';
    // mysql prompt (for the SELECT line, after entering the monitor)
    var MYSQL = '<span class="term-mysql">mysql&gt;</span> ';
    // type: "cmd" = bash prompt; "sql" = mysql prompt; "out" = printed line.
    // The line flagged `proj:true` renders the projects as its result set.
    var script = [
      { t: "cmd", x: "sudo apt install mysql-server -y" },
      { t: "out", x: "Reading package lists... Done" },
      { t: "out", x: "Building dependency tree... Done" },
      { t: "out", x: "The following NEW packages will be installed:" },
      { t: "out", x: "  mysql-server mysql-server-8.0 mysql-client-8.0 mysql-common" },
      { t: "out", x: "Unpacking mysql-server-8.0 ..." },
      { t: "out", x: "Setting up mysql-server-8.0 ..." },
      { t: "out", x: "mysqld is running as pid 13300" },
      { t: "cmd", x: "sudo mysql" },
      { t: "out", x: "Welcome to the MySQL monitor.  Commands end with ; or \\g." },
      { t: "sql", x: "USE portfolio;" },
      { t: "out", x: "Database changed" },
      { t: "sql", x: "SELECT * FROM projects;", proj: true }
    ];
    var PROJECTS = [
      { n: "Market Data Platform", d: "28-pipeline NSE market-data ingestion layer feeding 12+ datasets into a partitioned store.", t: ["Python", "pandas", "ETL", "SQL"], h: "projects/market-data-pipeline/index.html", img: "images/flow/data-collection.jpg" },
      { n: "Product Explorer", d: "Full-stack TypeScript app scraping a book catalog into PostgreSQL, served via Next.js with real-time WebSocket scraping.", t: ["TypeScript", "NestJS", "PostgreSQL", "Redis"], h: "projects/product-explorer/index.html", img: "images/flow/processing-storage.jpg" },
      { n: "Fraud Transaction Detection", d: "Fraud-detection model on 6.4M transactions — 95% caught at 0.995 ROC-AUC despite a 0.13% fraud rate.", t: ["Python", "scikit-learn", "pandas"], h: "projects/fraud-detection/index.html", img: "images/flow/ml-analysis.jpg" },
      { n: "Minute-Level Stock Prediction", d: "Intraday price-direction system over 9.4M NSE ticks, raising next-minute precision from 0.51 to 0.61.", t: ["Python", "scikit-learn", "Backtesting"], h: "projects/nse-stock-prediction/index.html", img: "images/flow/build-ship.jpg" }
    ];
    // Notched-corner card frame (Lando "helmet-grid" reference): base outline + a
    // brighter overlay outline that fades in on hover. Same viewBox/path as the ref.
    var F_BASE = "M8 .5h390.89a7.5 7.5 0 0 1 7.5 7.5v356.983a7.5 7.5 0 0 1-7.5 7.5H263.329a23.502 23.502 0 0 0-18.375 8.849l-16.499 20.695a22.502 22.502 0 0 1-17.593 8.473H8A7.5 7.5 0 0 1 .5 403V8A7.5 7.5 0 0 1 8 .5Z";
    var F_OVER = "M8 1h390.89a7 7 0 0 1 7 7v356.983a7 7 0 0 1-7 7H263.329a23.999 23.999 0 0 0-18.766 9.038l-16.499 20.694A21.999 21.999 0 0 1 210.862 410H8a7 7 0 0 1-7-7V8a7 7 0 0 1 7-7Z";
    function frameSvg(cls, d, w) {
      return '<span class="proj-card__frame ' + cls + '"><svg viewBox="0 0 407 411" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="' + d + '" stroke="currentColor" stroke-width="' + w + '" vector-effect="non-scaling-stroke"/></svg></span>';
    }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var esc = document.createElement("div");
    function escapeHtml(s) { esc.textContent = s; return esc.innerHTML; }
    function prefixOf(s) { return s.t === "cmd" ? PROMPT : s.t === "sql" ? MYSQL : ""; }

    // The projects result set rendered under the SELECT — reference-style cards:
    // image base, notched frame, hover-reveal wipe (clip-path ellipse), blue accent.
    function projectsHtml() {
      var rows = PROJECTS.map(function (p, n) {
        var tags = p.t.map(function (x) { return '<span class="proj-tag">' + escapeHtml(x) + "</span>"; }).join("");
        return '<a class="proj-card" href="' + p.h + '">' +
          '<span class="proj-card__media">' +
            '<img class="proj-card__img" src="' + p.img + '" alt="" loading="lazy">' +
            '<span class="proj-card__reveal">' +
              '<span class="proj-card__desc">' + escapeHtml(p.d) + "</span>" +
              '<span class="proj-tags">' + tags + "</span>" +
              '<span class="proj-card__cta">View project &rarr;</span>' +
            "</span>" +
          "</span>" +
          frameSvg("is-base", F_BASE, 2) + frameSvg("is-overlay", F_OVER, 2) +
          '<span class="proj-card__label">' +
            '<span class="proj-card__title">' + escapeHtml(p.n) + "</span>" +
            '<span class="proj-card__id">0' + (n + 1) + "</span>" +
          "</span></a>";
      }).join("");
      return '<div class="term-projects">' + rows + "</div>" +
        '<div class="term-result__meta">' + PROJECTS.length + " rows in set (0.001 sec)</div>";
    }

    // The SELECT is the last script entry; everything before it is the "pre" block.
    var selIdx = script.length - 1;
    // total characters across all lines (+1 per line = the "enter"/newline beat)
    var total = 0, i;
    for (i = 0; i < script.length; i++) total += script[i].x.length + 1;

    // Body layout: preEl (install + monitor lines) → selEl (the SELECT line) →
    // projEl (project cards, built ONCE so images don't reload/flicker). Phase 2
    // collapses+fades preEl, easing selEl to the top, and expands+fades in projEl.
    var preEl = document.createElement("div"); preEl.className = "term-pre";
    var selEl = document.createElement("div"); selEl.className = "term-sel";
    var projEl = document.createElement("div"); projEl.className = "term-result"; projEl.innerHTML = projectsHtml();
    body.appendChild(preEl); body.appendChild(selEl); body.appendChild(projEl);

    function lineHtml(pfx, text, cursor) {
      return '<div class="terminal__line">' + pfx + escapeHtml(text) + (cursor || "") + "</div>";
    }
    // Build the typed text at `reveal` chars into preEl (pre-SELECT) + selEl (SELECT).
    function renderText(reveal) {
      var pre = "", sel = "", used = 0, done = reveal >= total, k;
      for (k = 0; k < script.length; k++) {
        var s = script[k], len = s.x.length, pfx = prefixOf(s), into;
        if (used + len <= reveal) {                       // whole line shown
          var cur = "";
          if (used + len + 1 > reveal && !done) cur = '<span class="term-cursor"></span>'; // in the newline gap
          into = lineHtml(pfx, s.x, k === selIdx ? '<span class="term-cursor is-blink"></span>' : cur);
          if (k === selIdx) sel += into; else pre += into;
          used += len + 1;
          if (cur) break;
        } else {                                          // partially typed (live) line
          var part = s.x.slice(0, Math.max(0, reveal - used));
          into = lineHtml(pfx, part, '<span class="term-cursor"></span>');
          if (k === selIdx) sel += into; else pre += into;
          break;
        }
      }
      preEl.innerHTML = pre;
      selEl.innerHTML = sel;
    }

    var term = body.closest(".terminal");

    if (reduce) { renderText(total); term.classList.add("is-revealing"); return; }

    // Scroll model. The section slides UP from the bottom: rect.top travels from
    // +vh (appearing) → 0 (reaches the top / fully covers) → −(height−vh) (past).
    //  • Phase 1 is SCROLL-DRIVEN: rect.top 6/7·vh → 0 types the whole script; at
    //    full cover the last line is `mysql> SELECT * FROM projects;` (no projects).
    //  • Reaching the top (rect.top ≤ 0) is a THRESHOLD that fires a TIMED (not
    //    scroll-based) CSS reveal: the pre-lines fade+collapse so SELECT eases to
    //    the top, then the project cards come in (transition-delay). Scrolling back
    //    above the threshold reverses it.
    var raf = 0, lastR = -1, atTop = false;
    function update() {
      raf = 0;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var typeStart = vh * (6 / 7);
      var typeT = Math.min(1, Math.max(0, (typeStart - r.top) / (typeStart - 0)));
      var reveal = Math.round(typeT * total);
      if (reveal !== lastR) { lastR = reveal; renderText(reveal); }
      var top = r.top <= 0;                               // threshold: terminal reached the top
      if (top !== atTop) { atTop = top; term.classList.toggle("is-revealing", top); }
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  })();

  /* ---------- Flow journey ---------- */
  /* The flow section's three.js parallax journey lives in flow.js,
     loaded only on pages that contain .flow. */

  /* Vanta NET background is initialised inline in index.html (#vanta-bg). */
})();
