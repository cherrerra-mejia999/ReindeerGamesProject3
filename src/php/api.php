<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $input['action'] ?? '';

// Response helper
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . 'localhost' . ";dbname=" . 'cherreramejia2' . ";charset=utf8mb4",
        'cherreramejia2',
        'cherreramejia2',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch(PDOException $e) {
    sendResponse(false, null, 'Database connection failed: ' . $e->getMessage());
}

// USER MANAGEMENT

if ($action === 'register') {
    $username = $input['username'] ?? '';
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($email) || empty($password)) {
        sendResponse(false, null, 'All fields are required');
    }
    
    // Check if username exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, null, 'Username already exists');
    }
    
    // Check if email exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, null, 'Email already exists');
    }
    
    // Create user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, created_at, last_login)
        VALUES (?, ?, ?, NOW(), NOW())
    ");
    $stmt->execute([$username, $email, $passwordHash]);
    $userId = $pdo->lastInsertId();
    
    // Create user profile
    $stmt = $pdo->prepare("
        INSERT INTO user_profiles (
            user_id, total_games, total_wins, total_time_seconds, total_moves,
            best_time_seconds, best_moves, avg_efficiency, current_theme,
            story_progress, powerup_hint, powerup_corner, powerup_freeze
        ) VALUES (?, 0, 0, 0, 0, NULL, NULL, 0, 'aurora', 0, 3, 2, 1)
    ");
    $stmt->execute([$userId]);
    
    sendResponse(true, [
        'user_id' => $userId,
        'username' => $username,
        'email' => $email
    ], 'Account created successfully');
}

if ($action === 'login') {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        sendResponse(false, null, 'Username and password required');
    }
    
    // Get user
    $stmt = $pdo->prepare("
        SELECT user_id, username, email, password_hash 
        FROM users 
        WHERE username = ? OR email = ?
    ");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendResponse(false, null, 'Invalid credentials');
    }
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    
    unset($user['password_hash']);
    sendResponse(true, $user, 'Login successful');
}

