# Windows VM Setup for Cloud Device Lab

This directory contains scripts and configurations for running Windows virtual machines with QEMU/KVM.

## Architecture

Windows VMs run with:
- QEMU/KVM virtualization
- VirtIO drivers for performance
- RDP access (converted to WebRTC)
- Remote input via QEMU guest agent
- Screen streaming via FFmpeg + WebRTC

## Requirements

- Linux host with KVM support
- QEMU 6.0+
- Windows 10 or Windows 11 ISO files
- Minimum 32GB RAM on host
- 100GB+ storage per VM
- VirtIO drivers ISO

## Setup

### 1. Install QEMU/KVM

```bash
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virt-manager
sudo systemctl enable libvirtd
sudo systemctl start libvirtd
```

### 2. Download Windows ISOs

Place Windows ISOs in `/var/lib/libvirt/images/`:
- `windows-10.iso`
- `windows-11.iso`

### 3. Download VirtIO Drivers

```bash
cd /var/lib/libvirt/images/
wget https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso
```

### 4. Create Base Windows Images

```bash
# Create Windows 10 base image
./scripts/create-base-image.sh windows-10

# Create Windows 11 base image
./scripts/create-base-image.sh windows-11
```

### 5. Install Node.js VM Host Server

```bash
npm install
npm run build
npm start
```

## API Endpoints

- `POST /api/windows/create` - Create new Windows VM
- `POST /api/vm/:vmId/restart` - Restart VM
- `POST /api/vm/:vmId/reset` - Reset VM to snapshot
- `DELETE /api/vm/:vmId` - Delete VM
- `GET /api/vm/:vmId/screenshot` - Take screenshot
- `POST /api/webrtc/offer` - Get WebRTC offer
- `GET /health` - Health check

## Environment Variables

```env
PORT=8080
QEMU_SYSTEM_PATH=/usr/bin/qemu-system-x86_64
BASE_IMAGES_PATH=/var/lib/libvirt/images
VM_STORAGE_PATH=/var/lib/cloud-device-lab/vms
MAX_VMS=10
WEBRTC_ICE_SERVERS=stun:stun.l.google.com:19302
```

## VM Configuration

Each Windows VM:
- 4-8 GB RAM (configurable)
- 2-8 CPU cores (configurable)
- 50GB disk (copy-on-write from base image)
- VNC display on unique port
- RDP on unique port
- Network via NAT with port forwarding
- QEMU guest agent for control

## Base Image Setup

Base images are created once and include:
- Windows OS installed and activated
- Latest Windows updates
- Microsoft Edge browser
- VirtIO drivers installed
- RDP enabled
- Windows Defender configured
- Auto-login configured
- Clean snapshot for quick cloning

## VM Lifecycle

1. **Create**: Clone base image with copy-on-write
2. **Start**: Launch QEMU with unique ports
3. **Stream**: FFmpeg captures VNC and streams via WebRTC
4. **Control**: QEMU monitor and guest agent for input
5. **Destroy**: Delete VM files

## Screen Streaming

FFmpeg captures VNC display and encodes to H.264:

```bash
ffmpeg -f vncffmpeg -i localhost:5900 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -f rtp rtp://localhost:5004
```

## Security

- VMs run with reduced privileges
- Network isolation via virtual networks
- Firewall rules on host
- Windows Defender enabled in VMs
- Automatic security updates
- No internet access from VMs by default (optional gateway)

## Performance Optimization

- Use KVM acceleration: `-accel kvm`
- Enable multi-queue virtio-net: `mq=on,vectors=10`
- Use virtio-blk for disk: Better performance than IDE
- Allocate hugepages for memory
- CPU pinning for dedicated cores
- SSD storage for VM images

## Troubleshooting

### VM won't start

Check KVM:
```bash
lsmod | grep kvm
sudo modprobe kvm
sudo modprobe kvm-intel  # or kvm-amd
```

### Screen streaming laggy

- Increase bandwidth allocation
- Use hardware encoding if available
- Reduce resolution
- Check network latency

### RDP connection fails

Check if RDP is enabled in VM:
```bash
# Via QEMU monitor
info usernet
```

## Backup and Snapshots

Create snapshot of running VM:
```bash
virsh snapshot-create-as <vm-name> snapshot1 "Clean state"
```

Restore snapshot:
```bash
virsh snapshot-revert <vm-name> snapshot1
```

## Monitoring

Monitor VM performance:
```bash
virsh domstats <vm-name>
```

View VM console:
```bash
virsh console <vm-name>
```
