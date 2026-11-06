/* ==========================================================
==chart：ECharts 圖表（需先載入 js/vendor/echarts.min.js、main.js）
========================================================== */

/* ========== 共用：顏色、數字格式、初始化、捲動到畫面才播放 ========== */
const chartKit = (function () {
  // 顏色取自 base.css 的變數，與專案一致
  const css = getComputedStyle(document.documentElement);
  const color = function (name) { return css.getPropertyValue(name).trim(); };

  const colors = {
    theme: color('--theme'),
    orange: color('--orange'),
    gray: color('--txt-gray'),
    black: color('--black'),
    white: color('--white')
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charts = [];

  // 千分位
  function fmt(n) {
    return n.toLocaleString('en-US');
  }

  // tooltip 前方的色點
  function dot(c) {
    return '<span style="display:inline-block;width:10px;height:10px;margin-right:8px;border-radius:50%;background:' + c + ';"></span>';
  }

  // 建立圖表並統一處理 resize
  function init(el) {
    const chart = echarts.init(el);
    charts.push(chart);
    return chart;
  }

  // 捲動到畫面時才執行一次（沒有 ScrollTrigger 時直接執行）
  function onView(el, fn) {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: fn });
    } else {
      fn();
    }
  }

  // 共用的基本設定，各圖表再覆寫
  const base = {
    animation: !reduce,
    animationDuration: 1200,
    textStyle: { fontFamily: "'Noto Sans TC', sans-serif", fontSize: 18 }
  };

  window.addEventListener('resize', function () {
    charts.forEach(function (chart) { chart.resize(); });
  });

  return { colors: colors, reduce: reduce, fmt: fmt, dot: dot, init: init, onView: onView, base: base };
})();

/* ========== 營運績效圖：長條圖用 ECharts、圓環用 CSS conic-gradient ========== */
(function () {
  const wrap = document.querySelector('.perf-chart');
  if (!wrap || typeof echarts === 'undefined') return;

  const c = chartKit.colors;
  const fmt = chartKit.fmt;
  const rings = wrap.querySelectorAll('.perf-ring');

  const years = ['2024', '2025'];
  const revenue = [1654400, 2367772];
  const profit = [582807, 678521];

  // 疊加長條：下段 theme＝營收－稅後淨利，上段 orange＝稅後淨利（與圓環同色），頂端再疊一個 0 高度的長條顯示營收總額
  const option = Object.assign({}, chartKit.base, {
    grid: { left: 48, right: 24, top: 16, bottom: 48 },
    // 滑鼠移到年份上顯示營業收入與稅後淨利；confine 讓提示框不超出圖表，避免頁面出現橫向卷軸
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 0, 0, .04)' } },
      textStyle: { color: c.black, fontSize: 16 },
      formatter: function (params) {
        const i = params[0].dataIndex;
        return '<b>' + years[i] + '</b><br>' +
          chartKit.dot(c.theme) + '營業收入：' + fmt(revenue[i]) + '<br>' +
          chartKit.dot(c.orange) + '稅後淨利：' + fmt(profit[i]);
      }
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: c.theme, width: 1 } },
      axisTick: { show: false },
      axisLabel: {
        margin: 16,
        fontSize: 18,
        fontFamily: 'Jost',
        fontWeight: 700,
        color: c.theme
      }
    },
    yAxis: {
      type: 'value',
      max: 3000000,
      interval: 600000,
      name: '營\n業\n收\n入',
      nameLocation: 'middle',
      nameRotate: 0,
      nameGap: 28,
      nameTextStyle: { fontSize: 18, lineHeight: 28, color: c.theme },
      axisLine: { show: true, lineStyle: { color: c.theme, width: 1 } },
      axisLabel: { show: false },
      splitLine: { lineStyle: { type: 'dotted', color: c.gray, opacity: .5 } }
    },
    series: [
      {
        type: 'bar',
        stack: 'total',
        barWidth: 64,
        itemStyle: { color: c.theme },
        data: revenue.map(function (v, i) { return v - profit[i]; })
      },
      {
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          position: 'insideBottom',
          distance: 16,
          color: c.black,
          fontSize: 18,
          formatter: function (p) { return fmt(p.value); }
        },
        itemStyle: { color: c.orange },
        data: profit
      },
      {
        type: 'bar',
        stack: 'total',
        silent: true,
        label: {
          show: true,
          position: 'top',
          distance: 16,
          color: c.black,
          fontSize: 18,
          formatter: function (p) { return fmt(revenue[p.dataIndex]); }
        },
        data: [0, 0]
      }
    ]
  });

  const chart = chartKit.init(wrap.querySelector('.perf-bar'));

  chartKit.onView(wrap, function () {
    chart.setOption(option);
    rings.forEach(function (ring) {
      const pct = parseFloat(ring.dataset.pct);
      if (chartKit.reduce || typeof gsap === 'undefined') {
        ring.style.setProperty('--p', pct);
      } else {
        gsap.fromTo(ring, { '--p': 0 }, { '--p': pct, duration: 1.2, ease: 'power2.out' });
      }
    });
  });
})();

