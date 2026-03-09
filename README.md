# Cloud Device Lab

Production-grade cloud platform providing real virtual machines (Android & Windows) accessible directly from a browser.

## 🎯 Platform Overview

Cloud Device Lab enables users to launch and interact with real operating systems running in isolated cloud environments, streamed directly to their browser via WebRTC.

### Supported Environments
- **Android Virtual Devices** (Android 10, 11, 12, 13)
- **Windows Virtual Machines** (Windows 10, Windows 11)

### Use Cases
- Website testing across different devices
- Browser compatibility testing
- UI/UX testing
- Safe browsing experiments
- Educational environments
- Secure web application testing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │   Dashboard UI   │          │  WebRTC Viewer   │        │
│  └──────────────────┘          └──────────────────┘        │
└─────────────────┬───────────────────────┬─────────────────┘
                  │                       │
                  │ HTTPS/WSS             │ WebRTC
                  │                       │
┌─────────────────▼───────────────────────▼─────────────────┐
│                   Load Balancer / Ingress                   │
└─────────────────┬───────────────────────┬─────────────────┘
                  │                       │
      ┌───────────▼──────────┐  ┌────────▼──────────┐
      │   API Server         │  │  Signaling Server │
      │   (Session Mgmt)     │  │  (WebRTC)         │
      └───────────┬──────────┘  └────────┬──────────┘
                  │                      │
      ┌───────────▼──────────────────────▼──────────┐
      │      VM Orchestration Controller            │
      │  (Lifecycle, Scaling, Pool Management)      │
      └───────────┬──────────────────────┬──────────┘
                  │                      │
      ┌───────────▼──────────┐  ┌────────▼──────────┐
      │  Android Emulator    │  │   Windows VMs     │
      │  Pool (Containerized)│  │   (KVM/QEMU)      │
      └──────────────────────┘  └───────────────────┘
```

## 📦 Project Structure

```
cloud-device-lab/
├── frontend/                    # React-based web interface
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API clients
│   │   └── utils/              # Utilities
│   └── public/
├── backend/                     # Node.js backend services
│   ├── api-server/             # Main API server
│   ├── session-manager/        # Session lifecycle management
│   ├── vm-orchestrator/        # VM creation and management
│   └── signaling-server/       # WebRTC signaling
├── infrastructure/              # Infrastructure as Code
│   ├── kubernetes/             # K8s manifests
│   ├── terraform/              # Cloud provisioning
│   ├── docker/                 # Container definitions
│   └── monitoring/             # Prometheus, Grafana configs
├── vm-images/                   # VM configurations
│   ├── android/                # Android emulator setup
│   └── windows/                # Windows VM setup
├── security/                    # Security configurations
│   ├── network-policies/       # Network isolation rules
│   ├── firewall-rules/         # Firewall configurations
│   └── abuse-detection/        # Rate limiting & abuse prevention
└── admin-panel/                 # Administrative dashboard
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Kubernetes cluster (for production)
- KVM-enabled machines (for Windows VMs)
- 16GB+ RAM recommended

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd cloud-device-lab

# Install dependencies
npm run install-all

# Start development environment
docker-compose up -d

# Start frontend
cd frontend && npm run dev

# Start backend services
cd backend && npm run dev:all
```

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **WebRTC** for real-time streaming
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** for session data
- **Redis** for caching and queues
- **Socket.io** for WebSocket communication

### Infrastructure
- **Kubernetes** for orchestration
- **Docker** for containerization
- **QEMU/KVM** for Windows VMs
- **Android Emulator** in containers
- **Nginx** as reverse proxy
- **Prometheus & Grafana** for monitoring

### Streaming
- **WebRTC** for low-latency video
- **Janus Gateway** for WebRTC server
- **FFmpeg** for screen capture

## 🔐 Security Features

- **Complete VM Isolation**: Each session runs in isolated environment
- **Network Filtering**: Restricted outbound traffic with firewall rules
- **Automatic Cleanup**: VMs destroyed after session ends
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Malware Containment**: Sandboxed environments
- **Audit Logging**: All actions logged for security analysis
- **Session Encryption**: End-to-end encrypted streams

## 📊 Features

### Device Selection Dashboard
- Professional device cards for Android and Windows
- Advanced configuration panel
- Real-time availability status
- Quick launch presets

### Android Virtual Device
- Real Android system UI (versions 10-13)
- Google Chrome browser
- Touch simulation and virtual keyboard
- Orientation rotation
- File upload support
- Clipboard sharing
- Simulated phone capabilities (calls, SMS, notifications)
- Location simulation
- Browser testing tools

### Windows Virtual Machine
- Full Windows desktop (10 or 11)
- Microsoft Edge browser
- File explorer and settings
- Drag-and-drop file uploads
- Developer console
- Network inspection tools

### Session Management
- Restart device
- Reset environment
- Extend session time
- Take screenshots
- Real-time session controls

### Admin Panel
- Active sessions monitoring
- System load and health metrics
- VM pool management
- Usage analytics
- Abuse detection alerts
- Comprehensive logging

## 🌐 Deployment

### Frontend API Configuration (Vercel)

The frontend uses this API base URL priority in production and development:

1. `VITE_API_URL`
2. `VITE_API_BASE_URL`
3. fallback to `/api`

Examples:

- External backend deployment:
      - `VITE_API_URL=https://backend-domain.com/api`
      - `VITE_SIGNALING_URL=https://backend-domain.com`

- Same-domain deployment (frontend and backend under same host):
      - No API URL variable required (frontend falls back to `/api`)
      - Optional `VITE_SIGNALING_URL` for custom signaling host

Required Vercel environment variables (external backend):

- `VITE_API_URL` or `VITE_API_BASE_URL`
- `VITE_SIGNALING_URL`

Backend CORS must allow your Vercel domain, e.g.:

- `https://sandbox-app-six.vercel.app`
- and Vercel previews when `CORS_ALLOW_VERCEL_PREVIEWS=true`

### Production Deployment

```bash
# Build Docker images
npm run build:docker

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/

# Configure monitoring
kubectl apply -f infrastructure/monitoring/
```

### Environment Variables

See `.env.example` for required configuration.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `VM_HOST_POOL`: Comma-separated VM host IPs
- `STORAGE_BACKEND`: Object storage configuration
- `WEBRTC_ICE_SERVERS`: STUN/TURN servers

## 📈 Scaling

The platform is designed for horizontal scaling:
- API servers: Scale based on request load
- VM hosts: Add more physical hosts to increase capacity
- WebRTC signaling: Scale independently
- Database: Use read replicas for scaling reads

## 🔍 Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation
- **Jaeger**: Distributed tracing

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

See CONTRIBUTING.md for development guidelines.

## 📧 Support

For support, email support@clouddevicelab.com
