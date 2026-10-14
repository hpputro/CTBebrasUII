/* Petualangan Bina — logika bersama: kemajuan, navigasi, modal hasil */
const Bina = (() => {
  const EMBED = window.parent !== window;
  const KEY = 'ekspedisi-bina-v1';
  let state = { progress: {}, unlockAll: false };
  const listeners = [];

  function loadLocal() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) state = Object.assign(state, s); } catch (e) {}
  }
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  if (EMBED) {
    window.addEventListener('message', e => {
      const d = e.data || {};
      if (d.bina === 'state') { state = { progress: d.progress || {}, unlockAll: !!d.unlockAll }; listeners.forEach(f => f(state)); }
    });
    window.parent.postMessage({ bina: 'ready' }, '*');
  } else loadLocal();

  function stars(game, level) { return ((state.progress[game] || {})[level]) || 0; }
  function unlocked(game, level) { return level === 1 || state.unlockAll || stars(game, level - 1) > 0; }
  function save(game, level, s) {
    const g = state.progress[game] = state.progress[game] || {};
    if (s > (g[level] || 0)) g[level] = s;
    if (EMBED) window.parent.postMessage({ bina: 'save', game, level, stars: s }, '*'); else saveLocal();
    listeners.forEach(f => f(state));
  }
  function onState(f) { listeners.push(f); f(state); }
  function home() { if (EMBED) window.parent.postMessage({ bina: 'home' }, '*'); else location.href = 'index.html'; }
  function fullscreen() {
    if (EMBED) { window.parent.postMessage({ bina: 'fullscreen' }, '*'); return; }
    const d = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen && d.documentElement.requestFullscreen().catch(() => {});
    else d.exitFullscreen && d.exitFullscreen();
  }

  // header standar
  function header(opts) {
    const bar = document.querySelector('.topbar');
    bar.innerHTML = `
      <button class="btn btn-ghost" id="bHome" aria-label="Kembali ke peta"><span class="icon">🗺️</span> Peta</button>
      <div class="title"><span class="badge" aria-hidden="true">${opts.icon}</span>${opts.title}</div>
      <div class="spacer"></div>
      <div class="levels" id="lvls" role="tablist" aria-label="Pilih level"></div>
      <button class="btn btn-ghost" id="bHelp" aria-label="Cara bermain"><span class="icon">❔</span></button>
      <button class="btn btn-ghost" id="bFull" aria-label="Layar penuh"><span class="icon">⛶</span></button>`;
    bar.querySelector('#bHome').onclick = home;
    bar.querySelector('#bFull').onclick = fullscreen;
    bar.querySelector('#bHelp').onclick = opts.onHelp;
    const box = bar.querySelector('#lvls');
    const draw = () => {
      box.innerHTML = '';
      for (let i = 1; i <= opts.count; i++) {
        const b = document.createElement('button');
        const s = stars(opts.game, i), un = unlocked(opts.game, i);
        b.className = 'lvl' + (i === opts.current() ? ' on' : '') + (un ? '' : ' locked');
        b.innerHTML = `Level ${i}<small>${un ? '★'.repeat(s) + '☆'.repeat(3 - s) : '🔒'}</small>`;
        b.setAttribute('aria-label', `Level ${i}${un ? `, ${s} bintang` : ', terkunci'}`);
        b.onclick = () => { if (un) opts.onPick(i); else toast('Selesaikan level sebelumnya dulu, ya.'); };
        box.appendChild(b);
      }
    };
    onState(draw);
    return { redraw: draw };
  }

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // modal hasil
  function result(o) {
    let m = document.getElementById('resultModal');
    if (!m) { m = document.createElement('div'); m.id = 'resultModal'; m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m); }
    const st = o.stars || 0;
    const starHtml = [1, 2, 3].map(i => `<span class="${i <= st ? '' : 'off'}">★</span>`).join('');
    m.innerHTML = `<div class="sheet">
      <div class="head"><div class="stars" aria-label="${st} bintang">${starHtml}</div>
        <div><h2>${o.title}</h2><p class="sub">${o.subtitle || ''}</p></div></div>
      ${o.metrics ? `<div class="metrics">${o.metrics.map(x => `<div class="metric"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>` : ''}
      ${o.detail || ''}
      <div class="explain">
        <div class="box"><h3>Apa yang terjadi?</h3><ul>${o.what.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div class="box ai"><h3>Hubungannya dengan AI</h3><p>${o.ai}</p><div class="chips">${(o.ct || []).map(c => `<span class="chip">${c}</span>`).join('')}</div></div>
      </div>
      <div class="actions">
        <button class="btn btn-soft" id="rRetry"><span class="icon">↻</span> Coba lagi</button>
        ${o.next ? `<button class="btn btn-main" id="rNext">Level berikutnya</button>` : `<button class="btn btn-main" id="rHome">Kembali ke peta</button>`}
      </div></div>`;
    m.classList.add('show');
    m.querySelector('#rRetry').onclick = () => { m.classList.remove('show'); o.onRetry && o.onRetry(); };
    const n = m.querySelector('#rNext'); if (n) n.onclick = () => { m.classList.remove('show'); o.next(); };
    const h = m.querySelector('#rHome'); if (h) h.onclick = home;
    (n || h).focus({ preventScroll: true }); m.querySelector('.sheet').scrollTop = 0;
  }

  function info(title, html) {
    let m = document.getElementById('infoModal');
    if (!m) { m = document.createElement('div'); m.id = 'infoModal'; m.className = 'modal'; m.setAttribute('role', 'dialog'); document.body.appendChild(m); }
    m.innerHTML = `<div class="sheet"><h2 style="margin-bottom:12px">${title}</h2>${html}<div class="actions"><button class="btn btn-main" id="iOk">Mengerti, ayo main</button></div></div>`;
    m.classList.add('show');
    m.querySelector('#iOk').onclick = () => m.classList.remove('show');
    m.querySelector('#iOk').focus();
  }

  // ilustrasi berang-berang Bina
  const bina = `<svg class="bina" viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="44" r="30" fill="#A8692F"/><circle cx="18" cy="20" r="8" fill="#A8692F"/><circle cx="62" cy="20" r="8" fill="#A8692F"/>
    <circle cx="18" cy="20" r="4" fill="#7A4A1E"/><circle cx="62" cy="20" r="4" fill="#7A4A1E"/>
    <ellipse cx="40" cy="54" rx="17" ry="13" fill="#E8C49A"/>
    <circle cx="29" cy="38" r="5" fill="#fff"/><circle cx="51" cy="38" r="5" fill="#fff"/>
    <circle cx="30" cy="39" r="2.6" fill="#1E2E5C"/><circle cx="52" cy="39" r="2.6" fill="#1E2E5C"/>
    <ellipse cx="40" cy="48" rx="6" ry="4.5" fill="#3B2410"/>
    <rect x="35" y="55" width="4.5" height="7" rx="1" fill="#fff"/><rect x="40.5" y="55" width="4.5" height="7" rx="1" fill="#fff"/></svg>`;

  return { EMBED, stars, unlocked, save, onState, home, fullscreen, header, toast, result, info, bina };
})();

/* grafik garis sederhana (SVG) */
Bina.lineChart = function (series, opts = {}) {
  const W = opts.w || 520, H = opts.h || 200, P = 34;
  const all = series.flatMap(s => s.data);
  const ymin = opts.ymin ?? Math.min(0, ...all), ymax = opts.ymax ?? Math.max(1, ...all);
  const n = Math.max(...series.map(s => s.data.length));
  const x = i => P + (W - P - 10) * (n <= 1 ? 0 : i / (n - 1));
  const y = v => H - P + 6 - (H - P - 4) * ((v - ymin) / ((ymax - ymin) || 1));
  let g = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label || 'grafik'}">`;
  [0, 0.5, 1].forEach(t => { const v = ymin + (ymax - ymin) * t; g += `<line x1="${P}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}" stroke="#E3E9F0"/><text x="${P - 6}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#56607C">${opts.fmt ? opts.fmt(v) : Math.round(v)}</text>`; });
  if (opts.xlabel) g += `<text x="${W / 2}" y="${H - 4}" font-size="11" text-anchor="middle" fill="#56607C">${opts.xlabel}</text>`;
  series.forEach(s => { if (!s.data.length) return; g += `<polyline fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${s.data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}"/>`; });
  return g + '</svg>' + (series.length > 1 || opts.legend ? `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>` : '');
};
/* pengacak berbenih agar hasil bisa diulang */
Bina.rng = function (seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; };
