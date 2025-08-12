import { useMemo } from 'react'

// Personality and mood enumerations
export enum PersonalityPresetId {
  Friendly = 'friendly',
  Shy = 'shy',
  Excited = 'excited',
  Calm = 'calm',
  Playful = 'playful',
  Serious = 'serious',
  Curious = 'curious',
  Confident = 'confident'
}

export enum MoodId {
  Happy = 'happy',
  Sad = 'sad',
  Excited = 'excited',
  Anxious = 'anxious',
  Calm = 'calm',
  Playful = 'playful',
  Thoughtful = 'thoughtful',
  Energetic = 'energetic',
  Tired = 'tired',
  Focused = 'focused'
}

export interface PersonalityTraits {
  energy: number // 0-1
  sociability: number // 0-1
  curiosity: number // 0-1
  discipline: number // 0-1
  expressiveness: number // 0-1
  confidence: number // 0-1
}

export interface MoodState {
  mood: MoodId
  intensity: number // 0-1
}

export interface PersonalityConfig {
  preset: PersonalityPresetId
  baseMood: MoodState
  responsiveness: number // 0-1
  creativity: number // 0-1
}

export interface EnvironmentSnapshot {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  userInteraction: 'none' | 'hover' | 'click' | 'voice'
  audioLevel: number
  animationSpeed: number
  lastInteractionTime: number
  interactionFrequency: number
}

export interface BehaviorInfluence {
  energy: number
  socialEngagement: number
  animationModifier: number
}

export interface AnimationSuggestion {
  name: string
  weight: number // 0-1
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const PERSONALITY_PRESETS: Record<PersonalityPresetId, PersonalityTraits> = {
  [PersonalityPresetId.Friendly]: {
    energy: 0.7,
    sociability: 0.85,
    curiosity: 0.6,
    discipline: 0.55,
    expressiveness: 0.8,
    confidence: 0.7
  },
  [PersonalityPresetId.Shy]: {
    energy: 0.4,
    sociability: 0.3,
    curiosity: 0.5,
    discipline: 0.7,
    expressiveness: 0.35,
    confidence: 0.35
  },
  [PersonalityPresetId.Excited]: {
    energy: 0.9,
    sociability: 0.9,
    curiosity: 0.7,
    discipline: 0.45,
    expressiveness: 0.9,
    confidence: 0.65
  },
  [PersonalityPresetId.Calm]: {
    energy: 0.55,
    sociability: 0.5,
    curiosity: 0.6,
    discipline: 0.75,
    expressiveness: 0.45,
    confidence: 0.65
  },
  [PersonalityPresetId.Playful]: {
    energy: 0.8,
    sociability: 0.7,
    curiosity: 0.75,
    discipline: 0.45,
    expressiveness: 0.85,
    confidence: 0.6
  },
  [PersonalityPresetId.Serious]: {
    energy: 0.6,
    sociability: 0.45,
    curiosity: 0.55,
    discipline: 0.85,
    expressiveness: 0.35,
    confidence: 0.7
  },
  [PersonalityPresetId.Curious]: {
    energy: 0.7,
    sociability: 0.6,
    curiosity: 0.9,
    discipline: 0.6,
    expressiveness: 0.6,
    confidence: 0.55
  },
  [PersonalityPresetId.Confident]: {
    energy: 0.8,
    sociability: 0.7,
    curiosity: 0.65,
    discipline: 0.65,
    expressiveness: 0.7,
    confidence: 0.9
  }
}

const MOOD_INFLUENCE: Record<MoodId, BehaviorInfluence> = {
  [MoodId.Happy]: { energy: 0.2, socialEngagement: 0.3, animationModifier: 1.2 },
  [MoodId.Sad]: { energy: -0.3, socialEngagement: -0.4, animationModifier: 0.7 },
  [MoodId.Excited]: { energy: 0.4, socialEngagement: 0.5, animationModifier: 1.5 },
  [MoodId.Anxious]: { energy: 0.1, socialEngagement: -0.2, animationModifier: 0.8 },
  [MoodId.Calm]: { energy: 0.0, socialEngagement: 0.1, animationModifier: 1.0 },
  [MoodId.Playful]: { energy: 0.2, socialEngagement: 0.2, animationModifier: 1.3 },
  [MoodId.Thoughtful]: { energy: -0.05, socialEngagement: -0.05, animationModifier: 0.95 },
  [MoodId.Energetic]: { energy: 0.3, socialEngagement: 0.1, animationModifier: 1.2 },
  [MoodId.Tired]: { energy: -0.4, socialEngagement: -0.2, animationModifier: 0.7 },
  [MoodId.Focused]: { energy: 0.1, socialEngagement: -0.1, animationModifier: 1.05 }
}

export class PersonalitySystem {
  private traits: PersonalityTraits
  private mood: MoodState
  private config: PersonalityConfig

