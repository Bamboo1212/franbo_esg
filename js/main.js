/* ========== header：往下滑加上 .is-scrolled；往下滑隱藏、往上滑出現（.is-hidden） ========== */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastY = window.scrollY;
  const heroes = document.querySelectorAll('.hero');

  // hero 還固定在畫面上（sticky 中，頂端仍在視窗頂部）時不加白底；電腦版、手機版只看顯示中的那一組
  function isOnHero() {
    return Array.prototype.some.call(heroes, function (hero) {
      return hero.offsetHeight > 0 && hero.getBoundingClientRect().top >= 0;
    });
  }

  function onScroll() {
    const y = window.scrollY;

    // 回到頂部：顯示、透明底
    if (y <= 0) {
      header.classList.remove('is-hidden', 'is-scrolled');
      lastY = 0;
      return;
    }

    // 漢堡選單或搜尋框開著時不隱藏
    const isLocked = header.classList.contains('is-menu-open') || header.classList.contains('is-search-open');

    // 位移小於 5px 不判斷，避免觸控板微動造成閃爍
    if (Math.abs(y - lastY) < 5) return;

    // 往下滑第一下就收起
    if (y > lastY && !isLocked) {
      header.classList.add('is-hidden');
    } else if (y < lastY) {
      header.classList.remove('is-hidden');
    }

    // 白底只在 header 顯示時切換，往上收起的過程中不換色，避免先閃一下白底；hero 固定期間維持透明底
    if (!header.classList.contains('is-hidden')) {
      header.classList.toggle('is-scrolled', !isOnHero());
    }

    lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // 重新整理時若已不在頂部、也不在 hero 固定範圍內，直接套用白底
  // 等下一幀再判斷：hero 的停留距離由後面的 hero 程式設定，太早判斷會誤以為已離開 hero
  requestAnimationFrame(function () {
    header.classList.toggle('is-scrolled', window.scrollY > 0 && !isOnHero());
  });
})();

/* ========== header：漢堡選單展開時加上 .is-menu-open ========== */
(function () {
  const header = document.querySelector('.site-header');
  const collapse = document.getElementById('navbarSupportedContent');
  if (!header || !collapse) return;

  // 開始展開就變白底；完全收合後才移除，避免收合動畫中白字疊在內容上
  // body 也加上 .is-menu-open，用來鎖住背後頁面捲動（CSS 只在 1199px 以下生效）
  collapse.addEventListener('show.bs.collapse', function () {
    header.classList.add('is-menu-open');
    document.body.classList.add('is-menu-open');

    // 語系選單若開著先收起，避免關閉選單後它又直接出現
    const langWrap = header.querySelector('.lang-wrap');
    if (langWrap) langWrap.classList.remove('is-open');
  });

  collapse.addEventListener('hidden.bs.collapse', function () {
    header.classList.remove('is-menu-open');
    document.body.classList.remove('is-menu-open');
  });
})();

/* ========== header：漢堡選單時點箭頭展開次選單（可同時展開多個） ========== */
(function () {
  document.querySelectorAll('.submenu-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.nav-item');
      const isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  });
})();

/* ========== header：搜尋框開啟／關閉（開著時 header 加 .is-search-open 變白底） ========== */
(function () {
  const header = document.querySelector('.site-header');
  const openBtn = document.querySelector('.search-open-btn');
  const closeBtn = document.querySelector('.search-input-wrap .close-btn');
  const input = document.getElementById('search');
  if (!header || !openBtn || !closeBtn) return;

  // 再按一次可關閉
  openBtn.addEventListener('click', function () {
    const isOpen = header.classList.toggle('is-search-open');
    if (isOpen && input) input.focus();
  });

  closeBtn.addEventListener('click', function () {
    header.classList.remove('is-search-open');
  });

  // 展開漢堡選單時一併關閉搜尋框，避免兩者重疊
  const collapse = document.getElementById('navbarSupportedContent');
  if (collapse) {
    collapse.addEventListener('show.bs.collapse', function () {
      header.classList.remove('is-search-open');
    });
  }
})();

/* ========== header：漢堡選單時點擊切換語系選單 ========== */
(function () {
  const langWrap = document.querySelector('.lang-wrap');
  if (!langWrap) return;

  langWrap.querySelector('.lang-main').addEventListener('click', function () {
    langWrap.classList.toggle('is-open');
  });

  // 點選單以外的地方收合
  document.addEventListener('click', function (e) {
    if (!langWrap.contains(e.target)) {
      langWrap.classList.remove('is-open');
    }
  });
})();

