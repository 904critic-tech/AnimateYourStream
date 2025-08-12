// Lip Sync Engineering System - Main integration module
// Integrates audio processing with facial animation for real-time lip sync

export * from './types'
export { VisemeDetector } from './VisemeDetector'
export { FacialAnimator } from './FacialAnimator'

import { VisemeDetector } from './VisemeDetector'
import { FacialAnimator } from './FacialAnimator'
import { useAppStore } from '../utils/store'
import * as THREE from 'three'
import type { 
  LipSyncConfig, 
  LipSyncState, 
  AudioFrame, 
  FacialRig,
  PerformanceMetrics,
  LipSyncError,
  VisemeData,
  MouthShape
} from './types'

/**
 * Main Lip Sync Manager - Coordinates audio processing and facial animation
 */
export class LipSyncManager {
  private visemeDetector: VisemeDetector
  private facialAnimator: FacialAnimator
  private config: LipSyncConfig
  private state: LipSyncState
  private isInitialized = false
  private isActive = false
  
  // Audio integration
  private audioContext: AudioContext | null = null
  private analyzerNode: AnalyserNode | null = null
  private microphoneStream: MediaStream | null = null
  
  // Performance monitoring
  private performanceMetrics: PerformanceMetrics
  private lastProcessTime = 0
  private frameCount = 0
  private frameRateStartTime = 0

  constructor(config?: Partial<LipSyncConfig>) {
    // Default configuration
    const defaultConfig: LipSyncConfig = {
      enabled: true,
      sensitivity: 0.7,
      smoothing: 0.3,
      exaggeration: 0.5,
      latency: 50, // 50ms compensation
      lookAhead: 100, // 100ms look ahead
      interpolationMode: 'smooth',
      frameRate: 60,
      audioAnalysis: {
        fftSize: 2048,
        windowSize: 25, // 25ms window
        hopSize: 10, // 10ms hop
        preEmphasis: 0.95
      },
      visemeDetection: {
        algorithm: 'frequency',
        confidenceThreshold: 0.3,
        blendThreshold: 0.5
      }
    }

    this.config = { ...defaultConfig, ...config }
    
    // Initialize components
    this.visemeDetector = new VisemeDetector(this.config)
    this.facialAnimator = new FacialAnimator(this.config)
    
    // Initialize state
    this.state = this.createInitialState()
    this.performanceMetrics = this.createInitialMetrics()
    
    this.setupEventHandlers()
  }

  /**
   * Initialize the lip sync system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('💋 Lip Sync Manager already initialized')
      return
    }

    try {
      console.log('💋 Initializing Lip Sync Manager...')
      
      // Initialize audio context
      await this.initializeAudioContext()
      
      // Set up audio processing
      await this.setupAudioProcessing()
      
      // Start components
      this.visemeDetector.start()
      this.facialAnimator.start()
      
      this.isInitialized = true
      this.state.isActive = false // Will be activated when audio input starts
      
      console.log('✅ Lip Sync Manager initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Lip Sync Manager:', error)
      throw error
    }
  }

  /**
   * Start lip sync processing
   */
  async startLipSync(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Lip sync system not initialized')
    }

    if (this.isActive) {
      console.warn('💋 Lip sync already active')
      return
    }

