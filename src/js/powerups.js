function updatePowerupCounts() {
    const hintEl = document.getElementById('hintCount');
    const cornerEl = document.getElementById('cornerCount');
    const freezeEl = document.getElementById('freezeCount');
    
    if (hintEl) hintEl.textContent = state.customFeatures.powerups.hint;
    if (cornerEl) cornerEl.textContent = state.customFeatures.powerups.corner;
    if (freezeEl) freezeEl.textContent = state.customFeatures.powerups.freeze;
    
    const hintBtn = document.getElementById('hintPowerup');
    const cornerBtn = document.getElementById('cornerPowerup');
    const freezeBtn = document.getElementById('freezePowerup');
    
    if (hintBtn) hintBtn.disabled = state.customFeatures.powerups.hint <= 0;
    if (cornerBtn) cornerBtn.disabled = state.customFeatures.powerups.corner <= 0;
    if (freezeBtn) freezeBtn.disabled = state.customFeatures.powerups.freeze <= 0;
}

function usePowerup(type) {
    if (state.customFeatures.powerups[type] <= 0) {
        alert('No power-ups remaining!');
        return;
    }
    
    switch(type) {
        case 'hint':
            activateReindeerVision();
            break;
        case 'corner':
            activateSantasHelper();
            break;
        case 'freeze':
            activateNorthPoleBlizzard();
            break;
    }
    
    state.customFeatures.powerups[type]--;
    updatePowerupCounts();
}

function activateReindeerVision() {
    // Shows the optimal move with glowing animation
    const validMoves = getValidMoves();
    if (validMoves.length === 0) return;
    
    // Calculate distance to goal for each move
    const scoredMoves = validMoves.map(move => {
        const tileNum = state.game.board[move.row][move.col];
        const targetRow = Math.floor((tileNum - 1) / state.config.size);
        const targetCol = (tileNum - 1) % state.config.size;
        const distance = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
        return { move, distance, tileNum };
    });
    
    // Sort by distance and take best move
    scoredMoves.sort((a, b) => a.distance - b.distance);
    const bestMove = scoredMoves[0];
    
    const tiles = document.querySelectorAll('.puzzle-tile');
    const index = bestMove.move.row * state.config.size + bestMove.move.col;
    
    tiles[index].classList.add('hint-tile');
    tiles[index].style.animation = 'reindeerGlow 1s ease-in-out infinite';
    
    setTimeout(() => {
        tiles[index].classList.remove('hint-tile');
        tiles[index].style.animation = '';
    }, 5000);
    
    console.log('🦌 Reindeer Vision activated! Follow the glowing path.');
}

function activateSantasHelper() {
    // Auto-completes the next 3 optimal moves
    const movesToMake = 3;
    let movesMade = 0;
    
    const makeOptimalMove = () => {
        if (movesMade >= movesToMake || !state.game.isActive) return;
        
        const validMoves = getValidMoves();
        if (validMoves.length === 0) return;
        
        // Find best move
        const scoredMoves = validMoves.map(move => {
            const tileNum = state.game.board[move.row][move.col];
            const targetRow = Math.floor((tileNum - 1) / state.config.size);
            const targetCol = (tileNum - 1) % state.config.size;
            const distance = Math.abs(move.row - targetRow) + Math.abs(move.col - targetCol);
            return { move, distance };
        });
        
        scoredMoves.sort((a, b) => a.distance - b.distance);
        const bestMove = scoredMoves[0].move;
        
        // Make the move with animation delay
        setTimeout(() => {
            handleTileClick(bestMove.row, bestMove.col);
            movesMade++;
            makeOptimalMove();
        }, 400);
    };
    
    console.log('🎅 Santa\'s Helper activated! Making 3 optimal moves...');
    makeOptimalMove();
}

function activateNorthPoleBlizzard() {
    // Slows down time by 50% for 45 seconds
    if (state.game.timer) {
        clearInterval(state.game.timer);
        
        // Slower timer (2 seconds real time = 1 second game time)
        state.game.timer = setInterval(() => {
            state.game.time++;
            const timerEl = document.getElementById('timerDisplay');
            if (timerEl) timerEl.textContent = utils.formatTime(state.game.time);
            updateDisplay();
        }, 2000);
        
        console.log('❄️ North Pole Blizzard activated! Time slowed by 50% for 45 seconds.');
        
        // Reset to normal speed after 45 seconds
        setTimeout(() => {
            if (state.game.isActive && state.game.timer) {
                clearInterval(state.game.timer);
                state.game.timer = setInterval(() => {
                    state.game.time++;
                    const timerEl = document.getElementById('timerDisplay');
                    if (timerEl) timerEl.textContent = utils.formatTime(state.game.time);
                    updateDisplay();
                }, 1000);
                console.log('⏱️ Time returned to normal speed.');
            }
        }, 45000);
    }
}