#!/bin/bash

# Get the host IP automatically
HOST_IP=$(hostname -I | awk '{print $1}')
if [ -z "$HOST_IP" ]; then
    # Fallback method for getting IP
    HOST_IP=$(ip route get 8.8.8.8 | awk -F"src " 'NR==1{split($2,a," ");print a[1]}')
fi

if [ -z "$HOST_IP" ]; then
    echo "Could not determine host IP automatically. Please provide it manually:"
    read -p "Enter your host IP address: " HOST_IP
fi

echo "Using host IP: $HOST_IP"

# Export the HOST_IP for docker-compose
export HOST_IP=$HOST_IP

echo "Starting the timesheet application stack..."
echo "Frontend will be available at: http://$HOST_IP:4200"
echo "Backend will be available at: http://$HOST_IP:8083"
echo "Prometheus will be available at: http://$HOST_IP:9090"
echo "Grafana will be available at: http://$HOST_IP:3000"

# Start the services
docker-compose down
docker-compose up --build -d

echo ""
echo "Services are starting up..."
echo "Waiting for services to become healthy..."

# Wait for backend to be ready
echo "Waiting for backend..."
timeout=120
counter=0
while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:8083/actuator/health >/dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    echo "Backend not ready yet... waiting ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

# Wait for frontend to be ready
echo "Waiting for frontend..."
counter=0
while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:4200 >/dev/null 2>&1; then
        echo "Frontend is ready!"
        break
    fi
    echo "Frontend not ready yet... waiting ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "Access the application:"
echo "  Frontend: http://$HOST_IP:4200"
echo "  Backend API: http://$HOST_IP:8083"
echo "  Prometheus: http://$HOST_IP:9090"
echo "  Grafana: http://$HOST_IP:3000 (admin/admin)"
echo ""
echo "For external access, make sure to:"
echo "1. Configure Windows Firewall to allow these ports"
echo "2. Share this IP ($HOST_IP) with your friend"
echo ""
echo "To stop the services: docker-compose down"
