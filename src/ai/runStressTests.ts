/**
 * AI Stress Test Runner
 * 
 * Executes comprehensive stress tests and generates reports
 */

import { AIStressTestSuite } from './stressTest'
import { aiBehaviorSystem } from './AIBehaviorSystem'

async function runAIStressTests() {
  console.log('🚀 Starting AI Behavior System Production Stress Tests...')
  
  // Initialize AI system
  aiBehaviorSystem.start()
  
  // Run stress test suite
  const testSuite = new AIStressTestSuite()
  
  try {
    const results = await testSuite.runAllTests()
    
    // Generate and display report
    const report = testSuite.generateReport()
    console.log('\n' + report)
    
    // Save report to file for review
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      localStorage.setItem('ai-stress-test-report', report)
      localStorage.setItem('ai-stress-test-results', JSON.stringify(results))
      localStorage.setItem('ai-stress-test-timestamp', new Date().toISOString())
    }
    
    // Performance validation
    const averageResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0)
    const overallSuccessRate = results.reduce((sum, r) => sum + (r.successRate * r.totalRequests), 0) / totalRequests
    
    console.log('\n🎯 PERFORMANCE VALIDATION:')
    console.log(`✅ Total Requests Processed: ${totalRequests.toLocaleString()}`)
    console.log(`${averageResponseTime < 100 ? '✅' : '❌'} Average Response Time: ${averageResponseTime.toFixed(2)}ms (target: <100ms)`)
    console.log(`${overallSuccessRate > 95 ? '✅' : '❌'} Success Rate: ${overallSuccessRate.toFixed(2)}% (target: >95%)`)
    console.log(`${totalRequests > 1000 ? '✅' : '❌'} High Volume: ${totalRequests} requests (target: >1000)`)
    
    return {
      passed: averageResponseTime < 100 && overallSuccessRate > 95 && totalRequests > 1000,
      results,
      metrics: {
        averageResponseTime,
        totalRequests,
        successRate: overallSuccessRate
      }
    }
    
  } catch (error) {
    console.error('❌ Stress test failed:', error)
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: []
    }
  }
}

export { runAIStressTests }
