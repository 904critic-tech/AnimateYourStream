export interface PersonalityEngineOptions {
  personalityType: string
  learningRate: number
  adaptability: boolean
  initialMood?: string
  moodStability?: number
  personalityTraits?: PersonalityTraits
}

export interface PersonalityTraits {
  energy: number // 0-1 (calm to energetic)
  friendliness: number // 0-1 (reserved to outgoing)
  expressiveness: number // 0-1 (subtle to dramatic)
  attentiveness: number // 0-1 (distracted to focused)
  playfulness: number // 0-1 (serious to playful)
  confidence: number // 0-1 (shy to confident)
}

export interface MoodState {
  currentMood: string
  intensity: number // 0-1
  stability: number // 0-1 (how quickly mood changes)
  lastUpdate: number
  influences: MoodInfluence[]
}

export interface MoodInfluence {
  type: 'environmental' | 'interaction' | 'time' | 'personality'
  value: number // -1 to 1
  duration: number // how long this influence lasts
  timestamp: number
}

export interface PersonalityAdaptation {
  trait: keyof PersonalityTraits
  change: number // -1 to 1
  reason: string
  timestamp: number
}

export class PersonalityEngine {
  private options: PersonalityEngineOptions
  private currentTraits: PersonalityTraits
  private moodState: MoodState
  private adaptationHistory: PersonalityAdaptation[] = []
  private interactionHistory: Array<{ type: string, timestamp: number, impact: number }> = []

  constructor(options: PersonalityEngineOptions) {
    this.options = options
    
    // Initialize personality traits
    this.currentTraits = options.personalityTraits || this.getDefaultTraits(options.personalityType)
    
    // Initialize mood state
    this.moodState = {
      currentMood: options.initialMood || 'neutral',
      intensity: 0.5,
      stability: options.moodStability || 0.7,
      lastUpdate: Date.now(),
      influences: []
    }
  }

  // Get current personality information
  getCurrentPersonality(): string {
    return this.options.personalityType
  }

  getCurrentTraits(): PersonalityTraits {
    return { ...this.currentTraits }
  }

  getCurrentMood(): MoodState {
    return { ...this.moodState }
  }

  // Adjust learning rate
  adjustLearning(delta: number): void {
    this.options.learningRate = Math.max(0, Math.min(1, this.options.learningRate + delta))
  }

  // Update mood based on various influences
  updateMood(influence: MoodInfluence): void {
    const now = Date.now()
    
    // Add new influence
    this.moodState.influences.push({
      ...influence,
      timestamp: now
    })

    // Clean up expired influences
    this.moodState.influences = this.moodState.influences.filter(
      inf => now - inf.timestamp < inf.duration
    )

    // Calculate new mood intensity
    let totalInfluence = 0
    let totalWeight = 0

    for (const inf of this.moodState.influences) {
      const age = now - inf.timestamp
      const weight = Math.max(0, 1 - (age / inf.duration))
      totalInfluence += inf.value * weight
      totalWeight += weight
    }

    if (totalWeight > 0) {
      const newIntensity = Math.max(0, Math.min(1, this.moodState.intensity + (totalInfluence / totalWeight) * 0.1))
      
      // Apply mood stability
      const stabilityFactor = this.moodState.stability
      this.moodState.intensity = this.moodState.intensity * stabilityFactor + newIntensity * (1 - stabilityFactor)
    }

    // Determine mood state based on intensity
    this.moodState.currentMood = this.getMoodFromIntensity(this.moodState.intensity)
    this.moodState.lastUpdate = now
  }

