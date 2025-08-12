/**
 * Phase 2 Monitoring Validation Test Runner
 * Execute comprehensive production monitoring validation
 */

import { runPhase2MonitoringValidation } from './phase2MonitoringValidation';
import { initializeGlobalMonitoring } from './index';
import { initializeHealthCheck } from '../utils/healthCheck';
import { initializeErrorReporting } from '../utils/errorReporting';

interface TestExecutionReport {
  executionTime: number;
  validationResults: any[];
  summary: {
    totalTests: number;
    passedTests: number;
    overallScore: number;
    productionReady: boolean;
  };
  platformInfo: any;
  recommendations: string[];
  deploymentReadiness: 'READY' | 'NEEDS_IMPROVEMENT' | 'NOT_READY';
}

/**
 * Execute Phase 2 monitoring validation with full initialization
 */
export async function executePhase2MonitoringValidation(): Promise<TestExecutionReport> {
  console.log('🚀 Starting Phase 2 Monitoring System Validation...');
  const startTime = Date.now();

  try {
    // Step 1: Initialize all monitoring systems
    console.log('📋 Step 1: Initializing monitoring systems...');
    
    const errorReporting = initializeErrorReporting({
      environment: process.env.NODE_ENV as 'development' | 'production' || 'production',
      dsn: process.env.REACT_APP_SENTRY_DSN,
      release: process.env.REACT_APP_VERSION,
      sampleRate: 1.0, // Full sampling for validation
      enableUserFeedback: true,
      enableAutoSessionTracking: true,
      enablePerformanceMonitoring: true
    });

    const healthCheck = initializeHealthCheck({
      interval: 10000, // 10 seconds for testing
      timeout: 3000,
      retries: 2,
      degradedThreshold: 70,
      unhealthyThreshold: 30
    });

    const globalMonitor = initializeGlobalMonitoring();

    if (!errorReporting || !healthCheck || !globalMonitor) {
      throw new Error('Failed to initialize monitoring systems');
    }

    console.log('✅ All monitoring systems initialized successfully');

    // Step 2: Wait for systems to stabilize
    console.log('⏳ Step 2: Allowing systems to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Execute validation tests
    console.log('🧪 Step 3: Running comprehensive validation tests...');
    const validationResults = await runPhase2MonitoringValidation();

    // Step 4: Calculate results
    const totalTests = validationResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = validationResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const overallScore = validationResults.reduce((sum, suite) => sum + suite.overallScore, 0) / 
                        validationResults.length;

    // Step 5: Determine deployment readiness
    let deploymentReadiness: 'READY' | 'NEEDS_IMPROVEMENT' | 'NOT_READY';
    if (overallScore >= 90) {
      deploymentReadiness = 'READY';
    } else if (overallScore >= 70) {
      deploymentReadiness = 'NEEDS_IMPROVEMENT';
    } else {
      deploymentReadiness = 'NOT_READY';
    }

    // Step 6: Generate recommendations
    const recommendations: string[] = [];
    validationResults.forEach(suite => {
      if (suite.overallScore < 80) {
        recommendations.push(`${suite.suiteName}: Score ${suite.overallScore}/100 - needs improvement`);
        
        // Add specific recommendations based on failed tests
        const failedTests = suite.results.filter((r: any) => !r.passed);
        failedTests.forEach((test: any) => {
          if (test.warnings && test.warnings.length > 0) {
            recommendations.push(`- ${test.testName}: ${test.warnings[0]}`);
          }
        });
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All monitoring systems are production-ready');
      recommendations.push('No improvements needed');
    }

    const executionTime = Date.now() - startTime;

    // Create comprehensive report
    const report: TestExecutionReport = {
      executionTime,
      validationResults,
      summary: {
        totalTests,
        passedTests,
        overallScore: Math.round(overallScore),
        productionReady: deploymentReadiness === 'READY'
      },
      platformInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      recommendations,
      deploymentReadiness
    };

    // Log results
    console.log('\n🎯 PHASE 2 MONITORING VALIDATION COMPLETE');
    console.log('==========================================');
    console.log(`⏱️  Execution Time: ${executionTime}ms`);
    console.log(`📊 Tests: ${passedTests}/${totalTests} passed`);
    console.log(`🎯 Overall Score: ${Math.round(overallScore)}/100`);
    console.log(`🚀 Deployment Status: ${deploymentReadiness}`);
    console.log('');

    // Log suite results
    validationResults.forEach(suite => {
      const status = suite.overallScore >= 90 ? '🎉 EXCELLENT' :
                     suite.overallScore >= 80 ? '✅ GOOD' :
                     suite.overallScore >= 70 ? '⚠️ ADEQUATE' : '❌ NEEDS WORK';
      console.log(`${status} ${suite.suiteName}: ${suite.passedTests}/${suite.totalTests} (${suite.overallScore}/100)`);
    });

    console.log('');
    console.log('📋 Recommendations:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));

    return report;

  } catch (error) {
    console.error('❌ Phase 2 monitoring validation failed:', error);
    
    const executionTime = Date.now() - startTime;
    return {
      executionTime,
      validationResults: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        overallScore: 0,
        productionReady: false
      },
      platformInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      },
      recommendations: [
        'Fix validation execution errors',
        'Ensure all monitoring systems can be initialized',
        'Check for missing dependencies or configuration issues'
      ],
      deploymentReadiness: 'NOT_READY'
    };
  }
}

/**
 * Quick health check for monitoring systems
 */
export async function quickMonitoringHealthCheck(): Promise<{
  errorReporting: boolean;
  healthMonitoring: boolean;
  globalMonitoring: boolean;
  autoRepair: boolean;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
}> {
  console.log('🩺 Running quick monitoring health check...');

  const health = {
    errorReporting: false,
    healthMonitoring: false,
    globalMonitoring: false,
    autoRepair: false,
    overallHealth: 'UNHEALTHY' as 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  };

  try {
    // Check error reporting
    const { getErrorReporting } = await import('../utils/errorReporting');
    health.errorReporting = !!getErrorReporting();

    // Check health monitoring
    const { getHealthCheck } = await import('../utils/healthCheck');
    health.healthMonitoring = !!getHealthCheck();

    // Check global monitoring
    const { getGlobalMonitor } = await import('./index');
    health.globalMonitoring = !!getGlobalMonitor();

    // Check auto-repair
    const { AutoRepairSystem } = await import('./AutoRepairSystem');
    const autoRepair = new AutoRepairSystem();
    health.autoRepair = autoRepair.isAutoRepairEnabled();

    // Calculate overall health
    const healthyCount = Object.values(health).filter(Boolean).length - 1; // Exclude overallHealth
    const totalSystems = 4;

    if (healthyCount === totalSystems) {
      health.overallHealth = 'HEALTHY';
    } else if (healthyCount >= totalSystems * 0.7) {
      health.overallHealth = 'DEGRADED';
    } else {
      health.overallHealth = 'UNHEALTHY';
    }

    console.log(`🩺 Health check complete: ${health.overallHealth} (${healthyCount}/${totalSystems} systems)`);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  return health;
}

/**
 * Export validation report to file
 */
export function exportValidationReport(report: TestExecutionReport): void {
  try {
    const reportJson = JSON.stringify(report, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase2-monitoring-validation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    console.log('📄 Validation report exported successfully');
  } catch (error) {
    console.error('❌ Failed to export validation report:', error);
  }
}

// Auto-run validation if this script is executed directly
if (typeof window !== 'undefined' && (window as any).__PHASE2_AUTO_RUN__) {
  executePhase2MonitoringValidation().then(report => {
    console.log('🎯 Phase 2 monitoring validation auto-run completed');
    (window as any).__PHASE2_VALIDATION_REPORT__ = report;
  });
}

export default executePhase2MonitoringValidation;
