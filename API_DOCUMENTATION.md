# Stock Simulator Backend API Documentation

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Teknik Mimari](#teknik-mimari)
3. [Kurulum](#kurulum)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
   - [Stock Endpoints](#stock-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Leaderboard Endpoints](#leaderboard-endpoints)
   - [Admin Endpoints](#admin-endpoints)
6. [Hata Kodları](#hata-kodları)
7. [Rate Limiting](#rate-limiting)
8. [Best Practices](#best-practices)

---

## Genel Bakış

Stock Simulator Backend, iOS uygulaması için NASDAQ hisse senedi verileri, kullanıcı yönetimi ve leaderboard işlevselliği sağlayan RESTful API servisidir.

### Temel Özellikler

- **2000 NASDAQ hisse senedi verisi** (stockanalysis.com)
- **Gerçek zamanlı fiyat güncellemeleri** (1 dakikalık interval)
- **Kullanıcı yönetimi** (Email/Password + OAuth)
- **JWT tabanlı authentication**
- **Global leaderboard sistemi**
- **OAuth 2.0 desteği** (Google & Apple Sign-In)

### Teknik Stack

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4.21.2 | Web framework |
| PostgreSQL | 15+ | Ana veritabanı |
| Docker | 24+ | Konteynerizasyon |
| JWT | jsonwebtoken@9.0.2 | Token-based auth |
| bcrypt | 5.1.1 | Password hashing |

### Base URL

```
Development: http://localhost:3000
Production:  https://api.stocksimulator.com  (TBD)
```

---

## Teknik Mimari

### Klasör Yapısı

```
backend/
├── server.js                 # Ana uygulama entry point
├── package.json              # Dependencies
├── .env                      # Environment variables
├── docker-compose.yml        # Docker orchestration
│
├── config/
│   └── AuthKey_XXXXX.p8     # Apple Sign-In private key
│
├── controllers/              # İş mantığı katmanı
│   ├── authController.js    # Authentication logic
│   └── leaderboardController.js
│
├── middleware/              # Express middleware
│   ├── authMiddleware.js    # API key validation
│   └── jwtMiddleware.js     # JWT token validation
│
├── models/                  # Veritabanı modelleri
│   └── User.js             # User CRUD operations
│
├── routes/                  # API route tanımları
│   ├── auth.js
│   └── leaderboard.js
│
├── services/                # Business logic servisleri
│   ├── databaseService.js   # PostgreSQL connection pool
│   ├── nasdaqCrawlerService.js  # Stock data fetching
│   └── oauthService.js      # Google/Apple token verification
│
└── database/
    └── init.sql             # Database schema initialization
```

### Veri Akışı

```
iOS App
   ↓
[API Gateway]
   ↓
[Authentication Middleware] → API Key / JWT Token Check
   ↓
[Route Handler]
   ↓
[Controller] → Business Logic
   ↓
[Service Layer] → Database / External API
   ↓
[Response] → JSON Format
   ↓
iOS App
```

### Database Schema

```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255),           -- NULL for OAuth users
  oauth_provider VARCHAR(20),           -- 'google' | 'apple' | NULL
  oauth_id VARCHAR(255),                -- Provider's user ID
  profile_picture_url VARCHAR(500),
  total_return DECIMAL(15, 2) DEFAULT 0,
  portfolio_value DECIMAL(15, 2) DEFAULT 100000,
  rank INTEGER,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id)
)

Indexes:
- idx_users_rank ON users(rank)
- idx_users_total_return ON users(total_return DESC)
- idx_users_email ON users(email)
- idx_users_username ON users(username)
```

---

## Kurulum

### 1. Repository Clone

```bash
git clone <repo-url>
cd backend
```

### 2. Environment Variables

`.env` dosyası oluştur:

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

### 3. Docker ile Başlatma (Önerilen)

```bash
# PostgreSQL + Backend'i birlikte başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Durdur
docker-compose down
```

### 4. Manuel Kurulum

```bash
# Dependencies yükle
npm install

# PostgreSQL'i manuel başlat (psql ile)
psql -U postgres -f database/init.sql

# Backend'i başlat
npm start              # Production
npm run dev            # Development (nodemon ile)
```

### 5. Health Check

```bash
curl http://localhost:3000/health
```

**Beklenen Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "uptime": 123.45,
  "version": "5.0",
  "stocksLoaded": 2000,
  "database": "connected"
}
```

---

## Authentication

### 1. API Key Authentication

Tüm `/api/*` endpointleri API key gerektirir (eğer `.env`'de `API_KEYS` tanımlıysa).

#### Method 1: Header (Önerilen)

```http
GET /api/stocks/popular
x-api-key: ios_app_key_12345
```

#### Method 2: Bearer Token

```http
GET /api/stocks/popular
Authorization: Bearer ios_app_key_12345
```

#### Method 3: Query Parameter

```http
GET /api/stocks/popular?apiKey=ios_app_key_12345
```

### 2. JWT Token Authentication

Bazı protected endpoints JWT token gerektirir (örn: `/api/auth/profile`, `/api/leaderboard/update`).

```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT token `/api/auth/login` veya `/api/auth/register` endpointlerinden döner.

**Token Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "iat": 1234567890,
  "exp": 1237246290
}
```

**Token Expiration:** 30 gün

---

## API Endpoints

## Stock Endpoints

### GET `/api/stocks/popular`

En popüler hisse senetlerini döndürür (market cap'e göre sıralı).

**Query Parameters:**
- `limit` (optional): Döndürülecek hisse sayısı (default: 50, max: 2000)

**Request:**
```http
GET /api/stocks/popular?limit=100
x-api-key: ios_app_key_12345
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "companyName": "Apple Inc.",
      "marketCap": 2891000000000,
      "price": 178.52,
      "change": 2.34,
      "percentChange": 1.33,
      "revenue": 394328000000
    },
    // ... 99 more stocks
  ],
  "count": 100,
  "source": "stockanalysis.com",
  "lastUpdated": "2025-11-03T10:25:00.000Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Hisse sembolü (örn: "AAPL") |
| companyName | string | Şirket adı |
| marketCap | number | Piyasa değeri (USD) |
| price | number | Güncel fiyat (USD) |
| change | number | Fiyat değişimi (USD) |
| percentChange | number | Yüzde değişim |
| revenue | number | Yıllık gelir (USD) |

---

### GET `/api/stocks/quote/:symbol`

Tek bir hisse senedi için detaylı bilgi.

**Parameters:**
- `symbol` (required): Hisse sembolü (örn: AAPL)

**Request:**
```http
GET /api/stocks/quote/AAPL
x-api-key: ios_app_key_12345
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "marketCap": 2891000000000,
    "price": 178.52,
    "change": 2.34,
    "percentChange": 1.33,
    "revenue": 394328000000
  },
  "source": "stockanalysis.com",
  "lastUpdated": "2025-11-03T10:25:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Stock not found",
  "message": "Stock with symbol 'INVALID' not found in NASDAQ list"
}
```

---

### GET `/api/stocks/search`

Hisse senedi arama (sembol veya şirket adına göre).

**Query Parameters:**
- `q` (required): Arama terimi (min 1 karakter)
- `limit` (optional): Maksimum sonuç sayısı (default: 20)

**Request:**
```http
GET /api/stocks/search?q=apple&limit=10
x-api-key: ios_app_key_12345
```

**Response (200 OK):**
```json
{
  "success": true,
  "query": "apple",
  "results": [
    {
      "symbol": "AAPL",
      "companyName": "Apple Inc.",
      "marketCap": 2891000000000,
      "price": 178.52,
      "change": 2.34,
      "percentChange": 1.33,
      "revenue": 394328000000
    }
  ],
  "count": 1
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Search query required"
}
```

---

### GET `/api/stocks/trending`

En çok değişim gösteren hisse senetleri (gainers & losers).

**Query Parameters:**
- `limit` (optional): Her kategori için limit (default: 10)

**Request:**
```http
GET /api/stocks/trending?limit=5
x-api-key: ios_app_key_12345
```

**Response (200 OK):**
```json
{
  "success": true,
  "gainers": [
    {
      "symbol": "TSLA",
      "companyName": "Tesla Inc.",
      "price": 242.50,
      "percentChange": 8.75
    }
    // ... 4 more
  ],
  "losers": [
    {
      "symbol": "NFLX",
      "companyName": "Netflix Inc.",
      "price": 385.20,
      "percentChange": -5.32
    }
    // ... 4 more
  ]
}
```

---

## Auth Endpoints

### POST `/api/auth/register`

Yeni kullanıcı kaydı (email/password).

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepass123"
}
```

**Validation Rules:**
- `email`: Valid email format
- `username`: 3-20 karakter, alphanumeric + underscore
- `password`: Minimum 6 karakter

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "totalReturn": 0,
    "portfolioValue": 100000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

**400 Bad Request** - Validation Error:
```json
{
  "success": false,
  "error": "Username must be 3-20 characters (letters, numbers, underscore only)"
}
```

**409 Conflict** - Duplicate Email/Username:
```json
{
  "success": false,
  "error": "Email already exists"
}
```

---

### POST `/api/auth/login`

Kullanıcı girişi (email/password).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "totalReturn": 5420.75,
    "portfolioValue": 105420.75,
    "rank": 42
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### POST `/api/auth/oauth`

OAuth girişi (Google/Apple Sign-In).

**Request Body:**
```json
{
  "provider": "google",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4ZDk...",
  "username": "johndoe"
}
```

**Supported Providers:**
- `google` - Google Sign-In
- `apple` - Apple Sign-In

**Response (200 OK) - Existing User:**
```json
{
  "success": true,
  "message": "OAuth login successful",
  "isNewUser": false,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "username": "johndoe",
    "totalReturn": 2340.50,
    "portfolioValue": 102340.50,
    "rank": 128,
    "profilePicture": "https://lh3.googleusercontent.com/a/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (201 Created) - New User:**
```json
{
  "success": true,
  "message": "OAuth account created successfully",
  "isNewUser": true,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@gmail.com",
    "username": "newuser_a8f3",
    "totalReturn": 0,
    "portfolioValue": 100000,
    "profilePicture": "https://lh3.googleusercontent.com/a/..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "provider and idToken are required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid Google token",
  "message": "Token verification failed: Invalid signature"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": "Email already registered",
  "message": "This email is already associated with another account. Please login with your password or use a different OAuth provider."
}
```

---

### GET `/api/auth/profile`

Kullanıcı profili (JWT token gerektirir).

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "totalReturn": 5420.75,
    "portfolioValue": 105420.75,
    "rank": 42,
    "lastSyncAt": "2025-11-03T09:15:23.000Z",
    "createdAt": "2025-10-15T08:30:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "No token provided"
}
```

---

## Leaderboard Endpoints

### GET `/api/leaderboard`

Global leaderboard ve kullanıcı pozisyonu.

**Query Parameters:**
- `userId` (optional): Kullanıcı ID'si (profil bilgisi için)
- `limit` (optional): Top N kullanıcı (default: 10, max: 100)

**Request:**
```http
GET /api/leaderboard?userId=550e8400-e29b-41d4-a716-446655440000&limit=10
x-api-key: ios_app_key_12345
```

**Response (200 OK):**
```json
{
  "success": true,
  "topUsers": [
    {
      "rank": 1,
      "username": "StockMaster",
      "totalReturn": 25430.50,
      "portfolioValue": 125430.50
    },
    {
      "rank": 2,
      "username": "TradingPro",
      "totalReturn": 18920.25,
      "portfolioValue": 118920.25
    }
  ],
  "currentUser": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "totalReturn": 5420.75,
    "portfolioValue": 105420.75,
    "rank": 42,
    "percentile": 85
  },
  "totalUsers": 1523
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| rank | number | Kullanıcı sıralaması (1 = birinci) |
| username | string | Kullanıcı adı |
| totalReturn | number | Toplam kazanç/kayıp (USD) |
| portfolioValue | number | Toplam portföy değeri (USD) |
| percentile | number | Kullanıcının yüzdelik dilimi (0-100) |

---

### POST `/api/leaderboard/update`

Kullanıcı istatistiklerini güncelle (JWT token gerektirir).

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "totalReturn": 6250.80,
  "portfolioValue": 106250.80
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Stats updated successfully",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "totalReturn": 6250.80,
    "portfolioValue": 106250.80,
    "rank": 38,
    "rankChange": 4,
    "percentile": 87
  }
}
```

**Response Fields:**
- `rankChange`: Sıralama değişimi (pozitif = yukarı çıktı, negatif = düştü)

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "userId, totalReturn, and portfolioValue are required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "You can only update your own stats"
}
```

---

### GET `/api/leaderboard/stats/:userId`

Detaylı kullanıcı istatistikleri ve yakındaki kullanıcılar.

**Parameters:**
- `userId` (required): Kullanıcı UUID

**Query Parameters:**
- `contextSize` (optional): Üst/alt kaç kullanıcı gösterilecek (default: 2)

**Request:**
```http
GET /api/leaderboard/stats/550e8400-e29b-41d4-a716-446655440000?contextSize=3
x-api-key: ios_app_key_12345
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "totalReturn": 5420.75,
    "portfolioValue": 105420.75,
    "rank": 42
  },
  "nearbyUsers": [
    { "rank": 39, "username": "trader1", "totalReturn": 6100.00 },
    { "rank": 40, "username": "trader2", "totalReturn": 5950.50 },
    { "rank": 41, "username": "trader3", "totalReturn": 5680.25 },
    { "rank": 42, "username": "johndoe", "totalReturn": 5420.75 },
    { "rank": 43, "username": "trader4", "totalReturn": 5210.00 },
    { "rank": 44, "username": "trader5", "totalReturn": 4980.50 },
    { "rank": 45, "username": "trader6", "totalReturn": 4750.25 }
  ],
  "totalUsers": 1523
}
```

---

### POST `/api/leaderboard/refresh-ranks`

Tüm kullanıcı sıralamalarını yeniden hesapla (Admin endpoint).

**Headers:**
```http
x-api-key: admin_key_xyz
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ranks refreshed successfully",
  "totalUsers": 1523,
  "timestamp": "2025-11-03T10:45:00.000Z"
}
```

**Note:** Bu endpoint yoğun database operasyonu yapar, sadece gerektiğinde çağrılmalıdır.

---

## Admin Endpoints

### GET `/admin/cache/stats`

Cache istatistikleri ve sistem durumu.

**Request:**
```http
GET /admin/cache/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "cache": {
    "nasdaq": {
      "count": 2000,
      "lastUpdated": "2025-11-03T10:25:00.000Z",
      "nextUpdate": "2025-11-03T10:26:00.000Z",
      "topStocks": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
    }
  },
  "system": {
    "uptime": 3654.23,
    "memory": {
      "used": 125.5,
      "total": 512,
      "percentage": 24.5
    }
  }
}
```

---

### POST `/admin/cache/refresh`

Cache'i manuel olarak yenile.

**Request Body:**
```json
{
  "type": "nasdaq"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "NASDAQ cache refreshed",
  "stocksUpdated": 2000,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

---

## Hata Kodları

| HTTP Code | Error Type | Description | Çözüm |
|-----------|-----------|-------------|-------|
| 400 | Bad Request | Eksik/hatalı parametreler | Request body/params kontrol et |
| 401 | Unauthorized | Authentication başarısız | API key veya JWT token kontrol et |
| 403 | Forbidden | Yetki yok | Doğru token/permissions kullanıldığından emin ol |
| 404 | Not Found | Kaynak bulunamadı | URL ve resource ID kontrol et |
| 409 | Conflict | Duplicate kayıt (email/username) | Farklı değer kullan |
| 429 | Too Many Requests | Rate limit aşıldı | Bekle ve tekrar dene |
| 500 | Internal Server Error | Sunucu hatası | Log kontrol et, tekrar dene |
| 503 | Service Unavailable | Servis kapalı | Server durumunu kontrol et |

### Hata Response Formatı

Tüm hata response'ları aynı formatta döner:

```json
{
  "success": false,
  "error": "Kısa hata açıklaması",
  "message": "Detaylı hata mesajı (opsiyonel)"
}
```

---

## Rate Limiting

Şu anda rate limiting aktif değil, ancak production'da şu limitler uygulanacak:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 dakika |
| Stock Data | 100 requests | 1 dakika |
| Leaderboard | 30 requests | 1 dakika |
| Admin | 10 requests | 1 dakika |

---

## Best Practices

### 1. Authentication

**DO:**
- API key'i environment variable'da sakla
- JWT token'ı güvenli storage'da tut (iOS Keychain)
- Token expiration kontrolü yap

**DON'T:**
- API key'i hard-code etme
- JWT token'ı UserDefaults'ta plain text sakla

### 2. Caching

Stock verileri 1 dakikada bir güncelleniyor. iOS tarafında:

**DO:**
- Stock listesini local cache'le (1 dakika TTL)
- Offline durumunda cached data göster

**DON'T:**
- Her ekran açılışında API'ye istek atma
- 2000 stock'u tek seferde yükleme (limit parametresi kullan)

### 3. Leaderboard Updates

**DO:**
- Sadece anlamlı değişimlerde güncelle (örn: %1'den fazla değişim)
- Background'da batch update yap

**DON'T:**
- Her trade sonrası güncelleme yapma

---

## Versiyonlama

Backend semantic versioning kullanır:

```
v5.0.0 - Current (OAuth support, PostgreSQL)
v4.0.0 - Stock data service (2000 NASDAQ)
v3.0.0 - Authentication system
```

---

**Son Güncelleme:** 2025-11-03
**Versiyon:** 5.0.0
**Durum:** Production Ready (PostgreSQL gerektirir)
