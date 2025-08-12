/**
 * 🧪 AI Behavior System Validation Tests
 * Agent 1 - AI Behavior Team
 * 
 * Comprehensive validation of AI behavior engine, animation triggers, 
 * context analysis, behavioral patterns, and Core Engine integration.
 */

import {
  AIBehaviorSystem,
  ContextAnalyzer,
  AnimationDecisionEngine,
  ENERGETIC_FRIENDLY,
  CALM_PROFESSIONAL,
  PLAYFUL_MISCHIEVOUS
} from './index'
import { ContextType, EmotionalTone, BlendMode } from './types'

// Test Results Interface
interface TestResult {
  testName: string
  success: boolean
  details: string
  performance?: {
    executionTime: number
    memoryUsage?: number
  }
  errors?: string[]
}

interface ValidationReport {
  totalTests: number
  passedTests: number
  failedTests: number
  testResults: TestResult[]
  overallSuccess: boolean
  recommendations: string[]
  performanceMetrics: {
    averageExecutionTime: number
    totalExecutionTime: number
  }
}

/**
 * AI Behavior System Validator
 * Comprehensive testing suite for all AI behavior components
 */
export class AIBehaviorValidator {
  private aiSystem: AIBehaviorSystem
  private contextAnalyzer: ContextAnalyzer
  private decisionEngine: AnimationDecisionEngine
  private testResults: TestResult[] = []
  private startTime: number = 0

  constructor() {
    this.aiSystem = new AIBehaviorSystem()
    this.contextAnalyzer = new ContextAnalyzer()
    this.decisionEngine = new AnimationDecisionEngine()
  }

