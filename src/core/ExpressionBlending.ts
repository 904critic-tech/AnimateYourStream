// Expression Blending System - Advanced lip sync support
// Combines lip sync animations with facial expressions and emotions
import * as THREE from 'three'
import type { MouthShape, VisemeType } from '../lipSync/types'

export interface FacialExpression {
  name: string
  intensity: number // 0-1, how strong the expression is
  mouthShape: Partial<MouthShape>
  eyeShape: {
    openness: number // 0-1, how open the eyes are
    eyebrowRaise: number // 0-1, eyebrow position
    squint: number // 0-1, eye squinting
  }
  cheekShape: {
    puff: number // 0-1, cheek puffing
    dimple: number // 0-1, dimple formation
  }
  noseShape: {
    flare: number // 0-1, nostril flaring
    wrinkle: number // 0-1, nose wrinkling
  }
  blendWeight: number // 0-1, how much this expression affects the final result
}

export interface ExpressionBlend {
  expressions: FacialExpression[]
  targetMouthShape: MouthShape
  targetEyeShape: FacialExpression['eyeShape']
  targetCheekShape: FacialExpression['cheekShape']
  targetNoseShape: FacialExpression['noseShape']
  blendMode: 'additive' | 'multiplicative' | 'overwrite'
  transitionTime: number // How long to transition to this blend
}

export interface ExpressionBlendingConfig {
  // Blending settings
  defaultBlendMode: 'additive' | 'multiplicative' | 'overwrite'
  maxExpressions: number // Maximum number of expressions to blend
  transitionSpeed: number // How fast to transition between expressions
  
  // Weight settings
  lipSyncWeight: number // How much lip sync affects the final result
  emotionWeight: number // How much emotion affects the final result
  personalityWeight: number // How much personality affects the final result
  
  // Animation settings
  enableSmoothing: boolean // Whether to smooth transitions
  smoothingFactor: number // How much to smooth movements
  enablePhysics: boolean // Whether to use physics for natural movement
}

export interface ExpressionBlendingState {
  currentBlend: ExpressionBlend
  targetBlend: ExpressionBlend
  isTransitioning: boolean
  transitionProgress: number
  activeExpressions: FacialExpression[]
  lastUpdateTime: number
}

export class ExpressionBlending {
  private config: ExpressionBlendingConfig
  private state: ExpressionBlendingState
  private blendShapeMesh: THREE.SkinnedMesh | null = null
  private boneReferences: Map<string, THREE.Bone> = new Map()
  
  // Predefined expressions
  private expressionLibrary: Map<string, FacialExpression> = new Map()
  
  // Blending history for smoothing
  private blendHistory: ExpressionBlend[] = []
  private maxHistorySize = 10

  constructor(config: Partial<ExpressionBlendingConfig> = {}) {
    this.config = {
      defaultBlendMode: 'additive',
      maxExpressions: 3,
      transitionSpeed: 0.1,
      lipSyncWeight: 0.7,
      emotionWeight: 0.8,
      personalityWeight: 0.6,
      enableSmoothing: true,
      smoothingFactor: 0.8,
      enablePhysics: true,
      ...config
    }

    this.state = this.createNeutralState()
    this.initializeExpressionLibrary()
  }

  // Set the 3D model for expression blending
  setModel(blendShapeMesh: THREE.SkinnedMesh, boneReferences?: Map<string, THREE.Bone>): void {
    this.blendShapeMesh = blendShapeMesh
    if (boneReferences) {
      this.boneReferences = boneReferences
    }
    
    console.log('🎭 Agent 4 - Expression blending model set')
  }

  // Add an expression to the current blend
  addExpression(expression: FacialExpression): void {
    // Remove expression if it already exists
    this.state.activeExpressions = this.state.activeExpressions.filter(
      exp => exp.name !== expression.name
    )

    // Add new expression
    this.state.activeExpressions.push(expression)

    // Limit number of active expressions
    if (this.state.activeExpressions.length > this.config.maxExpressions) {
      this.state.activeExpressions = this.state.activeExpressions.slice(-this.config.maxExpressions)
    }

    // Update target blend
    this.updateTargetBlend()
  }

