-- Stock Simulator Database Initialization Script
-- This script creates the minimal database schema for the leaderboard system

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    profile_picture_url VARCHAR(500),
    total_return DECIMAL(15, 2) DEFAULT 0,
    portfolio_value DECIMAL(15, 2) DEFAULT 100000,
    rank INTEGER,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_rank ON users(rank);
CREATE INDEX IF NOT EXISTS idx_users_total_return ON users(total_return DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, username, password_hash, total_return, portfolio_value, rank)
VALUES
    ('osman@example.com', 'OsmanD', '$2b$10$dummyhash1', 12450.50, 112450.50, 1),
    ('trader@example.com', 'TechTrader', '$2b$10$dummyhash2', 9800.25, 109800.25, 2),
    ('master@example.com', 'StockMaster', '$2b$10$dummyhash3', 7500.00, 107500.00, 3),
    ('investor@example.com', 'InvestorPro', '$2b$10$dummyhash4', 5200.75, 105200.75, 4),
    ('bull@example.com', 'BullRunner', '$2b$10$dummyhash5', 3100.50, 103100.50, 5)
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stockadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stockadmin;
