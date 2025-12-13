// Application State Management
class GameState {
    constructor() {
        this.user = null;
        this.config = {
            size: 4,
            difficulty: 'medium',
            mode: 'competitive',
            competitiveMode: 'speed',
            puzzleType: 'numbers',
            puzzleImage: null
        };
        this.game = {
            board: [],
            emptyPosition: { row: 0, col: 0 },
            moves: 0,
            time: 0,
            timer: null,
            isActive: false,
            soundEnabled: true,
            optimalMoves: 0
        };
        this.stats = {
            totalGames: 0,
            avgTime: 0,
            avgMoves: 0,
            bestScore: 0
        };
        this.customFeatures = {
            theme: 'aurora',
            powerups: {
                hint: 3,
                corner: 2,
                freeze: 1
            },
            rewards: [],
            storyProgress: 0,
            achievements: []
        };
    }

    reset() {
        if (this.game.timer) {
            clearInterval(this.game.timer);
        }
        this.game = {
            board: [],
            emptyPosition: { row: 0, col: 0 },
            moves: 0,
            time: 0,
            timer: null,
            isActive: false,
            soundEnabled: this.game.soundEnabled,
            optimalMoves: 0
        };
    }
}

const state = new GameState();

// Utility Functions
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

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

// Authentication
function initAuth() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            
            e.target.classList.add('active');
            const formType = e.target.dataset.form;
            document.getElementById(`${formType}Form`).classList.add('active');
        });
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        utils.showNotification('Please enter all fields', 'error');
        return;
    }

    // Simulate authentication
    state.user = {
        id: Date.now(),
        username: username,
        email: `${username}@example.com`
    };

    localStorage.setItem('user', JSON.stringify(state.user));
    document.getElementById('navUsername').textContent = username;
    showScreen('dashboard');
    utils.showNotification('Login successful', 'success');
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!username || !email || !password) {
        utils.showNotification('Please enter all fields', 'error');
        return;
    }

    if (password.length < 6) {
        utils.showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    state.user = {
        id: Date.now(),
        username: username,
        email: email
    };

    localStorage.setItem('user', JSON.stringify(state.user));
    document.getElementById('navUsername').textContent = username;
    showScreen('dashboard');
    utils.showNotification('Account created successfully', 'success');
}

function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('user');
        state.user = null;
        state.reset();
        showScreen('authScreen');
    }
}

function checkSession() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        document.getElementById('navUsername').textContent = state.user.username;
        showScreen('dashboard');
    } else {
        showScreen('authScreen');
    }
}

// Game Mode Selection
function startCompetitive() {
    state.config.mode = 'competitive';
    document.getElementById('competitiveSettings').style.display = 'block';
    showScreen('configScreen');
}

function startPractice() {
    state.config.mode = 'practice';
    document.getElementById('competitiveSettings').style.display = 'none';
    showScreen('configScreen');
}

function returnToDashboard() {
    if (state.game.isActive) {
        if (!confirm('Exit current game? Progress will be lost.')) {
            return;
        }
    }
    state.reset();
    showScreen('dashboard');
}

