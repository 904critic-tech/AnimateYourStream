import { ContextAnalyzer } from './ContextAnalyzer'
import { AnimationDecisionEngine } from './AnimationDecisionEngine'
import { getBehaviorProfile } from './BehaviorProfiles'
import { 
  BehaviorState, 
  Context, 
  ContextType, 
  AnimationDecision,
  ConversationState,
  EmotionalTone,
  BlendMode 
} from './types'

// Animation Blender API interface
interface AnimationBlenderAPI {
  blendToAnimation: (animationName: string, transitionDuration?: number) => void
  addGestureOverlay: (gestureAnimation: string, weight?: number, blendMode?: any, duration?: number) => void
  removeAdditiveLayer: (animationName: string, fadeTime?: number) => void
  isAnimationPlaying: (animationName: string) => boolean
  getAnimationWeight: (animationName: string) => number
  crossfadeAnimations: (from: string, to: string, duration?: number, curve?: string) => void
}

/**
 * Main AI Behavior System
 * 
 * Orchestrates the context analysis and animation decision-making process.
 * This is the main interface that other systems will use to get AI-driven
 * animation recommendations.
 */
export class AIBehaviorSystem {
  private contextAnalyzer: ContextAnalyzer
  private decisionEngine: AnimationDecisionEngine
  private state: BehaviorState
  private isActive: boolean = false

  private updateInterval: number | null = null
  private readonly UPDATE_FREQUENCY = 100 // 100ms updates (10 FPS)
  
  // Animation system integration
  private animationBlender: AnimationBlenderAPI | null = null
  private currentGestures = new Set<string>()
  private gestureTimeouts = new Map<string, number>()
  private animationQueue: AnimationDecision[] = []
  
  // Advanced behavior features
  private emotionalMemory: Array<{ emotion: EmotionalTone, timestamp: number, intensity: number }> = []
  private interactionHistory: Array<{ type: string, timestamp: number, response: string }> = []
  private adaptationWeights = new Map<string, number>() // Learn from user preferences

  constructor() {
    this.contextAnalyzer = new ContextAnalyzer({
      enableEnvironmentalAwareness: true,
      enableUserInteractionTracking: true,
      enableAudioAnalysis: true
    })
    this.decisionEngine = new AnimationDecisionEngine()
    
    this.state = {
      currentProfile: null,
      activeContexts: [],
      lastDecision: null,
      lastInteractionTime: Date.now(),
      idleStartTime: Date.now(),
      conversationState: {
        isActive: false,
        speakerCount: 0,
        lastSpeechTime: 0,
        emotionalTone: EmotionalTone.NEUTRAL,
        topicEngagement: 0
      }
    }

    // Set default behavior profile
    this.setBehaviorProfile('energetic_friendly')
  }

  /**
   * Start the AI behavior system
   */
  start(): void {
    if (this.isActive) return

    this.isActive = true
    this.updateInterval = window.setInterval(() => {
      this.update()
    }, this.UPDATE_FREQUENCY)

    // Connect to animation blender if available
    this.connectToAnimationBlender()

    console.log('AI Behavior System started')
  }

  /**
   * Connect to the animation blender system
   */
  private connectToAnimationBlender(): void {
    // Try to connect to the global animation blender API
    const blender = (window as any).__ANIMATION_BLENDER__
    if (blender) {
      this.animationBlender = blender
      console.log('🤖 AI Behavior connected to Animation Blender')
    } else {
      // Retry connection after a short delay
      setTimeout(() => this.connectToAnimationBlender(), 500)
    }
  }

  /**
   * Stop the AI behavior system
   */
  stop(): void {
    if (!this.isActive) return

    this.isActive = false
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    console.log('AI Behavior System stopped')
  }

  /**
   * Set the behavior profile for the character
   */
  setBehaviorProfile(profileId: string): boolean {
    const profile = getBehaviorProfile(profileId)
    if (!profile) {
      console.warn(`Behavior profile '${profileId}' not found`)
      return false
    }

    this.state.currentProfile = profile
    this.decisionEngine.setBehaviorProfile(profile)
    
    console.log(`Behavior profile set to: ${profile.name}`)
    return true
  }

  /**
   * Add a context event (user interaction, audio input, etc.)
   */
  addContext(context: Omit<Context, 'timestamp'>): void {
    const ctx: Context = { ...context, timestamp: Date.now() }
    this.contextAnalyzer.addContext(ctx)
    this.state.lastInteractionTime = Date.now()

    if (ctx.type === ContextType.INTERACTION) {
      this.state.idleStartTime = Date.now()
    }
  }

