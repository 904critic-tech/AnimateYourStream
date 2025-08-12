/**
 * Agent 3: Cross-Model Animation Check (Read-Only)
 * - Navigates to http://localhost:3001
 * - Tries to select characters with known names in the LeftPanel by visible text
 * - Waits for app logs indicating animations/mixer
 * - Reports per-model pass/fail
 */

const puppeteer = require('puppeteer');

const CANDIDATE_MODELS = [
  { id: 'default_fbx', text: 'Default FBX (Animated)' },
  { id: 'Spider-Man', text: 'Spider-Man' },
  { id: 'Spider-Man PS4', text: 'Spider-Man PS4' },
  { id: 'Spider-Man Chasm', text: 'Spider-Man Chasm' },
  { id: 'Spider-Man Suit', text: 'Spider-Man Suit' },
];

async function clickByVisibleText(page, text) {
  return page.evaluate((t) => {
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], [class*="button"], [class*="item"], div, span, a'));
    const el = candidates.find((n) => n && n.textContent && n.textContent.trim().toLowerCase().includes(t.toLowerCase()));
    if (el) {
      el.click();
      return true;
    }
    return false;
  }, text);
}

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:3001';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const logs = [];
  page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));

  const nav = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('HTTP_STATUS', nav?.status());

  await page.waitForSelector('#root', { timeout: 20000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 800));

  const results = [];

  for (const model of CANDIDATE_MODELS) {
    try {
      const clicked = await clickByVisibleText(page, model.text);
      if (!clicked) {
        results.push({ model: model.text, status: 'NO_UI_ELEMENT' });
        continue;
      }

      // Some UIs require explicit "Load" press; try to click a Load button if present
      await new Promise(r => setTimeout(r, 600));
      await clickByVisibleText(page, 'Load');
      await new Promise(r => setTimeout(r, 1200));

      // Detection windows
      const switched = await page.evaluate((needle) => {
        const arr = (window).consoleLogs || [];
        const hasLoadLog = arr.some((l) => l.includes('Loading character') || l.includes('Loading model:'));
        const mentionsModel = arr.some((l) => l.toLowerCase().includes(needle.toLowerCase()));
        return hasLoadLog || mentionsModel;
      }, model.text);

      const animOk = await page.evaluate(() => {
        const arr = (window).consoleLogs || [];
        return arr.some(l => l.includes('Found animations')) || arr.some(l => l.includes('Animation status - mixer: true'));
      });

      results.push({ model: model.text, status: switched ? (animOk ? 'PASS' : 'NO_ANIM') : 'NO_SWITCH' });
    } catch (e) {
      results.push({ model: model.text, status: 'ERROR', error: e.message });
    }
  }

  console.log('RESULTS_JSON', JSON.stringify(results));

  console.log('PAGE_LOGS_START');
  for (const line of logs.slice(-200)) console.log(line);
  console.log('PAGE_LOGS_END');

  await browser.close();

  const anyPass = results.some(r => r.status === 'PASS');
  process.exit(anyPass ? 0 : 4);
})().catch(err => {
  console.error('E2E_ERROR', err.message);
  process.exit(1);
});
