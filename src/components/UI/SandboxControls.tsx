import React from 'react'

interface SandboxControlsProps {
  onLoadModel?: () => void
  onPlaceMarkers?: () => void
  onBuildSkeleton?: () => void
  onAutoWeights?: () => void
  onSaveGLB?: () => void
  onClear?: () => void
}

export default function SandboxControls({
  onLoadModel,
  onPlaceMarkers,
  onBuildSkeleton,
  onAutoWeights,
  onSaveGLB,
  onClear
}: SandboxControlsProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">Sandbox Autorigger</h3>
      
      <div className="space-y-2">
        <button
          onClick={onLoadModel}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
        >
          Load Default Model
        </button>
        
        <button
          onClick={onPlaceMarkers}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
        >
          Place Markers
        </button>
        
        <button
          onClick={onBuildSkeleton}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
        >
          Build Skeleton
        </button>
        
        <button
          onClick={onAutoWeights}
          className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
        >
          Auto Weights
        </button>
        
        <button
          onClick={onSaveGLB}
          className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
        >
          Save GLB
        </button>
        
        <button
          onClick={onClear}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Clear Scene
        </button>
      </div>
    </div>
  )
}
