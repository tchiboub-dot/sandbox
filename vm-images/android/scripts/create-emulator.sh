#!/bin/bash

# Android Emulator Creation Script
# Usage: ./create-emulator.sh <emulator-name> <android-version> <resolution> <ram> <cpu-cores>

set -e

EMULATOR_NAME=$1
ANDROID_VERSION=$2
RESOLUTION=$3
RAM=${4:-4096}
CPU_CORES=${5:-4}

# Map Android version to API level
case $ANDROID_VERSION in
  "Android 10")
    API_LEVEL=29
    SYSTEM_IMAGE="system-images;android-29;google_apis;x86_64"
    ;;
  "Android 11")
    API_LEVEL=30
    SYSTEM_IMAGE="system-images;android-30;google_apis;x86_64"
    ;;
  "Android 12")
    API_LEVEL=31
    SYSTEM_IMAGE="system-images;android-31;google_apis;x86_64"
    ;;
  "Android 13")
    API_LEVEL=33
    SYSTEM_IMAGE="system-images;android-33;google_apis;x86_64"
    ;;
  *)
    echo "Unsupported Android version: $ANDROID_VERSION"
    exit 1
    ;;
esac

# Parse resolution
IFS='x' read -ra RES <<< "$RESOLUTION"
WIDTH=${RES[0]}
HEIGHT=${RES[1]}

echo "Creating Android emulator: $EMULATOR_NAME"
echo "Android Version: $ANDROID_VERSION (API $API_LEVEL)"
echo "Resolution: ${WIDTH}x${HEIGHT}"
echo "RAM: ${RAM}MB"
echo "CPU Cores: $CPU_CORES"

# Create AVD
echo "no" | avdmanager create avd \
  --force \
  --name "$EMULATOR_NAME" \
  --package "$SYSTEM_IMAGE" \
  --device "pixel_5"

# Configure AVD
AVD_CONFIG="$ANDROID_AVD_HOME/${EMULATOR_NAME}.avd/config.ini"

cat > "$AVD_CONFIG" << EOF
hw.lcd.density=420
hw.lcd.width=$WIDTH
hw.lcd.height=$HEIGHT
hw.ramSize=$RAM
hw.cpu.ncore=$CPU_CORES
hw.keyboard=yes
hw.mainKeys=no
hw.gpu.enabled=yes
hw.gpu.mode=auto
hw.audioInput=yes
hw.audioOutput=yes
hw.camera.back=emulated
hw.camera.front=emulated
hw.gps=yes
hw.battery=yes
hw.accelerometer=yes
hw.gyroscope=yes
disk.dataPartition.size=6G
fastboot.chosenSnapshotFile=
fastboot.forceChosenSnapshotBoot=no
fastboot.forceColdBoot=yes
runtime.network.latency=none
runtime.network.speed=full
vm.heapSize=512
EOF

echo "AVD created successfully: $EMULATOR_NAME"
