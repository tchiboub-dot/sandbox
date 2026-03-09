#!/bin/bash

# Quick setup script for Cloud Device Lab development environment
# This script sets up everything needed for local development

set -e

echo "========================================="
echo "Cloud Device Lab - Development Setup"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Create environment files
echo "Creating environment files..."

if [ ! -f "backend/api-server/.env" ]; then
    cp backend/api-server/.env.example backend/api-server/.env
    echo "✅ Created backend/api-server/.env"
fi

if [ ! -f "backend/signaling-server/.env" ]; then
    cp backend/signaling-server/.env.example backend/signaling-server/.env
    echo "✅ Created backend/signaling-server/.env"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

echo ""

# Install dependencies
echo "Installing dependencies..."
echo ""

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "📦 Installing API server dependencies..."
cd backend/api-server
npm install
cd ../..

echo "📦 Installing signaling server dependencies..."
cd backend/signaling-server
npm install
cd ../..

echo "✅ All dependencies installed"
echo ""

# Start Docker services
echo "Starting Docker services (PostgreSQL, Redis, Monitoring)..."
docker-compose up -d postgres redis prometheus grafana

echo "Waiting for services to be ready..."
sleep 10

# Check if database is ready
until docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready"

# Check if Redis is ready
until docker-compose exec -T redis redis-cli ping &> /dev/null; do
    echo "Waiting for Redis..."
    sleep 2
done

echo "✅ Redis is ready"
echo ""

# Display access information
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Services are ready:"
echo ""
echo "To start the development servers:"
echo ""
echo "1. Frontend (Terminal 1):"
echo "   cd frontend && npm run dev"
echo "   Access: http://localhost:3000"
echo ""
echo "2. API Server (Terminal 2):"
echo "   cd backend/api-server && npm run dev"
echo "   Access: http://localhost:5000"
echo ""
echo "3. Signaling Server (Terminal 3):"
echo "   cd backend/signaling-server && npm run dev"
echo "   Access: http://localhost:5001"
echo ""
echo "Monitoring:"
echo "   Grafana: http://localhost:3001 (admin/admin)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "Database:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "To stop services:"
echo "   docker-compose down"
echo ""
echo "Happy coding! 🚀"
echo "========================================="
