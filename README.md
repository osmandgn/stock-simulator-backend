# Stock Simulator Backend v2.0

Production-ready backend API for Stock Simulator iOS app with intelligent caching and background data refresh. Finnhub API kullanarak gerçek zamanlı hisse senedi fiyatları ve leaderboard yönetimi sağlar.

## 🚀 Özellikler

- ✅ **Smart Caching** - In-memory cache with TTL (2-5 min)
- ✅ **Background Refresh** - Scheduled cron jobs every 2-3 minutes
- ✅ **30 Popular Stocks** - Auto-refreshed most traded US stocks
- ✅ **Rate Limit Optimization** - %95+ cache hit rate
- ✅ Real-time stock quotes (Finnhub API)
- ✅ Company profiles with logos
- ✅ Stock symbol search
- ✅ Batch quote requests
- ✅ Leaderboard system (in-memory)
- ✅ Docker support
- ✅ CORS enabled
- ✅ Health check & monitoring endpoints

## 📋 Gereksinimler

- Node.js 18+
- Finnhub API Key ([ücretsiz alın](https://finnhub.io/register))
- Docker (optional, Dockploy için gerekli)

## 🔧 Kurulum

### 1. Dependencies'i yükle

```bash
cd backend
npm install
```

### 2. Environment variables'ı ayarla

`.env` dosyası oluştur:

```bash
cp .env.example .env
```

`.env` dosyasını düzenle ve API key'ini ekle:

```env
FINNHUB_API_KEY=your_finnhub_api_key_here
PORT=3000
```

### 3. Sunucuyu çalıştır

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Sunucu `http://localhost:3000` adresinde çalışacak.

## 🐳 Docker ile Çalıştırma

### Docker Build

```bash
docker build -t stock-simulator-backend .
```

### Docker Run

```bash
docker run -p 3000:3000 \
  -e FINNHUB_API_KEY=your_api_key \
  stock-simulator-backend
```

### Docker Compose

```bash
# .env dosyasını oluştur
echo "FINNHUB_API_KEY=your_api_key" > .env

# Çalıştır
docker-compose up -d

# Durumu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f

# Durdur
docker-compose down
```

## 📦 Dockploy'a Deploy

### 1. GitHub'a push et

```bash
git init
git add .
git commit -m "Initial backend"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Dockploy'da yeni proje oluştur

1. Dockploy dashboard'a git
2. "New Service" tıkla
3. "Docker" seç
4. GitHub repo'nu bağla
5. Build ayarlarını yap:
   - **Dockerfile Path:** `./Dockerfile`
   - **Port:** `3000`
   - **Environment Variables:**
     - `FINNHUB_API_KEY`: `your_api_key`
     - `PORT`: `3000`

### 3. Deploy et

Dockploy otomatik olarak build edip deploy edecek. Deploy URL'i:
```
https://your-app.dockploy.com
```

## 📡 API Endpoints

### Health Check

```bash
GET /health
GET /
```

**Response:**
```json
{
  "success": true,
  "message": "Stock Simulator Backend is running",
  "timestamp": "2025-10-26T..."
}
```

### Stock Endpoints

#### 1. Get Popular Stocks (🔥 Most Used - CACHED)

```bash
GET /api/stocks/popular?limit=30
```

**Example:**
```bash
curl http://localhost:3000/api/stocks/popular?limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "stocks": [
    {
      "symbol": "AAPL",
      "currentPrice": 174.55,
      "change": 1.25,
      "percentChange": 0.72,
      "high": 175.50,
      "low": 173.00
    },
    ...
  ],
  "cached": true
}
```

**Note:**
- Default limit: 30 stocks
- Cache TTL: 5 minutes
- Auto-refreshed every 2 minutes by cron job
- First request loads all 30, subsequent requests are instant (cache)
- Initial load takes ~35 seconds

#### 2. Get Stock Quote

```bash
GET /api/stocks/quote/:symbol
```

**Example:**
```bash
curl http://localhost:3000/api/stocks/quote/AAPL
```

**Response:**
```json
{
  "success": true,
  "symbol": "AAPL",
  "currentPrice": 174.55,
  "change": 1.25,
  "percentChange": 0.72,
  "high": 175.50,
  "low": 173.00,
  "open": 174.00,
  "previousClose": 173.30,
  "timestamp": 1698350400,
  "cached": true
}
```

#### 3. Get Company Profile

```bash
GET /api/stocks/profile/:symbol
```

**Example:**
```bash
curl http://localhost:3000/api/stocks/profile/AAPL
```

**Response:**
```json
{
  "success": true,
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "logo": "https://static.finnhub.io/logo/...",
  "country": "US",
  "currency": "USD",
  "exchange": "NASDAQ",
  "industry": "Technology",
  "marketCap": 2800000,
  "shareOutstanding": 15821000,
  "ipo": "1980-12-12",
  "website": "https://www.apple.com"
}
```

#### 4. Search Stocks

```bash
GET /api/stocks/search?q=query
```

**Example:**
```bash
curl "http://localhost:3000/api/stocks/search?q=apple"
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "results": [
    {
      "symbol": "AAPL",
      "displaySymbol": "AAPL",
      "description": "Apple Inc.",
      "type": "Common Stock"
    }
  ]
}
```

#### 5. Batch Quotes

```bash
POST /api/stocks/batch-quotes
Content-Type: application/json

