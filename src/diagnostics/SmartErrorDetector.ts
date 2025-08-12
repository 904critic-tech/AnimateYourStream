/**
 * Smart AI Error Detector
 * High-performance, low-overhead error detection with AI analysis
 */

import { SmartError, ErrorCategory, ErrorSeverity, ErrorContext, SmartDiagnosticsConfig, ErrorCallback } from './types';
import { AutoRepairSystem } from './AutoRepairSystem';

export class SmartErrorDetector {
  private config: SmartDiagnosticsConfig;
  private errors: SmartError[] = [];
  private callbacks: Set<ErrorCallback> = new Set();
  private errorCount = 0;
  private lastProcessTime = 0;
  private isProcessing = false;
  
  // Performance optimization: throttle error processing
  private processingQueue: SmartError[] = [];
  private processingTimer?: number;
  
  // AI pattern cache for fast lookup
  private patternCache = new Map<string, string>();
  
  // Auto-repair system with machine learning
  private autoRepair: AutoRepairSystem;
  
  // Lightweight system monitoring
  private memoryUsage = 0;
  private fps = 60;
  private activeFeatures: string[] = [];

  constructor(config: Partial<SmartDiagnosticsConfig> = {}) {
    this.config = {
      enabled: true,
      aiAnalysis: true,
      samplingRate: 0.3, // Process 30% of errors to maintain performance
      maxErrors: 50, // Keep memory usage low
      performanceMode: false,
      ...config
    };

    // Initialize auto-repair system
    this.autoRepair = new AutoRepairSystem();

    if (this.config.enabled) {
      this.initializeErrorHandling();
      this.startLightweightMonitoring();
    }
  }

