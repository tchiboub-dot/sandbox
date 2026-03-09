#!/bin/bash

# Stop Windows VM
# Usage: ./stop-vm.sh <vm-name>

set -e

VM_NAME=$1
VM_PID_FILE="/tmp/vm-${VM_NAME}.pid"
VM_IMAGE="/var/lib/cloud-device-lab/vms/${VM_NAME}.qcow2"
VM_INFO="/tmp/vm-${VM_NAME}-info.json"
VM_MONITOR="/tmp/vm-${VM_NAME}-monitor.sock"

if [ ! -f "$VM_PID_FILE" ]; then
  echo "VM not running or PID file not found"
  exit 0
fi

PID=$(cat "$VM_PID_FILE")

echo "Stopping VM: $VM_NAME (PID: $PID)"

# Send shutdown command via QEMU monitor
if [ -S "$VM_MONITOR" ]; then
  echo "system_powerdown" | socat - UNIX-CONNECT:"$VM_MONITOR"
  echo "Sent powerdown signal, waiting for graceful shutdown..."
  
  # Wait up to 30 seconds for graceful shutdown
  for i in {1..30}; do
    if ! kill -0 $PID 2>/dev/null; then
      echo "VM shut down gracefully"
      break
    fi
    sleep 1
  done
fi

# Force kill if still running
if kill -0 $PID 2>/dev/null; then
  echo "Forcing VM shutdown..."
  kill -9 $PID
fi

# Clean up
rm -f "$VM_PID_FILE"
rm -f "$VM_INFO"
rm -f "$VM_MONITOR"
rm -f "$VM_IMAGE"

echo "VM stopped and cleaned up"
