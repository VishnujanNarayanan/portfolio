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
    //     the flow below. The video plays at normal speed through the pull-up, then DECELERATES
    //     with scroll through the zoom-out (slowing from 92% of the zoom, paused by 97%).
    // Purely scroll-linked, so scrolling back up reverses it exactly. The 3D text
    // entrance still plays on load at scroll 0 (no transform on .hero).
    var heroContent = hero.querySelector(".hero__content");
    var heroVid = document.querySelector(".hero-video");  // office video revealed beneath the hero
    // Scroll-controlled playback: rate ≤ 0 pauses; otherwise play at the given rate (clamped).
    function setVidPlay(rate) {
      if (!heroVid) return;
      if (rate <= 0.001) { if (!heroVid.paused) heroVid.pause(); return; }
      heroVid.playbackRate = Math.max(0.1, Math.min(rate, 1));
      if (heroVid.paused) { var pr = heroVid.play(); if (pr && pr.catch) pr.catch(function () {}); }
    }
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
    var EXIT_MIN_SCALE = 0.35;      // IMAGE size: how far the page-rectangle recedes on zoom-out. The frozen
                                    // collapse frame uses this same rectangle, so the image is equal before/after.
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
    // CHECKPOINT/DWELL: once the video reaches fullscreen (y = vh) it HOLDS there for an extra
    // HERO_DWELL·vh of scroll before the edge zoom-out (phase B) begins — so you have to scroll
    // again past the checkpoint to start it. Every hero-phase consumer (video, handwriting,
    // marquee, GitHub card, CTA lift) maps real scrollY through __heroY so they all dwell in
    // lock-step; the .hero-spacer is lengthened by the same amount to provide the scroll room.
    var HERO_DWELL = 0.16;
    function heroY(y, vh) { var d = vh * HERO_DWELL; return y < vh ? y : (y < vh + d ? vh : y - d); }
    window.__heroY = heroY;
    function updateHeroExit() {
      var vh = window.innerHeight;
      var y = window.scrollY;
      // The header reaction (text shrink + colour flip) fires a little BEFORE the video
      // reaches fullscreen — 4.5% of a viewport early. Tied to fullscreen (NOT the dwell), so
      // the checkpoint dwell doesn't shift the navbar switch.
      var HDR_FLIP = vh * 0.955;
      // Phase A (0 → vh): the hero rides UP 1:1 with scroll (linear, so the video glued
      // to its bottom edge tracks it exactly). Past vh it's parked off the top.
      if (heroContent) heroContent.style.transform = "";
      hero.style.transform = "translateY(" + (-Math.min(y, vh)) + "px)";
      // Phases B/C act on the video once it fully covers the screen (y ≥ vh):
      //   B (vh → 2vh): zoom OUT from the centre (camera pull-back), 1 → EXIT_MIN_SCALE.
      //   C (2vh → 3vh): ride UP with the page, handing over to the flow below.
      // Effective scroll with the checkpoint dwell removed — phases B/C read this so the video
      // stays fullscreen through the dwell, then resumes exactly where it would have.
      var ye = heroY(y, vh);
      if (heroVid) {
        // Y: below the fold (top edge at the hero's bottom) → 0 (full screen) over phase A,
        // locked at 0 through the zoom + the dwell, then rides up off the top in phase C.
        var vTy = (ye < vh) ? (vh - ye) : -Math.max(0, ye - 2 * vh);
        var scale, grey = 0, blue = 0;                 // grey 0→1 (greyed out); blue 0→1 (blue tint, kicks in later)
        if (ye < vh) {
          // Phase A CONTENT zoom (a normal camera zoom; object-fit:cover keeps it full-frame):
          // held zoomed-in 1.55 for the first 50% of the pull-up, then eased back to 1.0 (full
          // view) between 50% and 100% (reaching 1.0 at the top). Distinct from the edge zoom below.
          var zt = Math.max(0, Math.min((ye - 0.5 * vh) / (0.5 * vh), 1));
          var ze = zt * zt * (3 - 2 * zt);             // smoothstep
          scale = 1.55 - 0.55 * ze;                    // 1.55 → 1.0
          setVidPlay(1);                               // full speed through the pull-up
        } else {
          // Phase B EDGE zoom-out (shrinks the whole rectangle, uncovering the marquee around it).
          // `prog` ∈ [0,1] = zoom-out completion. It is SCROLL-driven up to the handwriting's
          // "thin24" threshold (window.__certWrite.pBThr); once the pen reaches that stroke the
          // cert IIFE fires a TIMED completion (cw.t 0→1) and the video finishes its zoom-out,
          // grey, blue tint and PAUSE on that same timer — threshold-driven, not scroll-driven —
          // so the video and the last strokes land together at the pop. Reverses on scroll-up.
          var pB = Math.max(0, Math.min((ye - vh) / vh, 1));
          var cw = window.__certWrite;
          var prog;
          if (cw && cw.crossed) {
            var ct = cw.t * cw.t * (3 - 2 * cw.t);                 // smoothstep on the timed factor
            prog = cw.pBThr + (1 - cw.pBThr) * ct;                 // threshold → 1 on the timer
          } else {
            prog = pB;                                             // scroll-driven up to the threshold
          }
          var eB = prog * prog * (3 - 2 * prog);       // smoothstep
          scale = 1 - (1 - EXIT_MIN_SCALE) * eB;       // 1 → EXIT_MIN_SCALE (no opacity change)
          grey = eB;                                   // greys MORE the further it recedes (stays grey in phase C)
          blue = Math.max(0, Math.min((prog - 0.8) / 0.1, 1)); // blue tint ramps only between 80% and 90% of the zoom-out
          // PLAYBACK decelerates through the zoom-out: full speed until 92%, then eases down
          // (gentle at first, steeper toward 97% via the squared ramp) and PAUSES at 97% (and
          // stays paused beyond, into phase C). Driven by `prog`, so it pauses on the timer once
          // the threshold has fired.
          var dt = (prog - 0.92) / 0.05;               // 0 at 92% of the zoom → 1 at 97%
          setVidPlay(prog >= 0.97 ? 0 : (prog <= 0.92 ? 1 : 1 - dt * dt));
        }
        heroVid.style.transformOrigin = "50% 50%";
        heroVid.style.transform = "translateY(" + vTy + "px) scale(" + scale + ")";
        // Desaturate + dim toward grey as it recedes (grey, from the start of the zoom), then re-tint
        // that grey toward BLUE only between 80% and 90% of the zoom-out (blue), at 0.33 strength so it
        // ends as a softer blue-grey (≈ #969ba8). grayscale/brightness ride grey; sepia+hue-rotate+
        // saturate (the blue tint) ride blue.
        // Hovering the cert CTA de-greys the video back to TRUE colour — a QUICK SNAP (no fade) and
        // ONLY at the pop (cT≥1). window.__certColor is 1/0 (set by the cert IIFE); dg=1 scales every
        // greyed channel to none (true colour), dg=0 leaves the scroll-driven grey untouched.
        var dg = 1 - (window.__certColor ? 1 : 0);
        heroVid.style.filter =
          "grayscale(" + (grey * dg).toFixed(3) + ") brightness(" + (1 - 0.18 * grey * dg).toFixed(3) +
          ") sepia(" + (0.33 * blue * dg).toFixed(3) + ") hue-rotate(" + (185 * blue * dg).toFixed(1) +
          "deg) saturate(" + (1 + 0.33 * blue * dg).toFixed(3) + ")";
      }
      // Scroll cue plays its entrance in reverse the moment scrolling starts.
      if (scrollCue) scrollCue.classList.toggle("is-exiting", y > 0);
      // Hover-reel gate: through the whole pull-up (y < vh) the header stays in its hero
      // appearance, so the clone keeps the SAME colour (CSS forces currentColor). It only
      // flips once the edge zoom-out begins (--hc takes over) — same trigger as the theme below.
      if (hdr) hdr.classList.toggle("is-hero", y < HDR_FLIP);

      // Header reacts to the EDGE zoom-out (phase B), NOT to the initial pull-up. It's
      // THRESHOLD-fired (a timed flip, not scroll-scrubbed): the moment the video begins
      // zooming out from the edges (y ≥ vh) it plays its transition once, and reverses when
      // you scroll back above that line. Same look/speed as before, just one viewport later:
      //  - text colour flips as the light bg appears (CSS .3s color transition);
      //  - the left nav + right CTAs SHRINK in place, anchored to their page edges (.3s);
      //  - the dark "Get In Touch" pill inverts its bg (dark → light) so it stays legible.
      // While y > 2·vh the flow/blog reel thresholds own the theme (via window.__navLight),
      // so we only assert it up to the end of the edge zoom.
      var wantFlip = y >= HDR_FLIP;
      if (wantFlip !== hdrFlipped) {
        hdrFlipped = wantFlip;
        if (ye <= 2 * vh) setHeaderTheme(wantFlip ? 1 : 0);   // timed (.3s), not scrubbed
        var hs = wantFlip ? 0.88 : 1;                        // shrink 1 ↔ 0.88 (subtle)
        if (navLeft)  { navLeft.style.transition  = "transform .3s var(--ease-default)"; navLeft.style.transformOrigin  = "left center";  navLeft.style.transform  = "scale(" + hs + ")"; }
        if (navRight) { navRight.style.transition = "transform .3s var(--ease-default)"; navRight.style.transformOrigin = "right center"; navRight.style.transform = "scale(" + hs + ")"; }
      }
    }
    window.__updateHeroExit = updateHeroExit;   // cert IIFE drives this during its timed completion
    window.addEventListener("scroll", updateHeroExit, { passive: true });
    window.addEventListener("resize", updateHeroExit, { passive: true });
    updateHeroExit();
  }

  /* ---------- Handwritten "checkout my certificates" CTA over the hero video ----------
     The pen-stroke is laid down by scrubbing stroke-dashoffset against scroll, and the
     whole layer is given the SAME transform the .hero-video gets, so the writing rides
     with the (paused, shrunken) video as it recedes and drifts up. Fully reversible:
     scrolling up un-writes the ink and lowers the layer back. Mirrors the phase B/C math
     in updateHeroExit (kept in sync by formula, not by sharing state). */
  (function () {
    var layer = document.querySelector(".cert-layer");
    if (!layer) return;
    // The visible letters are a FILLED path; they're uncovered by a mask made of the traced
    // centre-line PEN PATH, split into ordered strokes (writing order). We measure each
    // stroke and reveal them in sequence by cumulative length, so the ink is laid down by a
    // pen tip travelling each stroke — true letter-by-letter writing, fully reversible.
    var segs = [].slice.call(layer.querySelectorAll(".cert-cta__seg"));
    if (!segs.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Clickability switches ON at the thin24 THRESHOLD (crossed) and stays on until you scroll back
    // above it. While active the video + cert text are clickable, and hovering de-greys the video +
    // turns the handwriting blue — gradually, gated by the writing completion (see applyColor below).
    var heroVid = document.querySelector(".hero-video");
    var link = layer.querySelector(".cert-cta");
    var fillEl = layer.querySelector(".cert-cta__fill");
    var active = false, hovering = false;
    // TEXT blue: WHILE the writing is still animating (cT<1) the hover blue eases in GRADUALLY
    // (hoverAmt 0→1 on its own rAF), gated by completion so it can only get as blue as cT allows.
    // Once popped (cT≥1, not animating) the hover blue SNAPS instead (uses the raw hover state).
    // VIDEO colour: always a QUICK-SNAP to true colour on hover, and ONLY at the pop (cT≥1 /
    // "100% or more"); below that, hovering doesn't touch the video.
    var hoverAmt = 0, colorRAF = 0, colorLast = 0, HOVER_DUR = 360;   // ms text-blue hover ease (while animating)
    function mixFill(t) {     // #fff → #4d8bff by t
      var r = Math.round(255 + (77 - 255) * t), g = Math.round(255 + (139 - 255) * t);
      return "rgb(" + r + "," + g + ",255)";
    }
    function applyColor() {
      var anim = !reduce && cT < 0.999;                          // still writing → ease; popped → snap
      var h = frozen ? frozenHover : hovering;                   // on the frozen frame, hover = frozenHover
      var amt = anim ? hoverAmt : (h ? 1 : 0);
      if (fillEl) fillEl.style.fill = mixFill(amt * Math.max(0, Math.min(cT, 1)));
      window.__certColor = (h && cT >= 0.999) ? 1 : 0;           // video: snap to true colour, 100%+ only
    }
    function colorTick(now) {
      colorRAF = 0;
      var dt = colorLast ? (now - colorLast) : 16; colorLast = now;
      var target = hovering ? 1 : 0;
      if (reduce) hoverAmt = target;
      else if (hoverAmt < target) hoverAmt = Math.min(hoverAmt + dt / HOVER_DUR, target);
      else if (hoverAmt > target) hoverAmt = Math.max(hoverAmt - dt / HOVER_DUR, target);
      applyColor();
      if (hoverAmt !== target) colorRAF = requestAnimationFrame(colorTick); else colorLast = 0;
    }
    function setHover(on) {
      hovering = on && active;
      applyColor();                                       // snap the video immediately (binary, 100%+ only)
      if (window.__updateHeroExit) window.__updateHeroExit();
      if (!colorRAF) { colorLast = 0; colorRAF = requestAnimationFrame(colorTick); }   // ease the text blue
    }
    function setActive(on) {
      if (on === active) return;
      active = on;
      layer.classList.toggle("is-active", on);
      if (heroVid) { heroVid.style.pointerEvents = on ? "auto" : "none"; heroVid.style.cursor = on ? "pointer" : ""; }
      if (!on) setHover(false);
    }
    // Frozen frame → frozenHover (text white off / blue on). Normal hero → hovering. During the closing
    // zoom (closing, not yet frozen) ignore hover so `hovering` can't get stuck true into the frozen state.
    var onEnter = function () { if (frozen) setFrozenHover(true); else if (!closing) setHover(true); };
    var onLeave = function () { if (frozen) setFrozenHover(false); else if (!closing) setHover(false); };

    // ---- Pull-IN transition on click: zoom the pullout clip from the hero video's CURRENT
    // on-screen rectangle (position-aware) to full screen, the reverse of the scroll zoom-out,
    // playing videos/pullout_animation.mp4 exactly ONCE over its own duration. ----
    var pullout = document.querySelector(".pullout-video");
    var receive = document.querySelector(".receive-video");
    var pullActive = false, pullDone = false, pullRAF = 0;
    var pullStart = { s: 1, ty: 0 };          // hero rectangle the pull-in came from (closing returns here)
    var closing = false, closeRAF = 0;

    // ---- Certificate gallery (opens once the pull-in finishes). Each entry is one sticky,
    // full-screen slide; scrolling brings the next up to cover the previous (features-over-blog).
    // The certificates are shown as PNGs (rendered from the PDFs, page 1) so they display full
    // size cleanly; each keeps an "Open ↗" link to the original PDF. ----
    var CERT_DOCS = [
      { img: "images/certificates/google-advanced-data-scientist.png", pdf: "images/certificates/GOOGLE ADVANCED DATA SCIENTIST N8G3041EJ7M6.pdf",    title: "Google Advanced Data Scientist" },
      { img: "images/certificates/google-capstone.png",             pdf: "images/certificates/Google_capstone.pdf",                                  title: "Google Capstone" },
      { img: "images/certificates/ibm-generative-ai.png",           pdf: "images/certificates/IBM Generative AI Engineering Coursera 8R9Q0WU9IB5G.pdf", title: "IBM Generative AI Engineering" },
      { img: "images/certificates/dsa-python.png",                  pdf: "images/certificates/Data Structures and Algorithms Using Python.pdf",       title: "Data Structures & Algorithms (Python)" },
      { img: "images/certificates/intro-database-systems.png",      pdf: "images/certificates/Introduction to Database systems.pdf",                  title: "Introduction to Database Systems" },
      { img: "images/certificates/modern-cpp.png",                  pdf: "images/certificates/Programming in modern C++.pdf",                         title: "Programming in Modern C++" }
    ];
    var gallery = document.querySelector(".cert-gallery");
    var galleryScroll = gallery && gallery.querySelector(".cert-gallery__scroll");
    var galleryBuilt = false, loopVid = null;    // loopVid = the end slide's looping collapse video
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function buildGallery() {
      if (galleryBuilt || !galleryScroll) return;
      galleryBuilt = true;
      var slides = CERT_DOCS.map(function (c, i) {
        var title = esc(c.title || ("Certificate " + (i + 1)));
        // encodeURI: the PDF filenames have spaces. The PNG is shown; the link opens the real PDF.
        return '<div class="cert-slide"><figure class="cert-slide__fig">' +
          '<img class="cert-slide__img" src="' + encodeURI(c.img) + '" alt="' + title + '" loading="lazy">' +
          (c.pdf ? '<a class="cert-slide__open" href="' + encodeURI(c.pdf) + '" target="_blank" rel="noopener">Open ' + title + ' ↗</a>' : '') +
          '</figure></div>';
      }).join("");
      // Final slide: the collapse/receive video, looping. It cover-scrolls up like any certificate;
      // a scroll-down on it collapses the gallery. The close plays its OWN receive clip from the start
      // (only the rectangle position is remembered, not the frame you closed at).
      slides += '<div class="cert-slide cert-slide--end">' +
        '<video class="cert-slide__loop" src="' + encodeURI("videos/recieve_animation.mp4") +
        '" muted loop playsinline autoplay preload="auto" aria-hidden="true"></video></div>';
      galleryScroll.innerHTML = slides;
      loopVid = galleryScroll.querySelector(".cert-slide__loop");
    }
    function openCertGallery() {
      buildGallery();
      if (gallery) { gallery.classList.add("is-open"); gallery.setAttribute("aria-hidden", "false"); }
      if (galleryScroll) galleryScroll.scrollTop = 0;
      // Keep the end-slide loop running (free-running, no currentTime reset → a different frame each
      // visit) so the close — which continues from it — looks dynamically different every time.
      if (loopVid) { var lp = loopVid.play(); if (lp && lp.catch) lp.catch(function () {}); }
    }
    // ---- Closing transition: zoom the gallery back OUT to the hero rectangle it came from while
    // the receive clip plays. Triggered at the end of the scroll, on Esc, or via the back button. ----
    // The collapse clip is left FROZEN on its last frame, parked at the hero rectangle — that frozen
    // frame is the new pause image. We do NOT hand back to the live hero video here; instead the hero
    // video is reset to its start and revealed (playing from frame 0) on the next backward scroll.
    // ---- Frozen pause-frame state (after a collapse). The collapse clip is left paused at the hero
    // rectangle; the handwritten CTA sits on top; hovering re-colours the frame, otherwise it's
    // grey+blue (same look as the hero zoom-out). FORWARD scroll lifts the frozen frame + text up
    // together (never swaps); only a BACKWARD scroll snaps back to the real hero video (from start). ----
    var frozen = false, frozenHover = false, freezeY = 0;
    var heroHandoffArmed = false, lastPX = -1, lastPY = -1;
    var HERO_RESUME = 0.97;     // zoom-out progress at which the hero video pauses/resumes (updateHeroExit)
    var TEXT_SCALE = 0.85;      // CTA TEXT size — applied ALWAYS (independent of the image) so the text is the
                                // SAME size before AND after collapse. Lower = smaller text.
    // Frame/image size = the hero rectangle as-is → image is equal before & after; size set by EXIT_MIN_SCALE.
    function frameScale() { return pullStart.s; }
    function layerTransform() {                                        // CTA: remembered position + TEXT_SCALE
      var y = window.scrollY, vh = window.innerHeight;                 // (always — so the text size never changes
      var ye = window.__heroY ? window.__heroY(y, vh) : y;
      return "translateY(" + (-Math.max(0, ye - 2 * vh)).toFixed(2) + "px) scale(" + TEXT_SCALE + ")";  // before↔after)
    }
    // Mirror updateHeroExit's phase-B `prog` so we know when the office video would resume playing.
    function heroProg() {
      if (!crossed) return pBNow();
      var ct = cT * cT * (3 - 2 * cT);
      var pBT = pBThreshold();
      return pBT + (1 - pBT) * ct;
    }
    // Same grey + blue "blush" filter the hero zoom-out uses (see updateHeroExit). colorOn → true colour.
    function vidFilter(grey, blue, colorOn) {
      var dg = colorOn ? 0 : 1;
      return "grayscale(" + (grey * dg).toFixed(3) + ") brightness(" + (1 - 0.18 * grey * dg).toFixed(3) +
        ") sepia(" + (0.33 * blue * dg).toFixed(3) + ") hue-rotate(" + (185 * blue * dg).toFixed(1) +
        "deg) saturate(" + (1 + 0.33 * blue * dg).toFixed(3) + ")";
    }
    function setFrozenHover(on) {
      frozenHover = on;
      if (receive) receive.style.filter = vidFilter(1, 1, on);   // hover → colour (snap), else grey+blue
      applyColor();                                              // text: blue on hover, white when not
    }
    function pointerOverFrame() {                                // is the cursor currently over the frame/CTA?
      if (lastPX < 0) return false;
      var el = document.elementFromPoint(lastPX, lastPY);
      return !!el && (el === receive || (link && (el === link || link.contains(el))));
    }
    function liftFrozen(y) {                                     // forward scroll: ride UP with the text
      if (!receive) return;
      var vh = window.innerHeight, hy = window.__heroY || function (v) { return v; };
      var lift = Math.max(0, hy(y, vh) - 2 * vh) - Math.max(0, hy(freezeY, vh) - 2 * vh);
      receive.style.transform = "translateY(" + (pullStart.ty - lift).toFixed(2) + "px) scale(" + frameScale().toFixed(4) + ")";
    }
    function heroHandoff() {
      if (!heroHandoffArmed) return;
      var y = window.scrollY || window.pageYOffset || 0;
      // The frozen frame STAYS through the whole paused zone (zoom-out ≥ 97%). It only switches to the
      // real hero video when a BACKWARD scroll drops the zoom-out below 97% — the exact point the office
      // video resumes playing. Forward scroll never crosses this (prog stays 1), so it never switches;
      // it just lifts the frozen frame up with the text.
      if (heroProg() < HERO_RESUME) {
        dismissFrozen();
        if (heroVid) { try { heroVid.pause(); heroVid.currentTime = 0; } catch (er) {} }
        if (window.__updateHeroExit) window.__updateHeroExit();
      } else {
        liftFrozen(y);
      }
    }
    function dismissFrozen() {
      frozen = false; frozenHover = false; hovering = false;   // clear any stuck hover before the hero takes over
      heroHandoffArmed = false;
      window.removeEventListener("scroll", heroHandoff);
      if (receive) {
        receive.classList.remove("is-playing");
        receive.style.transform = ""; receive.style.filter = "";
        receive.style.pointerEvents = ""; receive.style.cursor = "";
        try { receive.pause(); } catch (e) {}
      }
      if (layer) layer.classList.remove("is-collapsing");        // hand the CTA's z-index back to normal
    }
    function finishClose() {
      if (!closing) return;
      closing = false;
      if (closeRAF) { cancelAnimationFrame(closeRAF); closeRAF = 0; }
      // Freeze the collapse clip on WHATEVER frame the zoom-out ENDED on (not the video's final frame),
      // paused at the hero rectangle — dynamic, different each time = the new pause image.
      frozen = true; freezeY = window.scrollY || 0;
      if (receive) {
        try { receive.pause(); } catch (e) {}
        receive.style.transform = "translateY(" + pullStart.ty.toFixed(2) + "px) scale(" + frameScale().toFixed(4) + ")";
        receive.style.pointerEvents = "auto";                    // hoverable → re-colour
        setFrozenHover(pointerOverFrame());                      // at the END: if hovered, snap to colour
        // keep `.is-playing` so the frozen frame stays visible at the rectangle
      }
      // Keep the handwritten "Certificates" CTA on top of the frozen frame, at its remembered position
      // (render() left it at the click-time scroll spot), at its constant TEXT_SCALE size.
      if (layer) { layer.classList.add("is-collapsing"); layer.style.transform = layerTransform(); layer.style.opacity = "1"; }
      if (pullout) { pullout.classList.remove("is-playing"); pullout.style.transform = ""; try { pullout.pause(); } catch (e) {} }
      // Do NOT reveal the hero video here — heroHandoff swaps back ONLY on a backward scroll.
      pullDone = false; pullActive = false;
      lockScroll(false);
      heroHandoffArmed = true;
      window.addEventListener("scroll", heroHandoff, { passive: true });
    }
    function closeCertGallery() {
      if (!pullDone || closing) return;            // only meaningful while the gallery is open
      closing = true;
      if (receive) {
        receive.classList.add("is-playing");
        receive.style.transform = "translateY(0) scale(1)";   // start full screen (covers the gallery)
        // Play the collapse clip from its START (we only remember the rectangle position, not the
        // frame you closed at). loop = false so it ends and HOLDS its last frame — finishClose freezes
        // it there as the new pause image. 1× rate keeps the motion natural.
        try { receive.currentTime = 0; } catch (e) {}
        receive.loop = false;
        receive.playbackRate = 1;
        var rp = receive.play(); if (rp && rp.catch) rp.catch(function () {});
      }
      if (gallery) { gallery.classList.remove("is-open"); gallery.setAttribute("aria-hidden", "true"); }
      // Hide the pull-in clip NOW (it's still full-screen at z-50) so it isn't seen behind the
      // shrinking receive clip — only the hero scene should show around it.
      if (pullout) { pullout.classList.remove("is-playing"); pullout.style.transform = ""; try { pullout.pause(); } catch (e) {} }
      var DUR = 700;                               // snappy zoom-out, decoupled from the looping clip's length
      var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      function frame(now) {
        if (!closing) return;
        var t = Math.max(0, Math.min((now - t0) / DUR, 1));
        var e = t * t * (3 - 2 * t);               // smoothstep — reverse of the pull-in
        var s = 1 + (frameScale() - 1) * e;        // full screen → the (shrunk) hero rectangle's scale
        var ty = pullStart.ty * e;                 // 0 → the hero rectangle's offset
        if (receive) {
          receive.style.transform = "translateY(" + ty.toFixed(2) + "px) scale(" + s.toFixed(4) + ")";
          // Same grey + blue "blush" as the hero zoom-out: colour → grey+blue as it recedes.
          receive.style.filter = vidFilter(e, Math.max(0, Math.min((e - 0.8) / 0.1, 1)), false);
        }
        // Around the MIDPOINT of the collapse, fade the handwritten "Certificates" CTA in ON TOP of
        // the clip (lifted above it by .is-collapsing). The CTA keeps the position it had when the
        // gallery was opened (scroll is locked, so render() left it at the remembered click spot).
        if (layer) {
          layer.classList.add("is-collapsing");
          layer.style.transform = layerTransform();      // remembered position + constant TEXT_SCALE size
          layer.style.opacity = (t < 0.5 ? 0 : (t - 0.5) / 0.5).toFixed(3);
        }
        if (t < 1) closeRAF = requestAnimationFrame(frame); else finishClose();
      }
      closeRAF = requestAnimationFrame(frame);
    }
    function lockScroll(on) {
      var L = window.__lenis;
      if (on) { if (L && L.stop) L.stop(); } else { if (L && L.start) L.start(); }
      document.documentElement.style.overflow = on ? "hidden" : "";
    }
    // Decompose the hero video's live transform (only translateY + uniform scale, no rotation).
    function heroXf() {
      if (!heroVid) return { s: 1, ty: 0 };
      try { var m = new DOMMatrixReadOnly(getComputedStyle(heroVid).transform); return { s: m.a || 1, ty: m.f || 0 }; }
      catch (e) { return { s: 1, ty: 0 }; }
    }
    function playPullout() {
      if (!pullout || pullActive) return;
      pullActive = true;
      dismissFrozen();            // clear any frozen collapse frame left from a previous close
      setHover(false);
      lockScroll(true);
      pullStart = heroXf();                       // remember the hero rectangle (closing returns to it)
      var start = pullStart;                      // where the image is RIGHT NOW (start of the zoom-in)
      pullout.classList.add("is-playing");
      pullout.style.transform = "translateY(" + start.ty + "px) scale(" + start.s.toFixed(4) + ")";
      var RATE = 1.2;                             // clip speed → shorter zoom-in
      try { pullout.currentTime = 0; } catch (e) {}
      pullout.playbackRate = RATE;
      var pr = pullout.play(); if (pr && pr.catch) pr.catch(function () {});
      // Drive the zoom on a wall-clock timer (NOT pullout.currentTime) so it starts the instant
      // you click — currentTime sits at 0 until the clip actually begins decoding, which read as a
      // delay. The video plays alongside; both finish at ~the same time.
      var DUR = ((pullout.duration || 1.5) / RATE) * 1000;
      var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      function frame(now) {
        if (!pullActive) return;
        var t = Math.max(0, Math.min((now - t0) / DUR, 1));
        var e = t * t * (3 - 2 * t);              // smoothstep — same easing feel as the zoom-out
        var s = start.s + (1 - start.s) * e;      // current scale → 1 (full screen)
        var ty = start.ty * (1 - e);              // current offset → 0
        pullout.style.transform = "translateY(" + ty.toFixed(2) + "px) scale(" + s.toFixed(4) + ")";
        if (t < 1) pullRAF = requestAnimationFrame(frame); else finishPullout();
      }
      pullRAF = requestAnimationFrame(frame);
      // Settle full-screen and open the gallery — driven by the zoom finishing (reliable, instant);
      // the clip's own `ended` is a fallback in case it stalls. Scroll stays locked (modal).
      pullout.addEventListener("ended", finishPullout, { once: true });
    }
    function finishPullout() {
      if (pullDone) return;
      pullDone = true;
      if (pullRAF) { cancelAnimationFrame(pullRAF); pullRAF = 0; }
      if (pullout) pullout.style.transform = "translateY(0) scale(1)";
      openCertGallery();
    }

    if (link) {
      link.addEventListener("pointerenter", onEnter);
      link.addEventListener("pointerleave", onLeave);
      link.addEventListener("click", function (e) { if (active) { e.preventDefault(); playPullout(); } });
    }
    if (heroVid) {
      heroVid.addEventListener("pointerenter", onEnter);
      heroVid.addEventListener("pointerleave", onLeave);
      heroVid.addEventListener("click", function () { if (active) playPullout(); });
    }
    // Track the cursor so finishClose can tell if the frozen frame is being hovered at the END of the
    // collapse (pointerenter won't fire on a stationary cursor when pointer-events flips to auto).
    window.addEventListener("pointermove", function (e) { lastPX = e.clientX; lastPY = e.clientY; }, { passive: true });
    // Hovering the frozen frame itself (outside the CTA text) re-colours it; leaving → grey+blue.
    if (receive) {
      receive.addEventListener("pointerenter", function () { if (frozen) setFrozenHover(true); });
      receive.addEventListener("pointerleave", function () { if (frozen) setFrozenHover(false); });
    }

    // ---- Close triggers: back button, Esc, and reaching the end of the gallery scroll. ----
    var backBtn = gallery && gallery.querySelector(".cert-gallery__back");
    if (backBtn) backBtn.addEventListener("click", closeCertGallery);
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.key === "Esc") && pullDone && !closing) closeCertGallery();
    });
    if (galleryScroll) {
      function atBottom() { return galleryScroll.scrollTop + galleryScroll.clientHeight >= galleryScroll.scrollHeight - 2; }
      // No resistance at the end. The final slide loops the collapse video; once it's fully up (at
      // the bottom of the scroll), a scroll-DOWN (or an upward swipe past the end) collapses the
      // gallery immediately. The close continues that video from its current frame (closeCertGallery).
      // Esc / Back still close from anywhere.
      galleryScroll.addEventListener("wheel", function (e) {
        if (!pullDone || closing) return;
        if (e.deltaY > 0 && atBottom()) closeCertGallery();    // over-scroll down at the end → collapse
      }, { passive: true });
      var touchY = 0;
      galleryScroll.addEventListener("touchstart", function (e) { touchY = e.touches[0].clientY; }, { passive: true });
      galleryScroll.addEventListener("touchmove", function (e) {
        if (!pullDone || closing) return;
        if ((touchY - e.touches[0].clientY) > 12 && atBottom()) closeCertGallery();   // swipe up past the end → collapse
      }, { passive: true });
    }
    var lens = [], total = 1, thrLen = 0;
    // THRESHOLD model: the scroll-driven pen lays down the strokes BEFORE "thin24" (data-i 23).
    // The moment the pen reaches thin24, a threshold fires and the REST of the writing —
    // strokes 23..45, INCLUDING the four tail strokes — plays as a single TIMED completion
    // (cT 0→1), no longer scrubbed by scroll. The video finishes its zoom-out + pause on the SAME
    // timer (updateHeroExit reads window.__certWrite), and the word POPS (fills solid + becomes
    // clickable) only when the timer ends — i.e. once the last four strokes are complete. Fully
    // reversible: scrolling back above the threshold un-fires it (cT ramps back to 0).
    var THRESH_I = 23;                        // "thin24" — first stroke of the timed completion
    var POP_W = "26";                         // strokes snap to this width at the pop...
    var POP_KEEP = ["25", "26", "27"];        // ...except thick26/thick27/thick28, which keep their own pen width
    function measure() {
      total = 0; thrLen = 0;
      segs.forEach(function (s, i) {
        var L = 1; try { L = s.getTotalLength() || 1; } catch (e) {}
        lens[i] = L; s._len = L; total += L;
        s.style.strokeDasharray = L;
        s.style.strokeDashoffset = L;     // start fully un-inked
        if (+s.getAttribute("data-i") < THRESH_I) thrLen += L;   // cumulative length before thin24
      });
    }
    // pBThr = the zoom-out progress (pB) at which the scroll-driven ink reaches thin24. Writing is
    // scrubbed over pB 0.5→1 with ink = p·total, so the threshold sits at p = thrLen/total.
    function pBThreshold() { return 0.5 + 0.5 * (thrLen / total); }

    var cT = 0;                  // completion factor: 0 = at the threshold, 1 = popped
    var crossed = false;         // has the scroll-driven pen reached thin24?
    var reversing = false;       // are we un-writing on scroll-up? (then cT is scroll-driven, not timed)
    var pBMax = 0;               // furthest zoom-out reached while crossed — anchors the scroll-driven reverse
    var prevPB = -1;
    var rafId = 0, lastT = 0;
    var DUR = 550;               // ms for the FORWARD timed completion (strokes 23..45 + the video finish) — sped up from 1100

    function pBNow() { var vh = window.innerHeight, ye = window.__heroY ? window.__heroY(window.scrollY, vh) : window.scrollY; return Math.max(0, Math.min((ye - vh) / vh, 1)); }
    function scrollInk() {       // scroll-driven ink length (drives strokes BEFORE the threshold)
      var pB = pBNow();
      var p = reduce ? (pB > 0.5 ? 1 : 0) : Math.max(0, Math.min((pB - 0.5) / 0.5, 1));
      return p * total;
    }
    // On scroll-UP the completion is SCROLL-driven: cT maps the band [threshold, furthest-reached]
    // back to [0,1], so the writing + video un-wind in step with the scroll (anchored at pBMax so it
    // leaves the popped state without a jump). Forward stays the timed completion.
    function reverseCT() {
      var pBT = pBThreshold(), d = pBMax - pBT;
      if (d <= 1e-4) return pBNow() >= pBMax ? 1 : 0;
      return Math.max(0, Math.min((pBNow() - pBT) / d, 1));
    }
    function render(inkedScroll) {
      var y = window.scrollY, vh = window.innerHeight;
      // The CTA rides UP with the video (phase C, >2vh) at its constant TEXT_SCALE size (layerTransform),
      // so the text is the SAME size before and after collapse.
      layer.style.transform = layerTransform();
      var written = cT >= 0.999;
      // Hand the threshold state to the video (read by updateHeroExit each frame).
      window.__certWrite = { crossed: crossed, t: cT, pBThr: pBThreshold() };
      var inkedTimed = thrLen + cT * (total - thrLen);   // strokes 23..45 reveal on the timer
      var acc = 0;
      segs.forEach(function (s, i) {
        var di = s.getAttribute("data-i");
        if (written) {
          // Popped: every stroke fully inked and snapped to one WIDE band (26) so the calligraphy
          // fills solidly — except thick27/thick28, which keep their own pen width (26 spills there).
          s.style.visibility = "visible";
          s.style.strokeDashoffset = 0;
          s.style.strokeWidth = POP_KEEP.indexOf(di) >= 0 ? "" : POP_W;
        } else {
          // Strokes before thin24 scrub with scroll; thin24 onward reveal on the timer (inkedTimed).
          var ref = (+di < THRESH_I) ? inkedScroll : inkedTimed;
          var lp = Math.max(0, Math.min((ref - acc) / lens[i], 1));
          // Hide a stroke until its ink reaches it (avoids round-cap dots on un-started strokes).
          s.style.visibility = lp > 0 ? "visible" : "hidden";
          s.style.strokeDashoffset = (lens[i] * (1 - lp)).toFixed(2);
          s.style.strokeWidth = "";   // restore the per-stroke pen widths on scroll-up
        }
        acc += lens[i];
      });
      layer.style.opacity = (inkedScroll > 0.001 || cT > 0.001) ? 1 : 0;
      layer.classList.toggle("is-written", written);
      // Clickable + hoverable from the moment the THRESHOLD is hit (crossed) — both directions:
      // it activates as the pen reaches thin24 on the way down, and stays active on scroll-up until
      // you cross back above the threshold. (The visual pop/fill is separate, tied to cT above.)
      setActive(crossed);
      applyColor();   // keep the hover blue in step with cT as it changes (it's gated by completion)
    }
    function tick(now) {                            // FORWARD only: ramp the timed completion to 1
      rafId = 0;
      var dt = lastT ? (now - lastT) : 16; lastT = now;
      if (!reduce && crossed && !reversing && cT < 1) cT = Math.min(cT + dt / DUR, 1);
      render(scrollInk());
      if (window.__updateHeroExit) window.__updateHeroExit();   // the video follows the timer
      var running = !reduce && crossed && !reversing && cT < 1;
      if (running) rafId = requestAnimationFrame(tick); else lastT = 0;
    }
    function kickRAF() { if (!rafId && !reduce) { lastT = 0; rafId = requestAnimationFrame(tick); } }
    function update() {
      var inkedScroll = scrollInk(), pB = pBNow();
      crossed = reduce ? (pB > 0.5) : (inkedScroll >= thrLen - 0.001);   // pen reached thin24?
      var up = pB < prevPB - 1e-6, down = pB > prevPB + 1e-6;
      prevPB = pB;
      if (!crossed) { reversing = false; pBMax = 0; cT = 0; }
      else {
        pBMax = Math.max(pBMax, pB);
        if (reduce) { cT = 1; }
        else if (up) { reversing = true; cT = Math.min(cT, reverseCT()); }   // scroll-driven un-write
        else if (down) { reversing = false; kickRAF(); }                     // forward → timed completion
        // (no movement while crossed: leave cT as-is; any in-flight timer keeps running)
      }
      render(inkedScroll);
      if (window.__updateHeroExit) window.__updateHeroExit();   // video tracks the fresh cT this frame
    }
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", function () { measure(); update(); }, { passive: true });
    // Re-measure once the SVG has surely laid out (fonts/scale settle).
    window.addEventListener("load", function () { measure(); update(); });
  })();

  /* ---------- Moving-text marquee behind the hero (scroll-driven, Lando-style) ----------
     Replaces the old tool-logo marquee: big impact words (my tools/skills as TEXT) scroll
     horizontally in alternating rows behind the hero video, fading in + riding up exactly as
     the logos did. Same horizontal-loop mechanics; the children are now <span> words. */
  var marquee = document.querySelector(".tool-marquee");
  if (marquee) {
    // Two rows only, like the reference. Top row = filled darker blue (bold sans); bottom row
    // = outlined contrasting serif. Each row carries its own word set + font/colour modifier.
    var ROWS = [
      { dir: -1, speed: 120, mod: "is-top",
        set: ["PYTHON", "TYPESCRIPT", "DATA PIPELINES", "FASTAPI", "POSTGRESQL", "PYTORCH", "AWS"] },
      { dir:  1, speed: 140, mod: "is-bottom",
        set: ["WEB SCRAPING", "MACHINE LEARNING", "BACKEND APIS", "DOCKER", "PANDAS", "QUANT ANALYSIS"] }
    ];
    var COPIES = 4;                                          // repeats per row → seamless loop
    var rowEls = ROWS.map(function (cfg) {
      var row = document.createElement("div");
      row.className = "tool-marquee__row " + cfg.mod;
      for (var d = 0; d < COPIES; d++) {
        cfg.set.forEach(function (t) {
          var span = document.createElement("span");
          span.className = "tool-marquee__word";
          span.textContent = t;
          row.appendChild(span);
        });
      }
      marquee.appendChild(row);
      return { el: row, dir: cfg.dir, speed: cfg.speed, offset: 0, setW: 1, count: cfg.set.length };
    });
    // Cache each row's EXACT repeat stride = distance from the first item of copy 0 to the
    // first item of copy 1 (includes the inter-item gap). Using scrollWidth/COPIES was off by
    // the missing trailing gap, so the seam didn't line up → a jump at the wrap point.
    // Only re-measured on load/resize (per-frame measuring caused jitter while fonts load).
    function measure() {
      rowEls.forEach(function (r) {
        var a = r.el.children[0], b = r.el.children[r.count];
        r.setW = (b && a) ? (b.offsetLeft - a.offsetLeft) || 1 : 1;
      });
    }
    // Vertical position + fade follow scroll; horizontal motion is time-based (constant).
    // scrollSign flips the rows' horizontal direction with scroll direction: +1 on scroll
    // DOWN (rows move their natural way), -1 on scroll UP (both rows reverse). Held between
    // scrolls so an idle marquee keeps the last direction.
    var lastY = window.scrollY, scrollSign = 1;
    function updateMarquee() {
      var y = window.scrollY, vh = window.innerHeight;
      if (y < lastY) scrollSign = -1;
      else if (y > lastY) scrollSign = 1;
      lastY = y;
      // The marquee sits BEHIND the video — hidden during the pull-up (phase A, y < vh) AND
      // the fullscreen checkpoint dwell; it fades in as the video zooms out (phase B)...
      var ye = window.__heroY ? window.__heroY(y, vh) : y;
      marquee.style.opacity = Math.max(0, Math.min((ye - vh) / (vh * 0.55), 1));
      // ...then rides UP with the video as it hands over to the flow (phase C, ye > 2vh).
      var lift = Math.max(0, ye - 2 * vh);
      marquee.style.transform = "translate3d(0," + (-lift) + "px,0)";
    }
    var lastT = 0;
    function tick(now) {
      var dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0;  // clamp so a tab-resume can't jump
      lastT = now;
      rowEls.forEach(function (r) {
        var setW = r.setW;
        r.offset += r.dir * scrollSign * r.speed * dt;
        var wrapped = ((r.offset % setW) + setW) % setW; // 0 → setW, seamless wrap
        r.el.style.transform = "translate3d(" + (wrapped - setW) + "px,0,0)";
      });
      requestAnimationFrame(tick);
    }
    function onResize() { measure(); updateMarquee(); }
    window.addEventListener("scroll", updateMarquee, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);          // re-measure once fonts affect layout
    measure();
    updateMarquee();
    requestAnimationFrame(tick);
  }

  /* ---------- GitHub card: revealed OVER the video during the hero's internal
     zoom-out (phase A, the 1.55→1.0 pull-back), faded out as the edge zoom-out
     begins. Live profile/repo data pulled from the GitHub REST API (unauthenticated;
     falls back to the static markup on any error / before it resolves). ---------- */
  var ghReveal = document.querySelector(".gh-reveal");
  if (ghReveal) {
    var ghCard = ghReveal.querySelector(".gh-card");
    var GH_USER = "VishnujanNarayanan";
    function ghEl(k) { return ghReveal.querySelector('[data-gh="' + k + '"]'); }
    // GitHub dark-theme contribution palette: empty cell + 4 green levels.
    var GH_LEVELS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
    var GH_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Render the last-year calendar as an SVG grid (weeks = columns, day-of-week = rows),
    // matching GitHub's dark theme — so empty days are dark (#161b22), not white.
    function ghBuildGraph(contribs) {
      var chart = ghEl("chart");
      if (!chart || !Array.isArray(contribs) || !contribs.length) return;
      var STEP = 13, SIZE = 11, TOP = 18, col = 0, lastMonth = -1, lastLabelCol = -99, cells = "", labels = "";
      var first = new Date(contribs[0].date + "T00:00:00Z");
      var stubMonth = first.getUTCDate() > 7 ? first.getUTCMonth() : -1;  // leading partial month → skip its label
      contribs.forEach(function (d, i) {
        var dt = new Date(d.date + "T00:00:00Z"), dow = dt.getUTCDay();
        if (i > 0 && dow === 0) col++;
        var x = col * STEP, y = TOP + dow * STEP;
        cells += '<rect x="' + x + '" y="' + y + '" width="' + SIZE + '" height="' + SIZE +
          '" rx="2" ry="2" fill="' + (GH_LEVELS[d.level] || GH_LEVELS[0]) + '"/>';
        if (dow === 0) {
          var m = dt.getUTCMonth();
          // label each month once, but skip the leading stub month and keep ≥3 columns between labels.
          if (m !== lastMonth) {
            lastMonth = m;
            if (m !== stubMonth && col - lastLabelCol >= 3) {
              labels += '<text x="' + x + '" y="11" fill="#7d8590" font-size="9">' + GH_MONTHS[m] + '</text>';
              lastLabelCol = col;
            }
          }
        }
      });
      // +16 right padding so a last-column label isn't clipped; -4 top so the month text
      // (which sits above y=0) has headroom and isn't shaved at the top edge of the viewBox.
      var w = (col + 1) * STEP - (STEP - SIZE) + 16, h = TOP + 7 * STEP - (STEP - SIZE);
      chart.innerHTML = '<svg viewBox="0 -4 ' + w + " " + (h + 4) + '" preserveAspectRatio="xMinYMin meet">' + labels + cells + "</svg>";
    }
    // --- live data ---
    (function fetchGitHub() {
      if (!window.fetch) return;                               // keep static fallback
      fetch("https://api.github.com/users/" + GH_USER)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (u) {
          var av = ghEl("avatar"); if (av && u.avatar_url) { av.src = u.avatar_url; av.alt = (u.name || GH_USER) + " on GitHub"; }
          var h = ghEl("handle"); if (h) h.textContent = "@" + (u.login || GH_USER);
          var bio = ghEl("bio"); if (bio && u.bio) bio.textContent = u.bio;
        })
        .catch(function () {});                                 // silent → static fallback stays
      fetch("https://api.github.com/users/" + GH_USER + "/repos?per_page=100&sort=updated")
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (list) {
          if (!Array.isArray(list) || !list.length) return;
          var top = list.filter(function (r) { return !r.fork; })
            .sort(function (a, b) {
              return (b.stargazers_count || 0) - (a.stargazers_count || 0) ||
                     (new Date(b.pushed_at) - new Date(a.pushed_at));
            })
            .slice(0, 8);
          var ul = ghEl("repos-list");
          if (ul && top.length) {
            ul.innerHTML = top.map(function (r) {
              var li = document.createElement("li"); li.textContent = r.name; return li.outerHTML;
            }).join("");
          }
        })
        .catch(function () {});
      // Last-year contribution TOTAL (GitHub's REST API can't return it without auth; this
      // public endpoint mirrors the contribution calendar). Silent fallback to the static "—".
      fetch("https://github-contributions-api.jogruber.de/v4/" + GH_USER + "?y=last")
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (d) {
          // Keep only the last 8 months of the daily calendar.
          var contribs = (d && d.contributions) || [];
          var cut = new Date(); cut.setMonth(cut.getMonth() - 8);
          var cutStr = cut.toISOString().slice(0, 10);
          contribs = contribs.filter(function (c) { return c.date >= cutStr; });
          var total = contribs.reduce(function (s, c) { return s + (c.count || 0); }, 0);
          var el = ghEl("contrib");
          if (el) el.textContent = total.toLocaleString();
          ghBuildGraph(contribs);
        })
        .catch(function () {});
    })();
    // --- scroll reveal (synced to phase A's internal zoom-out) ---
    function smooth(t) { return t * t * (3 - 2 * t); }
    // The card is ANCHORED TO THE VIDEO: it tracks the video's vertical motion (the same
    // vTy the hero uses) so it rides UP with the video as it comes up, instead of being
    // stuck to the page. Its CSS height is the FULL/design size (GH_END of the viewport);
    // scaling it makes it read smaller, so it GROWS from the bottom-left corner from
    // GH_START → GH_END as the video reaches fullscreen. No fade, no rotation, no slide
    // independent of the video.
    var GH_START = 0.40, GH_END = 0.65;           // visual height (× viewport): at reveal → at fullscreen
    function updateGhCard() {
      var y = window.scrollY, vh = window.innerHeight;
      var ye = window.__heroY ? window.__heroY(y, vh) : y;   // dwell-aware effective scroll
      var sc, op, ty;
      if (ye <= vh) {
        // Phase A: ride up WITH the video (ty = vh − ye, the video's own translate), so the
        // card emerges from the video's bottom and settles as the video fills the screen.
        // Through the fullscreen checkpoint dwell ye == vh, so it stays settled.
        ty = vh - ye;
        var g = smooth(Math.max(0, Math.min(ye / vh, 1)));
        var frac = GH_START + (GH_END - GH_START) * g;   // 0.40 → 0.75 of the viewport
        sc = frac / GH_END;                              // 0.533 → 1 (card's base height is GH_END)
        op = 1;                                          // off-screen below at the top, so no fade needed
      } else {
        // Phase B: shrink + fade back out so the fixed card never covers the sections below.
        var x = smooth(Math.max(0, Math.min((ye - vh) / (0.35 * vh), 1)));
        ty = 0; sc = 1 - 0.5 * x; op = 1 - x;
      }
      ghReveal.style.opacity = op.toFixed(3);
      ghCard.style.transform = "translateY(" + ty.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
      ghReveal.classList.toggle("is-live", op > 0.6 && ye >= 0.6 * vh && ye <= vh * 1.02);
    }
    window.addEventListener("scroll", updateGhCard, { passive: true });
    window.addEventListener("resize", updateGhCard, { passive: true });
    updateGhCard();
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
    [".features", ".brand-teaser", ".brand-manifesto", ".faq"].forEach(function (sel) {
      var el = document.querySelector(sel); if (!el) return;
      var c = document.createElement("canvas"); c.className = "section-contours";
      el.insertBefore(c, el.firstChild);
      // The projects section (.features) keeps the solid backing but NO contour
      // lines (user request) — and a DARKER near-black navy fill so it reads like the
      // black terminal bar. Skills (.standards) uses the SAME LIGHT field as the blog
      // (light-blue fill + dark indigo lines), not the dark navy one. Services (.faq)
      // keeps the standard dark navy + its light-blue lines.
      var isFeatures = sel === ".features", isSkills = sel === ".brand-teaser" || sel === ".brand-manifesto";
      darkSecs.push({
        el: el, cv: c, ctx: c.getContext("2d"), w: 0, h: 0,
        noLines: isFeatures,
        // Brand zone: contour lines fade to the fill colour so they're invisible
        // by the time the manifesto ("I build data systems...") fills the screen.
        // Teaser fades as it scrolls OUT the top; manifesto fades as it scrolls IN
        // (gone once its top reaches the viewport top) — the two stay continuous
        // across the seam (both 100vh).
        fadeOut: sel === ".brand-teaser" || sel === ".brand-manifesto",
        fadeMode: sel === ".brand-manifesto" ? "enter" : "through",
        lineBaseA: isSkills ? 0.5 : 0.45,
        fill: isFeatures ? "rgb(15,22,40)" : isSkills ? "rgb(208,225,235)" : "rgb(27,34,54)",
        line: isSkills ? "rgba(57,50,220,0.5)" : "rgba(77,139,255,0.45)"
      });
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
        sg.fillStyle = sec.fill; sg.fillRect(0, 0, W, sh);
        if (sec.noLines) continue;                         // projects: solid fill, no contour lines
        sg.save(); sg.translate(0, -sr.top);
        sg.lineCap = "round"; sg.lineJoin = "round";
        var lineStyle = sec.line;
        if (sec.fadeOut) {
          // ft = 0 → full-strength lines, 1 → fully blended into the fill.
          // "enter" (manifesto): 0 when its top is one viewport below, 1 once its
          // top reaches the viewport top (full screen). "through" (teaser): 0 when
          // its top sits at the viewport top, 1 once a full section-height scrolls past.
          var ft = sec.fadeMode === "enter"
            ? (H - sr.top) / H
            : (sh > 0 ? -sr.top / sh : 0);
          ft = ft < 0 ? 0 : ft > 1 ? 1 : ft;
          lineStyle = "rgba(57,50,220," + (sec.lineBaseA * (1 - ft)).toFixed(3) + ")";
        }
        sg.strokeStyle = lineStyle; sg.lineWidth = 0.45;
        strokeIso(sg);
        sg.restore();
      }
      // "Filter by" sidebar ONLY: same navy + contour lines (the rest of the projects
      // section stays a flat solid fill). The canvas lives inside .term-side; translating
      // by its on-screen rect keeps the lines aligned with the shared viewport field.
      var sideCv = document.querySelector(".term-side-contours");
      if (sideCv && sideCv.parentNode) {
        var side = sideCv.parentNode, cw = side.clientWidth, ch = side.scrollHeight;
        if (cw && ch && (sideCv._w !== cw || sideCv._h !== ch)) {
          sideCv._w = cw; sideCv._h = ch;
          sideCv.width = cw * DPR; sideCv.height = ch * DPR;
          sideCv.style.width = cw + "px"; sideCv.style.height = ch + "px";
          sideCv.getContext("2d").setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        if (cw && ch) {
          var scg = sideCv.getContext("2d"), srect = sideCv.getBoundingClientRect();
          scg.clearRect(0, 0, cw, ch);
          scg.fillStyle = "rgb(15,22,40)"; scg.fillRect(0, 0, cw, ch);
          scg.save(); scg.translate(-srect.left, -srect.top);
          scg.lineCap = "round"; scg.lineJoin = "round";
          scg.strokeStyle = "rgba(77,139,255,0.45)"; scg.lineWidth = 0.45;
          strokeIso(scg);
          scg.restore();
        }
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

  /* ---------- Writing — APPEAR: bouncy fan-out from the rightmost panel ----------
     A SINGLE threshold (the section's top crossing mid-viewport, handing off from flow) springs
     the panels in. They start STACKED onto the rightmost panel and FAN OUT leftward into their
     final accordion layout — the same idea as the socials cards, but anchored on the RIGHTMOST
     panel (it never moves; the rest emerge from behind it) and with a BOUNCE (a reveal spring
     that overshoots past its resting pose then settles). Once it settles it hands off to the
     live sticky-hover accordion — everything the panels do AFTER they're in place is untouched. */
  (function () {
    var section = document.querySelector(".writing");
    var wstack = section && section.querySelector(".wstack");
    if (!section || !wstack) return;
    var panels = Array.prototype.slice.call(wstack.querySelectorAll(".wpanel"));
    if (!panels.length) return;
    var N = panels.length;
    // ---- Appear: FAN-OUT from the rightmost panel (bouncy), like the socials cards ----
    // The panels are laid out in their FINAL (settled) layout and then transformed so they
    // start STACKED onto the rightmost panel and SPRING out leftward into place. A reveal
    // spring (pCur 0<->1) overshoots past 1 → the fan settles with a BOUNCE. The rightmost
    // panel is the anchor (it never moves); the rest emerge from behind it. Once the spring
    // comes to rest we hand off to the live accordion (setSettled) — everything the panels
    // do AFTER they're in place is untouched. The trigger one-shot latches.
    var ROT_STEP = 0.8;        // deg of fan tilt per panel of distance from the rightmost
    var ROT_MAX  = 7;          // cap the tilt so the tall panels don't skew oddly
    var Y_STEP   = 9;          // px downward dip per distance-step when stacked (eased to 0)
    var S_STEP   = 0.012;      // scale-down per distance-step when stacked (eased to 1)
    var PR_STIFF = 80, PR_DAMP = 11;                    // reveal spring — slower (~0.9s settle), same ~9% bounce (zeta ~0.62)
    var reduceMo = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var pCur = reduceMo ? 1 : 0, pVel = 0, pT = reduceMo ? 1 : 0;
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }

    // Resolved geometry (clamps → px), cached; recomputed on resize.
    var G = { W: 0, H: 0, openBasis: 0, per: 0, stripW: 0, openW: 0, ph: [] };
    function geom() {
      var wr = wstack.getBoundingClientRect();
      G.W = wr.width; G.H = wr.height;
      var rail = panels[0].querySelector(".wpanel__rail");
      var strip = rail ? parseFloat(getComputedStyle(rail).minWidth) : 90;     // = --strip
      // The open panel's basis is strip + --cw (the CSS `.wpanel.is-open{flex-basis:calc(--strip + --cw)}`),
      // NOT the content's own (wider) clamped width — otherwise the JS "open" overshoots the real settled width.
      var cw = parseFloat(getComputedStyle(section).getPropertyValue("--cw")) || 230;
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

    // Arrival positions: ALL panels are the SAME (equal) width while fanning in — none is open
    // yet. The per-panel offset stacks each panel onto the rightmost one.
    function leftPos(i) { return i * G.per; }                     // equal-width slots (W/N each)
    function stackDX(i) { return leftPos(N - 1) - leftPos(i); }   // px to slide panel i onto the rightmost

    // Place the panels in their ARRIVAL layout. Panel 0 ARRIVES CLOSED (equal width) and stays
    // closed until the reveal spring passes OPEN_START; from there it WIDENS from its equal-width
    // slot toward the open width (the others shrink to their strip width to match) and gets
    // `is-open` so its content/divider/READ reveal in step — finishing exactly as the fan settles.
    var OPEN_START = 0.9;                                        // fraction of the reveal spring at which panel 0 starts opening
    function easeIO(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function applyFanLayout() {
      var op = easeIO(clamp((pCur - OPEN_START) / (1 - OPEN_START), 0, 1));   // 0 → 1 open progress
      panels.forEach(function (p, i) {
        p.style.transition = "none";
        p.style.flexGrow = "0"; p.style.flexShrink = "0";
        var basis = (i === 0) ? lerp(G.per, G.openW, op) : lerp(G.per, G.stripW, op);   // widths always sum to G.W
        p.style.flexBasis = basis.toFixed(2) + "px";
        p.style.height = G.H + "px";
        p.style.transformOrigin = "50% 100%";
        p.classList.toggle("is-open", i === 0 && op > 0);        // closed until op>0, then reveals as it widens
      });
    }
    // FAN(p): stacked-onto-the-rightmost (p=0) → in place (p=1). p can overshoot past 1, so q
    // goes slightly negative → the panels spring a touch past their resting pose then settle = bounce.
    function fanPaint(p) {
      var q = 1 - p;
      panels.forEach(function (pan, i) {
        var d = (N - 1) - i;                             // distance from the rightmost anchor (0)
        var tx = q * stackDX(i);
        var ty = q * d * Y_STEP;
        var rot = -q * clamp(d * ROT_STEP, 0, ROT_MAX);  // tilt up-left as it fans out
        var sc = 1 - q * d * S_STEP;
        pan.style.transform =
          "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(4) + ")";
        pan.style.opacity = clamp(0.15 + p * 1.25, 0, 1).toFixed(3);
      });
    }

    var settled = null;                                 // tri-state: null/false/true
    function setSettled(on) {
      if (on === settled) return;
      settled = on;
      panels.forEach(function (p, i) {
        if (on) {                                        // hand off to the live CSS accordion
          p.style.transition = ""; p.style.transform = ""; p.style.transformOrigin = ""; p.style.clipPath = "";
          p.style.flexBasis = ""; p.style.flexGrow = ""; p.style.flexShrink = "";
          p.style.boxShadow = ""; p.style.opacity = "";  // back to the CSS base (bleed + full opacity)
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

    var lastT = 0, latched = false;                     // last frame stamp + one-shot trigger latch

    // ---- Cover-scroll lock --------------------------------------------------
    // The features section is pulled up 100vh (margin-top:-100svh) and rides OVER
    // the pinned blog during .writing's second (sticky) 100vh. The fan-out, though,
    // springs over its own time — so scrolling fast could push features up over panels
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
          ["transition", "transform", "transformOrigin", "clipPath", "flexBasis", "flexGrow", "flexShrink", "height", "boxShadow", "opacity"].forEach(function (k) { p.style[k] = ""; });
          if (TXT[i].vert) { TXT[i].vert.style.top = ""; TXT[i].vert.style.opacity = ""; }
          if (TXT[i].num) { TXT[i].num.style.bottom = ""; TXT[i].num.style.opacity = ""; }
          p.classList.remove("is-open");
        }); settled = null; }
        lastT = 0;
        return;
      }
      if (reduceMo) { setSettled(true); return; }        // no fan: land in place immediately
      var vh = window.innerHeight;
      var rect = section.getBoundingClientRect();
      // SINGLE THRESHOLD: as the section's top crosses mid-viewport (rising in from flow) the
      // fan-out springs in. It ONE-SHOT latches, so it always completes once started.
      var triggered = rect.top <= vh * 0.5;
      if (triggered) latched = true;
      if (!lastT) lastT = now;
      var dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;  // clamp dt (tab-switch safety)

      pT = (latched || triggered) ? 1 : 0;
      var f = PR_STIFF * (pT - pCur) - PR_DAMP * pVel;             // step the reveal spring (overshoots → bounce)
      pVel += f * dt; pCur += pVel * dt;
      var atRest = pT === 1 && Math.abs(1 - pCur) < 0.0015 && Math.abs(pVel) < 0.0015;

      // Hold the cover-scroll while the fan is still springing in: lock once the pin reaches
      // the top (rect.top ≤ 0), release the instant it settles.
      if (!atRest && latched && rect.top <= 0) engageLock(); else if (atRest) releaseLock();

      if (atRest) { pCur = 1; pVel = 0; setSettled(true); return; }  // landed → live accordion
      setSettled(false);
      applyFanLayout();
      fanPaint(pCur);
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
    // n=name, d=description (first outcome bullet), t=tech tags, h=subpage link
    // (4 existing only), code=GitHub repo (drives the "View code" notch button),
    // img=card image (cycles the 4 flow placeholders). Content from master_profile.yaml.
    // n=name, d=desc, t=visible card tags, h=subpage, code=GitHub, img=card image.
    // tools = full tech stack (from master_profile.yaml, fuller than the visible tags)
    // and dom = domain(s) — both drive the side-panel "Filter by" facets.
    var PROJECTS = [
      { n: "Market Data Platform", d: "28-pipeline NSE market-data ingestion layer feeding 12+ datasets into a partitioned store.", t: ["Python", "pandas", "ETL", "SQL"], tools: ["Python", "pandas", "NumPy", "SQL", "ETL"], dom: ["Data", "Finance"], h: "projects/market-data-pipeline/index.html", img: "images/flow/data-collection.jpg" },
      { n: "Product Explorer", d: "Full-stack TypeScript app scraping a book catalog into PostgreSQL, served via Next.js with real-time WebSocket scraping.", t: ["TypeScript", "NestJS", "PostgreSQL", "Redis"], tools: ["TypeScript", "NestJS", "Next.js", "PostgreSQL", "Redis", "WebSockets"], dom: ["Scraping", "Backend", "Full-Stack", "Data"], h: "projects/product-explorer/index.html", img: "images/flow/processing-storage.jpg" },
      { n: "Fraud Transaction Detection", d: "Fraud-detection model on 6.4M transactions — 95% caught at 0.995 ROC-AUC despite a 0.13% fraud rate.", t: ["Python", "scikit-learn", "pandas"], tools: ["Python", "scikit-learn", "pandas", "NumPy", "SciPy"], dom: ["ML", "Data", "Finance"], h: "projects/fraud-detection/index.html", code: "https://github.com/VishnujanNarayanan/Fraud_Transaction_Detection", img: "images/flow/ml-analysis.jpg" },
      { n: "Minute-Level Stock Prediction", d: "Intraday price-direction system over 9.4M NSE ticks, raising next-minute precision from 0.51 to 0.61.", t: ["Python", "scikit-learn", "Backtesting"], tools: ["Python", "scikit-learn", "pandas", "Backtesting"], dom: ["ML", "Quant", "Finance", "Data"], h: "projects/nse-stock-prediction/index.html", code: "https://github.com/VishnujanNarayanan/minute-level-stock-prediction", img: "images/flow/build-ship.jpg" },
      { n: "Trader Sentiment Analysis", d: "Quantified how Bitcoin Fear & Greed sentiment drives trader PnL across 211K crypto trades, with a contrarian sentiment-gated signal.", t: ["Python", "pandas", "SciPy", "Statistics"], tools: ["Python", "pandas", "SciPy", "Matplotlib"], dom: ["Finance", "Quant", "Data"], code: "https://github.com/VishnujanNarayanan/Trader_sentiment_analysis", img: "images/flow/data-collection.jpg" },
      { n: "Nexora Semantic Vibe Matcher", d: "Semantic product-search engine that embeds descriptions and ranks by cosine similarity — finds matches with no shared keywords.", t: ["Python", "sentence-transformers", "NLP"], tools: ["Python", "sentence-transformers", "PyTorch"], dom: ["ML", "NLP"], code: "https://github.com/VishnujanNarayanan/nexora_submission", img: "images/flow/processing-storage.jpg" },
      { n: "Support Ticket Classifier", d: "End-to-end NLP system classifying support tickets by issue type and urgency and extracting entities, served via a Gradio app.", t: ["Python", "scikit-learn", "NLTK", "Gradio"], tools: ["Python", "scikit-learn", "NLTK", "Gradio"], dom: ["ML", "NLP"], code: "https://github.com/VishnujanNarayanan/ticket-classifier-nlp", img: "images/flow/ml-analysis.jpg" },
      { n: "Semantic Quote Retrieval", d: "Semantic quote search — fine-tuned sentence embeddings + FAISS index over ~2,500 quotes, served through Streamlit.", t: ["Python", "FAISS", "PyTorch", "Streamlit"], tools: ["Python", "FAISS", "PyTorch", "sentence-transformers", "Streamlit"], dom: ["ML", "NLP"], code: "https://github.com/VishnujanNarayanan/Quotes_Retrieval", img: "images/flow/build-ship.jpg" },
      { n: "Age & Gender Classifier", d: "Multi-task CNN predicting age and gender from a face photo, trained on 10,000+ UTKFace images with face detection and alignment.", t: ["Python", "TensorFlow", "Keras", "OpenCV"], tools: ["Python", "TensorFlow", "Keras", "OpenCV"], dom: ["ML", "Computer Vision"], code: "https://github.com/VishnujanNarayanan/Image_classifier", img: "images/flow/data-collection.jpg" },
      { n: "Neural Network From Scratch", d: "Feed-forward classifier built in pure NumPy — 97.4% accuracy / 0.995 ROC-AUC on Breast-Cancer-Wisconsin, with hand-derived backprop.", t: ["Python", "NumPy"], tools: ["Python", "NumPy"], dom: ["ML"], code: "https://github.com/VishnujanNarayanan/Neural_net_from_scratch", img: "images/flow/processing-storage.jpg" },
      { n: "Multi-Task Face Network", d: "From-scratch NumPy multi-task network predicting age and gender from 24,102 face images — shared trunk, two heads, manual backprop.", t: ["Python", "NumPy", "OpenCV"], tools: ["Python", "NumPy", "OpenCV"], dom: ["ML", "Computer Vision"], code: "https://github.com/VishnujanNarayanan/Neural_net_from_scratch", img: "images/flow/ml-analysis.jpg" },
      { n: "Linear Regression From Scratch", d: "Linear regression built end to end in pure NumPy — hand-derived gradient descent and a closed-form solver, validated vs scikit-learn.", t: ["Python", "NumPy"], tools: ["Python", "NumPy", "scikit-learn"], dom: ["ML"], code: "https://github.com/VishnujanNarayanan/Linear_regression_from_scratch", img: "images/flow/build-ship.jpg" },
      { n: "Binance Futures Trading Bot", d: "CLI trading bot placing market, limit, and stop-limit orders and managing positions on the Binance USDT-M Futures Testnet.", t: ["Python", "python-binance", "CLI"], tools: ["Python", "python-binance", "CLI"], dom: ["Finance", "Backend"], code: "https://github.com/VishnujanNarayanan/binance-futures-trading-bot", img: "images/flow/data-collection.jpg" },
      { n: "Professional Directory App", d: "Cross-platform React Native directory app across 12 screens — auth, search, and messaging — over a FastAPI REST service.", t: ["React Native", "Expo", "FastAPI"], tools: ["React Native", "Expo", "FastAPI"], dom: ["Full-Stack", "Backend", "Mobile"], code: "https://github.com/VishnujanNarayanan/professional-directory-app", img: "images/flow/processing-storage.jpg" }
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
    function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

    // ---- Side-panel "Filter by" facets, derived from PROJECTS' tools/dom ----
    function facetCounts(key) {
      var m = {};
      PROJECTS.forEach(function (p) { (p[key] || []).forEach(function (v) { m[v] = (m[v] || 0) + 1; }); });
      return Object.keys(m).map(function (k) { return { label: k, n: m[k] }; })
        .sort(function (a, b) { return b.n - a.n || a.label.localeCompare(b.label); });
    }
    function facetItems(key) {
      return facetCounts(key).map(function (it) {
        return '<li><label class="filter__item"><input type="checkbox" class="filter__cb" data-facet="' + key +
          '" value="' + slug(it.label) + '"><span class="filter__box" aria-hidden="true"></span>' +
          '<span class="filter__label">' + escapeHtml(it.label) + "</span>" +
          '<span class="filter__n">' + it.n + "</span></label></li>";
      }).join("");
    }
    function groupHtml(key, name, open) {
      return '<div class="filter__group' + (open ? " is-open" : "") + '" data-group="' + key + '">' +
        '<button type="button" class="filter__folder" aria-expanded="' + (open ? "true" : "false") + '">' +
        '<span class="filter__chev" aria-hidden="true"></span><span class="filter__name">' + name + "</span></button>" +
        '<ul class="filter__items">' + facetItems(key) + "</ul></div>";
    }
    function panelHtml() {
      return '<canvas class="term-side-contours" aria-hidden="true"></canvas>' +
        '<div class="filter"><div class="filter__head">Filter by</div>' +
        groupHtml("tools", "Tools", true) + groupHtml("dom", "Domain", true) +
        '<button type="button" class="filter__clear" hidden>Clear all</button></div>';
    }

    // The projects result set rendered under the SELECT — reference-style cards:
    // image base, notched frame, hover-reveal wipe (clip-path ellipse), blue accent.
    function projectsHtml() {
      var rows = PROJECTS.map(function (p, n) {
        var tags = p.t.map(function (x) { return '<span class="proj-tag">' + escapeHtml(x) + "</span>"; }).join("");
        // Media links to the subpage if one exists, otherwise straight to GitHub.
        var primary = p.h || p.code || "";
        var ext = !p.h && !!p.code; // github → new tab
        var openA = primary
          ? '<a class="proj-card__media" href="' + primary + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">"
          : '<span class="proj-card__media">';
        var closeA = primary ? "</a>" : "</span>";
        var cta = p.h ? "View project &rarr;" : "View code &#8599;";
        var id = (n + 1 < 10 ? "0" : "") + (n + 1);
        // data-tools / data-dom (lowercased, |-joined) let the side-panel filter match.
        var dataF = ' data-tools="|' + p.tools.map(slug).join("|") + '|" data-dom="|' + p.dom.map(slug).join("|") + '|"';
        return '<div class="proj-card"' + dataF + ">" +
          openA +
            '<img class="proj-card__img" src="' + p.img + '" alt="" loading="lazy">' +
            '<span class="proj-card__reveal">' +
              '<span class="proj-card__desc">' + escapeHtml(p.d) + "</span>" +
              '<span class="proj-tags">' + tags + "</span>" +
              '<span class="proj-card__cta">' + cta + "</span>" +
            "</span>" +
          closeA +
          frameSvg("is-base", F_BASE, 2) + frameSvg("is-overlay", F_OVER, 2) +
          '<span class="proj-card__label">' +
            '<span class="proj-card__id">' + id + "</span>" +
            '<span class="proj-card__title">' + escapeHtml(p.n) + "</span>" +
          "</span>" +
          (p.code ? '<a class="proj-card__code" href="' + p.code + '" target="_blank" rel="noopener">View code <span aria-hidden="true">&#8599;</span></a>' : "") +
          "</div>";
      }).join("");
      // Side panel (LEFT, flush to the border) = "Filter by" facets. The cards live
      // in their OWN clipped viewport (.term-cards-view, top-fade mask) whose inner
      // .term-cards-pan is the layer that pans up on scroll — so the panel stays put
      // and the cards fade out at the top instead of overlapping the SELECT line.
      return '<div class="term-pgrid">' +
          '<aside class="term-side" aria-label="Filter projects" data-lenis-prevent>' + panelHtml() + "</aside>" +
          '<div class="term-cards-view"><div class="term-cards-pan">' +
            '<div class="term-projects">' + rows + "</div>" +
            '<div class="term-result__meta">' + PROJECTS.length + " rows in set (0.001 sec)</div>" +
          "</div></div>" +
        "</div>";
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
    // preEl (collapses on reveal) + selEl (the `mysql> SELECT …` line) stay pinned at
    // the top; the side panel stays put too. Only .term-cards-pan (inside the clipped,
    // top-faded .term-cards-view) pans UP on scroll, so all 14 cards scroll through the
    // pinned 100vh terminal while the SELECT line + panel hold, fading out at the top.
    body.appendChild(preEl); body.appendChild(selEl); body.appendChild(projEl);
    var panEl = projEl.querySelector(".term-cards-pan");
    var viewEl = projEl.querySelector(".term-cards-view");

    // Stagger the card pop-in along the anti-diagonal (row+col): the top-left card
    // goes first, then each diagonal "wave" toward the bottom-right corner. Column
    // count is responsive (4 / 2), so read it live from the rendered grid and set
    // a per-card --cd transition-delay; the meta line follows after the last wave.
    var gridEl = projEl.querySelector(".term-projects");
    var cardEls = [].slice.call(projEl.querySelectorAll(".proj-card"));
    var CARD_STEP = 0.09;   // seconds between successive anti-diagonals (Lando-style flowing rise)
    var RISE_DUR = 0.9;     // seconds — matches the CSS .9s card rise transition
    // The cards wait until the threshold animation (the .term-pre collapse, ~0.6s)
    // is done, then a 0.3s gap, before the first card pops — so they don't appear
    // while the pre-text is still vanishing.
    var PRE_COLLAPSE = 0.6, GAP = 0.3, BASE_DELAY = PRE_COLLAPSE + GAP;
    // Total time (ms) from the threshold firing to the LAST card settling — used to
    // hold (stick) the section pinned until the reveal animation finishes.
    var STICK_MS = 0;
    function layoutCardStagger() {
      var tpl = getComputedStyle(gridEl).gridTemplateColumns;
      var cols = tpl ? tpl.split(" ").filter(Boolean).length : 4;
      if (cols < 1) cols = 1;
      var maxDiag = 0;
      cardEls.forEach(function (el, i) {
        var diag = Math.floor(i / cols) + (i % cols);
        if (diag > maxDiag) maxDiag = diag;
        el.style.setProperty("--cd", (BASE_DELAY + diag * CARD_STEP) + "s");
      });
      projEl.style.setProperty("--meta-d", (BASE_DELAY + maxDiag * CARD_STEP + RISE_DUR) + "s");
      STICK_MS = (BASE_DELAY + maxDiag * CARD_STEP + RISE_DUR + 0.15) * 1000; // +150ms buffer
      sizeSection();                                   // pin length tracks the card overflow
    }
    layoutCardStagger();
    window.addEventListener("resize", layoutCardStagger, { passive: true });

    // ---- Side-panel filtering ----
    // Faceted filter: a card shows if it matches the selected Tools (any) AND the
    // selected Domains (any). No selection in a group = that group doesn't constrain.
    (function wireFilter() {
      var panel = projEl.querySelector(".term-side");
      if (!panel) return;
      var metaEl = projEl.querySelector(".term-result__meta");
      var clearBtn = panel.querySelector(".filter__clear");
      var sel = { tools: {}, dom: {} };  // value-sets of checked facets

      function matches(card, key) {
        var keys = Object.keys(sel[key]);
        if (!keys.length) return true;                 // group not constraining
        var data = card.getAttribute("data-" + key) || "";
        for (var i = 0; i < keys.length; i++) if (data.indexOf("|" + keys[i] + "|") >= 0) return true;
        return false;
      }
      // On a filter change: COMPLETELY vanish ALL currently-shown cards (the reverse of
      // the appear — sink + fade), then reappear the NEW (filtered) set with the SAME
      // staggered anti-diagonal rise the cards play initially at the threshold.
      var FADE = 550, EASE = "cubic-bezier(.19,1,.22,1)", CLICK_STEP = 0.06;
      var applyT = 0;
      function colCount() {
        var tpl = getComputedStyle(gridEl).gridTemplateColumns;
        var n = tpl ? tpl.split(" ").filter(Boolean).length : 4;
        return n < 1 ? 1 : n;
      }
      // Phase 1 — every currently-visible card sinks + fades out together.
      function vanishAll(done) {
        var vis = cardEls.filter(function (c) { return !c.classList.contains("is-filtered-out"); });
        if (!vis.length) { done(); return; }
        vis.forEach(function (c) {
          c.style.transition = "opacity " + FADE + "ms ease,transform " + FADE + "ms " + EASE;
          c.style.opacity = "0"; c.style.transform = "translateY(64px)";
        });
        clearTimeout(applyT); applyT = setTimeout(done, FADE);
      }
      // Phase 2 — drop the non-matching cards, then replay the threshold appear (rise +
      // fade, anti-diagonal stagger recomputed over the filtered grid) on the new set.
      function showFiltered() {
        var matching = [];
        cardEls.forEach(function (c) {
          if (matches(c, "tools") && matches(c, "dom")) { c.classList.remove("is-filtered-out"); matching.push(c); }
          else { c.classList.add("is-filtered-out"); }
        });
        // Re-size the section for the new card count: fewer cards → shorter (or no) pin,
        // so you don't have to scroll a fixed dead-zone past a 1-card result to leave.
        sizeSection();
        // FRESH start: drop any scroll-driven pan so the new set appears from the TOP
        // (not at the prior scrolled position — a 1-card result must be visible without
        // scrolling up). Realign scroll to the cover threshold so panCards() stays at 0.
        panEl.style.transform = "translateY(0px)";
        var top = window.scrollY + sec.getBoundingClientRect().top; // scrollY where rect.top = 0
        if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true });
        else window.scrollTo(0, top);
        matching.forEach(function (c) {                    // reset to the appear "from" state, no transition
          c.style.transition = "none"; c.style.opacity = "0"; c.style.transform = "translateY(64px)";
        });
        void gridEl.offsetWidth;                           // reflow: new grid layout + from-state stick
        var cols = colCount();
        matching.forEach(function (c, i) {
          var d = ((Math.floor(i / cols) + (i % cols)) * CLICK_STEP) + "s";
          c.style.transition = "opacity " + FADE + "ms ease " + d + ",transform " + FADE + "ms " + EASE + " " + d;
          c.style.opacity = "1"; c.style.transform = "none";
        });
        var any = Object.keys(sel.tools).length + Object.keys(sel.dom).length > 0;
        if (metaEl) metaEl.textContent = matching.length + " row" + (matching.length === 1 ? "" : "s") + " in set" + (any ? " (filtered)" : " (0.001 sec)");
      }
      function apply() {
        var any = Object.keys(sel.tools).length + Object.keys(sel.dom).length > 0;
        if (clearBtn) clearBtn.hidden = !any;              // update the clear pill immediately
        vanishAll(showFiltered);                           // vanish ALL → reappear the filtered set
      }
      panel.addEventListener("change", function (e) {
        var cb = e.target.closest && e.target.closest(".filter__cb");
        if (!cb) return;
        var g = cb.getAttribute("data-facet"), v = cb.value;
        if (cb.checked) sel[g][v] = 1; else delete sel[g][v];
        apply();
      });
      panel.addEventListener("click", function (e) {
        var folder = e.target.closest && e.target.closest(".filter__folder");
        if (!folder) return;
        var grp = folder.parentNode, open = grp.classList.toggle("is-open");
        folder.setAttribute("aria-expanded", open ? "true" : "false");
      });
      if (clearBtn) clearBtn.addEventListener("click", function () {
        sel = { tools: {}, dom: {} };
        [].slice.call(panel.querySelectorAll(".filter__cb")).forEach(function (cb) { cb.checked = false; });
        apply();
      });
    })();

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

    if (reduce) { renderText(total); term.classList.add("is-revealing"); term.classList.add("is-covered"); return; }

    // Scroll model. The section slides UP from the bottom: rect.top travels from
    // +vh (appearing) → 0 (reaches the top / fully covers) → −(height−vh) (past).
    //  • Phase 1 is SCROLL-DRIVEN: rect.top 6/7·vh → 0 types the whole script; at
    //    full cover the last line is `mysql> SELECT * FROM projects;` (no projects).
    //  • Reaching the top (rect.top ≤ 0) is a THRESHOLD that fires a TIMED (not
    //    scroll-based) CSS reveal: the pre-lines fade+collapse so SELECT eases to
    //    the top, then the project cards come in (transition-delay). The reveal is
    //    LATCHED — once fired it never reverses, so scrolling back up keeps the
    //    cards on screen (and stops the per-frame re-typing fighting the scroll).
    var raf = 0, lastR = -1, atTop = false;
    // Scroll LOCK: at the threshold the section STICKS (pins) just long enough for the
    // card reveal animation to finish, so the cards aren't panned away mid-animation.
    var lenis = window.__lenis, locked = false, lockY = 0, stickT = 0;
    var SCROLL_KEYS = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 38: 1, 40: 1 };
    function blockScroll(e) { e.preventDefault(); }
    function blockKeys(e) { if (SCROLL_KEYS[e.keyCode]) e.preventDefault(); }
    function clampScroll() { if (locked && window.scrollY !== lockY) window.scrollTo(0, lockY); }
    function engageStick() {
      if (locked || window.innerWidth <= 820) return;        // no pin on mobile
      locked = true; lockY = window.scrollY;
      if (lenis) lenis.stop();
      window.addEventListener("wheel", blockScroll, { passive: false });
      window.addEventListener("touchmove", blockScroll, { passive: false });
      window.addEventListener("keydown", blockKeys, false);
      window.addEventListener("scroll", clampScroll, { passive: true });
      stickT = setTimeout(releaseStick, STICK_MS || 2500);
    }
    function releaseStick() {
      if (!locked) return; locked = false; clearTimeout(stickT);
      if (lenis) lenis.start();
      window.removeEventListener("wheel", blockScroll, { passive: false });
      window.removeEventListener("touchmove", blockScroll, { passive: false });
      window.removeEventListener("keydown", blockKeys, false);
      window.removeEventListener("scroll", clampScroll, { passive: true });
    }
    // How far the (visible) cards extend past their viewport — drives BOTH the section
    // height and the pan, so the two stay in lock-step.
    var PAN_PAD = 24;
    function cardOverflow() {
      var ov = panEl.scrollHeight - viewEl.clientHeight;
      return ov > 0 ? ov + PAN_PAD : 0;                 // 0 when the cards already fit
    }
    // Size the section so the PINNED scroll length == the card overflow: more projects
    // below → a longer pin (scrolling down reveals them); all projects already visible
    // → overflow 0 → height 100vh → no extra pin, so you scroll on out of the section
    // normally (no fixed dead-zone). Recomputed on init, resize, and every filter change.
    function sizeSection() {
      if (window.innerWidth <= 820) { sec.style.height = ""; return; } // mobile: natural flow
      sec.style.height = (window.innerHeight + cardOverflow()) + "px";
    }
    // Map the pinned scroll to a vertical PAN of the cards layer inside its clipped
    // viewport. Because sizeSection() made the pin length == the overflow, the last card
    // lands exactly as the pin releases to Skills. The side panel doesn't move.
    function panCards() {
      if (window.innerWidth <= 820) { panEl.style.transform = ""; return; }
      var pinScroll = sec.offsetHeight - window.innerHeight; // == cardOverflow()
      if (pinScroll <= 0) { panEl.style.transform = "translateY(0px)"; return; }
      var past = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / pinScroll));
      panEl.style.transform = "translateY(" + (-(past * pinScroll)).toFixed(1) + "px)";
    }
    function update() {
      raf = 0;
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      // Top bar: reversible at the threshold — hidden while the terminal covers the
      // top (r.top ≤ 0), back the moment you scroll up past it. Toggled every frame
      // (independent of the latched card reveal below).
      term.classList.toggle("is-covered", r.top <= 0);
      if (atTop) { panCards(); return; }                  // latched: cards stay; pan to reveal all rows
      if (r.top <= 0) {                                   // threshold reached → fire the reveal once
        atTop = true; term.classList.add("is-revealing");
        renderText(total); lastR = total; engageStick(); panCards(); return;
      }
      var typeStart = vh * (6 / 7);
      var typeT = Math.min(1, Math.max(0, (typeStart - r.top) / (typeStart - 0)));
      var reveal = Math.round(typeT * total);
      if (reveal !== lastR) { lastR = reveal; renderText(reveal); }
    }
    // SNAP-TO-THRESHOLD: a pre-threshold buffer just ABOVE the full-cover position.
    // If a scroll SETTLES inside it (while still approaching DOWN), auto-scroll the
    // rest of the way so the section lands exactly at its cover position (rect.top = 0).
    var snapT = 0, lastY = window.scrollY, dir = 1;
    function maybeSnap() {
      if (locked || window.innerWidth <= 820 || dir < 0) return; // only approaching down
      var r = sec.getBoundingClientRect(), buffer = window.innerHeight * 0.2;
      if (r.top > 0 && r.top <= buffer) {
        var target = window.scrollY + r.top;                 // scrollY that makes rect.top = 0
        if (lenis) lenis.scrollTo(target, { duration: 0.5 });
        else window.scrollTo({ top: target, behavior: "smooth" });
      }
    }
    function onScroll() {
      var y = window.scrollY; dir = y >= lastY ? 1 : -1; lastY = y;
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(snapT); snapT = setTimeout(maybeSnap, 140); // fire once the scroll settles
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  })();

  /* ---------- Projects→Skills curved seam ---------- */
  /* The dark projects band's bottom edge starts straight and bulges
     (curves out) downward into the light skills section as it scrolls up. */
  (function () {
    var path = document.querySelector(".skills-curve__path");
    var sec = document.querySelector(".brand-teaser");
    if (!path || !sec) return;
    var MAX_DEPTH = 100; // viewBox units (box is 140px tall)
    var RANGE = 0.6;     // fraction of viewport over which it curves out
    var ticking = false;
    function render() {
      ticking = false;
      if (window.innerWidth <= 820) return;
      var vh = window.innerHeight;
      var top = sec.getBoundingClientRect().top;
      // p = 0 when the seam first appears at the bottom of the screen,
      // 1 once it has risen RANGE*vh — straight → fully curved.
      var p = (vh - top) / (RANGE * vh);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      var d = (p * MAX_DEPTH).toFixed(1);
      path.setAttribute("d", "M0 0 L100 0 Q50 " + d + " 0 0 Z");
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", render);
    render();
  })();

  /* ---------- Flow journey ---------- */
  /* The flow section's three.js parallax journey lives in flow.js,
     loaded only on pages that contain .flow. */

  /* Vanta NET background is initialised inline in index.html (#vanta-bg). */
})();

