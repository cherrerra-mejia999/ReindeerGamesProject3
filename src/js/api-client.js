const API_URL = '../php/api.php';

// Helper function to make API calls
async function apiCall(action, data = {}) {
    try {
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, ...data })
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Network error: ' + error.message };
    }
}

// USER MANAGEMENT

async function registerUser(username, email, password) {
    return await apiCall('register', { username, email, password });
}

async function loginUser(username, password) {
    return await apiCall('login', { username, password });
}

async function getUserProfile(userId) {
    return await apiCall('getUserProfile', { user_id: userId });
}

// GAME SESSION

async function startGameSession(userId, config) {
    return await apiCall('startGame', {
        user_id: userId,
        puzzle_size: config.size,
        difficulty: config.difficulty,
        mode: config.mode,
        competitive_mode: config.competitiveMode,
        puzzle_type: config.puzzleType,
        custom_image_url: config.puzzleImage
    });
}

async function endGameSession(sessionId, userId, result) {
    return await apiCall('endGame', {
        session_id: sessionId,
        user_id: userId,
        completed: result.completed,
        time: result.time,
        moves: result.moves,
        efficiency: result.efficiency
    });
}

// LEADERBOARD

async function recordLeaderboardEntry(userId, sessionId, result) {
    const score = calculateScore(result.time, result.moves, result.efficiency);
    
    return await apiCall('recordLeaderboard', {
        user_id: userId,
        session_id: sessionId,
        puzzle_size: state.config.size,
        difficulty: state.config.difficulty,
        time: result.time,
        moves: result.moves,
        efficiency: result.efficiency,
        category: state.config.competitiveMode || 'overall',
        score: score
    });
}

async function getLeaderboard(category, puzzleSize = 4, difficulty = 'medium', limit = 10) {
    return await apiCall('getLeaderboard', {
        category,
        puzzle_size: puzzleSize,
        difficulty,
        limit
    });
}

function calculateScore(time, moves, efficiency) {
    // Score formula: Higher is better
    // Base score on efficiency, penalize time and moves
    return Math.round((efficiency * 100) - (time * 0.5) - (moves * 2));
}


// USER PROFILE UPDATES

async function updateTheme(userId, theme) {
    return await apiCall('updateTheme', { user_id: userId, theme });
}

async function updateStoryProgress(userId) {
    return await apiCall('updateStoryProgress', { user_id: userId });
}

async function updatePowerups(userId, powerups) {
    return await apiCall('updatePowerups', {
        user_id: userId,
        hint: powerups.hint,
        corner: powerups.corner,
        freeze: powerups.freeze
    });
}

async function grantPowerup(userId, type) {
    return await apiCall('grantPowerup', { user_id: userId, type });
}


// ACHIEVEMENTS

async function getAchievements(userId) {
    return await apiCall('getAchievements', { user_id: userId });
}

async function recordAchievement(userId, achievementType) {
    return await apiCall('recordAchievement', { 
        user_id: userId, 
        achievement_type: achievementType 
    });
}

// ANALYTICS

async function recordGameAnalytics(sessionId, userId, gameData) {
    return await apiCall('recordAnalytics', {
        session_id: sessionId,
        user_id: userId,
        puzzle_size: state.config.size,
        difficulty: state.config.difficulty,
        time: gameData.time,
        moves: gameData.moves,
        efficiency: gameData.efficiency,
        powerups_used: gameData.powerupsUsed || 0,
        theme: state.customFeatures.theme
    });
}

async function getUserStats(userId) {
    return await apiCall('getUserStats', { user_id: userId });
}