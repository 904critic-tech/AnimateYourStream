/*
 * Agent 2 - Model Loading Fix Test
 * Comprehensive test to verify fetch context fixes for model loading
 */

const puppeteer = require('puppeteer')

async function testModelLoadingFix() {
  console.log('🔧 Agent 2: Testing model loading fixes...')
  
  let browser
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    })
    const page = await browser.newPage()

    // Capture all console messages for analysis
    const consoleMessages = []
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      })
    })

    const url = 'http://localhost:3001/'
    await page.goto(url, { waitUntil: 'networkidle0' })

    // Wait for the app to fully load
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check for any fetch-related errors or "Illegal invocation" errors
    const fetchErrors = consoleMessages.filter(msg => 
      msg.text.includes('fetch') || 
      msg.text.includes('Illegal invocation') ||
      msg.text.includes('Failed to execute')
    )

    // Check for Agent 2 specific messages
    const agent2Messages = consoleMessages.filter(msg => 
      msg.text.includes('Agent 2')
    )

    // Check for model loading related messages
    const modelLoadingMessages = consoleMessages.filter(msg => 
      msg.text.includes('model') || 
      msg.text.includes('Model') ||
      msg.text.includes('GLTF') ||
      msg.text.includes('FBX') ||
      msg.text.includes('OBJ')
    )

    console.log('\n🔧 Model Loading Fix Test Results:')
    
    if (fetchErrors.length > 0) {
      console.log('❌ Fetch-related errors found:')
      fetchErrors.forEach(error => console.log(`  - ${error.type}: ${error.text}`))
    } else {
      console.log('✅ No fetch-related errors detected')
    }

    if (agent2Messages.length > 0) {
      console.log('\n📝 Agent 2 Messages:')
      agent2Messages.forEach(msg => console.log(`  - ${msg.text}`))
    }

    if (modelLoadingMessages.length > 0) {
      console.log('\n📦 Model Loading Messages:')
      modelLoadingMessages.forEach(msg => console.log(`  - ${msg.text}`))
    }

    // Check if the app loaded successfully
    const appLoaded = await page.evaluate(() => {
      return {
        hasCanvas: !!document.querySelector('canvas'),
        hasThreeJS: typeof THREE !== 'undefined',
        hasReact: typeof React !== 'undefined',
        hasReactThreeFiber: typeof window !== 'undefined' && window.__REACT_THREE_FIBER__,
        documentTitle: document.title,
        url: window.location.href
      }
    })

    console.log('\n📱 App Load Status:')
    console.log(`Canvas Element: ${appLoaded.hasCanvas ? '✅ Present' : '❌ Missing'}`)
    console.log(`Three.js: ${appLoaded.hasThreeJS ? '✅ Loaded' : '❌ Missing'}`)
    console.log(`React: ${appLoaded.hasReact ? '✅ Loaded' : '❌ Missing'}`)
    console.log(`React Three Fiber: ${appLoaded.hasReactThreeFiber ? '✅ Loaded' : '❌ Missing'}`)
    console.log(`Document Title: ${appLoaded.documentTitle}`)
    console.log(`URL: ${appLoaded.url}`)

    // Check for any JavaScript errors
    const jsErrors = consoleMessages.filter(msg => msg.type === 'error')
    if (jsErrors.length > 0) {
      console.log('\n⚠️ JavaScript Errors:')
      jsErrors.forEach(error => console.log(`  - ${error.text}`))
    } else {
      console.log('\n✅ No JavaScript errors detected')
    }

    console.log('\n✅ Agent 2: Model loading fix test completed')
    console.log(`Total console messages captured: ${consoleMessages.length}`)
    
    await browser.close()
    process.exit(0)
  } catch (err) {
    if (browser) try { await browser.close() } catch {}
    console.error('❌ Agent 2: Model loading fix test failed:', err.message)
    process.exit(1)
  }
}

testModelLoadingFix()
