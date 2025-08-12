#!/usr/bin/env node

/**
 * Load Testing Script for Animation Studio
 * Agent 2 - Performance Optimization Team
 * 
 * Tests application performance under various conditions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class LoadTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4173';
    this.concurrent = options.concurrent || 5;
    this.duration = options.duration || 60000; // 60 seconds
    this.outputDir = options.outputDir || './load-test-results';
    this.results = [];
  }

  async runLoadTest() {
    console.log('🚀 Starting load test...');
    console.log(`Target: ${this.baseUrl}`);
    console.log(`Concurrent users: ${this.concurrent}`);
    console.log(`Duration: ${this.duration / 1000}s`);

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const startTime = Date.now();
    const browsers = [];
    
    try {
      // Launch browsers
      for (let i = 0; i < this.concurrent; i++) {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        browsers.push(browser);
      }

      // Run concurrent tests
      const testPromises = browsers.map((browser, index) => 
        this.runUserSession(browser, index, startTime)
      );

      await Promise.all(testPromises);

    } finally {
      // Cleanup browsers
      await Promise.all(browsers.map(browser => browser.close()));
    }

    // Generate report
    await this.generateReport();
    console.log('✅ Load test completed!');
  }

  async runUserSession(browser, userId, startTime) {
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    
    const sessionResults = {
      userId,
      requests: [],
      errors: [],
      performanceMetrics: [],
      startTime: Date.now()
    };

    try {
      // Monitor network requests
      page.on('response', (response) => {
        sessionResults.requests.push({
          url: response.url(),
          status: response.status(),
          loadTime: response.timing(),
          size: response.headers()['content-length'] || 0
        });
      });

      // Monitor console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          sessionResults.errors.push({
            message: msg.text(),
            timestamp: Date.now()
          });
        }
      });

      // Run test scenarios
      while (Date.now() - startTime < this.duration) {
        await this.runTestScenario(page, sessionResults);
        await this.sleep(1000 + Math.random() * 2000); // 1-3 second delay
      }

    } catch (error) {
      sessionResults.errors.push({
        message: error.message,
        timestamp: Date.now(),
        type: 'session-error'
      });
    } finally {
      sessionResults.endTime = Date.now();
      sessionResults.duration = sessionResults.endTime - sessionResults.startTime;
      this.results.push(sessionResults);
      await page.close();
    }
  }

  async runTestScenario(page, sessionResults) {
    const scenarios = [
      () => this.testPageLoad(page, sessionResults),
      () => this.testInteraction(page, sessionResults),
      () => this.testPerformanceDashboard(page, sessionResults),
      () => this.testAnimationLoad(page, sessionResults)
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    await scenario();
  }

  async testPageLoad(page, sessionResults) {
    const startTime = Date.now();
    
    try {
      const response = await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      sessionResults.performanceMetrics.push({
        scenario: 'page-load',
        loadTime,
        status: response.status(),
        metrics,
        timestamp: Date.now()
      });

    } catch (error) {
      sessionResults.errors.push({
        scenario: 'page-load',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async testInteraction(page, sessionResults) {
    const startTime = Date.now();
    
    try {
      // Test UI interactions
      await page.waitForSelector('[data-testid="model-viewer"]', { timeout: 10000 });
      
      // Click performance dashboard button
      const perfButton = await page.$('button:contains("Performance")');
      if (perfButton) {
        await perfButton.click();
        await this.sleep(500);
      }

      // Test mouse movement (simulate user interaction)
      await page.mouse.move(400, 300);
      await page.mouse.move(500, 400);
      
      const endTime = Date.now();

      sessionResults.performanceMetrics.push({
        scenario: 'interaction',
        loadTime: endTime - startTime,
        timestamp: Date.now()
      });

    } catch (error) {
      sessionResults.errors.push({
        scenario: 'interaction',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async testPerformanceDashboard(page, sessionResults) {
    const startTime = Date.now();
    
    try {
      // Open performance dashboard
      const dashboardButton = await page.$('button[title="Show Performance Dashboard"]');
      if (dashboardButton) {
        await dashboardButton.click();
        await this.sleep(1000);
        
        // Wait for metrics to load
        await page.waitForSelector('.performance-metrics', { timeout: 5000 });
        
        // Close dashboard
        const closeButton = await page.$('button[aria-label="Close"]');
        if (closeButton) {
          await closeButton.click();
        }
      }

      const endTime = Date.now();

      sessionResults.performanceMetrics.push({
        scenario: 'performance-dashboard',
        loadTime: endTime - startTime,
        timestamp: Date.now()
      });

    } catch (error) {
      sessionResults.errors.push({
        scenario: 'performance-dashboard',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async testAnimationLoad(page, sessionResults) {
    const startTime = Date.now();
    
    try {
      // Test animation system
      await page.evaluate(() => {
        // Trigger animation change
        const animButton = document.querySelector('[data-animation="walk"]');
        if (animButton) animButton.click();
      });

      await this.sleep(2000); // Let animation play

      const endTime = Date.now();

      sessionResults.performanceMetrics.push({
        scenario: 'animation-load',
        loadTime: endTime - startTime,
        timestamp: Date.now()
      });

    } catch (error) {
      sessionResults.errors.push({
        scenario: 'animation-load',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async generateReport() {
    const report = {
      summary: this.generateSummary(),
      sessions: this.results,
      timestamp: new Date().toISOString()
    };

    // Write detailed report
    const reportPath = path.join(this.outputDir, `load-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Write summary report
    const summaryPath = path.join(this.outputDir, 'load-test-summary.txt');
    fs.writeFileSync(summaryPath, this.formatSummaryReport(report.summary));

    console.log(`📊 Detailed report: ${reportPath}`);
    console.log(`📋 Summary report: ${summaryPath}`);
    
    return report;
  }

  generateSummary() {
    const allMetrics = this.results.flatMap(r => r.performanceMetrics);
    const allErrors = this.results.flatMap(r => r.errors);
    const allRequests = this.results.flatMap(r => r.requests);

    return {
      totalSessions: this.results.length,
      totalRequests: allRequests.length,
      totalErrors: allErrors.length,
      errorRate: (allErrors.length / allRequests.length) * 100,
      averageLoadTime: this.calculateAverage(allMetrics.map(m => m.loadTime)),
      p95LoadTime: this.calculatePercentile(allMetrics.map(m => m.loadTime), 95),
      successfulRequests: allRequests.filter(r => r.status < 400).length,
      failedRequests: allRequests.filter(r => r.status >= 400).length,
      scenarioPerformance: this.analyzeScenarioPerformance(allMetrics)
    };
  }

  analyzeScenarioPerformance(metrics) {
    const scenarios = ['page-load', 'interaction', 'performance-dashboard', 'animation-load'];
    const analysis = {};

    scenarios.forEach(scenario => {
      const scenarioMetrics = metrics.filter(m => m.scenario === scenario);
      if (scenarioMetrics.length > 0) {
        analysis[scenario] = {
          count: scenarioMetrics.length,
          averageTime: this.calculateAverage(scenarioMetrics.map(m => m.loadTime)),
          p95Time: this.calculatePercentile(scenarioMetrics.map(m => m.loadTime), 95)
        };
      }
    });

    return analysis;
  }

  calculateAverage(numbers) {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  calculatePercentile(numbers, percentile) {
    if (numbers.length === 0) return 0;
    const sorted = numbers.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  formatSummaryReport(summary) {
    return `
🚀 Animation Studio Load Test Summary
=====================================

Test Configuration:
- Concurrent Users: ${this.concurrent}
- Duration: ${this.duration / 1000}s
- Target: ${this.baseUrl}

Overall Performance:
- Total Sessions: ${summary.totalSessions}
- Total Requests: ${summary.totalRequests}
- Error Rate: ${summary.errorRate.toFixed(2)}%
- Average Load Time: ${summary.averageLoadTime.toFixed(2)}ms
- 95th Percentile: ${summary.p95LoadTime.toFixed(2)}ms

Request Summary:
- Successful: ${summary.successfulRequests}
- Failed: ${summary.failedRequests}

Scenario Performance:
${Object.entries(summary.scenarioPerformance).map(([scenario, data]) => 
  `- ${scenario}: ${data.averageTime.toFixed(2)}ms avg (${data.count} tests)`
).join('\n')}

Performance Assessment:
${this.getPerformanceAssessment(summary)}
`;
  }

  getPerformanceAssessment(summary) {
    const assessments = [];

    if (summary.averageLoadTime < 1000) {
      assessments.push('✅ Excellent average load time');
    } else if (summary.averageLoadTime < 3000) {
      assessments.push('⚠️ Acceptable load time');
    } else {
      assessments.push('❌ Poor load time - optimization needed');
    }

    if (summary.errorRate < 1) {
      assessments.push('✅ Low error rate');
    } else if (summary.errorRate < 5) {
      assessments.push('⚠️ Moderate error rate');
    } else {
      assessments.push('❌ High error rate - stability issues');
    }

    if (summary.p95LoadTime < 2000) {
      assessments.push('✅ Good 95th percentile performance');
    } else {
      assessments.push('⚠️ High tail latency');
    }

    return assessments.join('\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'concurrent') options.concurrent = parseInt(value);
    if (key === 'duration') options.duration = parseInt(value) * 1000;
    if (key === 'url') options.baseUrl = value;
  }

  const loadTester = new LoadTester(options);
  loadTester.runLoadTest().catch(console.error);
}

module.exports = LoadTester;
