#!/bin/bash

# Create Windows Base Image
# Usage: ./create-base-image.sh <windows-version>
# Example: ./create-base-image.sh windows-10

set -e

WINDOWS_VERSION=$1
ISO_PATH="/var/lib/libvirt/images/${WINDOWS_VERSION}.iso"
VIRTIO_ISO="/var/lib/libvirt/images/virtio-win.iso"
BASE_IMAGE_PATH="/var/lib/libvirt/images/${WINDOWS_VERSION}-base.qcow2"
DISK_SIZE="50G"

if [ ! -f "$ISO_PATH" ]; then
  echo "Error: Windows ISO not found: $ISO_PATH"
  exit 1
fi

if [ ! -f "$VIRTIO_ISO" ]; then
  echo "Error: VirtIO ISO not found: $VIRTIO_ISO"
  exit 1
fi

echo "Creating Windows base image: $WINDOWS_VERSION"

# Create disk image
qemu-img create -f qcow2 "$BASE_IMAGE_PATH" "$DISK_SIZE"

# Start Windows installation
qemu-system-x86_64 \
  -name "${WINDOWS_VERSION}-installer" \
  -machine type=q35,accel=kvm \
  -cpu host \
  -smp 4 \
  -m 8192 \
  -drive file="$BASE_IMAGE_PATH",if=virtio,format=qcow2 \
  -drive file="$ISO_PATH",media=cdrom,index=0 \
  -drive file="$VIRTIO_ISO",media=cdrom,index=1 \
  -boot order=d \
  -net nic,model=virtio \
  -net user \
  -vga qxl \
  -vnc :0 \
  -usbdevice tablet

echo ""
echo "============================================"
echo "Windows installation started!"
echo "Connect via VNC to localhost:5900 to complete installation"
echo ""
echo "Installation steps:"
echo "1. Install Windows"
echo "2. During installation, load VirtIO drivers from D: drive"
echo "3. Complete Windows setup"
echo "4. Install Edge browser (should be pre-installed)"
echo "5. Enable Remote Desktop"
echo "6. Disable Windows Firewall for private networks"
echo "7. Run Windows Update"
echo "8. Configure auto-login"
echo "9. When finished, shut down the VM"
echo ""
echo "After shutdown, snapshot the base image:"
echo "  qemu-img snapshot -c base-snapshot $BASE_IMAGE_PATH"
echo "============================================"
