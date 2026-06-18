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
    var heroImg = hero.querySelector("#vanta-bg");  // the shader image that greys out
    var scrollCue = hero.querySelector(".hero__scroll-btn");  // vanishes (reverse of its entrance) on scroll
    // Header pieces that react to the zoom-out (color flip + shrink-to-edges).
    var hdr        = document.querySelector("header");
    var navLeft    = hdr && hdr.querySelector(".header__nav-left");
    var navRight   = hdr && hdr.querySelector(".header__nav-right");
    var navTexts   = hdr ? hdr.querySelectorAll(".header__nav-left a, .pill-btn-span") : [];
    var darkPill   = hdr && hdr.querySelector(".pill-btn--dark");
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
      var c = Math.round(255 * (1 - he));                // 255 (white) → 0 (black)
      var rgb = "rgb(" + c + "," + c + "," + c + ")";
      navTexts.forEach(function (t) { t.style.color = rgb; });
      var hs = 1 - 0.12 * he;                            // shrink 1 → 0.88 (subtle)
      if (navLeft)  { navLeft.style.transformOrigin  = "left center";  navLeft.style.transform  = "scale(" + hs + ")"; }
      if (navRight) { navRight.style.transformOrigin = "right center"; navRight.style.transform = "scale(" + hs + ")"; }
      if (darkPill) {                                    // dark #050419 → light #d0e1eb
        var dr = Math.round(5 + (208 - 5) * he), dg = Math.round(4 + (225 - 4) * he), db = Math.round(25 + (235 - 25) * he);
        darkPill.style.backgroundColor = "rgb(" + dr + "," + dg + "," + db + ")";
      }
    }
    window.addEventListener("scroll", updateHeroExit, { passive: true });
    window.addEventListener("resize", updateHeroExit, { passive: true });
    updateHeroExit();
  }

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

  /* ---------- Header show/hide on scroll direction ---------- */
  var header = document.querySelector("header");
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    function onScroll() {
      var y = window.scrollY;
      if (y < window.innerHeight) {
        // During the hero zoom-out the header stays put and shrinks (see updateHeroExit)
        // instead of hiding on scroll-down.
        header.classList.add("show");
      } else if (y > lastY + 4) {
        header.classList.remove("show"); // scrolling down
      } else if (y < lastY - 4) {
        header.classList.add("show"); // scrolling up
      }
      lastY = y;
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    header.classList.add("show");
  }

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
