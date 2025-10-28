#!/bin/bash

# Remote Deployment Script - Stock Simulator Backend
# This script will connect to your server and deploy the application

SERVER_IP="46.36.201.101"
SERVER_USER="root"
SERVER_PASS="40fb3e9801e6!diyo@"

echo "🚀 Stock Simulator Backend - Remote Deployment"
echo "=================================================="
echo ""
echo "Target Server: $SERVER_IP"
echo ""

# Create deployment commands
read -r -d '' DEPLOY_COMMANDS << 'EOF'
set -e

echo "📦 Step 1: Installing Docker if needed..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "✅ Docker already installed"
fi

echo ""
echo "🧹 Step 2: Stopping Dokploy containers (if any)..."
docker ps -a | grep dokploy | awk '{print $1}' | xargs -r docker stop || true
docker ps -a | grep dokploy | awk '{print $1}' | xargs -r docker rm || true

echo ""
echo "🧹 Step 3: Freeing port 80..."
lsof -ti:80 | xargs -r kill -9 || true
systemctl stop nginx || true
systemctl stop apache2 || true

echo ""
echo "📥 Step 4: Cloning application from GitHub..."
cd /root
rm -rf stock-simulator-backend
git clone https://github.com/osmandgn/stock-simulator-backend.git
cd stock-simulator-backend

echo ""
echo "🔨 Step 5: Building and starting application..."
docker compose -f docker-compose.production.yml down || true
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

echo ""
echo "⏳ Step 6: Waiting for application to start..."
sleep 10

echo ""
echo "📊 Container status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "🧪 Testing application..."
curl -s http://localhost:3000/health | head -c 300
echo ""

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETED!"
echo ""
echo "📍 Your application is now running at:"
echo "   http://46.36.201.101/"
echo "   http://46.36.201.101/health"
echo "   http://46.36.201.101/api/stocks/popular?limit=10"
echo ""
echo "📊 View logs: docker compose -f docker-compose.production.yml logs -f"
echo "=================================================="
EOF

echo "🔐 Connecting to server and deploying..."
echo ""

# Use sshpass if available, otherwise use expect
if command -v sshpass &> /dev/null; then
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$DEPLOY_COMMANDS"
else
    # Fallback: Direct SSH (will prompt for password)
    echo "⚠️  sshpass not installed. You will need to enter password manually."
    echo "Password: $SERVER_PASS"
    echo ""
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$DEPLOY_COMMANDS"
fi

echo ""
echo "🎉 DONE! Your application should be live at:"
echo "   http://46.36.201.101/"
