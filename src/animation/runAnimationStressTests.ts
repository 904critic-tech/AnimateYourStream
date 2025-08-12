/**
 * Animation Stress Test Runner Script
 * 
 * Executes comprehensive animation system stress tests
 * and generates detailed performance reports.
 */

import AnimationStressTestRunner, { StressTestReport } from './animationStressTest.ts'

/**
 * Execute animation stress tests and log results
 */
export async function runAnimationStressTests(): Promise<StressTestReport> {
  console.log('🎭 Animation System Stress Testing Suite')
  console.log('=====================================')
  
  const runner = new AnimationStressTestRunner()
  
  try {
    const report = await runner.runAllTests()
    
    // Log detailed results
    console.log('\n📊 DETAILED TEST RESULTS:')
    console.log('=========================')
    
    report.results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      console.log(`\n${index + 1}. ${result.testName}`)
      console.log(`   Status: ${status}`)
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
      console.log(`   FPS: ${result.fps.toFixed(2)}`)
      console.log(`   Memory: ${Math.round(result.memoryUsage / 1024)}KB`)
      
      if (result.errorMessage) {
        console.log(`   Error: ${result.errorMessage}`)
      }
      
      // Log key metrics
      if (Object.keys(result.metrics).length > 0) {
        console.log('   Metrics:')
        Object.entries(result.metrics).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`)
        })
      }
    })
    
    // Summary
    console.log('\n🎯 SUMMARY:')
    console.log('===========')
    console.log(`Total Tests: ${report.totalTests}`)
    console.log(`Passed: ${report.passed}`)
    console.log(`Failed: ${report.failed}`)
    console.log(`Success Rate: ${Math.round((report.passed / report.totalTests) * 100)}%`)
    console.log(`Average FPS: ${report.averageFPS}`)
    console.log(`Peak Memory Usage: ${Math.round(report.peakMemoryUsage / 1024)}KB`)
    console.log(`Total Duration: ${report.totalDuration}ms`)
    
    // Performance assessment
    console.log('\n🎮 PERFORMANCE ASSESSMENT:')
    console.log('===========================')
    
    if (report.averageFPS >= 60) {
      console.log('🚀 EXCELLENT: 60+ FPS average - Production ready!')
    } else if (report.averageFPS >= 30) {
      console.log('✅ GOOD: 30+ FPS average - Acceptable performance')
    } else {
      console.log('⚠️ NEEDS OPTIMIZATION: <30 FPS average - Performance improvements needed')
    }
    
    if (report.peakMemoryUsage < 50 * 1024 * 1024) { // 50MB
      console.log('💾 MEMORY: Excellent memory usage')
    } else if (report.peakMemoryUsage < 100 * 1024 * 1024) { // 100MB
      console.log('💾 MEMORY: Good memory usage')
    } else {
      console.log('💾 MEMORY: High memory usage - consider optimization')
    }
    
    // Deployment readiness
    const deploymentReady = report.passed === report.totalTests && 
                           report.averageFPS >= 30 &&
                           report.peakMemoryUsage < 100 * 1024 * 1024
    
    console.log('\n🚀 DEPLOYMENT READINESS:')
    console.log('========================')
    
    if (deploymentReady) {
      console.log('✅ READY FOR DEPLOYMENT')
      console.log('   All tests passed with acceptable performance')
    } else {
      console.log('⚠️ NOT READY FOR DEPLOYMENT')
      console.log('   Issues found that need attention:')
      
      if (report.failed > 0) {
        console.log(`   - ${report.failed} test(s) failed`)
      }
      if (report.averageFPS < 30) {
        console.log('   - Performance below 30 FPS threshold')
      }
      if (report.peakMemoryUsage >= 100 * 1024 * 1024) {
        console.log('   - Memory usage above 100MB threshold')
      }
    }
    
    return report
    
  } catch (error) {
    console.error('❌ Animation stress testing failed:', error)
    throw error
  }
}

/**
 * Quick validation test for development
 */
export async function quickAnimationValidation(): Promise<boolean> {
  console.log('⚡ Quick Animation Validation')
  console.log('============================')
  
  try {
    // Run a subset of critical tests
    const timelineTest = new (await import('./animationStressTest')).TimelineStressTest()
    const result = await timelineTest.testMassiveKeyframeLoad()
    
    const isValid = result.success && result.fps >= 30
    
    console.log(`Timeline Test: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`FPS: ${result.fps.toFixed(2)}`)
    console.log(`Validation: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    
    return isValid
    
  } catch (error) {
    console.error('❌ Quick validation failed:', error)
    return false
  }
}

// Export for use in other modules
export type { StressTestReport } from './animationStressTest'

// CLI execution
if (typeof window === 'undefined' && require.main === module) {
  runAnimationStressTests()
    .then(report => {
      process.exit(report.failed === 0 ? 0 : 1)
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export default runAnimationStressTests
