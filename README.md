# Stock Simulator Backend v5.0

Production-ready backend API for Stock Simulator iOS app with PostgreSQL database, OAuth authentication, and intelligent caching system.

## 🚀 Özellikler

### Stock Data
- ✅ **2000 NASDAQ Hisseleri** - Gerçek zamanlı fiyat, market cap, revenue
- ✅ **Smart Caching** - In-memory cache with 1 min TTL
- ✅ **Background Refresh** - Otomatik veri güncelleme (her 1 dakika)
- ✅ **Web Scraping** - stockanalysis.com'dan 4 sayfa (pagination)

### User Management
- ✅ **Email/Password Authentication** - Klasik kullanıcı kaydı ve giriş
- ✅ **OAuth 2.0 Support** - Google & Apple Sign-In
- ✅ **JWT Token** - Stateless authentication (30 gün expiration)
- ✅ **PostgreSQL Database** - Production-ready veritabanı
- ✅ **Password Hashing** - bcrypt ile güvenli şifreleme

### Leaderboard
- ✅ **Global Rankings** - Toplam kazanca göre sıralama
- ✅ **Real-time Updates** - Kullanıcı istatistik güncellemeleri
- ✅ **Percentile Calculation** - Kullanıcı yüzdelik dilimi
- ✅ **Nearby Users** - Sıralamada yakındaki kullanıcılar

### Infrastructure
- ✅ **Docker Support** - Kolay deployment (PostgreSQL + Backend)
- ✅ **Health Checks** - Monitoring endpoint'leri
- ✅ **CORS Enabled** - Cross-origin support
- ✅ **API Key Security** - Optional API key authentication

## 📋 Gereksinimler

- Node.js 18+
- PostgreSQL 15+ (Docker veya manuel)
- Docker & Docker Compose (production için)

## 🔧 Kurulum

### 1. Dependencies'i yükle

```bash
npm install
```

### 2. Environment Variables

`.env` dosyası oluştur:

```bash
cp .env.example .env
```

`.env` içeriği:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stocksimulator
DB_USER=stockadmin
DB_PASSWORD=stockpass123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API Security (Opsiyonel)
API_KEYS=ios_app_key_12345,web_app_key_67890

# OAuth (Opsiyonel)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
APPLE_CLIENT_ID=com.yourcompany.stocksimulator
APPLE_TEAM_ID=YOUR_APPLE_TEAM_ID
APPLE_KEY_ID=YOUR_APPLE_KEY_ID
APPLE_PRIVATE_KEY_PATH=./config/AuthKey_XXXXX.p8
```

### 3. Database Setup (Docker ile - Önerilen)

```bash
# PostgreSQL + Backend'i birlikte başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Durdur
docker-compose down
```

### 4. Manuel Kurulum (Docker olmadan)

```bash
# PostgreSQL'i manuel kur ve başlat
psql -U postgres -f database/init.sql

# Backend'i başlat
npm run dev    # Development
npm start      # Production
```

## 📡 API Endpoints

### Health & Info
- `GET /health` - Sağlık durumu, cache ve database stats
- `GET /` - API bilgileri ve endpoint listesi

### Authentication
- `POST /api/auth/register` - Yeni kullanıcı kaydı (email/password)
- `POST /api/auth/login` - Kullanıcı girişi (email/password)
- `POST /api/auth/oauth` - OAuth girişi (Google/Apple)
- `GET /api/auth/profile` - Kullanıcı profili (JWT gerekli)

### Stock Data
- `GET /api/stocks/popular?limit=50` - Popüler hisseler (market cap'e göre)
- `GET /api/stocks/trending` - Gainers & Losers
- `GET /api/stocks/quote/:symbol` - Hisse fiyatı
- `GET /api/stocks/search?q=apple` - Hisse arama

### Leaderboard
- `GET /api/leaderboard?userId=xxx&limit=10` - Global leaderboard + user stats
- `POST /api/leaderboard/update` - Kullanıcı istatistik güncelleme (JWT gerekli)
- `GET /api/leaderboard/stats/:userId` - Detaylı istatistikler + nearby users
- `POST /api/leaderboard/refresh-ranks` - Tüm sıralamaları yeniden hesapla

### Admin
- `GET /admin/cache/stats` - Cache istatistikleri
- `POST /admin/cache/refresh` - Cache'i manuel yenile

## 📊 Teknik Detaylar

### Mimari

```
iOS App
   ↓
API Gateway (Express.js)
   ↓
Authentication Middleware (API Key / JWT)
   ↓
Route Handlers
   ↓
Controllers → Business Logic
   ↓
Services (Database / OAuth / Stock Data)
   ↓
PostgreSQL Database / External APIs
```

### Database Schema

```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(20),      -- 'google' | 'apple'
  oauth_id VARCHAR(255),
  profile_picture_url VARCHAR(500),
  total_return DECIMAL(15, 2),
  portfolio_value DECIMAL(15, 2),
  rank INTEGER,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### Teknolojiler

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.21.2 |
| Database | PostgreSQL | 15+ |
| Auth | JWT, bcrypt | 9.0.2, 5.1.1 |
| OAuth | Google, Apple | Latest |
| Cache | node-cache | 5.1.2 |
| Cron | node-cron | 3.0.3 |
| Container | Docker | 24+ |

### Veri Kaynağı

