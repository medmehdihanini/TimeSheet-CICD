## Version Ultra-Simple du Stage Unit Tests

Si le problème persiste, remplacez le stage 'Unit Tests' par cette version minimale :

```groovy
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
    // NO POST SECTION - just let the tests run without trying to publish
}
```

## Ou Version avec Publication Simple

```groovy
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
            // Simple publication sans vérification
            junit allowEmptyResults: true, testResults: 'Timesheet-Client-monolithic-arch/target/surefire-reports/TEST-*.xml'
            
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'Timesheet-Client-monolithic-arch/target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'JaCoCo Code Coverage Report'
            ])
        }
    }
}
```

## Diagnostic du Problème

Le problème semble être que Jenkins Pipeline utilise des plugins différents :
- `publishTestResults` - Plugin moderne
- `junit` - Plugin classique Jenkins
- `publishHTML` - Plugin HTML Publisher

La fonction `junit` est plus robuste et devrait fonctionner mieux.
