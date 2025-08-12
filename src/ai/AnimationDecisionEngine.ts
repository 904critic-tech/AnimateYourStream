import { 
  BehaviorProfile, 
  Context, 
  ContextType, 
  AnimationDecision, 
  BlendMode,
  WeightedAnimation,
  ResponsePattern 
} from './types'

/**
 * Animation Decision Engine
 * 
 * Takes context analysis results and behavior profiles to make intelligent 
 * decisions about which animations to play and how to blend them.
 */
// Internal type for timestamped decisions
interface TimestampedAnimationDecision extends AnimationDecision {
  timestamp: number
}

export class AnimationDecisionEngine {
  private currentProfile: BehaviorProfile | null = null
  private lastDecision: AnimationDecision | null = null
  private animationHistory: TimestampedAnimationDecision[] = []
  private cooldowns = new Map<string, number>()

  private readonly DECISION_HISTORY_LIMIT = 20
  private readonly MIN_ANIMATION_DURATION = 1000 // 1 second

  /**
   * Set the current behavior profile
   */
  setBehaviorProfile(profile: BehaviorProfile): void {
    this.currentProfile = profile
  }

  /**
   * Make an animation decision based on current context
   */
  makeDecision(
    primaryContext: ContextType,
    intensity: number,
    confidence: number,
    activeContexts: Context[],
    availableAnimations: string[]
  ): AnimationDecision | null {
    if (!this.currentProfile) {
      return this.getDefaultIdleDecision(availableAnimations)
    }

    // Check if we should interrupt current animation
    const shouldInterrupt = this.shouldInterruptCurrentAnimation(
      primaryContext, 
      intensity, 
      confidence
    )

    if (!shouldInterrupt && this.isAnimationStillPlaying()) {
      return null // Keep current animation playing
    }

    // Find applicable response patterns
    const applicablePatterns = this.findApplicablePatterns(
      primaryContext,
      intensity,
      activeContexts
    )

    if (applicablePatterns.length === 0) {
      return this.getIdleDecision(availableAnimations)
    }

    // Select the best pattern and animation
    const selectedPattern = this.selectBestPattern(applicablePatterns, intensity)
    const selectedAnimation = this.selectAnimation(
      selectedPattern.animations,
      availableAnimations
    )

    if (!selectedAnimation) {
      return this.getIdleDecision(availableAnimations)
    }

    const decision: AnimationDecision = {
      animation: selectedAnimation.name,
      priority: this.calculatePriority(primaryContext, intensity, confidence),
      reason: `${primaryContext} context with ${(intensity * 100).toFixed(0)}% intensity`,
      blendMode: this.determineBlendMode(primaryContext, intensity),
      duration: selectedAnimation.duration
    }

    this.recordDecision(decision)
    return decision
  }

  /**
   * Get the current behavior profile
   */
  getCurrentProfile(): BehaviorProfile | null {
    return this.currentProfile
  }

  /**
   * Get animation decision (alias for makeDecision for compatibility)
   */
  getAnimationDecision(
    availableAnimations: string[],
    context: {
      primaryContext: ContextType
      intensity: number
      confidence: number
    }
  ): AnimationDecision | null {
    return this.makeDecision(
      context.primaryContext,
      context.intensity,
      context.confidence,
      [], // activeContexts - empty for now
      availableAnimations
    )
  }

  /**
   * Get recent animation decisions
   */
  getDecisionHistory(): AnimationDecision[] {
    return this.animationHistory.map(({ timestamp, ...decision }) => decision)
  }

  /**
   * Check if a specific animation is on cooldown
   */
  isOnCooldown(animationName: string): boolean {
    const cooldownEnd = this.cooldowns.get(animationName)
    return cooldownEnd ? Date.now() < cooldownEnd : false
  }

  /**
   * Reset decision state
   */
  reset(): void {
    this.lastDecision = null
    this.animationHistory = []
    this.cooldowns.clear()
  }

  // Private helper methods

