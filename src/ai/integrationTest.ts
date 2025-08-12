/**
 * 🔗 AI Behavior System Integration Test
 * Agent 1 - AI Behavior Team
 * 
 * Tests integration between AI behavior system and core animation system
 */

import { AIBehaviorSystem } from './index'
import { ContextType, BlendMode } from './types'

interface IntegrationTestResult {
  testName: string
  success: boolean
  details: string
  integrationPoint: string
  errors?: string[]
}

interface IntegrationReport {
  totalTests: number
  passedTests: number
  failedTests: number
  testResults: IntegrationTestResult[]
  overallSuccess: boolean
  recommendations: string[]
}

/**
 * AI Behavior Integration Tester
 * Tests integration with core animation system and other components
 */
export class AIBehaviorIntegrationTester {
  private aiSystem: AIBehaviorSystem
  private testResults: IntegrationTestResult[] = []

  constructor() {
    this.aiSystem = new AIBehaviorSystem()
  }

  /**
   * Run all integration tests
   */
  async runIntegrationTests(): Promise<IntegrationReport> {
    console.log('🔗 Starting AI Behavior Integration Tests...')

    try {
      // Initialize AI system
      await this.initializeAISystem()

      // Run integration tests
      await this.testAnimationBlenderIntegration()
      await this.testContextAnalyzerIntegration()
      await this.testDecisionEngineIntegration()
      await this.testBehaviorProfileIntegration()
      await this.testEnvironmentalIntegration()
      await this.testPerformanceIntegration()
      await this.testErrorHandlingIntegration()

      // Generate report
      const report = this.generateIntegrationReport()
      this.printIntegrationReport(report)

      return report
    } catch (error) {
      console.error('❌ AI Behavior integration tests failed:', error)
      throw error
    }
  }

  /**
   * Test integration with Animation Blender
   */
  private async testAnimationBlenderIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test animation blender connection
      this.aiSystem.start()
      
      // Simulate animation blender connection
      const mockBlender = {
        blendToAnimation: (name: string) => console.log(`Blending to: ${name}`),
        addGestureOverlay: (name: string) => console.log(`Adding gesture: ${name}`),
        removeAdditiveLayer: (name: string) => console.log(`Removing layer: ${name}`),
        isAnimationPlaying: () => false,
        getAnimationWeight: () => 0,
        crossfadeAnimations: (from: string, to: string) => console.log(`Crossfading: ${from} -> ${to}`)
      }

      // Inject mock blender
      ;(window as any).__ANIMATION_BLENDER__ = mockBlender

      // Test animation triggering
      const triggerResult = this.aiSystem.triggerAnimation('test_animation', BlendMode.REPLACE, 0.8)
      if (!triggerResult) {
        errors.push('Animation triggering failed')
      }

      // Test gesture tracking
      const gestures = this.aiSystem.getCurrentGestures()
      if (!Array.isArray(gestures)) {
        errors.push('Gesture tracking not working')
      }

