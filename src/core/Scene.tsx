import { Suspense, useEffect, useRef, useState } from 'react'
import { 
  Environment, 
  Grid, 
  OrbitControls, 
  PerspectiveCamera,
  ContactShadows,
  useProgress
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Color } from 'three'
import SandboxModelViewer from './SandboxModelViewer'
import Lighting from './Lighting'
import AIBehavior, { PersonalityType, MoodState } from './AIBehavior'

import { updatePerformance, QualityLevel } from '../utils/performance'
import { testAssetLoadingPerformance } from '../utils/mobilePerformanceTest'
import { initializeVeroldGPUCompatibility, applyVeroldRendererSettings } from '../utils/gpuCapabilitiesConfig'

// Loading component for Suspense
function Loader() {
  const { progress } = useProgress()
  
  // 🎭 Agent 4 - Remove blue overlay completely
  return null
}

// Main Scene Component with Performance Optimization and WebGL Context Handling
function Scene() {
  const { gl, scene, camera } = useThree()
  const [currentQuality, setCurrentQuality] = useState(QualityLevel.HIGH)
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    shadowsEnabled: true,
    environmentEnabled: true,
    contactShadowsEnabled: true
  })
  const [webglContextLost, setWebglContextLost] = useState(false)


  // WebGL Context Loss/Recovery Handling
  useEffect(() => {
    const canvas = gl.domElement
    
    const handleContextLost = (event: Event) => {
      console.warn('🎭 Agent 3: WebGL context lost - attempting recovery')
      setWebglContextLost(true)
      
      // Prevent default behavior to allow recovery
      event.preventDefault()
      
      // Log error for diagnostics
      if (typeof window !== 'undefined' && (window as any).__GLOBAL_MONITOR__) {
        (window as any).__GLOBAL_MONITOR__.logError({
          category: 'rendering',
          message: 'WebGL context lost - attempting recovery',
          component: 'WebGL',
          severity: 'critical',
          context: {
            component: 'WebGL Context',
            userAction: 'rendering'
          }
        })
      }
    }
    
    const handleContextRestored = () => {
      console.log('🎭 Agent 3: WebGL context restored - reinitializing renderer')
      setWebglContextLost(false)
      
      // Reinitialize renderer settings
      gl.shadowMap.enabled = true
      gl.shadowMap.type = 2 // PCFSoftShadowMap
      gl.shadowMap.autoUpdate = false
      gl.toneMapping = 1 // ACESFilmicToneMapping
      gl.toneMappingExposure = 1.2
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      gl.outputColorSpace = 'srgb'
      
      // Log recovery for diagnostics
      if (typeof window !== 'undefined' && (window as any).__GLOBAL_MONITOR__) {
        (window as any).__GLOBAL_MONITOR__.logError({
          category: 'rendering',
          message: 'WebGL context restored successfully',
          component: 'WebGL',
          severity: 'medium',
          context: {
            component: 'WebGL Context',
            userAction: 'recovery'
          }
        })
      }
    }
    
    // Add event listeners
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [gl])

  // Initialize scene settings with performance optimizations and WebGL driver compatibility
  useEffect(() => {
    // Set background color to match Mixamo's dark theme
    scene.background = new Color('#1a1a1a')
    
    // Configure renderer for optimal performance and driver compatibility
    gl.shadowMap.enabled = true
    gl.shadowMap.type = 2 // PCFSoftShadowMap - balanced quality/performance
    gl.shadowMap.autoUpdate = false // Manual shadow updates for better performance
    gl.toneMapping = 1 // ACESFilmicToneMapping
    gl.toneMappingExposure = 1.2
    
    // Performance optimizations with driver compatibility
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance
    gl.outputColorSpace = 'srgb' // Standard color space
    // Antialias is set in Canvas component props

    // Agent 2: Initialize Verold GPU compatibility and apply renderer settings (non-invasive)
    try {
      const gpuManager = initializeVeroldGPUCompatibility(gl as any)
      applyVeroldRendererSettings(gl as any)
      // Keep reference usage minimal to avoid retaining manager unnecessarily
      void gpuManager
    } catch (e) {
      console.warn('🔧 Agent 2: GPU capabilities initialization failed:', e)
    }
    
    // Enhanced WebGL driver compatibility
    const context = gl.getContext()
    if (context) {
      // Disable unused WebGL features for performance
      context.disable(context.DITHER)
      context.disable(context.SAMPLE_COVERAGE)
      
      // Check for WebGL driver compatibility issues
      const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        const renderer = context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        const vendor = context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        
        console.log('🎭 Agent 3: WebGL Driver Info:', { renderer, vendor })
        
        // Apply driver-specific optimizations
        if (renderer.includes('Intel') || renderer.includes('HD Graphics')) {
          // Intel GPU optimizations
          gl.shadowMap.type = 1 // BasicShadowMap for Intel GPUs
          gl.setPixelRatio(1) // Reduce pixel ratio for Intel GPUs
          console.log('🎭 Agent 3: Applied Intel GPU optimizations')
        } else if (renderer.includes('AMD') || renderer.includes('Radeon')) {
          // AMD GPU optimizations
          gl.shadowMap.autoUpdate = true // Enable auto-update for AMD
          console.log('🎭 Agent 3: Applied AMD GPU optimizations')
        } else if (renderer.includes('NVIDIA') || renderer.includes('GeForce')) {
          // NVIDIA GPU optimizations
          gl.shadowMap.type = 2 // PCFSoftShadowMap for NVIDIA
          console.log('🎭 Agent 3: Applied NVIDIA GPU optimizations')
        }
      }
    }
    
    // **Agent 5**: Apply lightweight performance optimizations
    console.log('🔍 Agent 5: Applying lightweight performance optimizations to Scene')
    // Simple renderer optimizations only
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    gl.shadowMap.enabled = true
    gl.shadowMap.type = 2
    
    // Frustum culling optimization (disabled to keep camera interactions predictable)
    // scene.matrixWorldAutoUpdate = false
    
    // Asset loading performance test
    testAssetLoadingPerformance().then((results: {
      fontLoadingTime: number
      textureLoadingTime: number
      modelLoadingTime: number
      recommendations: string[]
    }) => {
      console.log('🎭 Agent 3: Asset loading performance results:', results)
      if (results.recommendations.length > 0) {
        console.warn('🎭 Agent 3: Asset optimization recommendations:', results.recommendations)
      }
    }).catch((error: unknown) => {
      console.warn('🎭 Agent 3: Asset loading performance test failed:', error)
    })
    
    // Loading complete after scene setup - let App component handle loading state
    console.log('🎭 Agent 3: Scene setup complete with enhanced WebGL driver compatibility and performance optimization')
  }, [gl, scene])



  // **Agent 5**: Lightweight performance monitoring (removed heavy monitoring)
  useEffect(() => {
    if (!gl || !scene) return

    // Simple performance logging only - no heavy monitoring
    const logPerformance = () => {
      console.log('🔍 Agent 5: Scene rendering with lightweight optimizations')
    }

    // Log only once after scene setup
    setTimeout(logPerformance, 1000)

    return () => {
      // Clean cleanup
    }
  }, [gl, scene])

  // Camera reset functionality
  useEffect(() => {
    const handleResetCamera = (event: CustomEvent) => {
      console.log('🎭 Agent 1: Received reset camera event:', event.detail)
      
      // Use a simpler approach - dispatch a custom event that OrbitControls can handle
      // The actual camera reset will be handled by the OrbitControls component
      console.log('🎭 Agent 1: Camera reset event received - OrbitControls will handle the reset')
    }

    // Listen for reset camera events
    window.addEventListener('resetCameraView', handleResetCamera as EventListener)
    
    return () => {
      window.removeEventListener('resetCameraView', handleResetCamera as EventListener)
    }
  }, [])

  // WebGL Context Recovery Component
  const WebGLRecoveryOverlay = () => {
    if (!webglContextLost) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">WebGL Context Lost</h2>
          <p className="text-gray-600 mb-4">
            The 3D graphics context has been lost. This can happen due to:
          </p>
          <ul className="text-left text-sm text-gray-600 mb-4">
            <li>• GPU driver issues</li>
            <li>• Browser tab switching</li>
            <li>• System memory pressure</li>
            <li>• Graphics card overheating</li>
          </ul>
          <p className="text-sm text-gray-500">
            Attempting automatic recovery...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={<Loader />}>
        {/* Camera Controls */}
        <PerspectiveCamera makeDefault position={[0, 1.6, 3]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={20}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.8}
          target={[0, 0, 0]}
          dampingFactor={0.05}
          enableDamping
        />

        {/* Lighting Setup */}
        <Lighting />

        {/* Adaptive Environment Rendering */}
        {adaptiveSettings.environmentEnabled && (
          <Environment preset="studio" />
        )}
        
        {/* Ground Grid (Mixamo-style) with adaptive quality */}
        <Grid
          renderOrder={-1}
          position={[0, -0.01, 0]}
          infiniteGrid
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={5}
          sectionThickness={1}
          fadeDistance={currentQuality >= QualityLevel.HIGH ? 50 : 30}
          fadeStrength={1}
          cellColor="#333333"
          sectionColor="#555555"
        />

        {/* Adaptive Contact Shadows */}
        {adaptiveSettings.contactShadowsEnabled && (
          <ContactShadows
            position={[0, 0, 0]}
            scale={20}
            blur={currentQuality >= QualityLevel.HIGH ? 2 : 1}
            far={currentQuality >= QualityLevel.HIGH ? 20 : 10}
            opacity={currentQuality >= QualityLevel.MEDIUM ? 0.4 : 0.2}
            color="#000000"
          />
        )}

        {/* Model Viewer Component */}
        <SandboxModelViewer />

        {/* AI Behavior Engine - Phase 4 Priority 2 */}
        <AIBehavior
          config={{
            personalityType: PersonalityType.FRIENDLY,
            baseMood: MoodState.HAPPY,
            responsiveness: 0.7,
            creativity: 0.5,
            learningRate: 0.3,
            environmentalAwareness: true,
            moodInfluence: true,
            personalityInfluence: true,
            adaptiveBehavior: true
          }}
        />

        {/* Performance Monitor with Adaptive Quality */}
        <PerformanceMonitor 
          onQualityChange={(quality, settings) => {
            setCurrentQuality(quality)
            setAdaptiveSettings(settings)
          }} 
        />
      </Suspense>
      
      {/* WebGL Context Recovery Overlay */}
      <WebGLRecoveryOverlay />
    </>
  )
}