  // Remove an expression from the current blend
  removeExpression(expressionName: string): void {
    this.state.activeExpressions = this.state.activeExpressions.filter(
      exp => exp.name !== expressionName
    )
    this.updateTargetBlend()
  }

  // Set emotion-based expression
  setEmotion(emotion: string, intensity: number = 1.0): void {
    const emotionExpression = this.getEmotionExpression(emotion, intensity)
    if (emotionExpression) {
      this.addExpression(emotionExpression)
    }
  }

  // Blend lip sync with current expressions
  blendWithLipSync(lipSyncMouthShape: MouthShape, viseme: VisemeType): MouthShape {
    // Create a lip sync expression
    const lipSyncExpression: FacialExpression = {
      name: 'lip_sync',
      intensity: 1.0,
      mouthShape: lipSyncMouthShape,
      eyeShape: { openness: 1.0, eyebrowRaise: 0.5, squint: 0.0 },
      cheekShape: { puff: 0.0, dimple: 0.0 },
      noseShape: { flare: 0.0, wrinkle: 0.0 },
      blendWeight: this.config.lipSyncWeight
    }

    // Temporarily add lip sync expression
    const originalExpressions = [...this.state.activeExpressions]
    this.addExpression(lipSyncExpression)

    // Calculate blended mouth shape
    const blendedShape = this.calculateBlendedMouthShape()

    // Restore original expressions
    this.state.activeExpressions = originalExpressions

    return blendedShape
  }

  // Update the blending system
  update(deltaTime: number): void {
    const currentTime = performance.now()
    const dt = (currentTime - this.state.lastUpdateTime) / 1000
    this.state.lastUpdateTime = currentTime

    // Update transition progress
    if (this.state.isTransitioning) {
      this.state.transitionProgress += this.config.transitionSpeed * dt
      
      if (this.state.transitionProgress >= 1.0) {
        this.state.transitionProgress = 1.0
        this.state.isTransitioning = false
        this.state.currentBlend = { ...this.state.targetBlend }
      }
    }

    // Interpolate current blend towards target
    this.interpolateBlend(dt)

    // Apply smoothing if enabled
    if (this.config.enableSmoothing) {
      this.applySmoothing()
    }

    // Apply current blend to 3D model
    this.applyToModel()

    // Update blend history
    this.updateBlendHistory()
  }

  // Get current blended mouth shape
  getCurrentMouthShape(): MouthShape {
    return this.state.currentBlend.targetMouthShape
  }

  // Get current blended eye shape
  getCurrentEyeShape(): FacialExpression['eyeShape'] {
    return this.state.currentBlend.targetEyeShape
  }

  // Reset to neutral expression
  reset(): void {
    this.state = this.createNeutralState()
    this.blendHistory = []
    
    if (this.blendShapeMesh) {
      this.resetBlendShapes()
    }
  }

