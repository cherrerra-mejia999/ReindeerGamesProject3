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
    if (menu) {
        menu.classList.toggle('active');
    }
}

function setTheme(themeName) {
    state.customFeatures.theme = themeName;
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
    const menu = document.getElementById('themeMenu');
    if (menu) {
        menu.classList.remove('active');
    }
    
    console.log(`🎨 Theme changed to: ${themes[themeName].name}`);
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

// Load saved theme on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSavedTheme);
} else {
    loadSavedTheme();
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        state.customFeatures.theme = savedTheme;
    }
}

// Load saved story progress on page load
function loadStoryProgress() {
    const savedProgress = localStorage.getItem('storyProgress');
    if (savedProgress) {
        state.customFeatures.storyProgress = parseInt(savedProgress);
    }
}

// Load saved rewards on page load
function loadRewards() {
    const savedRewards = localStorage.getItem('rewards');
    if (savedRewards) {
        state.customFeatures.rewards = JSON.parse(savedRewards);
    }
}

// Load saved power-ups on page load
function loadPowerups() {
    const savedPowerups = localStorage.getItem('powerups');
    if (savedPowerups) {
        state.customFeatures.powerups = JSON.parse(savedPowerups);
    }
}

// Initialize features on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadStoryProgress();
        loadRewards();
        loadPowerups();
    });
} else {
    loadStoryProgress();
    loadRewards();
    loadPowerups();
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
    let rewardShown = false;
    
    rewards.forEach(reward => {
        if (state.customFeatures.rewards.includes(reward.id)) return;
        if (rewardShown) return; // Only show one reward at a time
        
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
            localStorage.setItem('rewards', JSON.stringify(state.customFeatures.rewards));
            showReward(reward);
            rewardShown = true;
        }
    });
    
    return rewardShown;
}

function showReward(reward) {
    const modal = document.getElementById('rewardModal');
    if (!modal) return;
    
    const iconEl = document.getElementById('rewardIcon');
    const titleEl = document.getElementById('rewardTitle');
    const descEl = document.getElementById('rewardDescription');
    const itemEl = document.getElementById('rewardItem');
    
    if (iconEl) iconEl.textContent = reward.icon;
    if (titleEl) titleEl.textContent = reward.name;
    if (descEl) descEl.textContent = reward.description;
    if (itemEl) itemEl.textContent = `${reward.icon} ${reward.name}`;
    
    modal.classList.add('active');
    
    console.log('🏆 Badge earned:', reward.name);
}

function closeRewardModal() {
    const modal = document.getElementById('rewardModal');
    if (modal) modal.classList.remove('active');
    
    // Grant power-up as reward!
    grantPowerupReward();
    
    // If we're on game page and just completed, show story modal next
    if (window.location.pathname.includes('game.html') && !state.game.isActive) {
        setTimeout(() => {
            showCurrentStoryChapter();
        }, 400);
    }
}

function grantPowerupReward() {
    // Each reward earned gives 1 random power-up!
    const powerupTypes = ['hint', 'corner', 'freeze'];
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    state.customFeatures.powerups[randomType]++;
    
    // Save power-ups to localStorage
    localStorage.setItem('powerups', JSON.stringify(state.customFeatures.powerups));
    
    console.log(`🎁 Power-up granted: ${randomType} (now have ${state.customFeatures.powerups[randomType]})`);
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
        text: 'With the first piece in place, a faint glow appears showing the path to the first neighborhood. The reindeer paw the ground eagerly, ready to begin their journey.'
    },
    {
        chapter: 3,
        title: 'Through the Northern Lights',
        text: 'As more pieces come together, the route leads through the spectacular aurora borealis. The dancing lights seem to cheer you on as the map becomes clearer.'
    },
    {
        chapter: 4,
        title: 'The Ice Palace Detour',
        text: 'The map reveals an unexpected detour through an ice palace. Its crystalline halls reflect the starlight, creating a magical pathway through the frozen north.'
    },
    {
        chapter: 5,
        title: 'Workshop Stop',
        text: 'The route passes by Santa\'s workshop where the elves wave encouragement. They\'ve been working all year for this moment, and the map is showing the way!'
    },
    {
        chapter: 6,
        title: 'Over Mountain Peaks',
        text: 'The next segment shows a daring flight over snow-capped mountains. Rudolph\'s nose glows brighter as the path becomes more challenging but the destination grows nearer.'
    },
    {
        chapter: 7,
        title: 'Through the Clouds',
        text: 'Nearly complete now! The map shows the route through thick, fluffy clouds. Each solved piece makes the way forward clearer and Christmas delivery more certain.'
    },
    {
        chapter: 8,
        title: 'The Starlit Path',
        text: 'With most pieces restored, stars begin to appear on the map, each one marking a home waiting for Christmas magic. The end is in sight!'
    },
    {
        chapter: 9,
        title: 'The Final Stretch',
        text: 'Just one more piece! The map shows nearly complete now, with the final route glowing golden. Santa and the reindeer are ready for the grand departure.'
    },
    {
        chapter: 10,
        title: 'Christmas Saved!',
        text: 'The map is complete! The magical route shines brilliantly, showing every home, every child, every moment of Christmas magic to come. Thanks to you, Santa\'s sleigh takes flight right on schedule. Merry Christmas to all, and to all a good night!'
    }
];

function advanceStory() {
    state.customFeatures.storyProgress++;
    localStorage.setItem('storyProgress', state.customFeatures.storyProgress);
    
    // Don't show modal here - let caller decide when to show it
}

function showCurrentStoryChapter() {
    // Show the current story chapter (called explicitly)
    if (state.customFeatures.storyProgress > 0 && state.customFeatures.storyProgress <= christmasStory.length) {
        showStory();
    }
}

function showStory() {
    const modal = document.getElementById('storyModal');
    if (!modal) return;
    
    const chapterIndex = state.customFeatures.storyProgress - 1;
    if (chapterIndex < 0 || chapterIndex >= christmasStory.length) return;
    
    const chapter = christmasStory[chapterIndex];
    
    const titleEl = document.getElementById('storyChapterTitle');
    const textEl = document.getElementById('storyText');
    const progressEl = document.getElementById('storyProgress');
    
    if (titleEl) titleEl.textContent = `Chapter ${chapter.chapter}: ${chapter.title}`;
    if (textEl) textEl.textContent = chapter.text;
    if (progressEl) progressEl.textContent = `${state.customFeatures.storyProgress}/10`;
    
    modal.classList.add('active');
    
    console.log(`📖 Story progress: Chapter ${chapter.chapter} unlocked!`);
}

function closeStoryModal() {
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.remove('active');
    
    // If we're on the game page and just completed a game, redirect to victory
    if (window.location.pathname.includes('game.html') && !state.game.isActive) {
        // Small delay to ensure modal closes gracefully
        setTimeout(() => {
            window.location.href = 'victory.html';
        }, 300);
    }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    const rewardModal = document.getElementById('rewardModal');
    if (rewardModal && e.target === rewardModal) {
        closeRewardModal();
    }
    
    const storyModal = document.getElementById('storyModal');
    if (storyModal && e.target === storyModal) {
        closeStoryModal();
    }
});