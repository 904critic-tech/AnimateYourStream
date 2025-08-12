/**
 * React Hook for Smart Diagnostics Integration
 * Performance-optimized React integration for error monitoring
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SmartErrorDetector } from './SmartErrorDetector';
import { SmartError, SmartDiagnosticsConfig } from './types';

interface DiagnosticsState {
  errors: SmartError[];
  errorCount: number;
  criticalCount: number;
  summary: Record<string, any>;
  performance: Record<string, number>;
  isActive: boolean;
}

interface UseSmartDiagnosticsOptions extends Partial<SmartDiagnosticsConfig> {
  autoStart?: boolean;
  updateInterval?: number;
  maxDisplayErrors?: number;
}

export function useSmartDiagnostics(options: UseSmartDiagnosticsOptions = {}) {
  const {
    autoStart = true,
    updateInterval = 2000, // Update every 2 seconds for performance
    maxDisplayErrors = 10,
    ...diagnosticsConfig
  } = options;

  // State management
  const [state, setState] = useState<DiagnosticsState>({
    errors: [],
    errorCount: 0,
    criticalCount: 0,
    summary: {},
    performance: {},
    isActive: false
  });

  // Refs for stable references
  const detectorRef = useRef<SmartErrorDetector | null>(null);
  const updateTimerRef = useRef<number | null>(null);

  // Initialize detector
  const initializeDetector = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.dispose();
    }

    detectorRef.current = new SmartErrorDetector({
      performanceMode: true,
      samplingRate: 0.25, // Light sampling for React integration
      maxErrors: 25,      // Keep memory usage low
      ...diagnosticsConfig
    });

    // Set up error listener
    detectorRef.current.onError((error) => {
      // Update state immediately for critical errors
      if (error.severity === 'critical') {
        setState(prev => ({
          ...prev,
          criticalCount: prev.criticalCount + 1
        }));
      }
    });

    setState(prev => ({ ...prev, isActive: true }));
  }, [diagnosticsConfig]);

  // Update state from detector
  const updateState = useCallback(() => {
    if (!detectorRef.current) return;

    const errors = detectorRef.current.getErrors();
    const summary = detectorRef.current.getSummary();
    const performance = detectorRef.current.getPerformanceMetrics();

    setState(prev => ({
      ...prev,
      errors: errors.slice(-maxDisplayErrors), // Show only recent errors
      errorCount: errors.length,
      criticalCount: errors.filter(e => e.severity === 'critical').length,
      summary,
      performance
    }));
  }, [maxDisplayErrors]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!detectorRef.current) {
      initializeDetector();
    }

    // Update state periodically for performance
    updateTimerRef.current = window.setInterval(updateState, updateInterval);
    updateState(); // Initial update
  }, [initializeDetector, updateState, updateInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  // Update application features
  const updateFeatures = useCallback((features: string[]) => {
    detectorRef.current?.updateFeatures(features);
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    detectorRef.current?.clear();
    updateState();
  }, [updateState]);

  // Report manual error
  const reportError = useCallback((category: any, message: string, context?: any) => {
    // This would need proper typing in a real implementation
    console.error(`[${category}] ${message}`, context);
  }, []);

  // Get detector instance
  const getDetector = useCallback(() => {
    return detectorRef.current;
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
      detectorRef.current?.dispose();
    };
  }, [autoStart]); // Only run on mount

  return {
    // State
    ...state,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    updateFeatures,
    clearErrors,
    reportError,
    
    // Advanced
    getDetector,
    updateState
  };
}

/**
 * Simplified hook for basic error monitoring
 */
export function useErrorMonitor() {
  const [errorCount, setErrorCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [lastError, setLastError] = useState<SmartError | null>(null);

  const detectorRef = useRef<SmartErrorDetector | null>(null);

  useEffect(() => {
    detectorRef.current = new SmartErrorDetector({
      performanceMode: true,
      samplingRate: 0.1, // Very light sampling
      maxErrors: 10
    });

    detectorRef.current.onError((error) => {
      setErrorCount(prev => prev + 1);
      setLastError(error);
      
      if (error.severity === 'critical') {
        setCriticalCount(prev => prev + 1);
      }
    });

    return () => {
      detectorRef.current?.dispose();
    };
  }, []);

  return {
    errorCount,
    criticalCount,
    lastError,
    hasErrors: errorCount > 0,
    hasCriticalErrors: criticalCount > 0
  };
}

/**
 * Hook for performance monitoring only
 */
export function usePerformanceMonitor() {
  const [performance, setPerformance] = useState({
    fps: 60,
    memoryMB: 0,
    errorsPerMinute: 0
  });

  const detectorRef = useRef<SmartErrorDetector | null>(null);

  useEffect(() => {
    detectorRef.current = new SmartErrorDetector({
      performanceMode: true,
      samplingRate: 0.05, // Minimal sampling for performance only
      maxErrors: 5
    });

    const updatePerformance = () => {
      if (detectorRef.current) {
        const metrics = detectorRef.current.getPerformanceMetrics();
        setPerformance({
          fps: metrics.fps,
          memoryMB: metrics.memoryMB,
          errorsPerMinute: metrics.errorsProcessed
        });
      }
    };

    const interval = setInterval(updatePerformance, 3000); // Update every 3 seconds

    return () => {
      clearInterval(interval);
      detectorRef.current?.dispose();
    };
  }, []);

  return performance;
}
