/**
 * Zootopia: Mahjong Master - Gameplay Module
 * Focused strictly on tile logic, matching, and stage progression.
 */
class MahjongGame {
    constructor(platform) {
        this.platform = platform;
        this.boardElement = document.getElementById('mahjongBoard');
        this.stageText = document.getElementById('currentStage');
        this.scoreText = document.getElementById('scoreValue');
        this.collectorBar = document.getElementById('collectorBar');
        this.avatarText = document.getElementById('activeChar'); // Might be null on new page
        this.dialogueText = document.getElementById('dialogueText'); // Might be null on new page

        // Sounds can be added here
        this.tileSymbols = [
            '🐰', '🦊', '👮', '🥕', '🍩', '🚔', '🦥', '🦁',
            '🐯', '⚖️', '⛓️', '🚨', '📻', '📢', '🏙️', '🍎',
            '🍍', '🍹', '🍦', '🍰', '🍪', '🥨', '🥜', '🍓'
        ];

        this.stage = 1;
        this.score = 0;
        this.tiles = [];
        this.collector = [];
        this.collectorSize = 4;

        this.setupItemHandlers();
    }

    start() {
        console.log("Mahjong Module Started");
        this.stage = 1;
        this.score = 0;
        this.collector = [];
        this.createStage();
        this.updateUI();
        this.sayMsg("주디", "수사를 시작하자! 단서들을 모아봐.");
    }

    setupItemHandlers() {
        document.getElementById('hintBtn')?.addEventListener('click', () => this.showHint());
        document.getElementById('footerShuffleBtn')?.addEventListener('click', () => this.shuffleTiles());
        document.getElementById('footerUndoBtn')?.addEventListener('click', () => this.undoMove());
        document.getElementById('footerBombBtn')?.addEventListener('click', () => this.useBomb());
        document.getElementById('restartGameBtn')?.addEventListener('click', () => this.start());
    }

    createStage() {
        this.boardElement.innerHTML = '';
        this.tiles = [];
        this.collector = [];
        this.renderCollector();

        // Calculate tile count based on stage (max 72)
        const pairCount = Math.min(10 + this.stage * 4, 36);
        const layoutSymbols = [];
        for (let i = 0; i < pairCount; i++) {
            const sym = this.tileSymbols[i % this.tileSymbols.length];
            layoutSymbols.push(sym, sym); // Match 2 system
        }

        this.shuffleList(layoutSymbols);
        this.generateLayout(layoutSymbols);
        this.checkBlockedStatus();
    }

    generateLayout(symbols) {
        let symIdx = 0;
        const layers = Math.min(2 + Math.floor(this.stage / 3), 4);
        const tileW = 50;
        const tileH = 70;

        const layoutData = [];
        let minX = 999, maxX = -999, minY = 999, maxY = -999;

        for (let z = 0; z < layers; z++) {
            const rowCount = 6 - z;
            const colCount = 6 - z;
            const layerOffsetX = z * (tileW / 2);
            const layerOffsetY = z * (tileH / 2);

            for (let r = 0; r < rowCount; r++) {
                for (let c = 0; c < colCount; c++) {
                    if (symIdx >= symbols.length) break;
                    const posX = (c * tileW) + layerOffsetX;
                    const posY = (r * tileH) + layerOffsetY;
                    minX = Math.min(minX, posX);
                    maxX = Math.max(maxX, posX + tileW);
                    minY = Math.min(minY, posY);
                    maxY = Math.max(maxY, posY + tileH);
                    layoutData.push({ symbol: symbols[symIdx++], x: posX, y: posY, z: z });
                }
                if (symIdx >= symbols.length) break;
            }
            if (symIdx >= symbols.length) break;
        }

        const boardW = maxX - minX;
        const boardH = maxY - minY;
        const containerW = this.boardElement.offsetWidth || 800;
        const containerH = this.boardElement.offsetHeight || 500;
        const finalScale = Math.min((containerW * 0.9) / boardW, (containerH * 0.9) / boardH, 1);

        const offsetX = (containerW - (boardW * finalScale)) / 2 - (minX * finalScale);
        const offsetY = (containerH - (boardH * finalScale)) / 2 - (minY * finalScale);

        layoutData.forEach(data => {
            const el = document.createElement('div');
            el.className = 'tile';
            el.innerText = data.symbol;
            el.style.left = `${(data.x * finalScale) + offsetX}px`;
            el.style.top = `${(data.y * finalScale) + offsetY}px`;
            el.style.width = `${tileW * finalScale}px`;
            el.style.height = `${tileH * finalScale}px`;
            el.style.fontSize = `${1.5 * finalScale}rem`;
            el.style.zIndex = data.z * 10;

            const tileData = { element: el, symbol: data.symbol, x: data.x, y: data.y, z: data.z, removed: false };
            el.onclick = () => this.handleTileClick(tileData);
            this.boardElement.appendChild(el);
            this.tiles.push(tileData);
        });
    }

