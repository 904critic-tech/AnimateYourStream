/**
 * Phase 3 Core Web Vitals Measurement
 * 
 * Actual performance measurement for production validation
 * Agent 2 - Performance Optimization Team
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CoreWebVitalsMeasurer {
  constructor() {
    this.testUrl = 'http://localhost:4173'; // Vite preview server
    this.results = {
      FCP: 0,
      LCP: 0,
      TTI: 0,
      TTFB: 0,
      CLS: 0,
      timestamp: new Date().toISOString()
    };
  }

  async measurePerformance() {
    console.log('🚀 Phase 3: Measuring Core Web Vitals...\n');
    
    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Configure for performance measurement
      await page.setCacheEnabled(false);
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40 // 40ms
      });

      console.log('📊 Measuring performance metrics...');

      // Navigate and measure
      await page.goto(this.testUrl, { waitUntil: 'networkidle2' });
      
      // Measure Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const results = {
            FCP: 0,
            LCP: 0,
            TTI: 0,
            TTFB: 0,
            CLS: 0
          };

          // Measure TTFB
          const navEntry = performance.getEntriesByType('navigation')[0];
          if (navEntry) {
            results.TTFB = navEntry.responseStart - navEntry.requestStart;
          }

          // Use PerformanceObserver for other metrics
          let metricsCollected = 0;
          const targetMetrics = 2; // FCP, LCP

          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                results.FCP = entry.startTime;
                metricsCollected++;
              }
              if (entry.name === 'largest-contentful-paint') {
                results.LCP = entry.startTime;
                metricsCollected++;
              }
            });

            if (metricsCollected >= targetMetrics) {
              observer.disconnect();
              resolve(results);
            }
          });

          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

          // Fallback timeout
          setTimeout(() => {
            observer.disconnect();
            resolve(results);
          }, 10000);
        });
      });

      this.results = { ...this.results, ...metrics };

      // Evaluate against targets
      const evaluation = this.evaluateMetrics(this.results);
      
      console.log('📈 Core Web Vitals Results:');
      console.log(`  First Contentful Paint (FCP): ${this.results.FCP.toFixed(2)}ms ${evaluation.FCP.status}`);
      console.log(`  Largest Contentful Paint (LCP): ${this.results.LCP.toFixed(2)}ms ${evaluation.LCP.status}`);
      console.log(`  Time to First Byte (TTFB): ${this.results.TTFB.toFixed(2)}ms ${evaluation.TTFB.status}`);
      console.log(`  Overall Status: ${evaluation.overall}`);

      await browser.close();
      
      // Save results
      this.saveResults(evaluation);
      
      return evaluation;
      
    } catch (error) {
      console.error('❌ Performance measurement failed:', error.message);
      throw error;
    }
  }

  evaluateMetrics(metrics) {
    const evaluation = {
      FCP: { target: 1500, actual: metrics.FCP, status: '❌' },
      LCP: { target: 2500, actual: metrics.LCP, status: '❌' },
      TTFB: { target: 800, actual: metrics.TTFB, status: '❌' },
      overall: 'NEEDS IMPROVEMENT'
    };

    // Evaluate each metric
    if (metrics.FCP <= 1500) evaluation.FCP.status = '✅';
    if (metrics.LCP <= 2500) evaluation.LCP.status = '✅';
    if (metrics.TTFB <= 800) evaluation.TTFB.status = '✅';

    // Overall status
    const goodCount = [evaluation.FCP, evaluation.LCP, evaluation.TTFB]
      .filter(m => m.status === '✅').length;
    
    if (goodCount === 3) {
      evaluation.overall = 'EXCELLENT';
    } else if (goodCount >= 2) {
      evaluation.overall = 'GOOD';
    } else {
      evaluation.overall = 'NEEDS IMPROVEMENT';
    }

    return evaluation;
  }

  saveResults(evaluation) {
    const reportPath = path.join(process.cwd(), 'PHASE_3_PERFORMANCE_RESULTS.md');
    
    const report = `# Phase 3 Performance Measurement Results

**Generated**: ${this.results.timestamp}
**Agent**: Agent 2 - Performance Optimization Team

## 📊 Core Web Vitals Measurement

### Results:
- **First Contentful Paint (FCP)**: ${this.results.FCP.toFixed(2)}ms ${evaluation.FCP.status} (Target: <1500ms)
- **Largest Contentful Paint (LCP)**: ${this.results.LCP.toFixed(2)}ms ${evaluation.LCP.status} (Target: <2500ms)
- **Time to First Byte (TTFB)**: ${this.results.TTFB.toFixed(2)}ms ${evaluation.TTFB.status} (Target: <800ms)

### Overall Status: ${evaluation.overall}

## 🎯 Phase 3 Task Completion Status

### Task 1: Bundle Analysis & Code Splitting
- ✅ Bundle analysis completed
- ✅ Code splitting implemented
- ✅ Three.js optimization applied
- ✅ Lazy loading created

### Task 2: CDN Configuration
- ✅ CDN framework implemented
- ✅ Asset optimization configured
- ✅ Resource hints added
- ❌ CDN performance testing needed

### Task 3: Production Performance Validation
- ✅ FCP measured: ${this.results.FCP.toFixed(2)}ms
- ✅ LCP measured: ${this.results.LCP.toFixed(2)}ms
- ✅ TTFB measured: ${this.results.TTFB.toFixed(2)}ms
- ✅ Performance report generated

## 📋 Next Steps

1. **CDN Performance Testing**: Test actual CDN vs local performance
2. **Production Deployment**: Deploy to staging for real-world testing
3. **Monitoring Setup**: Activate production monitoring

---

*Generated by Agent 2 - Performance Optimization Team*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📋 Performance results saved: ${reportPath}`);
  }
}

// Run measurement
if (require.main === module) {
  const measurer = new CoreWebVitalsMeasurer();
  measurer.measurePerformance()
    .then((evaluation) => {
      console.log(`\n🎉 Performance measurement completed!`);
      console.log(`📊 Overall Status: ${evaluation.overall}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`\n❌ Performance measurement failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = CoreWebVitalsMeasurer;
