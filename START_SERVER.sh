#!/bin/bash

echo "🚀 Starting Stock Simulator Backend on Production Server"
echo "=================================================="

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down

# Build new image
echo "🔨 Building Docker image..."
docker-compose -f docker-compose.production.yml build --no-cache

# Start containers
echo "▶️  Starting containers..."
docker-compose -f docker-compose.production.yml up -d

# Wait a bit
sleep 3

# Show logs
echo ""
echo "📋 Container logs (Press Ctrl+C to exit logs, container will keep running):"
echo "=================================================="
docker-compose -f docker-compose.production.yml logs -f

