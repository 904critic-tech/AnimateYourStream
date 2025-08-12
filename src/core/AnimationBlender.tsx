/**
 * Animation Blender System
 * 
 * Advanced animation blending and transition management for smooth
 * character animations with support for multiple animation layers,
 * blend modes, and state transitions.
 */

import { useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import { AnimationMixer, AnimationAction, AnimationClip, LoopRepeat } from 'three'
import { useAppStore } from '../utils/store'
// Simple throttle and debounce implementations for performance optimization
const throttle = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let lastCall = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      return func(...args)
    }
  }) as T
}

const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}
import IKManager from './IKSolver'

// Animation blend modes
export enum BlendMode {
  REPLACE = 'replace',
  ADD = 'add',
  MULTIPLY = 'multiply',
  OVERLAY = 'overlay'
}

// Animation layer interface
export interface AnimationLayer {
  id: string
  action: AnimationAction
  weight: number
  fadeTime: number
  blendMode: BlendMode
  priority: number
  loop: boolean
  timeScale: number
}

// Animation transition interface
export interface AnimationTransition {
  fromAnimation: string
  toAnimation: string
  duration: number
  curve: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  blendMode: BlendMode
}

// Animation blend tree node
export interface BlendTreeNode {
  id: string
  type: 'animation' | 'blend' | 'additive'
  weight: number
  children?: BlendTreeNode[]
  animationName?: string
  blendMode?: BlendMode
}

/**
 * Animation Blender Component
 * Manages complex animation blending, layering, and transitions
 */
export interface AnimationBlenderHandle {
  blendToAnimation: (animationName: string, transitionDuration?: number) => void
  addAdditiveLayer: (animationName: string, weight?: number, fadeTime?: number) => void
  removeAdditiveLayer: (animationName: string, fadeTime?: number) => void
  setAnimationTimeScale: (timeScale: number) => void
  crossfadeAnimations: (
    fromAnimation: string,
    toAnimation: string,
    duration?: number,
    curve?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  ) => void
  pauseAllAnimations: () => void
  resumeAllAnimations: () => void
}

