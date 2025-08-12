/**
 * Agent 4 - Microphone Detection Diagnostic
 * Comprehensive diagnostic and fix for microphone detection issues
 */

import { useAppStore } from '../utils/store'

export class MicrophoneDiagnostic {
  private audioContext: AudioContext | null = null
  private analyzerNode: AnalyserNode | null = null
  private microphoneStream: MediaStream | null = null
  private isProcessing = false
  private diagnosticResults: any = {}

  constructor() {
    console.log('🎤 Agent 4 - Microphone Diagnostic Starting...')
  }

  /**
   * Run comprehensive microphone diagnostic
   */
  async runDiagnostic(): Promise<boolean> {
    console.log('🔍 Starting comprehensive microphone diagnostic...')
    
    try {
      // Step 1: Check browser support
      const browserSupport = this.checkBrowserSupport()
      if (!browserSupport) {
        console.error('❌ Browser does not support required audio APIs')
        return false
      }

      // Step 2: Test microphone access
      const micAccess = await this.testMicrophoneAccess()
      if (!micAccess) {
        console.error('❌ Microphone access failed')
        return false
      }

      // Step 3: Test audio context
      const audioContext = await this.testAudioContext()
      if (!audioContext) {
        console.error('❌ Audio context failed')
        return false
      }

      // Step 4: Test audio processing
      const audioProcessing = await this.testAudioProcessing()
      if (!audioProcessing) {
        console.error('❌ Audio processing failed')
        return false
      }

      // Step 5: Test volume detection
      const volumeDetection = await this.testVolumeDetection()
      if (!volumeDetection) {
        console.error('❌ Volume detection failed')
        return false
      }

      console.log('✅ All microphone diagnostic tests passed!')
      return true

    } catch (error) {
      console.error('❌ Diagnostic failed:', error)
      return false
    }
  }

  /**
   * Check browser support for required APIs
   */
  private checkBrowserSupport(): boolean {
    console.log('🔍 Checking browser support...')
    
    const support = {
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      AudioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
      WebAudioAPI: !!(window.AudioContext || (window as any).webkitAudioContext)
    }

    console.log('📊 Browser support:', support)
    
    if (!support.getUserMedia || !support.AudioContext || !support.WebAudioAPI) {
      console.error('❌ Missing required browser APIs')
      return false
    }

    this.diagnosticResults.browserSupport = support
    return true
  }

  /**
   * Test microphone access
   */
  private async testMicrophoneAccess(): Promise<boolean> {
    console.log('🎤 Testing microphone access...')
    
    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      })

      if (!this.microphoneStream || !this.microphoneStream.active) {
        console.error('❌ Microphone stream not active')
        return false
      }

      const audioTracks = this.microphoneStream.getAudioTracks()
      console.log(`✅ Microphone access granted - ${audioTracks.length} audio tracks`)
      
      this.diagnosticResults.microphoneAccess = {
        success: true,
        trackCount: audioTracks.length,
        trackSettings: audioTracks[0]?.getSettings()
      }

      return true

    } catch (error) {
      console.error('❌ Microphone access failed:', error)
      this.diagnosticResults.microphoneAccess = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      return false
    }
  }

  /**
   * Test audio context creation and setup
   */
  private async testAudioContext(): Promise<boolean> {
    console.log('🎵 Testing audio context...')
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.analyzerNode = this.audioContext.createAnalyser()
      this.analyzerNode.fftSize = 2048
      this.analyzerNode.smoothingTimeConstant = 0.8

      console.log('✅ Audio context and analyzer created successfully')
      
      this.diagnosticResults.audioContext = {
        success: true,
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate,
        fftSize: this.analyzerNode.fftSize
      }

      return true

    } catch (error) {
      console.error('❌ Audio context failed:', error)
      this.diagnosticResults.audioContext = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      return false
    }
  }

  /**
   * Test audio processing pipeline
   */
  private async testAudioProcessing(): Promise<boolean> {
    console.log('🔄 Testing audio processing pipeline...')
    
    if (!this.audioContext || !this.analyzerNode || !this.microphoneStream) {
      console.error('❌ Missing required audio components')
      return false
    }

    try {
      // Connect microphone to analyzer
      const microphoneSource = this.audioContext.createMediaStreamSource(this.microphoneStream)
      microphoneSource.connect(this.analyzerNode)

      console.log('✅ Audio processing pipeline connected')
      
      this.diagnosticResults.audioProcessing = {
        success: true,
        connected: true
      }

      return true

    } catch (error) {
      console.error('❌ Audio processing failed:', error)
      this.diagnosticResults.audioProcessing = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      return false
    }
  }

  /**
   * Test volume detection and processing
   */
  private async testVolumeDetection(): Promise<boolean> {
    console.log('📊 Testing volume detection...')
    
    if (!this.analyzerNode) {
      console.error('❌ Analyzer node not available')
      return false
    }

    return new Promise((resolve) => {
      let samples = 0
      const maxSamples = 50 // Test for 5 seconds (50 * 100ms)
      let hasDetectedVolume = false

      const processVolume = () => {
        try {
          const bufferLength = this.analyzerNode!.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          this.analyzerNode!.getByteTimeDomainData(dataArray)

          // Calculate RMS (volume)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            const sample = (dataArray[i] - 128) / 128
            sum += sample * sample
          }
          const rms = Math.sqrt(sum / dataArray.length)

          // Update store
          const store = useAppStore.getState()
          store.setAudioLevel(rms)

          if (rms > 0.01) { // Threshold for detecting audio
            hasDetectedVolume = true
            console.log(`✅ Volume detected: ${(rms * 100).toFixed(2)}%`)
          }

          samples++
          
          if (samples >= maxSamples) {
            this.isProcessing = false
            console.log(`📊 Volume detection test completed - Detected volume: ${hasDetectedVolume}`)
            
            this.diagnosticResults.volumeDetection = {
              success: hasDetectedVolume,
              samples: samples,
              finalVolume: rms
            }
            
            resolve(hasDetectedVolume)
            return
          }

          if (this.isProcessing) {
            setTimeout(processVolume, 100) // Process every 100ms
          }

        } catch (error) {
          console.error('❌ Volume detection error:', error)
          this.isProcessing = false
          resolve(false)
        }
      }

      this.isProcessing = true
      processVolume()
    })
  }

  /**
   * Get diagnostic results
   */
  getResults(): any {
    return this.diagnosticResults
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up microphone diagnostic...')
    
    this.isProcessing = false
    
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyzerNode = null
  }
}

// Export diagnostic function
export async function runMicrophoneDiagnostic(): Promise<boolean> {
  const diagnostic = new MicrophoneDiagnostic()
  const result = await diagnostic.runDiagnostic()
  const results = diagnostic.getResults()
  
  console.log('📋 Diagnostic Results:', results)
  
  diagnostic.cleanup()
  return result
}