// Game Configuration
function initConfig() {
    const sizeButtons = document.querySelectorAll('.size-option');
    sizeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.config.size = parseInt(e.currentTarget.dataset.size);
        });
    });
    
    // Puzzle type selector
    const typeButtons = document.querySelectorAll('.puzzle-type-option');
    typeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.config.puzzleType = e.currentTarget.dataset.type;
            
            // Show/hide image upload section
            const imageSection = document.getElementById('imageUploadSection');
            if (state.config.puzzleType === 'image') {
                imageSection.style.display = 'block';
                loadImageGallery();
            } else {
                imageSection.style.display = 'none';
            }
        });
    });
    
    // Image source tabs
    const sourceTabs = document.querySelectorAll('.image-source-tab');
    sourceTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            sourceTabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const source = e.currentTarget.dataset.source;
            document.getElementById('uploadImageArea').style.display = source === 'upload' ? 'block' : 'none';
            document.getElementById('galleryImageArea').style.display = source === 'gallery' ? 'block' : 'none';
        });
    });
    
    // Image upload handler
    const imageInput = document.getElementById('puzzleImageUpload');
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    state.config.puzzleImage = event.target.result;
                    showImagePreview(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function loadImageGallery() {
    const gallery = document.getElementById('imageGallery');
    
    // Pre-loaded images from images folder - YOUR ACTUAL IMAGES
    const galleryImages = [
        {
            src: 'images/HappyHolidays.jpg',
            name: 'Holiday Celebration'
        },
        {
            src: 'images/Gingerbread.jpg',
            name: 'Festive Scene'
        },
        {
            src: 'images/Snowman.jpg',
            name: 'Winter Wonderland'
        },
        {
            src: 'images/MarshmellowSnowman.jpg',
            name: 'Marshmallow Snowman'
        },
        {
            src: 'images/Coffee.jpg',
            name: 'Cozy Coffee'
        }
    ];
    
    gallery.innerHTML = '';
    
    galleryImages.forEach((image, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'gallery-image-item';
        imgContainer.innerHTML = `
            <img src="${image.src}" alt="${image.name}" loading="lazy">
            <span class="gallery-image-name">${image.name}</span>
        `;
        
        imgContainer.addEventListener('click', () => {
            // Remove active class from all items
            document.querySelectorAll('.gallery-image-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to selected item
            imgContainer.classList.add('active');
            
            // Set as puzzle image
            state.config.puzzleImage = image.src;
            showImagePreview(image.src);
        });
        
        gallery.appendChild(imgContainer);
    });
}

function showImagePreview(imageSrc) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
        <p class="preview-label">Selected Image:</p>
        <img src="${imageSrc}" alt="Puzzle preview" style="max-width: 100%; border-radius: 8px;">
    `;
}

function launchGame() {
    state.config.difficulty = document.getElementById('difficultySelect').value;
    if (state.config.mode === 'competitive') {
        state.config.competitiveMode = document.getElementById('modeSelect').value;
    }
    
    showScreen('gameScreen');
    initializeGame();
}

// Game Initialization
function initializeGame() {
    state.reset();
    
    // Reset power-ups for new game
    state.customFeatures.powerups = {
        hint: 3,
        corner: 2,
        freeze: 1
    };
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
    document.getElementById('movesDisplay').textContent = state.game.moves;
    document.getElementById('timerDisplay').textContent = utils.formatTime(state.game.time);
    
    const efficiency = utils.calculateEfficiency(state.game.moves, state.game.optimalMoves);
    document.getElementById('efficiencyDisplay').textContent = efficiency + '%';
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
            returnToDashboard();
        }
    } else {
        returnToDashboard();
    }
}

function toggleSounds() {
    state.game.soundEnabled = !state.game.soundEnabled;
    
    const button = document.getElementById('soundButton');
    const icon = document.getElementById('soundIcon');
    
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
    
    document.getElementById('finalTime').textContent = utils.formatTime(state.game.time);
    document.getElementById('finalMoves').textContent = state.game.moves;
    document.getElementById('finalEfficiency').textContent = efficiency + '%';
    
    saveGameResult();
    
    // Custom Features Integration
    checkRewards(); // Check for earned rewards
    advanceStory(); // Progress the Christmas story
    changeThemeByPerformance(); // Change theme based on performance
    
    showScreen('victoryScreen');
}

function saveGameResult() {
    const result = {
        userId: state.user.id,
        size: state.config.size,
        difficulty: state.config.difficulty,
        mode: state.config.mode,
        time: state.game.time,
        moves: state.game.moves,
        efficiency: utils.calculateEfficiency(state.game.moves, state.game.optimalMoves),
        timestamp: new Date().toISOString()
    };
    
    // In production, this would send to backend
    console.log('Game result saved:', result);
    
    // Update local stats
    state.stats.totalGames++;
    const prevTotal = state.stats.totalGames - 1;
    state.stats.avgTime = (state.stats.avgTime * prevTotal + state.game.time) / state.stats.totalGames;
    state.stats.avgMoves = (state.stats.avgMoves * prevTotal + state.game.moves) / state.stats.totalGames;
}

function playAgain() {
    showScreen('configScreen');
}

// Leaderboard
function showLeaderboard() {
    showScreen('leaderboardScreen');
    loadLeaderboard('speed');
    
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            filterTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            loadLeaderboard(e.target.dataset.category);
        });
    });
}

function loadLeaderboard(category) {
    const mockData = generateMockLeaderboard(category);
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';
    
    mockData.forEach((entry, index) => {
        const row = tbody.insertRow();
        if (entry.username === state.user?.username) {
            row.classList.add('current-user');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.username}</td>
            <td>${utils.formatTime(entry.time)}</td>
            <td>${entry.moves}</td>
            <td>${entry.score}</td>
        `;
    });
}