  // Private methods
  private initializeExpressionLibrary(): void {
    // Basic emotions
    this.addExpressionToLibrary('happy', {
      name: 'happy',
      intensity: 1.0,
      mouthShape: { openness: 0.6, width: 0.8, cornerPull: 0.9, lipCompression: 0.2 },
      eyeShape: { openness: 0.8, eyebrowRaise: 0.3, squint: 0.2 },
      cheekShape: { puff: 0.3, dimple: 0.7 },
      noseShape: { flare: 0.1, wrinkle: 0.0 },
      blendWeight: 1.0
    })

    this.addExpressionToLibrary('sad', {
      name: 'sad',
      intensity: 1.0,
      mouthShape: { openness: 0.3, width: 0.4, cornerPull: 0.2, lipCompression: 0.6 },
      eyeShape: { openness: 0.6, eyebrowRaise: 0.1, squint: 0.4 },
      cheekShape: { puff: 0.0, dimple: 0.0 },
      noseShape: { flare: 0.0, wrinkle: 0.1 },
      blendWeight: 1.0
    })

    this.addExpressionToLibrary('angry', {
      name: 'angry',
      intensity: 1.0,
      mouthShape: { openness: 0.4, width: 0.5, cornerPull: 0.3, lipCompression: 0.8 },
      eyeShape: { openness: 0.9, eyebrowRaise: 0.8, squint: 0.6 },
      cheekShape: { puff: 0.1, dimple: 0.0 },
      noseShape: { flare: 0.3, wrinkle: 0.2 },
      blendWeight: 1.0
    })

    this.addExpressionToLibrary('surprised', {
      name: 'surprised',
      intensity: 1.0,
      mouthShape: { openness: 0.9, width: 0.6, cornerPull: 0.4, lipCompression: 0.1 },
      eyeShape: { openness: 1.0, eyebrowRaise: 0.9, squint: 0.0 },
      cheekShape: { puff: 0.0, dimple: 0.0 },
      noseShape: { flare: 0.2, wrinkle: 0.0 },
      blendWeight: 1.0
    })

    this.addExpressionToLibrary('fearful', {
      name: 'fearful',
      intensity: 1.0,
      mouthShape: { openness: 0.5, width: 0.3, cornerPull: 0.1, lipCompression: 0.4 },
      eyeShape: { openness: 1.0, eyebrowRaise: 0.7, squint: 0.3 },
      cheekShape: { puff: 0.0, dimple: 0.0 },
      noseShape: { flare: 0.1, wrinkle: 0.1 },
      blendWeight: 1.0
    })

    this.addExpressionToLibrary('disgusted', {
      name: 'disgusted',
      intensity: 1.0,
      mouthShape: { openness: 0.2, width: 0.4, cornerPull: 0.1, lipCompression: 0.7 },
      eyeShape: { openness: 0.4, eyebrowRaise: 0.2, squint: 0.8 },
      cheekShape: { puff: 0.2, dimple: 0.0 },
      noseShape: { flare: 0.4, wrinkle: 0.8 },
      blendWeight: 1.0
    })

    // Neutral expression
    this.addExpressionToLibrary('neutral', {
      name: 'neutral',
      intensity: 1.0,
      mouthShape: { openness: 0.1, width: 0.3, lipCompression: 0.1, cornerPull: 0.1 },
      eyeShape: { openness: 0.8, eyebrowRaise: 0.5, squint: 0.0 },
      cheekShape: { puff: 0.0, dimple: 0.0 },
      noseShape: { flare: 0.0, wrinkle: 0.0 },
      blendWeight: 1.0
    })

    console.log(`🎭 Agent 4 - Expression library initialized: ${this.expressionLibrary.size} expressions`)
  }

  private addExpressionToLibrary(name: string, expression: FacialExpression): void {
    this.expressionLibrary.set(name, expression)
  }

  private getEmotionExpression(emotion: string, intensity: number): FacialExpression | null {
    const baseExpression = this.expressionLibrary.get(emotion)
    if (!baseExpression) return null

    // Scale the expression by intensity
    return {
      ...baseExpression,
      intensity,
      mouthShape: this.scaleMouthShape(baseExpression.mouthShape, intensity),
      eyeShape: this.scaleEyeShape(baseExpression.eyeShape, intensity),
      cheekShape: this.scaleCheekShape(baseExpression.cheekShape, intensity),
      noseShape: this.scaleNoseShape(baseExpression.noseShape, intensity)
    }
  }

  private scaleMouthShape(mouthShape: Partial<MouthShape>, intensity: number): Partial<MouthShape> {
    const scaled: Partial<MouthShape> = {}
    Object.entries(mouthShape).forEach(([key, value]) => {
      scaled[key as keyof MouthShape] = value * intensity
    })
    return scaled
  }

  private scaleEyeShape(eyeShape: FacialExpression['eyeShape'], intensity: number): FacialExpression['eyeShape'] {
    return {
      openness: eyeShape.openness * intensity,
      eyebrowRaise: eyeShape.eyebrowRaise * intensity,
      squint: eyeShape.squint * intensity
    }
  }

  private scaleCheekShape(cheekShape: FacialExpression['cheekShape'], intensity: number): FacialExpression['cheekShape'] {
    return {
      puff: cheekShape.puff * intensity,
      dimple: cheekShape.dimple * intensity
    }
  }

