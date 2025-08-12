/**
 * AI Behavior Engine
 * 
 * Advanced AI-driven character behavior system with personality, mood, and environmental awareness.
 * Provides intelligent animation decisions based on character state and context.
 * 
 * Phase 4 Priority 2 - Agent 1 Implementation
 */

import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAppStore } from '../utils/store'
import { AIBehaviorSystem } from '../ai/AIBehaviorSystem'
import { AnimationDecisionEngine } from '../ai/AnimationDecisionEngine'
import { ContextAnalyzer } from '../ai/ContextAnalyzer'
import { PersonalityEngine } from '../ai/PersonalityEngine'
import { PersonalitySystem } from './PersonalitySystem'
import { EnvironmentAwareness } from './EnvironmentAwareness'
import { BehaviorTree, SelectorNode, SequenceNode, ActionNode } from './AIBehaviorTree'

// Character personality types
export enum PersonalityType {
  FRIENDLY = 'friendly',
  SHY = 'shy',
  EXCITED = 'excited',
  CALM = 'calm',
  PLAYFUL = 'playful',
  SERIOUS = 'serious',
  CURIOUS = 'curious',
  CONFIDENT = 'confident'
}

// Character mood states
export enum MoodState {
  HAPPY = 'happy',
  SAD = 'sad',
  EXCITED = 'excited',
  ANXIOUS = 'anxious',
  CALM = 'calm',
  PLAYFUL = 'playful',
  THOUGHTFUL = 'thoughtful',
  ENERGETIC = 'energetic',
  TIRED = 'tired',
  FOCUSED = 'focused'
}

// Environmental context
export interface EnvironmentalContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  userInteraction: 'none' | 'hover' | 'click' | 'voice'
  audioLevel: number
  animationSpeed: number
  lastInteractionTime: number
  interactionFrequency: number
}

// AI Behavior configuration
export interface AIBehaviorConfig {
  personalityType: PersonalityType
  baseMood: MoodState
  responsiveness: number // 0-1
  creativity: number // 0-1
  learningRate: number // 0-1
  environmentalAwareness: boolean
  moodInfluence: boolean
  personalityInfluence: boolean
  adaptiveBehavior: boolean
}

// AI Behavior state
export interface AIBehaviorState {
  personality: PersonalityType
  currentMood: MoodState
  moodIntensity: number // 0-1
  energyLevel: number // 0-1
  socialEngagement: number // 0-1
  lastDecision: string | null
  decisionHistory: Array<{
    timestamp: number
    context: string
    decision: string
    outcome: 'positive' | 'neutral' | 'negative'
  }>
  environmentalContext: EnvironmentalContext
  performanceMetrics: {
    decisionsPerMinute: number
    averageResponseTime: number
    learningProgress: number
  }
}

/**
 * AI Behavior Engine Component
 * Advanced AI-driven character behavior with personality and mood systems
 */
