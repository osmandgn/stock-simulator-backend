require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const cacheService = require('./services/cacheService');
const nasdaqCrawler = require('./services/nasdaqCrawlerService');
const db = require('./services/databaseService');
const { authenticateApiKey } = require('./middleware/authMiddleware');

// Routes
const authRoutes = require('./routes/auth');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Apply API key authentication to stock and leaderboard routes
app.use('/api/stocks', authenticateApiKey);
app.use('/api/leaderboard', authenticateApiKey, leaderboardRoutes);
app.use('/api/admin', authenticateApiKey);

// ============================================
// SCHEDULED JOBS (Background Data Refresh)
// ============================================

// Refresh NASDAQ stock list every 1 minute (2000 stocks from stockanalysis.com)
cron.schedule('*/1 * * * *', async () => {
  console.log('⏰ Cron: Refreshing NASDAQ stock list...');
  await nasdaqCrawler.refreshNasdaqStocks();
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
      source: 'NASDAQ (2000 stocks)'
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
    const { limit = 2000 } = req.query;
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
      '✅ 2000 NASDAQ stocks (real-time)',
      '✅ In-memory caching (1 min TTL)',
      '✅ Auto-refresh every 1 minute',
      '✅ No rate limits (web scraping)',
      '✅ No API keys required',
      '✅ Market cap, price, revenue data'
    ],
    endpoints: {
      health: 'GET /health',
      stocks: {
        popular: 'GET /api/stocks/popular?limit=2000',
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
  console.log('🚀 Stock Simulator Backend v5.0 - Production Ready');
  console.log(`📊 Data Source: stockanalysis.com (NASDAQ)`);
  console.log(`💾 Database: PostgreSQL`);
  console.log(`\n🔧 Configuration:`);
  console.log(`   Port: ${PORT}`);
  console.log(`   DB Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`   Cache TTL: NASDAQ=1min`);
  console.log(`   Cron Jobs: NASDAQ refresh every 1min`);

  // Test database connection
  console.log(`\n🔌 Testing database connection...`);
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed! Server may not work properly.');
  }

  // Initial data load
  console.log(`\n📥 Loading initial data...`);
  console.log(`🕷️  Crawling NASDAQ stock list (2000 stocks)...`);
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

  console.log(`\n📍 Main Endpoints:`);
  console.log(`   Auth:`);
  console.log(`     Register: POST   http://localhost:${PORT}/api/auth/register`);
  console.log(`     Login:    POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`     Profile:  GET    http://localhost:${PORT}/api/auth/profile`);
  console.log(`   Stocks:`);
  console.log(`     Popular:  GET    http://localhost:${PORT}/api/stocks/popular?limit=50`);
  console.log(`     Quote:    GET    http://localhost:${PORT}/api/stocks/quote/AAPL`);
  console.log(`     Search:   GET    http://localhost:${PORT}/api/stocks/search?q=apple`);
  console.log(`   Leaderboard:`);
  console.log(`     Get:      GET    http://localhost:${PORT}/api/leaderboard?userId=xxx`);
  console.log(`     Update:   POST   http://localhost:${PORT}/api/leaderboard/update`);
  console.log(`     Stats:    GET    http://localhost:${PORT}/api/leaderboard/stats/:userId`);

  console.log(`\n✨ Ready to accept requests!\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await db.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await db.shutdown();
  process.exit(0);
});
