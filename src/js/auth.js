// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkSession();
    
    // Set theme based on time of day
    if (typeof autoChangeTheme === 'function') {
        autoChangeTheme();
    }
});

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

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        utils.showNotification('Please enter all fields', 'error');
        return;
    }

    // Call API to login
    const result = await loginUser(username, password);
    
    if (result.success) {
        // Ensure user object has 'id' field for compatibility
        result.data.id = result.data.user_id;
        
        state.user = result.data;
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        
        // Load user profile (powerups, story progress, theme)
        const profile = await getUserProfile(result.data.user_id);
        if (profile.success) {
            localStorage.setItem('powerups', JSON.stringify({
                hint: profile.data.powerup_hint,
                corner: profile.data.powerup_corner,
                freeze: profile.data.powerup_freeze
            }));
            localStorage.setItem('storyProgress', profile.data.story_progress);
            localStorage.setItem('theme', profile.data.current_theme);
        }
        
        window.location.href = 'pages/dashboard.html';
    } else {
        alert(result.message);
    }
}

async function handleRegister(e) {
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

    // Call API to create account
    const result = await registerUser(username, email, password);
    
    if (result.success) {
        // Ensure user object has 'id' field for compatibility
        result.data.id = result.data.user_id;
        
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        
        // Load user profile (gets initial powerups and story progress)
        const profile = await getUserProfile(result.data.user_id);
        if (profile.success) {
            localStorage.setItem('powerups', JSON.stringify({
                hint: profile.data.powerup_hint,
                corner: profile.data.powerup_corner,
                freeze: profile.data.powerup_freeze
            }));
            localStorage.setItem('storyProgress', profile.data.story_progress);
        }
        
        alert('Account created successfully!');
        window.location.href = 'pages/dashboard.html';
    } else {
        alert(result.message);
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('user');
        state.user = null;
        state.reset();
        window.location.href = '../index.html';
    }
}

function checkSession() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        // If on login page and already logged in, redirect to dashboard
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            window.location.href = 'pages/dashboard.html';
        }
    } else {
        // If not on login page and not logged in, redirect to login
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            window.location.href = '../index.html';
        }
    }
}