# Quick test script to verify Docker build works (PowerShell version)
# waycaan mit, 2025

Write-Host "🔧 Testing Docker build fix..." -ForegroundColor Blue

try {
    # Test basic build
    Write-Host "📦 Testing basic Docker build..." -ForegroundColor Yellow
    docker build -t motea:test .
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
    
    Write-Host "✅ Docker build successful!" -ForegroundColor Green
    
    # Test container startup
    Write-Host "🚀 Testing container startup..." -ForegroundColor Yellow
    docker run --rm -d --name motea-test `
      -p 3001:3000 `
      -e NODE_ENV=production `
      -e DISABLE_PASSWORD=true `
      motea:test
    
    if ($LASTEXITCODE -ne 0) {
        throw "Container startup failed"
    }
    
    Write-Host "⏳ Waiting for container to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Test health endpoint
    Write-Host "🏥 Testing health endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health check passed!" -ForegroundColor Green
        } else {
            throw "Health check returned status: $($response.StatusCode)"
        }
    } catch {
        Write-Host "❌ Health check failed: $_" -ForegroundColor Red
        docker logs motea-test
        docker stop motea-test
        docker rmi motea:test
        exit 1
    }
    
    # Cleanup
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    docker stop motea-test
    docker rmi motea:test
    
    Write-Host "🎉 All tests passed! Docker build is working correctly." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Test failed: $_" -ForegroundColor Red
    # Cleanup on failure
    try {
        docker stop motea-test 2>$null
        docker rmi motea:test 2>$null
    } catch {
        # Ignore cleanup errors
    }
    exit 1
}
