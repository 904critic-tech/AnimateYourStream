/*
  Quick E2E check for /legacy/legacy_composite_sandbox.html
  - Opens the page
  - Captures console logs
  - Verifies inline init ran and logs appeared
*/
const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:3001/legacy/legacy_composite_sandbox.html';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const pageLogs = [];
  page.on('console', msg => pageLogs.push(msg.text()));
  page.on('pageerror', err => pageLogs.push('[pageerror] ' + err.message));
  page.on('requestfailed', req => pageLogs.push('[requestfailed] ' + req.url() + ' ' + req.failure()?.errorText));

  const resp = await page.goto(url, { waitUntil: 'load', timeout: 20000 });
  const status = resp && resp.status();
  console.log('HTTP_STATUS', status);

  // give inline init time to run
  await new Promise(r => setTimeout(r, 1500));

  console.log('PAGE_LOGS_START');
  for (const line of pageLogs) console.log(line);
  console.log('PAGE_LOGS_END');

  const hasInit = pageLogs.some(l => l.includes('sandbox: init'));
  console.log('INIT_LOG_PRESENT', hasInit);

  await browser.close();
  if (!hasInit) process.exitCode = 2;
})().catch(err => {
  console.error('E2E_ERROR', err.message);
  process.exit(1);
});


