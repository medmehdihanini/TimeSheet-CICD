@echo off
echo Stopping all services...
docker-compose down

echo Cleaning up Docker images...
docker image prune -f

echo Removing Docker registry container...
docker stop registry >nul 2>&1
docker rm registry >nul 2>&1

echo Cleanup complete!
pause
