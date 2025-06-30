# TimeSheet CI/CD Pipeline with SonarQube and Nexus

This project includes a complete CI/CD pipeline with code quality analysis using SonarQube and dependency management using Nexus Repository Manager.

## Services Overview

### Core Application Services
- **MySQL**: Database (Port 3307)
- **Spring Boot Backend**: Java application (Port 8083)
- **Angular Frontend**: Web interface (Port 4200)

### Code Quality & Dependency Management
- **SonarQube**: Code quality analysis (Port 9000)
- **Nexus Repository Manager**: Maven dependency management (Port 8081)

### Monitoring Services
- **Prometheus**: Metrics collection (Port 9090)
- **Grafana**: Metrics visualization (Port 3000)
- **Node Exporter**: System metrics (Port 9100)
- **Nginx Exporter**: Frontend metrics (Port 9113)

## Prerequisites

- Docker and Docker Compose
- Jenkins (for CI/CD pipeline)
- Git

## Quick Start

### 1. Deploy All Services

```bash
# Set the HOST_IP environment variable (replace with your actual IP)
export HOST_IP=your_host_ip

# Start all services
docker-compose up -d
```

### 2. Initial Setup

#### SonarQube Setup (First Time)
1. Access SonarQube at http://localhost:9000
2. Default credentials: admin/admin
3. You'll be prompted to change the password on first login
4. Create a new project with key: `timesheet-backend`

#### Nexus Setup (First Time)
1. Access Nexus at http://localhost:8081
2. Default credentials: admin/admin123
3. The repositories are pre-configured in the Maven settings

### 3. Maven Configuration

The project includes Maven configuration for both SonarQube and Nexus:

#### SonarQube Analysis
```bash
cd Timesheet-Client-monolithic-arch
./mvnw clean test jacoco:report sonar:sonar \
    -Dsonar.host.url=http://localhost:9000 \
    -Dsonar.login=admin \
    -Dsonar.password=your_sonar_password
```

#### Deploy to Nexus
```bash
cd Timesheet-Client-monolithic-arch
./mvnw clean deploy -s ../settings.xml
```

## Jenkins Pipeline

The Jenkins pipeline includes the following stages:

1. **Checkout**: Source code checkout
2. **Security Scan**: Trivy security scanning
3. **Unit Tests**: Run tests with JaCoCo coverage
4. **SonarQube Analysis**: Code quality analysis
5. **Deploy to Nexus**: Artifact deployment (for main branches)
6. **Build**: Docker image building
7. **Container Security Scan**: Image vulnerability scanning
8. **Deploy**: Service deployment
9. **Health Check**: Service health verification

### Pipeline Features

- **Code Coverage**: JaCoCo integration with SonarQube
- **Quality Gates**: SonarQube quality gates
- **Artifact Management**: Nexus repository deployment
- **Security Scanning**: Container and dependency scanning
- **Health Monitoring**: Comprehensive service health checks

## Configuration Files

### Maven Configuration
- `pom.xml`: Updated with SonarQube and Nexus plugins
- `settings.xml`: Maven settings for Nexus authentication
- `sonar-project.properties`: SonarQube project configuration

### Docker Configuration
- `docker-compose.yml`: Complete service orchestration
- Service health checks and dependencies

## Service URLs

- **Application Frontend**: http://localhost:4200
- **Application Backend**: http://localhost:8083
- **SonarQube**: http://localhost:9000
- **Nexus Repository**: http://localhost:8081
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

## Default Credentials

### SonarQube
- Username: `admin`
- Password: `admin` (change on first login)

### Nexus
- Username: `admin`
- Password: `admin123`

### Grafana
- Username: `admin`
- Password: `admin`

## Troubleshooting

### Service Startup Issues
1. Check service logs: `docker-compose logs [service_name]`
2. Verify service health: `docker-compose ps`
3. Check port conflicts

### SonarQube Issues
1. Ensure sufficient memory (minimum 2GB)
2. Check database connectivity
3. Verify project configuration

### Nexus Issues
1. Check disk space for repository storage
2. Verify Maven settings configuration
3. Check network connectivity

### Common Commands

```bash
# View all service logs
docker-compose logs

# Restart specific service
docker-compose restart [service_name]

# Clean up and rebuild
docker-compose down
docker-compose up -d --build

# Check service health
docker-compose ps
```

## Project Structure

```
├── docker-compose.yml              # Main orchestration file
├── settings.xml                    # Maven settings for Nexus
├── Jenkinsfile                     # CI/CD pipeline definition
├── Timesheet-Client-monolithic-arch/
│   ├── pom.xml                     # Maven configuration with plugins
│   ├── sonar-project.properties    # SonarQube configuration
│   └── src/                        # Source code
├── Timesheet_FrontEnd/             # Angular frontend
└── monitoring/                     # Monitoring configuration
```

## Maven Repositories in Nexus

The setup creates the following repositories in Nexus:
- `maven-central`: Proxy to Maven Central
- `maven-releases`: Hosted repository for releases
- `maven-snapshots`: Hosted repository for snapshots
- `maven-public`: Repository group combining all repositories

## Quality Gates

SonarQube is configured with quality gates for:
- Code coverage minimum threshold
- Duplicate code detection
- Security vulnerability detection
- Code smells and maintainability issues
- Bug detection

## Monitoring

The setup includes comprehensive monitoring:
- Application metrics via Micrometer/Prometheus
- System metrics via Node Exporter
- Web server metrics via Nginx Exporter
- Pre-configured Grafana dashboards

## Security

- Container vulnerability scanning with Trivy
- Dependency vulnerability analysis with SonarQube
- Security-focused quality gates
- Secure credential management in Jenkins
