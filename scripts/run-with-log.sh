#!/bin/bash

# Real-time logging script that captures the last 500 lines
# Usage: ./scripts/run-with-log.sh "command to run" [log-name]

set -e

# Create logs directory if it doesn't exist
mkdir -p logs

# Get the command to run and optional log name
COMMAND="$1"
LOG_NAME="${2:-default}"
LOG_FILE="logs/${LOG_NAME}.log"
TEMP_LOG="logs/${LOG_NAME}_temp.log"

# Function to rotate log file to keep only last 500 lines
rotate_log() {
    if [[ -f "$LOG_FILE" ]]; then
        tail -500 "$LOG_FILE" > "$TEMP_LOG" 2>/dev/null || true
        mv "$TEMP_LOG" "$LOG_FILE" 2>/dev/null || true
    fi
}

# Function to cleanup on exit
cleanup() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Command finished" >> "$LOG_FILE"
    rotate_log
}

# Set trap for cleanup
trap cleanup EXIT

# Add start marker to log
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting command: $COMMAND" >> "$LOG_FILE"

# Run the command with real-time logging
# tee -a appends to log file while showing output in terminal
eval "$COMMAND" 2>&1 | while IFS= read -r line; do
    # Add timestamp and write to log
    echo "$(date '+%Y-%m-%d %H:%M:%S') $line" >> "$LOG_FILE"
    
    # Also output to terminal
    echo "$line"
    
    # Rotate log if it gets too big (every 100 lines for performance)
    if (( $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) > 600 )); then
        rotate_log
    fi
done

# Final rotation to ensure we keep only last 500 lines
rotate_log