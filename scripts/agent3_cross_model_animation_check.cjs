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
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      (el).click();
      return true;
    }
    return false;
  }, text);
}

async function selectCharacterByName(page, text) {
  // Prefer LeftPanel grid items for deterministic selection
  const didClick = await page.evaluate((t) => {
    const items = Array.from(document.querySelectorAll('.model-grid .model-item'));
    function getName(node) {
      const nameEl = node.querySelector('p');
      return (nameEl && nameEl.textContent) ? nameEl.textContent.trim().toLowerCase() : '';
    }
    const item = items.find((it) => getName(it).includes(t.toLowerCase()));
    if (item) {
      item.scrollIntoView({ behavior: 'instant', block: 'center' });
      (item).click();
      return true;
    }
    return false;
  }, text);

  if (!didClick) {
    // Fallback to generic visible-text click
    return clickByVisibleText(page, text);
  }
  return true;
}

async function clickLoadSelectedButton(page) {
  return page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes('load selected model'));
    if (btn) {
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      (btn).click();
      return true;
    }
    return false;
  });
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
      const clicked = await selectCharacterByName(page, model.text);
      if (!clicked) {
        results.push({ model: model.text, status: 'NO_UI_ELEMENT' });
        continue;
      }

      // Attempt to press the explicit load button when available
      await new Promise(r => setTimeout(r, 300));
      await clickLoadSelectedButton(page);

      await new Promise(r => setTimeout(r, 1200));

      // Detection windows
      const switched = await page.evaluate((needle) => {
        const arr = (window).consoleLogs || [];
        const hasLoadLog = arr.some((l) => l.includes('Loading character') || l.includes('Loading model:') || l.includes('Model loading initiated'));
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