/* ========== 年度採購分析：三張圓餅圖（governance_4） ==========
   圖 1 theme + 淺藍、圖 2 orange + 淺橘；圖 3 用柔和色（藍、紫取自同頁 .purchase 的色環色），
   4 色順序已用 dataviz 驗證器檢查相鄰色（含首尾相接）一般與色弱皆可分辨；
   淺色扇形對背景對比不足 3:1，所以每塊都直接標上名稱與百分比 */
(function () {
  const pies = document.querySelectorAll('.buy-pie');
  if (!pies.length || typeof echarts === 'undefined') return;

  const c = chartKit.colors;
  const css = getComputedStyle(document.documentElement);
  const color = function (name) { return css.getPropertyValue(name).trim(); };
  const surface = color('--white'); // 圖表放在白底卡片上，扇形縫用白色

  // inside: true 的扇形把標籤放在扇形內（大塊的中性灰），其餘拉線標在外面
  const data = {
    port: [
      { name: '運輸交貨', value: 20, color: c.theme },
      { name: '就港供應', value: 80, color: color('--light-blue'), inside: true }
    ],
    local: [
      { name: '本地', value: 2, color: c.orange },
      { name: '非本地', value: 98, color: color('--light-orange'), inside: true }
    ],
    items: [
      { name: '物料', value: 29, color: '#6999C1' },
      { name: '備品', value: 31, color: color('--soft-orange') },
      { name: '油品', value: 30, color: '#7676AA' },
      { name: '塢修', value: 10, color: color('--green') }
    ]
  };

  const label = function (p) { return p.name + p.value + '%'; };
  // 圖上標籤改兩行（名稱／百分比），寬度約減半，圓可以畫大一點
  const label2 = function (p) { return p.name + '\n' + p.value + '%'; };

  // 半徑：左右各預留 110px 給外側標籤（兩行後最寬「運輸交貨」約 76px + 引線 20 + 間距），上下各留 60px
  function pieRadius(el) {
    return Math.max(80, Math.min(el.clientWidth / 2 - 110, el.clientHeight / 2 - 60));
  }

  pies.forEach(function (el) {
    const rows = data[el.dataset.pie];
    if (!rows) return;

    const option = Object.assign({}, chartKit.base, {
      tooltip: {
        trigger: 'item',
        confine: true,
        textStyle: { color: c.black, fontSize: 16 },
        formatter: function (p) { return chartKit.dot(p.color) + label(p); }
      },
      series: [{
        type: 'pie',
        radius: 100, // 實際值由 pieRadius 依容器寬高計算
        center: ['50%', '50%'],
        startAngle: 90,
        // 扇形之間 2px 背景色縫
        itemStyle: { borderColor: surface, borderWidth: 2 },
        // 外側標籤緊跟在短引線後（8 + 12），配合 pieRadius 預留的標籤寬度，文字不會被切掉也不會變「…」
        label: { color: c.black, fontSize: 18, lineHeight: 24, formatter: label2, overflow: 'none' },
        labelLine: { length: 8, length2: 12, lineStyle: { color: c.theme, width: .5 } },
        emphasis: { scaleSize: 6 },
        data: rows.map(function (r) {
          const item = { name: r.name, value: r.value, itemStyle: { color: r.color } };
          if (r.inside) item.label = { position: 'inside' };
          return item;
        })
      }]
    });

    const chart = chartKit.init(el);
    let drawn = false;
    chartKit.onView(el, function () {
      drawn = true;
      option.series[0].radius = pieRadius(el);
      chart.setOption(option);
    });

    // 寬度改變時重算半徑（chartKit 只負責 chart.resize）
    window.addEventListener('resize', function () {
      if (drawn) chart.setOption({ series: [{ radius: pieRadius(el) }] });
    });
  });
})();

