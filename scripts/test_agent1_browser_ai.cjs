/**
 * Agent 1 - Browser AI Behavior Smoke Test (Read-Only)
 * - Navigates to http://localhost:3001 without changing server state
 * - Verifies presence of window.quickAgent1Test / window.runAgent1Tests
 * - Executes quickAgent1Test() if available and reports result
 * - Optionally invokes runAgent1Tests() and reports pass/fail summary if it returns
 */

const puppeteer = require('puppeteer');

async function run() {
  console.log('🤖 Agent 1 - Browser AI Behavior Smoke Test (Read-Only)');
  console.log('======================================================');
  const url = process.env.APP_URL || 'http://localhost:3001';

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Stream browser console logs
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    console.log(`📜 [Console.${type}] ${text}`);
  });

  // Stream page errors
  page.on('pageerror', (err) => {
    console.error(`❌ [PageError] ${err.message}`);
  });

  try {
    console.log(`🌐 Navigating to ${url} ...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // small settle without relying on deprecated/non-existent API
    await new Promise((r) => setTimeout(r, 2000));

    // Probe for AI test hooks
    const hooks = await page.evaluate(async () => {
      const hasQuick = typeof window.quickAgent1Test === 'function';
      const hasRunAll = typeof window.runAgent1Tests === 'function';
      const hasAITestResults = typeof window.aiTestResults !== 'undefined';
      return { hasQuick, hasRunAll, hasAITestResults };
    });

    console.log('🔎 Hook presence:', hooks);

    let quickResult = null;
    if (hooks.hasQuick) {
      console.log('▶️ Executing window.quickAgent1Test() ...');
      quickResult = await page.evaluate(() => {
        try {
          return !!window.quickAgent1Test();
        } catch (e) {
          console.error('quickAgent1Test threw:', e && e.message);
          return false;
        }
      });
      console.log(`✅ quickAgent1Test result: ${quickResult}`);
    } else {
      console.log('ℹ️ quickAgent1Test not found on window');
    }

    let runAllSummary = null;
    if (hooks.hasRunAll) {
      console.log('▶️ Executing window.runAgent1Tests() ... (will wait up to 20s)');
      // Run in page context and try to capture aggregate
      runAllSummary = await page.evaluate(async () => {
        try {
          const res = await window.runAgent1Tests();
          // res is an array of suites; compute simple summary if present
          if (Array.isArray(res)) {
            const total = res.reduce((s, r) => s + (r.totalTests || 0), 0);
            const passed = res.reduce((s, r) => s + (r.passedTests || 0), 0);
            const failed = res.reduce((s, r) => s + (r.failedTests || 0), 0);
            return { total, passed, failed };
          }
          return { total: null, passed: null, failed: null };
        } catch (e) {
          console.error('runAgent1Tests threw:', e && e.message);
          return { total: 0, passed: 0, failed: 1 };
        }
      });
      console.log('✅ runAgent1Tests summary:', runAllSummary);
    } else {
      console.log('ℹ️ runAgent1Tests not found on window');
    }

    const result = {
      url,
      hooks,
      quickResult,
      runAllSummary,
      success: (hooks.hasQuick ? quickResult === true : true) && (hooks.hasRunAll ? (runAllSummary && runAllSummary.failed === 0) : true)
    };

    console.log('\n📊 Smoke Test Result:', JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(result.success ? 0 : 1);
  } catch (err) {
    console.error('❌ Navigation/Execution failed:', err && err.message);
    try { await browser.close(); } catch (_) {}
    process.exit(2);
  }
}

run();


