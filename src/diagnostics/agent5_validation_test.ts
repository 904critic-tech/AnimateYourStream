/**
 * Agent 5 - Validation Test Script
 * Test monitoring system and validate current application status
 */

import { startAgent5LiveMonitoring, getAgent5MonitoringData } from './agent5_live_monitoring';
import { startAgent5ErrorAnalysis } from './agent5_error_analysis';

interface ValidationResult {
  timestamp: string;
  monitoringActive: boolean;
  errorAnalysisActive: boolean;
  criticalIssues: any[];
  systemHealth: number;
  recommendations: string[];
  status: 'pass' | 'fail' | 'warning';
}

class Agent5ValidationTest {
  private isRunning: boolean = false;
  private results: ValidationResult[] = [];

  /**
   * Run comprehensive validation test
   */
  async runValidationTest(): Promise<ValidationResult> {
    if (this.isRunning) {
      return {
        timestamp: new Date().toISOString(),
        monitoringActive: false,
        errorAnalysisActive: false,
        criticalIssues: [],
        systemHealth: 0,
        recommendations: ['Test already running'],
        status: 'warning'
      };
    }

    console.log('🧪 Agent 5: Starting validation test...');
    this.isRunning = true;

    try {
      // Start monitoring systems
      startAgent5ErrorAnalysis();
      startAgent5LiveMonitoring();

      // Wait for systems to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get current status
      const monitoringData = getAgent5MonitoringData();

      // Analyze results
      const result = this.analyzeResults(monitoringData);
      this.results.push(result);

      console.log('✅ Agent 5: Validation test completed');
      console.log('📊 Results:', result);

      return result;

    } catch (error) {
      console.error('❌ Agent 5: Validation test failed:', error);
      
      const errorResult: ValidationResult = {
        timestamp: new Date().toISOString(),
        monitoringActive: false,
        errorAnalysisActive: false,
        criticalIssues: [],
        systemHealth: 0,
        recommendations: [`Test failed: ${(error as Error).message}`],
        status: 'fail'
      };

      this.results.push(errorResult);
      this.isRunning = false;
      
      return errorResult;
    }
  }

  /**
   * Analyze validation results
   */
  private analyzeResults(monitoringData: any): ValidationResult {
    const criticalIssues = monitoringData.criticalIssues || [];
    const systemHealth = monitoringData.healthScore || 0;
    const recommendations = monitoringData.recommendations || [];

    // Determine overall status
    let status: 'pass' | 'fail' | 'warning' = 'pass';
    
    if (systemHealth < 50) {
      status = 'fail';
    } else if (systemHealth < 80) {
      status = 'warning';
    }

    // Check for critical issues
    const activeCriticalIssues = criticalIssues.filter((issue: any) => issue.errorCount > 0);
    if (activeCriticalIssues.length > 0) {
      status = 'fail';
    }

    return {
      timestamp: new Date().toISOString(),
      monitoringActive: true,
      errorAnalysisActive: true,
      criticalIssues: activeCriticalIssues,
      systemHealth,
      recommendations,
      status
    };
  }

  /**
   * Test specific functionality
   */
  async testUploadSystem(): Promise<boolean> {
    console.log('🔍 Agent 5: Testing upload system...');
    
    // Simulate upload error detection
    const monitoringData = getAgent5MonitoringData();
    const uploadIssue = monitoringData.criticalIssues.find((issue: any) => issue.type === 'upload_system');
    
    if (uploadIssue && uploadIssue.errorCount > 0) {
      console.log('🚨 Agent 5: Upload system errors detected');
      return false;
    }
    
    console.log('✅ Agent 5: Upload system appears functional');
    return true;
  }

  /**
   * Test character switching system
   */
  async testCharacterSwitching(): Promise<boolean> {
    console.log('🔍 Agent 5: Testing character switching...');
    
    const monitoringData = getAgent5MonitoringData();
    const switchingIssue = monitoringData.criticalIssues.find((issue: any) => issue.type === 'character_switching');
    
    if (switchingIssue && switchingIssue.errorCount > 0) {
      console.log('🚨 Agent 5: Character switching errors detected');
      return false;
    }
    
    console.log('✅ Agent 5: Character switching appears functional');
    return true;
  }

  /**
   * Test animation system
   */
  async testAnimationSystem(): Promise<boolean> {
    console.log('🔍 Agent 5: Testing animation system...');
    
    const monitoringData = getAgent5MonitoringData();
    const animationIssue = monitoringData.criticalIssues.find((issue: any) => issue.type === 'animation_system');
    
    if (animationIssue && animationIssue.errorCount > 0) {
      console.log('🚨 Agent 5: Animation system errors detected');
      return false;
    }
    
    console.log('✅ Agent 5: Animation system appears functional');
    return true;
  }

  /**
   * Run comprehensive system test
   */
  async runSystemTest(): Promise<{
    uploadSystem: boolean;
    characterSwitching: boolean;
    animationSystem: boolean;
    overallStatus: 'pass' | 'fail' | 'warning';
  }> {
    console.log('🧪 Agent 5: Running comprehensive system test...');

    const uploadSystem = await this.testUploadSystem();
    const characterSwitching = await this.testCharacterSwitching();
    const animationSystem = await this.testAnimationSystem();

    let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
    
    if (!uploadSystem || !characterSwitching || !animationSystem) {
      overallStatus = 'fail';
    } else {
      const monitoringData = getAgent5MonitoringData();
      if (monitoringData.healthScore < 80) {
        overallStatus = 'warning';
      }
    }

    const result = {
      uploadSystem,
      characterSwitching,
      animationSystem,
      overallStatus
    };

    console.log('📊 Agent 5: System test results:', result);
    return result;
  }

  /**
   * Get test results
   */
  getResults(): ValidationResult[] {
    return [...this.results];
  }

  /**
   * Generate test report
   */
  generateTestReport(): string {
    const results = this.getResults();
    const latestResult = results[results.length - 1];

    if (!latestResult) {
      return 'No test results available';
    }

    const report = {
      timestamp: new Date().toISOString(),
      testResults: latestResult,
      allResults: results,
      summary: {
        totalTests: results.length,
        passedTests: results.filter(r => r.status === 'pass').length,
        failedTests: results.filter(r => r.status === 'fail').length,
        warningTests: results.filter(r => r.status === 'warning').length
      }
    };

    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const agent5ValidationTest = new Agent5ValidationTest();

// Export convenience functions
export async function runAgent5ValidationTest(): Promise<ValidationResult> {
  return agent5ValidationTest.runValidationTest();
}

export async function runAgent5SystemTest(): Promise<{
  uploadSystem: boolean;
  characterSwitching: boolean;
  animationSystem: boolean;
  overallStatus: 'pass' | 'fail' | 'warning';
}> {
  return agent5ValidationTest.runSystemTest();
}

export function getAgent5TestResults(): ValidationResult[] {
  return agent5ValidationTest.getResults();
}

export function generateAgent5TestReport(): string {
  return agent5ValidationTest.generateTestReport();
}

// Auto-run validation test when module is loaded (for testing)
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    console.log('🧪 Agent 5: Auto-running validation test...');
    try {
      const result = await runAgent5ValidationTest();
      console.log('✅ Agent 5: Auto-validation completed:', result);
      
      if (result.status === 'fail') {
        console.log('🚨 Agent 5: Critical issues detected - coordination required');
      }
    } catch (error) {
      console.error('❌ Agent 5: Auto-validation failed:', error);
    }
  }, 5000);
}
