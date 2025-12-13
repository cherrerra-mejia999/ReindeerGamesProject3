<?php
/**
 * API Endpoints
 * Reindeer Games - Fifteen Puzzle
 * 
 * IMPORTANT: This file must be accessed via command-line or direct database connections
 * GUI tools like phpMyAdmin are NOT allowed per project requirements
 */

require_once 'config.php';

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize secure session
Security::initSecureSession();

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$endpoint = explode('?', $request_uri)[0];
$endpoint = str_replace('/api/', '', $endpoint);

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

try {
    $db = Database::getInstance()->getConnection();
    
    // Route requests
    switch ($endpoint) {
        case 'register':
            if ($method !== 'POST') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleRegister($db, $input);
            break;
            
        case 'login':
            if ($method !== 'POST') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleLogin($db, $input);
            break;
            
        case 'logout':
            if ($method !== 'POST') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleLogout();
            break;
            
        case 'save-game':
            if ($method !== 'POST') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleSaveGame($db, $input);
            break;
            
        case 'get-leaderboard':
            if ($method !== 'GET') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleGetLeaderboard($db);
            break;
            
        case 'get-user-stats':
            if ($method !== 'GET') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleGetUserStats($db);
            break;
            
        case 'save-analytics':
            if ($method !== 'POST') {
                ApiResponse::error('Method not allowed', 405);
            }
            handleSaveAnalytics($db, $input);
            break;
            
        default:
            ApiResponse::notFound('Endpoint not found');
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    ApiResponse::error('Server error occurred');
}

/**
 * User Registration
 */
function handleRegister($db, $input) {
    // Validate input
    if (empty($input['username']) || empty($input['email']) || empty($input['password'])) {
        ApiResponse::error('All fields are required');
    }
    
    $username = Security::sanitizeInput($input['username']);
    $email = Security::sanitizeInput($input['email']);
    $password = $input['password'];
    
    // Validate email
    if (!Security::validateEmail($email)) {
        ApiResponse::error('Invalid email address');
    }
    
    // Validate username length
    if (strlen($username) < 3 || strlen($username) > 50) {
        ApiResponse::error('Username must be between 3 and 50 characters');
    }
    
    // Validate password strength
    if (strlen($password) < 6) {
        ApiResponse::error('Password must be at least 6 characters');
    }
    
    try {
        // Check if username or email already exists
        $stmt = $db->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            ApiResponse::error('Username or email already exists');
        }
        
        // Hash password
        $password_hash = Security::hashPassword($password);
        
        // Insert user
        $stmt = $db->prepare("
            INSERT INTO users (username, email, password_hash) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$username, $email, $password_hash]);
        
        $user_id = $db->lastInsertId();
        
        // Create user profile
        $stmt = $db->prepare("
            INSERT INTO user_profiles (user_id, display_name) 
            VALUES (?, ?)
        ");
        $stmt->execute([$user_id, $username]);
        
        // Set session
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        
        ApiResponse::success([
            'user_id' => $user_id,
            'username' => $username,
            'email' => $email
        ], 'Registration successful');
        
    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        ApiResponse::error('Registration failed');
    }
}

/**
 * User Login
 */
function handleLogin($db, $input) {
    // Validate input
    if (empty($input['username']) || empty($input['password'])) {
        ApiResponse::error('Username and password are required');
    }
    
    $username = Security::sanitizeInput($input['username']);
    $password = $input['password'];
    
    try {
        // Get user
        $stmt = $db->prepare("
            SELECT user_id, username, email, password_hash, is_active 
            FROM users 
            WHERE username = ? OR email = ?
        ");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            ApiResponse::error('Invalid credentials');
        }
        
        if (!$user['is_active']) {
            ApiResponse::error('Account is disabled');
        }
        
        // Verify password
        if (!Security::verifyPassword($password, $user['password_hash'])) {
            ApiResponse::error('Invalid credentials');
        }
        
        // Update last login
        $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        
        // Set session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        
        ApiResponse::success([
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'email' => $user['email']
        ], 'Login successful');
        
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        ApiResponse::error('Login failed');
    }
}

/**
 * User Logout
 */
function handleLogout() {
    session_unset();
    session_destroy();
    ApiResponse::success(null, 'Logout successful');
}

