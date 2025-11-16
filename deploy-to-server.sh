#!/bin/bash

# Sunucu bilgileri
SERVER_USER="root"  # Sunucu kullanıcı adınızı buraya yazın
SERVER_IP="46.36.201.101"
SERVER_PATH="/root/stock-simulator-backend"  # Sunucudaki proje yolunu buraya yazın

echo "🚀 Deploying to production server..."

# 1. Local değişiklikleri commit et
echo "📝 Committing local changes..."
git add server.js docker-compose.production.yml package-lock.json
git commit -m "Fix authentication middleware and add API key security

- Fix wildcard pattern in Express middleware
- Add env_file to docker-compose.production.yml
- Update JWT secret and API keys"

# 2. GitHub'a push et
echo "📤 Pushing to GitHub..."
git push origin main

# 3. .env.production dosyasını sunucuya kopyala (GIT'E EKLEMİYORUZ - GÜVENLİK)
echo "🔐 Copying .env.production to server..."
scp .env.production ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/.env.production

# 4. Sunucuda git pull yap ve restart et
echo "🔄 Pulling changes on server and restarting..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/stock-simulator-backend
git pull origin main
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml logs --tail=50
ENDSSH

echo "✅ Deployment completed!"
echo "🔍 Check your API: http://46.36.201.101/api/stocks/popular"
