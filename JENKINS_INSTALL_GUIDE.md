# Jenkins Installation Guide for Windows

## Quick Installation Steps

### Option 1: Windows Installer (Easiest)

1. **Download Jenkins**
   - Go to https://www.jenkins.io/download/
   - Click "Download Jenkins for Windows"
   - Download the `.msi` file

2. **Install Jenkins**
   - Run the downloaded `.msi` file
   - Follow the installation wizard
   - Jenkins will install as a Windows service
   - Default port: 8080

3. **Access Jenkins**
   - Open browser: http://localhost:8080
   - Get initial password:
     ```cmd
     type "C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword"
     ```

### Option 2: WAR File (Manual)

1. **Prerequisites**
   - Ensure Java 17 is installed
   - Check: `java -version`

2. **Download and Run**
   ```cmd
   # Create Jenkins folder
   mkdir C:\Jenkins
   cd C:\Jenkins
   
   # Download jenkins.war from https://www.jenkins.io/download/
   # Run Jenkins
   java -jar jenkins.war --httpPort=8081
   ```

3. **Access Jenkins**
   - Open browser: http://localhost:8081
   - Get initial password:
     ```cmd
     type "C:\Users\%USERNAME%\.jenkins\secrets\initialAdminPassword"
     ```

## First-Time Setup

1. **Unlock Jenkins**
   - Copy the initial admin password
   - Paste it in the web interface

2. **Install Plugins**
   - Choose "Install suggested plugins"
   - Wait for installation to complete

3. **Create Admin User**
   - Fill in your details
   - Remember the username/password

4. **Instance Configuration**
   - Keep default URL: http://localhost:8080
   - Click "Save and Finish"

## Required Plugins for Pipeline

Go to **Manage Jenkins > Manage Plugins** and install:
- Docker Pipeline
- Git Plugin  
- Pipeline Plugin
- Blue Ocean (optional, better UI)

## Configure Tools

Go to **Manage Jenkins > Global Tool Configuration**:

1. **Maven**
   - Add Maven
   - Name: "Maven"
   - Install automatically: ✓ (latest version)

2. **Docker**
   - Add Docker
   - Name: "docker"
   - Install automatically: ✓

3. **Git**
   - Usually auto-detected
   - Verify path is correct

## Troubleshooting

### Jenkins Won't Start
```cmd
# Check if port 8080 is busy
netstat -ano | findstr :8080

# Kill process if needed (replace PID)
taskkill /PID [PID] /F

# Or use different port
java -jar jenkins.war --httpPort=8081
```

### Can't Access Jenkins
- Check Windows Firewall
- Verify Jenkins service is running (services.msc)
- Check if running as Windows service or manual

### Plugin Installation Fails
- Check internet connection
- Go to Manage Jenkins > Manage Plugins > Advanced
- Update Plugin Site URL if needed

## Next Steps

After Jenkins is installed and configured:

1. Create your first pipeline job
2. Clone your project repository
3. Configure the Jenkinsfile path
4. Run your first build

**You're ready to use the CI/CD pipeline!**
