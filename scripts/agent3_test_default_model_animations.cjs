/**
 * Agent 3: Default Model Animation Verification (Read-Only)
 * - Navigates to http://localhost:3001
 * - Waits for window.sandboxModelViewer.loadModel
 * - Calls loadModel('/models/Default_Model.fbx', 'Default_Model.fbx')
 * - Waits for logs indicating animations found and mixer active
 * - Fails if not observed within timeout
 */

const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:3001';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const logs = [];
  page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));

  const nav = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('HTTP_STATUS', nav?.status());

  await page.waitForSelector('#root', { timeout: 20000 });
  await page.waitForSelector('canvas', { timeout: 20000 });

  // Wait up to 20s for sandboxModelViewer API to be attached
  const apiReady = await page.waitForFunction(() => {
    try {
      const api = (window).sandboxModelViewer;
      return !!api && typeof api.loadModel === 'function';
    } catch (e) { return false; }
  }, { timeout: 20000 }).catch(() => false);

  if (!apiReady) {
    console.error('LOAD_API_ERROR sandboxModelViewer.loadModel not available after timeout');
    console.log('PAGE_LOGS_START');
    for (const line of logs.slice(-120)) console.log(line);
    console.log('PAGE_LOGS_END');
    await browser.close();
    process.exit(2);
  }

  // Load Default_Model with known clips
  await page.evaluate(() => (window).sandboxModelViewer.loadModel('/models/Default_Model.fbx', 'Default_Model.fbx'));

  // Wait for animation status logs (either app-side or captured console)
  const success = await page.waitForFunction(() => {
    const arr = (window).consoleLogs || [];
    return arr.some((l) => l.includes('Sandbox: Found animations')) ||
           arr.some((l) => l.includes('Sandbox: Animation mixer created')) ||
           arr.some((l) => l.includes('Sandbox: Animation status - mixer: true'));
  }, { timeout: 30000 }).catch(() => false);

  const joined = logs.join('\n');
  const puppetMatch = /Sandbox: (Found animations|Animation mixer created|Animation status - mixer: true)/.test(joined);

  const passed = Boolean(success || puppetMatch);
  console.log('ANIMATION_DETECTED', passed);

  console.log('PAGE_LOGS_START');
  for (const line of logs.slice(-200)) console.log(line);
  console.log('PAGE_LOGS_END');

  await browser.close();
  process.exit(passed ? 0 : 3);
})().catch(err => {
  console.error('E2E_ERROR', err.message);
  process.exit(1);
});
