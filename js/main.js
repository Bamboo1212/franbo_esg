/* ==========================================================
  banner 輪播計數器（設計稿為兩位數：01 / 02 …）
========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var heroCarousel = document.getElementById('heroCarousel');
  if (!heroCarousel) return;

  var currentEl = document.querySelector('.banner-counter-num');
  if (!currentEl) return;

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  heroCarousel.addEventListener('slide.bs.carousel', function (e) {
    currentEl.textContent = pad(e.to + 1);
  });
});


/* ==========================================================
  互動專區：橫向捲動
========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var viewport = document.getElementById('interItems');
  var track = document.getElementById('interTrack');
  var prevBtn = document.getElementById('interPrev');
  var nextBtn = document.getElementById('interNext');
  if (!viewport || !track || !prevBtn || !nextBtn) return;

  var items = track.querySelectorAll('.inter-item');
  if (!items.length) return;

  var offset = 0;

  // 間距直接從 CSS 讀，避免寫死 32
  function gap() {
    var g = parseFloat(window.getComputedStyle(track).columnGap);
    return isNaN(g) ? 32 : g;
  }

  function step() {
    return items[0].getBoundingClientRect().width + gap();
  }

  function maxOffset() {
    return Math.max(0, track.scrollWidth - viewport.clientWidth);
  }

  function update() {
    var max = maxOffset();
    offset = Math.min(Math.max(offset, 0), max);
    track.style.transform = 'translateX(-' + offset + 'px)';
    prevBtn.disabled = offset <= 0;
    nextBtn.disabled = offset >= max - 1;
  }

  prevBtn.addEventListener('click', function () {
    offset -= step();
    update();
  });

  nextBtn.addEventListener('click', function () {
    offset += step();
    update();
  });

  window.addEventListener('resize', update);
  update();
});


/* ==========================================================
  手機漢堡選單
========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  });

  // 點選單項目後收合
  nav.addEventListener('click', function (e) {
    if (e.target.tagName !== 'A') return;
    nav.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '開啟選單');
  });

  // 回到桌機寬度時確保收合狀態被清掉
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1199 && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '開啟選單');
    }
  });
});


/* ==========================================================
  永續經營：數據輪播
  桌機 (≥992)：5 顆沿軌道旋轉，上 / 右 / 左 三個位置可見，下方兩格隱藏
  手機 (≤991)：一次 1 顆，左右鍵或手指滑動切換
  兩種模式共用同一個 current，切換斷點時停在同一顆
========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var section = document.querySelector('.data-section');
  var stage = section && section.querySelector('.data-stage');
  if (!stage || typeof gsap === 'undefined') return;

  var orbs = Array.prototype.slice.call(stage.querySelectorAll('.data-orb'));
  var prevBtn = stage.querySelector('.data-slide-prev');
  var nextBtn = stage.querySelector('.data-slide-next');
  var N = orbs.length;
  if (N !== 5 || !prevBtn || !nextBtn) return;

  // 隱形軌道：中心 (769, 430)，通過設計稿三個球心，見 style.css .data-orb
  var RX = 488.82;
  var RY = 261;
  // -90° 為正上方、角度往順時針增加：上、右、右下(隱藏)、左下(隱藏)、左
  // 兩個隱藏格平分右→左之間下方的 192.3°
  var SLOT_ANGLES = [-90, -6.158, 57.947, 122.053, 186.158];
  var SLOT_VISIBLE = [true, true, false, false, true];

  var INTERVAL = 4000;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var mobileMQ = window.matchMedia('(max-width: 991px)');

  var current = 0;   // 目前在主位的項目：桌機是正上方那顆，手機是唯一顯示的那顆
  var angle = [];    // 每顆目前的角度，不取模，旋轉方向才會一致
  var tl = null;
  var animating = false;
  var timer = null;
  var hovering = false;
  var inView = false;
  var enabled = true; // 捲動場景會在數據球噴發前停用、噴發完成後啟用

  function slotOf(i) {
    return ((i - current) % N + N) % N;
  }

  function point(deg) {
    var r = deg * Math.PI / 180;
    return { x: RX * Math.cos(r), y: RY * Math.sin(r) };
  }

  function syncAttrs() {
    orbs.forEach(function (orb, i) {
      var s = slotOf(i);
      var shown = mobileMQ.matches ? s === 0 : SLOT_VISIBLE[s];
      orb.setAttribute('data-slot', s);
      orb.setAttribute('aria-hidden', shown ? 'false' : 'true');
    });
  }

  /* ---------- 桌機：沿軌道旋轉 ---------- */

  function layoutDesktop() {
    orbs.forEach(function (orb, i) {
      var s = slotOf(i);
      var p = point(SLOT_ANGLES[s]);
      angle[i] = SLOT_ANGLES[s];
      gsap.set(orb, {
        x: p.x,
        y: p.y,
        scale: SLOT_VISIBLE[s] ? 1 : .5,
        autoAlpha: SLOT_VISIBLE[s] ? 1 : 0
      });
    });
  }

  function moveDesktop(dir, oldSlots, onDone) {
    var dur = reduceMotion ? 0 : 1.1;
    tl = gsap.timeline({ onComplete: onDone });

    orbs.forEach(function (orb, i) {
      var from = oldSlots[i];
      var to = slotOf(i);

      // 往順時針要轉幾度；「下一個」是逆時針（右→上→左），所以取反方向
      var cw = ((SLOT_ANGLES[to] - angle[i]) % 360 + 360) % 360;
      var delta = dir > 0 ? (cw === 0 ? 0 : cw - 360) : cw;
      var proxy = { a: angle[i] };
      angle[i] += delta;

      tl.to(proxy, {
        a: angle[i],
        duration: dur,
        ease: 'power2.inOut',
        onUpdate: function () {
          var p = point(proxy.a);
          gsap.set(orb, { x: p.x, y: p.y });
        }
      }, 0);

      // 離開可見位置：邊走邊縮小淡出；進入可見位置：走到後段才浮現
      if (SLOT_VISIBLE[from] && !SLOT_VISIBLE[to]) {
        tl.to(orb, { autoAlpha: 0, scale: .5, duration: dur * .55, ease: 'power2.in' }, 0);
      } else if (!SLOT_VISIBLE[from] && SLOT_VISIBLE[to]) {
        tl.fromTo(orb,
          { autoAlpha: 0, scale: .5 },
          { autoAlpha: 1, scale: 1, duration: dur * .6, ease: 'power2.out', immediateRender: false },
          dur * .4);
      }
    });
  }

  /* ---------- 手機：一次 1 顆 ---------- */

  function layoutMobile() {
    orbs.forEach(function (orb, i) {
      gsap.set(orb, { x: 0, y: 0, xPercent: 0, scale: 1, autoAlpha: slotOf(i) === 0 ? 1 : 0 });
    });
  }

  function moveMobile(dir, oldIndex, onDone) {
    var dur = reduceMotion ? 0 : .6;
    tl = gsap.timeline({ onComplete: onDone });
    tl.to(orbs[oldIndex], { xPercent: -30 * dir, autoAlpha: 0, duration: dur * .7, ease: 'power2.in' }, 0)
      .fromTo(orbs[current],
        { xPercent: 30 * dir, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: dur, ease: 'power3.out', immediateRender: false },
        dur * .3);
  }

  /* ---------- 切換 ---------- */

  function go(dir) {
    if (animating) return;
    animating = true;
    clearTimeout(timer);

    var oldIndex = current;
    var oldSlots = orbs.map(function (o, i) { return slotOf(i); });
    current = (current + dir + N) % N;
    syncAttrs();

    var done = function () {
      animating = false;
      tl = null;
      schedule();
    };

    if (mobileMQ.matches) moveMobile(dir, oldIndex, done);
    else moveDesktop(dir, oldSlots, done);
  }

  // 斷點切換：停掉進行中的動畫，依目前的 current 直接排好
  function applyMode() {
    if (tl) { tl.kill(); tl = null; }
    animating = false;
    gsap.set(orbs, { clearProps: 'transform,opacity,visibility' });
    syncAttrs();
    if (mobileMQ.matches) layoutMobile();
    else layoutDesktop();
    schedule();
  }

  /* ---------- 自動播放 ---------- */

  function canAutoplay() {
    return enabled && !reduceMotion && inView && !hovering && !document.hidden;
  }

  function schedule() {
    clearTimeout(timer);
    if (!canAutoplay()) return;
    timer = setTimeout(function () { go(1); }, INTERVAL);
  }

  // 只在球和箭頭上暫停：整個區塊都算的話，滑鼠停在畫面中間捲過去就永遠不會播
  // 觸控裝置沒有真正的 hover（點一下會觸發 mouseenter 卻不會 leave），所以略過
  if (canHover) {
    orbs.concat([prevBtn, nextBtn]).forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        hovering = true;
        clearTimeout(timer);
      });
      el.addEventListener('mouseleave', function () {
        hovering = false;
        schedule();
      });
    });
  }

  // 區塊不在畫面上時不播，捲到時才開始計時
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) schedule();
      else clearTimeout(timer);
    }, { threshold: .3 }).observe(section);
  } else {
    inView = true;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearTimeout(timer);
    else schedule();
  });

  /* ---------- 操作 ---------- */

  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });

  // 手機滑動：橫向位移超過 40px 且明顯大於直向才算，避免誤觸捲動
  var touchX = 0;
  var touchY = 0;
  var touching = false;

  stage.addEventListener('touchstart', function (e) {
    if (!mobileMQ.matches) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    touching = true;
    clearTimeout(timer);
  }, { passive: true });

  stage.addEventListener('touchend', function (e) {
    if (!touching) return;
    touching = false;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
    else schedule();
  }, { passive: true });

  if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', applyMode);
  else mobileMQ.addListener(applyMode);

  // 給 animations.js 用：控制自動播放是否允許（手動左右鍵不受影響）
  window.dataCarousel = {
    enable: function () { enabled = true; schedule(); },
    disable: function () { enabled = false; clearTimeout(timer); }
  };

  applyMode();
});