- **Web Scraping:** stockanalysis.com API
- **Hisse Sayısı:** 2000 NASDAQ hissesi (4 sayfa × 500)
- **Güncelleme:** Her 1 dakikada otomatik
- **Cache TTL:** 60 saniye

### Cron Jobs

- **NASDAQ Refresh:** `*/1 * * * *` (her 1 dakika)

## 🔐 Authentication Flow

### 1. Email/Password Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "totalReturn": 0,
    "portfolioValue": 100000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. OAuth Login (Google/Apple)

```bash
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "idToken": "GOOGLE_ID_TOKEN_FROM_IOS"
  }'
```

**Response:**
```json
{
  "success": true,
  "isNewUser": false,
  "user": {
    "userId": "uuid",
    "email": "user@gmail.com",
    "username": "johndoe",
    "profilePicture": "https://..."
  },
  "token": "JWT_TOKEN"
}
```

### 3. Using JWT Token

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏆 Leaderboard System

### Update User Stats

```bash
curl -X POST http://localhost:3000/api/leaderboard/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid",
    "totalReturn": 5420.75,
    "portfolioValue": 105420.75
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "username": "johndoe",
    "totalReturn": 5420.75,
    "rank": 42,
    "rankChange": 3,
    "percentile": 85
  }
}
```

### Get Global Leaderboard

```bash
curl "http://localhost:3000/api/leaderboard?userId=uuid&limit=10"
```

**Response:**
```json
{
  "success": true,
  "topUsers": [
    { "rank": 1, "username": "StockMaster", "totalReturn": 25430.50 },
    { "rank": 2, "username": "TradingPro", "totalReturn": 18920.25 }
  ],
  "currentUser": {
    "userId": "uuid",
    "username": "johndoe",
    "rank": 42,
    "percentile": 85
  },
  "totalUsers": 1523
}
```

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d --build
```

**Services:**
- `postgres` - PostgreSQL 15 (port 5432)
- `stock-backend` - Node.js backend (port 3000)

### Production

```bash
docker-compose -f docker-compose.production.yml up -d --build
```

### Health Check

```bash
# Backend health
curl http://localhost:3000/health

# Database check
docker exec stock-simulator-db psql -U stockadmin -d stocksimulator -c "SELECT COUNT(*) FROM users;"
```

## 📖 Dokümantasyon

- **API Dökümantasyonu:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **OAuth Setup:** [OAUTH_SETUP.md](./OAUTH_SETUP.md)

## 🔒 Güvenlik

### Implemented Security Measures

- ✅ **Password Hashing** - bcrypt (10 rounds)
- ✅ **JWT Tokens** - 30 gün expiration
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **OAuth Token Verification** - Server-side validation
- ✅ **API Key Authentication** - Optional multi-method support
- ✅ **CORS Configuration** - Controllable origins

### Security Recommendations

1. **Production'da mutlaka değiştir:**
   - `JWT_SECRET`
   - `DB_PASSWORD`
   - `API_KEYS`

2. **HTTPS kullan:** Production'da SSL/TLS şart

3. **Keychain kullan (iOS):** JWT token'ları güvenli sakla

4. **Rate limiting ekle:** DDoS koruması için

5. **Database backups:** Düzenli yedekleme

## 📝 Deployment Güncellemesi

Kod değişikliklerini deploy etmek için:

```bash
# Local'de
git add .
git commit -m "Update: Add new feature"
git push

# Sunucuda
cd /root/stock-simulator-backend
git pull
docker-compose down
docker-compose up -d --build
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123"}'
```

### Test Stock Data

```bash
curl "http://localhost:3000/api/stocks/popular?limit=10"
curl "http://localhost:3000/api/stocks/quote/AAPL"
```

## 🐛 Troubleshooting

### Problem: Database connection failed

**Çözüm:**
```bash
# PostgreSQL çalışıyor mu?
docker-compose ps

# Logs kontrol et
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Problem: OAuth verification failed

**Çözüm:**
1. `.env` dosyasında `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` doğru mu?
2. iOS tarafında aynı Client ID kullanılıyor mu?
3. Token expired olmamış mı?

### Problem: JWT token invalid

**Çözüm:**
1. Token format doğru mu? `Bearer <token>`
2. Token expired olmamış mı? (30 gün)
3. `JWT_SECRET` değişmiş mi?

## 📊 Monitoring

### Cache Stats

```bash
curl http://localhost:3000/admin/cache/stats
```

### Database Stats

```bash
docker exec stock-simulator-db psql -U stockadmin -d stocksimulator -c "
  SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE oauth_provider IS NOT NULL) as oauth_users,
    (SELECT COUNT(*) FROM users WHERE rank IS NOT NULL) as ranked_users;
"
```

## 🔄 Version History

```
v5.0.0 (2025-11-03) - Current
  ✅ OAuth 2.0 support (Google & Apple)
  ✅ PostgreSQL database
  ✅ JWT authentication
  ✅ User management system
  ✅ Enhanced leaderboard

v4.0.0 (2025-10-28)
  ✅ 2000 NASDAQ stocks (pagination)
  ✅ API key authentication
  ✅ Background refresh (1 min)

v3.0.0
  ✅ Initial NASDAQ scraping
  ✅ Basic leaderboard (in-memory)
```

## 📄 Lisans

MIT

---

**Geliştirici:** OsmanD
**Versiyon:** 5.0.0
**Son Güncelleme:** 2025-11-03
**Durum:** Production Ready (PostgreSQL gerektirir)
