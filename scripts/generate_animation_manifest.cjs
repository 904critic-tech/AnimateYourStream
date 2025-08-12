// Scan public/Default_Characters for *_Animations directories and generate a manifest JSON
// Usage: node scripts/generate_animation_manifest.cjs

const fs = require('fs')
const path = require('path')

function normalizeId(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function main() {
  const root = process.cwd()
  const publicDir = path.join(root, 'public')
  const baseDir = path.join(publicDir, 'Default_Characters')
  if (!fs.existsSync(baseDir)) {
    console.error('Base directory not found:', baseDir)
    process.exit(1)
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    models: {}
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirName = entry.name
    if (!/_Animations$/i.test(dirName)) continue

    const modelName = dirName.replace(/_Animations$/i, '')
    const modelId = normalizeId(modelName)
    const absDir = path.join(baseDir, dirName)

    const files = fs
      .readdirSync(absDir)
      .filter((f) => /\.(fbx|glb|gltf)$/i.test(f))
      .map((f) => ({ name: path.parse(f).name, path: `/Default_Characters/${dirName}/${f}` }))

    if (files.length > 0) {
      manifest.models[modelId] = files
    }
  }

  const outPath = path.join(baseDir, 'animation_manifest.json')
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2))
  console.log('Wrote manifest:', outPath)
  console.log('Models:', Object.keys(manifest.models))
}

main()


