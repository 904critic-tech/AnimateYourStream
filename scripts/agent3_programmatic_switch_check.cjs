/**
 * Agent 3: Programmatic Cross-Model Switch + Animation Check (Read-Only)
 * - Navigates to http://localhost:3001
 * - Waits for window.sandboxModelViewer API
 * - Switches to candidate models by id and checks for animation/mixer logs (captured by Puppeteer)
 */

const puppeteer = require('puppeteer');

const CANDIDATE_MODELS = [
  { id: 'default_fbx', label: 'Default FBX (Animated)' },
  { id: 'spiderman', label: 'Spider-Man' },
  { id: 'spiderman_ps4', label: 'Spider-Man PS4' },
  { id: 'spiderman_chasm', label: 'Spider-Man Chasm' },
  { id: 'spiderman_suit', label: 'Spider-Man Suit' },
  { id: 'elmo', label: 'Elmo (Stuffed Animal)' },
];

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

  const apiReady = await page.waitForFunction(() => {
    try {
      const api = (window).sandboxModelViewer;
      return !!api && (typeof api.loadCharacterById === 'function' || typeof api.selectCharacter === 'function');
    } catch { return false; }
  }, { timeout: 20000 }).catch(() => false);

  if (!apiReady) {
    console.error('API_ERROR sandboxModelViewer not ready');
    await browser.close();
    process.exit(2);
  }

  const results = [];

  for (const model of CANDIDATE_MODELS) {
    try {
      const didInvoke = await page.evaluate((id) => {
        const api = (window).sandboxModelViewer;
        if (api.loadCharacterById) return api.loadCharacterById(id);
        if (api.selectCharacter) return api.selectCharacter(id);
        return false;
      }, model.id);

      if (!didInvoke) {
        results.push({ id: model.id, label: model.label, status: 'INVOKE_FAIL' });
        continue;
      }

      await new Promise(r => setTimeout(r, 2000));

      const joined = logs.join('\n');
      const switched = /Sandbox: Loading (character|model):/.test(joined) || joined.toLowerCase().includes(model.label.toLowerCase());
      const animOk = /Sandbox: Found animations|Animation mixer created: true|Animation status - mixer: true/.test(joined);

      results.push({ id: model.id, label: model.label, status: switched ? (animOk ? 'PASS' : 'NO_ANIM') : 'NO_SWITCH' });
    } catch (e) {
      results.push({ id: model.id, label: model.label, status: 'ERROR', error: e.message });
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
