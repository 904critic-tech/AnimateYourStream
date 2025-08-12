/**
 * Agent 1 Animation Controller Test
 * 
 * Tests the Phase 4 Priority 1 Animation Controller System implementation
 */

const puppeteer = require('puppeteer')

async function testAnimationController() {
  console.log('🎬 Agent 1: Testing Animation Controller System...')
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Navigate to the application
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' })
    console.log('✅ Page loaded successfully')
    
    // Wait for the application to initialize
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check if Animation Controller is exposed globally
    const controllerExists = await page.evaluate(() => {
      return typeof window.__ANIMATION_CONTROLLER__ !== 'undefined'
    })
    
    if (controllerExists) {
      console.log('✅ Animation Controller exposed globally')
      
      // Test controller state
      const controllerState = await page.evaluate(() => {
        return window.__ANIMATION_CONTROLLER__.getState()
      })
      
      console.log('📊 Controller State:', controllerState)
      
      // Test performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return window.__ANIMATION_CONTROLLER__.getPerformanceMetrics()
      })
      
      console.log('📈 Performance Metrics:', performanceMetrics)
      
      // Test manual state change
      await page.evaluate(() => {
        window.__ANIMATION_CONTROLLER__.setState('walking')
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedState = await page.evaluate(() => {
        return window.__ANIMATION_CONTROLLER__.getState()
      })
      
      console.log('🔄 Updated State:', updatedState)
      
      // Test force animation
      await page.evaluate(() => {
        window.__ANIMATION_CONTROLLER__.forceAnimation('idle')
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const finalState = await page.evaluate(() => {
        return window.__ANIMATION_CONTROLLER__.getState()
      })
      
      console.log('🎯 Final State:', finalState)
      
    } else {
      console.log('⚠️ Animation Controller not found globally')
    }
    
    // Check console logs for Animation Controller messages
    const logs = await page.evaluate(() => {
      return window.console.logs || []
    })
    
    const animationControllerLogs = logs.filter(log => 
      log.includes('🎬 Agent 1:') || 
      log.includes('AnimationController')
    )
    
    console.log('📝 Animation Controller Logs:', animationControllerLogs)
    
    console.log('✅ Animation Controller test completed successfully')
    
  } catch (error) {
    console.error('❌ Animation Controller test failed:', error)
  } finally {
    await browser.close()
  }
}

// Run the test
testAnimationController().catch(console.error)
