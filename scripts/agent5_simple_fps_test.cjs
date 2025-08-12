/**
 * Agent 5 Simple FPS Test
 * 
 * Direct performance measurement using the application's built-in monitoring
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Agent5SimpleFPSTest {
  constructor() {
    this.testUrl = 'http://localhost:3001';
    this.results = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      loadTime: 0,
      timestamp: new Date().toISOString()
    };
  }

  async runTest() {
    console.log('🔍 Agent 5: Running Simple FPS Test...\n');
    
    try {
      const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Enable console logging
      page.on('console', msg => {
        if (msg.text().includes('FPS') || msg.text().includes('performance')) {
          console.log('📊 Browser:', msg.text());
        }
      });
      
      console.log('📊 Loading application and measuring FPS...');

      // Navigate to the application
      const startTime = Date.now();
      await page.goto(this.testUrl, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      // Wait for application to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Inject FPS measurement script
      const fpsMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          console.log('🔍 Agent 5: Starting FPS measurement...');
          
          let frameCount = 0;
          let lastTime = performance.now();
          let fpsHistory = [];
          let maxFrames = 300; // 5 seconds at 60fps
          
          const measureFPS = (currentTime) => {
            frameCount++;
            const deltaTime = currentTime - lastTime;
            
            if (frameCount % 60 === 0) {
              const fps = Math.round(1000 / (deltaTime / 60));
              fpsHistory.push(fps);
              console.log(`🔍 Agent 5: FPS measurement ${fpsHistory.length}: ${fps}`);
              
              if (fpsHistory.length > 10) {
                fpsHistory.shift();
              }
              
              lastTime = currentTime;
            }
            
            if (frameCount < maxFrames) {
              requestAnimationFrame(measureFPS);
            } else {
              // Calculate average FPS
              const avgFPS = fpsHistory.length > 0 
                ? fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length 
                : 0;
              
              console.log(`🔍 Agent 5: Final FPS average: ${avgFPS}`);
              
              resolve({
                fps: Math.round(avgFPS),
                frameTime: avgFPS > 0 ? Math.round(1000 / avgFPS) : 0,
                frameCount: frameCount,
                measurements: fpsHistory.length
              });
            }
          };
          
          requestAnimationFrame(measureFPS);
          
          // Fallback timeout
          setTimeout(() => {
            console.log('🔍 Agent 5: FPS measurement timeout');
            resolve({
              fps: 0,
              frameTime: 0,
              frameCount: 0,
              measurements: 0
            });
          }, 10000);
        });
      });

      this.results = { ...this.results, ...fpsMetrics, loadTime };

      // Evaluate performance
      const evaluation = this.evaluatePerformance(this.results);
      
      console.log('\n📈 Agent 5 Performance Results:');
      console.log(`  Load Time: ${this.results.loadTime}ms`);
      console.log(`  FPS: ${this.results.fps} ${evaluation.fps.status}`);
      console.log(`  Frame Time: ${this.results.frameTime}ms`);
      console.log(`  Frames Measured: ${this.results.frameCount}`);
      console.log(`  Measurements: ${this.results.measurements}`);
      console.log(`  Overall Status: ${evaluation.overall}`);

      // Save results
      this.saveResults();
      
      await browser.close();
      
      return evaluation.overall === 'PASS';
      
    } catch (error) {
      console.error('❌ Agent 5 FPS test failed:', error.message);
      return false;
    }
  }

  evaluatePerformance(results) {
    const evaluation = {
      fps: { status: '❌ FAIL', target: '60+ FPS' },
      overall: '❌ FAIL'
    };

    // FPS evaluation
    if (results.fps >= 60) {
      evaluation.fps.status = '✅ PASS';
    } else if (results.fps >= 45) {
      evaluation.fps.status = '⚠️ WARNING';
    } else if (results.fps >= 30) {
      evaluation.fps.status = '⚠️ LOW';
    } else {
      evaluation.fps.status = '❌ FAIL';
    }

    // Overall evaluation
    if (results.fps >= 45) {
      evaluation.overall = '✅ PASS';
    } else if (results.fps >= 30) {
      evaluation.overall = '⚠️ WARNING';
    } else {
      evaluation.overall = '❌ FAIL';
    }

    return evaluation;
  }

  saveResults() {
    const resultsPath = path.join(__dirname, '..', 'coordination', 'AGENT_5_FPS_RESULTS.md');
    const content = `# Agent 5 FPS Test Results

**Date**: ${new Date().toISOString()}
**Test**: Simple FPS Measurement

## Results
- **FPS**: ${this.results.fps}
- **Frame Time**: ${this.results.frameTime}ms
- **Frames Measured**: ${this.results.frameCount}
- **Measurements**: ${this.results.measurements}
- **Load Time**: ${this.results.loadTime}ms

## Status
${this.results.fps >= 60 ? '✅ PASS' : this.results.fps >= 45 ? '⚠️ WARNING' : this.results.fps >= 30 ? '⚠️ LOW' : '❌ FAIL'} - Target: 60+ FPS

## Issues Identified
${this.results.fps < 60 ? `- FPS below target (${this.results.fps} < 60)` : '- No issues detected'}
${this.results.fps < 30 ? '- Critical performance degradation detected' : ''}
${this.results.fps === 0 ? '- No FPS measurement possible - possible rendering issue' : ''}

## Next Steps
${this.results.fps < 30 ? '1. Investigate rendering pipeline\n2. Check for memory leaks\n3. Optimize 3D scene complexity' : 'Performance is acceptable'}
`;

    fs.writeFileSync(resultsPath, content);
    console.log(`📄 Results saved to: ${resultsPath}`);
  }
}

// Run the test
const test = new Agent5SimpleFPSTest();
test.runTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
