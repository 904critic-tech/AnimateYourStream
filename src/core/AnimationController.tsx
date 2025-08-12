/**
 * Animation Controller System
 * 
 * Central hub for animation management, state machine, and AI behavior integration.
 * Provides a unified interface for animation control, blending, and state transitions.
 * 
 * Phase 4 Priority 1 - Agent 1 Implementation
 */

import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { AnimationMixer, AnimationClip } from 'three'
import { useAppStore } from '../utils/store'
import AnimationBlender, { BlendMode } from './AnimationBlender'
import { AIBehaviorSystem } from '../ai/AIBehaviorSystem'
import { AnimationDecisionEngine } from '../ai/AnimationDecisionEngine'

// Animation state machine states
export enum AnimationState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  GESTURING = 'gesturing',
  EMOTING = 'emoting',
  TRANSITIONING = 'transitioning',
  PAUSED = 'paused'
}

// Animation controller configuration
export interface AnimationControllerConfig {
  enableAI: boolean
  enableAutoTransitions: boolean
  enableGestureOverlay: boolean
  enableEmotionSystem: boolean
  transitionDuration: number
  aiUpdateInterval: number
  performanceOptimization: boolean
}

// Animation state machine transition
export interface StateTransition {
  from: AnimationState
  to: AnimationState
  condition: () => boolean
  animation: string
  duration: number
  blendMode: BlendMode
}

// Animation controller state
export interface AnimationControllerState {
  currentState: AnimationState
  currentAnimation: string | null
  isPlaying: boolean
  animationSpeed: number
  blendWeight: number
  transitionProgress: number
  lastUpdateTime: number
  performanceMetrics: {
    fps: number
    frameTime: number
    memoryUsage: number
  }
}

/**
 * Animation Controller Component
 * Central hub for all animation management and AI behavior integration
 */