{
  "symbols": ["AAPL", "GOOGL", "TSLA"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "quotes": [
    {
      "symbol": "AAPL",
      "currentPrice": 174.55,
      "change": 1.25,
      "percentChange": 0.72
    },
    ...
  ]
}
```

### Leaderboard Endpoints

#### 1. Get Leaderboard

```bash
GET /api/leaderboard?limit=100
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "leaderboard": [
    {
      "userId": "1",
      "username": "OsmanD",
      "totalReturn": 12450.50,
      "rank": 1
    },
    ...
  ]
}
```

#### 2. Update User Stats

```bash
POST /api/leaderboard/update
Content-Type: application/json

{
  "userId": "123",
  "username": "YourUsername",
  "totalReturn": 15000.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard updated",
  "user": {
    "userId": "123",
    "username": "YourUsername",
    "totalReturn": 15000.00,
    "rank": 2
  }
}
```

#### 3. Get User Stats

```bash
GET /api/leaderboard/user/:userId
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "123",
    "username": "YourUsername",
    "totalReturn": 15000.00,
    "rank": 2
  }
}
```

## 🧪 Test Etme

### cURL ile test

```bash
# Health check
curl http://localhost:3000/health

# Stock quote
curl http://localhost:3000/api/stocks/quote/AAPL

# Stock search
curl "http://localhost:3000/api/stocks/search?q=tesla"

# Leaderboard
curl http://localhost:3000/api/leaderboard

# Update leaderboard
curl -X POST http://localhost:3000/api/leaderboard/update \
  -H "Content-Type: application/json" \
  -d '{"userId":"test1","username":"TestUser","totalReturn":5000}'
```

### Postman Collection

API'yi test etmek için Postman kullanabilirsiniz. Base URL:
```
http://localhost:3000
```

## 📊 Rate Limits

- **Finnhub Free Plan:** 60 API calls/dakika
- **Backend:** Rate limiting yok (şimdilik)

Yüksek trafik için caching eklenebilir.

## 🔐 Güvenlik Notları

**Önemli:** Production'da şunları ekleyin:
- ✅ Rate limiting (express-rate-limit)
- ✅ Helmet.js (security headers)
- ✅ Input validation
- ✅ Authentication (JWT)
- ✅ HTTPS (Dockploy otomatik sağlar)

## 📝 Geliştirme Notları

### Leaderboard Veri Saklama

Şu anda leaderboard **in-memory** (RAM'de). Server restart olunca veri kaybolur.

**İyileştirmeler:**
- 📦 Database ekle (PostgreSQL, MongoDB, Redis)
- 💾 File-based persistence (JSON file)
- ☁️ Cloud database (Supabase, Firebase)

### Caching

API call'larını azaltmak için caching eklenebilir:
```javascript
// node-cache ile örnek
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // 60 saniye cache
```

### Monitoring

Production'da log ve monitoring ekleyin:
- 📈 Winston (logging)
- 📊 Prometheus (metrics)
- 🔔 Sentry (error tracking)

## 🐛 Troubleshooting

**API Key çalışmıyor:**
```bash
# .env dosyasını kontrol et
cat .env

# Server'ı restart et
npm start
```

**Port zaten kullanımda:**
```bash
# .env dosyasında PORT'u değiştir
PORT=3001
```

**Docker build hatası:**
```bash
# Cache'i temizle ve tekrar build et
docker build --no-cache -t stock-simulator-backend .
```

## 📄 License

MIT

## 👤 Author

Osman Dogan
