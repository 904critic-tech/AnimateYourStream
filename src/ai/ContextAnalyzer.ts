export interface ContextAnalyzerOptions {
  enableEnvironmentalAwareness: boolean
  enableUserInteractionTracking: boolean
  enableAudioAnalysis: boolean
}

export interface AnalyzedContext {
  primaryContext: string
  intensity: number
  confidence: number
  activeContexts: string[]
}

import { Context, ContextType } from './types'

export interface ConversationState {
  isActive: boolean
  speakerCount: number
  lastSpeechTime: number
  emotionalTone: string
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
    emotionalTone: 'neutral',
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
    // Analyze current context based on available data
    const now = Date.now()
    const recentContexts = this.contexts.filter(ctx => now - ctx.timestamp < 5000)
    
    if (recentContexts.length === 0) {
      return {
        primaryContext: 'idle',
        intensity: 0.5,
        confidence: 0.8,
        activeContexts: []
      }
    }

    // Find the most recent and intense context
    const primaryContext = recentContexts.reduce((prev, current) => 
      current.intensity > prev.intensity ? current : prev
    )

    return {
      primaryContext: primaryContext.type,
      intensity: primaryContext.intensity,
      confidence: 0.8,
      activeContexts: recentContexts.map(ctx => ctx.type)
    }
  }

  addContext(context: Context): void {
    this.contexts.push(context)
    
    // Keep only recent contexts
    const now = Date.now()
    this.contexts = this.contexts.filter(ctx => now - ctx.timestamp < 10000)
  }

  analyzeAudioContext(audioLevel: number, frequency?: number): void {
    if (!this.options.enableAudioAnalysis) return

    const context: Context = {
      timestamp: Date.now(),
      type: ContextType.AUDIO_INPUT,
      intensity: Math.min(1, audioLevel),
      metadata: { frequency }
    }

    this.addContext(context)
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

  analyzeEmotionalTone(): string {
    // Simple emotional tone analysis based on recent contexts
    const recentContexts = this.contexts.filter(ctx => 
      Date.now() - ctx.timestamp < 3000
    )

    if (recentContexts.length === 0) return 'neutral'

    const avgIntensity = recentContexts.reduce((sum, ctx) => sum + ctx.intensity, 0) / recentContexts.length
    
    if (avgIntensity > 0.7) return 'excited'
    if (avgIntensity > 0.5) return 'positive'
    if (avgIntensity > 0.3) return 'neutral'
    return 'calm'
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
      emotionalTone: 'neutral',
      topicEngagement: 0
    }
  }
}

export default ContextAnalyzer
