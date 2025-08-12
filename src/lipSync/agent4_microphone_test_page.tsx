/**
 * Agent 4 - Microphone Test Page
 * Test page for diagnosing and fixing microphone detection issues
 */

import { useState } from 'react'
import { runMicrophoneDiagnostic } from './agent4_microphone_diagnostic'
import { startMicrophoneProcessing, stopMicrophoneProcessing } from './agent4_microphone_fix'
import { useAppStore } from '../utils/store'

export function MicrophoneTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { audioLevel, microphoneEnabled, setMicrophoneEnabled } = useAppStore()

  const runDiagnostic = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      console.log('🎤 Agent 4 - Starting microphone diagnostic...')
      const success = await runMicrophoneDiagnostic()
      
      if (success) {
        setResults({ success: true, message: 'Microphone diagnostic completed successfully' })
        console.log('✅ Microphone diagnostic completed successfully')
      } else {
        setError('Microphone diagnostic failed - check console for details')
        console.error('❌ Microphone diagnostic failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Diagnostic error: ${errorMessage}`)
      console.error('❌ Diagnostic error:', err)
    } finally {
      setIsRunning(false)
    }
  }

  const toggleMicrophone = async () => {
    const newState = !microphoneEnabled
    setMicrophoneEnabled(newState)
    
    if (newState) {
      // Start microphone processing
      console.log('🎤 Agent 4 - Starting microphone processing...')
      const success = await startMicrophoneProcessing()
      if (success) {
        console.log('✅ Agent 4 - Microphone processing started successfully')
      } else {
        console.error('❌ Agent 4 - Failed to start microphone processing')
        setMicrophoneEnabled(false) // Revert state if failed
      }
    } else {
      // Stop microphone processing
      console.log('🎤 Agent 4 - Stopping microphone processing...')
      stopMicrophoneProcessing()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">🎤 Agent 4 - Microphone Diagnostic</h1>
          <p className="text-gray-300 mb-6">
            Comprehensive diagnostic and fix for microphone detection issues
          </p>

          {/* Status Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Microphone Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${microphoneEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{microphoneEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Audio Level</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm">{(audioLevel * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Diagnostic Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : results ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span>{isRunning ? 'Running...' : results ? 'Completed' : 'Not Started'}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isRunning
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? 'Running Diagnostic...' : 'Run Microphone Diagnostic'}
            </button>

            <button
              onClick={toggleMicrophone}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                microphoneEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {microphoneEnabled ? 'Disable Microphone' : 'Enable Microphone'}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Diagnostic Results</h3>
              <p className="text-green-300">{results.message}</p>
              <pre className="mt-2 text-sm text-green-200 bg-green-900/30 p-2 rounded">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Diagnostic Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">📋 Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-300">
              <li>Enable your microphone in the browser when prompted</li>
              <li>Click "Run Microphone Diagnostic" to test the system</li>
              <li>Speak into your microphone during the test</li>
              <li>Check the audio level meter for volume detection</li>
              <li>Review the diagnostic results for any issues</li>
            </ol>
          </div>
        </div>

        {/* Real-time Audio Level Display */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📊 Real-time Audio Level</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Current Audio Level:</span>
              <span className="font-mono">{(audioLevel * 100).toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-400">
              {audioLevel > 0.1 ? '✅ Audio detected' : '❌ No audio detected'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MicrophoneTestPage
