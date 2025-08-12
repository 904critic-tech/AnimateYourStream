import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, FileText, ExternalLink } from 'lucide-react';
import { getGlobalMonitor } from '../../diagnostics/index';
import { AutoRepairSystem } from '../../diagnostics/AutoRepairSystem';

interface ProductionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isAttemptingRepair: boolean;
  repairResult: any | null;
  errorId: string;
}

interface ProductionErrorBoundaryProps {
  children: ReactNode;
}

export default class ProductionErrorBoundary extends Component<ProductionErrorBoundaryProps, ProductionErrorBoundaryState> {
  private autoRepair: AutoRepairSystem;
  private errorReportUrl: string;

  constructor(props: ProductionErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isAttemptingRepair: false,
      repairResult: null,
      errorId: ''
    };

    this.autoRepair = new AutoRepairSystem();
    this.errorReportUrl = process.env.REACT_APP_ERROR_REPORT_URL || 'mailto:support@mixamo-viewer.com';
  }

  static getDerivedStateFromError(error: Error): Partial<ProductionErrorBoundaryState> {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorId } = this.state;

    // Update state with error info
    this.setState({ errorInfo });

    // Report to Smart Diagnostics
    this.reportToSmartDiagnostics(error, errorInfo, errorId);

    // Attempt auto-repair in production
    this.attemptAutoRepair(error, errorInfo, errorId);

    // Report to external error tracking
    this.reportToErrorTracking(error, errorInfo, errorId);

    // Hide stack traces in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production Error Boundary caught an error:', {
        message: error.message,
        errorId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  private reportToSmartDiagnostics(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    const monitor = getGlobalMonitor();
    if (monitor) {
      monitor.logError({
        category: 'ui',
        message: `Production Error Boundary: ${error.message}`,
        component: 'ProductionErrorBoundary',
        severity: 'critical',
        context: {
          component: errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown',
          errorId,
          userAction: 'component-error',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: Date.now()
        }
      });
    }
  }

  private async attemptAutoRepair(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    this.setState({ isAttemptingRepair: true });

    try {
      // Create a smart error for the auto-repair system
      const smartError = {
        id: errorId,
        category: 'ui' as const,
        severity: 'high' as const,
        message: error.message,
        component: errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown',
        timestamp: Date.now(),
        context: {
          componentStack: errorInfo?.componentStack,
          userAction: 'component-error',
          systemState: {
            features: ['3d-rendering', 'ui-components'],
            memoryUsage: (performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0,
            fps: 60 // Default FPS for error boundary context
          }
        }
      };

      const repairResult = await this.autoRepair.attemptRepair(smartError);
      
      this.setState({ 
        isAttemptingRepair: false,
        repairResult
      });

      // If repair was successful, try to recover
      if (repairResult?.success) {
        setTimeout(() => {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            repairResult: null
          });
        }, 2000);
      }
    } catch (repairError) {
      console.error('Auto-repair failed:', repairError);
      this.setState({ isAttemptingRepair: false });
    }
  }

  private reportToErrorTracking(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    // This would integrate with Sentry or similar service in production
    const errorReport = {
      errorId,
      message: error.message,
      component: errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Don't include stack traces in production for security
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    // Store locally for support
    try {
      localStorage.setItem(`error_${errorId}`, JSON.stringify(errorReport));
    } catch (e) {
      // Silent fail if localStorage is not available
    }

    // Report to analytics/monitoring service (would be implemented)
    if ((window as any).errorTracker) {
      (window as any).errorTracker.captureException(error, {
        tags: { errorId, component: 'ProductionErrorBoundary' },
        extra: errorReport
      });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      repairResult: null,
      errorId: ''
    });
  };

  private handleReportIssue = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Error Report - ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
Message: ${error?.message || 'Unknown error'}
Browser: ${navigator.userAgent}
URL: ${window.location.href}

Additional details:
Please describe what you were doing when this error occurred.
    `);

    if (this.errorReportUrl.startsWith('mailto:')) {
      window.location.href = `${this.errorReportUrl}?subject=${subject}&body=${body}`;
    } else {
      // Open support portal or form
      window.open(`${this.errorReportUrl}?errorId=${errorId}`, '_blank');
    }
  };

  private exportDiagnostics = () => {
    const monitor = getGlobalMonitor();
    if (monitor) {
      const diagnostics = monitor.exportDiagnostics();
      const blob = new Blob([diagnostics], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnostics_${this.state.errorId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, isAttemptingRepair, repairResult, errorId } = this.state;

      return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-secondary-800 rounded-xl border border-red-500/20 p-8">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-red-500/20 p-3 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Oops! Something went wrong
                </h1>
                <p className="text-secondary-400 text-sm">
                  Error ID: {errorId}
                </p>
              </div>
            </div>

            {/* Auto-repair status */}
            {isAttemptingRepair && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  <span className="text-blue-400 font-medium">
                    AI Auto-Repair is analyzing the issue...
                  </span>
                </div>
              </div>
            )}

            {/* Repair result */}
            {repairResult && (
              <div className={`border rounded-lg p-4 mb-6 ${
                repairResult.success 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded ${
                    repairResult.success ? 'bg-green-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {repairResult.success ? (
                      <RefreshCw className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      repairResult.success ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {repairResult.success ? 'Auto-Repair Successful!' : 'Auto-Repair Attempted'}
                    </p>
                    <p className="text-secondary-300 text-sm mt-1">
                      {repairResult.message}
                    </p>
                    {repairResult.preventionTip && (
                      <p className="text-secondary-400 text-xs mt-2">
                        💡 {repairResult.preventionTip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error description */}
            <div className="space-y-4 mb-6">
              <p className="text-secondary-300">
                Our AI diagnostics system has detected and logged this issue. 
                {repairResult?.success 
                  ? ' The issue appears to be resolved and the app should work normally now.'
                  : ' Please try one of the options below to continue.'
                }
              </p>

              {/* Error details - only in development or if user requests */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="bg-secondary-900 rounded-lg p-3 border border-secondary-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bug className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Development Details</span>
                  </div>
                  <code className="text-xs text-secondary-400 break-all block">
                    {error.message}
                  </code>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleRetry}
                  className="btn-primary flex items-center justify-center space-x-2 py-3"
                  disabled={isAttemptingRepair}
                >
                  <RefreshCw className={`w-4 h-4 ${isAttemptingRepair ? 'animate-spin' : ''}`} />
                  <span>{repairResult?.success ? 'Continue' : 'Try Again'}</span>
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="btn-secondary flex items-center justify-center space-x-2 py-3"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload App</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleReportIssue}
                  className="btn-outline flex items-center justify-center space-x-2 py-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Report Issue</span>
                </button>
                
                <button
                  onClick={this.exportDiagnostics}
                  className="btn-outline flex items-center justify-center space-x-2 py-2 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export Logs</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-secondary-700">
              <div className="text-xs text-secondary-500 text-center space-y-1">
                <p>Mixamo Model Viewer - AI Enhanced</p>
                <p>Smart diagnostics system active • Auto-repair enabled</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
