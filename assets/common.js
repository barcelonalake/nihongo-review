/* 日語複習網站：共用 JS（發音、複製、拼音開關、跟讀模式、小遊戲）
   每一頁只要：<script src="assets/common.js"></script>（days/ 底下用 ../assets/common.js） */
(function () {
  'use strict';
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SRC.replace(/assets\/common\.js.*$/, '');

  /* ===== 網站頁面清單（上方導覽列） ===== */
  var PAGES = [
    ['index.html', '🏠 首頁'],
    ['kana.html', 'あ 五十音'],
    ['lesson1.html', '第1課'],
    ['lesson2.html', '第2課'],
    ['lesson3.html', '第3課'],
    ['ichinichi.html', '私の1日'],
    ['lesson4.html', '第4課'],
    ['review.html', '總複習'],
    ['exam.html', '📝 總考試']
  ];
  /* ===== 每日課堂：新增一天就在這裡加一行 =====
     例：{ date: '2026-10-27', title: '第5課 …', desc: '一句話重點' }
     檔案放在 days/2026-10-27.html */
  var DAYS = [
    { date: '2026-10-27', title: '漢字開課＋第5課 週末', desc: 'ました／ませんでした、どこかへ・どこへも、〔人〕と、それから；漢字 川・山・田・日' }
  ];
  window.SITE = { PAGES: PAGES, DAYS: DAYS, BASE: BASE };

  /* ===== 小工具 ===== */
  var CP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="vertical-align:-3px"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ===== 發音 ===== */
  var RATE = parseFloat(store('nr_rate')) || 1.0;
  var hasTTS = 'speechSynthesis' in window;
  function voices() { return hasTTS ? speechSynthesis.getVoices() : []; }
  if (hasTTS) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function () { speechSynthesis.getVoices(); }; }
  function say(t, rate) {
    if (!hasTTS) { toast('這個瀏覽器不支援語音'); return; }
    var u = new SpeechSynthesisUtterance(t); u.lang = 'ja-JP'; u.rate = rate || 0.9;
    var v = speechSynthesis.getVoices().find(function (x) { return x.lang.startsWith('ja'); }); if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  function sayJa(t) { say(t, RATE); }
  /* 回傳 Promise：念完才繼續（跟讀模式用） */
  function speakP(t, lang) {
    return new Promise(function (res) {
      if (!hasTTS || !t) { setTimeout(res, 300); return; }
      var u = new SpeechSynthesisUtterance(t); u.lang = lang; u.rate = lang === 'ja-JP' ? RATE : 1.0;
      var vs = voices(), v;
      if (lang === 'ja-JP') v = vs.find(function (x) { return x.lang.startsWith('ja'); });
      else v = vs.find(function (x) { return /zh[-_]TW/i.test(x.lang); }) || vs.find(function (x) { return /zh[-_](HK|Hant)/i.test(x.lang); }) || vs.find(function (x) { return /^zh/i.test(x.lang); });
      if (v) u.voice = v;
      var done = false; function fin() { if (!done) { done = true; clearTimeout(tm); res(); } }
      var tm = setTimeout(fin, 2500 + t.length * 450);
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
    });
  }
  window.say = say; window.sayJa = sayJa;

  /* ===== 複製 ===== */
  function toast(msg) {
    var t = $('#toast'); if (!t) { t = el('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 1400);
  }
  function copy(text) {
    function ok() { toast('已複製 ✓'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('複製失敗'); } ta.remove();
    }
  }
  window.copyText = copy; window.toast = toast;

  /* ===== 假名拆格：一格一拍 ===== */
  var SMALL = 'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ';
  function morae(s) {
    var out = [];
    String(s).replace(/[\s・·]/g, '').split('').forEach(function (c) {
      if (SMALL.indexOf(c) >= 0 && out.length) out[out.length - 1] += c; else out.push(c);
    });
    return out;
  }
  function cellsHTML(kana) {
    return morae(kana).map(function (m) { return '<span class="kc' + (/^[っッんンー]$/.test(m) ? ' sm' : '') + '">' + esc(m) + '</span>'; }).join('');
  }
  window.morae = morae;

  /* ===== 內容格式：用「｜」或「|」分欄，一行一筆 ===== */
  function lines(node) {
    return node.textContent.split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
      .map(function (l) { return l.split(/\s*[|｜]\s*/); });
  }
  function opts(s) {
    var o = {}; (s || '').split(';').forEach(function (p) { var i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o;
  }
  /* .rows：日語 | 羅馬拼音 | 中文 | sp=說話人;say=念法 */
  function buildRows(box) {
    var data = lines(box); box.innerHTML = '';
    var isDlg = box.classList.contains('dlg');
    if (isDlg) {
      var hd = el('div', 'rowshead');
      var bp = el('button', 'tb', '▶ 播放整段'); var bc = el('button', 'tb', CP + ' 複製整段');
      hd.appendChild(bp); hd.appendChild(bc); box.appendChild(hd);
      bc.onclick = function () { copy(data.map(function (d) { var o = opts(d[3]); return (o.sp ? o.sp + '：' : '') + d[0]; }).join('\n')); };
      bp.onclick = function () {
        if (!hasTTS) return; speechSynthesis.cancel();
        var seq = $$('.row', box), i = 0;
        (function nx() { if (i >= seq.length) return; var r = seq[i++]; mark(r); speakP(r.dataset.say, 'ja-JP').then(function () { setTimeout(nx, 400); }); })();
      };
    }
    data.forEach(function (d) {
      var o = opts(d[3]);
      var r = el('div', 'row');
      r.dataset.ja = d[0]; r.dataset.say = o.say || d[0].replace(/〇/g, 'まる'); r.dataset.zh = d[2] || '';
      r.innerHTML = '<button class="b play" title="播放" aria-label="播放">▶</button><button class="b cp" title="複製" aria-label="⧉ 複製">' + CP + '</button>' +
        '<div class="tx"><div class="ja" lang="ja">' + (o.sp ? '<span class="sp">' + esc(o.sp) + '</span>' : '') + esc(d[0]) + '</div>' +
        '<div class="ro">' + esc(d[1] || '') + '</div><div class="zh">' + esc(d[2] || '') + '</div></div>';
      $('.play', r).onclick = function () { sayJa(r.dataset.say); };
      $('.cp', r).onclick = function () { copy(d[0]); };
      box.appendChild(r);
    });
    box.classList.add('ok');
  }
  function mark(r) { $$('.row.now').forEach(function (x) { x.classList.remove('now'); }); if (r) { r.classList.add('now'); r.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
  /* .vocab：假名 | 漢字 | 羅馬拼音 | 中文 | 記法 */
  function buildVocab(box) {
    var data = lines(box); box.innerHTML = '';
    data.forEach(function (d) {
      var c = el('div', 'vc');
      c.innerHTML = '<div class="cells" lang="ja">' + cellsHTML(d[0]) + '</div>' +
        '<div>' + (d[1] && d[1] !== d[0] ? '<span class="kj" lang="ja">' + esc(d[1]) + '</span>' : '') + '<span class="roi">' + esc(d[2] || '') + '</span></div>' +
        '<div class="zh">' + esc(d[3] || '') + '</div>' + (d[4] ? '<div class="tp">💡 ' + esc(d[4]) + '</div>' : '');
      c.onclick = function () { sayJa(d[0]); };
      box.appendChild(c);
    });
    box.classList.add('ok');
  }
  /* .cards：標籤 | 假名 | 羅馬拼音 | 備註 | hl（標紅） */
  function buildCards(box) {
    var data = lines(box); box.innerHTML = '';
    data.forEach(function (d) {
      var c = el('div', 'cd' + (d[4] ? ' hl' : ''));
      c.innerHTML = '<div class="lb" lang="ja">' + esc(d[0]) + '</div><div class="kn" lang="ja">' + esc(d[1] || '') + '</div><small class="ro">' + esc(d[2] || '') + '</small>' + (d[3] ? '<div class="nt">' + esc(d[3]) + '</div>' : '');
      c.onclick = function () { sayJa((d[1] || d[0]).replace(/[／/].*$/, '')); };
      box.appendChild(c);
    });
    box.classList.add('ok');
  }

  /* ===== 導覽列、工具列、目錄 ===== */
  function chrome() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var nav = el('nav', 'topnav'); var ni = el('div', 'in');
    PAGES.forEach(function (p) { var a = el('a', p[0] === here ? 'on' : '', esc(p[1])); a.href = BASE + p[0]; ni.appendChild(a); });
    nav.appendChild(ni);
    var tb = el('div', 'toolbar'); var ti = el('div', 'in');
    var bRo = el('button', 'tb', '');
    function syncRo() { var off = store('nr_noro') === '1'; document.body.classList.toggle('noro', off); bRo.textContent = off ? '拼音：關' : '拼音：開'; bRo.classList.toggle('on', !off); }
    bRo.onclick = function () { store('nr_noro', store('nr_noro') === '1' ? '0' : '1'); syncRo(); };
    var bRate = el('button', 'tb', '');
    function syncRate() { bRate.textContent = '語速 ' + (RATE === 1 ? '1.0' : '0.75'); }
    bRate.onclick = function () { RATE = RATE === 1 ? 0.75 : 1.0; store('nr_rate', String(RATE)); syncRate(); toast('語速 ' + (RATE === 1 ? '1.0' : '0.75')); };
    ti.appendChild(bRo); ti.appendChild(bRate);
    if ($$('.row').length) { var bS = el('button', 'tb hot', '🎧 跟讀模式'); bS.onclick = openShadow; ti.appendChild(bS); }
    var bStop = el('button', 'tb', '■ 停止'); bStop.onclick = function () { stopAll(); }; ti.appendChild(bStop);
    tb.appendChild(ti);
    document.body.insertBefore(tb, document.body.firstChild);
    document.body.insertBefore(nav, document.body.firstChild);
    syncRo(); syncRate();
    var toc = $('.toc');
    if (toc) $$('main h2[id]').forEach(function (h) { var a = el('a', '', esc(h.dataset.short || h.textContent)); a.href = '#' + h.id; toc.appendChild(a); });
    $$('[data-say]').forEach(function (n) { if (n.classList.contains('row')) return; n.classList.add('tap'); n.addEventListener('click', function (e) { if (e.target.closest('button,a')) return; sayJa(n.dataset.say); }); });
  }

  /* ===== 跟讀模式 ===== */
  var RUN = 0;
  function stopAll() { RUN++; if (hasTTS) speechSynthesis.cancel(); mark(null); var p = $('#shadowP'); if (p) $('.st', p).textContent = '已停止'; }
  function wait(ms, id) { return new Promise(function (res, rej) { setTimeout(function () { id === RUN ? res() : rej('stop'); }, ms); }); }
  function guard(id) { return function (x) { if (id !== RUN) throw 'stop'; return x; }; }
  function groups() {
    var g = [['全部句子', $$('.row')]];
    $$('main section').forEach(function (s) { var rs = $$('.row', s); var h = $('h2', s); if (rs.length && h) g.push([h.textContent, rs]); });
    return g;
  }
  function openShadow() {
    var p = $('#shadowP');
    if (!p) {
      p = el('div'); p.id = 'shadowP';
      p.innerHTML = '<div class="in"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><b>🎧 跟讀模式</b><select></select>' +
        '<button class="tb hot go">開始</button><button class="tb stop">停止</button><button class="tb cl">關閉</button></div>' +
        '<div class="st">中文提示 → 日語 → 停 3 秒跟著念 → 日語再一次；最後小測驗：中文出題 → 停 5 秒 → 念答案。</div><div class="now"></div></div>';
      document.body.appendChild(p);
      var sel = $('select', p);
      groups().forEach(function (g, i) { var o = el('option', '', esc(g[0]) + '（' + g[1].length + ' 句）'); o.value = i; sel.appendChild(o); });
      $('.go', p).onclick = function () { runShadow(groups()[+sel.value][1]); };
      $('.stop', p).onclick = stopAll;
      $('.cl', p).onclick = function () { stopAll(); p.classList.remove('show'); document.body.style.paddingBottom = ''; };
    }
    p.classList.add('show'); document.body.style.paddingBottom = '170px';
  }
  function runShadow(rows) {
    stopAll(); var id = ++RUN; var p = $('#shadowP'), now = $('.now', p), st = $('.st', p); var g = guard(id);
    function show(h) { now.innerHTML = h; }
    var i = 0;
    function step() {
      if (id !== RUN) return Promise.reject('stop');
      if (i >= rows.length) return quiz();
      var r = rows[i++]; mark(r);
      st.textContent = '跟讀 ' + i + ' / ' + rows.length;
      show('<div class="zh">' + esc(r.dataset.zh) + '</div><div class="ja" lang="ja">' + esc(r.dataset.ja) + '</div>');
      return speakP(r.dataset.zh, 'zh-TW').then(g).then(function () { return speakP(r.dataset.say, 'ja-JP'); }).then(g)
        .then(function () { st.textContent = '換你念！（3 秒）'; return wait(3000, id); })
        .then(function () { return speakP(r.dataset.say, 'ja-JP'); }).then(g).then(function () { return wait(700, id); }).then(step);
    }
    function quiz() {
      mark(null);
      var qs = shuffle(rows).slice(0, Math.min(5, rows.length)), k = 0;
      function q() {
        if (id !== RUN) return Promise.reject('stop');
        if (k >= qs.length) { st.textContent = '完成！辛苦了 👏'; show('<b>今天的跟讀完成！</b>'); return Promise.resolve(); }
        var r = qs[k++];
        st.textContent = '小測驗 ' + k + ' / ' + qs.length + '：用日語說說看（5 秒）';
        show('<div class="zh">❓ ' + esc(r.dataset.zh) + '</div>');
        return speakP('用日語怎麼說：' + r.dataset.zh, 'zh-TW').then(g).then(function () { return wait(5000, id); })
          .then(function () { show('<div class="zh">' + esc(r.dataset.zh) + '</div><div class="ja" lang="ja">✅ ' + esc(r.dataset.ja) + '</div>'); return speakP(r.dataset.say, 'ja-JP'); })
          .then(g).then(function () { return wait(1200, id); }).then(q);
      }
      return q();
    }
    step().catch(function () { });
  }

  /* ===== 小遊戲 ===== */
  var G = {};
  /* 通用外殼：一題一題出，計分，最後可重玩 */
  function runner(host, cfg) {
    if (typeof host === 'string') host = $(host);
    host.classList.add('game');
    host.innerHTML = '<div class="gh"><h3>' + cfg.title + '</h3><span class="score"></span></div><p class="gdesc">' + (cfg.desc || '') + '</p><div class="gbody"></div>';
    var body = $('.gbody', host), sc = $('.score', host);
    var items, i, score;
    function start() { items = cfg.shuffle === false ? cfg.items.slice() : shuffle(cfg.items); if (cfg.n) items = items.slice(0, cfg.n); i = 0; score = 0; next(); }
    function upd() { sc.textContent = '第 ' + Math.min(i + 1, items.length) + ' / ' + items.length + ' 題 · 答對 ' + score; }
    function next() {
      if (i >= items.length) {
        sc.textContent = '';
        body.innerHTML = '<div class="end"><div style="font-size:2.4rem">' + (score === items.length ? '🎉' : score >= items.length * 0.7 ? '👍' : '💪') + '</div><p>答對 <b>' + score + ' / ' + items.length + '</b></p><div class="gbtns" style="justify-content:center"><button class="gbtn">再玩一次</button></div></div>';
        $('.gbtn', body).onclick = start; return;
      }
      upd(); body.innerHTML = '';
      cfg.render(items[i], body, function (correct, fbHTML, speak) {
        if (correct) score++;
        upd();
        var fb = el('div', 'fb ' + (correct ? 'ok' : 'bad'), (correct ? '✅ 答對了！ ' : '❌ 再記一下： ') + (fbHTML || ''));
        body.appendChild(fb);
        if (speak) sayJa(speak);
        var bt = el('div', 'gbtns'); var nb = el('button', 'gbtn', i + 1 >= items.length ? '看結果' : '下一題 →');
        nb.onclick = function () { i++; next(); }; bt.appendChild(nb);
        if (speak) { var sb = el('button', 'gbtn alt', '🔊 再聽一次'); sb.onclick = function () { sayJa(speak); }; bt.appendChild(sb); }
        body.appendChild(bt);
      });
    }
    start();
  }
  G.runner = runner;
  /* 選擇題：{q, o:[選項], a:'正解', say:'題目要念的日語(聽力)', listen:true 先念, sa:'答完念', ex:'解說'} */
  G.mcq = function (host, title, desc, items, more) {
    runner(host, Object.assign({ title: title, desc: desc, items: items, render: function (it, body, done) {
      var q = el('div', 'gq', it.q || '');
      body.appendChild(q);
      if (it.say) {
        var lb = el('button', 'gbtn alt', '🔊 聽題目'); lb.onclick = function () { sayJa(it.say); }; body.appendChild(lb);
        if (it.listen !== false) setTimeout(function () { sayJa(it.say); }, 250);
      }
      var box = el('div', 'opts'); box.style.marginTop = '10px';
      shuffle(it.o).forEach(function (op) {
        var b = el('button', 'opt', esc(op)); b.setAttribute('lang', 'ja');
        b.onclick = function () {
          $$('.opt', box).forEach(function (x) { x.disabled = true; if (x.textContent === it.a) x.classList.add('ok'); });
          var ok = op === it.a; if (!ok) b.classList.add('bad');
          done(ok, (ok ? '' : '正確答案：<b lang="ja">' + esc(it.a) + '</b>　') + (it.ex || ''), it.sa);
        };
        box.appendChild(b);
      });
      body.appendChild(box);
    } }, more || {}));
  };
  /* 排句子／拼假名：{zh, t:[片段], x:[干擾], ro, say} */
  G.order = function (host, title, desc, items, more) {
    runner(host, Object.assign({ title: title, desc: desc, items: items, render: function (it, body, done) {
      body.appendChild(el('div', 'gq', '「' + esc(it.zh) + '」'));
      var ans = el('div', 'tiles ans'), pool = el('div', 'tiles');
      body.appendChild(ans); body.appendChild(pool);
      shuffle(it.t.concat(it.x || [])).forEach(function (tk) {
        var b = el('button', 'tile', esc(tk));
        b.onclick = function () { if (b.disabled) return; (b.parentNode === pool ? ans : pool).appendChild(b); };
        pool.appendChild(b);
      });
      var bt = el('div', 'gbtns'); var ck = el('button', 'gbtn', '檢查'); var rs = el('button', 'gbtn alt', '重排');
      bt.appendChild(ck); bt.appendChild(rs); body.appendChild(bt);
      rs.onclick = function () { $$('.tile', ans).forEach(function (b) { pool.appendChild(b); }); };
      ck.onclick = function () {
        var got = $$('.tile', ans).map(function (b) { return b.textContent; }).join('');
        var want = it.t.join('');
        $$('.tile', body).forEach(function (b) { b.disabled = true; }); bt.remove();
        done(got === want, '<b lang="ja">' + esc(it.full || want) + '</b>' + (it.ro ? '<br><span class="roi">' + esc(it.ro) + '</span>' : ''), it.say || it.full || want);
      };
    } }, more || {}));
  };
  /* 數拍：{k:'がっこう', w:'学校', ro, zh} */
  G.count = function (host, title, desc, items, more) {
    runner(host, Object.assign({ title: title, desc: desc, items: items, render: function (it, body, done) {
      body.appendChild(el('div', 'gq', '<span class="big" lang="ja">' + esc(it.k) + '</span><div style="text-align:center"><span class="roi">' + esc(it.ro || '') + '</span>　' + esc(it.zh || '') + '</div>'));
      var lb = el('button', 'gbtn alt', '🔊 聽'); lb.onclick = function () { sayJa(it.k); }; body.appendChild(lb);
      var n = morae(it.k).length, box = el('div', 'opts'); box.style.marginTop = '10px';
      [1, 2, 3, 4, 5, 6, 7].forEach(function (k) {
        var b = el('button', 'opt', k + ' 拍');
        b.onclick = function () {
          $$('.opt', box).forEach(function (x) { x.disabled = true; }); b.classList.add(k === n ? 'ok' : 'bad');
          done(k === n, n + ' 拍：<span lang="ja">' + cellsHTML(it.k) + '</span>' + (it.ex ? '<br>' + esc(it.ex) : ''), it.k);
        };
        box.appendChild(b);
      });
      body.appendChild(box);
    } }, more || {}));
  };
  /* 翻牌：[正面, 正面拼音, 背面, 背面拼音, 中文] */
  G.flip = function (host, title, desc, pairs) {
    if (typeof host === 'string') host = $(host);
    host.classList.add('game');
    host.innerHTML = '<div class="gh"><h3>' + title + '</h3><button class="tb">全部翻回</button></div><p class="gdesc">' + (desc || '') + '</p><div class="flipgrid"></div>';
    var g = $('.flipgrid', host);
    function draw() {
      g.innerHTML = '';
      shuffle(pairs).forEach(function (p) {
        var f = el('button', 'flip'); var back = false;
        function show() { f.classList.toggle('back', back); f.innerHTML = back ? '<span lang="ja">' + esc(p[2]) + '</span><small class="roi">' + esc(p[3]) + '</small><small>' + esc(p[5] || '') + '</small>' : '<span lang="ja">' + esc(p[0]) + '</span><small class="roi">' + esc(p[1]) + '</small><small>' + esc(p[4] || '') + '・反義詞是？</small>'; }
        f.onclick = function () { back = !back; show(); sayJa(back ? p[2] : p[0]); };
        show(); g.appendChild(f);
      });
    }
    $('.tb', host).onclick = draw; draw();
  };
  /* 看圖猜詞：{e:'☕', ja, ro, zh, hint} 倒數 3·2·1 再公布並念出來 */
  G.guess = function (host, title, desc, items, more) {
    runner(host, Object.assign({ title: title, desc: desc, items: items, render: function (it, body, done) {
      body.appendChild(el('div', 'emoji', esc(it.e)));
      if (it.hint) body.appendChild(el('p', '', '<span style="color:var(--mute)">提示：' + esc(it.hint) + '</span>'));
      var cnt = el('div', 'count', ''); body.appendChild(cnt);
      var bt = el('div', 'gbtns'); var go = el('button', 'gbtn', '想好了，倒數 3·2·1'); bt.appendChild(go); body.appendChild(bt);
      go.onclick = function () {
        go.disabled = true; var n = 3; cnt.textContent = n;
        var h = setInterval(function () {
          n--; if (n > 0) { cnt.textContent = n; return; }
          clearInterval(h); cnt.innerHTML = '<span lang="ja" style="font-size:2.2rem;color:var(--ink)">' + esc(it.ja) + '</span><div class="roi" style="font-size:1rem;font-weight:400">' + esc(it.ro) + '</div><div style="font-size:1rem;color:var(--mute);font-weight:400">' + esc(it.zh) + '</div>';
          sayJa(it.say || it.ja); bt.innerHTML = '';
          var y = el('button', 'gbtn', '⭕ 我說對了'), no = el('button', 'gbtn alt', '❌ 沒說對');
          y.onclick = function () { bt.remove(); done(true, '', null); }; no.onclick = function () { bt.remove(); done(false, '多念幾次：<b lang="ja">' + esc(it.ja) + '</b>', it.say || it.ja); };
          bt.appendChild(y); bt.appendChild(no); body.appendChild(bt);
        }, 1000);
      };
    } }, more || {}));
  };
  /* 總考試：三條命、聽力題、錯題一鍵複製。題目 {q, o, a, say, ex, tag} */
  G.exam = function (host, items) {
    if (typeof host === 'string') host = $(host);
    host.classList.add('game');
    var lives, i, score, wrong, list;
    function start() { lives = 3; i = 0; score = 0; wrong = []; list = items.slice(); draw(); }
    function hearts() { return '❤️'.repeat(lives) + '🤍'.repeat(3 - lives); }
    function draw() {
      if (i >= list.length || lives <= 0) return end();
      var it = list[i];
      host.innerHTML = '<div class="gh"><h3>第 ' + (i + 1) + ' / ' + list.length + ' 題' + (it.tag ? '　<small style="color:var(--mute);font-weight:400">' + esc(it.tag) + '</small>' : '') + '</h3><span class="lives">' + hearts() + '</span></div>' +
        '<div class="gq">' + it.q + '</div>';
      if (it.say) { var lb = el('button', 'gbtn alt', '🔊 聽題目（可重複）'); lb.onclick = function () { sayJa(it.say); }; host.appendChild(lb); setTimeout(function () { sayJa(it.say); }, 300); }
      var box = el('div', 'opts'); box.style.marginTop = '10px'; host.appendChild(box);
      shuffle(it.o).forEach(function (op) {
        var b = el('button', 'opt', esc(op)); b.setAttribute('lang', 'ja');
        b.onclick = function () {
          $$('.opt', box).forEach(function (x) { x.disabled = true; if (x.textContent === it.a) x.classList.add('ok'); });
          var ok = op === it.a;
          if (ok) score++; else { b.classList.add('bad'); lives--; wrong.push({ n: i + 1, it: it, mine: op }); $('.lives', host).textContent = hearts(); }
          host.appendChild(el('div', 'fb ' + (ok ? 'ok' : 'bad'), (ok ? '✅ 答對！' : '❌ 正確答案：<b lang="ja">' + esc(it.a) + '</b>') + (it.ex ? '<br>' + it.ex : '')));
          if (it.sa) sayJa(it.sa);
          var bt = el('div', 'gbtns'); var nb = el('button', 'gbtn', lives <= 0 ? '看結果（命用完了）' : (i + 1 >= list.length ? '看結果' : '下一題 →'));
          nb.onclick = function () { i++; draw(); }; bt.appendChild(nb); host.appendChild(bt);
        };
        box.appendChild(b);
      });
    }
    function plain(h) { var d = el('div'); d.innerHTML = h; return d.textContent; }
    function end() {
      var done = Math.min(i, list.length);
      var txt = wrong.map(function (w) { return w.n + '. ' + plain(w.it.q) + '\n   我的答案：' + w.mine + '\n   正確答案：' + w.it.a + (w.it.ex ? '\n   說明：' + plain(w.it.ex) : ''); }).join('\n');
      host.innerHTML = '<div class="end"><div style="font-size:2.6rem">' + (lives > 0 ? (wrong.length === 0 ? '🏆' : '🎉') : '💪') + '</div>' +
        '<p>' + (lives > 0 ? '全部做完！' : '三條命用完了，在第 ' + done + ' 題停下。') + '答對 <b>' + score + '</b> 題，剩下 <span class="lives">' + hearts() + '</span></p></div>';
      if (wrong.length) {
        host.appendChild(el('h3', '', '錯題清單（' + wrong.length + ' 題）'));
        wrong.forEach(function (w) { host.appendChild(el('div', 'wrong', '<b>' + w.n + '.</b> ' + w.it.q + '<br>我的答案：<span class="red" lang="ja">' + esc(w.mine) + '</span>　正確：<b lang="ja" style="color:var(--ok)">' + esc(w.it.a) + '</b>' + (w.it.ex ? '<br><small>' + w.it.ex + '</small>' : ''))); });
      } else host.appendChild(el('p', 'end', '沒有錯題，太厲害了！'));
      var bt = el('div', 'gbtns'); bt.style.justifyContent = 'center';
      if (wrong.length) { var cb = el('button', 'gbtn', CP + ' 一鍵複製錯題'); cb.onclick = function () { copy('【日語總考試 錯題】\n' + txt); }; bt.appendChild(cb); }
      var rb = el('button', 'gbtn alt', '重新考一次'); rb.onclick = start; bt.appendChild(rb);
      host.appendChild(bt);
    }
    start();
  };
  window.G = G;

  /* ===== 啟動 ===== */
  function init() {
    $$('.rows').forEach(buildRows);
    $$('.vocab').forEach(buildVocab);
    $$('.cards').forEach(buildCards);
    chrome();
    var dl = $('#dayList');
    if (dl) {
      if (!DAYS.length) dl.innerHTML = '<p class="lead">（目前還沒有。之後每天的課堂整理會放在這裡：days/YYYY-MM-DD.html）</p>';
      else DAYS.slice().reverse().forEach(function (d) { var a = el('a', 'hc', '<b>' + esc(d.date) + '　' + esc(d.title) + '</b><span>' + esc(d.desc || '') + '</span>'); a.href = BASE + 'days/' + d.date + '.html'; dl.appendChild(a); });
    }
    if (typeof window.pageInit === 'function') window.pageInit();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
