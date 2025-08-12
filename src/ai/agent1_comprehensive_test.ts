/**
 * 🧪 Agent 1 - AI Behavior System Comprehensive Test
 * 
 * Comprehensive validation of AI behavior engine, animation triggers, 
 * context analysis, behavioral patterns, and Core Engine integration.
 */

import { AIBehaviorSystem, ContextAnalyzer, AnimationDecisionEngine } from './index'
import { ContextType, BlendMode } from './types'

interface TestResult {
  testName: string
  success: boolean
  details: string
  executionTime: number
  errors?: string[]
}

interface ComprehensiveTestReport {
  totalTests: number
  passedTests: number
  failedTests: number
  testResults: TestResult[]
  overallSuccess: boolean
  systemHealth: number
  recommendations: string[]
  criticalIssues: string[]
}

/**
 * Comprehensive AI Behavior System Tester
 */
export class Agent1ComprehensiveTester {
  private aiSystem: AIBehaviorSystem
  private contextAnalyzer: ContextAnalyzer
  private decisionEngine: AnimationDecisionEngine
  private testResults: TestResult[] = []
  private startTime: number = 0

  constructor() {
    this.aiSystem = new AIBehaviorSystem()
    this.contextAnalyzer = new ContextAnalyzer({
      enableEnvironmentalAwareness: true,
      enableUserInteractionTracking: true,
      enableAudioAnalysis: true
    })
    this.decisionEngine = new AnimationDecisionEngine()
  }

