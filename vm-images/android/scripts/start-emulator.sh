#!/bin/bash

# Start Android Emulator
# Usage: ./start-emulator.sh <emulator-name> <adb-port>

set -e

EMULATOR_NAME=$1
ADB_PORT=${2:-5554}

echo "Starting emulator: $EMULATOR_NAME on port $ADB_PORT"

# Start emulator in background
$ANDROID_SDK_ROOT/emulator/emulator \
  -avd "$EMULATOR_NAME" \
  -no-audio \
  -no-boot-anim \
  -no-window \
  -gpu swiftshader_indirect \
  -accel on \
  -port $ADB_PORT \
  -verbose \
  >> /var/log/emulator-${EMULATOR_NAME}.log 2>&1 &

EMULATOR_PID=$!
echo "Emulator started with PID: $EMULATOR_PID"
echo $EMULATOR_PID > /tmp/emulator-${EMULATOR_NAME}.pid

# Wait for emulator to boot
echo "Waiting for emulator to boot..."
adb -s "emulator-$ADB_PORT" wait-for-device
sleep 10

# Wait for boot to complete
BOOT_COMPLETE=""
while [ -z "$BOOT_COMPLETE" ]; do
  BOOT_COMPLETE=$(adb -s "emulator-$ADB_PORT" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  sleep 2
done

echo "Emulator booted successfully"

# Install Chrome browser
echo "Installing Chrome browser..."
adb -s "emulator-$ADB_PORT" shell pm list packages | grep -q chrome || \
  adb -s "emulator-$ADB_PORT" shell pm enable com.android.chrome

# Unlock screen
adb -s "emulator-$ADB_PORT" shell input keyevent 82

# Disable animations for better performance
adb -s "emulator-$ADB_PORT" shell settings put global window_animation_scale 0
adb -s "emulator-$ADB_PORT" shell settings put global transition_animation_scale 0
adb -s "emulator-$ADB_PORT" shell settings put global animator_duration_scale 0

echo "Emulator ready: $EMULATOR_NAME"
