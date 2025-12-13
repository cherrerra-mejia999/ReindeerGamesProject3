// Initialize leaderboard on page load
document.addEventListener('DOMContentLoaded', () => {
    initLeaderboard();
    loadLeaderboard('speed'); // Load speed leaderboard by default
});

function initLeaderboard() {
    // Filter tab buttons
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            loadLeaderboard(category);
        });
    });
}

async function loadLeaderboard(category = 'speed') {
    const result = await getLeaderboard(category, 4, 'medium', 10);
    
    if (result.success && result.data.length > 0) {
        displayLeaderboard(result.data);
    } else {
        showEmptyLeaderboard();
    }
}

function displayLeaderboard(data) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach((entry, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.username}</td>
            <td>${utils.formatTime(entry.completion_time_seconds)}</td>
            <td>${entry.total_moves}</td>
            <td>${entry.score}</td>
        `;
    });
}

function showEmptyLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
                No competitive games played yet. Be the first to set a record!
            </td>
        </tr>
    `;
}