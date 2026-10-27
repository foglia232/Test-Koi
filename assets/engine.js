/* 计分引擎 */
const Engine = (() => {
  const byId = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
  const AXIS_IDS = { P: ['P1', 'P2', 'P3'], J: ['J1', 'J2', 'J3'], K: ['K1', 'K2', 'K3'], V: ['V1', 'V2', 'V3'] };
  const DIM_IDS = { A: ['H1', 'H2'], B: ['H3', 'H4'], C: ['H5', 'H6'], D: ['H7', 'H8'] };
  const S_IDS = ['S1', 'S2', 'S3', 'S4'];
  const LK = { A: 0, B: 1, C: 2, D: 3, E: 4 };
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const cut = ax => (typeof CONFIG !== 'undefined' && CONFIG.axisCut && CONFIG.axisCut[ax]) || 2;

  function isVisible(q, ans) {
    if (q.id === 'AFTER') return !['C', 'D'].includes(ans.MISS);
    return true;
  }
  const visibleQuestions = ans => QUESTIONS.filter(q => isVisible(q, ans));

  function normalize(raw) {
    const ans = { ...raw };
    QUESTIONS.forEach(q => { if (!isVisible(q, ans)) delete ans[q.id]; });
    if (['C', 'D'].includes(ans.MISS)) ans.AFTER = 'E';
    return ans;
  }

  function likertScore(id, k) {
    if (!k || k === 'F' || !(k in LK)) return null;
    return byId[id].rev ? 4 - LK[k] : LK[k];
  }

  function compute(raw) {
    const ans = normalize(raw);
    const r = { ans, axes: {}, axisMeans: {}, edge: false, dims: {}, dimMeans: {} };

    /* 你的四个习惯：均值和分界比较；刚好相等时，看 3 题里多数落在哪一边（3 题不会出现平票） */
    for (const ax of ['P', 'J', 'K', 'V']) {
      const s = AXIS_IDS[ax].map(id => {
        const o = byId[id].options.find(o => o.k === ans[id]); return o ? o.s : null;
      }).filter(v => v !== null);
      if (!s.length) { r.axes[ax] = 'L'; r.axisMeans[ax] = 2; r.edge = true; continue; }
      const m = mean(s), c = cut(ax); r.axisMeans[ax] = m;
      if (m > c) r.axes[ax] = 'H';
      else if (m < c) r.axes[ax] = 'L';
      else r.axes[ax] = s.filter(v => v >= 3).length * 2 > s.length ? 'H' : 'L';
      if (Math.abs(m - c) <= 1 / 3 + 1e-9) r.edge = true;
    }
    r.typeKey = ['P', 'J', 'K', 'V'].map(a => r.axes[a]).join('');
    r.type = TYPES[r.typeKey];

    /* 这一个月的你 */
    const ss = S_IDS.map(id => likertScore(id, ans[id])).filter(v => v !== null);
    if (ss.length >= 3) {
      const m = mean(ss); r.stateMean = m;
      r.state = m < ((typeof CONFIG !== 'undefined' && CONFIG.stateCut) || 2) ? 'C' : 'T';
      r.stateEdge = m >= 1.5 && m <= 2.5;
    } else r.state = 'C';

    /* 这一个月的他 */
    for (const d of ['A', 'B', 'C', 'D']) {
      const s = DIM_IDS[d].map(id => likertScore(id, ans[id])).filter(v => v !== null);
      if (!s.length) { r.dims[d] = 'U'; continue; }
      const m = mean(s); r.dimMeans[d] = m;
      r.dims[d] = m < 1.5 ? 'L' : m < 3 ? 'M' : 'H';
    }

    /* 关系判断 */
    const D = r.dims;
    if (ans.B04 === 'A' || ans.INTENT === 'D') r.rel = 'R01';
    else if (['B', 'C'].includes(ans.B04)) r.rel = 'R01S';
    else if (['A', 'B', 'C'].some(d => D[d] === 'U') || ans.B03 === 'A') r.rel = 'R02';
    else if (D.A === 'H' && D.B === 'H' && D.C === 'H' && ans.INTENT === 'A') r.rel = 'R03';
    else if (D.A === 'H') r.rel = 'R04';
    else if (D.A === 'L') r.rel = 'R05';
    else r.rel = 'R06';

    /* 接下来 */
    if (ans.B04 === 'A') r.act = 'ACT_A';
    else if (ans.B04 === 'B') r.act = 'ACT_B';
    else if (ans.B04 === 'C') r.act = 'ACT_C';
    else if (ans.INTENT === 'D') r.act = 'ACT_REJECT';
    else if (ans.B04 === 'E') r.act = 'ACT_UNCLEAR';
    else if (D.D === 'L' || ans.WANT === 'E') r.act = 'ACT_SELF';
    else if (['A', 'B'].includes(ans.NEW)) r.act = 'ACT_NEW';
    else if (r.rel === 'R03') r.act = 'ACT_PROGRESS';
    else r.act = 'ACT_TALK';

    r.quality = [];
    if (['A', 'B', 'C'].includes(ans.B04) && ['A', 'B'].includes(ans.INTENT)) r.quality.push('Q2');
    if (ans.B03 === 'A' && ['A', 'B'].includes(ans.INTENT)) r.quality.push('Q3');
    if (ans.B01 === 'B' && ['C', 'D'].includes(ans.B03)) r.quality.push('Q4');

    r.cross = CROSS.filter(c => c.when(r)).slice(0, 3).map(c => c.txt);
    r.evidence = pickEvidence(ans, r);
    return r;
  }

  /* 为什么是这个结果：引用 3—5 条和他有关的真实回答 */
  function pickEvidence(ans, r) {
    const out = [];
    const push = id => {
      const q = byId[id], k = ans[id]; if (!q || !k) return;
      const opts = q.options || (q.likert === 'him' ? LIKERT_HIM : LIKERT_ME);
      const o = opts.find(o => o.k === k); if (o) out.push({ q: q.text, a: o.t });
    };
    if (['A', 'B', 'C'].includes(ans.B04)) push('B04');
    if (ans.INTENT && ans.INTENT !== 'E') push('INTENT');
    for (const d of ['A', 'B', 'C', 'D']) {
      let best = null, bd = -1;
      DIM_IDS[d].forEach(id => { const v = likertScore(id, ans[id]); if (v !== null && Math.abs(v - 2) > bd) { bd = Math.abs(v - 2); best = id; } });
      if (best && bd >= 1) push(best);
    }
    if (ans.MISS && ans.MISS !== 'D') push('MISS');
    if (ans.NEW && ans.NEW !== 'E') push('NEW');
    return out.slice(0, 5);
  }

  return { visibleQuestions, normalize, compute, byId };
})();
