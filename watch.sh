#!/bin/bash

# Configuration
INTERVAL=300 # 300 seconds = 5 minutes

echo "Starting DriftWatch Autopilot..."
echo "Running every $INTERVAL seconds. Press [CTRL+C] to stop."

while true
do
  echo "------------------------------------------"
  echo "Audit started at: $(date)"
  
  # Run the audit engine
  npx ts-node index.ts
  
  echo "Audit complete. Sleeping for $INTERVAL seconds..."
  sleep $INTERVAL
done