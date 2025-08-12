/**
 * Agent 5 - Comprehensive Error Analysis
 * Diagnose and coordinate all console errors, asset 404s, and preloaded resource warnings
 */

import { getGlobalMonitor } from './index';

interface ErrorAnalysis {
  timestamp: number;
  consoleErrors: ConsoleError[];
  networkErrors: NetworkError[];
  asset404s: Asset404[];
  preloadWarnings: PreloadWarning[];
  webglIssues: WebGLIssue[];
  performanceIssues: PerformanceIssue[];
  summary: ErrorSummary;
  recommendations: string[];
}

interface ConsoleError {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
  stack?: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  timestamp: number;
  type: 'fetch' | 'xhr' | 'resource';
}

interface Asset404 {
  url: string;
  type: 'font' | 'image' | 'script' | 'style' | 'model' | 'audio' | 'video';
  timestamp: number;
  context: string;
}

interface PreloadWarning {
  resource: string;
  warning: string;
  timestamp: number;
  impact: 'low' | 'medium' | 'high';
}

interface WebGLIssue {
  type: 'context_lost' | 'context_restored' | 'driver_warning' | 'performance';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceIssue {
  type: 'fps_drop' | 'memory_leak' | 'slow_loading' | 'timeout';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  asset404s: number;
  webglIssues: number;
  performanceIssues: number;
  healthScore: number;
  mostCommonCategory: string;
  errorRate: number;
}

class Agent5ErrorAnalyzer {
  private analysis: ErrorAnalysis;
  private originalConsole: {
    error: typeof console.error;
    warn: typeof console.warn;
    log: typeof console.log;
  };
  private originalFetch: typeof fetch;
  // Bound version of the original fetch to avoid "Illegal invocation" issues
  private originalFetchBound: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private isAnalyzing: boolean = false;

  constructor() {
    this.analysis = this.initializeAnalysis();
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log
    };
    // Store original fetch and a bound variant to preserve correct global context
    this.originalFetch = window.fetch;
    this.originalFetchBound = window.fetch.bind(window) as typeof fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  /**
   * Initialize error analysis structure
   */
  private initializeAnalysis(): ErrorAnalysis {
    return {
      timestamp: Date.now(),
      consoleErrors: [],
      networkErrors: [],
      asset404s: [],
      preloadWarnings: [],
      webglIssues: [],
      performanceIssues: [],
      summary: {
        totalErrors: 0,
        criticalErrors: 0,
        asset404s: 0,
        webglIssues: 0,
        performanceIssues: 0,
        healthScore: 100,
        mostCommonCategory: 'none',
        errorRate: 0
      },
      recommendations: []
    };
  }

  /**
   * Start comprehensive error analysis
   */
  startAnalysis(): void {
    if (this.isAnalyzing) return;
    
    console.log('🔍 Agent 5: Starting comprehensive error analysis...');
    this.isAnalyzing = true;
    
    // Setup error interceptors
    this.setupConsoleInterceptors();
    this.setupNetworkInterceptors();
    this.setupWebGLInterceptors();
    this.setupPerformanceMonitoring();
    
    // Analyze existing errors
    this.analyzeExistingErrors();
    
    // Generate initial recommendations
    this.generateRecommendations();
    
    console.log('✅ Agent 5: Error analysis started successfully');
  }

  /**
   * Setup console error interceptors
   */
  private setupConsoleInterceptors(): void {
    // Intercept console.error
    console.error = (...args) => {
      const message = args.join(' ');
      this.captureConsoleError('error', message, args);
      this.originalConsole.error(...args);
    };

    // Intercept console.warn
    console.warn = (...args) => {
      const message = args.join(' ');
      this.captureConsoleError('warning', message, args);
      this.originalConsole.warn(...args);
    };
  }

  /**
   * Setup network error interceptors
   */
  private setupNetworkInterceptors(): void {
    // Intercept fetch requests (safely)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Normalize URL for checks/logging
      let url: string = '';
      try {
        if (typeof input === 'string') {
          url = input;
        } else if (input instanceof Request) {
          url = input.url;
        } else if (input instanceof URL) {
          url = input.toString();
        } else {
          // Fallback best-effort stringification
          url = (input as any)?.toString?.() || '';
        }
      } catch {
        // If URL extraction fails, keep empty url for safety
        url = '';
      }

      // Skip interception for blob/data URLs to prevent context issues with uploaded assets
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        return this.originalFetchBound(input as any, init);
      }

      const startTime = Date.now();
      try {
        // Use the bound original fetch to avoid Illegal invocation errors
        const response = await this.originalFetchBound(input as any, init);
        this.checkNetworkResponse(url || 'unknown', response, startTime);
        return response;
      } catch (error) {
        this.captureNetworkError(url || 'unknown', 0, 'Network Error', 'fetch');
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      (this as any)._xhrUrl = url.toString();
      (this as any)._xhrMethod = method;
      return originalOpen.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function(data?: any) {
      const xhr = this;
      const startTime = Date.now();
      
      xhr.addEventListener('load', () => {
        agent5Analyzer.checkNetworkResponse((xhr as any)._xhrUrl, {
          status: xhr.status,
          statusText: xhr.statusText,
          ok: xhr.status >= 200 && xhr.status < 300
        }, startTime);
      });
      
      xhr.addEventListener('error', () => {
        agent5Analyzer.captureNetworkError((xhr as any)._xhrUrl, 0, 'XHR Error', 'xhr');
      });
      
      return originalSend.call(xhr, data);
    };
  }

