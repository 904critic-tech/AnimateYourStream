#!/usr/bin/env node

// Agent 6 - Builder MVP endpoint test
// Starts only if a builder is already running (does not start/stop it)

const fs = require('fs')
const path = require('path')

async function main() {
  try {
    const builderUrl = process.env.VITE_BUILDER_URL || 'http://127.0.0.1:4001'

    // Health check
    const healthResp = await fetch(`${builderUrl}/health`).catch(() => null)
    if (!healthResp || !healthResp.ok) {
      console.error('❌ Builder health failed or builder is not running at', builderUrl)
      process.exit(2)
    }
    const health = await healthResp.json()
    console.log('HEALTH_OK', health)

    // Prepare form
    const form = new FormData()
    const imagePath = path.join(process.cwd(), 'public', 'favicon.ico')
    form.append('image', new Blob([fs.readFileSync(imagePath)]), 'favicon.ico')
    form.append('slug', 'sample_test')

    // Call MVP endpoint
    const resp = await fetch(`${builderUrl}/api/image3d/mvp`, { method: 'POST', body: form })
    if (!resp.ok) {
      console.error('❌ MVP upload failed with status', resp.status)
      process.exit(3)
    }
    const json = await resp.json()
    console.log('MVP_RESP', json)

    // Verify outputs exist
    const outDir = path.join(process.cwd(), 'public', 'Default_Characters', 'generated', 'sample_test')
    const modelPath = path.join(outDir, 'model.glb')
    const imgPath = path.join(outDir, 'input.ico')
    const ok = fs.existsSync(outDir) && fs.existsSync(modelPath) && fs.existsSync(imgPath)
    if (!ok) {
      console.error('❌ Outputs missing under', outDir)
      console.error('Exists:', { outDir: fs.existsSync(outDir), model: fs.existsSync(modelPath), image: fs.existsSync(imgPath) })
      process.exit(4)
    }
    console.log('✅ Builder MVP test passed')
  } catch (e) {
    console.error('❌ Test error:', e && e.message || e)
    process.exit(1)
  }
}

main()