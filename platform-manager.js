/**
 * ZIB Platform Manager - MPA Version
 * Handles shared global state (Local Storage) and page-local UI components.
 */
class PlatformManager {
    constructor() {
        this.data = {
            stars: parseInt(localStorage.getItem('zib_stars')) || 1250,
            inventory: JSON.parse(localStorage.getItem('zib_inventory')) || {
                hint: 3,
                shuffle: 2,
                bomb: 1,
                undo: 3
            }
        };

        // Modal/Screen elements on the CURRENT page
        this.screens = {
            gameOver: document.getElementById('gameOverModal'),
            win: document.getElementById('winOverlay')
        };

        this.init();
    }

    init() {
        this.updateUI();
        console.log("ZIB Platform (MPA) Initialized");
    }

    updateUI() {
        const starEl = document.getElementById('appStars');
        if (starEl) starEl.innerText = this.data.stars.toLocaleString();
    }

    // Still useful for showing local modals like GameOver
    switchScreen(screenKey) {
        if (this.screens[screenKey]) {
            this.screens[screenKey].style.display = 'flex';
        } else {
            console.warn(`Screen/Modal ${screenKey} not found on this page.`);
        }
    }

    addStars(amount) {
        this.data.stars += amount;
        this.save();
        this.updateUI();
    }

    addExp() { /* Simplified */ }

    save() {
        localStorage.setItem('zib_stars', this.data.stars);
        localStorage.setItem('zib_inventory', JSON.stringify(this.data.inventory));
    }
}

// Global initialization
window.addEventListener('load', () => {
    window.platform = new PlatformManager();
});
