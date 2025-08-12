// Core types for AI behavior system

export interface Context {
  timestamp: number
  type: ContextType
  intensity: number // 0-1
  duration?: number // in milliseconds
  metadata?: Record<string, any>
}

export enum ContextType {
  IDLE = 'idle',
  INTERACTION = 'interaction',
  AUDIO_INPUT = 'audio_input',
  VISUAL_FOCUS = 'visual_focus',
  EMOTIONAL_STATE = 'emotional_state',
  CONVERSATION = 'conversation',
  SYSTEM_EVENT = 'system_event'
}

export interface BehaviorProfile {
  id: string
  name: string
  personality: PersonalityTraits
  animationPreferences: AnimationPreferences
  responsePatterns: ResponsePattern[]
}

export interface PersonalityTraits {
  energy: number // 0-1 (calm to energetic)
  friendliness: number // 0-1 (reserved to outgoing)
  expressiveness: number // 0-1 (subtle to dramatic)
  attentiveness: number // 0-1 (distracted to focused)
  playfulness: number // 0-1 (serious to playful)
}

export interface AnimationPreferences {
  idleAnimations: string[]
  greetingAnimations: string[]
  responseAnimations: string[]
  transitionSpeed: number // 0-1
  blendDuration: number // in milliseconds
}

export interface ResponsePattern {
  contextTrigger: ContextType
  intensityThreshold: number
  cooldownMs: number
  animations: WeightedAnimation[]
  conditions?: (context: Context) => boolean
}

export interface WeightedAnimation {
  name: string
  weight: number // 0-1, higher = more likely to be selected
  duration?: number
  blendIn?: number
  blendOut?: number
}

export interface AnimationDecision {
  animation: string
  priority: number // 0-10, higher = more important
  reason: string
  blendMode: BlendMode
  duration?: number
}

export enum BlendMode {
  REPLACE = 'replace',
  ADDITIVE = 'additive',
  OVERLAY = 'overlay',
  INTERRUPT = 'interrupt'
}

export interface BehaviorState {
  currentProfile: BehaviorProfile | null
  activeContexts: Context[]
  lastDecision: AnimationDecision | null
  lastInteractionTime: number
  idleStartTime: number
  conversationState: ConversationState
}

export interface ConversationState {
  isActive: boolean
  speakerCount: number
  lastSpeechTime: number
  emotionalTone: EmotionalTone
  topicEngagement: number // 0-1
}

export enum EmotionalTone {
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  EXCITED = 'excited',
  CALM = 'calm',
  CONFUSED = 'confused'
}
