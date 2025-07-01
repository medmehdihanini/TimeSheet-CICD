pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-frontend"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-backend"
        // For WSL compatibility
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Security Scan - Frontend') {
            steps {
                dir('Timesheet_FrontEnd') {
                    script {
                        echo 'Running security scan on Frontend Dockerfile...'
                        sh 'trivy fs --security-checks vuln,secret,config . || true'
                    }
                }
            }
        }
          stage('Security Scan - Backend') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo 'Running security scan on Backend...'
                        sh 'trivy fs --security-checks vuln,secret,config . || true'
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo 'Running unit tests with JaCoCo coverage...'
                        if (isUnix()) {
                            sh 'chmod +x mvnw'
                            sh './mvnw clean test jacoco:report'
                        } else {
                            bat '.\\mvnw.cmd clean test jacoco:report'
                        }
                    }
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'Timesheet-Client-monolithic-arch/target/surefire-reports/*.xml'
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'Timesheet-Client-monolithic-arch/target/site/jacoco',
                        reportFiles: 'index.html',
                        reportName: 'JaCoCo Code Coverage Report'
                    ])
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo 'Running SonarQube code quality analysis...'
                        // Wait for SonarQube to be available
                        sh '''
                            echo "Waiting for SonarQube to be ready..."
                            for i in {1..30}; do
                                if curl -f http://localhost:9000/api/system/status --connect-timeout 10; then
                                    echo "SonarQube is ready!"
                                    break
                                fi
                                echo "SonarQube not ready, waiting... attempt $i/30"
                                sleep 10
                            done
                        '''
                        
                        withSonarQubeEnv(credentialsId: 'sonar_auth', installationName: 'SonarQube') {
                            script {
                                def scannerHome = tool name: 'SonarQube', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                                sh """
                                  export PATH=\$PATH:${scannerHome}/bin
                                  sonar-scanner \
                                    -Dsonar.projectKey=TimeSheet \
                                    -Dsonar.projectName="TimeSheet" \
                                    -Dsonar.sources=src/main/java \
                                    -Dsonar.tests=src/test/java \
                                    -Dsonar.java.binaries=target/classes \
                                    -Dsonar.host.url=http://localhost:9000 \
                                    -Dsonar.login=sqp_f1faddc336afb599195d7151b784f32e97aadc5f \
                                    -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to Nexus') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo 'Deploying artifacts to Nexus Repository...'
                        // Wait for Nexus to be available
                        sh '''
                            echo "Waiting for Nexus to be ready..."
                            for i in {1..30}; do
                                if curl -f http://localhost:8081/service/rest/v1/status --connect-timeout 10; then
                                    echo "Nexus is ready!"
                                    break
                                fi
                                echo "Nexus not ready, waiting... attempt $i/30"
                                sleep 10
                            done
                        '''
                        
                        if (isUnix()) {
                            sh '''
                                chmod +x mvnw
                                ./mvnw clean deploy -DskipTests \
                                    -s ../settings.xml \
                                    -DaltDeploymentRepository=nexus-snapshots::default::http://localhost:8081/repository/maven-snapshots/
                            '''
                        } else {
                            bat '''
                                .\\mvnw.cmd clean deploy -DskipTests ^
                                    -s ..\\settings.xml ^
                                    -DaltDeploymentRepository=nexus-snapshots::default::http://localhost:8081/repository/maven-snapshots/
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo 'Building Spring Boot application...'
                        // Use wrapper script for cross-platform compatibility
                        if (isUnix()) {
                            // Make Maven wrapper executable and fix line endings
                            sh 'chmod +x mvnw'
                            sh 'sed -i "s/\\r$//" mvnw'
                            sh './mvnw clean package -DskipTests'
                        } else {
                            bat '.\\mvnw.cmd clean package -DskipTests'
                        }
                        echo 'Building Backend Docker image...'
                        sh "docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -t ${BACKEND_IMAGE}:latest ."
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('Timesheet_FrontEnd') {
                    script {
                        echo 'Building Frontend Docker image...'
                        sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} -t ${FRONTEND_IMAGE}:latest ."
                    }
                }
            }
        }
        
        stage('Container Security Scan') {
            parallel {
                stage('Scan Frontend Image') {
                    steps {
                        script {
                            echo 'Scanning Frontend Docker image for vulnerabilities...'
                            sh "trivy image ${FRONTEND_IMAGE}:latest || true"
                        }
                    }
                }
                stage('Scan Backend Image') {
                    steps {
                        script {
                            echo 'Scanning Backend Docker image for vulnerabilities...'
                            sh "trivy image ${BACKEND_IMAGE}:latest || true"                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            options {
                timeout(time: 10, unit: 'MINUTES')  // Reduced timeout from 15 to 10 minutes
            }
            steps {
                script {
                    echo 'Deploying application stack...'
                    
                    // Get Jenkins host IP
                    def hostIP = sh(script: "hostname -I | awk '{print \$1}'", returnStdout: true).trim()
                    if (!hostIP) {
                        hostIP = sh(script: "ip route get 8.8.8.8 | awk -F'src ' 'NR==1{split(\$2,a,\" \");print a[1]}'", returnStdout: true).trim()
                    }
                    
                    echo "Using host IP: ${hostIP}"
                    
                    // Set environment variable for docker-compose
                    withEnv(["HOST_IP=${hostIP}"]) {
                        // Create monitoring configuration dynamically
                        echo 'Setting up monitoring configuration...'
                        sh '''
                            mkdir -p monitoring
                            cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  - job_name: 'timesheet-backend'
    static_configs:
      - targets: ['backend:8083']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 10s
  - job_name: 'frontend-nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    scrape_interval: 10s
EOF
                        '''
                        
                        // Show current working directory
                        sh 'pwd && ls -la'
                        
                        // Clean up existing containers
                        echo 'Stopping existing containers...'
                        sh 'docker-compose down || true'
                        
                        // Clean up any lingering containers by name
                        echo 'Forcefully removing any existing containers...'
                        sh '''
                            docker rm -f timesheet-mysql || true
                            docker rm -f timesheet-backend || true
                            docker rm -f timesheet-frontend || true
                            docker rm -f timesheet-prometheus || true
                            docker rm -f timesheet-grafana || true
                            docker rm -f timesheet-node-exporter || true
                            docker rm -f timesheet-nginx-exporter || true
                            docker rm -f timesheet-sonarqube || true
                            docker rm -f sonarqube-postgres || true
                            docker rm -f timesheet-nexus || true
                        '''
                        
                        // Clean up any lingering containers
                        sh 'docker container prune -f || true'
                        
                        // Verify monitoring files exist
                        echo 'Checking monitoring files...'
                        sh 'ls -la monitoring/ && cat monitoring/prometheus.yml'
                        
                        // Debug: Check docker-compose prometheus configuration
                        echo 'Verifying Prometheus configuration in docker-compose.yml...'
                        sh 'grep -A 15 "prometheus:" docker-compose.yml'
                        
                        // Verify Prometheus Dockerfile exists
                        echo 'Checking Prometheus Dockerfile...'
                        sh 'ls -la monitoring/Dockerfile.prometheus && cat monitoring/Dockerfile.prometheus'
                        
                        // Ensure we have the latest images built
                        echo 'Building Prometheus custom image...'
                        sh 'docker-compose build prometheus'
                        
                        // Start services in proper order with delays
                        echo 'Starting MySQL and PostgreSQL databases...'
                        sh 'docker-compose up -d mysql postgres'
                        
                        // Wait for MySQL with timeout
                        echo 'Waiting for MySQL to be ready...'
                        sh '''
                            echo "Checking MySQL health..."
                            for i in {1..20}; do
                                if docker-compose ps mysql | grep -q "healthy"; then
                                    echo "MySQL is ready!"
                                    break
                                fi
                                echo "Waiting for MySQL... attempt $i/20"
                                sleep 10
                            done
                        '''
                        
                        // Wait for PostgreSQL
                        echo 'Waiting for PostgreSQL to be ready...'
                        sh '''
                            echo "Checking PostgreSQL health..."
                            for i in {1..20}; do
                                if docker-compose ps postgres | grep -q "healthy"; then
                                    echo "PostgreSQL is ready!"
                                    break
                                fi
                                echo "Waiting for PostgreSQL... attempt $i/20"
                                sleep 10
                            done
                        '''
                        
                        // Start SonarQube and Nexus (depend on databases)
                        echo 'Starting SonarQube and Nexus services...'
                        sh 'docker-compose up -d sonarqube nexus'
                        
                        // Start backend (depends on MySQL)
                        echo 'Starting backend service...'
                        sh 'docker-compose up -d backend'
                        
                        // Wait for backend to be ready
                        echo 'Waiting for backend to start...'
                        sh 'sleep 30'
                        
                        // Start frontend and monitoring services
                        echo 'Starting frontend and monitoring services...'
                        sh 'docker-compose up -d frontend prometheus grafana node-exporter nginx-exporter'
                        
                        // Final verification
                        echo 'Verifying deployment...'
                        sh 'docker-compose ps'
                    }
                }
            }
        }
        
        stage('Health Check') {
            options {
                timeout(time: 5, unit: 'MINUTES')  // Reduced timeout since services should be starting already
            }
            steps {
                script {
                    echo 'Performing health checks...'
                    sh '''
                        echo "Checking Frontend..."
                        for i in {1..5}; do
                            if curl -f http://localhost:4200 --connect-timeout 10; then
                                echo "Frontend is healthy!"
                                break
                            fi
                            echo "Frontend not ready, waiting... attempt $i/5"
                            sleep 10
                        done
                        
                        echo "Checking Backend..."
                        for i in {1..5}; do
                            if curl -f http://localhost:8083/actuator/health --connect-timeout 10; then
                                echo "Backend is healthy!"
                                break
                            fi
                            echo "Backend not ready, waiting... attempt $i/5"
                            sleep 10
                        done
                        
                        echo "Checking PostgreSQL..."
                        for i in {1..3}; do
                            if docker-compose ps postgres | grep -q "healthy"; then
                                echo "PostgreSQL is healthy!"
                                break
                            fi
                            echo "PostgreSQL not ready, waiting... attempt $i/3"
                            sleep 5
                        done
                        
                        echo "Checking Prometheus..."
                        for i in {1..3}; do
                            if curl -f http://localhost:9090/-/ready --connect-timeout 10; then
                                echo "Prometheus is healthy!"
                                break
                            fi
                            echo "Prometheus not ready, waiting... attempt $i/3"
                            sleep 5
                        done
                        
                        echo "Checking Grafana..."
                        for i in {1..3}; do
                            if curl -f http://localhost:3000/api/health --connect-timeout 10; then
                                echo "Grafana is healthy!"
                                break
                            fi
                            echo "Grafana not ready, waiting... attempt $i/3"
                            sleep 5
                        done
                        
                        echo "Checking SonarQube..."
                        for i in {1..5}; do
                            if curl -f http://localhost:9000/api/system/status --connect-timeout 10; then
                                echo "SonarQube is healthy!"
                                break
                            fi
                            echo "SonarQube not ready, waiting... attempt $i/5"
                            sleep 10
                        done
                        
                        echo "Checking Nexus..."
                        for i in {1..5}; do
                            if curl -f http://localhost:8081/service/rest/v1/status --connect-timeout 10; then
                                echo "Nexus is healthy!"
                                break
                            fi
                            echo "Nexus not ready, waiting... attempt $i/5"
                            sleep 10
                        done
                        
                        echo "All services are healthy!"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            sh 'docker image prune -f || true'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            sh 'docker-compose logs'
        }
    }
}
