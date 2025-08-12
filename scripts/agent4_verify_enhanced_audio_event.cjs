#!/usr/bin/env node
// Agent 4 - Verify enhancedAudioData event in main app (Read-only)

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

    // Install listener for enhancedAudioData events
    await page.evaluate(() => {
      window.__A4_ENHANCED_EVENTS__ = []
      const handler = (ev) => {
        try {
          const d = ev && ev.detail ? ev.detail : {}
          window.__A4_ENHANCED_EVENTS__.push({
            hasMetrics: !!d.metrics,
            hasVad: !!d.voiceActivity,
            hasEmotion: !!d.emotion,
            timestamp: d.timestamp || Date.now(),
            rms: d.metrics && typeof d.metrics.rms === 'number' ? d.metrics.rms : null
          })
        } catch {}
      }
      window.addEventListener('enhancedAudioData', handler)
      window.__A4_UNSUB_ENHANCED__ = () => window.removeEventListener('enhancedAudioData', handler)
    })

    // Enable microphone via TopToolbar button
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.some(b => b.getAttribute('title') === 'Microphone Off' || b.getAttribute('title') === 'Microphone On')
    }, { timeout: 15000 })

    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const btn = btns.find(b => b.getAttribute('title') === 'Microphone Off') || btns.find(b => b.getAttribute('title') === 'Microphone On')
      if (btn) { btn.click(); return true }
      return false
    })

    // Wait for at least one enhancedAudioData event with numeric rms
    await page.waitForFunction(() => {
      const arr = window.__A4_ENHANCED_EVENTS__
      return Array.isArray(arr) && arr.some(e => e && typeof e.rms === 'number')
    }, { timeout: 10000 })

    // Retrieve sample events
    const sample = await page.evaluate(() => {
      const arr = window.__A4_ENHANCED_EVENTS__ || []
      return arr.slice(-3)
    })

    const result = {
      agent: 'Agent 4',
      action: 'VERIFY_ENHANCED_AUDIO_EVENT',
      url,
      httpStatus: status,
      clickedToggle: clicked,
      sampleEvents: sample,
      elapsedMs: Date.now() - start,
      success: status === 200 && clicked && Array.isArray(sample) && sample.some(e => e && typeof e.rms === 'number'),
      jsErrors
    }

    console.log(JSON.stringify(result))
    process.exit(result.success ? 0 : 2)
  } catch (err) {
    const result = {
      agent: 'Agent 4',
      action: 'VERIFY_ENHANCED_AUDIO_EVENT',
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