    handleTileClick(tile) {
        if (this.isBlocked(tile) || tile.removed || this.collector.length >= this.collectorSize) return;

        tile.removed = true;
        this.collector.push(tile);
        tile.element.classList.add('hidden'); // Simplified: hide instead of flying for now

        this.renderCollector();
        this.checkMatch();
        this.checkBlockedStatus();
    }

    checkMatch() {
        if (this.collector.length < 2) return;

        // Enhanced Match-2 Logic: Check if there's any pair in the entire collector
        const counts = {};
        this.collector.forEach(t => {
            counts[t.symbol] = (counts[t.symbol] || 0) + 1;
        });

        let matchSymbol = null;
        for (let sym in counts) {
            if (counts[sym] >= 2) {
                matchSymbol = sym;
                break;
            }
        }

        if (matchSymbol) {
            // Find the two matching tiles and remove them
            let removedCount = 0;
            const matchedTiles = [];
            this.collector = this.collector.filter(t => {
                if (t.symbol === matchSymbol && removedCount < 2) {
                    removedCount++;
                    matchedTiles.push(t);
                    return false;
                }
                return true;
            });

            // Add flash effect to the matched tiles for visual impact
            matchedTiles.forEach(t => t.element.classList.add('match-flash'));

            this.score += 100 * this.stage;
            this.platform.addStars(10);

            // Visual feedback
            setTimeout(() => {
                this.renderCollector();
                this.checkWin();
            }, 400);
        } else if (this.collector.length >= this.collectorSize) {
            // No matches and collector full = Game Over
            setTimeout(() => this.gameOver(), 300);
        }
    }

    checkWin() {
        if (this.tiles.every(t => t.removed)) {
            this.stage++;
            this.sayMsg("닉", "깔끔하네! 다음 현장으로 가자고.");
            setTimeout(() => this.createStage(), 1000);
        }
    }

    gameOver() {
        this.platform.switchScreen('gameOver');
        const statsEl = document.getElementById('finalStatsText');
        if (statsEl) {
            statsEl.innerText = `최종 점수: ${this.score.toLocaleString()} | 스테이지: ${this.stage}`;
        }
    }

    saveFinalScore() {
        const userName = localStorage.getItem('zootopia_user_name') || "무명 수사관";
        let localRankings = JSON.parse(localStorage.getItem('zib_local_rankings')) || [];
        localRankings.push({ name: userName, score: this.score, stage: this.stage, date: Date.now() });
        localRankings.sort((a, b) => b.score - a.score);
        localStorage.setItem('zib_local_rankings', JSON.stringify(localRankings.slice(0, 10)));
    }

