/**
 * Enhanced Audio Processor - Phase 4
 * Real-time audio processing with advanced features:
 * - Frequency analysis and emotion detection
 * - Background noise filtering
 * - Voice activity detection
 * - Advanced audio metrics
 */

import { useAppStore } from '../utils/store'

export interface AudioMetrics {
  rms: number                    // Root mean square (volume)
  spectralCentroid: number      // Brightness measure
  spectralRolloff: number       // High frequency content
  spectralFlux: number          // Rate of spectral change
  zeroCrossingRate: number      // Frequency content indicator
  mfcc: number[]               // Mel-frequency cepstral coefficients
  formants: number[]           // Formant frequencies
  pitch: number                // Fundamental frequency (F0)
  energy: number               // Energy level
  entropy: number              // Spectral entropy
}

export interface EmotionAnalysis {
  emotion: 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'neutral'
  confidence: number
  intensity: number
  features: {
    pitchVariation: number
    energyLevel: number
    speechRate: number
    articulation: number
  }
}

export interface VoiceActivityDetection {
  isSpeaking: boolean
  confidence: number
  speechOnset: number | null
  speechOffset: number | null
  silenceDuration: number
  speechDuration: number
}

export interface NoiseFiltering {
  noiseLevel: number
  signalToNoiseRatio: number
  filteredAudio: Float32Array
  noiseProfile: number[]
  adaptiveThreshold: number
}

export class EnhancedAudioProcessor {
  private audioContext: AudioContext | null = null
  private analyzerNode: AnalyserNode | null = null
  private microphoneStream: MediaStream | null = null
  private microphoneSource: MediaStreamAudioSourceNode | null = null
  private scriptProcessor: ScriptProcessorNode | null = null
  private isProcessing = false
  private processingInterval: number | null = null
  
  // Audio processing buffers
  private audioBuffer: Float32Array[] = []
  private noiseProfile: number[] = []
  private silenceThreshold = 0.01
  private speechThreshold = 0.05
  
  // Voice activity detection
  private vadState = {
    isSpeaking: false,
    speechStartTime: 0,
    silenceStartTime: 0,
    lastSpeechTime: 0
  }
  
  // Emotion analysis
  private emotionHistory: EmotionAnalysis[] = []
  private pitchHistory: number[] = []
  private energyHistory: number[] = []
  
  // Performance tracking
  private frameCount = 0
  private processingLatency = 0

  constructor() {
    console.log('🎵 Agent 4 - Enhanced Audio Processor Initialized')
  }

  /**
   * Initialize and start enhanced audio processing
   */
  async startProcessing(): Promise<boolean> {
    try {
      console.log('🎵 Agent 4 - Starting enhanced audio processing...')

      // Create audio context with high-quality settings
      await this.createAudioContext()
      
      // Get microphone access with optimal constraints
      await this.getMicrophoneAccess()
      
      // Setup advanced audio processing chain
      this.setupAudioProcessing()
      
      // Start real-time processing loop
      this.startProcessingLoop()
      
      // Initialize noise profile
      this.initializeNoiseProfile()
      
      console.log('✅ Agent 4 - Enhanced audio processing started successfully')
      return true

    } catch (error) {
      console.error('❌ Agent 4 - Failed to start enhanced audio processing:', error)
      return false
    }
  }

