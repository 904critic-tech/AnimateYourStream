// Jaw and Tongue Movement Simulation - Advanced lip sync support
// Provides realistic jaw and tongue animations based on phonemes and speech patterns
import * as THREE from 'three'
import type { MouthShape, VisemeType } from '../lipSync/types'

export interface JawMovement {
  rotation: THREE.Euler
  translation: THREE.Vector3
  stiffness: number // 0-1, how rigid the jaw movement is
  damping: number // 0-1, how much to dampen oscillations
}

export interface TongueMovement {
  position: THREE.Vector3 // Relative to mouth center
  shape: 'flat' | 'curved' | 'pointed' | 'rolled'
  elevation: number // 0-1, how high the tongue is
  advancement: number // 0-1, how far forward the tongue is
  tension: number // 0-1, muscle tension
}

export interface JawTongueConfig {
  // Jaw settings
  maxJawRotation: number // Maximum jaw rotation in radians
  jawRotationAxis: 'x' | 'y' | 'z'
  jawStiffness: number // 0-1
  jawDamping: number // 0-1
  
  // Tongue settings
  maxTongueElevation: number // Maximum tongue height
  maxTongueAdvancement: number // Maximum tongue forward movement
  tongueStiffness: number // 0-1
  tongueDamping: number // 0-1
  
  // Animation settings
  interpolationSpeed: number // How fast to interpolate between states
  smoothingFactor: number // How much to smooth movements
  enablePhysics: boolean // Whether to use physics simulation
}

export interface JawTongueState {
  jaw: JawMovement
  tongue: TongueMovement
  isActive: boolean
  currentPhoneme: string
  targetPhoneme: string
  interpolationProgress: number
}

export class JawTongueSimulation {
  private config: JawTongueConfig
  private currentState: JawTongueState
  private targetState: JawTongueState
  private jawBone: THREE.Bone | null = null
  private tongueBones: THREE.Bone[] = []
  private blendShapeMesh: THREE.SkinnedMesh | null = null
  
  // Physics simulation
  private jawVelocity = new THREE.Vector3()
  private tongueVelocity = new THREE.Vector3()
  private lastUpdateTime = 0

  // Phoneme-specific jaw and tongue positions
  private phonemeJawPositions: Map<string, JawMovement> = new Map()
  private phonemeTonguePositions: Map<string, TongueMovement> = new Map()

  constructor(config: Partial<JawTongueConfig> = {}) {
    this.config = {
      maxJawRotation: 0.5,
      jawRotationAxis: 'x',
      jawStiffness: 0.8,
      jawDamping: 0.7,
      maxTongueElevation: 0.8,
      maxTongueAdvancement: 0.6,
      tongueStiffness: 0.9,
      tongueDamping: 0.8,
      interpolationSpeed: 0.1,
      smoothingFactor: 0.8,
      enablePhysics: true,
      ...config
    }

    this.currentState = this.createNeutralState()
    this.targetState = this.createNeutralState()
    
    this.initializePhonemePositions()
  }

  // Set the 3D model bones and blend shapes
  setModel(jawBone: THREE.Bone, tongueBones: THREE.Bone[], blendShapeMesh?: THREE.SkinnedMesh): void {
    this.jawBone = jawBone
    this.tongueBones = tongueBones
    this.blendShapeMesh = blendShapeMesh || null
    
    console.log('🎭 Agent 4 - Jaw and tongue simulation model set')
  }

  // Update simulation based on mouth shape and phoneme
  update(mouthShape: MouthShape, phoneme: string, deltaTime: number): void {
    if (!this.jawBone) return

    const currentTime = performance.now()
    const dt = (currentTime - this.lastUpdateTime) / 1000
    this.lastUpdateTime = currentTime

    // Get target jaw and tongue positions for the phoneme
    const targetJaw = this.getJawPositionForPhoneme(phoneme, mouthShape)
    const targetTongue = this.getTonguePositionForPhoneme(phoneme, mouthShape)

    // Update target state
    this.targetState = {
      jaw: targetJaw,
      tongue: targetTongue,
      isActive: true,
      currentPhoneme: this.currentState.currentPhoneme,
      targetPhoneme: phoneme,
      interpolationProgress: 0
    }

    // Interpolate current state towards target
    this.interpolateState(deltaTime)

    // Apply physics simulation if enabled
    if (this.config.enablePhysics) {
      this.applyPhysics(dt)
    }

    // Apply current state to 3D model
    this.applyToModel()
  }

