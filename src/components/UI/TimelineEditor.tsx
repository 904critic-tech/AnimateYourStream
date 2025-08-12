/**
 * Timeline Editor Component
 * 
 * Advanced timeline interface for animation control with keyframes,
 * scrubbing, layer management, and precise timing controls.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Square,
  Scissors,
  Copy,
  Layers,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react'
import { useAppStore } from '../../utils/store'

// Timeline keyframe interface
interface Keyframe {
  id: string
  time: number
  value: any
  type: 'animation' | 'blend' | 'event'
  easing: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut'
}

// Timeline layer interface
interface TimelineLayer {
  id: string
  name: string
  type: 'animation' | 'audio' | 'events'
  visible: boolean
  locked: boolean
  height: number
  color: string
  keyframes: Keyframe[]
  volume?: number
}

// Timeline configuration
interface TimelineConfig {
  fps: 30
  duration: 10 // seconds
  pixelsPerSecond: 100
  snapToFrames: boolean
  magneticSnap: boolean
  showWaveforms: boolean
}

export function TimelineEditor() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const [config] = useState<TimelineConfig>({
    fps: 30,
    duration: 10,
    pixelsPerSecond: 100,
    snapToFrames: true,
    magneticSnap: true,
    showWaveforms: false
  })

  const [layers, setLayers] = useState<TimelineLayer[]>([
    {
      id: 'main-animation',
      name: 'Main Animation',
      type: 'animation',
      visible: true,
      locked: false,
      height: 60,
      color: '#3b82f6',
      keyframes: []
    },
    {
      id: 'facial-animation',
      name: 'Facial Animation',
      type: 'animation',
      visible: true,
      locked: false,
      height: 40,
      color: '#8b5cf6',
      keyframes: []
    },
    {
      id: 'audio-track',
      name: 'Audio Track',
      type: 'audio',
      visible: true,
      locked: false,
      height: 80,
      color: '#10b981',
      keyframes: [],
      volume: 1.0
    }
  ])

  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; time: number } | null>(null)

  const {
    isPlaying,
    setIsPlaying,
    animationSpeed,
    setAnimationSpeed,
    animationInfo,
    setAnimationInfo
  } = useAppStore()

  // Calculate timeline dimensions
  const timelineWidth = config.duration * config.pixelsPerSecond
  const totalHeight = layers.reduce((sum, layer) => sum + layer.height, 0)

  // Convert time to pixel position
  const timeToPixel = useCallback((time: number) => {
    return time * config.pixelsPerSecond
  }, [config.pixelsPerSecond])

  // Convert pixel position to time
  const pixelToTime = useCallback((pixel: number) => {
    return pixel / config.pixelsPerSecond
  }, [config.pixelsPerSecond])

  // Snap time to frame if enabled
  const snapToFrame = useCallback((time: number) => {
    if (!config.snapToFrames) return time
    const frameTime = 1 / config.fps
    return Math.round(time / frameTime) * frameTime
  }, [config.fps, config.snapToFrames])

  // Handle playhead dragging
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, time: animationInfo.currentTime })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = snapToFrame(Math.max(0, Math.min(config.duration, pixelToTime(x))))

    setAnimationInfo({
      currentTime: newTime
    })
  }, [isDragging, dragStart, snapToFrame, config.duration, pixelToTime, setAnimationInfo])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragStart(null)
  }, [])

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Playback controls
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const skipToStart = () => {
    setAnimationInfo({ currentTime: 0 })
    setIsPlaying(false)
  }

  const skipToEnd = () => {
    setAnimationInfo({ currentTime: config.duration })
    setIsPlaying(false)
  }

  const stopPlayback = () => {
    setIsPlaying(false)
    setAnimationInfo({ currentTime: 0 })
  }

  // Layer management
  const toggleLayerVisibility = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))
  }

  const toggleLayerLock = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, locked: !layer.locked }
        : layer
    ))
  }

  // Timeline interaction handlers
  const handleTimelineClick = (e: React.MouseEvent, layerId: string) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 192 // Account for layer header width
    const clickTime = snapToFrame(Math.max(0, Math.min(config.duration, pixelToTime(x))))
    
    // Seek to clicked position
    setAnimationInfo({ currentTime: clickTime })
    
    // Connect to animation blender for seeking
    const animationBlender = (window as any).__ANIMATION_BLENDER__
    if (animationBlender) {
      // Set time on the clicked layer if it's a main animation layer
      const currentLayer = layers.find(layer => layer.id === layerId)
      if (currentLayer && currentLayer.type === 'animation') {
        animationBlender.setAnimationTimeScale(1) // Ensure normal speed
      }
    }
  }

  const handleTimelineDoubleClick = (e: React.MouseEvent, layerId: string) => {
    if (!timelineRef.current) return
    
    const layer = layers.find(l => l.id === layerId)
    if (!layer || layer.locked) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 192
    const clickTime = snapToFrame(Math.max(0, Math.min(config.duration, pixelToTime(x))))
    
    // Add keyframe at double-click position
    addKeyframe(layerId, clickTime, { type: 'auto', value: 1.0 })
  }

  const handleKeyframeMouseDown = (e: React.MouseEvent, keyframeId: string) => {
    e.stopPropagation()
    
    // Select the keyframe
    if (!e.shiftKey) {
      setSelectedKeyframes([keyframeId])
    } else {
      setSelectedKeyframes(prev => 
        prev.includes(keyframeId) 
          ? prev.filter(id => id !== keyframeId)
          : [...prev, keyframeId]
      )
    }
    
    // Start dragging
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      time: pixelToTime(e.clientX - (timelineRef.current?.getBoundingClientRect().left || 0))
    })
    
    // Add global mouse event listeners for dragging
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current || !dragStart) return
      
      const rect = timelineRef.current.getBoundingClientRect()
      const currentTime = pixelToTime(moveEvent.clientX - rect.left)
      const timeDelta = currentTime - dragStart.time
      
      // Update positions of selected keyframes
      setLayers(layers.map(layer => ({
        ...layer,
        keyframes: layer.keyframes.map(kf => {
          if (selectedKeyframes.includes(kf.id) || kf.id === keyframeId) {
            const newTime = Math.max(0, Math.min(config.duration, kf.time + timeDelta))
            return { ...kf, time: snapToFrame(newTime) }
          }
          return kf
        }).sort((a, b) => a.time - b.time)
      })))
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      setDragStart(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Enhanced keyframe management
  const addKeyframe = (layerId: string, time: number, value: any) => {
    const newKeyframe: Keyframe = {
      id: `keyframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: snapToFrame(time),
      value,
      type: 'animation',
      easing: 'ease'
    }

    setLayers(layers.map(layer => 
      layer.id === layerId
        ? { 
            ...layer, 
            keyframes: [...layer.keyframes, newKeyframe].sort((a, b) => a.time - b.time) 
          }
        : layer
    ))
  }

  const removeKeyframe = (keyframeId: string) => {
    setLayers(layers.map(layer => ({
      ...layer,
      keyframes: layer.keyframes.filter(kf => kf.id !== keyframeId)
    })))
    setSelectedKeyframes(selectedKeyframes.filter(id => id !== keyframeId))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space bar - toggle play/pause
      if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        togglePlayPause()
      }
      // Delete - remove selected keyframes
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedKeyframes.length > 0) {
          selectedKeyframes.forEach(removeKeyframe)
        }
      }
      // Ctrl+A - select all keyframes
      else if (e.ctrlKey && e.code === 'KeyA') {
        e.preventDefault()
        const allKeyframes = layers.flatMap(layer => layer.keyframes.map(kf => kf.id))
        setSelectedKeyframes(allKeyframes)
      }
      // Escape - deselect all
      else if (e.code === 'Escape') {
        setSelectedKeyframes([])
      }
      // Arrow keys for frame-by-frame navigation
      else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        const frameTime = 1 / config.fps
        const currentTime = animationInfo.currentTime
        const newTime = e.code === 'ArrowLeft' 
          ? Math.max(0, currentTime - frameTime)
          : Math.min(config.duration, currentTime + frameTime)
        setAnimationInfo({ currentTime: snapToFrame(newTime) })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedKeyframes, layers, animationInfo.currentTime, config.fps, config.duration, togglePlayPause, removeKeyframe, snapToFrame, setAnimationInfo])



  // Timeline ruler component
  const TimelineRuler = () => {
    const ticks = []
    const majorTickInterval = 1 // seconds
    const minorTickInterval = 0.1 // seconds

    for (let time = 0; time <= config.duration; time += minorTickInterval) {
      const x = timeToPixel(time)
      const isMajorTick = time % majorTickInterval === 0
      
      ticks.push(
        <div
          key={time}
          className={`absolute border-l ${
            isMajorTick 
              ? 'border-secondary-400 h-6' 
              : 'border-secondary-600 h-3'
          }`}
          style={{ left: x }}
        >
          {isMajorTick && (
            <div className="absolute -top-5 -translate-x-1/2 text-xs text-secondary-400">
              {time.toFixed(1)}s
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="relative h-8 bg-secondary-800 border-b border-secondary-700">
        {ticks}
      </div>
    )
  }

  // Layer component
  const LayerComponent = ({ layer }: { layer: TimelineLayer }) => {
    return (
      <div 
        className="relative border-b border-secondary-700"
        style={{ height: layer.height }}
      >
        {/* Layer header */}
        <div className="absolute left-0 top-0 w-48 h-full bg-secondary-800 border-r border-secondary-700 flex items-center px-3">
          <div className="flex items-center space-x-2 flex-1">
            <button
              onClick={() => toggleLayerVisibility(layer.id)}
              className="p-1 hover:bg-secondary-700 rounded"
            >
              {layer.visible ? (
                <Eye className="w-4 h-4 text-secondary-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-secondary-600" />
              )}
            </button>
            
            <button
              onClick={() => toggleLayerLock(layer.id)}
              className="p-1 hover:bg-secondary-700 rounded"
            >
              {layer.locked ? (
                <Lock className="w-4 h-4 text-red-400" />
              ) : (
                <Unlock className="w-4 h-4 text-secondary-400" />
              )}
            </button>

            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: layer.color }}
            />
            
            <span className="text-sm text-white truncate flex-1">
              {layer.name}
            </span>

            {layer.type === 'audio' && (
              <Volume2 className="w-4 h-4 text-secondary-400" />
            )}
          </div>
        </div>

        {/* Layer content */}
        <div 
          className="absolute left-48 top-0 h-full bg-secondary-900 cursor-crosshair"
          style={{ width: timelineWidth }}
          onClick={(e) => handleTimelineClick(e, layer.id)}
          onDoubleClick={(e) => handleTimelineDoubleClick(e, layer.id)}
        >
          {/* Animation blocks for main animation layers */}
          {layer.type === 'animation' && (
            <div
              className="absolute inset-y-1 bg-gradient-to-r from-blue-600/40 to-blue-500/40 
                         border border-blue-500/50 rounded"
              style={{
                left: 0,
                width: timeToPixel(config.duration * 0.8) // Example animation block
              }}
            >
              <div className="text-xs text-white p-1 truncate">
                {layer.name}
              </div>
            </div>
          )}

          {/* Keyframes */}
          {layer.keyframes.map(keyframe => {
            const isSelected = selectedKeyframes.includes(keyframe.id)
            const isDraggingThis = isDragging && isSelected
            
            return (
              <div
                key={keyframe.id}
                className={`absolute rounded-full transform -translate-x-1 -translate-y-1 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-white ring-2 ring-primary-500 w-3 h-3 shadow-lg'
                    : 'bg-yellow-400 hover:bg-yellow-300 w-2 h-2'
                } ${isDraggingThis ? 'scale-150 shadow-xl z-20' : 'hover:scale-125'}`}
                style={{
                  left: timeToPixel(keyframe.time),
                  top: layer.height / 2
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedKeyframes(
                    selectedKeyframes.includes(keyframe.id)
                      ? selectedKeyframes.filter(id => id !== keyframe.id)
                      : [...selectedKeyframes, keyframe.id]
                  )
                }}
                onMouseDown={(e) => handleKeyframeMouseDown(e, keyframe.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  removeKeyframe(keyframe.id)
                }}
                title={`${keyframe.type} keyframe at ${keyframe.time.toFixed(2)}s${isSelected ? ' (selected)' : ''}`}
              />
            )
          })}

          {/* Audio waveform (placeholder) */}
          {layer.type === 'audio' && config.showWaveforms && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs text-secondary-500">Audio Waveform</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary-900 border-t border-secondary-700">
      {/* Timeline controls */}
      <div className="flex items-center justify-between p-3 border-b border-secondary-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={skipToStart}
            className="p-2 hover:bg-secondary-700 rounded transition-colors"
          >
            <SkipBack className="w-4 h-4 text-secondary-300" />
          </button>
          
          <button
            onClick={togglePlayPause}
            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={stopPlayback}
            className="p-2 hover:bg-secondary-700 rounded transition-colors"
          >
            <Square className="w-4 h-4 text-secondary-300" />
          </button>
          
          <button
            onClick={skipToEnd}
            className="p-2 hover:bg-secondary-700 rounded transition-colors"
          >
            <SkipForward className="w-4 h-4 text-secondary-300" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-300">Speed:</span>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-white w-12">
              {animationSpeed.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Cut selected keyframes
                if (selectedKeyframes.length > 0) {
                  console.log('Cut keyframes:', selectedKeyframes)
                }
              }}
              className="p-1 hover:bg-secondary-700 rounded transition-colors"
              title="Cut selected keyframes (Ctrl+X)"
            >
              <Scissors className="w-4 h-4 text-secondary-400" />
            </button>
            <button
              onClick={() => {
                // Copy selected keyframes
                if (selectedKeyframes.length > 0) {
                  console.log('Copy keyframes:', selectedKeyframes)
                }
              }}
              className="p-1 hover:bg-secondary-700 rounded transition-colors"
              title="Copy selected keyframes (Ctrl+C)"
            >
              <Copy className="w-4 h-4 text-secondary-400" />
            </button>
            <button
              onClick={() => {
                // Toggle layer visibility panel
                console.log('Toggle layer options')
              }}
              className="p-1 hover:bg-secondary-700 rounded transition-colors"
              title="Layer options"
            >
              <Layers className="w-4 h-4 text-secondary-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative overflow-x-auto" ref={timelineRef}>
        <div style={{ width: Math.max(timelineWidth + 200, 800) }}>
          {/* Ruler */}
          <TimelineRuler />

          {/* Playhead */}
          <div
            ref={playheadRef}
            className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-10 cursor-ew-resize"
            style={{ left: timeToPixel(animationInfo.currentTime) + 48 }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 transform rotate-45" />
          </div>

          {/* Layers */}
          <div style={{ height: totalHeight }}>
            {layers.map(layer => (
              <LayerComponent key={layer.id} layer={layer} />
            ))}
          </div>
        </div>
      </div>

      {/* Timeline info */}
      <div className="flex items-center justify-between p-2 bg-secondary-800 text-xs text-secondary-400">
        <div>
          Frame: {Math.round(animationInfo.currentTime * config.fps)} / {Math.round(config.duration * config.fps)}
        </div>
        <div>
          Time: {animationInfo.currentTime.toFixed(2)}s / {config.duration.toFixed(2)}s
        </div>
        <div>
          FPS: {config.fps}
        </div>
      </div>
    </div>
  )
}

export default TimelineEditor