  private findApplicablePatterns(
    primaryContext: ContextType,
    intensity: number,
    activeContexts: Context[]
  ): ResponsePattern[] {
    if (!this.currentProfile) return []

    return this.currentProfile.responsePatterns.filter(pattern => {
      // Check if context type matches
      if (pattern.contextTrigger !== primaryContext) return false

      // Check intensity threshold
      if (intensity < pattern.intensityThreshold) return false

      // Check cooldown
      const patternKey = `${pattern.contextTrigger}_${pattern.intensityThreshold}`
      if (this.isOnCooldown(patternKey)) return false

      // Check custom conditions
      if (pattern.conditions) {
        const relevantContext = activeContexts.find(c => c.type === primaryContext)
        if (!relevantContext || !pattern.conditions(relevantContext)) {
          return false
        }
      }

      return true
    })
  }

  private selectBestPattern(
    patterns: ResponsePattern[],
    intensity: number
  ): ResponsePattern {
    // Score patterns based on how well they match the current situation
    const scoredPatterns = patterns.map(pattern => ({
      pattern,
      score: this.scorePattern(pattern, intensity)
    }))

    // Sort by score and return the best one
    scoredPatterns.sort((a, b) => b.score - a.score)
    return scoredPatterns[0].pattern
  }

  private scorePattern(pattern: ResponsePattern, intensity: number): number {
    let score = 0

    // Base score from intensity match
    const intensityMatch = 1 - Math.abs(pattern.intensityThreshold - intensity)
    score += intensityMatch * 10

    // Bonus for patterns that haven't been used recently
    const recentUsage = this.animationHistory.filter(
      decision => decision.reason.includes(pattern.contextTrigger)
    ).length

    score += Math.max(0, 5 - recentUsage) // Bonus for less recently used patterns

    // Personality compatibility
    if (this.currentProfile) {
      score += this.calculatePersonalityCompatibility(pattern) * 5
    }

    return score
  }

  private selectAnimation(
    weightedAnimations: WeightedAnimation[],
    availableAnimations: string[]
  ): WeightedAnimation | null {
    // Filter to only available animations that aren't on cooldown
    const validAnimations = weightedAnimations.filter(anim => 
      availableAnimations.includes(anim.name) && !this.isOnCooldown(anim.name)
    )

    if (validAnimations.length === 0) return null

    // Weighted random selection
    const totalWeight = validAnimations.reduce((sum, anim) => sum + anim.weight, 0)
    let random = Math.random() * totalWeight

    for (const animation of validAnimations) {
      random -= animation.weight
      if (random <= 0) {
        return animation
      }
    }

    // Fallback to first animation
    return validAnimations[0]
  }

  private calculatePriority(
    context: ContextType,
    intensity: number,
    confidence: number
  ): number {
    const basePriority = {
      [ContextType.INTERACTION]: 8,
      [ContextType.AUDIO_INPUT]: 7,
      [ContextType.CONVERSATION]: 6,
      [ContextType.EMOTIONAL_STATE]: 5,
      [ContextType.VISUAL_FOCUS]: 4,
      [ContextType.SYSTEM_EVENT]: 3,
      [ContextType.IDLE]: 1
    }

    const base = basePriority[context] || 1
    const intensityBonus = intensity * 2
    const confidenceBonus = confidence * 1

    return Math.min(10, Math.max(1, base + intensityBonus + confidenceBonus))
  }

  private determineBlendMode(context: ContextType, intensity: number): BlendMode {
    // High intensity interactions should interrupt
    if (intensity > 0.8) {
      return BlendMode.INTERRUPT
    }

    // Audio input often works well as overlay
    if (context === ContextType.AUDIO_INPUT) {
      return BlendMode.OVERLAY
    }

    // Most other contexts can replace smoothly
    if (context === ContextType.INTERACTION || context === ContextType.CONVERSATION) {
      return BlendMode.REPLACE
    }

    // Default to additive for subtle contexts
    return BlendMode.ADDITIVE
  }

