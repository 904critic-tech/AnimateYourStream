/**
 * Global Application Monitor
 * Integrates Smart Diagnostics with the entire application
 */

import { SmartErrorDetector } from './SmartErrorDetector';
import { useAppStore } from '../utils/store';
import { ErrorCategory } from './types';
import { initializeHealthCheck, getHealthCheck, HealthStatus } from '../utils/healthCheck';

export class GlobalMonitor {
  private detector: SmartErrorDetector;
  private monitoringInterval?: number;
  private isMonitoring: boolean = false;
  
  // Feature tracking
  private activeFeatures: Set<string> = new Set();
  private componentErrorCounts: Map<string, number> = new Map();
  
  // Performance tracking
  private fpsHistory: number[] = [];
  private memoryHistory: number[] = [];

  constructor() {
    this.detector = new SmartErrorDetector({
      enabled: true,
      aiAnalysis: true,
      samplingRate: 0.4, // Process 40% of errors
      maxErrors: 100,
      performanceMode: false
    });

    this.setupIntegrations();
    this.initializeHealthMonitoring();
  }

  /**
   * Initialize health monitoring system
   */
  private initializeHealthMonitoring(): void {
    // Initialize health check system
    initializeHealthCheck({
      interval: 30000, // 30 seconds
      timeout: 5000,
      retries: 3,
      degradedThreshold: 70,
      unhealthyThreshold: 30
    });

    // Listen for health status changes
    const healthCheck = getHealthCheck();
    if (healthCheck) {
      healthCheck.addListener((status: HealthStatus) => {
        this.handleHealthStatusChange(status);
      });
    }
  }

  /**
   * Handle health status changes
   */
  private handleHealthStatusChange(status: HealthStatus): void {
    // Log health status changes
    if (status.status !== 'healthy') {
      this.logError({
        category: 'system',
        message: `System health status: ${status.status} (score: ${status.overallScore})`,
        component: 'HealthMonitor',
        severity: status.status === 'unhealthy' ? 'critical' : 'medium',
        context: {
          component: 'Health Monitor',
          healthScore: status.overallScore,
          services: Object.keys(status.services),
          timestamp: status.timestamp
        }
      });
    }

    // Trigger degraded mode if needed
    if (status.status === 'unhealthy') {
      this.activateDegradedMode(status);
    }
  }

  /**
   * Activate degraded mode for critical issues
   */
  private activateDegradedMode(status: HealthStatus): void {
    console.warn('🚨 Activating degraded mode due to critical health issues', {
      status: status.status,
      score: status.overallScore,
      services: Object.keys(status.services)
    });
    
    // Notify store about degraded mode
    const store = useAppStore.getState();
    if (store.addError) {
      store.addError({
        type: 'warning',
        component: 'HealthMonitor',
        message: 'System running in degraded mode due to health issues'
      });
    }

    // Could implement additional degraded mode logic here
    // such as reducing quality settings, disabling non-critical features, etc.
  }

  /**
   * Setup integrations with application systems
   */
  private setupIntegrations(): void {
    // Integrate with Zustand store
    this.setupStoreIntegration();
    
    // Setup React error boundary integration
    this.setupReactIntegration();
    
    // Setup WebGL/Three.js error monitoring
    this.setupWebGLIntegration();
    
    // Setup audio system monitoring
    this.setupAudioIntegration();
    
    // Setup model loading monitoring
    this.setupModelIntegration();
  }

  /**
   * Setup Zustand store error monitoring
   */
  private setupStoreIntegration(): void {
    // Monitor store errors
    const store = useAppStore.getState();
    
    // Override addError to capture store-level errors
    const originalAddError = store.addError;
    store.addError = (error) => {
      // Log to our smart diagnostics
      this.logError({
        category: 'system' as ErrorCategory,
        message: error.message,
        component: error.component,
        severity: error.type === 'error' ? 'high' : 'medium',
        context: {
          component: error.component,
          stack: error.stack
        }
      });
      
      // Call original function
      return originalAddError(error);
    };
  }

  /**
   * Setup React error boundary integration
   */
  private setupReactIntegration(): void {
          // React DevTools integration (if available)
      if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        
        // Monitor component errors
        hook.onCommitFiberRoot = () => {
          try {
            // Track active components
            this.trackActiveFeature('react-render');
          } catch (error) {
            // Silent fail
          }
        };
      }

