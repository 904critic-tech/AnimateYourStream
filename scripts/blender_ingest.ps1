param(
  [Parameter(Mandatory=$true)] [string]$ScriptPath,
  [Parameter(Mandatory=$true)] [string]$CharacterName,
  [string]$BlenderExe = "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe",
  [string]$OutDir = "C:\\Users\\shuma\\OneDrive\\Desktop\\AnimationStudioForStream\\public\\Default_Characters\\$CharacterName",
  [string]$GlbName = "character.glb",
  [string]$GltfName = "character.gltf",
  [string]$BlendName = "character.blend",
  [string]$ExtraArgs = ""
)

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$argsList = @(
  '-b',
  '-P', $ScriptPath,
  '--',
  '--output_dir', $OutDir,
  '--glb_name', $GlbName,
  '--gltf_name', $GltfName,
  '--blend_name', $BlendName
)

if ($ExtraArgs -and $ExtraArgs.Trim().Length -gt 0) {
  # Split on whitespace respecting quotes
  $ea = [System.Management.Automation.Language.Parser]::ParseInput($ExtraArgs, [ref]$null, [ref]$null).EndBlock.Statements | ForEach-Object { $_.ToString() }
  if (-not $ea -or $ea.Count -eq 0) { $ea = $ExtraArgs -split ' ' }
  $argsList += $ea
}

& $BlenderExe @argsList

if ($LASTEXITCODE -ne 0) {
  Write-Error "Blender ingestion failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host "Export complete:"
Write-Host " - $OutDir\$GlbName"
Write-Host " - $OutDir\$GltfName"
Write-Host " - $OutDir\$BlendName"


