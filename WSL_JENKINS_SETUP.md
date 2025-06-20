# Jenkins on WSL Setup Guide

## Why Use WSL for Jenkins?

✅ **Better Linux compatibility** - Jenkins was designed for Linux  
✅ **Easier package management** - apt/yum instead of manual downloads  
✅ **Better Docker integration** - Native Linux Docker commands  
✅ **Faster builds** - Linux file system is faster than Windows  
✅ **Same environment as production** - Most CI/CD runs on Linux  

## Complete WSL Setup

### Step 1: Enable WSL2

```powershell
# Run in PowerShell as Administrator
wsl --install

# If WSL is already installed but you need Ubuntu:
wsl --install -d Ubuntu

# Restart your computer if prompted
```

### Step 2: Install Jenkins in WSL

```bash
# Open WSL terminal (Ubuntu)
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 17 (required for Jenkins)
sudo apt install openjdk-17-jdk -y
java -version  # Verify installation

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins service
sudo systemctl start jenkins
sudo systemctl enable jenkins  # Auto-start on boot

# Check Jenkins status
sudo systemctl status jenkins
```

### Step 3: Install Required Tools

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl start docker
sudo systemctl enable docker

# Install Maven
sudo apt install maven -y

# Install Git (usually pre-installed)
sudo apt install git -y

# Install Trivy (security scanner)
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# Install Node.js (for Angular builds)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 4: Access Jenkins

1. **Open browser**: http://localhost:8080

2. **Get initial password**:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. **Complete setup wizard**:
   - Install suggested plugins
   - Create admin user
   - Set Jenkins URL: http://localhost:8080

### Step 5: Configure Jenkins for Your Pipeline

1. **Install Additional Plugins**:
   - Go to Manage Jenkins > Manage Plugins
   - Install: Docker Pipeline, Blue Ocean

2. **Configure Tools** (Manage Jenkins > Global Tool Configuration):
   - **Maven**: Name: "Maven", Install automatically ✓
   - **Docker**: Name: "docker", Install automatically ✓
   - **Git**: Should be auto-detected

### Step 6: Set Up Your Project

```bash
# Navigate to your project directory in WSL
cd /mnt/c/EY\ PFE/project/Ahmed\ v1/devops/

# Start Docker daemon if not running
sudo service docker start

# Set up local registry
docker run -d -p 5000:5000 --name registry registry:2

# Test build (optional)
docker-compose build
```

## WSL-Specific Notes

### File System Access
- **Windows files**: `/mnt/c/Users/...`
- **WSL files**: `/home/username/...`
- **Better performance**: Use WSL file system for Jenkins workspace

### Docker Integration
```bash
# Enable Docker daemon on startup
echo 'sudo service docker start' >> ~/.bashrc

# Or use Docker Desktop integration:
# In Docker Desktop > Settings > Resources > WSL Integration
# Enable integration with your WSL distro
```

### Port Access
- Jenkins on WSL is accessible from Windows at `localhost:8080`
- All services (Grafana, Prometheus) work the same way

### Managing Jenkins
```bash
# Start Jenkins
sudo systemctl start jenkins

# Stop Jenkins
sudo systemctl stop jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Check logs
sudo journalctl -u jenkins -f

# Check Jenkins status
sudo systemctl status jenkins
```

## Advantages of WSL Setup

1. **Native Linux environment** - Better for CI/CD
2. **Package management** - Easy installation with apt
3. **Performance** - Faster file operations
4. **Compatibility** - Same environment as most production servers
5. **Docker integration** - Better Docker performance
6. **Resource efficiency** - Lower overhead than full VM

## Troubleshooting

### Jenkins Won't Start
```bash
# Check Java installation
java -version

# Check Jenkins logs
sudo journalctl -u jenkins -n 50

# Restart Jenkins
sudo systemctl restart jenkins
```

### Docker Issues
```bash
# Start Docker
sudo service docker start

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Test Docker
docker --version
docker ps
```

### Port Conflicts
```bash
# Check what's using port 8080
sudo netstat -tlnp | grep :8080

# Use different port for Jenkins
sudo systemctl edit jenkins
# Add: Environment="JENKINS_PORT=8081"
```

**You're all set!** WSL provides an excellent environment for running Jenkins and your CI/CD pipeline.
