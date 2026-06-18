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
  var N = panels.length || 4;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

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
    fillEl.style.strokeDasharray = "none";
    fillEl.style.strokeDashoffset = 0;  // spine is always fully drawn (no progress fill)
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
  // Mouse-tilt: normalized pointer (-1..1); image rotation is lerped toward it.
  var mx = 0, my = 0;

  // Resize a group's image plane (+ its edge frame and shadow receiver) so the
  // plane keeps the texture's real aspect ratio while fitting inside BOX_W×BOX_H.
  function fitPlane(grp, aspect) {
    var w = BOX_W, h = BOX_W / aspect;
    if (h > BOX_H) { h = BOX_H; w = BOX_H * aspect; }
    var u = grp.userData;
    u.img.geometry.dispose(); u.img.geometry = new THREE.PlaneGeometry(w, h);
    u.recv.geometry.dispose(); u.recv.geometry = new THREE.PlaneGeometry(w * 1.5, h * 1.5);
  }

  // One hero image plane per panel, loaded from panel.dataset.img. A missing
  // file degrades to a solid indigo placeholder plane so the scene still works
  // before real assets are dropped into images/flow/. Behind each image sits a
  // ShadowMaterial receiver so the (shadow-casting) key light reads as a soft
  // drop shadow; its opacity later fades with distance from the active panel.
  function createImageObject(panel, i) {
    var grp = new THREE.Group();
    grp.position.set(i * GAP, 0, IMG_Z);

    var mat = new THREE.MeshStandardMaterial({ color: 0x7b73ff, roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide });
    var img = new THREE.Mesh(new THREE.PlaneGeometry(BOX_W, BOX_H), mat);
    img.castShadow = true;
    grp.add(img);

    var edge = null;   // edge frame removed (was indigo)

    var shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    var receiver = new THREE.Mesh(new THREE.PlaneGeometry(BOX_W * 1.5, BOX_H * 1.5), shadowMat);
    receiver.position.z = -1.2;
    receiver.receiveShadow = true;
    grp.add(receiver);

    grp.userData = { baseY: 0, amp: 0.4 + (i % 3) * 0.12, fp: 0.5 + i * 0.07, ph: Math.random() * Math.PI * 2, shadowMat: shadowMat, img: img, edge: edge, recv: receiver };
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("sRGBEncoding" in THREE) renderer.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    camera.position.set(0, 0, 17);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    keyLight = new THREE.DirectionalLight(0xffffff, 0.7); keyLight.position.set(6, 9, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    var sc = keyLight.shadow.camera;
    sc.left = -10; sc.right = 10; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 40;
    scene.add(keyLight);
    scene.add(keyLight.target);
    var rim = new THREE.DirectionalLight(0x8aa800, 0.5); rim.position.set(-7, -3, 5); scene.add(rim);

    // Warm point light driven by the hanging HTML bulb; travels with the camera.
    bulbLight = new THREE.PointLight(0xfff0d0, 0.0, 60, 2); bulbLight.position.set(9, 7, 9); scene.add(bulbLight);

    // Hero image plane per panel
    panels.forEach(createImageObject);

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
      u.off += (targetX - u.off) * 0.18;                  // tracks scroll within a zone; quick at the flip
      g.position.x = camera.position.x + u.off;
      g.position.y = u.baseY + Math.sin(t * u.fp + u.ph) * u.amp;
      g.rotation.x = lerp(g.rotation.x, my * 0.06, 0.08) + Math.sin(t * 0.3 + k) * 0.01;
      g.rotation.y = lerp(g.rotation.y, mx * 0.09, 0.08) + Math.sin(t * 0.22 + k) * 0.015;
      var near = clamp(1 - Math.abs(u.off) / 16, 0, 1);   // 1 near centre, 0 off-screen
      u.shadowMat.opacity = 0.12 + 0.26 * near;
      if (u.img.material.emissive) {
        u.img.material.emissive.setHex(0x4a3a10);
        u.img.material.emissiveIntensity = 0.10 * near * bulbPulse;
      }
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
  var vh = window.innerHeight;
  function loop() {
    var rect = flow.getBoundingClientRect();
    var total = rect.height - vh;
    var scrolled = clamp(-rect.top, 0, total);
    var progress = total > 0 ? scrolled / total : 0;
    var global = progress * (N - 1);
    // Unclamped global for the IMAGE + TITLE edge motion: lets the first zone enter
    // from the right during the lead-in scroll (before the section reaches the top)
    // and the last zone keep exiting left past the section end — so every zone covers
    // the same travel distance and plays the same appear/exit. Clamped to a full zone
    // of overscroll on each side: at -1 the first zone waits off-right (pre-entry),
    // crossing -0.5 fires its appear + image entry; at N the last zone has exited.
    var globalRaw = total > 0 ? clamp((-rect.top) / total * (N - 1), -1, N) : 0;

    journey.classList.toggle("is-live", rect.top <= 1 && rect.bottom > vh * 0.6);

    var vw = window.innerWidth;
    var trackX = -progress * (N - 1) * vw;
    track.style.transform = "translate3d(" + trackX + "px,0,0)";
    paintSky(global);

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
    if (nodesEl && curveXY.length) {
      var jw = journey.clientWidth || vw;
      var SPACING = VBW * 0.42;               // viewBox gap between adjacent nodes
      nodeEls.forEach(function (n, i) {
        var vbX = VBW / 2 + (i - global) * SPACING;
        n.style.left = (vbX / VBW * jw).toFixed(1) + "px";
        n.style.top = yAtX(vbX).toFixed(1) + "px";
        n.classList.toggle("flow-journey__node--active", i === active);
      });
    } else {
      nodeEls.forEach(function (n, i) { n.classList.toggle("flow-journey__node--active", i === active); });
    }

    if (dbg) updateDebug(progress, global);

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
  // Mouse-tilt input (desktop GL only): normalize pointer to -1..1.
  if (THREEok) {
    window.addEventListener("pointermove", function (e) {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  if (DEBUG) {
    dbg = document.createElement("pre");
    dbg.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:8px 10px;background:rgba(5,4,25,.85);color:#9cff9c;font:11px/1.4 monospace;white-space:pre;pointer-events:none;border-radius:6px;max-width:90vw";
    document.body.appendChild(dbg);
  }
  paintSky(0);
  requestAnimationFrame(loop);
})();
