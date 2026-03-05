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

        this.landingHome = document.getElementById('platformHome');
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
        this.settingsModal = document.getElementById('settingsModal');
        this.finalScoreText = document.getElementById('finalScore');
        this.finalStageText = document.getElementById('finalStage');

        this.nonogramScreen = document.getElementById('nonogramGameScreen');
        this.mahjongGameScreen = document.getElementById('mahjongGameScreen');
        this.nonogramInstance = null;

        this.stage = 1;
        this.score = 0;
        this.tiles = [];
        this.collector = []; // Tiles in slots
        this.collectorSize = 4;
        this.bombCount = 1; // New: Initialize bomb count
        this.hintCount = 3; // New: Initialize hint count
        this.shuffleCount = 2; // New: Initialize shuffle count
        this.undoCount = 3;    // New: Initialize undo count

        // --- Platform Global Data ---
        this.platformData = {
            stars: parseInt(localStorage.getItem('zib_stars')) || 1250,
            exp: parseInt(localStorage.getItem('zib_exp')) || 0,
            level: parseInt(localStorage.getItem('zib_level')) || 1,
            playerName: localStorage.getItem('zootopia_user_name') || "주디 홉스",
            quests: JSON.parse(localStorage.getItem('zib_quests')) || {
                mahjongMatches: { current: 0, target: 20, reward: 200, completed: false }
            }
        };

        this.shopModal = document.getElementById('shopModal');
        this.starsDisplay = document.getElementById('platformStars');
        this.levelDisplay = document.querySelector('.player-rank');
        this.nameDisplay = document.querySelector('.player-name');
        this.questMahjongProgress = document.getElementById('questMahjongProgress');

        this.tileSymbols = [
            '🐰', '🦊', '👮', '🥕', '🍩', '🚔', '🦥', '🦁',
            '🐯', '⚖️', '⛓️', '🚨', '📻', '📢', '🏙️', '🍎',
            '🍍', '🍹', '🍦', '🍰', '🍪', '🥨', '🥜', '🍓'
        ];

        this.init();
    }

    init() {
        this.landingHome.classList.remove('hidden');
        this.startScreen.classList.add('hidden');
        this.nonogramScreen.classList.add('hidden');
        this.mahjongGameScreen.classList.add('hidden');

        this.setupControls();
        this.updatePlatformUI(); // Sync global stats to UI
        this.updateUI();
    }

    updatePlatformUI() {
        if (this.starsDisplay) this.starsDisplay.innerText = this.platformData.stars.toLocaleString();
        if (this.nameDisplay) this.nameDisplay.innerText = `${this.platformData.playerName} 수사관`;

        // Target multiple level indicators for consistency
        const platformLevelLabel = document.getElementById('platformLevel');
        if (platformLevelLabel) platformLevelLabel.innerText = this.platformData.level;

        // Day Quest UI
        if (this.questMahjongProgress) {
            const q = this.platformData.quests.mahjongMatches;
            const percent = Math.min((q.current / q.target) * 100, 100);
            this.questMahjongProgress.style.width = `${percent}%`;

            if (q.current >= q.target && !q.completed) {
                q.completed = true;
                this.addPlatformStars(q.reward);
                this.sayMsg("주디", `오늘의 지령 완료! 보급품(${q.reward} 별)이 지급됐어.`);
            }
        }

        // Persistence
        localStorage.setItem('zib_stars', this.platformData.stars);
        localStorage.setItem('zib_exp', this.platformData.exp);
        localStorage.setItem('zib_level', this.platformData.level);
        localStorage.setItem('zib_quests', JSON.stringify(this.platformData.quests));
    }

    addPlatformExp(amount) {
        this.platformData.exp += amount;
        const nextLevelExp = this.platformData.level * 1000;
        if (this.platformData.exp >= nextLevelExp) {
            this.platformData.level++;
            this.platformData.exp -= nextLevelExp;
            this.sayMsg("주디", `축하해! 수사관 등급이 LV.${this.platformData.level}로 승급됐어!`);
        }
        this.updatePlatformUI();
    }

    addPlatformStars(amount) {
        this.platformData.stars += amount;
        this.updatePlatformUI();
    }

    startGame() {
        this.landingHome.classList.add('hidden');
        this.startScreen.classList.add('hidden');
        this.mahjongGameScreen.classList.remove('hidden');

        // Ensure game sub-elements are visible
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
        this.landingHome.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.nonogramScreen.classList.add('hidden');
        this.mahjongGameScreen.classList.add('hidden');

        // Reset game state for a clean start next time
        this.stage = 1;
        this.score = 0;
        this.bombCount = 1;
        this.hintCount = 3;
        this.shuffleCount = 2;
        this.undoCount = 3;
        this.collector = [];
        this.updateUI();
        this.renderCollector();
    }

    launchNonogram() {
        this.landingHome.classList.add('hidden');
        this.startScreen.classList.add('hidden');
        this.mahjongGameScreen.classList.add('hidden');
        this.nonogramScreen.classList.remove('hidden');

        if (!this.nonogramInstance) {
            this.nonogramInstance = new NonogramGame();
        }
        this.nonogramInstance.init();
    }

    goToPlatform() {
        this.landingHome.classList.remove('hidden');
        this.startScreen.classList.add('hidden');
        this.nonogramScreen.classList.add('hidden');
        this.mahjongGameScreen.classList.add('hidden');
        this.gameOverModal.classList.add('hidden');
    }

    goHome() {
        if (confirm("수사를 중단하고 플랫폼 홈으로 돌아가시겠습니까? 현재 진행 상황은 저장되지 않습니다.")) {
            this.goToPlatform();
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
                this.addPlatformStars(10); // Reward stars for matches
                this.addPlatformExp(50);   // Reward EXP

                // Update Quest
                this.platformData.quests.mahjongMatches.current++;
                this.updatePlatformUI();

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
            this.addPlatformStars(100 * this.stage); // Big bonus for clearing
            this.addPlatformExp(500);
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
        this.shuffleCount = 2;
        this.undoCount = 3;
        this.collector = [];
        this.tiles.forEach(t => t.element.remove()); // Clean old elements
        this.updateUI();
        this.renderCollector();
        this.createStage();
    }

    shuffleTiles() {
        if (this.shuffleCount <= 0) {
            this.sayMsg("주디", "더 이상 섞을 수 없어!");
            return;
        }

        const remainingTiles = this.tiles.filter(t => !t.removed);
        if (remainingTiles.length === 0) return;

        this.shuffleCount--;
        this.updateUI();

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
        if (this.undoCount <= 0) {
            this.sayMsg("주디", "더 이상 되돌릴 수 없어!");
            return;
        }
        if (this.collector.length === 0) {
            this.sayMsg("주디", "보관함이 비어있어. 되돌릴 행동이 없어!");
            return;
        }

        this.undoCount--;
        this.updateUI();

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

        // Clear matching partners from board to prevent orphans
        this.collector.forEach(collectorTile => {
            const partner = this.tiles.find(t => !t.removed && t.symbol === collectorTile.symbol);
            if (partner) {
                partner.removed = true;
                partner.element.style.display = "none";
                this.score += 100 * this.stage;
            }
        });

        this.collector = [];
        this.renderCollector();
        this.updateUI();
        this.checkBlockedStatus();
        this.checkClear();
        this.sayMsg("주디", "펑! 보관함과 관련된 증거들을 모두 정리했어. 다시 수사해보자!");
    }

    saveScore() {
        const userName = localStorage.getItem('zootopia_user_name') || "무명 수사관";
        const scoreData = {
            score: this.score,
            stage: this.stage,
            lastUpdated: Date.now()
        };

        // 1. Always attempt Firebase save if valid
        const isFirebaseValid = typeof database !== 'undefined' &&
            database.app.options.databaseURL &&
            database.app.options.databaseURL !== "YOUR_DATABASE_URL";

        if (isFirebaseValid) {
            database.ref('rankings/' + userName).set(scoreData);
        }

        // 2. Always maintain local rankings for fallback/offline
        let localRankings = JSON.parse(localStorage.getItem('zib_local_rankings')) || [];
        // Check if user already exists in local rankings
        const existingIdx = localRankings.findIndex(r => r.name === userName);
        if (existingIdx > -1) {
            if (localRankings[existingIdx].score < this.score) {
                localRankings[existingIdx] = { name: userName, ...scoreData };
            }
        } else {
            localRankings.push({ name: userName, ...scoreData });
        }

        // Sort and keep top 20
        localRankings.sort((a, b) => b.score - a.score);
        localStorage.setItem('zib_local_rankings', JSON.stringify(localRankings.slice(0, 20)));
    }

    loadRankings() {
        this.rankingList.innerHTML = '<div class="loading">수사 기록을 불러오는 중...</div>';

        const isFirebaseValid = typeof database !== 'undefined' &&
            database.app.options.databaseURL &&
            database.app.options.databaseURL !== "YOUR_DATABASE_URL";

        if (isFirebaseValid) {
            database.ref('rankings').orderByChild('score').limitToLast(10).once('value')
                .then((snapshot) => {
                    this.renderRankings(snapshot);
                })
                .catch((err) => {
                    console.error("Firebase load error:", err);
                    this.loadLocalRankings();
                });
        } else {
            this.loadLocalRankings();
        }
    }

    renderRankings(snapshot) {
        this.rankingList.innerHTML = '';
        const data = [];
        snapshot.forEach(child => { data.push({ name: child.key, ...child.val() }); });

        if (data.length === 0) {
            this.rankingList.innerHTML = '<div class="empty">아직 등록된 실시간 수사 기록이 없습니다.</div>';
            return;
        }

        this.displayRankingEntries(data.reverse());
    }

    loadLocalRankings() {
        const localData = JSON.parse(localStorage.getItem('zib_local_rankings')) || [];
        this.rankingList.innerHTML = '<div class="local-badge" style="text-align:center; font-size:0.7rem; color:#A0AEC0; margin-bottom:1rem;">⚠️ 오프라인 보관함 로드됨</div>';

        if (localData.length === 0) {
            this.rankingList.innerHTML += '<div class="empty">저장된 로컬 수사 기록이 없습니다.</div>';
            return;
        }

        this.displayRankingEntries(localData.slice(0, 10));
    }

    displayRankingEntries(data) {
        data.forEach((item, index) => {
            const entry = document.createElement('div');
            entry.className = 'rank-item'; // Match the style in style.css
            entry.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <span class="rank" style="font-weight:900; color:var(--primary-color); width:25px;">#${index + 1}</span>
                    <span class="rank-name">${item.name}</span>
                </div>
                <div style="text-align:right">
                    <div class="rank-score">${item.score.toLocaleString()} PTS</div>
                    <small style="font-size:0.7rem; color:#A0AEC0">STAGE ${item.stage}</small>
                </div>`;
            this.rankingList.appendChild(entry);
        });
    }

    setupControls() {
        const hMahjong = document.getElementById('heroLaunchMahjongBtn');
        if (hMahjong) hMahjong.onclick = () => this.startGame();

        const lMahjong = document.getElementById('launchMahjongBtn');
        if (lMahjong) lMahjong.onclick = () => this.startGame();

        const lNonogram = document.getElementById('launchNonogramBtn');
        if (lNonogram) lNonogram.onclick = () => this.launchNonogram();

        const hNonogram = document.getElementById('heroLaunchNonogramBtn');
        if (hNonogram) hNonogram.onclick = () => this.launchNonogram();

        const nBackBtn = document.getElementById('nonogramBackBtn');
        if (nBackBtn) nBackBtn.onclick = () => this.goToPlatform();

        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) startBtn.onclick = () => this.startGame();

        const pRanking = document.getElementById('showPlatformRankingBtn');
        if (pRanking) pRanking.onclick = () => { this.rankingScreen.classList.remove('hidden'); this.loadRankings(); };

        const pSettings = document.getElementById('showPlatformSettingsBtn');
        if (pSettings) pSettings.onclick = () => this.settingsModal.classList.remove('hidden');

        const shopBtn = document.getElementById('showShopBtn');
        if (shopBtn) shopBtn.onclick = () => this.shopModal.classList.remove('hidden');

        // Sidebar Links
        const sRanking = document.getElementById('sideRankingBtn');
        if (sRanking) sRanking.onclick = () => { this.rankingScreen.classList.remove('hidden'); this.loadRankings(); };

        const sShop = document.getElementById('sideShopBtn');
        if (sShop) sShop.onclick = () => this.shopModal.classList.remove('hidden');

        const sSettings = document.getElementById('sideSettingsBtn');
        if (sSettings) sSettings.onclick = () => this.settingsModal.classList.remove('hidden');

        const cShopBtn = document.getElementById('closeShopBtn');
        if (cShopBtn) cShopBtn.onclick = () => this.shopModal.classList.add('hidden');

        // Category Tabs Interactivity
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            };
        });

        // Shop Purchase Logic
        const buyBtns = document.querySelectorAll('.buy-btn');
        buyBtns.forEach(btn => {
            btn.onclick = (e) => {
                const itemCard = e.target.closest('.shop-item');
                const type = itemCard.dataset.item;
                const price = parseInt(itemCard.dataset.price);

                if (this.platformData.stars >= price) {
                    this.platformData.stars -= price;
                    this.buyItem(type);
                    this.updatePlatformUI();
                    this.updateUI();
                    this.sayMsg("닉", "좋은 선택이야 수사관. 장비함에 잘 넣어뒀어.");
                } else {
                    this.sayMsg("주디", "별이 부족해서 구매할 수 없어. 수사를 더 진행해볼까?");
                }
            };
        });

        const showRankBtn = document.getElementById('showPlatformRankingBtn') || document.getElementById('showRankingBtn');
        if (showRankBtn) showRankBtn.onclick = () => { this.rankingScreen.classList.remove('hidden'); this.loadRankings(); };

        const closeRankBtn = document.getElementById('closeRankingBtn');
        if (closeRankBtn) closeRankBtn.onclick = () => this.rankingScreen.classList.add('hidden');

        // Game Header Controls
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) hintBtn.onclick = () => this.showHint();

        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) homeBtn.onclick = () => this.goHome();

        // Footer Skill Buttons
        const shuffleBtn = document.getElementById('footerShuffleBtn');
        if (shuffleBtn) shuffleBtn.onclick = () => this.shuffleTiles();

        const undoBtn = document.getElementById('footerUndoBtn');
        if (undoBtn) undoBtn.onclick = () => this.undoMove();

        const bombBtn = document.getElementById('footerBombBtn');
        if (bombBtn) bombBtn.onclick = () => this.useBomb();

        // Help Modal Controls
        const showHelpBtn = document.getElementById('showHelpBtn');
        if (showHelpBtn) showHelpBtn.onclick = () => this.helpModal.classList.remove('hidden');

        const closeHelpBtn = document.getElementById('closeHelpBtn');
        if (closeHelpBtn) closeHelpBtn.onclick = () => this.helpModal.classList.add('hidden');

        const helpConfirmBtn = document.getElementById('helpConfirmBtn');
        if (helpConfirmBtn) helpConfirmBtn.onclick = () => this.helpModal.classList.add('hidden');

        // Settings Modal Controls
        const showSettingsBtn = document.getElementById('showPlatformSettingsBtn') || document.getElementById('showSettingsBtn');
        if (showSettingsBtn) showSettingsBtn.onclick = () => this.settingsModal.classList.remove('hidden');

        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        if (closeSettingsBtn) closeSettingsBtn.onclick = () => this.settingsModal.classList.add('hidden');

        const settingsConfirmBtn = document.getElementById('settingsConfirmBtn');
        if (settingsConfirmBtn) settingsConfirmBtn.onclick = () => this.settingsModal.classList.add('hidden');

        const resetDataBtn = document.getElementById('resetDataBtn');
        if (resetDataBtn) resetDataBtn.onclick = () => {
            if (confirm("모든 수사 기록과 설정이 초기화됩니다. 계속하시겠습니까?")) {
                localStorage.clear();
                alert("기록이 초기화되었습니다. 페이지를 새로고침합니다.");
                location.reload();
            }
        };

        // Modal Buttons
        const restartBtn = document.getElementById('restartGameBtn');
        if (restartBtn) restartBtn.onclick = () => this.restartGame();

        const modalHomeBtn = document.getElementById('modalHomeBtn');
        if (modalHomeBtn) modalHomeBtn.onclick = () => {
            if (confirm("수사를 중단하고 플랫폼 홈으로 돌아가시겠습니까?")) {
                this.goToPlatform();
            }
        };
    }

    buyItem(type) {
        switch (type) {
            case 'hint': this.hintCount += 3; break;
            case 'bomb': this.bombCount += 1; break;
            case 'shuffle': this.shuffleCount += 2; break;
            case 'undo': this.undoCount += 3; break;
        }
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
        document.getElementById('shuffleCount').innerText = this.shuffleCount;
        document.getElementById('undoCount').innerText = this.undoCount;
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
