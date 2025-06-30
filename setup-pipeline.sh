#!/bin/bash

# TimeSheet Pipeline Setup Script with SonarQube and Nexus
# This script helps setup the complete CI/CD pipeline

set -e

echo "=========================================="
echo "TimeSheet CI/CD Pipeline Setup"
echo "With SonarQube and Nexus Integration"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed ✓"
}

# Get host IP
get_host_ip() {
    print_header "Determining host IP..."
    
    if command -v ip &> /dev/null; then
        HOST_IP=$(ip route get 8.8.8.8 | awk -F'src ' 'NR==1{split($2,a," ");print a[1]}')
    elif command -v hostname &> /dev/null; then
        HOST_IP=$(hostname -I | awk '{print $1}')
    else
        print_warning "Could not automatically determine IP. Using localhost."
        HOST_IP="localhost"
    fi
    
    echo "Detected Host IP: $HOST_IP"
    export HOST_IP
}

# Setup services
setup_services() {
    print_header "Setting up services..."
    
    print_status "Stopping existing containers..."
    docker-compose down || true
    
    print_status "Cleaning up existing containers..."
    docker container prune -f || true
    
    print_status "Building custom images..."
    docker-compose build
    
    print_status "Starting MySQL first..."
    docker-compose up -d mysql
    
    print_status "Waiting for MySQL to be ready..."
    for i in {1..30}; do
        if docker-compose ps mysql | grep -q "healthy"; then
            print_status "MySQL is ready! ✓"
            break
        fi
        echo "Waiting for MySQL... attempt $i/30"
        sleep 10
    done
    
    print_status "Starting SonarQube and Nexus..."
    docker-compose up -d sonarqube nexus
    
    print_status "Starting remaining services..."
    docker-compose up -d
    
    print_status "All services started! ✓"
}

# Wait for services to be ready
wait_for_services() {
    print_header "Waiting for services to be ready..."
    
    services=(
        "http://localhost:4200:Frontend"
        "http://localhost:8083/actuator/health:Backend"
        "http://localhost:9000/api/system/status:SonarQube"
        "http://localhost:8081/service/rest/v1/status:Nexus"
        "http://localhost:9090/-/ready:Prometheus"
        "http://localhost:3000/api/health:Grafana"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service"
        print_status "Checking $name..."
        
        for i in {1..20}; do
            if curl -f "$url" --connect-timeout 10 --silent > /dev/null 2>&1; then
                print_status "$name is ready! ✓"
                break
            fi
            echo "Waiting for $name... attempt $i/20"
            sleep 15
        done
    done
}

# Display service information
display_services() {
    print_header "Service Information"
    
    echo ""
    echo "🚀 Application Services:"
    echo "   Frontend:     http://localhost:4200"
    echo "   Backend:      http://localhost:8083"
    echo "   Backend API:  http://localhost:8083/actuator/health"
    echo ""
    echo "🔍 Code Quality & Dependencies:"
    echo "   SonarQube:    http://localhost:9000 (admin/admin)"
    echo "   Nexus:        http://localhost:8081 (admin/admin123)"
    echo ""
    echo "📊 Monitoring:"
    echo "   Prometheus:   http://localhost:9090"
    echo "   Grafana:      http://localhost:3000 (admin/admin)"
    echo ""
    echo "💾 Database:"
    echo "   MySQL:        localhost:3307 (root/rootpassword)"
    echo ""
}

# Initial configuration
initial_configuration() {
    print_header "Initial Configuration Notes"
    
    echo ""
    echo "📋 SonarQube Setup:"
    echo "   1. Visit http://localhost:9000"
    echo "   2. Login with admin/admin"
    echo "   3. Change password when prompted"
    echo "   4. Project key is already configured: 'timesheet-backend'"
    echo ""
    echo "📋 Nexus Setup:"
    echo "   1. Visit http://localhost:8081"
    echo "   2. Login with admin/admin123"
    echo "   3. Repositories are pre-configured"
    echo ""
    echo "📋 Maven Commands:"
    echo "   Run tests with coverage:"
    echo "   ./mvnw clean test jacoco:report"
    echo ""
    echo "   SonarQube analysis:"
    echo "   ./mvnw sonar:sonar -Dsonar.host.url=http://localhost:9000"
    echo ""
    echo "   Deploy to Nexus:"
    echo "   ./mvnw deploy -s ../settings.xml"
    echo ""
}

# Health check
health_check() {
    print_header "Running health check..."
    
    print_status "Service status:"
    docker-compose ps
    
    echo ""
    print_status "Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Main execution
main() {
    echo ""
    check_prerequisites
    get_host_ip
    setup_services
    wait_for_services
    display_services
    initial_configuration
    health_check
    
    echo ""
    print_status "=========================================="
    print_status "Setup completed successfully! 🎉"
    print_status "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Configure SonarQube at http://localhost:9000"
    echo "2. Verify Nexus at http://localhost:8081"
    echo "3. Access your application at http://localhost:4200"
    echo "4. Run the Jenkins pipeline"
    echo ""
    echo "For troubleshooting, check: docker-compose logs [service-name]"
}

# Handle script interruption
trap 'echo ""; print_error "Setup interrupted!"; exit 1' INT

# Run main function
main "$@"