if ($action === 'getUserProfile') {
    $userId = $input['user_id'] ?? 0;
    
    $stmt = $pdo->prepare("
        SELECT 
            u.user_id, u.username, u.email, u.created_at, u.last_login,
            up.total_games, up.total_wins, up.total_time_seconds, up.total_moves,
            up.best_time_seconds, up.best_moves, up.avg_efficiency,
            up.current_theme, up.story_progress,
            up.powerup_hint, up.powerup_corner, up.powerup_freeze
        FROM users u
        LEFT JOIN user_profiles up ON u.user_id = up.user_id
        WHERE u.user_id = ?
    ");
    $stmt->execute([$userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($profile) {
        sendResponse(true, $profile);
    } else {
        sendResponse(false, null, 'User not found');
    }
}


// GAME SESSION MANAGEMENT

if ($action === 'startGame') {
    $userId = $input['user_id'] ?? 0;
    $puzzleSize = $input['puzzle_size'] ?? 4;
    $difficulty = $input['difficulty'] ?? 'medium';
    $mode = $input['mode'] ?? 'competitive';
    $competitiveMode = $input['competitive_mode'] ?? 'speed';
    $puzzleType = $input['puzzle_type'] ?? 'numbers';
    $customImage = $input['custom_image_url'] ?? null;
    
    $stmt = $pdo->prepare("
        INSERT INTO game_sessions (
            user_id, puzzle_size, difficulty, mode, competitive_mode,
            start_time, puzzle_type, custom_image_url
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
    ");
    $stmt->execute([$userId, $puzzleSize, $difficulty, $mode, $competitiveMode, $puzzleType, $customImage]);
    
    sendResponse(true, ['session_id' => $pdo->lastInsertId()], 'Game started');
}

if ($action === 'endGame') {
    $sessionId = $input['session_id'] ?? 0;
    $userId = $input['user_id'] ?? 0;
    $completed = $input['completed'] ?? false;
    $time = $input['time'] ?? 0;
    $moves = $input['moves'] ?? 0;
    $efficiency = $input['efficiency'] ?? 0;
    
    if ($completed) {
        // Update session
        $stmt = $pdo->prepare("
            UPDATE game_sessions 
            SET end_time = NOW(), completion_time_seconds = ?,
                total_moves = ?, efficiency_score = ?, completed = 1
            WHERE session_id = ?
        ");
        $stmt->execute([$time, $moves, $efficiency, $sessionId]);
        
        // Update user profile - get current values first
        $stmt = $pdo->prepare("SELECT total_games, avg_efficiency FROM user_profiles WHERE user_id = ?");
        $stmt->execute([$userId]);
        $currentProfile = $stmt->fetch(PDO::FETCH_ASSOC);
        $currentGames = $currentProfile['total_games'] ?? 0;
        $currentAvgEff = $currentProfile['avg_efficiency'] ?? 0;
        
        // Calculate new average
        $newAvgEfficiency = $currentGames == 0 ? $efficiency : (($currentAvgEff * $currentGames) + $efficiency) / ($currentGames + 1);
        
        // Update user profile
        $stmt = $pdo->prepare("
            UPDATE user_profiles 
            SET total_games = total_games + 1,
                total_wins = total_wins + 1,
                total_time_seconds = total_time_seconds + ?,
                total_moves = total_moves + ?,
                best_time_seconds = CASE 
                    WHEN best_time_seconds IS NULL OR ? < best_time_seconds 
                    THEN ? ELSE best_time_seconds END,
                best_moves = CASE 
                    WHEN best_moves IS NULL OR ? < best_moves 
                    THEN ? ELSE best_moves END,
                avg_efficiency = ?
            WHERE user_id = ?
        ");
        $stmt->execute([$time, $moves, $time, $time, $moves, $moves, $newAvgEfficiency, $userId]);
        
        sendResponse(true, null, 'Game completed');
    } else {
        $stmt = $pdo->prepare("UPDATE game_sessions SET end_time = NOW(), completed = 0 WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        sendResponse(true, null, 'Game ended');
    }
}


// LEADERBOARD

if ($action === 'recordLeaderboard') {
    $userId = $input['user_id'] ?? 0;
    $sessionId = $input['session_id'] ?? 0;
    $puzzleSize = $input['puzzle_size'] ?? 4;
    $difficulty = $input['difficulty'] ?? 'medium';
    $time = $input['time'] ?? 0;
    $moves = $input['moves'] ?? 0;
    $efficiency = $input['efficiency'] ?? 0;
    $category = $input['category'] ?? 'overall';
    $score = $input['score'] ?? 0;
    
    $stmt = $pdo->prepare("
        INSERT INTO leaderboards (
            user_id, session_id, puzzle_size, difficulty,
            completion_time_seconds, total_moves, efficiency_score,
            category, score, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$userId, $sessionId, $puzzleSize, $difficulty, $time, $moves, $efficiency, $category, $score]);
    
    sendResponse(true, null, 'Leaderboard recorded');
}

if ($action === 'getLeaderboard') {
    $category = $input['category'] ?? 'overall';
    $puzzleSize = $input['puzzle_size'] ?? 4;
    $difficulty = $input['difficulty'] ?? 'medium';
    $limit = $input['limit'] ?? 10;
    
    $orderBy = $category === 'speed' ? 'l.completion_time_seconds ASC' :
               ($category === 'moves' ? 'l.total_moves ASC' : 'l.score DESC');
    
    $stmt = $pdo->prepare("
        SELECT 
            l.rank_position, u.username, l.completion_time_seconds,
            l.total_moves, l.efficiency_score, l.score, l.recorded_at
        FROM leaderboards l
        JOIN users u ON l.user_id = u.user_id
        WHERE l.category = ? AND l.puzzle_size = ? AND l.difficulty = ?
        ORDER BY $orderBy
        LIMIT ?
    ");
    $stmt->execute([$category, $puzzleSize, $difficulty, $limit]);
    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, $leaderboard);
}

// USER PROFILE UPDATES

if ($action === 'updateTheme') {
    $userId = $input['user_id'] ?? 0;
    $theme = $input['theme'] ?? 'aurora';
    
    $stmt = $pdo->prepare("UPDATE user_profiles SET current_theme = ? WHERE user_id = ?");
    $stmt->execute([$theme, $userId]);
    
    sendResponse(true, null, 'Theme updated');
}

if ($action === 'updateStoryProgress') {
    $userId = $input['user_id'] ?? 0;
    
    $stmt = $pdo->prepare("UPDATE user_profiles SET story_progress = story_progress + 1 WHERE user_id = ? AND story_progress < 10");
    $stmt->execute([$userId]);
    
    sendResponse(true, null, 'Story progress updated');
}

if ($action === 'updatePowerups') {
    $userId = $input['user_id'] ?? 0;
    $hint = $input['hint'] ?? 0;
    $corner = $input['corner'] ?? 0;
    $freeze = $input['freeze'] ?? 0;
    
    $stmt = $pdo->prepare("
        UPDATE user_profiles 
        SET powerup_hint = ?, powerup_corner = ?, powerup_freeze = ?
        WHERE user_id = ?
    ");
    $stmt->execute([$hint, $corner, $freeze, $userId]);
    
    sendResponse(true, null, 'Powerups updated');
}

if ($action === 'grantPowerup') {
    $userId = $input['user_id'] ?? 0;
    $type = $input['type'] ?? 'hint';
    
    $column = 'powerup_' . $type;
    $stmt = $pdo->prepare("UPDATE user_profiles SET $column = $column + 1 WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    sendResponse(true, null, 'Powerup granted');
}

// ACHIEVEMENTS


if ($action === 'getAchievements') {
    $userId = $input['user_id'] ?? 0;
    
    $stmt = $pdo->prepare("
        SELECT achievement_id, achievement_type, earned_at
        FROM achievements
        WHERE user_id = ?
        ORDER BY earned_at DESC
    ");
    $stmt->execute([$userId]);
    $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, $achievements);
}

if ($action === 'recordAchievement') {
    $userId = $input['user_id'] ?? 0;
    $type = $input['achievement_type'] ?? '';
    
    // Check if already earned
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM achievements WHERE user_id = ? AND achievement_type = ?");
    $stmt->execute([$userId, $type]);
    if ($stmt->fetchColumn() > 0) {
        sendResponse(false, null, 'Achievement already earned');
    }
    
    $stmt = $pdo->prepare("INSERT INTO achievements (user_id, achievement_type, earned_at) VALUES (?, ?, NOW())");
    $stmt->execute([$userId, $type]);
    
    sendResponse(true, null, 'Achievement recorded');
}

// ANALYTICS

if ($action === 'recordAnalytics') {
    $sessionId = $input['session_id'] ?? 0;
    $userId = $input['user_id'] ?? 0;
    $puzzleSize = $input['puzzle_size'] ?? 4;
    $difficulty = $input['difficulty'] ?? 'medium';
    $time = $input['time'] ?? 0;
    $moves = $input['moves'] ?? 0;
    $efficiency = $input['efficiency'] ?? 0;
    $powerupsUsed = $input['powerups_used'] ?? 0;
    $theme = $input['theme'] ?? 'aurora';
    
    $stmt = $pdo->prepare("
        INSERT INTO game_analytics (
            session_id, user_id, puzzle_size, difficulty,
            completion_time_seconds, total_moves, efficiency_score,
            powerups_used, theme_used, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$sessionId, $userId, $puzzleSize, $difficulty, $time, $moves, $efficiency, $powerupsUsed, $theme]);
    
    sendResponse(true, null, 'Analytics recorded');
}

if ($action === 'getUserStats') {
    $userId = $input['user_id'] ?? 0;
    
    $stmt = $pdo->prepare("
        SELECT 
            up.total_games, up.total_wins,
            ROUND(up.total_time_seconds / 60, 2) as total_hours,
            up.total_moves, up.best_time_seconds, up.best_moves,
            ROUND(up.avg_efficiency, 2) as avg_efficiency,
            up.story_progress,
            COUNT(DISTINCT a.achievement_id) as total_achievements
        FROM user_profiles up
        LEFT JOIN achievements a ON up.user_id = a.user_id
        WHERE up.user_id = ?
        GROUP BY up.user_id
    ");
    $stmt->execute([$userId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    sendResponse(true, $stats);
}

// Unknown action
sendResponse(false, null, 'Unknown action: ' . $action);
?>