  /**
   * Add audio context from microphone input
   */
  addAudioContext(audioLevel: number, frequency?: number): void {
    this.contextAnalyzer.analyzeAudioContext(audioLevel, frequency)
    this.state.lastInteractionTime = Date.now()
  }

  /**
   * Add user interaction context
   */
  addInteractionContext(
    interactionType: 'click' | 'hover' | 'focus' | 'scroll',
    target?: string,
    duration?: number
  ): void {
    const interactionContext = this.contextAnalyzer.analyzeInteractionContext(
      interactionType,
      duration ?? 0.5
    )
    this.addContext(interactionContext)
  }

  /**
   * Get the current animation recommendation and execute it
   */
  getCurrentAnimationDecision(availableAnimations: string[]): AnimationDecision | null {
    if (!this.isActive || !this.state.currentProfile) {
      return null
    }

    const analysis = this.contextAnalyzer.analyzeCurrentContext()
    
    const decision = this.decisionEngine.makeDecision(
      analysis.primaryContext,
      analysis.intensity,
      analysis.confidence,
      analysis.activeContexts,
      availableAnimations
    )

    if (decision) {
      this.executeAnimationDecision(decision, analysis.intensity)
      this.recordInteraction(analysis.primaryContext, decision.animation)
      this.updateEmotionalMemory(analysis.primaryContext, analysis.intensity)
    }

    return decision
  }

  /**
   * Execute an animation decision using the connected animation blender
   */
  private executeAnimationDecision(decision: AnimationDecision, intensity: number): void {
    if (!this.animationBlender) return

    try {
      switch (decision.blendMode) {
        case BlendMode.REPLACE:
          this.animationBlender.blendToAnimation(decision.animation, decision.duration ? decision.duration / 1000 : 0.3)
          break
        
        case BlendMode.ADDITIVE:
          this.animationBlender.addGestureOverlay(
            decision.animation,
            Math.min(0.8, intensity + 0.2), // Weight based on intensity
            'add',
            0.2
          )
          this.trackGesture(decision.animation, decision.duration || 3000)
          break
        
        case BlendMode.OVERLAY:
          this.animationBlender.addGestureOverlay(
            decision.animation,
            Math.min(0.6, intensity),
            'overlay',
            0.1
          )
          this.trackGesture(decision.animation, decision.duration || 2000)
          break
        
        case BlendMode.INTERRUPT:
          // For urgent/high priority animations
          this.cleanupCurrentGestures()
          this.animationBlender.blendToAnimation(decision.animation, 0.1)
          break
      }

      console.log(`🤖 Executing animation: ${decision.animation} (${decision.blendMode}) - ${decision.reason}`)
    } catch (error) {
      console.warn('🤖 Failed to execute animation:', error)
    }
  }

  /**
   * Track gesture animations and auto-cleanup
   */
  private trackGesture(animationName: string, duration: number): void {
    this.currentGestures.add(animationName)
    
    // Clear any existing timeout for this gesture
    const existingTimeout = this.gestureTimeouts.get(animationName)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new cleanup timeout
    const timeoutId = window.setTimeout(() => {
      this.currentGestures.delete(animationName)
      this.gestureTimeouts.delete(animationName)
      
      if (this.animationBlender) {
        this.animationBlender.removeAdditiveLayer(animationName, 0.3)
      }
    }, duration)

    this.gestureTimeouts.set(animationName, timeoutId)
  }

  /**
   * Clean up all current gesture animations
   */
  private cleanupCurrentGestures(): void {
    this.currentGestures.forEach(gesture => {
      if (this.animationBlender) {
        this.animationBlender.removeAdditiveLayer(gesture, 0.1)
      }
    })
    
    this.gestureTimeouts.forEach(timeout => clearTimeout(timeout))
    this.currentGestures.clear()
    this.gestureTimeouts.clear()
  }

  /**
   * Get current behavior state
   */
  getBehaviorState(): BehaviorState {
    return {
      ...this.state,
      activeContexts: [...this.state.activeContexts],
      conversationState: { ...this.state.conversationState }
    }
  }

  /**
   * Get current conversation state
   */
  getConversationState(): ConversationState {
    return this.contextAnalyzer.getConversationState()
  }

  /**
   * Check if the system is currently active
   */
  isSystemActive(): boolean {
    return this.isActive
  }

  /**
   * Get available behavior profiles
   */
  getAvailableProfiles(): Array<{ id: string; name: string }> {
    const profiles = [
      { id: 'energetic_friendly', name: 'Energetic & Friendly' },
      { id: 'calm_professional', name: 'Calm & Professional' },
      { id: 'playful_mischievous', name: 'Playful & Mischievous' }
    ]
    return profiles
  }

  /**
   * Get current active gestures
   */
  getCurrentGestures(): string[] {
    return Array.from(this.currentGestures)
  }

