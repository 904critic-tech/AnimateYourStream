// Lip Sync Engineering Types
// Defines all types for facial animation and audio synchronization

export interface VisemeData {
  // Standard viseme identifiers (based on Speech API standard)
  viseme: VisemeType
  timestamp: number
  duration: number
  intensity: number // 0-1, how pronounced the mouth shape should be
  confidence: number // 0-1, confidence in the viseme detection
}

export type VisemeType = 
  | 'sil'    // Silence
  | 'PP'     // p, b, m
  | 'FF'     // f, v  
  | 'TH'     // th (as in 'think')
  | 'DD'     // d, t, n, l
  | 'kk'     // k, g
  | 'CH'     // ch, j, sh
  | 'SS'     // s, z
  | 'nn'     // n, ng
  | 'RR'     // r
  | 'aa'     // a (as in 'father')
  | 'E'      // e (as in 'bed')
  | 'I'      // i (as in 'bit')
  | 'O'      // o (as in 'bought')
  | 'U'      // u (as in 'book')

export interface MouthShape {
  // Mouth geometry parameters (0-1 normalized values)
  openness: number      // How open the mouth is
  width: number         // Mouth width (smile/frown)
  lipCompression: number // How compressed the lips are
  jawDrop: number       // Jaw position
  tonguePosition: number // Tongue visibility/position
  
  // Expression modifiers
  upperLipRaise: number // Upper lip movement
  lowerLipDepress: number // Lower lip movement
  cornerPull: number    // Corner of mouth movement
}

export interface PhonemeMapping {
  phoneme: string
  viseme: VisemeType
  duration: number      // Typical duration in ms
  blendWeight: number   // How much to blend with previous/next
  mouthShape: MouthShape
}

export interface LipSyncConfig {
  // Core settings
  enabled: boolean
  sensitivity: number   // 0-1, how sensitive to audio changes
  smoothing: number     // 0-1, how much to smooth transitions
  exaggeration: number  // 0-1, how exaggerated the movements are
  
  // Timing settings
  latency: number       // Audio-to-visual delay compensation (ms)
  lookAhead: number     // How far ahead to look for optimization (ms)
  
  // Quality settings
  interpolationMode: 'linear' | 'cubic' | 'smooth'
  frameRate: number     // Target FPS for lip sync updates
  
  // Audio analysis settings
  audioAnalysis: {
    fftSize: number     // FFT size for frequency analysis
    windowSize: number  // Analysis window size (ms)
    hopSize: number     // Analysis hop size (ms)
    preEmphasis: number // Pre-emphasis filter coefficient
  }
  
  // Viseme detection settings
  visemeDetection: {
    algorithm: 'frequency' | 'ml' | 'hybrid'
    confidenceThreshold: number // Minimum confidence for viseme
    blendThreshold: number      // Threshold for blending visemes
  }
}

export interface AudioFrame {
  timestamp: number
  samples: Float32Array
  sampleRate: number
  channels: number
  rms: number           // Root mean square (volume)
  spectralCentroid: number // Brightness measure
  spectralRolloff: number  // High frequency content
  mfcc: number[]       // Mel-frequency cepstral coefficients
}

export interface LipSyncState {
  // Current state
  isActive: boolean
  isProcessing: boolean
  currentViseme: VisemeType
  currentMouthShape: MouthShape
  
  // Audio state
  audioBuffer: AudioFrame[]
  latestAudioLevel: number
  isReceivingAudio: boolean
  
  // Performance metrics
  processingLatency: number // Current processing latency (ms)
  frameRate: number        // Current update rate
  droppedFrames: number    // Frames dropped due to performance
  
  // Calibration data
  calibration: {
    isCalibrated: boolean
    baselineNoise: number  // Baseline noise level
    dynamicRange: number   // User's dynamic range
    personalizedMappings: Map<VisemeType, MouthShape> // User-specific adjustments
  }
}

export interface LipSyncEvent {
  type: 'viseme_detected' | 'mouth_shape_updated' | 'calibration_updated' | 'error' | 'keyframe_animation' | 'body_sync'
  timestamp: number
  data?: any
  animationId?: string
  duration?: number
  normalizedTime?: number
  absoluteTime?: number
  source?: 'audio_analyzer' | 'viseme_detector' | 'facial_animator' | 'calibrator'
}

// Facial animation specific types
export interface FacialRig {
  // Bone/blend shape identifiers for the 3D model
  jawBone?: string          // Jaw bone name
  upperLipBlendShape?: string
  lowerLipBlendShape?: string
  mouthCornerBlendShapes?: string[]
  tongueBlendShapes?: string[]
  
  // Constraint settings
  jawRotationAxis: 'x' | 'y' | 'z'
  maxJawRotation: number    // Maximum jaw rotation in radians
  lipShapeMultiplier: number // Multiplier for lip blend shapes
}

export interface AnimationKeyframe {
  time: number // Normalized time (0-1) within the animation
  mouthShape?: MouthShape
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce'
}

export interface LipSyncAnimation {
  id: string
  keyframes: AnimationKeyframe[]
  duration: number
  startTime: number
  isLooping: boolean
  synchronizeWithBody?: boolean // Whether to sync with body animation timing
  targetShape?: MouthShape
}

// Machine learning types (for advanced viseme detection)
export interface MLModel {
  modelUrl: string
  inputSize: number
  outputSize: number
  isLoaded: boolean
  confidence: number
}

export interface TrainingData {
  audioFeatures: number[][]
  visemeLabels: VisemeType[]
  speakerProfiles: Map<string, SpeakerProfile>
}

export interface SpeakerProfile {
  speakerId: string
  voiceCharacteristics: {
    fundamentalFrequency: number // Average F0
    formantFrequencies: number[] // Formant characteristics
    speechRate: number          // Words per minute
    articulation: number        // Clarity measure
  }
  personalizedMappings: Map<VisemeType, MouthShape>
}

// Real-time processing types
export interface ProcessingPipeline {
  stages: ProcessingStage[]
  bufferSize: number
  sampleRate: number
  channels: number
}

export interface ProcessingStage {
  name: string
  processor: (input: AudioFrame) => AudioFrame | VisemeData | MouthShape
  enabled: boolean
  parameters: Record<string, any>
}

// Error handling and diagnostics
export interface LipSyncError {
  type: 'audio_input' | 'processing' | 'model_loading' | 'synchronization'
  message: string
  timestamp: number
  severity: 'warning' | 'error' | 'critical'
  context?: Record<string, any>
}

export interface PerformanceMetrics {
  // Timing metrics
  audioToVisemeLatency: number    // Audio input to viseme detection
  visemeToAnimationLatency: number // Viseme to mouth animation
  totalLatency: number            // End-to-end latency
  frameRate?: number              // Current processing frame rate
  
  // Quality metrics
  averageConfidence: number       // Average viseme confidence
  missedFrames: number           // Frames without viseme data
  incorrectDetections: number    // Estimated incorrect visemes
  
  // System metrics
  cpuUsage: number               // CPU usage percentage
  memoryUsage: number            // Memory usage in MB
  audioBufferUnderruns: number   // Audio buffer issues
}
