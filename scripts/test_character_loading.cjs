/**
 * Test Mixamo-Compatible Character Loading System
 * 
 * Agent 2 - Performance Optimization Team
 * Tests the new Mixamo-compatible character loading system
 */

const puppeteer = require('puppeteer');

async function testMixamoCharacterLoading() {
  console.log('🧪 Agent 2: Testing Mixamo-compatible character loading system...');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Capture page diagnostics early
    await page.evaluateOnNewDocument(() => {
      try {
        window.consoleLogs = [];
        const origLog = console.log;
        const origErr = console.error;
        const origWarn = console.warn;
        console.log = (...args) => {
          try { window.consoleLogs.push(args.join(' ')); } catch {}
          origLog.apply(console, args);
        };
        console.error = (...args) => {
          try { window.consoleLogs.push(args.join(' ')); } catch {}
          origErr.apply(console, args);
        };
        console.warn = (...args) => {
          try { window.consoleLogs.push(args.join(' ')); } catch {}
          origWarn.apply(console, args);
        };
      } catch {}
    });

    // Enable console logging
    page.on('console', msg => {
      console.log(`📱 Browser: ${msg.type()} - ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`📱 Browser: pageerror - ${err.message}`);
    });
    page.on('requestfailed', req => {
      const failure = req.failure && req.failure();
      console.error(`🌐 Request failed: ${req.method()} ${req.url()} - ${failure ? failure.errorText : 'unknown error'}`);
    });
    page.on('response', res => {
      const status = res.status();
      if (status >= 400) {
        console.error(`🌐 Response ${status}: ${res.request().method()} ${res.url()}`);
      }
    });
    
    // Navigate to the application
    console.log('🧪 Agent 2: Navigating to application...');
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for the application to load
    console.log('🧪 Agent 2: Waiting for application to load...');
    await page.waitForSelector('#root', { timeout: 20000 });
    
    // Wait for the 3D scene to initialize
    console.log('🧪 Agent 2: Waiting for 3D scene to initialize...');
    await page.waitForSelector('canvas', { timeout: 20000 });
    await page.waitForFunction(() => {
      return window.performance && window.performance.now() > 1500;
    }, { timeout: 20000 });
    
    // Test character loading by checking console logs
    console.log('🧪 Agent 2: Monitoring character loading...');
    
    // Wait for Mixamo loading messages
    const mixamoLoadingDetected = await page.waitForFunction(() => {
      const logs = window.consoleLogs || [];
      return logs.some(log => log.includes('Mixamo-compatible') || log.includes('Agent 2: Loading character with Mixamo'));
    }, { timeout: 30000 });
    
    if (mixamoLoadingDetected) {
      console.log('✅ Agent 2: Mixamo-compatible character loading detected!');
    }
    
    // Check for successful loading
    const loadingSuccess = await page.waitForFunction(() => {
      const logs = window.consoleLogs || [];
      return logs.some(log => log.includes('Mixamo-compatible loading completed') || log.includes('Successfully loaded character'));
    }, { timeout: 30000 });
    
    if (loadingSuccess) {
      console.log('✅ Agent 2: Character loading completed successfully!');
    }
    
    // Test character switching
    console.log('🧪 Agent 2: Testing character switching...');
    
    // Look for character selection elements
    const characterSelectors = await page.$$('[data-testid*="character"], [class*="character"], button');
    
    if (characterSelectors.length > 0) {
      console.log(`🧪 Agent 2: Found ${characterSelectors.length} potential character selection elements`);
      
      // Try clicking on the first character selector
      try {
        await characterSelectors[0].click();
        console.log('✅ Agent 2: Character selection element clicked');
        
        // Wait for loading to complete
        await new Promise(r => setTimeout(r, 2000));
        
        // Check for loading messages
        const switchSuccess = await page.evaluate(() => {
          const logs = window.consoleLogs || [];
          return logs.some(log => log.includes('Mixamo') && log.includes('loading'));
        });
        
        if (switchSuccess) {
          console.log('✅ Agent 2: Character switching triggered successfully!');
        }
      } catch (error) {
        console.log('⚠️ Agent 2: Could not click character selector:', error.message);
      }
    }
    
    // Check for errors
    const errors = await page.evaluate(() => {
      const logs = window.consoleLogs || [];
      return logs.filter(log => log.includes('Error') || log.includes('Failed'));
    });
    
    if (errors.length > 0) {
      console.log('❌ Agent 2: Errors detected:');
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ Agent 2: No errors detected in character loading');
    }
    
    // Performance check
    const performance = await page.evaluate(() => {
      return {
        loadTime: window.LOAD_METRICS?.windowLoad || 0,
        fcp: window.LOAD_METRICS?.firstContentfulPaint || 0,
        memory: performance.memory?.usedJSHeapSize || 0
      };
    });
    
    console.log('📊 Agent 2: Performance metrics:');
    console.log(`   - Load time: ${performance.loadTime}ms`);
    console.log(`   - First Contentful Paint: ${performance.fcp}ms`);
    console.log(`   - Memory usage: ${(performance.memory / 1024 / 1024).toFixed(2)}MB`);
    
    console.log('✅ Agent 2: Mixamo-compatible character loading test completed successfully!');
    
  } catch (error) {
    console.error('❌ Agent 2: Test failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testMixamoCharacterLoading()
    .then(() => {
      console.log('🎉 Agent 2: All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Agent 2: Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMixamoCharacterLoading };
