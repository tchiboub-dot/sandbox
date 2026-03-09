# Deployment Guide - Cloud Device Lab

Complete production deployment guide for Cloud Device Lab platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [VM Host Setup](#vm-host-setup)
7. [Monitoring Setup](#monitoring-setup)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Scaling](#scaling)
10. [Backup & Recovery](#backup--recovery)

## Prerequisites

### Hardware Requirements

**Control Plane (Kubernetes Master)**
- 4 CPU cores
- 8GB RAM
- 50GB SSD

**Worker Nodes (General)**
- 8 CPU cores
- 16GB RAM
- 100GB SSD
- Minimum 3 nodes for HA

**VM Host Nodes (KVM-enabled)**
- 16+ CPU cores with virtualization
- 64GB+ RAM
- 500GB+ SSD
- KVM support (Intel VT-x or AMD-V)
- Dedicated nodes for VM workloads

### Software Requirements

- Kubernetes 1.24+
- kubectl configured
- Docker or containerd
- Helm 3+ (optional)
- Linux kernel with KVM modules

### Cloud Provider

Supported providers:
- AWS (EC2 with bare metal instances for VMs)
- Google Cloud (Compute Engine with nested virtualization)
- Azure (Virtual Machines with nested virtualization)
- On-premises with KVM support

## Infrastructure Setup

### 1. Kubernetes Cluster

#### Using kubeadm (On-Premises)

```bash
# On master node
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Setup kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI (Calico)
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# Join worker nodes
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash <hash>
```

#### Using Cloud Providers

**AWS EKS:**
```bash
eksctl create cluster --name cloud-device-lab --region us-west-2 --nodes 5
```

**GKE:**
```bash
gcloud container clusters create cloud-device-lab --num-nodes=5 --zone=us-central1-a
```

**AKS:**
```bash
az aks create --resource-group cdl-rg --name cloud-device-lab --node-count 5
```

### 2. Label Nodes

Label nodes for proper workload placement:

```bash
# Label VM host nodes
kubectl label nodes <node-name> node-type=vm-host
kubectl label nodes <node-name> kvm=enabled

# Label general worker nodes
kubectl label nodes <node-name> node-type=worker
```

### 3. Install Storage Class

For dynamic volume provisioning:

```bash
# For cloud providers, use their CSI driver
# AWS EBS
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-ebs-csi-driver/master/deploy/kubernetes/base/ebs-csi-driver.yaml

# For on-premises, install local-path-provisioner
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```

## Database Setup

### 1. Create Secrets

```bash
# Generate strong passwords
DB_PASSWORD=$(openssl rand -base64 32)

# Create secret
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=$DB_PASSWORD \
  -n cloud-device-lab
```

### 2. Deploy PostgreSQL

```bash
kubectl apply -f infrastructure/kubernetes/database/postgres.yaml

# Wait for pod to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n cloud-device-lab --timeout=300s

# Initialize database
kubectl exec -it postgres-0 -n cloud-device-lab -- psql -U postgres -c "CREATE DATABASE cloud_device_lab;"
```

### 3. Deploy Redis

```bash
kubectl apply -f infrastructure/kubernetes/redis/redis.yaml

# Verify
kubectl get pods -l app=redis -n cloud-device-lab
```

## Backend Deployment

### 1. Build and Push Docker Images

```bash
# Set your container registry
export REGISTRY="your-registry.io/cloud-device-lab"

# Build images
docker build -t $REGISTRY/api-server:latest backend/api-server
docker build -t $REGISTRY/signaling-server:latest backend/signaling-server

# Push images
docker push $REGISTRY/api-server:latest
docker push $REGISTRY/signaling-server:latest
```

### 2. Update Kubernetes Manifests

Edit `infrastructure/kubernetes/backend/*.yaml` and replace `your-registry` with your actual registry.

### 3. Deploy Backend Services

```bash
# Apply ConfigMaps
kubectl apply -f infrastructure/kubernetes/configmaps/

# Deploy API Server
kubectl apply -f infrastructure/kubernetes/backend/api-server.yaml

# Deploy Signaling Server
kubectl apply -f infrastructure/kubernetes/backend/signaling-server.yaml

# Verify
kubectl get pods -n cloud-device-lab
kubectl get svc -n cloud-device-lab
```

## Frontend Deployment

### 1. Build Frontend

```bash
# Build image
docker build -t $REGISTRY/frontend:latest frontend

# Push
docker push $REGISTRY/frontend:latest
```

### 2. Deploy

```bash
kubectl apply -f infrastructure/kubernetes/frontend/frontend.yaml

# Get LoadBalancer IP
kubectl get svc frontend -n cloud-device-lab
```

## VM Host Setup

### Android VM Hosts

```bash
# Ensure nodes have KVM
kubectl get nodes -l kvm=enabled

# Deploy Android VM host as DaemonSet on KVM nodes
kubectl apply -f infrastructure/kubernetes/vm-hosts/android-vm-host.yaml
```

### Windows VM Hosts

```bash
# Deploy Windows VM host
kubectl apply -f infrastructure/kubernetes/vm-hosts/windows-vm-host.yaml
```

### Verify VM Hosts

```bash
kubectl get pods -l app=vm-host -n cloud-device-lab

# Check logs
kubectl logs -f <vm-host-pod> -n cloud-device-lab
```

## Monitoring Setup

### 1. Deploy Prometheus

```bash
kubectl apply -f infrastructure/kubernetes/monitoring/prometheus.yaml
```

### 2. Deploy Grafana

```bash
kubectl apply -f infrastructure/kubernetes/monitoring/grafana.yaml

# Get Grafana password
kubectl get secret grafana -n cloud-device-lab -o jsonpath="{.data.admin-password}" | base64 --decode
```

### 3. Access Monitoring

```bash
# Port forward Grafana
kubectl port-forward svc/grafana 3000:3000 -n cloud-device-lab

# Access at http://localhost:3000
# Username: admin
# Password: <from previous command>
```

## SSL/TLS Configuration

### 1. Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 2. Create ClusterIssuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### 3. Update Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cloud-device-lab
  namespace: cloud-device-lab
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - clouddevicelab.com
    - api.clouddevicelab.com
    secretName: cdl-tls
  rules:
  - host: clouddevicelab.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

## Scaling

### Horizontal Scaling

```bash
# Scale API servers
kubectl scale deployment api-server --replicas=10 -n cloud-device-lab

# Auto-scaling is configured via HPA
kubectl get hpa -n cloud-device-lab
```

### Vertical Scaling

```bash
# Update resource limits in deployment manifests
kubectl edit deployment api-server -n cloud-device-lab
```

### Add VM Host Capacity

```bash
# Add more nodes with KVM support
# VM host DaemonSet will automatically deploy to new nodes
kubectl get nodes -l kvm=enabled
```

## Backup & Recovery

### Database Backup

```bash
# Create backup
kubectl exec -it postgres-0 -n cloud-device-lab -- pg_dump -U postgres cloud_device_lab > backup-$(date +%Y%m%d).sql

# Upload to S3 (example)
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Restore Database

```bash
# Download backup
aws s3 cp s3://your-backup-bucket/backup-20240309.sql .

# Restore
kubectl exec -i postgres-0 -n cloud-device-lab -- psql -U postgres cloud_device_lab < backup-20240309.sql
```

### Automated Backups

Use CronJob for automated backups:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: cloud-device-lab
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump -U postgres -h postgres cloud_device_lab | gzip > /backup/backup-$(date +\%Y\%m\%d).sql.gz
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

## Health Checks

### Verify All Services

```bash
# Check all pods
kubectl get pods -n cloud-device-lab

# Check services
kubectl get svc -n cloud-device-lab

# Check ingress
kubectl get ingress -n cloud-device-lab

# Check HPA
kubectl get hpa -n cloud-device-lab

# View logs
kubectl logs -f deployment/api-server -n cloud-device-lab
```

### Test Functionality

```bash
# Test API
curl https://api.clouddevicelab.com/health

# Test WebSocket
wscat -c wss://signaling.clouddevicelab.com

# Create test session
curl -X POST https://api.clouddevicelab.com/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"type":"android","version":"Android 13",...}'
```

## Troubleshooting

### Pod Issues

```bash
# Describe pod
kubectl describe pod <pod-name> -n cloud-device-lab

# View logs
kubectl logs <pod-name> -n cloud-device-lab

# Access pod shell
kubectl exec -it <pod-name> -n cloud-device-lab -- /bin/sh
```

### Network Issues

```bash
# Check network policies
kubectl get networkpolicies -n cloud-device-lab

# Test connectivity
kubectl run -it --rm debug --image=busybox -n cloud-device-lab -- sh
```

### VM Creation Issues

```bash
# Check VM host logs
kubectl logs -f daemonset/vm-host-android -n cloud-device-lab

# Check KVM availability
kubectl exec -it <vm-host-pod> -n cloud-device-lab -- ls -l /dev/kvm
```

## Security Hardening

1. **Enable RBAC**: Already enabled in Kubernetes
2. **Network Policies**: Applied in `security/network-policies/`
3. **Pod Security Standards**: Use PodSecurityPolicy or Pod Security Admission
4. **Secrets Management**: Use external secrets manager (AWS Secrets Manager, HashiCorp Vault)
5. **Image Scanning**: Scan images for vulnerabilities
6. **Audit Logging**: Enable Kubernetes audit logs
7. **Regular Updates**: Keep all components updated

## Monitoring & Alerts

Configure alerts in Prometheus/Grafana:

- High CPU/Memory usage
- Pod restart loops
- Database connection failures
- VM creation failures
- Session timeout errors
- Disk space warnings

## Support

For issues and support:
- Check logs: `kubectl logs`
- Review documentation
- Open GitHub issue
- Contact support team
