/**
 * Smart AI Error Detection System
 * Performance-optimized error detection with AI analysis
 * Agent 5 - Smart Diagnostics Team Integration
 */

export { SmartErrorDetector } from './SmartErrorDetector';
export { DiagnosticsDashboard, ErrorStatusIndicator } from './DiagnosticsDashboard';
export { useSmartDiagnostics, useErrorMonitor, usePerformanceMonitor } from './useSmartDiagnostics';
export { GlobalMonitor, initializeGlobalMonitoring, getGlobalMonitor } from './GlobalMonitor';

// Agent 5 - Smart Diagnostics Team Exports
export { 
  startAgent5ErrorAnalysis, 
  getAgent5Analysis, 
  getAgent5Summary, 
  exportAgent5Report,
  stopAgent5ErrorAnalysis 
} from './agent5_error_analysis';

export { 
  startAgent5LiveMonitoring, 
  getAgent5MonitoringData, 
  stopAgent5LiveMonitoring,
  markAgent5IssueResolved 
} from './agent5_live_monitoring';

export { 
  runAgent5ValidationTest, 
  runAgent5SystemTest, 
  getAgent5TestResults,
  generateAgent5TestReport 
} from './agent5_validation_test';

export type {
  SmartError,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  AIAnalysis,
  SmartDiagnosticsConfig,
  ErrorCallback
} from './types';

import { SmartErrorDetector } from './SmartErrorDetector';
import { SmartDiagnosticsConfig } from './types';

/**
 * Create and initialize Smart Error Detection system
 * Optimized for minimal performance impact
 */
export function createSmartDiagnostics(config?: Partial<SmartDiagnosticsConfig>): SmartErrorDetector {
  return new SmartErrorDetector(config);
}

/**
 * Performance-optimized React hook for error monitoring
 */
export function useSmartErrorDetection(config?: Partial<SmartDiagnosticsConfig>) {
  // This would be implemented as a React hook in a real scenario
  // For now, returning the basic functionality
  const detector = new SmartErrorDetector(config);
  
  return {
    detector,
    errors: detector.getErrors(),
    summary: detector.getSummary(),
    performance: detector.getPerformanceMetrics(),
    updateFeatures: (features: string[]) => detector.updateFeatures(features),
    onError: (callback: any) => detector.onError(callback),
    clear: () => detector.clear()
  };
}

/**
 * Utility functions for error analysis
 */
export const ErrorUtils = {
  /**
   * Check if error is critical
   */
  isCritical(error: any): boolean {
    return error.severity === 'critical' || 
           error.category === 'rendering' && error.severity === 'high';
  },

  /**
   * Format error for display
   */
  formatError(error: any): string {
    return `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;
  },

  /**
   * Get error color for UI
   */
  getErrorColor(severity: string): string {
    const colors = {
      low: '#10b981',     // green
      medium: '#f59e0b',  // amber
      high: '#ef4444',    // red
      critical: '#dc2626' // dark red
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  },

  /**
   * Calculate error rate (errors per minute)
   */
  calculateErrorRate(errors: any[]): number {
    if (errors.length === 0) return 0;
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentErrors = errors.filter(error => error.timestamp > oneMinuteAgo);
    
    return recentErrors.length;
  },

  /**
   * Get most common error category
   */
  getMostCommonCategory(errors: any[]): string {
    const categories: Record<string, number> = {};
    
    errors.forEach(error => {
      categories[error.category] = (categories[error.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
  }
};

// Global instance for easy access (optional)
let globalDetector: SmartErrorDetector | null = null;

/**
 * Initialize global error detection
 */
export function initializeGlobalErrorDetection(config?: Partial<SmartDiagnosticsConfig>): SmartErrorDetector {
  if (globalDetector) {
    globalDetector.dispose();
  }
  
  globalDetector = new SmartErrorDetector({
    performanceMode: true, // Enable performance mode by default
    samplingRate: 0.2,     // Process only 20% of errors
    maxErrors: 30,         // Keep memory usage minimal
    ...config
  });
  
  return globalDetector;
}

/**
 * Get global error detector instance
 */
export function getGlobalErrorDetector(): SmartErrorDetector | null {
  return globalDetector;
}
