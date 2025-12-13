// Initialize game on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGameConfig();
    initializeGame();
});

function loadGameConfig() {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('gameConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        state.config = { ...state.config, ...config };
    }
}

// Game Initialization
function initializeGame() {
    state.reset();
    
    // Load saved power-ups (DON'T reset them!)
    const savedPowerups = localStorage.getItem('powerups');
    if (savedPowerups) {
        state.customFeatures.powerups = JSON.parse(savedPowerups);
    } else {
        // Only use defaults if no saved power-ups exist (first time)
        state.customFeatures.powerups = {
            hint: 3,
            corner: 2,
            freeze: 1
        };
        localStorage.setItem('powerups', JSON.stringify(state.customFeatures.powerups));
    }
    updatePowerupCounts();
    
    const board = document.getElementById('puzzleBoard');
    board.style.gridTemplateColumns = `repeat(${state.config.size}, 1fr)`;
    
    createSolvedBoard();
    renderBoard();
    
    setTimeout(() => {
        shuffleBoard();
    }, 500);
}

function createSolvedBoard() {
    const size = state.config.size;
    state.game.board = [];
    let num = 1;
    
    for (let row = 0; row < size; row++) {
        state.game.board[row] = [];
        for (let col = 0; col < size; col++) {
            if (row === size - 1 && col === size - 1) {
                state.game.board[row][col] = 0;
                state.game.emptyPosition = { row, col };
            } else {
                state.game.board[row][col] = num++;
            }
        }
    }
    
    state.game.optimalMoves = Math.max(size * size - 5, 15);
}

function renderBoard() {
    const board = document.getElementById('puzzleBoard');
    board.innerHTML = '';
    
    const size = state.config.size;
    const useImage = state.config.puzzleType === 'image' && state.config.puzzleImage;
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            
            const value = state.game.board[row][col];
            if (value === 0) {
                tile.classList.add('empty');
            } else {
                if (useImage) {
                    // Image-based tile
                    tile.style.backgroundImage = `url(${state.config.puzzleImage})`;
                    tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
                    
                    // Calculate position based on tile number
                    const tileRow = Math.floor((value - 1) / size);
                    const tileCol = (value - 1) % size;
                    tile.style.backgroundPosition = `${-tileCol * 100}% ${-tileRow * 100}%`;
                } else {
                    // Number-based tile
                    tile.textContent = value;
                }
                tile.onclick = () => handleTileClick(row, col);
            }
            
            board.appendChild(tile);
        }
    }
    
    updateDisplay();
}

// Game Logic
function handleTileClick(row, col) {
    if (!state.game.isActive) {
        startTimer();
        state.game.isActive = true;
    }
    
    if (!isValidMove(row, col)) {
        return;
    }
    
    moveTile(row, col);
    renderBoard();
    
    if (isSolved()) {
        handleVictory();
    }
}

function isValidMove(row, col) {
    const { row: emptyRow, col: emptyCol } = state.game.emptyPosition;
    
    return (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
           (Math.abs(col - emptyCol) === 1 && row === emptyRow);
}

function moveTile(row, col) {
    const { row: emptyRow, col: emptyCol } = state.game.emptyPosition;
    
    state.game.board[emptyRow][emptyCol] = state.game.board[row][col];
    state.game.board[row][col] = 0;
    state.game.emptyPosition = { row, col };
    state.game.moves++;
}

function isSolved() {
    const size = state.config.size;
    let expectedNum = 1;
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (row === size - 1 && col === size - 1) {
                return state.game.board[row][col] === 0;
            }
            if (state.game.board[row][col] !== expectedNum++) {
                return false;
            }
        }
    }
    
    return true;
}

function shuffleBoard() {
    const shuffles = getShuffleCount();
    
    for (let i = 0; i < shuffles; i++) {
        const validMoves = getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        
        const { row: emptyRow, col: emptyCol } = state.game.emptyPosition;
        state.game.board[emptyRow][emptyCol] = state.game.board[randomMove.row][randomMove.col];
        state.game.board[randomMove.row][randomMove.col] = 0;
        state.game.emptyPosition = randomMove;
    }
    
    renderBoard();
}

function getValidMoves() {
    const { row, col } = state.game.emptyPosition;
    const size = state.config.size;
    const moves = [];
    
    const directions = [
        { row: row - 1, col: col },
        { row: row + 1, col: col },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 }
    ];
    
    directions.forEach(dir => {
        if (dir.row >= 0 && dir.row < size && dir.col >= 0 && dir.col < size) {
            moves.push(dir);
        }
    });
    
    return moves;
}

