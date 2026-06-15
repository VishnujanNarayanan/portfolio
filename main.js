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
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- Hero entrance reveal ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("show"); });
    });

    // Fade + lift the hero content off as the user starts scrolling, so it
    // animates away cleanly instead of bleeding through later sections.
    var heroContent = hero.querySelector(".hero__content");
    var heroScrollBtn = hero.querySelector(".hero__scroll-btn");
    var heroTicking = false;
    function fadeHero() {
      var vh = window.innerHeight || 800;
      var p = Math.min(window.scrollY / (vh * 0.55), 1); // gone by ~55% of a screen
      var op = 1 - p;
      if (heroContent) {
        heroContent.style.opacity = op;
        heroContent.style.transform = "translateY(" + (-p * 80) + "px)";
      }
      if (heroScrollBtn) {
        heroScrollBtn.style.opacity = op;
        heroScrollBtn.style.transform = "translateY(" + (p * 30) + "px)";
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

  /* ---------- Flow: scroll-driven steps + parallax background ---------- */
  var flow = document.querySelector(".flow");
  if (flow) {
    var steps = Array.prototype.slice.call(flow.querySelectorAll(".flow__step"));
    var fills = steps.map(function (s) { return s.querySelector(".flow__track-fill"); });
    var bg = flow.querySelector(".flow__bg");
    var LAYER_SPEED = 0.3; // background layer drifts at 0.3x the scroll
    var n = steps.length;
    var vh = window.innerHeight || 800;

    // Each floating card: which step it belongs to, its parallax speed
    // (0.2x–0.45x), and its target viewport top (vh) when its step is active.
    var cards = Array.prototype.slice.call(flow.querySelectorAll(".flow-float")).map(function (el) {
      return {
        el: el,
        step: parseInt(el.getAttribute("data-step"), 10),
        speed: parseFloat(el.getAttribute("data-speed")),
        y: parseFloat(el.getAttribute("data-y")) // vh
      };
    });

    // Position each card so that, at the centre of its step's scroll zone,
    // it lands at its target y. Re-run on resize (depends on viewport px).
    function layoutCards() {
      vh = window.innerHeight || 800;
      var total = flow.getBoundingClientRect().height - vh; // px scrolled across flow
      cards.forEach(function (c) {
        var scrolledAtCentre = ((c.step - 0.5) / n) * total;
        var baseTop = (c.y / 100) * vh + c.speed * scrolledAtCentre;
        c.el.style.top = baseTop + "px";
      });
    }

    function updateflow() {
      var rect = flow.getBoundingClientRect();
      var total = rect.height - vh;
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var progress = total > 0 ? scrolled / total : 0; // 0..1 across whole flow
      var pos = progress * n; // which step we're on (float)
      var activeIdx = Math.min(Math.floor(pos), n - 1);

      // Foreground steps (unchanged behaviour: active class, track-fill, title scale)
      steps.forEach(function (step, i) {
        var local = Math.min(Math.max(pos - i, 0), 1);
        if (fills[i]) fills[i].style.transform = "scaleY(" + local + ")";
        step.classList.toggle("flow__step--active", i === activeIdx);
        step.classList.toggle("flow__step--visited", pos >= i + 1 || i <= Math.floor(pos));
      });

      // Background layer drifts upward at 0.3x the scroll
      if (bg) bg.style.transform = "translateY(" + (-LAYER_SPEED * scrolled) + "px)";

      // Each card moves at its own speed (net) and fades by distance from
      // the active step: active = 1, far = 0.12.
      cards.forEach(function (c) {
        var rel = -(c.speed - LAYER_SPEED) * scrolled; // relative to the 0.3x layer → net = c.speed
        c.el.style.transform = "translateY(" + rel + "px)";
        var dist = Math.abs(pos - (c.step - 0.5)); // 0 at this step's centre
        // active step (dist ≤ .5) fully visible; neighbours recede fast; far → 0.12
        var op = dist <= 0.5 ? 1 : Math.max(0.12, 1 - (dist - 0.5) * 1.6);
        c.el.style.opacity = op;
      });
    }

    window.addEventListener("scroll", updateflow, { passive: true });
    window.addEventListener("resize", function () { layoutCards(); updateflow(); });
    layoutCards();
    updateflow();
  }

  /* Vanta NET background is initialised inline in index.html (#vanta-bg). */
})();
