function initSnowfall() {
    const container = document.getElementById('snowfall-container');
    if (!container) return;
    
    const snowflakeCount = 50;
    
    for (let i = 0; i < snowflakeCount; i++) {
        createSnowflake(container);
    }
    
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

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnowfall);
} else {
    initSnowfall();
}