/**
 * Save Game Session
 */
function handleSaveGame($db, $input) {
    // Check authentication
    if (!isset($_SESSION['user_id'])) {
        ApiResponse::unauthorized('Please login first');
    }
    
    $user_id = $_SESSION['user_id'];
    
    // Validate input
    if (empty($input['puzzle_size']) || empty($input['difficulty']) || 
        empty($input['mode']) || !isset($input['total_moves']) || 
        !isset($input['time_seconds'])) {
        ApiResponse::error('Missing required fields');
    }
    
    try {
        // Use stored procedure to save game
        $stmt = $db->prepare("
            CALL sp_save_game_session(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $puzzle_id = $input['puzzle_id'] ?? 1;
        $board_state = json_encode($input['board_state'] ?? []);
        $move_history = json_encode($input['move_history'] ?? []);
        
        $stmt->execute([
            $user_id,
            $puzzle_id,
            $input['mode'],
            $input['competitive_mode'] ?? null,
            $input['puzzle_size'],
            $input['difficulty'],
            $input['total_moves'],
            $input['time_seconds'],
            $board_state,
            $move_history
        ]);
        
        $result = $stmt->fetch();
        
        ApiResponse::success($result, 'Game saved successfully');
        
    } catch (PDOException $e) {
        error_log("Save game error: " . $e->getMessage());
        ApiResponse::error('Failed to save game');
    }
}

/**
 * Get Leaderboard
 */
function handleGetLeaderboard($db) {
    $game_mode = $_GET['mode'] ?? 'speed';
    $puzzle_size = $_GET['size'] ?? 4;
    $difficulty = $_GET['difficulty'] ?? 'medium';
    $limit = $_GET['limit'] ?? 50;
    
    try {
        $stmt = $db->prepare("
            CALL sp_get_leaderboard(?, ?, ?, ?)
        ");
        $stmt->execute([$game_mode, $puzzle_size, $difficulty, $limit]);
        
        $leaderboard = $stmt->fetchAll();
        
        ApiResponse::success($leaderboard, 'Leaderboard retrieved successfully');
        
    } catch (PDOException $e) {
        error_log("Leaderboard error: " . $e->getMessage());
        ApiResponse::error('Failed to retrieve leaderboard');
    }
}

/**
 * Get User Statistics
 */
function handleGetUserStats($db) {
    // Check authentication
    if (!isset($_SESSION['user_id'])) {
        ApiResponse::unauthorized('Please login first');
    }
    
    $user_id = $_SESSION['user_id'];
    
    try {
        $stmt = $db->prepare("CALL sp_get_user_stats(?)");
        $stmt->execute([$user_id]);
        
        $stats = $stmt->fetch();
        $stmt->nextRowset(); // Move to achievements
        $achievements = $stmt->fetchAll();
        
        ApiResponse::success([
            'statistics' => $stats,
            'achievements' => $achievements
        ], 'Statistics retrieved successfully');
        
    } catch (PDOException $e) {
        error_log("Stats error: " . $e->getMessage());
        ApiResponse::error('Failed to retrieve statistics');
    }
}

/**
 * Save Analytics Event
 */
function handleSaveAnalytics($db, $input) {
    // Check authentication
    if (!isset($_SESSION['user_id'])) {
        ApiResponse::unauthorized('Please login first');
    }
    
    $user_id = $_SESSION['user_id'];
    
    // Validate input
    if (empty($input['event_type'])) {
        ApiResponse::error('Event type is required');
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO game_analytics 
            (user_id, session_id, event_type, puzzle_size, difficulty, 
             current_moves, current_time, device_type, browser, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $metadata = json_encode($input['metadata'] ?? []);
        
        $stmt->execute([
            $user_id,
            $input['session_id'] ?? null,
            $input['event_type'],
            $input['puzzle_size'] ?? null,
            $input['difficulty'] ?? null,
            $input['current_moves'] ?? null,
            $input['current_time'] ?? null,
            $input['device_type'] ?? null,
            $input['browser'] ?? null,
            $metadata
        ]);
        
        ApiResponse::success(null, 'Analytics saved successfully');
        
    } catch (PDOException $e) {
        error_log("Analytics error: " . $e->getMessage());
        ApiResponse::error('Failed to save analytics');
    }
}
?>
