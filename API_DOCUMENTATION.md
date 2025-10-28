# Stock Simulator API - Servis Dökümantasyonu

**Versiyon:** 4.0.0
**Veri Kaynağı:** stockanalysis.com (NASDAQ)
**Base URL:** `http://46.36.201.101`

---

## 📊 Genel Bilgiler

Bu API, iOS Stock Simulator uygulaması için backend servisi sağlar. 500 NASDAQ hissesini gerçek zamanlı olarak web scraping ile toplar ve cache'ler.

**Özellikler:**
- ✅ 500 NASDAQ hissesi (gerçek zamanlı)
- ✅ In-memory caching (3 dakika TTL)
- ✅ Otomatik veri yenileme (her 3 dakika)
- ✅ Rate limit yok
- ✅ API key gerekmez

---

## 🏥 Health & Info

### GET `/health`
Servisin sağlık durumunu ve cache istatistiklerini döndürür.

**Yanıt:**
```json
{
  "success": true,
  "message": "Stock Simulator Backend v4.0 - NASDAQ Only",
  "timestamp": "2025-10-28T12:00:00.000Z",
  "dataSource": "stockanalysis.com (NASDAQ)",
  "cache": {
    "nasdaqStocks": 500,
    "cached": true
  }
}
```

---

### GET `/`
API versiyonu, özellikler ve tüm endpoint listesi.

**Yanıt:**
```json
{
  "success": true,
  "message": "Stock Simulator API v4.0 - NASDAQ Only Edition",
  "version": "4.0.0",
  "dataSource": "stockanalysis.com (NASDAQ)",
  "features": [...],
  "endpoints": {...}
}
```

---

## 📈 Hisse Senedi Endpoints

### GET `/api/stocks/quote/:symbol`
Belirli bir hisse senedinin anlık fiyat bilgilerini getirir.

**Parametreler:**
- `symbol` (path): Hisse sembolü (örn: AAPL, TSLA)

**Örnek İstek:**
```
GET /api/stocks/quote/AAPL
```

**Yanıt:**
```json
{
  "success": true,
  "symbol": "AAPL",
  "currentPrice": 175.43,
  "change": 2.15,
  "percentChange": 1.24,
  "companyName": "Apple Inc.",
  "marketCap": "2.75T",
  "revenue": "394.33B",
  "source": "NASDAQ"
}
```

---

### GET `/api/stocks/profile/:symbol`
Şirket profil bilgilerini getirir.

**Parametreler:**
- `symbol` (path): Hisse sembolü

**Örnek İstek:**
```
GET /api/stocks/profile/TSLA
```

**Yanıt:**
```json
{
  "success": true,
  "symbol": "TSLA",
  "companyName": "Tesla, Inc.",
  "marketCap": "800.5B",
  "revenue": "96.77B",
  "currentPrice": 245.32,
  "change": -3.45,
  "percentChange": -1.39,
  "source": "NASDAQ"
}
```

---

### GET `/api/stocks/search?q={query}`
Hisse sembolü veya şirket adına göre arama yapar.

**Parametreler:**
- `q` (query): Arama terimi

**Örnek İstek:**
```
GET /api/stocks/search?q=apple
```

**Yanıt:**
```json
{
  "success": true,
  "count": 1,
  "results": [
    {
      "symbol": "AAPL",
      "displaySymbol": "AAPL",
      "description": "Apple Inc.",
      "type": "Common Stock",
      "price": 175.43,
      "change": 2.15
    }
  ],
  "source": "NASDAQ (500 stocks)"
}
```

---

### GET `/api/stocks/popular?limit={limit}`
Popüler hisse senetlerini market cap'e göre sıralı getirir.

**Parametreler:**
- `limit` (query, optional): Döndürülecek hisse sayısı (varsayılan: 500)

**Örnek İstek:**
```
GET /api/stocks/popular?limit=10
```

**Yanıt:**
```json
{
  "success": true,
  "count": 10,
  "stocks": [...],
  "cached": true,
  "source": "NASDAQ (stockanalysis.com)"
}
```

---

