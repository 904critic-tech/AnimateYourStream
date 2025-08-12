param(
  [ValidateSet('7d','30d')][string]$Plan,
  [string]$Features = '',
  [string]$Bind = '',
  [string]$Name = ''
)

Write-Host "=== License Code Generator ===" -ForegroundColor Cyan
if (-not $Plan) {
  $Plan = Read-Host "Plan (7d or 30d)"
}
if (-not ($Plan -in @('7d','30d'))) {
  Write-Error "Plan must be 7d or 30d"; exit 2
}

if (-not (Test-Path "licenses/private_ed25519.pem")) {
  Write-Host "Private key not found. Initializing keys..." -ForegroundColor Yellow
  node scripts/licenses/init_keys.cjs | Write-Host
}

$argsList = @('--plan', $Plan)
if ($Features) { $argsList += @('--features', $Features) }
if ($Bind)     { $argsList += @('--bind', $Bind) }
if ($Name)     { $argsList += @('--name', $Name) }

Write-Host "Generating code..." -ForegroundColor Green
node scripts/licenses/generate_code.cjs @argsList


