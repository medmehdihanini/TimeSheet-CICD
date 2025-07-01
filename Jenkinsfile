/**
 * Jenkins CI/CD Pipeline for TimeSheet Application
 * 
 * This pipeline orchestrates the complete DevOps lifecycle including:
 * - Source code management and validation
 * - Unit testing with coverage analysis
 * - Static code quality assessment
 * - Artifact repository management
 * - Containerized application deployment
 * - Infrastructure monitoring setup
 * - Application health verification
 */

pipeline {
    agent any
    
    environment {
        // Docker Registry Configuration
        DOCKER_REGISTRY = 'localhost:5000'
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-frontend"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/timesheet-backend"
        
        // Docker Build Optimization
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        
        // Application Configuration
        APPLICATION_NAME = 'TimeSheet'
        MAVEN_OPTS = '-Dmaven.repo.local=/var/jenkins_home/.m2/repository'
    }
    
    stages {
        stage('📥 Source Code Checkout') {
            steps {
                echo '🔍 Initiating source code checkout from SCM repository...'
                checkout scm
                echo '✅ Source code checkout completed successfully'
            }
        }
        
        stage('🧪 Execute Unit Tests & Code Coverage Analysis') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo '🧪 Executing comprehensive unit test suite with JaCoCo coverage analysis...'
                        try {
                            if (isUnix()) {
                                sh '''
                                    chmod +x mvnw
                                    echo "🔧 Running Maven test lifecycle with JaCoCo coverage reporting..."
                                    ./mvnw clean test jacoco:report -Dmaven.test.failure.ignore=false
                                '''
                            } else {
                                bat '''
                                    echo "🔧 Running Maven test lifecycle with JaCoCo coverage reporting..."
                                    .\\mvnw.cmd clean test jacoco:report -Dmaven.test.failure.ignore=false
                                '''
                            }
                            echo '✅ Unit tests and coverage analysis completed successfully!'
                        } catch (Exception e) {
                            echo "❌ Unit tests failed: ${e.getMessage()}"
                            currentBuild.result = 'FAILURE'
                            throw e
                        }
                    }
                }
            }
            post {
                always {
                    script {
                        echo '📊 Publishing test results and coverage reports...'
                        
                        // Publish JUnit test results
                        try {
                            junit(
                                testResults: 'Timesheet-Client-monolithic-arch/target/surefire-reports/TEST-*.xml',
                                allowEmptyResults: false,
                                skipPublishingChecks: true
                            )
                            echo '✅ JUnit test results published successfully'
                        } catch (Exception e) {
                            echo "⚠️ JUnit publishing failed: ${e.getMessage()}"
                        }
                        
                        // Publish JaCoCo coverage report
                        try {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'Timesheet-Client-monolithic-arch/target/site/jacoco',
                                reportFiles: 'index.html',
                                reportName: '📈 JaCoCo Code Coverage Report',
                                reportTitles: 'Code Coverage Analysis'
                            ])
                            echo '✅ JaCoCo coverage report published successfully'
                        } catch (Exception e) {
                            echo "⚠️ JaCoCo report publishing failed: ${e.getMessage()}"
                        }
                        
                        // Archive test artifacts for forensic analysis
                        archiveArtifacts(
                            artifacts: 'Timesheet-Client-monolithic-arch/target/surefire-reports/**,Timesheet-Client-monolithic-arch/target/site/jacoco/**',
                            allowEmptyArchive: true,
                            fingerprint: true
                        )
                        echo '📦 Test artifacts archived for analysis'
                    }
                }
            }
        }

        stage('🔍 Static Code Quality Analysis') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo '🔍 Initiating comprehensive static code quality analysis via SonarQube...'
                        try {
                            // Verify SonarQube service availability
                            sh '''
                                echo "🔗 Verifying SonarQube service connectivity..."
                                timeout 30s bash -c 'until curl -f http://sonarqube:9000/api/system/status --connect-timeout 5 --max-time 10; do 
                                    echo "⏳ Waiting for SonarQube service to be ready..."
                                    sleep 5
                                done'
                                echo "✅ SonarQube service is operational"
                            '''
                            
                            // Execute SonarQube analysis
                            if (isUnix()) {
                                sh '''
                                    chmod +x mvnw
                                    echo "🔬 Executing SonarQube static analysis..."
                                    ./mvnw sonar:sonar \\
                                        -Dsonar.projectKey=TimeSheet \\
                                        -Dsonar.projectName="TimeSheet Application" \\
                                        -Dsonar.host.url=http://sonarqube:9000 \\
                                        -Dsonar.token=sqp_f1faddc336afb599195d7151b784f32e97aadc5f \\
                                        -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                                '''
                            } else {
                                bat '''
                                    echo "🔬 Executing SonarQube static analysis..."
                                    .\\mvnw.cmd sonar:sonar ^
                                        -Dsonar.projectKey=TimeSheet ^
                                        -Dsonar.projectName="TimeSheet Application" ^
                                        -Dsonar.host.url=http://sonarqube:9000 ^
                                        -Dsonar.token=sqp_f1faddc336afb599195d7151b784f32e97aadc5f ^
                                        -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                                '''
                            }
                            echo '✅ Static code quality analysis completed successfully!'
                        } catch (Exception e) {
                            echo "⚠️ SonarQube analysis encountered issues: ${e.getMessage()}"
                            echo "📝 This may indicate code quality concerns that require attention"
                            currentBuild.result = 'UNSTABLE'
                        }
                    }
                }
            }
        }

        stage('📦 Artifact Repository Deployment') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo '📦 Deploying application artifacts to Nexus Repository Manager...'
                        try {
                            // Verify Nexus service availability
                            sh '''
                                echo "🔗 Verifying Nexus Repository Manager connectivity..."
                                for attempt in {1..15}; do
                                    if curl -f http://nexus:8081/service/rest/v1/status --connect-timeout 10 --max-time 15 >/dev/null 2>&1; then
                                        echo "✅ Nexus Repository Manager is operational"
                                        break
                                    fi
                                    echo "⏳ Nexus not ready, attempt $attempt/15, retrying in 10 seconds..."
                                    sleep 10
                                done
                            '''
                            
                            // Deploy artifacts to Nexus
                            if (isUnix()) {
                                sh '''
                                    chmod +x mvnw
                                    echo "🚀 Deploying artifacts to Nexus Repository..."
                                    ./mvnw clean deploy -DskipTests \\
                                        -s ../settings.xml \\
                                        -DaltDeploymentRepository=nexus-snapshots::default::http://nexus:8081/repository/maven-snapshots-timesheet/ \\
                                        -Dmaven.deploy.skip=false
                                '''
                            } else {
                                bat '''
                                    echo "🚀 Deploying artifacts to Nexus Repository..."
                                    .\\mvnw.cmd clean deploy -DskipTests ^
                                        -s ..\\settings.xml ^
                                        -DaltDeploymentRepository=nexus-snapshots::default::http://nexus:8081/repository/maven-snapshots-timesheet/ ^
                                        -Dmaven.deploy.skip=false
                                '''
                            }
                            echo '✅ Artifact deployment to Nexus completed successfully!'
                        } catch (Exception e) {
                            echo "❌ Nexus deployment failed: ${e.getMessage()}"
                            currentBuild.result = 'UNSTABLE'
                        }
                    }
                }
            }
        }

        stage('🏗️ Backend Application Build') {
            steps {
                dir('Timesheet-Client-monolithic-arch') {
                    script {
                        echo '🏗️ Building Spring Boot backend application and Docker image...'
                        try {
                            // Build Spring Boot application
                            if (isUnix()) {
                                sh '''
                                    chmod +x mvnw
                                    echo "⚙️ Compiling Spring Boot application..."
                                    ./mvnw clean package -DskipTests -Dmaven.test.skip=true
                                '''
                            } else {
                                bat '''
                                    echo "⚙️ Compiling Spring Boot application..."
                                    .\\mvnw.cmd clean package -DskipTests -Dmaven.test.skip=true
                                '''
                            }
                            
                            // Build Docker image
                            sh """
                                echo "🐳 Building backend Docker image..."
                                docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -t ${BACKEND_IMAGE}:latest .
                                echo "📋 Backend Docker image built: ${BACKEND_IMAGE}:${BUILD_NUMBER}"
                            """
                            echo '✅ Backend application build completed successfully!'
                        } catch (Exception e) {
                            echo "❌ Backend build failed: ${e.getMessage()}"
                            currentBuild.result = 'FAILURE'
                            throw e
                        }
                    }
                }
            }
        }
        
        stage('🎨 Frontend Application Build') {
            steps {
                dir('Timesheet_FrontEnd') {
                    script {
                        echo '🎨 Building Angular frontend application and Docker image...'
                        try {
                            sh """
                                echo "🐳 Building frontend Docker image..."
                                docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} -t ${FRONTEND_IMAGE}:latest .
                                echo "📋 Frontend Docker image built: ${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                            """
                            echo '✅ Frontend application build completed successfully!'
                        } catch (Exception e) {
                            echo "❌ Frontend build failed: ${e.getMessage()}"
                            currentBuild.result = 'FAILURE'
                            throw e
                        }
                    }
                }
            }
        }
        
        stage('🗄️ Infrastructure Services Deployment') {
            steps {
                script {
                    echo '🗄️ Deploying core infrastructure services (databases, repositories)...'
                    try {
                        // Cleanup existing containers
                        sh '''
                            echo "🧹 Cleaning up existing container instances..."
                            docker-compose down --remove-orphans || true
                        '''
                        
                        // Deploy database services
                        sh '''
                            echo "🗄️ Deploying database services..."
                            docker-compose up -d mysql postgres
                            echo "⏳ Allowing database initialization time..."
                            sleep 30
                        '''
                        
                        // Deploy repository and analysis services
                        sh '''
                            echo "📦 Deploying SonarQube and Nexus services..."
                            docker-compose up -d sonarqube nexus
                            echo "⏳ Allowing services to initialize..."
                            sleep 15
                        '''
                        echo '✅ Infrastructure services deployment completed!'
                    } catch (Exception e) {
                        echo "❌ Infrastructure deployment failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }
        
        stage('🚀 Backend Service Deployment') {
            steps {
                script {
                    echo '🚀 Deploying backend application service...'
                    try {
                        sh '''
                            echo "🏗️ Deploying Spring Boot backend service..."
                            docker-compose up -d backend
                            echo "⏳ Allowing backend service to initialize..."
                            sleep 20
                        '''
                        echo '✅ Backend service deployment completed!'
                    } catch (Exception e) {
                        echo "❌ Backend deployment failed: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('🌐 Frontend Service Deployment') {
            steps {
                script {
                    echo '🌐 Deploying frontend application service...'
                    try {
                        sh '''
                            echo "🎨 Deploying Angular frontend service..."
                            docker-compose up -d frontend
                            echo "⏳ Allowing frontend service to initialize..."
                            sleep 15
                        '''
                        echo '✅ Frontend service deployment completed!'
                    } catch (Exception e) {
                        echo "❌ Frontend deployment failed: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('📊 Monitoring Stack Deployment') {
            steps {
                script {
                    echo '📊 Deploying comprehensive monitoring and observability stack...'
                    try {
                        sh '''
                            echo "📈 Deploying Prometheus metrics collection service..."
                            docker-compose up -d prometheus
                            
                            echo "📊 Deploying Grafana visualization dashboard..."
                            docker-compose up -d grafana
                            
                            echo "🔍 Deploying Node Exporter for system metrics..."
                            docker-compose up -d node-exporter
                            
                            echo "📋 Deploying Nginx Exporter for web server metrics..."
                            docker-compose up -d nginx-exporter || true
                            
                            echo "⏳ Allowing monitoring services to initialize..."
                            sleep 10
                        '''
                        
                        // Display deployment status
                        sh '''
                            echo "📋 Current deployment status:"
                            docker-compose ps
                        '''
                        echo '✅ Monitoring stack deployment completed successfully!'
                    } catch (Exception e) {
                        echo "⚠️ Monitoring deployment encountered issues: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('🔍 Application Health Verification') {
            steps {
                script {
                    echo '🔍 Performing comprehensive application health verification...'
                    
                    // Backend health verification
                    try {
                        sh '''
                            echo "🏥 Verifying backend application health..."
                            for attempt in {1..10}; do
                                if curl -f http://localhost:8083/actuator/health --connect-timeout 10 --max-time 15 >/dev/null 2>&1; then
                                    echo "✅ Backend application is healthy and responsive"
                                    curl -s http://localhost:8083/actuator/health | head -5
                                    break
                                fi
                                echo "⏳ Backend health check attempt $attempt/10, retrying in 10 seconds..."
                                sleep 10
                            done
                        '''
                    } catch (Exception e) {
                        echo "⚠️ Backend health verification failed: ${e.getMessage()}"
                    }
                    
                    // Frontend health verification
                    try {
                        sh '''
                            echo "🌐 Verifying frontend application availability..."
                            for attempt in {1..8}; do
                                if curl -f http://localhost:4200 --connect-timeout 10 --max-time 15 >/dev/null 2>&1; then
                                    echo "✅ Frontend application is available and serving content"
                                    break
                                fi
                                echo "⏳ Frontend health check attempt $attempt/8, retrying in 10 seconds..."
                                sleep 10
                            done
                        '''
                    } catch (Exception e) {
                        echo "⚠️ Frontend health verification failed: ${e.getMessage()}"
                    }
                    
                    // Monitoring services verification
                    try {
                        sh '''
                            echo "📊 Verifying monitoring services..."
                            echo "🔍 Prometheus metrics endpoint check..."
                            curl -f http://localhost:9090/-/healthy --connect-timeout 5 >/dev/null 2>&1 && echo "✅ Prometheus is operational" || echo "⚠️ Prometheus health check failed"
                            
                            echo "📈 Grafana dashboard availability check..."
                            curl -f http://localhost:3000/api/health --connect-timeout 5 >/dev/null 2>&1 && echo "✅ Grafana is operational" || echo "⚠️ Grafana health check failed"
                        '''
                    } catch (Exception e) {
                        echo "📝 Monitoring services verification completed with warnings"
                    }
                    
                    echo '✅ Application health verification process completed'
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo '🧹 Performing post-deployment cleanup operations...'
                sh '''
                    echo "🗂️ Cleaning up unused Docker images..."
                    docker image prune -f --filter "dangling=true" || true
                    
                    echo "📊 Final system resource status:"
                    docker system df || true
                '''
            }
        }
        success {
            echo '''
            🎉 ========================================
            🎉    PIPELINE EXECUTION SUCCESSFUL     
            🎉 ========================================
            
            ✅ All stages completed successfully
            🔗 Application endpoints:
               • Backend:    http://localhost:8083
               • Frontend:   http://localhost:4200
               • SonarQube:  http://localhost:9000
               • Nexus:      http://localhost:8081
               • Grafana:    http://localhost:3000
               • Prometheus: http://localhost:9090
            '''
        }
        failure {
            script {
                echo '''
                ❌ ========================================
                ❌      PIPELINE EXECUTION FAILED       
                ❌ ========================================
                '''
                
                sh '''
                    echo "📋 Collecting failure diagnostics..."
                    docker-compose logs --tail=50 2>/dev/null || echo "Unable to collect container logs"
                    
                    echo "🔍 Container status at failure:"
                    docker-compose ps 2>/dev/null || echo "Unable to collect container status"
                '''
            }
        }
        unstable {
            echo '''
            ⚠️ ========================================
            ⚠️    PIPELINE COMPLETED WITH WARNINGS  
            ⚠️ ========================================
            
            📝 Some stages completed with warnings
            🔍 Please review the build logs for details
            '''
        }
    }
}
