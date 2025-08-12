// Advanced Lip Sync System - Phase 4 Priority 2
// Integrates enhanced audio processing with advanced facial animation
import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { enhancedAudioProcessor, type EmotionAnalysis, type VoiceActivityDetection } from './EnhancedAudioProcessor'
import { phonemeMappingSystem, type PhonemeContext } from './PhonemeMappingSystem'
import { jawTongueSimulation, type JawTongueConfig } from './JawTongueSimulation'
import { expressionBlending, type FacialExpression } from './ExpressionBlending'
import { aiExpressionSystem, type AIExpressionState, type PersonalityTraits } from './AIExpressionSystem'
import type { 
  VisemeData, 
  VisemeType, 
  MouthShape, 
  PhonemeMapping,
  LipSyncConfig,
  LipSyncState,
  LipSyncEvent,
  FacialRig,
  AnimationKeyframe,
  LipSyncAnimation,
  PerformanceMetrics
} from '../lipSync/types'

interface LipSyncProps {
  modelRef?: React.RefObject<THREE.Object3D>
  facialRig?: FacialRig
  config?: Partial<LipSyncConfig>
  onLipSyncEvent?: (event: LipSyncEvent) => void
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void
  enabled?: boolean
}

export const LipSync: React.FC<LipSyncProps> = ({
  modelRef,
  facialRig,
  config: userConfig,
  onLipSyncEvent,
  onPerformanceUpdate,
  enabled = true
}) => {
  // State management
  const [lipSyncState, setLipSyncState] = useState<LipSyncState>({
    isActive: false,
    isProcessing: false,
    currentViseme: 'sil',
    currentMouthShape: createNeutralMouthShape(),
    audioBuffer: [],
    latestAudioLevel: 0,
    isReceivingAudio: false,
    processingLatency: 0,
    frameRate: 0,
    droppedFrames: 0,
    calibration: {
      isCalibrated: false,
      baselineNoise: 0,
      dynamicRange: 0,
      personalizedMappings: new Map()
    }
  })

  // Refs for performance tracking
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())
  const processingStartTimeRef = useRef(0)
  const droppedFramesRef = useRef(0)

  // Advanced lip sync configuration
  const defaultConfig: LipSyncConfig = {
    enabled: true,
    sensitivity: 0.7,
    smoothing: 0.8,
    exaggeration: 0.6,
    latency: 50,
    lookAhead: 100,
    interpolationMode: 'smooth',
    frameRate: 60,
    audioAnalysis: {
      fftSize: 2048,
      windowSize: 50,
      hopSize: 25,
      preEmphasis: 0.97
    },
    visemeDetection: {
      algorithm: 'hybrid',
      confidenceThreshold: 0.6,
      blendThreshold: 0.3
    }
  }

  const config = { ...defaultConfig, ...userConfig }

  // Advanced lip sync systems
  const phonemeMappings = useRef<Map<string, PhonemeMapping>>(new Map())
  
  // Animation state
  const currentAnimationRef = useRef<LipSyncAnimation | null>(null)
  const animationQueueRef = useRef<LipSyncAnimation[]>([])
  const interpolationTRef = useRef(0)
  const targetMouthShapeRef = useRef<MouthShape>(createNeutralMouthShape())

  // Facial rig references
  const jawBoneRef = useRef<THREE.Bone | null>(null)
  const blendShapeMeshRef = useRef<THREE.SkinnedMesh | null>(null)

  // Initialize advanced systems
  useEffect(() => {
    console.log('🎭 Agent 4 - Initializing advanced lip sync systems...')
    
    // Initialize phoneme mappings
    phonemeMappings.current = new Map()
    
    // Initialize AI Expression System
    aiExpressionSystem.setPersonality({
      expressiveness: 0.7,
      eyeContact: 0.8,
      headMovement: 0.3,
      extraversion: 0.6,
      agreeableness: 0.8
    })
    
    console.log('🎭 Agent 4 - Advanced lip sync systems initialized')
  }, [])

  // Initialize facial rig for 3D model
  const initializeFacialRig = useCallback(() => {
    if (!modelRef?.current) return

    console.log('🎭 Agent 4 - Initializing facial rig for model:', modelRef.current.name || 'unknown')
    
    // 🎭 Agent 4 - Enhanced facial rig detection with fallbacks
    const model = modelRef.current
    let jawBone: THREE.Bone | null = null
    let blendShapeMesh: THREE.SkinnedMesh | null = null
    
    // First, try to find a proper jaw bone
    model.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase()
        if (boneName.includes('jaw') || boneName.includes('mandible')) {
          jawBone = child
          console.log('🎭 Agent 4 - Found jaw bone:', child.name)
        }
      }
    })
    
    // Fallback: If no jaw bone found, use the head bone for basic lip sync
    if (!jawBone) {
      model.traverse((child) => {
        if (child instanceof THREE.Bone) {
          const boneName = child.name.toLowerCase()
          if (boneName.includes('head') && !boneName.includes('top')) {
            jawBone = child
            console.log('🎭 Agent 4 - Using head bone as jaw fallback:', child.name)
          }
        }
      })
    }

    // Find blend shape mesh
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        if (child.morphTargetDictionary && Object.keys(child.morphTargetDictionary).length > 0) {
          blendShapeMesh = child
          console.log('🎭 Agent 4 - Found blend shape mesh:', child.name)
        }
      }
    })

    // Store references
    jawBoneRef.current = jawBone
    blendShapeMeshRef.current = blendShapeMesh

    // Initialize AI Expression System with the model
    aiExpressionSystem.setModel(model, jawBone || undefined)

    console.log('🎭 Agent 4 - Facial rig initialized:', {
      hasJawBone: !!jawBone,
      hasBlendShapeMesh: !!blendShapeMesh,
      jawBoneName: jawBone?.name || 'none',
      blendShapeMeshName: blendShapeMesh?.name || 'none'
    })
  }, [modelRef?.current, aiExpressionSystem])

  // Initialize facial rig when model is loaded
  useEffect(() => {
    if (modelRef?.current) {
      initializeFacialRig()
    }
  }, [modelRef?.current, initializeFacialRig])

  // Enhanced audio processing integration
  useEffect(() => {
    if (!enabled) return

    const handleEnhancedAudioData = (event: CustomEvent) => {
      const { voiceActivity, emotion } = event.detail || {}
      if (!voiceActivity) return
      processAudioData(voiceActivity, emotion)
    }

    const handleAudioLevel = (event: CustomEvent) => {
      const { audioLevel } = event.detail
      updateAudioLevel(audioLevel)
    }

    window.addEventListener('enhancedAudioData', handleEnhancedAudioData as EventListener)
    window.addEventListener('audioLevel', handleAudioLevel as EventListener)

    return () => {
      window.removeEventListener('enhancedAudioData', handleEnhancedAudioData as EventListener)
      window.removeEventListener('audioLevel', handleAudioLevel as EventListener)
    }
  }, [enabled])

  // Main animation loop
  useFrame((state, delta) => {
    if (!enabled || !lipSyncState.isActive) {
      if (frameCountRef.current % 60 === 0) { // Log every 60 frames to avoid spam
        console.log('🎭 Agent 4 - Animation loop not active:', { enabled, isActive: lipSyncState.isActive })
      }
      return
    }

    const currentTime = performance.now()
    frameCountRef.current++

    // Update frame rate
    if (currentTime - lastFrameTimeRef.current >= 1000) {
      const newFrameRate = frameCountRef.current
      setLipSyncState(prev => ({ ...prev, frameRate: newFrameRate }))
      frameCountRef.current = 0
      lastFrameTimeRef.current = currentTime
    }

    // Process animation queue
    processAnimationQueue(currentTime, delta)

    // Update advanced systems
    updateAdvancedSystems(delta)
    
    // Update AI Expression System
    aiExpressionSystem.update(delta)

    // Apply current mouth shape to model
    applyMouthShapeToModel()

    // Update performance metrics
    updatePerformanceMetrics(currentTime)

    // Log animation state periodically
    if (frameCountRef.current % 120 === 0) { // Log every 120 frames (about every 2 seconds at 60fps)
      console.log('🎭 Agent 4 - Animation loop running:', {
        currentViseme: lipSyncState.currentViseme,
        isReceivingAudio: lipSyncState.isReceivingAudio,
        animationQueueLength: animationQueueRef.current.length,
        currentMouthShape: lipSyncState.currentMouthShape
      })
    }
  })

  // 🎭 Agent 4 - Simple lip sync fallback for models without proper facial rigging
  const applyBasicLipSync = useCallback((audioLevel: number) => {
    if (!modelRef?.current) return
    
    // Find head bone for basic lip sync
    let headBone: THREE.Bone | null = null
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase()
        if (boneName.includes('head') && !boneName.includes('top')) {
          headBone = child
        }
      }
    })
    
    if (headBone) {
      // Apply basic jaw movement based on audio level
      const jawRotation = Math.min(audioLevel * 0.3, 0.2) // Max 0.2 radians (~11 degrees)
      if (headBone.rotation) {
        headBone.rotation.x = jawRotation
      }
      
      console.log('🎭 Agent 4 - Applied basic lip sync:', { audioLevel, jawRotation })
    }
  }, [modelRef?.current])

  // Process audio data from enhanced audio processor
  const processAudioData = useCallback((voiceActivity: VoiceActivityDetection, emotion?: EmotionAnalysis) => {
    if (!enabled) return

    const startTime = performance.now()
    setLipSyncState(prev => ({ ...prev, isProcessing: true }))

    try {
      // Get current audio level
      const audioLevel = enhancedAudioProcessor.getVoiceActivityStatus().confidence
      
      // 🎭 Agent 4 - Apply basic lip sync based on voice activity
      if (voiceActivity.isSpeaking) {
        applyBasicLipSync(voiceActivity.confidence)
      }

      // Update state
      setLipSyncState(prev => ({
        ...prev,
        latestAudioLevel: audioLevel,
        isReceivingAudio: true,
        processingLatency: performance.now() - startTime
      }))

      // Log processing
      console.log('🎭 Agent 4 - Processing audio data:', {
        voiceActivity: voiceActivity.isSpeaking,
        confidence: voiceActivity.confidence,
        emotion: emotion?.emotion,
        audioLevel
      })

    } catch (error) {
      console.error('🎭 Agent 4 - Error processing audio data:', error)
    } finally {
      setLipSyncState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [enabled, applyBasicLipSync])

  // Update audio level
  const updateAudioLevel = useCallback((audioLevel: number) => {
    setLipSyncState(prev => ({
      ...prev,
      latestAudioLevel: audioLevel,
      isReceivingAudio: audioLevel > 0.01
    }))
  }, [])

  // Process animation queue
  const processAnimationQueue = useCallback((currentTime: number, delta: number) => {
    if (animationQueueRef.current.length === 0) return

    const currentAnimation = animationQueueRef.current[0]
    if (!currentAnimation) return

    // Update interpolation
    interpolationTRef.current += delta / currentAnimation.duration

    if (interpolationTRef.current >= 1.0) {
      // Animation complete, remove from queue
      animationQueueRef.current.shift()
      interpolationTRef.current = 0
      
      if (animationQueueRef.current.length > 0) {
        targetMouthShapeRef.current = animationQueueRef.current[0].targetShape
      }
    } else {
      // Interpolate between shapes
      const t = interpolationTRef.current
      const currentShape = lipSyncState.currentMouthShape
      const targetShape = targetMouthShapeRef.current

      const interpolatedShape = interpolateMouthShapes(currentShape, targetShape, t)
      setLipSyncState(prev => ({ ...prev, currentMouthShape: interpolatedShape }))
    }
  }, [lipSyncState.currentMouthShape])

  // Update advanced systems
  const updateAdvancedSystems = useCallback((delta: number) => {
    // Update phoneme mapping system
    phonemeMappingSystem.update(delta)
    
    // Update jaw and tongue simulation
    jawTongueSimulation.update(delta)
    
    // Update expression blending
    expressionBlending.update(delta)
  }, [])

  // Apply mouth shape to model
  const applyMouthShapeToModel = useCallback(() => {
    if (!jawBoneRef.current && !blendShapeMeshRef.current) {
      console.log('🎭 Agent 4 - Missing refs for mouth shape application:', {
        hasJawBone: !!jawBoneRef.current,
        hasBlendShapeMesh: !!blendShapeMeshRef.current
      })
      return
    }

    const mouthShape = lipSyncState.currentMouthShape

    // Apply to jaw bone if available
    if (jawBoneRef.current) {
      const jawRotation = mouthShape.jawDrop * 0.5 // Scale down for realistic movement
      jawBoneRef.current.rotation.x = jawRotation
    }

    // Apply to blend shapes if available
    if (blendShapeMeshRef.current && blendShapeMeshRef.current.morphTargetDictionary) {
      const morphTargetDictionary = blendShapeMeshRef.current.morphTargetDictionary
      const morphTargetInfluences = blendShapeMeshRef.current.morphTargetInfluences

      // Apply mouth openness
      if (morphTargetDictionary.mouthOpen !== undefined) {
        morphTargetInfluences[morphTargetDictionary.mouthOpen] = mouthShape.openness
      }

      // Apply lip compression
      if (morphTargetDictionary.lipCompress !== undefined) {
        morphTargetInfluences[morphTargetDictionary.lipCompress] = mouthShape.lipCompression
      }

      // Apply corner pull
      if (morphTargetDictionary.cornerPull !== undefined) {
        morphTargetInfluences[morphTargetDictionary.cornerPull] = mouthShape.cornerPull
      }
    }
  }, [lipSyncState.currentMouthShape])

  // Update performance metrics
  const updatePerformanceMetrics = useCallback((currentTime: number) => {
    if (frameCountRef.current % 60 !== 0) return
    
    const metrics: PerformanceMetrics = {
      audioToVisemeLatency: lipSyncState.processingLatency,
      visemeToAnimationLatency: 0,
      totalLatency: lipSyncState.processingLatency,
      frameRate: lipSyncState.frameRate,
      averageConfidence: 0,
      missedFrames: droppedFramesRef.current,
      incorrectDetections: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      audioBufferUnderruns: 0
    }

    onPerformanceUpdate?.(metrics)
  }, [lipSyncState.frameRate, lipSyncState.processingLatency, onPerformanceUpdate])

  // Start lip sync
  const startLipSync = useCallback(() => {
    if (lipSyncState.isActive) return

    setLipSyncState(prev => ({ ...prev, isActive: true }))
    console.log('🎭 Agent 4 - Advanced lip sync started')
  }, [lipSyncState.isActive])

  // Stop lip sync
  const stopLipSync = useCallback(() => {
    if (!lipSyncState.isActive) return

    setLipSyncState(prev => ({ ...prev, isActive: false }))
    animationQueueRef.current = []
    targetMouthShapeRef.current = createNeutralMouthShape()
    interpolationTRef.current = 0
    
    console.log('🎭 Agent 4 - Advanced lip sync stopped')
  }, [lipSyncState.isActive])

  // Effect to start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !lipSyncState.isActive) {
      startLipSync()
    } else if (!enabled && lipSyncState.isActive) {
      stopLipSync()
    }
  }, [enabled, lipSyncState.isActive, startLipSync, stopLipSync])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLipSync()
    }
  }, [stopLipSync])

  // Return null since this is a logic component
  return null
}

