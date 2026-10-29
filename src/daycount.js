/* Tageszähler des Checkout-Trainers (läuft im Browser und in Node).
   "Heute x/y" gilt pro Kalendertag (Ortszeit, neuer Tag um 0 Uhr).
   Die Serie läuft über Tage weiter und fällt nur bei einem Fehler auf 0. */
(function (root) {
  var KEY = 'checkout-trainer-day-v1';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* Tagesschlüssel in Ortszeit, z. B. "2026-10-29". */
  function dayKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function today() { return dayKey(new Date()); }

  function count(v) { return typeof v === 'number' && v >= 0 && Math.floor(v) === v ? v : 0; }

  /* Bringt einen (evtl. alten oder kaputten) Stand auf den Tag "day".
     Neuer Tag: Heute-Werte auf 0, Serie bleibt. */
  function normalize(state, day) {
    var s = state && typeof state === 'object' ? state : {};
    var streak = count(s.streak);
    if (s.day !== day) return { day: day, n: 0, ok: 0, streak: streak };
    var n = count(s.n), ok = Math.min(count(s.ok), n);
    return { day: day, n: n, ok: ok, streak: streak };
  }

  /* Neuer Stand nach einer Antwort. Verändert "state" nicht. */
  function record(state, correct, day) {
    var s = normalize(state, day);
    s.n++;
    if (correct) { s.ok++; s.streak++; } else s.streak = 0;
    return s;
  }

  /* Speicherzugriffe schlagen still fehl (z. B. privater Modus), die App läuft dann ohne Persistenz weiter. */
  function load(storage, day) {
    var o = null;
    try { o = JSON.parse(storage.getItem(KEY) || 'null'); } catch (e) {}
    return normalize(o, day);
  }
  function save(storage, state) {
    try { storage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  var api = { KEY: KEY, dayKey: dayKey, today: today, normalize: normalize, record: record, load: load, save: save };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DC = api;
})(typeof window !== 'undefined' ? window : globalThis);
