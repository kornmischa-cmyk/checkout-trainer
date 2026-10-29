/* Reine Logik des Checkout-Trainers (läuft im Browser und in Node). */
(function (root) {
  function dartValue(d) { return ({ S: 1, D: 2, T: 3 })[d.m] * d.n; }
  function label(d) {
    if (d.n === 25) return d.m === 'D' ? 'Bull' : '25';
    return d.m + d.n;
  }
  function parseToken(t) {
    if (t === 'Bull') return { m: 'D', n: 25 };
    return { m: t[0], n: parseInt(t.slice(1), 10) };
  }
  function parseRoutes(txt) {
    var out = {};
    txt.trim().split('\n').forEach(function (l) {
      var p = l.trim().split(/\s+/);
      out[+p[0]] = p.slice(1).map(parseToken);
    });
    return out;
  }
  function routeText(r) { return r.map(label).join(' '); }
  function sum(darts) { return darts.reduce(function (a, d) { return a + dartValue(d); }, 0); }
  function isValidDart(d) {
    if (d.n === 25) return d.m !== 'T';
    return d.n >= 1 && d.n <= 20;
  }
  /* Bewertet eine eingegebene Dartfolge. */
  function evaluate(score, darts) {
    var s = sum(darts);
    var last = darts[darts.length - 1];
    var lastDouble = !!last && last.m === 'D';
    return { ok: darts.length > 0 && darts.length <= 3 && s === score && lastDouble, sum: s, lastDouble: lastDouble };
  }
  function pool(routesObj, lo, hi) {
    var a = [];
    for (var i = Math.max(2, lo); i <= Math.min(170, hi); i++) a.push(i);
    return a;
  }
  var WEIGHTS = [6, 8, 5, 3, 2, 1]; /* Index = Box, 0 = noch nie gesehen */
  function pick(poolArr, boxes, lastScore, rnd) {
    var cand = poolArr.filter(function (s) { return s !== lastScore; });
    if (!cand.length) cand = poolArr.slice();
    var w = cand.map(function (s) { return WEIGHTS[boxes[s] || 0]; });
    var total = w.reduce(function (a, b) { return a + b; }, 0);
    var r = rnd() * total;
    for (var i = 0; i < cand.length; i++) { r -= w[i]; if (r < 0) return cand[i]; }
    return cand[cand.length - 1];
  }
  /* Neue Box nach einer Antwort. Mit Tipp gibt es keine Beförderung. */
  function nextBox(box, correct, hinted) {
    box = box || 0;
    if (!correct) return 1;
    if (hinted) return Math.max(box, 1);
    return Math.min(5, Math.max(box, 1) + 1);
  }
  var api = { dartValue: dartValue, label: label, parseRoutes: parseRoutes, routeText: routeText, sum: sum,
    isValidDart: isValidDart, evaluate: evaluate, pool: pool, pick: pick, nextBox: nextBox, WEIGHTS: WEIGHTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CO = api;
})(typeof window !== 'undefined' ? window : globalThis);