  /**
   * Initialize minimal error handling
   */
  private initializeErrorHandling(): void {
    // Global error handler with performance optimization
    window.addEventListener('error', (event) => {
      // Sample errors to reduce processing load
      if (Math.random() > this.config.samplingRate) return;
      
      this.queueError({
        error: event.error,
        message: event.message,
        filename: event.filename,
        line: event.lineno
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      if (Math.random() > this.config.samplingRate) return;
      
      this.queueError({
        error: event.reason,
        message: event.reason?.message || 'Promise rejection'
      });
    });

    // Override console.error with minimal overhead
    const originalError = console.error;
    console.error = (...args) => {
      if (this.config.enabled && Math.random() <= this.config.samplingRate) {
        const message = args.map(arg => String(arg)).join(' ');
        this.queueError({ error: null, message });
      }
      originalError.apply(console, args);
    };
  }

  /**
   * Queue error for processing (performance optimized)
   */
  private queueError(errorData: any): void {
    const error = this.createSmartError(errorData);
    this.processingQueue.push(error);

    // Batch process errors to minimize performance impact
    if (!this.processingTimer) {
      this.processingTimer = window.setTimeout(() => {
        this.processErrorQueue();
        this.processingTimer = undefined;
      }, 100); // Process every 100ms
    }
  }

  /**
   * Process error queue in batches
   */
  private processErrorQueue(): void {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    const startTime = performance.now();
    
    // Process up to 5 errors per batch to maintain 60fps
    const batchSize = this.config.performanceMode ? 1 : 5;
    const errorsToProcess = this.processingQueue.splice(0, batchSize);
    
    errorsToProcess.forEach(async (error) => {
      if (this.config.aiAnalysis) {
        error.aiAnalysis = this.performFastAIAnalysis(error);
      }
      
      // Attempt auto-repair for critical and high severity errors
      if (error.severity === 'critical' || error.severity === 'high') {
        try {
          const repairResult = await this.autoRepair.attemptRepair(error);
          if (repairResult) {
            // Add repair information to error context
            error.context.customData = {
              ...error.context.customData,
              autoRepair: repairResult
            };
          }
        } catch (repairError) {
          console.warn('Auto-repair failed for error:', error.id, repairError);
        }
      }
      
      this.addError(error);
      this.notifyCallbacks(error);
    });

    this.lastProcessTime = performance.now() - startTime;
    this.isProcessing = false;

    // Continue processing if queue has more items
    if (this.processingQueue.length > 0 && this.lastProcessTime < 5) {
      this.processingTimer = window.setTimeout(() => {
        this.processErrorQueue();
        this.processingTimer = undefined;
      }, 16); // ~60fps
    }
  }

  /**
   * Create smart error with minimal overhead
   */
  private createSmartError(errorData: any): SmartError {
    const { error, message } = errorData;
    
    return {
      id: `${Date.now()}_${this.errorCount++}`,
      timestamp: Date.now(),
      category: this.fastCategorizeError(message),
      severity: this.fastDetermineSeverity(message, error),
      message,
      stack: error?.stack,
      context: this.captureMinimalContext()
    };
  }

  /**
   * Fast error categorization using keyword matching
   */
  private fastCategorizeError(message: string): ErrorCategory {
    const msg = message.toLowerCase();
    
    // Use simple string matching for performance
    if (msg.includes('audio') || msg.includes('microphone')) return 'audio';
    if (msg.includes('webgl') || msg.includes('render') || msg.includes('canvas')) return 'rendering';
    if (msg.includes('model') || msg.includes('gltf') || msg.includes('fbx')) return 'model';
    if (msg.includes('animation') || msg.includes('timeline')) return 'animation';
    if (msg.includes('react') || msg.includes('component')) return 'ui';
    if (msg.includes('performance') || msg.includes('memory')) return 'performance';
    
    return 'system';
  }

  /**
   * Fast severity determination
   */
  private fastDetermineSeverity(message: string, error: any): ErrorSeverity {
    const msg = message.toLowerCase();
    
    if (msg.includes('critical') || msg.includes('fatal')) return 'critical';
    if (msg.includes('memory') || msg.includes('webgl')) return 'high';
    if (error && error.name === 'TypeError') return 'medium';
    if (msg.includes('warning') || msg.includes('deprecated')) return 'low';
    
    return 'medium';
  }

  /**
   * Capture minimal context for performance
   */
  private captureMinimalContext(): ErrorContext {
    return {
      systemState: {
        memoryUsage: this.memoryUsage,
        fps: this.fps,
        features: [...this.activeFeatures]
      }
    };
  }

  /**
   * Fast AI analysis using cached patterns
   */
  private performFastAIAnalysis(error: SmartError): any {
    const cacheKey = `${error.category}_${error.severity}`;
    
    // Check pattern cache first
    if (this.patternCache.has(cacheKey)) {
      const cachedPattern = this.patternCache.get(cacheKey)!;
      return {
        confidence: 0.8,
        predictedCause: cachedPattern,
        suggestion: this.getFastSuggestion(error.category),
        pattern: cachedPattern,
        similar: this.countSimilarErrors(error.category)
      };
    }

    // Generate new analysis (fast version)
    const analysis = this.generateFastAnalysis(error);
    
    // Cache for future use
    this.patternCache.set(cacheKey, analysis.predictedCause);
    
    return analysis;
  }

  /**
   * Generate fast AI analysis
   */
  private generateFastAnalysis(error: SmartError): any {
    const patterns: Record<ErrorCategory, string> = {
      audio: 'Microphone permission or audio device issue',
      rendering: 'WebGL context or GPU compatibility issue',
      model: 'Model file format or loading issue',
      animation: 'Animation timeline or keyframe issue',
      ui: 'React component state or prop issue',
      performance: 'Memory usage or performance bottleneck',
      system: 'Browser compatibility or system issue'
    };

    const suggestions: Record<ErrorCategory, string> = {
      audio: 'Check microphone permissions and audio device',
      rendering: 'Verify WebGL support and reduce quality',
      model: 'Validate model format and check file size',
      animation: 'Review animation parameters and complexity',
      ui: 'Check component props and state management',
      performance: 'Monitor memory usage and optimize assets',
      system: 'Check browser compatibility and update'
    };

    return {
      confidence: 0.7,
      predictedCause: patterns[error.category],
      suggestion: suggestions[error.category],
      pattern: `${error.category}_${error.severity}`,
      similar: this.countSimilarErrors(error.category)
    };
  }

  /**
   * Fast suggestion lookup
   */
  private getFastSuggestion(category: ErrorCategory): string {
    const suggestions: Record<ErrorCategory, string> = {
      audio: 'Check permissions and device',
      rendering: 'Reduce quality settings',
      model: 'Validate model file',
      animation: 'Review animation settings',
      ui: 'Check component state',
      performance: 'Monitor memory usage',
      system: 'Update browser'
    };
    
    return suggestions[category];
  }

  /**
   * Count similar errors efficiently
   */
  private countSimilarErrors(category: ErrorCategory): number {
    return this.errors.filter(e => e.category === category).length;
  }

  /**
   * Add error to collection with memory management
   */
  private addError(error: SmartError): void {
    this.errors.push(error);
    
    // Keep memory usage low
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }
  }

  /**
   * Notify callbacks with error handling
   */
  private notifyCallbacks(error: SmartError): void {
    this.callbacks.forEach(callback => {
      try {
        callback(error);
      } catch (e) {
        // Avoid infinite loops from callback errors
      }
    });
  }

  /**
   * Start ultra-lightweight monitoring - Minimal overhead
   */
  private startLightweightMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    // Ultra-minimal FPS tracking - Very low frequency to avoid performance impact
    const trackFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      // Check FPS every 20 seconds to minimize overhead (increased from 10 seconds)
      if (currentTime - lastTime >= 20000) {
        this.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.config.enabled) {
        requestAnimationFrame(trackFPS);
      }
    };
    
