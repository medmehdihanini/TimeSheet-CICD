#!/bin/bash

# Get the host IP from environment variable or default to localhost
API_HOST=${API_HOST:-localhost}
API_URL="http://${API_HOST}:8083"

echo "Configuring frontend to use API at: $API_URL"

# Replace localhost:8083 with the actual API URL in all JavaScript files
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|http://localhost:8083|$API_URL|g" {} \;
find /usr/share/nginx/html -name "*.js" -exec sed -i "s|https://localhost:8083|$API_URL|g" {} \;

echo "API URL replacement completed"

# Start nginx
exec "$@"
