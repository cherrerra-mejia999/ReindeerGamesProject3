-- ===================================================
-- REINDEER GAMES - DATABASE SCHEMA
-- Fifteen Puzzle Game with Social & Competitive Features
-- ===================================================

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS game_analytics;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS puzzle_configurations;
DROP TABLE IF EXISTS leaderboards;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

-- ===================================================
-- USER MANAGEMENT
-- ===================================================

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    account_type ENUM('free', 'premium') DEFAULT 'free',
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    country VARCHAR(50),
    timezone VARCHAR(50),
    preferred_puzzle_size INT DEFAULT 4,
    preferred_difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    sound_enabled BOOLEAN DEFAULT TRUE,
    theme_preference ENUM('light', 'dark', 'festive') DEFAULT 'festive',
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- PUZZLE STORAGE
-- ===================================================

CREATE TABLE puzzle_configurations (
    puzzle_id INT PRIMARY KEY AUTO_INCREMENT,
    puzzle_size INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    initial_state JSON NOT NULL,
    solution_path JSON,
    optimal_moves INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_size_difficulty (puzzle_size, difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- GAME SESSIONS
-- ===================================================

CREATE TABLE game_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    puzzle_id INT NOT NULL,
    game_mode ENUM('practice', 'competitive', 'multiplayer') NOT NULL,
    competitive_mode ENUM('speed', 'moves', 'combo') NULL,
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    
    -- Session tracking
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Performance metrics
    total_moves INT DEFAULT 0,
    time_seconds INT DEFAULT 0,
    optimal_moves INT,
    efficiency_score DECIMAL(5,2),
    
    -- Completion status
    is_completed BOOLEAN DEFAULT FALSE,
    is_victory BOOLEAN DEFAULT FALSE,
    
    -- Session data
    board_state JSON,
    move_history JSON,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzle_configurations(puzzle_id) ON DELETE SET NULL,
    
    INDEX idx_user_completed (user_id, is_completed),
    INDEX idx_mode (game_mode),
    INDEX idx_started (started_at),
    INDEX idx_user_mode (user_id, game_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- ANALYTICS
-- ===================================================

CREATE TABLE game_analytics (
    analytics_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id INT,
    
    -- Event tracking
    event_type ENUM('game_start', 'game_complete', 'move_made', 'shuffle', 'reset', 'victory') NOT NULL,
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance data
    puzzle_size INT,
    difficulty ENUM('easy', 'medium', 'hard', 'expert'),
    current_moves INT,
    current_time INT,
    
    -- Behavioral data
    device_type VARCHAR(50),
    browser VARCHAR(50),
    session_duration INT,
    
    -- Additional metadata
    metadata JSON,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    
    INDEX idx_user_event (user_id, event_type),
    INDEX idx_timestamp (event_timestamp),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- LEADERBOARDS
-- ===================================================

CREATE TABLE leaderboards (
    leaderboard_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    
    -- Game details
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') NOT NULL,
    game_mode ENUM('speed', 'moves', 'combo') NOT NULL,
    
    -- Performance scores
    time_seconds INT NOT NULL,
    total_moves INT NOT NULL,
    efficiency_score DECIMAL(5,2),
    overall_score INT NOT NULL,
    
    -- Ranking
    rank_position INT,
    
    -- Timestamps
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    
    INDEX idx_size_difficulty (puzzle_size, difficulty),
    INDEX idx_mode_score (game_mode, overall_score),
    INDEX idx_user_score (user_id, overall_score),
    INDEX idx_achieved (achieved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- ACHIEVEMENTS
-- ===================================================

CREATE TABLE user_achievements (
    achievement_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Achievement details
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    
    -- Criteria
    requirement_met JSON,
    
    -- Timestamps
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_user_type (user_id, achievement_type),
    INDEX idx_unlocked (unlocked_at),
    
    UNIQUE KEY unique_user_achievement (user_id, achievement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================

-- Composite indexes for common queries
CREATE INDEX idx_leaderboard_query ON leaderboards(game_mode, puzzle_size, difficulty, overall_score DESC);
CREATE INDEX idx_user_stats ON game_sessions(user_id, is_completed, game_mode);
CREATE INDEX idx_recent_sessions ON game_sessions(user_id, started_at DESC);

-- ===================================================
-- VIEWS FOR COMMON QUERIES
-- ===================================================

-- User Statistics View
CREATE VIEW user_statistics AS
SELECT 
    u.user_id,
    u.username,
    COUNT(gs.session_id) as total_games,
    SUM(CASE WHEN gs.is_completed = TRUE THEN 1 ELSE 0 END) as completed_games,
    AVG(gs.time_seconds) as avg_time,
    AVG(gs.total_moves) as avg_moves,
    MIN(gs.time_seconds) as best_time,
    MIN(gs.total_moves) as best_moves,
    MAX(gs.efficiency_score) as best_efficiency
FROM users u
LEFT JOIN game_sessions gs ON u.user_id = gs.user_id
GROUP BY u.user_id, u.username;

-- Top Players View
CREATE VIEW top_players_overall AS
SELECT 
    u.user_id,
    u.username,
    COUNT(DISTINCT gs.session_id) as games_played,
    AVG(gs.efficiency_score) as avg_efficiency,
    SUM(l.overall_score) as total_score,
    COUNT(ua.achievement_id) as total_achievements
FROM users u
LEFT JOIN game_sessions gs ON u.user_id = gs.user_id AND gs.is_completed = TRUE
LEFT JOIN leaderboards l ON u.user_id = l.user_id
LEFT JOIN user_achievements ua ON u.user_id = ua.user_id
GROUP BY u.user_id, u.username
ORDER BY total_score DESC
LIMIT 100;

-- Recent Activity View
CREATE VIEW recent_activity AS
SELECT 
    gs.session_id,
    u.username,
    gs.game_mode,
    gs.puzzle_size,
    gs.difficulty,
    gs.total_moves,
    gs.time_seconds,
    gs.efficiency_score,
    gs.started_at,
    gs.completed_at
FROM game_sessions gs
JOIN users u ON gs.user_id = u.user_id
WHERE gs.is_completed = TRUE
ORDER BY gs.completed_at DESC
LIMIT 50;

-- ===================================================
-- STORED PROCEDURES
-- ===================================================

DELIMITER //

-- Save game session
CREATE PROCEDURE sp_save_game_session(
    IN p_user_id INT,
    IN p_puzzle_id INT,
    IN p_game_mode VARCHAR(20),
    IN p_competitive_mode VARCHAR(20),
    IN p_puzzle_size INT,
    IN p_difficulty VARCHAR(20),
    IN p_total_moves INT,
    IN p_time_seconds INT,
    IN p_board_state JSON,
    IN p_move_history JSON
)
BEGIN
    DECLARE v_session_id INT;
    DECLARE v_optimal_moves INT;
    DECLARE v_efficiency DECIMAL(5,2);
    
    -- Calculate optimal moves (simplified)
    SET v_optimal_moves = GREATEST(p_puzzle_size * p_puzzle_size - 5, 15);
    
    -- Calculate efficiency
    SET v_efficiency = (v_optimal_moves / p_total_moves) * 100;
    
    -- Insert session
    INSERT INTO game_sessions (
        user_id, puzzle_id, game_mode, competitive_mode,
        puzzle_size, difficulty, total_moves, time_seconds,
        optimal_moves, efficiency_score, is_completed, is_victory,
        board_state, move_history, completed_at
    ) VALUES (
        p_user_id, p_puzzle_id, p_game_mode, p_competitive_mode,
        p_puzzle_size, p_difficulty, p_total_moves, p_time_seconds,
        v_optimal_moves, v_efficiency, TRUE, TRUE,
        p_board_state, p_move_history, NOW()
    );
    
    SET v_session_id = LAST_INSERT_ID();
    
    -- Add to leaderboard if competitive
    IF p_game_mode = 'competitive' THEN
        CALL sp_add_to_leaderboard(v_session_id);
    END IF;
    
    SELECT v_session_id as session_id, v_efficiency as efficiency;
END //

-- Add to leaderboard
CREATE PROCEDURE sp_add_to_leaderboard(
    IN p_session_id INT
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_puzzle_size INT;
    DECLARE v_difficulty VARCHAR(20);
    DECLARE v_game_mode VARCHAR(20);
    DECLARE v_time INT;
    DECLARE v_moves INT;
    DECLARE v_efficiency DECIMAL(5,2);
    DECLARE v_score INT;
    
    -- Get session details
    SELECT user_id, puzzle_size, difficulty, competitive_mode,
           time_seconds, total_moves, efficiency_score
    INTO v_user_id, v_puzzle_size, v_difficulty, v_game_mode,
         v_time, v_moves, v_efficiency
    FROM game_sessions
    WHERE session_id = p_session_id;
    
    -- Calculate overall score
    SET v_score = ROUND(10000 / (v_time + v_moves) * v_efficiency);
    
    -- Insert into leaderboard
    INSERT INTO leaderboards (
        user_id, session_id, puzzle_size, difficulty,
        game_mode, time_seconds, total_moves, efficiency_score,
        overall_score
    ) VALUES (
        v_user_id, p_session_id, v_puzzle_size, v_difficulty,
        v_game_mode, v_time, v_moves, v_efficiency, v_score
    );
    
    -- Update rankings
    CALL sp_update_rankings(v_puzzle_size, v_difficulty, v_game_mode);
END //

-- Update leaderboard rankings
CREATE PROCEDURE sp_update_rankings(
    IN p_puzzle_size INT,
    IN p_difficulty VARCHAR(20),
    IN p_game_mode VARCHAR(20)
)
BEGIN
    SET @rank = 0;
    
    UPDATE leaderboards
    SET rank_position = (@rank := @rank + 1)
    WHERE puzzle_size = p_puzzle_size
      AND difficulty = p_difficulty
      AND game_mode = p_game_mode
    ORDER BY overall_score DESC, time_seconds ASC;
END //

-- Get user statistics
CREATE PROCEDURE sp_get_user_stats(
    IN p_user_id INT
)
BEGIN
    SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed_games,
        AVG(CASE WHEN is_completed = TRUE THEN time_seconds END) as avg_time,
        AVG(CASE WHEN is_completed = TRUE THEN total_moves END) as avg_moves,
        MIN(CASE WHEN is_completed = TRUE THEN time_seconds END) as best_time,
        MIN(CASE WHEN is_completed = TRUE THEN total_moves END) as best_moves,
        MAX(CASE WHEN is_completed = TRUE THEN efficiency_score END) as best_efficiency,
        COUNT(DISTINCT puzzle_size) as puzzles_played
    FROM game_sessions
    WHERE user_id = p_user_id;
    
    SELECT achievement_name, achievement_description, unlocked_at
    FROM user_achievements
    WHERE user_id = p_user_id
    ORDER BY unlocked_at DESC;
END //

-- Get leaderboard
CREATE PROCEDURE sp_get_leaderboard(
    IN p_game_mode VARCHAR(20),
    IN p_puzzle_size INT,
    IN p_difficulty VARCHAR(20),
    IN p_limit INT
)
BEGIN
    SELECT 
        l.rank_position,
        u.username,
        l.time_seconds,
        l.total_moves,
        l.efficiency_score,
        l.overall_score,
        l.achieved_at
    FROM leaderboards l
    JOIN users u ON l.user_id = u.user_id
    WHERE l.game_mode = p_game_mode
      AND l.puzzle_size = p_puzzle_size
      AND l.difficulty = p_difficulty
    ORDER BY l.overall_score DESC, l.time_seconds ASC
    LIMIT p_limit;
END //

DELIMITER ;

-- ===================================================
-- SAMPLE DATA
-- ===================================================

-- Insert sample users
INSERT INTO users (username, email, password_hash) VALUES
('Santa', 'santa@northpole.com', '$2y$10$abcdefghijklmnopqrstuvwxyz'),
('Rudolph', 'rudolph@reindeer.com', '$2y$10$abcdefghijklmnopqrstuvwxyz'),
('Frosty', 'frosty@snowman.com', '$2y$10$abcdefghijklmnopqrstuvwxyz'),
('Elf123', 'elf@workshop.com', '$2y$10$abcdefghijklmnopqrstuvwxyz');

-- Insert user profiles
INSERT INTO user_profiles (user_id, display_name, country, preferred_puzzle_size) VALUES
(1, 'Santa Claus', 'North Pole', 4),
(2, 'Rudolph the Red', 'North Pole', 5),
(3, 'Frosty', 'Winterland', 3),
(4, 'Happy Elf', 'Workshop', 4);

-- Insert sample puzzle configurations
INSERT INTO puzzle_configurations (puzzle_size, difficulty_level, initial_state, optimal_moves) VALUES
(4, 'easy', '{"board": [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,0]]}', 20),
(4, 'medium', '{"board": [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,0]]}', 35),
(4, 'hard', '{"board": [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,0]]}', 50);