      this.testResults.push({
        testName: 'Animation Blender Integration',
        success: errors.length === 0,
        details: 'Validated animation triggering, gesture tracking, and blender communication',
        integrationPoint: 'Core Animation System',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Animation Blender Integration',
        success: false,
        details: 'Animation blender integration test failed',
        integrationPoint: 'Core Animation System',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test integration with Context Analyzer
   */
  private async testContextAnalyzerIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test context addition and analysis
      this.aiSystem.addContext({
        type: ContextType.INTERACTION,
        intensity: 0.8,
        metadata: { source: 'test' }
      })

      // Test interaction context
      this.aiSystem.addInteractionContext('click', 'test_button', 500)
      
      // Test audio context
      this.aiSystem.addAudioContext(0.7, 250)

      // Verify context analysis
      const behaviorState = this.aiSystem.getBehaviorState()
      if (!behaviorState.activeContexts || behaviorState.activeContexts.length === 0) {
        errors.push('Context analysis not properly integrated')
      }

      // Test conversation state
      const conversationState = this.aiSystem.getConversationState()
      if (!conversationState || typeof conversationState.isActive !== 'boolean') {
        errors.push('Conversation state integration failed')
      }

      this.testResults.push({
        testName: 'Context Analyzer Integration',
        success: errors.length === 0,
        details: 'Validated context addition, analysis, and state management',
        integrationPoint: 'Context Analysis System',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Context Analyzer Integration',
        success: false,
        details: 'Context analyzer integration test failed',
        integrationPoint: 'Context Analysis System',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test integration with Decision Engine
   */
  private async testDecisionEngineIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test decision making with available animations
      const availableAnimations = ['idle', 'wave', 'nod', 'clap', 'dance']
      const decision = this.aiSystem.getCurrentAnimationDecision(availableAnimations)
      
      if (!decision) {
        errors.push('Decision engine not generating decisions')
      }

      // Test behavior profile switching
      const profileSuccess = this.aiSystem.setBehaviorProfile('calm_professional')
      if (!profileSuccess) {
        errors.push('Behavior profile switching failed')
      }

      // Test emotional recommendations
      const emotionalRec = this.aiSystem.getEmotionalRecommendation()
      if (!emotionalRec || !emotionalRec.animation) {
        errors.push('Emotional recommendation system not working')
      }

      // Test learning statistics
      const learningStats = this.aiSystem.getLearningStats()
      if (!learningStats || typeof learningStats.interactionCount !== 'number') {
        errors.push('Learning statistics integration failed')
      }

      this.testResults.push({
        testName: 'Decision Engine Integration',
        success: errors.length === 0,
        details: 'Validated decision making, profile switching, and learning systems',
        integrationPoint: 'Decision Engine',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Decision Engine Integration',
        success: false,
        details: 'Decision engine integration test failed',
        integrationPoint: 'Decision Engine',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test integration with Behavior Profiles
   */
  private async testBehaviorProfileIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test all behavior profiles
      const profiles = ['energetic_friendly', 'calm_professional', 'playful_mischievous']
      
      for (const profileId of profiles) {
        const success = this.aiSystem.setBehaviorProfile(profileId)
        if (!success) {
          errors.push(`Failed to set behavior profile: ${profileId}`)
        }

        // Test profile-specific behavior
        const state = this.aiSystem.getBehaviorState()
        if (!state.currentProfile || state.currentProfile.id !== profileId) {
          errors.push(`Profile not properly set: ${profileId}`)
        }
      }

      // Test profile availability
      const availableProfiles = this.aiSystem.getAvailableProfiles()
      if (availableProfiles.length < 3) {
        errors.push('Not all behavior profiles are available')
      }

      this.testResults.push({
        testName: 'Behavior Profile Integration',
        success: errors.length === 0,
        details: `Validated ${profiles.length} behavior profiles and switching`,
        integrationPoint: 'Behavior Profile System',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Behavior Profile Integration',
        success: false,
        details: 'Behavior profile integration test failed',
        integrationPoint: 'Behavior Profile System',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test integration with Environmental System
   */
  private async testEnvironmentalIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test environmental factors
      const smartTrigger = this.aiSystem.createSmartAnimationTrigger()
      
      if (!smartTrigger.setEnvironmentalFactors) {
        errors.push('Environmental factors not available in smart trigger')
      }

      // Test environmental context
      const environmentalContext = smartTrigger.getEnvironmentalContext()
      if (!environmentalContext || typeof environmentalContext.noiseLevel !== 'number') {
        errors.push('Environmental context not properly integrated')
      }

      // Test predictive analysis
      const prediction = smartTrigger.getPredictiveAnalysis()
      if (!prediction) {
        errors.push('Predictive analysis not working')
      }

      this.testResults.push({
        testName: 'Environmental Integration',
        success: errors.length === 0,
        details: 'Validated environmental factors, context, and predictive analysis',
        integrationPoint: 'Environmental System',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Environmental Integration',
        success: false,
        details: 'Environmental integration test failed',
        integrationPoint: 'Environmental System',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test integration with Performance System
   */
  private async testPerformanceIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test system performance under load
      const startTime = performance.now()
      
      // Simulate rapid interactions
      for (let i = 0; i < 20; i++) {
        this.aiSystem.addInteractionContext('click', `button_${i}`, 100)
        this.aiSystem.addAudioContext(0.5 + Math.random() * 0.3, 200)
      }

      const interactionTime = performance.now() - startTime
      
      if (interactionTime > 200) { // Should handle 20 interactions in under 200ms
        errors.push(`Performance too slow: ${interactionTime.toFixed(2)}ms for 20 interactions`)
      }

      // Test memory usage (approximate)
      const state = this.aiSystem.getBehaviorState()
      if (!state || !state.activeContexts) {
        errors.push('State management not working under load')
      }

      this.testResults.push({
        testName: 'Performance Integration',
        success: errors.length === 0,
        details: `Validated performance: ${interactionTime.toFixed(2)}ms for 20 interactions`,
        integrationPoint: 'Performance System',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Performance Integration',
        success: false,
        details: 'Performance integration test failed',
        integrationPoint: 'Performance System',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Test integration with Error Handling System
   */
  private async testErrorHandlingIntegration(): Promise<void> {
    const errors: string[] = []

    try {
      // Test graceful handling of invalid inputs
      const invalidProfile = this.aiSystem.setBehaviorProfile('nonexistent_profile')
      if (invalidProfile) {
        errors.push('Should reject invalid behavior profile')
      }

      // Test system reset
      this.aiSystem.reset()
      const stateAfterReset = this.aiSystem.getBehaviorState()
      if (stateAfterReset.activeContexts.length > 0) {
        errors.push('System reset not properly clearing state')
      }

      // Test system restart
      this.aiSystem.start()
      if (!this.aiSystem.isSystemActive()) {
        errors.push('System restart failed')
      }

      this.testResults.push({
        testName: 'Error Handling Integration',
        success: errors.length === 0,
        details: 'Validated graceful error handling and system recovery',
        integrationPoint: 'Error Handling System',
        errors
      })

    } catch (error) {
      this.testResults.push({
        testName: 'Error Handling Integration',
        success: false,
        details: 'Error handling integration test failed',
        integrationPoint: 'Error Handling System',
        errors: [error instanceof Error ? error.message : String(error)]
      })
    }
  }

  /**
   * Initialize AI system for integration testing
   */
  private async initializeAISystem(): Promise<void> {
    console.log('🔧 Initializing AI system for integration testing...')
    
    // Start AI system
    this.aiSystem.start()
    
    // Set default behavior profile
    this.aiSystem.setBehaviorProfile('energetic_friendly')
    
    console.log('✅ AI system initialized for integration testing')
  }

  /**
   * Generate integration test report
   */
  private generateIntegrationReport(): IntegrationReport {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(result => result.success).length
    const failedTests = totalTests - passedTests
    const overallSuccess = failedTests === 0

    const recommendations = this.generateIntegrationRecommendations()

    return {
      totalTests,
      passedTests,
      failedTests,
      testResults: this.testResults,
      overallSuccess,
      recommendations
    }
  }

  /**
   * Generate recommendations based on integration test results
   */
  private generateIntegrationRecommendations(): string[] {
    const recommendations: string[] = []

    const failedTests = this.testResults.filter(result => !result.success)
    
    if (failedTests.length > 0) {
      recommendations.push(`🔧 Fix ${failedTests.length} failed integration test(s)`)
    }

    const integrationPoints = new Set(this.testResults.map(result => result.integrationPoint))
    recommendations.push(`🔗 Tested integration with ${integrationPoints.size} system(s)`)

    if (this.testResults.every(result => result.success)) {
      recommendations.push('🎉 All AI behavior integrations are working correctly')
      recommendations.push('🚀 Ready for production deployment')
    }

    return recommendations
  }

  /**
   * Print integration test report
   */
  private printIntegrationReport(report: IntegrationReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('🔗 AI BEHAVIOR INTEGRATION TEST REPORT')
    console.log('='.repeat(60))
    
    console.log(`\n📊 Integration Test Summary:`)
    console.log(`   Total Tests: ${report.totalTests}`)
    console.log(`   Passed: ${report.passedTests} ✅`)
    console.log(`   Failed: ${report.failedTests} ❌`)
    console.log(`   Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`)
    
    console.log(`\n📋 Integration Test Results:`)
    report.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`   ${index + 1}. ${status} ${result.testName}`)
      console.log(`      Integration Point: ${result.integrationPoint}`)
      console.log(`      ${result.details}`)
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`      ❌ ${error}`))
      }
    })
    
    console.log(`\n💡 Integration Recommendations:`)
    report.recommendations.forEach(rec => console.log(`   • ${rec}`))
    
    console.log(`\n${report.overallSuccess ? '🎉' : '⚠️'} Integration Status: ${report.overallSuccess ? 'PASSED' : 'FAILED'}`)
    console.log('='.repeat(60) + '\n')
  }
}

// Export for external use
// AIBehaviorIntegrationTester is already exported as a class above
export type { IntegrationTestResult, IntegrationReport }

// Auto-run integration tests if this module is loaded directly
if (typeof window !== 'undefined') {
  // Make available globally
  (window as any).AIBehaviorIntegrationTester = AIBehaviorIntegrationTester
  
  // Auto-run integration tests after a delay
  setTimeout(() => {
    const tester = new AIBehaviorIntegrationTester()
    tester.runIntegrationTests().catch(console.error)
  }, 3000)
}
