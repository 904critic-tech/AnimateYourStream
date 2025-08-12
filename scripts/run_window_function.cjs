/*
  Run a global window function inside the app via Puppeteer and print JSON result.
  Usage: node scripts/run_window_function.cjs --fn runFirefoxAITests
*/
const puppeteer = require('puppeteer');

function parseArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

(async () => {
  const fnName = parseArg('--fn');
  if (!fnName) {
    console.error('ERROR: Missing --fn <windowFunctionName> argument');
    process.exit(2);
  }

  const url = 'http://localhost:3001';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Try to run the function and capture result
  const result = await page.evaluate(async (name) => {
    const out = { found: false, type: null, ok: false, result: null, error: null };
    try {
      const fn = window[name];
      out.found = typeof fn === 'function';
      out.type = typeof fn;
      if (!out.found) return out;
      const r = fn();
      if (r && typeof r.then === 'function') {
        out.result = await r;
      } else {
        out.result = r;
      }
      out.ok = true;
    } catch (e) {
      out.error = e && e.message ? e.message : String(e);
    }
    return out;
  }, fnName);

  console.log('WINDOW_FN', fnName);
  console.log('RESULT_JSON_START');
  console.log(JSON.stringify(result, null, 2));
  console.log('RESULT_JSON_END');

  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error('LAUNCH_ERROR', err.message);
  process.exit(1);
});


