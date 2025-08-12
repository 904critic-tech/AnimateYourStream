#!/usr/bin/env node
// Agent 4 - Verify UI shows 'Audio Level (Mic off)' and 0% when mic is disabled (Read-only)

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

    // Ensure mic is OFF
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.some(b => b.getAttribute('title') === 'Microphone Off' || b.getAttribute('title') === 'Microphone On')
    }, { timeout: 15000 })

    // If currently On, click to turn Off
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const onBtn = btns.find(b => b.getAttribute('title') === 'Microphone On')
      if (onBtn) (onBtn).click()
    })

    // Click the Lip Sync tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const lipBtn = btns.find(b => b.textContent && /\bLip\s*Sync\b/i.test(b.textContent))
      if (lipBtn) (lipBtn).click()
    })

    // Wait for UI to reflect mic off within the Lip Sync tab
    await page.waitForFunction(() => {
      const labels = Array.from(document.querySelectorAll('label, span, div'))
      const labelOk = labels.some(el => el.textContent && /Audio Level \(Mic off\)/i.test(el.textContent))
      const percentOk = labels.some(el => el.textContent && /\b0%\b/.test(el.textContent))
      return labelOk && percentOk
    }, { timeout: 10000 })

    // Extract summary
    const summary = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label, span, div'))
      const labelText = (labels.find(el => el.textContent && /Audio Level \(Mic off\)/i.test(el.textContent)) || {}).textContent || ''
      const percentText = (labels.find(el => el.textContent && /\b0%\b/.test(el.textContent)) || {}).textContent || ''
      return { labelText, percentText }
    })

    const result = {
      agent: 'Agent 4',
      action: 'VERIFY_UI_MIC_OFF_LABEL',
      url,
      httpStatus: status,
      labelText: summary.labelText,
      percentText: summary.percentText,
      elapsedMs: Date.now() - start,
      success: status === 200 && /Audio Level \(Mic off\)/i.test(summary.labelText || '') && /\b0%\b/.test(summary.percentText || ''),
      jsErrors
    }

    console.log(JSON.stringify(result))
    process.exit(result.success ? 0 : 2)
  } catch (err) {
    const result = {
      agent: 'Agent 4',
      action: 'VERIFY_UI_MIC_OFF_LABEL',
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