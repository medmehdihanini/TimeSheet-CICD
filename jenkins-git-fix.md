# Jenkins Git Configuration Fix

## Issue
After moving Jenkins to the timesheet network, Git operations fail with "fatal: not in a git directory" error.

## Root Cause
1. Container recreation changed file ownership
2. Jenkins runs as `jenkins` user but files are owned by `root`
3. Git security settings prevent access to "dubious ownership" repositories

## Solution Applied
```bash
# Fix applied to running container
docker exec timesheet-jenkins git config --global --add safe.directory '*'
docker exec timesheet-jenkins git config --global --add safe.directory /var/jenkins_home/workspace/Timesheet-CICD
```

## Permanent Fix
To make this permanent, add to Jenkins Dockerfile:
```dockerfile
USER jenkins
RUN git config --global --add safe.directory '*'
```

## Test Results
- ✅ Jenkins can now access SonarQube at `http://sonarqube:9000`
- ✅ Jenkins can resolve Nexus at `http://nexus:8081`  
- ✅ Git status works in workspace directory
- ✅ Network connectivity established between Jenkins and other services

## Next Steps
1. Test pipeline execution
2. Verify SonarQube analysis works
3. Confirm Nexus deployment functions properly
