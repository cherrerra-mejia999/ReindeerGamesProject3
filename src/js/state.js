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
            optimalMoves: 0,
            sessionId: null
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
            optimalMoves: 0,
            sessionId: null
        };
    }
}

const state = new GameState();