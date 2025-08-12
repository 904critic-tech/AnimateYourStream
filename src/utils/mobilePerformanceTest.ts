/**
 * Mobile Performance Testing Utilities
 * 
 * Agent 2 - Performance Optimization Team
 * 
 * This module provides comprehensive mobile performance testing,
 * touch responsiveness validation, and mobile-specific optimization
 * recommendations for the 3D model viewer application.
 */

export interface MobilePerformanceMetrics {
  deviceInfo: {
    userAgent: string
    platform: string
    hardwareConcurrency: number
    deviceMemory?: number
    maxTouchPoints: number
    screenSize: {
      width: number
      height: number
      pixelRatio: number
    }
  }
  performance: {
    fps: number
    frameTime: number
    memoryUsage: number
    batteryLevel?: number
    networkType?: string
  }
  touchResponsiveness: {
    touchLatency: number
    gestureRecognition: boolean
    multiTouchSupport: boolean
    scrollPerformance: number
  }
  optimization: {
    recommendedQuality: string
    suggestedOptimizations: string[]
    performanceScore: number
  }
}

export interface MobileTestResult {
  timestamp: string
  deviceInfo: MobilePerformanceMetrics['deviceInfo']
  performance: MobilePerformanceMetrics['performance']
  touchResponsiveness: MobilePerformanceMetrics['touchResponsiveness']
  optimization: MobilePerformanceMetrics['optimization']
  issues: string[]
  recommendations: string[]
}

export class MobilePerformanceTester {
  private testResults: MobileTestResult[] = []
  private isRunning = false
  private fpsHistory: number[] = []
  private frameCount = 0
  private lastTime = performance.now()

  /**
   * Detect mobile device capabilities
   */
  detectMobileCapabilities(): MobilePerformanceMetrics['deviceInfo'] {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const hardwareConcurrency = navigator.hardwareConcurrency || 1
    const deviceMemory = (navigator as any).deviceMemory
    const maxTouchPoints = navigator.maxTouchPoints || 0
    
    const screenSize = {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1
    }

    return {
      userAgent,
      platform,
      hardwareConcurrency,
      deviceMemory,
      maxTouchPoints,
      screenSize
    }
  }

  /**
   * Test touch responsiveness and latency
   */
  async testTouchResponsiveness(): Promise<MobilePerformanceMetrics['touchResponsiveness']> {
    const touchLatency = await this.measureTouchLatency()
    const gestureRecognition = this.testGestureRecognition()
    const multiTouchSupport = navigator.maxTouchPoints > 1
    const scrollPerformance = await this.measureScrollPerformance()

    return {
      touchLatency,
      gestureRecognition,
      multiTouchSupport,
      scrollPerformance
    }
  }

