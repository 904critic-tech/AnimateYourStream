#!/bin/bash

# 🚀 Production Deployment Script
# Agent 2 - Performance Optimization Team

set -e

echo "🚀 Starting production deployment process..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node -v)
print_status "Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not found. Installing..."
    npm ci
fi

# Step 2: Code quality checks
print_status "Running code quality checks..."

# Type checking
print_status "Running TypeScript type checking..."
npm run type-check || {
    print_error "TypeScript type checking failed!"
    exit 1
}

# Linting
print_status "Running ESLint..."
npm run lint || {
    print_error "Linting failed!"
    exit 1
}

print_success "Code quality checks passed!"

# Step 3: Production build
print_status "Building for production..."

# Clean previous build
rm -rf dist/

# Run production build
npm run build:production || {
    print_error "Production build failed!"
    exit 1
}

print_success "Production build completed!"

# Step 4: Bundle analysis
print_status "Analyzing bundle size..."

# Generate bundle analysis
npm run build:analyze > /dev/null 2>&1 || {
    print_warning "Bundle analysis failed, continuing..."
}

# Check build size
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    print_status "Total build size: $BUILD_SIZE"
    
    # Check for large chunks
    find dist/ -name "*.js" -size +500k -exec ls -lh {} \; | while read line; do
        print_warning "Large chunk detected: $line"
    done
fi

# Step 5: Performance validation
print_status "Running performance validation..."

# Start preview server for testing
print_status "Starting preview server..."
npm run preview:production &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Basic health check
if curl -f http://localhost:4173 > /dev/null 2>&1; then
    print_success "Preview server is running correctly"
else
    print_warning "Preview server health check failed"
fi

# Kill preview server
kill $SERVER_PID 2>/dev/null || true

# Step 6: Security check
print_status "Running security audit..."
npm audit --audit-level moderate || {
    print_warning "Security vulnerabilities found. Please review."
}

# Step 7: Generate deployment manifest
print_status "Generating deployment manifest..."

cat > dist/deployment-manifest.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(npm pkg get version | tr -d '"')",
  "build": {
    "nodeVersion": "$NODE_VERSION",
    "buildSize": "$BUILD_SIZE",
    "optimization": "production",
    "chunking": "advanced",
    "compression": "terser",
    "treeshaking": "enabled"
  },
  "features": {
    "pwa": true,
    "bundleAnalysis": true,
    "performanceOptimization": true,
    "adaptiveQuality": true,
    "memoryManagement": true
  },
  "agent": "Agent 2 - Performance Optimization Team"
}
EOF

# Step 8: Final deployment preparation
print_status "Preparing for deployment..."

# Create deployment package
if command -v tar &> /dev/null; then
    tar -czf "deployment-$(date +%Y%m%d-%H%M%S).tar.gz" dist/
    print_success "Deployment package created"
fi

# Generate deployment instructions
cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# 🚀 Deployment Instructions

## Build Information
- **Build Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Node Version**: $NODE_VERSION
- **Build Size**: $BUILD_SIZE
- **Agent**: Agent 2 - Performance Optimization Team

## Deployment Steps

### 1. Server Requirements
- Node.js $NODE_VERSION or higher
- Nginx or Apache for static file serving
- HTTPS certificate (recommended)

### 2. Upload Files
Upload the contents of the \`dist/\` folder to your web server.

### 3. Server Configuration

#### Nginx Configuration
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PWA service worker
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
\`\`\`

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

EOF

print_success "🎉 Deployment preparation complete!"
print_status "📁 Files ready in: ./dist/"
print_status "📋 Instructions: ./DEPLOYMENT_INSTRUCTIONS.md"
print_status "📊 Manifest: ./dist/deployment-manifest.json"

echo ""
print_success "🚀 Ready for production deployment!"
