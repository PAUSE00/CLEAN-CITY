// ═══════════════════════════════════════════════════════════
// GLOBAL APP VARIABLES (Populated Async from PHP Backend)
// ═══════════════════════════════════════════════════════════
let POINTS = [];
let EDGES = [];
let MATRIX = [];
let CAMIONS = [];
let ZONES = [];
let PLANNING = {};
let SENSORS = [];

const VRP_TOURS_INIT = [[0, 1, 7, 2, 5, 9, 6, 3, 8, 4, 0]];
let VRP_TOURS_OPT = []; // Fetched dynamically
const TOUR_COLORS = ['#3b82f6', '#f59e0b', '#00d4aa'];

// ═══════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    const idx = ['overview', 'graphe', 'affectation', 'temporal', 'vrp', 'dynamic'].indexOf(name);
    if (idx !== -1 && document.querySelectorAll('.nav-btn')[idx]) {
        document.querySelectorAll('.nav-btn')[idx].classList.add('active');
    }
    if (name === 'graphe') { renderMap(); renderMatrix(); updatePath(); }
    if (name === 'affectation') { renderBipartite(); renderTrucks(); }
    if (name === 'temporal') { renderTimeline(); renderTripartite(); }
    if (name === 'vrp') { showVRP('opt'); renderGantt(); setTimeout(() => { const el2 = document.getElementById('bar-2opt'); if (el2) el2.style.width = '75.8%'; const elTabou = document.getElementById('bar-tabou'); if (elTabou) elTabou.style.width = '75.8%'; }, 200); }
    if (name === 'dynamic') { renderIoT(); renderPareto(); }
    if (name === 'carte') { renderRealMap(); }
    if (name === 'overview') { setTimeout(() => { ['bar1', 'bar2', 'bar3', 'bar4'].forEach(id => { const el = document.getElementById(id); if (el) { const w = el.style.width; el.style.width = '0'; setTimeout(() => el.style.width = w, 100); } }); }, 200); }
}