/* ========== 年度採購分析：2024 / 2025 各品項採購比例長條圖（governance_4） ==========
   規則沿用營運績效長條圖：theme / orange、theme 色座標軸、點狀格線、axis tooltip、直角長條 */
(function () {
  const el = document.querySelector('.buy-bar');
  if (!el || typeof echarts === 'undefined') return;

  const c = chartKit.colors;
  const items = ['油品', '備品', '物料', '塢修'];
  const series = [
    { name: '2024', color: c.theme, data: [33, 23, 39, 5] },
    { name: '2025', color: c.orange, data: [30, 31, 29, 10] }
  ];

  const option = Object.assign({}, chartKit.base, {
    grid: { left: 64, right: 24, top: 72, bottom: 48 },
    // 兩個系列，圖例放右上
    legend: {
      top: 24,
      right: 24,
      itemWidth: 16,
      itemHeight: 16,
      itemGap: 24,
      icon: 'circle',
      textStyle: { fontSize: 18, fontFamily: 'Jost', fontWeight: 700, color: c.black }
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 0, 0, .04)' } },
      textStyle: { color: c.black, fontSize: 16 },
      formatter: function (params) {
        return '<b>' + params[0].name + '</b><br>' + params.map(function (p) {
          return chartKit.dot(p.color) + p.seriesName + '：' + p.value + '%';
        }).join('<br>');
      }
    },
    xAxis: {
      type: 'category',
      data: items,
      axisLine: { lineStyle: { color: c.theme, width: 1 } },
      axisTick: { show: false },
      axisLabel: { margin: 16, fontSize: 18, color: c.theme }
    },
    yAxis: {
      type: 'value',
      max: 50,
      interval: 10,
      axisLine: { show: true, lineStyle: { color: c.theme, width: 1 } },
      axisLabel: { fontSize: 16, color: c.gray, formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dotted', color: c.gray, opacity: .5 } }
    },
    series: series.map(function (s) {
      return {
        type: 'bar',
        name: s.name,
        // 不固定寬度：依每個品項分到的寬度自動縮放，最寬 40，手機才不會擠到隔壁品項
        barMaxWidth: 40,
        barGap: '30%',
        itemStyle: { color: s.color },
        label: {
          show: true,
          position: 'top',
          distance: 8,
          color: c.black,
          fontSize: 16,
          formatter: '{c}%'
        },
        data: s.data
      };
    })
  });

  // 窄容器（手機）：字級縮小、左右留白縮小，繪圖區才夠寬
  function fit() {
    const narrow = el.clientWidth < 576;
    const label = { fontSize: narrow ? 12 : 16, distance: narrow ? 4 : 8 };
    return {
      grid: { left: narrow ? 40 : 64, right: narrow ? 8 : 24 },
      // 手機圖例置中，避免靠右時被裁切
      legend: narrow
        ? { left: 'center', right: 'auto', itemGap: 16, textStyle: { fontSize: 14 } }
        : { left: 'auto', right: 24, itemGap: 24, textStyle: { fontSize: 18 } },
      xAxis: { axisLabel: { fontSize: narrow ? 14 : 18, margin: narrow ? 8 : 16 } },
      yAxis: { axisLabel: { fontSize: narrow ? 12 : 16 } },
      series: series.map(function () { return { barGap: narrow ? '15%' : '30%', label: label }; })
    };
  }

  const chart = chartKit.init(el);
  let drawn = false;
  chartKit.onView(el, function () {
    drawn = true;
    chart.setOption(option);
    chart.setOption(fit());
  });

  window.addEventListener('resize', function () {
    if (drawn) chart.setOption(fit());
  });
})();

/* ========== 員工滿意度調查：各項平均分數橫條圖（social_2） ==========
   規則沿用採購比例長條圖：theme 色座標軸、點狀格線、axis tooltip、直角長條；
   高於整體平均 theme、低於整體平均 orange（兩色已用 dataviz 驗證器檢查），灰色底軌表示滿分 5，虛線為整體平均 */