/* ========== hero 輪播（Swiper）：電腦版、手機版各一組，設定相同 ========== */
(function () {
  if (typeof Swiper === 'undefined') return;

  const HERO_DELAY = 10000; // 每張停留時間（ms），需與 CSS 的 --hero-delay 相同
  const HERO_SPEED = 800;   // 換張滑動時間（ms），需與 CSS 的 --hero-speed 相同
  const RING_LENGTH = 213.6; // 圓周 = 2π × 34

  document.querySelectorAll('.hero-swiper').forEach(function (el) {
    const ring = el.querySelector('.hero-ring circle');
    const num = el.querySelector('.hero-num');

    new Swiper(el, {
      loop: true,
      speed: HERO_SPEED,
      autoplay: {
        delay: HERO_DELAY,
        disableOnInteraction: false // 點 prev / next 後繼續自動播放
      },
      navigation: {
        prevEl: el.querySelector('.hero-prev'),
        nextEl: el.querySelector('.hero-next')
      },
      // 隱藏的那一版在視窗縮放切換顯示時，重新計算尺寸
      observer: true,
      observeParents: true,
      on: {
        init: function () {
          // 等第一張畫出來後才開始放大，否則一載入就直接是放大後的尺寸
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              el.classList.add('is-ready');
            });
          });
        },
        slideChange: function (swiper) {
          num.textContent = String(swiper.realIndex + 1).padStart(2, '0');
          ring.style.strokeDashoffset = RING_LENGTH;
        },
        // percentage 由 1 遞減到 0，圈圈隨剩餘時間順時針畫滿
        autoplayTimeLeft: function (swiper, timeLeft, percentage) {
          ring.style.strokeDashoffset = RING_LENGTH * percentage;
        }
      }
    });
  });
})();

/* ========== 平滑捲動（Lenis），與 GSAP ScrollTrigger 同步 ========== */
(function () {
  if (typeof Lenis === 'undefined') return;
  // 系統設定減少動態時維持原生捲動
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({ lerp: 0.1 }); // 數字越小越滑（0 ~ 1）
  window.lenis = lenis; // 給 gotop 等其他區塊使用

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    });
  }

  // 漢堡選單開著時停止捲動背後頁面（選單本身有 data-lenis-prevent，可自行捲動）
  const collapse = document.getElementById('navbarSupportedContent');
  if (collapse) {
    collapse.addEventListener('show.bs.collapse', function () {
      lenis.stop();
    });
    collapse.addEventListener('hidden.bs.collapse', function () {
      lenis.start();
    });
  }
})();

