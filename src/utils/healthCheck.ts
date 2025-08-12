/**
 * Application Health Check System
 * Monitors critical services and provides health status endpoints
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: Record<string, ServiceHealth>;
  overallScore: number;
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: number;
  errorCount: number;
  details?: string;
  critical: boolean;
}

export interface HealthCheckConfig {
  interval: number; // ms
  timeout: number; // ms
  retries: number;
  degradedThreshold: number; // 0-100
  unhealthyThreshold: number; // 0-100
}

class HealthCheckService {
  private config: HealthCheckConfig;
  private services: Map<string, ServiceHealth> = new Map();
  private intervalId?: number;
  private startTime: number = Date.now();
  private isRunning: boolean = false;
  private listeners: Array<(status: HealthStatus) => void> = [];

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      degradedThreshold: 70,
      unhealthyThreshold: 30,
      ...config
    };

    this.initializeServices();
  }

  /**
   * Initialize health checks for critical services
   */
  private initializeServices(): void {
    const services: Omit<ServiceHealth, 'lastCheck' | 'errorCount' | 'status' | 'responseTime'>[] = [
      {
        name: 'WebGL Rendering',
        critical: true,
        details: 'WebGL context and GPU acceleration'
      },
      {
        name: 'Audio System',
        critical: false,
        details: 'Web Audio API and microphone access'
      },
      {
        name: 'File System Access',
        critical: false,
        details: 'Model file loading and drag-drop'
      },
      {
        name: 'Local Storage',
        critical: false,
        details: 'Settings and state persistence'
      },
      {
        name: 'Performance Monitoring',
        critical: true,
        details: 'FPS and memory tracking'
      },
      {
        name: 'AI Diagnostics',
        critical: false,
        details: 'Smart error detection and auto-repair'
      }
    ];

    services.forEach(service => {
      this.services.set(service.name, {
        ...service,
        status: 'healthy',
        lastCheck: Date.now(),
        errorCount: 0
      });
    });
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Initial health check
    this.performHealthCheck();

    // Setup interval
    this.intervalId = window.setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval);

    console.log('🏥 Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('🏥 Health monitoring stopped');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const healthChecks = [
      this.checkWebGL(),
      this.checkAudioSystem(),
      this.checkFileSystemAccess(),
      this.checkLocalStorage(),
      this.checkPerformanceMonitoring(),
      this.checkAIDiagnostics()
    ];

    try {
      await Promise.allSettled(healthChecks);
      this.notifyListeners();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Check WebGL rendering health
   */
  private async checkWebGL(): Promise<void> {
    const startTime = performance.now();

    try {
      // Check for canvas elements
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        throw new Error('No canvas element found');
      }

      // Check WebGL context
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) {
        throw new Error('WebGL not available');
      }

      // Check if context is lost
      if (gl.isContextLost && gl.isContextLost()) {
        throw new Error('WebGL context lost');
      }

      // Basic WebGL capability test
      const shader = gl.createShader(gl.VERTEX_SHADER);
      if (!shader) {
        throw new Error('Failed to create WebGL shader');
      }
      gl.deleteShader(shader);

      this.updateServiceHealth('WebGL Rendering', {
        status: 'healthy',
        responseTime: performance.now() - startTime,
        details: 'WebGL context active and functional'
      });

    } catch (error) {
      this.updateServiceHealth('WebGL Rendering', {
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        details: `WebGL issue: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check audio system health
   */
  private async checkAudioSystem(): Promise<void> {
    const startTime = performance.now();

    try {
      // Check Web Audio API
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        throw new Error('Web Audio API not supported');
      }

      // Check getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.updateServiceHealth('Audio System', {
          status: 'degraded',
          responseTime: performance.now() - startTime,
          details: 'Microphone access not available'
        });
        return;
      }

      this.updateServiceHealth('Audio System', {
        status: 'healthy',
        responseTime: performance.now() - startTime,
        details: 'Audio API and microphone access available'
      });

    } catch (error) {
      this.updateServiceHealth('Audio System', {
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        details: `Audio issue: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check file system access health
   */
  private async checkFileSystemAccess(): Promise<void> {
    const startTime = performance.now();

    try {
      // Check File API support
      if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        throw new Error('File API not supported');
      }

      // Check drag and drop support
      const div = document.createElement('div');
      const dragSupported = ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
      
      if (!dragSupported) {
        this.updateServiceHealth('File System Access', {
          status: 'degraded',
          responseTime: performance.now() - startTime,
          details: 'Drag and drop not fully supported'
        });
        return;
      }

      this.updateServiceHealth('File System Access', {
        status: 'healthy',
        responseTime: performance.now() - startTime,
        details: 'File API and drag-drop supported'
      });

    } catch (error) {
      this.updateServiceHealth('File System Access', {
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        details: `File system issue: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check local storage health
   */
  private async checkLocalStorage(): Promise<void> {
    const startTime = performance.now();

    try {
      // Test localStorage functionality
      const testKey = '__health_check_test__';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      
      if (retrieved !== testValue) {
        throw new Error('localStorage read/write mismatch');
      }
      
      localStorage.removeItem(testKey);

      // Check available space (approximate)
      let storageQuota = 0;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        storageQuota = (estimate.quota || 0) / 1024 / 1024; // MB
      }

      this.updateServiceHealth('Local Storage', {
        status: 'healthy',
        responseTime: performance.now() - startTime,
        details: `localStorage functional${storageQuota > 0 ? `, ~${Math.round(storageQuota)}MB available` : ''}`
      });

    } catch (error) {
      this.updateServiceHealth('Local Storage', {
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        details: `Storage issue: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check performance monitoring health
   */
  private async checkPerformanceMonitoring(): Promise<void> {
    const startTime = performance.now();

    try {
      // Check Performance API
      if (!window.performance || !window.performance.now) {
        throw new Error('Performance API not available');
      }

      // Check memory monitoring
      const memorySupported = (performance as any).memory !== undefined;
      
      // Check FPS monitoring capability
      let fpsCheckPassed = false;
      const frameStart = performance.now();
      requestAnimationFrame(() => {
        const frameTime = performance.now() - frameStart;
        fpsCheckPassed = frameTime > 0 && frameTime < 100; // Reasonable frame time
      });

      // Wait briefly for frame callback
      await new Promise(resolve => setTimeout(resolve, 50));

      const status = fpsCheckPassed ? 'healthy' : 'degraded';
      const details = `Performance API available${memorySupported ? ', memory monitoring enabled' : ''}`;

      this.updateServiceHealth('Performance Monitoring', {
        status,
        responseTime: performance.now() - startTime,
        details
      });

    } catch (error) {
      this.updateServiceHealth('Performance Monitoring', {
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        details: `Performance monitoring issue: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check AI diagnostics health
   */
  private async checkAIDiagnostics(): Promise<void> {
    const startTime = performance.now();

    try {
      // Check if global monitor is available
      const globalMonitor = (window as any).__GLOBAL_MONITOR__;
      if (!globalMonitor) {
        throw new Error('Global monitor not initialized');
      }

      // Check if diagnostics are functional
      const stats = globalMonitor.getStats?.();
      if (!stats) {
        throw new Error('Diagnostics stats not available');
      }

      this.updateServiceHealth('AI Diagnostics', {
        status: 'healthy',
        responseTime: performance.now() - startTime,
        details: `AI diagnostics active, monitoring ${stats.activeFeatures?.length || 0} features`
      });

    } catch (error) {
      this.updateServiceHealth('AI Diagnostics', {
        status: 'degraded',
        responseTime: performance.now() - startTime,
        details: `Diagnostics issue: ${(error as Error).message}`
      });
    }
  }

  /**
   * Update service health status
   */
  private updateServiceHealth(serviceName: string, updates: Partial<ServiceHealth>): void {
    const service = this.services.get(serviceName);
    if (!service) return;

    // Track error count
    if (updates.status === 'unhealthy' || updates.status === 'degraded') {
      service.errorCount++;
    } else if (updates.status === 'healthy') {
      service.errorCount = Math.max(0, service.errorCount - 1); // Gradually reduce error count
    }

    // Update service
    Object.assign(service, {
      ...updates,
      lastCheck: Date.now()
    });

    this.services.set(serviceName, service);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    const services: Record<string, ServiceHealth> = {};
    let totalScore = 0;
    let criticalIssues = 0;

    this.services.forEach((service, name) => {
      services[name] = { ...service };
      
      // Calculate service score
      let serviceScore = 100;
      if (service.status === 'degraded') {
        serviceScore = 70;
      } else if (service.status === 'unhealthy') {
        serviceScore = 0;
        if (service.critical) {
          criticalIssues++;
        }
      }

      // Weight critical services more heavily
      const weight = service.critical ? 2 : 1;
      totalScore += serviceScore * weight;
    });

    // Calculate overall score
    const totalServices = Array.from(this.services.values());
    const totalWeight = totalServices.reduce((sum, service) => sum + (service.critical ? 2 : 1), 0);
    const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 100;

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (criticalIssues > 0 || overallScore < this.config.unhealthyThreshold) {
      status = 'unhealthy';
    } else if (overallScore < this.config.degradedThreshold) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: Date.now(),
      services,
      overallScore,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get simplified health endpoint response
   */
  getHealthEndpoint(): { status: string; timestamp: number } {
    const health = this.getHealthStatus();
    return {
      status: health.status,
      timestamp: health.timestamp
    };
  }

  /**
   * Add health status listener
   */
  addListener(callback: (status: HealthStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of health status change
   */
  private notifyListeners(): void {
    const status = this.getHealthStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Health status listener error:', error);
      }
    });
  }

  /**
   * Force immediate health check
   */
  async forceCheck(): Promise<HealthStatus> {
    await this.performHealthCheck();
    return this.getHealthStatus();
  }

  /**
   * Get service-specific health
   */
  getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.services.get(serviceName) || null;
  }

  /**
   * Check if system is in degraded mode
   */
  isDegraded(): boolean {
    const status = this.getHealthStatus();
    return status.status === 'degraded' || status.status === 'unhealthy';
  }

  /**
   * Export health report
   */
  exportHealthReport(): string {
    const status = this.getHealthStatus();
    return JSON.stringify({
      ...status,
      generatedAt: new Date().toISOString(),
      config: this.config
    }, null, 2);
  }
}

// Global health check instance
let healthCheckService: HealthCheckService | null = null;

/**
 * Initialize health monitoring
 */
export function initializeHealthCheck(config?: Partial<HealthCheckConfig>): HealthCheckService {
  if (healthCheckService) {
    healthCheckService.stop();
  }

  healthCheckService = new HealthCheckService(config);
  healthCheckService.start();

  // Setup global health endpoint
  (window as any).__HEALTH_CHECK__ = () => healthCheckService?.getHealthEndpoint();

  return healthCheckService;
}

/**
 * Get health check service instance
 */
export function getHealthCheck(): HealthCheckService | null {
  return healthCheckService;
}

/**
 * Setup health check endpoint for external monitoring
 */
export function setupHealthEndpoint(): void {
  // This could be used with a service worker or server endpoint
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      // Message handler for health checks
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'HEALTH_CHECK') {
          const response = healthCheckService?.getHealthEndpoint();
          event.ports[0]?.postMessage(response);
        }
      });
    });
  }
}

export default HealthCheckService;
