
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Volume2,
  Mic,
  Activity,
  Brain,
} from 'lucide-react'
import { useAppStore } from '../../utils/store'
import TimelineEditor from './TimelineEditor'
import { useState } from 'react'

function BottomPanel() {
  const { 
    currentAnimation,
    isPlaying, 
    setIsPlaying,
    animationSpeed,
    setAnimationSpeed,
    animationInfo,
    microphoneEnabled,
    audioLevel,
    lipSyncEnabled,
    aiBehaviorEnabled
  } = useAppStore()

  const [showAdvancedTimeline, setShowAdvancedTimeline] = useState(false)

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const resetAnimation = () => {
    // Reset animation to beginning and stop playback
    const { setAnimationInfo, setIsPlaying } = useAppStore.getState()
    setIsPlaying(false)
    setAnimationInfo({ currentTime: 0 })
    
    // Reset animation blender if available
    const animationBlender = (window as any).__ANIMATION_BLENDER__
    if (animationBlender && currentAnimation) {
      animationBlender.blendToAnimation(currentAnimation, 0.1)
    }
  }

  const skipToStart = () => {
    // Seek to animation start
    const { setAnimationInfo } = useAppStore.getState()
    setAnimationInfo({ currentTime: 0 })
  }

  const skipToEnd = () => {
    // Seek to animation end
    const { setAnimationInfo } = useAppStore.getState()
    setAnimationInfo({ currentTime: animationInfo.duration })
  }

  // Calculate progress percentage
  const progressPercentage = animationInfo.duration > 0 
    ? (animationInfo.currentTime / animationInfo.duration) * 100 
    : 0

  return (
    <div className="h-full flex flex-col bg-secondary-900/95 backdrop-blur-sm">
      {/* Timeline Header */}
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-white">Animation Timeline</h3>
          {currentAnimation && (
            <span className="text-sm text-secondary-300">
              - {currentAnimation}
            </span>
          )}
        </div>
        
        {/* Real-time Status Indicators */}
        <div className="flex items-center space-x-4">
          {/* Microphone Level */}
          {microphoneEnabled && (
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-green-400" />
              <div className="w-16 h-2 bg-secondary-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Lip Sync Status */}
          {lipSyncEnabled && (
            <div className="flex items-center space-x-1">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-300">Lip Sync</span>
            </div>
          )}
          
          {/* AI Behavior Status */}
          {aiBehaviorEnabled && (
            <div className="flex items-center space-x-1">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-300">AI Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex-1 flex flex-col p-4">
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={skipToStart}
            className="p-2 bg-secondary-700 hover:bg-secondary-600 text-white rounded transition-colors"
            disabled={!currentAnimation}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={togglePlayPause}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            disabled={!currentAnimation}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={skipToEnd}
            className="p-2 bg-secondary-700 hover:bg-secondary-600 text-white rounded transition-colors"
            disabled={!currentAnimation}
          >
            <SkipForward className="w-4 h-4" />
          </button>
          
          <button
            onClick={resetAnimation}
            className="p-2 bg-secondary-700 hover:bg-secondary-600 text-white rounded transition-colors"
            disabled={!currentAnimation}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <div className="border-l border-secondary-700 pl-4 ml-4">
            <button
              onClick={() => setShowAdvancedTimeline(!showAdvancedTimeline)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                showAdvancedTimeline 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-secondary-700 hover:bg-secondary-600 text-secondary-300'
              }`}
              title="Toggle Advanced Timeline"
            >
              Advanced Timeline
            </button>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-secondary-400">
            <span>{formatTime(animationInfo.currentTime)}</span>
            <span>{formatTime(animationInfo.duration)}</span>
          </div>
          
          <div className="timeline-track">
            <div 
              className="timeline-progress"
              style={{ width: `${progressPercentage}%` }}
            />
            
            {/* Playhead */}
            <div 
              className="absolute top-0 w-1 h-full bg-white shadow-lg transition-all duration-100"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Speed and Settings Controls */}
        <div className="flex items-center justify-between">
          {/* Speed Control */}
          <div className="flex items-center space-x-3">
            <label className="text-sm text-secondary-300">Speed:</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-24 h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-sm text-white min-w-[3rem] text-center">
                {animationSpeed.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Animation Info */}
          <div className="text-right">
            <div className="text-xs text-secondary-400">
              {currentAnimation ? (
                <>
                  <div>Duration: {animationInfo.duration.toFixed(1)}s</div>
                  <div>Frame: {Math.round(animationInfo.currentTime * 30)}/
                    {Math.round(animationInfo.duration * 30)}</div>
                </>
              ) : (
                <div>No animation selected</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Timeline Editor */}
      {showAdvancedTimeline && (
        <div className="border-t border-secondary-700">
          <TimelineEditor />
        </div>
      )}
    </div>
  )
}

// Helper function to format time display
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export default BottomPanel
