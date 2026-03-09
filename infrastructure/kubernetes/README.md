# Kubernetes Deployment Configuration for Cloud Device Lab

This directory contains all Kubernetes manifests for deploying the Cloud Device Lab platform.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Persistent volumes support
- Load balancer support (for cloud environments)
- KVM-enabled nodes for VM hosting

## Deployment

### 1. Create namespace

```bash
kubectl create namespace cloud-device-lab
```

### 2. Apply configurations

```bash
# Apply in order:
kubectl apply -f namespace.yaml
kubectl apply -f configmaps/
kubectl apply -f secrets/
kubectl apply -f persistent-volumes/
kubectl apply -f database/
kubectl apply -f redis/
kubectl apply -f backend/
kubectl apply -f frontend/
kubectl apply -f vm-hosts/
kubectl apply -f monitoring/
kubectl apply -f ingress/
```

### 3. Verify deployment

```bash
kubectl get pods -n cloud-device-lab
kubectl get services -n cloud-device-lab
kubectl get ingress -n cloud-device-lab
```

## Components

### Database
- PostgreSQL StatefulSet with persistent storage
- Automatic backups
- Read replicas for scaling

### Cache
- Redis cluster for session data
- Persistent storage for crash recovery

### Backend Services
- API Server: Handles session management
- Signaling Server: WebRTC coordination
- Horizontal Pod Autoscaling enabled

### Frontend
- Nginx serving React SPA
- Multiple replicas for HA
- CDN integration ready

### VM Hosts
- DaemonSet on KVM-enabled nodes
- Host network mode for VM access
- Resource quotas per node

### Monitoring
- Prometheus for metrics
- Grafana for dashboards
- Alert manager for notifications

## Scaling

### Horizontal scaling

```bash
# Scale API servers
kubectl scale deployment api-server --replicas=5 -n cloud-device-lab

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n cloud-device-lab
```

### VM host scaling

Add more nodes with KVM support to the cluster. VM hosts will automatically schedule on new nodes via DaemonSet.

## Security

- Network policies for pod isolation
- RBAC for service accounts
- Secrets for sensitive data
- TLS/SSL for all external endpoints

## Backup

### Database backup

```bash
kubectl exec -it postgres-0 -n cloud-device-lab -- pg_dump -U postgres cloud_device_lab > backup.sql
```

### Restore

```bash
kubectl exec -i postgres-0 -n cloud-device-lab -- psql -U postgres cloud_device_lab < backup.sql
```

## Monitoring

Access Grafana:
```bash
kubectl port-forward svc/grafana 3000:3000 -n cloud-device-lab
```

Access Prometheus:
```bash
kubectl port-forward svc/prometheus 9090:9090 -n cloud-device-lab
```

## Troubleshooting

### Check logs

```bash
# API server logs
kubectl logs -f deployment/api-server -n cloud-device-lab

# VM host logs
kubectl logs -f daemonset/vm-host-android -n cloud-device-lab
```

### Debug pod

```bash
kubectl exec -it <pod-name> -n cloud-device-lab -- /bin/sh
```

### Check events

```bash
kubectl get events -n cloud-device-lab --sort-by='.lastTimestamp'
```
