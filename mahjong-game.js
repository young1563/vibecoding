/**
 * Zootopia 2: Mahjong Master - Core Game Logic
 */
class MahjongGame {
    constructor() {
        this.boardElement = document.getElementById('mahjongBoard');
        this.stageText = document.getElementById('currentStage');
        this.scoreText = document.getElementById('scoreValue');
        this.timerText = document.getElementById('timerValue');
        this.dialogueText = document.getElementById('dialogueText');
        this.avatarText = document.getElementById('activeChar');

        this.stage = 1;
        this.score = 0;
        this.timeLeft = 300; // 5 mins
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
        this.createStage();
        this.startTimer();
        this.setupControls();
        this.updateUI();
    }

    createStage() {
        this.boardElement.innerHTML = '';
        this.tiles = [];
        this.selectedTile = null;

        // Number of pairs increases with stage
        const pairCount = Math.min(20 + this.stage * 10, 72);
        const layoutSymbols = [];
        for (let i = 0; i < pairCount; i++) {
            const sym = this.tileSymbols[i % this.tileSymbols.length];
            layoutSymbols.push(sym, sym); // Add a pair
        }

        // Shuffle
        this.shuffle(layoutSymbols);

        // Simple Turtle/Layered Layout Generator
        this.generateLayout(layoutSymbols);

        this.checkBlockedStatus();
        this.sayMsg("주디", "새로운 단서들이야, 닉! 모든 짝을 맞혀보자고.");
    }

    // Generate a 3D layout (simplified grid layers)
    generateLayout(symbols) {
        let symIdx = 0;
        const layers = Math.min(3 + Math.floor(this.stage / 2), 5); // 1~5 layers
        const gridW = 10;
        const gridH = 8;
        const tileW = 50;
        const tileH = 70;

        // Centers for centering the board
        const centerX = this.boardElement.clientWidth / 2;
        const centerY = this.boardElement.clientHeight / 2;

        for (let z = 0; z < layers; z++) {
            const rowCount = 6 - z;
            const colCount = 8 - z;

            for (let r = 0; r < rowCount; r++) {
                for (let c = 0; c < colCount; c++) {
                    if (symIdx >= symbols.length) break;

                    // Probability of tile presence (hollow pyramid effect)
                    // Level 0 is most full, upper levels smaller
                    if (Math.random() > 0.1 + (z * 0.1)) {
                        const tile = document.createElement('div');
                        tile.classList.add('tile');
                        tile.innerText = symbols[symIdx++];

                        // Calculated positions with layer offsets for 3D look
                        const x = centerX - (colCount * tileW / 2) + (c * tileW) - (z * 5);
                        const y = centerY - (rowCount * tileH / 2) + (r * tileH) - (z * 5);

                        tile.style.left = `${x}px`;
                        tile.style.top = `${y}px`;
                        tile.style.zIndex = z * 10;

                        const tileData = {
                            element: tile,
                            x: c,
                            y: r,
                            z: z,
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

        // Selection
        if (this.selectedTile === null) {
            this.selectedTile = tile;
            tile.element.classList.add('selected');
        } else if (this.selectedTile === tile) {
            // Deselect
            tile.element.classList.remove('selected');
            this.selectedTile = null;
        } else {
            // Check Match
            if (this.selectedTile.symbol === tile.symbol) {
                // MATCH!
                this.removeTiles(this.selectedTile, tile);
                this.selectedTile = null;
                this.score += 100 * this.stage;
                this.updateUI();
                this.checkBlockedStatus();
                this.checkClear();
            } else {
                // Change Selection
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

    // Classic Mahjong Logic: Tile is blocked if:
    // 1. Any tile is on top of it (higher Z)
    // 2. Both its Left and Right side have adjacent tiles at the same Z level
    isBlocked(tile) {
        // 1. Check Top (higher Z)
        const onTop = this.tiles.some(other => {
            if (other.removed || other.z <= tile.z) return false;
            // Intersection check: simple overlap box
            const dx = Math.abs(parseFloat(other.element.style.left) - parseFloat(tile.element.style.left));
            const dy = Math.abs(parseFloat(other.element.style.top) - parseFloat(tile.element.style.top));
            return dx < 30 && dy < 40;
        });
        if (onTop) return true;

        // 2. Check Left & Right at same level
        let leftBlocked = false;
        let rightBlocked = false;
        this.tiles.forEach(other => {
            if (other.removed || other.z !== tile.z) return;
            const dx = parseFloat(other.element.style.left) - parseFloat(tile.element.style.left);
            const dy = Math.abs(parseFloat(other.element.style.top) - parseFloat(tile.element.style.top));

            if (dy < 40) { // Same height-ish
                if (dx >= 40 && dx <= 60) rightBlocked = true;
                if (dx <= -40 && dx >= -60) leftBlocked = true;
            }
        });

        return leftBlocked && rightBlocked;
    }

    checkBlockedStatus() {
        this.tiles.forEach(tile => {
            if (this.isBlocked(tile)) {
                tile.element.classList.add('blocked');
            } else {
                tile.element.classList.remove('blocked');
            }
        });
    }

    checkClear() {
        if (this.tiles.every(t => t.removed)) {
            this.stage++;
            this.sayMsg("닉", "와우 당근, 실력이 제법인데? 다음 구역으로 가보자고.");
            setTimeout(() => this.createStage(), 1500);
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startTimer() {
        setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateUI();
            }
        }, 1000);
    }

    updateUI() {
        this.stageText.innerText = this.stage;
        this.scoreText.innerText = this.score.toLocaleString();

        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        this.timerText.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    setupControls() {
        document.getElementById('shuffleBtn').onclick = () => {
            this.createStage(); // Regenerate for now as "shuffle"
            this.sayMsg("닉", "좀 어지러워 보이길래 내가 좀 섞어봤어.");
        };

        document.getElementById('undoBtn').onclick = () => {
            this.sayMsg("주디", "이미 일어난 일이야, 닉! 앞으로 가는 수밖에 없어.");
        };

        document.getElementById('hintBtn').onclick = () => {
            this.showHint();
        };
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
                setTimeout(() => {
                    pair.forEach(p => p.element.classList.remove('hint'));
                }, 2000);
                return;
            }
        }
        this.sayMsg("닉", "이런, 내가 봐도 더 이상 짝이 안 보이는걸? 셔플을 써보자.");
    }

    sayMsg(char, text) {
        this.avatarText.innerText = char === "주디" ? "🐰" : "🦊";
        this.dialogueText.innerText = `"${text}"`;
    }
}

window.addEventListener('load', () => {
    window.game = new MahjongGame();
});
