/* Setzt src/ und fonts/ zusammen: node build.js
   - checkout-trainer.html: eine einzige Datei zum Herunterladen, läuft offline per Doppelklick.
   - docs/: dieselbe App für GitHub Pages (Quelle main /docs), zusätzlich Manifest, Service Worker
     und Icons, damit sie sich auf dem Homescreen installieren lässt. Die Icons erzeugt make-icons.js. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = (...p) => path.join(__dirname, ...p);
const src = f => fs.readFileSync(root('src', f), 'utf8');

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
  `src:url(data:font/woff2;base64,${fs.readFileSync(root('fonts', file)).toString('base64')}) format("woff2")}`
).join('\n');

function page(pwaHead) {
  let t = src('template.html');
  const rep = (k, v) => { if (!t.includes(k)) throw new Error('Platzhalter fehlt: ' + k); t = t.replace(k, () => v); };
  rep('<!--PWA-->', pwaHead);
  rep('/*CSS*/', fontFaces + '\n' + src('style.css'));
  rep('/*ROUTES*/', JSON.stringify(src('routes.txt')));
  rep('/*LOGIC*/', src('logic.js') + '\n' + src('daycount.js'));
  rep('/*APP*/', src('app.js'));
  return t;
}

const download = page('');
const pages = page([
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" href="icons/icon-192.png" type="image/png">',
  '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Checkout">',
  '<script>window.CT_HOSTED = true;',
  "if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });</script>",
].join('\n'));

const version = crypto.createHash('sha256')
  .update(pages).update(src('manifest.webmanifest')).update(src('sw.js')).digest('hex').slice(0, 10);

fs.writeFileSync(root('checkout-trainer.html'), download);
fs.mkdirSync(root('docs'), { recursive: true });
fs.writeFileSync(root('docs', 'index.html'), pages);
fs.writeFileSync(root('docs', 'manifest.webmanifest'), src('manifest.webmanifest'));
fs.writeFileSync(root('docs', 'sw.js'), src('sw.js').replace('/*VERSION*/', version));
fs.writeFileSync(root('docs', '.nojekyll'), '');

const kb = s => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';
console.log('checkout-trainer.html', kb(download), '| docs/index.html', kb(pages), '| Cache', version);
if (!fs.existsSync(root('docs', 'icons', 'icon-512.png'))) console.log('Hinweis: Icons fehlen, node make-icons.js ausführen.');