function generateMockLeaderboard(category) {
    const players = [
        'Alexandra', 'Benjamin', 'Charlotte', 'Daniel', 'Emma',
        'Frederick', 'Grace', 'Harrison', 'Isabella', 'James'
    ];
    
    const data = players.map((name, i) => {
        const time = 45 + i * 12;
        const moves = 55 + i * 8;
        const score = 1000 - i * 85;
        
        return { username: i === 0 && state.user ? state.user.username : name, time, moves, score };
    });
    
    if (category === 'speed') {
        return data.sort((a, b) => a.time - b.time);
    } else if (category === 'moves') {
        return data.sort((a, b) => a.moves - b.moves);
    } else {
        return data.sort((a, b) => b.score - a.score);
    }
}

// User Statistics
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

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    // Close stats modal
    const statsModal = document.getElementById('statsModal');
    if (statsModal && e.target === statsModal) {
        closeStatsModal();
    }
    
    // Close reward modal
    const rewardModal = document.getElementById('rewardModal');
    if (rewardModal && e.target === rewardModal) {
        closeRewardModal();
    }
    
    // Close story modal
    const storyModal = document.getElementById('storyModal');
    if (storyModal && e.target === storyModal) {
        closeStoryModal();
    }
});

// Keyboard Controls
function initKeyboardControls() {
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
}

// ========================================
// CUSTOM UNDERGRADUATE FEATURES
// ========================================

// Feature 1: Adaptive Arctic Atmosphere System
const themes = {
    aurora: {
        name: 'Northern Lights',
        colors: { primary: '#2D5F5D', accent: '#5DADE2' },
        description: 'Mystical aurora borealis'
    },
    workshop: {
        name: 'Santa\'s Workshop',
        colors: { primary: '#6B4423', accent: '#D4AF37' },
        description: 'Warm workshop glow'
    },
    icepalace: {
        name: 'Ice Palace',
        colors: { primary: '#B8E6F5', accent: '#4A90E2' },
        description: 'Crystalline ice structures'
    },
    candlelight: {
        name: 'Candlelight Christmas',
        colors: { primary: '#8B0000', accent: '#FFD700' },
        description: 'Warm candlelit evening'
    }
};

function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    menu.classList.toggle('active');
}

function setTheme(themeName) {
    state.customFeatures.theme = themeName;
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    toggleThemeMenu();
    
    console.log(`Theme changed to: ${themes[themeName].name}`);
}

function autoChangeTheme() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 10) {
        setTheme('aurora');  // Dawn - Northern Lights
    } else if (hour >= 10 && hour < 16) {
        setTheme('workshop');  // Day - Workshop
    } else if (hour >= 16 && hour < 20) {
        setTheme('candlelight');  // Evening - Candlelight
    } else {
        setTheme('icepalace');  // Night - Ice Palace
    }
}

