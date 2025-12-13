const utils = {
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    calculateEfficiency(moves, optimal) {
        if (moves === 0) return 100;
        return Math.min(100, Math.round((optimal / moves) * 100));
    },

    getDifficultyMultiplier(difficulty) {
        const multipliers = {
            easy: 0.5,
            medium: 1,
            hard: 1.5,
            expert: 2
        };
        return multipliers[difficulty] || 1;
    },

    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};