  // Adapt personality based on interactions
  adaptPersonality(trait: keyof PersonalityTraits, change: number, reason: string): void {
    if (!this.options.adaptability) return

    const adaptation: PersonalityAdaptation = {
      trait,
      change: Math.max(-1, Math.min(1, change)),
      reason,
      timestamp: Date.now()
    }

    this.adaptationHistory.push(adaptation)

    // Apply change with learning rate
    const currentValue = this.currentTraits[trait]
    const newValue = Math.max(0, Math.min(1, currentValue + change * this.options.learningRate))
    this.currentTraits[trait] = newValue

    // Limit adaptation history
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory.shift()
    }
  }

  // Record interaction for personality learning
  recordInteraction(type: string, impact: number): void {
    this.interactionHistory.push({
      type,
      timestamp: Date.now(),
      impact: Math.max(-1, Math.min(1, impact))
    })

    // Limit interaction history
    if (this.interactionHistory.length > 50) {
      this.interactionHistory.shift()
    }

    // Learn from interaction
    this.learnFromInteraction(type, impact)
  }

  // Get personality-based animation preferences
  getAnimationPreferences(): string[] {
    const preferences: string[] = []
    
    if (this.currentTraits.energy > 0.7) {
      preferences.push('energetic', 'bounce', 'jump')
    }
    if (this.currentTraits.friendliness > 0.7) {
      preferences.push('wave', 'smile', 'greet')
    }
    if (this.currentTraits.expressiveness > 0.7) {
      preferences.push('gesture', 'point', 'explain')
    }
    if (this.currentTraits.playfulness > 0.7) {
      preferences.push('dance', 'spin', 'play')
    }
    if (this.currentTraits.confidence > 0.7) {
      preferences.push('stand_tall', 'pose', 'present')
    }

    return preferences.length > 0 ? preferences : ['idle', 'breathe']
  }

  // Get response timing based on personality
  getResponseTiming(): number {
    const baseTiming = 1000 // 1 second base
    const energyFactor = 1 - this.currentTraits.energy * 0.5 // Energetic = faster
    const attentivenessFactor = 1 - this.currentTraits.attentiveness * 0.3 // Attentive = faster
    
    return baseTiming * energyFactor * attentivenessFactor
  }

  // Get interaction style based on personality
  getInteractionStyle(): 'proactive' | 'reactive' | 'balanced' {
    const energy = this.currentTraits.energy
    const friendliness = this.currentTraits.friendliness
    
    if (energy > 0.7 && friendliness > 0.7) return 'proactive'
    if (energy < 0.3 && friendliness < 0.3) return 'reactive'
    return 'balanced'
  }

  // Private helper methods
  private getDefaultTraits(personalityType: string): PersonalityTraits {
    const defaults: Record<string, PersonalityTraits> = {
      'friendly': { energy: 0.7, friendliness: 0.9, expressiveness: 0.6, attentiveness: 0.8, playfulness: 0.5, confidence: 0.6 },
      'shy': { energy: 0.4, friendliness: 0.3, expressiveness: 0.2, attentiveness: 0.9, playfulness: 0.3, confidence: 0.2 },
      'excited': { energy: 0.9, friendliness: 0.8, expressiveness: 0.9, attentiveness: 0.6, playfulness: 0.8, confidence: 0.7 },
      'calm': { energy: 0.5, friendliness: 0.6, expressiveness: 0.4, attentiveness: 0.8, playfulness: 0.4, confidence: 0.5 },
      'playful': { energy: 0.8, friendliness: 0.7, expressiveness: 0.8, attentiveness: 0.5, playfulness: 0.9, confidence: 0.6 },
      'serious': { energy: 0.6, friendliness: 0.4, expressiveness: 0.3, attentiveness: 0.9, playfulness: 0.2, confidence: 0.8 },
      'curious': { energy: 0.7, friendliness: 0.5, expressiveness: 0.6, attentiveness: 0.9, playfulness: 0.6, confidence: 0.5 },
      'confident': { energy: 0.8, friendliness: 0.7, expressiveness: 0.7, attentiveness: 0.7, playfulness: 0.5, confidence: 0.9 }
    }

    return defaults[personalityType] || defaults['friendly']
  }

  private getMoodFromIntensity(intensity: number): string {
    if (intensity > 0.8) return 'excited'
    if (intensity > 0.6) return 'happy'
    if (intensity > 0.4) return 'neutral'
    if (intensity > 0.2) return 'thoughtful'
    return 'tired'
  }

  private learnFromInteraction(type: string, impact: number): void {
    if (!this.options.adaptability) return

    // Learn based on interaction type and impact
    switch (type) {
      case 'voice_input':
        if (impact > 0.5) {
          this.adaptPersonality('attentiveness', 0.1, 'Positive voice interaction')
        }
        break
      case 'user_engagement':
        if (impact > 0.3) {
          this.adaptPersonality('friendliness', 0.05, 'User engagement')
        }
        break
      case 'animation_response':
        if (impact > 0.4) {
          this.adaptPersonality('expressiveness', 0.08, 'Successful animation response')
        }
        break
    }
  }

  // Get personality summary for debugging
  getPersonalitySummary(): object {
    return {
      type: this.options.personalityType,
      traits: this.currentTraits,
      mood: this.moodState,
      learningRate: this.options.learningRate,
      adaptability: this.options.adaptability,
      adaptationCount: this.adaptationHistory.length,
      interactionCount: this.interactionHistory.length
    }
  }
}

export default PersonalityEngine
