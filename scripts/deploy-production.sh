#!/bin/bash

# Production deployment script for Cloud Device Lab
# This script deploys the platform to a Kubernetes cluster

set -e

echo "========================================="
echo "Cloud Device Lab - Production Deployment"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured or cluster is not accessible"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Configuration
NAMESPACE="cloud-device-lab"
REGISTRY="${REGISTRY:-your-registry.io/cloud-device-lab}"
TAG="${TAG:-latest}"

echo "Configuration:"
echo "  Namespace: $NAMESPACE"
echo "  Registry: $REGISTRY"
echo "  Tag: $TAG"
echo ""

# Confirm deployment
read -p "Do you want to proceed with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 1: Building Docker images..."
echo ""

# Build frontend
echo "Building frontend..."
docker build -t $REGISTRY/frontend:$TAG frontend/

# Build API server
echo "Building API server..."
docker build -t $REGISTRY/api-server:$TAG backend/api-server/

# Build signaling server
echo "Building signaling server..."
docker build -t $REGISTRY/signaling-server:$TAG backend/signaling-server/

echo "✅ Docker images built"
echo ""

echo "Step 2: Pushing Docker images..."
echo ""

docker push $REGISTRY/frontend:$TAG
docker push $REGISTRY/api-server:$TAG
docker push $REGISTRY/signaling-server:$TAG

echo "✅ Docker images pushed"
echo ""

echo "Step 3: Updating Kubernetes manifests..."
echo ""

# Update image references in manifests
find infrastructure/kubernetes -name "*.yaml" -type f -exec sed -i "s|your-registry.io/cloud-device-lab|$REGISTRY|g" {} \;
find infrastructure/kubernetes -name "*.yaml" -type f -exec sed -i "s|image: .*:latest|image: $REGISTRY:$TAG|g" {} \;

echo "✅ Manifests updated"
echo ""

echo "Step 4: Creating namespace..."
kubectl apply -f infrastructure/kubernetes/namespace.yaml
echo ""

echo "Step 5: Creating secrets..."

# Generate database password if not exists
if ! kubectl get secret postgres-secret -n $NAMESPACE &> /dev/null; then
    DB_PASSWORD=$(openssl rand -base64 32)
    kubectl create secret generic postgres-secret \
      --from-literal=username=postgres \
      --from-literal=password=$DB_PASSWORD \
      -n $NAMESPACE
    echo "✅ Database secret created"
else
    echo "ℹ️  Database secret already exists"
fi

echo ""

echo "Step 6: Deploying PostgreSQL..."
kubectl apply -f infrastructure/kubernetes/database/postgres.yaml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
echo "✅ PostgreSQL deployed"
echo ""

echo "Step 7: Deploying Redis..."
kubectl apply -f infrastructure/kubernetes/redis/redis.yaml
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
echo "✅ Redis deployed"
echo ""

echo "Step 8: Deploying ConfigMaps..."
kubectl apply -f infrastructure/kubernetes/configmaps/
echo "✅ ConfigMaps deployed"
echo ""

echo "Step 9: Deploying backend services..."
kubectl apply -f infrastructure/kubernetes/backend/
echo "Waiting for backend services to be ready..."
kubectl wait --for=condition=available deployment -l tier=backend -n $NAMESPACE --timeout=300s
echo "✅ Backend services deployed"
echo ""

echo "Step 10: Deploying frontend..."
kubectl apply -f infrastructure/kubernetes/frontend/
kubectl wait --for=condition=available deployment -l app=frontend -n $NAMESPACE --timeout=300s
echo "✅ Frontend deployed"
echo ""

echo "Step 11: Applying network policies..."
kubectl apply -f security/network-policies/
echo "✅ Network policies applied"
echo ""

echo "Step 12: Deploying monitoring..."
kubectl apply -f infrastructure/kubernetes/monitoring/ || echo "ℹ️  Monitoring deployment skipped"
echo ""

echo "========================================="
echo "Deployment Complete! 🎉"
echo "========================================="
echo ""

# Get service URLs
FRONTEND_URL=$(kubectl get svc frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
API_URL=$(kubectl get svc api-server -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")

echo "Service Status:"
kubectl get pods -n $NAMESPACE
echo ""
echo "Service URLs:"
if [ "$FRONTEND_URL" != "pending" ]; then
    echo "  Frontend: http://$FRONTEND_URL"
else
    echo "  Frontend: Waiting for LoadBalancer IP..."
fi
if [ "$API_URL" != "pending" ]; then
    echo "  API: http://$API_URL"
else
    echo "  API: Waiting for LoadBalancer IP..."
fi
echo ""
echo "To check status:"
echo "  kubectl get pods -n $NAMESPACE"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/api-server -n $NAMESPACE"
echo ""
echo "To access services:"
echo "  kubectl port-forward svc/frontend 3000:80 -n $NAMESPACE"
echo ""
echo "========================================="