  private scaleNoseShape(noseShape: FacialExpression['noseShape'], intensity: number): FacialExpression['noseShape'] {
    return {
      flare: noseShape.flare * intensity,
      wrinkle: noseShape.wrinkle * intensity
    }
  }

  private updateTargetBlend(): void {
    const targetBlend: ExpressionBlend = {
      expressions: [...this.state.activeExpressions],
      targetMouthShape: this.calculateBlendedMouthShape(),
      targetEyeShape: this.calculateBlendedEyeShape(),
      targetCheekShape: this.calculateBlendedCheekShape(),
      targetNoseShape: this.calculateBlendedNoseShape(),
      blendMode: this.config.defaultBlendMode,
      transitionTime: 0.3
    }

    this.state.targetBlend = targetBlend
    this.state.isTransitioning = true
    this.state.transitionProgress = 0
  }

  private calculateBlendedMouthShape(): MouthShape {
    if (this.state.activeExpressions.length === 0) {
      return this.getNeutralMouthShape()
    }

    let blendedShape = this.getNeutralMouthShape()
    let totalWeight = 0

    this.state.activeExpressions.forEach(expression => {
      const weight = expression.blendWeight * expression.intensity
      totalWeight += weight

      if (expression.mouthShape) {
        blendedShape = this.blendMouthShapes(blendedShape, expression.mouthShape, weight)
      }
    })

    // Normalize by total weight
    if (totalWeight > 0) {
      blendedShape = this.normalizeMouthShape(blendedShape, totalWeight)
    }

    return blendedShape
  }

  private calculateBlendedEyeShape(): FacialExpression['eyeShape'] {
    if (this.state.activeExpressions.length === 0) {
      return { openness: 0.8, eyebrowRaise: 0.5, squint: 0.0 }
    }

    let blendedShape = { openness: 0.8, eyebrowRaise: 0.5, squint: 0.0 }
    let totalWeight = 0

    this.state.activeExpressions.forEach(expression => {
      const weight = expression.blendWeight * expression.intensity
      totalWeight += weight

      blendedShape.openness = THREE.MathUtils.lerp(blendedShape.openness, expression.eyeShape.openness, weight)
      blendedShape.eyebrowRaise = THREE.MathUtils.lerp(blendedShape.eyebrowRaise, expression.eyeShape.eyebrowRaise, weight)
      blendedShape.squint = THREE.MathUtils.lerp(blendedShape.squint, expression.eyeShape.squint, weight)
    })

    return blendedShape
  }

  private calculateBlendedCheekShape(): FacialExpression['cheekShape'] {
    if (this.state.activeExpressions.length === 0) {
      return { puff: 0.0, dimple: 0.0 }
    }

    let blendedShape = { puff: 0.0, dimple: 0.0 }
    let totalWeight = 0

    this.state.activeExpressions.forEach(expression => {
      const weight = expression.blendWeight * expression.intensity
      totalWeight += weight

      blendedShape.puff = THREE.MathUtils.lerp(blendedShape.puff, expression.cheekShape.puff, weight)
      blendedShape.dimple = THREE.MathUtils.lerp(blendedShape.dimple, expression.cheekShape.dimple, weight)
    })

    return blendedShape
  }

  private calculateBlendedNoseShape(): FacialExpression['noseShape'] {
    if (this.state.activeExpressions.length === 0) {
      return { flare: 0.0, wrinkle: 0.0 }
    }

    let blendedShape = { flare: 0.0, wrinkle: 0.0 }
    let totalWeight = 0

    this.state.activeExpressions.forEach(expression => {
      const weight = expression.blendWeight * expression.intensity
      totalWeight += weight

      blendedShape.flare = THREE.MathUtils.lerp(blendedShape.flare, expression.noseShape.flare, weight)
      blendedShape.wrinkle = THREE.MathUtils.lerp(blendedShape.wrinkle, expression.noseShape.wrinkle, weight)
    })

    return blendedShape
  }

  private blendMouthShapes(base: MouthShape, modifier: Partial<MouthShape>, weight: number): MouthShape {
    const blended: MouthShape = { ...base }
    
    Object.entries(modifier).forEach(([key, value]) => {
      const k = key as keyof MouthShape
      blended[k] = THREE.MathUtils.lerp(blended[k], value, weight)
    })

    return blended
  }

