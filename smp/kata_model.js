const CORPUS = [
  { id:'kancil', name:'Kancil dan buaya', text:'si kancil pergi ke sungai . si kancil melihat buaya di sungai . buaya ingin makan si kancil . si kancil berpikir cepat . si kancil melihat buaya berbaris . si kancil melompat ke seberang .' },
  { id:'bina', name:'Bina si berang-berang', text:'bina membangun bendungan di sungai . bina membawa kayu ke sungai . bina suka makan kulit kayu . teman bina datang membantu . bendungan bina menjadi kuat .' },
  { id:'pasar', name:'Ke pasar', text:'ibu pergi ke pasar . ibu membeli ikan di pasar . ikan itu masih segar . ayah membawa sayur ke rumah . adik makan ikan di rumah .' },
  { id:'sekolah', name:'Hari di sekolah', text:'adik pergi ke sekolah . guru membawa buku ke kelas . adik membaca buku di perpustakaan . guru membawa bola ke lapangan . teman adik datang terlambat .' },
];
function tokens(ids){ return CORPUS.filter(c => ids.includes(c.id)).flatMap(c => c.text.split(' ')); }
function bigrams(ids){
  const t = tokens(ids), m = {};
  for (let i = 0; i < t.length - 1; i++) { if (t[i] === '.') continue; (m[t[i]] = m[t[i]] || {})[t[i+1]] = ((m[t[i]] || {})[t[i+1]] || 0) + 1; }
  return m;
}
function nextDist(m, w){ const d = m[w] || {}; const tot = Object.values(d).reduce((a, b) => a + b, 0); return Object.entries(d).map(([k, c]) => ({ w:k, c, p: c / tot, tot })).sort((a, b) => b.c - a.c || a.w.localeCompare(b.w)); }
function generate(m, start, mode, rand, max = 12){
  const out = [start], steps = []; let w = start;
  for (let i = 0; i < max; i++) {
    const d = nextDist(m, w); if (!d.length) break;
    let pick;
    if (mode === 'aman') pick = d[0];
    else {
      const pw = mode === 'liar' ? 0.35 : 1; // liar: peluang diratakan
      const ws = d.map(e => Math.pow(e.p, pw)), S = ws.reduce((a, b) => a + b, 0);
      let r = rand() * S; pick = d[d.length - 1];
      for (let j = 0; j < d.length; j++) { r -= ws[j]; if (r <= 0) { pick = d[j]; break; } }
    }
    steps.push({ from:w, pick, dist:d });
    if (pick.w === '.') break;
    out.push(pick.w); w = pick.w;
  }
  return { words: out, steps };
}
if (typeof module !== 'undefined') module.exports = { CORPUS, bigrams, nextDist, generate, tokens };
