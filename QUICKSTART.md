# Quick Start Guide - Cloud Device Lab

Get started with Cloud Device Lab in minutes!

## Development Setup (Docker Compose)

Perfect for local development and testing.

### Prerequisites

- Docker Desktop (with WSL2 on Windows)
- Node.js 18+
- At least 16GB RAM
- 50GB free disk space

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd cloud-device-lab
```

### Step 2: Copy Environment Files

```bash
# Backend API
cp backend/api-server/.env.example backend/api-server/.env

# Signaling Server
cp backend/signaling-server/.env.example backend/signaling-server/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### Step 3: Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 4: Initialize Database

```bash
# Database tables are created automatically on first run
# Verify:
docker-compose exec postgres psql -U postgres -d cloud_device_lab -c "\dt"
```

### Step 5: Access Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Signaling**: http://localhost:5001
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### Step 6: Test Device Launch

1. Open http://localhost:3000
2. Click "Quick Launch" on Android or Windows card
3. Wait for device to start (simulated in dev mode)
4. Interact with the device

## Production Setup (Kubernetes)

For production deployments with real VMs.

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- KVM-enabled nodes for VM hosting
- Container registry access

### Quick Deploy

```bash
# Create namespace
kubectl create namespace cloud-device-lab

# Deploy everything
./scripts/deploy-production.sh

# Get frontend URL
kubectl get svc frontend -n cloud-device-lab
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production setup.

## Common Tasks

### Install Dependencies

```bash
# Install all dependencies
npm install

# Frontend only
cd frontend && npm install

# Backend only
cd backend && npm install
```

### Development Mode

```bash
# Run frontend dev server
cd frontend
npm run dev

# Run API server in dev mode
cd backend/api-server
npm run dev

# Run signaling server in dev mode
cd backend/signaling-server
npm run dev
```

### Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend services
cd backend/api-server
npm run build

cd backend/signaling-server
npm run build
```

### Run Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend/api-server
npm test
```

### View Logs

```bash
# Docker Compose
docker-compose logs -f api-server

# Kubernetes
kubectl logs -f deployment/api-server -n cloud-device-lab
```

### Database Operations

```bash
# Connect to database (Docker)
docker-compose exec postgres psql -U postgres -d cloud_device_lab

# Connect to database (Kubernetes)
kubectl exec -it postgres-0 -n cloud-device-lab -- psql -U postgres -d cloud_device_lab

# Backup database
docker-compose exec postgres pg_dump -U postgres cloud_device_lab > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres cloud_device_lab < backup.sql
```

### Stopping Services

```bash
# Docker Compose
docker-compose down

# With volume cleanup
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Stop the process or change ports in .env files
```

### Docker Out of Memory

```bash
# Increase Docker memory limit in Docker Desktop settings
# Recommended: 8GB minimum, 16GB for VM hosting
```

### Cannot Connect to Services

```bash
# Check if containers are running
docker-compose ps

# Check logs for errors
docker-compose logs

# Restart services
docker-compose restart
```

### Database Connection Failed

```bash
# Wait for postgres to be ready
docker-compose up -d postgres
docker-compose exec postgres pg_isready -U postgres

# Check connection string in .env
```

### Build Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Docker build cache
docker-compose build --no-cache
```

## Next Steps

1. **Explore the Dashboard**: Launch different device configurations
2. **Review the Code**: Check out the well-documented source code
3. **Customize**: Modify device configurations, add new features
4. **Deploy**: Follow DEPLOYMENT.md for production deployment
5. **Monitor**: Set up Grafana dashboards for monitoring
6. **Scale**: Add more VM hosts to increase capacity

## Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS + WebSocket
       ▼
┌─────────────────────────────┐
│     Load Balancer           │
└──────┬─────────┬────────────┘
       │         │
       ▼         ▼
┌──────────┐ ┌────────────────┐
│ Frontend │ │ API + Signaling│
└──────────┘ └────────┬────────┘
                      │
       ┌──────────────┼──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│ Postgres │  │  Redis   │  │  VM Hosts    │
│ Database │  │  Cache   │  │ (Android/Win)│
└──────────┘  └──────────┘  └──────────────┘
```

## Technology Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS
- WebRTC for streaming
- Zustand for state management

**Backend:**
- Node.js + Express
- PostgreSQL database
- Redis cache
- Socket.io for WebSocket

**Infrastructure:**
- Docker + Kubernetes
- QEMU/KVM for VMs
- Android Emulator
- Prometheus + Grafana

**Security:**
- Network policies
- VM isolation
- Rate limiting
- Firewall rules

## Resources

- [Architecture Documentation](README.md)
- [Production Deployment](DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Security Guide](docs/SECURITY.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## Support

Need help? Check:

1. **Logs**: Always check logs first
2. **Documentation**: Review relevant docs
3. **Issues**: Search GitHub issues
4. **Community**: Join our Discord/Slack

## License

See LICENSE file for details.

---

**Ready to launch virtual devices in the cloud! 🚀**