function changeThemeByPerformance() {
    const efficiency = utils.calculateEfficiency(state.game.moves, state.game.optimalMoves);
    
    if (efficiency >= 95) {
        setTheme('aurora');  // Exceptional - Northern Lights
    } else if (efficiency >= 85) {
        setTheme('workshop');  // Great - Workshop
    } else if (efficiency >= 70) {
        setTheme('candlelight');  // Good - Candlelight  
    } else {
        setTheme('icepalace');  // Keep trying - Ice Palace
    }
}

// Feature 2: Reindeer's Achievement Badges System
const rewards = [
    { id: 1, name: 'Rudolph\'s First Flight', description: 'Complete your first puzzle', icon: '🦌', requirement: { type: 'games', value: 1 } },
    { id: 2, name: 'Dasher\'s Speed', description: 'Complete a puzzle in under 45 seconds', icon: '⚡', requirement: { type: 'time', value: 45 } },
    { id: 3, name: 'Prancer\'s Precision', description: 'Achieve 98% efficiency or higher', icon: '🎯', requirement: { type: 'efficiency', value: 98 } },
    { id: 4, name: 'Vixen\'s Dedication', description: 'Complete 15 puzzles', icon: '🌟', requirement: { type: 'games', value: 15 } },
    { id: 5, name: 'Comet\'s Mastery', description: 'Complete 40 puzzles', icon: '☄️', requirement: { type: 'games', value: 40 } },
    { id: 6, name: 'Cupid\'s Perfect Heart', description: 'Solve with exact optimal moves', icon: '💝', requirement: { type: 'optimal', value: true } },
    { id: 7, name: 'Donner\'s Thunder', description: 'Play during a stormy night (12AM-4AM)', icon: '⚡', requirement: { type: 'time_of_day', value: 'midnight' } },
    { id: 8, name: 'Blitzen\'s Lightning', description: 'Complete puzzle in under 30 seconds', icon: '⚡', requirement: { type: 'time', value: 30 } },
    { id: 9, name: 'North Star Navigator', description: 'Complete 5 hard difficulty puzzles', icon: '⭐', requirement: { type: 'difficulty', value: 'hard' } },
    { id: 10, name: 'Arctic Explorer', description: 'Try all four themes', icon: '🧭', requirement: { type: 'themes', value: 4 } }
];

function checkRewards() {
    const efficiency = utils.calculateEfficiency(state.game.moves, state.game.optimalMoves);
    const hour = new Date().getHours();
    
    rewards.forEach(reward => {
        if (state.customFeatures.rewards.includes(reward.id)) return;
        
        let earned = false;
        
        switch(reward.requirement.type) {
            case 'time':
                if (state.game.time <= reward.requirement.value) earned = true;
                break;
            case 'efficiency':
                if (efficiency >= reward.requirement.value) earned = true;
                break;
            case 'games':
                if (state.stats.totalGames >= reward.requirement.value) earned = true;
                break;
            case 'optimal':
                if (state.game.moves === state.game.optimalMoves) earned = true;
                break;
            case 'time_of_day':
                if (reward.requirement.value === 'midnight' && (hour >= 0 && hour < 4)) earned = true;
                break;
            case 'difficulty':
                if (state.config.difficulty === reward.requirement.value) earned = true;
                break;
        }
        
        if (earned) {
            state.customFeatures.rewards.push(reward.id);
            showReward(reward);
        }
    });
}

function showReward(reward) {
    const modal = document.getElementById('rewardModal');
    document.getElementById('rewardIcon').textContent = reward.icon;
    document.getElementById('rewardTitle').textContent = reward.name;
    document.getElementById('rewardDescription').textContent = reward.description;
    document.getElementById('rewardItem').textContent = `${reward.icon} ${reward.name}`;
    
    modal.classList.add('active');
    
    console.log('Badge earned:', reward);
}