export function AnimationController({ 
  mixer, 
  animations = [], 
  config = {
    enableAI: true,
    enableAutoTransitions: true,
    enableGestureOverlay: true,
    enableEmotionSystem: true,
    transitionDuration: 0.3,
    aiUpdateInterval: 1000,
    performanceOptimization: true
  }
}: {
  mixer: AnimationMixer | null
  animations: AnimationClip[]
  config?: Partial<AnimationControllerConfig>
}) {
  if (Math.random() < 0.02) {
    console.log('🎬 Agent 1: AnimationController initialized', {
      mixer: !!mixer,
      animationsCount: animations.length
    })
  }

  // State management
  const [controllerState, setControllerState] = useState<AnimationControllerState>({
    currentState: AnimationState.IDLE,
    currentAnimation: null,
    isPlaying: true,
    animationSpeed: 1.0,
    blendWeight: 1.0,
    transitionProgress: 0,
    lastUpdateTime: performance.now(),
    performanceMetrics: {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0
    }
  })

  // Refs for performance optimization
  const lastAIUpdate = useRef(0)
  const lastPerformanceCheck = useRef(0)
  const frameCount = useRef(0)
  const lastFrameTime = useRef(performance.now())

  // Store integration
  const {
    currentAnimation: storeAnimation,
    isPlaying: storeIsPlaying,
    animationSpeed: storeSpeed,
    aiBehaviorEnabled,
    setCurrentAnimation,
    setIsPlaying,
    setAnimationSpeed,
    setAnimationInfo
  } = useAppStore()

  // Animation blender reference
  const animationBlenderRef = useRef<any>(null)

  // AI behavior system
  const aiBehaviorSystemRef = useRef<AIBehaviorSystem | null>(null)

  // State machine transitions
  const stateTransitions = useMemo(() => new Map<string, StateTransition>([
    // Idle transitions
    ['idle-walk', {
      from: AnimationState.IDLE,
      to: AnimationState.WALKING,
      condition: () => storeSpeed > 0.1,
      animation: 'walk',
      duration: 0.3,
      blendMode: BlendMode.REPLACE
    }],
    ['idle-run', {
      from: AnimationState.IDLE,
      to: AnimationState.RUNNING,
      condition: () => storeSpeed > 0.8,
      animation: 'run',
      duration: 0.2,
      blendMode: BlendMode.REPLACE
    }],
    
    // Walking transitions
    ['walk-idle', {
      from: AnimationState.WALKING,
      to: AnimationState.IDLE,
      condition: () => storeSpeed < 0.1,
      animation: 'idle',
      duration: 0.5,
      blendMode: BlendMode.REPLACE
    }],
    ['walk-run', {
      from: AnimationState.WALKING,
      to: AnimationState.RUNNING,
      condition: () => storeSpeed > 0.8,
      animation: 'run',
      duration: 0.2,
      blendMode: BlendMode.REPLACE
    }],
    
    // Running transitions
    ['run-walk', {
      from: AnimationState.RUNNING,
      to: AnimationState.WALKING,
      condition: () => storeSpeed < 0.8 && storeSpeed > 0.1,
      animation: 'walk',
      duration: 0.3,
      blendMode: BlendMode.REPLACE
    }],
    ['run-idle', {
      from: AnimationState.RUNNING,
      to: AnimationState.IDLE,
      condition: () => storeSpeed < 0.1,
      animation: 'idle',
      duration: 0.5,
      blendMode: BlendMode.REPLACE
    }]
  ]), [storeSpeed])

  // Guard: available animation names for AI/SM transitions
  const availableAnimationNames = useMemo(() => new Set(animations.map(a => a.name.toLowerCase())), [animations])

  // Initialize animation system
  useEffect(() => {
    if (!mixer || animations.length === 0) return

    console.log('🎬 Agent 1: Initializing animation controller with animations:', animations.map(a => a.name))

    // Initialize AI behavior system if enabled
    if (config.enableAI && aiBehaviorEnabled) {
      aiBehaviorSystemRef.current = new AIBehaviorSystem({
        enablePersonality: true,
        enableEmotionTracking: true,
        enableContextAnalysis: true,
        enableLearning: true
      })
      
      // Optional: integration omitted
    }

    // Agent 3 Fix: Enhanced auto-play functionality
    if (!controllerState.currentAnimation && animations.length > 0) {
      const defaultAnimation = animations.find(a => a.name.toLowerCase().includes('idle')) || animations[0]
      console.log('🎬 Agent 3: Setting default animation:', defaultAnimation.name)
      
      setControllerState(prev => ({
        ...prev,
        currentAnimation: defaultAnimation.name,
        currentState: AnimationState.IDLE,
        isPlaying: true // Agent 3 Fix: Start playing immediately
      }))
      setCurrentAnimation(defaultAnimation.name)
      setIsPlaying(true) // Agent 3 Fix: Ensure play state is set
      
      // Agent 3 Fix: Start the animation immediately
      if (animationBlenderRef.current) {
        animationBlenderRef.current.blendToAnimation(defaultAnimation.name, 0.1)
        animationBlenderRef.current.resumeAllAnimations()
      }
    }

    // Update animation info in store
    setAnimationInfo({
      availableAnimations: animations.map(clip => clip.name),
      currentTime: 0,
      duration: animations[0]?.duration || 1
    })

  }, [mixer, animations, config.enableAI, aiBehaviorEnabled, setCurrentAnimation, setAnimationInfo])

  // Handle store animation changes
  useEffect(() => {
    if (storeAnimation && storeAnimation !== controllerState.currentAnimation) {
      console.log('🎬 Agent 1: Store animation changed to:', storeAnimation)
      setControllerState(prev => ({
        ...prev,
        currentAnimation: storeAnimation,
        currentState: AnimationState.TRANSITIONING
      }))
      
      // Use animation blender to transition
      if (animationBlenderRef.current) {
        animationBlenderRef.current.blendToAnimation(storeAnimation, config.transitionDuration)
      }
    }
  }, [storeAnimation, config.transitionDuration])

  // Handle play/pause changes
  useEffect(() => {
    if (storeIsPlaying !== controllerState.isPlaying) {
      console.log('🎬 Agent 1: Play state changed to:', storeIsPlaying)
      setControllerState(prev => ({
        ...prev,
        isPlaying: storeIsPlaying
      }))
      
      // Update animation blender play state
      if (animationBlenderRef.current) {
        if (storeIsPlaying) {
          animationBlenderRef.current.resumeAllAnimations()
        } else {
          animationBlenderRef.current.pauseAllAnimations()
        }
      }
    }
  }, [storeIsPlaying])

  // Handle speed changes
  useEffect(() => {
    if (storeSpeed !== controllerState.animationSpeed) {
      console.log('🎬 Agent 1: Speed changed to:', storeSpeed)
      setControllerState(prev => ({
        ...prev,
        animationSpeed: storeSpeed
      }))
      
      // Update animation blender speed
      if (animationBlenderRef.current) {
        animationBlenderRef.current.setAnimationTimeScale(storeSpeed)
      }
    }
  }, [storeSpeed])

  // State machine update function
  const updateStateMachine = useCallback(() => {
    if (!config.enableAutoTransitions) return

    const currentTime = performance.now()
    if (currentTime - lastAIUpdate.current < (config.aiUpdateInterval ?? 1000)) return

    lastAIUpdate.current = currentTime

    // Check for state transitions (guard by available animations)
    for (const [transitionKey, transition] of stateTransitions) {
      if (transition.from === controllerState.currentState && transition.condition()) {
        // Skip if target animation is not available
        if (!availableAnimationNames.has(transition.animation.toLowerCase())) {
          continue
        }
        console.log('🎬 Agent 1: State transition triggered:', transitionKey)
        
        setControllerState(prev => ({
          ...prev,
          currentState: transition.to,
          currentAnimation: transition.animation,
          transitionProgress: 0
        }))

        // Execute transition
        if (animationBlenderRef.current) {
          switch (transition.blendMode) {
            case BlendMode.REPLACE:
              animationBlenderRef.current.blendToAnimation(transition.animation, transition.duration)
              break
            case BlendMode.ADD:
              animationBlenderRef.current.addGestureOverlay(transition.animation, 0.5, 'add', transition.duration)
              break
            case BlendMode.OVERLAY:
              animationBlenderRef.current.addGestureOverlay(transition.animation, 0.3, 'overlay', transition.duration)
              break
          }
        }

        setCurrentAnimation(transition.animation)
        break
      }
    }
  }, [controllerState.currentState, stateTransitions, availableAnimationNames, config.enableAutoTransitions, config.aiUpdateInterval, setCurrentAnimation])

  // AI behavior update function
  const updateAIBehavior = useCallback(() => {
    if (!config.enableAI || !aiBehaviorEnabled || !aiBehaviorSystemRef.current) return

    const currentTime = performance.now()
    if (currentTime - lastAIUpdate.current < (config.aiUpdateInterval ?? 1000)) return

    lastAIUpdate.current = currentTime

    try {
      // Get AI animation decision
      const decision = aiBehaviorSystemRef.current.getCurrentAnimationDecision(
        animations.map(a => a.name)
      )

      if (decision) {
        // Guard AI decision against missing clips
        if (!availableAnimationNames.has(decision.animation.toLowerCase())) {
          return
        }
        console.log('🎬 Agent 1: AI animation decision:', decision)
        
        // Execute AI decision
        if (animationBlenderRef.current) {
          switch (decision.blendMode) {
            case BlendMode.REPLACE:
              animationBlenderRef.current.blendToAnimation(decision.animation, decision.duration ? decision.duration / 1000 : 0.3)
              break
            case BlendMode.ADD:
              animationBlenderRef.current.addGestureOverlay(decision.animation, 0.5, 'add', 0.2)
              break
            case BlendMode.OVERLAY:
              animationBlenderRef.current.addGestureOverlay(decision.animation, 0.3, 'overlay', 0.1)
              break
          }
        }

        setControllerState(prev => ({
          ...prev,
          currentAnimation: decision.animation
        }))
        setCurrentAnimation(decision.animation)
      }
    } catch (error) {
      console.warn('🎬 Agent 1: AI behavior update error:', error)
    }
  }, [config.enableAI, aiBehaviorEnabled, config.aiUpdateInterval, animations, availableAnimationNames, setCurrentAnimation])

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(() => {
    if (!config.performanceOptimization) return

    const currentTime = performance.now()
    if (currentTime - lastPerformanceCheck.current < 1000) return // Check every second

    lastPerformanceCheck.current = currentTime

    // Calculate FPS (no heap usage read for cross-env compatibility)
    const deltaTime = currentTime - lastFrameTime.current
    const fps = 1000 / deltaTime
    lastFrameTime.current = currentTime

    // Update performance metrics
    setControllerState(prev => ({
      ...prev,
      performanceMetrics: {
        fps: Math.round(fps),
        frameTime: Math.round(deltaTime * 100) / 100,
        memoryUsage: 0
      }
    }))

    // Performance-based optimizations
    if (fps < 30) {
      console.warn('🎬 Agent 1: Low FPS detected, applying performance optimizations')
      // Reduce AI update frequency
      // Avoid mutating props object directly; throttle using local ref
      lastAIUpdate.current = currentTime - (config.aiUpdateInterval || 1000) + Math.min((config.aiUpdateInterval || 1000) * 0.5, 2500)
    }
  }, [config.performanceOptimization])

  // Main update loop
  useFrame((state, delta) => {
    frameCount.current++

    // Update state machine
    updateStateMachine()

    // Update AI behavior
    updateAIBehavior()

    // Update performance metrics
    updatePerformanceMetrics()

    // Update transition progress
    if (controllerState.currentState === AnimationState.TRANSITIONING) {
      setControllerState(prev => ({
        ...prev,
        transitionProgress: Math.min(prev.transitionProgress + delta, 1)
      }))
    }
  })

  // Animation blender callback
  const handleAnimationChange = useCallback((animationName: string) => {
    console.log('🎬 Agent 1: Animation changed to:', animationName)
    setControllerState(prev => ({
      ...prev,
      currentAnimation: animationName,
      currentState: animationName.includes('idle') ? AnimationState.IDLE :
                   animationName.includes('walk') ? AnimationState.WALKING :
                   animationName.includes('run') ? AnimationState.RUNNING :
                   animationName.includes('gesture') ? AnimationState.GESTURING :
                   AnimationState.EMOTING
    }))
  }, [])

  // Expose controller methods globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__ANIMATION_CONTROLLER__ = {
        getState: () => controllerState,
        setState: (state: AnimationState) => {
          console.log('🎬 Agent 1: Manual state change to:', state)
          setControllerState(prev => ({ ...prev, currentState: state }))
        },
        forceAnimation: (animation: string) => {
          console.log('🎬 Agent 1: Force animation to:', animation)
          if (animationBlenderRef.current) {
            animationBlenderRef.current.blendToAnimation(animation, 0.1)
          }
          setCurrentAnimation(animation)
        },
        getPerformanceMetrics: () => controllerState.performanceMetrics
      }
    }
  }, [controllerState, setCurrentAnimation])

  // Render animation blender
  if (!mixer) {
    console.warn('🎬 Agent 1: No animation mixer available')
    return null
  }

  return (
    <AnimationBlender
      ref={animationBlenderRef}
      mixer={mixer}
      animations={animations}
      onAnimationChange={handleAnimationChange}
    />
  )
}

export default AnimationController
