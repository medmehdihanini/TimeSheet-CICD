# Timesheet Application Deployment Guide

## Overview
This guide provides step-by-step instructions for building, pushing Docker images to DockerHub, and deploying the Timesheet application (frontend and backend) to update your existing v1 deployment.

## Prerequisites
- Docker installed on your local machine
- DockerHub account
- Access to your VM/deployment environment
- Git access to your repositories

## Project Structure
- **Frontend**: `Timesheet_FrontEnd` (Angular application)
- **Backend**: `Timesheet-Client-monolithic-arch` (Java Spring Boot application)

## Step-by-Step Deployment Process

### Phase 1: Prepare Backend Application

#### 1. Build the Java Application
```bash
# Navigate to backend directory
cd "c:\EY PFE\project\Ahmed v1\Timesheet-Client-monolithic-arch"

# Clean and build the Maven project using wrapper
.\mvnw.cmd clean package -DskipTests

# Verify the JAR file is created
ls -la target/timesheetclient-0.0.1-SNAPSHOT.jar
```

#### 2. Build Backend Docker Image
```bash
# Build the Docker image with latest tag to overwrite the old one
docker build -t mehdihanini/timesheetclientgiz-backend:latest .

# Verify the image is built
docker images | grep mehdihanini/timesheetclientgiz-backend
```

#### 3. Test Backend Image Locally (Optional)
```bash
# Run the container locally to test
docker run -d -p 8083:8083 --name timesheet-backend-test mehdihanini/timesheetclientgiz-backend:latest

# Check if it's running
docker ps

# Check logs
docker logs timesheet-backend-test

# Stop and remove test container
docker stop timesheet-backend-test
docker rm timesheet-backend-test
```

### Phase 2: Prepare Frontend Application

#### 1. Navigate to Frontend Directory
```bash
cd "c:\EY PFE\project\Ahmed v1\Timesheet_FrontEnd"
```

#### 2. Install Dependencies and Build
```bash
# Install dependencies
npm ci

# Build for production
npm run build --configuration=production

# Verify dist folder is created
ls -la dist/
```

#### 3. Build Frontend Docker Image
```bash
# Build the Docker image with latest tag to overwrite the old one
docker build -t mehdihanini/timesheetclientgiz-frontend:latest .

# Verify the image is built
docker images | grep mehdihanini/timesheetclientgiz-frontend
```

#### 4. Test Frontend Image Locally (Optional)
```bash
# Run the container locally to test
docker run -d -p 8080:80 --name timesheet-frontend-test mehdihanini/timesheetclientgiz-frontend:latest

# Check if it's running
docker ps

# Test in browser: http://localhost:8080

# Stop and remove test container
docker stop timesheet-frontend-test
docker rm timesheet-frontend-test
```

### Phase 3: Push Images to DockerHub

#### 1. Login to DockerHub
```bash
# Login to DockerHub
docker login

# Enter your DockerHub username and password when prompted
```

#### 2. Push Backend Image
```bash
# Push latest (this will overwrite the old latest image)
docker push mehdihanini/timesheetclientgiz-backend:latest
```

#### 3. Push Frontend Image
```bash
# Push latest (this will overwrite the old latest image)
docker push mehdihanini/timesheetclientgiz-frontend:latest
```

#### 4. Verify Images on DockerHub
- Go to https://hub.docker.com/
- Check your repositories:
  - `mehdihanini/timesheetclientgiz-backend`
  - `mehdihanini/timesheetclientgiz-frontend`
- Verify the `latest` tags have been updated

### Phase 4: Deploy to VM

#### 1. Connect to Your VM
```bash
# SSH into your VM (replace with your VM details)
ssh username@your-vm-ip

# Or use your preferred method to access the VM
```

#### 2. Update Docker Compose (if using)
If you're using docker-compose, update your docker-compose.yml:

```yaml
version: '3.8'
services:
  frontend:
    image: mehdihanini/timesheetclientgiz-frontend:v2
    ports:
      - "80:80"
    restart: unless-stopped

  backend:
    image: mehdihanini/timesheetclientgiz-backend:v2
    ports:
      - "8083:8083"
    restart: unless-stopped
    environment:
      # Add your environment variables here
      - SPRING_PROFILES_ACTIVE=prod
```

#### 3. Pull New Images on VM
```bash
# Pull the new images
docker pull mehdihanini/timesheetclientgiz-backend:latest
docker pull mehdihanini/timesheetclientgiz-frontend:latest
```

#### 4. Stop Current Containers
```bash
# If using docker-compose
docker-compose down

# Or stop individual containers
docker stop timesheet-frontend-v1 timesheet-backend-v1
docker rm timesheet-frontend-v1 timesheet-backend-v1
```

