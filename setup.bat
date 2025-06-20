@echo off
echo ======================================
echo Timesheet CI/CD Pipeline Setup
echo ======================================

echo.
echo Checking prerequisites...

:: Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop for Windows
    pause
    exit /b 1
)
echo ✓ Docker is installed

:: Check Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17
    pause
    exit /b 1
)
echo ✓ Java is installed

:: Check if Jenkins is available
echo.
echo Setting up local Docker registry...
docker run -d -p 5000:5000 --name registry --restart=always registry:2 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Docker registry started on port 5000
) else (
    echo ℹ Docker registry may already be running
)

echo.
echo Building application images...
docker-compose build

echo.
echo Starting services...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 30 >nul

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Services available at:
echo - Frontend: http://localhost:8080
echo - Backend: http://localhost:8083
echo - Backend Health: http://localhost:8083/actuator/health
echo - Prometheus: http://localhost:9090
echo - Grafana: http://localhost:3000 (admin/admin)
echo.
echo To set up Jenkins:
echo 1. Download jenkins.war from https://www.jenkins.io/download/
echo 2. Run: java -jar jenkins.war --httpPort=8081
echo 3. Access: http://localhost:8081
echo.
echo For detailed instructions, see SETUP_INSTRUCTIONS.md
echo.
pause
