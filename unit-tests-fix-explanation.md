## Alternative Ultra-Simple Unit Tests Stage

Si le problème persiste, remplacez complètement le stage 'Unit Tests' par cette version plus simple :

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
                echo 'Unit tests completed!'
            }
        }
    }
    post {
        always {
            echo 'Publishing test results...'
            // Simple publishing without complex error handling
            publishTestResults testResultsPattern: 'Timesheet-Client-monolithic-arch/target/surefire-reports/TEST-*.xml'
            
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'Timesheet-Client-monolithic-arch/target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'JaCoCo Code Coverage Report'
            ])
            
            echo 'Test result publishing completed'
        }
    }
}
```

Cette version :
1. Élimine toutes les vérifications de fichiers complexes
2. Publie directement les résultats
3. Laisse Jenkins gérer les erreurs de publication
4. Ne fait pas échouer le build pour des problèmes de publication

## Problème Principal Identifié

Le problème principal était que `fileExists('Timesheet-Client-monolithic-arch/target/surefire-reports/TEST-*.xml')` ne fonctionne pas avec les wildcards (*) dans Jenkins. 

Les fichiers existent clairement :
- TEST-tn.ey.timesheetclient.TimesheetClientApplicationTests.xml
- TEST-tn.ey.timesheetclient.util.MathUtilTest.xml

Mais la fonction `fileExists()` ne peut pas vérifier des patterns avec wildcards.