  /**
   * Run all AI behavior validation tests
   */
  async runAllTests(): Promise<ValidationReport> {
    console.log('🧪 Starting AI Behavior System Validation...')
    this.startTime = performance.now()

    try {
      // Initialize AI system
      await this.initializeAISystem()

      // Core System Tests
      await this.testSystemInitialization()
      await this.testBehaviorProfiles()
      await this.testContextAnalysis()
      await this.testAnimationDecisions()
      await this.testIntegrationFeatures()
      await this.testPerformanceOptimization()
      await this.testErrorHandling()
      await this.testRealWorldScenarios()

      // Generate final report
      const report = this.generateValidationReport()
      this.printReport(report)
      
      return report
    } catch (error) {
      console.error('❌ AI Behavior validation failed:', error)
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
      // Test AI system startup
      this.aiSystem.start()
      if (!this.aiSystem.isSystemActive()) {
        errors.push('AI system failed to start properly')
      }

      // Test context analyzer initialization
      const contextResult = this.contextAnalyzer.analyzeCurrentContext()
      if (!contextResult || contextResult.primaryContext !== ContextType.IDLE) {
        errors.push('Context analyzer not properly initialized')
      }

      // Test decision engine initialization
      this.decisionEngine.setBehaviorProfile(ENERGETIC_FRIENDLY)
      const profile = this.decisionEngine.getCurrentProfile()
      if (!profile || profile.id !== 'energetic_friendly') {
        errors.push('Decision engine failed to set behavior profile')
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'System Initialization',
        success: errors.length === 0,
        details: 'Validated AI system startup, context analyzer, and decision engine initialization',
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'System Initialization',
        success: false,
        details: 'System initialization test failed',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 2: Behavior Profiles
   */
  private async testBehaviorProfiles(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test all behavior profiles
      const profiles = [ENERGETIC_FRIENDLY, CALM_PROFESSIONAL, PLAYFUL_MISCHIEVOUS]
      
      for (const profile of profiles) {
        // Test profile switching
        const success = this.aiSystem.setBehaviorProfile(profile.id)
        if (!success) {
          errors.push(`Failed to set behavior profile: ${profile.id}`)
        }

        // Test profile validation
        if (!profile.personality || !profile.animationPreferences || !profile.responsePatterns) {
          errors.push(`Invalid profile structure: ${profile.id}`)
        }

        // Test personality traits
        const traits = profile.personality
        if (traits.energy < 0 || traits.energy > 1) {
          errors.push(`Invalid energy value in profile: ${profile.id}`)
        }
        if (traits.friendliness < 0 || traits.friendliness > 1) {
          errors.push(`Invalid friendliness value in profile: ${profile.id}`)
        }
      }

      // Test profile retrieval
      const availableProfiles = this.aiSystem.getAvailableProfiles()
      if (availableProfiles.length < 3) {
        errors.push('Not all behavior profiles are available')
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Behavior Profiles',
        success: errors.length === 0,
        details: `Validated ${profiles.length} behavior profiles and profile switching`,
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Behavior Profiles',
        success: false,
        details: 'Behavior profiles test failed',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 3: Context Analysis
   */
  private async testContextAnalysis(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      // Test interaction context
      this.contextAnalyzer.analyzeInteractionContext('click', 'button', 500)
      const interactionContext = this.contextAnalyzer.analyzeCurrentContext()
      if (interactionContext.primaryContext !== ContextType.INTERACTION) {
        errors.push('Interaction context not properly detected')
      }

      // Test audio context
      this.contextAnalyzer.addContext({
        type: ContextType.AUDIO_INPUT,
        intensity: 0.8,
        metadata: { frequencies: [100, 200, 300] }
      })
      const audioContext = this.contextAnalyzer.analyzeAudioContext(0.8, [100, 200, 300])
      if (audioContext.type !== ContextType.AUDIO_INPUT) {
        errors.push('Audio context not properly analyzed')
      }

      // Test conversation state
      const conversationState = this.contextAnalyzer.getConversationState()
      if (!conversationState || typeof conversationState.isActive !== 'boolean') {
        errors.push('Conversation state not properly maintained')
      }

      // Test emotional tone analysis
      const emotionalTone = this.contextAnalyzer.analyzeEmotionalTone()
      if (!Object.values(EmotionalTone).includes(emotionalTone)) {
        errors.push('Invalid emotional tone detected')
      }

      // Test predictive analysis
      const prediction = this.contextAnalyzer.getPredictiveAnalysis()
      if (!prediction || typeof prediction.confidence !== 'number') {
        errors.push('Predictive analysis not working properly')
      }

      // Test environmental context
      const environmentalContext = this.contextAnalyzer.getEnvironmentalContext()
      if (!environmentalContext || typeof environmentalContext.noiseLevel !== 'number') {
        errors.push('Environmental context analysis failed')
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Context Analysis',
        success: errors.length === 0,
        details: 'Validated interaction, audio, conversation, emotional, and environmental context analysis',
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Context Analysis',
        success: false,
        details: 'Context analysis test failed',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test 4: Animation Decisions
   */
  private async testAnimationDecisions(): Promise<void> {
    const testStart = performance.now()
    const errors: string[] = []

    try {
      const availableAnimations = ['idle', 'wave', 'nod', 'clap', 'dance']

      // Test idle decision
      const idleDecision = this.decisionEngine.makeDecision(
        ContextType.IDLE,
        0.1,
        1.0,
        [],
        availableAnimations
      )
      if (!idleDecision || !idleDecision.animation) {
        errors.push('Failed to generate idle animation decision')
      }

      // Test interaction decision
      const interactionDecision = this.decisionEngine.makeDecision(
        ContextType.INTERACTION,
        0.8,
        0.9,
        [{ type: ContextType.INTERACTION, intensity: 0.8, timestamp: Date.now() }],
        availableAnimations
      )
      if (!interactionDecision || interactionDecision.priority < 5) {
        errors.push('Interaction decision not properly prioritized')
      }

      // Test audio decision
      const audioDecision = this.decisionEngine.makeDecision(
        ContextType.AUDIO_INPUT,
        0.6,
        0.8,
        [{ type: ContextType.AUDIO_INPUT, intensity: 0.6, timestamp: Date.now() }],
        availableAnimations
      )
      if (!audioDecision) {
        errors.push('Failed to generate audio-triggered animation decision')
      }

      // Test decision history
      const history = this.decisionEngine.getDecisionHistory()
      if (!Array.isArray(history)) {
        errors.push('Decision history not properly maintained')
      }

      // Test cooldown system
      if (interactionDecision) {
        const isOnCooldown = this.decisionEngine.isOnCooldown(interactionDecision.animation)
        if (typeof isOnCooldown !== 'boolean') {
          errors.push('Cooldown system not working properly')
        }
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Animation Decisions',
        success: errors.length === 0,
        details: 'Validated idle, interaction, and audio-triggered animation decisions',
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Animation Decisions',
        success: false,
        details: 'Animation decisions test failed',
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
      // Test smart animation trigger
      const smartTrigger = this.aiSystem.createSmartAnimationTrigger()
      if (!smartTrigger || typeof smartTrigger.addInteraction !== 'function') {
        errors.push('Smart animation trigger not properly created')
      }

      // Test emotional recommendation
      const emotionalRec = this.aiSystem.getEmotionalRecommendation()
      if (!emotionalRec || !emotionalRec.animation || !emotionalRec.reason) {
        errors.push('Emotional recommendation system not working')
      }

      // Test behavior state
      const behaviorState = this.aiSystem.getBehaviorState()
      if (!behaviorState || !behaviorState.currentProfile) {
        errors.push('Behavior state not properly maintained')
      }

      // Test learning statistics
      const learningStats = this.aiSystem.getLearningStats()
      if (!learningStats || typeof learningStats.interactionCount !== 'number') {
        errors.push('Learning statistics not properly tracked')
      }

      // Test animation scheduling
      const testDecision = {
        animation: 'test_animation',
        priority: 5,
        reason: 'Test scheduling',
        blendMode: BlendMode.REPLACE
      }
      this.aiSystem.scheduleAnimation(testDecision, 100)
      // Note: We can't easily test the actual execution without animation system

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Integration Features',
        success: errors.length === 0,
        details: 'Validated smart triggers, emotional recommendations, behavior state, and learning stats',
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Integration Features',
        success: false,
        details: 'Integration features test failed',
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
          metadata: { test: i }
        })
      }
      const contextTime = performance.now() - startTime
      
      if (contextTime > 100) { // Should handle 100 contexts in under 100ms
        errors.push(`Context addition too slow: ${contextTime.toFixed(2)}ms for 100 contexts`)
      }

      // Test rapid decision making
      const decisionStart = performance.now()
      for (let i = 0; i < 50; i++) {
        this.decisionEngine.makeDecision(
          ContextType.INTERACTION,
          Math.random(),
          0.8,
          [],
          ['idle', 'wave', 'nod']
        )
      }
      const decisionTime = performance.now() - decisionStart
      
      if (decisionTime > 50) { // Should handle 50 decisions in under 50ms
        errors.push(`Decision making too slow: ${decisionTime.toFixed(2)}ms for 50 decisions`)
      }

      // Test memory usage (approximate)
      const memoryUsage = this.estimateMemoryUsage()
      if (memoryUsage > 10) { // Should use less than 10MB for basic operations
        errors.push(`Memory usage too high: ${memoryUsage.toFixed(2)}MB`)
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Performance Optimization',
        success: errors.length === 0,
        details: `Validated performance: ${contextTime.toFixed(2)}ms for contexts, ${decisionTime.toFixed(2)}ms for decisions`,
        performance: { executionTime, memoryUsage },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Performance Optimization',
        success: false,
        details: 'Performance optimization test failed',
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
      // Test invalid behavior profile
      const invalidProfile = this.aiSystem.setBehaviorProfile('nonexistent_profile')
      if (invalidProfile) {
        errors.push('Should reject invalid behavior profile')
      }

      // Test invalid context
      try {
        this.contextAnalyzer.addContext({
          type: 'invalid_context' as any,
          intensity: -1, // Invalid intensity
          metadata: {}
        })
        errors.push('Should handle invalid context gracefully')
      } catch (e) {
        // Expected error, this is good
      }

      // Test invalid animation decision
      try {
        this.decisionEngine.makeDecision(
          ContextType.IDLE,
          1.5, // Invalid intensity > 1
          0.8,
          [],
          [] // Empty animations
        )
        // Should handle gracefully without throwing
      } catch (e) {
        errors.push('Should handle invalid decision parameters gracefully')
      }

      // Test system reset
      this.aiSystem.reset()
      const stateAfterReset = this.aiSystem.getBehaviorState()
      if (stateAfterReset.activeContexts.length > 0) {
        errors.push('System reset not properly clearing state')
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Error Handling',
        success: errors.length === 0,
        details: 'Validated graceful handling of invalid inputs and system reset',
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Error Handling',
        success: false,
        details: 'Error handling test failed',
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
      // Scenario 1: User interaction sequence
      this.aiSystem.addInteractionContext('click', 'greeting_button', 200)
      this.aiSystem.addInteractionContext('hover', 'menu_item', 1000)
      this.aiSystem.addInteractionContext('click', 'animation_button', 150)
      
      const interactionState = this.aiSystem.getBehaviorState()
      if (interactionState.lastInteractionTime < Date.now() - 10000) {
        errors.push('Interaction timing not properly tracked')
      }

      // Scenario 2: Audio conversation
      this.aiSystem.addAudioContext(0.7, [150, 250, 350])
      this.aiSystem.addAudioContext(0.8, [160, 260, 360])
      this.aiSystem.addAudioContext(0.9, [170, 270, 370])
      
      const conversationState = this.aiSystem.getConversationState()
      if (!conversationState.isActive) {
        errors.push('Audio conversation not properly detected')
      }

      // Scenario 3: Emotional progression
      this.contextAnalyzer.addContext({
        type: ContextType.EMOTIONAL_STATE,
        intensity: 0.3,
        metadata: { emotion: EmotionalTone.POSITIVE }
      })
      
      this.contextAnalyzer.addContext({
        type: ContextType.EMOTIONAL_STATE,
        intensity: 0.7,
        metadata: { emotion: EmotionalTone.EXCITED }
      })
      
      const emotionalTone = this.contextAnalyzer.analyzeEmotionalTone()
      if (emotionalTone === EmotionalTone.NEUTRAL) {
        errors.push('Emotional progression not properly tracked')
      }

      // Scenario 4: Idle behavior
      // Simulate idle time
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const idleContext = this.contextAnalyzer.analyzeCurrentContext()
      if (idleContext.primaryContext !== ContextType.IDLE) {
        errors.push('Idle context not properly detected after activity')
      }

      const executionTime = performance.now() - testStart
      this.testResults.push({
        testName: 'Real World Scenarios',
        success: errors.length === 0,
        details: 'Validated user interaction sequences, audio conversations, emotional progression, and idle behavior',
        performance: { executionTime },
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Real World Scenarios',
        success: false,
        details: 'Real world scenarios test failed',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Initialize AI system for testing
   */
  private async initializeAISystem(): Promise<void> {
    console.log('🔧 Initializing AI system for testing...')
    
    // Start AI system
    this.aiSystem.start()
    
    // Set default behavior profile
    this.aiSystem.setBehaviorProfile('energetic_friendly')
    
    // Initialize context analyzer with test environment
    this.contextAnalyzer.setEnvironmentalFactors({
      noiseLevel: 0.2,
      visualActivity: 0.6,
      userPresence: 1.0,
      timeOfDay: 'afternoon'
    })
    
    console.log('✅ AI system initialized for testing')
  }

  /**
   * Estimate memory usage (approximate)
   */
  private estimateMemoryUsage(): number {
    // Rough estimation based on object sizes
    const contextCount = 100
    const decisionCount = 50
    const estimatedSize = (contextCount * 0.1) + (decisionCount * 0.05) // MB
    return estimatedSize
  }

  /**
   * Generate comprehensive validation report
   */
  private generateValidationReport(): ValidationReport {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(result => result.success).length
    const failedTests = totalTests - passedTests
    const overallSuccess = failedTests === 0

    const totalExecutionTime = performance.now() - this.startTime
    const averageExecutionTime = totalExecutionTime / totalTests

    const recommendations = this.generateRecommendations()

    return {
      totalTests,
      passedTests,
      failedTests,
      testResults: this.testResults,
      overallSuccess,
      recommendations,
      performanceMetrics: {
        averageExecutionTime,
        totalExecutionTime
      }
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const failedTests = this.testResults.filter(result => !result.success)
    
    if (failedTests.length > 0) {
      recommendations.push(`🔧 Fix ${failedTests.length} failed test(s)`)
    }

    const slowTests = this.testResults.filter(result => 
      result.performance && result.performance.executionTime > 50
    )
    
    if (slowTests.length > 0) {
      recommendations.push(`⚡ Optimize ${slowTests.length} slow test(s)`)
    }

    if (this.testResults.every(result => result.success)) {
      recommendations.push('🎉 All AI behavior systems are functioning correctly')
      recommendations.push('🚀 Ready for production deployment')
    }

    return recommendations
  }

  /**
   * Print validation report
   */
  private printReport(report: ValidationReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 AI BEHAVIOR SYSTEM VALIDATION REPORT')
    console.log('='.repeat(60))
    
    console.log(`\n📊 Test Summary:`)
    console.log(`   Total Tests: ${report.totalTests}`)
    console.log(`   Passed: ${report.passedTests} ✅`)
    console.log(`   Failed: ${report.failedTests} ❌`)
    console.log(`   Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`)
    
    console.log(`\n⏱️  Performance Metrics:`)
    console.log(`   Total Execution Time: ${report.performanceMetrics.totalExecutionTime.toFixed(2)}ms`)
    console.log(`   Average Test Time: ${report.performanceMetrics.averageExecutionTime.toFixed(2)}ms`)
    
    console.log(`\n📋 Detailed Results:`)
    report.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`   ${index + 1}. ${status} ${result.testName}`)
      console.log(`      ${result.details}`)
      if (result.performance) {
        console.log(`      ⏱️  ${result.performance.executionTime.toFixed(2)}ms`)
      }
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`      ❌ ${error}`))
      }
    })
    
    console.log(`\n💡 Recommendations:`)
    report.recommendations.forEach(rec => console.log(`   • ${rec}`))
    
    console.log(`\n${report.overallSuccess ? '🎉' : '⚠️'} Overall Status: ${report.overallSuccess ? 'PASSED' : 'FAILED'}`)
    console.log('='.repeat(60) + '\n')
  }
}

// Export for external use
// AIBehaviorValidator is already exported as a class above
export type { TestResult, ValidationReport }

// Auto-run validation if this module is loaded directly
if (typeof window !== 'undefined') {
  // Browser environment - make available globally
  (window as any).AIBehaviorValidator = AIBehaviorValidator
  
  // Auto-run validation after a short delay to ensure everything is loaded
  setTimeout(() => {
    const validator = new AIBehaviorValidator()
    validator.runAllTests().catch(console.error)
  }, 1000)
}
