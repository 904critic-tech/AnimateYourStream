#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function exists(p) { return fs.existsSync(p) }

function main() {
  const cwd = process.cwd()
  const slug = 'sample'
  const outDir = path.join(cwd, 'public', 'Default_Characters', 'generated', slug)

  // Clean previous
  try { fs.rmSync(outDir, { recursive: true, force: true }) } catch {}

  // Run MVP stub
  execSync('node scripts/image_to_3d/single_image_mvp.cjs --input public/favicon.ico --slug sample', { stdio: 'inherit', cwd })

  const modelPath = path.join(outDir, 'model.glb')
  const inputIco = path.join(outDir, 'input.ico')

  const ok = exists(outDir) && exists(modelPath) && exists(inputIco)
  if (!ok) {
    console.error('❌ Test failed: expected outputs missing')
    console.error({ outDirExists: exists(outDir), modelExists: exists(modelPath), inputExists: exists(inputIco) })
    process.exit(1)
  }

  console.log('✅ Test passed: outputs present')
}

main()