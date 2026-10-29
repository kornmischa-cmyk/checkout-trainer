/* Erzeugt die Homescreen-Icons in docs/icons/ aus der Vorlage des Designs:
   „170" in Scoreboard-Gelb über „CHECKOUT" in Kreide, vollflächig auf Boardgrün.
   Nur nötig, wenn sich das Icon ändert. Braucht Playwright mit Chromium:
   npm install --no-save playwright && npx playwright install chromium && node make-icons.js */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const font = f => fs.readFileSync(path.join(__dirname, 'fonts', f)).toString('base64');

/* scale: Inhalt relativ zur 512er-Vorlage; maskierbar = 80 % (Safe Zone). */
const ICONS = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.8],
  ['apple-touch-icon.png', 180, 1],
];

const html = (size, scale) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:BSD;font-weight:800;src:url(data:font/woff2;base64,${font('big-shoulders-display-latin-800-normal.woff2')}) format("woff2")}
html,body{margin:0;width:${size}px;height:${size}px;background:#0A130E;overflow:hidden}
.c{width:512px;height:512px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  transform-origin:0 0;transform:scale(${size / 512}) translate(${256 * (1 - scale)}px,${256 * (1 - scale)}px) scale(${scale})}
.n{font:800 250px/.8 BSD;color:#D2A82B;letter-spacing:.01em;font-variant-numeric:tabular-nums}
.t{font:800 54px/1 BSD;letter-spacing:.08em;text-transform:uppercase;color:#ECE8DA;margin-top:18px}
</style><div class="c"><span class="n">170</span><span class="t">Checkout</span></div>`;

(async () => {
  const out = path.join(__dirname, 'docs', 'icons');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const [file, size, scale] of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(html(size, scale));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, file), omitBackground: false });
    await page.close();
    console.log('docs/icons/' + file, size + ' px');
  }
  await browser.close();
})();
