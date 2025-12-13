-- Drop existing tables
DROP TABLE IF EXISTS game_analytics;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS leaderboards;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS puzzle_configs;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;


-- USERS TABLE


CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- USER PROFILES TABLE


CREATE TABLE user_profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Game statistics
    total_games INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    total_moves INT DEFAULT 0,
    best_time_seconds INT NULL,
    best_moves INT NULL,
    avg_efficiency DECIMAL(5,2) DEFAULT 0,
    
    -- Custom features
    current_theme VARCHAR(20) DEFAULT 'aurora',
    story_progress INT DEFAULT 0,
    powerup_hint INT DEFAULT 3,
    powerup_corner INT DEFAULT 2,
    powerup_freeze INT DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GAME SESSIONS TABLE


CREATE TABLE game_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Game configuration
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    mode ENUM('practice', 'competitive') NOT NULL,
    competitive_mode ENUM('speed', 'moves', 'combo') NULL,
    puzzle_type VARCHAR(20) DEFAULT 'numbers',
    custom_image_url TEXT NULL,
    
    -- Session tracking
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    
    -- Performance metrics
    completion_time_seconds INT NULL,
    total_moves INT NULL,
    efficiency_score DECIMAL(5,2) NULL,
    completed BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_completed (user_id, completed),
    INDEX idx_mode (mode),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- LEADERBOARDS TABLE


CREATE TABLE leaderboards (
    leaderboard_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    
    -- Game details
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    category ENUM('speed', 'moves', 'overall') NOT NULL,
    
    -- Performance scores
    completion_time_seconds INT NOT NULL,
    total_moves INT NOT NULL,
    efficiency_score DECIMAL(5,2),
    score INT NOT NULL,
    
    -- Ranking
    rank_position INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    
    INDEX idx_category_size_diff (category, puzzle_size, difficulty),
    INDEX idx_score (score DESC),
    INDEX idx_user_score (user_id, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ACHIEVEMENTS TABLE


CREATE TABLE achievements (
    achievement_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_type (user_id, achievement_type),
    UNIQUE KEY unique_user_achievement (user_id, achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- GAME ANALYTICS TABLE


CREATE TABLE game_analytics (
    analytics_id INT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Game details
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    completion_time_seconds INT NOT NULL,
    total_moves INT NOT NULL,
    efficiency_score DECIMAL(5,2) NOT NULL,
    
    -- Additional tracking
    powerups_used INT DEFAULT 0,
    theme_used VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_recorded (user_id, recorded_at),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- PUZZLE CONFIGS TABLE


CREATE TABLE puzzle_configs (
    config_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Configuration
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    puzzle_type VARCHAR(20) DEFAULT 'numbers',
    custom_image_url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- SAMPLE DATA


-- Insert test user (password: test123)
INSERT INTO users (username, email, password_hash, created_at, last_login) VALUES
('testuser', 'test@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW());

-- Get the user_id
SET @test_user_id = LAST_INSERT_ID();

-- Create profile for test user
INSERT INTO user_profiles (
    user_id, total_games, total_wins, total_time_seconds, total_moves,
    best_time_seconds, best_moves, avg_efficiency, current_theme,
    story_progress, powerup_hint, powerup_corner, powerup_freeze
) VALUES (@test_user_id, 0, 0, 0, 0, NULL, NULL, 0, 'aurora', 0, 3, 2, 1);


-- VERIFICATION QUERIES

-- Verify tables created
SELECT 'Tables created successfully!' as status;

-- Show table structure
SHOW TABLES;

-- Verify test user
SELECT u.username, u.email, up.powerup_hint, up.powerup_corner, up.powerup_freeze
FROM users u
JOIN user_profiles up ON u.user_id = up.user_id
WHERE u.username = 'testuser';
