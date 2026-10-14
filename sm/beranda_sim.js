const CATS = [['sains','Sains','🔬'],['olahraga','Olahraga','⚽'],['musik','Musik','🎵'],['gim','Gim','🎮'],['sensasi','Konten heboh','😱']];
const USERS = {
  raka:{ name:'Raka', av:'🧑', I:[0.5,0.6,0.5,0.7,0.45] },
  sinta:{ name:'Sinta', av:'👧', I:[0.75,0.3,0.65,0.35,0.4] },
  dimas:{ name:'Dimas', av:'👦', I:[0.35,0.75,0.4,0.55,0.55] },
};
const BONUS = [0,0,0,0,0.45];
function simulate(user, A, N, S, days = 30){
  let I = user.I.slice(), E = [0.2,0.2,0.2,0.2,0.2], W = 70;
  const hist = { watch:[], div:[], well:[], share:[] };
  for (let d = 0; d < days; d++) {
    const nov = E.map(e => Math.max(0, 0.35 - e) / 0.35);
    const sc = I.map((v, c) => (A / 10) * 6 * (v + BONUS[c]) + (N / 10) * 3 * nov[c] - (S / 10) * 4 * (c === 4 ? 1 : 0));
    const mx = Math.max(...sc), ex = sc.map(s => Math.exp(s - mx)), Z = ex.reduce((a, b) => a + b, 0), p = ex.map(e => e / Z);
    const watch = p.reduce((a, pc, c) => a + pc * (I[c] + BONUS[c]), 0) * 60;
    const H = -p.reduce((a, pc) => a + (pc > 1e-9 ? pc * Math.log(pc) : 0), 0) / Math.log(5);
    W = Math.max(0, Math.min(100, W + 2 * (H - 0.55) - 5 * Math.max(0, p[4] - 0.25)));
    I = I.map((v, c) => Math.max(0.05, Math.min(1, v + 0.15 * (p[c] - 0.2))));
    E = E.map((e, c) => 0.6 * e + 0.4 * p[c]);
    hist.watch.push(watch); hist.div.push(H * 100); hist.well.push(W); hist.share.push(p);
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  return { hist, watch: avg(hist.watch), div: avg(hist.div.slice(-10)), well: W, finalShare: hist.share[days - 1], I };
}
if (typeof module !== 'undefined') module.exports = { CATS, USERS, simulate };
