const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'stocksimulator',
  user: process.env.DB_USER || 'stockadmin',
  password: process.env.DB_PASSWORD || 'stockpass123',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms`, { text, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Get a client from the pool (for transactions)
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Test connection function
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('🔌 Closing database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
};

module.exports = {
  query,
  getClient,
  testConnection,
  shutdown,
  pool
};
