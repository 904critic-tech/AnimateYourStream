// Viseme Detection System - Converts audio to mouth shapes
import type { 
  AudioFrame, 
  VisemeData, 
  VisemeType, 
  MouthShape, 
  LipSyncConfig,
  LipSyncEvent
} from './types'
import { BrowserEventEmitter } from './BrowserEventEmitter'

export class VisemeDetector extends BrowserEventEmitter {
  private config: LipSyncConfig
  private phonemeMappings: Map<VisemeType, MouthShape>
  private isProcessing = false
  private audioBuffer: AudioFrame[] = []
  private lastViseme: VisemeType = 'sil'
  private confidenceHistory: number[] = []

  constructor(config: LipSyncConfig) {
    super()
    this.config = config
    this.phonemeMappings = this.initializePhoneMappings()
  }

  // Start processing audio frames for viseme detection
  start(): void {
    if (this.isProcessing) return
    
    this.isProcessing = true
    console.log('🗣️ Viseme detector started')
    this.emit('started')
  }

  // Stop processing
  stop(): void {
    if (!this.isProcessing) return
    
    this.isProcessing = false
    this.audioBuffer = []
    console.log('🗣️ Viseme detector stopped')
    this.emit('stopped')
  }

  // Process audio frame and detect visemes
  processAudioFrame(audioFrame: AudioFrame): VisemeData | null {
    if (!this.isProcessing) return null

    try {
      // Add to buffer
      this.audioBuffer.push(audioFrame)
      
      // Keep buffer size manageable
      const maxBufferSize = Math.ceil(this.config.audioAnalysis.windowSize / 16.67) // ~60fps
      if (this.audioBuffer.length > maxBufferSize) {
        this.audioBuffer = this.audioBuffer.slice(-maxBufferSize)
      }

      // Detect viseme based on configured algorithm
      const visemeData = this.detectViseme(audioFrame)
      
      if (visemeData && visemeData.confidence > this.config.visemeDetection.confidenceThreshold) {
        this.lastViseme = visemeData.viseme
        this.confidenceHistory.push(visemeData.confidence)
        
        // Keep confidence history manageable
        if (this.confidenceHistory.length > 30) {
          this.confidenceHistory = this.confidenceHistory.slice(-20)
        }

        // Emit event
        const event: LipSyncEvent = {
          type: 'viseme_detected',
          timestamp: Date.now(),
          data: visemeData,
          source: 'viseme_detector'
        }
        this.emit('viseme_detected', visemeData)
        this.emit('lip_sync_event', event)

        return visemeData
      }

      return null
    } catch (error) {
      console.error('🗣️ Viseme detection error:', error)
      this.emit('error', error)
      return null
    }
  }