  constructor(config: Partial<PersonalityConfig> = {}) {
    const preset = config.preset ?? PersonalityPresetId.Friendly
    const baseMood: MoodState = config.baseMood ?? { mood: MoodId.Happy, intensity: 0.5 }
    this.traits = { ...PERSONALITY_PRESETS[preset] }
    this.mood = { ...baseMood }
    this.config = {
      preset,
      baseMood,
      responsiveness: config.responsiveness ?? 0.7,
      creativity: config.creativity ?? 0.5
    }
  }

  getPersonalityTraits(): PersonalityTraits { return { ...this.traits } }
  getMood(): MoodState { return { ...this.mood } }
  setMood(next: MoodState): void { this.mood = { ...next, intensity: clamp01(next.intensity) } }
  setPreset(preset: PersonalityPresetId): void { this.traits = { ...PERSONALITY_PRESETS[preset] }; this.config.preset = preset }

  computeInfluence(environment: EnvironmentSnapshot): BehaviorInfluence {
    const baseEnergy = this.traits.energy
    const baseSocial = this.traits.sociability
    const moodInf = MOOD_INFLUENCE[this.mood.mood]

    // Environment effects
    const interactionBoost = clamp01(environment.interactionFrequency * 0.5)
    const audioBoost = clamp01(environment.audioLevel * 0.3)

    const energy = clamp01(baseEnergy + moodInf.energy * this.mood.intensity + interactionBoost + audioBoost)
    const socialEngagement = clamp01(baseSocial + moodInf.socialEngagement * this.mood.intensity + interactionBoost * 0.5)
    const animationModifier = Math.max(0.5, Math.min(1.5, moodInf.animationModifier))

    return { energy, socialEngagement, animationModifier }
  }

  suggestAnimations(available: string[], env: EnvironmentSnapshot): AnimationSuggestion[] {
    const influence = this.computeInfluence(env)
    const suggestions: AnimationSuggestion[] = []

    const prefer = (name: string, weight: number) => {
      if (available.includes(name)) suggestions.push({ name, weight: clamp01(weight) })
    }

    // Preferences by preset
    switch (this.config.preset) {
      case PersonalityPresetId.Friendly:
        prefer('wave', 0.7 * influence.socialEngagement)
        prefer('smile', 0.6 * influence.animationModifier)
        prefer('nod', 0.5)
        break
      case PersonalityPresetId.Shy:
        prefer('idle', 0.6)
        prefer('look_away', 0.5)
        prefer('fidget', 0.4)
        break
      case PersonalityPresetId.Excited:
        prefer('jump', 0.8 * influence.energy)
        prefer('wave', 0.6)
        prefer('dance', 0.7)
        break
      case PersonalityPresetId.Calm:
        prefer('idle', 0.7)
        prefer('breathe', 0.6)
        prefer('meditate', 0.5)
        break
      case PersonalityPresetId.Playful:
        prefer('dance', 0.7)
        prefer('spin', 0.6)
        prefer('wave', 0.5)
        break
      case PersonalityPresetId.Serious:
        prefer('idle', 0.7)
        prefer('nod', 0.6)
        prefer('point', 0.5)
        break
      case PersonalityPresetId.Curious:
        prefer('look_around', 0.7)
        prefer('point', 0.6)
        prefer('lean', 0.5)
        break
      case PersonalityPresetId.Confident:
        prefer('wave', 0.7)
        prefer('stand_tall', 0.6)
        prefer('point', 0.5)
        break
    }

    // Sort by weight descending
    return suggestions.sort((a, b) => b.weight - a.weight)
  }
}

// Optional React helper hook for memoized instance
export function usePersonalitySystem(config: Partial<PersonalityConfig> = {}) {
  return useMemo(() => new PersonalitySystem(config), [
    config.preset,
    config.baseMood?.mood,
    config.baseMood?.intensity,
    config.responsiveness,
    config.creativity
  ])
}