#### 5. Start New Containers
```bash
# If using docker-compose
docker-compose up -d

# Or run individual containers
docker run -d -p 8083:8083 --name timesheet-backend-v2 mehdihanini/timesheetclientgiz-backend:v2
docker run -d -p 80:80 --name timesheet-frontend-v2 mehdihanini/timesheetclientgiz-frontend:v2
```

#### 6. Verify Deployment
```bash
# Check running containers
docker ps

# Check logs
docker logs timesheet-backend-v2
docker logs timesheet-frontend-v2

# Test the application
curl http://localhost:8083/health  # Backend health check
curl http://localhost:80          # Frontend
```

### Phase 5: Rollback Plan (if needed)

#### If Something Goes Wrong
```bash
# Quick rollback to v1
docker stop timesheet-backend-v2 timesheet-frontend-v2
docker rm timesheet-backend-v2 timesheet-frontend-v2

# Start v1 containers
docker run -d -p 8083:8083 --name timesheet-backend-v1 mehdihanini/timesheetclientgiz-backend:v1
docker run -d -p 80:80 --name timesheet-frontend-v1 mehdihanini/timesheetclientgiz-frontend:v1
```

## Automation Script

Create this script for future deployments:

```bash
#!/bin/bash

# deployment-script.sh
set -e

echo "Starting deployment process..."

# Build and push backend
echo "Building backend..."
cd "c:\EY PFE\project\Ahmed v1\Timesheet-Client-monolithic-arch"
mvn clean package -DskipTests
docker build -t mehdihanini/timesheetclientgiz-backend:v2 .
docker push mehdihanini/timesheetclientgiz-backend:v2

# Build and push frontend
echo "Building frontend..."
cd "c:\EY PFE\project\Ahmed v1\Timesheet_FrontEnd"
npm ci
npm run build --configuration=production
docker build -t mehdihanini/timesheetclientgiz-frontend:v2 .
docker push mehdihanini/timesheetclientgiz-frontend:v2

echo "Images pushed successfully!"
echo "Now update your VM deployment with the new v2 images."
```

## Important Notes

1. **Backup**: Always backup your current deployment before updating
2. **Testing**: Test images locally before pushing to production
3. **Environment Variables**: Ensure all necessary environment variables are set in production
4. **Database**: If you have database migrations, run them after backend deployment
5. **SSL/TLS**: Configure HTTPS if not already done
6. **Monitoring**: Set up monitoring and logging for the new deployment

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check Maven/npm dependencies
2. **Docker Push Failures**: Verify DockerHub authentication
3. **Container Won't Start**: Check logs with `docker logs container-name`
4. **Port Conflicts**: Ensure ports are available on VM
5. **Network Issues**: Verify firewall and security group settings

### Useful Commands:
```bash
# View all Docker images
docker images

# Remove unused images
docker image prune

# View container logs
docker logs -f container-name

# Execute commands in running container
docker exec -it container-name /bin/bash

# Check container resource usage
docker stats
```

## Container Management Commands

### Delete Existing Containers
```bash
# View current running containers
docker ps

# Stop and remove frontend and backend containers
docker rm -f timesheet-frontend timesheet-backend

# Or stop first, then remove
docker stop timesheet-frontend timesheet-backend
docker rm timesheet-frontend timesheet-backend

# Verify containers are deleted
docker ps
```

### Clean Up All Images
```bash
# Delete all backend images (all versions)
docker rmi -f $(docker images mehdihanini/timesheetclientgiz-backend -q)

# Delete all frontend images (all versions)
docker rmi -f $(docker images mehdihanini/timesheetclientgiz-frontend -q)

# Remove dangling images (<none> tags)
docker image prune -f

# Remove all unused images
docker image prune -a -f

# Verify images are deleted
docker images
```

### Complete Reset (Containers + Images)
```bash
# Stop and remove all timesheet containers
docker rm -f timesheet-frontend timesheet-backend

# Delete all timesheet images
docker rmi -f $(docker images mehdihanini/timesheetclientgiz-backend -q)
docker rmi -f $(docker images mehdihanini/timesheetclientgiz-frontend -q)

# Clean up dangling images
docker image prune -f

# Verify cleanup
docker ps
docker images
```

## Next Steps

1. Set up CI/CD pipeline for automated deployments
2. Implement proper monitoring and alerting
3. Configure backup strategies
4. Set up staging environment for testing

---

**Created by**: Deployment Team  
**Date**: July 10, 2025  
**Version**: 2.0
