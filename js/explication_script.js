// ══════════════════════════════════════════════
function toggleLevel(id, el) {
  const links = document.getElementById('links-' + id);
  const open = links.classList.contains('open');
  document.querySelectorAll('.step-links').forEach(l => l.classList.remove('open'));
  document.querySelectorAll('.level-header').forEach(h => h.classList.remove('active'));
  if (!open) { links.classList.add('open'); el.classList.add('active'); }
}

// ══════════════════════════════════════════════
// QUIZ
// ══════════════════════════════════════════════
function quiz(el, type) {
  const box = el.closest('.quiz-box');
  if (box.querySelector('.correct,.wrong')) return;
  el.classList.add(type);
  const fb = box.querySelector('.quiz-feedback');
  fb.classList.add('show');
  fb.style.cssText = `background:rgba(${type === 'correct' ? '74,222,128' : '239,68,68'},.07);border:1px solid ${type === 'correct' ? '#4ade80' : '#ef4444'};border-radius:7px;padding:9px 13px;`;
  if (type === 'wrong') fb.innerHTML = '❌ Pas tout à fait. ' + fb.innerHTML.replace(/^[✅❌]\s*/, '');
}

// ══════════════════════════════════════════════
// SVG HELPERS
// ══════════════════════════════════════════════
function mk(tag, attrs = {}, text = '') {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}

// ══════════════════════════════════════════════
// N1 — DIJKSTRA STEPPER
// ══════════════════════════════════════════════
const DN = [
  { id: 'A', x: 80, y: 100, label: 'Dépôt' },
  { id: 'B', x: 200, y: 45, label: 'P1' },
  { id: 'C', x: 200, y: 160, label: 'P2' },
  { id: 'D', x: 360, y: 75, label: 'P3' },
  { id: 'E', x: 490, y: 120, label: 'Dest.' },
];
const DE = [['A', 'B', 3], ['A', 'C', 4], ['B', 'C', 2], ['B', 'D', 5], ['C', 'E', 7], ['D', 'E', 2]];
const DSTEPS = [
  {
    dist: { A: 0, B: '∞', C: '∞', D: '∞', E: '∞' }, vis: [], cur: 'A', hi: [],
    desc: '<strong>Init :</strong> dist[A]=0, tous les autres=∞. File de priorité : [(0, A)]'
  },
  {
    dist: { A: 0, B: 3, C: 4, D: '∞', E: '∞' }, vis: ['A'], cur: 'B', hi: [['A', 'B'], ['A', 'C']],
    desc: '<strong>Explorer A (dist=0) :</strong> B→dist=0+3=<strong>3</strong>, C→dist=0+4=<strong>4</strong>. A marqué visité.'
  },
  {
    dist: { A: 0, B: 3, C: 4, D: 8, E: '∞' }, vis: ['A', 'B'], cur: 'C', hi: [['B', 'D'], ['B', 'C']],
    desc: '<strong>Explorer B (dist=3) :</strong> D→dist=3+5=<strong>8</strong>. C: 3+2=5 &gt; 4 déjà connu → pas de mise à jour. B visité.'
  },
  {
    dist: { A: 0, B: 3, C: 4, D: 8, E: 11 }, vis: ['A', 'B', 'C'], cur: 'D', hi: [['C', 'E']],
    desc: '<strong>Explorer C (dist=4) :</strong> E→dist=4+7=<strong>11</strong>. C visité.'
  },
  {
    dist: { A: 0, B: 3, C: 4, D: 8, E: 10 }, vis: ['A', 'B', 'C', 'D'], cur: 'E', hi: [['D', 'E']],
    desc: '<strong>Explorer D (dist=8) :</strong> E→dist=8+2=<strong>10</strong> &lt; 11 → <span style="color:#4ade80">AMÉLIORATION !</span> dist[E] mis à jour. D visité.'
  },
  {
    dist: { A: 0, B: 3, C: 4, D: 8, E: 10 }, vis: ['A', 'B', 'C', 'D', 'E'], cur: null, hi: [['A', 'B'], ['B', 'D'], ['D', 'E']],
    desc: '<strong>Terminé !</strong> dist[E]=<strong>10</strong>. Chemin optimal : A→B→D→E (en remontant les prédécesseurs : E←D←B←A).'
  },
];
let dStep = 0;
function renderDijk() {
  const svg = document.getElementById('dijk-svg');
  svg.innerHTML = '';
  const s = DSTEPS[dStep];
  DE.forEach(([a, b, w]) => {
    const na = DN.find(n => n.id === a), nb = DN.find(n => n.id === b);
    const isHi = s.hi.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    const isFinal = dStep === 5 && isHi;
    svg.appendChild(mk('line', {
      x1: na.x, y1: na.y, x2: nb.x, y2: nb.y,
      stroke: isFinal ? '#22d3ee' : isHi ? 'rgba(34,211,238,.6)' : 'rgba(255,255,255,.1)',
      'stroke-width': isFinal ? '3' : isHi ? '2' : '1.5'
    }));
    const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
    svg.appendChild(mk('text', {
      x: mx, y: my - 5, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.35)',
      'font-size': '10', 'font-family': 'JetBrains Mono,monospace'
    }, w));
  });
  DN.forEach(n => {
    const isVis = s.vis.includes(n.id), isCur = s.cur === n.id;
    const color = isCur ? '#22d3ee' : isVis ? '#4ade80' : '#a78bfa';
    const r = isCur ? 16 : isVis ? 13 : 11;
    if (isCur) { svg.appendChild(mk('circle', { cx: n.x, cy: n.y, r: '22', fill: 'rgba(34,211,238,.08)' })); }
    svg.appendChild(mk('circle', { cx: n.x, cy: n.y, r, fill: `rgba(${isCur ? '34,211,238' : isVis ? '74,222,128' : '167,139,250'},.2)`, stroke: color, 'stroke-width': '2' }));
    svg.appendChild(mk('text', {
      x: n.x, y: n.y + 4, 'text-anchor': 'middle', fill: color, 'font-size': '12',
      'font-family': 'JetBrains Mono,monospace', 'font-weight': '700'
    }, n.id));
    const dv = s.dist[n.id];
    const bg = mk('rect', {
      x: n.x - 16, y: n.y - 30, width: 32, height: 16, rx: 4,
      fill: dv === '∞' ? 'rgba(255,255,255,.04)' : 'rgba(34,211,238,.12)',
      stroke: dv === '∞' ? 'rgba(255,255,255,.1)' : 'rgba(34,211,238,.3)', 'stroke-width': '1'
    });
    svg.appendChild(bg);
    svg.appendChild(mk('text', {
      x: n.x, y: n.y - 19, 'text-anchor': 'middle',
      fill: dv === '∞' ? 'rgba(255,255,255,.3)' : '#22d3ee', 'font-size': '10', 'font-family': 'JetBrains Mono,monospace'
    },
      dv === '∞' ? '∞' : dv));
    svg.appendChild(mk('text', {
      x: n.x, y: n.y + 26, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.3)',
      'font-size': '8', 'font-family': 'Sora,sans-serif'
    }, n.label));
  });
  document.getElementById('dijk-desc').innerHTML = s.desc;
  document.getElementById('dijk-ind').textContent = `Étape ${dStep} / ${DSTEPS.length - 1}`;
  document.getElementById('dijk-prev').disabled = dStep === 0;
  document.getElementById('dijk-next').disabled = dStep === DSTEPS.length - 1;
}
function dijkNext() { if (dStep < DSTEPS.length - 1) { dStep++; renderDijk(); } }
function dijkPrev() { if (dStep > 0) { dStep--; renderDijk(); } }
function dijkReset() { dStep = 0; renderDijk(); }
renderDijk();