  /**
   * Force trigger a specific animation with custom parameters
   */
  triggerAnimation(
    animationName: string, 
    blendMode: BlendMode = BlendMode.REPLACE,
    intensity: number = 0.8,
    duration?: number
  ): boolean {
    if (!this.animationBlender) {
      console.warn('🤖 Animation blender not connected')
      return false
    }

    const decision: AnimationDecision = {
      animation: animationName,
      priority: 8,
      reason: 'Manual trigger',
      blendMode,
      duration
    }

    this.executeAnimationDecision(decision, intensity)
    return true
  }

  /**
   * Get AI recommendation for current emotional state
   */
  getEmotionalRecommendation(): { animation: string; reason: string } | null {
    const recentEmotions = this.emotionalMemory
      .filter(e => Date.now() - e.timestamp < 30000) // Last 30 seconds
      .sort((a, b) => b.intensity - a.intensity)

    if (recentEmotions.length === 0) {
      return { animation: 'idle', reason: 'No recent emotional context' }
    }

    const dominantEmotion = recentEmotions[0]
    const animations = {
      [EmotionalTone.EXCITED]: ['jump_excited', 'dance_short', 'clap'],
      [EmotionalTone.POSITIVE]: ['wave', 'nod_enthusiastic', 'thumbs_up'],
      [EmotionalTone.CALM]: ['idle_professional', 'subtle_breathing'],
      [EmotionalTone.NEUTRAL]: ['idle', 'look_around'],
      [EmotionalTone.NEGATIVE]: ['idle_sad', 'look_down'],
      [EmotionalTone.CONFUSED]: ['head_tilt_curious', 'scratch_head']
    }

    const emotionAnimations = animations[dominantEmotion.emotion] || ['idle']
    const selectedAnimation = emotionAnimations[Math.floor(Math.random() * emotionAnimations.length)]

    return {
      animation: selectedAnimation,
      reason: `Emotional state: ${dominantEmotion.emotion} (intensity: ${dominantEmotion.intensity.toFixed(2)})`
    }
  }

  /**
   * Learn from user interactions to adapt behavior
   */
  private recordInteraction(contextType: ContextType, response: string): void {
    this.interactionHistory.push({
      type: contextType,
      timestamp: Date.now(),
      response
    })

    // Keep only recent history (last 100 interactions)
    if (this.interactionHistory.length > 100) {
      this.interactionHistory.shift()
    }

    // Update adaptation weights based on successful interactions
    const key = `${contextType}-${response}`
    const currentWeight = this.adaptationWeights.get(key) || 0
    this.adaptationWeights.set(key, currentWeight + 0.1)
  }

  /**
   * Update emotional memory for context awareness
   */
  private updateEmotionalMemory(_contextType: ContextType, intensity: number): void {
    const emotion = this.contextAnalyzer.analyzeEmotionalTone()
    
    this.emotionalMemory.push({
      emotion,
      timestamp: Date.now(),
      intensity
    })

    // Keep only recent emotional memory (last 50 entries)
    if (this.emotionalMemory.length > 50) {
      this.emotionalMemory.shift()
    }
  }

