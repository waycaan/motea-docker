#!/bin/bash
# Quick test script to verify Docker build works
# waycaan mit, 2025

set -e

echo "🔧 Testing Docker build fix..."

# Test basic build
echo "📦 Testing basic Docker build..."
docker build -t motea:test .

echo "✅ Docker build successful!"

# Test container startup
echo "🚀 Testing container startup..."
docker run --rm -d --name motea-test \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e DISABLE_PASSWORD=true \
  motea:test

echo "⏳ Waiting for container to start..."
sleep 30

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -f http://localhost:3001/api/health; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed!"
  docker logs motea-test
  docker stop motea-test
  exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
docker stop motea-test
docker rmi motea:test

echo "🎉 All tests passed! Docker build is working correctly."
