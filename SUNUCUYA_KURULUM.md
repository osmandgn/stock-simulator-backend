# 🚀 SUNUCUYA KURULUM REHBERİ

Bu klasörü sunucunuza taşıyıp çalıştırmak için bu adımları takip edin.

---

## 📦 ADIM 1: Klasörü Sunucuya Kopyalayın

Terminalinizde bu komutu çalıştırın (Mac/Linux'ta çalışır):

```bash
# Mevcut klasörün bulunduğu dizinde çalıştırın
rsync -avz --exclude 'node_modules' \
      --exclude '.git' \
      --exclude '.env' \
      . root@46.36.201.101:/root/stock-simulator-backend/
```

**VEYA** FileZilla/WinSCP gibi programlarla kopyalayın:
- Host: `46.36.201.101`
- Kullanıcı: `root`
- Hedef Klasör: `/root/stock-simulator-backend/`

**ÖNEMLİ:** Bu klasördeki BÜTÜN dosyaları kopyalayın (`.env.production` dahil!)

---

## 🖥️  ADIM 2: Sunucuya Bağlanın

```bash
ssh root@46.36.201.101
```

---

## ▶️  ADIM 3: Uygulamayı Başlatın

Sunucuda şu komutu çalıştırın:

```bash
cd /root/stock-simulator-backend
chmod +x START_SERVER.sh
./START_SERVER.sh
```

Bu script otomatik olarak:
- ✅ Eski container'ları durdurur
- ✅ Yeni Docker image'ı oluşturur
- ✅ PostgreSQL ve Backend'i başlatır
- ✅ Logları gösterir

---

## ✅ ADIM 4: Test Edin

Başka bir terminalde test edin:

```bash
# Token OLMADAN - 401 hatası dönmeli
curl http://46.36.201.101/api/stocks/popular

# Token İLE - Çalışmalı ve 2000 stock dönmeli
curl -H "x-api-key: sk_prod_7f8e2a9d4c1b6e5a3f9d8c7b2a5e4d1c" \
     http://46.36.201.101/api/stocks/popular
```

---

## 🔑 API ANAHTARLARINIZ

`.env.production` dosyasında şu API anahtarları tanımlı:

1. **Production Key:** `sk_prod_7f8e2a9d4c1b6e5a3f9d8c7b2a5e4d1c`
2. **iOS App Key:** `sk_ios_app_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d`
3. **Web Key:** `sk_web_2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f`

Bu anahtarlardan birini kullanarak API'ye erişebilirsiniz:

- **Header:** `x-api-key: YOUR_KEY`
- **Authorization:** `Authorization: Bearer YOUR_KEY`
- **Query:** `?apiKey=YOUR_KEY` (güvenli değil, önerilmez)

---

## 📋 YARALI KOMUTLAR

```bash
# Container durumunu kontrol et
docker ps

# Logları canlı izle
docker-compose -f docker-compose.production.yml logs -f

# Container'ı yeniden başlat
docker-compose -f docker-compose.production.yml restart

# Container'ı durdur
docker-compose -f docker-compose.production.yml down

# Container'ı tekrar başlat
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔧 SORUN GİDERME

### Port zaten kullanımda hatası:
```bash
# 80 portunu kullanan process'i bul ve kapat
sudo lsof -i :80
sudo kill -9 <PID>
```

### Database bağlantı hatası:
```bash
# PostgreSQL container'ının çalıştığını kontrol et
docker ps | grep postgres

# Database loglarını incele
docker logs stock-simulator-db-prod
```

### API çalışmıyor:
```bash
# Backend loglarını incele
docker logs stock-simulator-backend

# Health check
curl http://localhost:3000/health
```

---

## 📊 SERVİSLER

Deploy edilen servisler:

1. **PostgreSQL Database** (Internal)
   - Container: `stock-simulator-db-prod`
   - Database: `stocksimulator`
   - User: `stockadmin`

2. **Backend API** (Public)
   - Container: `stock-simulator-backend`
   - Port 80: Public HTTP
   - Port 3000: Direct access
   - URL: `http://46.36.201.101`

---

## 🎯 SONRAKİ ADIMLAR

1. ✅ iOS uygulamanıza API anahtarını ekleyin
2. ✅ API URL'ini `http://46.36.201.101` olarak güncelleyin
3. ✅ Test edin ve sorunsuz çalıştığından emin olun

---

**Not:** Sunucunuz her açıldığında uygulama otomatik başlayacak (`restart: unless-stopped`)
