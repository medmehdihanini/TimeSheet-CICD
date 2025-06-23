#!/usr/bin/env powershell

Write-Host "Testing Nginx Status Endpoint and Nginx Exporter..." -ForegroundColor Green

# Test if frontend container is running
Write-Host "`nChecking frontend container status..." -ForegroundColor Yellow
docker ps --filter "name=timesheet-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test nginx status endpoint directly
Write-Host "`nTesting nginx status endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200/nginx_status" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Nginx status endpoint is accessible" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "✗ Failed to access nginx status endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Test nginx exporter metrics
Write-Host "`nTesting nginx exporter metrics..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9113/metrics" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Nginx exporter is accessible" -ForegroundColor Green
    # Show just the nginx-specific metrics
    $metrics = $response.Content -split "`n" | Where-Object { $_ -match "^nginx_" -and $_ -notmatch "^#" }
    if ($metrics.Count -gt 0) {
        Write-Host "Nginx metrics found:" -ForegroundColor Green
        $metrics | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
        if ($metrics.Count -gt 10) {
            Write-Host "  ... and $($metrics.Count - 10) more metrics" -ForegroundColor Gray
        }
    } else {
        Write-Host "No nginx metrics found in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to access nginx exporter metrics: $($_.Exception.Message)" -ForegroundColor Red
}

# Check nginx exporter container logs
Write-Host "`nChecking nginx exporter container logs..." -ForegroundColor Yellow
try {
    $logs = docker logs timesheet-nginx-exporter --tail 20 2>&1
    if ($logs) {
        Write-Host "Recent nginx exporter logs:" -ForegroundColor Gray
        $logs | ForEach-Object { Write-Host "  $_" }
    }
} catch {
    Write-Host "Could not retrieve nginx exporter logs" -ForegroundColor Yellow
}

Write-Host "`nTest completed!" -ForegroundColor Green
