# Timesheet CI/CD Pipeline Setup for Windows

## Prerequisites Installation

### 1. Install Required Software

1. **Docker Desktop for Windows**
   ```powershell
   # Download and install from: https://www.docker.com/products/docker-desktop
   # Ensure WSL2 is enabled
   ```

2. **Jenkins** (Choose one method below)

   **Method 1: Windows Installer (Recommended)**
   ```powershell
   # 1. Go to https://www.jenkins.io/download/
   # 2. Click "Download Jenkins [version] for Windows"
   # 3. Run the downloaded .msi file
   # 4. Follow installation wizard (Jenkins will run as Windows service)
   ```

   **Method 2: WAR file**
   ```powershell
   # 1. Download jenkins.war from: https://www.jenkins.io/download/
   # 2. Create folder: mkdir C:\Jenkins
   # 3. Move jenkins.war to C:\Jenkins\
   # 4. Run: java -jar C:\Jenkins\jenkins.war --httpPort=8081
   ```

   **Method 3: Chocolatey**
   ```powershell
   # First install Chocolatey if not installed:
   # Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   
   choco install jenkins
   ```

   **Method 4: WSL (Windows Subsystem for Linux) - Recommended for Developers**
   ```powershell
   # 1. Enable WSL2 (if not already enabled)
   wsl --install
   # OR if WSL is installed: wsl --install -d Ubuntu
   
   # 2. Open WSL terminal (Ubuntu)
   # 3. Update package list
   sudo apt update
   
   # 4. Install Java 17
   sudo apt install openjdk-17-jdk -y
   
   # 5. Add Jenkins repository
   curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
   echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
   
   # 6. Install Jenkins
   sudo apt update
   sudo apt install jenkins -y
   
   # 7. Start Jenkins
   sudo systemctl start jenkins
   sudo systemctl enable jenkins
   
   # 8. Access Jenkins at: http://localhost:8080
   # Get initial password: sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. **Java 17** (for Jenkins and Spring Boot)
   ```powershell
   # Download from: https://adoptium.net/
   # Or install via Chocolatey:
   choco install temurin17
   ```

4. **Trivy Security Scanner**
   ```powershell
   # Download from: https://github.com/aquasecurity/trivy/releases
   # Add to PATH
   ```

### 2. Setup Jenkins

**For WSL Installation:**
1. **Start Jenkins (if not auto-started)**
   ```bash
   # In WSL terminal
   sudo systemctl start jenkins
   sudo systemctl status jenkins  # Check status
   ```

2. **First-time Setup**:
   - Open browser: http://localhost:8080
   - Get initial admin password:
     ```bash
     # In WSL terminal
     sudo cat /var/lib/jenkins/secrets/initialAdminPassword
     ```
   - Follow the setup wizard
   - Install suggested plugins
   - Create admin user

3. **Install Additional Tools in WSL**:
   ```bash
   # Install Docker in WSL
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Install Maven
   sudo apt install maven -y
   
   # Install Trivy
   sudo apt-get install wget apt-transport-https gnupg lsb-release
   wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
   echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
   sudo apt-get update
   sudo apt-get install trivy
   ```

**For Windows Installation:**
1. **Start Jenkins**
   
   **If installed via Windows Installer:**
   ```powershell
   # Jenkins starts automatically as Windows service
   # Access via: http://localhost:8080
   # To restart: services.msc -> Find "Jenkins" -> Restart
   ```

   **If using WAR file:**
   ```powershell
   # Navigate to Jenkins folder
   cd C:\Jenkins
   java -jar jenkins.war --httpPort=8081
   ```

2. **First-time Setup**:
   - Open browser: http://localhost:8080 (or 8081 if using WAR)
   - Find initial admin password:
     ```powershell
     # For Windows installer:
     type "C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword"
     
     # For WAR file:
     type "C:\Users\%USERNAME%\.jenkins\secrets\initialAdminPassword"
     ```
   - Copy the password and paste it in Jenkins
   - Click "Install suggested plugins"
   - Create admin user when prompted

3. **Install Required Plugins**:
   - Go to Manage Jenkins > Manage Plugins
   - Install these plugins:
     - Docker Pipeline
     - Git Plugin
     - Pipeline Plugin
     - Blue Ocean (optional, for better UI)

4. **Configure Tools in Jenkins**:
   - Go to Manage Jenkins > Global Tool Configuration
   - **Maven**: Add Maven installation (auto-install latest version)
   - **Docker**: Add Docker installation
     - Name: "docker"
     - Installation root: `C:\Program Files\Docker\Docker\resources\bin` (adjust if needed)
   - **Git**: Usually auto-detected, verify path is correct

### 3. Setup Local Docker Registry

```powershell
# Start local registry
docker run -d -p 5000:5000 --name registry registry:2

# Verify registry is running
docker ps
```

### 4. Create Jenkins Pipeline Job

1. **Create New Pipeline Job**:
   - New Item > Pipeline
   - Name: "timesheet-cicd"

2. **Configure Pipeline**:
   - Pipeline > Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: [Your Git Repository]
   - Script Path: Jenkinsfile

### 5. Run the Pipeline

1. **Initial Setup**:
   ```powershell
   # Clone your repository
   git clone [your-repo-url]
   cd [your-repo-directory]
   
   # Build initial images locally (optional)
   docker-compose build
   ```

2. **Execute Pipeline**:
   - Go to Jenkins dashboard
   - Click on "timesheet-cicd" job
   - Click "Build Now"

### 6. Access Services After Deployment

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:8083
- **Backend Health**: http://localhost:8083/actuator/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Jenkins**: http://localhost:8080

### 7. Monitoring Setup

1. **Grafana Dashboard**:
   - Login: admin/admin
   - Dashboard already provisioned: "Timesheet Application Monitoring"

2. **Prometheus Targets**:
   - Check http://localhost:9090/targets
   - Ensure all services are UP

## Troubleshooting

### Common Issues:

1. **Port Conflicts**:
   ```powershell
   # Check what's using ports
   netstat -ano | findstr :8080
   netstat -ano | findstr :8083
   netstat -ano | findstr :3306
   ```

2. **Docker Issues**:
   ```powershell
   # Restart Docker Desktop
   # Check Docker daemon is running
   docker version
   ```

3. **Jenkins Build Fails**:
   - Check Jenkins logs
   - Verify Docker is accessible from Jenkins
   - Ensure all tools are properly configured

4. **Database Connection Issues**:
   ```powershell
   # Check MySQL container logs
   docker logs timesheet-mysql
   ```

### Manual Commands for Testing:

```powershell
# Build and run manually
docker-compose down
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up
docker system prune -f
```

## Security Scanner Results

The pipeline includes Trivy security scanning. Results will be displayed in Jenkins console output. Address any HIGH or CRITICAL vulnerabilities as needed.

## Next Steps

1. Add your Git repository URL to Jenkins
2. Configure webhooks for automatic builds
3. Add notification channels (email, Slack, etc.)
4. Implement proper secret management
5. Add automated tests when ready
