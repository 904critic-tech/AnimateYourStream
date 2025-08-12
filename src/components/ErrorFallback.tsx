import React, { useCallback, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { useAppStore } from '@utils/store'
import { getGlobalMonitor } from '../diagnostics/index'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const { addError } = useAppStore()

  // Report error only once when component mounts
  useEffect(() => {
    // Report error to our smart diagnostics system
    addError({
      type: 'error',
      component: 'ErrorBoundary',
      message: error.message,
      stack: error.stack
    })

    // Also report to Smart Diagnostics
    const monitor = getGlobalMonitor()
    if (monitor) {
      monitor.logError({
        category: 'ui',
        message: `React Error Boundary: ${error.message}`,
        component: 'ErrorBoundary',
        severity: 'critical',
        context: {
          component: 'ErrorBoundary',
          userAction: 'component-error',
          stack: error.stack,
          timestamp: Date.now()
        }
      })
    }
  }, [error, addError]) // Only re-run if error or addError changes

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  const handleReset = useCallback(() => {
    resetErrorBoundary()
  }, [resetErrorBoundary])

  // Generate error ID only once
  const errorId = React.useMemo(() => Date.now().toString(36), [])

  return (
    <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-secondary-800 rounded-lg border border-red-500/20 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-red-500/20 p-2 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            Something went wrong
          </h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-secondary-300">
            The 3D model viewer encountered an unexpected error. Our AI diagnostics 
            system has been notified and is analyzing the issue.
          </p>
          
          <div className="bg-secondary-900 rounded p-3 border border-secondary-700">
            <div className="flex items-center space-x-2 mb-2">
              <Bug className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Error Details</span>
            </div>
            <code className="text-xs text-secondary-400 break-all">
              {error.message}
            </code>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={handleReload}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
          
          <div className="text-xs text-secondary-500 text-center">
            Error ID: {errorId}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ErrorFallback)
