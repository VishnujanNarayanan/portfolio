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
      sizeCanvas(cv, ctx); if (hcv) sizeCanvas(hcv, hctx);
      cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
    }
    seedBlobs(); resize();
    window.addEventListener("resize", resize, { passive: true });
    var LEVELS = [0.22, 0.36, 0.52, 0.7];              // fewer, rounded nested loops
    function lerp(a, b, t) { return a + (b - a) * t; }
    // marching squares over the shared field → closed, non-overlapping contours
    function drawContours(g, stroke) {
      g.clearRect(0, 0, W, H);
      g.lineCap = "round"; g.lineJoin = "round";
      g.strokeStyle = stroke; g.lineWidth = 0.45;
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
    var t = 0, last = 0;
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
      drawContours(ctx, "rgba(77,139,255,0.3)");          // global: blue
      if (hctx) drawContours(hctx, "#969ba8");           // hero: same blue-grey as end bg → lines vanish at full zoom
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