  private normalizeMouthShape(shape: MouthShape, totalWeight: number): MouthShape {
    const normalized: MouthShape = { ...shape }
    
    Object.keys(shape).forEach(key => {
      const k = key as keyof MouthShape
      normalized[k] = shape[k] / totalWeight
    })

    return normalized
  }

  private interpolateBlend(dt: number): void {
    if (!this.state.isTransitioning) return

    const t = this.state.transitionProgress

    // Interpolate mouth shape
    this.state.currentBlend.targetMouthShape = this.interpolateMouthShapes(
      this.state.currentBlend.targetMouthShape,
      this.state.targetBlend.targetMouthShape,
      t
    )

    // Interpolate eye shape
    this.state.currentBlend.targetEyeShape = this.interpolateEyeShapes(
      this.state.currentBlend.targetEyeShape,
      this.state.targetBlend.targetEyeShape,
      t
    )

    // Interpolate cheek shape
    this.state.currentBlend.targetCheekShape = this.interpolateCheekShapes(
      this.state.currentBlend.targetCheekShape,
      this.state.targetBlend.targetCheekShape,
      t
    )

    // Interpolate nose shape
    this.state.currentBlend.targetNoseShape = this.interpolateNoseShapes(
      this.state.currentBlend.targetNoseShape,
      this.state.targetBlend.targetNoseShape,
      t
    )
  }

  private interpolateMouthShapes(shape1: MouthShape, shape2: MouthShape, t: number): MouthShape {
    return {
      openness: THREE.MathUtils.lerp(shape1.openness, shape2.openness, t),
      width: THREE.MathUtils.lerp(shape1.width, shape2.width, t),
      lipCompression: THREE.MathUtils.lerp(shape1.lipCompression, shape2.lipCompression, t),
      jawDrop: THREE.MathUtils.lerp(shape1.jawDrop, shape2.jawDrop, t),
      tonguePosition: THREE.MathUtils.lerp(shape1.tonguePosition, shape2.tonguePosition, t),
      upperLipRaise: THREE.MathUtils.lerp(shape1.upperLipRaise, shape2.upperLipRaise, t),
      lowerLipDepress: THREE.MathUtils.lerp(shape1.lowerLipDepress, shape2.lowerLipDepress, t),
      cornerPull: THREE.MathUtils.lerp(shape1.cornerPull, shape2.cornerPull, t)
    }
  }

  private interpolateEyeShapes(shape1: FacialExpression['eyeShape'], shape2: FacialExpression['eyeShape'], t: number): FacialExpression['eyeShape'] {
    return {
      openness: THREE.MathUtils.lerp(shape1.openness, shape2.openness, t),
      eyebrowRaise: THREE.MathUtils.lerp(shape1.eyebrowRaise, shape2.eyebrowRaise, t),
      squint: THREE.MathUtils.lerp(shape1.squint, shape2.squint, t)
    }
  }

  private interpolateCheekShapes(shape1: FacialExpression['cheekShape'], shape2: FacialExpression['cheekShape'], t: number): FacialExpression['cheekShape'] {
    return {
      puff: THREE.MathUtils.lerp(shape1.puff, shape2.puff, t),
      dimple: THREE.MathUtils.lerp(shape1.dimple, shape2.dimple, t)
    }
  }

  private interpolateNoseShapes(shape1: FacialExpression['noseShape'], shape2: FacialExpression['noseShape'], t: number): FacialExpression['noseShape'] {
    return {
      flare: THREE.MathUtils.lerp(shape1.flare, shape2.flare, t),
      wrinkle: THREE.MathUtils.lerp(shape1.wrinkle, shape2.wrinkle, t)
    }
  }

  private applySmoothing(): void {
    if (this.blendHistory.length < 2) return

    const smoothingFactor = this.config.smoothingFactor
    const currentBlend = this.blendHistory[this.blendHistory.length - 1]
    const previousBlend = this.blendHistory[this.blendHistory.length - 2]

    // Apply smoothing to mouth shape
    this.state.currentBlend.targetMouthShape = this.interpolateMouthShapes(
      previousBlend.targetMouthShape,
      currentBlend.targetMouthShape,
      smoothingFactor
    )
  }

