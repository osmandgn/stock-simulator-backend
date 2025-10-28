# Stock Simulator Backend v4.0

Production-ready backend API for Stock Simulator iOS app with intelligent caching and background data refresh. NASDAQ hisse senetlerini stockanalysis.com'dan web scraping ile çeker - **API key gerekmez!**

## 🚀 Özellikler

- ✅ **500 NASDAQ Hisseleri** - Gerçek zamanlı fiyat, market cap, revenue
- ✅ **Smart Caching** - In-memory cache with 1 min TTL
- ✅ **Background Refresh** - Otomatik veri güncelleme (her 1 dakika)
- ✅ **Web Scraping** - stockanalysis.com'dan veri çekimi
- ✅ **No API Keys** - API key gerektirmez
- ✅ **No Rate Limits** - Rate limit yok
- ✅ **Leaderboard System** - Kullanıcı sıralaması
- ✅ **Docker Support** - Kolay deployment
- ✅ **CORS Enabled** - Tüm origin'lere açık
- ✅ **Health Check** - Monitoring endpoint'leri

## 📋 Gereksinimler

- Node.js 18+
- Docker (production deployment için)

## 🔧 Kurulum

### 1. Dependencies'i yükle

```bash
npm install
```

### 2. Environment variables (opsiyonel)

`.env` dosyası oluştur:

```bash
cp .env.example .env
```

`.env` içeriği:

```env
PORT=3000
```

### 3. Development'ta çalıştır

```bash
npm run dev
```

### 4. Production'da çalıştır

```bash
npm start
```

## 🐳 Docker Deployment

### Local Test

```bash
docker compose up -d --build
```

### Production Deployment

```bash
docker compose -f docker-compose.production.yml up -d --build
```

## 📡 API Endpoints

### Genel Bilgi
- `GET /` - API bilgileri ve endpoint listesi
- `GET /health` - Sağlık durumu ve cache stats

### Hisse Senedi
- `GET /api/stocks/popular?limit=50` - Popüler hisseler (market cap'e göre)
- `GET /api/stocks/trending` - Top 10 hisse
- `GET /api/stocks/quote/:symbol` - Hisse fiyatı
- `GET /api/stocks/profile/:symbol` - Şirket profili
- `GET /api/stocks/search?q=apple` - Hisse arama
- `POST /api/stocks/batch-quotes` - Toplu fiyat sorgusu
- `POST /api/stocks/batch-profiles` - Toplu profil sorgusu

### Leaderboard
- `GET /api/leaderboard?limit=100` - Kullanıcı sıralaması
- `POST /api/leaderboard/update` - Kullanıcı istatistik güncelleme
- `GET /api/leaderboard/user/:userId` - Kullanıcı bilgisi

### Admin
- `GET /api/admin/cache/stats` - Cache istatistikleri
- `POST /api/admin/cache/clear` - Cache temizleme
- `POST /api/admin/refresh/nasdaq` - NASDAQ listesini zorla yenile

## 📊 Teknik Detaylar

### Veri Kaynağı
- **Web Scraping:** stockanalysis.com
- **Hisse Sayısı:** 500 NASDAQ hissesi
- **Güncelleme:** Her 1 dakikada otomatik
- **Cache TTL:** 60 saniye

### Teknolojiler
- **Runtime:** Node.js 18
- **Framework:** Express.js
- **Cache:** node-cache
- **Cron:** node-cron
- **Scraping:** axios + cheerio
- **Container:** Docker

### Cron Jobs
- **NASDAQ Refresh:** `*/1 * * * *` (her 1 dakika)

## 🚀 Production URL

**Canlı API:** `http://46.36.201.101`

**Test Endpoints:**
```bash
curl http://46.36.201.101/health
curl http://46.36.201.101/api/stocks/popular?limit=10
curl http://46.36.201.101/api/stocks/quote/AAPL
```

## 📝 Deployment Güncellemesi

Kod değişikliklerini deploy etmek için:

```bash
# Local'de
git add .
git commit -m "Update description"
git push

# Sunucuda
cd /root/stock-simulator-backend
git pull
docker compose -f docker-compose.production.yml up -d --build
```

## 📖 Dokümantasyon

Detaylı API dökümantasyonu için: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## ⚙️ Environment Variables

| Variable | Default | Açıklama |
|----------|---------|----------|
| `PORT` | 3000 | Sunucu portu |
| `NODE_ENV` | development | Çalışma ortamı |

## 🔒 Güvenlik Notları

- Leaderboard verileri in-memory (restart'ta sıfırlanır)
- Production'da admin endpoint'leri korunmalı
- CORS tüm origin'lere açık (gerekirse kısıtlanabilir)

## 📄 Lisans

MIT

---

**Geliştirici:** OsmanD
**Versiyon:** 4.0.0
**Son Güncelleme:** 2025-10-28