function closeRewardModal() {
    document.getElementById('rewardModal').classList.remove('active');
}

// Feature 3: Reindeer's Gift Power-ups (Unique to this implementation)
function updatePowerupCounts() {
    document.getElementById('hintCount').textContent = state.customFeatures.powerups.hint;
    document.getElementById('cornerCount').textContent = state.customFeatures.powerups.corner;
    document.getElementById('freezeCount').textContent = state.customFeatures.powerups.freeze;
    
    document.getElementById('hintPowerup').disabled = state.customFeatures.powerups.hint <= 0;
    document.getElementById('cornerPowerup').disabled = state.customFeatures.powerups.corner <= 0;
    document.getElementById('freezePowerup').disabled = state.customFeatures.powerups.freeze <= 0;
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
    // Shows the optimal path for next 3 moves with glowing trail
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
    
    console.log('Reindeer Vision activated! Follow the glowing path.');
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
    
    console.log('Santa\'s Helper activated! Making 3 optimal moves...');
    makeOptimalMove();
}

function activateNorthPoleBlizzard() {
    // Slows down time by 50% for 45 seconds
    const originalInterval = state.game.timer ? 1000 : null;
    
    if (state.game.timer) {
        clearInterval(state.game.timer);
        
        // Slower timer (2 seconds real time = 1 second game time)
        state.game.timer = setInterval(() => {
            state.game.time++;
            updateTimer();
        }, 2000);
        
        console.log('North Pole Blizzard activated! Time slowed by 50% for 45 seconds.');
        
        // Reset to normal speed after 45 seconds
        setTimeout(() => {
            if (state.game.isActive && state.game.timer) {
                clearInterval(state.game.timer);
                state.game.timer = setInterval(() => {
                    state.game.time++;
                    updateTimer();
                }, 1000);
                console.log('Time returned to normal speed.');
            }
        }, 45000);
    }
}

// Feature 4: Santa's Lost Delivery Route Story
const christmasStory = [
    {
        chapter: 1,
        title: 'The Missing Map',
        text: 'On Christmas Eve, Santa discovered his magical delivery map had been scrambled into puzzle pieces. Without it, he cannot find the route to deliver presents to all the children. Each puzzle you solve helps restore one piece of the map.'
    },
    {
        chapter: 2,
        title: 'The First Route',
        text: 'As the first piece clicks into place, a faint golden glow illuminates the North Pole region. "Excellent work!" Mrs. Claus exclaims. "Keep going - we need the complete map before midnight!"'
    },
    {
        chapter: 3,
        title: 'The Reindeer\'s Clue',
        text: 'Rudolph approaches with an old compass in his mouth. "This belonged to my great-grandfather," he says. "The map pieces respond to skilled puzzle solvers. Your growing expertise is awakening the magic!"'
    },
    {
        chapter: 4,
        title: 'The Elf Engineers',
        text: 'A team of elf engineers examines your work. "Fascinating! The map is self-assembling based on the solver\'s precision. The more accurate your moves, the clearer the route becomes," their leader explains.'
    },
    {
        chapter: 5,
        title: 'The Toy Workshop Discovery',
        text: 'Deep in the toy workshop, you find ancient instructions: "The Christmas Map reveals itself only to those with patience and wisdom. Rush not, for each thoughtful move brings clarity to the path ahead."'
    },
    {
        chapter: 6,
        title: 'The Northern Lights Guide',
        text: 'The aurora borealis begins dancing overhead, forming patterns that match your puzzle solutions. The northern lights themselves are guiding you, showing you\'re on the right path to restoring Santa\'s route.'
    },
    {
        chapter: 7,
        title: 'The Crystal Globe',
        text: 'Mrs. Claus brings out a crystal globe showing the world. With each puzzle piece restored, new delivery routes illuminate on the globe\'s surface. Cities and towns light up one by one, waiting for their presents.'
    },
    {
        chapter: 8,
        title: 'The Time Crunch',
        text: 'The clock tower chimes - only two hours until midnight! "You\'re doing wonderfully," Santa encourages. "Just a few more pieces and we\'ll have the complete route. The children are counting on us!"'
    },
    {
        chapter: 9,
        title: 'The Final Pieces',
        text: 'The map is nearly complete. You can see Santa\'s entire flight path now - starting from the International Date Line, spiraling across time zones, visiting every child who believes. The last piece is the most crucial.'
    },
    {
        chapter: 10,
        title: 'Christmas Saved',
        text: 'With a brilliant flash of light, the final piece locks into place! The complete map hovers before you, glowing with Christmas magic. Santa grabs his coat. "Thanks to you, every child will wake to presents tomorrow. You\'ve saved Christmas!" The reindeer take flight, following the restored route you helped create.'
    }
];

