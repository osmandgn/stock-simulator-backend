#!/bin/bash

# Stock Simulator Backend - Production Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Stock Simulator Backend - Production Deployment"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Stop and remove existing containers
echo ""
echo "📦 Stopping existing containers..."
docker compose -f docker-compose.production.yml down || true

# Remove old images (optional)
echo ""
echo "🧹 Cleaning up old images..."
docker image prune -f || true

# Build new image
echo ""
echo "🔨 Building new Docker image..."
docker compose -f docker-compose.production.yml build --no-cache

# Start containers
echo ""
echo "🚀 Starting containers..."
docker compose -f docker-compose.production.yml up -d

# Wait for health check
echo ""
echo "⏳ Waiting for application to be healthy..."
sleep 5

# Check container status
echo ""
echo "📊 Container status:"
docker compose -f docker-compose.production.yml ps

# Check logs
echo ""
echo "📝 Recent logs:"
docker compose -f docker-compose.production.yml logs --tail=20

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
echo ""

if command -v curl &> /dev/null; then
    echo "Testing health endpoint..."
    curl -s http://localhost:3000/health | head -c 200
    echo ""
    echo ""
    echo "Testing root endpoint..."
    curl -s http://localhost:3000/ | head -c 200
    echo ""
else
    echo "⚠️  curl not installed, skipping endpoint tests"
fi

echo ""
echo "=================================================="
echo "✅ Deployment completed successfully!"
echo ""
echo "📍 Application URLs:"
echo "   Health:   http://$(hostname -I | awk '{print $1}'):3000/health"
echo "   Root:     http://$(hostname -I | awk '{print $1}'):3000/"
echo "   Public:   http://$(hostname -I | awk '{print $1}')/"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker compose -f docker-compose.production.yml logs -f"
echo "   Stop:         docker compose -f docker-compose.production.yml down"
echo "   Restart:      docker compose -f docker-compose.production.yml restart"
echo "   Status:       docker compose -f docker-compose.production.yml ps"
echo ""