/* ============================================================
   What's Up — On Socials: scroll-driven fanned-card spread.
   Cards start stacked at centre (pushed down 10rem, upright) and
   fan out into a symmetric peacock spread as the section scrolls
   into view. Pure function of scroll → reverses on scroll-up.
   ============================================================ */
(function socialsFan() {
  const layout = document.querySelector(".callout-socials-card-layout");
  if (!layout) return;
  const cards = Array.from(layout.querySelectorAll(".callout-socials-card-w"));
  if (!cards.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(max-width: 820px)");

  // px-per-rem (root font-size) for the rem-based fan offsets.
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;


  /* ---- Exact fan + hover, reverse-engineered from the live Lando matrices ----
     (lando_social_hover_matrix + lando_social_hover_bouncy_matrix). All px values
     are at 20rem card width (rem=16) and scale responsively with the card size. */

  // REST (settled) fan pose per card, decoded from REST matrices. px @ rem16.
  // rotation is exactly 7deg x slot; x/y/scale lifted verbatim from the capture.
  const REST = [
    { x: -380,    y: 92.47, r: -21, s: 0.7756 },
    { x: -278.67, y: 50.67, r: -14, s: 0.8498 },
    { x: -139.33, y: 16.47, r:  -7, s: 0.9346 },
    { x:    0,    y:  0,    r:   0, s: 1.0000 },
    { x:  139.33, y: 16.47, r:   7, s: 0.9346 },
    { x:  278.67, y: 50.67, r:  14, s: 0.8498 },
    { x:  380,    y: 92.47, r:  21, s: 0.7756 },
  ];
  const STACK_Y = 160;     // px: stacked start offset (reference translate(0,10rem))
  const POP_LIFT = 31.67;  // px: hovered card lifts up (matrix-exact)
  const POP_SCALE = 1.08;  // hovered card scale multiplier (matrix-exact)
  // Δx (px @ rem16) per [hovered][card] — room-dependent slide-away, hardcoded
  // from the settled matrices (rows 4-6 mirror 2-0). Hovered card's own Δx = 0.
  const DX = [
    [   0,  47.29,  81.06, 101.33,  67.56,  33.78,   0],
    [   0,   0,     94.57, 121.60,  67.56,  33.78,   0],
    [   0, -47.28,   0,    141.87,  81.07,  33.78,   0],
    [   0, -40.53, -94.58,   0,     94.58,  40.53,   0],
    [   0, -33.78, -81.07,-141.87,   0,     47.28,   0],
    [   0, -33.78, -67.56,-121.60, -94.57,   0,      0],
    [   0, -33.78, -67.56,-101.33, -81.06, -47.29,   0],
  ];
  // Δr (deg) is the clean closed form sign(i-h) * 3/(|i-h|+1) (matrix-exact).
  const drot = (h, i) => (i === h ? 0 : Math.sign(i - h) * 3 / (Math.abs(i - h) + 1));

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Extra horizontal/vertical spread of the fan offsets (NOT the card size) so the
  // cards sit a little less congested — applied consistently to rest AND hover.
  const SPREAD = 1.16;
  // Responsive: the captured values are at 20rem cards; scale offsets to the
  // actual rendered card width so the fan stays proportional on smaller screens.
  function sizeFactor() {
    const cw = cards[0].offsetWidth || 320; // layout width, ignores transform
    return (cw / (20 * rem())) * SPREAD;
  }

  // ---- target pose (px, pre-sizeFactor) for the current hover state ----
  let hovered = -1;
  function targetOf(i) {
    const base = REST[i];
    if (hovered < 0) return { x: base.x, y: base.y, r: base.r, s: base.s };
    if (i === hovered) return { x: base.x, y: base.y - POP_LIFT, r: base.r, s: base.s * POP_SCALE };
    return { x: base.x + DX[hovered][i], y: base.y, r: base.r + drot(hovered, i), s: base.s };
  }

  // ---- hover spring (snappy, with bounce): underdamped spring to the target ----
  const STIFF = 320, DAMP = 21; // zeta ~0.59 (~10% overshoot), settle ~0.37s — snappy
  const cur = REST.map((p) => ({ x: p.x, y: p.y, r: p.r, s: p.s }));
  const vel = REST.map(() => ({ x: 0, y: 0, r: 0, s: 0 }));

  // ---- reveal spring (the initial fan-out also BOUNCES): pCur springs 0<->1,
  // triggered when the section scrolls into view (a timed overshoot tween, like
  // the reference ScrollTrigger — not a scroll-scrub). p can overshoot past 1 so
  // the cards spring slightly past their fanned pose then settle = the fan bounce. */
  const PR_STIFF = 260, PR_DAMP = 20; // zeta ~0.62 (~9% overshoot), settle ~0.4s
  let pCur = reduce ? 1 : 0, pVel = 0, pT = reduce ? 1 : 0;

  function springStep(dt) {
    let moving = false;
    // reveal
    {
      const f = PR_STIFF * (pT - pCur) - PR_DAMP * pVel;
      pVel += f * dt; pCur += pVel * dt;
      if (Math.abs(pT - pCur) > 0.0005 || Math.abs(pVel) > 0.0005) moving = true;
    }
    // hover
    for (let i = 0; i < cur.length; i++) {
      const t = targetOf(i);
      for (const k of ["x", "y", "r", "s"]) {
        const f = STIFF * (t[k] - cur[i][k]) - DAMP * vel[i][k];
        vel[i][k] += f * dt;
        cur[i][k] += vel[i][k] * dt;
        if (Math.abs(t[k] - cur[i][k]) > 0.01 || Math.abs(vel[i][k]) > 0.01) moving = true;
      }
    }
    return moving;
  }

  // fan out once the card layout is ~85% up the viewport; fold back when it leaves
  function evalReveal() {
    if (reduce) { pT = 1; return; }
    const vh = window.innerHeight;
    const rect = layout.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    pT = center < vh * 0.85 ? 1 : 0;
  }

  function paint() {
    const p = pCur;
    const S = sizeFactor();
    for (let i = 0; i < cards.length; i++) {
      const c = cur[i];
      // arrival lerps stacked -> current spring pose; translations scale with S
      const x = (c.x * S) * p;
      const y = STACK_Y + (c.y * S - STACK_Y) * p;
      const rot = c.r * p;
      const s = 1 + (c.s - 1) * p;
      cards[i].style.transform =
        `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)})`;
    }
  }

  function clearMobile() { cards.forEach((c, i) => { c.style.transform = ""; c.style.zIndex = origZ[i]; }); }

  // ---- frame loop (runs while the spring is settling) ----
  const origZ = cards.map((c) => c.style.zIndex || getComputedStyle(c).zIndex || "0");
  let raf = 0, last = 0;
  function frame(ts) {
    if (mq.matches) { clearMobile(); raf = 0; return; }
    const dt = Math.min(0.032, last ? (ts - last) / 1000 : 0.016);
    last = ts;
    const moving = springStep(dt);
    paint();
    raf = moving ? requestAnimationFrame(frame) : 0;
    if (!moving) last = 0;
  }
  function kick() { if (!raf && !mq.matches) { last = 0; raf = requestAnimationFrame(frame); } }

  function setHover(h) {
    if (mq.matches) return;
    hovered = h;
    // z-index is intentionally NOT changed on hover — the rest stacking
    // (1,2,3,10,3,2,1) holds throughout, exactly like the reference.
    kick();
  }

  // scroll re-evaluates the reveal trigger, then springs (fan-out/fold bounce)
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (mq.matches) clearMobile();
      else { evalReveal(); kick(); }
      ticking = false;
    });
  }

  cards.forEach((c, i) => c.addEventListener("pointerenter", () => setHover(i)));
  layout.addEventListener("pointerleave", () => setHover(-1));
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { if (mq.matches) clearMobile(); else { evalReveal(); kick(); } });
  if (window.__lenis && typeof window.__lenis.on === "function") window.__lenis.on("scroll", onScroll);
  if (mq.matches) clearMobile(); else { evalReveal(); kick(); }
})();