  // Get mouth shape for a specific viseme
  getMouthShape(viseme: VisemeType, intensity: number = 1.0): MouthShape {
    const baseShape = this.phonemeMappings.get(viseme) || this.phonemeMappings.get('sil')!
    
    // Apply intensity scaling
    return {
      openness: baseShape.openness * intensity,
      width: baseShape.width * intensity,
      lipCompression: baseShape.lipCompression * intensity,
      jawDrop: baseShape.jawDrop * intensity,
      tonguePosition: baseShape.tonguePosition * intensity,
      upperLipRaise: baseShape.upperLipRaise * intensity,
      lowerLipDepress: baseShape.lowerLipDepress * intensity,
      cornerPull: baseShape.cornerPull * intensity
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<LipSyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🗣️ Viseme detector config updated')
  }

  // Get current detection statistics
  getStatistics(): {
    averageConfidence: number
    detectionRate: number
    lastViseme: VisemeType
    bufferSize: number
  } {
    const avgConfidence = this.confidenceHistory.length > 0
      ? this.confidenceHistory.reduce((sum, conf) => sum + conf, 0) / this.confidenceHistory.length
      : 0

    return {
      averageConfidence: avgConfidence,
      detectionRate: this.confidenceHistory.length / 30, // detections per 30 frames
      lastViseme: this.lastViseme,
      bufferSize: this.audioBuffer.length
    }
  }

  // Main viseme detection algorithm
  private detectViseme(audioFrame: AudioFrame): VisemeData | null {
    switch (this.config.visemeDetection.algorithm) {
      case 'frequency':
        return this.detectVisemeByFrequency(audioFrame)
      case 'ml':
        return this.detectVisemeByML(audioFrame)
      case 'hybrid':
        return this.detectVisemeHybrid(audioFrame)
      default:
        return this.detectVisemeByFrequency(audioFrame)
    }
  }

  // Frequency-based viseme detection
  private detectVisemeByFrequency(audioFrame: AudioFrame): VisemeData | null {
    const { rms, spectralCentroid, spectralRolloff, mfcc } = audioFrame

    // Silence detection
    if (rms < 0.01) {
      return this.createVisemeData('sil', audioFrame.timestamp, 0.9)
    }

    // Use spectral features to classify visemes
    let detectedViseme: VisemeType = 'sil'
    let confidence = 0.5

    // Low frequency, high energy -> vowels or voiced consonants
    if (spectralCentroid < 1000 && rms > 0.1) {
      if (mfcc[1] > 0) {
        detectedViseme = 'aa' // Open vowel
        confidence = 0.7
      } else if (mfcc[2] < -0.5) {
        detectedViseme = 'U' // Closed vowel
        confidence = 0.6
      } else {
        detectedViseme = 'E' // Mid vowel
        confidence = 0.65
      }
    }
    // High frequency content -> fricatives
    else if (spectralCentroid > 2000 && spectralRolloff > 4000) {
      if (rms > 0.05) {
        detectedViseme = 'SS' // s, z sounds
        confidence = 0.75
      } else {
        detectedViseme = 'FF' // f, v sounds
        confidence = 0.7
      }
    }
    // Mid frequency -> stops and nasals
    else if (spectralCentroid > 500 && spectralCentroid < 2000) {
      if (mfcc[0] > 0.5) {
        detectedViseme = 'PP' // Bilabial stops
        confidence = 0.6
      } else if (mfcc[1] < -0.3) {
        detectedViseme = 'DD' // Alveolar sounds
        confidence = 0.65
      } else {
        detectedViseme = 'kk' // Velar sounds
        confidence = 0.6
      }
    }

    // Apply smoothing based on previous viseme
    confidence = this.applyTemporalSmoothing(detectedViseme, confidence)

    return this.createVisemeData(detectedViseme, audioFrame.timestamp, confidence)
  }

  // Machine learning-based detection (placeholder for future implementation)
  private detectVisemeByML(audioFrame: AudioFrame): VisemeData | null {
    // TODO: Implement ML-based viseme detection
    // For now, fall back to frequency-based detection
    console.warn('🗣️ ML-based detection not yet implemented, using frequency-based')
    return this.detectVisemeByFrequency(audioFrame)
  }

  // Hybrid detection combining multiple approaches
  private detectVisemeHybrid(audioFrame: AudioFrame): VisemeData | null {
    const freqResult = this.detectVisemeByFrequency(audioFrame)
    // const mlResult = this.detectVisemeByML(audioFrame)

    // For now, just return frequency result with boosted confidence
    if (freqResult) {
      freqResult.confidence = Math.min(1.0, freqResult.confidence * 1.1)
    }

    return freqResult
  }

  // Apply temporal smoothing to reduce jitter
  private applyTemporalSmoothing(viseme: VisemeType, confidence: number): number {
    const smoothingFactor = this.config.smoothing

    // If same as previous viseme, boost confidence
    if (viseme === this.lastViseme) {
      confidence *= (1 + smoothingFactor * 0.2)
    }
    // If different, reduce confidence slightly for stability
    else {
      confidence *= (1 - smoothingFactor * 0.1)
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Create viseme data structure
  private createVisemeData(viseme: VisemeType, timestamp: number, confidence: number): VisemeData {
    return {
      viseme,
      timestamp,
      duration: 50, // Default 50ms duration
      intensity: Math.min(1.0, confidence * 1.2),
      confidence
    }
  }

  // Initialize phoneme-to-mouth-shape mappings
  private initializePhoneMappings(): Map<VisemeType, MouthShape> {
    const mappings = new Map<VisemeType, MouthShape>()

    // Silence
    mappings.set('sil', {
      openness: 0.0,
      width: 0.0,
      lipCompression: 0.0,
      jawDrop: 0.0,
      tonguePosition: 0.0,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Bilabial consonants (p, b, m)
    mappings.set('PP', {
      openness: 0.0,
      width: 0.0,
      lipCompression: 1.0,
      jawDrop: 0.1,
      tonguePosition: 0.0,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Labiodental consonants (f, v)
    mappings.set('FF', {
      openness: 0.2,
      width: 0.0,
      lipCompression: 0.6,
      jawDrop: 0.1,
      tonguePosition: 0.0,
      upperLipRaise: 0.3,
      lowerLipDepress: 0.7,
      cornerPull: 0.0
    })

    // Dental fricatives (th)
    mappings.set('TH', {
      openness: 0.3,
      width: 0.0,
      lipCompression: 0.0,
      jawDrop: 0.2,
      tonguePosition: 0.8,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Alveolar consonants (d, t, n, l)
    mappings.set('DD', {
      openness: 0.2,
      width: 0.0,
      lipCompression: 0.0,
      jawDrop: 0.3,
      tonguePosition: 0.6,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Velar consonants (k, g)
    mappings.set('kk', {
      openness: 0.1,
      width: 0.0,
      lipCompression: 0.0,
      jawDrop: 0.2,
      tonguePosition: 0.0,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Postalveolar consonants (ch, j, sh)
    mappings.set('CH', {
      openness: 0.3,
      width: 0.2,
      lipCompression: 0.4,
      jawDrop: 0.2,
      tonguePosition: 0.5,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.2
    })

    // Sibilants (s, z)
    mappings.set('SS', {
      openness: 0.2,
      width: 0.1,
      lipCompression: 0.0,
      jawDrop: 0.1,
      tonguePosition: 0.7,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.1
    })

    // Nasals (n, ng)
    mappings.set('nn', {
      openness: 0.0,
      width: 0.0,
      lipCompression: 0.3,
      jawDrop: 0.2,
      tonguePosition: 0.4,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Rhotic (r)
    mappings.set('RR', {
      openness: 0.4,
      width: 0.3,
      lipCompression: 0.2,
      jawDrop: 0.3,
      tonguePosition: 0.3,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // Open vowel (a as in 'father')
    mappings.set('aa', {
      openness: 0.8,
      width: 0.5,
      lipCompression: 0.0,
      jawDrop: 0.7,
      tonguePosition: 0.2,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.2,
      cornerPull: 0.0
    })

    // Mid front vowel (e as in 'bed')
    mappings.set('E', {
      openness: 0.5,
      width: 0.6,
      lipCompression: 0.0,
      jawDrop: 0.4,
      tonguePosition: 0.3,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.3
    })

    // High front vowel (i as in 'bit')
    mappings.set('I', {
      openness: 0.3,
      width: 0.7,
      lipCompression: 0.0,
      jawDrop: 0.2,
      tonguePosition: 0.1,
      upperLipRaise: 0.0,
      lowerLipDepress: 0.0,
      cornerPull: 0.5
    })

    // Mid back vowel (o as in 'bought')
    mappings.set('O', {
      openness: 0.6,
      width: 0.0,
      lipCompression: 0.3,
      jawDrop: 0.5,
      tonguePosition: 0.0,
      upperLipRaise: 0.2,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    // High back vowel (u as in 'book')
    mappings.set('U', {
      openness: 0.2,
      width: 0.0,
      lipCompression: 0.7,
      jawDrop: 0.2,
      tonguePosition: 0.0,
      upperLipRaise: 0.3,
      lowerLipDepress: 0.0,
      cornerPull: 0.0
    })

    return mappings
  }

  // Get all available viseme mappings (for debugging)
  getVisemeMappings(): Map<VisemeType, MouthShape> {
    return new Map(this.phonemeMappings)
  }

  // Test viseme detection with sample audio
  testVisemeDetection(sampleRate: number = 44100): void {
    console.log('🗣️ Testing viseme detection...')
    
    // Generate test audio frames for different scenarios
    const testFrames: AudioFrame[] = [
      // Silence
      {
        timestamp: 0,
        samples: new Float32Array(1024).fill(0),
        sampleRate,
        channels: 1,
        rms: 0.001,
        spectralCentroid: 0,
        spectralRolloff: 0,
        mfcc: new Array(13).fill(0)
      },
      // Vowel sound
      {
        timestamp: 50,
        samples: new Float32Array(1024).fill(0.1),
        sampleRate,
        channels: 1,
        rms: 0.15,
        spectralCentroid: 800,
        spectralRolloff: 2000,
        mfcc: [0.5, 0.3, -0.1, 0.2, -0.3, 0.1, 0.0, -0.1, 0.2, -0.2, 0.1, 0.0, -0.1]
      },
      // Fricative sound
      {
        timestamp: 100,
        samples: new Float32Array(1024).fill(0.05),
        sampleRate,
        channels: 1,
        rms: 0.08,
        spectralCentroid: 3000,
        spectralRolloff: 6000,
        mfcc: [-0.2, -0.5, 0.3, 0.1, -0.1, 0.4, -0.2, 0.1, 0.0, -0.3, 0.2, -0.1, 0.0]
      }
    ]

    testFrames.forEach((frame, index) => {
      const result = this.processAudioFrame(frame)
      console.log(`🗣️ Test frame ${index}:`, result)
    })
  }
}
