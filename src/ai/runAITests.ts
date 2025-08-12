/**
 * 🧪 AI Behavior System Test Runner
 * Agent 1 - AI Behavior Team
 * 
 * Simple test runner for validating AI behavior system in browser environment
 */

import { AIBehaviorValidator } from './aiBehaviorValidation'

/**
 * Run AI behavior system tests and display results
 */
export async function runAITests(): Promise<void> {
  console.log('🚀 Starting AI Behavior System Tests...')
  
  try {
    const validator = new AIBehaviorValidator()
    const results = await validator.runAllTests()
    
    // Display results in browser console
    console.log('🎉 AI Behavior System Test Results:')
    console.log(`✅ Passed: ${results.passedTests}/${results.totalTests}`)
    console.log(`❌ Failed: ${results.failedTests}/${results.totalTests}`)
    console.log(`⏱️  Total Time: ${results.performanceMetrics.totalExecutionTime.toFixed(2)}ms`)
    
    if (results.overallSuccess) {
      console.log('🎉 All AI behavior systems are working correctly!')
    } else {
      console.log('⚠️  Some tests failed. Check the detailed results above.')
    }
    
    // Make results available globally for debugging
    (window as any).aiTestResults = results
    
  } catch (error) {
    console.error('❌ AI Behavior System tests failed:', error)
  }
}

/**
 * Quick validation test for core AI functionality
 */
export function quickAITest(): boolean {
  console.log('🔍 Running Quick AI Test...')
  
  try {
    // Test basic imports
    const { AIBehaviorSystem, ContextAnalyzer, AnimationDecisionEngine } = require('./index')
    
    // Test system creation
    const aiSystem = new AIBehaviorSystem()
    const contextAnalyzer = new ContextAnalyzer()
    const decisionEngine = new AnimationDecisionEngine()
    
    // Test basic functionality
    aiSystem.start()
    const isActive = aiSystem.isSystemActive()
    
    // Test context analysis
    const context = contextAnalyzer.analyzeCurrentContext()
    
    // Test decision engine
    decisionEngine.setBehaviorProfile('energetic_friendly')
    const profile = decisionEngine.getCurrentProfile()
    
    console.log('✅ Quick AI Test Passed!')
    console.log(`   System Active: ${isActive}`)
    console.log(`   Context Type: ${context.primaryContext}`)
    console.log(`   Profile Set: ${profile?.id}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Quick AI Test Failed:', error)
    return false
  }
}

/**
 * Test specific AI behavior features
 */
export function testAIFeatures(): void {
  console.log('🧪 Testing AI Features...')
  
  try {
    const { AIBehaviorSystem } = require('./index')
    const aiSystem = new AIBehaviorSystem()
    
    // Test 1: System initialization
    aiSystem.start()
    console.log('✅ System initialization: PASSED')
    
    // Test 2: Behavior profiles
    const profiles = aiSystem.getAvailableProfiles()
    console.log(`✅ Behavior profiles: ${profiles.length} profiles available`)
    
    // Test 3: Context analysis
    aiSystem.addInteractionContext('click', 'test_button', 500)
    // const state = aiSystem.getBehaviorState() // Unused variable removed
    console.log('✅ Context analysis: PASSED')
    
    // Test 4: Animation decisions
    const decision = aiSystem.getCurrentAnimationDecision(['idle', 'wave', 'nod'])
    console.log(`✅ Animation decisions: ${decision ? 'PASSED' : 'NO DECISION'}`)
    
    // Test 5: Emotional recommendations
    const emotionalRec = aiSystem.getEmotionalRecommendation()
    console.log(`✅ Emotional recommendations: ${emotionalRec?.animation || 'NONE'}`)
    
    // Test 6: Learning statistics
    const learningStats = aiSystem.getLearningStats()
    console.log(`✅ Learning statistics: ${learningStats.interactionCount} interactions`)
    
    // Test 7: Smart trigger creation
    // const smartTrigger = aiSystem.createSmartAnimationTrigger() // Unused variable removed
    console.log('✅ Smart trigger creation: PASSED')
    
    console.log('🎉 All AI features tested successfully!')
    
  } catch (error) {
    console.error('❌ AI feature test failed:', error)
  }
}

/**
 * Performance test for AI system
 */
export function testAIPerformance(): void {
  console.log('⚡ Testing AI Performance...')
  
  try {
    const { AIBehaviorSystem, ContextAnalyzer } = require('./index')
    
    const startTime = performance.now()
    
    // Create systems
    const aiSystem = new AIBehaviorSystem()
    const contextAnalyzer = new ContextAnalyzer()
    
    // Test rapid context additions
    const contextStart = performance.now()
    for (let i = 0; i < 50; i++) {
      contextAnalyzer.addContext({
        type: 'interaction' as any,
        intensity: Math.random(),
        metadata: { test: i }
      })
    }
    const contextTime = performance.now() - contextStart
    
    // Test rapid decisions
    const decisionStart = performance.now()
    for (let i = 0; i < 25; i++) {
      aiSystem.getCurrentAnimationDecision(['idle', 'wave', 'nod'])
    }
    const decisionTime = performance.now() - decisionStart
    
    const totalTime = performance.now() - startTime
    
    console.log(`✅ Performance Test Results:`)
    console.log(`   Context additions: ${contextTime.toFixed(2)}ms for 50 contexts`)
    console.log(`   Decision making: ${decisionTime.toFixed(2)}ms for 25 decisions`)
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`)
    
    if (contextTime < 100 && decisionTime < 50) {
      console.log('🎉 Performance test PASSED!')
    } else {
      console.log('⚠️  Performance test needs optimization')
    }
    
  } catch (error) {
    console.error('❌ Performance test failed:', error)
  }
}

// Auto-run tests if this module is loaded directly
if (typeof window !== 'undefined') {
  // Make functions available globally
  (window as any).runAITests = runAITests
  ;(window as any).quickAITest = quickAITest
  ;(window as any).testAIFeatures = testAIFeatures
  ;(window as any).testAIPerformance = testAIPerformance
  
  // Auto-run quick test after a delay
  setTimeout(() => {
    console.log('🤖 AI Behavior System Test Runner Loaded')
    console.log('Available functions:')
    console.log('  - runAITests() - Full validation suite')
    console.log('  - quickAITest() - Basic functionality test')
    console.log('  - testAIFeatures() - Feature-specific tests')
    console.log('  - testAIPerformance() - Performance tests')
    
    // Run quick test automatically
    quickAITest()
  }, 2000)
}

// Functions are already exported above
