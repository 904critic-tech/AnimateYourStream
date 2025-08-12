/**
 * Complete Animation Systems Validation Suite
 * 
 * Executes all animation system tests including:
 * - Performance stress testing
 * - Cross-platform compatibility
 * - IK solver validation
 * - Timeline editor testing
 * - Multi-animation stress testing
 */

import { StressTestReport } from './animationStressTest.ts'
import AnimationPlatformValidator, { CrossPlatformReport } from './animationValidation'
import { runAnimationStressTests } from './runAnimationStressTests'

export interface ComprehensiveAnimationReport {
  timestamp: string
  testSuite: 'Animation Systems Validation'
  stressTestResults: StressTestReport
  platformCompatibility: CrossPlatformReport
  overallStatus: 'PASS' | 'FAIL' | 'WARNING'
  deploymentRecommendation: string
  criticalIssues: string[]
  performanceMetrics: {
    averageFPS: number
    memoryUsage: number
    compatibilityScore: number
  }
}

/**
 * Master Animation Validation Runner
 */
export class AnimationSystemsValidator {
  
  async runCompleteValidation(): Promise<ComprehensiveAnimationReport> {
    console.log('🎭 ANIMATION SYSTEMS COMPREHENSIVE VALIDATION')
    console.log('=============================================')
    console.log('Starting complete animation system validation suite...')
    
    const startTime = performance.now()
    const criticalIssues: string[] = []
    
    // Phase 1: Stress Testing
    console.log('\n📊 Phase 1: Animation Stress Testing')
    console.log('====================================')
    
    let stressTestResults: StressTestReport
    try {
      stressTestResults = await runAnimationStressTests()
      
      if (stressTestResults.failed > 0) {
        criticalIssues.push(`${stressTestResults.failed} stress tests failed`)
      }
      
      if (stressTestResults.averageFPS < 30) {
        criticalIssues.push(`Low performance: ${stressTestResults.averageFPS.toFixed(2)} FPS average`)
      }
      
    } catch (error) {
      criticalIssues.push('Stress testing execution failed')
      stressTestResults = {
        totalTests: 0,
        passed: 0,
        failed: 1,
        averageFPS: 0,
        peakMemoryUsage: 0,
        totalDuration: 0,
        results: []
      }
    }
    
    // Phase 2: Platform Compatibility
    console.log('\n🌐 Phase 2: Cross-Platform Compatibility')
    console.log('========================================')
    
    let platformResults: CrossPlatformReport
    try {
      const validator = new AnimationPlatformValidator()
      platformResults = await validator.validateAnimationCompatibility()
      
      if (!platformResults.deploymentReady) {
        criticalIssues.push('Platform compatibility issues detected')
      }
      
      if (!platformResults.webglCompatibility.contextCreation) {
        criticalIssues.push('WebGL context creation failed')
      }
      
      if (platformResults.overallCompatibility < 70) {
        criticalIssues.push(`Low compatibility score: ${platformResults.overallCompatibility}/100`)
      }
      
    } catch (error) {
      criticalIssues.push('Platform compatibility testing failed')
      platformResults = {
        timestamp: new Date().toISOString(),
        browserResults: [],
        mobileCompatibility: {
          touchSupport: false,
          gestureRecognition: false,
          performanceDegradation: 1.0
        },
        webglCompatibility: {
          contextCreation: false,
          shaderCompilation: false,
          animationTextures: false
        },
        overallCompatibility: 0,
        deploymentReady: false
      }
    }
    
    // Phase 3: Analysis and Reporting
    console.log('\n📋 Phase 3: Analysis and Recommendations')
    console.log('======================================')
    
    const totalDuration = performance.now() - startTime
    
    // Determine overall status
    let overallStatus: 'PASS' | 'FAIL' | 'WARNING'
    let deploymentRecommendation: string
    
    if (criticalIssues.length === 0) {
      overallStatus = 'PASS'
      deploymentRecommendation = '✅ READY FOR DEPLOYMENT - All animation systems validated successfully'
    } else if (criticalIssues.length <= 2 && stressTestResults.averageFPS >= 25) {
      overallStatus = 'WARNING'
      deploymentRecommendation = '⚠️ DEPLOYMENT WITH CAUTION - Minor issues detected but functional'
    } else {
      overallStatus = 'FAIL'
      deploymentRecommendation = '❌ NOT READY FOR DEPLOYMENT - Critical issues must be resolved'
    }
    
    const report: ComprehensiveAnimationReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Animation Systems Validation',
      stressTestResults,
      platformCompatibility: platformResults,
      overallStatus,
      deploymentRecommendation,
      criticalIssues,
      performanceMetrics: {
        averageFPS: stressTestResults.averageFPS,
        memoryUsage: stressTestResults.peakMemoryUsage,
        compatibilityScore: platformResults.overallCompatibility
      }
    }
    
