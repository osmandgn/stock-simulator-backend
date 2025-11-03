const User = require('../models/User');

// Get leaderboard with user's rank
const getLeaderboard = async (req, res) => {
  try {
    const userId = req.query.userId || req.userId; // From query param or JWT
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Get top users
    const topUsers = await User.getLeaderboard(limit);

    // Get current user's rank and stats
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get total user count
    const totalUsers = await User.getTotalUserCount();

    // Calculate percentile
    const percentile = currentUser.rank
      ? Math.round((1 - (currentUser.rank / totalUsers)) * 100)
      : 0;

    res.json({
      success: true,
      topUsers: topUsers.map(u => ({
        rank: u.rank,
        username: u.username,
        totalReturn: parseFloat(u.total_return)
      })),
      currentUser: {
        userId: currentUser.id,
        username: currentUser.username,
        totalReturn: parseFloat(currentUser.total_return),
        portfolioValue: parseFloat(currentUser.portfolio_value),
        rank: currentUser.rank || null,
        percentile
      },
      totalUsers
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
};

// Update user's stats and recalculate ranks
const updateStats = async (req, res) => {
  try {
    const { userId, totalReturn, portfolioValue } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    if (totalReturn === undefined || portfolioValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'totalReturn and portfolioValue are required'
      });
    }

    // Get user's previous rank
    const previousUser = await User.findById(userId);
    const previousRank = previousUser?.rank;

    // Update user stats
    const updatedUser = await User.updateStats(userId, totalReturn, portfolioValue);

    // Recalculate all ranks
    await User.updateRanks();

    // Get updated user with new rank
    const userWithNewRank = await User.findById(userId);

    // Calculate rank change
    const rankChange = previousRank && userWithNewRank.rank
      ? previousRank - userWithNewRank.rank
      : 0;

    res.json({
      success: true,
      message: 'Stats updated successfully',
      user: {
        userId: userWithNewRank.id,
        username: userWithNewRank.username,
        totalReturn: parseFloat(userWithNewRank.total_return),
        portfolioValue: parseFloat(userWithNewRank.portfolio_value),
        rank: userWithNewRank.rank,
        previousRank,
        rankChange
      }
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stats',
      message: error.message
    });
  }
};

// Get user's detailed stats with nearby users
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const contextSize = parseInt(req.query.context) || 2;

    const result = await User.getUserRankWithContext(userId, contextSize);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'User not found or not ranked yet'
      });
    }

    const { user, nearbyUsers, totalUsers } = result;

    // Calculate percentile
    const percentile = user.rank
      ? Math.round((1 - (user.rank / totalUsers)) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        rank: user.rank,
        totalReturn: parseFloat(user.total_return),
        portfolioValue: parseFloat(user.portfolio_value),
        percentile,
        totalUsers,
        nearbyUsers: nearbyUsers.map(u => ({
          rank: u.rank,
          username: u.username,
          totalReturn: parseFloat(u.total_return),
          isCurrentUser: u.id === userId
        }))
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
      message: error.message
    });
  }
};

module.exports = {
  getLeaderboard,
  updateStats,
  getUserStats
};
