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

    // Hero exit is a scroll-SCRUBBED zoom-out (Lando-style), in two phases, no fade:
    //   Phase 1 (0 → ZOOM_END): the fixed hero stays pinned and its content scales
    //     DOWN (camera pulling back) from 1 to EXIT_MIN_SCALE. It never fades.
    //   Phase 2 (past ZOOM_END): once the zoom is done the hero un-pins and rides
    //     UP with the page (translateY tracks scroll) so it scrolls off the top,
    //     handing over to the flow below.
    // Purely scroll-linked, so scrolling back up reverses it exactly. The 3D text
    // entrance still plays on load at scroll 0 (scale 1, no transform on .hero).
    var heroContent = hero.querySelector(".hero__content");
    var heroImg = hero.querySelector(".hero__bg");  // the (light gradient) image that greys out
    var scrollCue = hero.querySelector(".hero__scroll-btn");  // vanishes (reverse of its entrance) on scroll
    // Header pieces that react to the zoom-out (color flip + shrink-to-edges).
    var hdr        = document.querySelector("header");
    var navLeft    = hdr && hdr.querySelector(".header__nav-left");
    var navRight   = hdr && hdr.querySelector(".header__nav-right");
    var navTexts   = hdr ? hdr.querySelectorAll(".header__nav-left a, .pill-btn--glass .pill-btn-span") : [];
    var darkPill   = hdr && hdr.querySelector(".pill-btn--dark");
    var darkPillTx = darkPill && darkPill.querySelector(".pill-btn-span");
    var EXIT_MIN_SCALE = 0.38;      // how far the whole page-rectangle recedes (smaller = more zoom-out)
    function updateHeroExit() {
      var vh = window.innerHeight;
      var ZOOM_END = vh;                             // zoom completes over one viewport
      var y = window.scrollY;
      var p = Math.max(0, Math.min(y / ZOOM_END, 1)); // zoom progress 0 → 1
      var e = p * p * (3 - 2 * p);                    // smoothstep
      var scale = 1 - (1 - EXIT_MIN_SCALE) * e;       // 1 → EXIT_MIN_SCALE (no opacity change)
      // Scale the WHOLE hero so it shrinks as a rectangle from all edges toward the
      // viewport CENTRE (origin 50% 50%) — the finished image sits dead-centre with an
      // equal flow-bg gap on every side.
      var originY = 0.5 * vh;
      // Phase 2: after the zoom, the hero scrolls up with the page (rides off the top).
      var lift = Math.max(0, y - ZOOM_END);
      if (heroContent) heroContent.style.transform = "";
      hero.style.transformOrigin = "50% " + originY + "px";
      hero.style.transform = "translateY(" + (-lift) + "px) scale(" + scale + ")";
      // The further it zooms out, the greyer the image gets (desaturate + dim toward grey).
      // Hero background crossfades from the light-blue gradient → a clean grey, so at the
      // end of the zoom it matches the grey contour lines (deterministic, not a greyscaled blue).
      if (heroImg) {
        var ga = 1 - e;                                  // gradient alpha fades out
        heroImg.style.backgroundColor = "#969ba8";       // blue-grey (theme tint) it lands on
        heroImg.style.backgroundImage =
          "linear-gradient(180deg,rgba(236,240,248," + ga + ") 0%,rgba(242,245,250," + ga + ") 55%,rgba(248,250,253," + ga + ") 100%)";
      }
      // Scroll cue plays its entrance in reverse the moment scrolling starts.
      if (scrollCue) scrollCue.classList.toggle("is-exiting", y > 0);

      // Header reacts to the zoom-out (driven by the same progress e):
      //  - text colour flips white → black (opposite colour) as the light flow bg appears;
      //  - the left nav + right CTAs SHRINK in place, anchored to their page edges,
      //    instead of the header sliding up and vanishing;
      //  - the dark "Get In Touch" pill inverts its bg (dark → light) so it stays legible.
      // Header reaches its end state faster — over 2/5 of the zoom scroll distance.
      var hp = Math.max(0, Math.min(y / (ZOOM_END * 0.4), 1));
      var he = hp * hp * (3 - 2 * hp);                   // smoothstep
      // Hero is LIGHT at the top, world is DARK after zoom-out → flip nav/Hire-Me text
      // black → white. The dark "Get In Touch" pill goes the opposite way (its bg lightens
      // dark → light while its text darkens white → black) so it stays legible throughout.
      var c = Math.round(255 * he);                      // 0 (black) → 255 (white)
      var rgb = "rgb(" + c + "," + c + "," + c + ")";
      navTexts.forEach(function (t) { t.style.color = rgb; });
      var hs = 1 - 0.12 * he;                            // shrink 1 → 0.88 (subtle)
      if (navLeft)  { navLeft.style.transformOrigin  = "left center";  navLeft.style.transform  = "scale(" + hs + ")"; }
      if (navRight) { navRight.style.transformOrigin = "right center"; navRight.style.transform = "scale(" + hs + ")"; }
      if (darkPill) {                                    // dark #050419 → light #d0e1eb
        var dr = Math.round(5 + (208 - 5) * he), dg = Math.round(4 + (225 - 4) * he), db = Math.round(25 + (235 - 25) * he);
        darkPill.style.backgroundColor = "rgb(" + dr + "," + dg + "," + db + ")";
      }
      if (darkPillTx) { var c2 = Math.round(255 * (1 - he)); darkPillTx.style.color = "rgb(" + c2 + "," + c2 + "," + c2 + ")"; }
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
      marquee.style.opacity = Math.max(0, Math.min(y / (vh * 0.55), 1));
      // Phase 1 (still zooming, y < vh): stay put. Phase 2 (zoom done): ride UP with the hero.
      var lift = Math.max(0, y - vh);
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
    // Light→dark wash shared by the blog canvas AND the Selected-work canvas. The transition is a
    // single band in VIEWPORT space (t0 = blog top → t1 = partway into Selected work); each section
    // samples it by its own on-screen position, so the fade is ONE continuous, gradual ramp that
    // spans the whole blog and spills into the next section (no per-section restart, no hard corner).
    // bg: zone-4 light blue → zone-1 navy. ln: dark indigo lines → light-blue lines (the inversion).
    function washGrad(g, secTop, spanH, t0, t1) {
      var bg = g.createLinearGradient(0, 0, 0, spanH);            // fill: canvas-local 0..spanH
      var ln = g.createLinearGradient(0, secTop, 0, secTop + spanH);  // lines: section-anchored in translated space
      var S = 20, i, span = (t1 - t0) || 1;
      for (i = 0; i <= S; i++) {
        var p = i / S, Y = secTop + p * spanH;                    // this stop's viewport y
        var er = (Y - t0) / span; er = er < 0 ? 0 : er > 1 ? 1 : er;
        var ss = er * er * er * (er * (er * 6 - 15) + 10);        // smootherstep…
        var e = ss * ss * (3 - 2 * ss);                          // …∘ smoothstep → very gentle ends
        bg.addColorStop(p, "rgb(" + Math.round(lerp(208, 27, e)) + "," +
          Math.round(lerp(225, 34, e)) + "," + Math.round(lerp(235, 54, e)) + ")");
        ln.addColorStop(p, "rgba(" + Math.round(lerp(57, 77, e)) + "," +
          Math.round(lerp(50, 139, e)) + "," + Math.round(lerp(220, 255, e)) + "," +
          lerp(0.5, 0.45, e).toFixed(3) + ")");
      }
      return { bg: bg, ln: ln };
    }
    var t = 0, last = 0, navDark = false;   // navDark = the re-darkened world has rolled the nav back to white
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
      // Shared light→dark band, in viewport space: starts at the BLOG top (t0), finishes full-dark
      // ~35% INTO the Selected-work section (t1 = features top + 0.35·H → the dark point lands at
      // ~135% of the blog height). Both the blog canvas and the Selected-work canvas sample this one
      // band, so the fade is a single continuous ramp that spills gradually into the next section.
      var t0 = writingPin ? writingPin.getBoundingClientRect().top : 0;
      var t1 = (darkSecs.length ? darkSecs[0].el.getBoundingClientRect().top : t0 + H) + H * 0.35;
      // Top nav reel: once 70% of the BLOG section has scrolled past the fixed header, roll
      // Projects/Skills/Services/Blog back to white with the SAME per-letter ripple the flow uses
      // (window.__navLight). Threshold-fired + reverses on scroll-up. (t0 = blog top; it reaches
      // -H once the blog has fully scrolled by, so -t0/H is the blog's scroll progress.)
      var blogProg = (0 - t0) / (H || 1);
      var wantDark = blogProg >= 0.70;
      if (wantDark !== navDark) {
        navDark = wantDark;
        if (window.__navLight) window.__navLight(!navDark);  // dark world → white nav (on-light = false)
      }
      if (wctx && writingPin) {
        var wtop = writingPin.getBoundingClientRect().top;
        var ws = washGrad(wctx, wtop, H, t0, t1);
        drawContours(wctx, ws.ln, ws.bg, -wtop);
      }
      // Dark content sections (Selected work / Skills / Services), viewport-aligned & continuous.
      // Selected work straddles the band (its top still lightening); Skills/Services are past it →
      // washGrad resolves to solid zone-1 navy + light-blue lines for them.
      for (var ds = 0; ds < darkSecs.length; ds++) {
        var sec = darkSecs[ds], sr = sec.el.getBoundingClientRect();
        if (sr.bottom <= 0 || sr.top >= H) continue;       // off-screen → skip (cheap)
        var sh = sec.el.offsetHeight;
        if (sec.w !== W || sec.h !== sh) {                  // (re)size to the whole section box
          sec.w = W; sec.h = sh;
          sec.cv.width = W * DPR; sec.cv.height = sh * DPR;
          sec.cv.style.width = W + "px"; sec.cv.style.height = sh + "px";
          sec.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        var sg = sec.ctx, dw = washGrad(sg, sr.top, sh, t0, t1);
        sg.clearRect(0, 0, W, sh);
        sg.fillStyle = dw.bg; sg.fillRect(0, 0, W, sh);
        sg.save(); sg.translate(0, -sr.top);                // viewport-align the field
        sg.lineCap = "round"; sg.lineJoin = "round";
        sg.strokeStyle = dw.ln; sg.lineWidth = 0.45;
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
    function render(now) {
      if (window.innerWidth <= 820) {
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
    var navClips = [], gi = 0, Dmax = 0;
    Array.prototype.forEach.call(document.querySelectorAll(".header__nav-left a"), function (a, w) {
      var text = a.textContent;
      a.setAttribute("aria-label", text);
      a.textContent = "";
      for (var i = 0; i < text.length; i++) {
        var clip = document.createElement("span");
        clip.className = "nav-char";
        clip.setAttribute("aria-hidden", "true");
        var top = document.createElement("span"); top.className = "nav-char__a"; top.textContent = text[i];
        var bot = document.createElement("span"); bot.className = "nav-char__b"; bot.textContent = text[i];
        clip.appendChild(top); clip.appendChild(bot);
        a.appendChild(clip);
        var fd = gi * LETTER_STEP + w * WORD_GAP;        // forward delay (left->right, word by word)
        clip.style.setProperty("--d", fd.toFixed(3) + "s");
        navClips.push({ clip: clip, fd: fd });
        if (fd > Dmax) Dmax = fd;
        gi++;
      }
    });
    // Direction-aware: forward = left->right, word by word; reverse = mirror (Dmax-fd)
    // so the last letter of the last word leads and it unrolls back to the first word.
    window.__navLight = function (on) {
      for (var k = 0; k < navClips.length; k++) {
        var c = navClips[k];
        c.clip.style.setProperty("--d", (on ? c.fd : (Dmax - c.fd)).toFixed(3) + "s");
      }
      if (header) header.classList.toggle("header--on-light", on);
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

  /* ---------- Flow journey ---------- */
  /* The flow section's three.js parallax journey lives in flow.js,
     loaded only on pages that contain .flow. */

  /* Vanta NET background is initialised inline in index.html (#vanta-bg). */
})();
