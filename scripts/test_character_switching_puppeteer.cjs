/**
 * Character Switching Read-Only E2E Test (Puppeteer)
 * - Navigates to http://localhost:3001
 * - Waits for canvas/app load
 * - Attempts to click character selection controls
 * - Verifies switching via console log patterns
 *
 * Safe: read-only navigation; no server start/stop.
 */

const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:3001';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 800 });

  const logs = [];
  page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));

  const nav = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('HTTP_STATUS', nav?.status());

  // Wait for app/canvas
  await page.waitForSelector('#root', { timeout: 20000 });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Heuristic: find potential character controls
  const candidates = await page.$$('[data-testid*="character"], [class*="character"], button');
  console.log('CANDIDATE_ELEMENTS', candidates.length);

  let clicks = 0;
  let switchDetected = false;

  async function detectSwitchWindow() {
    // Check for known switching/loading log patterns from app
    const text = logs.join('\n');
    const patterns = [
      'Mixamo loading progress',
      'Successfully loaded character',
      'Mixamo-compatible loading completed',
      'Animation changed to:',
      'Mixamo blending to animation:',
    ];
    return patterns.some((p) => text.includes(p));
  }

  for (let i = 0; i < Math.min(5, candidates.length); i++) {
    try {
      await candidates[i].click();
      clicks++;
      await new Promise((r) => setTimeout(r, 1000));
      if (await detectSwitchWindow()) {
        switchDetected = true;
        break;
      }
    } catch {}
  }

  console.log('CLICKS_ATTEMPTED', clicks);
  console.log('SWITCH_DETECTED', switchDetected);

  console.log('PAGE_LOGS_START');
  for (const line of logs.slice(-80)) console.log(line);
  console.log('PAGE_LOGS_END');

  await browser.close();
  process.exit(switchDetected ? 0 : 2);
})().catch((err) => {
  console.error('E2E_ERROR', err.message);
  process.exit(1);
});


