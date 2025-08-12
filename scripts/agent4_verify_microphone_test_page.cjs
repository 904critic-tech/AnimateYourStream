#!/usr/bin/env node
// Agent 4 - Verify Microphone Test Page (Read-only)
// Navigates to http://localhost:3001/?test=microphone and checks for key UI text

const puppeteer = require('puppeteer')

;(async () => {
  const start = Date.now()
  const url = process.env.URL || 'http://localhost:3001/?test=microphone'
  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ]
    })
    const page = await browser.newPage()
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = resp ? resp.status() : 0

    // Wait up to 10s for React to render the heading
    try {
      await page.waitForFunction(() => {
        const h1s = Array.from(document.querySelectorAll('h1'))
        return h1s.some(h => h.textContent && h.textContent.includes('Microphone Diagnostic'))
      }, { timeout: 10000 })
    } catch {}

    // Collect basic console errors
    const jsErrors = []
    page.on('pageerror', (err) => jsErrors.push(String(err)))

    // Evaluate page content
    const { headingFound, audioLevelText } = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll('h1'))
      const found = h1s.some(h => h.textContent && h.textContent.includes('Agent 4 - Microphone Diagnostic'))
      const spans = Array.from(document.querySelectorAll('span, div'))
      const level = spans.find(el => el.textContent && /Current Audio Level:/i.test(el.textContent))
      return { headingFound: found, audioLevelText: level ? level.textContent : null }
    })

    const result = {
      agent: 'Agent 4',
      action: 'VERIFY_MIC_TEST_PAGE',
      url,
      httpStatus: status,
      headingFound,
      audioLevelText,
      elapsedMs: Date.now() - start,
      success: status === 200 && headingFound,
      jsErrors
    }

    console.log(JSON.stringify(result))
    process.exit(result.success ? 0 : 2)
  } catch (err) {
    const result = {
      agent: 'Agent 4',
      action: 'VERIFY_MIC_TEST_PAGE',
      url,
      error: String(err),
      elapsedMs: Date.now() - start,
      success: false
    }
    console.log(JSON.stringify(result))
    process.exit(1)
  } finally {
    if (browser) await browser.close()
  }
})()