// Ultra-lightweight Performance monitoring component - Agent 5 optimization
function PerformanceMonitor({ 
  onQualityChange 
}: { 
  onQualityChange: (quality: QualityLevel, settings: any) => void 
}) {
  const { gl } = useThree()
  const lastQualityCheck = useRef(0)
  const currentSettingsRef = useRef({
    shadowsEnabled: true,
    environmentEnabled: true,
    contactShadowsEnabled: true
  })
  
  useFrame(() => {
    const currentTime = performance.now()
    
    // Ultra-reduced frequency: Quality adjustment every 20 seconds instead of 10
    if (currentTime - lastQualityCheck.current > 20000) {
      const metrics = updatePerformance()
      
      // Simple adaptive settings based on performance
      let newSettings = {
        shadowsEnabled: true,
        environmentEnabled: true,
        contactShadowsEnabled: true
      }
      
      if (metrics.fps < 30) {
        // Low performance: disable expensive features
        newSettings = {
          shadowsEnabled: false,
          environmentEnabled: false,
          contactShadowsEnabled: false
        }
      } else if (metrics.fps < 45) {
        // Medium performance: reduce quality
        newSettings = {
          shadowsEnabled: true,
          environmentEnabled: false,
          contactShadowsEnabled: true
        }
      }
      
      // Only call onQualityChange if settings actually changed
      const settingsChanged = 
        newSettings.shadowsEnabled !== currentSettingsRef.current.shadowsEnabled ||
        newSettings.environmentEnabled !== currentSettingsRef.current.environmentEnabled ||
        newSettings.contactShadowsEnabled !== currentSettingsRef.current.contactShadowsEnabled
      
      if (settingsChanged) {
        currentSettingsRef.current = { ...newSettings }
        onQualityChange(metrics.qualityLevel, newSettings)
        console.log(`🔍 Agent 5: Ultra-light adaptive settings applied - FPS: ${metrics.fps}`)
      }
      lastQualityCheck.current = currentTime
    }
  })

  return null
}

export default Scene