  // Get jaw position for a specific phoneme
  getJawPositionForPhoneme(phoneme: string, mouthShape: MouthShape): JawMovement {
    // Check if we have a cached position for this phoneme
    if (this.phonemeJawPositions.has(phoneme)) {
      const cached = this.phonemeJawPositions.get(phoneme)!
      return {
        ...cached,
        rotation: cached.rotation.clone(),
        translation: cached.translation.clone()
      }
    }

    // Calculate jaw position based on mouth shape and phoneme type
    const jawRotation = this.calculateJawRotation(phoneme, mouthShape)
    const jawTranslation = this.calculateJawTranslation(phoneme, mouthShape)
    
    const jawMovement: JawMovement = {
      rotation: jawRotation,
      translation: jawTranslation,
      stiffness: this.config.jawStiffness,
      damping: this.config.jawDamping
    }

    // Cache the result
    this.phonemeJawPositions.set(phoneme, jawMovement)
    
    return jawMovement
  }

  // Get tongue position for a specific phoneme
  getTonguePositionForPhoneme(phoneme: string, mouthShape: MouthShape): TongueMovement {
    // Check if we have a cached position for this phoneme
    if (this.phonemeTonguePositions.has(phoneme)) {
      const cached = this.phonemeTonguePositions.get(phoneme)!
      return {
        ...cached,
        position: cached.position.clone()
      }
    }

    // Calculate tongue position based on phoneme type
    const tonguePosition = this.calculateTonguePosition(phoneme, mouthShape)
    const tongueShape = this.getTongueShapeForPhoneme(phoneme)
    
    const tongueMovement: TongueMovement = {
      position: tonguePosition,
      shape: tongueShape,
      elevation: this.calculateTongueElevation(phoneme),
      advancement: this.calculateTongueAdvancement(phoneme),
      tension: this.calculateTongueTension(phoneme)
    }

    // Cache the result
    this.phonemeTonguePositions.set(phoneme, tongueMovement)
    
    return tongueMovement
  }

  // Calculate jaw rotation based on phoneme and mouth shape
  private calculateJawRotation(phoneme: string, mouthShape: MouthShape): THREE.Euler {
    const baseRotation = mouthShape.jawDrop * this.config.maxJawRotation
    
    // Phoneme-specific adjustments
    let rotationMultiplier = 1.0
    
    // Vowels - more jaw movement
    if (this.isVowel(phoneme)) {
      rotationMultiplier = 1.2
    }
    // Consonants - less jaw movement
    else if (this.isConsonant(phoneme)) {
      rotationMultiplier = 0.8
    }
    // Plosives - minimal jaw movement
    else if (this.isPlosive(phoneme)) {
      rotationMultiplier = 0.6
    }

    const finalRotation = baseRotation * rotationMultiplier
    
    switch (this.config.jawRotationAxis) {
      case 'x':
        return new THREE.Euler(finalRotation, 0, 0)
      case 'y':
        return new THREE.Euler(0, finalRotation, 0)
      case 'z':
        return new THREE.Euler(0, 0, finalRotation)
      default:
        return new THREE.Euler(finalRotation, 0, 0)
    }
  }

  // Calculate jaw translation (slight forward/backward movement)
  private calculateJawTranslation(phoneme: string, mouthShape: MouthShape): THREE.Vector3 {
    const baseTranslation = mouthShape.jawDrop * 0.1 // Small forward movement
    
    // Phoneme-specific adjustments
    let translationMultiplier = 1.0
    
    if (this.isVowel(phoneme)) {
      translationMultiplier = 1.1 // Slight forward for vowels
    } else if (this.isPlosive(phoneme)) {
      translationMultiplier = 0.9 // Slight back for plosives
    }

    return new THREE.Vector3(0, 0, baseTranslation * translationMultiplier)
  }

  // Calculate tongue position based on phoneme
  private calculateTonguePosition(phoneme: string, mouthShape: MouthShape): THREE.Vector3 {
    const elevation = this.calculateTongueElevation(phoneme)
    const advancement = this.calculateTongueAdvancement(phoneme)
    
    // Base tongue position (relative to mouth center)
    const baseX = advancement * 0.3 - 0.15 // Forward/backward
    const baseY = elevation * 0.4 - 0.2 // Up/down
    const baseZ = 0.1 // Slight forward from jaw

    return new THREE.Vector3(baseX, baseY, baseZ)
  }

  // Calculate tongue elevation based on phoneme
  private calculateTongueElevation(phoneme: string): number {
    // High vowels - tongue high
    if (['i', 'ɪ', 'u', 'ʊ'].includes(phoneme)) {
      return 0.9
    }
    // Mid vowels - tongue mid
    else if (['e', 'ɛ', 'o', 'ɔ'].includes(phoneme)) {
      return 0.6
    }
    // Low vowels - tongue low
    else if (['a', 'ɑ', 'æ'].includes(phoneme)) {
      return 0.3
    }
    // Consonants - variable based on articulation
    else if (this.isAlveolar(phoneme)) {
      return 0.8 // High for alveolar sounds
    }
    else if (this.isVelar(phoneme)) {
      return 0.7 // High for velar sounds
    }
    else if (this.isBilabial(phoneme)) {
      return 0.4 // Lower for bilabial sounds
    }
    
    return 0.5 // Default
  }

