#!/bin/bash

# Stop Android Emulator
# Usage: ./stop-emulator.sh <emulator-name>

set -e

EMULATOR_NAME=$1
PID_FILE="/tmp/emulator-${EMULATOR_NAME}.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  echo "Stopping emulator $EMULATOR_NAME (PID: $PID)"
  
  kill $PID 2>/dev/null || true
  
  # Wait for process to terminate
  timeout 30 bash -c "while kill -0 $PID 2>/dev/null; do sleep 1; done" || kill -9 $PID 2>/dev/null || true
  
  rm "$PID_FILE"
  echo "Emulator stopped"
else
  echo "PID file not found: $PID_FILE"
  # Try to find and kill by name
  pkill -f "emulator.*$EMULATOR_NAME" || true
fi

# Clean up AVD
echo "Cleaning up AVD..."
rm -rf "$ANDROID_AVD_HOME/${EMULATOR_NAME}.avd"
rm -f "$ANDROID_AVD_HOME/${EMULATOR_NAME}.ini"

echo "Emulator cleanup complete"
