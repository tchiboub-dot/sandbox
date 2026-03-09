# System Architecture - Cloud Device Lab

Comprehensive technical architecture documentation.

## Table of Contents

1. [Overview](#overview)
2. [System Components](#system-components)
3. [Data Flow](#data-flow)
4. [Scaling Strategy](#scaling-strategy)
5. [Security Architecture](#security-architecture)
6. [Disaster Recovery](#disaster-recovery)
7. [Performance Optimization](#performance-optimization)

---

## Overview

Cloud Device Lab is a distributed cloud platform providing real Android and Windows virtual machines accessible through web browsers. The platform uses WebRTC for low-latency streaming and Kubernetes for orchestration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  (Web Browser with WebRTC support)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / WSS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer Layer                      │
│  (Nginx / AWS ALB / GCP Load Balancer)                      │
└─────┬────────────────────────┬──────────────────────────────┘
      │                        │
      ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│  Frontend       │    │  Backend         │
│  (React SPA)    │    │  Services        │
│  - Dashboard    │    │  - API Server    │
│  - WebRTC UI    │    │  - Signaling     │
└─────────────────┘    └────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────┐ ┌────────────────┐
        │  PostgreSQL  │ │  Redis   │ │  VM Host Pool  │
        │  (Metadata)  │ │ (Cache)  │ │  (KVM Nodes)   │
        └──────────────┘ └──────────┘ └────────────────┘
                                              │
                        ┌─────────────────────┼─────────────────┐
                        ▼                     ▼                 ▼
                ┌──────────────┐      ┌──────────────┐  ┌──────────────┐
                │  Android VM  │      │  Android VM  │  │  Windows VM  │
                │  (Emulator)  │      │  (Emulator)  │  │  (QEMU/KVM)  │
                └──────────────┘      └──────────────┘  └──────────────┘
```

---

## System Components

### 1. Frontend Layer

**Technology**: React 18, TypeScript, TailwindCSS, WebRTC

**Components**:
- **Dashboard**: Device selection and configuration
- **Device Session**: Real-time VM interaction interface
- **Admin Panel**: System monitoring and management
- **WebRTC Manager**: Handles video streaming and input events

**Responsibilities**:
- User interface rendering
- WebRTC client implementation
- State management (Zustand)
- API communication
- Input event capture and transmission

**Scalability**: Static assets served via CDN, infinite horizontal scaling

---

### 2. Backend Services

#### API Server

**Technology**: Node.js, Express, TypeScript

**Endpoints**:
- Session lifecycle management (create, read, update, delete)
- VM orchestration requests
- Configuration management
- Admin operations

**Database**: PostgreSQL for persistent session data

**Cache**: Redis for:
- Session state
- VM host availability
- Rate limiting counters
- API response caching

**Scaling**: Horizontal scaling via Kubernetes HPA based on CPU/memory

---

#### Signaling Server

**Technology**: Node.js, Socket.io, TypeScript

**Purpose**: WebRTC signaling coordination between browsers and VMs

**WebSocket Events**:
- Session join/leave
- SDP offer/answer exchange
- ICE candidate relay
- Input event forwarding
- Status updates

**Scaling**: Horizontal scaling with Redis for session state sharing

---

### 3. VM Orchestration Layer

**VM Orchestrator Service**:
- Manages pool of VM hosts
- Selects optimal host for new sessions
- Monitors VM health and capacity
- Handles VM lifecycle (create, start, stop, destroy)
- Load balancing across hosts

**Host Selection Algorithm**:
```
1. Filter hosts by device type compatibility
2. Filter hosts with available capacity
3. Calculate load score: (CPU + Memory + Active VMs) / 3
4. Select host with lowest load score
5n Assign VM to selected host
```

---

### 4. VM Host Layer

#### Android VM Hosts

**Technology**: Docker containers with Android Emulator + KVM

**Configuration**:
- Ubuntu 20.04 base
- Android SDK and system images
- Hardware acceleration (KVM)
- ADB for device control
- FFmpeg for screen capture
- WebRTC stream server

**Resources per VM**:
- CPU: 2-4 cores
- RAM: 2-8 GB
- Storage: 32-128 GB
- Network: Isolated bridge

**Max VMs per host**: Depends on host resources (typically 5-10)

---

#### Windows VM Hosts

**Technology**: QEMU/KVM on Linux hosts

**Configuration**:
- QEMU with KVM acceleration
- VirtIO drivers for performance
- VNC/RDP for remote access
- FFmpeg for screen streaming
- USB redirection support

**Resources per VM**:
- CPU: 4-8 cores
- RAM: 4-16 GB
- Storage: 64-256 GB
- Network: Isolated bridge

**Max VMs per host**: Depends on host resources (typically 3-5)

---

### 5. Data Layer

#### PostgreSQL Database

**Schema**:
```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  type VARCHAR(50),
  version VARCHAR(50),
  config JSONB,
  status VARCHAR(50),
  vm_id VARCHAR(255),
  host_ip VARCHAR(50),
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Session logs table
CREATE TABLE session_logs (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  level VARCHAR(20),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);

-- VM hosts table
CREATE TABLE vm_hosts (
  id UUID PRIMARY KEY,
  ip VARCHAR(50),
  type VARCHAR(50),
  capacity INTEGER,
  active_vms INTEGER,
  cpu_usage FLOAT,
  memory_usage FLOAT,
  status VARCHAR(50),
  last_heartbeat TIMESTAMP
);
```

**Indexes**:
- `sessions(user_id, created_at)`
- `sessions(status, expires_at)`
- `session_logs(session_id, created_at)`
- `vm_hosts(type, status)`

**Backups**: 
- Continuous WAL archiving
- Daily full backups
- Point-in-time recovery enabled

---

#### Redis Cache

**Use Cases**:
- Session state (TTL: session duration)
- VM host availability (TTL: 60s)
- API response cache (TTL: 5-60s)
- Rate limiting (TTL: 1 minute)
- WebSocket room management

**Configuration**:
- Persistence: RDB + AOF
- Eviction policy: allkeys-lru
- Max memory: 4-8GB per instance

---

### 6. Monitoring Layer

#### Prometheus

**Metrics Collected**:
- API request rate and latency
- WebSocket connections
- VM creation/deletion rates
- CPU/memory usage per service
- Database query performance
- Session duration statistics

**Scrape Targets**:
- API servers
- Signaling servers
- VM hosts
- PostgreSQL exporter
- Redis exporter
- Node exporter (system metrics)

---

#### Grafana

**Dashboards**:
1. **Overview**: System health, active sessions, resource usage
2. **API Performance**: Request rates, latencies, errors
3. **VM Metrics**: VM creation rates, host capacity, resource usage
4. **Database**: Query performance, connection pool, cache hit rate
5. **Network**: Bandwidth usage, WebRTC quality metrics

**Alerts**:
- High error rates (> 5%)
- High latency (p95 > 2s)
- Database connection failures
- VM host unreachable
- Disk space warnings (> 80%)

---

## Data Flow

### Session Creation Flow

```
1. User clicks "Launch" on frontend
   ↓
2. Frontend sends POST /api/sessions
   ↓
3. API Server validates request
   ↓
4. API Server queries PostgreSQL for user limits
   ↓
5. VM Orchestrator selects optimal host
   ↓
6. VM Orchestrator sends create request to VM Host
   ↓
7. VM Host creates VM container/process
   ↓
8. VM Host starts Android emulator or QEMU
   ↓
9. VM Host waits for OS boot
   ↓
10. VM Host reports ready status
    ↓
11. API Server stores session in PostgreSQL
    ↓
12. API Server caches session in Redis
    ↓
13. API Server returns session details to frontend
    ↓
14. Frontend connects to signaling server via WebSocket
    ↓
15. Frontend initiates WebRTC connection
    ↓
16. Signaling server coordinates SDP exchange
    ↓
17. WebRTC peer connection established
    ↓
18. Video stream starts flowing to browser
```

**Timeline**:
- API request processing: 50-100ms
- VM creation: 30-60 seconds (Android), 60-120 seconds (Windows)
- WebRTC connection: 2-5 seconds
- **Total**: ~35-125 seconds from click to ready

---

### WebRTC Streaming Flow

```
Browser                  Signaling Server           VM Host
  │                             │                      │
  │─────webrtc-offer────────────>│                      │
  │                             │──────forward────────>│
  │                             │                      │
  │                             │<────webrtc-answer────│
  │<───webrtc-answer────────────│                      │
  │                             │                      │
  │─────ice-candidate───────────>│──────forward────────>│
  │<────ice-candidate───────────│<─────forward─────────│
  │                             │                      │
  │<═══════════ Direct P2P Media Connection ══════════>│
  │                   (STUN/TURN)                      │
```

**Media Path**:
1. VM screen captured by FFmpeg (30-60 FPS)
2. Encoded as H.264 video stream
3. Transmitted via WebRTC data channel
4. Decoded in browser <video> element
5. Displayed to user

**Latency**: 50-200ms depending on network

---

### Input Event Flow

```
Browser ──> WebSocket ──> Signaling Server ──> VM Host ──> Android ADB / QEMU Input
                                                                  │
                                                                  ▼
                                                        OS processes input
```

**Input Types**:
- Mouse: position, button, scroll
- Keyboard: key press, key release
- Touch: tap, swipe, pinch, rotate (Android)
- Gamepad: buttons, joystick (future)

**Latency**: 20-50ms

---

## Scaling Strategy

### Horizontal Scaling

**API Servers**: 
- Auto-scale based on CPU (target: 70%)
- Min: 2 replicas
- Max: 20 replicas

**Signaling Servers**:
- Auto-scale based on concurrent connections
- Min: 2 replicas
- Max: 10 replicas

**VM Hosts**:
- Add nodes to Kubernetes cluster
- Label with `node-type=vm-host`
- DaemonSet automatically deploys VM host software

---

### Vertical Scaling

**Database**:
- Start: 4 vCPU, 16GB RAM
- Scale to: 16 vCPU, 64GB RAM
- Read replicas for read-heavy workloads

**Redis**:
- Start: 2 vCPU, 8GB RAM
- Scale to: 8 vCPU, 32GB RAM
- Redis Cluster for >100k operations/sec

---

### Geographic Distribution

**Multi-Region Deployment**:
```
Region 1 (US-East)    Region 2 (EU-West)    Region 3 (Asia-Pacific)
     │                      │                          │
     └──────────────────────┴──────────────────────────┘
                            │
                    Global Load Balancer
                      (GeoDNS / Anycast)
```

**Benefits**:
- Reduced latency for users
- Disaster recovery
- Compliance with data residency laws

---

## Security Architecture

### Network Segmentation

```
┌─────────────────────────────────────────────┐
│  Public Zone (Internet-facing)              │
│  - Load Balancer                            │
│  - CDN                                      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  DMZ (Semi-trusted)                         │
│  - Frontend servers                         │
│  - API Gateway                              │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Application Zone (Trusted)                 │
│  - API servers                              │
│  - Signaling servers                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Data Zone (Highly trusted)                 │
│  - PostgreSQL                               │
│  - Redis                                    │
└─────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  VM Zone (Isolated)                         │
│  - VM Hosts                                 │
│  - VMs (Android/Windows)                    │
└─────────────────────────────────────────────┘
```

### Kubernetes Network Policies

- **Default deny all** ingress/egress
- **Frontend**: Can access API, receive from load balancer
- **API**: Can access database, Redis, VM hosts
- **Signaling**: Can access Redis, VM hosts
- **Database**: Only accepts from API servers
- **VM Hosts**: Isolated per VM, no cross-talk

---

## Disaster Recovery

### Backup Strategy

**Database**:
- Full backup: Daily at 2 AM UTC
- Incremental backup: Every 6 hours
- WAL archiving: Continuous
- Retention: 30 days
- Storage: S3 with versioning

**Redis**:
- RDB snapshot: Every 6 hours
- AOF: Enabled (fsync every second)
- Retention: 7 days

**Configurations**:
- Git repository for all configs
- Kubernetes manifests versioned
- Automated deployment pipelines

---

### Recovery Procedures

**RTO (Recovery Time Objective)**: 15 minutes  
**RPO (Recovery Point Objective)**: 1 hour

**Procedure**:
1. Detect failure (monitoring alerts)
2. Failover to standby region (if multi-region)
3. Restore database from latest backup
4. Restore Redis from snapshot
5. Redeploy services from CI/CD
6. Verify health checks
7. Resume traffic

---

## Performance Optimization

### Caching Strategy

**Frontend**:
- Static assets: CDN cache (1 year)
- API responses: Browser cache (5 minutes)
- Service worker for offline support

**Backend**:
- Session data: Redis (session lifetime)
- VM host status: Redis (60 seconds)
- API responses: Redis (5-60 seconds based on endpoint)

---

### Database Optimization

- Connection pooling (max: 100)
- Query optimization with EXPLAIN ANALYZE
- Proper indexes on frequently queried columns
- Partitioning for large tables (by date)
- Read replicas for read-heavy queries

---

### WebRTC Optimization

- Adaptive bitrate based on network
- Hardware acceleration for video encoding
- TURN server fallback for restrictive NAT
- Simulcast for multi-quality streaming

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI framework |
| Frontend | TypeScript | Type safety |
| Frontend | TailwindCSS | Styling |
| Frontend | WebRTC | Real-time streaming |
| Frontend | Zustand | State management |
| Backend | Node.js | Runtime |
| Backend | Express | Web framework |
| Backend | Socket.io | WebSocket |
| Database | PostgreSQL 15 | Relational data |
| Cache | Redis 7 | In-memory cache |
| Virtualization | Android Emulator | Android VMs |
| Virtualization | QEMU/KVM | Windows VMs |
| Container | Docker | Containerization |
| Orchestration | Kubernetes | Container orchestration |
| Monitoring | Prometheus | Metrics collection |
| Monitoring | Grafana | Visualization |
| Load Balancer | Nginx / ALB | Traffic distribution |
| CI/CD | GitHub Actions | Automation |

---

## Conclusion

Cloud Device Lab is architected for:
- **Scalability**: Horizontal and vertical scaling at every layer
- **Reliability**: High availability, disaster recovery, monitoring
- **Performance**: Caching, optimization, CDN
- **Security**: Network segmentation, isolation, encryption
- **Maintainability**: Infrastructure as code, automated deployments

The platform handles thousands of concurrent sessions with sub-second latency, providing a seamless experience for cloud-based device testing.
