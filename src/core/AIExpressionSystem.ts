// AI Expression System - Phase 4 Priority 3
// Advanced AI-driven facial expressions, eye movement, blinking, and head gestures
import * as THREE from 'three'
import { enhancedAudioProcessor, type EmotionAnalysis } from './EnhancedAudioProcessor'
import { expressionBlending, type FacialExpression } from './ExpressionBlending'

export interface EyeMovement {
  gazeDirection: THREE.Vector3
  blinkState: 'open' | 'closing' | 'closed' | 'opening'
  blinkProgress: number // 0-1
  saccadeTarget: THREE.Vector3 | null
  smoothPursuit: boolean
  microMovements: THREE.Vector3[]
}

export interface HeadMovement {
  rotation: THREE.Euler
  position: THREE.Vector3
  targetRotation: THREE.Euler
  targetPosition: THREE.Vector3
  movementType: 'idle' | 'nod' | 'shake' | 'tilt' | 'turn' | 'follow'
  movementProgress: number // 0-1
  naturalSway: THREE.Vector3
}

export interface AIExpressionState {
  currentEmotion: string
  emotionIntensity: number
  eyeMovement: EyeMovement
  headMovement: HeadMovement
  microExpressions: FacialExpression[]
  personalityTraits: PersonalityTraits
  attentionTarget: THREE.Vector3 | null
  isEngaged: boolean
  lastUpdateTime: number
}

export interface PersonalityTraits {
  openness: number // 0-1, how open to new experiences
  conscientiousness: number // 0-1, how organized and careful
  extraversion: number // 0-1, how outgoing and energetic
  agreeableness: number // 0-1, how cooperative and trusting
  neuroticism: number // 0-1, how sensitive to stress
  expressiveness: number // 0-1, how much facial expression is shown
  eyeContact: number // 0-1, how much eye contact is maintained
  headMovement: number // 0-1, how much head movement occurs
}

export interface AIExpressionConfig {
  // Eye movement settings
  blinkRate: number // blinks per minute
  blinkDuration: number // seconds
  saccadeSpeed: number // degrees per second
  smoothPursuitSpeed: number // degrees per second
  microMovementIntensity: number // 0-1
  
  // Head movement settings
  headSwayAmount: number // degrees
  headSwaySpeed: number // cycles per second
  nodFrequency: number // nods per minute
  turnSpeed: number // degrees per second
  
  // Expression settings
  emotionTransitionSpeed: number // 0-1
  microExpressionDuration: number // seconds
  personalityInfluence: number // 0-1
  
  // AI behavior settings
  attentionSpan: number // seconds
  engagementThreshold: number // 0-1
  naturalVariation: number // 0-1
}

export class AIExpressionSystem {
  private config: AIExpressionConfig
  private state: AIExpressionState
  private modelRef: THREE.Object3D | null = null
  private headBone: THREE.Bone | null = null
  private eyeBones: THREE.Bone[] = []
  private blendShapeMesh: THREE.SkinnedMesh | null = null
  
  // 🎭 Agent 4 - Temporary disable for testing
  private headMovementDisabled: boolean = true // Temporarily disable head movement
  
  // AI behavior state
  private behaviorTimer: number = 0
  private lastBlinkTime: number = 0
  private lastNodTime: number = 0
  private attentionTimer: number = 0
  private emotionTimer: number = 0
  
  // Natural movement patterns
  private naturalEyeMovement: THREE.Vector3[] = []
  private naturalHeadSway: THREE.Vector3[] = []
  private personalityInfluence: Map<string, number> = new Map()

  constructor(config: Partial<AIExpressionConfig> = {}) {
    this.config = {
      blinkRate: 15, // 15 blinks per minute
      blinkDuration: 0.15, // 150ms blink duration
      saccadeSpeed: 500, // 500 degrees per second
      smoothPursuitSpeed: 30, // 30 degrees per second
      microMovementIntensity: 0.3,
      headSwayAmount: 0.5, // Reduced from 2 degrees to 0.5 degrees
      headSwaySpeed: 0.5, // 0.5 cycles per second
      nodFrequency: 2, // 2 nods per minute
      turnSpeed: 90, // 90 degrees per second
      emotionTransitionSpeed: 0.1,
      microExpressionDuration: 0.5,
      personalityInfluence: 0.7,
      attentionSpan: 5, // 5 seconds
      engagementThreshold: 0.6,
      naturalVariation: 0.3,
      ...config
    }

    this.state = this.createInitialState()
    this.initializeNaturalMovements()
    this.initializePersonalityInfluence()
    
    console.log('🎭 Agent 4 - AI Expression System initialized')
  }

