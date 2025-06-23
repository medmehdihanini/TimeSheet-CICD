# Jenkins Docker Setup for TimeSheet CI/CD

This folder contains the Jenkins Docker configuration files for the TimeSheet Spring Boot + Angular project.

## Files

- **Dockerfile**: Custom Jenkins image with Spring Boot and Angular build tools
- **plugins.txt**: List of Jenkins plugins required for the CI/CD pipeline

## Features

### Backend Support (Spring Boot)
- Java 17 JDK
- Maven build tool
- JAVA_HOME and Maven environment variables

### Frontend Support (Angular)
- Node.js 18 LTS
- Angular CLI
- npm latest version

### CI/CD Tools
- Docker CLI and Docker Compose
- Git for source control
- PowerShell (for .ps1 scripts compatibility)
- Additional utilities (jq, zip, rsync)

### Jenkins Plugins
- Build tools (Maven, Node.js)
- Docker integration
- Testing and quality gates (JUnit, JaCoCo, SonarQube)
- Monitoring (Prometheus)
- Notifications (Slack, Email)

## Usage

### Build the Jenkins Image

```bash
cd jenkins
docker build -t jenkins-timesheet .
```

### Run Jenkins Container

```bash
docker run -d \
  --name jenkins-timesheet \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins-timesheet
```

### Access Jenkins

1. Open your browser and go to `http://localhost:8080`
2. Get the initial admin password:
   ```bash
   docker exec jenkins-timesheet cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. Complete the setup wizard
4. The plugins from `plugins.txt` will be automatically installed

## Environment Variables

- `JAVA_HOME`: `/usr/lib/jvm/java-17-openjdk-amd64`
- `MAVEN_HOME`: `/usr/share/maven`
- `PATH`: Includes Java and Maven binaries

## Notes

- The container runs as the `jenkins` user for security
- Docker socket is mounted to allow Jenkins to build Docker images
- PowerShell is included for Windows script compatibility
- All necessary build tools are pre-installed for immediate use
