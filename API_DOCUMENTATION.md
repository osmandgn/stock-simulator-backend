# Stock Simulator Backend API Documentation (v5.1)

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Teknik Stack](#teknik-stack)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
   - [1. Stock Prices Endpoint](#1-get-api-stocks-popular)
   - [2. User Stats Endpoint](#2-post-api-user-stats)
   - [3. Leaderboard Endpoint](#3-get-api-leaderboard-top10)
6. [Hata Kodları](#hata-kodları)
7. [Curl Örnekleri](#curl-örnekleri)

---

## Genel Bakış

**Stock Simulator Backend v5.1**, basit bir hisse senedi simülatörü için geliştirilmiş, **3 ana endpoint** ile çalışan Node.js REST API servisidir.

### Ana Özellikler

✅ **2000 NASDAQ hisse senedi verisi** (stockanalysis.com'dan otomatik çekiliyor)
✅ **Kullanıcı performans takibi** (userId, kazanç/kayıp, portföy değeri)
✅ **Global leaderboard sistemi** (Top 10 kullanıcı)
✅ **API Key tabanlı authentication**
✅ **PostgreSQL veritabanı**
✅ **Gerçek zamanlı hisse senedi güncelleme** (1 dakikalık interval)

---

## Hızlı Başlangıç

### Lokalde Çalıştırma

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyasını kontrol et (API_KEYS ayarlı mı?)
cat .env

# 3. Backend'i başlat
npm start
```

**Beklenen çıktı:**
```
🚀 Stock Simulator Backend v5.1 - Simplified Edition
✅ Database connection successful
✅ Initial data loaded successfully
📊 Cache status: 2000 NASDAQ stocks loaded
```

---

## Teknik Stack

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|---------|
| Node.js | 18-alpine | Runtime |
| Express.js | 4.18.2 | Web Framework |
| PostgreSQL | 15+ | Database |
| Docker | 24+ | Containerization |

---

## Authentication

### API Key Authentication

Tüm endpoint'ler **API Key** ile korunmuştur. `.env` dosyasında tanımlanan key'lerden birini kullanmalısınız.

#### `.env` dosyasında:
```env
API_KEYS=sk_live_123456789abcdef,sk_test_dev_key_xyz,ios_app_key_2024
```

#### Kullanılabilecek API Keys:
```
sk_live_123456789abcdef
sk_test_dev_key_xyz
ios_app_key_2024
```

#### Her request'e API Key ekleyin:

**Header metodu (Önerilen):**
```bash
curl -H "x-api-key: sk_live_123456789abcdef" \
  http://localhost:3000/api/stocks/popular
```

---

## API Endpoints

### 1. GET `/api/stocks/popular`

**Hisse senedi fiyatlarını getir** (NASDAQ 2000+ hisse)

#### Request

```bash
curl "http://localhost:3000/api/stocks/popular?limit=50" \
  -H "x-api-key: sk_live_123456789abcdef"
```

**Query Parameters:**
- `limit` (optional): Kaç tane hisse döndürülecek (default: 2000, max: 2000)

#### Response (200 OK)

```json
{
  "success": true,
  "count": 50,
  "stocks": [
    {
      "symbol": "AAPL",
      "companyName": "Apple Inc.",
      "marketCap": 2891000000000,
      "revenue": 394328000000,
      "price": 178.52,
      "change": 2.34,
      "percentChange": 1.33
    }
  ],
  "cached": true,
  "source": "NASDAQ (stockanalysis.com)"
}
```

---

### 2. POST `/api/user-stats`

**Kullanıcı performansını kaydet/güncelle** (userId, totalReturn, portfolioValue)

#### Request

```bash
curl -X POST "http://localhost:3000/api/user-stats" \
  -H "x-api-key: sk_live_123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "totalReturn": 5250.50,
    "portfolioValue": 105250.50
  }'
```

**Request Body:**
| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|---------|
| userId | string | ✅ | Benzersiz kullanıcı kimliği |
| totalReturn | number | ✅ | Toplam kazanç/kayıp (USD) |
| portfolioValue | number | ✅ | Toplam portföy değeri (USD) |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "User stats saved successfully",
  "user": {
    "userId": "user-001",
    "totalReturn": 5250.50,
    "portfolioValue": 105250.50,
    "rank": 3,
    "lastUpdated": "2025-11-16T10:45:23.000Z"
  }
}
```

---

### 3. GET `/api/leaderboard/top10`

**En çok kazanç sağlayan 10 kullanıcıyı getir**

#### Request

```bash
curl "http://localhost:3000/api/leaderboard/top10" \
  -H "x-api-key: sk_live_123456789abcdef"
```

#### Response (200 OK)

```json
{
  "success": true,
  "count": 3,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user-003",
      "username": "user_user-003",
      "totalReturn": 12450.75,
      "portfolioValue": 112450.75
    },
    {
      "rank": 2,
      "userId": "user-002",
      "username": "user_user-002",
      "totalReturn": 8750.25,
      "portfolioValue": 108750.25
    },
    {
      "rank": 3,
      "userId": "user-001",
      "username": "user_user-001",
      "totalReturn": 5250.50,
      "portfolioValue": 105250.50
    }
  ],
  "source": "Stock Simulator Database"
}
```

---

## Hata Kodları

| HTTP | Error Type | Açıklama | Çözüm |
|------|-----------|---------|-------|
| 400 | Bad Request | Eksik/hatalı parametreler | Request body/params kontrol et |
| 401 | Unauthorized | API Key geçersiz/eksik | Doğru API Key'i kullan |
| 500 | Internal Server Error | Sunucu hatası | Logları kontrol et |

---

## Curl Örnekleri

### Lokalde Tüm Testleri Çalıştır

Önce backend'i başlat:
```bash
npm start
```

Yeni bir terminal'de testleri çalıştır:

#### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

#### Test 2: Stock Fiyatlarını Al (5 hisse)
```bash
curl "http://localhost:3000/api/stocks/popular?limit=5" \
  -H "x-api-key: sk_live_123456789abcdef"
```

#### Test 3: User 1 Stats Kaydet
```bash
curl -X POST "http://localhost:3000/api/user-stats" \
  -H "x-api-key: sk_live_123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "totalReturn": 5250.50, "portfolioValue": 105250.50}'
```

#### Test 4: User 2 Stats Kaydet
```bash
curl -X POST "http://localhost:3000/api/user-stats" \
  -H "x-api-key: sk_live_123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-002", "totalReturn": 8750.25, "portfolioValue": 108750.25}'
```

#### Test 5: User 3 Stats Kaydet
```bash
curl -X POST "http://localhost:3000/api/user-stats" \
  -H "x-api-key: sk_live_123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-003", "totalReturn": 12450.75, "portfolioValue": 112450.75}'
```

#### Test 6: Leaderboard'u Gör (Top 10)
```bash
curl "http://localhost:3000/api/leaderboard/top10" \
  -H "x-api-key: sk_live_123456789abcdef"
```

#### Test 7: User 1'i Güncelle (Yeni Skor)
```bash
curl -X POST "http://localhost:3000/api/user-stats" \
  -H "x-api-key: sk_live_123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "totalReturn": 15000.00, "portfolioValue": 115000.00}'
```

#### Test 8: Güncellenmiş Leaderboard
```bash
curl "http://localhost:3000/api/leaderboard/top10" \
  -H "x-api-key: sk_live_123456789abcdef"
```

#### Test 9: Error Test - API Key Olmadan (Başarısız Olmalı)
```bash
curl "http://localhost:3000/api/stocks/popular?limit=5"
```

#### Test 10: Error Test - Yanlış API Key (Başarısız Olmalı)
```bash
curl "http://localhost:3000/api/stocks/popular?limit=5" \
  -H "x-api-key: invalid-key-xyz"
```

---

## Versiyonlama

```
v5.1.0 - Current (Simplified Edition: 3 main endpoints)
v5.0.0 - Full-featured (OAuth, batch endpoints, admin)
```

---

**Son Güncelleme:** 2025-11-16
**Versiyon:** 5.1.0
**Durum:** Production Ready ✅