  // Set the 3D model for AI expression system
  setModel(model: THREE.Object3D, headBone?: THREE.Bone, eyeBones?: THREE.Bone[], blendShapeMesh?: THREE.SkinnedMesh): void {
    this.modelRef = model
    this.headBone = headBone || this.findHeadBone(model)
    this.eyeBones = eyeBones || this.findEyeBones(model)
    this.blendShapeMesh = blendShapeMesh || this.findBlendShapeMesh(model)
    
    console.log('🎭 Agent 4 - AI Expression System model set:', {
      hasModel: !!this.modelRef,
      hasHeadBone: !!this.headBone,
      eyeBoneCount: this.eyeBones.length,
      hasBlendShapeMesh: !!this.blendShapeMesh
    })
  }

  // Update AI expression system
  update(deltaTime: number): void {
    const currentTime = performance.now()
    this.behaviorTimer += deltaTime
    this.attentionTimer += deltaTime
    this.emotionTimer += deltaTime

    // Update AI behavior based on personality and current state
    this.updateAIBehavior(deltaTime)
    
    // Update eye movement
    this.updateEyeMovement(deltaTime)
    
    // Update head movement
    this.updateHeadMovement(deltaTime)
    
    // Update micro expressions
    this.updateMicroExpressions(deltaTime)
    
    // Apply changes to 3D model
    this.applyToModel()
    
    // Update state
    this.state.lastUpdateTime = currentTime
  }

  // Set emotion with AI-driven behavior
  setEmotion(emotion: string, intensity: number = 1.0): void {
    this.state.currentEmotion = emotion
    this.state.emotionIntensity = intensity
    
    // Update personality influence based on emotion
    this.updatePersonalityInfluence(emotion, intensity)
    
    // Trigger emotion-specific behaviors
    this.triggerEmotionBehavior(emotion, intensity)
  }

  // Set personality traits
  setPersonality(traits: Partial<PersonalityTraits>): void {
    this.state.personalityTraits = { ...this.state.personalityTraits, ...traits }
    this.updatePersonalityInfluence(this.state.currentEmotion, this.state.emotionIntensity)
  }

  // Set attention target for gaze direction
  setAttentionTarget(target: THREE.Vector3 | null): void {
    this.state.attentionTarget = target
    this.attentionTimer = 0
    
    if (target) {
      // Calculate gaze direction
      const gazeDirection = target.clone().sub(this.getHeadPosition()).normalize()
      this.state.eyeMovement.gazeDirection.copy(gazeDirection)
      this.state.eyeMovement.smoothPursuit = true
    } else {
      this.state.eyeMovement.smoothPursuit = false
    }
  }

  // Get current AI expression state
  getCurrentState(): AIExpressionState {
    return { ...this.state }
  }

