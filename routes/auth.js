const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/jwtMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/oauth', authController.oauthLogin); // Google/Apple Sign In

// Protected routes
router.get('/profile', authenticateJWT, authController.getProfile);

module.exports = router;
