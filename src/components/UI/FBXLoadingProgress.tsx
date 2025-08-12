/**
 * FBX Loading Progress Component
 * 
 * Agent 2 - Performance Optimization Team
 * Displays real-time loading progress for large FBX files
 */

import React, { useCallback, useMemo } from 'react'
import { FBXLoadingProgress } from '../../utils/fbxLoaderOptimizer'

interface FBXLoadingProgressProps {
  progress: FBXLoadingProgress
  isVisible: boolean
  onCancel?: () => void
}

const FBXLoadingProgressComponent: React.FC<FBXLoadingProgressProps> = ({
  progress,
  isVisible,
  onCancel
}) => {
  if (!isVisible) return null

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s'
  }, [formatBytes])

  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }, [])

  const getStageColor = useCallback((stage: string): string => {
    switch (stage) {
      case 'init': return 'text-blue-500'
      case 'downloading': return 'text-yellow-500'
      case 'parsing': return 'text-purple-500'
      case 'processing': return 'text-green-500'
      case 'complete': return 'text-green-600'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }, [])

  const getStageIcon = useCallback((stage: string): string => {
    switch (stage) {
      case 'init': return '🚀'
      case 'downloading': return '📥'
      case 'parsing': return '🔍'
      case 'processing': return '⚙️'
      case 'complete': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }, [])

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])

  // Memoize expensive calculations
  const progressPercentage = useMemo(() => progress.percentage.toFixed(1), [progress.percentage])
  const stageDisplayName = useMemo(() => 
    progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1), 
    [progress.stage]
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getStageIcon(progress.stage)}</span>
            <h3 className="text-lg font-semibold text-gray-800">
              Loading 3D Model
            </h3>
          </div>
          {onCancel && progress.stage !== 'complete' && progress.stage !== 'error' && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{stageDisplayName}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.stage === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div className={`text-sm font-medium mb-4 ${getStageColor(progress.stage)}`}>
          {progress.message}
        </div>

        {/* Download Stats */}
        {progress.stage === 'downloading' && (
          <div className="space-y-2 text-sm text-gray-600">
            {/* Progress Details */}
            <div className="flex justify-between">
              <span>Downloaded:</span>
              <span>{formatBytes(progress.loaded)} / {formatBytes(progress.total)}</span>
            </div>

            {/* Download Speed */}
            {progress.downloadSpeed && (
              <div className="flex justify-between">
                <span>Speed:</span>
                <span>{formatSpeed(progress.downloadSpeed)}</span>
              </div>
            )}

            {/* Estimated Time */}
            {progress.estimatedTimeRemaining && (
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span>{formatTime(progress.estimatedTimeRemaining)}</span>
              </div>
            )}
          </div>
        )}

        {/* Performance Info */}
        {progress.stage === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="text-sm text-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <span>✅</span>
                <span className="font-medium">Model loaded successfully!</span>
              </div>
              <div className="text-xs text-green-600">
                The 3D model is now ready for animation and interaction.
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {progress.stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-sm text-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <span>❌</span>
                <span className="font-medium">Loading failed</span>
              </div>
              <div className="text-xs text-red-600">
                {progress.message}
              </div>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {progress.stage === 'downloading' && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(FBXLoadingProgressComponent)