  // Private methods
  private createInitialState(): AIExpressionState {
    return {
      currentEmotion: 'neutral',
      emotionIntensity: 0.5,
      eyeMovement: {
        gazeDirection: new THREE.Vector3(0, 0, 1),
        blinkState: 'open',
        blinkProgress: 0,
        saccadeTarget: null,
        smoothPursuit: false,
        microMovements: []
      },
      headMovement: {
        rotation: new THREE.Euler(0, 0, 0),
        position: new THREE.Vector3(0, 0, 0),
        targetRotation: new THREE.Euler(0, 0, 0),
        targetPosition: new THREE.Vector3(0, 0, 0),
        movementType: 'idle',
        movementProgress: 0,
        naturalSway: new THREE.Vector3(0, 0, 0)
      },
      microExpressions: [],
      personalityTraits: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
        expressiveness: 0.5,
        eyeContact: 0.5,
        headMovement: 0.5
      },
      attentionTarget: null,
      isEngaged: true,
      lastUpdateTime: performance.now()
    }
  }

  private initializeNaturalMovements(): void {
    // Generate natural eye movement patterns
    for (let i = 0; i < 20; i++) {
      this.naturalEyeMovement.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        1
      ))
    }

    // Generate natural head sway patterns
    for (let i = 0; i < 10; i++) {
      this.naturalHeadSway.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01,
        0
      ))
    }
  }

  private initializePersonalityInfluence(): void {
    this.personalityInfluence.set('openness', 1.0)
    this.personalityInfluence.set('conscientiousness', 1.0)
    this.personalityInfluence.set('extraversion', 1.0)
    this.personalityInfluence.set('agreeableness', 1.0)
    this.personalityInfluence.set('neuroticism', 1.0)
    this.personalityInfluence.set('expressiveness', 1.0)
    this.personalityInfluence.set('eyeContact', 1.0)
    this.personalityInfluence.set('headMovement', 1.0)
  }

  private updateAIBehavior(deltaTime: number): void {
    const personality = this.state.personalityTraits
    
    // Update engagement based on attention span
    if (this.attentionTimer > this.config.attentionSpan) {
      this.state.isEngaged = Math.random() > (1 - personality.eyeContact)
      if (!this.state.isEngaged) {
        this.triggerDistractionBehavior()
      }
    }

    // Natural blinking based on personality
    const blinkInterval = (60 / this.config.blinkRate) * (1 + (personality.neuroticism - 0.5) * 0.5)
    if (this.behaviorTimer - this.lastBlinkTime > blinkInterval) {
      this.triggerBlink()
      this.lastBlinkTime = this.behaviorTimer
    }

    // Natural head movements based on personality
    const nodInterval = (60 / this.config.nodFrequency) * (1 + (personality.headMovement - 0.5) * 0.5)
    if (this.behaviorTimer - this.lastNodTime > nodInterval) {
      this.triggerHeadMovement()
      this.lastNodTime = this.behaviorTimer
    }

    // Emotion-driven micro expressions
    if (this.emotionTimer > this.config.microExpressionDuration) {
      this.triggerMicroExpression()
      this.emotionTimer = 0
    }
  }

  private updateEyeMovement(deltaTime: number): void {
    const eyeMovement = this.state.eyeMovement
    const personality = this.state.personalityTraits

    // Update blinking
    if (eyeMovement.blinkState === 'closing') {
      eyeMovement.blinkProgress += deltaTime / (this.config.blinkDuration * 0.4)
      if (eyeMovement.blinkProgress >= 1) {
        eyeMovement.blinkState = 'closed'
        eyeMovement.blinkProgress = 1
      }
    } else if (eyeMovement.blinkState === 'opening') {
      eyeMovement.blinkProgress -= deltaTime / (this.config.blinkDuration * 0.6)
      if (eyeMovement.blinkProgress <= 0) {
        eyeMovement.blinkState = 'open'
        eyeMovement.blinkProgress = 0
      }
    }

    // Update gaze direction
    if (this.state.attentionTarget && eyeMovement.smoothPursuit) {
      // Smooth pursuit of attention target
      const targetDirection = this.state.attentionTarget.clone().sub(this.getHeadPosition()).normalize()
      eyeMovement.gazeDirection.lerp(targetDirection, this.config.smoothPursuitSpeed * deltaTime)
    } else {
      // Natural eye movement with personality influence
      this.updateNaturalEyeMovement(deltaTime)
    }

    // Micro movements for realism
    this.updateEyeMicroMovements(deltaTime)
  }

  private updateHeadMovement(deltaTime: number): void {
    const headMovement = this.state.headMovement
    const personality = this.state.personalityTraits

    // Natural head sway
    const swayTime = this.behaviorTimer * this.config.headSwaySpeed * 2 * Math.PI
    headMovement.naturalSway.set(
      Math.sin(swayTime) * this.config.headSwayAmount * personality.headMovement * 0.001, // Reduced from 0.01
      Math.cos(swayTime * 0.7) * this.config.headSwayAmount * personality.headMovement * 0.0005, // Reduced from 0.005
      0
    )

    // Update movement progress
    if (headMovement.movementType !== 'idle') {
      headMovement.movementProgress += deltaTime / 0.5 // 0.5 second movement duration
      if (headMovement.movementProgress >= 1) {
        headMovement.movementType = 'idle'
        headMovement.movementProgress = 0
      }
    }

    // Apply natural sway to rotation
    // headMovement.rotation.x += headMovement.naturalSway.x
    // headMovement.rotation.y += headMovement.naturalSway.y

    // Interpolate towards target rotation
    headMovement.rotation.x = THREE.MathUtils.lerp(
      headMovement.rotation.x,
      headMovement.targetRotation.x,
      this.config.turnSpeed * deltaTime
    )
    headMovement.rotation.y = THREE.MathUtils.lerp(
      headMovement.rotation.y,
      headMovement.targetRotation.y,
      this.config.turnSpeed * deltaTime
    )
  }

  private updateMicroExpressions(deltaTime: number): void {
    const personality = this.state.personalityTraits
    const expressiveness = personality.expressiveness

    // Remove expired micro expressions
    this.state.microExpressions = this.state.microExpressions.filter(expr => {
      expr.intensity -= deltaTime / this.config.microExpressionDuration
      return expr.intensity > 0
    })

    // Apply micro expressions to expression blending
    this.state.microExpressions.forEach(expr => {
      const scaledExpression = { ...expr }
      scaledExpression.intensity *= expressiveness
      expressionBlending.addExpression(scaledExpression)
    })
  }

  private updateNaturalEyeMovement(deltaTime: number): void {
    const eyeMovement = this.state.eyeMovement
    const personality = this.state.personalityTraits

    // Saccadic eye movements
    if (!eyeMovement.saccadeTarget) {
      // Generate new saccade target
      const randomIndex = Math.floor(Math.random() * this.naturalEyeMovement.length)
      eyeMovement.saccadeTarget = this.naturalEyeMovement[randomIndex].clone()
    }

    // Move towards saccade target
    if (eyeMovement.saccadeTarget) {
      const distance = eyeMovement.gazeDirection.distanceTo(eyeMovement.saccadeTarget)
      if (distance > 0.01) {
        eyeMovement.gazeDirection.lerp(eyeMovement.saccadeTarget, this.config.saccadeSpeed * deltaTime)
      } else {
        eyeMovement.saccadeTarget = null
      }
    }
  }

  private updateEyeMicroMovements(deltaTime: number): void {
    const eyeMovement = this.state.eyeMovement
    const personality = this.state.personalityTraits

    // Add micro movements for realism
    const microMovement = new THREE.Vector3(
      (Math.random() - 0.5) * this.config.microMovementIntensity * 0.01,
      (Math.random() - 0.5) * this.config.microMovementIntensity * 0.01,
      0
    )

    eyeMovement.microMovements.push(microMovement)
    if (eyeMovement.microMovements.length > 5) {
      eyeMovement.microMovements.shift()
    }

    // Apply micro movements to gaze direction
    const totalMicroMovement = new THREE.Vector3()
    eyeMovement.microMovements.forEach(movement => {
      totalMicroMovement.add(movement)
    })
    totalMicroMovement.multiplyScalar(1 / eyeMovement.microMovements.length)

    eyeMovement.gazeDirection.add(totalMicroMovement)
    eyeMovement.gazeDirection.normalize()
  }

  private triggerBlink(): void {
    if (this.state.eyeMovement.blinkState === 'open') {
      this.state.eyeMovement.blinkState = 'closing'
      this.state.eyeMovement.blinkProgress = 0
    }
  }

  private triggerHeadMovement(): void {
    const personality = this.state.personalityTraits
    const movementTypes = ['nod', 'shake', 'tilt'] as const
    const selectedType = movementTypes[Math.floor(Math.random() * movementTypes.length)]

    this.state.headMovement.movementType = selectedType
    this.state.headMovement.movementProgress = 0

    // Set target rotation based on movement type
    const baseRotation = new THREE.Euler(0, 0, 0)
    const intensity = personality.headMovement

    switch (selectedType) {
      case 'nod':
        baseRotation.x = Math.PI * 0.1 * intensity // 18 degrees
        break
      case 'shake':
        baseRotation.y = Math.PI * 0.15 * intensity // 27 degrees
        break
      case 'tilt':
        baseRotation.z = Math.PI * 0.1 * intensity // 18 degrees
        break
    }

    this.state.headMovement.targetRotation.copy(baseRotation)
  }

  private triggerMicroExpression(): void {
    const emotion = this.state.currentEmotion
    const intensity = this.state.emotionIntensity * 0.3 // Subtle micro expressions

    // Create micro expression based on current emotion
    const microExpression: FacialExpression = {
      name: `micro_${emotion}`,
      intensity,
      mouthShape: this.getEmotionMouthShape(emotion, intensity * 0.5),
      eyeShape: this.getEmotionEyeShape(emotion, intensity * 0.5),
      cheekShape: { puff: 0, dimple: 0 },
      noseShape: { flare: 0, wrinkle: 0 },
      blendWeight: 0.3
    }

    this.state.microExpressions.push(microExpression)
  }

  private triggerDistractionBehavior(): void {
    // Look away when not engaged
    const randomDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize()

    this.state.eyeMovement.gazeDirection.copy(randomDirection)
    this.state.eyeMovement.smoothPursuit = false
  }

  private triggerEmotionBehavior(emotion: string, intensity: number): void {
    const personality = this.state.personalityTraits
    const attentionTarget = this.state.attentionTarget

    switch (emotion) {
      case 'happy':
        // More eye contact and head movement when happy
        this.state.headMovement.targetRotation.y = Math.PI * 0.02 * intensity // Reduced from 0.05
        break
      case 'sad':
        // Less eye contact and downward gaze when sad
        this.state.eyeMovement.gazeDirection.y = -0.3 * intensity
        break
      case 'angry':
        // Intense gaze and forward head position when angry
        this.state.eyeMovement.gazeDirection.z = 1.2 * intensity
        this.state.headMovement.targetPosition.z = 0.1 * intensity
        break
      case 'surprised':
        // Wide eyes and backward head movement when surprised
        this.state.headMovement.targetPosition.z = -0.1 * intensity
        break
      case 'fearful':
        // Avoidant gaze and defensive head position when fearful
        this.state.eyeMovement.gazeDirection.y = -0.2 * intensity
        this.state.headMovement.targetRotation.y = -Math.PI * 0.02 * intensity // Reduced from 0.1
        break
    }

    if (attentionTarget) {
      if (attentionTarget.x > 0.5) {
        // Look left
        this.state.headMovement.targetRotation.y = Math.PI * 0.02 * intensity // Reduced from 0.05
      } else if (attentionTarget.x < -0.5) {
        // Look right
        this.state.headMovement.targetRotation.y = -Math.PI * 0.02 * intensity // Reduced from 0.1
      }
    }
  }

  private updatePersonalityInfluence(emotion: string, intensity: number): void {
    const personality = this.state.personalityTraits

    // Update personality influence based on emotion
    this.personalityInfluence.set('expressiveness', personality.expressiveness * intensity)
    this.personalityInfluence.set('eyeContact', personality.eyeContact * intensity)
    this.personalityInfluence.set('headMovement', personality.headMovement * intensity)

    // Emotion-specific personality adjustments
    switch (emotion) {
      case 'happy':
        this.personalityInfluence.set('extraversion', personality.extraversion * 1.2)
        break
      case 'sad':
        this.personalityInfluence.set('neuroticism', personality.neuroticism * 1.3)
        break
      case 'angry':
        this.personalityInfluence.set('agreeableness', personality.agreeableness * 0.8)
        break
      case 'surprised':
        this.personalityInfluence.set('openness', personality.openness * 1.1)
        break
    }
  }

  private getEmotionMouthShape(emotion: string, intensity: number): Partial<import('../lipSync/types').MouthShape> {
    switch (emotion) {
      case 'happy':
        return { openness: 0.6 * intensity, width: 0.8 * intensity, cornerPull: 0.9 * intensity }
      case 'sad':
        return { openness: 0.3 * intensity, width: 0.4 * intensity, cornerPull: 0.2 * intensity }
      case 'angry':
        return { openness: 0.4 * intensity, width: 0.5 * intensity, lipCompression: 0.8 * intensity }
      case 'surprised':
        return { openness: 0.9 * intensity, width: 0.6 * intensity }
      case 'fearful':
        return { openness: 0.5 * intensity, width: 0.3 * intensity, lipCompression: 0.4 * intensity }
      default:
        return {}
    }
  }

  private getEmotionEyeShape(emotion: string, intensity: number): FacialExpression['eyeShape'] {
    switch (emotion) {
      case 'happy':
        return { openness: 0.8 * intensity, eyebrowRaise: 0.3 * intensity, squint: 0.2 * intensity }
      case 'sad':
        return { openness: 0.6 * intensity, eyebrowRaise: 0.1 * intensity, squint: 0.4 * intensity }
      case 'angry':
        return { openness: 0.9 * intensity, eyebrowRaise: 0.8 * intensity, squint: 0.6 * intensity }
      case 'surprised':
        return { openness: 1.0 * intensity, eyebrowRaise: 0.9 * intensity, squint: 0.0 }
      case 'fearful':
        return { openness: 1.0 * intensity, eyebrowRaise: 0.7 * intensity, squint: 0.3 * intensity }
      default:
        return { openness: 0.8 * intensity, eyebrowRaise: 0.5 * intensity, squint: 0.0 }
    }
  }

  private applyToModel(): void {
    if (!this.modelRef) return

    // Apply eye movement to eye bones
    if (this.eyeBones.length > 0) {
      this.applyEyeMovement()
    }

    // Apply head movement to head bone
    if (this.headBone) {
      this.applyHeadMovement()
    }

    // Apply blend shapes for micro expressions
    if (this.blendShapeMesh) {
      this.applyBlendShapes()
    }
  }

  private applyEyeMovement(): void {
    const eyeMovement = this.state.eyeMovement
    const gazeDirection = eyeMovement.gazeDirection

    // Calculate eye rotation from gaze direction
    const eyeRotation = new THREE.Euler(
      Math.atan2(-gazeDirection.y, Math.sqrt(gazeDirection.x * gazeDirection.x + gazeDirection.z * gazeDirection.z)),
      Math.atan2(gazeDirection.x, gazeDirection.z),
      0
    )

    // Apply rotation to eye bones
    this.eyeBones.forEach(eyeBone => {
      eyeBone.rotation.copy(eyeRotation)
    })

    // Apply blink to blend shapes
    if (this.blendShapeMesh && this.blendShapeMesh.morphTargetDictionary) {
      const blinkValue = eyeMovement.blinkState === 'closed' ? 1 : 
                        eyeMovement.blinkState === 'closing' ? eyeMovement.blinkProgress :
                        eyeMovement.blinkState === 'opening' ? 1 - eyeMovement.blinkProgress : 0

      const blinkIndex = this.blendShapeMesh.morphTargetDictionary['eyeBlink']
      if (blinkIndex !== undefined) {
        this.blendShapeMesh.morphTargetInfluences![blinkIndex] = blinkValue
      }
    }
  }

  private applyHeadMovement(): void {
    if (!this.headBone) return

    // 🎭 Agent 4 - Temporarily disable head movement to prevent spinning
    return // Disable all head movement for now
  }

  private applyBlendShapes(): void {
    if (!this.blendShapeMesh || !this.blendShapeMesh.morphTargetDictionary || !this.blendShapeMesh.morphTargetInfluences) return

    const dictionary = this.blendShapeMesh.morphTargetDictionary
    const influences = this.blendShapeMesh.morphTargetInfluences

    // Apply micro expression blend shapes
    this.state.microExpressions.forEach(expr => {
      if (expr.mouthShape) {
        Object.entries(expr.mouthShape).forEach(([key, value]) => {
          const index = dictionary[key]
          if (index !== undefined) {
            influences[index] = Math.max(0, Math.min(1, value * expr.intensity))
          }
        })
      }
    })
  }

  private getHeadPosition(): THREE.Vector3 {
    if (this.headBone) {
      return this.headBone.getWorldPosition(new THREE.Vector3())
    }
    return new THREE.Vector3(0, 0, 0)
  }

  private findHeadBone(model: THREE.Object3D): THREE.Bone | null {
    const findBone = (obj: THREE.Object3D, name: string): THREE.Bone | null => {
      if (obj instanceof THREE.Bone && obj.name.toLowerCase().includes(name.toLowerCase())) {
        return obj
      }
      for (const child of obj.children) {
        const found = findBone(child, name)
        if (found) return found
      }
      return null
    }

    return findBone(model, 'head') || findBone(model, 'neck') || null
  }

  private findEyeBones(model: THREE.Object3D): THREE.Bone[] {
    const eyeBones: THREE.Bone[] = []
    
    const findEyeBones = (obj: THREE.Object3D): void => {
      if (obj instanceof THREE.Bone && obj.name.toLowerCase().includes('eye')) {
        eyeBones.push(obj)
      }
      for (const child of obj.children) {
        findEyeBones(child)
      }
    }

    findEyeBones(model)
    return eyeBones
  }

  private findBlendShapeMesh(model: THREE.Object3D): THREE.SkinnedMesh | null {
    const findBlendShapeMesh = (obj: THREE.Object3D): THREE.SkinnedMesh | null => {
      if (obj instanceof THREE.SkinnedMesh && obj.morphTargetDictionary) {
        return obj
      }
      for (const child of obj.children) {
        const found = findBlendShapeMesh(child)
        if (found) return found
      }
      return null
    }

    return findBlendShapeMesh(model)
  }
}

// Export singleton instance
export const aiExpressionSystem = new AIExpressionSystem()

// Export for global access (debugging)
if (typeof window !== 'undefined') {
  (window as any).__AI_EXPRESSION_SYSTEM__ = aiExpressionSystem
}