/* ========== hero：往下捲時固定不動、逐漸模糊變暗，捲完後和互動專區一起往上走（GSAP ScrollTrigger） ========== */
(function () {
  const wrap = document.querySelector('.hero-wrap');
  const inter = document.querySelector('.inter');
  if (!wrap || !inter || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const HOLD = '100vh'; // hero 固定停留的捲動距離，之後和互動專區一起往上走
  const BLUR_START = 0.3; // 捲動超過視窗高度的幾倍才開始模糊（0.3 ≈ 滾輪 2～3 下）

  gsap.registerPlugin(ScrollTrigger);

  // 電腦版、手機版 hero 只對目前顯示的那一組建立（對應 Bootstrap d-lg-*，992px）
  const mm = gsap.matchMedia();
  const heroes = {
    '(min-width: 992px)': '.hero.d-lg-block',
    '(max-width: 991.98px)': '.hero.d-lg-none'
  };

  Object.keys(heroes).forEach(function (query) {
    mm.add(query, function () {
      const hero = document.querySelector(heroes[query]);
      if (!hero) return;

      // .hero-wrap 加長 HOLD 的距離，hero（sticky）在這段捲動中固定不動（matchMedia 失效時 gsap.set 會自動還原）
      gsap.set(wrap, { '--hero-hold': HOLD });

      // hero 的固定由 CSS sticky 處理，這裡只負責模糊
      // 捲過 BLUR_START 後才慢慢變模糊變暗，互動專區頂端進入畫面（= hero 開始往上走）時達到最模糊；scrub: 1 讓效果帶一點延遲感
      const blurTl = gsap.timeline({
        scrollTrigger: {
          start: function () {
            return window.innerHeight * BLUR_START;
          },
          endTrigger: inter,
          end: 'top bottom',
          scrub: 1
        }
      });

      blurTl.fromTo(hero,
        { '--hero-blur': '0px', '--hero-dim': 0 },
        { '--hero-blur': '30px', '--hero-dim': 0.45, ease: 'none', duration: 1 }
      );

      // 標題與控制列在前半段淡出，避免和互動專區疊在一起
      blurTl.to(hero.querySelectorAll('.hero-txt, .hero-ctrl'), { autoAlpha: 0, ease: 'none', duration: 0.5 }, 0);
    });
  });
})();

/* ========== 捲動場景：最新消息 → 永續經營 → 報告書下載（GSAP ScrollTrigger） ==========
   所有尺寸：最新消息最後一屏，共用背景由藍漸變成綠（html.is-scene）
   ≥576px 且畫面放得下整塊永續經營：永續經營＋報告書下載疊在同一個固定畫面（html.is-story），跟著捲動播放一條時間軸
           （單位 ≈ 一個視窗高的捲動距離），往回捲會倒轉：
     0.0 – 0.4  整顆地球在畫面中央淡入
     0.4 – 1.4  地球下沉、放大到原本位置
     1.4 – 2.2  數據從地球噴發，標題與虛線一起淡入
     2.2 – 3.2  停留，數字跳動
     3.2 – 4.6  數據上飄淡出、地球下沉淡出，背景綠 → 海
     4.4 – 5.2  報告書下載上飄淡入
   畫面放不下整塊永續經營時，永續經營等比縮小
   ≤575px：內容照常捲動。數據球捲進畫面時一顆顆放大淡入並跳數字；
           地球維持在最下面，捲到時從上方淡入下沉到位；捲到報告書下載時地球下沉、數據上飄淡出，背景綠 → 海，白卡上飄淡入
   <992px 且畫面高度 < 600px，或系統設定減少動態時不啟用，維持一般版型
   視窗大小改變時重新判斷（見本段最後的 pickMode）
   CSS 見 style.css ==scene */
(function () {
  const story = document.querySelector('.story');
  const news = document.querySelector('.news');
  if (!story || !news || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const green = document.querySelector('.scene-green');
  const sea = document.querySelector('.scene-sea');
  const container = story.querySelector('.data .container');
  const body = story.querySelector('.data-body');
  const earth = story.querySelector('.earth');
  const earthLine = story.querySelector('.earth-line');
  const orbs = story.querySelector('.data-circle-warp');
  const title = story.querySelector('.data .section-title');
  const dataSection = story.querySelector('.data');
  const download = story.querySelector('.download');
  const card = story.querySelector('.download-inner');
  const items = story.querySelectorAll('.data-item');
  if (!green || !sea || !container || !body || !earth || !earthLine || !orbs || !title || !dataSection || !download || !card) return;

  const TOTAL = 5.2;     // 時間軸總長（視窗高的倍數）
  const BURST_END = 2.2; // 數據噴發完成，開始跳數字
  const HOLD_END = 3.2;  // 停留結束，開始轉場到報告書下載

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 數字跳動（到位後自己跑，不跟捲動） ---------- */
  // 目標值與小數位數取自 HTML 原本的數字；順序與 items 相同
  const counters = Array.prototype.map.call(items, function (item) {
    const el = item.querySelector('.num span:first-child');
    const text = el.textContent.trim();
    // isZero：目前是否顯示 0，避免捲動時重複寫入
    return { el: el, target: parseFloat(text), decimals: (text.split('.')[1] || '').length, tween: null, isZero: false };
  });

  function setCount(c, toFinal) {
    if (c.tween) c.tween.kill();
    c.el.textContent = (toFinal ? c.target : 0).toFixed(c.decimals);
    c.isZero = !toFinal;
  }

  // 往下捲、還沒開始跳數字時先歸零，數據球淡入時就從 0 開始，不會停在上次跑到的數字
  function resetIfDirty(c) {
    if (!c.isZero) setCount(c, false);
  }

  function countUpOne(c) {
    if (c.tween) c.tween.kill();
    c.isZero = false;
    const o = { v: 0 };
    c.tween = gsap.to(o, {
      v: c.target,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: function () {
        c.el.textContent = o.v.toFixed(c.decimals);
      }
    });
  }

  function setCounts(toFinal) {
    counters.forEach(function (c) { setCount(c, toFinal); });
  }

  function countUp() {
    counters.forEach(countUpOne);
  }

  /* ---------- 固定畫面縮放：畫面放不下整塊永續經營時等比縮小，上方留 20px ---------- */
  let scale = 1;

  function updateScale() {
    scale = Math.min(1, (window.innerHeight - 20) / container.offsetHeight);
    container.style.setProperty('--story-scale', scale);
  }

  // 固定畫面：「整顆地球在畫面正中央、直徑約視窗高 70%」換算成相對原本位置的位移與縮放（container 內的座標要除以 scale）
  function earthStart() {
    const vh = window.innerHeight;
    // 換算視窗中心在 .data-body 裡的 y（.data 固定時頂端在視窗頂端；桌機內容貼齊底部、平板垂直置中都適用）
    const centerY = (vh / 2 - (body.getBoundingClientRect().top - dataSection.getBoundingClientRect().top)) / scale;
    return {
      y: centerY - (earth.offsetTop + earth.offsetHeight / 2),
      scale: 0.7 * vh / scale / earth.offsetHeight
    };
  }

  // 最新消息最後一屏：藍 → 綠（結束點剛好是永續經營頂端到視窗頂端，接上時已是全綠）
  function newsToGreen() {
    gsap.fromTo(green, { autoAlpha: 0 }, {
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: news,
        start: 'bottom bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  }

  /* ---------- 固定畫面（story） ---------- */
  function setupStory() {
    document.documentElement.classList.add('is-scene', 'is-story');
    gsap.set(story, { '--story-len': TOTAL });
    updateScale();
    ScrollTrigger.addEventListener('refreshInit', updateScale);
    setCounts(false);

    // 地球、虛線原本用 CSS translateX(-50%) 置中，改交給 GSAP 管理才不會被位移動畫蓋掉
    gsap.set([earth, earthLine], { xPercent: -50, x: 0 });

    // 1. 最新消息最後一屏：藍 → 綠
    newsToGreen();

    // 2. 場景時間軸
    let zone = 'before'; // before（噴發前）/ on（停留中）/ after（轉場後）

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: story,
        start: 'top top',
        // 只跑固定畫面的那段距離；報告書白卡比視窗高時，播完後白卡照常往上捲
        end: function () { return '+=' + Math.round(window.innerHeight * TOTAL); },
        scrub: 1,
        invalidateOnRefresh: true
      },
      onUpdate: function () {
        const t = tl.time();
        const next = t < BURST_END ? 'before' : (t < HOLD_END ? 'on' : 'after');

        // 噴發前往下捲：數字先歸零（往回捲收回時維持目前的數字）
        if (next === 'before' && tl.scrollTrigger.direction === 1) counters.forEach(resetIfDirty);
        if (next === zone) return;

        // 往下捲到數據噴發完就重新跳一次
        if (next === 'on' && zone === 'before') {
          countUp();
        } else if (next === 'after' && zone === 'before') {
          setCounts(true); // 快速捲過停留段時，直接顯示最終數字
        }
        zone = next;
      }
    });

    // 整顆地球在畫面中央淡入
    tl.fromTo(earth,
      {
        autoAlpha: 0,
        y: function () { return earthStart().y; },
        scale: function () { return earthStart().scale; }
      },
      { autoAlpha: 1, duration: 0.4 }, 0);

    // 下沉、放大到原本位置
    tl.to(earth, { y: 0, scale: 1, duration: 1, ease: 'power1.inOut' }, 0.4);

    // 數據從地球頂部噴發，標題與虛線一起淡入
    tl.fromTo(orbs,
      {
        autoAlpha: 0,
        scale: 0.2,
        transformOrigin: function () { return '50% ' + (earth.offsetTop + 120) + 'px'; }
      },
      { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 1.4);
    tl.fromTo([title, earthLine], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 1.6);

    // 停留
    tl.to({}, { duration: 1 }, BURST_END);

    // 轉場：數據、標題、虛線上飄淡出；地球下沉淡出；背景綠 → 海
    tl.to([orbs, title, earthLine], { y: -150, autoAlpha: 0, duration: 0.7, ease: 'power1.in' }, HOLD_END);
    tl.to(earth, {
      y: function () { return window.innerHeight / scale; },
      autoAlpha: 0,
      duration: 1.2,
      ease: 'power1.in'
    }, HOLD_END + 0.2);
    tl.fromTo(sea, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1 }, HOLD_END + 0.2);

    // 報告書下載上飄淡入
    tl.fromTo(card, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 4.4);

    // 切換模式時：gsap.context 會還原上面的動畫與 gsap.set，這裡還原其他狀態
    return function () {
      ScrollTrigger.removeEventListener('refreshInit', updateScale);
      document.documentElement.classList.remove('is-scene', 'is-story');
      container.style.removeProperty('--story-scale');
      setCounts(true);
    };
  }

  /* ---------- 內容照常捲動（flow） ---------- */
  function setupFlow() {
    document.documentElement.classList.add('is-scene');
    setCounts(false);
    // 原本用 CSS translateX(-50%) 置中的元素（地球、虛線、≥576px 的中間那顆數據球），改交給 GSAP 管理才不會被動畫蓋掉
    gsap.set([earth, earthLine], { xPercent: -50, x: 0 });
    items.forEach(function (item) {
      if (getComputedStyle(item).transform !== 'none') gsap.set(item, { xPercent: -50, x: 0 });
    });

    // 1. 最新消息最後一屏：藍 → 綠
    newsToGreen();

    // 2. 地球：維持在最下面原本的位置，捲進畫面時從稍微上方淡入、下沉到位
    //    觸發點用不會移動的 .data-body ＋ 地球原本的位置計算（地球本身有位移，拿來當觸發點會算錯）
    gsap.fromTo(earth, { autoAlpha: 0, y: -100 }, {
      autoAlpha: 1,
      y: 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: body,
        start: function () { return 'top+=' + earth.offsetTop + ' bottom'; },
        end: function () { return 'top+=' + earth.offsetTop + ' 60%'; },
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    // 3. 標題、虛線（≥992px 才有）淡入；數據球捲進畫面時一顆顆放大淡入，到位後跳數字
    //    往回捲到數據球完全離開畫面下方才歸零，下次進入時重跳；還在畫面上時來回捲動不會重跑
    gsap.fromTo(title, { autoAlpha: 0, y: 40 }, {
      autoAlpha: 1,
      y: 0,
      ease: 'power2.out',
      scrollTrigger: { trigger: title, start: 'top 85%', end: 'top 55%', scrub: 1 }
    });
    gsap.fromTo(earthLine, { autoAlpha: 0 }, {
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: { trigger: earthLine, start: 'top 90%', end: 'top 55%', scrub: 1 }
    });

    items.forEach(function (item, i) {
      gsap.fromTo(item, { autoAlpha: 0, scale: 0.6 }, {
        autoAlpha: 1,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 90%', end: 'top 55%', scrub: 1 }
      });
      // 往下捲到位時重新跳一次；往回捲時維持目前的數字，再往下捲時在跳之前先歸零
      ScrollTrigger.create({
        trigger: item,
        start: 'top bottom',
        end: 'top 55%',
        onUpdate: function (self) {
          if (self.direction === 1) resetIfDirty(counters[i]);
        }
      });
      ScrollTrigger.create({
        trigger: item,
        start: 'top 55%',
        onEnter: function () { countUpOne(counters[i]); }
      });
    });

    // 4. 捲到報告書下載：地球下沉淡出、數據上飄淡出、背景綠 → 海（與上面的動畫用不同屬性，避免互相蓋掉）
    function toDownload() {
      return { trigger: download, start: 'top bottom', end: 'top 40%', scrub: 1 };
    }

    gsap.fromTo(earth, { yPercent: 0, opacity: 1 }, {
      yPercent: 40,
      opacity: 0,
      ease: 'power1.in',
      immediateRender: false,
      scrollTrigger: toDownload()
    });
    gsap.fromTo([orbs, earthLine], { y: 0, opacity: 1 }, {
      y: -100,
      opacity: 0,
      ease: 'power1.in',
      immediateRender: false,
      scrollTrigger: toDownload()
    });
    gsap.fromTo(sea, { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', scrollTrigger: toDownload() });

    // 5. 報告書白卡上飄淡入
    gsap.fromTo(card, { autoAlpha: 0, y: 80 }, {
      autoAlpha: 1,
      y: 0,
      ease: 'power2.out',
      scrollTrigger: { trigger: download, start: 'top 75%', end: 'top 35%', scrub: 1 }
    });

    return function () {
      document.documentElement.classList.remove('is-scene');
      setCounts(true);
    };
  }

  /* ---------- 依畫面選擇模式，視窗大小改變時重新判斷 ---------- */
  // story：固定畫面（≥576px，畫面不夠高時永續經營整塊等比縮小）
  // flow：內容照常捲動（≤575px）
  // null：不做動畫（減少動態；或 <992px 且畫面高度 < 600px，例如手機橫放）
  function pickMode() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    if (window.innerHeight < 600 && !window.matchMedia('(min-width: 992px)').matches) return null;
    return window.matchMedia('(max-width: 575.98px)').matches ? 'flow' : 'story';
  }

  let mode;
  let ctx = null;
  let cleanup = null;

  function applyMode() {
    const next = pickMode();
    if (next === mode) return;

    if (ctx) ctx.revert();
    if (cleanup) cleanup();
    ctx = null;
    cleanup = null;

    mode = next;
    if (mode) {
      ctx = gsap.context(function () {
        cleanup = mode === 'story' ? setupStory() : setupFlow();
      });
    }
    ScrollTrigger.refresh();
  }

  applyMode();

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyMode, 200);
  });
})();

/* ========== 互動專區輪播（Swiper） ========== */
(function () {
  const el = document.querySelector('.inter-swiper');
  if (!el || typeof Swiper === 'undefined') return;

  new Swiper(el, {
    loop: true, // 至少需 5 張（一次顯示 3.5 張 → 4 + 每次移動 1 張）
    // 預設為 575px 含以下
    slidesPerView: 1.8,
    spaceBetween: 24,
    // Swiper 的 breakpoints 為 min-width
    breakpoints: {
      // 576px ~ 767px
      576: {
        slidesPerView: 2.3,
        spaceBetween: 24
      },
      // 768px ~ 1399px
      768: {
        slidesPerView: 2.8,
        spaceBetween: 32
      },
      // 1400px 以上
      1400: {
        slidesPerView: 3.5,
        spaceBetween: 32
      }
    },
    navigation: {
      prevEl: document.querySelector('.inter-prev'),
      nextEl: document.querySelector('.inter-next')
    }
  });
})();

/* ========== 最新消息分類：橫向可拖曳（1199px 以下由 CSS 變成橫向） ========== */
(function () {
  const wrap = document.querySelector('.news-cate-wrap');
  if (!wrap) return;

  const list = wrap.querySelector('.news-cate');
  const prevBtn = wrap.querySelector('.news-cate-prev');
  const nextBtn = wrap.querySelector('.news-cate-next');

  // 選單超出可顯示範圍時，左右箭頭同時出現（直向排列時沒有超出，箭頭不會出現）
  function updateArrows() {
    wrap.classList.toggle('is-overflow', list.scrollWidth > list.clientWidth + 1);
  }

  window.addEventListener('resize', updateArrows);
  updateArrows();

  // 點箭頭捲動約半個可視寬度
  prevBtn.addEventListener('click', function () {
    list.scrollBy({ left: -list.clientWidth / 2, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', function () {
    list.scrollBy({ left: list.clientWidth / 2, behavior: 'smooth' });
  });

  // 滑鼠拖曳（手指滑動由瀏覽器原生處理）
  let startX = 0;
  let startScroll = 0;
  let isDown = false;
  let moved = false;

  list.addEventListener('mousedown', function (e) {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = list.scrollLeft;
  });

  window.addEventListener('mousemove', function (e) {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 5) {
      moved = true;
      list.classList.add('is-dragging');
    }
    list.scrollLeft = startScroll - dx;
  });

  window.addEventListener('mouseup', function () {
    isDown = false;
    list.classList.remove('is-dragging');
  });

  // 拖曳後放開不觸發連結
  list.addEventListener('click', function (e) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation(); // 也不觸發分類切換
      moved = false;
    }
  }, true);
})();

/* ========== 最新消息分類切換：點左側分類，顯示 data-cate 相同的列表 ========== */
(function () {
  const tabs = document.querySelectorAll('.news-cate a[data-cate]');
  const lists = document.querySelectorAll('.news-list[data-cate]');
  if (!tabs.length || !lists.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      const cate = tab.dataset.cate;

      tabs.forEach(function (t) {
        t.classList.toggle('active', t === tab);
      });

      lists.forEach(function (list) {
        list.hidden = list.dataset.cate !== cate;
      });
    });
  });
})();

