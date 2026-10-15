/* ==========================================================

  捲動動畫：最新消息 → 永續經營 → 報告書下載
  跟著捲動走（scrub），往回捲會倒轉

  只在桌機（≥992）且未開啟「減少動態」時啟用；
  啟用時在 <html> 加上 .is-story，CSS 依此切換成場景版型（見 style.css 檔尾）

  A. 最新消息：共用背景（.scene-backdrop）sticky 固定；最後一屏內容還在捲時，
     背景跟著捲動由藍漸變成綠（從區塊底部進入視窗、到捲出視窗頂端）
  B. .story pin 住（背後已是全綠），一條時間軸依序播放（單位 ≈ 一個視窗高的捲動距離）
     0.0 – 0.4  整顆地球在畫面中央出現
     0.4 – 1.4  地球下墜、放大到設計稿位置
     1.4 – 2.2  數據球從地球噴發，標題／虛線／箭頭一起淡入
     2.2 – 3.2  停留，輪播自動播放
     3.2 – 4.7  數據淡出 → 地球沉海淡出、綠 → 海浪
     4.7 – 5.5  白卡浮現

========================================================== */
// 等 DOMContentLoaded：main.js 的輪播在那時才建立 window.dataCarousel，這裡要能先停用它
document.addEventListener('DOMContentLoaded', function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  var story = document.getElementById('story');
  if (!story) return;

  var frame = story.querySelector('.data-frame');
  var earth = story.querySelector('.data-earth');
  var orbsWrap = story.querySelector('.data-orbs');
  var newsSection = document.querySelector('.news-section');
  var newsGreen = document.querySelector('.scene-green'); // 共用固定背景裡的綠色層
  var sea = story.querySelector('.download-bg');
  var card = story.querySelector('.download-card');
  var dataExtras = story.querySelectorAll('.data-inner .section-title, .data-orbit-line, .data-slide-nav');
  var values = story.querySelectorAll('.data-value');
  if (!frame || !earth || !orbsWrap || !sea || !card || !newsSection || !newsGreen) return;

  var TOTAL = 5.5;      // 時間軸總長（視窗高的倍數）
  var BURST_END = 2.2;  // 噴發完成
  var HOLD_END = 3.2;   // 停留結束、開始沉海

  // 地球在設計畫框（1920×881）中的位置：left 484、top 460、963×963
  var EARTH_CX = 484 + 963 / 2;
  var EARTH_CY = 460 + 963 / 2;
  var EARTH_SIZE = 963;

  var scale = 1;

  /* ---------- 數字跳動（不跟捲動，到位後自己跑） ---------- */

  var countTweens = [];

  function format(el, v) {
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    return v.toFixed(d);
  }

  function setCounts(toFinal) {
    countTweens.forEach(function (t) { t.kill(); });
    countTweens = [];
    values.forEach(function (el) {
      if (el.hasAttribute('data-static')) {
        el.textContent = el.getAttribute('data-static');
        return;
      }
      var target = parseFloat(el.getAttribute('data-target') || '0');
      el.textContent = format(el, toFinal ? target : 0);
    });
  }

  function countUp() {
    setCounts(false);
    values.forEach(function (el) {
      if (el.hasAttribute('data-static')) return;
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var o = { v: 0 };
      countTweens.push(gsap.to(o, {
        v: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function () { el.textContent = format(el, o.v); }
      }));
    });
  }

  function carousel(on) {
    if (!window.dataCarousel) return;
    if (on) window.dataCarousel.enable();
    else window.dataCarousel.disable();
  }

  /* ---------- 畫框縮放：寬度留 40px 邊，高度要放得下 881 ---------- */

  function updateScale() {
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    scale = Math.min(1, (vw - 80) / 1538, vh / 881);
    frame.style.setProperty('--story-scale', scale);
  }

  // 「整顆地球在畫面正中央、直徑約視窗高 70%」換算成畫框座標的位移與縮放
  function earthStart() {
    var vh = window.innerHeight;
    var cy = 881 - vh / (2 * scale);          // 視窗中心在畫框內的 y
    return {
      x: 960 - EARTH_CX,
      y: cy - EARTH_CY,
      scale: (0.7 * vh / scale) / EARTH_SIZE
    };
  }

  /* ---------- 建立場景 ---------- */

  var mm = gsap.matchMedia();

  mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', function () {
    document.documentElement.classList.add('is-story');
    updateScale();
    ScrollTrigger.addEventListener('refreshInit', updateScale);

    setCounts(false);
    carousel(false);

    // A. 最新消息背景：藍 → 綠（結束點剛好是場景 pin 的起點，接上時已是全綠）
    gsap.fromTo(newsGreen, { autoAlpha: 0 }, {
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: newsSection,
        start: 'bottom bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

    var zone = 'before'; // before / on（停留中）/ after

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: story,
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * TOTAL); },
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      },
      onUpdate: function () {
        var t = tl.time();
        var next = t < BURST_END ? 'before' : (t < HOLD_END ? 'on' : 'after');
        if (next === zone) return;

        if (next === 'on') {
          if (zone === 'before') countUp();
          carousel(true);
        } else if (next === 'before') {
          setCounts(false);
          carousel(false);
        } else { // after
          if (zone === 'before') setCounts(true); // 快速捲過時直接顯示正確數字
          carousel(false);
        }
        zone = next;
      }
    });

    // 1. 整顆地球在畫面中央出現
    tl.fromTo(earth,
      {
        autoAlpha: 0,
        x: function () { return earthStart().x; },
        y: function () { return earthStart().y; },
        scale: function () { return earthStart().scale; }
      },
      { autoAlpha: 1, duration: .4 }, 0);

    // 2. 下墜到設計稿位置
    tl.to(earth, { x: 0, y: 0, scale: 1, duration: 1, ease: 'power1.inOut' }, .4);

    // 3. 數據球從地球噴發（只動外層，輪播的 .data-orb 不受影響）
    tl.fromTo(orbsWrap,
      { autoAlpha: 0, scale: .2, transformOrigin: '774.5px 340px' },
      { autoAlpha: 1, scale: 1, duration: .8, ease: 'power2.out' }, 1.4);
    tl.fromTo(dataExtras, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6 }, 1.6);

    // 4. 停留（空白一段）
    tl.to({}, { duration: 1 }, BURST_END);

    // 5. 數據淡出 → 地球沉海、綠 → 海浪
    tl.to([orbsWrap].concat(Array.prototype.slice.call(dataExtras)),
      { autoAlpha: 0, duration: .4 }, HOLD_END);
    tl.to(earth, {
      y: function () { return window.innerHeight / scale; },
      autoAlpha: 0,
      duration: 1.3,
      ease: 'power1.in'
    }, HOLD_END + .2);
    tl.fromTo(sea, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1 }, HOLD_END + .2);

    // 6. 白卡由下往上浮現
    tl.fromTo(card, { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power2.out' }, 4.7);

    // 離開桌機斷點：gsap 會自動還原上面所有動畫，這裡還原其他狀態
    return function () {
      ScrollTrigger.removeEventListener('refreshInit', updateScale);
      document.documentElement.classList.remove('is-story');
      frame.style.removeProperty('--story-scale');
      setCounts(true);
      carousel(true);
    };
  });

  // 背景是 CSS 圖片／大圖，載完後重新量一次位置
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
});
