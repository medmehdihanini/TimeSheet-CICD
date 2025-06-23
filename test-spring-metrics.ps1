#!/usr/bin/env powershell

Write-Host "Testing Spring Boot Actuator and Prometheus Integration..." -ForegroundColor Green

# Test if backend container is running
Write-Host "`nChecking backend container status..." -ForegroundColor Yellow
docker ps --filter "name=timesheet-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test Spring Boot health endpoint
Write-Host "`nTesting Spring Boot health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/actuator/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Health endpoint is accessible" -ForegroundColor Green
    $healthData = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($healthData.status)" -ForegroundColor $(if($healthData.status -eq 'UP') {'Green'} else {'Red'})
} catch {
    Write-Host "✗ Failed to access health endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Spring Boot metrics endpoint
Write-Host "`nTesting Spring Boot metrics endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/actuator/metrics" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Metrics endpoint is accessible" -ForegroundColor Green
    $metricsData = $response.Content | ConvertFrom-Json
    Write-Host "Available metrics count: $($metricsData.names.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to access metrics endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Spring Boot Prometheus endpoint
Write-Host "`nTesting Spring Boot Prometheus endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8083/actuator/prometheus" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Prometheus endpoint is accessible" -ForegroundColor Green
    $prometheusMetrics = $response.Content -split "`n" | Where-Object { $_ -match "^jvm_" -and $_ -notmatch "^#" }
    if ($prometheusMetrics.Count -gt 0) {
        Write-Host "JVM metrics found:" -ForegroundColor Green
        $prometheusMetrics | Select-Object -First 5 | ForEach-Object { Write-Host "  $_" }
        Write-Host "  ... and $($prometheusMetrics.Count - 5) more JVM metrics" -ForegroundColor Gray
    } else {
        Write-Host "No JVM metrics found in Prometheus endpoint" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to access Prometheus endpoint: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Prometheus connection to backend
Write-Host "`nTesting Prometheus connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Prometheus is accessible" -ForegroundColor Green
    $targetsData = $response.Content | ConvertFrom-Json
    $backendTarget = $targetsData.data.activeTargets | Where-Object { $_.job -eq "timesheet-backend" }
    if ($backendTarget) {
        Write-Host "Backend target status: $($backendTarget.health)" -ForegroundColor $(if($backendTarget.health -eq 'up') {'Green'} else {'Red'})
        Write-Host "Backend target URL: $($backendTarget.scrapeUrl)" -ForegroundColor Gray
        if ($backendTarget.lastError) {
            Write-Host "Last error: $($backendTarget.lastError)" -ForegroundColor Red
        }
    } else {
        Write-Host "Backend target not found in Prometheus" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to access Prometheus: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Grafana connection
Write-Host "`nTesting Grafana connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Grafana is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to access Grafana: $($_.Exception.Message)" -ForegroundColor Red
}

# Check backend container logs for any errors
Write-Host "`nChecking backend container logs for errors..." -ForegroundColor Yellow
try {
    $logs = docker logs timesheet-backend --tail 50 2>&1
    $errors = $logs | Where-Object { $_ -match "ERROR|Exception|Failed" }
    if ($errors) {
        Write-Host "Recent errors found:" -ForegroundColor Red
        $errors | Select-Object -First 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    } else {
        Write-Host "No recent errors found in logs" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not retrieve backend logs" -ForegroundColor Yellow
}

Write-Host "`nTest completed!" -ForegroundColor Green
Write-Host "`nNext steps if issues found:" -ForegroundColor Yellow
Write-Host "1. Rebuild and restart the backend: docker-compose up --build -d backend" -ForegroundColor Gray
Write-Host "2. Check container logs: docker logs timesheet-backend" -ForegroundColor Gray
Write-Host "3. Verify Prometheus config: docker logs timesheet-prometheus" -ForegroundColor Gray