/* ========== footer：手機版網站選單收合（可同時展開多個；767px 以上由 CSS 一律展開） ========== */
(function () {
  document.querySelectorAll('.footer-col-title').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const col = btn.closest('.footer-col');
      const isOpen = col.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  });
})();

/* ========== gotop：捲動超過 SHOW_AT 個視窗高、且往上捲時才出現（往下捲隱藏），點擊平滑捲回頂部（有 Lenis 用 Lenis，否則原生） ========== */
(function () {
  const btn = document.getElementById('gotop');
  if (!btn) return;

  const SHOW_AT = 2.5; // 捲動超過幾個視窗高才顯示（1 = 一整個畫面）

  const DELTA = 5; // 捲動超過幾 px 才判斷方向，避免微小晃動來回切換
  let lastY = window.scrollY;
  let ticking = false;

  // 往下捲隱藏、往上捲出現（仍需超過 SHOW_AT）
  function update() {
    ticking = false;
    const y = window.scrollY;

    if (y <= window.innerHeight * SHOW_AT) {
      btn.classList.remove('is-show');
    } else if (Math.abs(y - lastY) > DELTA) {
      btn.classList.toggle('is-show', y < lastY);
    }
    if (Math.abs(y - lastY) > DELTA) lastY = y;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  btn.addEventListener('click', function () {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.2 });
    } else {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  });
})();

