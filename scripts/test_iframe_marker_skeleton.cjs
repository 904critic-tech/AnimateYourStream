const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const origin = 'http://localhost:3001';
  const url = origin + '/legacy/legacy_composite_sandbox.html';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820 });
  try { fs.mkdirSync('coordination/artifacts', { recursive: true }); } catch {}

  const pageLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    pageLogs.push(text);
    console.log(text);
  });
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('HTTP_STATUS', resp && resp.status());

  // Wait a moment for iframe to boot
  await page.waitForSelector('#viewer-frame');
  const frameEl = await page.$('#viewer-frame');
  const frame = await frameEl.contentFrame();

  // Helper to click toolbar buttons by data-action or id
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function clickButton(selector) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'center' });
    }, selector);
    await sleep(50);
    await page.click(selector).catch(() => {});
    await sleep(150);
  }

  // Load default FBX
  await clickButton('#load-default');
  await sleep(1200);

  // Start guided placement
  await clickButton('[data-action="placeMarkers"]');
  await sleep(200);

  // Simulate a few clicks inside the iframe canvas to place markers
  // Click center, left, right, upper area
  const canvasHandle = await frame.$('#c');
  const box = await canvasHandle.boundingBox();
  const centers = [
    [box.x + box.width * 0.5, box.y + box.height * 0.5],
    [box.x + box.width * 0.4, box.y + box.height * 0.6],
    [box.x + box.width * 0.6, box.y + box.height * 0.6],
    [box.x + box.width * 0.5, box.y + box.height * 0.3]
  ];
  for (const [x, y] of centers) {
    await page.mouse.click(x, y);
    await sleep(120);
  }

  // Auto weights
  await clickButton('[data-action="autoWeights"]');
  await sleep(400);

  // Play idle
  await clickButton('[data-action="playIdle"]');
  await sleep(400);

  // Toggle skeleton visibility (optional)
  await clickButton('[data-action="toggleSkeleton"]');
  await sleep(200);

  // Capture screenshot artifact
  try {
    await page.screenshot({ path: 'coordination/artifacts/iframe_acceptance.png' });
    console.log('ARTIFACT', 'coordination/artifacts/iframe_acceptance.png');
  } catch (e) {
    console.log('ARTIFACT_ERROR', e && e.message);
  }

  // Clear
  await clickButton('[data-action="clear"]');
  await sleep(200);

  // Summarize findings
  const joined = pageLogs.join('\n');
  const hasPlaced = /\bPlaced:|marker placed/i.test(joined);
  const hasSkeleton = /skeleton generated/i.test(joined);
  const hasWeights = /auto weights bound/i.test(joined);
  const hasIdle = /clip playing:|idle sway/i.test(joined);
  const hasCleared = /cleared/i.test(joined);

  console.log('ACCEPTANCE', JSON.stringify({ hasPlaced, hasSkeleton, hasWeights, hasIdle, hasCleared }));

  await browser.close();
  const pass = hasPlaced && hasSkeleton && hasWeights && hasIdle && hasCleared;
  process.exit(pass ? 0 : 2);
})();


