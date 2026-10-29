/* Setzt src/ und fonts/ zu einer einzigen Datei zusammen: node build.js
   Ausgabe: checkout-trainer.html (zum Herunterladen) und docs/index.html (GitHub Pages). */
const fs = require('fs');
const path = require('path');
const rd = (...p) => fs.readFileSync(path.join(__dirname, ...p));
const src = f => rd('src', f).toString('utf8');

/* Nur die Schnitte, die style.css verwendet, nur Latin-Subset. */
const FONTS = [
  ['Big Shoulders Display', 700, 'big-shoulders-display-latin-700-normal.woff2'],
  ['Big Shoulders Display', 800, 'big-shoulders-display-latin-800-normal.woff2'],
  ['Hanken Grotesk', 400, 'hanken-grotesk-latin-400-normal.woff2'],
  ['Hanken Grotesk', 600, 'hanken-grotesk-latin-600-normal.woff2'],
  ['Hanken Grotesk', 700, 'hanken-grotesk-latin-700-normal.woff2'],
];
const fontFaces = FONTS.map(([family, weight, file]) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;` +
  `src:url(data:font/woff2;base64,${rd('fonts', file).toString('base64')}) format("woff2")}`
).join('\n');

let t = src('template.html');
const rep = (k, v) => { t = t.replace(k, () => v); };
rep('/*CSS*/', fontFaces + '\n' + src('style.css'));
rep('/*ROUTES*/', JSON.stringify(src('routes.txt')));
rep('/*LOGIC*/', src('logic.js') + '\n' + src('daycount.js'));
rep('/*APP*/', src('app.js'));

fs.writeFileSync(path.join(__dirname, 'checkout-trainer.html'), t);
fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'docs', 'index.html'), t);
console.log('checkout-trainer.html und docs/index.html:', (Buffer.byteLength(t) / 1024).toFixed(1), 'KB');