(function () {
  const el = document.querySelector('.survey-bar');
  if (!el || typeof echarts === 'undefined') return;

  const c = chartKit.colors;
  const css = getComputedStyle(document.documentElement);
  const track = css.getPropertyValue('--gray').trim();

  const avg = 3.76;
  // 由高到低，y 軸 inverse 讓第一項在最上面
  const items = [
    ['LINE 群組溝通', 3.96],
    ['辦公室安全', 3.92],
    ['辦公室環境', 3.90],
    ['官方溝通', 3.88],
    ['公司活動', 3.88],
    ['硬體效能', 3.86],
    ['行政資源', 3.86],
    ['永續措施', 3.73],
    ['茶點/零食飲品', 3.57],
    ['行政流程', 3.39],
    ['會議空間', 2.84]
  ];
  const names = items.map(function (r) { return r[0]; });
  const fix2 = function (v) { return v.toFixed(2); };

  // 高於、低於平均拆成兩個系列（不屬於該系列的項目填 '-'），同一個 stack 讓兩者落在同一位置，tooltip 才能顯示所屬分組
  const groups = [
    { name: '高於整體平均', color: c.theme, test: function (v) { return v >= avg; } },
    { name: '低於整體平均', color: c.orange, test: function (v) { return v < avg; } }
  ];

  const option = Object.assign({}, chartKit.base, {
    // 上方只留平均線標籤的空間
    grid: { left: 24, right: 64, top: 56, bottom: 48, containLabel: true },
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 0, 0, .04)' } },
      textStyle: { color: c.black, fontSize: 16 },
      formatter: function (params) {
        const p = params.filter(function (x) { return x.value !== '-'; })[0];
        return '<b>' + p.name + '</b><br>' + chartKit.dot(p.color) + p.seriesName + '：' + fix2(p.value);
      }
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 5,
      interval: 1,
      axisLine: { show: true, lineStyle: { color: c.theme, width: 1 } },
      axisLabel: { margin: 16, fontSize: 16, fontFamily: 'Jost', color: c.gray },
      splitLine: { lineStyle: { type: 'dotted', color: c.gray, opacity: .5 } }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
      axisLine: { lineStyle: { color: c.theme, width: 1 } },
      axisTick: { show: false },
      axisLabel: { margin: 16, fontSize: 16, color: c.theme }
    },
    series: groups.map(function (g, i) {
      const s = {
        type: 'bar',
        name: g.name,
        stack: 'score',
        barWidth: 16,
        itemStyle: { color: g.color },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          color: c.black,
          fontSize: 16,
          fontFamily: 'Jost',
          formatter: function (p) { return fix2(p.value); }
        },
        data: items.map(function (r) { return g.test(r[1]) ? r[1] : '-'; })
      };
      // 底軌與平均線只掛在第一個系列，避免重複繪製
      if (i === 0) {
        s.showBackground = true;
        s.backgroundStyle = { color: track };
        s.markLine = {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: c.theme, width: 1 },
          label: { position: 'start', distance: 8, fontSize: 16, color: c.theme, formatter: '整體平均：' + fix2(avg) },
          data: [{ xAxis: avg }] // y 軸 inverse，start 端在上方
        };
      }
      return s;
    })
  });

  // 窄容器（手機）字級縮為 14、左右留白縮小，繪圖區才夠寬
  function fit() {
    const narrow = el.clientWidth < 576;
    const f = narrow ? 14 : 16;
    const label = { fontSize: f };
    return {
      grid: { left: narrow ? 8 : 24, right: narrow ? 48 : 64 },
      xAxis: { axisLabel: { fontSize: f } },
      yAxis: { axisLabel: { fontSize: f, margin: narrow ? 8 : 16 } },
      series: [{ label: label, markLine: { label: label } }, { label: label }]
    };
  }

  const chart = chartKit.init(el);
  let drawn = false;
  chartKit.onView(el, function () {
    drawn = true;
    chart.setOption(option);
    chart.setOption(fit());
  });

  window.addEventListener('resize', function () {
    if (drawn) chart.setOption(fit());
  });
})();

/* ========== 用水量：取水量、排水量、耗水量分組長條圖（environment_3，船隻 data-water="fleet"、辦公大樓 data-water="office"） ==========
   規則沿用採購比例長條圖：theme 色座標軸、點狀格線、axis tooltip、直角長條；
   取水 theme、排水 orange、耗水 green（三色已用 dataviz 驗證器檢查：色弱可分辨；green 對白底不足 3:1，故每根都標數值）
   數值保留原始小數位數，以字串顯示；長條較窄，標籤轉 90 度放在長條上方 */
