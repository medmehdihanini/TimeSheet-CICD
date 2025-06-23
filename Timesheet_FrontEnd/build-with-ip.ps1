# PowerShell script to build frontend with your IP
param(
    [Parameter(Mandatory=$true)]
    [string]$HostIP
)

Write-Host "Building frontend with API URL: http://$HostIP:8083"

# Replace localhost with actual IP in all service files
Get-ChildItem -Path "src\app" -Recurse -Filter "*.ts" | ForEach-Object {
    (Get-Content $_.FullName) -replace "http://localhost:8083", "http://$HostIP:8083" | Set-Content $_.FullName
}

Write-Host "IP addresses updated. Building application..."
npm run build --configuration=production

Write-Host "Build complete!"
