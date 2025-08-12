import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Search, Zap, Activity, MicOff, Volume2, Brain, Activity as ActivityIcon } from 'lucide-react'
import { useAppStore } from '../../utils/store'
import SandboxControls from './SandboxControls'
import { enhancedAudioProcessor, type EmotionAnalysis, type VoiceActivityDetection } from '../../core/EnhancedAudioProcessor'

// The animation list is sourced from store.animationInfo.availableAnimations

function RightPanel() {
  const { 
    currentAnimation, 
    setCurrentAnimation, 
    isPlaying, 
    setIsPlaying,
    animationSpeed,
    setAnimationSpeed,
    currentModel,
    proceduralIdleSettings,
    setProceduralIdleSettings,
    lastSelectedAnimationByModel,
    setLastSelectedAnimationForModel,
    lipSyncEnabled,
    setLipSyncEnabled,
    microphoneEnabled,
    setMicrophoneEnabled,
    audioLevel,
    animationInfo
  } = useAppStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'animations' | 'lipsync' | 'sandbox' | 'image3d'>('animations')
  
  // Enhanced audio processing state
  const [isEnhancedAudioActive, setIsEnhancedAudioActive] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null)
  const [voiceActivity, setVoiceActivity] = useState<VoiceActivityDetection>({
    isSpeaking: false,
    confidence: 0,
    speechOnset: null,
    speechOffset: null,
    silenceDuration: 0,
    speechDuration: 0
  })
  const [processingStats, setProcessingStats] = useState({
    frameCount: 0,
    processingLatency: 0,
    isProcessing: false,
    audioBufferSize: 0
  })

  const availableAnimations = (animationInfo.availableAnimations || []) as string[]
  const filteredAnimations = availableAnimations.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))

  const selectAnimation = (animationName: string) => {
    setCurrentAnimation(animationName)
    setIsPlaying(true)
    if (currentModel) {
      setLastSelectedAnimationForModel(currentModel, animationName)
    }
    
    // Connect to AnimationBlender system for actual animation loading
    const animationBlender = (window as any).__ANIMATION_BLENDER__
    if (animationBlender) {
      animationBlender.blendToAnimation(animationName, 0.3)
    }
    
    const { setAnimationInfo } = useAppStore.getState()
    setAnimationInfo({ currentTime: 0 })
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const stopAnimation = () => {
    setCurrentAnimation(null)
    setIsPlaying(false)
  }

  // Enhanced audio processing functions
  const startEnhancedAudioProcessing = async () => {
    console.log('🎵 Agent 4 - Starting enhanced audio processing...')
    try {
      const success = await enhancedAudioProcessor.startProcessing()
      if (success) {
        setIsEnhancedAudioActive(true)
        setMicrophoneEnabled(true)
        console.log('✅ Agent 4 - Enhanced audio processing started successfully')
      } else {
        console.error('❌ Agent 4 - Failed to start enhanced audio processing')
      }
    } catch (error) {
      console.error('❌ Agent 4 - Enhanced audio processing error:', error)
    }
  }

  const stopEnhancedAudioProcessing = () => {
    console.log('🎵 Agent 4 - Stopping enhanced audio processing...')
    enhancedAudioProcessor.stopProcessing()
    setIsEnhancedAudioActive(false)
    setMicrophoneEnabled(false)
    setCurrentEmotion(null)
    setVoiceActivity({
      isSpeaking: false,
      confidence: 0,
      speechOnset: null,
      speechOffset: null,
      silenceDuration: 0,
      speechDuration: 0
    })
    console.log('✅ Agent 4 - Enhanced audio processing stopped')
  }

  const toggleEnhancedAudioProcessing = () => {
    if (isEnhancedAudioActive) {
      stopEnhancedAudioProcessing()
    } else {
      startEnhancedAudioProcessing()
    }
  }

  // Enhanced audio event listeners
  useEffect(() => {
    const handleEnhancedAudioData = (event: CustomEvent) => {
      const { voiceActivity: vad, emotion } = event.detail
      setVoiceActivity(vad)
      if (emotion) {
        setCurrentEmotion(emotion)
      }
    }

    const updateProcessingStats = () => {
      const stats = enhancedAudioProcessor.getProcessingStats()
      setProcessingStats(stats)
    }

    // Add event listeners
    window.addEventListener('enhancedAudioData', handleEnhancedAudioData as EventListener)
    
    // Update stats every second
    const statsInterval = setInterval(updateProcessingStats, 1000)

    return () => {
      window.removeEventListener('enhancedAudioData', handleEnhancedAudioData as EventListener)
      clearInterval(statsInterval)
    }
  }, [])

  const testAnimationSystem = () => {
    console.log('🎭 Agent 3: Testing Mixamo animation system from UI...')
    
    // Test the Mixamo animation system
    const mixamoAnimationSystem = (window as any).__MIXAMO_ANIMATION_SYSTEM__
    if (mixamoAnimationSystem) {
      console.log('🎭 Agent 3: Mixamo animation system found:', mixamoAnimationSystem)
      
      // Test available layers
      const layers = mixamoAnimationSystem.getLayers()
      console.log('🎭 Agent 3: Available Mixamo animation layers:', Array.from(layers.keys()))
      
      // Test if we can play an animation
      if (layers.size > 0) {
        const firstAnimation = Array.from(layers.keys())[0]
        console.log('🎭 Agent 3: Testing with Mixamo animation:', firstAnimation)
        mixamoAnimationSystem.blendToAnimation(firstAnimation, 0.3)
        setCurrentAnimation(firstAnimation as string)
        setIsPlaying(true)
      } else {
        console.warn('🎭 Agent 3: No Mixamo animation layers available')
        // Try to create a test animation if no layers exist
        if (animationInfo.availableAnimations && animationInfo.availableAnimations.length > 0) {
          const firstAnim = animationInfo.availableAnimations[0]
          console.log('🎭 Agent 3: Creating test Mixamo animation with:', firstAnim)
          mixamoAnimationSystem.blendToAnimation(firstAnim, 0.3)
          setCurrentAnimation(firstAnim)
          setIsPlaying(true)
        }
      }
      
      // Test auto-rigger functionality
      const autoRigger = mixamoAnimationSystem.getAutoRigger()
      if (autoRigger) {
        console.log('🎭 Agent 3: Auto-rigger found:', autoRigger)
        const chains = autoRigger.getChains()
        console.log('🎭 Agent 3: Auto-rigger chains:', Array.from(chains.keys()))
      }
    } else {
      console.warn('🎭 Agent 3: Mixamo animation system not found - checking for fallback')
      
      // Fallback: Try to use available animations directly
      if (animationInfo.availableAnimations && animationInfo.availableAnimations.length > 0) {
        const firstAnim = animationInfo.availableAnimations[0]
        console.log('🎭 Agent 3: Using fallback animation:', firstAnim)
        setCurrentAnimation(firstAnim)
        setIsPlaying(true)
      } else {
        console.error('🎭 Agent 3: No animations available for testing')
      }
    }
    
    // Test store state
    console.log('🎭 Agent 3: Current store state:', {
      currentAnimation,
      isPlaying,
      animationSpeed,
      availableAnimations: animationInfo.availableAnimations?.length || 0
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-white">Controls</h3>
            <button
              onClick={testAnimationSystem}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
              title="Test Animation System"
            >
              Test
            </button>
          </div>
          <div className="flex space-x-1 bg-secondary-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('animations')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === 'animations'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-300 hover:text-white'
              }`}
            >
              Animations
            </button>
            <button
              onClick={() => setActiveTab('lipsync')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === 'lipsync'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-300 hover:text-white'
              }`}
            >
              Lip Sync
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === 'sandbox'
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-300 hover:text-white'
              }`}
            >
              Sandbox
            </button>
            {import.meta.env.VITE_ENABLE_IMAGE_TO_3D === 'true' && (
              <button
                onClick={() => setActiveTab('image3d')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  activeTab === 'image3d'
                    ? 'bg-primary-600 text-white'
                    : 'text-secondary-300 hover:text-white'
                }`}
              >
                Image → 3D
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sandbox Controls */}
      {activeTab === 'sandbox' && (
        <div className="p-4 border-b border-secondary-700/50">
          <SandboxControls
            onLoadModel={() => {
              const sandbox = (window as any).sandboxModelViewer
              if (sandbox) {
                sandbox.loadModel('/models/Default_Model.fbx', 'Default_Model.fbx')
              }
            }}
            onPlaceMarkers={() => {
              const sandbox = (window as any).sandboxModelViewer
              if (sandbox) {
                sandbox.placeMarkers()
              }
            }}
            onBuildSkeleton={() => {
              const sandbox = (window as any).sandboxModelViewer
              if (sandbox) {
                sandbox.buildSkeletonFromMarkers()
              }
            }}
            onAutoWeights={() => {
              const sandbox = (window as any).sandboxModelViewer
              if (sandbox) {
                sandbox.bindSkeletonToCurrentModel()
              }
            }}
            onSaveGLB={() => {
              const sandbox = (window as any).sandboxModelViewer
              if (sandbox) {
                sandbox.saveGLB()
              }
            }}
            onClear={() => {
              const sandbox = (window as any).sandboxModelViewer
              if (sandbox) {
                sandbox.clear()
              }
            }}
          />
        </div>
      )}

      {/* Image to 3D (Agent 6) - Feature gated stub */}
      {activeTab === 'image3d' && (
        <div className="p-4 border-b border-secondary-700/50">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Create 3D from Image (MVP)</h4>
            <p className="text-xs text-secondary-300 mb-3">Upload a single JPEG/PNG to generate a quick 3D preview. Full autorigging runs offline in the background. This UI is a stub for MVP and is feature-gated.</p>
            <div className="flex items-center space-x-2">
              <input type="file" accept="image/*" disabled className="text-xs text-secondary-400" />
              <button disabled className="px-2 py-1.5 text-xs rounded bg-secondary-700 text-secondary-400">Generate (coming soon)</button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Lip Sync Controls */}
      {activeTab === 'lipsync' && (
        <div className="p-4 border-b border-secondary-700/50">
          {/* Enhanced Audio Processing Control */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {isEnhancedAudioActive ? (
                  <ActivityIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <MicOff className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm font-medium text-white">
                  Enhanced Audio Processing
                </span>
              </div>
              <button
                onClick={toggleEnhancedAudioProcessing}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  isEnhancedAudioActive
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                }`}
              >
                {isEnhancedAudioActive ? 'Active' : 'Start'}
              </button>
            </div>

            {/* Enhanced Audio Level Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-secondary-300">Audio Level</label>
                <span className="text-xs text-white">{(audioLevel * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-secondary-700 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                  style={{
                    width: `${Math.min(audioLevel * 100, 100)}%`,
                    opacity: isEnhancedAudioActive ? 1 : 0.3
                  }}
                />
              </div>
            </div>
          </div>

          {/* Voice Activity Detection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  Voice Activity
                </span>
              </div>
              <div className={`px-2 py-1 text-xs rounded ${
                voiceActivity.isSpeaking 
                  ? 'bg-green-600 text-white' 
                  : 'bg-secondary-700 text-secondary-300'
              }`}>
                {voiceActivity.isSpeaking ? 'Speaking' : 'Silent'}
              </div>
            </div>

            {/* Voice Activity Details */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary-300">Confidence:</span>
                <span className="text-white">{(voiceActivity.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-300">Speech Duration:</span>
                <span className="text-white">{(voiceActivity.speechDuration / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-300">Silence Duration:</span>
                <span className="text-white">{(voiceActivity.silenceDuration / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>

          {/* Emotion Analysis */}
          {currentEmotion && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">
                    Emotion Detection
                  </span>
                </div>
                <div className={`px-2 py-1 text-xs rounded capitalize ${
                  currentEmotion.emotion === 'happy' ? 'bg-yellow-600 text-black' :
                  currentEmotion.emotion === 'sad' ? 'bg-blue-600 text-white' :
                  currentEmotion.emotion === 'angry' ? 'bg-red-600 text-white' :
                  currentEmotion.emotion === 'excited' ? 'bg-orange-600 text-white' :
                  currentEmotion.emotion === 'calm' ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {currentEmotion.emotion}
                </div>
              </div>

              {/* Emotion Details */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-secondary-300">Confidence:</span>
                  <span className="text-white">{(currentEmotion.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-300">Intensity:</span>
                  <span className="text-white">{(currentEmotion.intensity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-300">Pitch Variation:</span>
                  <span className="text-white">{(currentEmotion.features.pitchVariation * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-300">Energy Level:</span>
                  <span className="text-white">{(currentEmotion.features.energyLevel * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Lip Sync Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-primary-400" />
                <span className="text-sm font-medium text-white">
                  Lip Sync
                </span>
              </div>
              <button
                onClick={() => {
                  if (!lipSyncEnabled) {
                    // Turning on lip sync - also start enhanced audio processing
                    if (!isEnhancedAudioActive) {
                      startEnhancedAudioProcessing()
                    }
                    setLipSyncEnabled(true)
                  } else {
                    // Turning off lip sync - keep enhanced audio running
                    setLipSyncEnabled(false)
                  }
                }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  lipSyncEnabled
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                }`}
              >
                {lipSyncEnabled ? 'Active' : 'Inactive'}
              </button>
            </div>

            {!isEnhancedAudioActive && !lipSyncEnabled && (
              <p className="text-xs text-secondary-400">
                Enhanced audio processing will start automatically when you enable lip sync
              </p>
            )}
          </div>

          {/* Processing Statistics */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ActivityIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-white">
                  Processing Stats
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary-300">Frames Processed:</span>
                <span className="text-white">{processingStats.frameCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-300">Latency:</span>
                <span className="text-white">{processingStats.processingLatency.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-300">Buffer Size:</span>
                <span className="text-white">{processingStats.audioBufferSize}</span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary-300">Enhanced Audio:</span>
              <span className={`font-medium ${
                isEnhancedAudioActive ? 'text-green-400' : 'text-red-400'
              }`}>
                {isEnhancedAudioActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary-300">Lip Sync:</span>
              <span className={`font-medium ${
                lipSyncEnabled 
                  ? 'text-green-400' 
                  : 'text-secondary-400'
              }`}>
                {lipSyncEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary-300">Voice Detection:</span>
              <span className={`font-medium ${
                voiceActivity.isSpeaking ? 'text-green-400' : 'text-secondary-400'
              }`}>
                {voiceActivity.isSpeaking ? 'Detected' : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Procedural Idle Controls */}
      {activeTab === 'animations' && (
        <div className="p-4 bg-secondary-800/50 border-b border-secondary-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white">Procedural Idle</span>
              <span className="text-xs text-secondary-400">per model</span>
            </div>
            <button
              onClick={() => {
                if (!currentModel) return
                setProceduralIdleSettings(currentModel, { enabled: !(proceduralIdleSettings[currentModel]?.enabled ?? true) })
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                (currentModel ? (proceduralIdleSettings[currentModel]?.enabled ?? true) : true)
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
              }`}
            >
              {(currentModel ? (proceduralIdleSettings[currentModel]?.enabled ?? true) : true) ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-secondary-300">Amplitude</label>
                <span className="text-xs text-white">
                  {currentModel ? (proceduralIdleSettings[currentModel]?.amplitude ?? 0.01).toFixed(3) : '0.010'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.05"
                step="0.001"
                value={currentModel ? (proceduralIdleSettings[currentModel]?.amplitude ?? 0.01) : 0.01}
                onChange={(e) => {
                  if (!currentModel) return
                  setProceduralIdleSettings(currentModel, { amplitude: parseFloat(e.target.value) })
                }}
                className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-secondary-300">Speed</label>
                <span className="text-xs text-white">
                  {currentModel ? (proceduralIdleSettings[currentModel]?.speed ?? 1.0).toFixed(2) : '1.00'}x
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="3.0"
                step="0.05"
                value={currentModel ? (proceduralIdleSettings[currentModel]?.speed ?? 1.0) : 1.0}
                onChange={(e) => {
                  if (!currentModel) return
                  setProceduralIdleSettings(currentModel, { speed: parseFloat(e.target.value) })
                }}
                className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Current Animation Controls */}
      {activeTab === 'animations' && currentAnimation && (
        <div className="p-4 bg-secondary-800/50 border-b border-secondary-700/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-white">
                {currentAnimation}
              </p>
              <p className="text-xs text-secondary-400">
                Playing
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={togglePlayPause}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={stopAnimation}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Animation Speed Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-secondary-300">Speed</label>
              <span className="text-xs text-white">{animationSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Animation Controls Content */}
      {activeTab === 'animations' && (
        <>
          {/* Search Bar */}
          <div className="p-4 border-b border-secondary-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search animations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary-800 border border-secondary-600 
                           rounded-lg text-white placeholder-secondary-400 focus:outline-none 
                           focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Filter removed for dynamic list */}

          {/* Elmo Animation Library quick picker (if present) */}
          {currentModel === 'elmo' && availableAnimations.length > 0 && (
            <div className="p-4 border-b border-secondary-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white">Elmo Animation Library</h4>
                {lastSelectedAnimationByModel['elmo'] && (
                  <span className="text-xs text-secondary-400">Last: {lastSelectedAnimationByModel['elmo']}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableAnimations.slice(0, 8).map((name, idx) => (
                  <button
                    key={`${name}-chip-${idx}`}
                    onClick={() => selectAnimation(name)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors border ${
                      currentAnimation === name
                        ? 'bg-primary-600 text-white border-primary-500'
                        : 'bg-secondary-800 text-secondary-200 border-secondary-600 hover:bg-secondary-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Animation List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2">
              {filteredAnimations.map((animationName, idx) => (
                <div
                  key={`${animationName}-${idx}`}
                  onClick={() => selectAnimation(animationName)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-all group ${
                    currentAnimation === animationName
                      ? 'bg-primary-600/20 border border-primary-500/30'
                      : 'bg-secondary-800/50 hover:bg-secondary-700/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-white group-hover:text-primary-300 
                                       transition-colors">
                          {animationName}
                        </h4>
                        {currentAnimation === animationName && (
                          <Zap className="w-3 h-3 text-primary-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1" />
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        selectAnimation(animationName)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-primary-600 
                                 hover:bg-primary-700 text-white rounded transition-all"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {filteredAnimations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-secondary-400">
                <Activity className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No animations found</p>
                <p className="text-xs">Try adjusting your search or filter</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-secondary-700/50">
            <div className="text-xs text-secondary-500 text-center">
              {filteredAnimations.length} animation{filteredAnimations.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </>
      )}

      {/* Lip Sync Content */}
      {activeTab === 'lipsync' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <div className="text-center text-secondary-400">
              <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-white mb-2">Lip Sync System</h3>
              <p className="text-sm mb-6">
                Real-time facial animation based on your voice input. 
                Enable microphone and lip sync to get started.
              </p>
              
              {lipSyncEnabled && microphoneEnabled && (
                <div className="bg-secondary-800/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Active Features</h4>
                  <div className="space-y-2 text-xs text-secondary-300">
                    <div className="flex items-center justify-between">
                      <span>Real-time viseme detection</span>
                      <span className="text-green-400">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Facial morphing</span>
                      <span className="text-green-400">✓ Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Audio processing</span>
                      <span className="text-green-400">✓ Active</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-secondary-500">
                Speak into your microphone to see the character's mouth move in real-time.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RightPanel