/* ---------- Skills: logo cluster parallax around/with the Linux logo ----------
   The Linux logo AND the six small skill logos each drift UPWARD as the page
   scrolls, at their own data-speed. progress = 0 (everything at its base/current
   position) when the cluster centre crosses the viewport centre — i.e. roughly
   HALFWAY through the section's scroll — then they keep lifting past that point.
   3 logos are faster than Linux (data-speed > 0.14, z BEHIND it) and 3 are slower
   (< 0.14, z ON TOP), giving real depth. */
(function () {
  var stack = document.querySelector(".standards__logo-stack");
  if (!stack) return;
  // include the Linux main image — it parallaxes too (rests at mid-scroll).
  var imgs = Array.prototype.slice.call(stack.querySelectorAll("[data-speed]"));
  if (!imgs.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  if (reduce) return;                                  // leave them at their base positions
  var data = imgs.map(function (el) {
    return {
      el: el,
      speed: parseFloat(el.getAttribute("data-speed")) || 0.15,
      rot: parseFloat(el.getAttribute("data-rot")) || 0    // static tilt for an organic scatter
    };
  });
  var ticking = false;
  function render() {
    ticking = false;
    var r = stack.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    // progress in px: 0 when the cluster centre sits at the viewport centre (mid-
    // scroll), growing positive as it scrolls up past that line → each logo (Linux
    // included) lifts by progress*speed and keeps going.
    var progress = (vh * 0.5) - (r.top + r.height / 2);
    for (var i = 0; i < data.length; i++) {
      data[i].el.style.transform = "translateY(" + (-progress * data[i].speed).toFixed(1) + "px) rotate(" + data[i].rot + "deg)";
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (window.__lenis && typeof window.__lenis.on === "function") window.__lenis.on("scroll", onScroll);
  render();
})();

/* ============================================================
   QuickForge chat window — the messages image scrolls within a
   fixed "window" connected under the header bar. Scroll-driven &
   reversible: as the section scrolls up through the viewport, the
   feed pans so the window travels down through the messages.
   ============================================================ */
(function chatFeedScroll() {
  var win  = document.querySelector(".bt-chat__window");
  var feed = document.querySelector(".bt-chat__feed");
  if (!win || !feed) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var ticking = false;

  function render() {
    ticking = false;
    if (window.innerWidth <= 820) { feed.style.transform = ""; return; }
    var maxShift = feed.offsetHeight - win.clientHeight;     // travel room
    if (maxShift <= 0) { feed.style.transform = "translateY(0)"; return; }
    var r = win.getBoundingClientRect(), vh = window.innerHeight;
    // p: 0 when the window sits low in the viewport, 1 once it has risen near
    // the top — scrubs the feed up so we read down through the messages.
    var p = (vh * 1.0 - r.top) / (vh * 1.35);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    feed.style.transform = "translateY(" + (-p * maxShift).toFixed(1) + "px)";
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  if (reduce) { render(); return; }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", render);
  if (window.__lenis && typeof window.__lenis.on === "function") window.__lenis.on("scroll", onScroll);
  if (feed.complete) render(); else feed.addEventListener("load", render);
  render();
})();
