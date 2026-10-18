(function () {
  'use strict';
  const { libraries, templates } = window.APP_DATA;
  const libraryById = new Map(libraries.map(lib => [lib.id, lib]));

  /* 各图形库图标的主色（结果弹窗底色从中随机抽取）。 */
  const LIBRARY_COLORS = {
    'library-05': '#3a3833', /* 炭黑 */
    'library-01': '#e2487e', /* 玫红 */
    'library-02': '#413d97', /* 深蓝紫 */
    'library-04': '#f2683c', /* 橙红 */
    'library-03': '#8b45e8', /* 亮紫 */
    'library-06': '#f2ba3e'  /* 金黄 */
  };

  const randomItem = (arr, random) => arr[Math.floor(random() * arr.length)];

  function shuffle(items, random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function pickWeighted(items, random) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = random() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll < 0) return item;
    }
    return items[items.length - 1];
  }

  /* 纯生成函数：不依赖页面，也方便单独测试。 */
  function generateSentence(selectedIds, random = Math.random) {
    const ids = [...new Set(selectedIds)];
    if (!ids.length || ids.some(id => !libraryById.has(id))) {
      throw new Error('请至少选择一个有效的图形库。');
    }

    const candidates = templates.filter(template =>
      template.weight > 0 && template.parts.filter(part => part.pos).length >= ids.length
    );
    if (!candidates.length) throw new Error('当前选择没有可用的语法模板。');

    const template = pickWeighted(candidates, random);
    const slots = template.parts.filter(part => part.pos);

    /* 每个库先占一个位置；剩余位置允许重复；最后随机打乱。 */
    const sources = [...ids];
    while (sources.length < slots.length) sources.push(randomItem(ids, random));
    const allocated = shuffle(sources, random);

    let slotIndex = 0;
    let pendingPrefix = '';
    const tokens = [];
    for (const part of template.parts) {
      if (Object.prototype.hasOwnProperty.call(part, 'literal')) {
        pendingPrefix += part.literal;
        continue;
      }
      const libraryId = allocated[slotIndex++];
      const entry = libraryById.get(libraryId).words[part.pos];
      if (!entry) throw new Error(`图形库 ${libraryId} 缺少 ${part.pos} 词条。`);
      tokens.push({
        libraryId, pos: part.pos, text: entry.text, gif: entry.gif,
        prefix: pendingPrefix, after: entry.after || ''
      });
      pendingPrefix = '';
    }
    const sentence = tokens.map(t => t.prefix + t.text + t.after).join('') +
      pendingPrefix + (template.ending || '');
    return { templateId: template.id, tokens, sentence };
  }

  window.VisualSentence = { generateSentence };

  /* 测试页面仅调用生成函数，不需要渲染首页。 */
  const choosePage = document.getElementById('page-choose');
  const entryPage = document.getElementById('page-entry');
  if (!choosePage) return;

  const resultPage = document.getElementById('page-result');
  const loadingPage = document.getElementById('page-loading');
  const resultGrid = document.getElementById('result-grid');
  const resultModal = document.querySelector('.result-modal');
  const iconRow = document.getElementById('icon-row');
  const confirmButton = document.getElementById('confirm-button');
  const previewStage = document.getElementById('preview-stage');
  const emptyHint = document.getElementById('preview-empty');
  const selected = new Set();
  const chipById = new Map();
  const shapeById = new Map();

  /* 选中数量对应的预览构图槽位（占画布的百分比坐标）。 */
  const PREVIEW_LAYOUTS = {
    1: [[50, 45]],
    2: [[40, 40], [61, 51]],
    3: [[39, 39], [63, 43], [50, 60]],
    4: [[39, 36], [63, 41], [42, 58], [64, 63]],
    5: [[36, 34], [64, 36], [50, 47], [36, 60], [65, 63]],
    6: [[34, 32], [65, 34], [49, 44], [34, 56], [67, 58], [50, 68]]
  };

  function makePreviewShape(library) {
    const wrap = document.createElement('div');
    wrap.className = 'preview-shape';
    const img = document.createElement('img');
    img.src = library.icon;
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    /* 每个图形拥有随机的漂浮节奏与幅度。 */
    img.style.setProperty('--fd', (5.5 + Math.random() * 3.5).toFixed(2) + 's');
    img.style.setProperty('--fo', (-Math.random() * 6).toFixed(2) + 's');
    img.style.setProperty('--dx', (5 + Math.random() * 5).toFixed(1) + '%');
    img.style.setProperty('--dy', (4 + Math.random() * 5).toFixed(1) + '%');
    img.style.setProperty('--dr', (2 + Math.random() * 3).toFixed(1) + 'deg');
    wrap.append(img);
    return wrap;
  }

  function updatePreview() {
    const ids = [...selected];
    for (const [id, chip] of chipById) {
      const active = selected.has(id);
      chip.classList.toggle('is-selected', active);
      chip.setAttribute('aria-pressed', String(active));
    }
    emptyHint.hidden = ids.length > 0;
    confirmButton.hidden = ids.length === 0;

    const slots = PREVIEW_LAYOUTS[ids.length] || PREVIEW_LAYOUTS[6];
    for (const [id, el] of Array.from(shapeById)) {
      if (!selected.has(id)) {
        el.remove();
        shapeById.delete(id);
      }
    }
    ids.forEach((id, index) => {
      let wrap = shapeById.get(id);
      if (!wrap) {
        wrap = makePreviewShape(libraryById.get(id));
        wrap.style.width = (42 + (index % 3) * 5) + '%';
        shapeById.set(id, wrap);
      }
      wrap.style.left = slots[index][0] + '%';
      wrap.style.top = slots[index][1] + '%';
      if (!wrap.isConnected) previewStage.append(wrap);
      if (!wrap.classList.contains('is-in')) {
        requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('is-in')));
      }
    });
  }

  for (const library of libraries) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'icon-chip';
    chip.dataset.id = library.id;
    chip.setAttribute('aria-pressed', 'false');
    chip.setAttribute('aria-label', `选择${library.name}`);
    const img = document.createElement('img');
    img.src = library.icon;
    img.alt = '';
    img.draggable = false;
    chip.append(img);
    chip.addEventListener('click', () => {
      selected.has(library.id) ? selected.delete(library.id) : selected.add(library.id);
      updatePreview();
    });
    iconRow.append(chip);
    chipById.set(library.id, chip);
  }

  /* 预取全部动图：进入网页后就利用空闲时间静默下载，正式生成时几乎无需再等。
     请求串行 + 低优先级，不与首屏关键资源抢带宽；file:// 等场景失败时静默忽略。 */
  function prefetchAllMedia() {
    const urls = new Set();
    for (const lib of libraries) {
      for (const entry of Object.values(lib.words)) urls.add(entry.gif);
    }
    let chain = Promise.resolve();
    for (const url of urls) {
      chain = chain.then(() => fetch(url, { priority: 'low' }).catch(() => {}));
    }
  }
  const kickPrefetch = () => { try { prefetchAllMedia(); } catch (error) { /* 预取失败不影响交互 */ } };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(kickPrefetch, { timeout: 3000 });
  else setTimeout(kickPrefetch, 1200);

  function showPage(page) {
    if (entryPage) entryPage.hidden = page !== 'entry';
    choosePage.hidden = page !== 'choose';
    if (loadingPage) loadingPage.hidden = page !== 'loading';
    resultPage.hidden = page !== 'result';
    window.scrollTo(0, 0);
  }

  function renderResult(result) {
    /* 顶部 GIF 条：永远一排，等高无缝铺满卡片整行宽度（高度由 JS 按比例计算）。 */
    resultGrid.replaceChildren();
    result.tokens.forEach(token => {
      const img = document.createElement('img');
      img.src = token.gif;
      img.alt = `${token.text}的动态几何图形`;
      img.draggable = false;
      img.decoding = 'async';
      resultGrid.append(img);
    });

    /* 参与本次句子的图形库图标 + 中文句子。 */
    const iconsWrap = document.getElementById('result-icons');
    iconsWrap.replaceChildren();
    const usedIds = [...new Set(result.tokens.map(t => t.libraryId))];
    usedIds.forEach(id => {
      const img = document.createElement('img');
      img.src = libraryById.get(id).icon;
      img.alt = '';
      img.draggable = false;
      iconsWrap.append(img);
    });
    document.getElementById('result-sentence').textContent = result.sentence;
    /* 弹窗底色：从本次选中的图形库图标色中随机抽一个。 */
    resultModal.style.background = LIBRARY_COLORS[randomItem(usedIds, Math.random)] || '#a25fd6';
  }

  /* 过场页：深色圆盘上图形圆周分布旋转，同时预加载 GIF。 */
  let loadingTimer = 0;
  function startGenerating(ids) {
    if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = 0; }
    const orbit = document.getElementById('loading-orbit');
    orbit.replaceChildren();
    /* 图形均匀落在圆周上（1 个时居中），随盘公转，各自自转、呼吸、漂浮 */
    const radius = ids.length === 1 ? 0 : 30;
    const base = ids.length <= 2 ? 38 : ids.length <= 4 ? 34 : 30;
    ids.forEach((id, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'loading-shape';
      const angle = (index / ids.length) * Math.PI * 2 - Math.PI / 2;
      wrap.style.left = (50 + Math.cos(angle) * radius) + '%';
      wrap.style.top = (50 + Math.sin(angle) * radius) + '%';
      wrap.style.width = (base + (index % 2) * 4) + '%';
      wrap.style.setProperty('--bd', (2.1 + Math.random() * 1.3).toFixed(2) + 's');
      wrap.style.setProperty('--bo', (-Math.random() * 3).toFixed(2) + 's');
      const img = document.createElement('img');
      img.src = libraryById.get(id).icon;
      img.alt = '';
      img.draggable = false;
      img.decoding = 'async';
      img.style.setProperty('--sd', (2.6 + Math.random() * 1.6).toFixed(2) + 's');
      img.style.setProperty('--so', (-Math.random() * 4).toFixed(2) + 's');
      wrap.append(img);
      orbit.append(wrap);
    });
    showPage('loading');

    let result;
    try {
      result = generateSentence(ids);
    } catch (error) {
      window.alert(error.message);
      showPage('choose');
      return;
    }

    const startedAt = performance.now();
    const preload = Promise.all(result.tokens.map(token => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = token.gif;
    })));
    /* 兜底：个别 GIF 加载过慢时最多等 8 秒也进入结果页（img 会自行继续加载）。 */
    const timeout = new Promise(resolve => setTimeout(resolve, 8000));
    Promise.race([preload, timeout]).then(() => {
      /* 至少停留 1.9 秒，让“生成中…”的过场可被感知。 */
      const wait = Math.max(0, 1900 - (performance.now() - startedAt));
      loadingTimer = setTimeout(() => {
        loadingTimer = 0;
        renderResult(result);
        showPage('result');
      }, wait);
    });
  }

  confirmButton.addEventListener('click', () => {
    if (selected.size === 0) return;
    startGenerating([...selected]);
  });
  document.getElementById('restart-button').addEventListener('click', () => showPage('entry'));

  /* 保存并分享：把白色卡片区域按 DOM 布局绘制到 canvas，导出 PNG。 */
  document.getElementById('save-button').addEventListener('click', () => {
    try {
      downloadShareCard();
    } catch (error) {
      window.alert(error.name === 'SecurityError'
        ? '浏览器安全策略阻止了导出本地图片：请通过本地服务器打开页面（例如 VS Code 的 Live Server）后再试。'
        : `生成图片失败：${error.message}`);
    }
  });

  /* 结果页内置二维码：assets/qr.png 加载成功时替换“QR”灰色占位；文件不存在时保留占位。 */
  const qrBox = document.getElementById('qr-box');
  const qrImage = document.getElementById('qr-image');
  if (qrBox && qrImage) {
    const showQrImage = () => {
      [...qrBox.childNodes].forEach(node => { if (node.nodeType === Node.TEXT_NODE) node.remove(); });
      qrImage.hidden = false;
    };
    if (qrImage.complete && qrImage.naturalWidth > 0) showQrImage();
    else {
      qrImage.addEventListener('load', showQrImage);
      qrImage.addEventListener('error', () => { qrImage.hidden = true; });
    }
  }

  function downloadShareCard() {
    const card = document.getElementById('share-card');
    const sentenceEl = document.getElementById('result-sentence');
    const qrBox = document.getElementById('qr-box');
    const note = document.querySelector('.qr-note');
    const gifs = [...resultGrid.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth > 0);
    const icons = [...document.getElementById('result-icons').querySelectorAll('img')].filter(i => i.complete && i.naturalWidth > 0);
    if (!gifs.length) throw new Error('GIF 还没有加载完成，请稍后再试。');

    const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
    const width = card.clientWidth;
    const height = card.scrollHeight;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    /* 等高 GIF（含换行后的第二排），坐标直接取自 DOM 布局。 */
    gifs.forEach(img => ctx.drawImage(img, img.offsetLeft, img.offsetTop, img.clientWidth, img.clientHeight));
    icons.forEach(img => ctx.drawImage(img, img.offsetLeft, img.offsetTop, img.clientWidth, img.clientHeight));

    /* 句子文本：按渲染宽度逐字换行，保持与页面一致的观感。 */
    const style = getComputedStyle(sentenceEl);
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
    ctx.fillStyle = style.color;
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const lines = [];
    let line = '';
    for (const ch of sentenceEl.textContent || '') {
      if (line && ctx.measureText(line + ch).width > sentenceEl.clientWidth) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
    if (line) lines.push(line);
    const halfLeading = (lineHeight - fontSize) / 2;
    lines.forEach((text, i) => {
      ctx.fillText(text, sentenceEl.offsetLeft, sentenceEl.offsetTop + halfLeading + fontSize * 0.8 + i * lineHeight);
    });

    /* 二维码与提示文字：正式二维码（assets/qr.png）加载成功时直接绘制，否则退回灰色占位。 */
    const noteStyle = getComputedStyle(note);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = noteStyle.color;
    ctx.font = `${noteStyle.fontWeight} ${noteStyle.fontSize} ${noteStyle.fontFamily}`;
    ctx.fillText(note.textContent, qrBox.offsetLeft - 12, qrBox.offsetTop + qrBox.clientHeight - 8);
    if (qrImage && qrImage.complete && qrImage.naturalWidth > 0) {
      ctx.drawImage(qrImage, qrBox.offsetLeft, qrBox.offsetTop, qrBox.clientWidth, qrBox.clientHeight);
    } else {
      const qrStyle = getComputedStyle(qrBox);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = qrStyle.backgroundColor;
      ctx.fillRect(qrBox.offsetLeft, qrBox.offsetTop, qrBox.clientWidth, qrBox.clientHeight);
      ctx.fillStyle = qrStyle.color;
      ctx.font = `${qrStyle.fontWeight} ${qrStyle.fontSize} ${qrStyle.fontFamily}`;
      ctx.fillText('QR', qrBox.offsetLeft + qrBox.clientWidth / 2, qrBox.offsetTop + qrBox.clientHeight / 2);
    }

    canvas.toBlob(blob => {
      if (!blob) { window.alert('生成图片失败，请重试。'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '我的生成分身.png';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  }

  /* 入口页：背景图形的简易物理漂浮 + “开始生成”跳转。 */
  const entryStage = document.getElementById('entry-stage');
  const startButton = document.getElementById('start-button');
  if (entryPage && entryStage && startButton) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shapes = Array.from(entryStage.querySelectorAll('.entry-shape')).map((el) => {
      const cruise = 0.02 + Math.random() * 0.025; /* 每秒漂移画面宽度的 2%～4.5% */
      const direction = Math.random() * Math.PI * 2;
      const baseVx = Math.cos(direction) * cruise;
      const baseVy = Math.sin(direction) * cruise * 0.8;
      return {
        el,
        x: Number(el.dataset.x) || 0,          /* 归一化坐标：0～1 为画面内 */
        y: Number(el.dataset.y) || 0,
        w: Number(el.dataset.w) || 0.3,        /* 宽度占画面比例 */
        angle: Number(el.dataset.r) || 0,
        vx: baseVx, vy: baseVy,
        va: (Math.random() - 0.5) * 9,         /* 每秒旋转角度 */
        baseVx, baseVy,                        /* 巡航速度：被推开后缓慢回到漂移状态 */
        phase: Math.random() * Math.PI * 2
      };
    });
    let stageW = entryStage.clientWidth || 1;
    let stageH = entryStage.clientHeight || 1;
    let pointer = null;
    let rafId = 0;
    let lastTime = 0;

    const measure = () => {
      stageW = entryStage.clientWidth || 1;
      stageH = entryStage.clientHeight || 1;
    };

    const applyTransforms = () => {
      for (const s of shapes) {
        const tx = (s.x * stageW).toFixed(1);
        const ty = (s.y * stageH).toFixed(1);
        s.el.style.transform =
          `translate3d(${tx}px, ${ty}px, 0) rotate(${s.angle.toFixed(2)}deg)`;
      }
    };

    const step = (now) => {
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
      lastTime = now;
      const time = now / 1000;
      for (const s of shapes) {
        /* 缓慢回到巡航速度，避免图形停住或越飘越快。 */
        const relax = Math.min(1, dt * 1.1);
        s.vx += (s.baseVx - s.vx) * relax;
        s.vy += (s.baseVy - s.vy) * relax;
        /* 轻微的浮力波动，模拟水上漂浮。 */
        s.vy += Math.sin(time * 0.7 + s.phase) * 0.012 * dt;
        /* 指针靠近时被轻轻推开（简易斥力场）。 */
        if (pointer) {
          const cx = s.x + s.w / 2;
          const cy = s.y + (s.w * stageW / stageH) / 2;
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const dist = Math.hypot(dx, dy);
          const radius = 0.24;
          if (dist > 0.0001 && dist < radius) {
            const force = ((radius - dist) / radius) * 0.5 * dt;
            s.vx += (dx / dist) * force;
            s.vy += (dy / dist) * force;
          }
        }
        /* 限速，保持优雅的节奏。 */
        const speed = Math.hypot(s.vx, s.vy);
        if (speed > 0.16) {
          s.vx = (s.vx / speed) * 0.16;
          s.vy = (s.vy / speed) * 0.16;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.angle += s.va * dt;
        /* 软边界：允许稍微出画（保持海报的裁切感），再轻弹回来。 */
        const hFrac = s.w * stageW / stageH;
        const minX = -0.06; const maxX = 1 - s.w + 0.06;
        const minY = -0.05; const maxY = 1 - hFrac + 0.05;
        if (s.x < minX) { s.x = minX; s.vx = Math.abs(s.vx); s.va += (Math.random() - 0.5) * 3; }
        else if (s.x > maxX) { s.x = maxX; s.vx = -Math.abs(s.vx); s.va += (Math.random() - 0.5) * 3; }
        if (s.y < minY) { s.y = minY; s.vy = Math.abs(s.vy); }
        else if (s.y > maxY) { s.y = maxY; s.vy = -Math.abs(s.vy); }
      }
      applyTransforms();
      rafId = requestAnimationFrame(step);
    };

    const startLoop = () => {
      if (reduceMotion || rafId) return;
      measure();
      lastTime = performance.now();
      rafId = requestAnimationFrame(step);
    };
    const stopLoop = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    };

    entryPage.addEventListener('pointermove', (event) => {
      const rect = entryStage.getBoundingClientRect();
      pointer = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      };
    });
    entryPage.addEventListener('pointerleave', () => { pointer = null; });
    window.addEventListener('pointerup', () => { pointer = null; });
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else if (!entryPage.hidden) startLoop();
    });
    /* 从结果页“重新生成”回到入口页时，恢复背景物理漂浮。 */
    new MutationObserver(() => {
      if (entryPage.hidden) stopLoop();
      else startLoop();
    }).observe(entryPage, { attributes: true, attributeFilter: ['hidden'] });
    startButton.addEventListener('click', () => {
      stopLoop();
      showPage('choose');
    });

    measure();
    applyTransforms();
    startLoop();
  }

  updatePreview();
})();