// ═══════════════════════════════════════════════════════════
// HELPER: SVG
// ═══════════════════════════════════════════════════════════
function svg(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

// ═══════════════════════════════════════════════════════════
// N6 — CARTE GEOGRAPHIQUE (Leaflet + OSRM)
// ═══════════════════════════════════════════════════════════
let realMapInstance = null;
let mapLayers = [];

async function renderRealMap() {
    if (!document.getElementById('real-map')) return;

    // Initialize map if not yet created (Center on Agadir)
    if (!realMapInstance) {
        realMapInstance = L.map('real-map').setView([30.4277, -9.5981], 13);

        // CartoDB Dark Matter tiles to fit our dark UI
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(realMapInstance);
    }

    // Clear old layers
    mapLayers.forEach(l => realMapInstance.removeLayer(l));
    mapLayers = [];

    const legendEl = document.getElementById('real-map-legend');
    if (legendEl) legendEl.innerHTML = '';

    // Draw Markers
    POINTS.forEach(p => {
        if (!p.lat || !p.lng) return;
        const isDepot = p.id === 0;
        const color = isDepot ? '#00d4aa' : '#3b82f6';

        // Custom dot marker
        const markerHtml = `<div style="width:14px;height:14px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 10px ${color}"></div>`;
        const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [14, 14], iconAnchor: [7, 7] });

        const m = L.marker([p.lat, p.lng], { icon }).bindPopup(`<b>${p.nom}</b><br>ID: ${p.id}`).addTo(realMapInstance);
        mapLayers.push(m);
    });

    // Fetch and Draw Routes using OSRM
    const osrmBase = 'https://router.project-osrm.org/route/v1/driving/';

    for (let i = 0; i < VRP_TOURS_OPT.length; i++) {
        const route = VRP_TOURS_OPT[i];
        if (route.length < 2) continue;

        const color = TOUR_COLORS[i % TOUR_COLORS.length];

        // Build coordinate string: "lng,lat;lng,lat;..."
        const coordsStr = route.map(pid => {
            const pt = POINTS.find(p => p.id === pid);
            return `${pt.lng},${pt.lat}`;
        }).join(';');

        try {
            const reqUrl = `${osrmBase}${coordsStr}?overview=full&geometries=geojson`;
            const res = await fetch(reqUrl).then(r => r.json());

            if (res.code === 'Ok' && res.routes.length > 0) {
                const geojson = res.routes[0].geometry; // Array of [lng, lat]
                const latLngs = geojson.coordinates.map(c => [c[1], c[0]]); // Swap to [lat, lng] for Leaflet

                const polyline = L.polyline(latLngs, {
                    color: color,
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(realMapInstance);

                mapLayers.push(polyline);

                // Add legend entry
                if (legendEl) {
                    const distKm = (res.routes[0].distance / 1000).toFixed(1);
                    const durMin = Math.round(res.routes[0].duration / 60);
                    legendEl.innerHTML += `
                        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,0.03);border-radius:6px;">
                            <div style="width:16px;height:4px;background:${color};border-radius:2px"></div>
                            <div style="font-weight:700;color:${color}">Camion ${i + 1}</div>
                            <div style="color:var(--muted);font-size:12px;margin-left:auto">${distKm} km • ${durMin} min</div>
                        </div>
                    `;
                }
            }
        } catch (e) {
            console.error('OSRM Fetch Error for Route ' + i, e);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// N1 — MAP
// ═══════════════════════════════════════════════════════════
function renderMap(highlightPath = []) {
    const s = document.getElementById('map-svg');
    if (!s) return;
    s.innerHTML = '';
    // Defs
    const defs = svg('defs');
    const filter = svg('filter', { id: 'glow' });
    const feGaussianBlur = svg('feGaussianBlur', { stdDeviation: '0.15', result: 'coloredBlur' });
    const feMerge = svg('feMerge');
    const feMergeNode1 = svg('feMergeNode', { in: 'coloredBlur' });
    const feMergeNode2 = svg('feMergeNode', { in: 'SourceGraphic' });
    feMerge.appendChild(feMergeNode1); feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussianBlur); filter.appendChild(feMerge);
    defs.appendChild(filter); s.appendChild(defs);

    // Grid
    const grid = svg('g', { opacity: '0.3' });
    for (let x = 0; x <= 10; x++) grid.appendChild(svg('line', { x1: x, y1: -0.5, x2: x, y2: 10, stroke: 'rgba(255,255,255,0.05)', 'stroke-width': '0.05' }));
    for (let y = 0; y <= 10; y++) grid.appendChild(svg('line', { x1: -0.5, y1: y, x2: 10, y2: y, stroke: 'rgba(255,255,255,0.05)', 'stroke-width': '0.05' }));
    s.appendChild(grid);

    // Edges
    EDGES.forEach(([a, b]) => {
        const pa = POINTS[a], pb = POINTS[b];
        const inPath = highlightPath.some((p, i) => highlightPath[i + 1] !== undefined && ((p === a && highlightPath[i + 1] === b) || (p === b && highlightPath[i + 1] === a)));
        const line = svg('line', {
            x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y,
            stroke: inPath ? '#00d4aa' : 'rgba(255,255,255,0.12)',
            'stroke-width': inPath ? '0.12' : '0.06',
        });
        if (inPath) line.setAttribute('filter', 'url(#glow)');
        s.appendChild(line);
    });

    // Nodes
    POINTS.forEach(p => {
        const isDepot = p.id === 0;
        const inPath = highlightPath.includes(p.id);
        const g = svg('g', { class: 'map-node', transform: `translate(${p.x},${p.y})` });

        if (inPath && !isDepot) {
            const pulse = svg('circle', { r: '0.35', fill: 'rgba(0,212,170,0.15)' });
            g.appendChild(pulse);
        }

        const circle = svg('circle', {
            r: isDepot ? '0.45' : '0.3',
            fill: isDepot ? '#00d4aa' : (inPath ? '#00d4aa' : '#3b82f6'),
            stroke: inPath ? '#00d4aa' : 'rgba(255,255,255,0.2)',
            'stroke-width': '0.06',
        });
        const label = svg('text', {
            x: '0', y: '-0.5', 'text-anchor': 'middle',
            fill: 'rgba(255,255,255,0.8)', 'font-size': '0.35', 'font-family': 'DM Sans,sans-serif'
        });
        label.textContent = p.id === 0 ? '⬤ Dépôt' : `${p.id}`;
        g.appendChild(circle); g.appendChild(label);
        g.addEventListener('mouseover', () => { circle.setAttribute('r', isDepot ? '0.55' : '0.4'); });
        g.addEventListener('mouseout', () => { circle.setAttribute('r', isDepot ? '0.45' : '0.3'); });
        s.appendChild(g);
    });
}

// ═══════════════════════════════════════════════════════════
// N1 — MATRIX
// ═══════════════════════════════════════════════════════════
function renderMatrix() {
    const t = document.getElementById('matrix-table');
    if (!t) return;
    const maxVal = Math.max(...MATRIX.flat().filter(v => v > 0));
    let html = '<thead><tr><th>—</th>';
    POINTS.forEach(p => html += `<th>${p.id}</th>`);
    html += '</tr></thead><tbody>';
    MATRIX.forEach((row, i) => {
        html += `<tr><th>${i}</th>`;
        row.forEach((v, j) => {
            let cls = '';
            if (i === j) cls = 'diag';
            else if (v < maxVal * 0.33) cls = 'heat-low';
            else if (v < maxVal * 0.66) cls = 'heat-mid';
            else cls = 'heat-high';
            html += `<td class="${cls}" onmouseover="highlightCell(${i},${j})" onmouseout="clearHighlight()">${v === 0 ? '0' : v.toFixed(1)}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';
    t.innerHTML = html;
}

function highlightCell(r, c) {
    document.querySelectorAll('.matrix td').forEach(td => td.classList.remove('hover-hi'));
    const rows = document.querySelectorAll('.matrix tbody tr');
    if (rows[r]) {
        const tds = rows[r].querySelectorAll('td');
        if (tds[c]) tds[c].classList.add('hover-hi');
    }
    updatePath(r, c);
}
function clearHighlight() {
    document.querySelectorAll('.matrix td').forEach(td => td.classList.remove('hover-hi'));
}

// ═══════════════════════════════════════════════════════════
// N1 — PATH
// ═══════════════════════════════════════════════════════════
function dijkstra(from, to) {
    const n = POINTS.length;
    const adj = Array.from({ length: n }, () => []);
    EDGES.forEach(([a, b]) => {
        const d = Math.hypot(POINTS[a].x - POINTS[b].x, POINTS[a].y - POINTS[b].y);
        adj[a].push([b, d]); adj[b].push([a, d]);
    });
    // Override with matrix
    EDGES.forEach(([a, b]) => {
        adj[a].forEach(pair => { if (pair[0] === b) pair[1] = MATRIX[a][b]; });
        adj[b].forEach(pair => { if (pair[0] === a) pair[1] = MATRIX[b][a]; });
    });

    const dist = Array(n).fill(Infinity);
    const prev = Array(n).fill(-1);
    const visited = Array(n).fill(false);
    dist[from] = 0;
    const pq = [[0, from]];

    while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]);
        const [d, u] = pq.shift();
        if (visited[u]) continue;
        visited[u] = true;
        for (const [v, w] of adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                prev[v] = u;
                pq.push([dist[v], v]);
            }
        }
    }
    const path = [];
    let cur = to;
    while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
    return { dist: dist[to], path };
}

function updatePath(from = null, to = null) {
    const selFrom = document.getElementById('sel-from');
    const selTo = document.getElementById('sel-to');
    if (!selFrom || !selTo) return;

    const f = from !== null ? from : parseInt(selFrom.value);
    const t = to !== null ? to : parseInt(selTo.value);

    const distEl = document.getElementById('path-dist');
    const nodesEl = document.getElementById('path-nodes');

    if (f === t) {
        if (distEl) distEl.textContent = '0';
        if (nodesEl) nodesEl.innerHTML = '';
        renderMap();
        return;
    }

    const { dist, path } = dijkstra(f, t);
    if (distEl) distEl.textContent = dist.toFixed(4) + ' km';

    if (nodesEl) {
        nodesEl.innerHTML = '';
        path.forEach((id, idx) => {
            const n = document.createElement('div');
            n.className = 'path-node';
            n.textContent = `${id} · ${POINTS[id].nom}`;
            nodesEl.appendChild(n);
            if (idx < path.length - 1) {
                const a = document.createElement('div');
                a.className = 'path-arrow'; a.textContent = '→';
                nodesEl.appendChild(a);
            }
        });
    }
    renderMap(path);
}

// ═══════════════════════════════════════════════════════════
// N2 — BIPARTITE
// ═══════════════════════════════════════════════════════════
function renderBipartite() {
    const s = document.getElementById('bipartite-svg');
    if (!s) return;
    s.innerHTML = '';
    const camX = 80, zoneX = 420, h = 350;
    const camY = [70, 175, 280];
    const zoneY = [40, 90, 140, 195, 250, 310];

    // Connections
    CAMIONS.forEach((c, ci) => {
        c.zones.forEach(zid => {
            const zi = ZONES.findIndex(z => z.id === zid);
            const line = svg('line', { x1: camX, y1: camY[ci], x2: zoneX, y2: zoneY[zi], stroke: c.color, 'stroke-width': '1.5', opacity: '0.6', 'class': 'bipartite-line' });
            s.appendChild(line);

            // Stagger labels based on zone index (20% to 70% of the distance) to prevent overlap completely
            const pct = 0.2 + (zi * 0.1);
            const mx = camX + (zoneX - camX) * pct;
            const my = camY[ci] + (zoneY[zi] - camY[ci]) * pct;

            const badge = svg('rect', { x: mx - 25, y: my - 10, width: 50, height: 20, rx: '6', fill: c.color, opacity: '0.15', 'class': 'bipartite-badge' });
            const badgeT = svg('text', { x: mx, y: my + 3, 'text-anchor': 'middle', fill: c.color, 'font-size': '10', 'font-family': 'Space Mono,monospace', 'font-weight': '600' });
            badgeT.textContent = ZONES[zi].vol + 'kg';
            s.appendChild(badge); s.appendChild(badgeT);
        });
    });

    // Possible but unused edges (light)
    CAMIONS.forEach((c, ci) => {
        ZONES.forEach((z, zi) => {
            if (!c.zones.includes(z.id)) {
                const accessible = (c.id === 1 && [1, 2, 3, 4].includes(z.id)) || (c.id === 2 && [1, 3, 5].includes(z.id)) || (c.id === 3 && [2, 4, 5, 6].includes(z.id));
                if (accessible) {
                    const line = svg('line', { x1: camX, y1: camY[ci], x2: zoneX, y2: zoneY[zi], stroke: 'rgba(255,255,255,0.06)', 'stroke-width': '1', 'stroke-dasharray': '4,4' });
                    s.appendChild(line);
                }
            }
        });
    });

    // Camion nodes
    CAMIONS.forEach((c, i) => {
        const g = svg('g', { class: 'bipartite-node', 'data-id': 'c' + c.id });
        const rect = svg('rect', { x: 20, y: camY[i] - 24, width: 120, height: 48, rx: '10', fill: c.color, opacity: '0.12', stroke: c.color, 'stroke-width': '1', 'class': 'b-rect' });
        const t1 = svg('text', { x: 80, y: camY[i] - 5, 'text-anchor': 'middle', fill: c.color, 'font-size': '14', 'font-family': 'DM Sans,sans-serif', 'font-weight': '700' });
        t1.textContent = c.icon + ' Camion ' + c.id;
        const t2 = svg('text', { x: 80, y: camY[i] + 13, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.4)', 'font-size': '10', 'font-family': 'DM Sans,sans-serif' });
        t2.textContent = c.cap + 'kg cap.';
        g.appendChild(rect); g.appendChild(t1); g.appendChild(t2);

        g.addEventListener('mouseover', () => {
            rect.setAttribute('opacity', '0.25');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('transform', `scale(1.05) translate(-4, ${camY[i] * -0.05})`);
        });
        g.addEventListener('mouseout', () => {
            rect.setAttribute('opacity', '0.12');
            rect.setAttribute('stroke-width', '1');
            rect.setAttribute('transform', 'scale(1) translate(0, 0)');
        });
        s.appendChild(g);
    });

    // Zone nodes
    const zoneColors = ['#f59e0b', '#ef4444', '#a855f7', '#10b981', '#06b6d4', '#f43f5e'];
    ZONES.forEach((z, i) => {
        const g = svg('g', { class: 'bipartite-node', 'data-id': 'z' + z.id });
        const rect = svg('rect', { x: 360, y: zoneY[i] - 18, width: 110, height: 36, rx: '8', fill: zoneColors[i], opacity: '0.12', stroke: zoneColors[i], 'stroke-width': '1', 'class': 'b-rect' });
        const t1 = svg('text', { x: 415, y: zoneY[i] - 2, 'text-anchor': 'middle', fill: zoneColors[i], 'font-size': '12', 'font-family': 'DM Sans,sans-serif', 'font-weight': '700' });
        t1.textContent = z.nom;
        const t2 = svg('text', { x: 415, y: zoneY[i] + 13, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.4)', 'font-size': '10', 'font-family': 'DM Sans,sans-serif' });
        t2.textContent = z.vol + ' kg';
        g.appendChild(rect); g.appendChild(t1); g.appendChild(t2);

        g.addEventListener('mouseover', () => {
            rect.setAttribute('opacity', '0.25');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('transform', `scale(1.05) translate(-10, ${zoneY[i] * -0.05})`);
        });
        g.addEventListener('mouseout', () => {
            rect.setAttribute('opacity', '0.12');
            rect.setAttribute('stroke-width', '1');
            rect.setAttribute('transform', 'scale(1) translate(0, 0)');
        });
        s.appendChild(g);
    });

    // Labels
    const lCam = svg('text', { x: 80, y: 20, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.3)', 'font-size': '11', 'font-family': 'DM Sans,sans-serif', letterSpacing: '2' });
    lCam.textContent = 'CAMIONS (C)';
    const lZone = svg('text', { x: 415, y: 20, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.3)', 'font-size': '11', 'font-family': 'DM Sans,sans-serif', letterSpacing: '2' });
    lZone.textContent = 'ZONES (Z)';
    s.appendChild(lCam); s.appendChild(lZone);
}

function renderTrucks() {
    const el = document.getElementById('truck-grid');
    if (!el) return;
    el.innerHTML = '';
    CAMIONS.forEach(c => {
        const pct = Math.round(c.charge / c.cap * 100);
        const zones_noms = c.zones.map(zid => ZONES.find(z => z.id === zid).nom).join(', ');
        el.innerHTML += `
                <div class="truck-card">
        <div class="truck-header">
          <div class="truck-icon" style="background:${c.color}20;border:1px solid ${c.color}40">${c.icon}</div>
          <div>
            <div class="truck-name" style="color:${c.color}">Camion ${c.id}</div>
            <div class="truck-zones">${zones_noms}</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:${c.color}">${pct}%</div>
            <div style="font-size:10px;color:var(--muted)">${c.charge}/${c.cap}kg</div>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${c.color}"></div></div>
      </div > `;
    });
}

// ═══════════════════════════════════════════════════════════
// N3 — TIMELINE + TRIPARTITE
// ═══════════════════════════════════════════════════════════
function renderTimeline() {
    const el = document.getElementById('timeline');
    if (!el) return;
    el.innerHTML = '';
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    const dayEmoji = ['🔵', '🟢', '🟡', '🟠', '🔴'];
    days.forEach((day, di) => {
        const slots = PLANNING[day] || [];
        const div = document.createElement('div');
        div.className = 'timeline-day';
        div.innerHTML = `<div class="timeline-day-header"> ${dayEmoji[di]} ${day.charAt(0).toUpperCase() + day.slice(1)} <span style="color:var(--muted);font-size:11px;font-weight:400;margin-left:auto"> ${slots.length} affectation(s)</span></div>`;
        const slotsDiv = document.createElement('div');
        slotsDiv.className = 'timeline-slots';
        slots.forEach(s => {
            const cam = CAMIONS.find(c => c.id === s.camion);
            const congColor = s.cong <= 1.1 ? '#00d4aa' : s.cong <= 1.3 ? '#f59e0b' : '#ef4444';
            slotsDiv.innerHTML += `
            <div class="timeline-slot">
          <div style="color:${cam.color};font-weight:600;font-size:12px">${cam.icon} C${s.camion}</div>
          <div class="slot-time">${s.debut} – ${s.fin}</div>
          <div class="slot-badge" style="background:${cam.color}15;color:${cam.color}">Zone ${s.zone}</div>
          <div class="cong-bar"><div class="cong-fill" style="width:${(s.cong - 1) * 200}%;background:${congColor}"></div></div>
          <div style="font-size:10px;color:${congColor};min-width:30px">×${s.cong}</div>
        </div > `;
        });
        div.appendChild(slotsDiv);
        el.appendChild(div);
    });
}

function renderTripartite() {
    const s = document.getElementById('tripartite-svg');
    if (!s) return;
    s.innerHTML = '';
    const cols = { cam: 60, zone: 230, slot: 420 };
    const camY = [60, 130, 200], zoneY = [40, 90, 140, 195, 250, 310], slotY = [40, 100, 160, 220, 280, 330, 380, 420, 460];
    const camC = ['#3b82f6', '#f59e0b', '#00d4aa'];
    const slotTimes = ['L 06-08', 'L 08-10', 'L 10-12', 'L 14-16', 'M 06-08', 'M 08-10', 'Me 10-12', 'J 08-10', 'V 06-08'];

    // C→Z edges
    CAMIONS.forEach((c, ci) => {
        c.zones.forEach(zid => {
            const zi = ZONES.findIndex(z => z.id === zid);
            s.appendChild(svg('line', { x1: cols.cam, y1: camY[ci], x2: cols.zone, y2: zoneY[zi], stroke: c.color, 'stroke-width': '1.2', opacity: '0.4' }));
        });
    });
    // Z→Slot edges (sample)
    [[0, 0], [0, 2], [1, 2], [2, 2], [3, 0], [3, 2], [4, 0], [4, 4], [5, 0], [5, 6]].forEach(([zi, si]) => {
        if (si < slotY.length) s.appendChild(svg('line', { x1: cols.zone, y1: zoneY[zi], x2: cols.slot, y2: slotY[si], stroke: 'rgba(255,255,255,0.08)', 'stroke-width': '1', 'stroke-dasharray': '3,3' }));
    });
    // Nodes
    CAMIONS.forEach((c, i) => {
        s.appendChild(svg('rect', { x: 20, y: camY[i] - 16, width: 80, height: 32, rx: '8', fill: camC[i], opacity: '0.15', stroke: camC[i], 'stroke-width': '1' }));
        const t = svg('text', { x: 60, y: camY[i] + 5, 'text-anchor': 'middle', fill: camC[i], 'font-size': '12', 'font-family': 'DM Sans,sans-serif', 'font-weight': '700' });
        t.textContent = `${c.icon} C${c.id}`;
        s.appendChild(t);
    });
    const zoneColors = ['#f59e0b', '#ef4444', '#a855f7', '#10b981', '#06b6d4', '#f43f5e'];
    ZONES.forEach((z, i) => {
        s.appendChild(svg('rect', { x: 180, y: zoneY[i] - 14, width: 90, height: 28, rx: '7', fill: zoneColors[i], opacity: '0.15', stroke: zoneColors[i], 'stroke-width': '1' }));
        const t = svg('text', { x: 225, y: zoneY[i] + 5, 'text-anchor': 'middle', fill: zoneColors[i], 'font-size': '11', 'font-family': 'DM Sans,sans-serif' });
        t.textContent = z.nom;
        s.appendChild(t);
    });
    slotTimes.forEach((st, i) => {
        if (i >= slotY.length) return;
        s.appendChild(svg('rect', { x: 380, y: slotY[i] - 14, width: 88, height: 26, rx: '6', fill: 'rgba(100,116,139,0.15)', stroke: 'rgba(100,116,139,0.3)', 'stroke-width': '1' }));
        const t = svg('text', { x: 424, y: slotY[i] + 5, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.5)', 'font-size': '10', 'font-family': 'Space Mono,monospace' });
        t.textContent = st;
        s.appendChild(t);
    });
    // Labels
    ['CAMIONS', 'ZONES', 'CRÉNEAUX'].forEach((lbl, i) => {
        const x = [60, 225, 424][i];
        const t = svg('text', { x, y: 15, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.2)', 'font-size': '9', 'font-family': 'DM Sans,sans-serif', letterSpacing: '2' });
        t.textContent = lbl;
        s.appendChild(t);
    });
}

// ═══════════════════════════════════════════════════════════
// N4 — VRP
// ═══════════════════════════════════════════════════════════
function showVRP(mode = 'opt') {
    window.currentVrpMode = mode; // keep track globally for potential re-rendering
    const tours = mode === 'opt' ? VRP_TOURS_OPT : VRP_TOURS_INIT;
    const s = document.getElementById('vrp-svg');
    if (!s) return;
    s.innerHTML = '';
    // Grid
    for (let x = 0; x <= 10; x++) s.appendChild(svg('line', { x1: x, y1: -0.5, x2: x, y2: 10, stroke: 'rgba(255,255,255,0.04)', 'stroke-width': '0.04' }));
    for (let y = 0; y <= 10; y++) s.appendChild(svg('line', { x1: -0.5, y1: y, x2: 10, y2: y, stroke: 'rgba(255,255,255,0.04)', 'stroke-width': '0.04' }));

    // Tours
    tours.forEach((tour, ti) => {
        const color = TOUR_COLORS[ti % TOUR_COLORS.length];
        for (let i = 0; i < tour.length - 1; i++) {
            const pa = POINTS[tour[i]], pb = POINTS[tour[i + 1]];
            const line = svg('line', { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, stroke: color, 'stroke-width': '0.1', opacity: '0.8' });
            s.appendChild(line);
            // direction arrow
            const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
            const angle = Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI;
            const arr = svg('text', { x: mx, y: my, 'text-anchor': 'middle', fill: color, 'font-size': '0.4', opacity: '0.6', transform: `rotate(${angle}, ${mx}, ${my})` });
            arr.textContent = '›';
            s.appendChild(arr);
        }
    });

    // Points
    POINTS.forEach(p => {
        const isDepot = p.id === 0;
        const g = svg('g', { transform: `translate(${p.x}, ${p.y})` });
        const inTour = tours.flat().includes(p.id);
        const tourIdx = tours.findIndex(t => t.slice(1, -1).includes(p.id));
        const color = isDepot ? '#00d4aa' : (tourIdx >= 0 ? TOUR_COLORS[tourIdx % TOUR_COLORS.length] : '#334155');
        if (!isDepot && inTour) {
            g.appendChild(svg('circle', { r: '0.45', fill: color, opacity: '0.12' }));
        }
        g.appendChild(svg('circle', { r: isDepot ? '0.4' : '0.28', fill: color, stroke: 'rgba(255,255,255,0.2)', 'stroke-width': '0.05' }));
        const t = svg('text', { x: '0', y: '-0.45', 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.75)', 'font-size': '0.32', 'font-family': 'DM Sans,sans-serif' });
        t.textContent = isDepot ? 'D' : p.id;
        g.appendChild(t);
        s.appendChild(g);
    });

    // Legend
    const leg = document.getElementById('vrp-legend');
    if (leg) {
        leg.innerHTML = '';
        tours.forEach((t, i) => {
            const color = TOUR_COLORS[i % TOUR_COLORS.length];
            const dist = Math.round(tourDist(t) * 10) / 10;
            leg.innerHTML += `<div style="display:flex;align-items:center;gap:6px;font-size:11px"><div style="width:16px;height:3px;background:${color};border-radius:2px"></div><span style="color:${color};font-weight:600">Camion ${i + 1}</span><span style="color:var(--muted)">${t.slice(1, -1).join('→')} · ${dist} km</span></div>`;
        });
    }
}

function tourDist(tour) {
    let d = 0;
    for (let i = 0; i < tour.length - 1; i++) d += MATRIX[tour[i]][tour[i + 1]];
    return d;
}

function renderGantt() {
    const s = document.getElementById('gantt-svg');
    if (!s) return;
    s.innerHTML = '';
    const margin = { l: 80, t: 20, r: 20, b: 30 };
    const W = 860, H = 120;
    // BG
    s.appendChild(svg('rect', { x: 0, y: 0, width: 900, height: 160, fill: 'transparent' }));
    // Axis
    const hourStart = 8, hourEnd = 14;
    const scaleX = (h) => margin.l + (h - hourStart) / (hourEnd - hourStart) * (W - margin.l - margin.r);
    for (let h = hourStart; h <= hourEnd; h++) {
        const x = scaleX(h);
        s.appendChild(svg('line', { x1: x, y1: margin.t, x2: x, y2: H, stroke: 'rgba(255,255,255,0.06)', 'stroke-width': '1' }));
        const t = svg('text', { x, y: H + 15, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.3)', 'font-size': '11', 'font-family': 'Space Mono,monospace' });
        t.textContent = `${h}:00`;
        s.appendChild(t);
    }
    // Bars
    VRP_TOURS_OPT.forEach((tour, i) => {
        const dist = tourDist(tour);
        const speed = 25, serviceTime = 5 / 60 * tour.length;
        const durationH = dist / speed + serviceTime;
        const color = TOUR_COLORS[i];
        const x = scaleX(8);
        const w = (durationH / (hourEnd - hourStart)) * (W - margin.l - margin.r);
        const y = margin.t + i * 35 + 5;
        s.appendChild(svg('rect', { x, y, width: Math.max(w, 20), height: 25, rx: '6', fill: color, opacity: '0.25' }));
        s.appendChild(svg('rect', { x, y, width: Math.max(w, 20), height: 25, rx: '6', fill: 'none', stroke: color, 'stroke-width': '1.5' }));
        const t = svg('text', { x: x + 8, y: y + 16, fill: color, 'font-size': '11', 'font-family': 'DM Sans,sans-serif', 'font-weight': '600' });
        t.textContent = `🚛 Camion ${i + 1}  ·  ${dist.toFixed(1)} km  ·  ${tour.length - 2} pts`;
        s.appendChild(t);
        const lbl = svg('text', { x: x - 8, y: y + 16, 'text-anchor': 'end', fill: 'rgba(255,255,255,0.3)', 'font-size': '11', 'font-family': 'Space Mono,monospace' });
        lbl.textContent = `C${i + 1}`;
        s.appendChild(lbl);
    });
}

// ═══════════════════════════════════════════════════════════
// N5 — IOT + SIMULATION
// ═══════════════════════════════════════════════════════════
let simRunning = false, simInterval = null, simHour = 8, simMin = 0, replanCount = 0;
let paretoData = [];

function renderIoT() {
    const el = document.getElementById('iot-grid');
    if (!el) return;
    el.innerHTML = '';
    SENSORS.forEach(s => {
        const urgent = s.level >= 90, alert = s.level >= 80;
        const color = urgent ? '#ef4444' : alert ? '#f59e0b' : '#00d4aa';
        const circumference = 2 * Math.PI * 34;
        const dashOffset = circumference * (1 - s.level / 100);
        el.innerHTML += `
      <div class="sensor-card ${urgent ? 'urgent' : alert ? 'alert' : ''}" id="sensor-${s.id}">
        <div class="sensor-level-ring">
          <svg class="sensor-ring-svg" viewBox="0 0 80 80">
            <circle class="ring-bg" cx="40" cy="40" r="34"/>
            <circle class="ring-fill" id="ring-fill-${s.id}" cx="40" cy="40" r="34"
              stroke="${color}" stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"/>
          </svg>
          <div class="sensor-pct" style="color:${color}">${Math.round(s.level)}%</div>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--text)">${s.nom}</div>
        <div class="sensor-status" style="color:${color}">${urgent ? '🚨 URGENT' : alert ? '⚠️ ALERTE' : '✅ OK'}</div>
      </div>`;
    });
    updateStats();
    renderPareto();
}

function updateStats() {
    const urgent = SENSORS.filter(s => s.level >= 90).length;
    const alert = SENSORS.filter(s => s.level >= 80).length;
    const avg = Math.round(SENSORS.reduce((a, s) => a + s.level, 0) / SENSORS.length);
    const elUrgent = document.getElementById('iot-urgent');
    const elAlert = document.getElementById('iot-alert');
    const elAvg = document.getElementById('iot-avg');
    const elCo2 = document.getElementById('co2-count');

    if (elUrgent) elUrgent.textContent = urgent;
    if (elAlert) elAlert.textContent = alert;
    if (elAvg) elAvg.textContent = avg + '%';
    if (elCo2) elCo2.textContent = Math.round(38.39 * 0.3 * (simHour - 8 + 1)) + 'kg';
}

function updateSensorUI(s) {
    const urgent = s.level >= 90, alert = s.level >= 80;
    const color = urgent ? '#ef4444' : alert ? '#f59e0b' : '#00d4aa';
    const card = document.getElementById('sensor-' + s.id);
    if (!card) return;
    card.className = `sensor-card ${urgent ? 'urgent' : alert ? 'alert' : ''}`;
    const circumference = 2 * Math.PI * 34;
    const ring = document.getElementById('ring-fill-' + s.id);
    if (ring) {
        ring.style.stroke = color;
        ring.setAttribute('stroke-dashoffset', circumference * (1 - s.level / 100));
    }
    card.querySelector('.sensor-pct').textContent = Math.round(s.level) + '%';
    card.querySelector('.sensor-pct').style.color = color;
    card.querySelector('.sensor-status').textContent = urgent ? '🚨 URGENT' : alert ? '⚠️ ALERTE' : '✅ OK';
    card.querySelector('.sensor-status').style.color = color;
}

function addLog(msg, type = '') {
    const log = document.getElementById('sim-log');
    if (!log) return;
    const h = `${String(simHour).padStart(2, '0')}: ${String(simMin).padStart(2, '0')}`;
    log.innerHTML += `<div class="log-line ${type}"> [${h}] ${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

function startSim() {
    if (simRunning) return;
    simRunning = true;
    const startBtn = document.getElementById('sim-start-btn');
    const pauseBtn = document.getElementById('sim-pause-btn');
    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    addLog('▶ Simulation démarrée', 'ok');

    const speedEl = document.getElementById('sim-speed');
    const speed = () => speedEl ? parseInt(speedEl.value) : 5;

    simInterval = setInterval(async () => {
        // Advance time
        simMin += 30;
        if (simMin >= 60) { simMin = 0; simHour++; }
        if (simHour >= 20) { stopSim(); return; }
        const timeEl = document.getElementById('sim-time');
        if (timeEl) timeEl.textContent = `${String(simHour).padStart(2, '0')}:${String(simMin).padStart(2, '0')}`;

        // Update real sensors on backend and fetch
        try {
            await fetch('api/update_sensors.php');
            const sensRes = await fetch('api/sensors.php').then(r => r.json());
            if (sensRes.success) {
                SENSORS = sensRes.sensors;
            }
        } catch (e) {
            console.error(e);
        }

        let anyUrgent = [];
        SENSORS.forEach(s => {
            updateSensorUI(s);
            if (s.level >= 90) anyUrgent.push(s);
        });

        // Random events
        const evEl = document.getElementById('sim-events');
        if (evEl) {
            const events = [];
            if (Math.random() < 0.05) { events.push({ label: '🔧 Panne Camion ' + Math.ceil(Math.random() * 3), cls: 'badge-red' }); }
            if (Math.random() < 0.15) { events.push({ label: '🚦 Trafic Zone ' + (Math.ceil(Math.random() * 3)), cls: 'badge-yellow' }); }
            if (Math.random() < 0.1) { events.push({ label: '📦 Demande spéciale', cls: 'badge-blue' }); }
            evEl.innerHTML = events.map(e => `<div class="badge ${e.cls}">${e.label}</div>`).join('');
            events.forEach(e => addLog(e.label, e.cls.includes('red') ? 'err' : e.cls.includes('yellow') ? 'warn' : ''));
        }

        // Urgency handling
        if (anyUrgent.length > 0) {
            replanCount++;
            const replanEl = document.getElementById('replan-count');
            if (replanEl) replanEl.textContent = replanCount;
            addLog(`⚡ Replanification urgente : ${anyUrgent.map(s => s.nom).join(', ')}`, 'warn');
            // If we have an urgent pickup, let's log it but let the backend simulation reset it on next tick (or cap it).
            updateAlerts();
        }

        updateStats();
        // Update pareto occasionally
        if (Math.random() < 0.3) addParetoSolution();
        renderPareto();
    }, 1100 - speed() * 100);
}

window.startSim = startSim; // export for html calling

function pauseSim() {
    simRunning = false;
    clearInterval(simInterval);
    const startBtn = document.getElementById('sim-start-btn');
    const pauseBtn = document.getElementById('sim-pause-btn');
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    addLog('⏸ Simulation en pause');
}
window.pauseSim = pauseSim;

function stopSim() {
    pauseSim();
    addLog('✅ Fin de journée (20:00)', 'ok');
}
window.stopSim = stopSim;

function resetSim() {
    pauseSim();
    simHour = 8; simMin = 0; replanCount = 0;
    const timeEl = document.getElementById('sim-time');
    const replanEl = document.getElementById('replan-count');
    if (timeEl) timeEl.textContent = '08:00';
    if (replanEl) replanEl.textContent = '0';

    SENSORS.forEach((s, i) => { s.level = [45, 70, 30, 85, 55, 40, 60, 25][i]; });
    renderIoT();

    const logEl = document.getElementById('sim-log');
    if (logEl) logEl.innerHTML = '<div class="log-line">Système prêt. Appuyez sur ▶ pour démarrer...</div>';
    const evEl = document.getElementById('sim-events');
    if (evEl) evEl.innerHTML = '';
    const alertEl = document.getElementById('alerts-list');
    if (alertEl) alertEl.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:20px">Aucune alerte active</div>';

    paretoData = [];
    renderPareto();
}
window.resetSim = resetSim;

function updateAlerts() {
    const el = document.getElementById('alerts-list');
    if (!el) return;
    const urgent = SENSORS.filter(s => s.level >= 85);
    if (urgent.length === 0) { el.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:20px">Aucune alerte active</div>'; return; }
    el.innerHTML = urgent.map(s => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:8px">
      <span style="font-size:16px">🚨</span>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:#ef4444">${s.nom} — Point ${s.id}</div>
        <div style="font-size:11px;color:var(--muted)">Niveau : ${Math.round(s.level)}% — Collecte urgente requise</div>
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:#ef4444">${Math.round(s.level)}%</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// N5 — PARETO
// ═══════════════════════════════════════════════════════════
function addParetoSolution() {
    paretoData.push({
        cout: 60 + Math.random() * 80,
        co2: 15 + Math.random() * 40,
        sat: 60 + Math.random() * 40,
        equite: 70 + Math.random() * 30,
        dominated: false,
    });
    // Mark dominated
    paretoData.forEach((a, i) => {
        paretoData.forEach((b, j) => {
            if (i !== j && b.cout <= a.cout && b.co2 <= a.co2 && b.sat >= a.sat && b.equite >= a.equite
                && (b.cout < a.cout || b.co2 < a.co2 || b.sat > a.sat || b.equite > a.equite)) {
                a.dominated = true;
            }
        });
    });
}

function renderPareto() {
    const s = document.getElementById('pareto-svg');
    if (!s) return;
    s.innerHTML = '';
    const W = 380, H = 260, ml = 50, mt = 20, mr = 20, mb = 40;
    const allCout = paretoData.map(p => p.cout);
    const allCo2 = paretoData.map(p => p.co2);
    const minC = allCout.length ? Math.min(...allCout) : 60, maxC = allCout.length ? Math.max(...allCout) : 140;
    const minCo = allCo2.length ? Math.min(...allCo2) : 15, maxCo = allCo2.length ? Math.max(...allCo2) : 55;

    // Axes
    s.appendChild(svg('line', { x1: ml, y1: mt, x2: ml, y2: H - mb, stroke: 'rgba(255,255,255,0.15)', 'stroke-width': '1' }));
    s.appendChild(svg('line', { x1: ml, y1: H - mb, x2: W - mr, y2: H - mb, stroke: 'rgba(255,255,255,0.15)', 'stroke-width': '1' }));

    // Labels
    const xLbl = svg('text', { x: W / 2, y: H - 8, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.35)', 'font-size': '10', 'font-family': 'DM Sans,sans-serif' });
    xLbl.textContent = 'Coût total (€)';
    const yLbl = svg('text', { x: 12, y: H / 2, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.35)', 'font-size': '10', 'font-family': 'DM Sans,sans-serif', transform: `rotate(-90, 12, ${H / 2})` });
    yLbl.textContent = 'CO2 (kg)';
    s.appendChild(xLbl); s.appendChild(yLbl);

    // Grid
    [0.25, 0.5, 0.75, 1].forEach(f => {
        const x = ml + f * (W - ml - mr), y = mt + f * (H - mb - mt);
        s.appendChild(svg('line', { x1: x, y1: mt, x2: x, y2: H - mb, stroke: 'rgba(255,255,255,0.04)', 'stroke-width': '1' }));
        s.appendChild(svg('line', { x1: ml, y1: y, x2: W - mr, y2: y, stroke: 'rgba(255,255,255,0.04)', 'stroke-width': '1' }));
    });

    if (!paretoData.length) {
        const t = svg('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.2)', 'font-size': '12', 'font-family': 'DM Sans,sans-serif' });
        t.textContent = 'Lancez la simulation pour générer le front de Pareto';
        s.appendChild(t); return;
    }

    // Pareto front line
    const frontPts = paretoData.filter(p => !p.dominated).sort((a, b) => a.cout - b.cout);
    if (frontPts.length > 1) {
        const pts = frontPts.map(p => {
            const x = ml + (p.cout - minC) / (maxC - minC + 1) * (W - ml - mr);
            const y = mt + (p.co2 - minCo) / (maxCo - minCo + 1) * (H - mb - mt);
            return `${x},${y} `;
        }).join(' ');
        const poly = svg('polyline', { points: pts, fill: 'none', stroke: '#00d4aa', 'stroke-width': '1.5', opacity: '0.4', 'stroke-dasharray': '4,2' });
        s.appendChild(poly);
    }

    // Points
    paretoData.forEach(p => {
        const x = ml + (p.cout - minC) / (maxC - minC + 1) * (W - ml - mr);
        const y = mt + (p.co2 - minCo) / (maxCo - minCo + 1) * (H - mb - mt);
        if (isNaN(x) || isNaN(y)) return;
        const color = p.dominated ? 'rgba(100,116,139,0.5)' : '#00d4aa';
        const r = p.dominated ? 3 : 5;
        const circle = svg('circle', { cx: x, cy: y, r, fill: color, opacity: p.dominated ? 0.5 : 0.9 });
        s.appendChild(circle);
        if (!p.dominated) {
            const glow = svg('circle', { cx: x, cy: y, r: '10', fill: '#00d4aa', opacity: '0.08' });
            s.appendChild(glow);
        }
    });

    // Legend
    const legends = [{ c: '#00d4aa', lbl: `Non - dominées(front: ${paretoData.filter(p => !p.dominated).length})` }, { c: 'rgba(100,116,139,0.8)', lbl: `Dominées(${paretoData.filter(p => p.dominated).length})` }];
    legends.forEach((l, i) => {
        s.appendChild(svg('circle', { cx: ml + 5, cy: mt + 15 + i * 16, r: '4', fill: l.c }));
        const t = svg('text', { x: ml + 14, y: mt + 19 + i * 16, fill: 'rgba(255,255,255,0.4)', 'font-size': '10', 'font-family': 'DM Sans,sans-serif' });
        t.textContent = l.lbl; s.appendChild(t);
    });
}

// Initial pareto data
for (let i = 0; i < 12; i++) addParetoSolution();

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
async function initData() {
    try {
        const [netRes, fleetRes, zonesRes, planRes, sensRes, vrpRes] = await Promise.all([
            fetch('api/network.php').then(r => r.json()),
            fetch('api/trucks.php').then(r => r.json()),
            fetch('api/zones.php').then(r => r.json()),
            fetch('api/planning.php').then(r => r.json()),
            fetch('api/sensors.php').then(r => r.json()),
            fetch('api/vrp.php').then(r => r.json())
        ]);

        if (netRes.success) { POINTS = netRes.points; EDGES = netRes.edges; MATRIX = netRes.matrix; }
        if (fleetRes.success) { CAMIONS = fleetRes.camions; }
        if (zonesRes.success) { ZONES = zonesRes.zones; }
        if (planRes.success) { PLANNING = planRes.planning; }
        if (sensRes.success) { SENSORS = sensRes.sensors; }
        if (vrpRes.success) { VRP_TOURS_OPT = vrpRes.vrp_routes; }

        // Render initial graphs
        renderMap();
        renderMatrix();
        renderBipartite();
        renderTrucks();
        renderTimeline();
        renderTripartite();
        updateStats();
        // and show vrp opt by default
        showVRP('opt');

    } catch (e) {
        console.error("Failed to load data from APIs", e);
        const log = document.getElementById('sim-log');
        if (log) log.innerHTML = `<div class="log-line" style="color:red">Erreur de chargement de l'API backend. Assurez-vous que xampp est lancé.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initData();
    // Animate bars on load
    setTimeout(() => {
        ['bar1', 'bar2', 'bar3', 'bar4'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { const w = el.style.width; el.style.width = '0'; setTimeout(() => el.style.width = w, 200); }
        });
    }, 400);
});

// Export functions to global scope so inline event handlers in HTML work
window.showPage = showPage;
window.updatePath = updatePath;
window.highlightCell = highlightCell;
window.clearHighlight = clearHighlight;
window.showVRP = showVRP;