    // Override React error methods (if available)
    if (typeof window !== 'undefined') {
      (window as any).__SMART_DIAGNOSTICS_REACT_ERROR__ = (error: Error, errorInfo: any) => {
        this.logError({
          category: 'ui',
          message: error.message,
          component: errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown',
          severity: 'high',
          context: {
            component: errorInfo?.componentStack,
            stack: error.stack
          }
        });
      };
    }
  }

  /**
   * Setup WebGL/Three.js error monitoring
   */
  private setupWebGLIntegration(): void {
    // Monitor WebGL context loss
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', () => {
        this.logError({
          category: 'rendering',
          message: 'WebGL context lost',
          component: 'WebGL',
          severity: 'critical',
          context: {
            component: 'WebGL Context',
            userAction: 'rendering'
          }
        });
      });

      canvas.addEventListener('webglcontextrestored', () => {
        this.logError({
          category: 'rendering',
          message: 'WebGL context restored',
          component: 'WebGL',
          severity: 'medium',
          context: {
            component: 'WebGL Context',
            userAction: 'recovery'
          }
        });
      });
    }

    // Monitor Three.js errors (if Three.js is available)
    if (typeof window !== 'undefined' && (window as any).THREE) {
      
      // Override console warnings for Three.js
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('THREE.')) {
          this.logError({
            category: 'rendering',
            message,
            component: 'Three.js',
            severity: 'low',
            context: {
              component: 'Three.js',
              userAction: 'rendering'
            }
          });
        }
        originalWarn.apply(console, args);
      };
    }
  }

  /**
   * Setup audio system error monitoring
   */
  private setupAudioIntegration(): void {
    // Monitor Web Audio API errors
    if (typeof window !== 'undefined' && window.AudioContext) {
      const originalCreateAudioContext = window.AudioContext;
      
      (window as any).AudioContext = function(...args: any[]) {
        const context = new originalCreateAudioContext(...args);
        
        // Monitor state changes
        context.addEventListener('statechange', () => {
          if (context.state === 'suspended') {
            (window as any).__GLOBAL_MONITOR__?.logError({
              category: 'audio',
              message: 'Audio context suspended',
              component: 'AudioContext',
              severity: 'medium',
              context: {
                component: 'Audio System',
                userAction: 'audio processing'
              }
            });
          }
        });
        
        return context;
      };
    }

    // Monitor getUserMedia errors
    if (navigator.mediaDevices) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        try {
          this.trackActiveFeature('microphone-access');
          return await originalGetUserMedia(constraints);
        } catch (error) {
          this.logError({
            category: 'audio',
            message: `Microphone access failed: ${(error as Error).message}`,
            component: 'MediaDevices',
            severity: 'high',
            context: {
              component: 'Audio Input',
              userAction: 'microphone access'
            }
          });
          throw error;
        }
      };
    }
  }

  /**
   * Setup model loading error monitoring
   */
  private setupModelIntegration(): void {
    // Monitor fetch requests for model files
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || '';
      
      try {
        const response = await originalFetch(...args);
        
        // Check for model file requests
        if (url.includes('.gltf') || url.includes('.glb') || url.includes('.fbx') || url.includes('.obj')) {
          this.trackActiveFeature('model-loading');
          
          if (!response.ok) {
            this.logError({
              category: 'model',
              message: `Failed to load model: ${url} (${response.status})`,
              component: 'ModelLoader',
              severity: 'high',
              context: {
                component: 'Model Loading',
                userAction: 'model fetch',
                url: url
              }
            });
          }
        }
        
        return response;
      } catch (error) {
        if (url.includes('.gltf') || url.includes('.glb') || url.includes('.fbx') || url.includes('.obj')) {
          this.logError({
            category: 'model',
            message: `Network error loading model: ${(error as Error).message}`,
            component: 'ModelLoader',
            severity: 'high',
            context: {
              component: 'Model Loading',
              userAction: 'model fetch',
              url: url
            }
          });
        }
        throw error;
      }
    };
  }

  /**
   * Start global monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.detector.updateFeatures(Array.from(this.activeFeatures));
    
    // Start enhanced monitoring
    this.monitoringInterval = window.setInterval(() => {
      this.performHealthCheck();
      this.updatePerformanceMetrics();
      this.checkPerformanceAnomalies();
    }, 3000); // Every 3 seconds

    // Set up global reference
    (window as any).__GLOBAL_MONITOR__ = this;
    
    console.log('🔍 Global Smart Diagnostics monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    delete (window as any).__GLOBAL_MONITOR__;
    
    console.log('🔍 Global Smart Diagnostics monitoring stopped');
  }

  /**
   * Log error through the smart detector
   */
  logError(errorData: {
    category: ErrorCategory;
    message: string;
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: any;
  }): void {
    // Track component error counts
    const count = this.componentErrorCounts.get(errorData.component) || 0;
    this.componentErrorCounts.set(errorData.component, count + 1);
    
    // Create smart error (the detector will handle the rest)
    console.error(`[${errorData.severity.toUpperCase()}] ${errorData.category}/${errorData.component}: ${errorData.message}`);
  }

  /**
   * Track active features
   */
  trackActiveFeature(feature: string): void {
    this.activeFeatures.add(feature);
    this.detector.updateFeatures(Array.from(this.activeFeatures));
    
    // Remove feature after 30 seconds of inactivity
    setTimeout(() => {
      this.activeFeatures.delete(feature);
      this.detector.updateFeatures(Array.from(this.activeFeatures));
    }, 30000);
  }

  /**
   * Perform system health check
   */
  private performHealthCheck(): void {
    const summary = this.detector.getSummary();
    
    // Check for critical issues
    if (summary.bySeverity?.critical > 0) {
      console.warn('🚨 Critical errors detected in diagnostics');
    }
    
    // Check for high error rate
    const errorRate = (summary.total || 0) / (Date.now() / 60000); // errors per minute
    if (errorRate > 5) {
      this.logError({
        category: 'system',
        message: `High error rate detected: ${errorRate.toFixed(1)} errors/minute`,
        component: 'HealthMonitor',
        severity: 'medium',
        context: {
          component: 'Health Monitor',
          errorRate: errorRate
        }
      });
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const metrics = this.detector.getPerformanceMetrics();
    
    // Track FPS history
    this.fpsHistory.push(metrics.fps);
    if (this.fpsHistory.length > 20) {
      this.fpsHistory = this.fpsHistory.slice(-20);
    }
    
    // Track memory history
    this.memoryHistory.push(metrics.memoryMB);
    if (this.memoryHistory.length > 20) {
      this.memoryHistory = this.memoryHistory.slice(-20);
    }
  }

  /**
   * Check for performance anomalies
   */
  private checkPerformanceAnomalies(): void {
    // Check FPS drops
    if (this.fpsHistory.length >= 5) {
      const recentFps = this.fpsHistory.slice(-5);
      const avgFps = recentFps.reduce((a, b) => a + b, 0) / recentFps.length;
      
      if (avgFps < 30) {
        this.logError({
          category: 'performance',
          message: `Low FPS detected: ${avgFps.toFixed(1)}`,
          component: 'PerformanceMonitor',
          severity: 'medium',
          context: {
            component: 'Performance Monitor',
            averageFps: avgFps,
            fpsHistory: recentFps
          }
        });
      }
    }
    
    // Check memory growth
    if (this.memoryHistory.length >= 10) {
      const recentMemory = this.memoryHistory.slice(-10);
      const memoryGrowth = recentMemory[recentMemory.length - 1] - recentMemory[0];
      
      if (memoryGrowth > 50) { // 50MB growth
        this.logError({
          category: 'performance',
          message: `Potential memory leak: +${memoryGrowth}MB in last 30 seconds`,
          component: 'PerformanceMonitor',
          severity: 'high',
          context: {
            component: 'Performance Monitor',
            memoryGrowth: memoryGrowth,
            memoryHistory: recentMemory
          }
        });
      }
    }
  }

  /**
   * Get the smart error detector
   */
  getDetector(): SmartErrorDetector {
    return this.detector;
  }

  /**
   * Get monitoring statistics
   */
  getStats(): any {
    const healthCheck = getHealthCheck();
    const healthStatus = healthCheck?.getHealthStatus();

    return {
      isMonitoring: this.isMonitoring,
      activeFeatures: Array.from(this.activeFeatures),
      componentErrors: Object.fromEntries(this.componentErrorCounts),
      performance: this.detector.getPerformanceMetrics(),
      summary: this.detector.getSummary(),
      fpsHistory: this.fpsHistory.slice(-10),
      memoryHistory: this.memoryHistory.slice(-10),
      health: healthStatus ? {
        status: healthStatus.status,
        overallScore: healthStatus.overallScore,
        uptime: healthStatus.uptime,
        criticalServices: Object.values(healthStatus.services).filter(s => s.critical && s.status !== 'healthy').length
      } : null
    };
  }

  /**
   * Export diagnostic data
   */
  exportDiagnostics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      stats: this.getStats(),
      errors: this.detector.getErrors(),
      config: 'Smart Diagnostics v1.0'
    }, null, 2);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopMonitoring();
    this.detector.dispose();
    this.activeFeatures.clear();
    this.componentErrorCounts.clear();
  }
}

// Create global instance
let globalMonitor: GlobalMonitor | null = null;

/**
 * Initialize global monitoring
 */
export function initializeGlobalMonitoring(): GlobalMonitor {
  if (globalMonitor) {
    globalMonitor.dispose();
  }
  
  globalMonitor = new GlobalMonitor();
  globalMonitor.startMonitoring();
  
  return globalMonitor;
}

/**
 * Get global monitor instance
 */
export function getGlobalMonitor(): GlobalMonitor | null {
  return globalMonitor;
}

export default GlobalMonitor;
