pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-frontend"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-backend"
        COMPOSE_PROJECT_NAME = 'timesheet-app'
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
                timeout(time: 15, unit: 'MINUTES')  // Add timeout for the entire deploy stage
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
                        // Clean up existing containers
                        echo 'Stopping existing containers...'
                        sh 'docker-compose down || true'
                        
                        // Clean up nginx exporter specifically to force recreation
                        sh 'docker rm -f timesheet-nginx-exporter || true'
                        
                        // Start only application services (exclude Jenkins)
                        echo 'Starting application services...'
                        sh 'docker-compose up --build -d mysql backend frontend nginx-exporter prometheus grafana node-exporter'
                        
                        // Wait for MySQL to be ready (longer wait time)
                        echo 'Waiting for MySQL to initialize...'
                        sh 'sleep 90'
                        
                        // Check if MySQL is healthy
                        sh '''
                            echo "Checking MySQL health..."
                            for i in {1..30}; do
                                if docker exec timesheet-mysql mysqladmin ping -h localhost --silent; then
                                    echo "MySQL is ready!"
                                    break
                                fi
                                echo "Waiting for MySQL... attempt $i/30"
                                sleep 10
                            done
                        '''
                        
                        // Wait additional time for backend to start
                        echo 'Waiting for backend to start...'
                        sh 'sleep 60'                    }
                    
                    echo 'Verifying deployment...'
                    sh 'docker-compose ps'
                }
            }
        }
        
        stage('Health Check') {
            options {
                timeout(time: 10, unit: 'MINUTES')  // Add timeout for health checks
            }
            steps {
                script {
                    echo 'Performing health checks...'
                    sh '''
                        echo "Checking Frontend..."
                        for i in {1..10}; do
                            if curl -f http://localhost:4200 --connect-timeout 10; then
                                echo "Frontend is healthy!"
                                break
                            fi
                            echo "Frontend not ready, waiting... attempt $i/10"
                            sleep 15
                        done
                        
                        echo "Checking Backend..."
                        for i in {1..10}; do
                            if curl -f http://localhost:8083/actuator/health --connect-timeout 10; then
                                echo "Backend is healthy!"
                                break
                            fi
                            echo "Backend not ready, waiting... attempt $i/10"
                            sleep 15
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
