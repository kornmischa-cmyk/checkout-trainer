(function () {
  var ROUTES = CO.parseRoutes(window.ROUTES_TXT);
  var RANGES = [[2, 40, '2–40'], [41, 60, '41–60'], [61, 100, '61–100'], [101, 170, '101–170'], [2, 170, 'Alles']];
  var BOGEY_RANGE = 3, ALL = 4; /* "Nicht checkbar" nur bei 101–170; bei "Alles" werden Bogeys nicht abgefragt */
  var KEY = 'checkout-trainer-v1';
  var BOXCOL = ['var(--b0)', 'var(--b1)', 'var(--b2)', 'var(--b3)', 'var(--b4)', 'var(--b5)'];
  var PRIVACY_URL = 'https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement';
  var st = { tab: 'train', range: 1, boxes: {}, cur: null, sess: DC.normalize(null, DC.today()), last: null, confirmReset: false, mult: 'S', focusPrimary: false };

  /* Lucide-Icons (ISC-Lizenz), nur die Pfade */
  function icon(paths, cls) {
    return '<svg class="' + (cls || 'i') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (cls ? '2.5' : '2') +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }
  var I_CHECK = '<path d="M20 6 9 17l-5-5"/>';
  var I_X = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
  var I_UNDO = '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>';
  var I_PENCIL = '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>';

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o) { st.boxes = o.boxes || {}; if (typeof o.range === 'number' && RANGES[o.range]) st.range = o.range; }
    } catch (e) {}
    try { st.sess = DC.load(localStorage, DC.today()); } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ boxes: st.boxes, range: st.range })); } catch (e) {} }
  function saveSess() { try { DC.save(localStorage, st.sess); } catch (e) {} }
  function poolNow() { var r = RANGES[st.range]; return CO.pool(ROUTES, r[0], r[1]); }
  function trainPool() {
    var p = poolNow();
    return st.range === ALL ? p.filter(function (s) { return !isBogey(s); }) : p;
  }
  function nextQuestion() {
    var s = CO.pick(trainPool(), st.boxes, st.last, Math.random);
    st.cur = { score: s, darts: [], hint: false, res: null, undo: null };
    st.mult = 'S';
  }
  function isBogey(s) { return !ROUTES[s]; }
  function boxName(b) { return b ? 'Box ' + b : 'Neu'; }
  function $(id) { return document.getElementById(id); }

  function chipsHtml() {
    var h = '<div class="chips" role="group" aria-label="Zahlenbereich">';
    RANGES.forEach(function (r, i) { h += '<button class="chip" data-a="range" data-i="' + i + '" aria-pressed="' + (i === st.range) + '">' + r[2] + '</button>'; });
    return h + '</div>';
  }
  function slotsHtml() {
    var c = st.cur, done = !!c.res, rem = c.score, h = '<div class="slots">';
    for (var i = 0; i < 3; i++) {
      var d = c.darts[i];
      if (d) {
        rem -= CO.dartValue(d);
        h += '<div class="slot filled"><span class="d">' + CO.label(d) + '</span><span class="sub">Rest ' + rem + '</span></div>';
      } else if (c.hint && i === 0 && !done && ROUTES[c.score]) {
        h += '<div class="slot next hint"><span class="d">' + CO.label(ROUTES[c.score][0]) + '</span><span class="sub">Tipp</span></div>';
      } else {
        h += '<div class="slot' + (i === c.darts.length && !done ? ' next' : '') + '"><span class="d">–</span><span class="sub">Dart ' + (i + 1) + '</span></div>';
      }
    }
    return h + '</div>';
  }
  function padHtml() {
    var c = st.cur, full = c.darts.length >= 3, m = st.mult;
    var h = '<div class="pad"><div class="mult" role="group" aria-label="Ring">';
    [['S', 'Single'], ['D', 'Double'], ['T', 'Triple']].forEach(function (r) {
      h += '<button class="m" data-a="mult" data-m="' + r[0] + '" aria-pressed="' + (m === r[0]) + '">' + r[1] + '</button>';
    });
    h += '</div><div class="nums">';
    var ring = { S: 'Single ', D: 'Double ', T: 'Triple ' }[m], pre = m === 'S' ? '' : '<span class="pre" aria-hidden="true">' + m + '</span>';
    for (var n = 1; n <= 20; n++) {
      h += '<button class="n" data-a="num" data-n="' + n + '" aria-label="' + ring + n + '"' + (full ? ' disabled' : '') + '>' + pre + n + '</button>';
    }
    h += '<button class="n' + (m === 'D' ? ' bull-d' : '') + '" data-a="num" data-n="25" aria-label="' + (m === 'D' ? 'Bull, 50' : 'Single Bull, 25') + '"' +
      (full || m === 'T' ? ' disabled' : '') + '>' + (m === 'D' ? 'Bull' : '25') + '</button>';
    h += '</div><div class="aux' + (st.range === BOGEY_RANGE ? ' three' : '') + '">';
    h += '<button class="ghost" data-a="undo"' + (c.darts.length ? '' : ' disabled') + '>' + icon(I_UNDO) + 'Zurück</button>';
    h += '<button class="ghost" data-a="hint"' + (c.hint || isBogey(c.score) ? ' disabled' : '') + '>Tipp: 1. Dart</button>';
    if (st.range === BOGEY_RANGE) h += '<button class="ghost dashed" data-a="bogey">Nicht checkbar</button>';
    return h + '</div></div>';
  }
  function resultHtml() {
    var c = st.cur, r = c.res, std = ROUTES[c.score];
    var h = '<div class="result ' + (r.ok ? 'ok' : 'no') + '" role="status"><div class="res-head">';
    h += '<h2 class="res-title">' + icon(r.ok ? I_CHECK : I_X, 'big') + r.title + '</h2>';
    h += '<span class="pill plain"><i class="dot" style="--c:' + BOXCOL[r.nb] + '"></i>' +
      (r.old === r.nb ? boxName(r.nb) + ' bleibt' : boxName(r.old) + ' → ' + boxName(r.nb)) + '</span></div>';
    h += '<div class="res-body"><p>' + r.body + '</p>';
    if (!r.ok) h += '<button class="ghost" data-a="correct">' + icon(I_PENCIL) + 'Vertippt</button>';
    h += '</div>';
    if (r.hinted) h += '<p class="res-note">Mit Tipp gelöst, darum kein Aufstieg.</p>';
    h += '<div class="res-route"><span class="lbl">Standardweg</span><span class="route">' + (std ? CO.routeText(std) : 'Nicht checkbar') + '</span></div>';
    return h + '</div>';
  }
  function trainHtml() {
    var c = st.cur, done = !!c.res, b = st.boxes[c.score] || 0, s = st.sess;
    var h = chipsHtml();
    h += '<section class="board" aria-label="Aufgabe"><div class="score-row">';
    h += '<div class="score-main"><span class="lbl">Rest</span><span class="score">' + c.score + '</span></div>';
    h += '<div class="score-side"><span class="pill"><i class="dot" style="--c:' + BOXCOL[b] + '"></i>' + (b ? 'Box ' + b + ' von 5' : 'Neu') + '</span>';
    h += '<span class="meta">bis 3 Darts · Double am Ende</span>';
    h += '<span class="meta">Heute <b>' + s.ok + '/' + s.n + '</b> · Serie <b>' + s.streak + '</b></span></div></div>';
    h += slotsHtml();
    h += '<div class="region">' + (done ? resultHtml() : padHtml()) + '</div>';
    h += '<button class="primary" id="primary" data-a="primary"' + (!done && !c.darts.length ? ' disabled' : '') + '>' + (done ? 'Nächster Checkout' : 'Prüfen') + '</button>';
    h += '</section>';
    h += '<p class="note">Jeder Weg zählt, wenn die Summe stimmt und der letzte Dart ein Double ist. Mit Tipp kein Aufstieg, ein Fehler setzt auf Box 1.</p>';
    return h;
  }
  function tilesHtml(lo, hi) {
    var h = '<div class="grid' + (hi > 60 ? ' wide' : '') + '">';
    for (var s = hi; s >= lo; s--) {
      var b = st.boxes[s] || 0, bog = isBogey(s);
      h += '<div class="cell' + (bog ? ' bogey' : '') + '" style="--c:' + BOXCOL[b] + '"><div class="cell-top"><span class="cn">' + s + '</span>' +
        (b ? '<span class="cb" aria-label="Box ' + b + '">' + b + '</span>' : '') + '</div><span class="cr">' + (bog ? 'nicht checkbar' : CO.routeText(ROUTES[s])) + '</span></div>';
    }
    return h + '</div>';
  }
  function sitsIn(lo, hi) {
    var n = 0;
    for (var s = lo; s <= hi; s++) if ((st.boxes[s] || 0) >= 4) n++;
    return n;
  }
  function overviewHtml() {
    var p = poolNow(), c = [0, 0, 0, 0, 0, 0], b;
    p.forEach(function (s) { c[st.boxes[s] || 0]++; });
    var h = chipsHtml() + '<div class="over">';
    h += '<div class="prog"><span><b>' + (c[4] + c[5]) + ' von ' + p.length + '</b> sitzen</span><span class="meta">Box 4 oder 5</span></div>';
    h += '<div class="bar" aria-hidden="true">';
    for (b = 5; b >= 0; b--) if (c[b]) h += '<i style="width:' + (c[b] / p.length * 100) + '%;background:' + BOXCOL[b] + '"></i>';
    h += '</div><div class="legend">';
    for (b = 0; b <= 5; b++) h += '<div style="--c:' + BOXCOL[b] + '"><span>' + boxName(b) + '</span><b>' + c[b] + '</b></div>';
    h += '</div>';
    if (st.range === ALL) {
      [3, 2, 1, 0].forEach(function (i) {
        var r = RANGES[i];
        h += '<div class="group"><div class="group-head"><h2 class="lbl">' + r[2] + '</h2><span>' + sitsIn(r[0], r[1]) + ' von ' + (r[1] - r[0] + 1) + ' sitzen</span></div>' + tilesHtml(r[0], r[1]) + '</div>';
      });
    } else {
      h += tilesHtml(RANGES[st.range][0], RANGES[st.range][1]);
    }
    h += '<div class="reset">';
    if (st.confirmReset) {
      h += '<span>Alle Boxen auf Neu setzen?</span><button class="ghost danger" data-a="reset-yes">Ja, zurücksetzen</button><button class="ghost" data-a="reset-no">Abbrechen</button>';
    } else h += '<button class="ghost" data-a="reset">Fortschritt zurücksetzen</button>';
    h += '</div><p class="note">Standardrouten. ' + (window.CT_HOSTED
      ? 'Diese App speichert deinen Fortschritt nur in deinem Browser und sendet keine Daten. Gehostet bei <a href="' + PRIVACY_URL + '" rel="noopener">GitHub Pages</a>.'
      : 'Der Fortschritt bleibt in diesem Browser auf diesem Gerät.') + '</p></div>';
    return h;
  }
  function render() {
    st.sess = DC.normalize(st.sess, DC.today());
    var train = st.tab === 'train';
    var h = '<header><h1 class="brand">Checkout<span>.</span>Trainer</h1><nav class="tabs" role="tablist">';
    h += '<button class="tab" role="tab" data-a="tab" data-t="train" aria-selected="' + train + '">Training</button>';
    h += '<button class="tab" role="tab" data-a="tab" data-t="over" aria-selected="' + !train + '">Übersicht</button></nav></header>';
    h += train ? trainHtml() : overviewHtml();
    $('app').innerHTML = h;
    if (st.focusPrimary) { st.focusPrimary = false; var p = $('primary'); if (p) p.focus({ preventScroll: true }); }
  }
  function finish(ok, title, body) {
    var c = st.cur, old = st.boxes[c.score] || 0, nb = CO.nextBox(old, ok, c.hint);
    c.undo = { box: st.boxes[c.score], sess: { day: st.sess.day, n: st.sess.n, ok: st.sess.ok, streak: st.sess.streak }, last: st.last };
    st.boxes[c.score] = nb; save();
    st.sess = DC.record(st.sess, ok, DC.today()); saveSess();
    c.res = { ok: ok, title: title, body: body, old: old, nb: nb, hinted: c.hint && ok };
    st.last = c.score;
    st.focusPrimary = true;
  }
  /* "Vertippt": Wertung zurücknehmen (Box, Tageszähler, Serie), Darts bleiben stehen. */
  function correct() {
    var c = st.cur, u = c.undo;
    if (!c.res || c.res.ok || !u) return;
    if (u.box === undefined) delete st.boxes[c.score]; else st.boxes[c.score] = u.box;
    save();
    st.sess = u.sess; saveSess();
    st.last = u.last;
    c.res = null; c.undo = null;
  }
  function check() {
    var c = st.cur, e = CO.evaluate(c.score, c.darts), std = ROUTES[c.score];
    if (e.ok) {
      var same = std && CO.routeText(std) === CO.routeText(c.darts);
      finish(true, 'Richtig', same ? 'Das ist der Standardweg.' : 'Ein anderer gültiger Weg, ' + CO.routeText(c.darts) + '.');
    } else if (!std) {
      finish(false, 'Nicht ganz', c.score + ' lässt sich mit drei Darts nicht checken.');
    } else if (e.sum !== c.score) {
      finish(false, 'Nicht ganz', 'Deine Darts ergeben ' + e.sum + ', gebraucht werden ' + c.score + '.');
    } else {
      finish(false, 'Nicht ganz', 'Die Summe passt, aber der letzte Dart muss ein Double sein.');
    }
  }
  function bogey() {
    var c = st.cur;
    if (isBogey(c.score)) finish(true, 'Richtig', c.score + ' ist mit drei Darts nicht checkbar. Setup-Dart spielen.');
    else finish(false, 'Nicht ganz', c.score + ' ist mit drei Darts checkbar.');
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    var a = b.dataset.a, c = st.cur;
    if (a === 'tab') { st.tab = b.dataset.t; st.confirmReset = false; }
    else if (a === 'range') { st.range = +b.dataset.i; save(); nextQuestion(); }
    else if (a === 'mult') { if (!c.res) st.mult = b.dataset.m; }
    else if (a === 'num') {
      var n = +b.dataset.n;
      if (c.darts.length < 3 && !c.res && !(n === 25 && st.mult === 'T')) { c.darts.push({ m: st.mult, n: n }); st.mult = 'S'; }
    }
    else if (a === 'undo') { if (!c.res) c.darts.pop(); }
    else if (a === 'hint') { if (!c.res) c.hint = true; }
    else if (a === 'primary') { if (c.res) nextQuestion(); else if (c.darts.length) check(); }
    else if (a === 'bogey') { if (!c.res) bogey(); }
    else if (a === 'correct') correct();
    else if (a === 'reset') st.confirmReset = true;
    else if (a === 'reset-no') st.confirmReset = false;
    else if (a === 'reset-yes') { st.boxes = {}; st.confirmReset = false; save(); }
    render();
  });
  load(); nextQuestion(); render();
})();
