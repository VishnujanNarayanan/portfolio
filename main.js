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
      if (heroImg) heroImg.style.filter = "grayscale(" + e + ") brightness(" + (1 - 0.25 * e) + ")";
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

  /* ---------- Global background: animated topographic lime contours ----------
     One fixed full-viewport plane shared by the hero zoom-out reveal AND the flow
     section (so they read as the same continuous background). The contours are
     iso-lines (marching squares) of a moving scalar field built from drifting,
     pulsing metaballs — so they are CLOSED loops, never overlap (iso-lines of one
     field can't cross), and grow / shrink / vanish as the blobs pulse and move. */
  (function () {
    var cv = document.createElement("canvas");
    cv.id = "bg-contours";
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, DPR = 1, CELL = 26, cols = 0, rows = 0, field = [];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    // Drifting metaballs: each has a base position, an orbit, a radius and a pulse.
    var BLOBS = [];
    function seedBlobs() {
      BLOBS = [];
      for (var i = 0; i < 7; i++) {
        BLOBS.push({
          bx: Math.random(), by: Math.random(),
          ox: 0.12 + Math.random() * 0.22, oy: 0.12 + Math.random() * 0.22,
          sx: 0.06 + Math.random() * 0.12, sy: 0.06 + Math.random() * 0.12,
          px: Math.random() * 6.28, py: Math.random() * 6.28,
          r: 0.16 + Math.random() * 0.14,           // radius (fraction of min dim)
          pulse: 0.5 + Math.random() * 0.9,          // pulse speed → blobs fade in/out
          pph: Math.random() * 6.28
        });
      }
    }
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
    }
    seedBlobs(); resize();
    window.addEventListener("resize", resize, { passive: true });
    var LEVELS = [0.18, 0.3, 0.42, 0.56, 0.72, 0.9];   // iso-levels → nested contours
    function lerp(a, b, t) { return a + (b - a) * t; }
    var t = 0, last = 0;
    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
      t += dt * 0.4;                                     // slow, gentle drift
      var md = Math.min(W, H);
      // 1) sample the scalar field on the grid
      var bx = [], by = [], br = [], bw = [], i, c, r;
      for (i = 0; i < BLOBS.length; i++) {
        var b = BLOBS[i];
        bx[i] = (b.bx + Math.cos(t * b.sx * 6.28 + b.px) * b.ox) * W;
        by[i] = (b.by + Math.sin(t * b.sy * 6.28 + b.py) * b.oy) * H;
        br[i] = b.r * md;
        bw[i] = 0.55 + 0.45 * Math.sin(t * b.pulse + b.pph); // pulsing weight (→ vanish)
      }
      for (r = 0; r <= rows; r++) {
        field[r] = field[r] || [];
        for (c = 0; c <= cols; c++) {
          var px = c * CELL, py = r * CELL, sum = 0;
          for (i = 0; i < BLOBS.length; i++) {
            var dx = px - bx[i], dy = py - by[i], rr = br[i];
            sum += bw[i] * Math.exp(-(dx * dx + dy * dy) / (2 * rr * rr));
          }
          field[r][c] = sum;
        }
      }
      // 2) marching squares per iso-level → closed, non-overlapping contours
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (var li = 0; li < LEVELS.length; li++) {
        var lv = LEVELS[li];
        ctx.beginPath();
        for (r = 0; r < rows; r++) {
          for (c = 0; c < cols; c++) {
            var x0 = c * CELL, y0 = r * CELL, x1 = x0 + CELL, y1 = y0 + CELL;
            var tl = field[r][c], tr = field[r][c + 1], br2 = field[r + 1][c + 1], bl = field[r + 1][c];
            var idx = (tl > lv ? 8 : 0) | (tr > lv ? 4 : 0) | (br2 > lv ? 2 : 0) | (bl > lv ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            // edge crossing points (linear interp)
            var T = { x: lerp(x0, x1, (lv - tl) / (tr - tl)), y: y0 };
            var R = { x: x1, y: lerp(y0, y1, (lv - tr) / (br2 - tr)) };
            var B = { x: lerp(x0, x1, (lv - bl) / (br2 - bl)), y: y1 };
            var L = { x: x0, y: lerp(y0, y1, (lv - tl) / (bl - tl)) };
            function seg(a, b2) { ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); }
            switch (idx) {
              case 1: case 14: seg(L, B); break;
              case 2: case 13: seg(B, R); break;
              case 3: case 12: seg(L, R); break;
              case 4: case 11: seg(T, R); break;
              case 6: case 9:  seg(T, B); break;
              case 7: case 8:  seg(L, T); break;
              case 5:  seg(L, T); seg(B, R); break;
              case 10: seg(L, B); seg(T, R); break;
            }
          }
        }
        ctx.strokeStyle = "rgba(210,255,0,0.3)";          // uniform colour…
        ctx.lineWidth = 0.7;                              // …and uniform, thin width
        ctx.stroke();
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
