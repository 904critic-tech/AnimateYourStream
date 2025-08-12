/**
 * Production Performance Monitoring
 * 
 * Advanced performance tracking and optimization for production deployment
 * Agent 2 - Performance Optimization Team
 */

// Core Web Vitals tracking
interface WebVitalsMetrics {
  FCP: number // First Contentful Paint
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  TTFB: number // Time to First Byte
}

// Performance tracking
export class ProductionPerformanceMonitor {
  private metrics: Partial<WebVitalsMetrics> = {}
  private observers: PerformanceObserver[] = []
  private analyticsEndpoint?: string

  constructor(config?: { analyticsEndpoint?: string }) {
    this.analyticsEndpoint = config?.analyticsEndpoint
    this.initializeTracking()
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private initializeTracking(): void {
    // Track First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.FCP = entry.startTime
          this.reportMetric('FCP', entry.startTime)
        }
      }
    })

    // Track Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      // Get the latest LCP candidate
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        this.metrics.LCP = lastEntry.startTime
        this.reportMetric('LCP', lastEntry.startTime)
      }
    })

    // Track First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      for (const entry of entries) {
        const fidEntry = entry as any // First Input entries have processingStart
        this.metrics.FID = fidEntry.processingStart - fidEntry.startTime
        this.reportMetric('FID', this.metrics.FID)
      }
    })

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0
    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries) {
        // Only count layout shifts without recent user input
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      this.metrics.CLS = clsValue
      this.reportMetric('CLS', clsValue)
    })

    // Track Time to First Byte (TTFB)
    this.trackTTFB()

    // Track resource loading performance
    this.trackResourcePerformance()

    // Track JavaScript performance
    this.trackJavaScriptPerformance()
  }

  /**
   * Generic performance observer helper
   */
  private observePerformanceEntry(
    type: string, 
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  /**
   * Track Time to First Byte
   */
  private trackTTFB(): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      this.metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart
      this.reportMetric('TTFB', this.metrics.TTFB)
    }
  }

  /**
   * Track resource loading performance
   */
  private trackResourcePerformance(): void {
    this.observePerformanceEntry('resource', (entries) => {
      for (const entry of entries) {
        const resourceEntry = entry as PerformanceResourceTiming
        const loadTime = resourceEntry.responseEnd - resourceEntry.startTime

        // Track slow resources (>1s)
        if (loadTime > 1000) {
          this.reportMetric('slow-resource', loadTime, {
            url: resourceEntry.name,
            type: this.getResourceType(resourceEntry),
            size: resourceEntry.transferSize
          })
        }

        // Track failed resources
        if (resourceEntry.transferSize === 0 && loadTime > 0) {
          this.reportMetric('failed-resource', loadTime, {
            url: resourceEntry.name,
            type: this.getResourceType(resourceEntry)
          })
        }
      }
    })
  }

  /**
   * Track JavaScript performance issues
   */
  private trackJavaScriptPerformance(): void {
    // Track long tasks
    this.observePerformanceEntry('longtask', (entries) => {
      for (const entry of entries) {
        this.reportMetric('long-task', entry.duration, {
          startTime: entry.startTime
        })
      }
    })

    // Track memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.reportMetric('memory-usage', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        })
      }, 30000) // Every 30 seconds
    }
  }

  /**
   * Get resource type from performance entry
   */
  private getResourceType(entry: PerformanceResourceTiming): string {
    if (entry.name.includes('.js')) return 'script'
    if (entry.name.includes('.css')) return 'stylesheet'
    if (entry.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (entry.name.includes('.woff')) return 'font'
    return 'other'
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(name: string, value: number, metadata?: any): void {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata
    }

    // Send to analytics endpoint
    if (this.analyticsEndpoint) {
      this.sendToAnalytics(metric)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('📊 Performance Metric:', metric)
    }

    // Store in session storage for debugging
    if (typeof sessionStorage !== 'undefined') {
      const key = `perf_${name}_${Date.now()}`
      sessionStorage.setItem(key, JSON.stringify(metric))
      
      // Clean up old entries (keep last 50)
      const perfKeys = Object.keys(sessionStorage).filter(k => k.startsWith('perf_'))
      if (perfKeys.length > 50) {
        perfKeys.slice(0, -50).forEach(k => sessionStorage.removeItem(k))
      }
    }
  }

  /**
   * Send metrics to analytics endpoint
   */
  private async sendToAnalytics(metric: any): Promise<void> {
    if (!this.analyticsEndpoint) return

    try {
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.warn('Failed to send analytics:', error)
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      performance: {
        navigation: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource').length,
        timing: performance.timing
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        memory: (performance as any).memory
      }
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * CDN and Caching Strategy Helper
 */
export class CDNOptimizer {
  private cdnEndpoint: string
  private cacheStrategy: 'aggressive' | 'conservative' | 'balanced'

  constructor(cdnEndpoint: string, strategy: 'aggressive' | 'conservative' | 'balanced' = 'balanced') {
    this.cdnEndpoint = cdnEndpoint
    this.cacheStrategy = strategy
  }

  /**
   * Get optimized asset URL
   */
  getAssetUrl(assetPath: string, options?: {
    format?: 'webp' | 'avif' | 'png' | 'jpg'
    quality?: number
    width?: number
    height?: number
  }): string {
    const url = new URL(assetPath, this.cdnEndpoint)
    
    if (options) {
      if (options.format) url.searchParams.set('format', options.format)
      if (options.quality) url.searchParams.set('quality', options.quality.toString())
      if (options.width) url.searchParams.set('w', options.width.toString())
      if (options.height) url.searchParams.set('h', options.height.toString())
    }

    return url.toString()
  }

  /**
   * Get cache headers for asset type
   */
  getCacheHeaders(assetType: 'script' | 'stylesheet' | 'image' | 'font' | 'other'): Record<string, string> {
    const strategies = {
      aggressive: {
        script: 'max-age=31536000, immutable', // 1 year
        stylesheet: 'max-age=31536000, immutable',
        image: 'max-age=31536000, immutable',
        font: 'max-age=31536000, immutable',
        other: 'max-age=86400' // 1 day
      },
      conservative: {
        script: 'max-age=3600', // 1 hour
        stylesheet: 'max-age=3600',
        image: 'max-age=86400', // 1 day
        font: 'max-age=604800', // 1 week
        other: 'max-age=3600'
      },
      balanced: {
        script: 'max-age=604800', // 1 week
        stylesheet: 'max-age=604800',
        image: 'max-age=2592000', // 1 month
        font: 'max-age=31536000', // 1 year
        other: 'max-age=86400'
      }
    }

    return {
      'Cache-Control': strategies[this.cacheStrategy][assetType],
      'Vary': 'Accept-Encoding'
    }
  }

  /**
   * Preload critical resources
   */
  preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/assets/react-vendor.js', as: 'script', crossorigin: 'anonymous' },
      { href: '/assets/three-core.js', as: 'script', crossorigin: 'anonymous' },
      { href: '/assets/index.css', as: 'style' }
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = this.getAssetUrl(resource.href)
      link.as = resource.as
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin
      }
      document.head.appendChild(link)
    })
  }
}

// Initialize production performance monitoring
let productionMonitor: ProductionPerformanceMonitor | null = null

export function initializeProductionPerformance(config?: {
  analyticsEndpoint?: string
  cdnEndpoint?: string
}): ProductionPerformanceMonitor {
  if (productionMonitor) {
    return productionMonitor
  }

  productionMonitor = new ProductionPerformanceMonitor(config)

  // Initialize CDN optimization if endpoint provided
  if (config?.cdnEndpoint) {
    const cdn = new CDNOptimizer(config.cdnEndpoint)
    cdn.preloadCriticalResources()
  }

  return productionMonitor
}

// Export types and classes for production use
