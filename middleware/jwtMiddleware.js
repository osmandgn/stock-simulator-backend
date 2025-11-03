const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  // Get token from headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid JWT token in Authorization header'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.username = decoded.username;

    console.log(`✅ JWT authenticated: ${decoded.username} (${decoded.userId})`);
    next();
  } catch (error) {
    console.warn(`🚫 Invalid JWT token: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'The provided token is invalid or malformed.'
    });
  }
};

// Optional JWT middleware (doesn't fail if no token)
const optionalJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.username = decoded.username;
    } catch (error) {
      // Silently ignore invalid tokens
      console.warn(`⚠️  Optional JWT token invalid: ${error.message}`);
    }
  }

  next();
};

module.exports = {
  authenticateJWT,
  optionalJWT
};
