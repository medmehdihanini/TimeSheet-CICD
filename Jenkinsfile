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
                            sh "trivy image ${BACKEND_IMAGE}:latest || true"
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    echo 'Deploying application stack...'
                    sh 'docker-compose down || true'
                    sh 'docker-compose up -d'
                    
                    echo 'Waiting for services to be ready...'
                    sh 'sleep 30'
                    
                    echo 'Verifying deployment...'
                    sh 'docker-compose ps'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Performing health checks...'
                    sh '''
                        echo "Checking Frontend..."
                        curl -f http://localhost:8080 || exit 1
                        
                        echo "Checking Backend..."
                        curl -f http://localhost:8083/actuator/health || exit 1
                        
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
