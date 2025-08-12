// Facial Animation System - Applies mouth shapes to 3D models
import type { 
  MouthShape, 
  VisemeData, 
  FacialRig, 
  LipSyncAnimation,
  LipSyncConfig,
  LipSyncEvent
} from './types'
import { BrowserEventEmitter } from './BrowserEventEmitter'
import * as THREE from 'three'

export class FacialAnimator extends BrowserEventEmitter {
  private config: LipSyncConfig
  private currentModel: THREE.Object3D | null = null
  private facialRig: FacialRig | null = null
  private currentMouthShape: MouthShape
  private targetMouthShape: MouthShape
  private animationQueue: LipSyncAnimation[] = []
  private isAnimating = false
  private lastUpdateTime = 0
  private interpolationT = 0

  // Blend shapes and bones for facial animation
  private jawBone: THREE.Bone | null = null
  private blendShapeMesh: THREE.SkinnedMesh | null = null
  private blendShapeIndexMap: Map<string, number> = new Map()

  constructor(config: LipSyncConfig) {
    super()
    this.config = config
    this.currentMouthShape = this.createNeutralMouthShape()
    this.targetMouthShape = this.createNeutralMouthShape()
  }

  // Set the 3D model to animate
  setModel(model: THREE.Object3D, facialRig?: FacialRig): boolean {
    try {
      this.currentModel = model
      this.facialRig = facialRig || this.detectFacialRig(model)
      
      if (!this.facialRig) {
        console.warn('🎭 No facial rig detected or provided')
        return false
      }

      // Find jaw bone
      this.jawBone = this.findBone(model, this.facialRig.jawBone)
      if (this.jawBone) {
        console.log('🎭 Jaw bone found:', this.jawBone.name)
      }

      // Find blend shape mesh
      this.blendShapeMesh = this.findBlendShapeMesh(model)
      if (this.blendShapeMesh) {
        this.mapBlendShapes()
        console.log('🎭 Blend shapes mapped:', this.blendShapeIndexMap.size)
      }

      console.log('🎭 Facial animator initialized for model')
      this.emit('model_set', { model, facialRig: this.facialRig })
      return true

    } catch (error) {
      console.error('🎭 Failed to set model:', error)
      this.emit('error', error)
      return false
    }
  }

  // Start facial animation
  start(): void {
    if (this.isAnimating) return
    
    this.isAnimating = true
    this.lastUpdateTime = performance.now()
    
    // Start animation loop
    this.animationLoop()
    
    console.log('🎭 Facial animator started')
    this.emit('started')
  }

  // Stop facial animation
  stop(): void {
    this.isAnimating = false
    this.resetToNeutral()
    console.log('🎭 Facial animator stopped')
    this.emit('stopped')
  }

