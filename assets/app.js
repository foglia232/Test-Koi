/* 页面流程：首页 → 答题 → 生成中 → 完整报告 */
(() => {
  const $app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TYPE_LIST = Object.entries(TYPES).sort((a, b) => a[1].no - b[1].no);
  const no = n => 'No.' + String(n).padStart(2, '0');
  const SEC_TOTAL = Object.keys(SECTIONS).length;

  /* 夜空背景 */
  const sky = document.createElement('div');
  sky.className = 'sky'; sky.setAttribute('aria-hidden', 'true');
  sky.innerHTML = '<i class="stars"></i><i class="a1"></i><i class="a2"></i><i class="a3"></i>';
  document.body.prepend(sky);

  /* 进度只保存在这台设备的浏览器里 */
  let S = { answers: {}, cur: null, introSeen: {}, screen: 'home', last: null };
  try { const v = JSON.parse(localStorage.getItem(CONFIG.storageKey)); if (v) S = { ...S, ...v }; } catch (e) {}
  const save = () => { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(S)); } catch (e) {} };
  const go = screen => { S.screen = screen; save(); render(); window.scrollTo(0, 0); };
  const firstId = () => Engine.visibleQuestions({})[0].id;
  const fresh = () => { S.answers = {}; S.cur = firstId(); S.introSeen = {}; };

  let heroTimer = null;
  function render() {
    clearInterval(heroTimer);
    if (S.screen === 'quiz') return renderQuiz();
    if (S.screen === 'result' && S.last) return renderResult();
    return renderHome();
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    const n = Engine.visibleQuestions({ MISS: 'C' }).length;
    const going = Object.keys(S.answers).length > 0 && S.cur;
    const heroKeys = ['LHLL', 'LHLH', 'HHHH', 'LLLL', 'HHLL'];
    $app.innerHTML = `<div class="wrap"><section class="home">
      <div class="mark">十六种恋爱底色</div>
      <h1 class="flow-text">恋爱回应图鉴</h1>
      <p class="sub">你喜欢一个人时的样子，和他最近的样子</p>
      <div class="hero-card glass" aria-hidden="true"><div class="art" id="heroArt"></div><div class="cap"><span id="heroName"></span><small id="heroNo"></small></div></div>
      <div class="meta"><span>约<b style="margin-left:3px">${n}</b>道题</span><span><b>8</b>分钟</span><span><b>16</b>种底色</span></div>
      <button class="btn" id="start">${going ? '继续答题' : '开始测试'}</button>
      ${going ? `<div class="resume"><button class="link" id="restart">从头开始</button></div>` : ''}
      ${S.last && !going ? `<div class="resume"><button class="link" id="seeLast">查看上次的报告</button></div>` : ''}
      <div class="welcome">
        <p>他最近忽冷忽热，你却说不清哪里不对。很想问，又怕一问，连现在这样都没了。</p>
        <p>这份测试会先看你：喜欢一个人的时候，你习惯怎么靠近、怎么确认他在乎、怎么面对不明确。再看他：最近一个月，他实际做了什么。两边放在一起，你会更明白自己为什么这么累，也更清楚接下来可以做什么。</p>
      </div>
      <h2 class="gallery-title">十六种恋爱底色</h2>
      <p class="gallery-note">没有哪一种更好，只是喜欢一个人的方式不同。</p>
      <div class="gallery">${TYPE_LIST.map(([, t]) => `<div><div class="g">${Art.type(t.art, 'C')}</div><span>${t.name}</span></div>`).join('')}</div>
      <p class="fine">这是一份自我探索测试，不是心理诊断。它只依据你填写的内容，读不出任何人的内心，也不需要你提供名字、照片或聊天记录。答题进度只保存在你这台设备的浏览器里。</p>
    </section></div>`;
    let i = 0;
    const showHero = () => {
      const t = TYPES[heroKeys[i % heroKeys.length]];
      document.getElementById('heroArt').innerHTML = Art.type(t.art, i % 2 ? 'T' : 'C');
      document.getElementById('heroName').textContent = t.name;
      document.getElementById('heroNo').textContent = no(t.no);
      i++;
    };
    showHero();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) heroTimer = setInterval(showHero, 3800);
    document.getElementById('start').onclick = () => { if (!going) fresh(); go('quiz'); };
    const r = document.getElementById('restart'); if (r) r.onclick = () => { fresh(); go('quiz'); };
    const l = document.getElementById('seeLast'); if (l) l.onclick = () => go('result');
  }

  /* ---------- 答题 ---------- */
  function renderQuiz() {
    const list = Engine.visibleQuestions(S.answers);
    let i = list.findIndex(q => q.id === S.cur);
    if (i < 0) { i = 0; S.cur = list[0].id; }
    const q = list[i], sec = SECTIONS[q.sec];
    const bar = `<div class="qbar"><div class="qbar-row">
        <button class="back" id="back" aria-label="上一步"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M12.5 4 6.5 10l6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>
        <span class="sec">${sec.title}</span><span>${i + 1} / ${list.length}</span></div>
        <div class="progress"><i style="width:${Math.round(i / list.length * 100)}%"></i></div></div>`;

    if (!S.introSeen[q.sec]) {
      $app.innerHTML = `<div class="wrap">${bar}<section class="intro">
        <div class="part">第 ${sec.no} 部分，共 ${SEC_TOTAL} 部分</div>
        <h2 class="flow-text">${sec.title}</h2><p>${sec.intro}</p>
        <button class="btn" id="go">好的</button></section></div>`;
      document.getElementById('go').onclick = () => { S.introSeen[q.sec] = true; save(); renderQuiz(); };
      document.getElementById('back').onclick = () => back(list, i, true);
      return;
    }

    const opts = q.options || (q.likert === 'him' ? LIKERT_HIM : LIKERT_ME);
    const cur = S.answers[q.id];
    const btn = o => `<li><button class="opt${o.na ? ' na' : ''}" data-k="${o.k}" aria-pressed="${cur === o.k}">${esc(o.t)}</button></li>`;
    $app.innerHTML = `<div class="wrap">${bar}<section class="q">
      <h2>${esc(q.text)}</h2>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ''}
      ${q.likert ? `<p class="hint">${q.likert === 'him' ? '这句话，像他最近的样子吗？' : '这句话，像最近的你吗？'}</p>` : ''}
      <ul class="opts">${opts.map(btn).join('')}</ul></section></div>`;
    $app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      S.answers[q.id] = b.dataset.k; save();
      $app.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', x === b));
      setTimeout(() => next(q.id), 230);
    });
    document.getElementById('back').onclick = () => back(list, i, false);
  }

  function next(id) {
    const list = Engine.visibleQuestions(S.answers);
    const i = list.findIndex(q => q.id === id);
    if (i === list.length - 1) return finish();
    S.cur = list[i + 1].id; save(); renderQuiz(); window.scrollTo(0, 0);
  }
  function back(list, i, onIntro) {
    const q = list[i];
    if (onIntro) { if (i === 0) return go('home'); S.cur = list[i - 1].id; }
    else if (i === 0 || list[i - 1].sec !== q.sec) S.introSeen[q.sec] = false;
    else S.cur = list[i - 1].id;
    save(); renderQuiz(); window.scrollTo(0, 0);
  }

  function finish() {
    S.last = { ...S.answers }; S.answers = {}; S.cur = null; save();
    const r = Engine.compute(S.last);
    const lines = ['正在整理你的习惯', '正在对照他最近的样子', '正在写你的图鉴'];
    $app.innerHTML = `<div class="wrap"><div class="loading"><div><div class="orb glass" id="orb"></div><p id="lt">${lines[0]}</p></div></div></div>`;
    const keys = TYPE_LIST.map(([k]) => k).filter(k => k !== r.typeKey).sort(() => Math.random() - .5).slice(0, 4).concat(r.typeKey);
    let n = 0;
    const tick = () => {
      document.getElementById('orb').innerHTML = Art.type(TYPES[keys[Math.min(n, keys.length - 1)]].art, n % 2 ? 'T' : 'C');
      document.getElementById('lt').textContent = lines[Math.min(Math.floor(n / 2), 2)];
      n++;
    };
    tick();
    const t = setInterval(tick, 520);
    setTimeout(() => { clearInterval(t); go('result'); }, 2900);
  }

  /* ---------- 报告 ---------- */
  function axesBlock(r) {
    return `<div class="axes">${['P', 'J', 'K', 'V'].map(ax => {
      const A = AXES[ax], v = r.axes[ax], m = r.axisMeans[ax];
      return `<div class="axis"><div class="lbl"><span>${v === 'L' ? `<b>${A.L}</b>` : A.L}</span><span class="mid">${A.name}</span><span>${v === 'H' ? `<b>${A.H}</b>` : A.H}</span></div>
        <div class="track"><i style="left:${(6 + m / 4 * 88).toFixed(1)}%"></i></div><p>${v === 'H' ? A.Htxt : A.Ltxt}</p></div>`;
    }).join('')}</div>`;
  }

  function renderResult() {
    const r = Engine.compute(S.last), a = r.ans, t = r.type, st = STATE[r.state], rel = REL[r.rel], want = WANT[a.WANT];
    const parts = [];

    parts.push(`<section class="specimen glass">
      <div class="art">${Art.type(t.art, r.state)}</div>
      <div class="seal ${r.state === 'C' ? 'calm' : ''}">${st.name}</div>
      <div class="s-top"><div class="s-name flow-text">${t.name}</div><div class="s-no">${no(t.no)} / 16</div></div>
      <p class="s-tag">${t.tagline}</p>
      <div class="chips">${['P', 'J', 'K', 'V'].map(ax => `<span>${AXES[ax][r.axes[ax]]}</span>`).join('')}</div>
      ${r.edge ? `<p class="edge">${TYPE_EDGE}</p>` : ''}
    </section>
    <section class="verdict glass"><small>这段关系现在</small><h3>${rel.title}</h3><p>${rel.verdict}</p></section>`);

    parts.push(`<section class="block"><h3>你是${t.name}</h3><p>${t.portrait}</p>
      ${want ? `<p class="edge" style="margin:4px 0 0">你最想知道的是“${esc(Engine.byId.WANT.options.find(o => o.k === a.WANT).t)}”。${want.guide}</p>` : ''}</section>`);

    parts.push(`<section class="block"><h3>你的四个习惯</h3><p class="lead">光点越靠近哪一边，说明你越偏向那一边。</p>${axesBlock(r)}</section>`);

    parts.push(`<section class="block"><h3>你可能会这样</h3><ul class="scenes">${t.scenes.map(s => `<li>${s}</li>`).join('')}</ul>
      <h4>你的天赋</h4><p>${t.gift}</p>
      <h4>你容易卡住的地方</h4><p>${t.stuck}</p></section>`);

    parts.push(`<section class="block"><h3>这一个月的你：${st.name}</h3><p>${st.txt}</p>
      ${r.stateEdge ? `<p class="edge" style="margin:0 0 14px">${STATE.EDGE}</p>` : ''}
      <div class="pull glass">${t[r.state]}</div>
      <div class="insight"><b>你可能想知道</b><p>${st.insight}</p></div></section>`);

    const dims = ['A', 'B', 'C', 'D'].map(d => {
      const lv = r.dims[d], m = r.dimMeans[d], on = m === undefined ? 0 : Math.round(m);
      return `<div class="dim"><div class="top"><b>${DIMS[d].name}</b><span class="lv ${lv}">${LEVEL_NAME[lv]}</span></div>
        ${lv !== 'U' ? `<div class="meter" aria-hidden="true">${[1, 2, 3, 4].map(k => `<i class="${k <= on ? 'on' : ''}"></i>`).join('')}</div>` : '<div style="height:8px"></div>'}
        <p>${DIMS[d][lv]}</p></div>`;
    }).join('');
    const ctx = ['B01', 'B02', 'B03'].map(id => BG[id][a[id]]).filter(Boolean).map(s => `<p>${s}</p>`).join('');
    parts.push(`<section class="block"><h3>这一个月的他</h3><p class="lead">只看你填写的、他实际做了什么。</p>${dims}
      <div class="ctx glass"><span class="label">放回你们现在的处境</span>${ctx}</div></section>`);

    const topics = {
      miss: `<div class="topic"><h4>他有没有说过想你</h4><p>${TOPIC.MISS[a.MISS]}</p>${TOPIC.AFTER[a.AFTER] ? `<p class="then">${TOPIC.AFTER[a.AFTER]}</p>` : ''}</div>`,
      new: `<div class="topic"><h4>他是不是有了新的人</h4><p>${TOPIC.NEW[a.NEW]}</p></div>`,
      intent: `<div class="topic"><h4>他对这段关系的态度</h4><p>${TOPIC.INTENT[a.INTENT]}</p></div>`
    };
    const order = a.WANT === 'B' ? ['new', 'intent', 'miss'] : a.WANT === 'A' ? ['miss', 'intent', 'new'] : ['intent', 'miss', 'new'];
    const notes = r.quality.map(k => `<p class="note">${QUALITY[k]}</p>`).join('');
    parts.push(`<section class="block"><h3>你心里的那几个问题</h3>${notes}${order.map(k => topics[k]).join('')}</section>`);

    parts.push(`<section class="block"><h3>${t.name}，和这段关系</h3><p class="lead">把你的习惯和他的表现放在一起看。</p>
      ${r.cross.length ? `<ul class="cross">${r.cross.map(c => `<li class="glass">${c}</li>`).join('')}</ul>` : ''}
      <h4>“${rel.title}”意味着什么</h4><p>${rel.meaning}</p>
      <h4>什么时候值得重新判断</h4><p>${rel.reassess}</p>
      <div class="insight"><b>${rel.insight.title}</b><p>${rel.insight.txt}</p></div></section>`);

    if (r.evidence.length) parts.push(`<section class="block"><h3>为什么是这个结果</h3><p class="lead">报告依据的是你的这些回答。</p>
      <ul class="evid">${r.evidence.map(e => `<li><q>${esc(e.q)}</q><b>你选了：${esc(e.a)}</b></li>`).join('')}</ul></section>`);

    const act = ACT[r.act];
    const showTalk = r.act === 'ACT_TALK' || r.act === 'ACT_PROGRESS';
    parts.push(`<section class="block"><h3>接下来</h3>
      <div class="act glass"><h4>${act.title}</h4><p>${act.txt}</p>
        ${showTalk ? `<p style="margin:16px 0 0;font-size:14px;color:var(--muted)">如果你决定开口，可以参考这样说：</p><p class="talk">${t.talk}</p>` : ''}</div>
      <div class="practice glass"><span class="label">给你的一个小练习</span><p>${t.practice}</p></div></section>`);

    if (want) parts.push(`<section class="block"><h3>${want.title}</h3><p>${want.txt}</p></section>`);

    $app.innerHTML = `<div class="wrap">${parts.join('')}
      <p class="ending">${ENDING}</p>
      <div class="actions"><button class="btn" id="share">保存我的图鉴卡片</button><button class="link" id="again">重新测试</button></div></div>`;
    document.getElementById('share').onclick = () => shareCard(r);
    document.getElementById('again').onclick = () => { fresh(); go('home'); };
  }

  /* ---------- 图鉴卡片：只含类型、状态和一句话，不含任何关系细节 ---------- */
  function shareCard(r) {
    const t = r.type, st = STATE[r.state], W = 750, H = 1200;
    const lines = []; for (let i = 0; i < t.tagline.length; i += 18) lines.push(t.tagline.slice(i, i + 18));
    const serif = 'Songti SC, STSong, Noto Serif SC, Noto Serif CJK SC, serif';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14112F"/><stop offset="1" stop-color="#241C4E"/></linearGradient>
      <linearGradient id="cf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE3F1"/><stop offset=".45" stop-color="#C9BDFF"/><stop offset="1" stop-color="#A6F1E6"/></linearGradient>
      <linearGradient id="cb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#A6F1E6" stop-opacity=".5"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#cbg)"/>
      <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="34" fill="#fff" fill-opacity=".05" stroke="url(#cb)" stroke-width="2"/>
      <text x="${W / 2}" y="112" text-anchor="middle" font-family="${serif}" font-size="24" letter-spacing="12" fill="#A9A1CC">恋爱回应图鉴</text>
      <clipPath id="cc"><rect x="85" y="150" width="580" height="580" rx="26"/></clipPath>
      <g clip-path="url(#cc)"><svg x="85" y="150" width="580" height="580" viewBox="0 0 400 400">${Art.inner(t.art, r.state)}</svg></g>
      <rect x="${W - 85 - 150}" y="176" width="126" height="46" rx="23" fill="#14112F" fill-opacity=".6" stroke="${r.state === 'C' ? '#A6F1E6' : '#FFBEDC'}" stroke-opacity=".7"/>
      <text x="${W - 85 - 87}" y="207" text-anchor="middle" font-family="${serif}" font-size="22" letter-spacing="6" fill="${r.state === 'C' ? '#D6FBF4' : '#FFE3F1'}">${st.name}</text>
      <text x="85" y="830" font-family="${serif}" font-size="84" letter-spacing="14" fill="url(#cf)">${t.name}</text>
      <text x="665" y="828" text-anchor="end" font-family="PingFang SC, sans-serif" font-size="22" letter-spacing="3" fill="#7E77A6">${no(t.no)} / 16</text>
      ${lines.map((l, i) => `<text x="85" y="${908 + i * 50}" font-family="${serif}" font-size="31" fill="#D8D2EC">${esc(l)}</text>`).join('')}
      <text x="85" y="${H - 104}" font-family="PingFang SC, sans-serif" font-size="23" fill="#A9A1CC">${['P', 'J', 'K', 'V'].map(ax => AXES[ax][r.axes[ax]]).join('　')}</text></svg>`;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      c.getContext('2d').drawImage(img, 0, 0);
      let url; try { url = c.toDataURL('image/png'); } catch (e) { console.error('card export failed', e); return; }
      const link = document.createElement('a'); link.download = `恋爱回应图鉴-${t.name}.png`; link.href = url; document.body.appendChild(link); link.click(); link.remove();
    };
    img.onerror = () => console.error('card image failed');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  render();
})();
