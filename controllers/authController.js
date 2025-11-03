const jwt = require('jsonwebtoken');
const User = require('../models/User');
const oauthService = require('../services/oauthService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '30d'; // Token expires in 30 days

// Generate JWT token
const generateToken = (userId, email, username) => {
  return jwt.sign(
    { userId, email, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Username validation (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be 3-20 characters (letters, numbers, underscore only)'
      });
    }

    // Password validation (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Create user
    const user = await User.create(email, username, password);

    // Generate token
    const token = generateToken(user.id, user.email, user.username);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.id,
        email: user.email,
        username: user.username,
        totalReturn: user.total_return,
        portfolioValue: user.portfolio_value
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'Email already exists' || error.message === 'Username already taken') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.username);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.id,
        email: user.email,
        username: user.username,
        totalReturn: user.total_return,
        portfolioValue: user.portfolio_value,
        rank: user.rank
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    // User ID comes from JWT middleware (we'll add this later)
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        username: user.username,
        totalReturn: user.total_return,
        portfolioValue: user.portfolio_value,
        rank: user.rank,
        lastSyncAt: user.last_sync_at,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: error.message
    });
  }
};

// OAuth Login (Google/Apple)
const oauthLogin = async (req, res) => {
  try {
    const { provider, idToken, username } = req.body;

    // Validation
    if (!provider || !idToken) {
      return res.status(400).json({
        success: false,
        error: 'provider and idToken are required'
      });
    }

    // Verify OAuth token
    const verification = await oauthService.verifyOAuthToken(provider, idToken);

    if (!verification.success) {
      return res.status(401).json({
        success: false,
        error: verification.error,
        message: verification.message
      });
    }

    const { providerId, email, name, picture } = verification;

    // Check if user already exists with this OAuth account
    let user = await User.findByOAuth(provider, providerId);

    if (user) {
      // User exists, login
      const token = generateToken(user.id, user.email, user.username);

      return res.json({
        success: true,
        message: 'OAuth login successful',
        isNewUser: false,
        user: {
          userId: user.id,
          email: user.email,
          username: user.username,
          totalReturn: user.total_return,
          portfolioValue: user.portfolio_value,
          rank: user.rank,
          profilePicture: user.profile_picture_url
        },
        token
      });
    }

    // User doesn't exist, check if email is already used
    const existingEmailUser = await User.findByEmail(email);
    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        message: 'This email is already associated with another account. Please login with your password or use a different OAuth provider.'
      });
    }

    // Generate username if not provided
    let finalUsername = username || oauthService.generateUsername(email, providerId);

    // Ensure username is unique
    let usernameExists = await User.findByEmail(finalUsername);
    let attempts = 0;
    while (usernameExists && attempts < 5) {
      finalUsername = oauthService.generateUsername(email, providerId);
      usernameExists = await User.findByEmail(finalUsername);
      attempts++;
    }

    // Create new OAuth user
    user = await User.createOAuthUser(email, finalUsername, provider, providerId, picture);

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.username);

    res.status(201).json({
      success: true,
      message: 'OAuth account created successfully',
      isNewUser: true,
      user: {
        userId: user.id,
        email: user.email,
        username: user.username,
        totalReturn: user.total_return,
        portfolioValue: user.portfolio_value,
        profilePicture: user.profile_picture_url
      },
      token
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth login failed',
      message: error.message
    });
  }
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  register,
  login,
  getProfile,
  oauthLogin,
  verifyToken,
  generateToken
};