export function AIBehavior({ 
  config = {
    personalityType: PersonalityType.FRIENDLY,
    baseMood: MoodState.HAPPY,
    responsiveness: 0.7,
    creativity: 0.5,
    learningRate: 0.3,
    environmentalAwareness: true,
    moodInfluence: true,
    personalityInfluence: true,
    adaptiveBehavior: true
  }
}: {
  config?: Partial<AIBehaviorConfig>
}) {
  console.log('🤖 Agent 1: AIBehavior Engine initialized with:', config)

  // State management
  const [aiState, setAIState] = useState<AIBehaviorState>({
    personality: config.personalityType || PersonalityType.FRIENDLY,
    currentMood: config.baseMood || MoodState.HAPPY,
    moodIntensity: 0.5,
    energyLevel: 0.8,
    socialEngagement: 0.6,
    lastDecision: null,
    decisionHistory: [],
    environmentalContext: {
      timeOfDay: 'afternoon',
      userInteraction: 'none',
      audioLevel: 0,
      animationSpeed: 1.0,
      lastInteractionTime: Date.now(),
      interactionFrequency: 0
    },
    performanceMetrics: {
      decisionsPerMinute: 0,
      averageResponseTime: 0,
      learningProgress: 0
    }
  })

  // Refs for performance optimization
  const lastDecisionTime = useRef(0)
  const decisionCount = useRef(0)
  const totalResponseTime = useRef(0)
  const learningProgress = useRef(0)

  // Store integration
  const {
    aiBehaviorEnabled,
    aiPersonalityPreset,
    aiResponsiveness,
    aiCreativity,
    audioLevel,
    animationSpeed,
    lastInteraction,
    aiSuggestionHistory,
    setAiBehaviorEnabled,
    addAiSuggestion
  } = useAppStore()

  // AI system references
  const aiBehaviorSystemRef = useRef<AIBehaviorSystem | null>(null)
  const personalityEngineRef = useRef<PersonalityEngine | null>(null)
  const contextAnalyzerRef = useRef<ContextAnalyzer | null>(null)
  const personalitySystemRef = useRef<PersonalitySystem | null>(null)
  const envAwarenessRef = useRef<EnvironmentAwareness | null>(null)
  const lastSuggestionTimeRef = useRef<number>(0)
  const behaviorTreeRef = useRef<BehaviorTree | null>(null)
  const lastBehaviorTickRef = useRef<number>(0)

  // Personality-based behavior patterns
  const personalityPatterns = useMemo(() => new Map<PersonalityType, any>([
    [PersonalityType.FRIENDLY, {
      baseEnergy: 0.7,
      socialEngagement: 0.8,
      preferredAnimations: ['wave', 'smile', 'nod'],
      moodInfluence: 0.3,
      responseTime: 0.5
    }],
    [PersonalityType.SHY, {
      baseEnergy: 0.4,
      socialEngagement: 0.3,
      preferredAnimations: ['idle', 'look_away', 'fidget'],
      moodInfluence: 0.6,
      responseTime: 1.2
    }],
    [PersonalityType.EXCITED, {
      baseEnergy: 0.9,
      socialEngagement: 0.9,
      preferredAnimations: ['jump', 'wave', 'dance'],
      moodInfluence: 0.2,
      responseTime: 0.3
    }],
    [PersonalityType.CALM, {
      baseEnergy: 0.5,
      socialEngagement: 0.5,
      preferredAnimations: ['idle', 'breathe', 'meditate'],
      moodInfluence: 0.4,
      responseTime: 0.8
    }],
    [PersonalityType.PLAYFUL, {
      baseEnergy: 0.8,
      socialEngagement: 0.7,
      preferredAnimations: ['dance', 'spin', 'wave'],
      moodInfluence: 0.3,
      responseTime: 0.4
    }],
    [PersonalityType.SERIOUS, {
      baseEnergy: 0.6,
      socialEngagement: 0.4,
      preferredAnimations: ['idle', 'nod', 'point'],
      moodInfluence: 0.5,
      responseTime: 0.9
    }],
    [PersonalityType.CURIOUS, {
      baseEnergy: 0.7,
      socialEngagement: 0.6,
      preferredAnimations: ['look_around', 'point', 'lean'],
      moodInfluence: 0.4,
      responseTime: 0.6
    }],
    [PersonalityType.CONFIDENT, {
      baseEnergy: 0.8,
      socialEngagement: 0.7,
      preferredAnimations: ['wave', 'point', 'stand_tall'],
      moodInfluence: 0.3,
      responseTime: 0.5
    }]
  ]), [])

  // Mood influence on behavior
  const moodInfluences = useMemo(() => new Map<MoodState, any>([
    [MoodState.HAPPY, {
      energyBoost: 0.2,
      socialBoost: 0.3,
      animationModifier: 1.2,
      preferredAnimations: ['smile', 'wave', 'dance']
    }],
    [MoodState.SAD, {
      energyBoost: -0.3,
      socialBoost: -0.4,
      animationModifier: 0.7,
      preferredAnimations: ['idle', 'look_down', 'sigh']
    }],
    [MoodState.EXCITED, {
      energyBoost: 0.4,
      socialBoost: 0.5,
      animationModifier: 1.5,
      preferredAnimations: ['jump', 'wave', 'spin']
    }],
    [MoodState.ANXIOUS, {
      energyBoost: 0.1,
      socialBoost: -0.2,
      animationModifier: 0.8,
      preferredAnimations: ['fidget', 'look_around', 'idle']
    }],
    [MoodState.CALM, {
      energyBoost: 0.0,
      socialBoost: 0.1,
      animationModifier: 1.0,
      preferredAnimations: ['idle', 'breathe', 'meditate']
    }],
    [MoodState.PLAYFUL, {
      energyBoost: 0.3,
      socialBoost: 0.4,
      animationModifier: 1.3,
      preferredAnimations: ['dance', 'wave', 'spin']
    }],
    [MoodState.THOUGHTFUL, {
      energyBoost: -0.1,
      socialBoost: -0.1,
      animationModifier: 0.9,
      preferredAnimations: ['idle', 'look_away', 'nod']
    }],
    [MoodState.ENERGETIC, {
      energyBoost: 0.5,
      socialBoost: 0.4,
      animationModifier: 1.4,
      preferredAnimations: ['jump', 'dance', 'wave']
    }],
    [MoodState.TIRED, {
      energyBoost: -0.4,
      socialBoost: -0.3,
      animationModifier: 0.6,
      preferredAnimations: ['idle', 'yawn', 'stretch']
    }],
    [MoodState.FOCUSED, {
      energyBoost: 0.1,
      socialBoost: -0.1,
      animationModifier: 1.1,
      preferredAnimations: ['idle', 'nod', 'point']
    }]
  ]), [])

  // Initialize AI systems
  useEffect(() => {
    if (!aiBehaviorEnabled) return

    console.log('🤖 Agent 1: Initializing AI Behavior systems')

    // Initialize AI behavior system
    aiBehaviorSystemRef.current = new AIBehaviorSystem()

    // Initialize personality engine with enhanced configuration
    personalityEngineRef.current = new PersonalityEngine({
      personalityType: aiState.personality,
      learningRate: config.learningRate || 0.3,
      adaptability: config.adaptiveBehavior || true,
      initialMood: aiState.currentMood,
      moodStability: 0.7,
      personalityTraits: {
        energy: 0.7,
        friendliness: 0.8,
        expressiveness: 0.6,
        attentiveness: 0.8,
        playfulness: 0.5,
        confidence: 0.6
      }
    })

    // Initialize context analyzer
    contextAnalyzerRef.current = new ContextAnalyzer({
      enableEnvironmentalAwareness: config.environmentalAwareness || true,
      enableUserInteractionTracking: true,
      enableAudioAnalysis: true
    })

    if (!personalitySystemRef.current) {
      personalitySystemRef.current = new PersonalitySystem({})
    }
    if (!envAwarenessRef.current) {
      envAwarenessRef.current = new EnvironmentAwareness()
    }

    // Initialize a minimal behavior tree
    const engageAction = new ActionNode(() => {
      setAIState((prev) => ({ ...prev, lastDecision: 'engage' }))
      return 'success'
    })
    const idleAction = new ActionNode(() => {
      setAIState((prev) => ({ ...prev, lastDecision: 'idle' }))
      return 'success'
    })

    // Selector prefers engage if recent interactions are frequent
    const root = new SelectorNode([
      new SequenceNode([
        new ActionNode(() => {
          const snap = envAwarenessRef.current!.getSnapshot({
            audioLevel: useAppStore.getState().audioLevel,
            animationSpeed: useAppStore.getState().animationSpeed
          })
          return snap.interactionFrequency > 0.1 ? 'success' : 'failure'
        }),
        engageAction
      ]),
      idleAction
    ])

    behaviorTreeRef.current = new BehaviorTree(root)
  }, [aiBehaviorEnabled, config, aiState.personality])

  // Update environmental context
  const updateEnvironmentalContext = useCallback(() => {
    const now = Date.now()
    const timeOfDay = getTimeOfDay()
    const timeSinceLastInteraction = now - aiState.environmentalContext.lastInteractionTime
    const interactionFrequency = timeSinceLastInteraction < 60000 ? 1 : 0 // High frequency if interaction within 1 minute

    setAIState(prev => ({
      ...prev,
      environmentalContext: {
        timeOfDay,
        userInteraction: audioLevel > 0.1 ? 'voice' : 'none',
        audioLevel: audioLevel || 0,
        animationSpeed: animationSpeed || 1.0,
        lastInteractionTime: lastInteraction || now,
        interactionFrequency
      }
    }))
  }, [audioLevel, animationSpeed, lastInteraction])

  // Get time of day based on current time
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  // Update mood based on environmental factors
  const updateMood = useCallback(() => {
    if (!config.moodInfluence) return

    const personality = personalityPatterns.get(aiState.personality)
    const currentMood = moodInfluences.get(aiState.currentMood)
    
    let moodChange = 0

    // Environmental influences
    if (aiState.environmentalContext.userInteraction === 'voice') {
      moodChange += 0.1 // Positive interaction
    }
    if (aiState.environmentalContext.interactionFrequency > 0) {
      moodChange += 0.05 // Frequent interaction
    }
    if (aiState.environmentalContext.timeOfDay === 'morning') {
      moodChange += 0.1 // Morning energy
    }
    if (aiState.environmentalContext.timeOfDay === 'night') {
      moodChange -= 0.1 // Night tiredness
    }

    // Personality influences
    if (personality) {
      moodChange += personality.moodInfluence * 0.1
    }

    // Apply mood change
    const newMoodIntensity = Math.max(0, Math.min(1, aiState.moodIntensity + moodChange))
    
    // Determine new mood state based on intensity
    let newMood = aiState.currentMood
    if (newMoodIntensity > 0.7) {
      newMood = MoodState.EXCITED
    } else if (newMoodIntensity > 0.5) {
      newMood = MoodState.HAPPY
    } else if (newMoodIntensity > 0.3) {
      newMood = MoodState.CALM
    } else if (newMoodIntensity > 0.1) {
      newMood = MoodState.THOUGHTFUL
    } else {
      newMood = MoodState.TIRED
    }

    if (newMood !== aiState.currentMood || Math.abs(newMoodIntensity - aiState.moodIntensity) > 0.1) {
      setAIState(prev => ({
        ...prev,
        currentMood: newMood,
        moodIntensity: newMoodIntensity
      }))
      console.log('🤖 Agent 1: Mood changed to:', newMood, 'intensity:', newMoodIntensity)
    }
  }, [aiState.personality, aiState.currentMood, aiState.moodIntensity, aiState.environmentalContext, config.moodInfluence, personalityPatterns, moodInfluences])

  // Generate AI behavior decision
  const generateBehaviorDecision = useCallback(() => {
    if (!aiBehaviorEnabled || !aiBehaviorSystemRef.current) return

    const startTime = performance.now()
    
    try {
      // Get current context
      const context = contextAnalyzerRef.current?.analyzeCurrentContext() || {
        primaryContext: 'idle',
        intensity: 0.5,
        confidence: 0.8,
        activeContexts: []
      }

      // Get personality influence
      const personality = personalityPatterns.get(aiState.personality)
      const mood = moodInfluences.get(aiState.currentMood)

      // Calculate behavior parameters
      const energyLevel = Math.max(0, Math.min(1, 
        (personality?.baseEnergy || 0.5) + 
        (mood?.energyBoost || 0) + 
        (aiState.environmentalContext.audioLevel * 0.2)
      ))

      const socialEngagement = Math.max(0, Math.min(1,
        (personality?.socialEngagement || 0.5) + 
        (mood?.socialBoost || 0) + 
        (aiState.environmentalContext.interactionFrequency * 0.3)
      ))

      // Get AI decision
      const decision = aiBehaviorSystemRef.current.getCurrentAnimationDecision([
        'idle', 'walk', 'run', 'wave', 'dance', 'jump', 'smile', 'nod', 'point', 'look_around'
      ])

      if (decision) {
        const responseTime = performance.now() - startTime
        totalResponseTime.current += responseTime
        decisionCount.current++

        // Record decision
        setAIState(prev => ({
          ...prev,
          lastDecision: decision.animation,
          energyLevel,
          socialEngagement,
          decisionHistory: [
            ...prev.decisionHistory.slice(-9), // Keep last 10 decisions
            {
              timestamp: Date.now(),
              context: context.primaryContext,
              decision: decision.animation,
              outcome: 'positive' // Simplified for now
            }
          ],
          performanceMetrics: {
            decisionsPerMinute: decisionCount.current / (Date.now() - lastDecisionTime.current) * 60000,
            averageResponseTime: totalResponseTime.current / decisionCount.current,
            learningProgress: learningProgress.current
          }
        }))

        console.log('🤖 Agent 1: AI Decision:', {
          animation: decision.animation,
          reason: decision.reason,
          energyLevel,
          socialEngagement,
          mood: aiState.currentMood,
          personality: aiState.personality,
          responseTime
        })

        return decision
      }
    } catch (error) {
      console.warn('🤖 Agent 1: Error generating behavior decision:', error)
    }
  }, [aiBehaviorEnabled, aiState.personality, aiState.currentMood, aiState.environmentalContext, personalityPatterns, moodInfluences])

  // Main update loop
  useFrame((state, delta) => {
    if (!aiBehaviorEnabled) return

    // Update environmental context
    updateEnvironmentalContext()

    // Update mood
    updateMood()

    // Generate behavior decisions periodically
    const now = performance.now()
    if (now - lastDecisionTime.current > (1000 / aiResponsiveness)) { // Based on responsiveness
      const decision = generateBehaviorDecision()
      if (decision) {
        lastDecisionTime.current = now
      }
    }

    const state = useAppStore.getState()
    if (!state.aiSuggestionsEnabled) {
      // still tick behavior tree even if suggestions are disabled
      const nowCheck = typeof performance !== 'undefined' ? performance.now() : Date.now()
      if (behaviorTreeRef.current && nowCheck - lastBehaviorTickRef.current >= 2000) {
        behaviorTreeRef.current.tick({ now: nowCheck })
        lastBehaviorTickRef.current = nowCheck
      }
      return
    }

    // Throttled personality-based suggestion logging (configurable interval)
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const interval = Math.max(1000, Math.min(30000, state.aiSuggestionIntervalMs))
    if (now - lastSuggestionTimeRef.current >= interval) {
      const available = Array.isArray(state.animationInfo?.availableAnimations)
        ? state.animationInfo.availableAnimations
        : []

      if (available.length > 0 && personalitySystemRef.current && envAwarenessRef.current) {
        const snapshot = envAwarenessRef.current.getSnapshot({
          audioLevel: state.audioLevel,
          animationSpeed: state.animationSpeed
        })
        const suggestions = personalitySystemRef.current.suggestAnimations(available, snapshot)
        const top = suggestions[0]
        if (top) {
          addAiSuggestion(top.name)
          if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
            try { window.dispatchEvent(new CustomEvent('ai:suggestion', { detail: { name: top.name, weight: top.weight } })) } catch {}
          }
        }
      }
      lastSuggestionTimeRef.current = now
    }

    // Tick behavior tree every 2s
    if (behaviorTreeRef.current) {
      if (now - lastBehaviorTickRef.current >= 2000) {
        behaviorTreeRef.current.tick({ now })
        const available = state.animationInfo.availableAnimations
        if (aiState.lastDecision === 'engage' && Array.isArray(available) && available.includes('wave')) {
          addAiSuggestion('wave')
        }
        lastBehaviorTickRef.current = now
      }
    }
  })

  // Expose AI behavior methods globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__AI_BEHAVIOR__ = {
        getState: () => aiState,
        setPersonality: (personality: PersonalityType) => {
          console.log('🤖 Agent 1: Setting personality to:', personality)
          setAIState(prev => ({ ...prev, personality }))
        },
        setMood: (mood: MoodState) => {
          console.log('🤖 Agent 1: Setting mood to:', mood)
          setAIState(prev => ({ ...prev, currentMood: mood }))
        },
        forceDecision: () => {
          console.log('🤖 Agent 1: Forcing behavior decision')
          return generateBehaviorDecision()
        },
        getPerformanceMetrics: () => aiState.performanceMetrics,
        getEnvironmentalContext: () => aiState.environmentalContext
      }
    }
  }, [aiState, generateBehaviorDecision])

  useEffect(() => {
    const onInteraction = (ev: any) => {
      const type = ev?.detail?.type
      if (!envAwarenessRef.current) return
      if (type === 'hover' || type === 'click' || type === 'voice') {
        envAwarenessRef.current.recordInteraction(type)
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('ai:interaction', onInteraction as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ai:interaction', onInteraction as EventListener)
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

export default AIBehavior
