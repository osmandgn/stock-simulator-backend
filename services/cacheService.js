const NodeCache = require('node-cache');

// Cache instance for NASDAQ stock list
const nasdaqCache = new NodeCache({ stdTTL: 60 }); // 1 minute for NASDAQ list

class CacheService {
  // ========== NASDAQ STOCKS CACHE ==========
  getNasdaqStocks() {
    return nasdaqCache.get('nasdaq');
  }

  setNasdaqStocks(data) {
    nasdaqCache.set('nasdaq', data);
  }

  // ========== STATS ==========
  getStats() {
    return {
      nasdaq: {
        cached: nasdaqCache.has('nasdaq'),
        count: nasdaqCache.has('nasdaq') ? nasdaqCache.get('nasdaq').length : 0,
        stats: nasdaqCache.getStats()
      }
    };
  }

  // ========== CLEAR ==========
  clearAll() {
    nasdaqCache.flushAll();
  }
}

module.exports = new CacheService();
