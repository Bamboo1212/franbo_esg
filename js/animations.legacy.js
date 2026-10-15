document.addEventListener('DOMContentLoaded', function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var header = document.querySelector('.site-header');
  var heroContents = gsap.utils.toArray('.hero-content');
  var heroBgs = gsap.utils.toArray('.hero-bg');
  var heroWhiteout = document.querySelector('.hero-whiteout');
  var interSection = document.querySelector('.inter-section');
  var interHead = document.querySelector('.inter-head');
  var interItems = gsap.utils.toArray('.inter-item');

  // Paced out in "mouse-wheel notches" (~1 notch ≈ 100px of scroll), per
  // spec: ~2 notches of blur, then the title; ~1-2 more notches to the first
  // card; cards 2-4 follow over the next ~2-4 notches; the hero backdrop
  // finishes fading to white exactly as the 4th card finishes arriving.
  // .inter-section itself stays fully transparent throughout — it's only
  // lifted so its cards sit in the viewport instead of being clipped away
  // by the carousel's overflow far below the fold; the white comes entirely
  // from .hero-whiteout. Fully reversible: scrubbing back up unwinds every
  // stage exactly in reverse.
  var heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=750',
      scrub: 1,
      pin: true,
      pinSpacing: true,
      // See the matching comment on the Data section's ScrollTrigger further
      // down — protects against a fast scroll outrunning the scrub:1
      // smoothing and releasing the pin mid-tween.
      fastScrollEnd: true,
      onUpdate: function (self) {
        if (header) header.classList.toggle('is-solid', self.progress > 0.85);
      },
      onLeaveBack: function () {
        if (header) header.classList.remove('is-solid');
      }
    }
  });

  heroTl
    .to(heroContents, { autoAlpha: 0, y: -40, duration: 0.5, ease: 'sine.out' }, 0)
    .to(heroBgs, { filter: 'blur(20px)', scale: 1.06, duration: 1.7, ease: 'sine.inOut' }, 0.3);

  // This lift must finish EARLY (not spread across the whole sequence) —
  // it only exists to get the section's real DOM position into the
  // viewport before anything inside it needs to be visible. Once it's
  // settled, the cards' own small local stagger below does the actual
  // one-by-one reveal work.
  if (interSection) {
    heroTl.fromTo(interSection,
      { y: 0 },
      { y: '-100vh', ease: 'sine.inOut', duration: 1.6 },
      0.2);
  }

  // Title appears right as the ~2-notch blur finishes, and fully completes
  // its own reveal before any card starts.
  if (interHead) {
    heroTl.fromTo(interHead,
      { opacity: 0, y: 70 },
      { opacity: 1, y: 0, ease: 'sine.out', duration: 0.8 },
      1.8);
  }

  // First card follows ~1-2 notches after the title; cards 2-4 then follow
  // one at a time over the next ~3 notches.
  interItems.forEach(function (item, i) {
    heroTl.fromTo(item,
      { opacity: 0, y: 90 },
      { opacity: 1, y: 0, ease: 'sine.out', duration: 0.8 },
      3.5 + i * 1.0);
  });

  // The hero backdrop fades to solid white as a slow, gentle color tween,
  // timed to land fully white exactly as the 4th card finishes.
  if (heroWhiteout) {
    heroTl.fromTo(heroWhiteout,
      { opacity: 0 },
      { opacity: 1, ease: 'sine.inOut', duration: 5.5 },
      1.8);
  }

  // News section: a simple one-time entrance (not scroll-scrubbed — this
  // section is well past the hero's pinned sequence) — the side column
  // (title + filters) fades in (opacity only — it's position:sticky, so no
  // transform is put on it, to avoid any chance of that interfering with
  // its sticky behavior), the "more news" button follows, then the list
  // items with a stagger.
  //
  // Using gsap.set() for the starting state + .to() tweens (instead of
  // .from()) is deliberate: .from() re-evaluates/re-renders its start state
  // on every ScrollTrigger.refresh(), which can desync from the DOM when a
  // refresh happens after background images (which don't fire the usual
  // <img> load events ScrollTrigger watches for) finish loading late.
  var newsSide = document.querySelector('.news-side');
  var newsMore = document.querySelector('.news-more');
  var newsItems = gsap.utils.toArray('.news-item');

  if (newsSide || newsMore || newsItems.length) {
    if (newsSide) gsap.set(newsSide, { opacity: 0 });
    if (newsMore) gsap.set(newsMore, { opacity: 0, y: 30 });
    if (newsItems.length) gsap.set(newsItems, { opacity: 0, y: 50 });

    var newsTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.news-section',
        start: 'top 75%'
      }
    });

    if (newsSide) {
      newsTl.to(newsSide, { opacity: 1, duration: 0.8, ease: 'sine.out' }, 0);
    }
    if (newsMore) {
      newsTl.to(newsMore, { opacity: 1, y: 0, duration: 0.6, ease: 'sine.out' }, 0.1);
    }
    if (newsItems.length) {
      newsTl.to(newsItems, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.18,
        ease: 'sine.out'
      }, 0.2);
    }
  }

  // Pin the "Latest News" title + filter column while the news list scrolls
  // past it — done via ScrollTrigger's pin rather than CSS position:sticky,
  // because .news-section needs overflow:hidden (to contain its absolute
  // background layers), and that breaks sticky's containing-block
  // calculation. Pins .news-side-pin (not .news-side itself — see the CSS
  // comment on .news-side for why) with pinSpacing:false, since the outer
  // .news-side already reserves a fixed-width slot in the flex row; letting
  // GSAP also insert its own spacer there was what unbalanced the columns.
  // Starts once .news-main's top reaches 140px from the viewport top
  // (clearing the fixed header) and releases only once .news-main has
  // completely scrolled past the top of the viewport, so it stays pinned
  // through the full list instead of letting go early.
  var newsMain = document.querySelector('.news-main');
  if (newsMain && document.querySelector('.news-side-pin')) {
    ScrollTrigger.create({
      trigger: newsMain,
      start: 'top top+=140',
      end: 'bottom top',
      pin: '.news-side-pin',
      pinSpacing: false
    });
  }

  // ESG Data section — one continuous, scrubbed, reversible timeline, fully
  // sequential (each phase only starts once the previous one has actually
  // finished — no overlap):
  //   1. earth rises alone (sunrise), sized to fit fully inside the 100vh
  //      section — no backdrop yet
  //   2. green backdrop fades in
  //   3. earth shrinks down into its final small Figma spot
  //   4. the 5 data circle RINGS burst outward from the earth's centre to
  //      their positions on an orbit around the earth, while the dashed
  //      semicircle draws itself
  //   5. each circle's TEXT (value + label) zooms in right after that
  //      circle lands
  //   6. numbers count up for whichever 3 circles are visible
  //   7. scrolling further continuously rotates all 5 circles forward along
  //      the curve, 3 visible / 2 hidden at a time (the 2 "off-duty" ones
  //      sit on the undrawn lower arc). Fully scrubbed and reversible, like
  //      every other phase here — NOT click/autoplay-driven. 4 steps cycle
  //      every one of the 5 data points through the centre once (a 5th step
  //      would just repeat the 1st). Each time a circle settles into a
  //      visible slot its number counts up again.
  //   8. exit: once all 4 steps are done, the circles float up and fade out
  //      first — finishing well before the earth does — then the earth
  //      sinks and shrinks away to nothing. The green backdrop stays green
  //      through the FIRST half of that sink; only in the second half does
  //      .data-sea-overlay (the same sea.jpg Download uses) crossfade over
  //      it, timed to finish exactly as the earth finishes disappearing.
  //      Only once all of this is done does the pin release into the
  //      Download section, whose own sea.jpg background picks up right
  //      where this one left off.
  // All of 1-8 live on the SAME timeline/ScrollTrigger — there's no
  // independent click/autoplay/CSS-view-timeline animation left in this
  // section, so nothing can fight the scrub for control of any property.
  //
  // The visible dashed line is only a semicircle, but the 5 circles
  // actually travel around a full ellipse orbit — 3 sit on the drawn upper
  // half (top/left/right, full size), the other 2 sit on the undrawn lower
  // half (dimmed, behind/beside the earth).
  (function () {
    var dataSection = document.querySelector('.data-section');
    if (!dataSection) return;

    var head = dataSection.querySelector('.data-head');
    var bg = dataSection.querySelector('.data-bg');
    var seaOverlay = dataSection.querySelector('.data-sea-overlay');
    var earth = dataSection.querySelector('.data-earth');
    var ringReveal = dataSection.querySelector('.data-ring-reveal');
    var orbit = dataSection.querySelector('.data-orbit');
    var orbs = gsap.utils.toArray(dataSection.querySelectorAll('.data-orb'));
    if (!orbs.length) return;
    var orbTexts = orbs.map(function (o) { return o.querySelector('.data-orb-text'); });

    // Orbit ellipse — centre/radii match the SVG path exactly (122..1416
    // horizontally around cy 430, rx 647, ry 249). Angles in degrees using
    // x = cx + rx·cos(t), y = cy + ry·sin(t): -90° is the top. top/right/left
    // are solved from the Figma-exact circle centres; the 2 hidden slots
    // split the remaining (undrawn, lower) gap between right and left evenly.
    var CENTER = { x: 769, y: 430 };
    var RX = 647, RY = 249;
    var ANGLES = [-90, -8.52, 57.16, 122.84, 188.52];
    // The earth's own resting centre is NOT the same point as the orbit
    // centre above — per Figma it sits well below it (x stays 769, matching
    // .data-earth's CSS), low enough that only its top portion shows before
    // the section's bottom edge clips the rest.
    var EARTH_CENTER_Y = 768.5;
    var VISIBLE = [true, true, false, false, true];

    function pointAt(deg) {
      var rad = deg * Math.PI / 180;
      return { x: CENTER.x + RX * Math.cos(rad), y: CENTER.y + RY * Math.sin(rad) };
    }

    function animateValue(orb, delay) {
      var valueEl = orb.querySelector('.data-value');
      var unitEl = orb.querySelector('.data-unit');
      if (!valueEl) return;
      if (orb.hasAttribute('data-static')) {
        valueEl.textContent = orb.getAttribute('data-static');
        return;
      }
      if (unitEl) unitEl.textContent = orb.getAttribute('data-unit') || '';
      var target = parseFloat(orb.getAttribute('data-target') || '0');
      var decimals = parseInt(orb.getAttribute('data-decimals') || '0', 10);
      var counter = { val: 0 };
      gsap.to(counter, {
        val: target,
        duration: 1.5,
        delay: delay || 0,
        ease: 'power2.out',
        onUpdate: function () { valueEl.textContent = counter.val.toFixed(decimals); }
      });
    }

    function resetCounts() {
      orbs.forEach(function (orb) {
        var valueEl = orb.querySelector('.data-value');
        if (valueEl && !orb.hasAttribute('data-static')) valueEl.textContent = '0';
      });
    }

    // Shifted by one slot from a plain identity mapping: orb i starts at
    // slot (i+1)%5, so the LAST orb (0次) is what starts in the centre/top
    // slot rather than the first (22場) — the cycle order itself (22場 →
    // 467萬 → 43.12% → 21–35% → 0次) is otherwise unchanged, just rotated by
    // one so 0次 leads.
    var INITIAL_SLOT = [1, 2, 3, 4, 0];
    var ROTATION_STEPS = 4;

    // Precompute each orb's 5 waypoint angles (continuously unwrapped, so
    // interpolating between them never jumps backward across the 0°/360°
    // seam) and its scale/opacity at each waypoint, so a single continuous
    // value "r" (0..ROTATION_STEPS) can drive every orb's position smoothly
    // off one scrub-controlled number — no independent per-step tweening.
    var waypointAngle = [];
    var waypointScale = [];
    var waypointOpacity = [];
    orbs.forEach(function (orb, i) {
      var slot = INITIAL_SLOT[i];
      var angles = [ANGLES[slot]];
      var scales = [VISIBLE[slot] ? 1 : .45];
      var opacities = [VISIBLE[slot] ? 1 : .18];
      for (var k = 1; k <= ROTATION_STEPS; k++) {
        // -1 (not +1): steps the other way around the ellipse — the +1
        // direction rendered as counter-clockwise, which read backwards.
        var nextSlot = (slot - 1 + 5) % 5;
        var delta = ANGLES[nextSlot] - ANGLES[slot];
        if (delta > 0) delta -= 360;
        angles.push(angles[k - 1] + delta);
        scales.push(VISIBLE[nextSlot] ? 1 : .45);
        opacities.push(VISIBLE[nextSlot] ? 1 : .18);
        slot = nextSlot;
      }
      waypointAngle.push(angles);
      waypointScale.push(scales);
      waypointOpacity.push(opacities);
    });

    function applyRotation(r) {
      var k = Math.max(0, Math.min(ROTATION_STEPS - 1, Math.floor(r)));
      var frac = r - k;
      orbs.forEach(function (orb, i) {
        var a0 = waypointAngle[i][k], a1 = waypointAngle[i][k + 1];
        var p = pointAt(a0 + (a1 - a0) * frac);
        var s0 = waypointScale[i][k], s1 = waypointScale[i][k + 1];
        var o0 = waypointOpacity[i][k], o1 = waypointOpacity[i][k + 1];
        gsap.set(orb, {
          x: p.x - CENTER.x,
          y: p.y - CENTER.y,
          scale: s0 + (s1 - s0) * frac,
          opacity: o0 + (o1 - o0) * frac
        });
      });
    }

    // Re-counts whichever orbs are visible at integer rotation step `step`
    // (0 = right after the burst, before any scroll-driven rotation).
    function syncStepCounts(step) {
      resetCounts();
      orbs.forEach(function (orb, i) {
        var slot = (INITIAL_SLOT[i] + step) % 5;
        if (VISIBLE[slot]) animateValue(orb, i * 0.05);
      });
    }

    // --- Entrance ---
    // .data-earth is a large, fixed 891x891 globe (see style.css) — per
    // Figma, its resting size already nearly fills a typical viewport height,
    // so there's little to no room left to scale it up further for the
    // "sunrise" entrance without overflowing. Math.max(1, ...) here means:
    // grow a little if there's room, but never shrink below natural size.
    var earthBaseSize = earth.offsetWidth || 891;
    var bigScale = Math.max(1, (window.innerHeight * 0.85) / earthBaseSize);

    // The earth's natural CSS position (its final, Figma-measured resting
    // spot) sits low enough in .data-stage that only its top portion shows
    // before the section's bottom edge clips the rest — resting there during
    // the "risen" (big) state would spill it mostly off both the top and
    // bottom of the viewport. So the "risen" state temporarily recentres on
    // the viewport's own vertical middle instead, and only when it SHRINKS
    // back down in step 3 does it also slide back into its real resting spot.
    // Measured relative to the SECTION's own top edge, not the viewport —
    // once ScrollTrigger pins the section its top becomes the viewport top,
    // so this local offset is what the stage's viewport-Y will actually be.
    var sectionRectAtSetup = dataSection.getBoundingClientRect();
    var stageRectForEarth = dataSection.querySelector('.data-stage').getBoundingClientRect();
    var stageLocalTop = stageRectForEarth.top - sectionRectAtSetup.top;
    var finalCenterY = stageLocalTop + EARTH_CENTER_Y;
    var riseCenterY = window.innerHeight / 2;
    var riseY = riseCenterY - finalCenterY;

    gsap.set(head, { opacity: 0, y: 20 });
    gsap.set(bg, { opacity: 0 });
    gsap.set(orbs, { x: 0, y: 0, scale: 0, opacity: 0 });
    gsap.set(orbTexts, { opacity: 0, scale: .4 });
    // .data-earth is centred via CSS transform: translate(-50%, -50%); since
    // GSAP will own this element's transform from here on, xPercent/yPercent
    // -50 tell it to keep baking that centering in on every tween. Parked
    // at its risen (centred) y for the whole entrance now — it grows from
    // scale 0 in place rather than rising from below.
    gsap.set(earth, { xPercent: -50, yPercent: -50, opacity: 0, y: riseY, scale: 0 });

    if (ringReveal && ringReveal.getTotalLength) {
      var ringLen = ringReveal.getTotalLength();
      gsap.set(ringReveal, { strokeDasharray: ringLen, strokeDashoffset: ringLen });
    }

    resetCounts();
    var entranceDone = false;
    var lastStep = 0;

    // Built paused, with no scrollTrigger yet — later phases need
    // tl.duration() at each step to calibrate scroll distances, so the
    // ScrollTrigger itself is only created once the whole timeline is built.
    var tl = gsap.timeline({ paused: true });

    // 1) Sunrise — earth grows from nothing (scale 0) and fades in alone, in
    //    place at the viewport's vertical middle (riseY) — not yet its
    //    final stage slot, so the big circle never clips the section edges.
    tl.to(head, { opacity: 1, y: 0, duration: 0.5 }, 0);
    tl.to(earth, { opacity: 1, scale: bigScale, duration: 1.8, ease: 'power2.out' }, 0);
    // 2) Backdrop fades in ONLY once the earth has fully risen (sequential).
    tl.to(bg, { opacity: 1, duration: 1.0 }, 1.8);
    // 3) Earth shrinks into its final spot ONLY once the backdrop is in —
    //    scale and position settle together (shrinking "down" into place).
    tl.to(earth, { scale: 1, y: 0, duration: 1.6, ease: 'power2.inOut' }, 2.8);
    // 4) Circle rings burst outward from the earth's centre, staggered,
    //    ONLY once the earth has fully finished shrinking, to each orb's
    //    INITIAL_SLOT position. The dashed semicircle draws itself over the
    //    same span.
    var burstStart = 4.4;
    var burstStagger = 0.15;
    var burstDuration = 0.7;
    orbs.forEach(function (orb, i) {
      var slot = INITIAL_SLOT[i];
      var p = pointAt(ANGLES[slot]);
      var pos = burstStart + i * burstStagger;
      tl.to(orb, {
        x: p.x - CENTER.x,
        y: p.y - CENTER.y,
        scale: VISIBLE[slot] ? 1 : .45,
        opacity: VISIBLE[slot] ? 1 : .18,
        duration: burstDuration,
        ease: 'back.out(1.6)'
      }, pos);
      // 5) That circle's text zooms in right as its own burst tween ends —
      //    not before, and not overlapping the others.
      var textEl = orb.querySelector('.data-orb-text');
      tl.to(textEl, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.8)'
      }, pos + burstDuration);
    });
    if (ringReveal) {
      tl.to(ringReveal, { strokeDashoffset: 0, duration: burstStagger * 4 + burstDuration, ease: 'none' }, burstStart);
    }
    // 6) Numbers count up for real once the whole sequence above has
    //    finished — handled by the onUpdate progress check below.

    // Marks where the entrance ends — gates entranceDone and calibrates how
    // much scroll distance the entrance itself gets.
    var entranceDuration = tl.duration();

    // 7) Scroll-driven rotation — continuously tied to scroll (not clicks or
    //    autoplay), fully reversible like every other phase here. A single
    //    proxy value "r" sweeps 0 → ROTATION_STEPS; applyRotation() (above)
    //    recomputes every orb's position/scale/opacity from it on every
    //    tick, forward or backward.
    var rotationDuration = ROTATION_STEPS * 0.9;
    var rotationProxy = { r: 0 };
    tl.to(rotationProxy, {
      r: ROTATION_STEPS,
      duration: rotationDuration,
      ease: 'none',
      onUpdate: function () {
        applyRotation(rotationProxy.r);
        var step = Math.max(0, Math.min(ROTATION_STEPS, Math.round(rotationProxy.r)));
        if (step !== lastStep && entranceDone) {
          lastStep = step;
          syncStepCounts(step);
        }
      }
    }, entranceDuration);
    var rotationEnd = entranceDuration + rotationDuration;

    // 8) Exit: circles float up and fade out first — finishing well before
    //    the earth does — then the earth sinks and shrinks away to nothing.
    //    The green backdrop stays green through the first half of that
    //    sink; only in the second half does .data-sea-overlay (the same
    //    sea.jpg Download uses) crossfade over it, timed to finish exactly
    //    as the earth finishes disappearing.
    var orbitExitDuration = 1.0;
    if (orbit) {
      tl.to(orbit, { y: -60, scale: 0.8, opacity: 0, ease: 'power1.in', duration: orbitExitDuration }, rotationEnd);
    }
    if (head) {
      tl.to(head, { y: -40, opacity: 0, ease: 'power1.in', duration: orbitExitDuration }, rotationEnd);
    }
    var sinkDuration = 2;
    if (earth) {
      tl.to(earth, { y: '+=260', scale: 0.25, opacity: 0, ease: 'power1.in', duration: sinkDuration }, rotationEnd);
    }
    if (seaOverlay) {
      tl.to(seaOverlay, { opacity: 1, ease: 'none', duration: sinkDuration / 2 }, rotationEnd + sinkDuration / 2);
    }

    var totalDuration = tl.duration();
    // Fraction of the FULL scrub where the entrance ends — replaces the old
    // hardcoded 0.999 now that there's a lot more timeline after it. Carries
    // over the original 1800px-per-entranceDuration pacing so the entrance
    // itself still feels exactly as before.
    var entranceThreshold = entranceDuration / totalDuration;
    var totalScrollPixels = Math.round((1800 / entranceDuration) * totalDuration);

    ScrollTrigger.create({
      animation: tl,
      trigger: dataSection,
      start: 'top top',
      end: '+=' + totalScrollPixels,
      // 0.4, not the 1 used elsewhere: a fast trackpad swipe/wheel flick can
      // carry the raw scroll position past this pin's end before a heavier
      // smoothing lag has had time to catch the animation up — pin release
      // follows raw scroll, not the eased animation, so with scrub:1 the
      // pin could release with the earth-sink still visibly mid-fade,
      // leaving it stranded on screen under the now-revealed Download
      // content. A lighter lag closes most of that gap; fastScrollEnd
      // handles whatever's left by snapping straight to the end state
      // instead of leaving the tween stranded mid-way.
      scrub: 0.4,
      pin: true,
      pinSpacing: true,
      fastScrollEnd: true,
      onUpdate: function (self) {
        if (self.progress >= entranceThreshold && !entranceDone) {
          entranceDone = true;
          lastStep = 0;
          // Zoom-in tweens (see the burst loop above) finish right as this
          // threshold is crossed, so counting up here happens right after.
          syncStepCounts(0);
        } else if (self.progress < entranceThreshold && entranceDone) {
          entranceDone = false;
          lastStep = 0;
          resetCounts();
          // Scrolled back to the very start of the section — nothing should
          // be visible yet, so force the pre-burst state directly.
          // overwrite:false so this doesn't itself strip this timeline's OWN
          // burst tween of its properties (which would otherwise permanently
          // disable it from ever rendering again on a later forward scroll).
          gsap.set(orbs, { x: 0, y: 0, scale: 0, opacity: 0, overwrite: false });
          gsap.set(orbTexts, { opacity: 0, scale: .4, overwrite: false });
        }
      }
    });
  })();

  // Download's main visual — the earth-sink + green→sea crossfade already
  // happened inside the Data section's own pinned scrub (step 8 above), so
  // by the time this section is reached its sea.jpg background is already
  // fully in place. .download-section is pinned here too (own, separate
  // ScrollTrigger, starting the instant Data's pin releases — pinSpacing
  // means .download-section's top lands exactly at the viewport top right
  // as that happens, so there's no scroll distance left for it to visibly
  // "slide up into view" first) specifically so the text/button and report
  // card fade up WHILE the screen holds still, instead of the whole section
  // appearing to scroll/slide in as one block. Card trails the text by a
  // beat, same as before.
  (function () {
    var downloadSection = document.querySelector('.download-section');
    var downloadContent = document.querySelector('.download-content');
    var downloadCard = document.querySelector('.download-card');
    if (!downloadSection || (!downloadContent && !downloadCard)) return;

    if (downloadContent) gsap.set(downloadContent, { opacity: 0, y: 40 });
    if (downloadCard) gsap.set(downloadCard, { opacity: 0, y: 60 });

    var revealTl = gsap.timeline({ paused: true });
    if (downloadContent) {
      revealTl.to(downloadContent, { opacity: 1, y: 0, duration: 0.8, ease: 'sine.out' }, 0);
    }
    if (downloadCard) {
      revealTl.to(downloadCard, { opacity: 1, y: 0, duration: 0.9, ease: 'sine.out' }, 0.2);
    }

    ScrollTrigger.create({
      animation: revealTl,
      trigger: downloadSection,
      start: 'top top',
      end: '+=500',
      scrub: 0.4,
      pin: true,
      pinSpacing: true,
      // See the matching comment on the Data section's ScrollTrigger above —
      // same fast-scroll protection.
      fastScrollEnd: true
    });
  })();

  // Background images (set via inline style, not <img> tags) don't fire the
  // load events ScrollTrigger normally watches for, so positions measured
  // before they finish loading can be stale. Refresh once everything is in.
  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
  });
});
