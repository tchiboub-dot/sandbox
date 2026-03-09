# Android Emulator Setup for Cloud Device Lab

This directory contains scripts and configurations for running Android emulators in containerized environments.

## Architecture

Android emulators run in Docker containers with:
- KVM virtualization support
- Hardware acceleration
- Screen streaming via FFmpeg + WebRTC
- ADB access for input and control

## Requirements

- Docker with KVM support
- Host OS: Linux (Ubuntu 20.04+ recommended)
- Kernel modules: kvm, kvm-intel or kvm-amd
- CPU with virtualization extensions (Intel VT-x or AMD-V)
- Minimum 16GB RAM
- GPU acceleration (optional but recommended)

## Setup

### 1. Enable KVM

```bash
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
sudo usermod -aG kvm $USER
sudo usermod -aG libvirt $USER
```

### 2. Install Android SDK

```bash
# Install Android SDK command-line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip -d ~/android-sdk
cd ~/android-sdk/cmdline-tools
mkdir latest
mv bin latest/
mv lib latest/

# Accept licenses
~/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses

# Install emulator and system images
~/android-sdk/cmdline-tools/latest/bin/sdkmanager "emulator" "platform-tools"
~/android-sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-33;google_apis;x86_64"
~/android-sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-32;google_apis;x86_64"
~/android-sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-31;google_apis;x86_64"
~/android-sdk/cmdline-tools/latest/bin/sdkmanager "system-images;android-30;google_apis;x86_64"
```

### 3. Build Docker Image

```bash
docker build -t cloud-device-lab-android:latest .
```

### 4. Run VM Host Server

```bash
npm install
npm start
```

## API Endpoints

The VM host exposes these endpoints:

- `POST /api/android/create` - Create new Android emulator
- `POST /api/vm/:vmId/restart` - Restart emulator
- `POST /api/vm/:vmId/reset` - Reset emulator to clean state
- `DELETE /api/vm/:vmId` - Delete emulator
- `GET /api/vm/:vmId/screenshot` - Take screenshot
- `POST /api/vm/:vmId/phone` - Simulate phone call/SMS
- `POST /api/vm/:vmId/location` - Set GPS location
- `POST /api/vm/:vmId/rotate` - Rotate screen
- `POST /api/webrtc/offer` - Get WebRTC offer
- `GET /health` - Health check

## Environment Variables

```env
PORT=8080
ANDROID_SDK_ROOT=/opt/android-sdk
ANDROID_AVD_HOME=/opt/android-avd
MAX_EMULATORS=10
WEBRTC_ICE_SERVERS=stun:stun.l.google.com:19302
```

## Emulator Management

Each emulator:
- Runs in isolated Docker container
- Has unique ADB port (5554, 5556, 5558, etc.)
- Streams screen via WebRTC
- Automatically destroyed after session ends
- Resource limits enforced (CPU, RAM)

## WebRTC Streaming

FFmpeg captures emulator screen and encodes to H.264:

```bash
ffmpeg -f x11grab -video_size 1080x2340 -i :99 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -f rtp rtp://localhost:5004
```

WebRTC peer connection relays stream to browser.

## Security

- Network isolation via Docker networks
- Firewall rules restrict outbound traffic
- No root access in containers
- Resource quotas prevent DoS
- Automatic cleanup of old containers

## Troubleshooting

### KVM not available

```bash
ls -l /dev/kvm
# Should show crw-rw----+ 1 root kvm

# If not, enable:
sudo modprobe kvm
sudo modprobe kvm-intel  # or kvm-amd
```

### Emulator won't start

Check logs:
```bash
docker logs <container-id>
```

Common issues:
- Insufficient RAM
- KVM not accessible
- System image not downloaded

### Screen streaming fails

Check FFmpeg:
```bash
ffmpeg -version
```

Ensure X11 display is available in container.

## Performance Tuning

- Use SSD storage for AVD images
- Allocate sufficient RAM (4GB+ per emulator)
- Enable GPU acceleration if available
- Use `-accel on` flag for emulator
- Limit concurrent emulators based on host resources
