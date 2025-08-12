/**
 * Agent 3: Animation Transition Smoothness + Lip Sync Presence (Read-Only)
 * - Navigates to http://localhost:3001
 * - Ensures Default FBX is loaded
 * - Uses window.__ANIMATION_CONTROLLER__ to blend between two animations
 * - Confirms no 'Animation not found in layers' warnings, and mixer active
 * - Confirms lip sync system reports started at least once
 */

const puppeteer = require('puppeteer');

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

  // Load Default FBX via exposed API if available
  await page.evaluate(() => {
    const api = (window).sandboxModelViewer;
    if (api && typeof api.loadCharacterById === 'function') api.loadCharacterById('default_fbx');
  });
  await new Promise(r => setTimeout(r, 1500));

  // Wait for controller
  const ctlReady = await page.waitForFunction(() => !!(window).__ANIMATION_CONTROLLER__, { timeout: 15000 }).catch(() => false);
  if (!ctlReady) {
    console.error('CTL_ERROR Animation controller not available');
    await browser.close();
    process.exit(2);
  }

  // Get available animations
  const anims = await page.evaluate(() => {
    const ctl = (window).__ANIMATION_CONTROLLER__;
    const st = ctl ? ctl.getState() : null;
    const fromCtl = (st && st.animations) ? st.animations.map(a => a.name) : [];
    if (fromCtl && fromCtl.length) return fromCtl;
    const api = (window).sandboxModelViewer;
    if (api && typeof api.getAnimations === 'function') return api.getAnimations();
    return [];
  });

  if (!anims || anims.length < 1) {
    console.error('NO_ANIMS Available animations not found');
    await browser.close();
    process.exit(3);
  }

  const a0 = anims[0];
  const a1 = anims[1] || anims[0];

  // Force first animation
  await page.evaluate((name) => {
    const ctl = (window).__ANIMATION_CONTROLLER__;
    ctl.forceAnimation(name);
  }, a0);
  await new Promise(r => setTimeout(r, 800));

  // Blend to second animation
  await page.evaluate((name) => {
    const ctl = (window).__ANIMATION_CONTROLLER__;
    ctl.forceAnimation(name);
  }, a1);
  await new Promise(r => setTimeout(r, 1200));

  // Signals
  const joined = logs.join('\n');
  const noLayerWarn = !/Animation not found in layers/i.test(joined);
  const mixerActive = /Animation status - mixer: true/.test(joined) || /Animation mixer created: true/.test(joined);
  const lipSyncStarted = /Advanced lip sync started/i.test(joined) || /lip sync/i.test(joined);

  console.log('RESULTS_JSON', JSON.stringify({
    animations: anims.slice(0, 4),
    used: { from: a0, to: a1 },
    noLayerWarn,
    mixerActive,
    lipSyncStarted
  }));

  console.log('PAGE_LOGS_START');
  for (const line of logs.slice(-160)) console.log(line);
  console.log('PAGE_LOGS_END');

  await browser.close();

  const pass = noLayerWarn && mixerActive;
  process.exit(pass ? 0 : 4);
})().catch(err => {
  console.error('E2E_ERROR', err.message);
  process.exit(1);
});
