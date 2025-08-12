const puppeteer = require('puppeteer');

(async () => {
  const origin = 'http://localhost:3001';
  const url = origin + '/legacy/viewer_iframe.html';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const thirdPartyRequests = [];
  const pageLogs = [];

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    try {
      const reqUrl = req.url();
      const isHttp = /^https?:\/\//i.test(reqUrl);
      const isLocal = reqUrl.startsWith(origin) || reqUrl.startsWith('data:') || reqUrl.startsWith('blob:');
      if (isHttp && !isLocal) {
        thirdPartyRequests.push(reqUrl);
      }
    } catch {}
    req.continue();
  });

  page.on('console', (msg) => pageLogs.push(msg.text()));
  page.on('pageerror', (err) => pageLogs.push('[pageerror] ' + err.message));

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('HTTP_STATUS', resp && resp.status());

  // Wait for viewer ready log and default model attempt
  await new Promise(r => setTimeout(r, 500));

  // Allow default FBX autoload timer to fire
  await new Promise(r => setTimeout(r, 1500));

  console.log('THIRD_PARTY_COUNT', thirdPartyRequests.length);
  if (thirdPartyRequests.length) {
    console.log('THIRD_PARTY_URLS_START');
    thirdPartyRequests.forEach(u => console.log(u));
    console.log('THIRD_PARTY_URLS_END');
  }

  console.log('PAGE_LOGS_START');
  pageLogs.forEach(l => console.log(l));
  console.log('PAGE_LOGS_END');

  await browser.close();

  if (thirdPartyRequests.length === 0) {
    console.log('RESULT', 'OK_NO_THIRD_PARTY');
    process.exit(0);
  } else {
    console.log('RESULT', 'HAS_THIRD_PARTY');
    process.exit(2);
  }
})();