/* ========== stake tab（利害關係人、新進人員）：tab 列可拖動（Swiper freeMode），點 tab 切換下方內容
   一頁可有多組，每組以 .stake-bar 的父層為範圍，箭頭、內容各自對應 ========== */
document.querySelectorAll('.stake-swiper').forEach(function (el) {
  if (typeof Swiper === 'undefined') return;

  const bar = el.closest('.stake-bar');
  const tabs = el.querySelectorAll('.stake-tab');
  const panels = bar.parentElement.querySelectorAll('.stake-panel');

  const swiper = new Swiper(el, {
    slidesPerView: 'auto',
    spaceBetween: 16,
    freeMode: true,
    slidesOffsetBefore: 8,
    slidesOffsetAfter: 8,
    watchOverflow: true, // tab 全部放得下時鎖住，箭頭自動隱藏
    navigation: {
      prevEl: bar.querySelector('.stake-prev'),
      nextEl: bar.querySelector('.stake-next')
    }
  });

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on);
      });
      panels.forEach(function (panel) {
        const on = panel.id === tab.getAttribute('aria-controls');
        panel.classList.toggle('is-active', on);
        panel.hidden = !on;
      });
      // 點到被切到一半的 tab 時，才捲動讓它完整露出
      const box = el.getBoundingClientRect();
      const r = tab.getBoundingClientRect();
      if (r.left < box.left || r.right > box.right) swiper.slideTo(i);
    });
  });
});

