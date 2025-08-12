/**
 * Cross-Platform Animation Validation
 * 
 * Validates animation compatibility across different browsers,
 * devices, and WebGL contexts for deployment readiness.
 */

// StressTestReport import removed - not used in this file

export interface BrowserCompatibilityResult {
  browser: string
  version: string
  webglSupport: boolean
  webgl2Support: boolean
  animationPerformance: number
  featuresSupported: string[]
  issues: string[]
}

export interface CrossPlatformReport {
  timestamp: string
  browserResults: BrowserCompatibilityResult[]
  mobileCompatibility: {
    touchSupport: boolean
    gestureRecognition: boolean
    performanceDegradation: number
  }
  webglCompatibility: {
    contextCreation: boolean
    shaderCompilation: boolean
    animationTextures: boolean
  }
  overallCompatibility: number
  deploymentReady: boolean
}

/**
 * Animation Platform Validation System
 */
export class AnimationPlatformValidator {
  
  /**
   * Detect current browser and capabilities
   */
  private detectBrowser(): { name: string; version: string } {
    const userAgent = navigator.userAgent
    
    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/)
      return { name: 'Chrome', version: match ? match[1] : 'Unknown' }
    }
    
    // Firefox
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/)
      return { name: 'Firefox', version: match ? match[1] : 'Unknown' }
    }
    
    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/)
      return { name: 'Safari', version: match ? match[1] : 'Unknown' }
    }
    
    // Edge
    if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/)
      return { name: 'Edge', version: match ? match[1] : 'Unknown' }
    }
    
    return { name: 'Unknown', version: 'Unknown' }
  }
  
  /**
   * Test WebGL support and capabilities
   */
  private testWebGLSupport(): { webgl: boolean; webgl2: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Test WebGL 1.0
    let webglSupported = false
    try {
      const canvas = document.createElement('canvas')
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
      webglSupported = !!gl
      
      if (gl) {
        // Test essential WebGL features for animation
        const vertexShaderSource = `
          attribute vec4 a_position;
          void main() {
            gl_Position = a_position;
          }
        `
        const fragmentShaderSource = `
          precision mediump float;
          void main() {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
        `
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vertexShader, vertexShaderSource)
        gl.compileShader(vertexShader)
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
          issues.push('Vertex shader compilation failed')
        }
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fragmentShader, fragmentShaderSource)
        gl.compileShader(fragmentShader)
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
          issues.push('Fragment shader compilation failed')
        }
      }
    } catch (error) {
      issues.push('WebGL context creation failed')
    }
    
    // Test WebGL 2.0
    let webgl2Supported = false
    try {
      const canvas = document.createElement('canvas')
      const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null
      webgl2Supported = !!gl2
    } catch (error) {
      // WebGL 2.0 not supported
    }
    
    return {
      webgl: webglSupported,
      webgl2: webgl2Supported,
      issues
    }
  }
  
  /**
   * Test animation performance for current platform
   */
  private async testAnimationPerformance(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      let frameCount = 0
      const testDuration = 1000 // 1 second test
      
      // Simple animation performance test
      const testAnimation = () => {
        frameCount++
        
        // Simulate animation calculations
        for (let i = 0; i < 100; i++) {
          // Perform calculation to simulate animation workload
          Math.sin(performance.now() * 0.001 + i) * Math.cos(i * 0.1)
        }
        
        if (performance.now() - startTime < testDuration) {
          requestAnimationFrame(testAnimation)
        } else {
          const fps = (frameCount / testDuration) * 1000
          resolve(fps)
        }
      }
      
      requestAnimationFrame(testAnimation)
    })
  }
  
  /**
   * Test mobile-specific features
   */
  private testMobileCompatibility() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    return {
      touchSupport: 'ontouchstart' in window,
      gestureRecognition: 'ongesturestart' in window,
      performanceDegradation: isMobile ? 0.7 : 1.0 // Assume 30% performance reduction on mobile
    }
  }
  
  /**
   * Test specific animation features
   */
  private testAnimationFeatures(): string[] {
    const features: string[] = []
    
    // Test requestAnimationFrame
    if (typeof requestAnimationFrame !== 'undefined') {
      features.push('requestAnimationFrame')
    }
    
    // Test CSS transforms (for fallback animations)
    const testElement = document.createElement('div')
    if (testElement.style.transform !== undefined) {
      features.push('CSS3 Transforms')
    }
    
    // Test Web Workers (for background animation calculations)
    if (typeof Worker !== 'undefined') {
      features.push('Web Workers')
    }
    
    // Test performance API
    if (typeof performance !== 'undefined') {
      features.push('High Resolution Time')
    }
    
    // Test WebGL extensions
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
      if (gl) {
        const extensions = [
          'OES_vertex_array_object',
          'WEBGL_lose_context',
          'OES_texture_float',
          'OES_texture_half_float'
        ]
        
        extensions.forEach(ext => {
          if (gl.getExtension(ext)) {
            features.push(`WebGL ${ext}`)
          }
        })
      }
    } catch (error) {
      // WebGL extensions test failed
    }
    
    return features
  }
  
  /**
   * Run comprehensive cross-platform validation
   */
  async validateAnimationCompatibility(): Promise<CrossPlatformReport> {
    console.log('🌐 Starting Cross-Platform Animation Validation...')
    
    const browser = this.detectBrowser()
    const webglSupport = this.testWebGLSupport()
    const animationPerformance = await this.testAnimationPerformance()
    const featuresSupported = this.testAnimationFeatures()
    const mobileCompatibility = this.testMobileCompatibility()
    
    const browserResult: BrowserCompatibilityResult = {
      browser: browser.name,
      version: browser.version,
      webglSupport: webglSupport.webgl,
      webgl2Support: webglSupport.webgl2,
      animationPerformance,
      featuresSupported,
      issues: webglSupport.issues
    }
    
    // Calculate overall compatibility score
    let compatibilityScore = 0
    
    // WebGL support (40 points)
    if (webglSupport.webgl) compatibilityScore += 30
    if (webglSupport.webgl2) compatibilityScore += 10
    
    // Performance (30 points)
    if (animationPerformance >= 60) compatibilityScore += 30
    else if (animationPerformance >= 30) compatibilityScore += 20
    else if (animationPerformance >= 15) compatibilityScore += 10
    
    // Feature support (20 points)
    const featureScore = Math.min(20, featuresSupported.length * 2)
    compatibilityScore += featureScore
    
    // Mobile compatibility (10 points)
    if (mobileCompatibility.touchSupport) compatibilityScore += 5
    if (mobileCompatibility.gestureRecognition) compatibilityScore += 5
    
    const report: CrossPlatformReport = {
      timestamp: new Date().toISOString(),
      browserResults: [browserResult],
      mobileCompatibility,
      webglCompatibility: {
        contextCreation: webglSupport.webgl,
        shaderCompilation: webglSupport.issues.length === 0,
        animationTextures: webglSupport.webgl2 || featuresSupported.includes('WebGL OES_texture_float')
      },
      overallCompatibility: compatibilityScore,
      deploymentReady: compatibilityScore >= 70 && webglSupport.webgl && animationPerformance >= 30
    }
    
    // Log results
    console.log('\n📊 CROSS-PLATFORM VALIDATION RESULTS:')
    console.log('=====================================')
    console.log(`Browser: ${browser.name} ${browser.version}`)
    console.log(`WebGL Support: ${webglSupport.webgl ? '✅' : '❌'}`)
    console.log(`WebGL 2.0 Support: ${webglSupport.webgl2 ? '✅' : '❌'}`)
    console.log(`Animation Performance: ${animationPerformance.toFixed(2)} FPS`)
    console.log(`Features Supported: ${featuresSupported.length}`)
    console.log(`Overall Compatibility: ${compatibilityScore}/100`)
    console.log(`Deployment Ready: ${report.deploymentReady ? '✅' : '❌'}`)
    
    if (webglSupport.issues.length > 0) {
      console.log('\n⚠️ Issues Found:')
      webglSupport.issues.forEach(issue => console.log(`   - ${issue}`))
    }
    
    console.log('\n🎮 Supported Features:')
    featuresSupported.forEach(feature => console.log(`   ✅ ${feature}`))
    
    return report
  }
}

/**
 * Quick compatibility check for development
 */
export async function quickCompatibilityCheck(): Promise<boolean> {
  const validator = new AnimationPlatformValidator()
  const report = await validator.validateAnimationCompatibility()
  
  console.log(`⚡ Quick Compatibility Check: ${report.deploymentReady ? '✅ COMPATIBLE' : '❌ INCOMPATIBLE'}`)
  
  return report.deploymentReady
}

export default AnimationPlatformValidator
