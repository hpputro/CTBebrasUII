const KNN_DATA = (() => {
  const H = 'H', B = 'B';
  const p = (x, y, c) => ({ x, y, c });
  const hamaCore = [[6,2],[7,3],[8,2],[7.5,1.5],[8.5,3.5],[6.5,3.8],[9,2.5],[6.8,1.2],[8.2,4.2],[7.2,4.6]];
  const baikCore = [[2,7],[3,8],[1.5,6],[3.5,6.5],[2.5,8.8],[4,7.5],[1,8],[3.2,5.4],[1.8,4.8],[4.4,8.6]];
  const core = hamaCore.map(a => p(a[0], a[1], H)).concat(baikCore.map(a => p(a[0], a[1], B)));
  // level 4: panjang tubuh (mm) vs berat (mg)
  const wh = [610, 180, 840, 330, 500, 760, 250, 900, 420, 150, 700, 290];
  const wb = [560, 215, 875, 365, 455, 805, 200, 950, 385, 115, 655, 325];
  const l4train = [], l4test = [];
  [6.2, 7.0, 7.8, 8.6, 6.6, 7.4, 8.2, 9.0, 6.0, 8.8, 7.6, 6.9].forEach((x, i) => l4train.push(p(x, wh[i], H)));
  [1.2, 2.0, 2.8, 3.6, 1.6, 2.4, 3.2, 4.0, 1.0, 3.8, 2.2, 3.0].forEach((x, i) => l4train.push(p(x, wb[i], B)));
  [[7.1, 562, H], [2.6, 612, B], [8.4, 218, H], [1.8, 838, B], [6.4, 873, H], [3.4, 182, B], [7.9, 383, H], [2.9, 498, B], [6.7, 657, H], [1.4, 292, B]]
    .forEach(a => l4test.push(p(a[0], a[1], a[2])));
  return [
    { train: core.slice(0, 6).concat(core.slice(10, 16)), test: [p(7, 2.5, H), p(2.5, 7, B), p(5.2, 3.2, H), p(4.2, 5.6, B), p(5.4, 5.0, null), p(4.8, 4.0, null)], k: 3 },
    { train: core.concat([p(7.1, 2.6, B), p(2.7, 7.3, H), p(8.3, 2.9, B)]),
      test: [p(7.2, 2.4, H), p(2.8, 7.1, B), p(8.2, 3.0, H), p(6.3, 2.8, H), p(2.2, 6.2, B), p(3.6, 7.8, B), p(7.8, 3.8, H), p(1.6, 7.4, B), p(5.6, 3.4, H), p(3.8, 6.0, B)], ks: [1, 3, 5, 7, 9, 15, 23] },
    { train: core.map(q => (q.x === 7 && q.y === 3) ? p(7, 3, B) : (q.x === 3 && q.y === 8) ? p(3, 8, H) : q),
      test: [p(7.1, 3.1, H), p(3.1, 7.9, B), p(6.2, 2.1, H), p(2.1, 6.9, B), p(8.6, 3.3, H), p(1.6, 6.2, B)], k: 1 },
    { train: l4train, test: l4test, ks: [1, 3, 5, 7], scale: { x: 10, y: 1000 } },
  ];
})();
function knnPredict(train, q, k, opt = {}) {
  const sx = opt.norm ? 1 / (opt.scale ? opt.scale.x : 10) : 1, sy = opt.ignoreY ? 0 : opt.norm ? 1 / (opt.scale ? opt.scale.y : 10) : 1;
  const d = train.map((t, i) => ({ i, t, d: Math.hypot((t.x - q.x) * sx, (t.y - q.y) * sy) })).sort((a, b) => a.d - b.d || a.i - b.i).slice(0, k);
  const h = d.filter(e => e.t.c === 'H').length, b = d.length - h;
  return { c: h > b ? 'H' : b > h ? 'B' : d[0].t.c, nb: d, h, b };
}
if (typeof module !== 'undefined') module.exports = { KNN_DATA, knnPredict };
