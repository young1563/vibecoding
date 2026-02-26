/**
 * Zootopia 2: Mahjong Master - Core Game Logic
 * Updated: Removed time limit, added Firebase Ranking System.
 */
class MahjongGame {
    constructor() {
        this.boardElement = document.getElementById('mahjongBoard');
        this.stageText = document.getElementById('currentStage');
        this.scoreText = document.getElementById('scoreValue');
        this.dialogueText = document.getElementById('dialogueText');
        this.avatarText = document.getElementById('activeChar');

        this.startScreen = document.getElementById('startScreen');
        this.rankingScreen = document.getElementById('rankingScreen');
        this.rankingList = document.getElementById('rankingList');
        this.gameHeader = document.querySelector('.game-header');
        this.gameFooter = document.querySelector('.game-footer');
        this.mahjongArea = document.querySelector('.mahjong-area');

        this.stage = 1;
        this.score = 0;
        this.selectedTile = null;
        this.tiles = [];
        this.tileSymbols = [
            '🐰', '🦊', '👮', '🥕', '🍩', '🚔', '🦥', '🦁',
            '🐯', '⚖️', '⛓️', '🚨', '📻', '📢', '🏙️', '🍎',
            '🍍', '🍹', '🍦', '🍰', '🍪', '🥨', '🥜', '🍓'
        ];

        this.init();
    }

    init() {
        this.gameHeader.classList.add('hidden');
        this.gameFooter.classList.add('hidden');
        this.mahjongArea.classList.add('hidden');

        this.setupControls();
        this.updateUI();
    }

    startGame() {
        this.startScreen.classList.add('hidden');
        this.gameHeader.classList.remove('hidden');
        this.gameFooter.classList.remove('hidden');
        this.mahjongArea.classList.remove('hidden');

        this.createStage();
        this.sayMsg("주디", "시간 제한이 없으니 차근차근 해결해보자고!");
    }

    createStage() {
        this.boardElement.innerHTML = '';
        this.tiles = [];
        this.selectedTile = null;

        const pairCount = Math.min(20 + this.stage * 10, 72);
        const layoutSymbols = [];
        for (let i = 0; i < pairCount; i++) {
            const sym = this.tileSymbols[i % this.tileSymbols.length];
            layoutSymbols.push(sym, sym);
        }

        this.shuffle(layoutSymbols);
        this.generateLayout(layoutSymbols);
        this.checkBlockedStatus();
    }

    generateLayout(symbols) {
        let symIdx = 0;
        const layers = Math.min(3 + Math.floor(this.stage / 2), 5);
        const gridW = 10;
        const gridH = 8;
        const tileW = 50;
        const tileH = 70;

        const centerX = this.boardElement.clientWidth / 2;
        const centerY = this.boardElement.clientHeight / 2;

        for (let z = 0; z < layers; z++) {
            const rowCount = 6 - z;
            const colCount = 8 - z;

            for (let r = 0; r < rowCount; r++) {
                for (let c = 0; c < colCount; c++) {
                    if (symIdx >= symbols.length) break;

                    if (Math.random() > 0.1 + (z * 0.1)) {
                        const tile = document.createElement('div');
                        tile.classList.add('tile');
                        tile.innerText = symbols[symIdx++];

                        const x = centerX - (colCount * tileW / 2) + (c * tileW) - (z * 5);
                        const y = centerY - (rowCount * tileH / 2) + (r * tileH) - (z * 5);

                        tile.style.left = `${x}px`;
                        tile.style.top = `${y}px`;
                        tile.style.zIndex = z * 10;

                        const tileData = {
                            element: tile,
                            x: c, y: r, z: z,
                            symbol: tile.innerText,
                            removed: false
                        };

                        tile.onclick = () => this.handleTileClick(tileData);
                        this.boardElement.appendChild(tile);
                        this.tiles.push(tileData);
                    }
                }
                if (symIdx >= symbols.length) break;
            }
        }
    }

    handleTileClick(tile) {
        if (this.isBlocked(tile) || tile.removed) return;

        if (this.selectedTile === null) {
            this.selectedTile = tile;
            tile.element.classList.add('selected');
        } else if (this.selectedTile === tile) {
            tile.element.classList.remove('selected');
            this.selectedTile = null;
        } else {
            if (this.selectedTile.symbol === tile.symbol) {
                this.removeTiles(this.selectedTile, tile);
                this.selectedTile = null;
                this.score += 100 * this.stage;
                this.updateUI();
                this.checkBlockedStatus();
                this.checkClear();
            } else {
                this.selectedTile.element.classList.remove('selected');
                this.selectedTile = tile;
                tile.element.classList.add('selected');
            }
        }
    }

    removeTiles(t1, t2) {
        t1.removed = true;
        t2.removed = true;
        t1.element.style.transform = 'scale(0) rotate(180deg)';
        t1.element.style.opacity = '0';
        t2.element.style.transform = 'scale(0) rotate(-180deg)';
        t2.element.style.opacity = '0';

        setTimeout(() => {
            t1.element.remove();
            t2.element.remove();
        }, 300);
    }