  // Calculate tongue advancement based on phoneme
  private calculateTongueAdvancement(phoneme: string): number {
    // Front vowels - tongue forward
    if (['i', 'ɪ', 'e', 'ɛ', 'æ'].includes(phoneme)) {
      return 0.8
    }
    // Back vowels - tongue back
    else if (['u', 'ʊ', 'o', 'ɔ', 'ɑ'].includes(phoneme)) {
      return 0.2
    }
    // Alveolar consonants - tongue forward
    else if (this.isAlveolar(phoneme)) {
      return 0.7
    }
    // Velar consonants - tongue back
    else if (this.isVelar(phoneme)) {
      return 0.3
    }
    
    return 0.5 // Default
  }

  // Calculate tongue tension based on phoneme
  private calculateTongueTension(phoneme: string): number {
    // Tense vowels - high tension
    if (['i', 'u', 'e', 'o'].includes(phoneme)) {
      return 0.9
    }
    // Lax vowels - low tension
    else if (['ɪ', 'ʊ', 'ɛ', 'ɔ', 'æ', 'ɑ'].includes(phoneme)) {
      return 0.4
    }
    // Fricatives - high tension
    else if (this.isFricative(phoneme)) {
      return 0.8
    }
    // Plosives - medium tension
    else if (this.isPlosive(phoneme)) {
      return 0.6
    }
    
    return 0.5 // Default
  }

  // Get tongue shape for phoneme
  private getTongueShapeForPhoneme(phoneme: string): TongueMovement['shape'] {
    // High front vowels - pointed tongue
    if (['i', 'ɪ'].includes(phoneme)) {
      return 'pointed'
    }
    // High back vowels - curved tongue
    else if (['u', 'ʊ'].includes(phoneme)) {
      return 'curved'
    }
    // Retroflex sounds - rolled tongue
    else if (['r', 'ɹ'].includes(phoneme)) {
      return 'rolled'
    }
    // Most other sounds - flat tongue
    else {
      return 'flat'
    }
  }

  // Interpolate current state towards target
  private interpolateState(deltaTime: number): void {
    const speed = this.config.interpolationSpeed * deltaTime
    
    // Interpolate jaw movement
    this.currentState.jaw.rotation.lerp(this.targetState.jaw.rotation, speed)
    this.currentState.jaw.translation.lerp(this.targetState.jaw.translation, speed)
    
    // Interpolate tongue movement
    this.currentState.tongue.position.lerp(this.targetState.tongue.position, speed)
    this.currentState.tongue.elevation = THREE.MathUtils.lerp(
      this.currentState.tongue.elevation,
      this.targetState.tongue.elevation,
      speed
    )
    this.currentState.tongue.advancement = THREE.MathUtils.lerp(
      this.currentState.tongue.advancement,
      this.targetState.tongue.advancement,
      speed
    )
    this.currentState.tongue.tension = THREE.MathUtils.lerp(
      this.currentState.tongue.tension,
      this.targetState.tongue.tension,
      speed
    )
    
    // Update phoneme
    this.currentState.currentPhoneme = this.targetState.targetPhoneme
  }

  // Apply physics simulation
  private applyPhysics(dt: number): void {
    if (!this.jawBone) return

    // Simple spring-damper system for jaw
    const jawTarget = this.currentState.jaw.rotation
    const jawCurrent = this.jawBone.rotation
    
    const jawError = new THREE.Euler()
    jawError.x = jawTarget.x - jawCurrent.x
    jawError.y = jawTarget.y - jawCurrent.y
    jawError.z = jawTarget.z - jawCurrent.z
    
    // Spring force
    const springForce = new THREE.Euler()
    springForce.x = jawError.x * this.currentState.jaw.stiffness
    springForce.y = jawError.y * this.currentState.jaw.stiffness
    springForce.z = jawError.z * this.currentState.jaw.stiffness
    
    // Damping force
    const dampingForce = new THREE.Euler()
    dampingForce.x = -this.jawVelocity.x * this.currentState.jaw.damping
    dampingForce.y = -this.jawVelocity.y * this.currentState.jaw.damping
    dampingForce.z = -this.jawVelocity.z * this.currentState.jaw.damping
    
    // Update velocity
    this.jawVelocity.x += (springForce.x + dampingForce.x) * dt
    this.jawVelocity.y += (springForce.y + dampingForce.y) * dt
    this.jawVelocity.z += (springForce.z + dampingForce.z) * dt
    
    // Update position
    this.jawBone.rotation.x += this.jawVelocity.x * dt
    this.jawBone.rotation.y += this.jawVelocity.y * dt
    this.jawBone.rotation.z += this.jawVelocity.z * dt
  }