// Helper functions
function createNeutralMouthShape(): MouthShape {
  return {
    openness: 0.1,
    width: 0.3,
    lipCompression: 0.1,
    jawDrop: 0.1,
    tonguePosition: 0.1,
    upperLipRaise: 0.1,
    lowerLipDepress: 0.1,
    cornerPull: 0.1
  }
}

function createPhonemeMapping(
  phoneme: string,
  viseme: VisemeType,
  duration: number,
  blendWeight: number,
  mouthShape: MouthShape
): PhonemeMapping {
  return {
    phoneme,
    viseme,
    duration,
    blendWeight,
    mouthShape
  }
}

function interpolateMouthShapes(shape1: MouthShape, shape2: MouthShape, t: number): MouthShape {
  return {
    openness: shape1.openness + (shape2.openness - shape1.openness) * t,
    width: shape1.width + (shape2.width - shape1.width) * t,
    lipCompression: shape1.lipCompression + (shape2.lipCompression - shape1.lipCompression) * t,
    jawDrop: shape1.jawDrop + (shape2.jawDrop - shape1.jawDrop) * t,
    tonguePosition: shape1.tonguePosition + (shape2.tonguePosition - shape1.tonguePosition) * t,
    upperLipRaise: shape1.upperLipRaise + (shape2.upperLipRaise - shape1.upperLipRaise) * t,
    lowerLipDepress: shape1.lowerLipDepress + (shape2.lowerLipDepress - shape1.lowerLipDepress) * t,
    cornerPull: shape1.cornerPull + (shape2.cornerPull - shape1.cornerPull) * t
  }
}

export default LipSync

