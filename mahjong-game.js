/**
 * Zootopia 2: Mahjong Master - Core Game Logic
 * Updated: Collector Slot System (4 Slots), Match-2 in Slot.
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
        this.collectorContainer = document.getElementById('collectorContainer');
        this.collectorBar = document.getElementById('collectorBar');

        // Modal Elements
        this.gameOverModal = document.getElementById('gameOverModal');
        this.helpModal = document.getElementById('helpModal');
        this.finalScoreText = document.getElementById('finalScore');
        this.finalStageText = document.getElementById('finalStage');

        this.stage = 1;
        this.score = 0;
        this.tiles = [];
        this.collector = []; // Tiles in slots
        this.collectorSize = 4;
        this.bombCount = 1; // New: Initialize bomb count
        this.hintCount = 3; // New: Initialize hint count

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
        this.collectorContainer.classList.add('hidden');

        this.setupControls();
        this.updateUI();
    }

    startGame() {
        this.startScreen.classList.add('hidden');
        this.gameHeader.classList.remove('hidden');
        this.gameFooter.classList.remove('hidden');
        this.mahjongArea.classList.remove('hidden');
        this.collectorContainer.classList.remove('hidden');

        this.collector = [];
        this.renderCollector();
        this.createStage();
        this.sayMsg("주디", "상단 보관함에 4개가 꽉 차면 안 돼! 신중하게 골라줘.");
    }

    goToLobby() {
        this.startScreen.classList.remove('hidden');
        this.gameHeader.classList.add('hidden');
        this.gameFooter.classList.add('hidden');
        this.mahjongArea.classList.add('hidden');
        this.collectorContainer.classList.add('hidden');

        // Reset game state for a clean start next time
        this.stage = 1;
        this.score = 0;
        this.bombCount = 1;
        this.hintCount = 3;
        this.collector = [];
        this.updateUI();
        this.renderCollector();
    }

    goHome() {
        if (confirm("수사를 중단하고 본부(홈)로 돌아가시겠습니까? 현재 진행 상황은 저장되지 않습니다.")) {
            this.goToLobby();
        }
    }

    createStage() {
        this.boardElement.innerHTML = '';
        this.tiles = [];
        this.collector = [];
        this.renderCollector();

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
        const layers = Math.min(3 + Math.floor(this.stage / 2), 4);
        const tileW = 50;
        const tileH = 70;

        // Define board coordinate space (internal)
        // We'll calculate the bounds first
        const layoutData = [];
        let minX = 999, maxX = -999, minY = 999, maxY = -999;

        for (let z = 0; z < layers; z++) {
            const rowCount = 6 - z;
            const colCount = 8 - z;
            const layerOffsetX = z * (tileW / 2);
            const layerOffsetY = z * (tileH / 2);

            for (let r = 0; r < rowCount; r++) {
                for (let c = 0; c < colCount; c++) {
                    if (symIdx >= symbols.length) break;

                    // Controlled density: Ensure we use slots but don't skip symbols
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
        const containerW = this.boardElement.clientWidth || 800;
        const containerH = this.boardElement.clientHeight || 500;

        // Calculate Scale to fit (Increased coverage to 96%)
        const scaleX = (containerW * 0.96) / boardW;
        const scaleY = (containerH * 0.96) / boardH;
        const finalScale = Math.min(scaleX, scaleY, 1); // Never scale up

        // Center offsets
        const offsetX = (containerW - (boardW * finalScale)) / 2 - (minX * finalScale);
        const offsetY = (containerH - (boardH * finalScale)) / 2 - (minY * finalScale);

        layoutData.forEach(data => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.innerText = data.symbol;

            // Apply scale and position
            tile.style.left = `${(data.x * finalScale) + offsetX}px`;
            tile.style.top = `${(data.y * finalScale) + offsetY}px`;
            tile.style.width = `${tileW * finalScale}px`;
            tile.style.height = `${tileH * finalScale}px`;
            tile.style.fontSize = `${1.8 * finalScale}rem`;
            tile.style.zIndex = data.z * 10;

            const tileData = { element: tile, symbol: data.symbol, x: data.x, y: data.y, z: data.z, removed: false };
            tile.onclick = () => this.handleTileClick(tileData);
            this.boardElement.appendChild(tile);
            this.tiles.push(tileData);
        });
    }

    handleTileClick(tile) {
        if (this.isBlocked(tile) || tile.removed || this.collector.length >= this.collectorSize) return;

        // 1. Identify destination slot in UI
        const nextSlotIdx = this.collector.length;
        const slots = this.collectorBar.children;
        const targetSlot = slots[nextSlotIdx];

        if (!targetSlot) return;

        // 2. Lock tile state
        tile.removed = true;
        tile.element.style.pointerEvents = "none";
        tile.element.classList.add('moving');
        tile.element.style.zIndex = "1000"; // Fly over everything

        // 3. Calculate movement vector using screen coordinates
        const tileRect = tile.element.getBoundingClientRect();
        const slotRect = targetSlot.getBoundingClientRect();

        const deltaX = slotRect.left - tileRect.left;
        const deltaY = slotRect.top - tileRect.top;

        // 4. Apply flying animation
        // Move to target, scale to fit slot, and rotate slightly for dynamic feel
        tile.element.style.transition = "all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        tile.element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${slotRect.width / tileRect.width})`;

        // 5. Update data after animation finishes
        setTimeout(() => {
            this.collector.push(tile);
            tile.element.style.display = "none"; // Hide instead of completely removing for undo
            tile.element.style.opacity = "1";
            tile.element.style.transform = "none";

            this.renderCollector();
            this.checkMatches();
            this.checkBlockedStatus();
            this.checkClear();
        }, 600);
    }

    renderCollector() {
        this.collectorBar.innerHTML = '';
        const currentCount = this.collector.length;

        // Fill existing tiles
        this.collector.forEach(tile => {
            const clone = document.createElement('div');
            clone.className = 'tile';
            clone.innerText = tile.symbol;
            this.collectorBar.appendChild(clone);
        });

        // Fill empty slots
        for (let i = 0; i < this.collectorSize - currentCount; i++) {
            const empty = document.createElement('div');
            empty.className = 'slot-empty';
            this.collectorBar.appendChild(empty);
        }
    }

    checkMatches() {
        // Simple Match-2 logic
        const counts = {};
        this.collector.forEach(t => counts[t.symbol] = (counts[t.symbol] || 0) + 1);

        for (let sym in counts) {
            if (counts[sym] >= 2) {
                // Remove the pair from collector
                let removedCount = 0;
                this.collector = this.collector.filter(t => {
                    if (t.symbol === sym && removedCount < 2) {
                        removedCount++;
                        return false;
                    }
                    return true;
                });

                this.score += 200 * this.stage;
                this.updateUI();
                this.sayMsg("주디", "빙고! 증거물 매칭 성공!");

                // Visual Feedback
                this.collectorBar.classList.add('match-flash');
                setTimeout(() => this.collectorBar.classList.remove('match-flash'), 500);

                const rect = this.collectorBar.getBoundingClientRect();
                this.showFloatingScore(`+${200 * this.stage}`, rect.left + rect.width / 2, rect.top);

                // Re-render and break to check more if needed
                setTimeout(() => {
                    this.renderCollector();
                    this.checkClear(); // Check clear AFTER matching
                }, 100);
                return; // Restart check loop
            }
        }

        // Check for Game Over (only if no matches were processed this frame)
        if (this.collector.length >= this.collectorSize) {
            // Check if any match is still possible after rendering (redundant but safe)
            const remainingCounts = {};
            this.collector.forEach(t => remainingCounts[t.symbol] = (remainingCounts[t.symbol] || 0) + 1);
            let matchExists = false;
            for (let s in remainingCounts) if (remainingCounts[s] >= 2) matchExists = true;

            if (!matchExists) {
                this.gameOver();
            }
        }
    }

    isBlocked(tile) {
        if (tile.removed) return false;

        const x1 = parseFloat(tile.element.style.left);
        const y1 = parseFloat(tile.element.style.top);
        const w1 = parseFloat(tile.element.style.width);
        const h1 = parseFloat(tile.element.style.height);

        // 1. Check On Top (Any tile with higher Z that overlaps at all)
        for (const other of this.tiles) {
            if (other.removed || other.z <= tile.z || other === tile) continue;

            const x2 = parseFloat(other.element.style.left);
            const y2 = parseFloat(other.element.style.top);
            const w2 = parseFloat(other.element.style.width);
            const h2 = parseFloat(other.element.style.height);

            // Geometric Intersection Check
            const xOverlap = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
            const yOverlap = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));

            // Blocked if there's any significant overlap (> 10% of tile area)
            if (xOverlap > 5 && yOverlap > 5) {
                return true;
            }
        }

        // 2. Check Left & Right at same level
        let leftBlocked = false;
        let rightBlocked = false;

        for (const other of this.tiles) {
            if (other.removed || other.z !== tile.z || other === tile) continue;

            const x2 = parseFloat(other.element.style.left);
            const y2 = parseFloat(other.element.style.top);
            const w2 = parseFloat(other.element.style.width);
            const h2 = parseFloat(other.element.style.height);

            const yOverlap = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));

            if (yOverlap > h1 * 0.2) { // Signficant vertical overlap
                const dx = x2 - x1;
                // If other tile is to the right
                if (dx > w1 * 0.1 && dx < w1 * 1.1) rightBlocked = true;
                // If other tile is to the left
                if (dx < -w1 * 0.1 && dx > -w1 * 1.1) leftBlocked = true;
            }
        }

        return leftBlocked && rightBlocked;
    }

    checkBlockedStatus() {
        this.tiles.forEach(tile => {
            if (this.isBlocked(tile)) tile.element.classList.add('blocked');
            else tile.element.classList.remove('blocked');
        });
    }

    checkClear() {
        const remainingOnBoard = this.tiles.filter(t => !t.removed).length;
        console.log(`Checking clear: ${remainingOnBoard} tiles left on board, ${this.collector.length} in collector`);

        if (remainingOnBoard === 0 && this.collector.length === 0) {
            this.saveScore();
            this.stage++;
            this.sayMsg("주디", "와! 정말 대단해! 모든 증거를 수집했어.");
            setTimeout(() => {
                this.sayMsg("닉", "기다려봐, 다음 사건 구역이 열리고 있으니까.");
                this.createStage();
                this.updateUI();
            }, 1000);
        }
    }

    gameOver() {
        this.sayMsg("닉", "보관함이 꽉 찼어. 이번 사건은 여기까지인 것 같네.");
        this.saveScore();

        // Populate and show Modal
        this.finalScoreText.innerText = this.score.toLocaleString();
        this.finalStageText.innerText = this.stage;
        this.gameOverModal.classList.remove('hidden');
    }


    restartGame() {
        this.gameOverModal.classList.add('hidden');
        this.stage = 1;
        this.score = 0;
        this.bombCount = 1;
        this.hintCount = 3;
        this.collector = [];
        this.tiles.forEach(t => t.element.remove()); // Clean old elements
        this.updateUI();
        this.renderCollector();
        this.createStage();
    }

    shuffleTiles() {
        const remainingTiles = this.tiles.filter(t => !t.removed);
        if (remainingTiles.length === 0) return;

        const symbols = remainingTiles.map(t => t.symbol);
        this.shuffle(symbols);

        remainingTiles.forEach((tile, i) => {
            tile.symbol = symbols[i];
            tile.element.innerText = symbols[i];
        });

        this.checkBlockedStatus();
        this.sayMsg("닉", "타일을 좀 섞어봤어. 이제 짝이 좀 보이나?");
    }

    undoMove() {
        if (this.collector.length === 0) {
            this.sayMsg("주디", "보관함이 비어있어. 되돌릴 행동이 없어!");
            return;
        }

        const tile = this.collector.pop();
        tile.removed = false;
        tile.element.style.display = "flex";
        tile.element.style.pointerEvents = "auto";
        tile.element.classList.remove('moving');

        this.renderCollector();
        this.checkBlockedStatus();
        this.sayMsg("주디", "알았어! 마지막 단서를 다시 제자리로 돌려놨어.");
    }

    useBomb() {
        if (this.bombCount <= 0) {
            this.sayMsg("주디", "폭탄이 더 이상 없어!");
            return;
        }
        if (this.collector.length === 0) {
            this.sayMsg("닉", "보관함이 비어 있는데 폭탄을 쓸 필요는 없지.");
            return;
        }

        this.bombCount--;
        this.collector = [];
        this.renderCollector();
        this.updateUI();
        this.sayMsg("주디", "펑! 보관함을 깨끗하게 비웠어. 다시 시작해봐!");
    }

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

        // Check if database is initialized and has a valid URL
        const isFirebaseValid = typeof database !== 'undefined' &&
            database.app.options.databaseURL &&
            database.app.options.databaseURL !== "YOUR_DATABASE_URL";

        if (isFirebaseValid) {
            database.ref('rankings').orderByChild('score').limitToLast(10).once('value')
                .then((snapshot) => {
                    this.rankingList.innerHTML = '';
                    const data = [];
                    snapshot.forEach(child => { data.push({ name: child.key, ...child.val() }); });

                    if (data.length === 0) {
                        this.rankingList.innerHTML = '<div class="empty">아직 등록된 수사 기록이 없습니다.</div>';
                        return;
                    }

                    data.reverse().forEach((item, index) => {
                        const entry = document.createElement('div');
                        entry.className = 'ranking-entry';
                        entry.innerHTML = `<span class="rank">#${index + 1}</span><span class="name">${item.name}</span><span class="score">${item.score.toLocaleString()}</span><span class="stage">ST.${item.stage}</span>`;
                        this.rankingList.appendChild(entry);
                    });
                })
                .catch((err) => {
                    console.error("Firebase load error:", err);
                    this.rankingList.innerHTML = '<div class="error">데이터를 불러오는 데 실패했습니다.</div>';
                });
        } else {
            // Fallback for local testing if Firebase is not set up
            this.rankingList.innerHTML = `
                <div class="error">
                    <p style="margin-bottom: 0.5rem">Firebase 설정이 필요합니다.</p>
                    <small style="color: #666">firebase-config.js 파일에 실제 API 정보를 입력해주세요.</small>
                </div>`;
            console.warn("Firebase not configured properly. Check firebase-config.js");
        }
    }

    setupControls() {
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.onclick = () => this.startGame();
        document.getElementById('showRankingBtn').onclick = () => { this.rankingScreen.classList.remove('hidden'); this.loadRankings(); };
        document.getElementById('closeRankingBtn').onclick = () => this.rankingScreen.classList.add('hidden');

        // Game Header Controls
        document.getElementById('hintBtn').onclick = () => this.showHint();
        document.getElementById('bombBtn').onclick = () => this.useBomb();
        document.getElementById('homeBtn').onclick = () => this.goHome();

        // Footer Skill Buttons
        document.getElementById('footerShuffleBtn').onclick = () => this.shuffleTiles();
        document.getElementById('footerUndoBtn').onclick = () => this.undoMove();
        document.getElementById('footerBombBtn').onclick = () => this.useBomb();

        // Help Modal Controls
        document.getElementById('showHelpBtn').onclick = () => this.helpModal.classList.remove('hidden');
        document.getElementById('closeHelpBtn').onclick = () => this.helpModal.classList.add('hidden');
        document.getElementById('helpConfirmBtn').onclick = () => this.helpModal.classList.add('hidden');

        // Modal Buttons
        document.getElementById('restartGameBtn').onclick = () => this.restartGame();
        document.getElementById('modalHomeBtn').onclick = () => {
            if (confirm("수사를 중단하고 본부(홈)로 돌아가시겠습니까?")) {
                this.gameOverModal.classList.add('hidden');
                this.goToLobby();
            }
        };
    }

    showHint() {
        if (this.hintCount <= 0) {
            this.sayMsg("주디", "힌트가 더 이상 없어!");
            return;
        }

        const selectables = this.tiles.filter(t => !t.removed && !this.isBlocked(t));
        const pairs = {};
        for (let t of selectables) { if (!pairs[t.symbol]) pairs[t.symbol] = []; pairs[t.symbol].push(t); }
        for (let sym in pairs) {
            if (pairs[sym].length >= 2) {
                this.hintCount--;
                this.updateUI();
                const pair = pairs[sym].slice(0, 2);
                pair.forEach(p => p.element.classList.add('hint'));
                setTimeout(() => pair.forEach(p => p.element.classList.remove('hint')), 2000);
                return;
            }
        }
        this.sayMsg("닉", "아쉽지만 지금은 맞출 수 있는 짝이 없네.");
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
        document.getElementById('bombCount').innerText = this.bombCount;
        document.getElementById('hintCount').innerText = this.hintCount;
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
        this.avatarText.innerText = char === "주디" ? "🐰" : "🦊";
        this.dialogueText.innerText = `"${text}"`;
    }
}

window.addEventListener('load', () => {
    window.game = new MahjongGame();
    if (!localStorage.getItem('zootopia_user_name')) {
        const name = prompt("수사관님의 성명을 입력해주세요.", "주디 홉스");
        if (name) localStorage.setItem('zootopia_user_name', name);
    }
});
