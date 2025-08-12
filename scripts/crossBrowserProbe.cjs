/*
  Cross-Browser Animation Compatibility Probe (Read-Only)
  Usage examples:
    node scripts/crossBrowserProbe.cjs --ua firefox
    node scripts/crossBrowserProbe.cjs --ua safari
    node scripts/crossBrowserProbe.cjs --ua ipad --width 1024 --height 1366 --mobile true --touch true
*/
const puppeteer = require('puppeteer');

function getUA(kind) {
  switch (kind) {
    case 'firefox':
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0';
    case 'safari':
      return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15';
    case 'ipad':
      return 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    case 'android':
      return 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';
    default:
      return '';
  }
}

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && i + 1 < process.argv.length) return process.argv[i + 1];
  return fallback;
}

(async () => {
  const kind = (arg('--ua', '') || '').toLowerCase();
  const url = arg('--url', 'http://localhost:3001');
  const width = parseInt(arg('--width', '1280'), 10);
  const height = parseInt(arg('--height', '800'), 10);
  const isMobile = String(arg('--mobile', 'false')).toLowerCase() === 'true';
  const hasTouch = String(arg('--touch', 'false')).toLowerCase() === 'true';

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile, hasTouch, deviceScaleFactor: isMobile ? 2 : 1 });

  const ua = getUA(kind);
  if (ua) await page.setUserAgent(ua);

  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const result = await page.evaluate(async () => {
    const out = {
      title: document.title,
      hasCanvas: !!document.querySelector('canvas'),
      webgl: { webgl1: false, webgl2: false },
      animationsAvailable: 0,
      defaultAnimation: null,
      fps: 0,
    };
    try {
      const c = document.createElement('canvas');
      out.webgl.webgl2 = !!(c.getContext('webgl2'));
      out.webgl.webgl1 = !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch {}

    // Try to detect animations from known globals/log hooks
    try {
      const any = window.__MIXAMO__ || {};
      if (Array.isArray(any.animations)) out.animationsAvailable = any.animations.length;
    } catch {}

    // Lightweight FPS sample ~180 frames (~3s on 60Hz)
    await new Promise((resolve) => setTimeout(resolve, 500));
    let frames = 0; let start = performance.now();
    await new Promise((resolve) => {
      function tick() {
        frames++;
        if (frames < 180) requestAnimationFrame(tick); else resolve();
      }
      requestAnimationFrame(tick);
    });
    const elapsed = performance.now() - start;
    out.fps = Math.round((frames / elapsed) * 1000);
    return out;
  });

  console.log('PROBE_KIND', kind || 'default');
  console.log('HTTP_STATUS', resp?.status());
  console.log('RESULT_JSON_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('RESULT_JSON_END');

  await browser.close();
})().catch((e) => {
  console.error('PROBE_ERROR', e.message);
  process.exit(1);
});