  private shouldInterruptCurrentAnimation(
    context: ContextType,
    intensity: number,
    confidence: number
  ): boolean {
    if (!this.lastDecision) return true

    const currentPriority = this.lastDecision.priority
    const newPriority = this.calculatePriority(context, intensity, confidence)

    // Interrupt if new priority is significantly higher
    if (newPriority > currentPriority + 2) return true

    // Interrupt if current animation has been playing for a while
    const timeSinceLastDecision = this.lastDecision ? 
      Date.now() - (this.animationHistory[this.animationHistory.length - 1]?.timestamp || 0) : 
      Infinity

    if (timeSinceLastDecision > (this.lastDecision.duration || 5000)) {
      return true
    }

    // Don't interrupt for low priority/intensity
    if (newPriority < 3 || intensity < 0.3) return false

    return false
  }

  private isAnimationStillPlaying(): boolean {
    if (!this.lastDecision) return false

    const lastDecisionTime = this.animationHistory.length > 0 ? 
      this.animationHistory[this.animationHistory.length - 1].timestamp || 0 : 
      0

    const elapsed = Date.now() - lastDecisionTime
    const expectedDuration = this.lastDecision.duration || this.MIN_ANIMATION_DURATION

    return elapsed < expectedDuration
  }

  private getIdleDecision(availableAnimations: string[]): AnimationDecision | null {
    if (!this.currentProfile || availableAnimations.length === 0) {
      return this.getDefaultIdleDecision(availableAnimations)
    }

    const idleAnimations = this.currentProfile.animationPreferences.idleAnimations
    const availableIdle = idleAnimations.filter(anim => 
      availableAnimations.includes(anim) && !this.isOnCooldown(anim)
    )

    if (availableIdle.length === 0) {
      return this.getDefaultIdleDecision(availableAnimations)
    }

    const selectedIdle = availableIdle[Math.floor(Math.random() * availableIdle.length)]

    const decision: AnimationDecision = {
      animation: selectedIdle,
      priority: 1,
      reason: 'Idle behavior',
      blendMode: BlendMode.REPLACE,
      duration: 5000 // 5 second default idle
    }

    this.recordDecision(decision)
    return decision
  }

  private getDefaultIdleDecision(availableAnimations: string[]): AnimationDecision | null {
    const defaultIdle = availableAnimations.find(anim => 
      anim.toLowerCase().includes('idle') && !this.isOnCooldown(anim)
    )

    if (!defaultIdle) return null

    const decision: AnimationDecision = {
      animation: defaultIdle,
      priority: 1,
      reason: 'Default idle',
      blendMode: BlendMode.REPLACE,
      duration: 5000
    }

    this.recordDecision(decision)
    return decision
  }

  private recordDecision(decision: AnimationDecision): void {
    const timestampedDecision: TimestampedAnimationDecision = {
      ...decision,
      timestamp: Date.now()
    }

    this.lastDecision = decision
    this.animationHistory.push(timestampedDecision)

    // Trim history
    if (this.animationHistory.length > this.DECISION_HISTORY_LIMIT) {
      this.animationHistory.shift()
    }

    // Set cooldown for this animation
    const cooldownDuration = (decision.duration || this.MIN_ANIMATION_DURATION) * 0.5
    this.cooldowns.set(decision.animation, Date.now() + cooldownDuration)

    // Clean up expired cooldowns
    this.cleanupCooldowns()
  }

  private calculatePersonalityCompatibility(pattern: ResponsePattern): number {
    if (!this.currentProfile) return 0

    const personality = this.currentProfile.personality
    let compatibility = 0

    // Different context types have different personality preferences
    switch (pattern.contextTrigger) {
      case ContextType.INTERACTION:
        compatibility += personality.friendliness * 0.4
        compatibility += personality.attentiveness * 0.6
        break
      
      case ContextType.AUDIO_INPUT:
        compatibility += personality.expressiveness * 0.5
        compatibility += personality.energy * 0.3
        compatibility += personality.attentiveness * 0.2
        break
      
      case ContextType.CONVERSATION:
        compatibility += personality.friendliness * 0.6
        compatibility += personality.expressiveness * 0.4
        break
      
      default:
        compatibility = 0.5 // Neutral compatibility
    }

    return Math.min(1, Math.max(0, compatibility))
  }

  private cleanupCooldowns(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cooldowns.forEach((expiry, key) => {
      if (now >= expiry) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cooldowns.delete(key))
  }
}
