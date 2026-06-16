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

    // Fade the hero off as the user scrolls. Crucially we drive the SAME
    // elements the entrance does (.hero__title + .hero__subtitle individually),
    // not the parent .hero__content — the entrance's translate(50%) is relative
    // to each element's OWN width and rotates about each element's OWN centre, so
    // mirroring the container (a different size/pivot) skewed the exit toward the
    // wrong corner.
    var heroRevealEls = hero.querySelectorAll(".hero__title, .hero__subtitle");
    var heroScrollBtn = hero.querySelector(".hero__scroll-btn");
    var heroScrollText = hero.querySelector(".hsbtn-in");
    var heroTicking = false;
    function fadeHero() {
      var vh = window.innerHeight || 800;
      var p = Math.min(window.scrollY / (vh * 0.6), 1);
      var e = p * p * (3 - 2 * p); // smoothstep
      if (p <= 0.0005) {
        // At rest, hand control back to the CSS entrance transition.
        heroRevealEls.forEach(function (el) {
          el.style.removeProperty("transition");
          el.style.removeProperty("opacity");
          el.style.removeProperty("transform");
        });
      } else {
        // Exit = each element's entrance with BOTH x-contributing terms AND the
        // y term flipped (rotation kept at its entrance value). Entrance start
        // (per element) is translate(50%) translate3d(-222.2px,88px) rotateY(60)
        // rotateX(35) → identity — note translate(50%) and translate3d-x are
        // opposite in sign and nearly cancel (the entrance barely drifts in x;
        // the bottom-right read comes mostly from the y offset + 3D tilt). Only
        // flipping translate3d-x (keeping translate(50%) positive) broke that
        // cancellation and made the exit drift right instead of mirroring, so
        // translate(%) is flipped too: translate(-50%) translate3d(+222.2px,-88px).
        var tf = "perspective(1000px) translate(" + (-e * 50) + "%) translate3d(" + (e * 222.2) + "px," + (-e * 88) + "px,0) rotateY(" + (e * 60) + "deg) rotateX(" + (e * 35) + "deg)";
        heroRevealEls.forEach(function (el) {
          el.style.transition = "none";
          el.style.opacity = 1 - p;
          el.style.transform = tf;
        });
      }
      if (heroScrollBtn) {
        if (p <= 0.0005) {
          // Back at the top — hand control back to the CSS arrival transitions.
          heroScrollBtn.classList.remove("is-exiting");
          if (heroScrollText) {
            heroScrollText.style.removeProperty("transition");
            heroScrollText.style.removeProperty("transform");
          }
        } else {
          // Reverse of the arrival: the label rose UP into view from below the
          // clip and the underline drew in, so on scroll the label slides back
          // DOWN out of view (scroll-driven, transition off so it tracks the
          // wheel) and .is-exiting retracts the underline. The button container
          // is never transformed, so it can no longer jump sideways (it loses
          // its translate(-50%) centring otherwise) when scrolling starts/stops.
          heroScrollBtn.classList.add("is-exiting");
          if (heroScrollText) {
            heroScrollText.style.transition = "none";
            heroScrollText.style.transform = "translate3d(0,calc(" + (e * 100) + "% + " + (e * 7) + "px),0)";
          }
        }
      }
      heroTicking = false;
    }
    window.addEventListener("scroll", function () {
      if (!heroTicking) { requestAnimationFrame(fadeHero); heroTicking = true; }
    }, { passive: true });
    fadeHero();
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
      if (y < 80) {
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