// ══════════════════════════════════════════════
// N2 — BIPARTITE SVG
// ══════════════════════════════════════════════
function renderBipartite() {
  const svg = document.getElementById('bip-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const cams = [{ id: 1, y: 60, cap: 5000, c: '#3b82f6' }, { id: 2, y: 140, cap: 4000, c: '#f59e0b' }, { id: 3, y: 220, cap: 6000, c: '#00d4aa' }];
  const zones = [{ id: 1, y: 30, v: 1200, c: '#fb923c' }, { id: 2, y: 80, v: 1800, c: '#f472b6' }, { id: 3, y: 130, v: 900, c: '#a78bfa' },
  { id: 4, y: 180, v: 2100, c: '#4ade80' }, { id: 5, y: 230, v: 1500, c: '#22d3ee' }, { id: 6, y: 260, v: 1100, c: '#ef4444' }];
  // accessible pairs
  const access = [[1, 1], [1, 2], [1, 3], [1, 4], [2, 1], [2, 3], [2, 5], [3, 2], [3, 4], [3, 5], [3, 6]];
  const selected = [[1, 4], [1, 3], [2, 5], [2, 1], [3, 2], [3, 6]];
  const cx = 100, zx = 390;
  svg.appendChild(mk('text', { x: cx, y: 15, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.25)', 'font-size': '10', 'font-family': 'Sora,sans-serif', 'letter-spacing': '2' }, 'CAMIONS'));
  svg.appendChild(mk('text', { x: zx, y: 15, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.25)', 'font-size': '10', 'font-family': 'Sora,sans-serif', 'letter-spacing': '2' }, 'ZONES'));
  access.forEach(([ci, zi]) => {
    const c = cams.find(x => x.id === ci), z = zones.find(x => x.id === zi);
    const sel = selected.some(([a, b]) => a === ci && b === zi);
    svg.appendChild(mk('line', {
      x1: cx, y1: c.y, x2: zx, y2: z.y,
      stroke: sel ? '#a78bfa' : 'rgba(255,255,255,.07)',
      'stroke-width': sel ? '2' : '1', 'opacity': sel ? '0.8' : '1',
      'stroke-dasharray': sel ? '' : '3,3'
    }));
  });
  cams.forEach(c => {
    svg.appendChild(mk('rect', { x: 25, y: c.y - 18, width: 150, height: 36, rx: 8, fill: `${c.c}15`, stroke: c.c, 'stroke-width': '1.5' }));
    svg.appendChild(mk('text', { x: 100, y: c.y - 2, 'text-anchor': 'middle', fill: c.c, 'font-size': '11', 'font-family': 'Sora,sans-serif', 'font-weight': '700' }, `🚛 Camion ${c.id}`));
    svg.appendChild(mk('text', { x: 100, y: c.y + 12, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.3)', 'font-size': '9', 'font-family': 'Sora,sans-serif' }, `cap. ${c.cap}kg`));
  });
  zones.forEach(z => {
    svg.appendChild(mk('rect', { x: 340, y: z.y - 16, width: 100, height: 32, rx: 7, fill: `${z.c}15`, stroke: z.c, 'stroke-width': '1.2' }));
    svg.appendChild(mk('text', { x: zx, y: z.y - 2, 'text-anchor': 'middle', fill: z.c, 'font-size': '10', 'font-family': 'Sora,sans-serif', 'font-weight': '700' }, `Zone ${z.id}`));
    svg.appendChild(mk('text', { x: zx, y: z.y + 12, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.3)', 'font-size': '9', 'font-family': 'JetBrains Mono,monospace' }, `${z.v}kg`));
  });
}
renderBipartite();

// ══════════════════════════════════════════════
// N2 — CAPACITY
// ══════════════════════════════════════════════
let capLoad = 0, capAdded = new Set();
function addCap(id, name, kg, color) {
  if (capAdded.has(id)) return;
  capAdded.add(id);
  const future = capLoad + kg;
  const over = future > 5000;
  capLoad = over ? capLoad : future;
  const list = document.getElementById('cap-zones-list');
  const tag = document.createElement('div');
  tag.style.cssText = `padding:5px 12px;border-radius:7px;background:${color}15;border:1px solid ${color}40;font-size:11px;color:${color};font-weight:600`;
  tag.textContent = `${name} +${kg}kg`;
  list.appendChild(tag);
  const pct = Math.min(100, Math.round(capLoad / 5000 * 100));
  document.getElementById('cap-bar').style.width = pct + '%';
  document.getElementById('cap-bar').style.background = pct > 85 ? 'linear-gradient(90deg,#fb923c,#ef4444)' : 'linear-gradient(90deg,var(--n2),var(--n4))';
  document.getElementById('cap-label').textContent = `${capLoad} / 5000 kg (${pct}%)`;
  const msg = document.getElementById('cap-msg');
  if (over) { msg.style.display = 'block'; msg.style.color = '#ef4444'; msg.textContent = `❌ REFUSÉ — Ajout de ${name} (${kg}kg) dépasse la capacité ! (${capLoad}+${kg}=${capLoad + kg} > 5000)`; }
  else if (pct > 85) { msg.style.display = 'block'; msg.style.color = '#fb923c'; msg.textContent = `⚠️ Attention — Camion chargé à ${pct}% !`; }
  else { msg.style.display = 'none'; }
}
function resetCap() { capLoad = 0; capAdded = new Set(); document.getElementById('cap-zones-list').innerHTML = ''; document.getElementById('cap-bar').style.width = '0%'; document.getElementById('cap-label').textContent = '0 / 5000 kg (0%)'; document.getElementById('cap-msg').style.display = 'none'; }

// ══════════════════════════════════════════════
// N2 — GREEDY STEPPER
// ══════════════════════════════════════════════
const GZ = [{ id: 4, v: 2100, c: '#4ade80' }, { id: 2, v: 1800, c: '#f472b6' }, { id: 5, v: 1500, c: '#22d3ee' }, { id: 1, v: 1200, c: '#fb923c' }, { id: 3, v: 900, c: '#a78bfa' }, { id: 6, v: 1100, c: '#ef4444' }];
const GC = [{ id: 1, c: '#3b82f6', cap: 5000, load: 0, zones: [] }, { id: 2, c: '#f59e0b', cap: 4000, load: 0, zones: [] }, { id: 3, c: '#00d4aa', cap: 6000, load: 0, zones: [] }];
const GACCESS = { 4: [1, 3], 2: [3, 1], 5: [2, 3], 1: [1, 2, 3], 3: [1, 2], 6: [3] };
const GDESCS = [
  'Zones triées par volume décroissant. Prêt à commencer.',
  'Zone 4 (2100kg) → C1 est accessible et le moins chargé (0kg). Affectation ✓',
  'Zone 2 (1800kg) → C3 est accessible (0kg). C1 trop chargé (2100+1800=3900 &gt; 5000? non... mais C3 moins chargé). Affectation C3 ✓',
  'Zone 5 (1500kg) → C2 accessible (0kg). C3 a 1800. C2 moins chargé. Affectation C2 ✓',
  'Zone 1 (1200kg) → C1(2100kg), C2(1500kg), C3(1800kg) accessibles. C2 le moins chargé parmi eux. Affectation C2 ✓',
  'Zone 3 (900kg) → C1(2100kg), C2(2700kg) accessibles. C1 est le moins chargé. Affectation C1 ✓',
  'Zone 6 (1100kg) → Seul C3 accessible. Affectation C3 ✓ — Toutes les zones affectées !',
];
let gStep = 0, gState = null;
function greedyReset() {
  gStep = 0;
  gState = { cams: [{ id: 1, c: '#3b82f6', cap: 5000, load: 0, zones: [] }, { id: 2, c: '#f59e0b', cap: 4000, load: 0, zones: [] }, { id: 3, c: '#00d4aa', cap: 6000, load: 0, zones: [] }] };
  document.getElementById('greedy-ind').textContent = '0 / 6';
  document.getElementById('greedy-desc').textContent = GDESCS[0];
  document.getElementById('greedy-btn').disabled = false;
  renderGreedy(-1);
}
function greedyNext() {
  if (gStep >= GZ.length) return;
  const z = GZ[gStep];
  const acc = GACCESS[z.id];
  let best = null, bestLoad = Infinity;
  gState.cams.forEach(c => { if (acc.includes(c.id) && c.load + z.v <= c.cap && c.load < bestLoad) { bestLoad = c.load; best = c; } });
  if (best) { best.zones.push(z.id); best.load += z.v; }
  renderGreedy(gStep);
  document.getElementById('greedy-desc').innerHTML = GDESCS[gStep + 1] || GDESCS[GDESCS.length - 1];
  document.getElementById('greedy-ind').textContent = `${gStep + 1} / ${GZ.length}`;
  gStep++;
  if (gStep >= GZ.length) document.getElementById('greedy-btn').disabled = true;
}
function renderGreedy(hi) {
  const svg = document.getElementById('greedy-svg');
  if (!svg) return;
  svg.innerHTML = '';
  if (!gState) gState = { cams: [{ id: 1, c: '#3b82f6', cap: 5000, load: 0, zones: [] }, { id: 2, c: '#f59e0b', cap: 4000, load: 0, zones: [] }, { id: 3, c: '#00d4aa', cap: 6000, load: 0, zones: [] }] };
  const cx = [120, 250, 380];
  gState.cams.forEach((c, i) => {
    const pct = Math.round(c.load / c.cap * 100);
    svg.appendChild(mk('rect', { x: cx[i] - 55, y: 18, width: 110, height: 46, rx: 8, fill: `${c.c}12`, stroke: c.c, 'stroke-width': '1.5' }));
    svg.appendChild(mk('text', { x: cx[i], y: 36, 'text-anchor': 'middle', fill: c.c, 'font-size': '10', 'font-family': 'Sora,sans-serif', 'font-weight': '700' }, `🚛 Camion ${c.id}`));
    svg.appendChild(mk('text', { x: cx[i], y: 52, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.4)', 'font-size': '9', 'font-family': 'JetBrains Mono,monospace' }, `${c.load}/${c.cap}kg (${pct}%)`));
    const bx = cx[i] - 45, bw = 90;
    svg.appendChild(mk('rect', { x: bx, y: 58, width: bw, height: 6, rx: 3, fill: 'rgba(255,255,255,.06)' }));
    svg.appendChild(mk('rect', { x: bx, y: 58, width: Math.round(bw * pct / 100), height: 6, rx: 3, fill: c.c }));
    c.zones.forEach((zid, zi) => {
      const z = GZ.find(x => x.id === zid);
      const zy = 80 + zi * 28;
      svg.appendChild(mk('rect', { x: cx[i] - 45, y: zy, width: 90, height: 22, rx: 5, fill: `${z.c}18`, stroke: z.c, 'stroke-width': '1' }));
      svg.appendChild(mk('text', { x: cx[i], y: zy + 14, 'text-anchor': 'middle', fill: z.c, 'font-size': '9', 'font-family': 'Sora,sans-serif' }, `Z${zid} ${z.v}kg`));
    });
  });
  if (hi >= 0 && hi < GZ.length) {
    const z = GZ[hi];
    svg.appendChild(mk('text', { x: 250, y: 220, 'text-anchor': 'middle', fill: '#22d3ee', 'font-size': '11', 'font-family': 'Sora,sans-serif', 'font-weight': '600' }, `→ Affectation : Zone ${z.id} (${z.v}kg)`));
  }
}
greedyReset();

// ══════════════════════════════════════════════
// N3 — TRIPARTITE
// ══════════════════════════════════════════════
function renderTripartite() {
  const svg = document.getElementById('trip-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const cams = [{ id: 1, y: 60, c: '#3b82f6' }, { id: 2, y: 140, c: '#f59e0b' }, { id: 3, y: 220, c: '#00d4aa' }];
  const zones = [{ id: 1, y: 35, c: '#fb923c' }, { id: 2, y: 80, c: '#f472b6' }, { id: 3, y: 125, c: '#a78bfa' }, { id: 4, y: 175, c: '#4ade80' }, { id: 5, y: 225, c: '#22d3ee' }, { id: 6, y: 265, c: '#ef4444' }];
  const slots = [{ t: 'L 06-08', y: 35, cong: 1.0, c: '#4ade80' }, { t: 'L 08-10', y: 72, cong: 1.4, c: '#f59e0b' }, { t: 'L 10-12', y: 109, cong: 1.1, c: '#22d3ee' }, { t: 'M 06-08', y: 150, cong: 1.0, c: '#4ade80' }, { t: 'M 10-12', y: 187, cong: 1.1, c: '#22d3ee' }, { t: 'J 08-10', y: 224, cong: 1.2, c: '#fb923c' }, { t: 'V 06-08', y: 261, cong: 1.0, c: '#4ade80' }];
  const cx = 80, zx = 240, sx = 400;
  svg.appendChild(mk('text', { x: cx, y: 14, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.2)', 'font-size': '9', 'font-family': 'Sora,sans-serif', 'letter-spacing': '1.5' }, 'CAMIONS'));
  svg.appendChild(mk('text', { x: zx, y: 14, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.2)', 'font-size': '9', 'font-family': 'Sora,sans-serif', 'letter-spacing': '1.5' }, 'ZONES'));
  svg.appendChild(mk('text', { x: sx, y: 14, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.2)', 'font-size': '9', 'font-family': 'Sora,sans-serif', 'letter-spacing': '1.5' }, 'CRÉNEAUX'));
  // selected connections
  const selCZ = [[1, 4], [1, 3], [2, 5], [2, 1], [3, 2], [3, 6]];
  const selZT = [[4, 0], [3, 2], [5, 3], [1, 3], [2, 4], [6, 5]];
  selCZ.forEach(([ci, zi]) => {
    const c = cams.find(x => x.id === ci), z = zones.find(x => x.id === zi);
    svg.appendChild(mk('line', { x1: cx, y1: c.y, x2: zx, y2: z.y, stroke: c.c, 'stroke-width': '1.5', opacity: '.5' }));
  });
  selZT.forEach(([zi, si]) => {
    const z = zones.find(x => x.id === zi), s = slots[si];
    if (!z || !s) return;
    svg.appendChild(mk('line', { x1: zx, y1: z.y, x2: sx, y2: s.y, stroke: 'rgba(255,255,255,.1)', 'stroke-width': '1', 'stroke-dasharray': '3,3' }));
  });
  cams.forEach(c => {
    svg.appendChild(mk('rect', { x: 20, y: c.y - 15, width: 120, height: 30, rx: 7, fill: `${c.c}12`, stroke: c.c, 'stroke-width': '1.5' }));
    svg.appendChild(mk('text', { x: cx, y: c.y + 4, 'text-anchor': 'middle', fill: c.c, 'font-size': '10', 'font-family': 'Sora,sans-serif', 'font-weight': '700' }, `🚛 Camion ${c.id}`));
  });
  zones.forEach(z => {
    svg.appendChild(mk('rect', { x: 195, y: z.y - 14, width: 90, height: 28, rx: 6, fill: `${z.c}12`, stroke: z.c, 'stroke-width': '1' }));
    svg.appendChild(mk('text', { x: zx, y: z.y + 4, 'text-anchor': 'middle', fill: z.c, 'font-size': '10', 'font-family': 'Sora,sans-serif' }, `Zone ${z.id}`));
  });
  slots.forEach(s => {
    svg.appendChild(mk('rect', { x: 362, y: s.y - 13, width: 80, height: 26, rx: 5, fill: `${s.c}12`, stroke: s.c, 'stroke-width': '1' }));
    svg.appendChild(mk('text', { x: sx, y: s.y, 'text-anchor': 'middle', fill: s.c, 'font-size': '9', 'font-family': 'JetBrains Mono,monospace' }, s.t));
    svg.appendChild(mk('text', { x: sx, y: s.y + 10, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.3)', 'font-size': '8', 'font-family': 'JetBrains Mono,monospace' }, `×${s.cong}`));
  });
}
renderTripartite();

// ══════════════════════════════════════════════
// N4 — NEAREST NEIGHBOR
// ══════════════════════════════════════════════
const PTS = [{ id: 0, x: 0, y: 0, n: 'D' }, { id: 1, x: 2.5, y: 3.1, n: '1' }, { id: 2, x: 5.2, y: 4.8, n: '2' }, { id: 3, x: 7.8, y: 1.2, n: '3' }, { id: 4, x: 3.0, y: 7.5, n: '4' }, { id: 5, x: 6.5, y: 6.0, n: '5' }, { id: 6, x: 9.0, y: 4.5, n: '6' }, { id: 7, x: 1.0, y: 5.5, n: '7' }, { id: 8, x: 4.5, y: 2.0, n: '8' }, { id: 9, x: 8.5, y: 8.0, n: '9' }];
const MAT = [[0, 3.98, 8.18, 8.32, 8.41, 9.95, 11.83, 5.59, 4.92, 12.78], [3.98, 0, 4.2, 8.64, 4.43, 5.97, 8.01, 2.83, 8.91, 8.8], [8.18, 4.2, 0, 4.44, 5.58, 1.77, 3.81, 7.03, 7.84, 4.6], [8.32, 8.64, 4.44, 0, 10.02, 6.21, 3.51, 11.47, 3.4, 7.05], [8.41, 4.43, 5.58, 10.02, 0, 3.81, 6.72, 7.26, 13.34, 6.64], [9.95, 5.97, 1.77, 6.21, 3.81, 0, 2.92, 8.8, 9.61, 2.83], [11.83, 8.01, 3.81, 3.51, 6.72, 2.92, 0, 10.84, 6.91, 3.54], [5.59, 2.83, 7.03, 11.47, 7.26, 8.8, 10.84, 0, 10.51, 11.63], [4.92, 8.91, 7.84, 3.4, 13.34, 9.61, 6.91, 10.51, 0, 10.44], [12.78, 8.8, 4.6, 7.05, 6.64, 2.83, 3.54, 11.63, 10.44, 0]];
let nnStep = 0, nnTour = [0], nnLeft = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
function nnReset() { nnStep = 0; nnTour = [0]; nnLeft = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]); document.getElementById('nn-ind').textContent = '0 / 9'; document.getElementById('nn-desc').textContent = 'Départ depuis le dépôt (0). On va toujours au point non-visité le plus proche.'; document.getElementById('nn-btn').disabled = false; renderNN(); }
function nnNext() {
  if (nnLeft.size === 0) return;
  const cur = nnTour[nnTour.length - 1];
  let best = null, bestD = Infinity;
  nnLeft.forEach(p => { if (MAT[cur][p] < bestD) { bestD = MAT[cur][p]; best = p; } });
  nnTour.push(best); nnLeft.delete(best); nnStep++;
  const next = nnLeft.size > 0 ? [...nnLeft].reduce((a, b) => MAT[best][a] < MAT[best][b] ? a : b) : null;
  document.getElementById('nn-desc').innerHTML = nnLeft.size === 0 ? `<strong>Tournée complète !</strong> Retour au dépôt. Distance totale ≈ ${tourDist([...nnTour, 0]).toFixed(1)} km.` :
    `<strong>Étape ${nnStep} :</strong> Depuis ${PTS[cur].n}, le plus proche non-visité est le point <strong>${best}</strong> (${bestD.toFixed(2)} km). Prochaine cible probable : ${next !== null ? next : '—'}`;
  document.getElementById('nn-ind').textContent = `${nnStep} / 9`;
  if (nnLeft.size === 0) document.getElementById('nn-btn').disabled = true;
  renderNN();
}
function tourDist(t) { let d = 0; for (let i = 0; i < t.length - 1; i++)d += MAT[t[i]][t[i + 1]]; return d; }
function renderNN() {
  const svg = document.getElementById('nn-svg');
  if (!svg) return;
  svg.innerHTML = '';
  // grid
  for (let x = 0; x <= 10; x++)svg.appendChild(mk('line', { x1: x, y1: 0, x2: x, y2: 10, stroke: 'rgba(255,255,255,.03)', 'stroke-width': '0.04' }));
  for (let y = 0; y <= 10; y++)svg.appendChild(mk('line', { x1: 0, y1: y, x2: 10, y2: y, stroke: 'rgba(255,255,255,.03)', 'stroke-width': '0.04' }));
  // tour edges
  const tourFull = nnLeft.size === 0 ? [...nnTour, 0] : nnTour;
  for (let i = 0; i < tourFull.length - 1; i++) {
    const a = PTS[tourFull[i]], b = PTS[tourFull[i + 1]];
    svg.appendChild(mk('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#4ade80', 'stroke-width': '0.12', opacity: '0.8' }));
  }
  // current dashes to unvisited
  if (nnTour.length > 0 && nnLeft.size > 0) {
    const cur = PTS[nnTour[nnTour.length - 1]];
    nnLeft.forEach(p => {
      const t = PTS[p];
      svg.appendChild(mk('line', { x1: cur.x, y1: cur.y, x2: t.x, y2: t.y, stroke: 'rgba(255,255,255,.05)', 'stroke-width': '0.05', 'stroke-dasharray': '0.15,0.1' }));
    });
  }
  // nodes
  PTS.forEach(p => {
    const isDepot = p.id === 0, inTour = nnTour.includes(p.id), isCur = nnTour[nnTour.length - 1] === p.id;
    const color = isDepot ? '#22d3ee' : isCur ? '#f472b6' : inTour ? '#4ade80' : '#5a6680';
    const r = isDepot ? 0.38 : isCur ? 0.32 : 0.25;
    if (isCur) svg.appendChild(mk('circle', { cx: p.x, cy: p.y, r: '0.5', fill: 'rgba(244,114,182,.12)' }));
    svg.appendChild(mk('circle', { cx: p.x, cy: p.y, r, fill: `rgba(${isDepot ? '34,211,238' : isCur ? '244,114,182' : inTour ? '74,222,128' : '90,102,128'},.2)`, stroke: color, 'stroke-width': '0.06' }));
    svg.appendChild(mk('text', { x: p.x, y: p.y - 0.42, 'text-anchor': 'middle', fill: color, 'font-size': '0.35', 'font-family': 'Sora,sans-serif', 'font-weight': '700' }, p.n));
  });
}
nnReset();

// ══════════════════════════════════════════════
// N4 — 2-OPT
// ══════════════════════════════════════════════
let twoOptShown = false;
const BEFORE_NODES = [{ x: 80, y: 80 }, { x: 200, y: 40 }, { x: 350, y: 60 }, { x: 420, y: 150 }, { x: 300, y: 180 }, { x: 150, y: 160 }];
const BEFORE_TOUR = [0, 1, 4, 2, 3, 5, 0];
const AFTER_TOUR = [0, 1, 2, 3, 4, 5, 0];
function renderTwoOpt(after) {
  const svg = document.getElementById('twoopt-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const tour = after ? AFTER_TOUR : BEFORE_TOUR;
  const col = after ? '#4ade80' : '#fb923c';
  // crossing highlight
  if (!after) {
    svg.appendChild(mk('rect', { x: 150, y: 50, width: 160, height: 130, rx: 8, fill: 'rgba(239,68,68,.06)', stroke: 'rgba(239,68,68,.2)', 'stroke-width': '1', 'stroke-dasharray': '4,3' }));
    svg.appendChild(mk('text', { x: 230, y: 200, 'text-anchor': 'middle', fill: '#ef4444', 'font-size': '10', 'font-family': 'Sora,sans-serif' }, 'Croisement détecté → 2-opt va l\'éliminer'));
  } else {
    svg.appendChild(mk('text', { x: 230, y: 200, 'text-anchor': 'middle', fill: '#4ade80', 'font-size': '10', 'font-family': 'Sora,sans-serif' }, '✓ Croisement éliminé — distance réduite'));
  }
  for (let i = 0; i < tour.length - 1; i++) {
    const a = BEFORE_NODES[tour[i]], b = BEFORE_NODES[tour[i + 1]];
    svg.appendChild(mk('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: col, 'stroke-width': after ? '2.5' : '1.8', opacity: after ? '0.85' : '0.7' }));
  }
  BEFORE_NODES.forEach((p, i) => {
    const c = i === 0 ? '#22d3ee' : col;
    svg.appendChild(mk('circle', { cx: p.x, cy: p.y, r: i === 0 ? '13' : '10', fill: `rgba(${i === 0 ? '34,211,238' : after ? '74,222,128' : '251,146,60'},.15)`, stroke: c, 'stroke-width': '2' }));
    svg.appendChild(mk('text', { cx: p.x, y: p.y + 4, 'text-anchor': 'middle', fill: c, 'font-size': '11', 'font-family': 'JetBrains Mono,monospace', 'font-weight': '700', x: p.x }, i === 0 ? 'D' : i));
  });
  document.getElementById('twoopt-desc').textContent = after ? 'Après 2-opt : les arêtes qui se croisaient ont été inversées → distance totale réduite.' : 'Tournée initiale avec un croisement entre deux arêtes → 2-opt peut améliorer ça.';
}
function twoOptShow() { twoOptShown = true; renderTwoOpt(true); document.getElementById('twoopt-btn').classList.remove('primary'); }
function twoOptReset() { twoOptShown = false; renderTwoOpt(false); document.getElementById('twoopt-btn').classList.add('primary'); }
renderTwoOpt(false);

// ══════════════════════════════════════════════
// N5 — SENSOR
// ══════════════════════════════════════════════
let sHour = 6;
const SENSORS = [{ id: 1, n: 'Q.Nord', level: 45, rate: 4.5 }, { id: 2, n: 'Centre', level: 70, rate: 6 }, { id: 3, n: 'Z.Ind.', level: 30, rate: 3 }, { id: 4, n: 'Q.Est', level: 85, rate: 5 }, { id: 5, n: 'Z.Comm.', level: 55, rate: 4 }];
function sensorReset() { sHour = 6; SENSORS.forEach((s, i) => { s.level = [45, 70, 30, 85, 55][i]; }); renderSensors(); }
function sensorTick() {
  sHour++;
  if (sHour > 20) return;
  SENSORS.forEach(s => { s.level = Math.min(100, s.level + s.rate + (Math.random() * 1 - 0.5)); });
  renderSensors();
}
function renderSensors() {
  const svg = document.getElementById('sensor-svg');
  if (!svg) return;
  svg.innerHTML = '';
  document.getElementById('sensor-time').textContent = `${String(sHour).padStart(2, '0')}:00`;
  const W = 460, H = 180, bh = 80, bw = 60, by = 60;
  SENSORS.forEach((s, i) => {
    const x = 40 + i * 90;
    const lvl = Math.round(s.level);
    const urgent = lvl >= 90, alert = lvl >= 80;
    const c = urgent ? '#ef4444' : alert ? '#fb923c' : '#4ade80';
    const fh = Math.round(bh * lvl / 100);
    // container outline
    svg.appendChild(mk('rect', { x, y: by, width: bw, height: bh, rx: 5, fill: 'rgba(255,255,255,.04)', stroke: c, 'stroke-width': '1.5' }));
    // fill
    svg.appendChild(mk('rect', { x: x + 1, y: by + bh - fh + 1, width: bw - 2, height: fh - 2, rx: 4, fill: `${c}30` }));
    // level line
    svg.appendChild(mk('line', { x1: x, y1: by + bh - fh, x2: x + bw, y2: by + bh - fh, stroke: c, 'stroke-width': '2' }));
    // pct label inside
    svg.appendChild(mk('text', { x: x + bw / 2, y: by + bh / 2 + 4, 'text-anchor': 'middle', fill: c, 'font-size': '13', 'font-family': 'JetBrains Mono,monospace', 'font-weight': '700' }, `${lvl}%`));
    // thresholds
    svg.appendChild(mk('line', { x1: x - 3, y1: by + bh * 0.1, x2: x + bw + 3, y2: by + bh * 0.1, stroke: 'rgba(239,68,68,.4)', 'stroke-width': '0.8', 'stroke-dasharray': '2,2' }));
    svg.appendChild(mk('line', { x1: x - 3, y1: by + bh * 0.2, x2: x + bw + 3, y2: by + bh * 0.2, stroke: 'rgba(251,146,60,.35)', 'stroke-width': '0.8', 'stroke-dasharray': '2,2' }));
    // name
    svg.appendChild(mk('text', { x: x + bw / 2, y: by + bh + 16, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.4)', 'font-size': '9', 'font-family': 'Sora,sans-serif' }, s.n));
    // status
    const st = urgent ? '🚨' : alert ? '⚠️' : '✓';
    svg.appendChild(mk('text', { x: x + bw / 2, y: by - 8, 'text-anchor': 'middle', fill: c, 'font-size': '11' }, st));
  });
  // legend
  svg.appendChild(mk('line', { x1: 10, y1: by + bh * 0.1, x2: 28, y2: by + bh * 0.1, stroke: 'rgba(239,68,68,.5)', 'stroke-width': '1', 'stroke-dasharray': '2,2' }));
  svg.appendChild(mk('text', { x: 32, y: by + bh * 0.1 + 4, fill: 'rgba(255,255,255,.3)', 'font-size': '9', 'font-family': 'Sora,sans-serif' }, '90% urgence'));
  svg.appendChild(mk('line', { x1: 10, y1: by + bh * 0.2, x2: 28, y2: by + bh * 0.2, stroke: 'rgba(251,146,60,.4)', 'stroke-width': '1', 'stroke-dasharray': '2,2' }));
  svg.appendChild(mk('text', { x: 32, y: by + bh * 0.2 + 4, fill: 'rgba(255,255,255,.3)', 'font-size': '9', 'font-family': 'Sora,sans-serif' }, '80% alerte'));
  const urgCount = SENSORS.filter(s => s.level >= 90).length;
  document.getElementById('sensor-desc').textContent = urgCount > 0 ? `⚡ ${urgCount} capteur(s) en URGENCE ! Replanification automatique déclenchée.` : `Heure: ${sHour}h. Tous les capteurs en dessous du seuil critique.`;
}
renderSensors();

// ══════════════════════════════════════════════
// N5 — PARETO
// ══════════════════════════════════════════════
let paretoSols = [];
function domines(a, b) { return a.cost <= b.cost && a.co2 <= b.co2 && (a.cost < b.cost || a.co2 < b.co2); }
function addPareto() {
  paretoSols.push({ cost: 60 + Math.random() * 80, co2: 15 + Math.random() * 40 });
  updatePareto();
}
function addManyPareto() { for (let i = 0; i < 10; i++)paretoSols.push({ cost: 60 + Math.random() * 80, co2: 15 + Math.random() * 40 }); updatePareto(); }
function resetPareto() { paretoSols = []; updatePareto(); }
function updatePareto() {
  paretoSols.forEach(a => {
    a.dominated = paretoSols.some(b => b !== a && domines(b, a));
  });
  renderParetoSvg();
  document.getElementById('pareto-count').textContent = `${paretoSols.length} solutions (${paretoSols.filter(s => !s.dominated).length} non-dominées)`;
  const front = paretoSols.filter(s => !s.dominated).length;
  document.getElementById('pareto-desc').innerHTML = paretoSols.length === 0 ? 'Ajoutez des solutions pour voir le front de Pareto se former.' :
    `<strong>${front} solutions non-dominées</strong> (vertes) forment le front de Pareto. <strong>${paretoSols.length - front} solutions</strong> sont dominées (grises). Le front représente les meilleurs compromis possibles.`;
}
function renderParetoSvg() {
  const svg = document.getElementById('pareto-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const ml = 55, mt = 18, mr = 18, mb = 38, W = 480, H = 222;
  svg.appendChild(mk('line', { x1: ml, y1: mt, x2: ml, y2: H - mb, stroke: 'rgba(255,255,255,.15)', 'stroke-width': '1.5' }));
  svg.appendChild(mk('line', { x1: ml, y1: H - mb, x2: W - mr, y2: H - mb, stroke: 'rgba(255,255,255,.15)', 'stroke-width': '1.5' }));
  svg.appendChild(mk('text', { x: (ml + W - mr) / 2, y: H - 6, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.3)', 'font-size': '10', 'font-family': 'Sora,sans-serif' }, 'Coût total (€) →'));
  svg.appendChild(mk('text', { x: 14, y: (mt + H - mb) / 2, 'text-anchor': 'middle', fill: 'rgba(255,255,255,.3)', 'font-size': '10', 'font-family': 'Sora,sans-serif', transform: `rotate(-90,14,${(mt + H - mb) / 2})` }, 'CO2 (kg) →'));
  if (!paretoSols.length) return;
  const costs = paretoSols.map(s => s.cost), co2s = paretoSols.map(s => s.co2);
  const minC = Math.min(...costs) - 5, maxC = Math.max(...costs) + 5;
  const minCo = Math.min(...co2s) - 3, maxCo = Math.max(...co2s) + 3;
  const px = s => (ml + (s.cost - minC) / (maxC - minC) * (W - ml - mr));
  const py = s => (mt + (s.co2 - minCo) / (maxCo - minCo) * (H - mb - mt));
  // Pareto front line
  const front = paretoSols.filter(s => !s.dominated).sort((a, b) => a.cost - b.cost);
  if (front.length > 1) {
    const pts = front.map(s => `${px(s)},${py(s)}`).join(' ');
    svg.appendChild(mk('polyline', { points: pts, fill: 'none', stroke: '#4ade80', 'stroke-width': '1.5', opacity: '.4', 'stroke-dasharray': '5,3' }));
  }
  // Draw all points
  paretoSols.forEach(s => {
    const x = px(s), y = py(s);
    if (isNaN(x) || isNaN(y)) return;
    if (!s.dominated) svg.appendChild(mk('circle', { cx: x, cy: y, r: '8', fill: 'rgba(74,222,128,.1)' }));
    svg.appendChild(mk('circle', { cx: x, cy: y, r: s.dominated ? '4' : '6', fill: s.dominated ? 'rgba(90,102,128,.5)' : 'rgba(74,222,128,.9)', stroke: s.dominated ? '#5a6680' : '#4ade80', 'stroke-width': '1.5' }));
  });
  // legend
  svg.appendChild(mk('circle', { cx: ml + 6, cy: mt + 10, r: '5', fill: 'rgba(74,222,128,.9)', stroke: '#4ade80', 'stroke-width': '1.5' }));
  svg.appendChild(mk('text', { x: ml + 15, y: mt + 14, fill: 'rgba(255,255,255,.4)', 'font-size': '10', 'font-family': 'Sora,sans-serif' }, `Non-dominées (${front.length})`));
  svg.appendChild(mk('circle', { cx: ml + 6, cy: mt + 26, r: '4', fill: 'rgba(90,102,128,.5)', stroke: '#5a6680', 'stroke-width': '1.5' }));
  svg.appendChild(mk('text', { x: ml + 15, y: mt + 30, fill: 'rgba(255,255,255,.4)', 'font-size': '10', 'font-family': 'Sora,sans-serif' }, `Dominées (${paretoSols.filter(s => s.dominated).length})`));
}
renderParetoSvg();

// Init open first level
toggleLevel('l1', document.querySelector('.level-header'));

// Quiz pour la nouvelle section méthodes manquantes
function initQuizMC() {
  document.querySelectorAll('.quiz-opt').forEach(opt => {
    if (!opt.getAttribute('data-bound')) {
      opt.setAttribute('data-bound', '1');
    }
  });
}
initQuizMC();
