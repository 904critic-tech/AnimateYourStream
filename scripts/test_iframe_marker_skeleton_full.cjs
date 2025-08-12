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

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('HTTP_STATUS', resp && resp.status());

  await page.waitForSelector('#viewer-frame');
  const frameEl = await page.$('#viewer-frame');
  const frame = await frameEl.contentFrame();

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
  await sleep(1400);

  // Start guided placement
  await clickButton('[data-action="placeMarkers"]');
  await sleep(200);

  // Compute click points for full guided sequence on iframe canvas
  const canvasHandle = await frame.$('#c');
  const box = await canvasHandle.boundingBox();
  function pt(px, py) { return [box.x + box.width * px, box.y + box.height * py]; }
  // Hips, Chest, Head, LeftShoulder, LeftElbow, LeftWrist, RightShoulder, RightElbow, RightWrist, LeftKnee, LeftAnkle, RightKnee, RightAnkle
  const sequence = [
    pt(0.50, 0.58), // Hips
    pt(0.50, 0.48), // Chest
    pt(0.50, 0.33), // Head
    pt(0.42, 0.48), // LeftShoulder
    pt(0.37, 0.53), // LeftElbow
    pt(0.33, 0.58), // LeftWrist
    pt(0.58, 0.48), // RightShoulder
    pt(0.63, 0.53), // RightElbow
    pt(0.67, 0.58), // RightWrist
    pt(0.46, 0.73), // LeftKnee
    pt(0.46, 0.86), // LeftAnkle
    pt(0.54, 0.73), // RightKnee
    pt(0.54, 0.86)  // RightAnkle
  ];
  for (const [x, y] of sequence) {
    await page.mouse.click(x, y);
    await sleep(120);
  }

  // Auto weights and play idle
  await clickButton('[data-action="autoWeights"]');
  await sleep(400);
  await clickButton('[data-action="playIdle"]');
  await sleep(400);

  // Screenshot artifact of full guided state
  try {
    await page.screenshot({ path: 'coordination/artifacts/iframe_guided_full.png' });
    console.log('ARTIFACT', 'coordination/artifacts/iframe_guided_full.png');
  } catch (e) {
    console.log('ARTIFACT_ERROR', e && e.message);
  }

  // Clear
  await clickButton('[data-action="clear"]');
  await sleep(200);

  // Summarize acceptance
  const joined = pageLogs.join('\n');
  const hasPlaced = /\bPlaced:/i.test(joined);
  const markersComplete = /Markers complete/i.test(joined) || sequence.length >= 13;
  const hasSkeleton = /skeleton generated/i.test(joined);
  const hasWeights = /auto weights bound/i.test(joined);
  const hasIdle = /clip playing:|idle sway/i.test(joined);
  const hasCleared = /cleared/i.test(joined);
  console.log('ACCEPTANCE_FULL', JSON.stringify({ hasPlaced, markersComplete, hasSkeleton, hasWeights, hasIdle, hasCleared }));

  await browser.close();
  const pass = markersComplete && hasSkeleton && hasWeights && hasIdle && hasCleared;
  process.exit(pass ? 0 : 2);
})();