/* ========== 最新消息列表 分類 tab：tab 為連結，Swiper 可拖動；放不下時才出現箭頭
   進頁時若 active 的 tab 被切到，捲動讓它完整露出 ========== */
document.querySelectorAll('.news-tab-swiper').forEach(function (el) {
  if (typeof Swiper === 'undefined') return;

  const nav = el.closest('.news-tab-nav');

  const swiper = new Swiper(el, {
    slidesPerView: 'auto',
    spaceBetween: 24,
    freeMode: true,
    watchOverflow: true, // tab 全部放得下時鎖住，箭頭自動隱藏
    navigation: {
      prevEl: nav.querySelector('.news-tab-prev'),
      nextEl: nav.querySelector('.news-tab-next')
    },
    breakpoints: {
      768: { spaceBetween: 48 }
    }
  });

  const active = el.querySelector('.news-tab.is-active');
  if (!active) return;
  const box = el.getBoundingClientRect();
  const r = active.getBoundingClientRect();
  if (r.left < box.left || r.right > box.right) {
    swiper.slideTo(Array.prototype.indexOf.call(swiper.slides, active), 0);
  }
});

/* ========== 活動花絮內頁 相片集：瀑布牆（Masonry），圖片載入後重排；點擊開燈箱（Fancybox）
   欄寬、欄距由 CSS 的 .album-gallery-sizer / .album-gallery-gutter 決定（隨斷點改變） ========== */
