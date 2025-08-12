import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ErrorBoundary } from 'react-error-boundary'
import Scene from './core/Scene'
import CharacterBuilderPage from './pages/CharacterBuilderPage'
import ErrorFallback from './components/ErrorFallback'
import Layout from './components/UI/Layout'
import { useAppStore } from '@utils/store'
import MicrophoneTestPage from './lipSync/agent4_microphone_test_page'
import { initializeAIBehavior } from './ai'
import { initializeGlobalErrorDetection } from './diagnostics'
// Performance monitoring is handled internally by the PerformanceMonitor class

// Loading screen component
function LoadingScreen() {
  const { setIsLoading } = useAppStore()
  
  const handleManualDismiss = useCallback(() => {
    console.log('🎭 Agent 1: Manual loading screen dismissal')
    setIsLoading(false)
  }, [setIsLoading])
  
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">AnimateYourStream</h1>
          <p className="text-lg opacity-90 mb-6">Loading 3D Environment...</p>
          <button
            onClick={handleManualDismiss}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    )
}

function App() {
  const { isLoading, setIsLoading, currentModel, setCurrentModel } = useAppStore()
  const [hasError, setHasError] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false)
  const [systemsInitialized, setSystemsInitialized] = useState(false)

  // Absolute fallback: ensure loader never persists more than 3s on first load (production-safe)
  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    return () => clearTimeout(hardTimeout)
  }, [setIsLoading])

  // Feature flagged Viewer (Beta) route
  const enableViewerBeta = useMemo(() => {
    try {
      // Vite env flag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env: any = (import.meta as any)?.env || {}
      return String(env.VITE_ENABLE_VIEWER_BETA).toLowerCase() === 'true'
    } catch {
      return false
    }
  }, [])
  const isViewerBetaRoute = enableViewerBeta && typeof window !== 'undefined' && window.location.pathname === '/viewer-beta'
  const isBuilderRoute = typeof window !== 'undefined' && window.location.pathname === '/builder'
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [iframeLogs, setIframeLogs] = useState<string[]>([])
  const postToIframe = useCallback((msg: unknown) => {
    try {
      const win = iframeRef.current?.contentWindow
      if (win) {
        win.postMessage(msg, '*')
      }
    } catch (e) {
      console.error('ViewerBeta postMessage failed', e)
    }
  }, [])
  useEffect(() => {
    if (!isViewerBetaRoute) return
    function onMessage(ev: MessageEvent) {
      try {
        const data = ev.data
        if (!data || typeof data !== 'object') return
        if ((data as any).scope !== 'sandbox') return
        if ((data as any).type === 'iframeLog') {
          setIframeLogs(prev => [...prev.slice(-50), String((data as any).message)])
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isViewerBetaRoute])

  // Check if we should show the microphone test page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('test') === 'microphone') {
      setShowMicrophoneTest(true)
    }
  }, [])

  // Ensure app initialization runs exactly once, regardless of currentModel preset
  useEffect(() => {
    if (!isInitialized) {
      if (!currentModel) {
        setCurrentModel('elmo')
        console.log('🎭 Agent 1: Default character initialized to Elmo')
      }
      setIsInitialized(true)
      console.log('🎭 Agent 1: App initialization flag set')
    }
  }, [currentModel, setCurrentModel, isInitialized])

  // Initialize AI Behavior and Smart Diagnostics systems
  useEffect(() => {
    if (isInitialized && !systemsInitialized) {
      console.log('🎭 Agent 1: Initializing AI Behavior and Smart Diagnostics systems...')
      
      const initializeSystems = async () => {
        try {
          // Initialize AI Behavior System
          initializeAIBehavior()
          console.log('🎭 Agent 1: AI Behavior System initialized successfully')
          
          // Initialize Smart Diagnostics
          initializeGlobalErrorDetection()
          console.log('🎭 Agent 1: Smart Diagnostics System initialized successfully')
          
          setSystemsInitialized(true)
        } catch (error) {
          console.error('🎭 Agent 1: Error initializing systems:', error)
          // Continue anyway - systems are optional
          setSystemsInitialized(true)
        }
      }
      
      initializeSystems()
    }
  }, [isInitialized, systemsInitialized])

  // Handle loading state with optimized timer management
  useEffect(() => {
    if (isInitialized && systemsInitialized) {
      console.log('🎭 Agent 1: Starting loading state management')
      
      // Primary loading timer - 2 seconds
      const primaryTimer = setTimeout(() => {
        console.log('🎭 Agent 1: Primary loading timer completed')
        setIsLoading(false)
      }, 2000)
      
      // Fallback safety timer - 5 seconds maximum
      const fallbackTimer = setTimeout(() => {
        console.log('🎭 Agent 1: Fallback timer triggered - forcing loading to complete')
        setIsLoading(false)
      }, 5000)
      
      return () => {
        clearTimeout(primaryTimer)
        clearTimeout(fallbackTimer)
      }
    }
  }, [isInitialized, systemsInitialized, setIsLoading])

  // Force loading to complete if stuck (only if still loading after initialization)
  useEffect(() => {
    if (isInitialized && systemsInitialized && isLoading) {
      const forceCompleteTimer = setTimeout(() => {
        console.log('🎭 Agent 1: Force completing loading state')
        setIsLoading(false)
      }, 10000) // 10 second maximum
      
      return () => clearTimeout(forceCompleteTimer)
    }
  }, [isInitialized, systemsInitialized, isLoading, setIsLoading])

  // Error handling callback
  const handleError = useCallback((error: Error) => {
    console.error('🎭 Agent 1: React Three Fiber error caught:', error)
    setHasError(true)
  }, [])

  // Canvas created callback
  const handleCanvasCreated = useCallback(({ gl }: any) => {
    gl.setClearColor('#1a1a1a')
    gl.shadowMap.enabled = true
    gl.shadowMap.type = 2 // PCFSoftShadowMap
    console.log('🎭 Agent 1: Canvas initialized successfully')
  }, [])

  useEffect(() => {
    // Load persisted AI suggestion settings
    try {
      const raw = localStorage.getItem('mixamo-viewer-settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.aiSuggestionsEnabled === 'boolean') {
          useAppStore.getState().setAiSuggestionsEnabled(parsed.aiSuggestionsEnabled)
        }
        if (typeof parsed.aiSuggestionIntervalMs === 'number') {
          useAppStore.getState().setAiSuggestionIntervalMs(parsed.aiSuggestionIntervalMs)
        }
      }
    } catch {}
  }, [])

  if (hasError) {
    return (
      <ErrorFallback 
        error={new Error('Application error occurred')}
        resetErrorBoundary={() => setHasError(false)}
      />
    )
  }

  // Show microphone test page if requested
  if (showMicrophoneTest) {
    return <MicrophoneTestPage />
  }

  // Character Builder route
  if (isBuilderRoute) {
    return <CharacterBuilderPage />
  }

  // Viewer (Beta) route: embed legacy iframe and expose minimal controls
  if (isViewerBetaRoute) {
    const sendUI = (action: string, extra?: Record<string, unknown>) => () => postToIframe({ scope: 'sandbox', type: 'uiAction', action, ...extra })
    const startGuided = () => postToIframe({ scope: 'sandbox', type: 'uiAction', action: 'startGuided', labels: ['Hips','Chest','Head','LeftShoulder','LeftElbow','LeftWrist','RightShoulder','RightElbow','RightWrist','LeftKnee','LeftAnkle','RightKnee','RightAnkle'] })
    const loadDefaultFBX = () => postToIframe({ scope: 'sandbox', type: 'loadModel', url: '/models/Default_Model.fbx', name: 'Default_Model.fbx' })
    return (
      <div className="w-full h-screen bg-black text-white flex flex-col">
        <div className="flex items-center gap-2 p-2 bg-zinc-900 border-b border-zinc-800">
          <span className="text-sm opacity-80">Viewer Beta</span>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={loadDefaultFBX}>Load Default FBX</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={sendUI('placeMarkers')}>Place Markers</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={startGuided}>Start Guided</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={sendUI('autoWeights')}>Auto Weights</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={sendUI('playIdle')}>Play Idle</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={sendUI('stop')}>Stop</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={sendUI('saveGlb')}>Save GLB</button>
          <button className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm" onClick={sendUI('clear')}>Clear</button>
          <a className="ml-auto underline text-xs opacity-80" href="/legacy/viewer_iframe.html" target="_blank" rel="noreferrer">Open Iframe</a>
        </div>
        <div className="flex-1 grid grid-cols-12 gap-0">
          <div className="col-span-9 h-full">
            <iframe ref={iframeRef} title="viewer-iframe" src="/legacy/viewer_iframe.html" className="w-full h-full border-0" />
          </div>
          <div className="col-span-3 h-full bg-zinc-950 border-l border-zinc-800 p-2 overflow-auto">
            <div className="text-sm mb-2 opacity-80">Logs</div>
            <div className="space-y-1 text-xs">
              {iframeLogs.slice(-200).map((l, i) => (
                <div key={i} className="text-zinc-300">{l}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gray-900 relative overflow-hidden">
      {/* Loading Screen (disabled for production hardening) */}
      {false && isLoading && <LoadingScreen />}
      
      {/* Main 3D Application */}
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={handleError}
      >
        <Canvas
          shadows
          camera={{ position: [0, 1.6, 3], fov: 50 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true
          }}
          onCreated={handleCanvasCreated}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Complete UI Layout with Character Selection, Animation Controls, and Timeline */}
      <Layout />

      {/* Performance Monitor Overlay */}
      <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
        <div>FPS: <span id="fps-counter">--</span></div>
        <div>Memory: <span id="memory-usage">--</span></div>
      </div>
    </div>
  )
}

export default App
