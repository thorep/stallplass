#!/bin/bash

# Real-time logging script that captures the last 5000 lines
# Usage: ./scripts/run-with-log.sh "command to run" [log-name] [--reset]

set -e

# Create logs directory if it doesn't exist
mkdir -p logs

# Parse arguments
COMMAND="$1"
LOG_NAME="${2:-default}"
RESET_LOG="false"

# Check if --reset flag is provided
if [[ "$3" == "--reset" ]] || [[ "$2" == "--reset" ]]; then
    RESET_LOG="true"
    # If --reset is the second argument, use default log name
    if [[ "$2" == "--reset" ]]; then
        LOG_NAME="default"
    fi
fi

LOG_FILE="logs/${LOG_NAME}.log"
TEMP_LOG="logs/${LOG_NAME}_temp.log"

# Function to rotate log file to keep only last 5000 lines
rotate_log() {
    if [[ -f "$LOG_FILE" ]]; then
        tail -5000 "$LOG_FILE" > "$TEMP_LOG" 2>/dev/null || true
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

# Reset log file if requested
if [[ "$RESET_LOG" == "true" ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Resetting log file" > "$LOG_FILE"
fi

# Add start marker to log
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting command: $COMMAND" >> "$LOG_FILE"

# Run the command with real-time logging
# tee -a appends to log file while showing output in terminal
eval "$COMMAND" 2>&1 | while IFS= read -r line; do
    # Add timestamp and write to log
    echo "$(date '+%Y-%m-%d %H:%M:%S') $line" >> "$LOG_FILE"
    
    # Also output to terminal
    echo "$line"
    
    # Rotate log if it gets too big (every 500 lines for performance)
    if (( $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) > 5500 )); then
        rotate_log
    fi
done

# Final rotation to ensure we keep only last 5000 lines
rotate_log