function showStoryModal() {
    const modal = document.getElementById('storyModal');
    updateStoryContent();
    modal.classList.add('active');
}

function closeStoryModal() {
    document.getElementById('storyModal').classList.remove('active');
}

function updateStoryContent() {
    const chapter = christmasStory[state.customFeatures.storyProgress] || christmasStory[0];
    
    document.getElementById('storyChapterTitle').textContent = `Chapter ${chapter.chapter}: ${chapter.title}`;
    document.getElementById('storyText').textContent = chapter.text;
    document.getElementById('storyProgress').textContent = `${state.customFeatures.storyProgress + 1}/${christmasStory.length}`;
}

function advanceStory() {
    if (state.customFeatures.storyProgress < christmasStory.length - 1) {
        state.customFeatures.storyProgress++;
        showStoryModal();
        
        // Save progress to localStorage
        localStorage.setItem('storyProgress', state.customFeatures.storyProgress);
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initConfig();
    initKeyboardControls();
    checkSession();
    initSnowfall(); // Add snowfall effect
    
    // Load custom features
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        autoChangeTheme(); // Set theme based on time of day
    }
    
    const savedStoryProgress = localStorage.getItem('storyProgress');
    if (savedStoryProgress) {
        state.customFeatures.storyProgress = parseInt(savedStoryProgress);
    }
    
    console.log('Holiday Puzzle Challenge initialized with custom features');
    console.log('- Adaptive Arctic Atmosphere System: Active');
    console.log('- Reindeer\'s Achievement Badges: Active');
    console.log('- Reindeer\'s Gift Power-ups: Active');
    console.log('- Santa\'s Lost Delivery Route Story: Active');
});

// Snowfall Effect
function initSnowfall() {
    const container = document.getElementById('snowfall-container');
    const snowflakeCount = 50; // Number of snowflakes
    
    for (let i = 0; i < snowflakeCount; i++) {
        createSnowflake(container);
    }
    
    // Continuously create new snowflakes
    setInterval(() => {
        createSnowflake(container);
    }, 300);
}

function createSnowflake(container) {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.textContent = '❄';
    
    // Random horizontal position
    snowflake.style.left = Math.random() * 100 + '%';
    
    // Random size
    const size = Math.random() * 0.5 + 0.5; // 0.5 to 1
    snowflake.style.fontSize = size + 'em';
    
    // Random animation duration (fall speed)
    const duration = Math.random() * 3 + 5; // 5 to 8 seconds
    snowflake.style.animationDuration = duration + 's';
    
    // Random delay
    const delay = Math.random() * 2;
    snowflake.style.animationDelay = delay + 's';
    
    // Random opacity
    snowflake.style.opacity = Math.random() * 0.6 + 0.4; // 0.4 to 1
    
    container.appendChild(snowflake);
    
    // Remove snowflake after animation completes
    setTimeout(() => {
        if (snowflake.parentNode) {
            snowflake.remove();
        }
    }, (duration + delay) * 1000);
}