  /**
   * Get learning statistics for debugging
   */
  getLearningStats(): {
    interactionCount: number
    topResponses: Array<{ pattern: string; weight: number }>
    emotionalProfile: Record<EmotionalTone, number>
  } {
    const topResponses = Array.from(this.adaptationWeights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, weight]) => ({ pattern, weight }))

    const emotionalProfile = this.emotionalMemory.reduce((acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + entry.intensity
      return acc
    }, {} as Record<EmotionalTone, number>)

    return {
      interactionCount: this.interactionHistory.length,
      topResponses,
      emotionalProfile
    }
  }

  /**
   * Create smart animation trigger for external integration
   */
  createSmartAnimationTrigger() {
    return {
      /**
       * Add user interaction context to AI system
       */
      addInteraction: (type: 'click' | 'hover' | 'focus' | 'scroll', target?: string, duration?: number) => {
        this.addInteractionContext(type, target, duration)
      },
      
      /**
       * Add audio input to AI system
       */
      addAudio: (audioLevel: number, frequency?: number[]) => {
        this.addAudioContext(audioLevel, frequency)
      },
      
      /**
       * Manually trigger specific animation
       */
      triggerAnimation: (animationName: string, blendMode?: any, intensity?: number, duration?: number) => {
        return this.triggerAnimation(animationName, blendMode, intensity, duration)
      },
      
      /**
       * Get AI's emotional recommendation
       */
      getEmotionalRecommendation: () => {
        return this.getEmotionalRecommendation()
      },
      
      /**
       * Get current behavior state
       */
      getBehaviorState: () => {
        return this.getBehaviorState()
      },
      
      /**
       * Get learning statistics
       */
      getLearningStats: () => {
        return this.getLearningStats()
      },
      
      /**
       * Set behavior profile
       */
      setBehaviorProfile: (profileId: string) => {
        return this.setBehaviorProfile(profileId)
      },
      
      /**
       * Schedule animation for later execution
       */
      scheduleAnimation: (decision: any, delayMs?: number) => {
        this.scheduleAnimation(decision, delayMs)
      },
      
      /**
       * Get predictive analysis for upcoming context
       */
      getPredictiveAnalysis: () => {
        return this.getConversationState() // Access through conversation state for now
      },
      
      /**
       * Get environmental context assessment
       */
      getEnvironmentalContext: () => {
        // Access context analyzer through behavior system
        return this.contextAnalyzer.getEnvironmentalContext()
      },
      
      /**
       * Set environmental factors
       */
      setEnvironmentalFactors: (factors: any) => {
        this.contextAnalyzer.setEnvironmentalFactors(factors)
      }
    }
  }

  /**
   * Reset the entire system state
   */
  reset(): void {
    this.contextAnalyzer.reset()
    this.decisionEngine.reset()
    
    this.state.activeContexts = []
    this.state.lastDecision = null
    this.state.lastInteractionTime = Date.now()
    this.state.idleStartTime = Date.now()

    // Reset AI learning state
    this.emotionalMemory = []
    this.interactionHistory = []
    this.adaptationWeights.clear()
    this.cleanupCurrentGestures()

    console.log('AI Behavior System reset')
  }

  // Private methods

  private update(): void {
    if (!this.isActive) return

    // Update state with current analysis
    const analysis = this.contextAnalyzer.analyzeCurrentContext()
    this.state.activeContexts = analysis.activeContexts as any
    this.state.conversationState = this.contextAnalyzer.getConversationState()

    // Auto-trigger animations based on context changes
    this.handleAutoTriggers(analysis)

    // Check if we've been idle for a while
    const idleDuration = Date.now() - this.state.idleStartTime
    if (idleDuration > 30000) { // 30 seconds of idle
      // Add idle context if we haven't recently
      const recentIdleContext = this.state.activeContexts.find(
        c => c.type === ContextType.IDLE && (Date.now() - c.timestamp) < 10000
      )

      if (!recentIdleContext) {
        this.addContext({
          type: ContextType.IDLE,
          intensity: Math.min(0.8, idleDuration / 60000), // Increase intensity over time
          metadata: { idleDuration }
        })
      }
    }

    // Process animation queue
    this.processAnimationQueue()
  }

  /**
   * Handle automatic animation triggers based on context analysis
   */
  private handleAutoTriggers(analysis: any): void {
    if (!this.animationBlender || !this.state.currentProfile) return

    // Get available animations from the blender system
    const availableAnimations = ['idle', 'wave', 'nod', 'listen_active', 'dance_short', 'clap', 'thumbs_up']
    
    // Only trigger if context is strong enough and we're not already busy
    if (analysis.confidence > 0.6 && analysis.intensity > 0.4 && this.currentGestures.size < 2) {
      const decision = this.getCurrentAnimationDecision(availableAnimations)
      
      // If this is a different animation than what's currently playing, consider it
      if (decision && (!this.state.lastDecision || decision.animation !== this.state.lastDecision.animation)) {
        const timeSinceLastDecision = this.state.lastDecision ? 
          Date.now() - (this.state.lastDecision as any).timestamp || 0 : 
          Infinity
        
        // Ensure minimum time between major animation changes
        if (timeSinceLastDecision > 3000 || decision.priority > (this.state.lastDecision?.priority || 0) + 2) {
          this.state.lastDecision = { ...decision, timestamp: Date.now() } as any
        }
      }
    }
  }

  /**
   * Process queued animations for smooth execution
   */
  private processAnimationQueue(): void {
    if (this.animationQueue.length === 0) return

    const now = Date.now()
    const readyAnimations = this.animationQueue.filter(anim => {
      const delay = (anim as any).scheduledTime || now
      return now >= delay
    })

    readyAnimations.forEach(animation => {
      this.executeAnimationDecision(animation, 0.7)
      this.animationQueue = this.animationQueue.filter(a => a !== animation)
    })
  }

  /**
   * Schedule an animation to play after a delay
   */
  scheduleAnimation(decision: AnimationDecision, delayMs: number = 0): void {
    (decision as any).scheduledTime = Date.now() + delayMs
    this.animationQueue.push(decision)
  }
}

// Export a singleton instance for easy use throughout the app
export const aiBehaviorSystem = new AIBehaviorSystem()
