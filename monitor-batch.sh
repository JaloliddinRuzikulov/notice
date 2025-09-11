#!/bin/bash

echo "=== BATCH SYSTEM MONITOR ==="
echo "Watching for batch activity..."
echo ""

# Watch for batch-related messages
tail -f /home/user/server.log | grep -E --line-buffered "(Starting new batch|Batch complete|Active:|Waiting.*seconds|processNextInQueue|Batch limit|queue|totalActiveCallsCount)" | while IFS= read -r line
do
    # Add timestamp
    echo "[$(date '+%H:%M:%S')] $line"
done