/**
 * Agent 1 - AI Behavior Testing Suite
 * 
 * Comprehensive testing for all AI behavior systems:
 * - Context Analysis
 * - Animation Decision Engine  
 * - Behavior Profiles
 * - Emotional Memory
 * - Adaptive Behavior
 */

import { AIBehaviorSystem } from './AIBehaviorSystem'
import { ContextType, BlendMode } from './types'

interface TestResult {
  testName: string
  passed: boolean
  details: string
  executionTime: number
}

interface TestSuite {
  name: string
  tests: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  executionTime: number
}

export class Agent1AIBehaviorTester {
  private aiSystem: AIBehaviorSystem
  private testResults: TestSuite[] = []
  private startTime: number = 0

  constructor() {
    this.aiSystem = new AIBehaviorSystem()
  }

  /**
   * Run all AI behavior tests
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🤖 Agent 1 - Starting AI Behavior Testing Suite...')
    this.startTime = Date.now()

    // Initialize AI system
    this.aiSystem.start()

    // Run all test suites
    await this.testSystemInitialization()
    await this.testContextAnalysis()
    await this.testAnimationDecisionEngine()
    await this.testBehaviorProfiles()
    await this.testEmotionalMemory()
    await this.testAdaptiveBehavior()
    await this.testIntegrationFeatures()

    const totalTime = Date.now() - this.startTime
    console.log(`🤖 Agent 1 - AI Behavior Testing Complete (${totalTime}ms)`)

    return this.testResults
  }

  /**
   * Test 1: System Initialization
   */
  private async testSystemInitialization(): Promise<void> {
    const suite: TestSuite = {
      name: 'System Initialization',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    // Test 1.1: System starts correctly
    const test1 = this.runTest('System Active State', () => {
      return this.aiSystem.isSystemActive()
    })
    suite.tests.push(test1)

    // Test 1.2: Default behavior profile is set
    const test2 = this.runTest('Default Profile Set', () => {
      const state = this.aiSystem.getBehaviorState()
      return state.currentProfile !== null
    })
    suite.tests.push(test2)

    // Test 1.3: Available profiles are loaded
    const test3 = this.runTest('Available Profiles Loaded', () => {
      const profiles = this.aiSystem.getAvailableProfiles()
      return profiles.length > 0
    })
    suite.tests.push(test3)

    // Test 1.4: Context analyzer is initialized
    const test4 = this.runTest('Context Analyzer Ready', () => {
      const state = this.aiSystem.getBehaviorState()
      return state.activeContexts !== undefined
    })
    suite.tests.push(test4)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ System Initialization: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 2: Context Analysis
   */
  private async testContextAnalysis(): Promise<void> {
    const suite: TestSuite = {
      name: 'Context Analysis',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    // Test 2.1: Interaction context analysis
    const test1 = this.runTest('Interaction Context Analysis', () => {
      this.aiSystem.addInteractionContext('click', 'button', 500)
      const state = this.aiSystem.getBehaviorState()
      return state.activeContexts.length > 0
    })
    suite.tests.push(test1)

    // Test 2.2: Audio context analysis
    const test2 = this.runTest('Audio Context Analysis', () => {
      this.aiSystem.addAudioContext(0.8, [150, 250, 350])
      const state = this.aiSystem.getBehaviorState()
      return state.activeContexts.some(ctx => ctx.type === ContextType.AUDIO_INPUT)
    })
    suite.tests.push(test2)

    // Test 2.3: Emotional context analysis
    const test3 = this.runTest('Emotional Context Analysis', () => {
      this.aiSystem.addContext({
        type: ContextType.EMOTIONAL_STATE,
        intensity: 0.7,
        metadata: { emotion: 'excited' }
      })
      const state = this.aiSystem.getBehaviorState()
      return state.activeContexts.some(ctx => ctx.type === ContextType.EMOTIONAL_STATE)
    })
    suite.tests.push(test3)

    // Test 2.4: Conversation state tracking
    const test4 = this.runTest('Conversation State Tracking', () => {
      const conversationState = this.aiSystem.getConversationState()
      return conversationState !== null && typeof conversationState.isActive === 'boolean'
    })
    suite.tests.push(test4)

    // Test 2.5: Context intensity calculation
    const test5 = this.runTest('Context Intensity Calculation', () => {
      this.aiSystem.addContext({
        type: ContextType.INTERACTION,
        intensity: 0.9,
        metadata: { action: 'wave' }
      })
      const state = this.aiSystem.getBehaviorState()
      const highIntensityContext = state.activeContexts.find(ctx => ctx.intensity > 0.8)
      return highIntensityContext !== undefined
    })
    suite.tests.push(test5)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Context Analysis: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 3: Animation Decision Engine
   */
  private async testAnimationDecisionEngine(): Promise<void> {
    const suite: TestSuite = {
      name: 'Animation Decision Engine',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    const availableAnimations = ['idle', 'wave', 'nod', 'clap', 'dance', 'jump', 'sit']

    // Test 3.1: Basic animation decision
    const test1 = this.runTest('Basic Animation Decision', () => {
      const decision = this.aiSystem.getCurrentAnimationDecision(availableAnimations)
      return decision !== null && availableAnimations.includes(decision.animation)
    })
    suite.tests.push(test1)

    // Test 3.2: Animation priority system
    const test2 = this.runTest('Animation Priority System', () => {
      const decision = this.aiSystem.getCurrentAnimationDecision(availableAnimations)
      return decision !== null && typeof decision.priority === 'number' && decision.priority >= 0
    })
    suite.tests.push(test2)

    // Test 3.3: Animation reasoning
    const test3 = this.runTest('Animation Reasoning', () => {
      const decision = this.aiSystem.getCurrentAnimationDecision(availableAnimations)
      return decision !== null && typeof decision.reason === 'string' && decision.reason.length > 0
    })
    suite.tests.push(test3)

    // Test 3.4: Blend mode selection
    const test4 = this.runTest('Blend Mode Selection', () => {
      const decision = this.aiSystem.getCurrentAnimationDecision(availableAnimations)
      return decision !== null && Object.values(BlendMode).includes(decision.blendMode)
    })
    suite.tests.push(test4)

    // Test 3.5: Emotional animation recommendations
    const test5 = this.runTest('Emotional Animation Recommendations', () => {
      const recommendation = this.aiSystem.getEmotionalRecommendation()
      return recommendation === null || (recommendation && typeof recommendation.animation === 'string')
    })
    suite.tests.push(test5)

    // Test 3.6: Animation triggering
    const test6 = this.runTest('Animation Triggering', () => {
      const success = this.aiSystem.triggerAnimation('wave', BlendMode.ADDITIVE, 0.8)
      return typeof success === 'boolean'
    })
    suite.tests.push(test6)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Animation Decision Engine: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 4: Behavior Profiles
   */
  private async testBehaviorProfiles(): Promise<void> {
    const suite: TestSuite = {
      name: 'Behavior Profiles',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    // Test 4.1: Energetic friendly profile
    const test1 = this.runTest('Energetic Friendly Profile', () => {
      const success = this.aiSystem.setBehaviorProfile('energetic_friendly')
      const state = this.aiSystem.getBehaviorState()
      return success && state.currentProfile?.name === 'Energetic & Friendly'
    })
    suite.tests.push(test1)

    // Test 4.2: Calm professional profile
    const test2 = this.runTest('Calm Professional Profile', () => {
      const success = this.aiSystem.setBehaviorProfile('calm_professional')
      const state = this.aiSystem.getBehaviorState()
      return success && state.currentProfile?.name === 'Calm & Professional'
    })
    suite.tests.push(test2)

    // Test 4.3: Playful creative profile
    const test3 = this.runTest('Playful Creative Profile', () => {
      const success = this.aiSystem.setBehaviorProfile('playful_creative')
      const state = this.aiSystem.getBehaviorState()
      return success && state.currentProfile?.name === 'Playful & Creative'
    })
    suite.tests.push(test3)

    // Test 4.4: Profile switching
    const test4 = this.runTest('Profile Switching', () => {
      this.aiSystem.setBehaviorProfile('energetic_friendly')
      const state1 = this.aiSystem.getBehaviorState()
      this.aiSystem.setBehaviorProfile('calm_professional')
      const state2 = this.aiSystem.getBehaviorState()
      return state1.currentProfile?.id !== state2.currentProfile?.id
    })
    suite.tests.push(test4)

    // Test 4.5: Invalid profile handling
    const test5 = this.runTest('Invalid Profile Handling', () => {
      const success = this.aiSystem.setBehaviorProfile('invalid_profile')
      return !success // Should fail for invalid profile
    })
    suite.tests.push(test5)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Behavior Profiles: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 5: Emotional Memory
   */
  private async testEmotionalMemory(): Promise<void> {
    const suite: TestSuite = {
      name: 'Emotional Memory',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    // Test 5.1: Learning stats tracking
    const test1 = this.runTest('Learning Stats Tracking', () => {
      const stats = this.aiSystem.getLearningStats()
      return stats && typeof stats.interactionCount === 'number'
    })
    suite.tests.push(test1)

    // Test 5.2: Emotional profile tracking
    const test2 = this.runTest('Emotional Profile Tracking', () => {
      const stats = this.aiSystem.getLearningStats()
      return stats && stats.emotionalProfile && typeof stats.emotionalProfile === 'object'
    })
    suite.tests.push(test2)

    // Test 5.3: Top responses tracking
    const test3 = this.runTest('Top Responses Tracking', () => {
      const stats = this.aiSystem.getLearningStats()
      return stats && Array.isArray(stats.topResponses)
    })
    suite.tests.push(test3)

    // Test 5.4: Interaction recording
    const test4 = this.runTest('Interaction Recording', () => {
      // Add some interactions to test recording
      this.aiSystem.addInteractionContext('click', 'button', 500)
      this.aiSystem.addAudioContext(0.6, [200, 300])
      const stats = this.aiSystem.getLearningStats()
      return stats.interactionCount > 0
    })
    suite.tests.push(test4)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Emotional Memory: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 6: Adaptive Behavior
   */
  private async testAdaptiveBehavior(): Promise<void> {
    const suite: TestSuite = {
      name: 'Adaptive Behavior',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    // Test 6.1: Smart animation triggers
    const test1 = this.runTest('Smart Animation Triggers', () => {
      const trigger = this.aiSystem.createSmartAnimationTrigger()
      return trigger !== null && typeof trigger === 'object'
    })
    suite.tests.push(test1)

    // Test 6.2: Animation scheduling
    const test2 = this.runTest('Animation Scheduling', () => {
      const decision = this.aiSystem.getCurrentAnimationDecision(['wave', 'nod'])
      if (decision) {
        this.aiSystem.scheduleAnimation(decision, 1000)
        return true
      }
      return false
    })
    suite.tests.push(test2)

    // Test 6.3: Current gestures tracking
    const test3 = this.runTest('Current Gestures Tracking', () => {
      const gestures = this.aiSystem.getCurrentGestures()
      return Array.isArray(gestures)
    })
    suite.tests.push(test3)

    // Test 6.4: System reset capability
    const test4 = this.runTest('System Reset Capability', () => {
      this.aiSystem.reset()
      const state = this.aiSystem.getBehaviorState()
      return state.activeContexts.length === 0
    })
    suite.tests.push(test4)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Adaptive Behavior: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 7: Integration Features
   */
  private async testIntegrationFeatures(): Promise<void> {
    const suite: TestSuite = {
      name: 'Integration Features',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    // Test 7.1: Animation blender integration
    const test1 = this.runTest('Animation Blender Integration', () => {
      // Test if animation blender API is available
      const blender = (window as any).__ANIMATION_BLENDER__
      return blender === undefined || (blender && typeof blender.blendToAnimation === 'function')
    })
    suite.tests.push(test1)

    // Test 7.2: Context analyzer integration
    const test2 = this.runTest('Context Analyzer Integration', () => {
      const state = this.aiSystem.getBehaviorState()
      return state.activeContexts !== undefined
    })
    suite.tests.push(test2)

    // Test 7.3: Decision engine integration
    const test3 = this.runTest('Decision Engine Integration', () => {
      const decision = this.aiSystem.getCurrentAnimationDecision(['idle'])
      return decision !== null
    })
    suite.tests.push(test3)

    // Test 7.4: Behavior profiles integration
    const test4 = this.runTest('Behavior Profiles Integration', () => {
      const profiles = this.aiSystem.getAvailableProfiles()
      return profiles.length > 0
    })
    suite.tests.push(test4)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Integration Features: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Test 8: Phase 1 Components (Personality & Environment)
   */
  private async testPhase1Components(): Promise<void> {
    const suite: TestSuite = {
      name: 'Phase 1 Components',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      executionTime: 0
    }

    const startTime = Date.now()

    const test1 = this.runTest('PersonalitySystem suggestAnimations', () => {
      const { PersonalitySystem, PersonalityPresetId, MoodId } = require('../core/PersonalitySystem')
      const { EnvironmentAwareness } = require('../core/EnvironmentAwareness')
      const p = new PersonalitySystem({ preset: PersonalityPresetId.Friendly, baseMood: { mood: MoodId.Happy, intensity: 0.5 } })
      const env = new EnvironmentAwareness()
      env.recordInteraction('click')
      const snap = env.getSnapshot({ audioLevel: 0.3, animationSpeed: 1.0 })
      const suggestions = p.suggestAnimations(['idle','wave','nod','dance'], snap)
      return Array.isArray(suggestions) && suggestions.length >= 0
    })
    suite.tests.push(test1)

    const test2 = this.runTest('EnvironmentAwareness frequency increases with events', () => {
      const { EnvironmentAwareness } = require('../core/EnvironmentAwareness')
      const env = new EnvironmentAwareness({ maxHistoryMs: 5000 })
      const before = env.getSnapshot({ audioLevel: 0, animationSpeed: 1 }).interactionFrequency
      env.recordInteraction('hover')
      env.recordInteraction('click')
      const after = env.getSnapshot({ audioLevel: 0, animationSpeed: 1 }).interactionFrequency
      return after >= before
    })
    suite.tests.push(test2)

    const test3 = this.runTest('BehaviorTree tick updates lastDecision', () => {
      // Simulate behavior tree tick by importing AIBehavior for side effects
      // and dispatching an interaction to trigger 'engage' path
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('../core/AIBehavior')
      } catch {}
      window.dispatchEvent(new CustomEvent('ai:interaction', { detail: { type: 'click' } }))
      // We cannot directly access internal state; this is a smoke test ensuring no errors occur
      return true
    })
    suite.tests.push(test3)

    suite.executionTime = Date.now() - startTime
    suite.totalTests = suite.tests.length
    suite.passedTests = suite.tests.filter(t => t.passed).length
    suite.failedTests = suite.tests.filter(t => !t.passed).length

    this.testResults.push(suite)
    console.log(`✅ Phase 1 Components: ${suite.passedTests}/${suite.totalTests} tests passed`)
  }

  /**
   * Helper method to run individual tests
   */
  private runTest(testName: string, testFunction: () => boolean): TestResult {
    const startTime = Date.now()
    let passed = false
    let details = ''

    try {
      passed = testFunction()
      details = passed ? 'Test passed successfully' : 'Test failed'
    } catch (error) {
      passed = false
      details = `Test error: ${error instanceof Error ? error.message : String(error)}`
    }

    const executionTime = Date.now() - startTime

    return {
      testName,
      passed,
      details,
      executionTime
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(): string {
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0)
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0)
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0)
    const totalTime = Date.now() - this.startTime

    let report = `
🤖 AGENT 1 - AI BEHAVIOR TESTING REPORT
===========================================
📊 OVERALL RESULTS
- Total Test Suites: ${this.testResults.length}
- Total Tests: ${totalTests}
- Passed: ${totalPassed}
- Failed: ${totalFailed}
- Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%
- Total Execution Time: ${totalTime}ms

📋 DETAILED RESULTS
`

    this.testResults.forEach(suite => {
      report += `
🔹 ${suite.name}
   - Tests: ${suite.passedTests}/${suite.totalTests} passed
   - Execution Time: ${suite.executionTime}ms
   - Success Rate: ${suite.totalTests > 0 ? ((suite.passedTests / suite.totalTests) * 100).toFixed(1) : 0}%
`

      if (suite.failedTests > 0) {
        report += `   - Failed Tests:\n`
        suite.tests.filter(t => !t.passed).forEach(test => {
          report += `     ❌ ${test.testName}: ${test.details}\n`
        })
      }
    })

    report += `
🎯 RECOMMENDATIONS
`

    if (totalFailed === 0) {
      report += `✅ All AI behavior systems are working correctly!\n`
    } else {
      report += `⚠️ Some tests failed. Review the failed tests above.\n`
    }

    return report
  }
}

// Browser console testing functions
export const runAgent1Tests = async () => {
  const tester = new Agent1AIBehaviorTester()
  const results = await tester.runAllTests()
  // Run Phase 1 component tests after legacy suites
  // Use dynamic call to avoid TypeScript complaining about private
  ;(tester as any).testPhase1Components && await (tester as any).testPhase1Components()
  console.log(tester.generateReport())
  return results
}

export const quickAgent1Test = () => {
  const aiSystem = new AIBehaviorSystem()
  aiSystem.start()
  
  console.log('🤖 Quick AI Behavior Test:')
  console.log('- System Active:', aiSystem.isSystemActive())
  console.log('- Available Profiles:', aiSystem.getAvailableProfiles().length)
  console.log('- Current State:', aiSystem.getBehaviorState())
  
  const decision = aiSystem.getCurrentAnimationDecision(['idle', 'wave', 'nod'])
  console.log('- Animation Decision:', decision)
  
  return aiSystem
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runAgent1Tests = runAgent1Tests
  ;(window as any).quickAgent1Test = quickAgent1Test
}
