// Scan public/Default_Characters for per-character folders with .glb/.gltf
// Usage: node scripts/generate_character_manifest.cjs

const fs = require('fs')
const path = require('path')

function normalizeId(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9_]/g, '')
}

const root = process.cwd()
const baseDir = path.join(root, 'public', 'Default_Characters')
if (!fs.existsSync(baseDir)) {
  console.error('Base directory not found:', baseDir)
  process.exit(1)
}

const characters = []

for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const charDir = path.join(baseDir, entry.name)
  const files = fs.readdirSync(charDir)

  const glb = files.find(f => /\.glb$/i.test(f))
  const gltf = files.find(f => /\.gltf$/i.test(f))
  const chosen = glb || gltf
  if (!chosen) continue

  const id = normalizeId(entry.name)
  characters.push({
    id,
    name: entry.name.replace(/_/g, ' '),
    category: 'Custom',
    modelPath: `/Default_Characters/${entry.name}/${chosen}`
  })
}

const outPath = path.join(baseDir, 'character_manifest.json')
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), characters }, null, 2))
console.log('Wrote manifest:', outPath)
console.log('Characters:', characters.map(c => c.id))