function getShuffleCount() {
    const baseCount = state.config.size * state.config.size * 3;
    const multiplier = utils.getDifficultyMultiplier(state.config.difficulty);
    return Math.floor(baseCount * multiplier);
}

// Timer
function startTimer() {
    state.game.timer = setInterval(() => {
        state.game.time++;
        document.getElementById('timerDisplay').textContent = utils.formatTime(state.game.time);
        updateDisplay();
    }, 1000);
}

function stopTimer() {
    if (state.game.timer) {
        clearInterval(state.game.timer);
        state.game.timer = null;
    }
}

function updateDisplay() {
    const movesEl = document.getElementById('movesDisplay');
    const timerEl = document.getElementById('timerDisplay');
    const efficiencyEl = document.getElementById('efficiencyDisplay');
    
    if (movesEl) movesEl.textContent = state.game.moves;
    if (timerEl) timerEl.textContent = utils.formatTime(state.game.time);
    
    if (efficiencyEl) {
        const efficiency = utils.calculateEfficiency(state.game.moves, state.game.optimalMoves);
        efficiencyEl.textContent = efficiency + '%';
    }
}

// Game Controls
function shuffleGame() {
    if (state.game.isActive) {
        if (!confirm('Shuffle will reset your progress. Continue?')) {
            return;
        }
    }
    
    stopTimer();
    state.game.moves = 0;
    state.game.time = 0;
    state.game.isActive = false;
    
    shuffleBoard();
    updateDisplay();
}

function resetGame() {
    if (!confirm('Reset will clear your progress. Continue?')) {
        return;
    }
    
    initializeGame();
}

function confirmExit() {
    if (state.game.isActive) {
        if (confirm('Exit game? Progress will be lost.')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        window.location.href = 'dashboard.html';
    }
}

function toggleSounds() {
    state.game.soundEnabled = !state.game.soundEnabled;
    
    const button = document.getElementById('soundButton');
    
    if (state.game.soundEnabled) {
        button.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" id="soundIcon"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/></svg> Sounds';
    } else {
        button.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" id="soundIcon"><path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg> Sounds';
    }
}

// Victory Handling
function handleVictory() {
    stopTimer();
    state.game.isActive = false;
    
    const efficiency = utils.calculateEfficiency(state.game.moves, state.game.optimalMoves);
    
    // Save results to localStorage for victory page
    localStorage.setItem('lastGameResult', JSON.stringify({
        time: state.game.time,
        moves: state.game.moves,
        efficiency: efficiency
    }));
    
    // Save game stats
    saveGameResult();
    
    // Custom Features Integration
    changeThemeByPerformance(); // Change theme based on performance
    
    // Show modals in sequence, then redirect
    showVictorySequence();
}

function showVictorySequence() {
    // Increment story counter (but don't show modal yet)
    advanceStory();
    
    // Check if there are any rewards to show
    const hasRewards = checkRewards(); // Returns true if rewards were earned
    
    if (!hasRewards) {
        // No reward earned, show story immediately
        showCurrentStoryChapter();
    }
    // If reward earned, reward modal is already showing
    // Story will show when reward modal closes
}

function saveGameResult() {
    const result = {
        userId: state.user?.id,
        size: state.config.size,
        difficulty: state.config.difficulty,
        mode: state.config.mode,
        time: state.game.time,
        moves: state.game.moves,
        efficiency: utils.calculateEfficiency(state.game.moves, state.game.optimalMoves),
        timestamp: new Date().toISOString()
    };
    
    // Update local stats
    state.stats.totalGames++;
    const prevTotal = state.stats.totalGames - 1;
    state.stats.avgTime = (state.stats.avgTime * prevTotal + state.game.time) / state.stats.totalGames;
    state.stats.avgMoves = (state.stats.avgMoves * prevTotal + state.game.moves) / state.stats.totalGames;
    
    // Save to localStorage
    localStorage.setItem('userStats', JSON.stringify(state.stats));
    
    console.log('Game result saved:', result);
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (!state.game.isActive) return;
    
    const { row, col } = state.game.emptyPosition;
    let targetRow = row;
    let targetCol = col;
    
    switch(e.key) {
        case 'ArrowUp':
            targetRow = row + 1;
            break;
        case 'ArrowDown':
            targetRow = row - 1;
            break;
        case 'ArrowLeft':
            targetCol = col + 1;
            break;
        case 'ArrowRight':
            targetCol = col - 1;
            break;
        default:
            return;
    }
    
    if (targetRow >= 0 && targetRow < state.config.size && 
        targetCol >= 0 && targetCol < state.config.size) {
        handleTileClick(targetRow, targetCol);
        e.preventDefault();
    }
});