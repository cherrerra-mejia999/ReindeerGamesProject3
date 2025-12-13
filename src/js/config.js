// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// Game configuration and settings
// ═══════════════════════════════════════════════════════════════════

// Initialize configuration on page load
document.addEventListener('DOMContentLoaded', () => {
    initConfig();
    loadGameMode();
    
    // Set theme based on time of day
    if (typeof autoChangeTheme === 'function') {
        autoChangeTheme();
    }
});

function loadGameMode() {
    const savedMode = localStorage.getItem('gameMode');
    if (savedMode) {
        state.config.mode = savedMode;
        
        // Show/hide competitive settings
        const competitiveSettings = document.getElementById('competitiveSettings');
        if (competitiveSettings) {
            competitiveSettings.style.display = savedMode === 'competitive' ? 'block' : 'none';
        }
    }
}

function initConfig() {
    // Size selector
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
    
    // Pre-loaded images from images folder
    const galleryImages = [
        {
            src: '../images/HappyHolidays.jpg',
            name: 'Holiday Celebration'
        },
        {
            src: '../images/Gingerbread.jpg',
            name: 'Festive Scene'
        },
        {
            src: '../images/Snowman.jpg',
            name: 'Winter Wonderland'
        },
        {
            src: '../images/MarshmellowSnowman.jpg',
            name: 'Marshmallow Snowman'
        },
        {
            src: '../images/Coffee.jpg',
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
    
    // Save config to localStorage
    localStorage.setItem('gameConfig', JSON.stringify(state.config));
    
    // Redirect to game page
    window.location.href = 'game.html';
}