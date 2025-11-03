// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  // Get API keys from environment (comma-separated)
  const validApiKeys = process.env.API_KEYS
    ? process.env.API_KEYS.split(',').map(key => key.trim())
    : [];

  // If no API keys configured, allow all requests (backward compatibility)
  if (validApiKeys.length === 0) {
    console.warn('⚠️  WARNING: No API keys configured. API is open to public!');
    return next();
  }

  // Check for API key in multiple locations
  const apiKey =
    req.headers['x-api-key'] ||           // Custom header: x-api-key
    req.headers['authorization']?.replace('Bearer ', '') ||  // Bearer token
    req.query.apiKey;                      // Query parameter (less secure)

  // Validate API key
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'API key is missing. Please provide via x-api-key header, Authorization header, or apiKey query parameter.'
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    console.warn(`🚫 Invalid API key attempt: ${apiKey.substring(0, 10)}...`);
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid.'
    });
  }

  // API key is valid, proceed
  console.log(`✅ Authenticated request with key: ${apiKey.substring(0, 10)}...`);
  next();
};

module.exports = { authenticateApiKey };
