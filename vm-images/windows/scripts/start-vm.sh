#!/bin/bash

# Start Windows VM
# Usage: ./start-vm.sh <vm-name> <windows-version> <ram-mb> <cpu-cores> <vnc-port> <rdp-port>

set -e

VM_NAME=$1
WINDOWS_VERSION=$2
RAM_MB=${3:-8192}
CPU_CORES=${4:-4}
VNC_PORT=${5:-5900}
RDP_PORT=${6:-3389}

BASE_IMAGE="/var/lib/libvirt/images/${WINDOWS_VERSION}-base.qcow2"
VM_STORAGE="/var/lib/cloud-device-lab/vms"
VM_IMAGE="$VM_STORAGE/${VM_NAME}.qcow2"
VM_PID_FILE="/tmp/vm-${VM_NAME}.pid"

mkdir -p "$VM_STORAGE"

if [ ! -f "$BASE_IMAGE" ]; then
  echo "Error: Base image not found: $BASE_IMAGE"
  exit 1
fi

echo "Creating VM: $VM_NAME"
echo "Base: $WINDOWS_VERSION"
echo "RAM: ${RAM_MB}MB"
echo "CPU: $CPU_CORES cores"
echo "VNC: localhost:$VNC_PORT"
echo "RDP: localhost:$RDP_PORT"

# Create copy-on-write image from base
qemu-img create -f qcow2 -b "$BASE_IMAGE" -F qcow2 "$VM_IMAGE"

# Start VM
qemu-system-x86_64 \
  -name "$VM_NAME" \
  -machine type=q35,accel=kvm \
  -cpu host \
  -smp "$CPU_CORES" \
  -m "$RAM_MB" \
  -drive file="$VM_IMAGE",if=virtio,format=qcow2 \
  -net nic,model=virtio \
  -net user,hostfwd=tcp::${RDP_PORT}-:3389 \
  -vga qxl \
  -vnc :$(($VNC_PORT - 5900)) \
  -usbdevice tablet \
  -daemonize \
  -pidfile "$VM_PID_FILE" \
  -monitor unix:/tmp/vm-${VM_NAME}-monitor.sock,server,nowait

# Wait for VM to start
sleep 5

if [ -f "$VM_PID_FILE" ]; then
  PID=$(cat "$VM_PID_FILE")
  echo "VM started successfully"
  echo "PID: $PID"
  echo "VNC: localhost:$VNC_PORT"
  echo "RDP: localhost:$RDP_PORT"
  echo "Monitor: /tmp/vm-${VM_NAME}-monitor.sock"
else
  echo "Error: Failed to start VM"
  exit 1
fi

# Save VM info
cat > "/tmp/vm-${VM_NAME}-info.json" << EOF
{
  "name": "$VM_NAME",
  "version": "$WINDOWS_VERSION",
  "ram": $RAM_MB,
  "cpu": $CPU_CORES,
  "vncPort": $VNC_PORT,
  "rdpPort": $RDP_PORT,
  "pid": $PID,
  "imagePath": "$VM_IMAGE",
  "monitorSocket": "/tmp/vm-${VM_NAME}-monitor.sock"
}
EOF

echo "VM info saved to /tmp/vm-${VM_NAME}-info.json"
