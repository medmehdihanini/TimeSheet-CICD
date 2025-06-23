#!/bin/bash
# Build script that replaces localhost with actual IP

# Get the host IP (you need to replace this with your actual IP)
HOST_IP=${1:-"192.168.1.100"}  # Replace with your actual IP

echo "Building frontend with API URL: http://$HOST_IP:8083"

# Replace localhost with actual IP in all service files
find src/app/services -name "*.ts" -exec sed -i "s|http://localhost:8083|http://$HOST_IP:8083|g" {} \;
find src/app -name "*.ts" -exec sed -i "s|http://localhost:8083|http://$HOST_IP:8083|g" {} \;

# Build the application
npm run build --configuration=production

# Restore original files (optional)
# git checkout src/