export const AnimationBlender = forwardRef<AnimationBlenderHandle, {
  mixer: AnimationMixer | null
  animations: AnimationClip[]
  onAnimationChange?: (animationName: string) => void
}>(({ 
  mixer, 
  animations = [], 
  onAnimationChange 
}, ref) => {
  if (Math.random() < 0.02) {
    console.log('🎭 Agent 3: AnimationBlender initialized', {
      mixer: !!mixer,
      animationsCount: animations.length
    })
  }
  const layersRef = useRef<Map<string, AnimationLayer>>(new Map())
  const transitionsRef = useRef<Map<string, AnimationTransition>>(new Map())
  const currentBlendTreeRef = useRef<BlendTreeNode | null>(null)
  const ikManagerRef = useRef<IKManager>(new IKManager())
  
  // Performance optimization refs
  const frameSkipCounter = useRef(0)
  const lastPerformanceCheck = useRef(0)
  const performanceOptimizationsEnabled = useRef(true)
  
  const {
    currentAnimation,
    isPlaying,
    animationSpeed,
    setAnimationInfo,
    setCurrentAnimation,
    setIsPlaying
  } = useAppStore()
  
  // Performance-optimized blend function with throttling
  const throttledBlendToAnimation = useCallback(
    throttle((animationName: string, transitionDuration = 0.3) => {
      blendToAnimationInternal(animationName, transitionDuration)
    }, 100), // Limit to 10 calls per second
    []
  )
  
  // Debounced animation info updates to reduce state changes
  const debouncedSetAnimationInfo = useCallback(
    debounce((info: any) => {
      setAnimationInfo(info)
    }, 50), // Update at most every 50ms
    [setAnimationInfo]
  )

  // Predefined animation transitions for smooth blending
  const defaultTransitions = useMemo(() => new Map<string, AnimationTransition>([
    ['idle-walk', {
      fromAnimation: 'idle',
      toAnimation: 'walk',
      duration: 0.3,
      curve: 'easeOut',
      blendMode: BlendMode.REPLACE
    }],
    ['walk-run', {
      fromAnimation: 'walk',
      toAnimation: 'run',
      duration: 0.2,
      curve: 'linear',
      blendMode: BlendMode.REPLACE
    }],
    ['run-idle', {
      fromAnimation: 'run',
      toAnimation: 'idle',
      duration: 0.5,
      curve: 'easeIn',
      blendMode: BlendMode.REPLACE
    }],
    ['any-wave', {
      fromAnimation: '*',
      toAnimation: 'wave',
      duration: 0.1,
      curve: 'easeOut',
      blendMode: BlendMode.ADD
    }]
  ]), [])

  // Initialize animation actions and layers
  useEffect(() => {
    if (!mixer || animations.length === 0) return

    console.log('🎭 Agent 3: Initializing animation actions for:', animations.map(a => a.name))

    // Clear existing layers
    layersRef.current.clear()

    // Create actions for all animations
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip)
      
      // Configure action properties
      action.setLoop(LoopRepeat, Infinity)
      action.clampWhenFinished = true
      action.enabled = true // Enable actions by default
      
      // Create animation layer
      const layer: AnimationLayer = {
        id: clip.name,
        action,
        weight: 0,
        fadeTime: 0.3,
        blendMode: BlendMode.REPLACE,
        priority: 0,
        loop: true,
        timeScale: 1
      }
      
      layersRef.current.set(clip.name, layer)
      console.log('🎭 Agent 3: Created animation layer for:', clip.name)
    })

    // Set default transitions
    transitionsRef.current = new Map(defaultTransitions)

    // Update animation info
    setAnimationInfo({
      availableAnimations: animations.map(clip => clip.name),
      currentTime: 0,
      duration: animations[0]?.duration || 1
    })

    // Agent 3 Fix: Auto-start first animation and sync store selection
    if (animations.length > 0) {
      const firstAnimation = animations[0]
      if (!currentAnimation) {
        setCurrentAnimation(firstAnimation.name)
      }
      if (!isPlaying) {
        setIsPlaying(true)
      }
      const firstLayer = layersRef.current.get(firstAnimation.name)
      if (firstLayer) {
        console.log('🎭 Agent 3: Auto-starting first animation:', firstAnimation.name)
        firstLayer.action.reset()
        firstLayer.action.setEffectiveTimeScale(animationSpeed)
        firstLayer.action.setEffectiveWeight(1.0)
        firstLayer.action.play()
        console.log('🎭 Agent 3: First animation started successfully')
      }
    }
  }, [mixer, animations, defaultTransitions, setAnimationInfo, isPlaying, animationSpeed])

  /**
   * Internal blend function (optimized, without throttling)
   */
  const blendToAnimationInternal = useCallback((
    animationName: string,
    transitionDuration = 0.3
  ) => {
    console.log('🎭 Agent 3: Attempting to blend to animation:', animationName)
    const targetLayer = layersRef.current.get(animationName)
    if (!targetLayer || !mixer) {
      console.warn('🎭 Agent 3: Cannot blend to animation:', animationName, {
        hasTargetLayer: !!targetLayer,
        hasMixer: !!mixer,
        availableLayers: Array.from(layersRef.current.keys())
      })
      return
    }

    // Find transition settings
    const transitionKey = `${currentAnimation}-${animationName}`
    const wildcardKey = `*-${animationName}`
    const transition = transitionsRef.current.get(transitionKey) || 
                     transitionsRef.current.get(wildcardKey)

    const duration = transition?.duration || transitionDuration

    // Performance optimization: batch weight updates
    const fadeOperations: Array<() => void> = []

    // Fade out current animations
    layersRef.current.forEach((layer, name) => {
      if (name !== animationName && layer.weight > 0) {
        fadeOperations.push(() => layer.action.fadeOut(duration))
      }
    })

    // Fade in target animation
    fadeOperations.push(() => {
      targetLayer.action.reset()
      targetLayer.action.setEffectiveTimeScale(animationSpeed)
      targetLayer.action.setEffectiveWeight(1)
      targetLayer.action.fadeIn(duration)
      targetLayer.action.play()
    })

    // Execute all fade operations in batch
    fadeOperations.forEach(op => op())

    // Update layer weight
    targetLayer.weight = 1

    // Notify of animation change
    onAnimationChange?.(animationName)
  }, [mixer, currentAnimation, animationSpeed, onAnimationChange])

  /**
   * Public blend function with performance throttling
   */
  const blendToAnimation = useCallback((
    animationName: string,
    transitionDuration = 0.3
  ) => {
    if (performanceOptimizationsEnabled.current) {
      throttledBlendToAnimation(animationName, transitionDuration)
    } else {
      blendToAnimationInternal(animationName, transitionDuration)
    }
  }, [throttledBlendToAnimation, blendToAnimationInternal])

  /**
   * Add additive animation layer (for gestures, facial expressions)
   */
  const addAdditiveLayer = (
    animationName: string,
    weight = 0.5,
    fadeTime = 0.2
  ) => {
    const layer = layersRef.current.get(animationName)
    if (!layer) return

    layer.blendMode = BlendMode.ADD
    layer.weight = weight
    layer.action.setEffectiveWeight(weight)
    layer.action.fadeIn(fadeTime)
    layer.action.play()
  }

  /**
   * Remove additive layer
   */
  const removeAdditiveLayer = (
    animationName: string,
    fadeTime = 0.2
  ) => {
    const layer = layersRef.current.get(animationName)
    if (!layer) return

    layer.action.fadeOut(fadeTime)
    setTimeout(() => {
      layer.weight = 0
    }, fadeTime * 1000)
  }

  /**
   * Set animation speed for all layers
   */
  const setAnimationTimeScale = (timeScale: number) => {
    layersRef.current.forEach((layer) => {
      layer.action.setEffectiveTimeScale(timeScale)
      layer.timeScale = timeScale
    })
  }

  /**
   * Create blend tree for complex animation mixing
   */
  const createBlendTree = (rootNode: BlendTreeNode) => {
    currentBlendTreeRef.current = rootNode
    
    // Process blend tree and update layer weights
    const processNode = (node: BlendTreeNode, weight = 1.0) => {
      if (node.type === 'animation' && node.animationName) {
        const layer = layersRef.current.get(node.animationName)
        if (layer) {
          layer.weight = weight * node.weight
          layer.action.setEffectiveWeight(layer.weight)
        }
      }
      
      if (node.children) {
        node.children.forEach(child => {
          processNode(child, weight * node.weight)
        })
      }
    }
    
    processNode(rootNode)
  }

  // Handle animation changes from store
  useEffect(() => {
    console.log('🎭 Agent 3: Animation change detected:', currentAnimation)
    if (currentAnimation && layersRef.current.has(currentAnimation)) {
      console.log('🎭 Agent 3: Blending to animation:', currentAnimation)
      blendToAnimation(currentAnimation)
    } else if (currentAnimation) {
      console.warn('🎭 Agent 3: Animation not found in layers:', currentAnimation, {
        availableLayers: Array.from(layersRef.current.keys())
      })
    }
  }, [currentAnimation])

  // Handle speed changes
  useEffect(() => {
    setAnimationTimeScale(animationSpeed)
  }, [animationSpeed])

  // Handle play/pause
  useEffect(() => {
    layersRef.current.forEach((layer) => {
      if (isPlaying) {
        layer.action.paused = false
      } else {
        layer.action.paused = true
      }
    })
  }, [isPlaying])

  // Performance-optimized animation mixer update - Agent 3 Fix: Enhanced auto-play
  useFrame((_, delta) => {
    if (!mixer) return

    frameSkipCounter.current++
    const currentTime = performance.now()

    // Agent 3 Fix: Auto-start animations if none are playing
    if (isPlaying && currentAnimation && layersRef.current.size > 0) {
      const currentLayer = layersRef.current.get(currentAnimation)
      if (currentLayer && !currentLayer.action.isRunning()) {
        console.log('🎭 Agent 3: Auto-starting animation:', currentAnimation)
        currentLayer.action.reset()
        currentLayer.action.setEffectiveTimeScale(animationSpeed)
        currentLayer.action.setEffectiveWeight(1.0)
        currentLayer.action.play()
      }
    }

    // Ultra-lightweight performance monitoring and optimization every 20 seconds (increased from 10 seconds)
    if (currentTime - lastPerformanceCheck.current > 20000) {
      // Simple performance check without heavy calculations
      console.debug(`🎭 Animation: Performance check at ${currentTime}`)
      lastPerformanceCheck.current = currentTime
    }

    // Adaptive frame skipping for better performance
    const shouldSkipFrame = performanceOptimizationsEnabled.current && 
                           frameSkipCounter.current % 2 !== 0
    
    if (!shouldSkipFrame) {
      mixer.update(delta)
      
      // Update IK constraints after animation
      ikManagerRef.current.update()
    }
    
    // Throttled timeline updates to reduce state changes
    const currentLayer = currentAnimation ? layersRef.current.get(currentAnimation) : null
    if (currentLayer && frameSkipCounter.current % 3 === 0) { // Update every 3rd frame when optimizing
      debouncedSetAnimationInfo({
        currentTime: currentLayer.action.time,
        duration: currentLayer.action.getClip().duration
      })
    }
  })

  /**
   * Advanced gesture overlay system
   */
  const addGestureOverlay = (
    gestureAnimation: string,
    weight = 0.7,
    blendMode = BlendMode.ADD,
    duration = 0.2
  ) => {
    const layer = layersRef.current.get(gestureAnimation)
    if (!layer) return

    // Configure as additive gesture
    layer.blendMode = blendMode
    layer.weight = weight
    layer.priority = 10 // High priority for gestures
    layer.action.setEffectiveWeight(weight)
    layer.action.fadeIn(duration)
    layer.action.play()

    // Auto-remove after gesture completes (if not looping)
    if (!layer.loop) {
      const gestureClip = layer.action.getClip()
      setTimeout(() => {
        removeAdditiveLayer(gestureAnimation, duration)
      }, gestureClip.duration * 1000)
    }
  }

  /**
   * Dynamic weight blending for smooth transitions
   */
  const setLayerWeight = (animationName: string, targetWeight: number, duration = 0.3) => {
    const layer = layersRef.current.get(animationName)
    if (!layer) return

    // Smooth weight transition
    const startWeight = layer.weight
    const startTime = Date.now()

    const updateWeight = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easing function for smooth transition
      const easedProgress = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const currentWeight = startWeight + (targetWeight - startWeight) * easedProgress
      
      layer.weight = currentWeight
      layer.action.setEffectiveWeight(currentWeight)
      
      if (progress < 1) {
        requestAnimationFrame(updateWeight)
      }
    }
    
    updateWeight()
  }

  /**
   * Animation crossfade system for seamless transitions
   */
  const crossfadeAnimations = (
    fromAnimation: string,
    toAnimation: string,
    duration = 0.5,
    curve: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'easeInOut'
  ) => {
    const fromLayer = layersRef.current.get(fromAnimation)
    const toLayer = layersRef.current.get(toAnimation)
    
    if (!fromLayer || !toLayer) return

    // Configure target animation
    toLayer.action.reset()
    toLayer.action.setEffectiveTimeScale(animationSpeed)
    toLayer.action.setEffectiveWeight(0)
    toLayer.action.play()

    const startTime = Date.now()
    
    const updateCrossfade = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      
      // Apply easing curve
      let easedProgress = progress
      switch (curve) {
        case 'easeIn':
          easedProgress = progress * progress
          break
        case 'easeOut':
          easedProgress = 1 - Math.pow(1 - progress, 2)
          break
        case 'easeInOut':
          easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2
          break
      }
      
      // Update weights
      fromLayer.weight = 1 - easedProgress
      toLayer.weight = easedProgress
      fromLayer.action.setEffectiveWeight(fromLayer.weight)
      toLayer.action.setEffectiveWeight(toLayer.weight)
      
      if (progress < 1) {
        requestAnimationFrame(updateCrossfade)
      } else {
        // Cleanup - stop the old animation
        fromLayer.action.stop()
        fromLayer.weight = 0
      }
    }
    
    updateCrossfade()
  }

  // Expose enhanced blender methods for external use
  useEffect(() => {
    console.log('🎭 Agent 3: Setting up global animation blender API')
    
    const blenderAPI = {
      blendToAnimation,
      addAdditiveLayer,
      removeAdditiveLayer,
      setAnimationTimeScale,
      createBlendTree,
      addGestureOverlay,
      setLayerWeight,
      crossfadeAnimations,
      getLayers: () => layersRef.current,
      getTransitions: () => transitionsRef.current,
      // Advanced state queries
      isAnimationPlaying: (animationName: string) => {
        const layer = layersRef.current.get(animationName)
        return layer ? layer.action.isRunning() : false
      },
      getAnimationTime: (animationName: string) => {
        const layer = layersRef.current.get(animationName)
        return layer ? layer.action.time : 0
      },
      getAnimationWeight: (animationName: string) => {
        const layer = layersRef.current.get(animationName)
        return layer ? layer.weight : 0
      },
      // Facial animation integration
      synchronizeFacialAnimations: (facialAnimator: any) => {
        // Connect facial animation timing with body animation timing
        if (facialAnimator && currentAnimation) {
          const currentLayer = layersRef.current.get(currentAnimation)
          if (currentLayer) {
            const animationTime = currentLayer.action.time
            const animationDuration = currentLayer.action.getClip().duration
            const normalizedTime = animationTime / animationDuration
            
            // Emit synchronization event for facial animator
            if (typeof facialAnimator.synchronizeWithBodyAnimation === 'function') {
              facialAnimator.synchronizeWithBodyAnimation(normalizedTime, animationTime)
            }
          }
        }
      },
      // Enhanced gesture system with facial coordination
      addCoordinatedGesture: (animationName: string, facialExpression?: string, options = {}) => {
        const defaultOptions = {
          weight: 0.7,
          fadeTime: 0.2,
          syncFacial: true,
          ...options
        }
        
        // Add the gesture animation layer
        addGestureOverlay(animationName, defaultOptions.weight, BlendMode.ADD, defaultOptions.fadeTime)
        
        // Coordinate with facial animation if specified
        if (defaultOptions.syncFacial && facialExpression) {
          const lipSyncManager = (window as any).__LIP_SYNC_MANAGER__
          if (lipSyncManager && lipSyncManager.facialAnimator) {
            // Trigger coordinated facial expression
            const facialAnimation = {
              id: `facial-${animationName}-${Date.now()}`,
              duration: 1000, // 1 second default
              keyframes: [
                { time: 0, mouthShape: lipSyncManager.facialAnimator.createNeutralMouthShape(), easing: 'easeOut' },
                { time: 0.5, mouthShape: lipSyncManager.facialAnimator.createMouthShapeForExpression(facialExpression), easing: 'easeInOut' },
                { time: 1, mouthShape: lipSyncManager.facialAnimator.createNeutralMouthShape(), easing: 'easeIn' }
              ]
            }
            lipSyncManager.facialAnimator.addKeyframeAnimation(facialAnimation)
          }
        }
      },
      // IK System Integration
      getIKManager: () => ikManagerRef.current,
      addIKChain: (chain: any) => ikManagerRef.current.addChain(chain),
      removeIKChain: (chainId: string) => ikManagerRef.current.removeChain(chainId),
      setIKTarget: (chainId: string, target: any) => ikManagerRef.current.setChainTarget(chainId, target),
      enableIK: (chainId: string, enabled: boolean) => ikManagerRef.current.setChainEnabled(chainId, enabled)
    }

    // Store API in app store for other components to use
    // This could be extended to a more formal API system
    ;(window as any).__ANIMATION_BLENDER__ = blenderAPI
    console.log('🎭 Agent 3: Global animation blender API set:', blenderAPI)

    return () => {
      delete (window as any).__ANIMATION_BLENDER__
      console.log('🎭 Agent 3: Global animation blender API cleaned up')
    }
  }, [])

  // Imperative handle for external controllers
  useImperativeHandle(ref, () => ({
    blendToAnimation,
    addAdditiveLayer,
    removeAdditiveLayer,
    setAnimationTimeScale,
    crossfadeAnimations,
    pauseAllAnimations: () => {
      layersRef.current.forEach(layer => { layer.action.paused = true })
    },
    resumeAllAnimations: () => {
      layersRef.current.forEach(layer => { layer.action.paused = false })
    }
  }), [blendToAnimation])

  return null // This is a logic-only component
})

export default AnimationBlender
