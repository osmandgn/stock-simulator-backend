const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalJWT } = require('../middleware/jwtMiddleware');

// Get leaderboard (userId can come from query param or JWT)
router.get('/', optionalJWT, leaderboardController.getLeaderboard);

// Update user stats
router.post('/update', leaderboardController.updateStats);

// Get user detailed stats
router.get('/stats/:userId', leaderboardController.getUserStats);

module.exports = router;
