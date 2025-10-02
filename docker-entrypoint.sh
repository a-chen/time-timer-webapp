#!/bin/sh

# Print version and startup information
if [ -f /app/version.txt ]; then
  echo "========================================="
  echo "Time Timer WebApp"
  cat /app/version.txt
  echo "-----------------------------------------"
  echo "Server running on:"
  if [ -n "$EXTERNAL_PORT" ]; then
    echo "  http://localhost:$EXTERNAL_PORT"
  else
    echo "  Internal port: 80"
    echo "  External port: Check docker-compose.yml"
  fi
  echo "========================================="
fi

# Start nginx
exec nginx -g 'daemon off;'
