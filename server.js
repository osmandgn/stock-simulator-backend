require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const cacheService = require('./services/cacheService');
const nasdaqCrawler = require('./services/nasdaqCrawlerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory leaderboard
let leaderboard = [
  { userId: '1', username: 'OsmanD', totalReturn: 12450.50, rank: 1 },
  { userId: '2', username: 'TechTrader', totalReturn: 9800.25, rank: 2 },
  { userId: '3', username: 'StockMaster', totalReturn: 7500.00, rank: 3 },
  { userId: '4', username: 'InvestorPro', totalReturn: 5200.75, rank: 4 },
  { userId: '5', username: 'BullRunner', totalReturn: 3100.50, rank: 5 }
];

// ============================================
// SCHEDULED JOBS (Background Data Refresh)
// ============================================

// Refresh NASDAQ stock list every 3 minutes (500 stocks from stockanalysis.com)
cron.schedule('*/3 * * * *', async () => {
  console.log('⏰ Cron: Refreshing NASDAQ stock list...');
  await nasdaqCrawler.refreshNasdaqStocks();
});

// Cache stats logging every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('⏰ Cron: Cache cleanup check');
  const stats = cacheService.getStats();
  console.log('📊 Cache stats:', {
    nasdaq: stats.nasdaq.count,
    totalStocks: stats.nasdaq.count
  });
});

// ============================================
// STOCK ENDPOINTS
// ============================================

// Get stock quote (current price)
app.get('/api/stocks/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const allStocks = await nasdaqCrawler.getNasdaqStocks();
    const stock = allStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }

    res.json({
      success: true,
      symbol: stock.symbol,
      currentPrice: stock.price,
      change: stock.change,
      percentChange: stock.percentChange,
      companyName: stock.companyName,
      marketCap: stock.marketCap,
      revenue: stock.revenue,
      source: 'NASDAQ'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock quote',
      message: error.message
    });
  }
});

// Get company profile
app.get('/api/stocks/profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const allStocks = await nasdaqCrawler.getNasdaqStocks();
    const stock = allStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found'
      });
    }

    res.json({
      success: true,
      symbol: stock.symbol,
      companyName: stock.companyName,
      marketCap: stock.marketCap,
      revenue: stock.revenue,
      currentPrice: stock.price,
      change: stock.change,
      percentChange: stock.percentChange,
      source: 'NASDAQ'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile',
      message: error.message
    });
  }
});

// Search stocks (searches NASDAQ list)
app.get('/api/stocks/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const allStocks = await nasdaqCrawler.getNasdaqStocks();
    const query = q.toLowerCase();

    // Search by symbol or company name
    const results = allStocks
      .filter(stock =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.companyName.toLowerCase().includes(query)
      )
      .slice(0, 20) // Limit to 20 results
      .map(stock => ({
        symbol: stock.symbol,
        displaySymbol: stock.symbol,
        description: stock.companyName,
        type: 'Common Stock',
        price: stock.price,
        change: stock.change
      }));

    res.json({
      success: true,
      count: results.length,
      results,
      source: 'NASDAQ (500 stocks)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search stocks',
      message: error.message
    });
  }
});

// Get popular stocks from NASDAQ list (CACHED)
app.get('/api/stocks/popular', async (req, res) => {
  try {
    const { limit = 500 } = req.query;
    const stocks = await nasdaqCrawler.getPopularStocks(parseInt(limit));

    res.json({
      success: true,
      count: stocks.length,
      stocks,
      cached: cacheService.getNasdaqStocks() !== undefined,
      source: 'NASDAQ (stockanalysis.com)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular stocks',
      message: error.message
    });
  }
});

// Get trending stocks (top 10 by market cap from NASDAQ)
app.get('/api/stocks/trending', async (req, res) => {
  try {
    const topStocks = await nasdaqCrawler.getPopularStocks(10);

    res.json({
      success: true,
      count: topStocks.length,
      stocks: topStocks,
      source: 'NASDAQ Top 10'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending stocks',
      message: error.message
    });
  }
});

// Get multiple stock quotes (batch)
app.post('/api/stocks/batch-quotes', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Body must contain "symbols" array'
      });
    }

    const allStocks = await nasdaqCrawler.getNasdaqStocks();
    const quotes = symbols
      .map(symbol => {
        const stock = allStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
        if (!stock) return null;

        return {
          symbol: stock.symbol,
          currentPrice: stock.price,
          change: stock.change,
          percentChange: stock.percentChange
        };
      })
      .filter(q => q !== null);

    res.json({
      success: true,
      count: quotes.length,
      quotes,
      source: 'NASDAQ'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch quotes',
      message: error.message
    });
  }
});

