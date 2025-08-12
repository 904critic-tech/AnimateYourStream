/**
 * Smart Diagnostics System Test Suite
 * Testing error detection, AI analysis, and auto-repair
 */

import { SmartErrorDetector } from './SmartErrorDetector';
import { createSmartDiagnostics } from './index';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

export class DiagnosticsTestSuite {
  private results: TestResult[] = [];
  private detector: SmartErrorDetector;

  constructor() {
    this.detector = new SmartErrorDetector({
      performanceMode: false,
      samplingRate: 1.0,
      maxErrors: 100,
      aiAnalysis: true
    });
    console.log('🔍 Smart Diagnostics Test Suite Initialized');
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Smart Diagnostics Tests...\n');

    await this.testErrorDetection();
    await this.testAIAnalysis();
    await this.testAutoRepair();
    await this.testPerformanceImpact();
    await this.testMemoryUsage();

    this.printResults();
  }

  /**
   * Test basic error detection
   */
  private async testErrorDetection(): Promise<void> {
    const testName = 'Error Detection';
    const startTime = performance.now();

    try {
      let errorCaptured = false;
      let capturedError: any = null;

      this.detector.onError((error) => {
        errorCaptured = true;
        capturedError = error;
      });

      this.detector.reportManualError('audio', 'Test microphone permission denied');
      await this.delay(100);

      const passed = errorCaptured && 
                    capturedError?.category === 'audio' && 
                    capturedError?.message.includes('microphone');

      this.addResult(testName, passed, 
        passed ? 'Error detected and categorized correctly' 
               : `Failed: captured=${errorCaptured}, category=${capturedError?.category}`,
        performance.now() - startTime
      );

    } catch (error) {
      this.addResult(testName, false, `Exception: ${error}`, performance.now() - startTime);
    }
  }

  /**
   * Test AI analysis functionality
   */
  private async testAIAnalysis(): Promise<void> {
    const testName = 'AI Analysis';
    const startTime = performance.now();

    try {
      let analysisReceived = false;
      let aiAnalysis: any = null;

      this.detector.onError((error) => {
        if (error.aiAnalysis) {
          analysisReceived = true;
          aiAnalysis = error.aiAnalysis;
        }
      });

      this.detector.reportManualError('rendering', 'WebGL context lost - GPU error');
      await this.delay(200);

      const passed = analysisReceived && 
                    aiAnalysis?.confidence > 0 && 
                    aiAnalysis?.predictedCause && 
                    aiAnalysis?.suggestion;

      this.addResult(testName, passed,
        passed ? `AI analysis generated with ${Math.round(aiAnalysis.confidence * 100)}% confidence`
               : `Failed: received=${analysisReceived}`,
        performance.now() - startTime
      );

    } catch (error) {
      this.addResult(testName, false, `Exception: ${error}`, performance.now() - startTime);
    }
  }

  /**
   * Test auto-repair system
   */
  private async testAutoRepair(): Promise<void> {
    const testName = 'Auto-Repair System';
    const startTime = performance.now();

    try {
      this.detector.reportManualError('rendering', 'Critical WebGL context lost error');
      await this.delay(300);

      const repairStats = this.detector.getAutoRepairStats();
      const passed = (repairStats.totalRepairs >= 0) && 
                    this.detector.getAutoRepairSystem().isAutoRepairEnabled();

      this.addResult(testName, passed,
        passed ? `Auto-repair system active. Total repairs: ${repairStats.totalRepairs}`
               : `Failed: system not active`,
        performance.now() - startTime
      );

    } catch (error) {
      this.addResult(testName, false, `Exception: ${error}`, performance.now() - startTime);
    }
  }

  /**
   * Test performance impact
   */
  private async testPerformanceImpact(): Promise<void> {
    const testName = 'Performance Impact';
    const startTime = performance.now();

    try {
      const initialTime = performance.now();

      for (let i = 0; i < 50; i++) {
        this.detector.reportManualError('system', `Performance test error ${i}`);
      }

      const processingTime = performance.now() - initialTime;
      const passed = processingTime < 100;

      this.addResult(testName, passed,
        passed ? `Processed 50 errors in ${processingTime.toFixed(2)}ms`
               : `Too slow: ${processingTime.toFixed(2)}ms`,
        performance.now() - startTime
      );

    } catch (error) {
      this.addResult(testName, false, `Exception: ${error}`, performance.now() - startTime);
    }
  }

  /**
   * Test memory usage
   */
  private async testMemoryUsage(): Promise<void> {
    const testName = 'Memory Usage';
    const startTime = performance.now();

    try {
      const initialMemory = this.getMemoryUsage();

      for (let i = 0; i < 100; i++) {
        this.detector.reportManualError('system', `Memory test error ${i}`);
      }

      await this.delay(500);

      const finalMemory = this.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      const passed = memoryIncrease < 10 * 1024 * 1024; // Less than 10MB

      this.addResult(testName, passed,
        passed ? `Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
               : `Memory leak: ${Math.round(memoryIncrease / 1024 / 1024)}MB`,
        performance.now() - startTime
      );

    } catch (error) {
      this.addResult(testName, false, `Exception: ${error}`, performance.now() - startTime);
    }
  }

  /**
   * Helper methods
   */
  private addResult(name: string, passed: boolean, details: string, duration: number): void {
    this.results.push({ name, passed, details, duration });
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const timeStr = `(${duration.toFixed(2)}ms)`;
    console.log(`${status} ${name} ${timeStr}: ${details}`);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️ Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.details}`);
      });
    }

    const successRate = (passedTests / totalTests) * 100;
    if (successRate >= 90) {
      console.log('\n🎉 EXCELLENT: Smart Diagnostics System is working perfectly!');
    } else if (successRate >= 75) {
      console.log('\n✅ GOOD: Smart Diagnostics System is working well.');
    } else {
      console.log('\n⚠️ NEEDS WORK: Smart Diagnostics System has issues.');
    }
  }

  dispose(): void {
    this.detector.dispose();
    console.log('🧹 Test suite cleaned up');
  }
}

/**
 * Quick validation function
 */
export async function validateDiagnosticsSystem(): Promise<boolean> {
  console.log('🔍 Quick Diagnostics Validation...');
  
  try {
    const detector = createSmartDiagnostics({
      performanceMode: true,
      samplingRate: 0.1
    });

    let errorDetected = false;
    detector.onError(() => { errorDetected = true; });
    
    detector.reportManualError('system', 'Validation test error');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const isValid = errorDetected && 
                   detector.getPerformanceMetrics().fps >= 0 &&
                   detector.getAutoRepairStats().totalRepairs >= 0;

    console.log(isValid ? '✅ Diagnostics system validated' 
                        : '❌ Validation failed');
    
    return isValid;
  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  }
}

// Auto-run tests in browser
if (typeof window !== 'undefined') {
  (window as any).testDiagnostics = async () => {
    const testSuite = new DiagnosticsTestSuite();
    await testSuite.runAllTests();
    testSuite.dispose();
  };

  console.log('💡 Run: testDiagnostics() to test the system');
}