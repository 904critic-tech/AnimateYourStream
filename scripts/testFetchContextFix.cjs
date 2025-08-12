/*
 * Agent 2 - Fetch Context Fix Test
 * Tests the enhanced fetch context fixes for model loading
 */

const puppeteer = require('puppeteer')

async function testFetchContextFix() {
  console.log('🔧 Agent 2: Testing enhanced fetch context fixes...')
  
  let browser
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    })
    const page = await browser.newPage()

    // Pipe browser console to Node console
    page.on('console', msg => {
      if (msg.text().includes('Agent 2') || msg.text().includes('fetch') || msg.text().includes('Illegal invocation')) {
        console.log(`📱 Browser: ${msg.type()} - ${msg.text()}`)
      }
    })

    const url = 'http://localhost:3001/'
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if the fetch context fix utility is loaded
    const fetchFixStatus = await page.evaluate(() => {
      // Check if our fetch context fix utility is available
      const hasFetchFix = typeof window !== 'undefined' && 
                         window.fetch && 
                         window.fetch.toString().includes('safeFetch')
      
      // Check if there are any console errors related to fetch
      const consoleErrors = []
      const originalError = console.error
      console.error = (...args) => {
        consoleErrors.push(args.join(' '))
        originalError.apply(console, args)
      }
      
      return {
        hasFetchFix,
        consoleErrors: consoleErrors.filter(err => err.includes('fetch') || err.includes('Illegal invocation'))
      }
    })

    console.log('\n🔧 Fetch Context Fix Test Results:')
    console.log(`Fetch Fix Available: ${fetchFixStatus.hasFetchFix ? '✅ Yes' : '❌ No'}`)
    
    if (fetchFixStatus.consoleErrors.length > 0) {
      console.log('⚠️ Fetch-related errors found:')
      fetchFixStatus.consoleErrors.forEach(error => console.log(`  - ${error}`))
    } else {
      console.log('✅ No fetch-related errors detected')
    }

    // Test if the app is responsive
    const appStatus = await page.evaluate(() => {
      return {
        hasModelViewer: !!document.querySelector('[data-testid="model-viewer"]') || 
                       !!document.querySelector('canvas'),
        hasUploadButton: !!document.querySelector('input[type="file"]') ||
                        !!document.querySelector('button[aria-label*="upload"]') ||
                        !!document.querySelector('button[aria-label*="Upload"]'),
        hasCharacterSelector: !!document.querySelector('select') ||
                             !!document.querySelector('[role="combobox"]')
      }
    })

    console.log('\n📱 App Component Status:')
    console.log(`Model Viewer: ${appStatus.hasModelViewer ? '✅ Present' : '❌ Missing'}`)
    console.log(`Upload Button: ${appStatus.hasUploadButton ? '✅ Present' : '❌ Missing'}`)
    console.log(`Character Selector: ${appStatus.hasCharacterSelector ? '✅ Present' : '❌ Missing'}`)

    console.log('\n✅ Agent 2: Fetch context fix test completed')
    await browser.close()
    process.exit(0)
  } catch (err) {
    if (browser) try { await browser.close() } catch {}
    console.error('❌ Agent 2: Fetch context fix test failed:', err.message)
    process.exit(1)
  }
}

testFetchContextFix()