  // Apply viseme data to facial animation
  applyViseme(visemeData: VisemeData): void {
    if (!this.isAnimating || !this.currentModel) return

    try {
      // Get mouth shape for this viseme
      const mouthShape = this.getVisemeMouthShape(visemeData)
      
      // Apply intensity and exaggeration
      const adjustedShape = this.adjustMouthShape(mouthShape, visemeData.intensity)
      
      // Set as target for smooth interpolation
      this.targetMouthShape = adjustedShape
      this.interpolationT = 0 // Start new interpolation

      // Emit event
      const event: LipSyncEvent = {
        type: 'mouth_shape_updated',
        timestamp: Date.now(),
        data: { visemeData, mouthShape: adjustedShape },
        source: 'facial_animator'
      }
      this.emit('mouth_shape_updated', adjustedShape)
      this.emit('lip_sync_event', event)

    } catch (error) {
      console.error('🎭 Error applying viseme:', error)
      this.emit('error', error)
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<LipSyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🎭 Facial animator config updated')
  }

  // Get current mouth shape
  getCurrentMouthShape(): MouthShape {
    return { ...this.currentMouthShape }
  }

  // Get current animation status
  getStatus(): {
    isAnimating: boolean
    hasModel: boolean
    hasFacialRig: boolean
    currentMouthShape: MouthShape
    queuedAnimations: number
  } {
    return {
      isAnimating: this.isAnimating,
      hasModel: this.currentModel !== null,
      hasFacialRig: this.facialRig !== null,
      currentMouthShape: { ...this.currentMouthShape },
      queuedAnimations: this.animationQueue.length
    }
  }

  // Main animation loop
  private animationLoop(): void {
    if (!this.isAnimating) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastUpdateTime
    
    // Limit to target frame rate
    const targetFrameTime = 1000 / this.config.frameRate
    if (deltaTime >= targetFrameTime) {
      this.updateAnimation(deltaTime)
      this.lastUpdateTime = currentTime
    }

    // Continue loop
    requestAnimationFrame(() => this.animationLoop())
  }

  // Update facial animation
  private updateAnimation(deltaTime: number): void {
    try {
      // Update interpolation towards target mouth shape
      this.updateMouthShapeInterpolation(deltaTime)
      
      // Apply current mouth shape to 3D model
      this.applyMouthShapeToModel()
      
      // Process animation queue
      this.processAnimationQueue()

    } catch (error) {
      console.error('🎭 Animation update error:', error)
      this.emit('error', error)
    }
  }

  // Update mouth shape interpolation
  private updateMouthShapeInterpolation(deltaTime: number): void {
    if (this.interpolationT >= 1.0) return

    // Calculate interpolation speed based on config
    const speed = this.config.smoothing > 0 
      ? 1.0 - this.config.smoothing // Higher smoothing = slower transitions
      : 1.0

    // Update interpolation parameter
    this.interpolationT += (deltaTime / 100) * speed // 100ms base transition time
    this.interpolationT = Math.min(1.0, this.interpolationT)

    // Interpolate between current and target
    const easeFunc = this.getEasingFunction(this.config.interpolationMode)
    const t = easeFunc(this.interpolationT)

    this.currentMouthShape = this.interpolateMouthShapes(
      this.currentMouthShape,
      this.targetMouthShape,
      t
    )
  }

  // Apply mouth shape to 3D model
  private applyMouthShapeToModel(): void {
    if (!this.currentModel || !this.facialRig) return

    // Apply jaw rotation
    this.applyJawRotation()
    
    // Apply blend shapes
    this.applyBlendShapes()
  }

  // Apply jaw rotation based on mouth openness
  private applyJawRotation(): void {
    if (!this.jawBone || !this.facialRig) return

    const jawRotation = this.currentMouthShape.jawDrop * this.facialRig.maxJawRotation
    
    // Apply rotation based on configured axis
    switch (this.facialRig.jawRotationAxis) {
      case 'x':
        this.jawBone.rotation.x = jawRotation
        break
      case 'y':
        this.jawBone.rotation.y = jawRotation
        break
      case 'z':
        this.jawBone.rotation.z = jawRotation
        break
    }
  }

  // Apply blend shapes for lip movement
  private applyBlendShapes(): void {
    if (!this.blendShapeMesh || !this.facialRig) return

    const morphTargets = this.blendShapeMesh.morphTargetInfluences
    if (!morphTargets) return

    const multiplier = this.facialRig.lipShapeMultiplier

    // Apply upper lip blend shape
    if (this.facialRig.upperLipBlendShape) {
      const index = this.blendShapeIndexMap.get(this.facialRig.upperLipBlendShape)
      if (index !== undefined) {
        morphTargets[index] = this.currentMouthShape.upperLipRaise * multiplier
      }
    }

    // Apply lower lip blend shape
    if (this.facialRig.lowerLipBlendShape) {
      const index = this.blendShapeIndexMap.get(this.facialRig.lowerLipBlendShape)
      if (index !== undefined) {
        morphTargets[index] = this.currentMouthShape.lowerLipDepress * multiplier
      }
    }

    // Apply mouth corner blend shapes
    if (this.facialRig.mouthCornerBlendShapes) {
      this.facialRig.mouthCornerBlendShapes.forEach(blendShapeName => {
        const index = this.blendShapeIndexMap.get(blendShapeName)
        if (index !== undefined) {
          morphTargets[index] = this.currentMouthShape.cornerPull * multiplier
        }
      })
    }

    // Apply tongue blend shapes
    if (this.facialRig.tongueBlendShapes) {
      this.facialRig.tongueBlendShapes.forEach(blendShapeName => {
        const index = this.blendShapeIndexMap.get(blendShapeName)
        if (index !== undefined) {
          morphTargets[index] = this.currentMouthShape.tonguePosition * multiplier
        }
      })
    }
  }

  // Get mouth shape for viseme
  private getVisemeMouthShape(visemeData: VisemeData): MouthShape {
    // This would ideally use the VisemeDetector's mappings
    // For now, create a basic mapping
    const baseShapes: Record<string, Partial<MouthShape>> = {
      'sil': { openness: 0.0, width: 0.0 },
      'aa': { openness: 0.8, width: 0.5, jawDrop: 0.7 },
      'E': { openness: 0.5, width: 0.6, jawDrop: 0.4 },
      'I': { openness: 0.3, width: 0.7, jawDrop: 0.2 },
      'O': { openness: 0.6, width: 0.0, lipCompression: 0.3 },
      'U': { openness: 0.2, width: 0.0, lipCompression: 0.7 },
      'PP': { openness: 0.0, lipCompression: 1.0 },
      'FF': { openness: 0.2, upperLipRaise: 0.3, lowerLipDepress: 0.7 },
      'SS': { openness: 0.2, width: 0.1, tonguePosition: 0.7 }
    }

    const baseShape = baseShapes[visemeData.viseme] || baseShapes['sil']
    return { ...this.createNeutralMouthShape(), ...baseShape }
  }

  // Adjust mouth shape based on intensity and config
  private adjustMouthShape(mouthShape: MouthShape, intensity: number): MouthShape {
    const exaggeration = this.config.exaggeration

    return {
      openness: mouthShape.openness * intensity * (1 + exaggeration),
      width: mouthShape.width * intensity * (1 + exaggeration),
      lipCompression: mouthShape.lipCompression * intensity * (1 + exaggeration),
      jawDrop: mouthShape.jawDrop * intensity * (1 + exaggeration),
      tonguePosition: mouthShape.tonguePosition * intensity * (1 + exaggeration),
      upperLipRaise: mouthShape.upperLipRaise * intensity * (1 + exaggeration),
      lowerLipDepress: mouthShape.lowerLipDepress * intensity * (1 + exaggeration),
      cornerPull: mouthShape.cornerPull * intensity * (1 + exaggeration)
    }
  }

  // Interpolate between two mouth shapes
  private interpolateMouthShapes(from: MouthShape, to: MouthShape, t: number): MouthShape {
    return {
      openness: this.lerp(from.openness, to.openness, t),
      width: this.lerp(from.width, to.width, t),
      lipCompression: this.lerp(from.lipCompression, to.lipCompression, t),
      jawDrop: this.lerp(from.jawDrop, to.jawDrop, t),
      tonguePosition: this.lerp(from.tonguePosition, to.tonguePosition, t),
      upperLipRaise: this.lerp(from.upperLipRaise, to.upperLipRaise, t),
      lowerLipDepress: this.lerp(from.lowerLipDepress, to.lowerLipDepress, t),
      cornerPull: this.lerp(from.cornerPull, to.cornerPull, t)
    }
  }

  // Linear interpolation
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  // Get easing function based on interpolation mode
  private getEasingFunction(mode: string): (t: number) => number {
    switch (mode) {
      case 'linear':
        return (t: number) => t
      case 'cubic':
        return (t: number) => t * t * (3.0 - 2.0 * t) // Smoothstep
      case 'smooth':
        return (t: number) => t * t * t * (t * (t * 6.0 - 15.0) + 10.0) // Smootherstep
      default:
        return (t: number) => t
    }
  }

  // Create neutral mouth shape
  private createNeutralMouthShape(): MouthShape {
    return {
      openness: 0.0,
      width: 0.0,
      lipCompression: 0.0,
      jawDrop: 0.0,
      tonguePosition: 0.0,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    }
  }

  // Reset to neutral position
  private resetToNeutral(): void {
    this.targetMouthShape = this.createNeutralMouthShape()
    this.interpolationT = 0
  }

  // Auto-detect facial rig from model
  private detectFacialRig(model: THREE.Object3D): FacialRig | null {
    // Common bone/blend shape names to look for
    const jawBoneNames = ['jaw', 'Jaw', 'jaw_bone', 'mandible']
    const upperLipNames = ['upper_lip', 'upperLip', 'lip_upper']
    const lowerLipNames = ['lower_lip', 'lowerLip', 'lip_lower']

    const detectedRig: Partial<FacialRig> = {
      jawRotationAxis: 'x',
      maxJawRotation: 0.3, // ~17 degrees
      lipShapeMultiplier: 1.0
    }

    // Find jaw bone
    for (const boneName of jawBoneNames) {
      const bone = this.findBone(model, boneName)
      if (bone) {
        detectedRig.jawBone = bone.name
        break
      }
    }

    // Find blend shapes
    const mesh = this.findBlendShapeMesh(model)
    if (mesh && mesh.morphTargetDictionary) {
      const morphNames = Object.keys(mesh.morphTargetDictionary)
      
      detectedRig.upperLipBlendShape = upperLipNames.find(name => 
        morphNames.some(morphName => morphName.toLowerCase().includes(name.toLowerCase()))
      )
      
      detectedRig.lowerLipBlendShape = lowerLipNames.find(name => 
        morphNames.some(morphName => morphName.toLowerCase().includes(name.toLowerCase()))
      )
    }

    // Return rig if we found at least jaw or blend shapes
    if (detectedRig.jawBone || detectedRig.upperLipBlendShape || detectedRig.lowerLipBlendShape) {
      return detectedRig as FacialRig
    }

    return null
  }

  // Find bone by name
  private findBone(object: THREE.Object3D, boneName?: string): THREE.Bone | null {
    if (!boneName) return null

    let foundBone: THREE.Bone | null = null
    
    object.traverse((child) => {
      if (child instanceof THREE.Bone && child.name === boneName) {
        foundBone = child
      }
    })

    return foundBone
  }

  // Find mesh with blend shapes
  private findBlendShapeMesh(object: THREE.Object3D): THREE.SkinnedMesh | null {
    let foundMesh: THREE.SkinnedMesh | null = null
    
    object.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && 
          child.morphTargetInfluences && 
          child.morphTargetInfluences.length > 0) {
        foundMesh = child
      }
    })

    return foundMesh
  }

  // Map blend shape names to indices
  private mapBlendShapes(): void {
    if (!this.blendShapeMesh || !this.blendShapeMesh.morphTargetDictionary) return

    this.blendShapeIndexMap.clear()
    
    for (const [name, index] of Object.entries(this.blendShapeMesh.morphTargetDictionary)) {
      this.blendShapeIndexMap.set(name, index)
    }
  }

  // Process animation queue for keyframe animations
  private processAnimationQueue(): void {
    if (this.animationQueue.length === 0) return

    const currentTime = performance.now()
    
    // Process all active animations
    this.animationQueue = this.animationQueue.filter(animation => {
      const elapsed = currentTime - animation.startTime
      const progress = Math.min(elapsed / animation.duration, 1.0)
      
      if (progress >= 1.0) {
        // Animation completed
        this.emit('animationComplete', {
          type: 'keyframe_animation',
          animationId: animation.id,
          duration: animation.duration
        } as LipSyncEvent)
        return false
      }
      
      // Apply animation at current progress
      this.applyKeyframeAnimation(animation, progress)
      return true
    })
  }

  // Apply keyframe animation with easing
  private applyKeyframeAnimation(animation: LipSyncAnimation, progress: number): void {
    if (!animation.keyframes || animation.keyframes.length === 0) return

    // Find current keyframe segment
    let currentKeyframe = animation.keyframes[0]
    let nextKeyframe = animation.keyframes[0]
    
    for (let i = 0; i < animation.keyframes.length - 1; i++) {
      const keyframe = animation.keyframes[i]
      const nextKf = animation.keyframes[i + 1]
      
      if (progress >= keyframe.time && progress <= nextKf.time) {
        currentKeyframe = keyframe
        nextKeyframe = nextKf
        break
      }
    }
    
    // Calculate local progress between keyframes
    const keyframeDuration = nextKeyframe.time - currentKeyframe.time
    const localProgress = keyframeDuration > 0 
      ? (progress - currentKeyframe.time) / keyframeDuration 
      : 0
    
    // Apply easing based on keyframe settings
    const easedProgress = this.applyEasing(localProgress, currentKeyframe.easing || 'linear')
    
    // Interpolate mouth shape between keyframes
    if (currentKeyframe.mouthShape && nextKeyframe.mouthShape) {
      this.targetMouthShape = this.interpolateMouthShapes(
        currentKeyframe.mouthShape,
        nextKeyframe.mouthShape,
        easedProgress
      )
    }
  }

  // Apply easing function to progress value
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t
      case 'easeOut':
        return 1 - Math.pow(1 - t, 2)
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      case 'bounce':
        if (t < 1 / 2.75) {
          return 7.5625 * t * t
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
        }
      case 'linear':
      default:
        return t
    }
  }



  // Public method to add keyframe animation
  public addKeyframeAnimation(animation: LipSyncAnimation): void {
    animation.startTime = performance.now()
    this.animationQueue.push(animation)
    
    this.emit('animationStarted', {
      type: 'keyframe_animation',
      animationId: animation.id,
      duration: animation.duration
    } as LipSyncEvent)
  }

  // Create mouth shape for facial expressions
  public createMouthShapeForExpression(expression: string): MouthShape {
    const baseShape = this.createNeutralMouthShape()
    
    switch (expression.toLowerCase()) {
      case 'smile':
        return {
          ...baseShape,
          width: 0.6,
          cornerPull: 0.8,
          upperLipRaise: 0.2
        }
      case 'frown':
        return {
          ...baseShape,
          cornerPull: -0.6,
          lowerLipDepress: 0.3
        }
      case 'surprised':
        return {
          ...baseShape,
          openness: 0.6,
          jawDrop: 0.4,
          upperLipRaise: 0.3,
          width: 0.2
        }
      case 'angry':
        return {
          ...baseShape,
          cornerPull: -0.4,
          width: 0.8,
          jawDrop: 0.2,
          lipCompression: 0.3
        }
      case 'happy':
        return {
          ...baseShape,
          cornerPull: 0.9,
          upperLipRaise: 0.2,
          width: 0.7
        }
      default:
        return baseShape
    }
  }

  // Synchronize with body animation timing
  public synchronizeWithBodyAnimation(normalizedTime: number, absoluteTime: number): void {
    // This method can be called by the Animation Blender to synchronize facial animations
    // with body animations for more coherent character performance
    
    if (this.animationQueue.length > 0) {
      // Adjust animation queue timing based on body animation
      this.animationQueue.forEach(animation => {
        if (animation.synchronizeWithBody) {
          // Modify animation timing to match body animation rhythm
          const timeOffset = absoluteTime * 0.1 // Small offset based on body animation
          animation.startTime = Math.max(animation.startTime - timeOffset, 0)
        }
      })
    }

    // Emit synchronization event for external listeners
    this.emit('bodyAnimationSync', {
      type: 'body_sync',
      normalizedTime,
      absoluteTime,
      timestamp: Date.now()
    } as LipSyncEvent)
  }

  // Test facial animation with sample shapes
  testFacialAnimation(): void {
    if (!this.currentModel) {
      console.warn('🎭 No model set for testing')
      return
    }

    console.log('🎭 Testing facial animation...')
    
    const testShapes: MouthShape[] = [
      // Neutral
      this.createNeutralMouthShape(),
      // Open mouth (aa sound)
      { ...this.createNeutralMouthShape(), openness: 0.8, jawDrop: 0.7 },
      // Smile (ee sound)
      { ...this.createNeutralMouthShape(), width: 0.7, cornerPull: 0.5 },
      // Pucker (oo sound)
      { ...this.createNeutralMouthShape(), lipCompression: 0.7, openness: 0.2 }
    ]

    let currentIndex = 0
    const testInterval = setInterval(() => {
      if (currentIndex >= testShapes.length) {
        clearInterval(testInterval)
        this.resetToNeutral()
        console.log('🎭 Facial animation test completed')
        return
      }

      this.targetMouthShape = testShapes[currentIndex]
      this.interpolationT = 0
      
      console.log(`🎭 Testing shape ${currentIndex}:`, testShapes[currentIndex])
      currentIndex++
    }, 1000)
  }
}