    isBlocked(tile) {
        // A tile is blocked if:
        // 1. There is ANY tile on a HIGHER layer (z) that overlaps it significantly
        // or
        // 2. Both its LEFT and RIGHT sides are blocked (Traditional Mahjong Solitaire)
        // For our simplified "Match-2" casual version, we'll focus on the "Top Layer" rule + "Sides" rule.

        const topBlocked = this.tiles.some(other =>
            !other.removed &&
            other.z > tile.z &&
            Math.abs(other.x - tile.x) < 40 &&
            Math.abs(other.y - tile.y) < 60
        );

        if (topBlocked) return true;

        // Sides Check (Traditional Rule: can move if either left or right is free)
        const leftBlocked = this.tiles.some(other =>
            !other.removed &&
            other.z === tile.z &&
            other.x < tile.x &&
            Math.abs(other.x - tile.x) < 55 &&
            Math.abs(other.y - tile.y) < 20
        );
        const rightBlocked = this.tiles.some(other =>
            !other.removed &&
            other.z === tile.z &&
            other.x > tile.x &&
            Math.abs(other.x - tile.x) < 55 &&
            Math.abs(other.y - tile.y) < 20
        );

        return leftBlocked && rightBlocked;
    }

    renderCollector() {
        this.collectorBar.innerHTML = '';
        this.collector.forEach(t => {
            const slot = document.createElement('div');
            slot.className = 'tile-in-slot';
            slot.innerText = t.symbol;
            this.collectorBar.appendChild(slot);
        });

        for (let i = 0; i < this.collectorSize - this.collector.length; i++) {
            const empty = document.createElement('div');
            empty.className = 'slot-empty';
            this.collectorBar.appendChild(empty);
        }
    }

    useBomb() {
        if (this.platform.data.inventory.bomb > 0 && this.collector.length > 0) {
            this.platform.data.inventory.bomb--;
            this.collector = [];
            this.renderCollector();
            this.platform.save();
            this.updateUI();
        }
    }

    showHint() {
        if (this.platform.data.inventory.hint > 0) {
            const selectables = this.tiles.filter(t => !t.removed && !this.isBlocked(t));
            const pairs = {};
            for (let t of selectables) {
                if (!pairs[t.symbol]) pairs[t.symbol] = [];
                pairs[t.symbol].push(t);
            }
            for (let sym in pairs) {
                if (pairs[sym].length >= 2) {
                    this.platform.data.inventory.hint--;
                    const pair = pairs[sym].slice(0, 2);
                    pair.forEach(p => p.element.classList.add('hint'));
                    setTimeout(() => pair.forEach(p => p.element.classList.remove('hint')), 2000);
                    this.platform.save();
                    this.updateUI();
                    return;
                }
            }
        }
    }

    shuffleTiles() {
        if (this.platform.data.inventory.shuffle > 0) {
            this.platform.data.inventory.shuffle--;
            const remaining = this.tiles.filter(t => !t.removed);
            const symbols = remaining.map(t => t.symbol);
            this.shuffleList(symbols);
            remaining.forEach((t, i) => {
                t.symbol = symbols[i];
                t.element.innerText = t.symbol;
            });
            this.platform.save();
            this.updateUI();
        }
    }

    undoMove() {
        if (this.platform.data.inventory.undo > 0 && this.collector.length > 0) {
            this.platform.data.inventory.undo--;
            const tile = this.collector.pop();
            tile.removed = false;
            tile.element.classList.remove('hidden');
            this.renderCollector();
            this.checkBlockedStatus();
            this.platform.save();
            this.updateUI();
        }
    }

    checkBlockedStatus() {
        this.tiles.forEach(t => {
            if (this.isBlocked(t)) t.element.classList.add('blocked');
            else t.element.classList.remove('blocked');
        });
    }

    shuffleList(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    updateUI() {
        if (this.stageText) this.stageText.innerText = this.stage;
        if (this.scoreText) this.scoreText.innerText = this.score.toLocaleString();

        const counts = this.platform.data.inventory;
        document.getElementById('hintCount').innerText = counts.hint;
        document.getElementById('shuffleCount').innerText = counts.shuffle;
        document.getElementById('undoCount').innerText = counts.undo;
        document.getElementById('bombCount').innerText = counts.bomb;
    }

    showFloatingScore(text, x, y) {
        const el = document.createElement('div');
        el.className = 'floating-score';
        el.innerText = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }

    sayMsg(char, text) {
        if (this.avatarText) this.avatarText.innerText = char === "주디" ? "🐰" : "🦊";
        if (this.dialogueText) this.dialogueText.innerText = `"${text}"`;
    }
}