(function () {
  if (typeof echarts === 'undefined') return;

  const c = chartKit.colors;
  const green = getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
  const years = ['2023年', '2024年', '2025年'];
  // 依序：取水量、排水量、耗水量；max、step 為 y 軸上限與刻度間距（上限需留直式標籤的高度）
  const sets = {
    fleet: { max: 0.04, step: 0.01, data: [['0.020472', '0.02487', '0.02160'], ['0.000452', '0.00201', '0.00230'], ['0.02002', '0.02286', '0.01930']] },
    office: { max: 0.08, step: 0.02, data: [['0.0423', '0.045', '0.050'], ['0.042', '0.045', '0.050'], ['0', '0', '0']] }
  };

  document.querySelectorAll('.water-bar').forEach(function (el) {
    const set = sets[el.dataset.water];
    if (!set) return;
    const series = [
      { name: '取水量', color: c.theme, data: set.data[0] },
      { name: '排水量', color: c.orange, data: set.data[1] },
      { name: '耗水量', color: green, data: set.data[2] }
    ];

    // containLabel 已把年份標籤算進繪圖範圍，下方只留 8，讓註解貼近圖表；圖例貼齊頂端，上方不留白
    const option = Object.assign({}, chartKit.base, {
      grid: { left: 24, right: 24, top: 64, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        right: 24,
        itemWidth: 16,
        itemHeight: 16,
        itemGap: 24,
        icon: 'circle',
        textStyle: { fontSize: 16, color: c.black }
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 0, 0, .04)' } },
        textStyle: { color: c.black, fontSize: 16 },
        formatter: function (params) {
          const i = params[0].dataIndex;
          return '<b>' + years[i] + '</b>（百萬公升）<br>' + series.map(function (s) {
            return chartKit.dot(s.color) + s.name + '：' + s.data[i];
          }).join('<br>');
        }
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: c.theme, width: 1 } },
        axisTick: { show: false },
        axisLabel: { margin: 16, fontSize: 18, color: c.theme }
      },
      yAxis: {
        type: 'value',
        name: '百萬公升',
        nameGap: 24,
        nameTextStyle: { fontSize: 16, color: c.gray, align: 'left' },
        max: set.max,
        interval: set.step,
        axisLine: { show: true, lineStyle: { color: c.theme, width: 1 } },
        axisLabel: { fontSize: 16, color: c.gray },
        splitLine: { lineStyle: { type: 'dotted', color: c.gray, opacity: .5 } }
      },
      series: series.map(function (s) {
        return {
          type: 'bar',
          name: s.name,
          // 不固定寬度：依每年分到的寬度自動縮放，最寬 40，手機才不會擠到隔壁年份
          barMaxWidth: 40,
          barGap: '30%',
          itemStyle: { color: s.color },
          label: {
            show: true,
            position: 'top',
            rotate: 90,
            align: 'left',
            verticalAlign: 'middle',
            distance: 8,
            color: c.black,
            fontSize: 16,
            fontFamily: 'Jost',
            formatter: function (p) { return s.data[p.dataIndex]; }
          },
          data: s.data.map(Number)
        };
      })
    });

    // 窄容器（手機）：字級縮小、左右留白縮小、圖例改置中，繪圖區才夠寬
    function fit() {
      const narrow = el.clientWidth < 576;
      const label = { fontSize: narrow ? 12 : 16, distance: narrow ? 4 : 8 };
      return {
        grid: { left: narrow ? 8 : 24, right: narrow ? 8 : 24 },
        legend: narrow
          ? { left: 'center', right: 'auto', itemGap: 12, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 14 } }
          : { left: 'auto', right: 24, itemGap: 24, itemWidth: 16, itemHeight: 16, textStyle: { fontSize: 16 } },
        xAxis: { axisLabel: { fontSize: narrow ? 14 : 18, margin: narrow ? 8 : 16 } },
        yAxis: { axisLabel: { fontSize: narrow ? 12 : 16 }, nameTextStyle: { fontSize: narrow ? 12 : 16 } },
        series: series.map(function () { return { barGap: narrow ? '15%' : '30%', label: label }; })
      };
    }

    const chart = chartKit.init(el);
    let drawn = false;
    chartKit.onView(el, function () {
      drawn = true;
      chart.setOption(option);
      chart.setOption(fit());
    });

    window.addEventListener('resize', function () {
      if (drawn) chart.setOption(fit());
    });
  });
})();