  /**
   * Stop audio processing
   */
  stopProcessing(): void {
    console.log('🎵 Agent 4 - Stopping enhanced audio processing...')
    
    this.isProcessing = false
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect()
      this.scriptProcessor = null
    }
    
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }
    
    if (this.microphoneSource) {
      this.microphoneSource.disconnect()
      this.microphoneSource = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyzerNode = null
    this.audioBuffer = []
    // Notify listeners that audio level is now zero
    window.dispatchEvent(new CustomEvent('audioLevel', {
      detail: { audioLevel: 0, timestamp: Date.now() }
    }))
    
    console.log('✅ Agent 4 - Enhanced audio processing stopped')
  }

  /**
   * Create high-quality audio context
   */
  private async createAudioContext(): Promise<void> {
    console.log('🎵 Agent 4 - Creating high-quality audio context...')
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 48000,
      latencyHint: 'interactive'
    })
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    // Create analyzer with optimal settings for frequency analysis
    this.analyzerNode = this.audioContext.createAnalyser()
    this.analyzerNode.fftSize = 4096 // Higher resolution for better frequency analysis
    this.analyzerNode.smoothingTimeConstant = 0.3 // Faster response for real-time processing
    this.analyzerNode.minDecibels = -90
    this.analyzerNode.maxDecibels = -10
    
    console.log('✅ Agent 4 - High-quality audio context created')
  }

  /**
   * Get microphone access with optimal constraints
   */
  private async getMicrophoneAccess(): Promise<void> {
    console.log('🎤 Agent 4 - Requesting microphone access...')
    
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      }
    }
    
    this.microphoneStream = await navigator.mediaDevices.getUserMedia(constraints)
    this.microphoneSource = this.audioContext!.createMediaStreamSource(this.microphoneStream)
    
    console.log('✅ Agent 4 - Microphone access granted')
  }

  /**
   * Setup advanced audio processing chain
   */
  private setupAudioProcessing(): void {
    console.log('🔧 Agent 4 - Setting up advanced audio processing chain...')
    
    // Connect microphone to analyzer
    this.microphoneSource!.connect(this.analyzerNode!)
    
    // Create script processor for real-time audio analysis
    this.scriptProcessor = this.audioContext!.createScriptProcessor(4096, 1, 1)
    
    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.isProcessing) return
      
      const inputBuffer = event.inputBuffer
      const inputData = inputBuffer.getChannelData(0)
      
      // Process audio frame
      this.processAudioFrame(inputData)
    }
    
    // Connect analyzer to script processor
    this.analyzerNode!.connect(this.scriptProcessor)
    this.scriptProcessor.connect(this.audioContext!.destination)
    
    console.log('✅ Agent 4 - Advanced audio processing chain configured')
  }

  /**
   * Start real-time processing loop
   */
  private startProcessingLoop(): void {
    console.log('🔄 Agent 4 - Starting real-time processing loop...')
    
    this.isProcessing = true
    
    this.processingInterval = window.setInterval(() => {
      if (!this.isProcessing) return
      
      const startTime = performance.now()
      
      // Update store with current audio level
      const store = useAppStore.getState()
      const currentLevel = this.getCurrentAudioLevel()
      store.setAudioLevel(currentLevel)
      // Emit simple audio level event for listeners (e.g., LipSync)
      window.dispatchEvent(new CustomEvent('audioLevel', {
        detail: { audioLevel: currentLevel, timestamp: Date.now() }
      }))
      
      // Process voice activity detection (stored for potential future use)
      this.detectVoiceActivity(currentLevel)
      
      // Update processing latency
      this.processingLatency = performance.now() - startTime
      this.frameCount++
      
    }, 16) // ~60fps processing
    
    console.log('✅ Agent 4 - Real-time processing loop started')
  }

  /**
   * Process audio frame with advanced analysis
   */
  private processAudioFrame(audioData: Float32Array): void {
    try {
      // Calculate basic audio metrics
      const metrics = this.calculateAudioMetrics(audioData)
      
      // Apply noise filtering
      const noiseFiltering = this.applyNoiseFiltering(audioData)
      
      // Detect voice activity
      const vad = this.detectVoiceActivity(metrics.rms)
      
      // Analyze emotion if speaking
      let emotionAnalysis: EmotionAnalysis | null = null
      if (vad.isSpeaking) {
        emotionAnalysis = this.analyzeEmotion(metrics)
      }
      
      // Update store with enhanced metrics
      const store = useAppStore.getState()
      store.setAudioLevel(metrics.rms)
      // Emit audio level event alongside enhanced metrics
      window.dispatchEvent(new CustomEvent('audioLevel', {
        detail: { audioLevel: metrics.rms, timestamp: Date.now() }
      }))
      
      // Emit events for lip sync system
      this.emitAudioEvents(metrics, vad, emotionAnalysis, noiseFiltering)
      
    } catch (error) {
      console.error('🎵 Agent 4 - Audio frame processing error:', error)
    }
  }

  /**
   * Calculate comprehensive audio metrics
   */
  private calculateAudioMetrics(audioData: Float32Array): AudioMetrics {
    // RMS (Root Mean Square) - Volume measure
    const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length)
    
    // Energy
    const energy = audioData.reduce((sum, sample) => sum + sample * sample, 0)
    
    // Zero Crossing Rate - Frequency content indicator
    let zeroCrossings = 0
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        zeroCrossings++
      }
    }
    const zeroCrossingRate = zeroCrossings / audioData.length
    
    // Spectral analysis using FFT
    const fftData = new Float32Array(this.analyzerNode!.frequencyBinCount)
    this.analyzerNode!.getFloatFrequencyData(fftData)
    
    // Spectral Centroid - Brightness measure
    const spectralCentroid = this.calculateSpectralCentroid(fftData)
    
    // Spectral Rolloff - High frequency content
    const spectralRolloff = this.calculateSpectralRolloff(fftData)
    
    // Spectral Flux - Rate of spectral change
    const spectralFlux = this.calculateSpectralFlux(fftData)
    
    // MFCC (Mel-frequency cepstral coefficients)
    const mfcc = this.calculateMFCC(fftData)
    
    // Formant frequencies
    const formants = this.calculateFormants(fftData)
    
    // Pitch (Fundamental frequency)
    const pitch = this.calculatePitch(audioData)
    
    // Spectral Entropy
    const entropy = this.calculateSpectralEntropy(fftData)
    
    return {
      rms,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      zeroCrossingRate,
      mfcc,
      formants,
      pitch,
      energy,
      entropy
    }
  }

  /**
   * Calculate spectral centroid
   */
  private calculateSpectralCentroid(fftData: Float32Array): number {
    let weightedSum = 0
    let magnitudeSum = 0
    
    for (let i = 0; i < fftData.length; i++) {
      const magnitude = Math.pow(10, fftData[i] / 20)
      weightedSum += i * magnitude
      magnitudeSum += magnitude
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0
  }

  /**
   * Calculate spectral rolloff
   */
  private calculateSpectralRolloff(fftData: Float32Array): number {
    const threshold = 0.85 // 85% of energy
    let totalEnergy = 0
    let cumulativeEnergy = 0
    
    // Calculate total energy
    for (let i = 0; i < fftData.length; i++) {
      totalEnergy += Math.pow(10, fftData[i] / 20)
    }
    
    // Find rolloff frequency
    for (let i = 0; i < fftData.length; i++) {
      cumulativeEnergy += Math.pow(10, fftData[i] / 20)
      if (cumulativeEnergy >= threshold * totalEnergy) {
        return i / fftData.length
      }
    }
    
    return 1.0
  }

  /**
   * Calculate spectral flux
   */
  private calculateSpectralFlux(fftData: Float32Array): number {
    if (this.audioBuffer.length === 0) {
      return 0
    }
    
    const previousFrame = this.audioBuffer[this.audioBuffer.length - 1]
    let flux = 0
    
    for (let i = 0; i < Math.min(fftData.length, previousFrame.length); i++) {
      const currentMagnitude = Math.pow(10, fftData[i] / 20)
      const previousMagnitude = Math.pow(10, previousFrame[i] / 20)
      flux += Math.pow(currentMagnitude - previousMagnitude, 2)
    }
    
    return Math.sqrt(flux)
  }

  /**
   * Calculate MFCC (Mel-frequency cepstral coefficients)
   */
  private calculateMFCC(fftData: Float32Array): number[] {
    // Simplified MFCC calculation (13 coefficients)
    const mfcc = []
    const numCoefficients = 13
    
    for (let i = 0; i < numCoefficients; i++) {
      let coefficient = 0
      for (let j = 0; j < fftData.length; j++) {
        const magnitude = Math.pow(10, fftData[j] / 20)
        coefficient += magnitude * Math.cos(Math.PI * i * (2 * j + 1) / (2 * fftData.length))
      }
      mfcc.push(coefficient)
    }
    
    return mfcc
  }

  /**
   * Calculate formant frequencies
   */
  private calculateFormants(fftData: Float32Array): number[] {
    // Simplified formant detection (first 3 formants)
    const formants = []
    const sampleRate = this.audioContext!.sampleRate
    
    // Find peaks in the spectrum (simplified approach)
    for (let i = 2; i < fftData.length - 2; i++) {
      if (fftData[i] > fftData[i - 1] && fftData[i] > fftData[i - 2] &&
          fftData[i] > fftData[i + 1] && fftData[i] > fftData[i + 2]) {
        const frequency = i * sampleRate / (2 * fftData.length)
        if (frequency > 500 && frequency < 4000) { // Typical formant range
          formants.push(frequency)
        }
      }
    }
    
    // Return top 3 formants
    return formants.slice(0, 3).sort((a, b) => a - b)
  }

  /**
   * Calculate pitch (fundamental frequency)
   */
  private calculatePitch(audioData: Float32Array): number {
    // Autocorrelation-based pitch detection
    const maxLag = Math.floor(audioData.length / 2)
    let bestLag = 0
    let bestCorrelation = 0
    
    for (let lag = 50; lag < maxLag; lag++) {
      let correlation = 0
      for (let i = 0; i < audioData.length - lag; i++) {
        correlation += audioData[i] * audioData[i + lag]
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestLag = lag
      }
    }
    
    const sampleRate = this.audioContext!.sampleRate
    return bestLag > 0 ? sampleRate / bestLag : 0
  }

  /**
   * Calculate spectral entropy
   */
  private calculateSpectralEntropy(fftData: Float32Array): number {
    let totalMagnitude = 0
    const magnitudes = []
    
    // Calculate total magnitude
    for (let i = 0; i < fftData.length; i++) {
      const magnitude = Math.pow(10, fftData[i] / 20)
      magnitudes.push(magnitude)
      totalMagnitude += magnitude
    }
    
    // Calculate entropy
    let entropy = 0
    for (let i = 0; i < magnitudes.length; i++) {
      if (magnitudes[i] > 0 && totalMagnitude > 0) {
        const probability = magnitudes[i] / totalMagnitude
        entropy -= probability * Math.log2(probability)
      }
    }
    
    return entropy
  }

  /**
   * Apply noise filtering
   */
  private applyNoiseFiltering(audioData: Float32Array): NoiseFiltering {
    // Calculate current noise level
    const currentNoiseLevel = this.calculateNoiseLevel(audioData)
    
    // Update noise profile
    this.updateNoiseProfile(currentNoiseLevel)
    
    // Apply spectral subtraction
    const filteredAudio = this.spectralSubtraction(audioData)
    
    // Calculate signal-to-noise ratio
    const signalPower = audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length
    const noisePower = this.noiseProfile.reduce((sum, level) => sum + level * level, 0) / this.noiseProfile.length
    const snr = noisePower > 0 ? 10 * Math.log10(signalPower / noisePower) : 0
    
    // Adaptive threshold
    const adaptiveThreshold = this.silenceThreshold + (this.noiseProfile.length > 0 ? 
      this.noiseProfile.reduce((sum, level) => sum + level, 0) / this.noiseProfile.length : 0)
    
    return {
      noiseLevel: currentNoiseLevel,
      signalToNoiseRatio: snr,
      filteredAudio,
      noiseProfile: [...this.noiseProfile],
      adaptiveThreshold
    }
  }

  /**
   * Calculate noise level
   */
  private calculateNoiseLevel(audioData: Float32Array): number {
    // Use RMS as noise level indicator
    return Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length)
  }

  /**
   * Update noise profile
   */
  private updateNoiseProfile(noiseLevel: number): void {
    this.noiseProfile.push(noiseLevel)
    
    // Keep noise profile manageable
    if (this.noiseProfile.length > 100) {
      this.noiseProfile = this.noiseProfile.slice(-50)
    }
  }

  /**
   * Spectral subtraction for noise reduction
   */
  private spectralSubtraction(audioData: Float32Array): Float32Array {
    const filtered = new Float32Array(audioData.length)
    
    // Simple spectral subtraction
    const noiseEstimate = this.noiseProfile.length > 0 ? 
      this.noiseProfile.reduce((sum, level) => sum + level, 0) / this.noiseProfile.length : 0
    
    for (let i = 0; i < audioData.length; i++) {
      const magnitude = Math.abs(audioData[i])
      const filteredMagnitude = Math.max(0, magnitude - noiseEstimate * 0.5)
      filtered[i] = audioData[i] >= 0 ? filteredMagnitude : -filteredMagnitude
    }
    
    return filtered
  }

  /**
   * Detect voice activity
   */
  private detectVoiceActivity(audioLevel: number): VoiceActivityDetection {
    const now = Date.now()
    const silenceThreshold = this.silenceThreshold
    const speechThreshold = this.speechThreshold
    
    if (audioLevel > speechThreshold) {
      // Speech detected
      if (!this.vadState.isSpeaking) {
        this.vadState.isSpeaking = true
        this.vadState.speechStartTime = now
        this.vadState.silenceStartTime = 0
      }
      this.vadState.lastSpeechTime = now
    } else if (audioLevel < silenceThreshold) {
      // Silence detected
      if (this.vadState.isSpeaking) {
        this.vadState.isSpeaking = false
        this.vadState.silenceStartTime = now
      }
    }
    
    const speechDuration = this.vadState.isSpeaking ? 
      now - this.vadState.speechStartTime : 0
    const silenceDuration = !this.vadState.isSpeaking && this.vadState.silenceStartTime > 0 ? 
      now - this.vadState.silenceStartTime : 0
    
    // Calculate confidence based on audio level and duration
    const confidence = Math.min(1, audioLevel / speechThreshold)
    
    return {
      isSpeaking: this.vadState.isSpeaking,
      confidence,
      speechOnset: this.vadState.speechStartTime > 0 ? this.vadState.speechStartTime : null,
      speechOffset: this.vadState.silenceStartTime > 0 ? this.vadState.silenceStartTime : null,
      silenceDuration,
      speechDuration
    }
  }

  /**
   * Analyze emotion from audio metrics
   */
  private analyzeEmotion(metrics: AudioMetrics): EmotionAnalysis {
    // Update history
    this.pitchHistory.push(metrics.pitch)
    this.energyHistory.push(metrics.energy)
    
    // Keep history manageable
    if (this.pitchHistory.length > 50) {
      this.pitchHistory = this.pitchHistory.slice(-30)
    }
    if (this.energyHistory.length > 50) {
      this.energyHistory = this.energyHistory.slice(-30)
    }
    
    // Calculate emotion features
    const pitchVariation = this.calculatePitchVariation()
    const energyLevel = metrics.energy
    const speechRate = this.calculateSpeechRate()
    const articulation = this.calculateArticulation(metrics)
    
    // Simple emotion classification based on features
    let emotion: EmotionAnalysis['emotion'] = 'neutral'
    let confidence = 0.5
    let intensity = 0.5
    
    // Happy: high pitch variation, high energy, fast speech
    if (pitchVariation > 0.7 && energyLevel > 0.6 && speechRate > 0.6) {
      emotion = 'happy'
      confidence = 0.8
      intensity = Math.min(1, (pitchVariation + energyLevel + speechRate) / 3)
    }
    // Sad: low pitch variation, low energy, slow speech
    else if (pitchVariation < 0.3 && energyLevel < 0.4 && speechRate < 0.4) {
      emotion = 'sad'
      confidence = 0.7
      intensity = Math.min(1, (1 - pitchVariation + (1 - energyLevel) + (1 - speechRate)) / 3)
    }
    // Angry: high energy, high articulation, medium pitch variation
    else if (energyLevel > 0.7 && articulation > 0.6 && pitchVariation > 0.4) {
      emotion = 'angry'
      confidence = 0.75
      intensity = Math.min(1, (energyLevel + articulation + pitchVariation) / 3)
    }
    // Excited: high energy, high pitch variation, fast speech
    else if (energyLevel > 0.6 && pitchVariation > 0.6 && speechRate > 0.5) {
      emotion = 'excited'
      confidence = 0.7
      intensity = Math.min(1, (energyLevel + pitchVariation + speechRate) / 3)
    }
    // Calm: low energy, low pitch variation, medium speech rate
    else if (energyLevel < 0.5 && pitchVariation < 0.4 && speechRate > 0.3 && speechRate < 0.7) {
      emotion = 'calm'
      confidence = 0.6
      intensity = Math.min(1, ((1 - energyLevel) + (1 - pitchVariation) + 0.5) / 3)
    }
    
    const analysis: EmotionAnalysis = {
      emotion,
      confidence,
      intensity,
      features: {
        pitchVariation,
        energyLevel,
        speechRate,
        articulation
      }
    }
    
    // Update emotion history
    this.emotionHistory.push(analysis)
    if (this.emotionHistory.length > 20) {
      this.emotionHistory = this.emotionHistory.slice(-15)
    }
    
    return analysis
  }

  /**
   * Calculate pitch variation
   */
  private calculatePitchVariation(): number {
    if (this.pitchHistory.length < 2) return 0
    
    const mean = this.pitchHistory.reduce((sum, pitch) => sum + pitch, 0) / this.pitchHistory.length
    const variance = this.pitchHistory.reduce((sum, pitch) => sum + Math.pow(pitch - mean, 2), 0) / this.pitchHistory.length
    
    return Math.min(1, Math.sqrt(variance) / 100) // Normalize to 0-1
  }

  /**
   * Calculate speech rate
   */
  private calculateSpeechRate(): number {
    // Simplified speech rate calculation based on energy variation
    if (this.energyHistory.length < 2) return 0.5
    
    let transitions = 0
    for (let i = 1; i < this.energyHistory.length; i++) {
      if (Math.abs(this.energyHistory[i] - this.energyHistory[i - 1]) > 0.1) {
        transitions++
      }
    }
    
    return Math.min(1, transitions / this.energyHistory.length)
  }

  /**
   * Calculate articulation
   */
  private calculateArticulation(metrics: AudioMetrics): number {
    // Articulation based on spectral centroid and zero crossing rate
    const centroidWeight = 0.6
    const zcrWeight = 0.4
    
    const normalizedCentroid = Math.min(1, metrics.spectralCentroid / 1000)
    const normalizedZCR = Math.min(1, metrics.zeroCrossingRate)
    
    return centroidWeight * normalizedCentroid + zcrWeight * normalizedZCR
  }

  /**
   * Initialize noise profile
   */
  private initializeNoiseProfile(): void {
    console.log('🎵 Agent 4 - Initializing noise profile...')
    
    // Start with empty noise profile
    this.noiseProfile = []
    
    // Will be populated during initial processing
    console.log('✅ Agent 4 - Noise profile initialized')
  }

  /**
   * Get current audio level
   */
  private getCurrentAudioLevel(): number {
    if (!this.analyzerNode) return 0
    
    const dataArray = new Uint8Array(this.analyzerNode.frequencyBinCount)
    this.analyzerNode.getByteFrequencyData(dataArray)
    
    // Calculate RMS from frequency data
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    
    return Math.sqrt(sum / dataArray.length) / 255
  }

  /**
   * Emit audio events for lip sync system
   */
  private emitAudioEvents(
    metrics: AudioMetrics,
    vad: VoiceActivityDetection,
    emotion: EmotionAnalysis | null,
    noiseFiltering: NoiseFiltering
  ): void {
    // Create custom event for lip sync system
    const audioEvent = new CustomEvent('enhancedAudioData', {
      detail: {
        metrics,
        voiceActivity: vad,
        emotion,
        noiseFiltering,
        timestamp: Date.now()
      }
    })
    
    window.dispatchEvent(audioEvent)
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    frameCount: number
    processingLatency: number
    isProcessing: boolean
    audioBufferSize: number
  } {
    return {
      frameCount: this.frameCount,
      processingLatency: this.processingLatency,
      isProcessing: this.isProcessing,
      audioBufferSize: this.audioBuffer.length
    }
  }

  /**
   * Get current emotion analysis
   */
  getCurrentEmotion(): EmotionAnalysis | null {
    return this.emotionHistory.length > 0 ? 
      this.emotionHistory[this.emotionHistory.length - 1] : null
  }

  /**
   * Get voice activity status
   */
  getVoiceActivityStatus(): VoiceActivityDetection {
    const currentLevel = this.getCurrentAudioLevel()
    return this.detectVoiceActivity(currentLevel)
  }
}

// Export singleton instance
export const enhancedAudioProcessor = new EnhancedAudioProcessor()

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).__ENHANCED_AUDIO_PROCESSOR__ = enhancedAudioProcessor
}
