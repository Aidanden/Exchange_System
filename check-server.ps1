# Check if server is running and start it if needed
Write-Host "Checking server status..." -ForegroundColor Yellow

# Check if server is running on port 8001
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is running and responding" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Server is not responding" -ForegroundColor Red
    Write-Host "Starting server..." -ForegroundColor Yellow
    
    # Navigate to server directory and start the server
    Set-Location "g:\ExchangeSystem\server"
    
    # Check if node_modules exists
    if (!(Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Start the server
    Write-Host "Starting server with npm run dev..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    # Wait a moment and check again
    Start-Sleep -Seconds 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Server started successfully!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Server may still be starting. Please wait a moment and try again." -ForegroundColor Yellow
    }
}
