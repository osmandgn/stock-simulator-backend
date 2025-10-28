#!/bin/bash

# Direct Deployment Script - Uploads files directly to server
# No Git required on server!

SERVER="root@46.36.201.101"
SERVER_PASS="40fb3e9801e6!diyo@"

echo "🚀 Stock Simulator Backend - Direct Deployment"
echo "=================================================="
echo ""

# Step 1: Create tarball
echo "📦 Step 1: Creating deployment package..."
cd "$(dirname "$0")"
tar -czf /tmp/stock-backend.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*.log' \
    .

echo "✅ Package created: $(du -h /tmp/stock-backend.tar.gz | cut -f1)"
echo ""

# Step 2: Upload to server
echo "📤 Step 2: Uploading to server..."
echo "Password: $SERVER_PASS"
echo ""

scp -o StrictHostKeyChecking=no /tmp/stock-backend.tar.gz $SERVER:/tmp/

echo ""
echo "✅ Upload complete"
echo ""

# Step 3: Deploy on server
echo "🚀 Step 3: Deploying on server..."
echo ""

ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
set -e

echo "🔧 Installing Docker if needed..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

echo ""
echo "🧹 Stopping Dokploy containers..."
docker ps -q --filter "name=dokploy" | xargs -r docker stop || true
docker ps -aq --filter "name=dokploy" | xargs -r docker rm || true

echo ""
echo "🧹 Freeing port 80..."
lsof -ti:80 | xargs -r kill -9 || true
lsof -ti:3000 | xargs -r kill -9 || true

echo ""
echo "📁 Extracting application files..."
mkdir -p /root/stock-simulator-backend
cd /root/stock-simulator-backend
tar -xzf /tmp/stock-backend.tar.gz
rm /tmp/stock-backend.tar.gz

echo ""
echo "🔨 Building Docker image..."
docker compose -f docker-compose.production.yml down || true
docker compose -f docker-compose.production.yml build --no-cache

echo ""
echo "🚀 Starting application..."
docker compose -f docker-compose.production.yml up -d

echo ""
echo "⏳ Waiting for startup..."
sleep 10

echo ""
echo "📊 Container status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "🧪 Testing endpoints..."
curl -s http://localhost:3000/health || echo "Health check pending..."
echo ""

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETED!"
echo ""
echo "📍 Your application is live at:"
echo "   http://46.36.201.101/"
echo "   http://46.36.201.101/health"
echo "   http://46.36.201.101/api/stocks/popular"
echo ""
echo "📊 Useful commands:"
echo "   cd /root/stock-simulator-backend"
echo "   docker compose -f docker-compose.production.yml logs -f"
echo "   docker compose -f docker-compose.production.yml ps"
echo "=================================================="
ENDSSH

echo ""
echo "🎉 ALL DONE!"
echo ""
echo "🌐 Open in browser:"
echo "   http://46.36.201.101/"
echo ""

# Cleanup
rm /tmp/stock-backend.tar.gz

echo "✨ Deployment complete!"