    // Generate comprehensive report
    this.printComprehensiveReport(report, totalDuration)
    
    return report
  }
  
  private printComprehensiveReport(report: ComprehensiveAnimationReport, duration: number) {
    console.log('\n🎯 COMPREHENSIVE ANIMATION VALIDATION REPORT')
    console.log('============================================')
    console.log(`Generated: ${report.timestamp}`)
    console.log(`Total Validation Time: ${Math.round(duration)}ms`)
    console.log(`Overall Status: ${report.overallStatus}`)
    
    // Stress Test Summary
    console.log('\n📊 STRESS TEST SUMMARY:')
    console.log(`Tests Run: ${report.stressTestResults.totalTests}`)
    console.log(`Passed: ${report.stressTestResults.passed}`)
    console.log(`Failed: ${report.stressTestResults.failed}`)
    console.log(`Average FPS: ${report.stressTestResults.averageFPS}`)
    console.log(`Peak Memory: ${Math.round(report.stressTestResults.peakMemoryUsage / 1024)}KB`)
    
    // Platform Compatibility Summary
    console.log('\n🌐 PLATFORM COMPATIBILITY:')
    if (report.platformCompatibility.browserResults.length > 0) {
      const browser = report.platformCompatibility.browserResults[0]
      console.log(`Browser: ${browser.browser} ${browser.version}`)
      console.log(`WebGL: ${browser.webglSupport ? '✅' : '❌'}`)
      console.log(`WebGL 2.0: ${browser.webgl2Support ? '✅' : '❌'}`)
      console.log(`Performance: ${browser.animationPerformance.toFixed(2)} FPS`)
    }
    console.log(`Compatibility Score: ${report.platformCompatibility.overallCompatibility}/100`)
    console.log(`Deployment Ready: ${report.platformCompatibility.deploymentReady ? '✅' : '❌'}`)
    
    // Critical Issues
    if (report.criticalIssues.length > 0) {
      console.log('\n⚠️ CRITICAL ISSUES:')
      report.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`)
      })
    }
    
    // Performance Assessment
    console.log('\n🎮 PERFORMANCE ASSESSMENT:')
    const fps = report.performanceMetrics.averageFPS
    if (fps >= 60) {
      console.log('🚀 EXCELLENT: 60+ FPS - Premium performance')
    } else if (fps >= 45) {
      console.log('✅ VERY GOOD: 45+ FPS - Smooth performance')
    } else if (fps >= 30) {
      console.log('✅ GOOD: 30+ FPS - Acceptable performance')
    } else if (fps >= 20) {
      console.log('⚠️ FAIR: 20+ FPS - May need optimization')
    } else {
      console.log('❌ POOR: <20 FPS - Requires immediate optimization')
    }
    
    // Memory Assessment
    const memoryMB = report.performanceMetrics.memoryUsage / (1024 * 1024)
    if (memoryMB < 25) {
      console.log('💾 MEMORY: Excellent usage (<25MB)')
    } else if (memoryMB < 50) {
      console.log('💾 MEMORY: Good usage (<50MB)')
    } else if (memoryMB < 100) {
      console.log('💾 MEMORY: Acceptable usage (<100MB)')
    } else {
      console.log('💾 MEMORY: High usage (>100MB) - consider optimization')
    }
    
    // Deployment Recommendation
    console.log('\n🚀 DEPLOYMENT RECOMMENDATION:')
    console.log(report.deploymentRecommendation)
    
    // Detailed Test Results
    console.log('\n📋 DETAILED TEST RESULTS:')
    report.stressTestResults.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${index + 1}. ${result.testName}: ${status} (${result.fps.toFixed(2)} FPS)`)
    })
    
    console.log('\n' + '='.repeat(60))
    console.log(`🎭 Animation Systems Validation Complete: ${report.overallStatus}`)
    console.log('='.repeat(60))
  }
}

/**
 * Quick validation for development
 */
export async function quickAnimationSystemCheck(): Promise<boolean> {
  console.log('⚡ Quick Animation System Check')
  console.log('==============================')
  
  try {
    const validator = new AnimationSystemsValidator()
    const report = await validator.runCompleteValidation()
    
    const isValid = report.overallStatus === 'PASS' || report.overallStatus === 'WARNING'
    
    console.log(`\n⚡ Quick Check Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    console.log(`Status: ${report.overallStatus}`)
    
    return isValid
    
  } catch (error) {
    console.error('❌ Quick validation failed:', error)
    return false
  }
}

// Export everything for external use
export type { StressTestReport } from './animationStressTest'
export type { CrossPlatformReport } from './animationValidation'
export { runAnimationStressTests } from './runAnimationStressTests'

export default AnimationSystemsValidator
