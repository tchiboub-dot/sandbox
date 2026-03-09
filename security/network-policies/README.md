# Network Policies for Cloud Device Lab

This directory contains network isolation policies for enhanced security.

## Policies

### 1. Default Deny All
Denies all ingress/egress traffic by default. Services must explicit allow traffic.

### 2. Allow Frontend to Backend
Allows frontend pods to communicate with API and signaling servers.

### 3. Allow Backend to Database
Allows API server to communicate with PostgreSQL and Redis.

### 4. Allow VM Hosts
Allows VM hosts to communicate with backend services.

## Apply Policies

```bash
kubectl apply -f .
```

## Verify

```bash
kubectl get networkpolicies -n cloud-device-lab
```

## Testing

Test connectivity between pods:

```bash
# From frontend pod
kubectl exec -it <frontend-pod> -n cloud-device-lab -- wget -O- http://api-server:5000/health

# Should succeed

# From frontend to postgres (should fail)
kubectl exec -it <frontend-pod> -n cloud-device-lab -- telnet postgres 5432

# Should timeout
```