### GET `/api/stocks/trending`
En popüler 10 hisseyi döndürür (market cap'e göre).

**Örnek İstek:**
```
GET /api/stocks/trending
```

**Yanıt:**
```json
{
  "success": true,
  "count": 10,
  "stocks": [...],
  "source": "NASDAQ Top 10"
}
```

---

### POST `/api/stocks/batch-quotes`
Birden fazla hisse için fiyat bilgilerini toplu olarak getirir.

**Body:**
```json
{
  "symbols": ["AAPL", "TSLA", "MSFT"]
}
```

**Yanıt:**
```json
{
  "success": true,
  "count": 3,
  "quotes": [
    {
      "symbol": "AAPL",
      "currentPrice": 175.43,
      "change": 2.15,
      "percentChange": 1.24
    },
    ...
  ],
  "source": "NASDAQ"
}
```

---

### POST `/api/stocks/batch-profiles`
Birden fazla hisse için profil bilgilerini toplu olarak getirir.

**Body:**
```json
{
  "symbols": ["AAPL", "TSLA", "MSFT"]
}
```

**Yanıt:**
```json
{
  "success": true,
  "count": 3,
  "stocks": [
    {
      "symbol": "AAPL",
      "companyName": "Apple Inc.",
      "marketCap": "2.75T",
      "revenue": "394.33B",
      "currentPrice": 175.43,
      "change": 2.15,
      "percentChange": 1.24
    },
    ...
  ],
  "source": "NASDAQ"
}
```

---

## 🏆 Leaderboard Endpoints

### GET `/api/leaderboard?limit={limit}`
Kullanıcı sıralamasını toplam kazança göre getirir.

**Parametreler:**
- `limit` (query, optional): Döndürülecek kullanıcı sayısı (varsayılan: 100)

**Örnek İstek:**
```
GET /api/leaderboard?limit=10
```

**Yanıt:**
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

---

### POST `/api/leaderboard/update`
Kullanıcının sıralamadaki istatistiklerini günceller.

**Body:**
```json
{
  "userId": "123",
  "username": "JohnDoe",
  "totalReturn": 5000.75
}
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Leaderboard updated",
  "user": {
    "userId": "123",
    "username": "JohnDoe",
    "totalReturn": 5000.75,
    "rank": 8
  }
}
```

---

### GET `/api/leaderboard/user/:userId`
Belirli bir kullanıcının sıralama bilgilerini getirir.

**Parametreler:**
- `userId` (path): Kullanıcı ID'si

**Örnek İstek:**
```
GET /api/leaderboard/user/123
```

**Yanıt:**
```json
{
  "success": true,
  "user": {
    "userId": "123",
    "username": "JohnDoe",
    "totalReturn": 5000.75,
    "rank": 8
  }
}
```

---

## 🔧 Admin Endpoints

### GET `/api/admin/cache/stats`
Cache istatistiklerini getirir.

**Yanıt:**
```json
{
  "success": true,
  "cache": {
    "nasdaq": {
      "count": 500,
      "cached": true
    }
  }
}
```

---

### POST `/api/admin/cache/clear`
Tüm cache'i temizler.

**Yanıt:**
```json
{
  "success": true,
  "message": "All caches cleared"
}
```

---

### POST `/api/admin/refresh/nasdaq`
NASDAQ hisse listesini zorla yeniler.

**Yanıt:**
```json
{
  "success": true,
  "message": "NASDAQ stock list refreshed (500 stocks)",
  "count": 500
}
```

---

## ⚙️ Teknik Detaylar

### Cache Stratejisi
- **TTL:** 3 dakika
- **Otomatik Yenileme:** Her 3 dakikada bir cron job ile
- **In-Memory:** NodeCache kullanılıyor

### Veri Kaynağı
- **Web Scraping:** stockanalysis.com/stocks/
- **Cheerio:** HTML parsing
- **Axios:** HTTP istekleri

### Cron Jobs
- **NASDAQ Refresh:** Her 3 dakikada (`*/3 * * * *`)
- **Cache Stats:** Her 5 dakikada (`*/5 * * * *`)

---

## 🚨 Hata Yanıtları

Tüm endpoint'ler hata durumunda şu formatı kullanır:

```json
{
  "success": false,
  "error": "Hata açıklaması",
  "message": "Detaylı hata mesajı"
}
```

**HTTP Durum Kodları:**
- `200` - Başarılı
- `400` - Geçersiz istek
- `404` - Kaynak bulunamadı
- `500` - Sunucu hatası

---

## 📝 Notlar

- API key gerekmez
- Rate limit yoktur
- CORS aktif (tüm origin'lere açık)
- Tüm yanıtlar JSON formatındadır
- Leaderboard verileri in-memory, restart'ta sıfırlanır

---

**Son Güncelleme:** 2025-10-28
**Maintainer:** OsmanD
