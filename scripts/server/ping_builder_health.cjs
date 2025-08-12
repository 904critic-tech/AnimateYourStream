#!/usr/bin/env node
// Simple health pinger for the local builder service. Intended for Cursor background agents.

const http = require('http')

const PORT = process.env.BUILDER_PORT ? Number(process.env.BUILDER_PORT) : 4001
const HOST = process.env.BUILDER_HOST || '127.0.0.1'
const URL = `http://${HOST}:${PORT}/health`

function pingOnce() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      let body = ''
      res.on('data', (c) => (body += String(c)))
      res.on('end', () => {
        try {
          const json = JSON.parse(body || '{}')
          const ok = json && json.ok === true
          console.log(`[builder-health] ${ok ? 'OK' : 'NOT OK'} ${URL} pid=${json.pid ?? 'n/a'}`)
        } catch {
          console.log(`[builder-health] MALFORMED ${URL} status=${res.statusCode}`)
        }
        resolve()
      })
    })
    req.on('error', (err) => {
      console.log(`[builder-health] DOWN ${URL} error=${err.code || err.message}`)
      resolve()
    })
    req.setTimeout(5000, () => {
      console.log(`[builder-health] TIMEOUT ${URL}`)
      req.destroy()
      resolve()
    })
  })
}

async function main() {
  const intervalMs = Number(process.env.BUILDER_HEALTH_INTERVAL_MS || 10000)
  console.log(`[builder-health] monitoring ${URL} every ${intervalMs}ms`)
  const runOnce = process.env.RUN_ONCE === '1' || process.env.RUN_ONCE === 'true'
  if (runOnce) {
    try { await pingOnce() } catch {}
    return
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try { await pingOnce() } catch {}
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

main()


