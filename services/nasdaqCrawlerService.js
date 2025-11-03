const axios = require('axios');
const cacheService = require('./cacheService');

const NASDAQ_API_URL = 'https://stockanalysis.com/api/screener/s/f';

class NasdaqCrawlerService {
  // Fetch and parse NASDAQ stock list from stockanalysis.com API
  async fetchNasdaqStocks() {
    try {
      console.log('🕷️  Fetching NASDAQ stock list from stockanalysis.com API (2000 stocks, 4 pages)...');

      const allStocks = [];
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://stockanalysis.com/list/nasdaq-stocks/',
      };

      // Fetch 4 pages (500 stocks per page = 2000 total)
      for (let page = 1; page <= 4; page++) {
        console.log(`   Fetching page ${page}/4...`);

        const response = await axios.get(NASDAQ_API_URL, {
          headers,
          params: {
            m: 's',
            s: 'asc',
            c: 's,n,marketCap,price,change,changep,revenue',
            cn: '500',
            p: page.toString(),
            i: 'stocks'
          }
        });

        const data = response.data;

        if (!data.data || !data.data.data) {
          console.error(`❌ Failed to get stock data from page ${page}`);
          continue;
        }

        // Transform to our format
        const pageStocks = data.data.data.map(stock => ({
          symbol: stock.s,
          companyName: stock.n,
          marketCap: stock.marketCap || 0,
          price: stock.price || 0,
          change: stock.change || 0,
          percentChange: stock.changep || 0,
          revenue: stock.revenue || 0
        }));

        allStocks.push(...pageStocks);
        console.log(`   ✓ Page ${page}: ${pageStocks.length} stocks`);
      }

      console.log(`✅ Successfully fetched ${allStocks.length} NASDAQ stocks`);
      console.log(`   Top 5: ${allStocks.slice(0, 5).map(s => s.symbol).join(', ')}`);

      return allStocks;
    } catch (error) {
      console.error('❌ NASDAQ API Error:', error.message);
      return [];
    }
  }

  // Get cached NASDAQ stocks or fetch new
  async getNasdaqStocks() {
    const cached = cacheService.getNasdaqStocks();
    if (cached) {
      console.log('📦 Cache HIT: NASDAQ stocks');
      return cached;
    }

    console.log('🌐 Cache MISS: Fetching NASDAQ stocks');
    const stocks = await this.fetchNasdaqStocks();

    if (stocks.length > 0) {
      cacheService.setNasdaqStocks(stocks);
    }

    return stocks;
  }

  // Background refresh job
  async refreshNasdaqStocks() {
    console.log('🔄 Refreshing NASDAQ stock list in background...');
    try {
      const stocks = await this.fetchNasdaqStocks();

      if (stocks.length > 0) {
        cacheService.setNasdaqStocks(stocks);
        console.log(`✅ NASDAQ stocks refreshed (${stocks.length} stocks)`);
      } else {
        console.log('⚠️  NASDAQ refresh returned no stocks');
      }
    } catch (error) {
      console.error('❌ Failed to refresh NASDAQ stocks:', error.message);
    }
  }

  // Get popular stocks (top N by market cap)
  async getPopularStocks(limit = 30) {
    const allStocks = await this.getNasdaqStocks();

    // Sort by market cap (already sorted from the source, but just in case)
    const sorted = allStocks.sort((a, b) => b.marketCap - a.marketCap);

    // Return top N
    return sorted.slice(0, limit);
  }
}

module.exports = new NasdaqCrawlerService();
