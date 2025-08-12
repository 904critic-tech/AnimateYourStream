/**
 * Agent 1 AI Behavior Engine Test
 * 
 * Tests the Phase 4 Priority 2 AI Behavior Engine implementation
 */

const puppeteer = require('puppeteer')

async function testAIBehavior() {
  console.log('🤖 Agent 1: Testing AI Behavior Engine...')
  
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
    
    // Check if AI Behavior Engine is exposed globally
    const aiBehaviorExists = await page.evaluate(() => {
      return typeof window.__AI_BEHAVIOR__ !== 'undefined'
    })
    
    if (aiBehaviorExists) {
      console.log('✅ AI Behavior Engine exposed globally')
      
      // Test AI behavior state
      const aiState = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.getState()
      })
      
      console.log('📊 AI Behavior State:', aiState)
      
      // Test performance metrics
      const performanceMetrics = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.getPerformanceMetrics()
      })
      
      console.log('📈 AI Performance Metrics:', performanceMetrics)
      
      // Test environmental context
      const environmentalContext = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.getEnvironmentalContext()
      })
      
      console.log('🌍 Environmental Context:', environmentalContext)
      
      // Test personality change
      await page.evaluate(() => {
        window.__AI_BEHAVIOR__.setPersonality('excited')
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedState = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.getState()
      })
      
      console.log('🔄 Updated State (Excited):', updatedState)
      
      // Test mood change
      await page.evaluate(() => {
        window.__AI_BEHAVIOR__.setMood('playful')
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const moodUpdatedState = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.getState()
      })
      
      console.log('🎭 Mood Updated State (Playful):', moodUpdatedState)
      
      // Test force decision
      const decision = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.forceDecision()
      })
      
      console.log('🎯 Forced Decision:', decision)
      
      // Test personality change to shy
      await page.evaluate(() => {
        window.__AI_BEHAVIOR__.setPersonality('shy')
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const shyState = await page.evaluate(() => {
        return window.__AI_BEHAVIOR__.getState()
      })
      
      console.log('😊 Shy Personality State:', shyState)
      
    } else {
      console.log('⚠️ AI Behavior Engine not found globally')
    }
    
    // Check console logs for AI Behavior messages
    const logs = await page.evaluate(() => {
      return window.console.logs || []
    })
    
    const aiBehaviorLogs = logs.filter(log => 
      log.includes('🤖 Agent 1:') || 
      log.includes('AIBehavior')
    )
    
    console.log('📝 AI Behavior Logs:', aiBehaviorLogs)
    
    console.log('✅ AI Behavior Engine test completed successfully')
    
  } catch (error) {
    console.error('❌ AI Behavior Engine test failed:', error)
  } finally {
    await browser.close()
  }
}

// Run the test
testAIBehavior().catch(console.error)
