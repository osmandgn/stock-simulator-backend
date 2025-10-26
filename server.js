require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

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

// Helper function to make Finnhub requests
async function finnhubRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        token: FINNHUB_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Finnhub API Error:', error.message);
    throw error;
  }
}

// ============================================
// STOCK ENDPOINTS
// ============================================

// Get stock quote (current price)
app.get('/api/stocks/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await finnhubRequest('/quote', { symbol: symbol.toUpperCase() });

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t
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
    const data = await finnhubRequest('/stock/profile2', { symbol: symbol.toUpperCase() });

    res.json({
      success: true,
      symbol: data.ticker,
      companyName: data.name,
      logo: data.logo,
      country: data.country,
      currency: data.currency,
      exchange: data.exchange,
      industry: data.finnhubIndustry,
      marketCap: data.marketCapitalization,
      shareOutstanding: data.shareOutstanding,
      ipo: data.ipo,
      website: data.weburl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile',
      message: error.message
    });
  }
});

// Search stocks
app.get('/api/stocks/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const data = await finnhubRequest('/search', { q });

    // Filter only common stocks
    const stocks = data.result.filter(item =>
      item.type === 'Common Stock' || item.type === 'ETP'
    ).slice(0, 10); // Limit to 10 results

    res.json({
      success: true,
      count: stocks.length,
      results: stocks.map(stock => ({
        symbol: stock.symbol,
        displaySymbol: stock.displaySymbol,
        description: stock.description,
        type: stock.type
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search stocks',
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

    const promises = symbols.map(symbol =>
      finnhubRequest('/quote', { symbol: symbol.toUpperCase() })
        .then(data => ({
          symbol: symbol.toUpperCase(),
          currentPrice: data.c,
          change: data.d,
          percentChange: data.dp
        }))
        .catch(() => null)
    );

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);

    res.json({
      success: true,
      count: validResults.length,
      quotes: validResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch quotes',
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
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Stock Simulator Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Stock Simulator API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      stocks: {
        quote: 'GET /api/stocks/quote/:symbol',
        profile: 'GET /api/stocks/profile/:symbol',
        search: 'GET /api/stocks/search?q=query',
        batchQuotes: 'POST /api/stocks/batch-quotes'
      },
      leaderboard: {
        getAll: 'GET /api/leaderboard',
        update: 'POST /api/leaderboard/update',
        getUser: 'GET /api/leaderboard/user/:userId'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stock Simulator Backend running on port ${PORT}`);
  console.log(`📊 Finnhub API Key: ${FINNHUB_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Quote:  http://localhost:${PORT}/api/stocks/quote/AAPL`);
  console.log(`   Search: http://localhost:${PORT}/api/stocks/search?q=apple`);
  console.log(`   Board:  http://localhost:${PORT}/api/leaderboard`);
});