// Get multiple stock profiles (batch)
app.post('/api/stocks/batch-profiles', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Body must contain "symbols" array'
      });
    }

    const allStocks = await nasdaqCrawler.getNasdaqStocks();
    const stocks = symbols
      .map(symbol => {
        const stock = allStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
        if (!stock) return null;

        return {
          symbol: stock.symbol,
          companyName: stock.companyName,
          marketCap: stock.marketCap,
          revenue: stock.revenue,
          currentPrice: stock.price,
          change: stock.change,
          percentChange: stock.percentChange
        };
      })
      .filter(s => s !== null);

    res.json({
      success: true,
      count: stocks.length,
      stocks,
      source: 'NASDAQ'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch profiles',
      message: error.message
    });
  }
});

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Sort by total return
    const sorted = [...leaderboard].sort((a, b) => b.totalReturn - a.totalReturn);

    // Update ranks
    sorted.forEach((user, index) => {
      user.rank = index + 1;
    });

    res.json({
      success: true,
      count: sorted.length,
      leaderboard: sorted.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

// Update user stats
app.post('/api/leaderboard/update', (req, res) => {
  try {
    const { userId, username, totalReturn } = req.body;

    if (!userId || !username || totalReturn === undefined) {
      return res.status(400).json({
        success: false,
        error: 'userId, username, and totalReturn are required'
      });
    }

    // Find existing user
    const existingIndex = leaderboard.findIndex(u => u.userId === userId);

    if (existingIndex !== -1) {
      // Update existing user
      leaderboard[existingIndex].username = username;
      leaderboard[existingIndex].totalReturn = totalReturn;
    } else {
      // Add new user
      leaderboard.push({
        userId,
        username,
        totalReturn,
        rank: 0
      });
    }

    // Sort and update ranks
    leaderboard.sort((a, b) => b.totalReturn - a.totalReturn);
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    const userRank = leaderboard.find(u => u.userId === userId);

    res.json({
      success: true,
      message: 'Leaderboard updated',
      user: userRank
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update leaderboard',
      message: error.message
    });
  }
});

// Get user stats
app.get('/api/leaderboard/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = leaderboard.find(u => u.userId === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
      message: error.message
    });
  }
});

// ============================================
// ADMIN / MONITORING ENDPOINTS
// ============================================

// Get cache statistics
app.get('/api/admin/cache/stats', (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache stats'
    });
  }
});

// Clear all cache (admin only - should be protected in production)
app.post('/api/admin/cache/clear', (req, res) => {
  try {
    cacheService.clearAll();
    res.json({
      success: true,
      message: 'All caches cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Force refresh NASDAQ stock list
app.post('/api/admin/refresh/nasdaq', async (req, res) => {
  try {
    await nasdaqCrawler.refreshNasdaqStocks();
    const stats = cacheService.getStats();
    res.json({
      success: true,
      message: `NASDAQ stock list refreshed (${stats.nasdaq.count} stocks)`,
      count: stats.nasdaq.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh NASDAQ stocks'
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  const stats = cacheService.getStats();
  res.json({
    success: true,
    message: 'Stock Simulator Backend v4.0 - NASDAQ Only',
    timestamp: new Date().toISOString(),
    dataSource: 'stockanalysis.com (NASDAQ)',
    cache: {
      nasdaqStocks: stats.nasdaq.count,
      cached: stats.nasdaq.cached
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Stock Simulator API v4.0 - NASDAQ Only Edition',
    version: '4.0.0',
    dataSource: 'stockanalysis.com (NASDAQ)',
    features: [
      '✅ 500 NASDAQ stocks (real-time)',
      '✅ In-memory caching (3 min TTL)',
      '✅ Auto-refresh every 3 minutes',
      '✅ No rate limits (web scraping)',
      '✅ No API keys required',
      '✅ Market cap, price, revenue data'
    ],
    endpoints: {
      health: 'GET /health',
      stocks: {
        popular: 'GET /api/stocks/popular?limit=500',
        trending: 'GET /api/stocks/trending (Top 10)',
        quote: 'GET /api/stocks/quote/:symbol',
        profile: 'GET /api/stocks/profile/:symbol',
        search: 'GET /api/stocks/search?q=query',
        batchQuotes: 'POST /api/stocks/batch-quotes',
        batchProfiles: 'POST /api/stocks/batch-profiles'
      },
      leaderboard: {
        getAll: 'GET /api/leaderboard',
        update: 'POST /api/leaderboard/update',
        getUser: 'GET /api/leaderboard/user/:userId'
      },
      admin: {
        cacheStats: 'GET /api/admin/cache/stats',
        clearCache: 'POST /api/admin/cache/clear',
        refreshNasdaq: 'POST /api/admin/refresh/nasdaq'
      }
    }
  });
});

// ============================================
// STARTUP
// ============================================

app.listen(PORT, async () => {
  console.log('🚀 Stock Simulator Backend v4.0 - NASDAQ Only Edition');
  console.log(`📊 Data Source: stockanalysis.com (NASDAQ)`);
  console.log(`\n🔧 Configuration:`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Cache TTL: NASDAQ=3min`);
  console.log(`   Cron Jobs: NASDAQ refresh every 3min`);
  console.log(`   API Keys: None required! 🎉`);

  // Initial data load
  console.log(`\n📥 Loading initial data...`);
  console.log(`🕷️  Crawling NASDAQ stock list (500 stocks)...`);
  console.log(`💡 This takes ~2-3 seconds via web scraping!\n`);

  try {
    // Load NASDAQ list from stockanalysis.com
    await nasdaqCrawler.refreshNasdaqStocks();

    console.log('\n✅ Initial data loaded successfully');

    const stats = cacheService.getStats();
    console.log(`📊 Cache status: ${stats.nasdaq.count} NASDAQ stocks loaded`);
  } catch (error) {
    console.error('❌ Failed to load initial data:', error.message);
  }

  console.log(`\n📍 Endpoints:`);
  console.log(`   Health:   http://localhost:${PORT}/health`);
  console.log(`   Popular:  http://localhost:${PORT}/api/stocks/popular?limit=50`);
  console.log(`   All:      http://localhost:${PORT}/api/stocks/popular?limit=500`);
  console.log(`   Trending: http://localhost:${PORT}/api/stocks/trending`);
  console.log(`   Quote:    http://localhost:${PORT}/api/stocks/quote/AAPL`);
  console.log(`   Search:   http://localhost:${PORT}/api/stocks/search?q=apple`);
  console.log(`   Board:    http://localhost:${PORT}/api/leaderboard`);
  console.log(`   Stats:    http://localhost:${PORT}/api/admin/cache/stats`);

  console.log(`\n✨ Ready to accept requests!\n`);
});
