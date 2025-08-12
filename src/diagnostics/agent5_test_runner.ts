/**
 * Agent 5 - Error Analysis Test Runner
 * Start comprehensive error analysis and generate reports
 */

import { startAgent5ErrorAnalysis, getAgent5Analysis, getAgent5Summary, exportAgent5Report } from './agent5_error_analysis';

interface Agent5TestResult {
  timestamp: string;
  analysisStarted: boolean;
  summary: any;
  recommendations: string[];
  reportGenerated: boolean;
  status: 'running' | 'completed' | 'error';
}

class Agent5TestRunner {
  private isRunning: boolean = false;
  private startTime: number = 0;
  private results: Agent5TestResult[] = [];

  /**
   * Start Agent 5 error analysis
   */
  async startAnalysis(): Promise<Agent5TestResult> {
    if (this.isRunning) {
      return {
        timestamp: new Date().toISOString(),
        analysisStarted: false,
        summary: {},
        recommendations: ['Analysis already running'],
        reportGenerated: false,
        status: 'running'
      };
    }

    console.log('🚀 Agent 5: Starting comprehensive error analysis...');
    this.isRunning = true;
    this.startTime = Date.now();

    try {
      // Start the error analysis
      startAgent5ErrorAnalysis();

      // Wait a moment for initial analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get initial results
      const summary = getAgent5Summary();
      const analysis = getAgent5Analysis();

      const result: Agent5TestResult = {
        timestamp: new Date().toISOString(),
        analysisStarted: true,
        summary,
        recommendations: analysis.recommendations,
        reportGenerated: false,
        status: 'running'
      };

      this.results.push(result);

      console.log('✅ Agent 5: Error analysis started successfully');
      console.log('📊 Initial Summary:', summary);
      console.log('💡 Recommendations:', analysis.recommendations);

      return result;

    } catch (error) {
      console.error('❌ Agent 5: Error analysis failed:', error);
      
      const errorResult: Agent5TestResult = {
        timestamp: new Date().toISOString(),
        analysisStarted: false,
        summary: {},
        recommendations: [`Analysis failed: ${(error as Error).message}`],
        reportGenerated: false,
        status: 'error'
      };

      this.results.push(errorResult);
      this.isRunning = false;
      
      return errorResult;
    }
  }

  /**
   * Generate comprehensive error report
   */
  async generateReport(): Promise<string> {
    if (!this.isRunning) {
      return 'Error analysis not running. Start analysis first.';
    }

    try {
      // Wait for more data collection
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Generate comprehensive report
      const report = exportAgent5Report();
      
      // Update results
      const lastResult = this.results[this.results.length - 1];
      if (lastResult) {
        lastResult.reportGenerated = true;
        lastResult.status = 'completed';
      }

      console.log('📋 Agent 5: Comprehensive error report generated');
      
      return report;

    } catch (error) {
      console.error('❌ Agent 5: Report generation failed:', error);
      return `Report generation failed: ${(error as Error).message}`;
    }
  }

  /**
   * Get current analysis status
   */
  getStatus(): {
    isRunning: boolean;
    duration: number;
    results: Agent5TestResult[];
    currentSummary: any;
  } {
    const duration = this.isRunning ? Date.now() - this.startTime : 0;
    const currentSummary = this.isRunning ? getAgent5Summary() : null;

    return {
      isRunning: this.isRunning,
      duration,
      results: [...this.results],
      currentSummary
    };
  }

  /**
   * Stop analysis
   */
  stopAnalysis(): void {
    if (this.isRunning) {
      console.log('🛑 Agent 5: Stopping error analysis...');
      this.isRunning = false;
      
      // Update final result
      const lastResult = this.results[this.results.length - 1];
      if (lastResult) {
        lastResult.status = 'completed';
      }
    }
  }
}

// Export singleton instance
export const agent5TestRunner = new Agent5TestRunner();

// Export convenience functions
export async function runAgent5ErrorAnalysis(): Promise<Agent5TestResult> {
  return agent5TestRunner.startAnalysis();
}

export async function generateAgent5Report(): Promise<string> {
  return agent5TestRunner.generateReport();
}

export function getAgent5Status() {
  return agent5TestRunner.getStatus();
}

export function stopAgent5Analysis(): void {
  agent5TestRunner.stopAnalysis();
}

// Auto-start analysis when module is loaded (for testing)
if (typeof window !== 'undefined') {
  // Start analysis after a short delay to allow page to load
  setTimeout(() => {
    console.log('🔍 Agent 5: Auto-starting error analysis...');
    runAgent5ErrorAnalysis().then(result => {
      console.log('✅ Agent 5: Auto-analysis completed:', result);
    }).catch(error => {
      console.error('❌ Agent 5: Auto-analysis failed:', error);
    });
  }, 3000);
}
