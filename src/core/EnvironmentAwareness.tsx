export interface InteractionEvent {
  type: 'hover' | 'click' | 'voice'
  timestamp: number
}

export interface EnvConfig {
  maxHistoryMs?: number
}

export interface EnvironmentSnapshot {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  userInteraction: 'none' | 'hover' | 'click' | 'voice'
  audioLevel: number // 0-1
  animationSpeed: number // multiplier
  lastInteractionTime: number // ms since epoch
  interactionFrequency: number // 0-1 normalized recent events / window
}

const DEFAULT_WINDOW_MS = 60_000

export class EnvironmentAwareness {
  private events: InteractionEvent[] = []
  private maxHistoryMs: number

  constructor(config: EnvConfig = {}) {
    this.maxHistoryMs = config.maxHistoryMs ?? DEFAULT_WINDOW_MS
  }

  recordInteraction(type: InteractionEvent['type']): void {
    const now = Date.now()
    this.events.push({ type, timestamp: now })
    this.prune(now)
  }

  private prune(now = Date.now()): void {
    const cutoff = now - this.maxHistoryMs
    while (this.events.length && this.events[0].timestamp < cutoff) this.events.shift()
  }

  getSnapshot(params: {
    audioLevel: number
    animationSpeed: number
  }): EnvironmentSnapshot {
    const now = Date.now()
    this.prune(now)

    const last = this.events[this.events.length - 1]
    const lastType = last?.type ?? 'none'
    const lastTime = last?.timestamp ?? 0

    const hour = new Date(now).getHours()
    const timeOfDay: EnvironmentSnapshot['timeOfDay'] =
      hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

    const interactionFrequency = Math.max(0, Math.min(1, this.events.length / 20))

    return {
      timeOfDay,
      userInteraction: lastType,
      audioLevel: Math.max(0, Math.min(1, params.audioLevel)),
      animationSpeed: params.animationSpeed,
      lastInteractionTime: lastTime,
      interactionFrequency
    }
  }
}