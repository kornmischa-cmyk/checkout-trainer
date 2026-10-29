(function () {
  var ROUTES = CO.parseRoutes(window.ROUTES_TXT);
  var RANGES = [[2, 40, '2–40'], [41, 60, '41–60'], [61, 100, '61–100'], [101, 170, '101–170'], [2, 170, 'Alles']];
  var KEY = 'checkout-trainer-v1';
  var BOXCOL = ['var(--b0)', 'var(--b1)', 'var(--b2)', 'var(--b3)', 'var(--b4)', 'var(--b5)'];
  var st = { tab: 'train', range: 1, boxes: {}, cur: null, sess: { n: 0, ok: 0, streak: 0 }, last: null, confirmReset: false, mult: 'S' };

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o) { st.boxes = o.boxes || {}; if (typeof o.range === 'number' && RANGES[o.range]) st.range = o.range; }
    } catch (e) {}
    try { st.sess = DC.load(localStorage, DC.today()); } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ boxes: st.boxes, range: st.range })); } catch (e) {} }
  function poolNow() { var r = RANGES[st.range]; return CO.pool(ROUTES, r[0], r[1]); }
  function nextQuestion() {
    var s = CO.pick(poolNow(), st.boxes, st.last, Math.random);
    st.cur = { score: s, darts: [], hint: false, res: null };
    st.mult = 'S';
  }
  function isBogey(s) { return !ROUTES[s]; }
  function $(id) { return document.getElementById(id); }

  function slotsHtml() {
    var c = st.cur, rem = c.score, h = '';
    for (var i = 0; i < 3; i++) {
      var d = c.darts[i];
      if (d) {
        rem -= CO.dartValue(d);
        h += '<div class="slot filled"><span class="d">' + CO.label(d) + '</span><span class="rest">Rest ' + rem + '</span></div>';
      } else if (c.hint && i === 0 && !c.res && ROUTES[c.score]) {
        h += '<div class="slot hint next"><span class="d">' + CO.label(ROUTES[c.score][0]) + '</span><span class="rest">Tipp</span></div>';
      } else {
        h += '<div class="slot' + (i === c.darts.length && !c.res ? ' next' : '') + '"><span class="empty">–</span><span class="rest">Dart ' + (i + 1) + '</span></div>';
      }
    }
    return h;
  }
  function resultHtml() {
    var c = st.cur, r = c.res; if (!r) return '';
    var std = ROUTES[c.score];
    var h = '<div class="result ' + (r.ok ? 'ok' : 'no') + '" role="status"><h2>' + r.title + '</h2>';
    if (r.body) h += '<p>' + r.body + '</p>';
    if (std) h += '<div><div class="lbl">Standardweg</div><div class="route">' + CO.routeText(std) + '</div></div>';
    h += '<p class="small">' + r.boxNote + '</p>';
    h += '<div class="actions"><button class="btn primary" data-a="next" id="nextbtn">Nächster Checkout</button></div></div>';
    return h;
  }
  function boxPill(s) {
    var b = st.boxes[s] || 0;
    return '<span class="box-pill"><i class="dot" style="background:' + BOXCOL[b] + '"></i>' + (b ? 'Box ' + b + ' von 5' : 'Neu') + '</span>';
  }
  function trainHtml() {
    var c = st.cur, done = !!c.res, full = c.darts.length >= 3;
    var h = '<div class="chips" role="group" aria-label="Zahlenbereich">';
    RANGES.forEach(function (r, i) { h += '<button class="chip" data-a="range" data-i="' + i + '" aria-pressed="' + (i === st.range) + '">' + r[2] + '</button>'; });
    h += '</div>';
    h += '<section class="board" aria-label="Aufgabe"><div class="score-row"><div><div class="lbl">Rest</div><div class="score">' + c.score + '</div></div>';
    h += '<div class="box-badge">' + boxPill(c.score) + '<span class="small">bis zu 3 Darts, Ende auf Double</span></div></div>';
    h += '<div class="slots">' + slotsHtml() + '</div>';
    h += '<div class="pad"><div class="mult" role="group" aria-label="Ring">';
    [['S', 'Single'], ['D', 'Double'], ['T', 'Triple']].forEach(function (m) {
      h += '<button class="m" data-a="mult" data-m="' + m[0] + '" aria-pressed="' + (st.mult === m[0]) + '"' + (done ? ' disabled' : '') + '>' + m[1] + '</button>';
    });
    h += '</div><div class="nums">';
    for (var n = 1; n <= 20; n++) h += '<button class="n" data-a="num" data-n="' + n + '"' + (done || full ? ' disabled' : '') + '>' + n + '</button>';
    h += '<button class="n bull" data-a="num" data-n="25"' + (done || full || st.mult === 'T' ? ' disabled' : '') + '>' + (st.mult === 'D' ? 'Bull (50)' : '25 (Single Bull)') + '</button>';
    h += '</div></div>';
    h += '<div class="actions"><button class="btn" data-a="undo"' + (done || !c.darts.length ? ' disabled' : '') + '>Zurück</button>';
    h += '<button class="btn" data-a="hint"' + (done || c.hint || isBogey(c.score) ? ' disabled' : '') + '>Tipp: erster Dart</button>';
    h += '<button class="btn" data-a="bogey"' + (done ? ' disabled' : '') + '>Nicht checkbar</button>';
    h += '<button class="btn primary" data-a="check"' + (done || !c.darts.length ? ' disabled' : '') + '>Prüfen</button></div>';
    h += resultHtml() + '</section>';
    h += '<p class="note">Jeder gültige Weg zählt: Summe stimmt und der letzte Dart ist ein Double. Mit Tipp gibt es keine neue Box, ein Fehler setzt auf Box 1 zurück.</p>';
    return h;
  }
  function counts() {
    var c = [0, 0, 0, 0, 0, 0], p = poolNow();
    p.forEach(function (s) { c[st.boxes[s] || 0]++; });
    return { c: c, total: p.length, sits: c[4] + c[5] };
  }
  function overviewHtml() {
    var p = poolNow(), k = counts(), h = '';
    h += '<div class="chips" role="group" aria-label="Zahlenbereich">';
    RANGES.forEach(function (r, i) { h += '<button class="chip" data-a="range" data-i="' + i + '" aria-pressed="' + (i === st.range) + '">' + r[2] + '</button>'; });
    h += '</div><div class="prog"><div><b>' + k.sits + ' von ' + k.total + '</b> sitzen <span class="small">(Box 4 oder 5)</span></div><div class="bar" aria-hidden="true">';
    for (var b = 5; b >= 0; b--) if (k.c[b]) h += '<i style="width:' + (k.c[b] / k.total * 100) + '%;background:' + BOXCOL[b] + '"></i>';
    h += '</div><div class="legend">';
    h += '<span><i class="dot"></i>Neu ' + k.c[0] + '</span>';
    for (b = 1; b <= 5; b++) h += '<span><i class="dot" style="background:' + BOXCOL[b] + '"></i>Box ' + b + ': ' + k.c[b] + '</span>';
    h += '</div></div><div class="grid">';
    p.slice().reverse().forEach(function (s) {
      var b = st.boxes[s] || 0, bog = isBogey(s);
      h += '<div class="cell' + (bog ? ' bogey' : '') + '" style="--c:' + BOXCOL[b] + '"><span class="cn">' + s + '</span><span class="cr">' + (bog ? 'nicht checkbar' : CO.routeText(ROUTES[s])) + '</span>' + (b ? '<span class="cb">' + b + '</span>' : '') + '</div>';
    });
    h += '</div><div class="resetbox">';
    if (st.confirmReset) {
      h += '<span>Alle Boxen auf Neu setzen?</span><button class="btn danger" data-a="reset-yes">Ja, zurücksetzen</button><button class="btn ghost" data-a="reset-no">Abbrechen</button>';
    } else h += '<button class="btn ghost" data-a="reset">Fortschritt zurücksetzen</button>';
    h += '</div><p class="note">Die Wege sind die gängigen Standardrouten. Dein Fortschritt liegt in diesem Browser auf diesem Gerät.</p>';
    return h;
  }
  function render() {
    var s = st.sess = DC.normalize(st.sess, DC.today());
    var h = '<header><h1>Checkout<span>.</span>Trainer</h1><div class="session">Heute <b>' + s.ok + '/' + s.n + '</b> richtig · Serie <b>' + s.streak + '</b></div></header>';
    h += '<div class="tabs" role="tablist"><button class="tab" role="tab" data-a="tab" data-t="train" aria-selected="' + (st.tab === 'train') + '">Training</button><button class="tab" role="tab" data-a="tab" data-t="over" aria-selected="' + (st.tab === 'over') + '">Übersicht</button></div>';
    h += st.tab === 'train' ? trainHtml() : overviewHtml();
    $('app').innerHTML = h;
    if (st.tab === 'train' && st.cur.res) { var nb = $('nextbtn'); if (nb) nb.focus({ preventScroll: true }); }
  }
  function finish(ok, title, body) {
    var c = st.cur, old = st.boxes[c.score] || 0, nb = CO.nextBox(old, ok, c.hint);
    st.boxes[c.score] = nb; save();
    st.sess = DC.record(st.sess, ok, DC.today());
    try { DC.save(localStorage, st.sess); } catch (e) {}
    var note = c.hint && ok ? 'Mit Tipp gelöst: Box bleibt bei ' + nb + '.' : (nb === old ? 'Box ' + nb + ' bleibt.' : (old ? 'Box ' + old : 'Neu') + ' → Box ' + nb + '.');
    c.res = { ok: ok, title: title, body: body, boxNote: note };
    st.last = c.score;
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
    else if (a === 'mult') st.mult = b.dataset.m;
    else if (a === 'num') {
      if (c.darts.length < 3 && !c.res) { c.darts.push({ m: st.mult, n: +b.dataset.n }); st.mult = 'S'; }
    }
    else if (a === 'undo') c.darts.pop();
    else if (a === 'hint') c.hint = true;
    else if (a === 'check') check();
    else if (a === 'bogey') bogey();
    else if (a === 'next') nextQuestion();
    else if (a === 'reset') st.confirmReset = true;
    else if (a === 'reset-no') st.confirmReset = false;
    else if (a === 'reset-yes') { st.boxes = {}; st.confirmReset = false; save(); }
    render();
  });
  load(); nextQuestion(); render();
})();
