/* Petualangan Bina — skrip bersama */
(function(){
  const KEY = 'bina-progress-v1';
  const inFrame = window.parent && window.parent !== window;
  let state = { progress:{}, unlockAll:false };
  const headers = [];

  function loadLocal(){ try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) state = Object.assign({ progress:{}, unlockAll:false }, s); } catch(e) {} }
  function saveLocal(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} }
  function post(msg){ if (inFrame) window.parent.postMessage(msg, '*'); }
  function redrawAll(){ headers.forEach(h => h.redraw()); }
  loadLocal();

  window.addEventListener('message', e => {
    const d = e.data || {};
    if (d.bina !== 'state') return;
    // gabungkan: ambil bintang terbanyak agar simpanan lokal yang baru tidak tertimpa
    const p = d.progress || {};
    Object.keys(p).forEach(g => {
      const mine = state.progress[g] = state.progress[g] || {};
      Object.keys(p[g]).forEach(l => { if ((p[g][l] || 0) > (mine[l] || 0)) mine[l] = p[g][l]; });
    });
    state.unlockAll = !!d.unlockAll;
    redrawAll();
  });

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const starStr = (n, max = 3) => '★'.repeat(n) + '☆'.repeat(Math.max(0, max - n));

  // ---------- modal ----------
  let modal, lastFocus;
  function ensureModal(){
    if (modal) return modal;
    modal = document.createElement('div'); modal.className = 'modal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="sheet" tabindex="-1"></div>';
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('show')) close(); });
    document.body.appendChild(modal);
    return modal;
  }
  function openSheet(html, buttons){
    const m = ensureModal(), sheet = m.querySelector('.sheet');
    lastFocus = document.activeElement;
    sheet.innerHTML = html;
    const act = document.createElement('div'); act.className = 'actions';
    act.style.cssText = 'position:sticky;bottom:-28px;background:var(--paper);padding:12px 0 6px;margin-bottom:-6px';
    buttons.forEach(([label, cls, fn]) => {
      const b = document.createElement('button'); b.className = 'btn ' + cls; b.innerHTML = label;
      b.onclick = () => { close(); fn && fn(); };
      act.appendChild(b);
    });
    sheet.appendChild(act);
    m.classList.add('show'); sheet.scrollTop = 0;
    const main = act.querySelector('.btn-main') || act.querySelector('button');
    setTimeout(() => main && main.focus({ preventScroll:true }), 30);
  }
  function close(){
    if (!modal) return;
    modal.classList.remove('show');
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch(e) {}
  }

  // ---------- toast ----------
  let toastEl, toastT;
  function toast(msg){
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  // ---------- navigasi ----------
  function home(){ if (inFrame) post({ bina:'home' }); else location.href = 'index.html'; }
  function fullscreen(){
    if (inFrame) { post({ bina:'fullscreen' }); return; }
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen && document.exitFullscreen();
  }

  // ---------- kemajuan ----------
  function stars(game, level){ return ((state.progress[game] || {})[level]) || 0; }
  function unlocked(game, level){ return state.unlockAll || level === 1 || stars(game, level - 1) > 0; }
  function save(game, level, s){
    const g = state.progress[game] = state.progress[game] || {};
    if (s > (g[level] || 0)) g[level] = s;
    if (inFrame) post({ bina:'save', game, level, stars:s }); else saveLocal();
    redrawAll();
  }

  // ---------- topbar ----------
  function header(o){
    const bar = document.querySelector('.topbar');
    const h = {
      redraw(){
        const cur = o.current ? o.current() : 1;
        let lv = '';
        for (let n = 1; n <= (o.count || 4); n++) {
          const s = stars(o.game, n), open = unlocked(o.game, n);
          lv += `<button class="lvl${n === cur ? ' on' : ''}${open ? '' : ' locked'}" data-l="${n}" aria-label="Level ${n}${open ? `, ${s} bintang` : ', terkunci'}"${n === cur ? ' aria-current="true"' : ''}>`
            + `<small>LEVEL</small><span>${open ? n : '🔒'}</span><small>${open ? starStr(s) : ''}</small></button>`;
        }
        bar.innerHTML = `<button class="btn btn-ghost" data-act="home"><span class="icon">🗺️</span> Peta</button>
          <div class="title"><span class="badge">${o.icon || ''}</span>${esc(o.title || '')}</div>
          <nav class="levels" aria-label="Pilih level">${lv}</nav>
          <div class="spacer"></div>
          ${o.onHelp ? '<button class="btn btn-ghost" data-act="help" aria-label="Cara bermain"><span class="icon">❓</span></button>' : ''}
          <button class="btn btn-ghost" data-act="full" aria-label="Layar penuh"><span class="icon">⛶</span></button>`;
        bar.querySelector('[data-act="home"]').onclick = home;
        bar.querySelector('[data-act="full"]').onclick = fullscreen;
        const hp = bar.querySelector('[data-act="help"]'); if (hp) hp.onclick = o.onHelp;
        bar.querySelectorAll('.lvl').forEach(b => b.onclick = () => {
          const n = +b.dataset.l;
          if (!unlocked(o.game, n)) { toast('Selesaikan level sebelumnya dulu.'); return; }
          o.onPick && o.onPick(n);
        });
      }
    };
    headers.push(h); h.redraw();
    return h;
  }

  // ---------- layar info & hasil ----------
  function info(title, html){
    openSheet(`<div class="head"><div style="width:64px;flex:0 0 auto">${Bina.bina}</div><h2>${esc(title)}</h2></div><div>${html}</div>`, [['Mengerti', 'btn-main']]);
  }
  function result(r){
    const s = r.stars || 0;
    const metrics = (r.metrics || []).map(([v, l]) => `<div class="metric"><b>${v}</b><span>${l}</span></div>`).join('');
    const what = (r.what || []).map(w => `<li>${w}</li>`).join('');
    const chips = (r.ct || []).map(c => `<span class="chip">${esc(c)}</span>`).join('');
    const html = `<div class="head">
        <div class="stars" aria-label="${s} dari 3 bintang">${'★'.repeat(s)}<span class="off">${'★'.repeat(3 - s)}</span></div>
        <div><h2>${r.title || ''}</h2><p class="sub">${r.subtitle || ''}</p></div>
      </div>
      ${metrics ? `<div class="metrics">${metrics}</div>` : ''}
      ${r.detail || ''}
      <div class="explain">
        <div class="box"><h3>🔎 Apa yang terjadi?</h3><ul>${what}</ul></div>
        <div class="box ai"><h3>🤖 Hubungannya dengan AI</h3><p>${r.ai || ''}</p>${chips ? `<h3 style="margin-top:12px">🧠 Berpikir komputasional</h3><div class="chips">${chips}</div>` : ''}</div>
      </div>`;
    const btns = [['<span class="icon">🗺️</span> Peta', 'btn-soft', home], ['<span class="icon">↺</span> Coba lagi', r.next ? 'btn-soft' : 'btn-main', r.onRetry]];
    if (r.next) btns.push(['Level berikutnya <span class="icon">▶</span>', 'btn-main', r.next]);
    openSheet(html, btns);
  }

  const bina = `<svg class="bina" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="44" r="30" fill="#A8692F"/><circle cx="18" cy="20" r="8" fill="#A8692F"/><circle cx="62" cy="20" r="8" fill="#A8692F"/><circle cx="18" cy="20" r="4" fill="#7A4A1E"/><circle cx="62" cy="20" r="4" fill="#7A4A1E"/><ellipse cx="40" cy="54" rx="17" ry="13" fill="#E8C49A"/><circle cx="29" cy="38" r="5" fill="#fff"/><circle cx="51" cy="38" r="5" fill="#fff"/><circle cx="30" cy="39" r="2.6" fill="#1E2E5C"/><circle cx="52" cy="39" r="2.6" fill="#1E2E5C"/><ellipse cx="40" cy="48" rx="6" ry="4.5" fill="#3B2410"/><rect x="35" y="55" width="4.5" height="7" rx="1" fill="#fff"/><rect x="40.5" y="55" width="4.5" height="7" rx="1" fill="#fff"/></svg>`;

  window.Bina = { bina, header, info, result, save, toast, home, fullscreen, close, state: () => state };
  post({ bina:'ready' });
})();
