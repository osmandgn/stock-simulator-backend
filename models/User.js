const bcrypt = require('bcrypt');
const db = require('../services/databaseService');

class User {
  // Create a new user
  static async create(email, username, password) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      const query = `
        INSERT INTO users (email, username, password_hash, total_return, portfolio_value)
        VALUES ($1, $2, $3, 0, 100000)
        RETURNING id, email, username, total_return, portfolio_value, created_at
      `;

      const result = await db.query(query, [email, username, passwordHash]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        } else if (error.constraint === 'users_username_key') {
          throw new Error('Username already taken');
        }
      }
      throw error;
    }
  }

  // Create OAuth user
  static async createOAuthUser(email, username, oauthProvider, oauthId, profilePictureUrl = null) {
    try {
      const query = `
        INSERT INTO users (email, username, oauth_provider, oauth_id, profile_picture_url, total_return, portfolio_value)
        VALUES ($1, $2, $3, $4, $5, 0, 100000)
        RETURNING id, email, username, oauth_provider, oauth_id, profile_picture_url, total_return, portfolio_value, created_at
      `;

      const result = await db.query(query, [email, username, oauthProvider, oauthId, profilePictureUrl]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        } else if (error.constraint === 'users_username_key') {
          throw new Error('Username already taken');
        } else if (error.constraint === 'unique_oauth') {
          throw new Error('OAuth account already linked');
        }
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  // Find user by OAuth provider and ID
  static async findByOAuth(provider, oauthId) {
    const query = 'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2';
    const result = await db.query(query, [provider, oauthId]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, email, username, total_return, portfolio_value, rank, last_sync_at, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user's total return and portfolio value
  static async updateStats(userId, totalReturn, portfolioValue) {
    const query = `
      UPDATE users
      SET total_return = $1,
          portfolio_value = $2,
          last_sync_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, username, total_return, portfolio_value, rank
    `;

    const result = await db.query(query, [totalReturn, portfolioValue, userId]);
    return result.rows[0];
  }

  // Update ranks based on total return
  static async updateRanks() {
    const query = `
      WITH ranked_users AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY total_return DESC) as new_rank
        FROM users
      )
      UPDATE users
      SET rank = ranked_users.new_rank
      FROM ranked_users
      WHERE users.id = ranked_users.id
    `;

    await db.query(query);
  }

  // Get leaderboard (top N users)
  static async getLeaderboard(limit = 10) {
    const query = `
      SELECT id, username, total_return, portfolio_value, rank
      FROM users
      WHERE rank IS NOT NULL
      ORDER BY rank ASC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  // Get user rank and nearby users
  static async getUserRankWithContext(userId, contextSize = 2) {
    const user = await User.findById(userId);
    if (!user || !user.rank) {
      return null;
    }

    const query = `
      SELECT id, username, total_return, portfolio_value, rank
      FROM users
      WHERE rank BETWEEN $1 AND $2
      ORDER BY rank ASC
    `;

    const rangeStart = Math.max(1, user.rank - contextSize);
    const rangeEnd = user.rank + contextSize;

    const result = await db.query(query, [rangeStart, rangeEnd]);

    return {
      user,
      nearbyUsers: result.rows,
      totalUsers: await User.getTotalUserCount()
    };
  }

  // Get total user count
  static async getTotalUserCount() {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = User;
