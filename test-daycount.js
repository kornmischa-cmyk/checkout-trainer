/* Tests für src/daycount.js: node test-daycount.js */
const assert = require('assert');
const DC = require('./src/daycount.js');

function memStorage(init) {
  const m = Object.assign({}, init);
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m };
}

// Tagesschlüssel in Ortszeit, Tageswechsel um 0 Uhr
assert.equal(DC.dayKey(new Date(2026, 9, 29, 23, 59, 59)), '2026-10-29');
assert.equal(DC.dayKey(new Date(2026, 9, 30, 0, 0, 0)), '2026-10-30');
assert.equal(DC.dayKey(new Date(2026, 0, 5, 12)), '2026-01-05');

// Zählen innerhalb eines Tages
let s = DC.normalize(null, 'A');
assert.deepEqual(s, { day: 'A', n: 0, ok: 0, streak: 0 });
s = DC.record(s, true, 'A'); s = DC.record(s, true, 'A');
assert.deepEqual(s, { day: 'A', n: 2, ok: 2, streak: 2 });
s = DC.record(s, false, 'A');
assert.deepEqual(s, { day: 'A', n: 3, ok: 2, streak: 0 });
s = DC.record(s, true, 'A');
assert.deepEqual(s, { day: 'A', n: 4, ok: 3, streak: 1 });

// record verändert den alten Stand nicht
const before = { day: 'A', n: 1, ok: 1, streak: 1 };
DC.record(before, true, 'A');
assert.deepEqual(before, { day: 'A', n: 1, ok: 1, streak: 1 });

// Neuer Tag: Heute auf 0, Serie läuft weiter
s = { day: 'A', n: 10, ok: 8, streak: 5 };
assert.deepEqual(DC.normalize(s, 'B'), { day: 'B', n: 0, ok: 0, streak: 5 });
assert.deepEqual(DC.record(s, true, 'B'), { day: 'B', n: 1, ok: 1, streak: 6 });
assert.deepEqual(DC.record(s, false, 'B'), { day: 'B', n: 1, ok: 0, streak: 0 });

// Kaputte oder fremde Werte führen nicht zu NaN oder Unsinn
assert.deepEqual(DC.normalize({ day: 'A', n: 'x', ok: -1, streak: 2.5 }, 'A'), { day: 'A', n: 0, ok: 0, streak: 0 });
assert.deepEqual(DC.normalize({ day: 'A', n: 2, ok: 9, streak: 3 }, 'A'), { day: 'A', n: 2, ok: 2, streak: 3 });
assert.deepEqual(DC.normalize('Unsinn', 'A'), { day: 'A', n: 0, ok: 0, streak: 0 });

// Speichern und Laden (Neuladen der Seite)
const st = memStorage();
DC.save(st, { day: 'A', n: 3, ok: 2, streak: 1 });
assert.deepEqual(DC.load(st, 'A'), { day: 'A', n: 3, ok: 2, streak: 1 });
assert.deepEqual(DC.load(st, 'B'), { day: 'B', n: 0, ok: 0, streak: 1 });
// eigener Key, Boxen-Speicher bleibt unberührt
assert.deepEqual(Object.keys(st.m), ['checkout-trainer-day-v1']);

// Defektes JSON und gesperrter Speicher brechen nichts
assert.deepEqual(DC.load(memStorage({ 'checkout-trainer-day-v1': '{kaputt' }), 'A'), { day: 'A', n: 0, ok: 0, streak: 0 });
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
assert.deepEqual(DC.load(broken, 'A'), { day: 'A', n: 0, ok: 0, streak: 0 });
assert.equal(DC.save(broken, s), false);

console.log('Tageszähler: alle Tests bestanden');