    requestAnimationFrame(trackFPS);

    // Memory monitoring (ultra-minimal overhead) - Increased interval for better performance
    if ('memory' in performance) {
      setInterval(() => {
        if (this.config.enabled) {
          this.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
      }, 30000); // Check every 30 seconds for ultra-minimal performance impact (increased from 15 seconds)
    }
  }

  /**
   * Update active features
   */
  updateFeatures(features: string[]): void {
    this.activeFeatures = features;
  }

  /**
   * Add error callback
   */
  onError(callback: ErrorCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove error callback
   */
  offError(callback: ErrorCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Get recent errors
   */
  getErrors(): SmartError[] {
    return [...this.errors];
  }

  /**
   * Get error summary
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {
      total: this.errors.length,
      byCategory: {},
      bySeverity: {},
      recent: this.errors.slice(-5),
      performance: {
        fps: this.fps,
        memory: Math.round(this.memoryUsage / 1024 / 1024), // MB
        processing: this.lastProcessTime
      }
    };

    this.errors.forEach(error => {
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear errors and cache
   */
  clear(): void {
    this.errors = [];
    this.patternCache.clear();
    this.processingQueue = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SmartDiagnosticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, number> {
    return {
      fps: this.fps,
      memoryMB: Math.round(this.memoryUsage / 1024 / 1024),
      errorsProcessed: this.errorCount,
      processingTime: this.lastProcessTime,
      queueSize: this.processingQueue.length,
      cacheSize: this.patternCache.size
    };
  }

  /**
   * Manual error reporting
   */
  reportManualError(category: ErrorCategory, message: string, context?: any): void {
    const error = this.createSmartError({
      error: new Error(message),
      message,
      category,
      type: 'exception'
    });
    
    if (context) {
      error.context.customData = { ...error.context.customData, ...context };
    }
    
    this.queueError({ error: new Error(message), message });
  }

  /**
   * Get auto-repair system
   */
  getAutoRepairSystem(): AutoRepairSystem {
    return this.autoRepair;
  }

  /**
   * Get auto-repair statistics
   */
  getAutoRepairStats(): Record<string, any> {
    return this.autoRepair.getRepairStatistics();
  }

  /**
   * Enable/disable auto-repair
   */
  setAutoRepairEnabled(enabled: boolean): void {
    this.autoRepair.setEnabled(enabled);
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.config.enabled = false;
    this.callbacks.clear();
    this.clear();
    
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }
  }
}
