#!/usr/bin/env node
/*
 * Agent 1 - Suggestion Rate Limiting Test (Headless)
 * - Navigates to the app (default http://localhost:3001)
 * - Listens to `ai:suggestion` events and records timestamps
 * - Dispatches bursts of `ai:interaction` events (hover/click)
 * - Verifies suggestion count does not exceed expected ceiling based on interval
 *
 * NOTE: This script DOES NOT start/stop the server. Log server access per protocol before running.
 */

const puppeteer = require('puppeteer')

async function run() {
  const url = process.env.APP_URL || 'http://localhost:3001'
  const testDurationMs = Number(process.env.TEST_DURATION_MS || 12000)
  const interactionBurstMs = Number(process.env.BURST_MS || 4000)

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)

  // Capture ai:suggestion events
  await page.exposeFunction('pushSuggestionEvent', (payload) => {
    // no-op in Node; values collected via page.evaluate
  })

  const client = await page.target().createCDPSession()
  await client.send('Page.enable')

  const suggestions = []

  await page.exposeFunction('recordSuggestion', (detail) => {
    suggestions.push({ t: Date.now(), detail })
  })

  await page.goto(url, { waitUntil: 'domcontentloaded' })

  // Attach listener in page context
  await page.evaluate(() => {
    // Guard missing CustomEvent
    if (typeof window !== 'undefined') {
      window.addEventListener('ai:suggestion', (ev) => {
        // @ts-ignore
        const d = ev?.detail || {}
        // @ts-ignore
        window.recordSuggestion && window.recordSuggestion({ name: d.name, weight: d.weight })
      })
    }
  })

  // Ensure suggestions are enabled and set interval via UI store
  await page.evaluate(() => {
    // @ts-ignore
    const s = window.useAppStore ? window.useAppStore.getState() : null
    if (s && s.setAiSuggestionsEnabled && s.setAiSuggestionIntervalMs) {
      s.setAiSuggestionsEnabled(true)
      s.setAiSuggestionIntervalMs(4000)
    }
  })

  // Dispatch interaction bursts for a window
  const start = Date.now()
  const burstEnd = start + interactionBurstMs
  while (Date.now() < burstEnd) {
    await page.evaluate(() => {
      try { window.dispatchEvent(new CustomEvent('ai:interaction', { detail: { type: 'hover' } })) } catch {}
      try { window.dispatchEvent(new CustomEvent('ai:interaction', { detail: { type: 'click' } })) } catch {}
    })
    await new Promise(r => setTimeout(r, 100))
  }

  // Let system run until testDurationMs
  const remaining = Math.max(0, start + testDurationMs - Date.now())
  if (remaining > 0) await new Promise(r => setTimeout(r, remaining))

  // Collect results
  const intervalMs = await page.evaluate(() => {
    // @ts-ignore
    const s = window.useAppStore ? window.useAppStore.getState() : null
    return s?.aiSuggestionIntervalMs ?? 4000
  })

  await browser.close()

  // Expectation: Not more than ceil(testDurationMs / intervalMs) + 1
  const expectedMax = Math.ceil(testDurationMs / intervalMs) + 1
  const actual = suggestions.length

  console.log(`Suggestions observed: ${actual}`)
  console.log(`Interval: ${intervalMs}ms, Test Duration: ${testDurationMs}ms, Expected Max: ${expectedMax}`)

  if (actual <= expectedMax) {
    console.log('✅ PASS - Suggestion rate is within expected bounds')
    process.exit(0)
  } else {
    console.error('❌ FAIL - Suggestion rate exceeded expected bounds')
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('❌ Test error:', err)
  process.exit(1)
})