(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  // Trigger as soon as an element is within 250px of entering the
  // viewport (rather than waiting for 18% of it to already be visible) —
  // at normal scroll speed the old threshold left a beat of blank screen
  // between a section starting to appear and its content fading in.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 250px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

/* Seeds the persistent site-wide atmosphere (site.css .site__particles) —
   same visual language as the hero's own scrub-engine seedParticles, so the
   backdrop reads as one continuous thing rather than the hero's version
   stopping and a plainer one starting. Deterministic seeds (not Math.random)
   so it looks the same on every load, matching the engine's own approach. */
(function () {
  var host = document.querySelector('.site__particles');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!host || reduce) return;
  var kinds = ['dot', 'dot', 'ring'];
  var seeds = [11, 27, 44, 63, 78, 92, 6, 35, 51, 69, 84, 97, 19, 40, 58, 73, 88, 3];
  for (var k = 0; k < 16; k++) {
    var s = document.createElement('span');
    s.className = 'site__pt site__pt--' + kinds[k % kinds.length];
    s.style.left = seeds[k % seeds.length] + 'vw';
    s.style.top = ((seeds[(k * 3) % seeds.length] * 1.7) % 100) + 'vh';
    s.style.setProperty('--pt-sc', (0.5 + ((seeds[(k * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    var dur = 18 + (seeds[(k * 7) % seeds.length] % 26);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-(seeds[(k * 2) % seeds.length] % dur)) + 's';
    host.appendChild(s);
  }
})();

/* The hero's own top nav ships as pills for its 4 internal video chapters
   ("The Product" / "How We Work" / …), which read as the *site's* nav but
   don't go anywhere on the actual page — confusing since the page has real
   sections below the hero. Repurposed into a real page nav here instead:
   same pill container (kept for its already-tuned glass styling + mobile
   hide), new items with a distinct class (not .sw-nav__item) so the
   engine's own per-frame active-state toggling in scrub-engine.js read()
   — keyed to hero chapter index, not page section — never touches them.
   The hero's chapter dots on the right edge (.sw-route) are untouched and
   still point at the 4 video scenes. Plain anchors, not smooth-scroll: a
   smooth scroll from up here would animate across the entire hero scroll
   track first, visibly thrashing the scrubbed video for no reason. */
(function () {
  var nav = document.querySelector('#world .sw-nav');
  if (!nav) return;
  var links = [
    { label: 'Services', href: '#services' },
    { label: 'Process', href: '#process-section' },
    { label: 'Engagement', href: '#engagement' },
    { label: 'Contact', href: '#contact' },
  ];
  nav.innerHTML = '';
  var items = links.map(function (l) {
    var target = document.querySelector(l.href);
    if (!target) return null;
    var a = document.createElement('a');
    a.className = 'site-nav__item';
    a.textContent = l.label;
    a.href = l.href;
    nav.appendChild(a);
    return { a: a, target: target };
  }).filter(Boolean);
  if (!items.length) return;

  var ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * 0.35;
    var current = null;
    items.forEach(function (it) {
      if (it.target.getBoundingClientRect().top <= line) current = it;
    });
    items.forEach(function (it) {
      it.a.classList.toggle('is-active', it === current);
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Any mountScrollWorld() container's stage/copy/route layers are
   position:fixed and designed to persist for the whole page (the skill
   assumes the hero IS the page). This build drops in more than one instance
   — the main hero plus a second one further down — with real static
   sections between and after them, so each instance needs to release its
   fixed layers once its own scroll track has passed.

   Earlier attempts at this also tried to fill the engine's extra
   viewport-height of runway (scrub-engine.js layout(): "+vh so the last
   flight completes") with a separate floating gradient "bridge" element,
   timed to fade in/out independently of the content arriving. That fought
   itself across two different DOM situations (hero-before-.site vs an
   instance embedded inside .site) and, worse, ended up as a translucent
   layer racing the incoming section on its own clock — reading as three
   disjoint beats (video → gradient → section) and occasionally washing out
   the text under it. Simpler and more robust: the gradient now lives
   directly in the RECEIVING section's own background (site.css: .services,
   .feature--global — an ordinary in-flow ::before, no fixed positioning,
   no independent timing), so it's just always there as that section's top
   edge, painted in normal document order beneath its own text. No race to
   get right.

   wireScrollWorldRelease() now only does the DOM-fixed-layer release: toggle
   a `sw-done` class on the container once its bottom edge reaches the
   viewport's bottom edge (the moment the next section starts entering from
   below) — CSS scopes off that container's .sw-copylayer/.sw-route/
   .sw-hint/.sw-scrollbar from there. .sw-stage/.sw-sky are deliberately left
   alone for the hero — the engine already fades each scene's own opacity to
   0 smoothly, tied to actual scroll position. For an embedded (mid-page)
   instance, .sw-sky and the topbar/route/hint/scrollbar are hidden
   unconditionally instead (site.css .sw-embedded) — page-level chrome that
   only makes sense once, on the hero. */
(function () {
  function wireScrollWorldRelease(containerId, opts) {
    var el = document.getElementById(containerId);
    if (!el) return;
    opts = opts || {};
    if (opts.embedded) el.classList.add('sw-embedded');

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      el.classList.toggle('sw-done', el.getBoundingClientRect().bottom <= vh);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  wireScrollWorldRelease('world');
  wireScrollWorldRelease('infra-world', { embedded: true });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
  // Gentle parallax on the full-bleed section backgrounds: drift by a small
  // fraction of how far each section's centre sits from the viewport's
  // centre. One shared loop for every such section on the page.
  if (!reduce) {
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.feature__bg, .cta__bg'));
    var pTicking = false;
    function updateParallax() {
      pTicking = false;
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var centerDelta = (vh / 2) - (r.top + r.height / 2);
        var shift = clamp(centerDelta * 0.08, -48, 48);
        el.style.transform = 'scale(1.15) translateY(' + shift.toFixed(1) + 'px)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!pTicking) { pTicking = true; requestAnimationFrame(updateParallax); }
    }, { passive: true });
    window.addEventListener('resize', updateParallax);
    updateParallax();
  }
})();

/* Services cards: a scroll-driven "focus sweep" across the row. As the
   Services section moves through the viewport, whichever card is nearest
   the scroll-progress "spotlight" enlarges and brightens; the others ease
   back and dim slightly. Progress is section-relative (0 at section top,
   1 at section bottom) rather than per-card position, since the cards sit
   in one row — there's no per-card vertical offset to key off otherwise. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var section = document.querySelector('.services');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.services__grid .card'));
  if (!section || !cards.length) return;
  var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var r = section.getBoundingClientRect();
    // 0 when the section's top just enters the bottom of the viewport,
    // 1 when its bottom leaves the top — i.e. progress through the section.
    var progress = clamp((vh - r.top) / (vh + r.height), 0, 1);
    var focus = progress * (cards.length - 1);
    cards.forEach(function (card, i) {
      var d = clamp(1 - Math.abs(i - focus), 0, 1);
      var scale = 1 + d * 0.07;
      var bright = 0.72 + d * 0.28;
      card.style.setProperty('--card-scale', scale.toFixed(3));
      card.style.setProperty('--card-bright', bright.toFixed(3));
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Services cards: a subtle cursor-tilt (perspective rotateX/rotateY toward
   the pointer) layered on top of the scroll-focus sweep above — writes to
   its own --card-rx/--card-ry custom properties (site.css composes them
   with --card-scale into one transform), so the two scripts never fight
   over the same `transform` value. Desktop-with-a-real-pointer only
   (matchMedia hover:hover/pointer:fine): touch has no hover to tilt
   toward, and there's nothing to clean up if this guard skips it. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !canHover) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll('.services__grid .card'));
  if (!cards.length) return;

  var MAX_DEG = 6;
  cards.forEach(function (card) {
    card.addEventListener('pointerenter', function () {
      card.classList.add('is-tilting');
    });
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--card-ry', (px * MAX_DEG * 2).toFixed(2) + 'deg');
      card.style.setProperty('--card-rx', (-py * MAX_DEG * 2).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-tilting');
      card.style.setProperty('--card-rx', '0deg');
      card.style.setProperty('--card-ry', '0deg');
    });
  });
})();

/* Process section: GSAP ScrollTrigger sticky-stack, the canonical pattern
   (start: "top top", pin: true, each card scaling/dimming out as the next
   one's own trigger fires) rather than a plain sequential reveal list.
   This is the one deliberate scroll-hijack outside the hero, used here
   because the content is genuinely sequential (four build stages in
   order) and pinning sells that sequence; nothing else on the page pins.
   Falls back to a static stack (no pin, cards just stack in normal flow,
   which the CSS already supports) if GSAP didn't load or the visitor
   prefers reduced motion. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var stack = document.querySelector('.process__stack');
  var cards = stack ? Array.prototype.slice.call(stack.querySelectorAll('.process__card')) : [];
  if (!stack || cards.length < 2) return;

  gsap.registerPlugin(ScrollTrigger);
  stack.classList.add('is-gsap');

  cards.forEach(function (card, i) {
    if (i === cards.length - 1) return; // last card just stops in place
    ScrollTrigger.create({
      trigger: card,
      start: 'top top',
      endTrigger: cards[cards.length - 1],
      end: 'top top',
      pin: true,
      pinSpacing: false,
    });
    gsap.to(card, {
      scale: 0.94,
      opacity: 0.5,
      ease: 'none',
      scrollTrigger: {
        trigger: cards[i + 1],
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      },
    });
  });

  // Parallax on each card's visual: drifts vertically while its OWN card
  // is the active (topmost) one in the stack, so the image/orb reads as
  // having real depth against the static text column. Scoped to the
  // card's own box (start/end relative to itself, no endTrigger) — that
  // window is exactly the scroll distance before the next card's pin
  // slides up and covers this one.
  cards.forEach(function (card) {
    var visual = card.querySelector('.process__visual');
    if (!visual) return;
    gsap.fromTo(visual, { y: '-6%' }, {
      y: '6%',
      ease: 'none',
      scrollTrigger: {
        trigger: card,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
})();

/* Section headings: each word rises into view individually (masked
   inline-block per word, GSAP animates the inner span) instead of the
   whole heading fading as one flat block — the one place on the page
   where the big display type gets its own entrance rather than inheriting
   the generic [data-reveal] fade its wrapping section head uses. Plain,
   fully-visible text is the HTML default, so a failed GSAP/ScrollTrigger
   load or prefers-reduced-motion just leaves normal static text — nothing
   here can end up permanently hidden. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined') return;
  var hasST = typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var titles = Array.prototype.slice.call(document.querySelectorAll('.site__title, .cta__title'));
  titles.forEach(function (title) {
    var words = title.textContent.split(/\s+/).filter(Boolean);
    if (words.length < 2) return; // nothing meaningful to stagger
    title.innerHTML = words.map(function (w, i) {
      var text = w + (i < words.length - 1 ? '&nbsp;' : '');
      return '<span class="reveal-word-mask"><span class="reveal-word-inner">' + text + '</span></span>';
    }).join('');
    var inners = title.querySelectorAll('.reveal-word-inner');
    gsap.set(inners, { yPercent: 110, opacity: 0 });
    var anim = {
      yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.045,
    };
    if (hasST) {
      anim.scrollTrigger = { trigger: title, start: 'top 88%', toggleActions: 'play none none none' };
    }
    gsap.to(inners, anim);
  });
})();

/* Final CTA's primary button — the page's one "high-commitment" action
   (site.css calls it out as deliberately the brightest thing on screen) —
   gets a magnetic pull: it drifts toward the cursor within its own bounds
   using gsap.quickTo (spring-like interpolation toward a target, not a
   hard snap) rather than sitting as a static target. quickTo drives x/y
   via its own inline transform, so on release it's reset to (0,0) instead
   of left holding an offset if the pointer leaves fast. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !canHover || typeof gsap === 'undefined') return;
  var btn = document.querySelector('.cta .btn--primary');
  if (!btn) return;

  var PULL = 0.35;
  var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
  var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
  btn.addEventListener('pointermove', function (e) {
    var r = btn.getBoundingClientRect();
    xTo((e.clientX - r.left - r.width / 2) * PULL);
    yTo((e.clientY - r.top - r.height / 2) * PULL);
  });
  btn.addEventListener('pointerleave', function () {
    xTo(0);
    yTo(0);
  });
})();

/* Top nav: hides on scroll-down past a small threshold, reappears on any
   scroll-up (or once back near the very top) — standard "give the video/
   content the full viewport while descending, but navigation is always
   one scroll-up away" pattern. Threshold + a small dead-zone on the delta
   keeps it from flickering on sub-pixel scroll jitter. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var topbar = document.querySelector('.sw-topbar');
  if (reduce || !topbar) return;

  var lastY = window.scrollY, ticking = false;
  function update() {
    ticking = false;
    var y = Math.max(0, window.scrollY);
    var delta = y - lastY;
    if (y < 120) topbar.classList.remove('nav-hidden');
    else if (delta > 4) topbar.classList.add('nav-hidden');
    else if (delta < -4) topbar.classList.remove('nav-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
})();

/* Testimonials: pins the quote stage (GSAP ScrollTrigger, same pin
   mechanic as the Process sticky-stack) for a scroll distance proportional
   to the quote count, and crossfades .testimonials__quote/.testimonials__dot
   `is-active` based on scroll progress through that pinned range — the
   "smooth transition on scroll" the section was asked for. A large quote-
   mark glyph behind the stage drifts at its own independent scroll-linked
   rate for the "parallax" half of the brief. Dots are also click-to-jump
   (scrolls to the matching point in the pinned range) for anyone not
   scrolling past this section at all. Falls back to a static first quote
   (already `is-active` in the HTML) if GSAP/ScrollTrigger didn't load or
   prefers-reduced-motion is set — nothing here is required to look
   complete. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  var section = document.querySelector('.testimonials');
  var stage = section ? section.querySelector('.testimonials__stage') : null;
  var quotes = section ? Array.prototype.slice.call(section.querySelectorAll('.testimonials__quote')) : [];
  var dots = section ? Array.prototype.slice.call(section.querySelectorAll('.testimonials__dot')) : [];
  if (!section || !stage || quotes.length < 2) return;

  gsap.registerPlugin(ScrollTrigger);
  var n = quotes.length;
  var current = 0;

  function setActive(i) {
    if (i === current) return;
    current = i;
    quotes.forEach(function (q, k) { q.classList.toggle('is-active', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
  }

  var st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=' + (n * 42) + '%',
    pin: stage,
    scrub: true,
    onUpdate: function (self) {
      setActive(Math.min(n - 1, Math.floor(self.progress * n)));
    },
  });

  // Plain window.scrollTo rather than GSAP's ScrollToPlugin — that plugin
  // isn't loaded on this page (just gsap.min.js + ScrollTrigger.min.js,
  // kept dependency-free), so a gsap.to({ scrollTo }) call here would
  // silently no-op.
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      var target = st.start + (st.end - st.start) * ((i + 0.5) / n);
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  gsap.to('.testimonials__glyph', {
    yPercent: 25,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
  });
})();
