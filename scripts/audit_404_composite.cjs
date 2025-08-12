const puppeteer = require('puppeteer');

(async () => {
  const origin = 'http://localhost:3001';
  const url = origin + '/legacy/legacy_composite_sandbox.html';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const failures = [];
  page.on('response', (res) => {
    try {
      const status = res.status();
      if (status >= 400) failures.push({ status, url: res.url() });
    } catch {}
  });
  page.on('requestfailed', (req) => {
    failures.push({ status: 'FAILED', url: req.url(), reason: req.failure()?.errorText });
  });

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('HTTP_STATUS', resp && resp.status());
  await new Promise(r => setTimeout(r, 2000));

  console.log('FAIL_COUNT', failures.length);
  for (const f of failures) console.log('FAIL', f.status, f.url, f.reason || '');
  await browser.close();
})();