    try {
      // Request microphone access
      await this.requestMicrophoneAccess()
      
      // Start audio processing
      this.startAudioProcessing()
      
      this.isActive = true
      this.state.isActive = true
      this.state.isReceivingAudio = true
      
      console.log('🎤 Lip sync started')
      
      // Update app store
      const store = useAppStore.getState()
      store.setLipSyncEnabled(true)
      
    } catch (error) {
      console.error('❌ Failed to start lip sync:', error)
      throw error
    }
  }

  /**
   * Stop lip sync processing
   */
  stopLipSync(): void {
    if (!this.isActive) return

    // Stop audio processing
    this.stopAudioProcessing()
    
    // Stop components
    this.visemeDetector.stop()
    this.facialAnimator.stop()
    
    this.isActive = false
    this.state.isActive = false
    this.state.isReceivingAudio = false
    
    console.log('🎤 Lip sync stopped')
    
    // Update app store
    const store = useAppStore.getState()
    store.setLipSyncEnabled(false)
  }

  /**
   * Set the 3D model for facial animation
   */
  setModel(model: THREE.Object3D, facialRig?: FacialRig): boolean {
    return this.facialAnimator.setModel(model, facialRig)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LipSyncConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.visemeDetector.updateConfig(this.config)
    this.facialAnimator.updateConfig(this.config)
    
    console.log('💋 Lip sync configuration updated')
  }

  /**
   * Get current status
   */
  getStatus(): {
    isInitialized: boolean
    isActive: boolean
    state: LipSyncState
    metrics: PerformanceMetrics
    config: LipSyncConfig
  } {
    return {
      isInitialized: this.isInitialized,
      isActive: this.isActive,
      state: { ...this.state },
      metrics: { ...this.performanceMetrics },
      config: { ...this.config }
    }
  }

  /**
   * Shutdown the lip sync system
   */
  shutdown(): void {
    this.stopLipSync()
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }
    
    this.isInitialized = false
    console.log('💋 Lip Sync Manager shut down')
  }

  /**
   * Test lip sync with sample audio
   */
  testLipSync(): void {
    console.log('💋 Testing lip sync system...')
    
    // Test viseme detection
    this.visemeDetector.testVisemeDetection()
    
    // Test facial animation
    this.facialAnimator.testFacialAnimation()
  }

  // Private methods

  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    console.log('🔊 Audio context initialized')
  }

  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext) throw new Error('Audio context not initialized')

    // Create analyzer node
    this.analyzerNode = this.audioContext.createAnalyser()
    this.analyzerNode.fftSize = this.config.audioAnalysis.fftSize
    this.analyzerNode.smoothingTimeConstant = 0.8

    console.log('🔊 Audio processing setup complete')
  }

  private async requestMicrophoneAccess(): Promise<void> {
    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })
      
      console.log('🎤 Microphone access granted')
    } catch (error) {
      console.error('❌ Microphone access denied:', error)
      throw new Error('Microphone access required for lip sync')
    }
  }

  private startAudioProcessing(): void {
    if (!this.audioContext || !this.analyzerNode || !this.microphoneStream) return

    // Connect microphone to analyzer
    const microphoneSource = this.audioContext.createMediaStreamSource(this.microphoneStream)
    microphoneSource.connect(this.analyzerNode)

    // Start processing loop
    this.processAudioFrame()
  }

  private stopAudioProcessing(): void {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }
  }

  private processAudioFrame(): void {
    if (!this.isActive || !this.analyzerNode) return

    const currentTime = performance.now()
    
    // Limit processing rate
    if (currentTime - this.lastProcessTime < 1000 / this.config.frameRate) {
      requestAnimationFrame(() => this.processAudioFrame())
      return
    }

    try {
      // Get audio data
      const bufferLength = this.analyzerNode.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const freqArray = new Float32Array(bufferLength)
      
      this.analyzerNode.getByteTimeDomainData(dataArray)
      this.analyzerNode.getFloatFrequencyData(freqArray)

      // Convert to our audio frame format
      const audioFrame = this.createAudioFrame(dataArray, freqArray, currentTime)
      
      // Update audio level in store
      this.updateAudioLevel(audioFrame.rms)
      
      // Process with viseme detector
      const visemeData = this.visemeDetector.processAudioFrame(audioFrame)
      
      if (visemeData) {
        // Apply to facial animator
        this.facialAnimator.applyViseme(visemeData)
        
        // Update state
        this.state.currentViseme = visemeData.viseme
        this.state.currentMouthShape = this.facialAnimator.getCurrentMouthShape()
      }

      // Update performance metrics
      this.updatePerformanceMetrics(currentTime)
      
      this.lastProcessTime = currentTime
      this.frameCount++

    } catch (error) {
      console.error('💋 Audio processing error:', error)
      this.handleError({
        type: 'processing',
        message: error instanceof Error ? error.message : 'Unknown processing error',
        timestamp: Date.now(),
        severity: 'error'
      })
    }

    // Continue processing
    requestAnimationFrame(() => this.processAudioFrame())
  }

  private createAudioFrame(timeData: Uint8Array, freqData: Float32Array, timestamp: number): AudioFrame {
    // Calculate RMS (volume)
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / timeData.length)

    // Calculate spectral centroid
    let weightedSum = 0
    let magnitudeSum = 0
    for (let i = 0; i < freqData.length; i++) {
      const magnitude = Math.pow(10, freqData[i] / 20) // Convert dB to linear
      weightedSum += i * magnitude
      magnitudeSum += magnitude
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0

    // Calculate spectral rolloff (frequency below which 85% of energy lies)
    let energySum = 0
    let totalEnergy = 0
    for (let i = 0; i < freqData.length; i++) {
      totalEnergy += Math.pow(10, freqData[i] / 20)
    }
    
    let spectralRolloff = 0
    const threshold = totalEnergy * 0.85
    for (let i = 0; i < freqData.length && energySum < threshold; i++) {
      energySum += Math.pow(10, freqData[i] / 20)
      spectralRolloff = i
    }

    // Simplified MFCC calculation (would be more complex in production)
    const mfcc = new Array(13).fill(0)
    for (let i = 0; i < 13 && i < freqData.length; i++) {
      mfcc[i] = freqData[i] / 100 // Normalize
    }

    return {
      timestamp,
      samples: new Float32Array(timeData.length),
      sampleRate: this.audioContext?.sampleRate || 44100,
      channels: 1,
      rms,
      spectralCentroid,
      spectralRolloff,
      mfcc
    }
  }

  private updateAudioLevel(rms: number): void {
    this.state.latestAudioLevel = rms
    
    // Update app store
    const store = useAppStore.getState()
    store.setAudioLevel(rms)
  }

  private updatePerformanceMetrics(currentTime: number): void {
    // Update frame rate
    if (this.frameCount % 30 === 0) { // Update every 30 frames
      if (this.frameRateStartTime === 0) {
        this.frameRateStartTime = currentTime
      } else {
        const fps = 30000 / (currentTime - this.frameRateStartTime)
        this.performanceMetrics = { ...this.performanceMetrics, frameRate: fps }
        this.frameRateStartTime = currentTime
      }
    }

    // Update latency (simplified calculation)
    this.performanceMetrics.audioToVisemeLatency = currentTime - this.lastProcessTime
    this.performanceMetrics.totalLatency = this.performanceMetrics.audioToVisemeLatency + this.config.latency
  }

  private createInitialState(): LipSyncState {
    return {
      isActive: false,
      isProcessing: false,
      currentViseme: 'sil',
      currentMouthShape: {
        openness: 0,
        width: 0,
        lipCompression: 0,
        jawDrop: 0,
        tonguePosition: 0,
        upperLipRaise: 0,
        lowerLipDepress: 0,
        cornerPull: 0
      },
      audioBuffer: [],
      latestAudioLevel: 0,
      isReceivingAudio: false,
      processingLatency: 0,
      frameRate: 0,
      droppedFrames: 0,
      calibration: {
        isCalibrated: false,
        baselineNoise: 0,
        dynamicRange: 1,
        personalizedMappings: new Map()
      }
    }
  }

  private createInitialMetrics(): PerformanceMetrics {
    return {
      audioToVisemeLatency: 0,
      visemeToAnimationLatency: 0,
      totalLatency: 0,
      averageConfidence: 0,
      missedFrames: 0,
      incorrectDetections: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      audioBufferUnderruns: 0
    }
  }

  private setupEventHandlers(): void {
    // Handle viseme detection events
    this.visemeDetector.on('viseme_detected', (visemeData) => {
      console.log('💋 Viseme detected:', (visemeData as VisemeData).viseme)
    })

    // Handle facial animation events
    this.facialAnimator.on('mouth_shape_updated', (mouthShape) => {
      this.state.currentMouthShape = mouthShape as MouthShape
    })

    // Handle errors
    this.visemeDetector.on('error', (error) => this.handleError({
      type: 'processing',
      message: (error as Error).message,
      timestamp: Date.now(),
      severity: 'error'
    }))

    this.facialAnimator.on('error', (error) => this.handleError({
      type: 'processing',
      message: (error as Error).message,
      timestamp: Date.now(),
      severity: 'error'
    }))
  }

  private handleError(error: LipSyncError): void {
    console.error('💋 Lip sync error:', error)
    
    // Report to app store error system
    const store = useAppStore.getState()
    store.addError({
      type: 'error',
      component: 'LipSyncManager',
      message: error.message
    })
  }
}

// Global lip sync manager instance
let globalLipSyncManager: LipSyncManager | null = null

/**
 * Get the global lip sync manager instance
 */
export function getLipSyncManager(): LipSyncManager {
  if (!globalLipSyncManager) {
    globalLipSyncManager = new LipSyncManager()
  }
  return globalLipSyncManager
}

/**
 * Initialize the global lip sync system
 */
export async function initializeLipSync(config?: Partial<LipSyncConfig>): Promise<LipSyncManager> {
  if (globalLipSyncManager) {
    console.warn('💋 Lip sync system already initialized')
    return globalLipSyncManager
  }

  globalLipSyncManager = new LipSyncManager(config)
  await globalLipSyncManager.initialize()
  
  return globalLipSyncManager
}

/**
 * Shutdown the global lip sync system
 */
export function shutdownLipSync(): void {
  if (globalLipSyncManager) {
    globalLipSyncManager.shutdown()
    globalLipSyncManager = null
  }
}
