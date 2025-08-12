## Blender → GLB Ingest: Fully Automated Pipeline (Local Dev)

This guide shows how to run Blender scripts headlessly, export GLB/glTF directly into the app's `public/Default_Characters/<CharacterName>/` folder, and auto-register new characters in the UI via a generated manifest.

### Requirements
- Blender 4.5 installed (default path used below)
- PowerShell 7 (pwsh)
- Node.js/npm

---

## 1) Make your Blender script accept CLI arguments

Add these helpers near the top of your Blender script and use them to override output paths and filenames when called from the runner.

```python
import sys, os

def get_cli_arg(name, default=None):
    try:
        if '--' in sys.argv:
            i = sys.argv.index('--') + 1
            args = sys.argv[i:]
            for j in range(len(args) - 1):
                if args[j] == f'--{name}':
                    return args[j+1]
    except:
        pass
    return default

# Example usage with your existing config variables
# (Keep your original defaults, then allow override via CLI)
OUTPUT_DIR = get_cli_arg('output_dir', OUTPUT_DIR)
BLEND_NAME = get_cli_arg('blend_name', BLEND_NAME)
GLB_NAME   = get_cli_arg('glb_name', GLB_NAME)
GLTF_NAME  = get_cli_arg('gltf_name', GLTF_NAME)
```

Tip: Ensure Principled BSDF inputs use exact names: "Emission" and "Emission Strength".

---

## 2) Headless Blender runner (PowerShell)

Create `scripts/blender_ingest.ps1` (PowerShell 7):

```powershell
param(
  [Parameter(Mandatory=$true)] [string]$ScriptPath,
  [Parameter(Mandatory=$true)] [string]$CharacterName,
  [string]$BlenderExe = "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
  [string]$OutDir = "C:\Users\shuma\OneDrive\Desktop\AnimationStudioForStream\public\Default_Characters\$CharacterName",
  [string]$GlbName = "character.glb",
  [string]$GltfName = "character.gltf",
  [string]$BlendName = "character.blend"
)

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

& $BlenderExe -b -P $ScriptPath -- --output_dir $OutDir --glb_name $GlbName --gltf_name $GltfName --blend_name $BlendName

if ($LASTEXITCODE -ne 0) {
  Write-Error "Blender ingestion failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host "Export complete:" 
Write-Host " - $OutDir\$GlbName"
Write-Host " - $OutDir\$GltfName"
Write-Host " - $OutDir\$BlendName"
```

Usage example:

```powershell
pwsh -File scripts/blender_ingest.ps1 -ScriptPath "Default_Characters\CRZ_9_Fortnite\your_script.py" -CharacterName "CRZ_9_Fortnite" -GlbName "cyberpunk_idle.glb" -GltfName "cyberpunk_idle.gltf" -BlendName "cyberpunk_idle.blend"
```

---

## 3) Auto-generate a character manifest from `public/Default_Characters`

Create `scripts/generate_character_manifest.cjs`:

```js
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
```

This writes `public/Default_Characters/character_manifest.json` with an array of characters.

---

## 4) npm scripts glue

Add these to `package.json` → `scripts`:

```json
{
  "scripts": {
    "ingest:blender": "pwsh -File scripts/blender_ingest.ps1 -ScriptPath \"Default_Characters/CRZ_9_Fortnite/your_script.py\" -CharacterName \"CRZ_9_Fortnite\" -GlbName \"cyberpunk_idle.glb\" -GltfName \"cyberpunk_idle.gltf\" -BlendName \"cyberpunk_idle.blend\"",
    "manifest:characters": "node scripts/generate_character_manifest.cjs",
    "post-ingest": "npm run manifest:characters"
  }
}
```

You can customize `ingest:blender` per script/character, or parameterize via your CI/local scripts.

---

## 5) App integration (load manifest instead of hardcoded arrays)

Update your Zustand store to hold characters and load the manifest once.

```ts
// types
type Character = { id: string; name: string; category: string; modelPath: string }

// in your store interface
characters: Character[]
setCharacters: (chars: Character[]) => void
loadCharactersManifest: () => Promise<void>

// implementation in store creation
characters: [],
setCharacters: (chars) => set({ characters: chars }),
loadCharactersManifest: async () => {
  try {
    const res = await fetch('/Default_Characters/character_manifest.json')
    if (!res.ok) return
    const data = await res.json()
    set({ characters: Array.isArray(data.characters) ? data.characters : [] })
  } catch {}
}
```

Then in `src/components/UI/LeftPanel.tsx`:

```ts
const { characters, loadCharactersManifest } = useAppStore()

useEffect(() => {
  loadCharactersManifest()
}, [loadCharactersManifest])

// If you want to keep legacy presets, merge here
const legacyPresets = [] // optional existing entries
const allCharacters = [...legacyPresets, ...characters]

// Use allCharacters instead of the hardcoded mockCharacters
```

And in `src/core/SandboxModelViewer.tsx` (on model selection):

```ts
const { characters } = useAppStore.getState()
const selected = characters.find(c => c.id === currentModel)
if (selected) {
  loadModel(selected.modelPath)
}
```

This removes the need to edit code for each new character export.

---

## 6) Usage flow

1) Author or place your Blender script in `Default_Characters/<CharacterName>/your_script.py`.
2) Run (from project root):

```powershell
npm run ingest:blender
npm run post-ingest
```

3) Refresh the app. The new character appears under your character list and loads from `/Default_Characters/<CharacterName>/<file>.glb`.

---

## Troubleshooting

- 404 on GLB: Ensure the file exists under `public/Default_Characters/<CharacterName>/<file>.glb`. The web server only serves from `public/`.
- Blender error KeyError: "Emision": Use exact inputs: `Emission`, `Emission Strength` on Principled BSDF.
- Invisible model: Open the GLB in a glTF viewer. If it’s tiny or off-camera, verify export scale/origin. The provided Blender script sets origin to mesh bottom and normalizes scale in the viewer.
- Performance: Prefer GLB over GLTF; keep meshes and textures light for web.

---

## Optional enhancements

- Add a file watcher to regenerate the manifest when GLBs change:
```bash
npx chokidar "public/Default_Characters/**/*.{glb,gltf}" -c "node scripts/generate_character_manifest.cjs"
```
- Per-character metadata: Write `meta.json` next to the GLB and merge it in the generator for categories, thumbnails, etc.

---

## Quick reference

- Run headless Blender export:
```powershell
pwsh -File scripts/blender_ingest.ps1 -ScriptPath "Default_Characters\CRZ_9_Fortnite\your_script.py" -CharacterName "CRZ_9_Fortnite" -GlbName "cyberpunk_idle.glb" -GltfName "cyberpunk_idle.gltf" -BlendName "cyberpunk_idle.blend"
```
- Regenerate characters manifest:
```bash
node scripts/generate_character_manifest.cjs
```
- Load any GLB manually in app console:
```js
window.sandboxModelViewer.loadModel('/Default_Characters/CRZ_9_Fortnite/cyberpunk_idle.glb','cyberpunk_idle.glb')
```


