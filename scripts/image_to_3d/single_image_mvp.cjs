#!/usr/bin/env node

// Agent 6 - Image-to-3D MVP stub
// Usage:
//   node scripts/image_to_3d/single_image_mvp.cjs --input <path-to-image> --slug <slug>
//
// This MVP stub simulates the pipeline by:
// - creating output folder under public/Default_Characters/generated/<slug>
// - copying the input image into the folder (as provided, no processing)
// - copying a base GLB (elmo_rigged.glb) as model.glb into the folder
// - regenerating the character manifest

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--input') args.input = argv[++i]
    else if (a === '--slug') args.slug = argv[++i]
  }
  return args
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function main() {
  const args = parseArgs(process.argv)
  if (!args.input || !args.slug) {
    console.error('Usage: node scripts/image_to_3d/single_image_mvp.cjs --input <path-to-image> --slug <slug>')
    process.exit(1)
  }

  const cwd = process.cwd()
  const inputPath = path.isAbsolute(args.input) ? args.input : path.join(cwd, args.input)
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  const outDir = path.join(cwd, 'public', 'Default_Characters', 'generated', args.slug)
  ensureDir(outDir)

  // Copy input image
  const imgExt = path.extname(inputPath) || '.png'
  const outImage = path.join(outDir, `input${imgExt}`)
  fs.copyFileSync(inputPath, outImage)

  // Copy base GLB as placeholder model
  const baseModel = path.join(cwd, 'public', 'Default_Characters', 'elmo_rigged.glb')
  if (!fs.existsSync(baseModel)) {
    console.error(`Base model not found: ${baseModel}`)
    process.exit(1)
  }
  const outModel = path.join(outDir, 'model.glb')
  fs.copyFileSync(baseModel, outModel)

  // Regenerate character manifest
  try {
    execSync('node scripts/generate_character_manifest.cjs', { stdio: 'inherit', cwd })
  } catch (e) {
    console.warn('Warning: Failed to regenerate character manifest. Proceeding.')
  }

  console.log('✅ Agent 6 MVP stub complete:')
  console.log(` - Output dir: ${outDir}`)
  console.log(` - Model: ${outModel}`)
  console.log(` - Image: ${outImage}`)
}

main()