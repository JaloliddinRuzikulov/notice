#\!/bin/bash
echo "=== BROADCAST MONITORING STARTED ==="
echo "Press Ctrl+C to stop"
echo ""

# Function to monitor logs
monitor_logs() {
    tail -f server.log  < /dev/null |  while read line; do
        # Color code different types of messages
        if echo "$line" | grep -q "ERROR\|Failed\|failed\|timeout"; then
            echo -e "\033[31m[ERROR] $line\033[0m"  # Red
        elif echo "$line" | grep -q "Channel\|Active:"; then
            echo -e "\033[33m[CHANNEL] $line\033[0m"  # Yellow
        elif echo "$line" | grep -q "Call answered\|confirmed"; then
            echo -e "\033[32m[SUCCESS] $line\033[0m"  # Green
        elif echo "$line" | grep -q "BROADCAST\|Queue\|Starting call"; then
            echo -e "\033[36m[INFO] $line\033[0m"  # Cyan
        elif echo "$line" | grep -q "SMS"; then
            echo -e "\033[35m[SMS] $line\033[0m"  # Magenta
        fi
    done
}

# Start monitoring
monitor_logs
