# PowerShell script to deploy the timesheet stack

# Get the host IP automatically
$HOST_IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress | Select-Object -First 1

if (-not $HOST_IP) {
    # Alternative method
    $HOST_IP = (Get-NetIPConfiguration | Where-Object {$_.NetAdapter.Status -eq "Up" -and $_.IPv4Address.IPAddress -notlike "127.*"}).IPv4Address.IPAddress | Select-Object -First 1
}

if (-not $HOST_IP) {
    $HOST_IP = Read-Host "Could not determine host IP automatically. Please enter your host IP address"
}

Write-Host "Using host IP: $HOST_IP" -ForegroundColor Green

# Set environment variable
$env:HOST_IP = $HOST_IP

Write-Host "Starting the timesheet application stack..." -ForegroundColor Yellow
Write-Host "Frontend will be available at: http://$HOST_IP:4200"
Write-Host "Backend will be available at: http://$HOST_IP:8083"
Write-Host "Prometheus will be available at: http://$HOST_IP:9090"
Write-Host "Grafana will be available at: http://$HOST_IP:3000"

# Start the services
docker-compose down
docker-compose up --build -d

Write-Host ""
Write-Host "Services are starting up..." -ForegroundColor Yellow
Write-Host "Waiting for services to become healthy..."

# Wait for backend to be ready
Write-Host "Waiting for backend..." -ForegroundColor Cyan
$timeout = 120
$counter = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8083/actuator/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend is ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "Backend not ready yet... waiting ($counter/$timeout)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $counter += 5
    }
} while ($counter -lt $timeout)

# Wait for frontend to be ready
Write-Host "Waiting for frontend..." -ForegroundColor Cyan
$counter = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Frontend is ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "Frontend not ready yet... waiting ($counter/$timeout)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $counter += 5
    }
} while ($counter -lt $timeout)

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor White
Write-Host "  Frontend: http://$HOST_IP:4200" -ForegroundColor Cyan
Write-Host "  Backend API: http://$HOST_IP:8083" -ForegroundColor Cyan
Write-Host "  Prometheus: http://$HOST_IP:9090" -ForegroundColor Cyan
Write-Host "  Grafana: http://$HOST_IP:3000 (admin/admin)" -ForegroundColor Cyan
Write-Host ""
Write-Host "For external access, make sure to:" -ForegroundColor Yellow
Write-Host "1. Configure Windows Firewall to allow these ports"
Write-Host "2. Share this IP ($HOST_IP) with your friend"
Write-Host ""

# Configure Windows Firewall automatically
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Timesheet Frontend" -Direction Inbound -Protocol TCP -LocalPort 4200 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Timesheet Backend" -Direction Inbound -Protocol TCP -LocalPort 8083 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Timesheet Prometheus" -Direction Inbound -Protocol TCP -LocalPort 9090 -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Timesheet Grafana" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "Firewall rules created successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Could not create firewall rules automatically. Please create them manually." -ForegroundColor Red
}

Write-Host ""
Write-Host "To stop the services: docker-compose down" -ForegroundColor White
