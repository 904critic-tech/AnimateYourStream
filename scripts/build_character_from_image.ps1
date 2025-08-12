param(
  [Parameter(Mandatory=$true)] [string]$ImagePath,
  [Parameter(Mandatory=$true)] [string]$CharacterName,
  [string]$OutDir = "public/Default_Characters/$CharacterName",
  [string]$TmpDir = ".tmp/character_build/$CharacterName"
)

$ErrorActionPreference = 'Stop'

New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# 1) Generate 3D mesh from image using TripoSR (requires python env with triposr installed)
Write-Host "[1/3] Generating 3D scan from image via TripoSR..."

$py = @'
import sys, os
from pathlib import Path
img_path, tmp_dir = sys.argv[1], sys.argv[2]
os.makedirs(tmp_dir, exist_ok=True)
scan_obj = os.path.join(tmp_dir, 'scan.obj')
scan_glb = os.path.join(tmp_dir, 'scan.glb')

try:
    from PIL import Image
    import trimesh
    try:
        from triposr import TripoSR
    except Exception as e:
        print('[TripoSR] Import failed:', e)
        print('Install with: pip install triposr  (or) pip install git+https://github.com/isl-org/TripoSR.git')
        sys.exit(2)

    model = TripoSR()
    mesh = model(Image.open(img_path))
    mesh.export(scan_obj)
    mesh.export(scan_glb)
    print('[TripoSR] Exported:', scan_obj, scan_glb)
except Exception as e:
    print('[TripoSR] Generation failed:', e)
    sys.exit(1)
'@

python - <<$py "$ImagePath" "$TmpDir"

if ($LASTEXITCODE -ne 0) {
  Write-Error "TripoSR generation failed (exit $LASTEXITCODE). Ensure Python env and 'triposr' are installed."
  exit $LASTEXITCODE
}

# 2) Rig in Blender and export GLB/glTF into public directory
Write-Host "[2/3] Rigging scan and exporting GLB via Blender..."
$scan = Join-Path (Resolve-Path $TmpDir) 'scan.glb'
pwsh -File scripts/blender_ingest.ps1 `
  -ScriptPath "scripts\blender_rig_from_scan.py" `
  -CharacterName "$CharacterName" `
  -GlbName "$CharacterName.glb" `
  -GltfName "$CharacterName.gltf" `
  -BlendName "$CharacterName.blend" `
  -OutDir  (Resolve-Path $OutDir) `
  -ExtraArgs "--scan_path `"$scan`""

if ($LASTEXITCODE -ne 0) {
  Write-Error "Blender rig/export failed (exit $LASTEXITCODE)."
  exit $LASTEXITCODE
}

# 3) Refresh manifest
Write-Host "[3/3] Refreshing character manifest..."
npm run post-ingest | Out-Null

Write-Host "Done. Served at: /Default_Characters/$CharacterName/$CharacterName.glb"