  /**
   * Setup WebGL error interceptors
   */
  private setupWebGLInterceptors(): void {
    // Monitor WebGL context events
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', () => {
        this.captureWebGLIssue('context_lost', 'WebGL context lost', 'critical');
      });
      
      canvas.addEventListener('webglcontextrestored', () => {
        this.captureWebGLIssue('context_restored', 'WebGL context restored', 'low');
      });
    }

    // Monitor WebGL driver warnings through console interception
    // This will be captured by the console interceptor
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 30) {
          this.capturePerformanceIssue('fps_drop', 'FPS', fps, 30);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        
        if (usedMB > 200) {
          this.capturePerformanceIssue('memory_leak', 'Memory (MB)', usedMB, 200);
        }
      }, 5000);
    }
  }

  /**
   * Capture console error
   */
  private captureConsoleError(type: 'error' | 'warning' | 'info', message: string, args: any[]): void {
    const error: ConsoleError = {
      message,
      type,
      timestamp: Date.now(),
      category: this.categorizeError(message),
      severity: this.determineSeverity(message, type)
    };

    // Extract stack trace if available
    if (args.length > 0 && args[0] instanceof Error) {
      error.stack = args[0].stack;
    }

    this.analysis.consoleErrors.push(error);
    this.updateSummary();
  }

  /**
   * Capture network error
   */
  private captureNetworkError(url: string, status: number, statusText: string, type: 'fetch' | 'xhr' | 'resource'): void {
    const error: NetworkError = {
      url,
      status,
      statusText,
      timestamp: Date.now(),
      type
    };

    this.analysis.networkErrors.push(error);
    
    // Check if it's a 404 asset error
    if (status === 404) {
      this.captureAsset404(url);
    }
    
    this.updateSummary();
  }

  /**
   * Capture asset 404
   */
  private captureAsset404(url: string): void {
    const assetType = this.determineAssetType(url);
    const context = this.determineAssetContext(url);
    
    const asset404: Asset404 = {
      url,
      type: assetType,
      timestamp: Date.now(),
      context
    };

    this.analysis.asset404s.push(asset404);
    this.updateSummary();
  }

  /**
   * Capture WebGL issue
   */
  private captureWebGLIssue(type: 'context_lost' | 'context_restored' | 'driver_warning' | 'performance', message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const issue: WebGLIssue = {
      type,
      message,
      timestamp: Date.now(),
      severity
    };

    this.analysis.webglIssues.push(issue);
    this.updateSummary();
  }

  /**
   * Capture performance issue
   */
  private capturePerformanceIssue(type: 'fps_drop' | 'memory_leak' | 'slow_loading' | 'timeout', metric: string, value: number, threshold: number): void {
    const issue: PerformanceIssue = {
      type,
      metric,
      value,
      threshold,
      timestamp: Date.now()
    };

    this.analysis.performanceIssues.push(issue);
    this.updateSummary();
  }

  /**
   * Check network response for errors
   */
  private checkNetworkResponse(url: string, response: Response | { status: number; statusText: string; ok: boolean }, startTime: number): void {
    if (!response.ok) {
      this.captureNetworkError(url, response.status, response.statusText, 'fetch');
    }
    
    // Check for slow responses
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      this.capturePerformanceIssue('slow_loading', 'Load Time (ms)', duration, 5000);
    }
  }

  /**
   * Analyze existing errors from global monitor
   */
  private analyzeExistingErrors(): void {
    const monitor = getGlobalMonitor();
    if (monitor) {
      const detector = monitor.getDetector();
      const errors = detector.getErrors();
      
      errors.forEach(error => {
        this.captureConsoleError('error', error.message, []);
      });
    }
  }

  /**
   * Categorize error message
   */
  private categorizeError(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('webgl') || lowerMessage.includes('three.js') || lowerMessage.includes('canvas')) {
      return 'rendering';
    }
    if (lowerMessage.includes('fbx') || lowerMessage.includes('model') || lowerMessage.includes('gltf')) {
      return 'model';
    }
    if (lowerMessage.includes('audio') || lowerMessage.includes('microphone')) {
      return 'audio';
    }
    if (lowerMessage.includes('react') || lowerMessage.includes('component')) {
      return 'ui';
    }
    if (lowerMessage.includes('performance') || lowerMessage.includes('fps') || lowerMessage.includes('memory')) {
      return 'performance';
    }
    if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
      return 'network';
    }
    
    return 'system';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(message: string, type: 'error' | 'warning' | 'info'): 'low' | 'medium' | 'high' | 'critical' {
    const lowerMessage = message.toLowerCase();
    
    if (type === 'error') {
      if (lowerMessage.includes('crash') || lowerMessage.includes('fatal') || lowerMessage.includes('context lost')) {
        return 'critical';
      }
      if (lowerMessage.includes('failed') || lowerMessage.includes('exception')) {
        return 'high';
      }
      return 'medium';
    }
    
    if (type === 'warning') {
      if (lowerMessage.includes('deprecated') || lowerMessage.includes('performance')) {
        return 'medium';
      }
      return 'low';
    }
    
    return 'low';
  }

  /**
   * Determine asset type from URL
   */
  private determineAssetType(url: string): 'font' | 'image' | 'script' | 'style' | 'model' | 'audio' | 'video' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'image';
      case 'js':
        return 'script';
      case 'css':
        return 'style';
      case 'fbx':
      case 'gltf':
      case 'glb':
      case 'obj':
        return 'model';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'mp4':
      case 'webm':
        return 'video';
      default:
        return 'script';
    }
  }

  /**
   * Determine asset context
   */
  private determineAssetContext(url: string): string {
    if (url.includes('/models/')) return '3D Model Loading';
    if (url.includes('/fonts/')) return 'Font Loading';
    if (url.includes('/images/')) return 'Image Loading';
    if (url.includes('/scripts/')) return 'Script Loading';
    if (url.includes('/styles/')) return 'Style Loading';
    return 'Resource Loading';
  }

  /**
   * Update error summary
   */
  private updateSummary(): void {
    const summary = this.analysis.summary;
    
    summary.totalErrors = this.analysis.consoleErrors.length + this.analysis.networkErrors.length;
    summary.criticalErrors = this.analysis.consoleErrors.filter(e => e.severity === 'critical').length;
    summary.asset404s = this.analysis.asset404s.length;
    summary.webglIssues = this.analysis.webglIssues.length;
    summary.performanceIssues = this.analysis.performanceIssues.length;
    
    // Calculate health score
    summary.healthScore = Math.max(0, 100 - (summary.criticalErrors * 20) - (summary.totalErrors * 2));
    
    // Find most common category
    const categories = this.analysis.consoleErrors.map(e => e.category);
    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    summary.mostCommonCategory = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    
    // Calculate error rate (errors per minute)
    const timeSpan = (Date.now() - this.analysis.timestamp) / 1000 / 60; // minutes
    summary.errorRate = timeSpan > 0 ? summary.totalErrors / timeSpan : 0;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(): void {
    const recommendations: string[] = [];
    const summary = this.analysis.summary;
    
    if (summary.criticalErrors > 0) {
      recommendations.push('🚨 CRITICAL: Immediate attention required for critical errors');
    }
    
    if (summary.asset404s > 0) {
      recommendations.push('📁 ASSETS: Fix missing asset files and update paths');
    }
    
    if (summary.webglIssues > 0) {
      recommendations.push('🎮 WEBGL: Address WebGL context and driver issues');
    }
    
    if (summary.performanceIssues > 0) {
      recommendations.push('⚡ PERFORMANCE: Optimize performance bottlenecks');
    }
    
    if (summary.healthScore < 50) {
      recommendations.push('🏥 HEALTH: System health is poor, implement immediate fixes');
    }
    
    if (summary.errorRate > 10) {
      recommendations.push('📈 ERROR RATE: High error rate detected, investigate root causes');
    }
    
    this.analysis.recommendations = recommendations;
  }

  /**
   * Get current analysis results
   */
  getAnalysis(): ErrorAnalysis {
    return { ...this.analysis };
  }

  /**
   * Get error summary
   */
  getSummary(): ErrorSummary {
    return { ...this.analysis.summary };
  }

  /**
   * Export analysis report
   */
  exportReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: this.analysis,
      platform: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * Stop analysis and restore original functions
   */
  stopAnalysis(): void {
    if (!this.isAnalyzing) return;
    
    console.log('🛑 Agent 5: Stopping error analysis...');
    
    // Restore original console functions
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.log = this.originalConsole.log;
    
    // Restore original fetch
    window.fetch = this.originalFetch;
    
    // Restore original XMLHttpRequest
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    
    this.isAnalyzing = false;
    console.log('✅ Agent 5: Error analysis stopped');
  }
}

// Export singleton instance
export const agent5Analyzer = new Agent5ErrorAnalyzer();

// Export functions for external use
export function startAgent5ErrorAnalysis(): void {
  agent5Analyzer.startAnalysis();
}

export function getAgent5Analysis(): ErrorAnalysis {
  return agent5Analyzer.getAnalysis();
}

export function getAgent5Summary(): ErrorSummary {
  return agent5Analyzer.getSummary();
}

export function exportAgent5Report(): string {
  return agent5Analyzer.exportReport();
}

export function stopAgent5ErrorAnalysis(): void {
  agent5Analyzer.stopAnalysis();
}
