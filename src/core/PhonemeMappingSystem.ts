// Phoneme Mapping System - Advanced lip sync support
// Provides comprehensive mappings between phonemes, visemes, and mouth shapes
import type { 
  PhonemeMapping, 
  VisemeType, 
  MouthShape, 
  SpeakerProfile 
} from '../lipSync/types'

export interface PhonemeContext {
  previousPhoneme?: string
  nextPhoneme?: string
  stressLevel: number // 0-1, syllable stress
  speechRate: number // words per minute
  emotion?: 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'neutral'
}

export interface PhonemeMappingSystem {
  // Core mapping functions
  getPhonemeMapping(phoneme: string, context?: PhonemeContext): PhonemeMapping
  getVisemeForPhoneme(phoneme: string, context?: PhonemeContext): VisemeType
  getMouthShapeForPhoneme(phoneme: string, context?: PhonemeContext): MouthShape
  
  // Advanced features
  getCoarticulationMapping(phoneme1: string, phoneme2: string): MouthShape
  getEmotionModifier(emotion: string, baseShape: MouthShape): MouthShape
  getStressModifier(stressLevel: number, baseShape: MouthShape): MouthShape
  
  // Language support
  setLanguage(language: string): void
  getSupportedLanguages(): string[]
  
  // Speaker personalization
  setSpeakerProfile(profile: SpeakerProfile): void
  getPersonalizedMapping(phoneme: string, speakerId: string): PhonemeMapping | null
  
  // Statistics and analysis
  getMappingStatistics(): {
    totalMappings: number
    languagesSupported: number
    personalizedProfiles: number
    averageConfidence: number
  }
  
  // Update method for animation loop integration
  update(delta: number): void
}

export class AdvancedPhonemeMappingSystem implements PhonemeMappingSystem {
  private phonemeMappings: Map<string, PhonemeMapping> = new Map()
  private languageMappings: Map<string, Map<string, PhonemeMapping>> = new Map()
  private speakerProfiles: Map<string, SpeakerProfile> = new Map()
  private currentLanguage = 'en'
  private coarticulationCache: Map<string, MouthShape> = new Map()

  constructor() {
    this.initializeEnglishMappings()
    this.initializeCoarticulationRules()
  }

  // Core mapping functions
  getPhonemeMapping(phoneme: string, context?: PhonemeContext): PhonemeMapping {
    const baseMapping = this.phonemeMappings.get(phoneme.toLowerCase())
    if (!baseMapping) {
      return this.getDefaultMapping(phoneme)
    }

    // Apply context modifications
    let modifiedMapping = { ...baseMapping }
    
    if (context) {
      // Apply emotion modifier
      if (context.emotion) {
        modifiedMapping.mouthShape = this.getEmotionModifier(context.emotion, modifiedMapping.mouthShape)
      }

      // Apply stress modifier
      modifiedMapping.mouthShape = this.getStressModifier(context.stressLevel, modifiedMapping.mouthShape)

      // Apply coarticulation if we have previous/next phoneme
      if (context.previousPhoneme) {
        const coarticulation = this.getCoarticulationMapping(context.previousPhoneme, phoneme)
        modifiedMapping.mouthShape = this.blendMouthShapes(modifiedMapping.mouthShape, coarticulation, 0.3)
      }

      if (context.nextPhoneme) {
        const coarticulation = this.getCoarticulationMapping(phoneme, context.nextPhoneme)
        modifiedMapping.mouthShape = this.blendMouthShapes(modifiedMapping.mouthShape, coarticulation, 0.2)
      }

      // Adjust duration based on speech rate
      const rateMultiplier = Math.max(0.5, Math.min(2.0, 120 / context.speechRate))
      modifiedMapping.duration = Math.round(modifiedMapping.duration * rateMultiplier)
    }

    return modifiedMapping
  }

  getVisemeForPhoneme(phoneme: string, context?: PhonemeContext): VisemeType {
    const mapping = this.getPhonemeMapping(phoneme, context)
    return mapping.viseme
  }

