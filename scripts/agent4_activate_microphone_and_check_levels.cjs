#!/usr/bin/env node
// Agent 4 - Activate Microphone and Check Levels (Read-only)
// Navigates to http://localhost:3001/?test=microphone, clicks Enable Microphone,
// and verifies that the audio level increases above zero.

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

    // Capture console errors
    const jsErrors = []
    page.on('pageerror', (err) => jsErrors.push(String(err)))

    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = resp ? resp.status() : 0

    // Wait for heading to render
    await page.waitForFunction(() => {
      const h1s = Array.from(document.querySelectorAll('h1'))
      return h1s.some(h => h.textContent && h.textContent.includes('Microphone Diagnostic'))
    }, { timeout: 10000 })

    // Click the Enable Microphone button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const btn = buttons.find(b => b.textContent && /Enable Microphone/i.test(b.textContent))
      if (btn) { (btn).click(); return true }
      return false
    })

    // Wait up to 10s for audio level to rise above zero
    let finalLevel = 0
    try {
      await page.waitForFunction(() => {
        const textNodes = Array.from(document.querySelectorAll('div, span'))
        const label = textNodes.find(el => el.textContent && /Current\s+Audio\s+Level:/i.test(el.textContent))
        if (!label) return false
        const match = label.textContent.match(/Current\s+Audio\s+Level:\s*([0-9]+\.[0-9]+)%/i)
        if (!match) return false
        const val = parseFloat(match[1])
        return val > 0.0
      }, { timeout: 10000 })
    } catch {}

    // Read final audio level text
    const audioLevelText = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('div, span'))
      const label = nodes.find(el => el.textContent && /Current\s+Audio\s+Level:/i.test(el.textContent))
      return label ? label.textContent : null
    })

    // Parse to number
    if (audioLevelText) {
      const m = audioLevelText.match(/Current\s+Audio\s+Level:\s*([0-9]+\.[0-9]+)%/i)
      if (m) finalLevel = parseFloat(m[1])
    }

    const result = {
      agent: 'Agent 4',
      action: 'ACTIVATE_MIC_AND_CHECK_LEVEL',
      url,
      httpStatus: status,
      clickedEnable: clicked,
      audioLevelText,
      audioLevelPercent: finalLevel,
      elapsedMs: Date.now() - start,
      success: status === 200 && clicked && finalLevel > 0,
      jsErrors
    }

    console.log(JSON.stringify(result))
    process.exit(result.success ? 0 : 2)
  } catch (err) {
    const result = {
      agent: 'Agent 4',
      action: 'ACTIVATE_MIC_AND_CHECK_LEVEL',
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