  /**
   * Run comprehensive AI behavior system tests
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestReport> {
    console.log('🧠 Agent 1 - Starting Comprehensive AI Behavior System Tests...')
    this.startTime = performance.now()

    try {
      // Core System Tests
      await this.testSystemInitialization()
      await this.testContextAnalysis()
      await this.testAnimationDecisions()
      await this.testBehaviorProfiles()
      await this.testIntegrationFeatures()
      await this.testPerformanceOptimization()
      await this.testErrorHandling()
      await this.testRealWorldScenarios()
      await this.testAnimationTriggers()
      await this.testEmotionalAnalysis()

      // Generate final report
      const report = this.generateComprehensiveReport()
      this.printComprehensiveReport(report)
      
      return report
    } catch (error) {
      console.error('❌ Agent 1 - Comprehensive AI tests failed:', error)
      throw error
    }
  }

  /**
   * Test 1: System Initialization
   */
  private async testSystemInitialization(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test basic initialization
      const aiSystem = new AIBehaviorSystem()
      // Note: contextAnalyzer and decisionEngine are already initialized in constructor

      // Test system start
      aiSystem.start()
      const isActive = aiSystem.isSystemActive()
      
      if (!isActive) {
        errors.push('AI system failed to start properly')
      }

      // Test default state
      const state = aiSystem.getBehaviorState()
      if (!state) {
        errors.push('Behavior state not accessible')
      }

      // Test available profiles
      const profiles = aiSystem.getAvailableProfiles()
      if (profiles.length === 0) {
        errors.push('No behavior profiles available')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'System Initialization',
        success,
        details: `AI system initialized with ${profiles.length} profiles, active: ${isActive}`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'System Initialization',
        success: false,
        details: 'System initialization test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 2: Context Analysis
   */
  private async testContextAnalysis(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test context addition
      this.contextAnalyzer.addContext({
        timestamp: Date.now(),
        type: ContextType.INTERACTION,
        intensity: 0.8,
        metadata: { target: 'test_button' }
      })

      // Test context analysis
      const analysis = this.contextAnalyzer.analyzeCurrentContext()
      if (!analysis.primaryContext) {
        errors.push('Context analysis failed to return primary context')
      }

      // Test audio context
      const audioContext = this.contextAnalyzer.analyzeAudioContext(0.6, 200)
      if (!audioContext) {
        errors.push('Audio context analysis failed')
      }

      // Test interaction context
      const interactionContext = this.contextAnalyzer.analyzeInteractionContext('click', 0.8)
      if (!interactionContext) {
        errors.push('Interaction context analysis failed')
      }

      // Test emotional analysis
      const emotionalTone = this.contextAnalyzer.analyzeEmotionalTone()
      if (emotionalTone === undefined) {
        errors.push('Emotional tone analysis failed')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Context Analysis',
        success,
        details: `Context analysis working: ${analysis.primaryContext}, emotional tone: ${emotionalTone}`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Context Analysis',
        success: false,
        details: 'Context analysis test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 3: Animation Decisions
   */
  private async testAnimationDecisions(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test behavior profile setting - use proper BehaviorProfile object
      const testProfile = { id: 'energetic_friendly', name: 'Energetic Friendly' } as any
      this.decisionEngine.setBehaviorProfile(testProfile)
      const profile = this.decisionEngine.getCurrentProfile()
      if (!profile) {
        errors.push('Failed to set behavior profile')
      }

      // Test animation decision with available animations
      const availableAnimations = ['idle', 'wave', 'nod', 'dance_short']
      const decision = this.decisionEngine.getAnimationDecision(availableAnimations, {
        primaryContext: ContextType.INTERACTION,
        intensity: 0.7,
        confidence: 0.8
      })

      if (!decision) {
        errors.push('Animation decision engine failed to return decision')
      }

      // Test decision prioritization
      const highPriorityDecision = this.decisionEngine.getAnimationDecision(availableAnimations, {
        primaryContext: ContextType.CONVERSATION,
        intensity: 0.9,
        confidence: 0.95
      })

      if (highPriorityDecision && highPriorityDecision.priority <= (decision?.priority || 0)) {
        errors.push('Decision prioritization not working correctly')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Animation Decisions',
        success,
        details: `Animation decisions working: ${decision?.animation}, priority: ${decision?.priority}`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Animation Decisions',
        success: false,
        details: 'Animation decisions test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 4: Behavior Profiles
   */
  private async testBehaviorProfiles(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test profile switching
      const profiles = ['energetic_friendly', 'calm_professional', 'playful_mischievous']
      
      for (const profileId of profiles) {
        const success = this.aiSystem.setBehaviorProfile(profileId)
        if (!success) {
          errors.push(`Failed to set profile: ${profileId}`)
        }
      }

      // Test profile-specific behavior
      this.aiSystem.setBehaviorProfile('energetic_friendly')
      const state = this.aiSystem.getBehaviorState()
      if (!state.currentProfile) {
        errors.push('Current profile not accessible')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Behavior Profiles',
        success,
        details: `Profile switching working: ${profiles.length} profiles tested`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Behavior Profiles',
        success: false,
        details: 'Behavior profiles test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 5: Integration Features
   */
  private async testIntegrationFeatures(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test smart animation trigger creation
      const trigger = this.aiSystem.createSmartAnimationTrigger()
      if (!trigger) {
        errors.push('Smart animation trigger creation failed')
      }

      // Test interaction addition
      this.aiSystem.addInteractionContext('click', 'test_button', 500)
      const behaviorState = this.aiSystem.getBehaviorState()
      if (!behaviorState) {
        errors.push('Behavior state not accessible after interaction')
      }

      // Test audio context addition
      this.aiSystem.addAudioContext(0.6, [100, 200, 300])
      const conversationState = this.aiSystem.getConversationState()
      if (!conversationState) {
        errors.push('Conversation state not accessible after audio input')
      }

      // Test learning stats
      const learningStats = this.aiSystem.getLearningStats()
      if (!learningStats) {
        errors.push('Learning stats not accessible')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Integration Features',
        success,
        details: `Integration features working: trigger created, stats accessible`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Integration Features',
        success: false,
        details: 'Integration features test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 6: Performance Optimization
   */
  private async testPerformanceOptimization(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test rapid context additions
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        this.contextAnalyzer.addContext({
          type: ContextType.INTERACTION,
          intensity: Math.random(),
          metadata: { iteration: i }
        })
      }
      const contextTime = performance.now() - startTime

      if (contextTime > 100) { // Should be under 100ms for 100 contexts
        errors.push(`Context addition too slow: ${contextTime.toFixed(2)}ms`)
      }

      // Test rapid animation decisions
      const decisionStart = performance.now()
      const availableAnimations = ['idle', 'wave', 'nod', 'dance_short']
      for (let i = 0; i < 50; i++) {
        this.decisionEngine.getAnimationDecision(availableAnimations, {
          primaryContext: ContextType.INTERACTION,
          intensity: Math.random(),
          confidence: Math.random()
        })
      }
      const decisionTime = performance.now() - decisionStart

      if (decisionTime > 50) { // Should be under 50ms for 50 decisions
        errors.push(`Animation decisions too slow: ${decisionTime.toFixed(2)}ms`)
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Performance Optimization',
        success,
        details: `Performance good: contexts ${contextTime.toFixed(2)}ms, decisions ${decisionTime.toFixed(2)}ms`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Performance Optimization',
        success: false,
        details: 'Performance optimization test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 7: Error Handling
   */
  private async testErrorHandling(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test invalid profile setting
      const invalidProfileResult = this.aiSystem.setBehaviorProfile('invalid_profile')
      if (invalidProfileResult) {
        errors.push('Invalid profile should return false')
      }

      // Test invalid animation trigger
      const triggerResult = this.aiSystem.triggerAnimation('invalid_animation')
      if (triggerResult) {
        errors.push('Invalid animation should return false')
      }

      // Test null context analysis
      try {
        this.contextAnalyzer.addContext({
          type: ContextType.IDLE,
          intensity: -1, // Invalid intensity
          metadata: {}
        })
        // Should not throw error, should handle gracefully
      } catch (error) {
        errors.push('Context analyzer should handle invalid intensity gracefully')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Error Handling',
        success,
        details: `Error handling working: invalid inputs handled gracefully`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Error Handling',
        success: false,
        details: 'Error handling test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 8: Real World Scenarios
   */
  private async testRealWorldScenarios(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Simulate user interaction scenario
      this.aiSystem.addInteractionContext('click', 'character_button', 300)
      this.aiSystem.addAudioContext(0.7, [150, 250, 350])
      
      const decision = this.aiSystem.getCurrentAnimationDecision(['idle', 'wave', 'nod', 'dance_short'])
      if (!decision) {
        errors.push('No animation decision for real-world scenario')
      }

      // Simulate conversation scenario
      this.contextAnalyzer.addContext({
        type: ContextType.CONVERSATION,
        intensity: 0.8,
        metadata: { speakerCount: 2 }
      })

      const conversationState = this.contextAnalyzer.getConversationState()
      if (!conversationState.isActive) {
        errors.push('Conversation state not properly detected')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Real World Scenarios',
        success,
        details: `Real-world scenarios working: interaction + audio + speech detected`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Real World Scenarios',
        success: false,
        details: 'Real world scenarios test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 9: Animation Triggers
   */
  private async testAnimationTriggers(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test manual animation trigger
      const triggerResult = this.aiSystem.triggerAnimation('wave', BlendMode.ADDITIVE, 0.8, 2000)
      if (!triggerResult) {
        errors.push('Manual animation trigger failed')
      }

      // Test emotional recommendation
      const emotionalRec = this.aiSystem.getEmotionalRecommendation()
      if (!emotionalRec) {
        errors.push('Emotional recommendation not available')
      }

      // Test animation scheduling
      const decision = this.decisionEngine.getAnimationDecision(['idle', 'wave', 'nod'], {
        primaryContext: ContextType.INTERACTION,
        intensity: 0.6,
        confidence: 0.7
      })

      if (decision) {
        this.aiSystem.scheduleAnimation(decision, 1000)
        // Should not throw error
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Animation Triggers',
        success,
        details: `Animation triggers working: manual trigger, emotional rec, scheduling`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Animation Triggers',
        success: false,
        details: 'Animation triggers test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 10: Emotional Analysis
   */
  private async testEmotionalAnalysis(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test emotional tone analysis
      const emotionalTone = this.contextAnalyzer.analyzeEmotionalTone()
      if (emotionalTone === undefined) {
        errors.push('Emotional tone analysis failed')
      }

      // Test predictive analysis
      const predictive = this.contextAnalyzer.getPredictiveAnalysis()
      if (!predictive) {
        errors.push('Predictive analysis failed')
      }

      // Test environmental context
      const environmental = this.contextAnalyzer.getEnvironmentalContext()
      if (!environmental) {
        errors.push('Environmental context analysis failed')
      }

      // Test interaction patterns
      const patterns = this.contextAnalyzer.getInteractionPatterns()
      if (!patterns) {
        errors.push('Interaction patterns analysis failed')
      }

      const success = errors.length === 0
      this.testResults.push({
        testName: 'Emotional Analysis',
        success,
        details: `Emotional analysis working: tone, predictive, environmental, patterns`,
        executionTime: performance.now() - testStart,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Emotional Analysis',
        success: false,
        details: 'Emotional analysis test failed',
        executionTime: performance.now() - testStart,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateComprehensiveReport(): ComprehensiveTestReport {
    const passedTests = this.testResults.filter(r => r.success).length
    const failedTests = this.testResults.filter(r => !r.success).length
    const totalTests = this.testResults.length
    const overallSuccess = failedTests === 0
    const systemHealth = (passedTests / totalTests) * 100

    const criticalIssues = this.testResults
      .filter(r => !r.success)
      .map(r => `${r.testName}: ${r.errors?.join(', ')}`)

    const recommendations = this.generateRecommendations()

    return {
      totalTests,
      passedTests,
      failedTests,
      testResults: this.testResults,
      overallSuccess,
      systemHealth,
      recommendations,
      criticalIssues
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const failedTests = this.testResults.filter(r => !r.success)
    
    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} failed tests to improve system reliability`)
    }

    const slowTests = this.testResults.filter(r => r.executionTime > 100)
    if (slowTests.length > 0) {
      recommendations.push(`Optimize ${slowTests.length} slow tests for better performance`)
    }

    if (this.testResults.every(r => r.success)) {
      recommendations.push('All AI behavior systems are functioning correctly')
      recommendations.push('Consider adding more advanced behavioral patterns')
      recommendations.push('Monitor real-world usage for further optimization')
    }

    return recommendations
  }

  /**
   * Print comprehensive test report
   */
  private printComprehensiveReport(report: ComprehensiveTestReport): void {
    console.log('\n🧠 Agent 1 - AI Behavior System Comprehensive Test Report')
    console.log('=' .repeat(70))
    console.log(`📊 Overall Status: ${report.overallSuccess ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`🏥 System Health: ${report.systemHealth.toFixed(1)}%`)
    console.log(`📈 Test Results: ${report.passedTests}/${report.totalTests} passed`)
    console.log(`⏱️  Total Time: ${(performance.now() - this.startTime).toFixed(2)}ms`)
    
    if (report.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:')
      report.criticalIssues.forEach(issue => console.log(`   • ${issue}`))
    }

    console.log('\n📋 Test Details:')
    report.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const time = result.executionTime.toFixed(2)
      console.log(`   ${status} ${result.testName} (${time}ms): ${result.details}`)
      if (result.errors) {
        result.errors.forEach(error => console.log(`      Error: ${error}`))
      }
    })

    console.log('\n💡 Recommendations:')
    report.recommendations.forEach(rec => console.log(`   • ${rec}`))

    console.log('\n🎯 Agent 1 Status:')
    if (report.overallSuccess) {
      console.log('   ✅ AI Behavior System is fully operational')
      console.log('   ✅ All core components are functioning correctly')
      console.log('   ✅ Ready for production use')
    } else {
      console.log('   ⚠️  AI Behavior System has issues that need attention')
      console.log('   🔧 Focus on fixing critical issues first')
    }

    console.log('=' .repeat(70))
  }
}

/**
 * Quick test function for immediate validation
 */
export function quickAgent1Test(): boolean {
  console.log('🔍 Agent 1 - Running Quick AI Behavior Test...')
  
  try {
    const aiSystem = new AIBehaviorSystem()
    
    // Basic functionality test
    aiSystem.start()
    const isActive = aiSystem.isSystemActive()
    const profiles = aiSystem.getAvailableProfiles()
    
    console.log(`✅ Agent 1 Quick Test: System active: ${isActive}, Profiles: ${profiles.length}`)
    return isActive && profiles.length > 0
    
  } catch (error) {
    console.error('❌ Agent 1 Quick Test Failed:', error)
    return false
  }
}

/**
 * Run comprehensive tests and return results
 */
export async function runAgent1ComprehensiveTests(): Promise<ComprehensiveTestReport> {
  const tester = new Agent1ComprehensiveTester()
  return await tester.runComprehensiveTests()
}