    isBlocked(tile) {
        const onTop = this.tiles.some(other => {
            if (other.removed || other.z <= tile.z) return false;
            const dx = Math.abs(parseFloat(other.element.style.left) - parseFloat(tile.element.style.left));
            const dy = Math.abs(parseFloat(other.element.style.top) - parseFloat(tile.element.style.top));
            return dx < 30 && dy < 40;
        });
        if (onTop) return true;

        let leftBlocked = false;
        let rightBlocked = false;
        this.tiles.forEach(other => {
            if (other.removed || other.z !== tile.z) return;
            const dx = parseFloat(other.element.style.left) - parseFloat(tile.element.style.left);
            const dy = Math.abs(parseFloat(other.element.style.top) - parseFloat(tile.element.style.top));
            if (dy < 40) {
                if (dx >= 40 && dx <= 60) rightBlocked = true;
                if (dx <= -40 && dx >= -60) leftBlocked = true;
            }
        });
        return leftBlocked && rightBlocked;
    }

    checkBlockedStatus() {
        this.tiles.forEach(tile => {
            if (this.isBlocked(tile)) tile.element.classList.add('blocked');
            else tile.element.classList.remove('blocked');
        });
    }

    checkClear() {
        if (this.tiles.every(t => t.removed)) {
            this.saveScore(); // Save to ranking after each stage clear
            this.stage++;
            this.sayMsg("닉", "정말 대단해! 다음 구역 수사 기록도 남겨놨어.");
            setTimeout(() => this.createStage(), 1500);
        }
    }

    // --- Firebase Ranking Logic ---
    saveScore() {
        if (typeof database !== 'undefined') {
            const userName = localStorage.getItem('zootopia_user_name') || "무명 수사관";
            database.ref('rankings/' + userName).set({
                score: this.score,
                stage: this.stage,
                lastUpdated: Date.now()
            });
        }
    }

    loadRankings() {
        this.rankingList.innerHTML = '<div class="loading">수사 기록을 불러오는 중...</div>';
        if (typeof database !== 'undefined') {
            database.ref('rankings').orderByChild('score').limitToLast(10).once('value', (snapshot) => {
                this.rankingList.innerHTML = '';
                const data = [];
                snapshot.forEach(child => {
                    data.push({ name: child.key, ...child.val() });
                });
                data.reverse().forEach((item, index) => {
                    const entry = document.createElement('div');
                    entry.className = 'ranking-entry';
                    entry.innerHTML = `
                        <span class="rank">#${index + 1}</span>
                        <span class="name">${item.name}</span>
                        <span class="score">${item.score.toLocaleString()}</span>
                        <span class="stage">ST.${item.stage}</span>
                    `;
                    this.rankingList.appendChild(entry);
                });
            });
        } else {
            this.rankingList.innerHTML = '<div class="error">Firebase 설정이 필요합니다.</div>';
        }
    }

    setupControls() {
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.onclick = () => this.startGame();

        document.getElementById('showRankingBtn').onclick = () => {
            this.rankingScreen.classList.remove('hidden');
            this.loadRankings();
        };

        document.getElementById('closeRankingBtn').onclick = () => {
            this.rankingScreen.classList.add('hidden');
        };

        document.getElementById('shuffleBtn').onclick = () => {
            this.createStage();
            this.sayMsg("닉", "좀 어지러워 보이길래 내가 좀 섞어봤어.");
        };

        document.getElementById('hintBtn').onclick = () => this.showHint();
    }

    showHint() {
        const selectables = this.tiles.filter(t => !t.removed && !this.isBlocked(t));
        const pairs = {};
        for (let t of selectables) {
            if (!pairs[t.symbol]) pairs[t.symbol] = [];
            pairs[t.symbol].push(t);
        }
        for (let sym in pairs) {
            if (pairs[sym].length >= 2) {
                const pair = pairs[sym].slice(0, 2);
                pair.forEach(p => p.element.classList.add('hint'));
                setTimeout(() => pair.forEach(p => p.element.classList.remove('hint')), 2000);
                return;
            }
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    updateUI() {
        this.stageText.innerText = this.stage;
        this.scoreText.innerText = this.score.toLocaleString();
    }

    sayMsg(char, text) {
        this.avatarText.innerText = char === "주디" ? "🐰" : "🦊";
        this.dialogueText.innerText = `"${text}"`;
    }
}

window.addEventListener('load', () => {
    window.game = new MahjongGame();
    // Prompt for username if not set
    if (!localStorage.getItem('zootopia_user_name')) {
        const name = prompt("본인 확인이 필요합니다. 수사관님의 성함은 무엇인가요?", "주디 홉스");
        if (name) localStorage.setItem('zootopia_user_name', name);
    }
});