  getMouthShapeForPhoneme(phoneme: string, context?: PhonemeContext): MouthShape {
    const mapping = this.getPhonemeMapping(phoneme, context)
    return mapping.mouthShape
  }

  // Advanced features
  getCoarticulationMapping(phoneme1: string, phoneme2: string): MouthShape {
    const cacheKey = `${phoneme1.toLowerCase()}_${phoneme2.toLowerCase()}`
    
    if (this.coarticulationCache.has(cacheKey)) {
      return this.coarticulationCache.get(cacheKey)!
    }

    // Get base shapes
    const shape1 = this.getMouthShapeForPhoneme(phoneme1)
    const shape2 = this.getMouthShapeForPhoneme(phoneme2)

    // Calculate coarticulation based on phoneme types
    const coarticulationShape = this.calculateCoarticulation(phoneme1, phoneme2, shape1, shape2)
    
    this.coarticulationCache.set(cacheKey, coarticulationShape)
    return coarticulationShape
  }

  getEmotionModifier(emotion: string, baseShape: MouthShape): MouthShape {
    const modifiers: Record<string, Partial<MouthShape>> = {
      happy: {
        openness: 1.2,
        width: 1.3,
        cornerPull: 1.4,
        lipCompression: 0.8
      },
      sad: {
        openness: 0.8,
        width: 0.9,
        cornerPull: 0.7,
        lipCompression: 1.1
      },
      angry: {
        openness: 1.1,
        width: 1.1,
        cornerPull: 1.2,
        lipCompression: 1.2
      },
      calm: {
        openness: 0.9,
        width: 0.95,
        cornerPull: 0.9,
        lipCompression: 0.95
      },
      excited: {
        openness: 1.3,
        width: 1.4,
        cornerPull: 1.5,
        lipCompression: 0.7
      },
      neutral: {
        // No modification
      }
    }

    const modifier = modifiers[emotion] || modifiers.neutral
    return this.applyModifiers(baseShape, modifier)
  }

  getStressModifier(stressLevel: number, baseShape: MouthShape): MouthShape {
    const stressMultiplier = 1.0 + (stressLevel * 0.3) // Up to 30% increase for stressed syllables
    
    return {
      openness: Math.min(1.0, baseShape.openness * stressMultiplier),
      width: Math.min(1.0, baseShape.width * stressMultiplier),
      lipCompression: Math.min(1.0, baseShape.lipCompression * stressMultiplier),
      jawDrop: Math.min(1.0, baseShape.jawDrop * stressMultiplier),
      tonguePosition: Math.min(1.0, baseShape.tonguePosition * stressMultiplier),
      upperLipRaise: Math.min(1.0, baseShape.upperLipRaise * stressMultiplier),
      lowerLipDepress: Math.min(1.0, baseShape.lowerLipDepress * stressMultiplier),
      cornerPull: Math.min(1.0, baseShape.cornerPull * stressMultiplier)
    }
  }

