// Main export file for the AI Behavior System

export { AIBehaviorSystem, aiBehaviorSystem } from './AIBehaviorSystem'
export { ContextAnalyzer } from './ContextAnalyzer'
export { AnimationDecisionEngine } from './AnimationDecisionEngine'
export { 
  BEHAVIOR_PROFILES,
  ENERGETIC_FRIENDLY,
  CALM_PROFESSIONAL,
  PLAYFUL_MISCHIEVOUS,
  getBehaviorProfile,
  getBehaviorProfileOptions
} from './BehaviorProfiles'

// Export all types and enums from the types file
export type {
  Context,
  BehaviorProfile,
  PersonalityTraits,
  AnimationPreferences,
  ResponsePattern,
  WeightedAnimation,
  AnimationDecision,
  BehaviorState,
  ConversationState
} from './types'

export {
  ContextType,
  BlendMode,
  EmotionalTone
} from './types'

// Initialize AI behavior system function for easy setup
export function initializeAIBehavior() {
  // Import dynamically to avoid circular dependency
  const { aiBehaviorSystem: aiSystem } = require('./AIBehaviorSystem')
  aiSystem.start()
  return aiSystem
}

// Advanced AI behavior functions for external integration
export function createSmartAnimationTrigger() {
  const { aiBehaviorSystem } = require('./AIBehaviorSystem')
  
  return {
    /**
     * Add user interaction context to AI system
     */
    addInteraction: (type: 'click' | 'hover' | 'focus' | 'scroll', target?: string, duration?: number) => {
      aiBehaviorSystem.addInteractionContext(type, target, duration)
    },
    
    /**
     * Add audio input to AI system
     */
    addAudio: (audioLevel: number, frequency?: number[]) => {
      aiBehaviorSystem.addAudioContext(audioLevel, frequency)
    },
    
    /**
     * Manually trigger specific animation
     */
    triggerAnimation: (animationName: string, blendMode?: any, intensity?: number, duration?: number) => {
      return aiBehaviorSystem.triggerAnimation(animationName, blendMode, intensity, duration)
    },
    
    /**
     * Get AI's emotional recommendation
     */
    getEmotionalRecommendation: () => {
      return aiBehaviorSystem.getEmotionalRecommendation()
    },
    
    /**
     * Get current behavior state
     */
    getBehaviorState: () => {
      return aiBehaviorSystem.getBehaviorState()
    },
    
    /**
     * Get learning statistics
     */
    getLearningStats: () => {
      return aiBehaviorSystem.getLearningStats()
    },
    
    /**
     * Set behavior profile
     */
    setBehaviorProfile: (profileId: string) => {
      return aiBehaviorSystem.setBehaviorProfile(profileId)
    },
    
    /**
     * Schedule animation for later execution
     */
    scheduleAnimation: (decision: any, delayMs?: number) => {
      aiBehaviorSystem.scheduleAnimation(decision, delayMs)
    },
    
    /**
     * Get predictive analysis for upcoming context
     */
    getPredictiveAnalysis: () => {
      return aiBehaviorSystem.getConversationState() // Access through conversation state for now
    },
    
    /**
     * Get environmental context assessment
     */
    getEnvironmentalContext: () => {
      // Access context analyzer through behavior system
      const contextAnalyzer = (aiBehaviorSystem as any).contextAnalyzer
      return contextAnalyzer ? contextAnalyzer.getEnvironmentalContext() : null
    },
    
    /**
     * Set environmental factors
     */
    setEnvironmentalFactors: (factors: any) => {
      const contextAnalyzer = (aiBehaviorSystem as any).contextAnalyzer
      if (contextAnalyzer) {
        contextAnalyzer.setEnvironmentalFactors(factors)
      }
    }
  }
}