document.querySelectorAll('.album-gallery').forEach(function (el) {
  if (typeof Masonry === 'undefined') return;

  const msnry = new Masonry(el, {
    itemSelector: '.album-photo',
    columnWidth: '.album-gallery-sizer',
    gutter: '.album-gallery-gutter',
    percentPosition: true
  });

  if (typeof imagesLoaded !== 'undefined') {
    imagesLoaded(el).on('progress', function () {
      msnry.layout();
    });
  }
});

if (typeof Fancybox !== 'undefined') {
  Fancybox.bind('[data-fancybox]');
}

/* ========== 利害關係人問卷：
   補充資訊最多勾 data-max 項，達上限時其餘停用；勾「G 其他」才可填說明
   三個優先議題下拉不可重複：已在其他下拉選取的編號停用 ========== */
(function () {
  // 「其他」選項（data-other 指向輸入框 id）：選中才可填且必填，取消時清空並停用；單選與複選皆適用
  document.querySelectorAll('input[data-other]').forEach(function (box) {
    const input = document.getElementById(box.dataset.other);
    if (!input) return;
    const group = box.type === 'radio'
      ? document.querySelectorAll('input[type="radio"][name="' + box.name + '"]')
      : [box];
    group.forEach(function (r) {
      r.addEventListener('change', function () {
        input.disabled = !box.checked;
        // 必填的複選題（data-require-one）勾了其他就要填說明；選填題不強制
        input.required = box.checked && box.closest('[data-require-one]') !== null;
        if (!box.checked) input.value = '';
      });
    });
  });

  // 複選至少勾一項（data-require-one）：未勾時以第一個勾選框提示
  document.querySelectorAll('[data-require-one]').forEach(function (wrap) {
    const boxes = wrap.querySelectorAll('input[type="checkbox"]');
    function check() {
      const any = Array.prototype.some.call(boxes, function (b) { return b.checked; });
      boxes[0].setCustomValidity(any ? '' : '請至少勾選一項');
    }
    boxes.forEach(function (b) { b.addEventListener('change', check); });
    check();
  });

  const info = document.querySelector('.survey-info');
  if (info) {
    const boxes = info.querySelectorAll('input[type="checkbox"]');
    const max = Number(info.dataset.max) || boxes.length;
    const other = info.querySelector('.survey-info-other');
    const otherInput = document.querySelector('input[name="info_need_other"]');

    info.addEventListener('change', function () {
      const checked = info.querySelectorAll('input[type="checkbox"]:checked').length;
      boxes.forEach(function (box) {
        box.disabled = !box.checked && checked >= max;
      });
      if (other && otherInput) {
        otherInput.disabled = !other.checked;
        if (!other.checked) otherInput.value = '';
      }
    });
  }

  const selects = document.querySelectorAll('.survey-priority-select');
  if (!selects.length) return;

  function sync() {
    const used = Array.from(selects, function (s) { return s.value; });
    selects.forEach(function (s, i) {
      Array.from(s.options).forEach(function (opt) {
        opt.disabled = opt.value !== '' && used.some(function (v, j) { return j !== i && v === opt.value; });
      });
    });
  }

  selects.forEach(function (s) {
    s.addEventListener('change', sync);
  });
})();

/* ========== 問答互動彈窗：開始頁 → 逐題作答 → 完成頁；答對標示後自動換題，答錯顯示正確答案與解說，按鈕後換題
   題目為 .quiz-item（data-answer 正確選項順序、data-explain 解說），題數、進度自動計算；關閉彈窗後重置 ========== */
