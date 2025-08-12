/**
 * Agent 5 Performance Test
 * 
 * FPS and performance measurement for Smart Diagnostics Team
 * Testing performance degradation issues (FPS dropped to 23)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class Agent5PerformanceTest {
  constructor() {
    this.testUrl = 'http://localhost:3001'; // Correct dev server port
    this.results = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      loadTime: 0,
      renderCalls: 0,
      triangles: 0,
      timestamp: new Date().toISOString()
    };
  }

  async runTest() {
    console.log('🔍 Agent 5: Running Performance Test for FPS Issues...\n');
    
    try {
      const browser = await puppeteer.launch({ 
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
      
      const page = await browser.newPage();
      
      // Enable performance monitoring
      await page.setViewport({ width: 1280, height: 720 });
      
      console.log('📊 Measuring FPS and performance metrics...');

      // Navigate to the application
      const startTime = Date.now();
      await page.goto(this.testUrl, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      // Wait for 3D scene to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Measure FPS and performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const results = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            renderCalls: 0,
            triangles: 0,
            qualityLevel: 'unknown'
          };

          // Install lightweight WebGL hooks to count draw calls/triangles
          (function installGLHooks() {
            try {
              const stats = { drawCalls: 0, triangles: 0 };

              function hookContext(gl) {
                if (!gl || gl.__agent5Hooked) return;
                const origDrawElements = gl.drawElements?.bind(gl);
                const origDrawArrays = gl.drawArrays?.bind(gl);
                if (origDrawElements) {
                  gl.drawElements = function(mode, count, type, offset) {
                    stats.drawCalls++;
                    if (mode === gl.TRIANGLES && typeof count === 'number') {
                      stats.triangles += Math.floor(count / 3);
                    }
                    return origDrawElements(mode, count, type, offset);
                  };
                }
                if (origDrawArrays) {
                  gl.drawArrays = function(mode, first, count) {
                    stats.drawCalls++;
                    if (mode === gl.TRIANGLES && typeof count === 'number') {
                      stats.triangles += Math.floor(count / 3);
                    }
                    return origDrawArrays(mode, first, count);
                  };
                }
                gl.__agent5Hooked = true;
              }

              const canvases = Array.from(document.querySelectorAll('canvas'));
              canvases.forEach(c => {
                try {
                  const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
                  if (gl) hookContext(gl);
                } catch (e) {}
              });

              const origGetContext = HTMLCanvasElement.prototype.getContext;
              if (!HTMLCanvasElement.prototype.__agent5Patched) {
                HTMLCanvasElement.prototype.getContext = function(type, attrs) {
                  const ctx = origGetContext.call(this, type, attrs);
                  if (ctx && type && String(type).includes('webgl')) {
                    try { hookContext(ctx); } catch (e) {}
                  }
                  return ctx;
                };
                HTMLCanvasElement.prototype.__agent5Patched = true;
              }

              window.__AGENT5_RENDER_STATS__ = stats;
            } catch (e) {
              // Ignore instrumentation failures
            }
          })();

          // Measure FPS using requestAnimationFrame for ~5 seconds
          let frameCount = 0;
          let lastTime = performance.now();
          const fpsHistory = [];

          const measureFPS = (currentTime) => {
            frameCount++;
            const deltaTime = currentTime - lastTime;
            if (frameCount % 60 === 0) {
              const fps = Math.round(1000 / (deltaTime / 60));
              fpsHistory.push(fps);
              if (fpsHistory.length > 10) fpsHistory.shift();
              lastTime = currentTime;
            }
            if (frameCount < 300) {
              requestAnimationFrame(measureFPS);
            } else {
              const avgFPS = fpsHistory.length > 0 ? (fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length) : 0;
              results.fps = Math.round(avgFPS);
              results.frameTime = avgFPS > 0 ? Math.round(1000 / avgFPS) : 0;

              // Determine quality level based on FPS
              if (avgFPS >= 55) results.qualityLevel = 'ULTRA';
              else if (avgFPS >= 45) results.qualityLevel = 'HIGH';
              else if (avgFPS >= 30) results.qualityLevel = 'MEDIUM';
              else results.qualityLevel = 'LOW';

              // Pull render stats if available
              try {
                const s = window.__AGENT5_RENDER_STATS__ || { drawCalls: 0, triangles: 0 };
                results.renderCalls = s.drawCalls || 0;
                results.triangles = s.triangles || 0;
              } catch (e) {}

              // Update memory usage if available
              try {
                if ('memory' in performance) {
                  results.memoryUsage = Math.round((performance.memory.usedJSHeapSize || 0) / 1024 / 1024);
                }
              } catch (e) {}

              resolve(results);
            }
          };

          requestAnimationFrame(measureFPS);

          // Fallback hard timeout
          setTimeout(() => resolve(results), 12000);
        });
      });

      this.results = { ...this.results, ...metrics, loadTime };

      // Evaluate performance
      const evaluation = this.evaluatePerformance(this.results);
      
      console.log('📈 Agent 5 Performance Results:');
      console.log(`  Load Time: ${this.results.loadTime}ms`);
      console.log(`  FPS: ${this.results.fps} ${evaluation.fps.status}`);
      console.log(`  Frame Time: ${this.results.frameTime}ms`);
      console.log(`  Memory Usage: ${this.results.memoryUsage} resources`);
      console.log(`  Render Calls: ${this.results.renderCalls}`);
      console.log(`  Triangles: ${this.results.triangles.toLocaleString()}`);
      console.log(`  Quality Level: ${this.results.qualityLevel}`);
      console.log(`  Overall Status: ${evaluation.overall}`);

      // Save results
      this.saveResults();
      
      await browser.close();
      
      return evaluation.overall === 'PASS';
      
    } catch (error) {
      console.error('❌ Agent 5 Performance test failed:', error.message);
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
    const resultsPath = path.join(__dirname, '..', 'coordination', 'AGENT_5_PERFORMANCE_RESULTS.md');
    const content = `# Agent 5 Performance Test Results

**Date**: ${new Date().toISOString()}
**Test**: FPS and Performance Measurement

## Results
- **FPS**: ${this.results.fps}
- **Frame Time**: ${this.results.frameTime}ms
- **Memory Usage**: ${this.results.memoryUsage} resources
- **Render Calls**: ${this.results.renderCalls}
- **Triangles**: ${this.results.triangles.toLocaleString()}
- **Quality Level**: ${this.results.qualityLevel}
- **Load Time**: ${this.results.loadTime}ms

## Status
${this.results.fps >= 60 ? '✅ PASS' : this.results.fps >= 45 ? '⚠️ WARNING' : '❌ FAIL'} - Target: 60+ FPS

## Issues Identified
${this.results.fps < 60 ? `- FPS below target (${this.results.fps} < 60)` : '- No issues detected'}
${this.results.fps < 30 ? '- Critical performance degradation detected' : ''}
`;

    fs.writeFileSync(resultsPath, content);
    console.log(`📄 Results saved to: ${resultsPath}`);
  }
}

// Run the test
const test = new Agent5PerformanceTest();
test.runTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
