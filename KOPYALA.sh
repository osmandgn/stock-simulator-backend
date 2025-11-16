#!/bin/bash

echo "📦 BACKEND KLASÖRÜNÜ SUNUCUYA KOPYALAMA SCRIPTI"
echo "=================================================="
echo ""
echo "Bu script backend klasörünü sunucunuza kopyalayacak."
echo ""
read -p "Sunucu IP adresi (varsayılan: 46.36.201.101): " SERVER_IP
SERVER_IP=${SERVER_IP:-46.36.201.101}

read -p "Sunucu kullanıcı adı (varsayılan: root): " SERVER_USER
SERVER_USER=${SERVER_USER:-root}

read -p "Sunucuda hedef klasör (varsayılan: /root/stock-simulator-backend): " SERVER_PATH
SERVER_PATH=${SERVER_PATH:-/root/stock-simulator-backend}

echo ""
echo "📋 Ayarlar:"
echo "   Sunucu: ${SERVER_USER}@${SERVER_IP}"
echo "   Hedef: ${SERVER_PATH}"
echo ""
read -p "Devam etmek istiyor musunuz? (e/h): " CONFIRM

if [ "$CONFIRM" != "e" ]; then
    echo "❌ İşlem iptal edildi."
    exit 1
fi

echo ""
echo "🚀 Kopyalama başlıyor..."
echo ""

# Sunucuda klasör oluştur
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${SERVER_PATH}"

# Dosyaları kopyala (node_modules, .git ve .env hariç)
rsync -avz --progress \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude '.env' \
      --exclude '.DS_Store' \
      --exclude '*.tar.gz' \
      ./ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

echo ""
echo "✅ Kopyalama tamamlandı!"
echo ""
echo "📌 Sonraki adım:"
echo "   Sunucuya bağlanın ve uygulamayı başlatın:"
echo ""
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo "   cd ${SERVER_PATH}"
echo "   chmod +x START_SERVER.sh"
echo "   ./START_SERVER.sh"
echo ""

