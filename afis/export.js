const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML   = 'file:///' + path.resolve(__dirname, 'AIDEP Afis Canva.html').replace(/\\/g, '/');
const W = 1550, H = 800;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  // Görsellerin ve fontların yüklenmesini bekle
  await page.goto(HTML, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Scale override — poster tam 1550×800 kaplar, scale=1
  await page.evaluate(() => {
    const stage = document.querySelector('.stage');
    if (stage) stage.style.transform = 'scale(1)';
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
  });

  // ── PNG ──────────────────────────────────────────────────────────
  await page.screenshot({
    path: 'AIDEP-Afis-1550x800.png',
    clip: { x: 0, y: 0, width: W, height: H },
    omitBackground: false,
  });
  console.log('✔ PNG: AIDEP-Afis-1550x800.png');

  // ── PDF ──────────────────────────────────────────────────────────
  // 1px = 0.2645835 mm → 1550px = 410.10mm, 800px = 211.67mm
  await page.pdf({
    path: 'AIDEP-Afis-1550x800.pdf',
    width:  `${W}px`,
    height: `${H}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('✔ PDF: AIDEP-Afis-1550x800.pdf');

  await browser.close();
  console.log('Tamamlandı.');
})();
