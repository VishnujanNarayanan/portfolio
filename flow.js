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

  var wrapper = flow.querySelector(".flow__wrapper");
  var track = flow.querySelector(".flow__track");
  var sky = flow.querySelector(".flow__sky");
  var panels = Array.prototype.slice.call(flow.querySelectorAll(".flow-panel"));
  var journey = flow.querySelector(".flow-journey");
  var nodeEls = Array.prototype.slice.call(flow.querySelectorAll(".flow-journey__node"));
  var lineEl = flow.querySelector(".flow-journey__line");
  var fillEl = flow.querySelector(".flow-journey__fill");
  var N = panels.length || 4;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

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
  if (lineEl && fillEl) {
    var d = buildPath();
    lineEl.setAttribute("d", d);
    fillEl.setAttribute("d", d);
    fillLen = fillEl.getTotalLength();
    fillEl.style.strokeDasharray = fillLen;
    fillEl.style.strokeDashoffset = fillLen;
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
  var renderer, scene, camera, focal = [], particles, clock, GAP = 14;
  function initGL() {
    var canvas = document.createElement("canvas");
    canvas.className = "flow__gl";
    canvas.setAttribute("aria-hidden", "true");
    wrapper.insertBefore(canvas, track);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    camera.position.set(0, 0, 22);
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    var key = new THREE.DirectionalLight(0xffffff, 0.65); key.position.set(6, 9, 12); scene.add(key);
    var rim = new THREE.DirectionalLight(0x3932dc, 0.55); rim.position.set(-7, -3, 5); scene.add(rim);

    var geos = [
      new THREE.IcosahedronGeometry(3.2, 1),
      new THREE.TorusGeometry(2.7, 0.92, 26, 90),
      new THREE.TorusKnotGeometry(2.1, 0.62, 150, 22),
      new THREE.OctahedronGeometry(3.3, 0)
    ];
    for (var i = 0; i < N; i++) {
      var grp = new THREE.Group();
      var g = geos[i % geos.length];
      var mat = new THREE.MeshStandardMaterial({ color: 0x7b73ff, metalness: 0.28, roughness: 0.4, transparent: true, opacity: 0.9, flatShading: true });
      grp.add(new THREE.Mesh(g, mat));
      grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x3932dc, transparent: true, opacity: 0.32 })));
      grp.position.set(i * GAP, -0.4, -4);
      grp.userData.spin = 0.14 + i * 0.025;
      scene.add(grp); focal.push(grp);
    }

    var count = 850, pos = new Float32Array(count * 3);
    for (var p = 0; p < count; p++) {
      pos[p * 3] = Math.random() * (N - 1) * GAP * 1.15 - GAP * 0.25;
      pos[p * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[p * 3 + 2] = (Math.random() - 0.5) * 42;
    }
    var pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x3932dc, size: 0.085, transparent: true, opacity: 0.5, sizeAttenuation: true }));
    scene.add(particles);

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
  function renderGL(progress) {
    if (!renderer) return;
    var gx = progress * (N - 1) * GAP;
    camera.position.x = gx;
    camera.position.y = Math.sin(progress * Math.PI * 2) * 0.55;
    camera.lookAt(gx, -0.4, -4);
    var t = clock.getElapsedTime();
    for (var i = 0; i < focal.length; i++) {
      focal[i].rotation.y = t * focal[i].userData.spin;
      focal[i].rotation.x = Math.sin(t * 0.2 + i) * 0.14;
    }
    if (particles) particles.rotation.y = t * 0.01;
    renderer.render(scene, camera);
  }

  /* ---------- Split each zone title into per-letter spans ----------
     Mirrors the SplitText markup: the visible split is aria-hidden and the
     full text is preserved on an aria-label so screen readers still read it.
     Structure per glyph: <span class="flow-char">(clip)<span class="char">(moves)</span></span>.
     Each .char carries an inline transition-delay (--d) that increases L→R so
     the letters stagger; the up/down slide itself is plain CSS (see styles.css). */
  function splitTitle(h) {
    var label = h.textContent.replace(/\s+/g, " ").trim();
    var frag = document.createDocumentFragment();
    var ci = 0;
    Array.prototype.forEach.call(h.childNodes, function (node) {
      if (node.nodeType === 3) {                 // text → split into chars
        var text = node.textContent;
        for (var k = 0; k < text.length; k++) {
          var ch = text[k];
          if (ch === " ") {
            // Real whitespace text node — white-space:pre-line on the title
            // preserves it (matches the reference's [split-text] handling), so
            // no nbsp/width hack and no transition is wasted on spaces.
            frag.appendChild(document.createTextNode(" "));
          } else {
            var clip = document.createElement("span");
            clip.className = "flow-char";
            clip.setAttribute("aria-hidden", "true");
            var inner = document.createElement("span");
            inner.className = "char";
            inner.textContent = ch;
            inner.style.setProperty("--d", (ci * 0.03).toFixed(3) + "s");
            clip.appendChild(inner);
            frag.appendChild(clip);
            ci++;
          }
        }
      } else if (node.nodeType === 1 && node.tagName === "BR") {
        // <br> → newline; pre-line turns it into a real line break between the
        // inline-block letters, so each title keeps its two-line layout.
        frag.appendChild(document.createTextNode("\n"));
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });
    h.textContent = "";
    h.setAttribute("aria-label", label);
    h.appendChild(frag);
  }
  panels.forEach(function (panel) {
    var title = panel.querySelector(".flow-panel__title");
    if (title) splitTitle(title);
  });

  /* ---------- Main loop ---------- */
  var lastActive = -1;
  var vh = window.innerHeight;
  function loop() {
    var rect = flow.getBoundingClientRect();
    var total = rect.height - vh;
    var scrolled = clamp(-rect.top, 0, total);
    var progress = total > 0 ? scrolled / total : 0;
    var global = progress * (N - 1);

    journey.classList.toggle("is-live", rect.top <= 1 && rect.bottom > vh * 0.6);

    var vw = window.innerWidth;
    var trackX = -progress * (N - 1) * vw;
    track.style.transform = "translate3d(" + trackX + "px,0,0)";
    paintSky(global);

    var active = clamp(Math.round(global), 0, N - 1);
    // The text block stays put on screen instead of riding the track: every
    // frame each panel's content gets a counter-translateX that cancels its
    // panel's current screen offset (pi*vw + trackX), so it always renders at
    // its CSS `left` position regardless of how far the track has slid.
    panels.forEach(function (panel, pi) {
      var content = panel.querySelector(".flow-panel__content");
      if (content) content.style.transform = "translateY(-58%) translateX(" + (-(pi * vw + trackX)) + "px)";
    });
    // Which zone's text is shown is class-driven, so the swap is a real CSS
    // transition (the per-letter up-slide), not an instant cut. Flip the
    // classes only when `active` actually changes — at the zone midpoint
    // (Math.round) — so we never re-trigger the transition mid-flight.
    if (active !== lastActive) {
      panels.forEach(function (panel, pi) {
        panel.classList.toggle("flow-panel--active", pi === active);
        panel.classList.toggle("flow-panel--passed", pi < active);
      });
      lastActive = active;
    }

    var now = Date.now();
    cards.forEach(function (c) {
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

    if (THREEok) renderGL(progress);

    nodeEls.forEach(function (n, i) { n.classList.toggle("flow-journey__node--active", i === active); });
    if (fillEl) fillEl.style.strokeDashoffset = fillLen * (1 - progress);

    requestAnimationFrame(loop);
  }

  /* ---------- Boot ---------- */
  if (isMobile) {
    // Mobile: CSS stacks the stages and pins cards in normal flow. No GL / no pin.
    paintSky(0);
    return;
  }
  window.addEventListener("resize", function () {
    vh = window.innerHeight;
    resizeGL();
    cards.forEach(function (c) { c.init = false; });
  });
  if (THREEok) {
    try { initGL(); } catch (e) { THREEok = false; }
  }
  paintSky(0);
  requestAnimationFrame(loop);
})();
