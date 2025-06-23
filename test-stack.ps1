# PowerShell script to test the deployed stack

$HOST_IP = $env:HOST_IP
if (-not $HOST_IP) {
    $HOST_IP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"}).IPAddress | Select-Object -First 1
}

if (-not $HOST_IP) {
    $HOST_IP = Read-Host "Please enter your host IP address"
}

Write-Host "Testing timesheet stack at IP: $HOST_IP" -ForegroundColor Green
Write-Host ""

$services = @(
    @{Name="Frontend"; URL="http://$HOST_IP:4200"; Expected="200"},
    @{Name="Backend Health"; URL="http://$HOST_IP:8083/actuator/health"; Expected="200"},
    @{Name="Backend API"; URL="http://$HOST_IP:8083/api"; Expected="404|200"},
    @{Name="Prometheus"; URL="http://$HOST_IP:9090"; Expected="200"},
    @{Name="Grafana"; URL="http://$HOST_IP:3000"; Expected="200"}
)

foreach ($service in $services) {
    Write-Host "Testing $($service.Name)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or ($service.Expected -like "*$($response.StatusCode)*")) {
            Write-Host "  ✓ $($service.Name) is accessible at $($service.URL)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($service.Name) returned status code $($response.StatusCode)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ✗ $($service.Name) is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "=== CONTAINER STATUS ===" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "=== NETWORK TEST ===" -ForegroundColor Yellow
Write-Host "Testing external accessibility..."

# Test if ports are listening
$ports = @(4200, 8083, 9090, 3000)
foreach ($port in $ports) {
    $listener = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Host "  ✓ Port $port is listening" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Port $port is not listening" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Share these URLs with your friend:" -ForegroundColor White
Write-Host "  Frontend: http://$HOST_IP:4200" -ForegroundColor Cyan
Write-Host "  API: http://$HOST_IP:8083" -ForegroundColor Cyan
