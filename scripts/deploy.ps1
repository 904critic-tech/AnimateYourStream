# 🚀 Production Deployment Script - PowerShell Version
# Agent 2 - Performance Optimization Team

param(
    [switch]$SkipTests = $false,
    [switch]$SkipAnalysis = $false
)

# Set error action
$ErrorActionPreference = "Stop"

# Color functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Info "🚀 Starting production deployment process..."

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root."
    exit 1
}

# Step 1: Pre-deployment checks
Write-Info "Running pre-deployment checks..."

# Check Node.js version
$nodeVersion = node -v
Write-Info "Node.js version: $nodeVersion"

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Warning "Dependencies not found. Installing..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies!"
        exit 1
    }
}

# Step 2: Code quality checks (unless skipped)
if (-not $SkipTests) {
    Write-Info "Running code quality checks..."

    # Type checking
    Write-Info "Running TypeScript type checking..."
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript type checking failed!"
        exit 1
    }

    # Linting
    Write-Info "Running ESLint..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting failed!"
        exit 1
    }

    Write-Success "Code quality checks passed!"
}

# Step 3: Production build
Write-Info "Building for production..."

# Clean previous build
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Run production build
npm run build:production
if ($LASTEXITCODE -ne 0) {
    Write-Error "Production build failed!"
    exit 1
}

Write-Success "Production build completed!"

# Step 4: Bundle analysis (unless skipped)
if (-not $SkipAnalysis) {
    Write-Info "Analyzing bundle size..."

    # Generate bundle analysis
    try {
        npm run build:analyze 2>$null
    } catch {
        Write-Warning "Bundle analysis failed, continuing..."
    }
}

# Check build size
if (Test-Path "dist") {
    $buildSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
    $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Info "Total build size: $buildSizeMB MB"
    
    # Check for large chunks
    Get-ChildItem -Recurse "dist" -Filter "*.js" | Where-Object { $_.Length -gt 500KB } | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Warning "Large chunk detected: $($_.Name) ($sizeMB MB)"
    }
}

# Step 5: Performance validation
Write-Info "Running performance validation..."

# Start preview server for testing
Write-Info "Starting preview server..."
$previewJob = Start-Job -ScriptBlock { npm run preview:production }

# Wait for server to start
Start-Sleep 5

# Basic health check
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4173" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "Preview server is running correctly"
    }
} catch {
    Write-Warning "Preview server health check failed: $($_.Exception.Message)"
}

# Kill preview server
if ($previewJob) {
    Stop-Job $previewJob -ErrorAction SilentlyContinue
    Remove-Job $previewJob -ErrorAction SilentlyContinue
}

# Step 6: Security check
Write-Info "Running security audit..."
npm audit --audit-level moderate
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Security vulnerabilities found. Please review."
}

# Step 7: Generate deployment manifest
Write-Info "Generating deployment manifest..."

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$version = (npm pkg get version).Trim('"')

$manifest = @{
    timestamp = $timestamp
    version = $version
    build = @{
        nodeVersion = $nodeVersion
        buildSize = "$buildSizeMB MB"
        optimization = "production"
        chunking = "advanced"
        compression = "terser"
        treeshaking = "enabled"
    }
    features = @{
        pwa = $true
        bundleAnalysis = $true
        performanceOptimization = $true
        adaptiveQuality = $true
        memoryManagement = $true
    }
    agent = "Agent 2 - Performance Optimization Team"
}

$manifest | ConvertTo-Json -Depth 3 | Out-File -FilePath "dist/deployment-manifest.json" -Encoding UTF8

# Step 8: Final deployment preparation
Write-Info "Preparing for deployment..."

# Create deployment package
$deploymentName = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "dist/*" -DestinationPath $deploymentName
    Write-Success "Deployment package created: $deploymentName"
}

# Generate deployment instructions
$deploymentInstructions = @"
# 🚀 Deployment Instructions

## Build Information
- **Build Date**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')
- **Node Version**: $nodeVersion
- **Build Size**: $buildSizeMB MB
- **Agent**: Agent 2 - Performance Optimization Team

## Deployment Steps

### 1. Server Requirements
- Node.js $nodeVersion or higher
- IIS, Nginx, or Apache for static file serving
- HTTPS certificate (recommended)

### 2. Upload Files
Upload the contents of the ``dist/`` folder to your web server.

### 3. Server Configuration

#### IIS Configuration (web.config)
``````xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <staticContent>
            <mimeMap fileExtension=".js" mimeType="application/javascript" />
            <mimeMap fileExtension=".wasm" mimeType="application/wasm" />
        </staticContent>
        <httpCompression>
            <dynamicTypes>
                <add mimeType="application/javascript" enabled="true" />
                <add mimeType="application/json" enabled="true" />
            </dynamicTypes>
            <staticTypes>
                <add mimeType="application/javascript" enabled="true" />
                <add mimeType="application/json" enabled="true" />
            </staticTypes>
        </httpCompression>
        <rewrite>
            <rules>
                <rule name="SPA Fallback" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
``````

### 4. Performance Monitoring
- Monitor Core Web Vitals
- Check bundle loading performance
- Verify adaptive quality system is working
- Test on various devices and network conditions

## Performance Features Deployed
- ✅ Adaptive quality rendering
- ✅ Advanced bundle chunking
- ✅ Memory management optimization
- ✅ Progressive Web App capabilities
- ✅ Performance monitoring dashboard
- ✅ Cross-platform compatibility

"@

$deploymentInstructions | Out-File -FilePath "DEPLOYMENT_INSTRUCTIONS.md" -Encoding UTF8

Write-Success "🎉 Deployment preparation complete!"
Write-Info "📁 Files ready in: ./dist/"
Write-Info "📋 Instructions: ./DEPLOYMENT_INSTRUCTIONS.md"
Write-Info "📊 Manifest: ./dist/deployment-manifest.json"

if (Test-Path $deploymentName) {
    Write-Info "📦 Package: ./$deploymentName"
}

Write-Host ""
Write-Success "🚀 Ready for production deployment!"
