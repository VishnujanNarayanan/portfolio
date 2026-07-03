/* ============================================================
   Flow — three.js parallax journey (rewritten 2026-06-16)
   The flow section is a horizontal, scroll-driven journey of four
   stages. Vertical scroll inside the 500vh section translates a
   sticky horizontal track; a transparent three.js canvas renders
   the 3D depth scene (a focal form per stage + an indigo particle
   field) that parallaxes as the camera dollies along the journey.
   DOM carries the crisp content (titles, cards) and the wavy
   journey spine pinned at the bottom.
   Vanilla JS. Loaded with defer; no-ops on pages without .flow.
   ============================================================ */
(function () {
  "use strict";

  var flow = document.querySelector(".flow");
  if (!flow) return;

  var isMobile = window.matchMedia("(max-width: 820px)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DEBUG = /[?&]debug/.test(location.search);   // ?debug → on-screen GL diagnostics
  var dbg = null;

  var wrapper = flow.querySelector(".flow__wrapper");
  var track = flow.querySelector(".flow__track");
  var sky = flow.querySelector(".flow__sky");
  var panels = Array.prototype.slice.call(flow.querySelectorAll(".flow-panel"));
  var journey = flow.querySelector(".flow-journey");
  var nodeEls = Array.prototype.slice.call(flow.querySelectorAll(".flow-journey__node"));
  var lineEl = flow.querySelector(".flow-journey__line");
  var fillEl = flow.querySelector(".flow-journey__fill");
  var nodesEl = flow.querySelector(".flow-journey__nodes");
  var hdr = document.querySelector("header");   // top nav flips to black at the bg threshold
  var N = panels.length || 4;

  // Terminal — the "cd highlights" prompt pinned top-left. It types out as the
  // section scrolls INTO place (over the approach); typing completes exactly as
  // the section pins ("in place"), which is the single threshold where the old
  // command line vanishes, a fresh prompt appears in the new directory, and
  // zone 1's cards + text reveal.
  var CD_CMD = "cd highlights";
  var cdCmdEl  = flow.querySelector(".flow__cd-cmd");
  var cdCaret1 = flow.querySelector(".flow__cd-caret--1");  // caret on the command line
  var cdRow2   = flow.querySelector(".flow__cd-row--2");    // the new-directory prompt
  var cdTypedN = -1, cdRan = null;
  function driveTerminal(typeP, run) {
    if (!cdCmdEl) return;
    var n = Math.round(clamp(typeP, 0, 1) * CD_CMD.length);
    if (n !== cdTypedN) { cdTypedN = n; cdCmdEl.textContent = CD_CMD.slice(0, n); }
    if (run !== cdRan) {
      cdRan = run;
      // Like pressing Enter: the typed command LINE STAYS; the caret leaves it and a
      // fresh prompt appears on a new line in the new directory, blinking there.
      if (cdCaret1) cdCaret1.style.display = run ? "none" : "";
      if (cdRow2) cdRow2.hidden = !run;
    }
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  // A panel's grid offset (_coff) as it was delayMs ago, read from a short history
  // ring — used to give one card column a true time-delayed entrance at the swap.
  function coffDelayed(panel, delayMs, now) {
    var h = panel._coffHist;
    if (!h || !h.length) return panel._coff;
    var tt = now - delayMs;
    for (var i = h.length - 1; i >= 0; i--) { if (h[i].t <= tt) return h[i].v; }
    return h[0].v;
  }

  /* ---------- Zone-title poses ----------
     A title pose = where the .flow-panel__content sits relative to its rest spot:
       ex  extra px slide on X (the mid slide-in layered onto the appear)
       sx  translate %        tx/ty translate3d px      ry/rx rotateY/rotateX deg
     REST = identity. APPEAR = the hero entrance origin (3D, bottom-right).
     EXIT = the hero fly-out target (opposite corner). */
  function buildPoses(vw) {
    return {
      REST: { ex: 0, sx: 0, tx: 0, ty: 0, ry: 0, rx: 0 },
      APPEAR: { ex: vw * 0.22, sx: 50, tx: -222.2, ty: 88, ry: 60, rx: 35 },
      EXIT: { ex: 0, sx: -50, tx: 222.2, ty: -88, ry: 60, rx: 35 }
    };
  }
  function lerpPose(a, b, t) {
    return {
      ex: lerp(a.ex, b.ex, t), sx: lerp(a.sx, b.sx, t), tx: lerp(a.tx, b.tx, t),
      ty: lerp(a.ty, b.ty, t), ry: lerp(a.ry, b.ry, t), rx: lerp(a.rx, b.rx, t)
    };
  }
  function poseStr(base, p) {
    return base + " translateX(" + p.ex + "px) perspective(1000px) translate(" + p.sx +
      "%) translate3d(" + p.tx + "px," + p.ty + "px,0) rotateY(" + p.ry + "deg) rotateX(" + p.rx + "deg)";
  }
  // Hybrid entrance pose: the APPEAR 3D part (sx/tx/ty/ry/rx) resolved by factor f
  // (1=full → 0=resolved), the horizontal slide from mid (mx) to rest by factor s.
  function scrollPose(src, mx, f, s) {
    return {
      ex: lerp(mx, 0, s), sx: f * src.sx, tx: f * src.tx,
      ty: f * src.ty, ry: f * src.ry, rx: f * src.rx
    };
  }
  // Scroll-driven slide factor: stays at mid until d=-0.5+GAP, slides mid→rest by
  // d=0, then sticky. (The 3D appear + the exit are TIMED, fired at the threshold.)
  function slideFactor(d) {
    var GAP = 0.05;
    return smooth(clamp((d + 0.5 - GAP) / (0.5 - GAP), 0, 1));
  }
  // A panel's live title pose right now: interpolated if a timed _anim is in
  // flight, else the steady pose for its side of the active index. Lets a new
  // animation capture the current pose as its `from` so a mid-flight reversal
  // doesn't jump.
  function poseOf(panel, P, activeIdx, pi) {
    var a = panel._anim;
    if (a) {
      var el = Date.now() - a.t0 - a.delay;
      if (el < 0) return a.from;
      return lerpPose(a.from, a.to, easeOut(clamp(el / a.dur, 0, 1)));
    }
    return pi === activeIdx ? P.REST : (pi < activeIdx ? P.EXIT : P.APPEAR);
  }

  /* ---------- Sky hue cross-fade between stages ---------- */
  // All four zones share ONE gradient anchored to the hero's Vanta background
  // (rgb 208,225,235 = 0xd0e1eb) so hero→flow and zone→zone have no shade step.
  // TOP (viewport top, the hero seam) is exactly the hero colour; it eases a
  // touch lighter toward the bottom for soft depth — identical across zones.
  var TOP = [[208, 225, 235], [208, 225, 235], [208, 225, 235], [208, 225, 235]];
  var MID = [[223, 233, 242], [223, 233, 242], [223, 233, 242], [223, 233, 242]];
  var BOT = [[238, 243, 248], [238, 243, 248], [238, 243, 248], [238, 243, 248]];
  function rgb(c1, c2, t) {
    return "rgb(" + Math.round(lerp(c1[0], c2[0], t)) + "," +
      Math.round(lerp(c1[1], c2[1], t)) + "," + Math.round(lerp(c1[2], c2[2], t)) + ")";
  }
  function paintSky(g) {
    var i0 = clamp(Math.floor(g), 0, N - 1), i1 = clamp(i0 + 1, 0, N - 1), t = g - i0;
    sky.style.background = "linear-gradient(180deg," +
      rgb(TOP[i0], TOP[i1], t) + " 0%," + rgb(MID[i0], MID[i1], t) + " 55%," +
      rgb(BOT[i0], BOT[i1], t) + " 100%)";
  }

  /* ---------- Floating cards: fly-in / rest / fly-out ---------- */
  var DIRS = {
    "top": [0, -1], "bottom": [0, 1], "left": [-1, 0], "right": [1, 0],
    "top-left": [-0.8, -0.8], "top-right": [0.8, -0.8],
    "bottom-left": [-0.8, 0.8], "bottom-right": [0.8, 0.8]
  };
  var cards = [];
  panels.forEach(function (panel, pi) {
    Array.prototype.slice.call(panel.querySelectorAll(".flow-card")).forEach(function (el, ci) {
      cards.push({
        el: el, panel: pi,
        from: DIRS[el.dataset.from] || [1, 0],
        to: DIRS[el.dataset.to] || [-1, 0],
        depth: parseFloat(el.dataset.depth) || 0.3,
        tilt: parseFloat(el.dataset.tilt) || 0,
        stagger: ci * 0.022,
        fp: 3 + (ci % 3), ph: Math.random() * Math.PI * 2,
        cx: 0, cy: 0, init: false
      });
    });
  });
  /* ---------- Per-stage cards (the GL "image" replaced by 4 square cards) ----------
     Each stage shows a 2x2 grid of square cards reusing the Projects-section
     .proj-card look (notched frame + hover reveal + blue activation). Hovering a
     card OR its matching text item in .flow-panel__list activates BOTH (the
     .is-active class mirrors the card's :hover). Built here from CARD_DATA so the
     verbose frame SVG isn't duplicated 16× in the HTML. */
  var IMG = {
    dc: "images/flow/data-collection.jpg", ps: "images/flow/processing-storage.jpg",
    ml: "images/flow/ml-analysis.jpg", bs: "images/flow/build-ship.jpg"
  };
  var CARD_DATA = [
    [ // 01 Browser Automation
      { k: "p", n: "Market Data Platform", img: IMG.dc, d: "28-pipeline NSE ingestion layer feeding 12+ datasets.", t: ["Python", "Playwright", "ETL"], href: "projects/market-data-pipeline/index.html" },
      { k: "p", n: "Job Application Bot", img: IMG.dc, d: "Scrapes Indeed, Glassdoor & LinkedIn; tailors a resume per match.", t: ["Python", "Playwright", "FastAPI"] },
      { k: "p", n: "Product Explorer", img: IMG.ps, d: "Crawlee/Playwright scraper streaming a catalog over WebSockets.", t: ["Crawlee", "Playwright", "NestJS"], href: "projects/product-explorer/index.html" },
      { k: "b", n: "Scraping 20 Years of NSE Filings", d: "Beating bot defenses to backfill two decades of insider filings.", t: ["Scraping", "Playwright"], href: "blog/how-i-scraped-nse-insider-filings/index.html" }
    ],
    [ // 02 Applied ML
      { k: "p", n: "Fraud Detection", img: IMG.ml, d: "95% of fraud caught at 0.995 ROC-AUC on 6.4M transactions.", t: ["scikit-learn", "pandas"], href: "projects/fraud-detection/index.html" },
      { k: "p", n: "Minute-Level Stock Prediction", img: IMG.bs, d: "Next-minute price direction over 9.4M NSE ticks.", t: ["scikit-learn", "Backtesting"], href: "projects/nse-stock-prediction/index.html" },
      { k: "p", n: "Trader Sentiment Analysis", img: IMG.dc, d: "Fear & Greed sentiment vs trader PnL across 211K crypto trades.", t: ["pandas", "SciPy"], href: "https://github.com/VishnujanNarayanan/Trader_sentiment_analysis", ext: true },
      { k: "b", n: "Next-Minute Price Direction", d: "Features, leakage traps, and honest backtests on 9.4M ticks.", t: ["Quant", "ML"], href: "blog/minute-level-stock-prediction/index.html" }
    ],
    [ // 03 Cloud & DevOps
      { k: "p", n: "DekhLaw Platform", img: IMG.bs, d: "Production legal-tech on Railway/Vercel — Docker, self-healing schema.", t: ["Railway", "Docker", "PostgreSQL"] },
      { k: "p", n: "Job Application Bot", img: IMG.dc, d: "Dockerized pipeline on AWS & GCP, Postgres on Neon.", t: ["Docker", "AWS", "GCP"] },
      { k: "b", n: "Zero-Downtime Deploys", d: "Rolling restarts for background workers without dropping jobs.", t: ["DevOps", "Deploy"], href: "blog/index.html" },
      { k: "b", n: "Rate Limiting with Redis", d: "Tiered limits that curb abuse without hurting real users.", t: ["Redis", "Backend"], href: "blog/index.html" }
    ],
    [ // 04 Web & API Endpoints
      { k: "p", n: "DekhLaw API", img: IMG.bs, d: "~30 Express endpoints, JWT auth, and Twilio voice orchestration.", t: ["Express", "Twilio", "JWT"] },
      { k: "p", n: "Law Firm Website", img: IMG.ps, d: "Next.js 14 site — 14 routes, Resend lead capture, full SEO.", t: ["Next.js", "TypeScript", "Resend"] },
      { k: "p", n: "Professional Directory App", img: IMG.ps, d: "React Native across 12 screens over a FastAPI REST service.", t: ["React Native", "FastAPI"], href: "https://github.com/VishnujanNarayanan/professional-directory-app", ext: true },
      { k: "b", n: "Idempotent Webhook Handlers", d: "Exactly-once effects from at-least-once delivery.", t: ["Backend", "APIs"], href: "blog/index.html" }
    ]
  ];
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function cardHtml(c, i, idStr) {
    var tags = c.t.map(function (x) { return '<span class="proj-tag">' + esc(x) + "</span>"; }).join("");
    var cta = c.k === "b" ? "Read →" : (c.href ? (c.ext ? "View code ↗" : "View project →") : "Project");
    var face = c.k === "b"
      ? '<span class="proj-card__shot" aria-hidden="true"></span>'
      : '<img class="proj-card__img" src="' + c.img + '" alt="" loading="lazy">';
    var openA = c.href ? '<a class="proj-card__media" href="' + c.href + '"' + (c.ext ? ' target="_blank" rel="noopener"' : "") + ">" : '<span class="proj-card__media">';
    var closeA = c.href ? "</a>" : "</span>";
    return '<div class="proj-card flow-pcard' + (c.k === "b" ? " proj-card--blog" : "") + '" data-card="' + i + '">' +
      openA + face +
        '<span class="proj-card__reveal"><span class="proj-card__desc">' + esc(c.d) + "</span>" +
          '<span class="proj-tags">' + tags + "</span>" +
          '<span class="proj-card__cta">' + cta + "</span></span>" +
      closeA +
      '<span class="proj-card__label"><span class="proj-card__id">' + idStr + "</span>" +
        '<span class="proj-card__title">' + esc(c.n) + "</span></span>" +
    "</div>";
  }
  Array.prototype.slice.call(flow.querySelectorAll(".flow-panel__cards")).forEach(function (grid) {
    var pi = parseInt(grid.getAttribute("data-panel"), 10) || 0;
    var data = CARD_DATA[pi] || [];
    grid.innerHTML = data.map(function (c, i) {
      return cardHtml(c, i, ("0" + (pi + 1)) + "." + (i + 1));
    }).join("");
  });
  // Hover coupling — hovering a card OR its matching text item activates BOTH (the
  // .is-active class mirrors the card's :hover). The cards are transformed EVERY frame
  // (cursor parallax + the horizontal scroll-slide) and their pointer-events toggle on
  // and off per active stage, so per-element pointerenter/pointerleave miss transitions:
  // a card slides under, or out from, a near-stationary cursor — or its pointer-events
  // flip — without the pointer ever crossing an element boundary, leaving hovers stuck
  // or never firing. Instead HIT-TEST the live geometry: read what's actually under the
  // cursor on each pointer move AND each render frame (refreshHover in loop()), so the
  // active pair always tracks the card that's really beneath the cursor right now.
  function applyActive(panel, idx, on) {
    var els = panel.querySelectorAll('.flow-panel__item[data-card="' + idx + '"], .flow-panel__cards .proj-card[data-card="' + idx + '"]');
    Array.prototype.forEach.call(els, function (el) { el.classList.toggle("is-active", on); });
  }
  var hoverPanel = null, hoverIdx = -1, hoverX = -1, hoverY = -1;
  function refreshHover() {
    var host = null;
    if (hoverX >= 0) {
      var el = document.elementFromPoint(hoverX, hoverY);
      host = el && el.closest ? el.closest("[data-card]") : null;
      if (host && !flow.contains(host)) host = null;       // ignore data-card outside the flow
    }
    var panel = host ? host.closest(".flow-panel") : null;
    var idx = host ? +host.getAttribute("data-card") : -1;
    if (panel === hoverPanel && idx === hoverIdx) return;   // no change
    if (hoverPanel && hoverIdx >= 0) applyActive(hoverPanel, hoverIdx, false); // clear the old pair
    if (panel && idx >= 0) applyActive(panel, idx, true);   // activate the new pair
    hoverPanel = panel; hoverIdx = idx;
  }
  window.addEventListener("pointermove", function (e) {
    hoverX = e.clientX; hoverY = e.clientY; refreshHover();
  }, { passive: true });
  window.addEventListener("pointerleave", function () {     // cursor left the window
    hoverX = hoverY = -1; refreshHover();
  }, { passive: true });
  // Staggered columns + cursor parallax (like the reference nav images, whose two
  // columns sit offset by ±2.25rem and drift with the mouse). Each card carries a
  // per-COLUMN baseY offset (left col up, right col down) so it's not a flat grid, plus
  // a DEPTH so it drifts toward the cursor by a different amount. Both are folded into
  // the card's own transform (the .flow-panel__cards container still owns the slide).
  var pcardList = [];
  panels.forEach(function (panel) {
    Array.prototype.slice.call(panel.querySelectorAll(".flow-panel__cards .flow-pcard")).forEach(function (el, i) {
      // dir matches the reference: left column y = −p, right column y = +p.
      // panel = owning stage (for the grid's _coff slide); rowSign drives the
      // per-ROW diagonal enter/exit (top row up, bottom row down) — i<2 = top row
      // since the 2-col grid is filled row-major.
      pcardList.push({ el: el, panel: panel, dir: (i % 2 === 0) ? -1 : 1, rowSign: (i < 2) ? -1 : 1 });
    });
  });
  var mTY = 0, mCY = 0;       // cursor Y target / current (smoothed), normalised −0.5..0.5
  if (!reduce) window.addEventListener("pointermove", function (e) {
    mTY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // pp-space: 0 = one zone before, 0.5 = centred, 1 = one zone after. The
  // entry/exit windows are kept SHORT (0.12 wide) so cards snap into and out of
  // place over less scroll, with a wider rest band (.36–.64) in between. They
  // still overlap the neighbouring zone a little (entry starts ~pp .24, exit
  // ends ~pp .76) so the screen never goes fully empty at the seam. Cards emerge
  // from a near offset (0.4×) and scale up slightly, so they drift + settle into
  // place (subtle depth) rather than shooting across and getting clipped.
  function cardState(c, pp) {
    var vw = window.innerWidth, vh = window.innerHeight;
    var ex = c.from[0] * vw * 0.4, ey = c.from[1] * vh * 0.4;
    var qx = c.to[0] * vw * 0.4, qy = c.to[1] * vh * 0.4;
    var e0 = 0.24 + c.stagger, e1 = e0 + 0.12;   // tighter entry (compressed scroll)
    var x0 = 0.64 + c.stagger, x1 = x0 + 0.12;   // tighter exit (compressed scroll)
    var x, y, op, sc;
    if (pp <= e0) { x = ex; y = ey; op = 0; sc = 0.9; }
    else if (pp < e1) { var t = smooth((pp - e0) / (e1 - e0)); x = lerp(ex, 0, t); y = lerp(ey, 0, t); op = t; sc = lerp(0.9, 1, t); }
    else if (pp < x0) { x = 0; y = 0; op = 1; sc = 1; }   // settled rest
    else if (pp < x1) { var t2 = smooth((pp - x0) / (x1 - x0)); x = lerp(0, qx, t2); y = lerp(0, qy, t2); op = 1 - t2; sc = lerp(1, 0.94, t2); }
    else { x = qx; y = qy; op = 0; sc = 0.94; }
    return { x: x, y: y, op: op, sc: sc };
  }

  /* ---------- Journey spine: wavy path + station nodes ---------- */
  var NODE_PTS = [{ x: 0.12, y: 0.46 }, { x: 0.38, y: 0.70 }, { x: 0.64, y: 0.40 }, { x: 0.90, y: 0.28 }];
  var VBW = 1200, VBH = 150;
  function buildPath() {
    var pts = NODE_PTS.map(function (n) { return [n.x * VBW, n.y * VBH]; });
    var all = [[0, pts[0][1]]].concat(pts).concat([[VBW, pts[pts.length - 1][1]]]);
    var d = "M" + all[0][0].toFixed(1) + " " + all[0][1].toFixed(1);
    for (var i = 0; i < all.length - 1; i++) {
      var p0 = all[i - 1] || all[i], p1 = all[i], p2 = all[i + 1], p3 = all[i + 2] || all[i + 1];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }
  var fillLen = 0;
  var curveXY = [];  // sampled {x,y} of the fixed spine, for y-at-x lookup
  if (lineEl && fillEl) {
    var d = buildPath();
    lineEl.setAttribute("d", d);
    fillEl.setAttribute("d", d);
    fillLen = fillEl.getTotalLength();
    // Spine is scroll-drawn left→right (not just faded in): both the faint base
    // line and the highlight start fully hidden (offset = full length) and the
    // loop reels the dashoffset to 0 as you scroll into the section.
    lineEl.style.strokeDasharray = fillLen;
    lineEl.style.strokeDashoffset = fillLen;
    fillEl.style.strokeDasharray = fillLen;
    fillEl.style.strokeDashoffset = fillLen;
    for (var s = 0; s <= 240; s++) {
      var p = fillEl.getPointAtLength(s / 240 * fillLen);
      curveXY.push({ x: p.x, y: p.y });
    }
  }
  // Curve y for a given viewBox x (clamped to the spine ends — off-curve nodes
  // are off-screen anyway and just ride flat past the edge).
  function yAtX(x) {
    if (!curveXY.length) return VBH / 2;
    if (x <= curveXY[0].x) return curveXY[0].y;
    var last = curveXY[curveXY.length - 1];
    if (x >= last.x) return last.y;
    for (var i = 1; i < curveXY.length; i++) {
      if (curveXY[i].x >= x) {
        var a = curveXY[i - 1], b = curveXY[i];
        var t = (x - a.x) / (b.x - a.x || 1);
        return a.y + (b.y - a.y) * t;
      }
    }
    return last.y;
  }
  nodeEls.forEach(function (n, i) {
    n.style.left = (NODE_PTS[i].x * 100) + "%";
    n.style.top = (NODE_PTS[i].y * VBH) + "px";
    n.addEventListener("click", function () { jumpTo(i); });
  });
  function jumpTo(i) {
    var rect = flow.getBoundingClientRect();
    var top = rect.top + (window.scrollY || window.pageYOffset || 0);
    var total = flow.offsetHeight - window.innerHeight;
    var y = top + (i / (N - 1)) * total;
    if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---------- three.js depth scene ---------- */
  var THREEok = (typeof THREE !== "undefined") && !isMobile && !reduce;
  var renderer, scene, camera, focal = [], images = [], clock, keyLight, bulbLight, GAP = 14;
  var IMG_Z = 1;                  // hero plane sits in front, close to camera
  var BOX_W = 9.5, BOX_H = 6;     // bounding box; each plane fits inside it (kept
                                  // narrow so the image lives on the RIGHT half,
                                  // clear of the left-aligned text)
  var REST_X = 8;                 // right-side entry position; image scrolls from
                                  // here (right) to centre over a zone
  var OFF_L = -22;                // off-screen left — where a passed image exits
  var OFF_R = 22;                 // off-screen right — where the next image waits

  // Resize a group's image plane so it keeps the texture's real aspect ratio
  // while fitting inside BOX_W×BOX_H.
  function fitPlane(grp, aspect) {
    var w = BOX_W, h = BOX_W / aspect;
    if (h > BOX_H) { h = BOX_H; w = BOX_H * aspect; }
    var u = grp.userData;
    u.img.geometry.dispose(); u.img.geometry = new THREE.PlaneGeometry(w, h);
  }

  // One hero image plane per panel, loaded from panel.dataset.img. A missing
  // file degrades to a solid indigo placeholder plane so the scene still works
  // before real assets are dropped into images/flow/.
  function createImageObject(panel, i) {
    var grp = new THREE.Group();
    grp.position.set(i * GAP, 0, IMG_Z);

    // Unlit so the texture shows at its true colours (no light shading / colour
    // cast / emissive tint). Placeholder colour until the texture loads.
    var mat = new THREE.MeshBasicMaterial({ color: 0x7b73ff, side: THREE.DoubleSide });
    var img = new THREE.Mesh(new THREE.PlaneGeometry(BOX_W, BOX_H), mat);
    grp.add(img);

    var edge = null;   // edge frame removed (was indigo)

    grp.userData = { baseY: 0, amp: 0.4 + (i % 3) * 0.12, fp: 0.5 + i * 0.07, ph: Math.random() * Math.PI * 2, img: img, edge: edge };
    scene.add(grp); images.push(grp);

    var src = panel.getAttribute("data-img");
    if (src) {
      new THREE.TextureLoader().load(src, function (tex) {
        if ("sRGBEncoding" in THREE) tex.encoding = THREE.sRGBEncoding;
        mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
        var iw = (tex.image && tex.image.width) || 1, ih = (tex.image && tex.image.height) || 1;
        fitPlane(grp, iw / ih);
        grp.userData.loaded = true; grp.userData.iw = iw; grp.userData.ih = ih;
      }, undefined, function (err) {
        grp.userData.loaded = false; grp.userData.err = (err && err.message) || "load error";
      });
    }
  }

  function initGL() {
    var canvas = document.createElement("canvas");
    canvas.className = "flow__gl";
    canvas.setAttribute("aria-hidden", "true");
    wrapper.insertBefore(canvas, track);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if ("sRGBEncoding" in THREE) renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    camera.position.set(0, 0, 17);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    keyLight = new THREE.DirectionalLight(0xffffff, 0.7); keyLight.position.set(6, 9, 12);
    scene.add(keyLight);
    scene.add(keyLight.target);
    var rim = new THREE.DirectionalLight(0x4d8bff, 0.5); rim.position.set(-7, -3, 5); scene.add(rim);

    // Warm point light driven by the hanging HTML bulb; travels with the camera.
    bulbLight = new THREE.PointLight(0xfff0d0, 0.0, 60, 2); bulbLight.position.set(9, 7, 9); scene.add(bulbLight);

    // Hero image plane per panel — DISABLED: the panel image is now a DOM grid of
    // four square project/blog cards (.flow-panel__cards, built below), so the GL
    // scene renders nothing but the camera/light rig still runs harmlessly. Keeping
    // createImageObject + the empty render path avoids touching the rest of the loop.
    // panels.forEach(createImageObject);

    // (Background geometric forms — icosahedron / torus / knot / octahedron — removed.)

    clock = new THREE.Clock();
    resizeGL();
  }
  function resizeGL() {
    if (!renderer) return;
    var w = window.innerWidth, h = wrapper.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function renderGL(progress, globalRaw) {
    if (!renderer) return;
    var global = progress * (N - 1);
    if (globalRaw === undefined) globalRaw = global;
    var gx = progress * (N - 1) * GAP;
    camera.position.x = gx;
    camera.position.y = Math.sin(progress * Math.PI * 2) * 0.55;
    camera.lookAt(gx, 0, IMG_Z);
    var t = clock.getElapsedTime();
    var bulbPulse = 0.7 + 0.3 * Math.sin(t * 0.8);   // gentle breathing glow

    // One image at a time. The ACTIVE panel's image is scroll-driven: it enters
    // from the right (REST_X) and slides LEFT to centre across the zone, using
    // only the right half until the midpoint — x = REST_X*(0.5 - local), so
    // scrolling DOWN moves it left. The OTHER images wait off-screen: passed ones
    // off the LEFT, upcoming ones off the RIGHT. When the active panel flips — the
    // exact instant the text swaps — the lerp resolves the jump as the quick
    // switch: the outgoing image shoots off to the LEFT (allowed to use that side
    // during the change) and the incoming one comes in from the RIGHT.
    // Use the UNCLAMPED global so the first/last images get entry/exit travel
    // outside the [0,N-1] band. sel can reach -0 (round(-0.5)) up to N (round of
    // the upper clamp), so the first image is mid-entry during the lead-in and the
    // last image becomes "passed" (exits left) at the very end.
    var sel = Math.round(globalRaw);
    var local = globalRaw - sel;                          // [-0.5, 0.5], incl. the edge overscroll
    for (var k = 0; k < images.length; k++) {
      var g = images[k], u = g.userData;
      var targetX = (k === sel) ? (REST_X * (0.5 - local)) : (k < sel ? OFF_L : OFF_R);
      if (u.off === undefined) u.off = targetX;
      u.off += (targetX - u.off) * 0.08;                  // tracks scroll; softer catch-up so the flip swaps less abruptly
      g.position.x = camera.position.x + u.off;
      g.position.y = u.baseY + Math.sin(t * u.fp + u.ph) * u.amp;
      g.rotation.x = Math.sin(t * 0.3 + k) * 0.01;        // gentle idle sway only (no mouse reaction)
      g.rotation.y = Math.sin(t * 0.22 + k) * 0.015;
    }

    for (var i = 0; i < focal.length; i++) {
      focal[i].rotation.y = t * focal[i].userData.spin;
      focal[i].rotation.x = Math.sin(t * 0.2 + i) * 0.14;
    }

    // Warm bulb light pulses gently and travels with the journey.
    keyLight.position.x = gx + 6; keyLight.target.position.set(gx, 0, IMG_Z);
    bulbLight.position.x = gx + 9;   // top-right, mirroring the HTML bulb
    bulbLight.intensity = 0.55 * bulbPulse;

    renderer.render(scene, camera);
  }

  /* ---------- Main loop ---------- */
  var lastSel = -1;
  var lastGlobalRaw = 0, scrollDir = 1;   // scroll direction: +1 forward (down), −1 back (up)
  var darkSubs = [];   // zone 3-4 sub paragraphs; colour scroll-driven black→grey
  var lightSubs = [];  // zone 1-2 sub paragraphs; colour scroll-driven grey→white
  var navOn = false;   // top-nav reel state; fired once per threshold crossing
  var vh = window.innerHeight;
  function loop() {
    var rect = flow.getBoundingClientRect();
    var total = rect.height - vh;
    var scrolled = clamp(-rect.top, 0, total);
    var progress = total > 0 ? scrolled / total : 0;
    var global = progress * (N - 1);
    // Terminal: "cd highlights" types out as the section scrolls INTO place — over
    // the approach, with rect.top travelling from ~0.85·vh down to 0. It finishes
    // exactly as the section pins (rect.top ≤ 0 = "in place"), the threshold below.
    var TYPE_START = vh * 0.85;
    var typeP = clamp((TYPE_START - rect.top) / TYPE_START, 0, 1);
    var inPlace = rect.top <= 0;
    driveTerminal(typeP, inPlace);
    // Unclamped global for the IMAGE + TITLE edge motion: lets the first zone enter
    // from the right during the lead-in scroll (before the section reaches the top)
    // and the last zone keep exiting left past the section end — so every zone covers
    // the same travel distance and plays the same appear/exit. Clamped to a full zone
    // of overscroll on each side: at -1 the first zone waits off-right (pre-entry),
    // crossing -0.5 fires its appear + image entry; at N the last zone has exited.
    // Hold every zone parked (globalRaw at its pre-entry edge) until the section is
    // in place; release at the pin so zone 1 enters at the exact terminal threshold.
    var globalRaw = !inPlace ? -1 : (total > 0 ? clamp((-rect.top) / total * (N - 1), -1, N) : 0);
    var sceneScrolled = Math.abs(globalRaw - lastGlobalRaw) > 1e-4;  // cards slid this frame
    if (globalRaw > lastGlobalRaw + 1e-4) scrollDir = 1;
    else if (globalRaw < lastGlobalRaw - 1e-4) scrollDir = -1;
    lastGlobalRaw = globalRaw;

    journey.classList.toggle("is-live", rect.top <= 1 && rect.bottom > vh * 0.6);

    var vw = window.innerWidth;
    var trackX = -progress * (N - 1) * vw;
    track.style.transform = "translate3d(" + trackX + "px,0,0)";
    paintSky(global);
    // Progressive lighten: the flow bg is the dark navy world until 1/5 INTO zone 2
    // (zone 2 spans global 0.5→1.5, so 1/5 in = global 0.7 → progress 0.7/3), then
    // lightens to the hero's initial light shade by the END of zone 4 (progress 1).
    // lightT (0→1) is shared with main.js (window.__flowLight) which lightens the
    // contour-canvas bg + inverts the lines. Here it also flips the foreground text:
    // title/index bright→deep blue, sub white→grey, readable as the bg turns light.
    var LIGHT_START = 0.7 / 3;
    var lightT = clamp((progress - LIGHT_START) / (1 - LIGHT_START), 0, 1);
    window.__flowLight = lightT;
    // Top nav (Projects/Skills/Services/Blog) rolls to black in a per-letter reel
    // once the bg transition is ~27% underway. Threshold-driven: fired ONCE per
    // crossing so __navLight can set direction-aware delays (forward = left word
    // first; reverse = last word / last letter first). CTAs are excluded.
    var navWantOn = lightT >= 0.27;
    if (navWantOn !== navOn) {
      navOn = navWantOn;
      if (window.__navLight) window.__navLight(navOn);
      else if (hdr) hdr.classList.toggle("header--on-light", navOn);
    }
    // Journey wheel/spine darkens with scroll from the HALF of zone 3 (zone 3 spans
    // global 1.5→2.5, half = global 2 → progress 2/3) to the end, so it reads on the
    // light bg: bright blue 77,139,255 → deep blue 35,29,122.
    var jDark = clamp((progress - 2 / 3) / (1 - 2 / 3), 0, 1);
    flow.style.setProperty("--journey-rgb",
      Math.round(lerp(77, 35, jDark)) + "," + Math.round(lerp(139, 29, jDark)) + "," + Math.round(lerp(255, 122, jDark)));
    // Zone 3-4 sub text fades from a slightly-lighter black → a slightly-darker grey
    // across zone 3 to the end (zone 3 starts at global 1.5 → progress 0.5).
    var subT = clamp((progress - 0.5) / 0.5, 0, 1);
    var subCol = "rgb(" + Math.round(lerp(40, 105, subT)) + "," + Math.round(lerp(40, 105, subT)) + "," + Math.round(lerp(46, 112, subT)) + ")";
    for (var si = 0; si < darkSubs.length; si++) darkSubs[si].style.color = subCol;
    // Zone 1-2 sub text: the OTHER side of mid grey — slightly-lighter-grey → a
    // slightly-darker-white across zone 1 to the end of zone 2 (progress 0 → 0.5).
    var subT2 = clamp(progress / 0.5, 0, 1);
    var subCol2 = "rgb(" + Math.round(lerp(150, 236, subT2)) + "," + Math.round(lerp(150, 236, subT2)) + "," + Math.round(lerp(156, 240, subT2)) + ")";
    for (var sj = 0; sj < lightSubs.length; sj++) lightSubs[sj].style.color = subCol2;
    // NOTE: only the LINES + bg (main.js, via __flowLight) transition with scroll.
    // The TEXT colours are NOT scroll-lerped — they're set once per panel by zone
    // index (see setupZoneText below) so each title POPS UP already in its final
    // colour when its zone appears (zones 3-4 = deep blue / grey on the light bg).

    // rawSel drives the title threshold crossings (and steady-state side): it can
    // reach -1 (first zone not yet entered) and N (last zone exited), so the first
    // zone plays its appear on scroll-in and the last zone plays its exit on
    // scroll-out — mirroring the image entry/exit. `active` stays clamped for the
    // journey nodes only.
    // Edge thresholds biased inward (from the default ±0.5 crossings) so the first
    // zone's appear fires a bit LATER (after it's on screen, not at the off-screen
    // overscroll edge) and the last zone's exit fires a bit EARLIER (while still on
    // screen). Interior crossings stay at the half-integers; only the pre-entry
    // (-1→0) and exit (N-1→N) shift.
    var ENTER_LATE = 0.25;       // appear fires at globalRaw -0.5 + this (later, = -0.25)
    var EXIT_EARLY = 0.40;       // exit fires at globalRaw N-0.5 - this (earlier)
    var rawSel;
    if (globalRaw < -0.5 + ENTER_LATE) rawSel = -1;             // first zone not yet entered
    else if (globalRaw >= N - 0.5 - EXIT_EARLY) rawSel = N;     // last zone has exited
    else rawSel = clamp(Math.round(globalRaw), 0, N - 1);
    var active = clamp(rawSel, 0, N - 1);
    var now = Date.now();
    var P = buildPoses(vw);
    // Title motion. Each panel's content is screen-pinned (counter-translateX
    // cancels its panel's screen offset pi*vw+trackX, so its baseline is its CSS
    // `left` rest spot regardless of how far the track slid). Both entry and exit
    // are THRESHOLD-driven, fired at the swap threshold (active=round(global)
    // flips at the zone midpoint — the same point the images swap), each a snappy
    // fixed-duration timed animation, DIRECTION-AWARE so scrolling back up plays
    // the reverse: scrolling DOWN the new title enters from APPEAR (no fade) and
    // the old leaves to EXIT (fade out); scrolling UP the mirror — the returning
    // title enters from EXIT and the leaving one goes back to APPEAR. The entering
    // title is held hidden for ENTER_DELAY after the threshold so the outgoing one
    // clears first (kills the subtle overlap). Animations are set up on the active
    // flip below; `from` captures the live pose so a mid-flight reversal doesn't jump.
    var ENTER_DELAY = 90;        // hold the new title hidden briefly after the threshold
    var ENTER_MS = 420;          // entrance (appear / reverse-exit)
    var EXIT_MS = 280;           // snappy departure (exit / reverse-appear)
    if (rawSel !== lastSel) {
      var fwd = rawSel > lastSel;                        // scroll direction at this crossing
      var entering = panels[rawSel], leaving = panels[lastSel];
      if (entering) entering._anim = {
        // No hold when there's no outgoing title to clear (first zone) — it'd just
        // add a gap; the delay only matters when an old title needs to exit first.
        t0: now, delay: leaving ? ENTER_DELAY : 0, dur: ENTER_MS, fade: false,
        from: poseOf(entering, P, lastSel, rawSel), to: P.REST
      };
      if (leaving) leaving._anim = {
        t0: now, delay: 0, dur: EXIT_MS, fade: true,
        from: poseOf(leaving, P, lastSel, lastSel), to: fwd ? P.EXIT : P.APPEAR
      };
      // index / sub / pills keep their grouped fade via the active/passed classes.
      panels.forEach(function (panel, pi) {
        panel.classList.toggle("flow-panel--active", pi === rawSel);
        panel.classList.toggle("flow-panel--passed", pi < rawSel);
      });
      lastSel = rawSel;
    }
    panels.forEach(function (panel, pi) {
      var content = panel.querySelector(".flow-panel__content");
      if (!content) return;
      var base = "translateY(-58%) translateX(" + (-(pi * vw + trackX)) + "px)";
      var a = panel._anim;
      if (a) {
        var el = now - a.t0 - a.delay;
        if (el < 0) {                                    // delay window — hold at the `from` pose
          content.style.transform = poseStr(base, a.from);
          content.style.opacity = a.fade ? 1 : 0;        // leaving stays visible; entering hidden
        } else {
          var t = easeOut(clamp(el / a.dur, 0, 1));
          content.style.transform = poseStr(base, lerpPose(a.from, a.to, t));
          content.style.opacity = a.fade ? 1 - t : 1;    // entering = no fade-in
          if (el >= a.dur) panel._anim = null;           // settle to steady next frame
        }
      } else {                                           // steady state by side of `rawSel`
        var sp = pi === rawSel ? P.REST : (pi < rawSel ? P.EXIT : P.APPEAR);
        content.style.transform = poseStr(base, sp);
        content.style.opacity = pi === rawSel ? 1 : 0;
      }
    });

    // Per-stage cards: ported 1:1 from the GL image motion (renderGL). Same model,
    // same distances — REST_X / OFF_L / OFF_R world units, same `REST_X*(0.5-local)`
    // formula, same 0.08 smoothed catch-up (_coff == the image's u.off). World units
    // → px via the camera's world→screen factor F (camZ 17, IMG_Z 1, fov 55), and the
    // grid is centred (offset 0 = screen centre) so the cards rest right-of-centre and
    // park fully off-screen exactly like the image. pinX cancels the track slide so the
    // motion is scroll-driven; globalRaw (−1..N) gives the first/last their lead travel.
    var csel = Math.round(globalRaw);
    var clocal = globalRaw - csel;                   // [−0.5, 0.5] within the active stage
    // Active stage slides from R_END (right, entry) to L_END (leftmost). R_END=8 is the
    // original right entry (unchanged). L_END raised 0→2.4 so the card stops short of
    // centre — 30% less leftward travel. OFF_L/OFF_R = off-screen park (passed/upcoming).
    var R_END = 8, L_END = 2.4, OFF_L = -22, OFF_R = 22;
    var F = vh / 16.658;                             // 1 world unit in px (2·(17−1)·tan(55°/2))
    panels.forEach(function (panel, pi) {
      var cardsEl = panel.querySelector(".flow-panel__cards");
      if (!cardsEl) return;
      var target = (pi === csel) ? (L_END + (R_END - L_END) * (0.5 - clocal)) : (pi < csel ? OFF_L : OFF_R);
      panel._coff = (panel._coff === undefined) ? target : panel._coff + (target - panel._coff) * 0.08;
      var hist = panel._coffHist || (panel._coffHist = []);   // short history for the delayed column
      hist.push({ t: now, v: panel._coff });
      while (hist.length > 1 && hist[1].t < now - 250) hist.shift();
      if (pi === csel) { if (!panel._wasActive) panel._arriveT0 = now; panel._wasActive = true; }
      else panel._wasActive = false;                          // stamp the moment a panel becomes active
      var pinX = -(pi * vw + trackX);
      cardsEl.style.transform = "translate(calc(-50% + " + (panel._coff * F + pinX).toFixed(1) + "px),-50%)";
      cardsEl.style.opacity = 1;
      cardsEl.style.pointerEvents = (pi === csel && Math.abs(clocal) < 0.4) ? "auto" : "none";
    });

    // Opposite-direction column parallax — VERTICAL ONLY (horizontal is the scroll-slide
    // above). Ported 1:1 from the reference nav-images: p = (clientY/vh − 0.5)·2·6 rem
    // (≈±6rem ≈ ±96px), left column y = −p, right column y = +p, eased. mCY is the
    // smoothed (clientY/vh − 0.5); the 0.05 lerp stands in for GSAP's duration-2 ease.
    mCY += (mTY - mCY) * 0.05;
    var p = mCY * 2 * 6;            // rem
    // Per-ROW diagonal — ONLY on the SET-CHANGE swap, NOT the within-zone scroll-slide.
    // The active set scrubs horizontally inside the rest band [L_END, R_END] (that
    // right→left slide stays purely horizontal, unchanged). A set only travels OUTSIDE
    // that band when the active stage changes: arriving from OFF_R or leaving to OFF_L.
    // So the diagonal is gated to outside-the-band: dn = 0 within [L_END, R_END]; it
    // ramps 0→1 as the grid heads to OFF_R (arriving) or OFF_L (leaving). A super-linear
    // dn^P keeps the path flat near the band edge and steep far out — so an arriving set
    // comes in steep-from-the-corner then eases to horizontal, and a leaving set starts
    // shallow then steepens as it flies off. rowSign sends the top row up (top-right in /
    // top-left out), the bottom row down. The column stagger (o.dir·p) is preserved.
    var DIAG_STEEP = 200, DIAG_P = 1.7;
    // Two layered effects, BOTH active only on the ENTRANCE/EXIT swap (gated to outside
    // the rest band [L_END,R_END] via dn / g, so NEITHER does anything while you scroll
    // within a zone):
    //  1) Diagonal OFFSET that EASES in — diagY = rowSign·STEEP·dn^P is the target, and
    //     o.diagCur lerps toward it (per-column rate; the lag column eases in slower), so
    //     the offset settles into the row instead of snapping. dn=0 in the band ⇒ no
    //     within-zone offset.
    //  2) Per-column ENTRANCE DELAY — the LAG column renders the grid position from
    //     COL_DELAY_MS ago (coffDelayed), so it flies in/out a touch later than the lead
    //     column. dx is gated by g (0 inside the band) so the lag only happens during the
    //     swap and fades out as the column joins the band — never during scrolling.
    // On scroll-BACK the lead/lag (and the fast/slow ease) flip per column.
    var COL_DELAY_MS = 90, SETTLE_FAST = 0.052, SETTLE_SLOW = 0.048, ARRIVE_WINDOW = 650;
    var leftLeads = scrollDir >= 0;   // forward: left col leads; back: right col leads
    for (var pc = 0; pc < pcardList.length; pc++) {
      var o = pcardList[pc];
      var coffNow = (o.panel._coff === undefined) ? L_END : o.panel._coff;
      var isLag = (o.dir < 0) !== leftLeads;                  // the delayed (later) column
      var coffUse = isLag ? coffDelayed(o.panel, COL_DELAY_MS, now) : coffNow;
      // Vertical-diagonal ramp: 0 inside the rest band, ramps to 1 off either edge.
      var g = 0;
      if (coffUse > R_END) g = clamp((coffUse - R_END) / (OFF_R - R_END), 0, 1);
      else if (coffUse < L_END) g = clamp((coffUse - L_END) / (OFF_L - L_END), 0, 1);
      // Horizontal per-column delay is ARRIVAL-ONLY, gated by TIME since the panel became
      // active — NOT by off-band position. (Position-gating spent the whole delay off the
      // right edge, so the cards looked aligned by the time they were visible.) wDelay = 1
      // at the swap, eases to 0 over ARRIVE_WINDOW, covering the visible entrance and then
      // releasing before the within-zone scrub (no scroll lag). Only the active panel; on
      // EXIT it's 0 so both columns leave together.
      var aw = (o.panel._arriveT0 === undefined) ? 0 : clamp(1 - (now - o.panel._arriveT0) / ARRIVE_WINDOW, 0, 1);
      var wDelay = (o.panel === panels[csel]) ? aw : 0;
      var dx = isLag ? (coffUse - coffNow) * F * wDelay : 0;
      var diagTarget = o.rowSign * DIAG_STEEP * Math.pow(g, DIAG_P);  // super-linear off the band
      var settle = ((o.dir < 0) === leftLeads) ? SETTLE_FAST : SETTLE_SLOW;  // lag col eases slower
      if (o.diagCur === undefined) o.diagCur = diagTarget;
      o.diagCur += (diagTarget - o.diagCur) * settle;
      o.el.style.transform = "translate(" + dx.toFixed(1) + "px," + o.diagCur.toFixed(1) + "px) translateY(" + (o.dir * p).toFixed(3) + "rem)";
    }

    // On desktop the GL image planes replace the DOM card floats (hidden via
    // CSS), so skip their per-frame transforms entirely. Mobile never reaches
    // this loop (it returns early in boot), so the card code still serves it.
    if (!THREEok) cards.forEach(function (c) {
      var pp = 0.5 + (global - c.panel) * 0.5;
      var st = cardState(c, pp);
      if (!c.init) { c.cx = st.x; c.cy = st.y; c.csc = st.sc; c.init = true; }
      c.cx += (st.x - c.cx) * 0.14;
      c.cy += (st.y - c.cy) * 0.14;
      c.csc += (st.sc - c.csc) * 0.14;
      var floatY = Math.sin(now / 1000 / c.fp + c.ph) * 7;
      // Depth parallax tied to scroll position: the card keeps drifting through
      // its whole visible window (not just on entry/exit), so even at rest the
      // scene reads as one continuous space you travel through, not four slides.
      var par = (pp - 0.5) * c.depth * 220;
      c.el.style.transform = "translate3d(" + (c.cx + par) + "px," + (c.cy + floatY) + "px,0) scale(" + c.csc.toFixed(3) + ") rotate(" + c.tilt + "deg)";
      c.el.style.opacity = st.op;
    });

    if (THREEok) renderGL(progress, globalRaw);

    // The spine (curve) is fixed; the nodes flow ALONG it in unison — left as you
    // scroll forward, right as you scroll back. Each node's x is driven directly
    // by scroll so the active node (global == i) sits dead-centre, and its y is
    // read off the fixed curve. The progress fill below still runs independently.
    // Scroll-bound creation: the spine draws on left→right over the first slice of
    // the section's scroll, then holds fully drawn. Bound to clamped progress so it
    // reverses (un-draws) when you scroll back out the top.
    var drawP = 0, drawnX = 0;
    if (lineEl && fillEl && fillLen) {
      // Completes at the half-way point of zone 2 (global == 1 → progress 1/3).
      var DRAW_SPAN = 0.33;                   // fraction of section scroll to fully draw
      var lin = clamp(progress / DRAW_SPAN, 0, 1);
      // Power ease-out: decelerates continuously from the first frame (fast at the
      // start, crawling at the end), so it visibly "eases into" the slow end rather
      // than holding one speed then dropping. Slope starts at EASE×, ends at ~0.
      // Endpoints fixed (0→1), so total draw time over DRAW_SPAN is unchanged.
      var EASE = 2.5;
      drawP = 1 - Math.pow(1 - lin, EASE);
      var off = (fillLen * (1 - drawP)).toFixed(1);
      lineEl.style.strokeDashoffset = off;
      fillEl.style.strokeDashoffset = off;
      // viewBox x of the drawing frontier — nodes left of it have been "created".
      drawnX = curveXY.length ? curveXY[clamp(Math.round(drawP * (curveXY.length - 1)), 0, curveXY.length - 1)].x : 0;
    }

    if (nodesEl && curveXY.length) {
      var jw = journey.clientWidth || vw;
      var SPACING = VBW * 0.42;               // viewBox gap between adjacent nodes
      nodeEls.forEach(function (n, i) {
        var vbX = VBW / 2 + (i - global) * SPACING;
        n.style.left = (vbX / VBW * jw).toFixed(1) + "px";
        n.style.top = yAtX(vbX).toFixed(1) + "px";
        // Pop in one-by-one as the drawing frontier sweeps past each node (so the
        // first node appears, then the second…); once fully drawn all are present.
        n.classList.toggle("flow-journey__node--in", drawP >= 1 || vbX <= drawnX + 6);
        n.classList.toggle("flow-journey__node--active", i === active);
      });
    } else {
      nodeEls.forEach(function (n, i) { n.classList.toggle("flow-journey__node--active", i === active); });
    }

    if (dbg) updateDebug(progress, global);

    // Re-hit-test the hover while the cards are actually drifting under the cursor —
    // the scroll-slide (sceneScrolled) or the cursor parallax still easing (mTY≠mCY) —
    // so is-active follows the moving card even when the pointer itself is still.
    // (Deliberate cursor moves are already handled by the pointermove listener.) Gated
    // to skip the layout flush when nothing under the cursor is moving.
    if (hoverX >= 0 && (sceneScrolled || Math.abs(mTY - mCY) > 1e-4)) refreshHover();

    requestAnimationFrame(loop);
  }

  /* ---------- Debug overlay (?debug) ---------- */
  function updateDebug(progress, global) {
    var lines = [];
    lines.push("THREEok=" + THREEok + "  flow--gl=" + flow.classList.contains("flow--gl"));
    if (renderer) {
      var sz = renderer.getSize(new THREE.Vector2());
      lines.push("canvas " + Math.round(sz.x) + "x" + Math.round(sz.y) + "  rect.top=" + Math.round(flow.getBoundingClientRect().top));
    } else {
      lines.push("renderer = NONE (GL never initialised)");
    }
    lines.push("progress=" + progress.toFixed(3) + " global=" + global.toFixed(2) + " camX=" + (camera ? camera.position.x.toFixed(1) : "-"));
    if (renderer && renderer.info) lines.push("draws=" + renderer.info.render.calls + " tris=" + renderer.info.render.triangles);
    var cv = renderer && renderer.domElement;
    if (cv) { var cs = getComputedStyle(cv); lines.push("canvas vis=" + cs.visibility + " op=" + cs.opacity + " disp=" + cs.display + " z=" + cs.zIndex); }
    lines.push("images=" + images.length);
    for (var k = 0; k < images.length; k++) {
      var g = images[k], u = g.userData;
      var gp = u.img.geometry.parameters || {};
      var v = g.position.clone(); if (camera) v.project(camera);
      var onScreen = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z > -1 && v.z < 1;
      var hit = "";
      if (onScreen) {
        var px = (v.x * 0.5 + 0.5) * window.innerWidth, py = (-v.y * 0.5 + 0.5) * window.innerHeight;
        var el = document.elementFromPoint(px, py);
        hit = " topEl=" + (el ? (el.tagName + "." + (typeof el.className === "string" ? el.className.split(" ")[0] : "")) : "null");
      }
      lines.push("  #" + k + " loaded=" + (u.loaded === true ? "Y" : u.loaded === false ? "ERR(" + (u.err || "") + ")" : "…") +
        " plane=" + (gp.width ? gp.width.toFixed(1) + "x" + gp.height.toFixed(1) : "?") +
        " screen=(" + (v.x * 50 + 50).toFixed(0) + "%," + (50 - v.y * 50).toFixed(0) + "%) " + (onScreen ? "ON" : "off") + hit);
    }
    dbg.textContent = lines.join("\n");
  }

  /* ---------- Boot ---------- */
  if (isMobile) {
    // Mobile: CSS stacks the stages and pins cards in normal flow. No GL / no pin.
    driveTerminal(1, true);   // show the terminal in its completed (cd-run) state
    paintSky(0);
    return;
  }
  window.addEventListener("resize", function () {
    vh = window.innerHeight;
    resizeGL();
    cards.forEach(function (c) { c.init = false; });
  });
  if (THREEok) {
    try { initGL(); flow.classList.add("flow--gl"); } catch (e) { THREEok = false; }
  }
  if (DEBUG) {
    dbg = document.createElement("pre");
    dbg.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:8px 10px;background:rgba(5,4,25,.85);color:#9cff9c;font:11px/1.4 monospace;white-space:pre;pointer-events:none;border-radius:6px;max-width:90vw";
    document.body.appendChild(dbg);
  }
  // Text colours are set once per zone (NOT scroll-lerped): zones 1-2 keep the
  // dark-bg colours (bright blue title, white index/sub via CSS defaults); zones
  // 3-4, which sit over the lightened bg, are set to their final deep-blue / grey
  // so each title POPS UP already in that colour when its zone appears.
  (function setupZoneText() {
    panels.forEach(function (panel, pi) {
      var list = panel.querySelector(".flow-panel__list");   // the 4 project/blog links
      if (pi < 2) {                                      // zones 1-2 (dark bg): list colour scroll-driven
        if (list) lightSubs.push(list);                  // ul colour cascades to the items (color:inherit)
        return;
      }
      var ttl = panel.querySelector(".flow-panel__title");
      var idx = panel.querySelector(".flow-panel__index");
      if (ttl) ttl.style.color = "#231d7a";              // deep blue (darker than #3932DC)
      if (idx) idx.style.color = "#231d7a";
      if (list) list.style.color = "#231d7a";            // deep blue, readable on the light bg
    });
  })();
  paintSky(0);
  requestAnimationFrame(loop);
})();
