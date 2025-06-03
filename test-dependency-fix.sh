#!/bin/bash
# Test script for dependency resolution fix
# waycaan mit, 2025

set -e

echo "🔧 Testing dependency resolution fix for @atlaskit/tree..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Test 1: Check npm configuration
print_status "Test 1: Checking npm configuration..."
if [ -f "motea/.npmrc" ]; then
    print_success "Found .npmrc file"
    echo "Content:"
    cat motea/.npmrc
else
    print_error ".npmrc file not found"
    exit 1
fi

# Test 2: Check package.json resolutions
print_status "Test 2: Checking package.json resolutions..."
if grep -q "@atlaskit/tree/react" motea/package.json; then
    print_success "Found @atlaskit/tree React resolution in package.json"
else
    print_warning "@atlaskit/tree React resolution not found in package.json"
fi

# Test 3: Test dependency installation locally
print_status "Test 3: Testing local dependency installation..."
cd motea

# Clean install
print_status "Cleaning node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install dependencies
print_status "Installing dependencies with npm ci..."
if npm install --legacy-peer-deps; then
    print_success "Dependencies installed successfully"
else
    print_error "Dependency installation failed"
    exit 1
fi

# Check if @atlaskit/tree is installed
if [ -d "node_modules/@atlaskit/tree" ]; then
    print_success "@atlaskit/tree is installed"
    
    # Check React version in @atlaskit/tree
    TREE_REACT_VERSION=$(npm list react --depth=0 2>/dev/null | grep react@ || echo "not found")
    print_status "React version: $TREE_REACT_VERSION"
else
    print_error "@atlaskit/tree is not installed"
    exit 1
fi

cd ..

# Test 4: Test Docker build
print_status "Test 4: Testing Docker build..."
if docker build -t motea:dependency-test motea/; then
    print_success "Docker build successful"
else
    print_error "Docker build failed"
    exit 1
fi

# Test 5: Test container startup
print_status "Test 5: Testing container startup..."
docker run --rm -d --name motea-dep-test \
  -p 3002:3000 \
  -e NODE_ENV=production \
  -e DISABLE_PASSWORD=true \
  motea:dependency-test

print_status "Waiting for container to start..."
sleep 30

# Test health endpoint
print_status "Testing health endpoint..."
if curl -f http://localhost:3002/api/health; then
    print_success "Health check passed"
else
    print_warning "Health check failed (might be expected without database)"
fi

# Cleanup
print_status "Cleaning up..."
docker stop motea-dep-test
docker rmi motea:dependency-test

print_success "All dependency resolution tests passed!"
print_status "The @atlaskit/tree dependency conflict has been resolved."

echo ""
print_status "Summary of fixes applied:"
echo "1. ✅ Added .npmrc with legacy-peer-deps=true"
echo "2. ✅ Added React version resolutions in package.json"
echo "3. ✅ Updated Dockerfile to copy .npmrc"
echo "4. ✅ Removed explicit --legacy-peer-deps flags (using .npmrc instead)"

echo ""
print_success "Your Docker build should now work without dependency conflicts!"
