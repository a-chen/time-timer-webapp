#!/bin/sh

# Print version information
if [ -f /app/version.txt ]; then
  echo "========================================="
  echo "Time Timer WebApp"
  cat /app/version.txt
  echo "========================================="
fi

# Start nginx
exec nginx -g 'daemon off;'
