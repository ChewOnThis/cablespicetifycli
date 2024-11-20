#!/bin/bash
while true; do
  curl -X POST http://localhost:3000/refresh
  sleep 3600 # Wait for 1 hour
done
