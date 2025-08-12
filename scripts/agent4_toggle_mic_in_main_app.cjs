#!/usr/bin/env node
// Agent 4 - Toggle Microphone in Main App and Verify Audio Flow (Read-only)

const puppeteer = require('puppeteer')

;(async () => {
  const start = Date.now()
  const url = process.env.URL || 'http://localhost:3001/'
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

    // Collect console errors
    const jsErrors = []
    page.on('pageerror', (err) => jsErrors.push(String(err)))

    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = resp ? resp.status() : 0

    // Attach audioLevel listener
    await page.exposeFunction('a4RecordLevel', (level) => {})
    await page.evaluate(() => {
      window.__A4_LEVELS__ = []
      const handler = (ev) => {
        const lvl = ev?.detail?.audioLevel ?? 0
        window.__A4_LEVELS__.push(lvl)
      }
      window.addEventListener('audioLevel', handler)
      window.__A4_UNSUB__ = () => window.removeEventListener('audioLevel', handler)
    })

    // Wait for TopToolbar microphone button
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.some(b => b.getAttribute('title') === 'Microphone Off' || b.getAttribute('title') === 'Microphone On')
    }, { timeout: 15000 })

    // Click microphone toggle (turn on)
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.getAttribute('title') === 'Microphone Off') || btns.find(b => b.getAttribute('title') === 'Microphone On')
      if (btn) { btn.click(); return true }
      return false
    })

    // Wait for processing stats
    await page.waitForFunction(() => {
      const proc = window.__ENHANCED_AUDIO_PROCESSOR__
      if (!proc) return false
      const s = proc.getProcessingStats()
      return s && typeof s.frameCount === 'number' && s.frameCount > 0
    }, { timeout: 10000 })

    // Wait for audio level > 0
    await page.waitForFunction(() => Array.isArray(window.__A4_LEVELS__) && window.__A4_LEVELS__.some(v => v > 0), { timeout: 10000 })

    // Gather stats
    const stats = await page.evaluate(() => {
      const proc = window.__ENHANCED_AUDIO_PROCESSOR__
      const s = proc ? proc.getProcessingStats() : null
      const lastLevel = Array.isArray(window.__A4_LEVELS__) && window.__A4_LEVELS__.length ? window.__A4_LEVELS__[window.__A4_LEVELS__.length - 1] : 0
      return { processing: s, lastLevel }
    })

    const result = {
      agent: 'Agent 4',
      action: 'TOGGLE_MIC_MAIN_APP_AND_VERIFY',
      url,
      httpStatus: status,
      clickedToggle: clicked,
      processing: stats.processing,
      lastLevel: stats.lastLevel,
      elapsedMs: Date.now() - start,
      success: status === 200 && clicked && stats.processing && stats.processing.frameCount > 0 && stats.lastLevel > 0,
      jsErrors
    }

    console.log(JSON.stringify(result))
    process.exit(result.success ? 0 : 2)
  } catch (err) {
    const result = {
      agent: 'Agent 4',
      action: 'TOGGLE_MIC_MAIN_APP_AND_VERIFY',
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