(function () {
  const modal = document.getElementById('quizModal');
  if (!modal) return;

  const LETTERS = ['A', 'B', 'C', 'D'];
  const CORRECT_DELAY = 1000; // 答對後停留多久才換題
  const WRONG_DELAY = 450; // 答錯後等選項搖晃完再開視窗
  const FINISH_DELAY = 700; // 小船抵達目的港後停留多久才到完成頁

  const screens = modal.querySelectorAll('[data-quiz-screen]');
  const items = modal.querySelectorAll('.quiz-item');
  const total = items.length;
  const scoreEl = modal.querySelector('.quiz-score b');
  const nowEl = modal.querySelector('.quiz-no-now');
  const totalEl = modal.querySelector('.quiz-no-total');
  const ship = modal.querySelector('.quiz-route-ship');
  const done = modal.querySelector('.quiz-route-done');
  const wrong = modal.querySelector('.quiz-wrong');
  const ansEl = modal.querySelector('.quiz-ans-txt');
  const explainEl = modal.querySelector('.quiz-explain');
  const nextBtn = modal.querySelector('[data-quiz-next]');
  const ring = modal.querySelector('.quiz-ring-bar');

  let index = 0;
  let score = 0;
  let timers = [];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function show(name) {
    screens.forEach(function (screen) {
      screen.hidden = screen.dataset.quizScreen !== name;
    });
  }

  function moveShip(step) {
    const percent = step / total * 100 + '%';
    ship.style.left = percent;
    done.style.width = percent;
  }

  // 櫃門的字母換成圖示（字母由 CSS 隱藏），文字說明留給螢幕閱讀器
  function mark(btn, className, icon, text) {
    const label = document.createElement('i');
    label.className = 'quiz-opt-mark bi ' + icon;
    label.setAttribute('role', 'img');
    label.setAttribute('aria-label', text);
    btn.classList.add(className);
    btn.querySelector('.quiz-opt-door').appendChild(label);
  }

  function render() {
    items.forEach(function (item, i) {
      item.hidden = i !== index;
    });
    nowEl.textContent = pad(index + 1);
    moveShip(index);
    modal.scrollTop = 0; // 手機上選項可能在畫面下方，換題時回到頂端
  }

  function next() {
    index++;
    if (index < total) {
      render();
    } else {
      moveShip(total);
      later(finish, FINISH_DELAY);
    }
  }

  function finish() {
    const rate = Math.round(score / total * 100);

    modal.querySelector('[data-quiz-rate]').textContent = rate;
    modal.querySelector('[data-quiz-total]').textContent = total;
    modal.querySelector('[data-quiz-right]').textContent = score;
    modal.querySelector('[data-quiz-miss]').textContent = total - score;

    // 環狀圖先歸零再長到正確率
    ring.style.transition = 'none';
    ring.style.strokeDashoffset = 100;
    show('result');
    modal.scrollTop = 0;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ring.style.transition = '';
        ring.style.strokeDashoffset = 100 - rate;
      });
    });
  }

  function choose(item, btn) {
    const opts = Array.from(item.querySelectorAll('.quiz-opt'));
    const answer = Number(item.dataset.answer);
    const right = opts[answer];

    opts.forEach(function (opt) {
      opt.disabled = true;
      if (opt !== right && opt !== btn) opt.classList.add('is-dim');
    });
    mark(right, 'is-correct', 'bi-check-lg', '正確答案');

    if (btn === right) {
      score++;
      scoreEl.textContent = score;
      later(next, CORRECT_DELAY);
      return;
    }

    mark(btn, 'is-wrong', 'bi-x-lg', '你的答案');
    ansEl.textContent = LETTERS[answer] + '. ' + right.querySelector('.quiz-opt-txt').textContent;
    explainEl.textContent = item.dataset.explain || '';
    explainEl.hidden = !item.dataset.explain;
    nextBtn.querySelectorAll('.btn-base-txt span').forEach(function (span) {
      span.textContent = index === total - 1 ? '查看結果' : '下一題';
    });
    later(function () {
      wrong.classList.add('is-show');
    }, WRONG_DELAY);
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    index = 0;
    score = 0;
    scoreEl.textContent = 0;
    wrong.classList.remove('is-show');
    items.forEach(function (item) {
      item.querySelectorAll('.quiz-opt').forEach(function (opt) {
        opt.disabled = false;
        opt.classList.remove('is-correct', 'is-wrong', 'is-dim');
      });
      item.querySelectorAll('.quiz-opt-mark').forEach(function (label) {
        label.remove();
      });
    });
    render();
  }

  items.forEach(function (item) {
    item.querySelectorAll('.quiz-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        choose(item, opt);
      });
    });
  });

  modal.querySelector('[data-quiz-start]').addEventListener('click', function () {
    show('question');
  });

  nextBtn.addEventListener('click', function () {
    wrong.classList.remove('is-show');
    next();
  });

  modal.querySelector('[data-quiz-restart]').addEventListener('click', function () {
    reset();
    show('question');
  });

  modal.addEventListener('hidden.bs.modal', function () {
    reset();
    show('start');
  });

  totalEl.textContent = '/ ' + pad(total);
})();

/* ========== 訂閱電子報彈窗：送出後關閉並清空欄位（信箱格式由瀏覽器 required / type="email" 檢查） ========== */
(function () {
  const modal = document.getElementById('newsletterModal');
  if (!modal || typeof bootstrap === 'undefined') return;

  const form = modal.querySelector('form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    bootstrap.Modal.getOrCreateInstance(modal).hide();
    form.reset();
  });
})();

/* ========== cookies 提示：按「我同意」後移除 ========== */
(function () {
  const wrap = document.querySelector('.cookies-wrap');
  if (!wrap) return;

  wrap.querySelector('.btn-base').addEventListener('click', function (e) {
    e.preventDefault();
    wrap.remove();
  });
})();

/* ========== 歷年董事酬勞：長條以同一指標三年最大值為 100%，捲到畫面時長出來 ========== */
(function () {
  const list = document.querySelector('.director-list');
  if (!list) return;

  ['is-profit', 'is-reward'].forEach(function (type) {
    const rows = list.querySelectorAll('.director-row.' + type);
    const values = Array.from(rows, function (row) {
      return Number(row.querySelector('.director-num').textContent.replace(/,/g, ''));
    });
    const max = Math.max.apply(null, values);
    rows.forEach(function (row, i) {
      row.querySelector('.director-bar span').style.setProperty('--pct', (values[i] / max * 100) + '%');
    });
  });

  // 沒有 ScrollTrigger 時直接顯示目標長度
  if (typeof ScrollTrigger === 'undefined') {
    list.classList.add('is-in');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({
    trigger: list,
    start: 'top 80%',
    once: true,
    onEnter: function () { list.classList.add('is-in'); }
  });
})();
