export interface ContextAnalyzerOptions {
  enableEnvironmentalAwareness: boolean
  enableUserInteractionTracking: boolean
  enableAudioAnalysis: boolean
}

export interface AnalyzedContext {
  primaryContext: import('./types').ContextType
  intensity: number
  confidence: number
  activeContexts: import('./types').Context[]
}

import { Context, ContextType, EmotionalTone } from './types'

export interface ConversationState {
  isActive: boolean
  speakerCount: number
  lastSpeechTime: number
  emotionalTone: EmotionalTone
  topicEngagement: number
}

export interface EnvironmentalContext {
  timeOfDay: string
  userInteraction: string
  audioLevel: number
  animationSpeed: number
  lastInteractionTime: number
  interactionFrequency: number
}

export class ContextAnalyzer {
  private options: ContextAnalyzerOptions
  private contexts: Context[] = []
  private conversationState: ConversationState = {
    isActive: false,
    speakerCount: 0,
    lastSpeechTime: 0,
    emotionalTone: EmotionalTone.NEUTRAL,
    topicEngagement: 0
  }
  private environmentalContext: EnvironmentalContext = {
    timeOfDay: 'afternoon',
    userInteraction: 'none',
    audioLevel: 0,
    animationSpeed: 1.0,
    lastInteractionTime: Date.now(),
    interactionFrequency: 0
  }

  constructor(options: ContextAnalyzerOptions) {
    this.options = options
  }

  analyzeCurrentContext(): AnalyzedContext {
    const now = Date.now()
    const recentContexts = this.contexts.filter(ctx => now - ctx.timestamp < 5000)
    
    if (recentContexts.length === 0) {
      return {
        primaryContext: ContextType.IDLE,
        intensity: 0.5,
        confidence: 0.8,
        activeContexts: []
      }
    }

    const primary = recentContexts.reduce((prev, current) =>
      current.intensity > prev.intensity ? current : prev
    )

    return {
      primaryContext: primary.type,
      intensity: primary.intensity,
      confidence: 0.8,
      activeContexts: recentContexts
    }
  }

  addContext(context: Context): void {
    this.contexts.push(context)
    const now = Date.now()
    this.contexts = this.contexts.filter(ctx => now - ctx.timestamp < 10000)
  }

  analyzeAudioContext(audioLevel: number, frequency?: number): Context {
    if (!this.options.enableAudioAnalysis) {
      return {
        timestamp: Date.now(),
        type: ContextType.IDLE,
        intensity: 0.5
      }
    }

    const context: Context = {
      timestamp: Date.now(),
      type: ContextType.AUDIO_INPUT,
      intensity: Math.min(1, Math.max(0, audioLevel)),
      metadata: { frequency }
    }

    this.addContext(context)
    return context
  }

  analyzeInteractionContext(type: string, intensity: number): Context {
    if (!this.options.enableUserInteractionTracking) {
      return {
        timestamp: Date.now(),
        type: ContextType.IDLE,
        intensity: 0.5
      }
    }

    const context: Context = {
      timestamp: Date.now(),
      type: ContextType.INTERACTION,
      intensity,
      metadata: { interactionType: type }
    }

    this.addContext(context)
    return context
  }

  getConversationState(): ConversationState {
    return { ...this.conversationState }
  }

  analyzeEmotionalTone(): EmotionalTone {
    const recent = this.contexts.filter(ctx => Date.now() - ctx.timestamp < 3000)
    if (recent.length === 0) return EmotionalTone.NEUTRAL
    const avg = recent.reduce((sum, ctx) => sum + ctx.intensity, 0) / recent.length
    if (avg > 0.7) return EmotionalTone.EXCITED
    if (avg > 0.5) return EmotionalTone.POSITIVE
    if (avg > 0.3) return EmotionalTone.NEUTRAL
    return EmotionalTone.CALM
  }

  getEnvironmentalContext(): EnvironmentalContext {
    return { ...this.environmentalContext }
  }

  setEnvironmentalFactors(factors: Partial<EnvironmentalContext>): void {
    if (!this.options.enableEnvironmentalAwareness) return
    this.environmentalContext = { ...this.environmentalContext, ...factors }
  }

  reset(): void {
    this.contexts = []
    this.conversationState = {
      isActive: false,
      speakerCount: 0,
      lastSpeechTime: 0,
      emotionalTone: EmotionalTone.NEUTRAL,
      topicEngagement: 0
    }
  }

  // Stubs used by tests
  getInteractionPatterns?(): any[] { return [] }
  getPredictiveAnalysis?(): any { return { prediction: 'idle' } }
}

export default ContextAnalyzer