  private applyToModel(): void {
    if (!this.blendShapeMesh) return

    const morphTargetInfluences = this.blendShapeMesh.morphTargetInfluences
    if (!morphTargetInfluences) return

    const dictionary = this.blendShapeMesh.morphTargetDictionary
    if (!dictionary) return

    const mouthShape = this.state.currentBlend.targetMouthShape
    const eyeShape = this.state.currentBlend.targetEyeShape
    const cheekShape = this.state.currentBlend.targetCheekShape
    const noseShape = this.state.currentBlend.targetNoseShape

    // Apply mouth blend shapes
    this.applyBlendShape(dictionary, morphTargetInfluences, 'mouthOpen', mouthShape.openness)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'mouthWidth', mouthShape.width)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'lipCompression', mouthShape.lipCompression)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'jawDrop', mouthShape.jawDrop)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'cornerPull', mouthShape.cornerPull)

    // Apply eye blend shapes
    this.applyBlendShape(dictionary, morphTargetInfluences, 'eyeOpen', eyeShape.openness)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'eyebrowRaise', eyeShape.eyebrowRaise)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'eyeSquint', eyeShape.squint)

    // Apply cheek blend shapes
    this.applyBlendShape(dictionary, morphTargetInfluences, 'cheekPuff', cheekShape.puff)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'cheekDimple', cheekShape.dimple)

    // Apply nose blend shapes
    this.applyBlendShape(dictionary, morphTargetInfluences, 'noseFlare', noseShape.flare)
    this.applyBlendShape(dictionary, morphTargetInfluences, 'noseWrinkle', noseShape.wrinkle)
  }

  private applyBlendShape(dictionary: { [key: string]: number }, influences: number[], name: string, value: number): void {
    const index = dictionary[name]
    if (index !== undefined) {
      influences[index] = Math.max(0, Math.min(1, value))
    }
  }

  private resetBlendShapes(): void {
    if (!this.blendShapeMesh || !this.blendShapeMesh.morphTargetInfluences) return

    const influences = this.blendShapeMesh.morphTargetInfluences
    for (let i = 0; i < influences.length; i++) {
      influences[i] = 0
    }
  }

  private updateBlendHistory(): void {
    this.blendHistory.push({ ...this.state.currentBlend })
    
    if (this.blendHistory.length > this.maxHistorySize) {
      this.blendHistory = this.blendHistory.slice(-this.maxHistorySize)
    }
  }

  private createNeutralState(): ExpressionBlendingState {
    return {
      currentBlend: {
        expressions: [],
        targetMouthShape: this.getNeutralMouthShape(),
        targetEyeShape: { openness: 0.8, eyebrowRaise: 0.5, squint: 0.0 },
        targetCheekShape: { puff: 0.0, dimple: 0.0 },
        targetNoseShape: { flare: 0.0, wrinkle: 0.0 },
        blendMode: this.config.defaultBlendMode,
        transitionTime: 0.0
      },
      targetBlend: {
        expressions: [],
        targetMouthShape: this.getNeutralMouthShape(),
        targetEyeShape: { openness: 0.8, eyebrowRaise: 0.5, squint: 0.0 },
        targetCheekShape: { puff: 0.0, dimple: 0.0 },
        targetNoseShape: { flare: 0.0, wrinkle: 0.0 },
        blendMode: this.config.defaultBlendMode,
        transitionTime: 0.0
      },
      isTransitioning: false,
      transitionProgress: 0,
      activeExpressions: [],
      lastUpdateTime: performance.now()
    }
  }

  private getNeutralMouthShape(): MouthShape {
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

  // Get current state
  getCurrentState(): ExpressionBlendingState {
    return { ...this.state }
  }

  // Get available expressions
  getAvailableExpressions(): string[] {
    return Array.from(this.expressionLibrary.keys())
  }
}

// Export singleton instance
export const expressionBlending = new ExpressionBlending()

// Export for global access (debugging)
if (typeof window !== 'undefined') {
  (window as any).__EXPRESSION_BLENDING__ = expressionBlending
}
