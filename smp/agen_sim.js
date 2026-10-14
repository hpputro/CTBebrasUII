const AG_LEVELS = [
  { map:['S...#.','.##.#.','...W..','.#W...','....#G'], R:{ goal:10, step:-1, river:-10, coin:0 }, eps:0.2, episodes:150, lock:['goal','step','river'] },
  { map:['S..#..','.#...#','.#W#..','...W.#','W#...G'], R:{ goal:2, step:0, river:0, coin:0 }, eps:0.2, episodes:60, lock:[] },
  { map:['SC..#.','.#..#.','.#W...','...#W.','W....G'], R:{ goal:10, step:-1, river:-10, coin:3 }, eps:0.2, episodes:200, lock:['step','river'], coinOnce:false },
  { map:['S..###','.#E#..','.#...#','.###.#','.....T'], R:{ goal:5, treasure:20, step:0, river:-10, coin:0 }, eps:0.1, episodes:200, lock:['goal','treasure','step','river'], curious:true },
];
const DIRS = [[-1,0],[0,1],[1,0],[0,-1]];
function agentEnv(lv, R, coinOnce){
  const map = lv.map, H = map.length, W = map[0].length;
  let start; map.forEach((r, i) => { const j = r.indexOf('S'); if (j >= 0) start = [i, j]; });
  const ch = (r, c) => (map[r] || '')[c];
  return {
    H, W, start,
    step(s, a){ // s = [r,c,taken]
      const nr = s[0] + DIRS[a][0], nc = s[1] + DIRS[a][1], t = ch(nr, nc);
      if (t === undefined || t === '#') return { s: s, r: R.step, done: false, bump: true };
      const ns = [nr, nc, s[2]];
      if (t === 'G' || t === 'E') return { s: ns, r: R.step + R.goal, done: true, end: t };
      if (t === 'T') return { s: ns, r: R.step + (R.treasure || 0), done: true, end: 'T' };
      if (t === 'W') return { s: ns, r: R.step + R.river, done: true, end: 'W' };
      if (t === 'C' && !(coinOnce && s[2])) { ns[2] = 1; return { s: ns, r: R.step + R.coin, done: false, coin: true }; }
      return { s: ns, r: R.step, done: false };
    }
  };
}
function trainAgent(lv, R, eps, episodes, coinOnce, seed = 12345, q0 = 0){
  const env = agentEnv(lv, R, coinOnce), rand = (s => () => (s = s * 16807 % 2147483647) / 2147483647)(seed);
  const Q = {}, key = s => s.join(','), q = s => Q[key(s)] || (Q[key(s)] = [q0,q0,q0,q0]);
  const best = s => { const v = q(s), m = Math.max(...v), idx = [0,1,2,3].filter(i => v[i] === m); return idx[Math.floor(rand() * idx.length)]; };
  const alpha = 0.5, gamma = 0.9, MAX = 40, visits = {}, curve = [];
  for (let e = 0; e < episodes; e++) {
    let s = [env.start[0], env.start[1], 0], total = 0;
    for (let t = 0; t < MAX; t++) {
      const a = rand() < eps ? Math.floor(rand() * 4) : best(s);
      const o = env.step(s, a); total += o.r;
      const target = o.r + (o.done ? 0 : gamma * Math.max(...q(o.s)));
      q(s)[a] += alpha * (target - q(s)[a]);
      visits[o.s[0] + ',' + o.s[1]] = (visits[o.s[0] + ',' + o.s[1]] || 0) + 1;
      s = o.s; if (o.done) break;
    }
    curve.push(total);
  }
  // jalankan rakus (tanpa eksplorasi) untuk melihat hasil belajar
  let s = [env.start[0], env.start[1], 0], path = [[s[0], s[1]]], total = 0, end = null, coins = 0;
  for (let t = 0; t < MAX; t++) {
    const v = q(s), a = v.indexOf(Math.max(...v)), o = env.step(s, a); total += o.r; if (o.coin) coins++;
    s = o.s; path.push([s[0], s[1]]); if (o.done) { end = o.end; break; }
  }
  const policy = {};
  for (let r = 0; r < env.H; r++) for (let c = 0; c < env.W; c++) { const v = Q[[r, c, 0].join(',')]; if (v && v.some(x => x !== q0)) policy[r + ',' + c] = v.indexOf(Math.max(...v)); }
  return { path, total, end, coins, curve, visits, policy, steps: path.length - 1 };
}
function shortest(lv, target = 'G'){
  const map = lv.map, H = map.length, W = map[0].length; let st; map.forEach((r, i) => { const j = r.indexOf('S'); if (j >= 0) st = [i, j]; });
  const seen = { [st]: 0 }, qu = [st];
  while (qu.length) { const [r, c] = qu.shift(); if (map[r][c] === target) return seen[[r, c]];
    if (map[r][c] !== 'S' && 'GETW'.includes(map[r][c])) continue;
    for (const [dr, dc] of DIRS) { const nr = r + dr, nc = c + dc, t = (map[nr] || '')[nc]; if (t === undefined || t === '#' || t === 'W' || seen[[nr, nc]] !== undefined) continue; seen[[nr, nc]] = seen[[r, c]] + 1; qu.push([nr, nc]); } }
  return null;
}
if (typeof module !== 'undefined') module.exports = { AG_LEVELS, trainAgent, shortest };