  // Apply current state to 3D model
  private applyToModel(): void {
    if (!this.jawBone) return

    // Apply jaw movement
    this.jawBone.rotation.copy(this.currentState.jaw.rotation)
    this.jawBone.position.add(this.currentState.jaw.translation)

    // Apply tongue movement to blend shapes if available
    if (this.blendShapeMesh && this.blendShapeMesh.morphTargetDictionary) {
      const morphTargetInfluences = this.blendShapeMesh.morphTargetInfluences
      if (morphTargetInfluences) {
        // Apply tongue elevation
        const tongueElevationIndex = this.blendShapeMesh.morphTargetDictionary['tongueElevation']
        if (tongueElevationIndex !== undefined) {
          morphTargetInfluences[tongueElevationIndex] = this.currentState.tongue.elevation
        }

        // Apply tongue advancement
        const tongueAdvancementIndex = this.blendShapeMesh.morphTargetDictionary['tongueAdvancement']
        if (tongueAdvancementIndex !== undefined) {
          morphTargetInfluences[tongueAdvancementIndex] = this.currentState.tongue.advancement
        }

        // Apply tongue tension
        const tongueTensionIndex = this.blendShapeMesh.morphTargetDictionary['tongueTension']
        if (tongueTensionIndex !== undefined) {
          morphTargetInfluences[tongueTensionIndex] = this.currentState.tongue.tension
        }
      }
    }

    // Apply tongue movement to tongue bones if available
    if (this.tongueBones.length > 0) {
      const tonguePosition = this.currentState.tongue.position
      
      this.tongueBones.forEach((bone, index) => {
        const weight = 1.0 - (index / this.tongueBones.length) // Front bones move more
        bone.position.x = tonguePosition.x * weight
        bone.position.y = tonguePosition.y * weight
        bone.position.z = tonguePosition.z * weight
      })
    }
  }

  // Create neutral state
  private createNeutralState(): JawTongueState {
    return {
      jaw: {
        rotation: new THREE.Euler(0, 0, 0),
        translation: new THREE.Vector3(0, 0, 0),
        stiffness: this.config.jawStiffness,
        damping: this.config.jawDamping
      },
      tongue: {
        position: new THREE.Vector3(0, 0, 0.1),
        shape: 'flat',
        elevation: 0.5,
        advancement: 0.5,
        tension: 0.5
      },
      isActive: false,
      currentPhoneme: 'sil',
      targetPhoneme: 'sil',
      interpolationProgress: 0
    }
  }

  // Initialize phoneme-specific positions
  private initializePhonemePositions(): void {
    // This would pre-calculate positions for common phonemes
    // For now, we'll calculate them on-demand
    console.log('🎭 Agent 4 - Jaw and tongue phoneme positions initialized')
  }

  // Phoneme classification helpers
  private isVowel(phoneme: string): boolean {
    return ['a', 'e', 'i', 'o', 'u', 'ɑ', 'æ', 'ɛ', 'ɪ', 'ɔ', 'ʊ'].includes(phoneme)
  }

  private isConsonant(phoneme: string): boolean {
    return !this.isVowel(phoneme) && phoneme !== 'sil'
  }

  private isPlosive(phoneme: string): boolean {
    return ['p', 'b', 't', 'd', 'k', 'g'].includes(phoneme)
  }

  private isFricative(phoneme: string): boolean {
    return ['f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ'].includes(phoneme)
  }

  private isAlveolar(phoneme: string): boolean {
    return ['t', 'd', 'n', 'l', 's', 'z'].includes(phoneme)
  }

  private isVelar(phoneme: string): boolean {
    return ['k', 'g', 'ŋ'].includes(phoneme)
  }

  private isBilabial(phoneme: string): boolean {
    return ['p', 'b', 'm'].includes(phoneme)
  }

  // Get current state
  getCurrentState(): JawTongueState {
    return { ...this.currentState }
  }

  // Reset to neutral position
  reset(): void {
    this.currentState = this.createNeutralState()
    this.targetState = this.createNeutralState()
    this.jawVelocity.set(0, 0, 0)
    this.tongueVelocity.set(0, 0, 0)
    
    if (this.jawBone) {
      this.jawBone.rotation.set(0, 0, 0)
      this.jawBone.position.set(0, 0, 0)
    }
  }
}

// Export singleton instance
export const jawTongueSimulation = new JawTongueSimulation()

// Export for global access (debugging)
if (typeof window !== 'undefined') {
  (window as any).__JAW_TONGUE_SIMULATION__ = jawTongueSimulation
}
