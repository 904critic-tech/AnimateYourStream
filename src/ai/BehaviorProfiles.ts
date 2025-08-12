import { 
  BehaviorProfile, 
  ContextType 
} from './types'

/**
 * Predefined behavior profiles for different character personalities
 * 
 * These profiles define how different personality types should respond
 * to various contexts with appropriate animations and timing.
 */

/**
 * Friendly and energetic character that responds enthusiastically to interactions
 */
export const ENERGETIC_FRIENDLY: BehaviorProfile = {
  id: 'energetic_friendly',
  name: 'Energetic & Friendly',
  personality: {
    energy: 0.9,
    friendliness: 0.95,
    expressiveness: 0.85,
    attentiveness: 0.8,
    playfulness: 0.9
  },
  animationPreferences: {
    idleAnimations: ['idle', 'idle_happy', 'idle_bounce', 'look_around', 'breathing'],
    greetingAnimations: ['wave', 'big_wave', 'jump_wave', 'excited_hello', 'peace_sign'],
    responseAnimations: ['nod_enthusiastic', 'clap', 'thumbs_up', 'dance_short', 'jump_excited'],
    transitionSpeed: 0.8,
    blendDuration: 300
  },
  responsePatterns: [
    {
      contextTrigger: ContextType.INTERACTION,
      intensityThreshold: 0.3,
      cooldownMs: 2000,
      animations: [
        { name: 'wave', weight: 0.4 },
        { name: 'nod_enthusiastic', weight: 0.3 },
        { name: 'thumbs_up', weight: 0.2 },
        { name: 'clap', weight: 0.1 }
      ]
    },
    {
      contextTrigger: ContextType.AUDIO_INPUT,
      intensityThreshold: 0.2,
      cooldownMs: 1500,
      animations: [
        { name: 'listen_active', weight: 0.5 },
        { name: 'nod_agreement', weight: 0.3 },
        { name: 'lean_forward', weight: 0.2 }
      ]
    },
    {
      contextTrigger: ContextType.CONVERSATION,
      intensityThreshold: 0.4,
      cooldownMs: 3000,
      animations: [
        { name: 'talk_animated', weight: 0.4 },
        { name: 'gesture_explain', weight: 0.3 },
        { name: 'nod_agreement', weight: 0.3 }
      ]
    }
  ]
}

/**
 * Calm and professional character with subtle, measured responses
 */
export const CALM_PROFESSIONAL: BehaviorProfile = {
  id: 'calm_professional',
  name: 'Calm & Professional',
  personality: {
    energy: 0.3,
    friendliness: 0.7,
    expressiveness: 0.4,
    attentiveness: 0.95,
    playfulness: 0.2
  },
  animationPreferences: {
    idleAnimations: ['idle', 'idle_professional', 'subtle_breathing', 'look_forward', 'standing_straight'],
    greetingAnimations: ['nod_polite', 'small_wave', 'bow_slight', 'professional_greeting'],
    responseAnimations: ['nod_understanding', 'gesture_subtle', 'lean_listen', 'thoughtful_pose'],
    transitionSpeed: 0.3,
    blendDuration: 800
  },
  responsePatterns: [
    {
      contextTrigger: ContextType.INTERACTION,
      intensityThreshold: 0.5,
      cooldownMs: 4000,
      animations: [
        { name: 'nod_polite', weight: 0.6 },
        { name: 'small_wave', weight: 0.3 },
        { name: 'gesture_acknowledgment', weight: 0.1 }
      ]
    },
    {
      contextTrigger: ContextType.AUDIO_INPUT,
      intensityThreshold: 0.3,
      cooldownMs: 2000,
      animations: [
        { name: 'listen_attentive', weight: 0.7 },
        { name: 'nod_understanding', weight: 0.3 }
      ]
    },
    {
      contextTrigger: ContextType.CONVERSATION,
      intensityThreshold: 0.6,
      cooldownMs: 5000,
      animations: [
        { name: 'speak_measured', weight: 0.5 },
        { name: 'gesture_explain_calm', weight: 0.3 },
        { name: 'pause_thoughtful', weight: 0.2 }
      ]
    }
  ]
}

/**
 * Playful and mischievous character with dynamic, fun responses
 */
export const PLAYFUL_MISCHIEVOUS: BehaviorProfile = {
  id: 'playful_mischievous',
  name: 'Playful & Mischievous',
  personality: {
    energy: 0.85,
    friendliness: 0.8,
    expressiveness: 0.95,
    attentiveness: 0.6,
    playfulness: 1.0
  },
  animationPreferences: {
    idleAnimations: ['idle_bounce', 'idle_mischief', 'look_around_curious', 'fidget_playful'],
    greetingAnimations: ['wave_big', 'jump_hello', 'peace_sign', 'wink'],
    responseAnimations: ['laugh', 'dance_short', 'spin', 'jump_excited'],
    transitionSpeed: 0.9,
    blendDuration: 200
  },
  responsePatterns: [
    {
      contextTrigger: ContextType.INTERACTION,
      intensityThreshold: 0.2,
      cooldownMs: 1500,
      animations: [
        { name: 'jump_excited', weight: 0.3 },
        { name: 'dance_short', weight: 0.3 },
        { name: 'spin', weight: 0.2 },
        { name: 'laugh', weight: 0.2 }
      ]
    },
    {
      contextTrigger: ContextType.AUDIO_INPUT,
      intensityThreshold: 0.1,
      cooldownMs: 1000,
      animations: [
        { name: 'head_tilt_curious', weight: 0.4 },
        { name: 'bounce_listen', weight: 0.4 },
        { name: 'ear_cup', weight: 0.2 }
      ]
    }
  ]
}

/**
 * Collection of all available behavior profiles
 */
export const BEHAVIOR_PROFILES: BehaviorProfile[] = [
  ENERGETIC_FRIENDLY,
  CALM_PROFESSIONAL,
  PLAYFUL_MISCHIEVOUS
]

/**
 * Get a behavior profile by ID
 */
export function getBehaviorProfile(id: string): BehaviorProfile | null {
  return BEHAVIOR_PROFILES.find(profile => profile.id === id) || null
}

/**
 * Get all available behavior profile IDs and names
 */
export function getBehaviorProfileOptions(): Array<{ id: string; name: string }> {
  return BEHAVIOR_PROFILES.map(profile => ({
    id: profile.id,
    name: profile.name
  }))
}
