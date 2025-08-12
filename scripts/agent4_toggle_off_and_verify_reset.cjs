#!/usr/bin/env node
// Agent 4 - Toggle Microphone OFF and Verify Reset (Read-only)

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

    const jsErrors = []
    page.on('pageerror', (err) => jsErrors.push(String(err)))

    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const status = resp ? resp.status() : 0

    // Attach audioLevel listener for last event
    await page.evaluate(() => {
      window.__A4_LEVEL_EVENTS__ = []
      const handler = (ev) => {
        const lvl = ev?.detail?.audioLevel ?? null
        window.__A4_LEVEL_EVENTS__.push(lvl)
      }
      window.addEventListener('audioLevel', handler)
      window.__A4_UNSUB_LEVEL__ = () => window.removeEventListener('audioLevel', handler)
    })

    // Ensure the microphone is ON first (click if it's Off)
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.some(b => b.getAttribute('title') === 'Microphone Off' || b.getAttribute('title') === 'Microphone On')
    }, { timeout: 15000 })

    // If Off, click to turn ON
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const offBtn = btns.find(b => b.getAttribute('title') === 'Microphone Off')
      if (offBtn) offBtn.click()
    })

    // Wait for processing to start
    await page.waitForFunction(() => {
      const proc = window.__ENHANCED_AUDIO_PROCESSOR__
      if (!proc) return false
      const s = proc.getProcessingStats()
      return s && s.isProcessing === true && s.frameCount > 0
    }, { timeout: 10000 })

    // Now click to turn microphone OFF
    const clickedOff = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const onBtn = btns.find(b => b.getAttribute('title') === 'Microphone On')
      if (onBtn) { onBtn.click(); return true }
      return false
    })

    // Wait for processing to stop
    await page.waitForFunction(() => {
      const proc = window.__ENHANCED_AUDIO_PROCESSOR__
      if (!proc) return false
      const s = proc.getProcessingStats()
      return s && s.isProcessing === false
    }, { timeout: 10000 })

    // Wait for an audioLevel event of 0 (reset)
    await page.waitForFunction(() => {
      const arr = window.__A4_LEVEL_EVENTS__
      return Array.isArray(arr) && arr.some(v => v === 0)
    }, { timeout: 10000 })

    // Collect final state
    const final = await page.evaluate(() => {
      const proc = window.__ENHANCED_AUDIO_PROCESSOR__
      const s = proc ? proc.getProcessingStats() : null
      const lastLevel = Array.isArray(window.__A4_LEVEL_EVENTS__) && window.__A4_LEVEL_EVENTS__.length ? window.__A4_LEVEL_EVENTS__[window.__A4_LEVEL_EVENTS__.length - 1] : null
      return { processing: s, lastLevel }
    })

    const result = {
      agent: 'Agent 4',
      action: 'TOGGLE_MIC_OFF_AND_VERIFY_RESET',
      url,
      httpStatus: status,
      clickedOff,
      processingAfter: final.processing,
      lastAudioLevelEvent: final.lastLevel,
      elapsedMs: Date.now() - start,
      success: status === 200 && clickedOff && final.processing && final.processing.isProcessing === false && final.lastLevel === 0,
      jsErrors
    }

    console.log(JSON.stringify(result))
    process.exit(result.success ? 0 : 2)
  } catch (err) {
    const result = {
      agent: 'Agent 4',
      action: 'TOGGLE_MIC_OFF_AND_VERIFY_RESET',
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