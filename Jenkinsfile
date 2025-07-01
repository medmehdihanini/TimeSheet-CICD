pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-frontend"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-backend"
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
                        echo 'Unit tests completed successfully!'
                    }
                }
            }
            post {
                always {
                    script {
                        echo 'Publishing test results and coverage reports...'
                        
                        // Use the junit step instead of publishTestResults
                        try {
                            junit 'Timesheet-Client-monolithic-arch/target/surefire-reports/TEST-*.xml'
                            echo 'Test results published with junit step'
                        } catch (Exception e) {
                            echo "junit step failed: ${e.getMessage()}"
                            // Try the original publishTestResults as fallback
                            try {
                                publishTestResults 'Timesheet-Client-monolithic-arch/target/surefire-reports/TEST-*.xml'
                                echo 'Test results published with publishTestResults'
                            } catch (Exception e2) {
                                echo "publishTestResults also failed: ${e2.getMessage()}"
                                // Don't fail the build
                            }
                        }
                        
                        // Publish JaCoCo coverage report
                        try {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'Timesheet-Client-monolithic-arch/target/site/jacoco',
                                reportFiles: 'index.html',
                                reportName: 'JaCoCo Code Coverage Report'
                            ])
                            echo 'JaCoCo coverage report published successfully'
                        } catch (Exception e) {
                            echo "JaCoCo publishing failed: ${e.getMessage()}"
                        }
                        
                        // Archive artifacts for debugging
                        archiveArtifacts(
                            artifacts: 'Timesheet-Client-monolithic-arch/target/surefire-reports/**,Timesheet-Client-monolithic-arch/target/site/jacoco/**',
                            allowEmptyArchive: true
                        )
                        echo 'Artifacts archived'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo 'Running SonarQube code quality analysis...'
                        try {
                            // Simple wait for SonarQube
                            sh '''
                                echo "Checking SonarQube availability..."
                                sleep 10
                                echo "Attempting SonarQube connection..."
                                curl -f http://localhost:9000/api/system/status --connect-timeout 10 || echo "SonarQube check failed, continuing anyway..."
                            '''
                            
                            // Run SonarQube analysis with simplified command
                            if (isUnix()) {
                                sh '''
                                    chmod +x mvnw
                                    ./mvnw sonar:sonar \\
                                      -Dsonar.projectKey=TimeSheet \\
                                      -Dsonar.projectName="TimeSheet" \\
                                      -Dsonar.host.url=http://localhost:9000 \\
                                      -Dsonar.token=sqp_f1faddc336afb599195d7151b784f32e97aadc5f
                                '''
                            } else {
                                bat '''
                                    .\\mvnw.cmd sonar:sonar ^
                                      -Dsonar.projectKey=TimeSheet ^
                                      -Dsonar.projectName="TimeSheet" ^
                                      -Dsonar.host.url=http://localhost:9000 ^
                                      -Dsonar.token=sqp_f1faddc336afb599195d7151b784f32e97aadc5f
                                '''
                            }
                            echo 'SonarQube analysis completed successfully!'
                        } catch (Exception e) {
                            echo "SonarQube analysis failed: ${e.getMessage()}"
                            echo "This might be expected if SonarQube is not fully ready"
                            currentBuild.result = 'UNSTABLE'
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
                        try {
                            // Wait for Nexus to be available
                            sh '''
                                echo "Waiting for Nexus to be ready..."
                                for i in {1..15}; do
                                    if curl -f http://localhost:8081/service/rest/v1/status --connect-timeout 10 >/dev/null 2>&1; then
                                        echo "Nexus is ready!"
                                        break
                                    fi
                                    echo "Nexus not ready, waiting... attempt $i/15"
                                    sleep 10
                                done
                            '''
                            
                            if (isUnix()) {
                                sh '''
                                    chmod +x mvnw
                                    ./mvnw clean deploy -DskipTests \\
                                        -s ../settings.xml \\
                                        -DaltDeploymentRepository=nexus-snapshots::default::http://localhost:8081/repository/maven-snapshots-timesheet/
                                '''
                            } else {
                                bat '''
                                    .\\mvnw.cmd clean deploy -DskipTests ^
                                        -s ..\\settings.xml ^
                                        -DaltDeploymentRepository=nexus-snapshots::default::http://localhost:8081/repository/maven-snapshots-timesheet/
                                '''
                            }
                        } catch (Exception e) {
                            echo "Nexus deployment failed: ${e.getMessage()}"
                            currentBuild.result = 'UNSTABLE'
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
                        if (isUnix()) {
                            sh 'chmod +x mvnw'
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
        
        stage('Deploy') {
            steps {
                script {
                    echo 'Deploying application stack...'
                    
                    // Clean up existing containers
                    sh 'docker-compose down || true'
                    
                    // Start services in order
                    echo 'Starting databases...'
                    sh 'docker-compose up -d mysql postgres'
                    
                    echo 'Waiting for databases...'
                    sh 'sleep 30'
                    
                    echo 'Starting SonarQube and Nexus...'
                    sh 'docker-compose up -d sonarqube nexus'
                    
                    echo 'Starting application services...'
                    sh 'docker-compose up -d backend frontend'
                    
                    echo 'Starting monitoring services...'
                    sh 'docker-compose up -d prometheus grafana'
                    
                    echo 'Deployment completed'
                    sh 'docker-compose ps'
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    echo 'Performing basic health checks...'
                    sh '''
                        echo "Checking Backend..."
                        for i in {1..5}; do
                            if curl -f http://localhost:8083/actuator/health --connect-timeout 10 >/dev/null 2>&1; then
                                echo "Backend is healthy!"
                                break
                            fi
                            echo "Backend not ready, waiting... attempt $i/5"
                            sleep 10
                        done
                        
                        echo "Checking Frontend..."
                        for i in {1..5}; do
                            if curl -f http://localhost:4200 --connect-timeout 10 >/dev/null 2>&1; then
                                echo "Frontend is healthy!"
                                break
                            fi
                            echo "Frontend not ready, waiting... attempt $i/5"
                            sleep 10
                        done
                        
                        echo "Health checks completed"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up Docker images...'
            sh 'docker image prune -f || true'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
            sh 'docker-compose logs --tail=50'
        }
    }
}