  // Language support
  setLanguage(language: string): void {
    if (this.languageMappings.has(language)) {
      this.currentLanguage = language
      console.log(`🎭 Agent 4 - Phoneme mapping language set to: ${language}`)
    } else {
      console.warn(`🎭 Agent 4 - Language ${language} not supported, using English`)
      this.currentLanguage = 'en'
    }
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.languageMappings.keys())
  }

  // Speaker personalization
  setSpeakerProfile(profile: SpeakerProfile): void {
    this.speakerProfiles.set(profile.speakerId, profile)
    console.log(`🎭 Agent 4 - Speaker profile set for: ${profile.speakerId}`)
  }

  getPersonalizedMapping(phoneme: string, speakerId: string): PhonemeMapping | null {
    const profile = this.speakerProfiles.get(speakerId)
    if (!profile) return null

    const personalizedShape = profile.personalizedMappings.get(this.getVisemeForPhoneme(phoneme))
    if (!personalizedShape) return null

    const baseMapping = this.getPhonemeMapping(phoneme)
    return {
      ...baseMapping,
      mouthShape: personalizedShape
    }
  }

  // Statistics and analysis
  getMappingStatistics(): {
    totalMappings: number
    languagesSupported: number
    personalizedProfiles: number
    averageConfidence: number
  } {
    return {
      totalMappings: this.phonemeMappings.size,
      languagesSupported: this.languageMappings.size,
      personalizedProfiles: this.speakerProfiles.size,
      averageConfidence: 0.85 // Placeholder
    }
  }

  // Private helper methods
  private initializeEnglishMappings(): void {
    // Vowels
    this.addPhonemeMapping('a', 'aa', 120, 0.8, { openness: 0.8, width: 0.6, lipCompression: 0.1, jawDrop: 0.7, tonguePosition: 0.3, upperLipRaise: 0.2, lowerLipDepress: 0.1, cornerPull: 0.4 })
    this.addPhonemeMapping('e', 'E', 100, 0.7, { openness: 0.6, width: 0.5, lipCompression: 0.2, jawDrop: 0.5, tonguePosition: 0.4, upperLipRaise: 0.3, lowerLipDepress: 0.2, cornerPull: 0.3 })
    this.addPhonemeMapping('i', 'I', 80, 0.6, { openness: 0.4, width: 0.7, lipCompression: 0.3, jawDrop: 0.3, tonguePosition: 0.6, upperLipRaise: 0.4, lowerLipDepress: 0.3, cornerPull: 0.5 })
    this.addPhonemeMapping('o', 'O', 110, 0.75, { openness: 0.7, width: 0.4, lipCompression: 0.2, jawDrop: 0.6, tonguePosition: 0.2, upperLipRaise: 0.1, lowerLipDepress: 0.2, cornerPull: 0.2 })
    this.addPhonemeMapping('u', 'U', 90, 0.65, { openness: 0.3, width: 0.3, lipCompression: 0.4, jawDrop: 0.4, tonguePosition: 0.5, upperLipRaise: 0.2, lowerLipDepress: 0.4, cornerPull: 0.1 })
    this.addPhonemeMapping('ɑ', 'aa', 120, 0.8, { openness: 0.9, width: 0.5, lipCompression: 0.05, jawDrop: 0.8, tonguePosition: 0.2, upperLipRaise: 0.1, lowerLipDepress: 0.05, cornerPull: 0.3 })
    this.addPhonemeMapping('æ', 'aa', 110, 0.75, { openness: 0.85, width: 0.55, lipCompression: 0.1, jawDrop: 0.75, tonguePosition: 0.25, upperLipRaise: 0.15, lowerLipDepress: 0.1, cornerPull: 0.35 })
    this.addPhonemeMapping('ɛ', 'E', 105, 0.7, { openness: 0.65, width: 0.52, lipCompression: 0.18, jawDrop: 0.52, tonguePosition: 0.42, upperLipRaise: 0.28, lowerLipDepress: 0.18, cornerPull: 0.32 })
    this.addPhonemeMapping('ɪ', 'I', 85, 0.6, { openness: 0.42, width: 0.72, lipCompression: 0.28, jawDrop: 0.32, tonguePosition: 0.62, upperLipRaise: 0.38, lowerLipDepress: 0.28, cornerPull: 0.48 })
    this.addPhonemeMapping('ɔ', 'O', 115, 0.75, { openness: 0.72, width: 0.38, lipCompression: 0.22, jawDrop: 0.62, tonguePosition: 0.18, upperLipRaise: 0.12, lowerLipDepress: 0.18, cornerPull: 0.22 })
    this.addPhonemeMapping('ʊ', 'U', 95, 0.65, { openness: 0.32, width: 0.28, lipCompression: 0.42, jawDrop: 0.42, tonguePosition: 0.52, upperLipRaise: 0.18, lowerLipDepress: 0.42, cornerPull: 0.12 })

    // Consonants
    this.addPhonemeMapping('p', 'PP', 60, 0.9, { openness: 0.1, width: 0.2, lipCompression: 0.9, jawDrop: 0.1, tonguePosition: 0.1, upperLipRaise: 0.1, lowerLipDepress: 0.1, cornerPull: 0.1 })
    this.addPhonemeMapping('b', 'PP', 70, 0.85, { openness: 0.1, width: 0.2, lipCompression: 0.8, jawDrop: 0.1, tonguePosition: 0.1, upperLipRaise: 0.1, lowerLipDepress: 0.1, cornerPull: 0.1 })
    this.addPhonemeMapping('m', 'PP', 80, 0.8, { openness: 0.1, width: 0.2, lipCompression: 0.7, jawDrop: 0.1, tonguePosition: 0.1, upperLipRaise: 0.1, lowerLipDepress: 0.1, cornerPull: 0.1 })
    this.addPhonemeMapping('f', 'FF', 65, 0.8, { openness: 0.2, width: 0.3, lipCompression: 0.6, jawDrop: 0.2, tonguePosition: 0.2, upperLipRaise: 0.3, lowerLipDepress: 0.2, cornerPull: 0.2 })
    this.addPhonemeMapping('v', 'FF', 75, 0.75, { openness: 0.2, width: 0.3, lipCompression: 0.5, jawDrop: 0.2, tonguePosition: 0.2, upperLipRaise: 0.2, lowerLipDepress: 0.2, cornerPull: 0.2 })
    this.addPhonemeMapping('θ', 'TH', 70, 0.8, { openness: 0.3, width: 0.4, lipCompression: 0.3, jawDrop: 0.3, tonguePosition: 0.5, upperLipRaise: 0.2, lowerLipDepress: 0.3, cornerPull: 0.3 })
    this.addPhonemeMapping('ð', 'TH', 80, 0.75, { openness: 0.3, width: 0.4, lipCompression: 0.25, jawDrop: 0.3, tonguePosition: 0.5, upperLipRaise: 0.2, lowerLipDepress: 0.3, cornerPull: 0.3 })
    this.addPhonemeMapping('t', 'DD', 50, 0.9, { openness: 0.2, width: 0.3, lipCompression: 0.3, jawDrop: 0.2, tonguePosition: 0.6, upperLipRaise: 0.1, lowerLipDepress: 0.2, cornerPull: 0.2 })
    this.addPhonemeMapping('d', 'DD', 60, 0.85, { openness: 0.2, width: 0.3, lipCompression: 0.2, jawDrop: 0.2, tonguePosition: 0.6, upperLipRaise: 0.1, lowerLipDepress: 0.2, cornerPull: 0.2 })
    this.addPhonemeMapping('n', 'nn', 70, 0.8, { openness: 0.2, width: 0.3, lipCompression: 0.2, jawDrop: 0.2, tonguePosition: 0.5, upperLipRaise: 0.1, lowerLipDepress: 0.2, cornerPull: 0.2 })
    this.addPhonemeMapping('l', 'DD', 75, 0.8, { openness: 0.25, width: 0.35, lipCompression: 0.25, jawDrop: 0.25, tonguePosition: 0.55, upperLipRaise: 0.15, lowerLipDepress: 0.25, cornerPull: 0.25 })
    this.addPhonemeMapping('k', 'kk', 55, 0.9, { openness: 0.3, width: 0.3, lipCompression: 0.2, jawDrop: 0.3, tonguePosition: 0.7, upperLipRaise: 0.1, lowerLipDepress: 0.3, cornerPull: 0.2 })
    this.addPhonemeMapping('g', 'kk', 65, 0.85, { openness: 0.3, width: 0.3, lipCompression: 0.1, jawDrop: 0.3, tonguePosition: 0.7, upperLipRaise: 0.1, lowerLipDepress: 0.3, cornerPull: 0.2 })
    this.addPhonemeMapping('ŋ', 'nn', 75, 0.8, { openness: 0.25, width: 0.3, lipCompression: 0.15, jawDrop: 0.25, tonguePosition: 0.6, upperLipRaise: 0.1, lowerLipDepress: 0.25, cornerPull: 0.2 })
    this.addPhonemeMapping('s', 'SS', 70, 0.8, { openness: 0.3, width: 0.4, lipCompression: 0.4, jawDrop: 0.3, tonguePosition: 0.4, upperLipRaise: 0.2, lowerLipDepress: 0.3, cornerPull: 0.3 })
    this.addPhonemeMapping('z', 'SS', 80, 0.75, { openness: 0.3, width: 0.4, lipCompression: 0.3, jawDrop: 0.3, tonguePosition: 0.4, upperLipRaise: 0.2, lowerLipDepress: 0.3, cornerPull: 0.3 })
    this.addPhonemeMapping('ʃ', 'CH', 75, 0.8, { openness: 0.4, width: 0.4, lipCompression: 0.2, jawDrop: 0.4, tonguePosition: 0.6, upperLipRaise: 0.2, lowerLipDepress: 0.4, cornerPull: 0.3 })
    this.addPhonemeMapping('ʒ', 'CH', 85, 0.75, { openness: 0.4, width: 0.4, lipCompression: 0.15, jawDrop: 0.4, tonguePosition: 0.6, upperLipRaise: 0.2, lowerLipDepress: 0.4, cornerPull: 0.3 })
    this.addPhonemeMapping('tʃ', 'CH', 80, 0.85, { openness: 0.35, width: 0.35, lipCompression: 0.25, jawDrop: 0.35, tonguePosition: 0.65, upperLipRaise: 0.15, lowerLipDepress: 0.35, cornerPull: 0.25 })
    this.addPhonemeMapping('dʒ', 'CH', 90, 0.8, { openness: 0.35, width: 0.35, lipCompression: 0.2, jawDrop: 0.35, tonguePosition: 0.65, upperLipRaise: 0.15, lowerLipDepress: 0.35, cornerPull: 0.25 })
    this.addPhonemeMapping('r', 'RR', 80, 0.8, { openness: 0.3, width: 0.4, lipCompression: 0.2, jawDrop: 0.3, tonguePosition: 0.5, upperLipRaise: 0.2, lowerLipDepress: 0.3, cornerPull: 0.3 })
    this.addPhonemeMapping('j', 'I', 85, 0.7, { openness: 0.35, width: 0.65, lipCompression: 0.25, jawDrop: 0.35, tonguePosition: 0.55, upperLipRaise: 0.35, lowerLipDepress: 0.25, cornerPull: 0.45 })
    this.addPhonemeMapping('w', 'U', 90, 0.7, { openness: 0.25, width: 0.25, lipCompression: 0.35, jawDrop: 0.35, tonguePosition: 0.45, upperLipRaise: 0.15, lowerLipDepress: 0.35, cornerPull: 0.15 })

    // Silence
    this.addPhonemeMapping('sil', 'sil', 100, 1.0, { openness: 0.1, width: 0.3, lipCompression: 0.1, jawDrop: 0.1, tonguePosition: 0.1, upperLipRaise: 0.1, lowerLipDepress: 0.1, cornerPull: 0.1 })

    console.log(`🎭 Agent 4 - English phoneme mappings initialized: ${this.phonemeMappings.size} mappings`)
  }

  private initializeCoarticulationRules(): void {
    // This would contain complex coarticulation rules
    // For now, we'll use a simplified approach
    console.log('🎭 Agent 4 - Coarticulation rules initialized')
  }

  private addPhonemeMapping(
    phoneme: string,
    viseme: VisemeType,
    duration: number,
    blendWeight: number,
    mouthShape: MouthShape
  ): void {
    this.phonemeMappings.set(phoneme, {
      phoneme,
      viseme,
      duration,
      blendWeight,
      mouthShape
    })
  }

  private getDefaultMapping(phoneme: string): PhonemeMapping {
    return {
      phoneme,
      viseme: 'sil',
      duration: 100,
      blendWeight: 1.0,
      mouthShape: { openness: 0.1, width: 0.3, lipCompression: 0.1, jawDrop: 0.1, tonguePosition: 0.1, upperLipRaise: 0.1, lowerLipDepress: 0.1, cornerPull: 0.1 }
    }
  }

  private calculateCoarticulation(phoneme1: string, phoneme2: string, shape1: MouthShape, shape2: MouthShape): MouthShape {
    // Simplified coarticulation calculation
    // In a real implementation, this would use complex linguistic rules
    
    const blendFactor = 0.5
    
    return {
      openness: (shape1.openness + shape2.openness) * blendFactor,
      width: (shape1.width + shape2.width) * blendFactor,
      lipCompression: (shape1.lipCompression + shape2.lipCompression) * blendFactor,
      jawDrop: (shape1.jawDrop + shape2.jawDrop) * blendFactor,
      tonguePosition: (shape1.tonguePosition + shape2.tonguePosition) * blendFactor,
      upperLipRaise: (shape1.upperLipRaise + shape2.upperLipRaise) * blendFactor,
      lowerLipDepress: (shape1.lowerLipDepress + shape2.lowerLipDepress) * blendFactor,
      cornerPull: (shape1.cornerPull + shape2.cornerPull) * blendFactor
    }
  }

  private applyModifiers(baseShape: MouthShape, modifiers: Partial<MouthShape>): MouthShape {
    return {
      openness: Math.min(1.0, baseShape.openness * (modifiers.openness || 1.0)),
      width: Math.min(1.0, baseShape.width * (modifiers.width || 1.0)),
      lipCompression: Math.min(1.0, baseShape.lipCompression * (modifiers.lipCompression || 1.0)),
      jawDrop: Math.min(1.0, baseShape.jawDrop * (modifiers.jawDrop || 1.0)),
      tonguePosition: Math.min(1.0, baseShape.tonguePosition * (modifiers.tonguePosition || 1.0)),
      upperLipRaise: Math.min(1.0, baseShape.upperLipRaise * (modifiers.upperLipRaise || 1.0)),
      lowerLipDepress: Math.min(1.0, baseShape.lowerLipDepress * (modifiers.lowerLipDepress || 1.0)),
      cornerPull: Math.min(1.0, baseShape.cornerPull * (modifiers.cornerPull || 1.0))
    }
  }

  private blendMouthShapes(shape1: MouthShape, shape2: MouthShape, blendFactor: number): MouthShape {
    return {
      openness: shape1.openness + (shape2.openness - shape1.openness) * blendFactor,
      width: shape1.width + (shape2.width - shape1.width) * blendFactor,
      lipCompression: shape1.lipCompression + (shape2.lipCompression - shape1.lipCompression) * blendFactor,
      jawDrop: shape1.jawDrop + (shape2.jawDrop - shape1.jawDrop) * blendFactor,
      tonguePosition: shape1.tonguePosition + (shape2.tonguePosition - shape1.tonguePosition) * blendFactor,
      upperLipRaise: shape1.upperLipRaise + (shape2.upperLipRaise - shape1.upperLipRaise) * blendFactor,
      lowerLipDepress: shape1.lowerLipDepress + (shape2.lowerLipDepress - shape1.lowerLipDepress) * blendFactor,
      cornerPull: shape1.cornerPull + (shape2.cornerPull - shape1.cornerPull) * blendFactor
    }
  }

  // Update method for animation loop integration
  update(delta: number): void {
    // Update coarticulation cache cleanup
    if (this.coarticulationCache.size > 1000) {
      const keys = Array.from(this.coarticulationCache.keys())
      keys.slice(0, 100).forEach(key => this.coarticulationCache.delete(key))
    }
  }
}

// Export singleton instance
export const phonemeMappingSystem = new AdvancedPhonemeMappingSystem()

// Export for global access (debugging)
if (typeof window !== 'undefined') {
  (window as any).__PHONEME_MAPPING_SYSTEM__ = phonemeMappingSystem
}
