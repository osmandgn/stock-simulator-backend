const axios = require('axios');
const cacheService = require('./cacheService');

const NASDAQ_LIST_URL = 'https://stockanalysis.com/list/nasdaq-stocks/';

class NasdaqCrawlerService {
  // Fetch and parse NASDAQ stock list from stockanalysis.com
  async fetchNasdaqStocks() {
    try {
      console.log('🕷️  Crawling NASDAQ stock list from stockanalysis.com...');

      // Fetch the page
      const response = await axios.get(NASDAQ_LIST_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      const html = response.data;

      // Extract JavaScript array from the page source
      // The data is embedded in a script tag like: stockData: [{no:1, s:"NVDA", ...}]
      const dataMatch = html.match(/stockData:\s*(\[[\s\S]*?\])\s*[,}]/);

      if (!dataMatch) {
        console.error('❌ Failed to extract stock data from page');
        return [];
      }

      // Use Function constructor to safely evaluate the JavaScript array
      // This is safer than eval() and handles JavaScript object notation properly
      const stockData = new Function(`return ${dataMatch[1]}`)();

      // Transform to our format (first 500 stocks)
      const stocks = stockData.slice(0, 500).map(stock => ({
        symbol: stock.s,
        companyName: stock.n,
        marketCap: stock.marketCap || 0,
        price: stock.price || 0,
        change: stock.change || 0,
        percentChange: stock.changesPercentage || 0,
        revenue: stock.revenue || 0
      }));

      console.log(`✅ Successfully crawled ${stocks.length} NASDAQ stocks`);
      console.log(`   Top 5: ${stocks.slice(0, 5).map(s => s.symbol).join(', ')}`);

      return stocks;
    } catch (error) {
      console.error('❌ NASDAQ Crawler Error:', error.message);
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
