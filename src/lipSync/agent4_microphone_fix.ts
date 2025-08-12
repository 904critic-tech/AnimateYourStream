/**
 * Agent 4 - Microphone Detection Fix
 * Comprehensive fix for microphone detection and audio processing issues
 */

import { useAppStore } from '../utils/store'

export class MicrophoneFix {
  private audioContext: AudioContext | null = null
  private analyzerNode: AnalyserNode | null = null
  private microphoneStream: MediaStream | null = null
  private microphoneSource: MediaStreamAudioSourceNode | null = null
  private isProcessing = false
  private processingInterval: number | null = null

  constructor() {
    console.log('🎤 Agent 4 - Microphone Fix Initialized')
  }

  /**
   * Initialize and start microphone processing
   */
  async startMicrophoneProcessing(): Promise<boolean> {
    try {
      console.log('🎤 Agent 4 - Starting microphone processing...')

      // Step 1: Create audio context
      await this.createAudioContext()
      
      // Step 2: Get microphone access
      await this.getMicrophoneAccess()
      
      // Step 3: Setup audio processing
      this.setupAudioProcessing()
      
      // Step 4: Start processing loop
      this.startProcessingLoop()
      
      console.log('✅ Agent 4 - Microphone processing started successfully')
      return true

    } catch (error) {
      console.error('❌ Agent 4 - Failed to start microphone processing:', error)
      return false
    }
  }

  /**
   * Stop microphone processing
   */
  stopMicrophoneProcessing(): void {
    console.log('🎤 Agent 4 - Stopping microphone processing...')
    
    this.isProcessing = false
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
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
    
    console.log('✅ Agent 4 - Microphone processing stopped')
  }

  /**
   * Create audio context
   */
  private async createAudioContext(): Promise<void> {
    console.log('🎵 Agent 4 - Creating audio context...')
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    this.analyzerNode = this.audioContext.createAnalyser()
    this.analyzerNode.fftSize = 2048
    this.analyzerNode.smoothingTimeConstant = 0.8
    
    console.log('✅ Agent 4 - Audio context created successfully')
  }

  /**
   * Get microphone access
   */
  private async getMicrophoneAccess(): Promise<void> {
    console.log('🎤 Agent 4 - Requesting microphone access...')
    
    this.microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    })
    
    if (!this.microphoneStream || !this.microphoneStream.active) {
      throw new Error('Microphone stream not active')
    }
    
    const audioTracks = this.microphoneStream.getAudioTracks()
    console.log(`✅ Agent 4 - Microphone access granted - ${audioTracks.length} audio tracks`)
  }

  /**
   * Setup audio processing pipeline
   */
  private setupAudioProcessing(): void {
    console.log('🔄 Agent 4 - Setting up audio processing pipeline...')
    
    if (!this.audioContext || !this.analyzerNode || !this.microphoneStream) {
      throw new Error('Missing required audio components')
    }
    
    // Create media stream source
    this.microphoneSource = this.audioContext.createMediaStreamSource(this.microphoneStream)
    
    // Connect microphone to analyzer
    this.microphoneSource.connect(this.analyzerNode)
    
    console.log('✅ Agent 4 - Audio processing pipeline connected')
  }

  /**
   * Start the audio processing loop
   */
  private startProcessingLoop(): void {
    console.log('🔄 Agent 4 - Starting audio processing loop...')
    
    this.isProcessing = true
    
    // Use setInterval for more reliable processing
    this.processingInterval = window.setInterval(() => {
      if (!this.isProcessing || !this.analyzerNode) {
        return
      }
      
      try {
        this.processAudioFrame()
      } catch (error) {
        console.error('❌ Agent 4 - Audio processing error:', error)
      }
    }, 100) // Process every 100ms (10 FPS)
    
    console.log('✅ Agent 4 - Audio processing loop started')
  }

  /**
   * Process a single audio frame
   */
  private processAudioFrame(): void {
    if (!this.analyzerNode) return
    
    const bufferLength = this.analyzerNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    // Get time domain data
    this.analyzerNode.getByteTimeDomainData(dataArray)
    
    // Calculate RMS (volume)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const sample = (dataArray[i] - 128) / 128
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / dataArray.length)
    
    // Apply smoothing and threshold
    const smoothedRms = Math.max(0, rms - 0.01) // Remove noise floor
    const normalizedRms = Math.min(1.0, smoothedRms * 5) // Amplify and clamp
    
    // Update store
    const store = useAppStore.getState()
    store.setAudioLevel(normalizedRms)
    
    // Log significant audio detection
    if (normalizedRms > 0.1) {
      console.log(`🎤 Agent 4 - Audio detected: ${(normalizedRms * 100).toFixed(1)}%`)
    }
  }

  /**
   * Get current audio level
   */
  getCurrentAudioLevel(): number {
    const store = useAppStore.getState()
    return store.audioLevel
  }

  /**
   * Check if microphone is working
   */
  isMicrophoneWorking(): boolean {
    return this.isProcessing && this.microphoneStream?.active === true
  }
}

// Global instance
let microphoneFixInstance: MicrophoneFix | null = null

/**
 * Initialize microphone fix
 */
export async function initializeMicrophoneFix(): Promise<MicrophoneFix> {
  if (!microphoneFixInstance) {
    microphoneFixInstance = new MicrophoneFix()
  }
  return microphoneFixInstance
}

/**
 * Start microphone processing
 */
export async function startMicrophoneProcessing(): Promise<boolean> {
  const fix = await initializeMicrophoneFix()
  return await fix.startMicrophoneProcessing()
}

/**
 * Stop microphone processing
 */
export function stopMicrophoneProcessing(): void {
  if (microphoneFixInstance) {
    microphoneFixInstance.stopMicrophoneProcessing()
  }
}

/**
 * Get microphone status
 */
export function getMicrophoneStatus(): { isWorking: boolean; audioLevel: number } {
  const store = useAppStore.getState()
  return {
    isWorking: microphoneFixInstance?.isMicrophoneWorking() || false,
    audioLevel: store.audioLevel
  }
}
