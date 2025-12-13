// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    
    // Set theme based on time of day
    if (typeof autoChangeTheme === 'function') {
        autoChangeTheme();
    }
});

function initDashboard() {
    // Load user info
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        document.getElementById('navUsername').textContent = state.user.username;
    }
    
    // Load stats
    loadUserStats();
}

function startCompetitive() {
    state.config.mode = 'competitive';
    localStorage.setItem('gameMode', 'competitive');
    window.location.href = 'config.html';
}

function startPractice() {
    state.config.mode = 'practice';
    localStorage.setItem('gameMode', 'practice');
    window.location.href = 'config.html';
}

function showUserStats() {
    const modal = document.getElementById('statsModal');
    modal.classList.add('active');
    
    document.getElementById('totalGames').textContent = state.stats.totalGames;
    document.getElementById('avgTime').textContent = state.stats.totalGames > 0 
        ? utils.formatTime(Math.round(state.stats.avgTime))
        : '-';
    document.getElementById('avgMoves').textContent = state.stats.totalGames > 0
        ? Math.round(state.stats.avgMoves)
        : '-';
    document.getElementById('bestScore').textContent = state.stats.bestScore || '-';
}

function closeStatsModal() {
    document.getElementById('statsModal').classList.remove('active');
}

function loadUserStats() {
    // In production, this would fetch from backend
    // For now, load from localStorage
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) {
        state.stats = JSON.parse(savedStats);
    }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const statsModal = document.getElementById('statsModal');
    if (statsModal && e.target === statsModal) {
        closeStatsModal();
    }
});