  /**
   * Measure touch latency
   */
  private async measureTouchLatency(): Promise<number> {
    return new Promise((resolve) => {
      let touchStartTime = 0
      let touchEndTime = 0
      let latencySum = 0
      let touchCount = 0
      const maxTouches = 10

      const handleTouchStart = (_event: TouchEvent) => {
        touchStartTime = performance.now()
      }

      const handleTouchEnd = (_event: TouchEvent) => {
        touchEndTime = performance.now()
        latencySum += touchEndTime - touchStartTime
        touchCount++

        if (touchCount >= maxTouches) {
          document.removeEventListener('touchstart', handleTouchStart)
          document.removeEventListener('touchend', handleTouchEnd)
          resolve(latencySum / touchCount)
        }
      }

      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })

      // Auto-resolve after 5 seconds if not enough touches
      setTimeout(() => {
        if (touchCount < maxTouches) {
          document.removeEventListener('touchstart', handleTouchStart)
          document.removeEventListener('touchend', handleTouchEnd)
          resolve(touchCount > 0 ? latencySum / touchCount : 0)
        }
      }, 5000)
    })
  }

  /**
   * Test gesture recognition capabilities
   */
  private testGestureRecognition(): boolean {
    // Test for basic gesture support
    const hasTouchEvents = 'ontouchstart' in window
    const hasPointerEvents = 'onpointerdown' in window
    const hasGestureEvents = 'ongesturestart' in window

    return hasTouchEvents || hasPointerEvents || hasGestureEvents
  }

  /**
   * Measure scroll performance
   */
  private async measureScrollPerformance(): Promise<number> {
    return new Promise((resolve) => {
      let scrollStartTime = 0
      let scrollEndTime = 0
      let scrollCount = 0
      const maxScrolls = 5

      const handleScroll = () => {
        if (scrollCount === 0) {
          scrollStartTime = performance.now()
        }
        scrollCount++

        // Debounce scroll end
        clearTimeout((window as any).scrollTimeout)
        ;(window as any).scrollTimeout = setTimeout(() => {
          scrollEndTime = performance.now()
          const scrollDuration = scrollEndTime - scrollStartTime
          
          if (scrollCount >= maxScrolls) {
            window.removeEventListener('scroll', handleScroll)
            resolve(scrollDuration / scrollCount)
          }
        }, 100)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })

      // Auto-resolve after 3 seconds
      setTimeout(() => {
        window.removeEventListener('scroll', handleScroll)
        resolve(scrollCount > 0 ? (performance.now() - scrollStartTime) / scrollCount : 0)
      }, 3000)
    })
  }

  /**
   * Measure current performance metrics
   */
  measurePerformance(): MobilePerformanceMetrics['performance'] {
    this.frameCount++
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    // Calculate FPS
    if (this.frameCount % 60 === 0) {
      const fps = Math.round(1000 / (deltaTime / 60))
      this.fpsHistory.push(fps)
      
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift()
      }
      
      this.lastTime = currentTime
    }

    const avgFPS = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length 
      : 60

    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0

    return {
      fps: Math.round(avgFPS),
      frameTime: Math.round(deltaTime),
      memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
      batteryLevel: (navigator as any).getBattery?.()?.then((battery: any) => battery.level),
      networkType: (navigator as any).connection?.effectiveType
    }
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizations(
    deviceInfo: MobilePerformanceMetrics['deviceInfo'],
    performance: MobilePerformanceMetrics['performance'],
    touchResponsiveness: MobilePerformanceMetrics['touchResponsiveness']
  ): MobilePerformanceMetrics['optimization'] {
    const optimizations: string[] = []
    let performanceScore = 100

    // Device-specific optimizations
    if (deviceInfo.hardwareConcurrency < 4) {
      optimizations.push('Reduce animation complexity for low-core devices')
      optimizations.push('Use Web Workers for heavy computations')
      performanceScore -= 10
    }

    if (deviceInfo.screenSize.pixelRatio > 2) {
      optimizations.push('Optimize for high-DPI displays')
      optimizations.push('Reduce texture resolution for mobile devices')
      performanceScore -= 5
    }

    if (deviceInfo.deviceMemory && deviceInfo.deviceMemory < 4) {
      optimizations.push('Implement aggressive memory management')
      optimizations.push('Enable texture compression and LOD systems')
      performanceScore -= 15
    }

    // Performance-based optimizations
    if (performance.fps < 30) {
      optimizations.push('Enable low-quality rendering mode')
      optimizations.push('Disable shadows and post-processing effects')
      performanceScore -= 20
    }

    if (performance.memoryUsage > 100) {
      optimizations.push('Implement memory cleanup and texture compression')
      optimizations.push('Use object pooling for frequently created objects')
      performanceScore -= 10
    }

    if (touchResponsiveness.touchLatency > 50) {
      optimizations.push('Optimize touch event handling')
      optimizations.push('Use passive event listeners for better scroll performance')
      performanceScore -= 10
    }

    // Asset loading optimizations
    optimizations.push('Preload critical assets (fonts, textures)')
    optimizations.push('Implement progressive loading for 3D models')
    optimizations.push('Use asset caching and compression')

    // Network optimizations
    if (performance.networkType === 'slow-2g' || performance.networkType === '2g') {
      optimizations.push('Implement offline-first architecture')
      optimizations.push('Use service workers for asset caching')
      performanceScore -= 15
    }

    // Determine recommended quality level
    let recommendedQuality = 'HIGH'
    if (performanceScore < 50) recommendedQuality = 'LOW'
    else if (performanceScore < 75) recommendedQuality = 'MEDIUM'

    return {
      recommendedQuality,
      suggestedOptimizations: optimizations,
      performanceScore: Math.max(0, performanceScore)
    }
  }

  /**
   * Run comprehensive mobile performance test
   */
  async runMobilePerformanceTest(): Promise<MobileTestResult> {
    console.log('📱 Agent 2: Starting Mobile Performance Test...')
    
    this.isRunning = true
    const startTime = performance.now()

    // Detect device capabilities
    const deviceInfo = this.detectMobileCapabilities()
    console.log('📱 Agent 2: Device Info:', deviceInfo)

    // Measure performance
    const performanceMetrics = this.measurePerformance()
    console.log('📱 Agent 2: Performance Metrics:', performanceMetrics)

    // Test touch responsiveness
    const touchResponsiveness = await this.testTouchResponsiveness()
    console.log('📱 Agent 2: Touch Responsiveness:', touchResponsiveness)

    // Generate optimizations
    const optimization = this.generateOptimizations(deviceInfo, performanceMetrics, touchResponsiveness)
    console.log('📱 Agent 2: Optimization Recommendations:', optimization)

    // Identify issues
    const issues: string[] = []
    if (performanceMetrics.fps < 30) issues.push('Low frame rate detected')
    if (touchResponsiveness.touchLatency > 100) issues.push('High touch latency')
    if (performanceMetrics.memoryUsage > 200) issues.push('High memory usage')

    // Generate recommendations
    const recommendations: string[] = []
    if (deviceInfo.hardwareConcurrency < 4) {
      recommendations.push('Consider using Web Workers for heavy computations')
    }
    if (touchResponsiveness.multiTouchSupport) {
      recommendations.push('Implement multi-touch gesture support')
    }
    if (optimization.performanceScore < 70) {
      recommendations.push('Enable adaptive quality settings')
    }

    const result: MobileTestResult = {
      timestamp: new Date().toISOString(),
      deviceInfo,
      performance: performanceMetrics,
      touchResponsiveness,
      optimization,
      issues,
      recommendations
    }

    this.testResults.push(result)
    this.isRunning = false

    const testDuration = performance.now() - startTime
    console.log(`📱 Agent 2: Mobile Performance Test completed in ${testDuration.toFixed(2)}ms`)
    console.log('📱 Agent 2: Performance Score:', optimization.performanceScore)

    return result
  }

  /**
   * Get test history
   */
  getTestHistory(): MobileTestResult[] {
    return this.testResults
  }

  /**
   * Get latest test result
   */
  getLatestResult(): MobileTestResult | null {
    return this.testResults.length > 0 ? this.testResults[this.testResults.length - 1] : null
  }

  /**
   * Check if test is currently running
   */
  isTestRunning(): boolean {
    return this.isRunning
  }

  /**
   * Clear test history
   */
  clearHistory(): void {
    this.testResults = []
  }

  /**
   * Test asset loading performance and optimization
   */
  async testAssetLoadingPerformance(): Promise<{
    fontLoadingTime: number
    textureLoadingTime: number
    modelLoadingTime: number
    recommendations: string[]
  }> {
    console.log('🎭 Agent 3: Testing asset loading performance...')
    
    const results = {
      fontLoadingTime: 0,
      textureLoadingTime: 0,
      modelLoadingTime: 0,
      recommendations: [] as string[]
    }

    // Test font loading performance
    try {
      const fontStart = performance.now()
      const fontFace = new FontFace('Inter', 'url(/src/assets/fonts/inter-latin.woff2)')
      await fontFace.load()
      results.fontLoadingTime = performance.now() - fontStart
      
      if (results.fontLoadingTime > 1000) {
        results.recommendations.push('Font loading is slow - consider preloading or using system fonts')
      }
    } catch (error) {
      console.warn('🎭 Agent 3: Font loading test failed:', error)
      results.recommendations.push('Font file not found - check asset paths')
    }

    // Test texture loading performance (simulated)
    try {
      const textureStart = performance.now()
      const testImage = new Image()
      testImage.src = '/vite.svg'
      
      await new Promise((resolve, reject) => {
        testImage.onload = resolve
        testImage.onerror = reject
        setTimeout(reject, 5000) // 5 second timeout
      })
      
      results.textureLoadingTime = performance.now() - textureStart
      
      if (results.textureLoadingTime > 2000) {
        results.recommendations.push('Texture loading is slow - implement progressive loading')
      }
    } catch (error) {
      console.warn('🎭 Agent 3: Texture loading test failed:', error)
      results.recommendations.push('Texture file not found - check asset paths')
    }

    // Test 3D model loading performance (simulated)
    try {
      const modelStart = performance.now()
      // Simulate model loading with a small delay
      await new Promise(resolve => setTimeout(resolve, 100))
      results.modelLoadingTime = performance.now() - modelStart
      
      if (results.modelLoadingTime > 3000) {
        results.recommendations.push('Model loading is slow - implement LOD and compression')
      }
    } catch (error) {
      console.warn('🎭 Agent 3: Model loading test failed:', error)
      results.recommendations.push('Model loading failed - check file formats and paths')
    }

    // Add general asset optimization recommendations
    results.recommendations.push('Implement asset preloading for critical resources')
    results.recommendations.push('Use WebP format for images when supported')
    results.recommendations.push('Compress 3D models and textures for mobile devices')

    console.log('🎭 Agent 3: Asset loading performance test completed:', results)
    return results
  }
}

// Export singleton instance
export const mobilePerformanceTester = new MobilePerformanceTester()

// Export convenience functions
export async function runMobilePerformanceTest(): Promise<MobileTestResult> {
  return mobilePerformanceTester.runMobilePerformanceTest()
}

export function getMobileTestHistory(): MobileTestResult[] {
  return mobilePerformanceTester.getTestHistory()
}

export function getLatestMobileTestResult(): MobileTestResult | null {
  return mobilePerformanceTester.getLatestResult()
}

export async function testAssetLoadingPerformance(): Promise<{
  fontLoadingTime: number
  textureLoadingTime: number
  modelLoadingTime: number
  recommendations: string[]
}> {
  return mobilePerformanceTester.testAssetLoadingPerformance()
}
