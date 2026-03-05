/**
 * ZIB Platform Manager (Controller Hub)
 * Handles global stats, screen transitions, and shared UI components (Shop, Ranking, Settings).
 */
class PlatformManager {
    constructor() {
        // Global State
        this.data = {
            stars: parseInt(localStorage.getItem('zib_stars')) || 1250,
            exp: parseInt(localStorage.getItem('zib_exp')) || 0,
            level: parseInt(localStorage.getItem('zib_level')) || 1,
            playerName: localStorage.getItem('zootopia_user_name') || "주디 홉스",
            quests: JSON.parse(localStorage.getItem('zib_quests')) || {
                mahjongMatches: { current: 0, target: 20, reward: 200, completed: false }
            },
            inventory: JSON.parse(localStorage.getItem('zib_inventory')) || {
                hint: 3,
                shuffle: 2,
                bomb: 1,
                undo: 3
            }
        };

        // Screen Elements
        this.screens = {
            home: document.getElementById('platformHome'),
            mahjongLobby: document.getElementById('startScreen'),
            mahjongGame: document.getElementById('mahjongGameScreen'),
            nonogramGame: document.getElementById('nonogramGameScreen'),
            ranking: document.getElementById('rankingScreen'),
            shop: document.getElementById('shopModal'),
            settings: document.getElementById('settingsModal'),
            help: document.getElementById('helpModal'),
            gameOver: document.getElementById('gameOverModal')
        };

        // Platform UI Elements
        this.ui = {
            stars: document.getElementById('platformStars'),
            level: document.getElementById('platformLevel'),
            name: document.querySelector('.player-name'),
            questProgress: document.getElementById('questMahjongProgress'),
            rankingList: document.getElementById('rankingList')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.checkUserName();
    }

    checkUserName() {
        if (!localStorage.getItem('zootopia_user_name')) {
            const name = prompt("수사관님의 성명을 입력해주세요.", "주디 홉스");
            if (name) {
                this.data.playerName = name;
                localStorage.setItem('zootopia_user_name', name);
                this.updateUI();
            }
        }
    }

    setupEventListeners() {
        // Sidebar & Navigation
        document.getElementById('sideRankingBtn')?.addEventListener('click', () => this.showRanking());
        document.getElementById('sideShopBtn')?.addEventListener('click', () => this.showShop());
        document.getElementById('sideSettingsBtn')?.addEventListener('click', () => this.showSettings());

        document.getElementById('showPlatformRankingBtn')?.addEventListener('click', () => this.showRanking());
        document.getElementById('showShopBtn')?.addEventListener('click', () => this.showShop());
        document.getElementById('showPlatformSettingsBtn')?.addEventListener('click', () => this.showSettings());

        // Close Buttons
        document.getElementById('closeRankingBtn')?.addEventListener('click', () => this.hideModal('ranking'));
        document.getElementById('closeShopBtn')?.addEventListener('click', () => this.hideModal('shop'));
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.hideModal('settings'));
        document.getElementById('closeHelpBtn')?.addEventListener('click', () => this.hideModal('help'));
        document.getElementById('helpConfirmBtn')?.addEventListener('click', () => this.hideModal('help'));

        // Game Launchers
        document.getElementById('heroLaunchMahjongBtn')?.addEventListener('click', () => this.launchGame('mahjong'));
        document.getElementById('launchMahjongBtn')?.addEventListener('click', () => this.launchGame('mahjongLobby'));
        document.getElementById('launchNonogramBtn')?.addEventListener('click', () => this.launchGame('nonogram'));

        // Mahjong Specific
        document.getElementById('startGameBtn')?.addEventListener('click', () => this.launchGame('mahjong'));
        document.getElementById('backToPlatformBtn')?.addEventListener('click', () => this.switchScreen('home'));
        document.getElementById('homeBtn')?.addEventListener('click', () => this.confirmGoHome());
        document.getElementById('modalHomeBtn')?.addEventListener('click', () => this.switchScreen('home'));

        // Shop Purchase Logic
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.onclick = (e) => {
                const itemCard = e.target.closest('.shop-item');
                const type = itemCard.dataset.item;
                const price = parseInt(itemCard.dataset.price);

                if (this.data.stars >= price) {
                    this.data.stars -= price;
                    this.data.inventory[type] = (this.data.inventory[type] || 0) + (type === 'hint' || type === 'undo' ? 3 : type === 'shuffle' ? 2 : 1);
                    this.saveData();
                    this.updateUI();
                    if (window.mahjongGame) window.mahjongGame.updateUI(); // Sync to active game
                    alert("구매 완료! 장비함에 추가되었습니다.");
                } else {
                    alert("별이 부족합니다.");
                }
            };
        });
    }

    switchScreen(screenKey) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen && !screen.classList.contains('hidden')) {
                screen.classList.add('hidden');
            }
        });

        // Show target screen
        const target = this.screens[screenKey];
        if (target) {
            target.classList.remove('hidden');
        }
    }

    launchGame(gameKey) {
        this.switchScreen(gameKey);

        if (gameKey === 'mahjong') {
            if (!window.mahjongGame) window.mahjongGame = new MahjongGame(this);
            setTimeout(() => window.mahjongGame.start(), 50);
        } else if (gameKey === 'nonogram') {
            if (!window.nonogramGame) window.nonogramGame = new NonogramGame(this);
            window.nonogramGame.init();
        }
    }

    confirmGoHome() {
        if (confirm("수사를 중단하고 플랫폼 홈으로 돌아가시겠습니까?")) {
            this.switchScreen('home');
        }
    }

    updateUI() {
        if (this.ui.stars) this.ui.stars.innerText = this.data.stars.toLocaleString();
        if (this.ui.level) this.ui.level.innerText = this.data.level;
        if (this.ui.name) this.ui.name.innerText = `${this.data.playerName} 수사관`;

        // Quest Progress
        if (this.ui.questProgress) {
            const q = this.data.quests.mahjongMatches;
            const percent = Math.min((q.current / q.target) * 100, 100);
            this.ui.questProgress.style.width = `${percent}%`;
        }
    }

    saveData() {
        localStorage.setItem('zib_stars', this.data.stars);
        localStorage.setItem('zib_exp', this.data.exp);
        localStorage.setItem('zib_level', this.data.level);
        localStorage.setItem('zib_quests', JSON.stringify(this.data.quests));
        localStorage.setItem('zib_inventory', JSON.stringify(this.data.inventory));
    }

    addExp(amount) {
        this.data.exp += amount;
        const nextLevelExp = this.data.level * 1000;
        if (this.data.exp >= nextLevelExp) {
            this.data.level++;
            this.data.exp -= nextLevelExp;
            alert(`축하합니다! 수사관 등급이 LV.${this.data.level}로 올랐습니다!`);
        }
        this.saveData();
        this.updateUI();
    }

    addStars(amount) {
        this.data.stars += amount;
        this.saveData();
        this.updateUI();
    }

    showRanking() {
        this.screens.ranking.classList.remove('hidden');
        this.loadRankings();
    }

    showShop() {
        this.screens.shop.classList.remove('hidden');
    }

    showSettings() {
        this.screens.settings.classList.remove('hidden');
    }

    hideModal(modalKey) {
        this.screens[modalKey]?.classList.add('hidden');
    }

    loadRankings() {
        this.ui.rankingList.innerHTML = '<div class="loading">수사 기록을 불러오는 중...</div>';

        // Fallback to local rankings
        let rankings = JSON.parse(localStorage.getItem('zib_local_rankings')) || [];

        // Check Firebase if configured
        const isFirebaseValid = typeof database !== 'undefined' &&
            database && database.app && database.app.options &&
            database.app.options.databaseURL &&
            database.app.options.databaseURL !== "YOUR_DATABASE_URL";

        if (isFirebaseValid) {
            database.ref('rankings').orderByChild('score').limitToLast(10).once('value')
                .then(snapshot => this.renderRankings(snapshot))
                .catch(() => this.displayLocalRankings(rankings));
        } else {
            this.displayLocalRankings(rankings);
        }
    }

    displayLocalRankings(rankings) {
        if (rankings.length === 0) {
            this.ui.rankingList.innerHTML = '<div class="empty">기록이 없습니다. 첫 수사를 완료해보세요!</div>';
            return;
        }
        this.ui.rankingList.innerHTML = rankings.map((r, i) => `
            <div class="rank-item">
                <span class="rank-num">${i + 1}</span>
                <span class="rank-name">${r.name}</span>
                <span class="rank-score">${r.score ? r.score.toLocaleString() : 0}점 (Stage ${r.stage})</span>
            </div>
        `).join('');
    }

    renderRankings(snapshot) {
        let entries = [];
        snapshot.forEach(child => {
            entries.push({ name: child.key, ...child.val() });
        });
        entries.sort((a, b) => b.score - a.score);
        this.displayLocalRankings(entries);
    }
}

// Global initialization
window.addEventListener('load', () => {
    window.platform = new PlatformManager();
});
