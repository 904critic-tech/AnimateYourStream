
import { 
  Upload, 
  Download, 
  Settings, 
  Mic, 
  MicOff, 
  Bot, 

  Eye,
  Grid3x3,
  RotateCcw,
  TestTube
} from 'lucide-react'
import { useAppStore } from '@utils/store'
import { enhancedAudioProcessor } from '../../core/EnhancedAudioProcessor'

function TopToolbar() {
  const { 
    microphoneEnabled, 
    setMicrophoneEnabled,
    aiBehaviorEnabled,
    setAiBehaviorEnabled,
    lipSyncEnabled,
    setLipSyncEnabled,
    toggleSettingsPanel
  } = useAppStore()

  const handleImport = () => {
    // TODO: Implement model import (Integration Team)
    console.log('Import model functionality coming soon...')
  }

  const handleExport = () => {
    // TODO: Implement model export (Integration Team) 
    console.log('Export functionality coming soon...')
  }

  const handleSettings = () => {
    console.log('💋 Agent 4: Opening settings panel...')
    toggleSettingsPanel()
  }

  const toggleMicrophone = async () => {
    const newState = !microphoneEnabled
    setMicrophoneEnabled(newState)
    
    if (newState) {
      // Start enhanced audio processing
      console.log('🎤 Agent 4 - Starting enhanced audio processing...')
      try {
        await enhancedAudioProcessor.startProcessing()
        console.log('✅ Agent 4 - Enhanced audio processing started successfully')
      } catch (error) {
        console.error('❌ Agent 4 - Failed to start enhanced audio processing:', error)
        setMicrophoneEnabled(false) // Revert state if failed
      }
    } else {
      // Stop enhanced audio processing
      console.log('🎤 Agent 4 - Stopping enhanced audio processing...')
      enhancedAudioProcessor.stopProcessing()
    }
  }

  const toggleAiBehavior = () => {
    setAiBehaviorEnabled(!aiBehaviorEnabled)
    // TODO: AI Behavior Team will implement behavior system
  }

  const toggleLipSync = async () => {
    if (!lipSyncEnabled) {
      // Turning on lip sync - also start enhanced audio processing if not already running
      if (!microphoneEnabled) {
        console.log('🎵 Agent 4 - Starting enhanced audio processing for lip sync...')
        try {
          await enhancedAudioProcessor.startProcessing()
          setMicrophoneEnabled(true)
          console.log('✅ Agent 4 - Enhanced audio processing started for lip sync')
        } catch (error) {
          console.error('❌ Agent 4 - Failed to start enhanced audio processing for lip sync:', error)
          return // Don't enable lip sync if audio processing fails
        }
      }
      setLipSyncEnabled(true)
      console.log('✅ Agent 4 - Lip sync enabled with enhanced audio processing')
    } else {
      // Turning off lip sync - keep enhanced audio running
      setLipSyncEnabled(false)
      console.log('🎵 Agent 4 - Lip sync disabled, enhanced audio processing continues')
    }
  }

  const resetView = () => {
    // 🎭 Agent 1: Implement actual reset view functionality
    console.log('🎭 Agent 1: Resetting camera view to default position...')
    
    // Find the OrbitControls in the scene and reset them
    const orbitControls = document.querySelector('canvas')?.parentElement?.querySelector('[data-orbit-controls]')
    if (orbitControls) {
      // Reset camera position to default
      const camera = (window as any).__THREE_CAMERA__
      if (camera) {
        camera.position.set(0, 1.6, 3)
        camera.lookAt(0, 1, 0)
        console.log('🎭 Agent 1: Camera position reset successfully')
      }
    }
    
    // Alternative method: Dispatch a custom event that Scene.tsx can listen to
    window.dispatchEvent(new CustomEvent('resetCameraView', {
      detail: {
        position: [0, 1.6, 3],
        target: [0, 1, 0],
        fov: 50
      }
    }))
    
    console.log('🎭 Agent 1: Reset view event dispatched')
  }

  const openMicrophoneTest = () => {
    // Open microphone test page
    window.open('?test=microphone', '_blank')
  }

  const callSandbox = (action: 'place'|'build'|'weights'|'save'|'clear'|'skel') => () => {
    const api = (window as any).sandboxModelViewer
    if (!api) {
      console.warn('Sandbox autorigger API not available yet')
      return
    }
    switch (action) {
      case 'place': api.placeMarkers?.(); break
      case 'build': api.buildSkeletonFromMarkers?.(); break
      case 'weights': api.bindSkeletonToCurrentModel?.(); break
      case 'save': api.saveGLB?.(); break
      case 'clear': api.clear?.(); break
      case 'skel': api.toggleSkeletonVisible?.(); break
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 h-12 bg-secondary-900/95 backdrop-blur-sm 
                    border-b border-secondary-700/50 flex items-center justify-between px-4 z-50">
      
      {/* Left Section - File Operations */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleImport}
          className="flex items-center space-x-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 
                     text-white rounded text-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>
        
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 
                     text-white rounded text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>

        {/* Autorigger quick actions */}
        <div className="ml-2 flex items-center space-x-1">
          <span className="text-xs text-secondary-300 mr-1">Rig:</span>
          <button onClick={callSandbox('place')} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs">Place</button>
          <button onClick={callSandbox('build')} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs">Build</button>
          <button onClick={callSandbox('weights')} className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs">Weights</button>
          <button onClick={callSandbox('save')} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs">Save</button>
          <button onClick={callSandbox('clear')} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">Clear</button>
          <button onClick={callSandbox('skel')} className="ml-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs" title="Toggle Skeleton">Skeleton</button>
        </div>
      </div>

      {/* Center Section - Logo/Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg 
                        flex items-center justify-center">
          <Grid3x3 className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-white">AnimateYourStream</h1>
        <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded-full">
          AI Enhanced
        </span>
      </div>

      {/* Right Section - Tools & Settings */}
      <div className="flex items-center space-x-2">
        {/* Microphone Toggle */}
        <button
          onClick={toggleMicrophone}
          className={`p-2 rounded transition-colors ${
            microphoneEnabled 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-secondary-600 hover:bg-secondary-700 text-secondary-300'
          }`}
          title={microphoneEnabled ? 'Microphone On' : 'Microphone Off'}
        >
          {microphoneEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Lip Sync Toggle */}
        <button
          onClick={toggleLipSync}
          className={`p-2 rounded transition-colors ${
            lipSyncEnabled 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-secondary-600 hover:bg-secondary-700 text-secondary-300'
          }`}
          title={lipSyncEnabled ? 'Lip Sync On' : 'Lip Sync Off'}
          disabled={!microphoneEnabled}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* AI Behavior Toggle */}
        <button
          onClick={toggleAiBehavior}
          className={`p-2 rounded transition-colors ${
            aiBehaviorEnabled 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-secondary-600 hover:bg-secondary-700 text-secondary-300'
          }`}
          title={aiBehaviorEnabled ? 'AI Behavior On' : 'AI Behavior Off'}
        >
          {aiBehaviorEnabled ? <Bot className="w-4 h-4" /> : <Bot className="w-4 h-4 opacity-50" />}
        </button>

        {/* View Reset */}
        <button
          onClick={resetView}
          className="p-2 bg-secondary-600 hover:bg-secondary-700 text-secondary-300 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Microphone Test */}
        <button
          onClick={openMicrophoneTest}
          className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
          title="Microphone Test (Agent 4)"
        >
          <TestTube className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={handleSettings}
          className="p-2 bg-secondary-600 hover:bg-secondary-700 text-secondary-300 rounded transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default TopToolbar
