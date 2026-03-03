/**
 * Nonogram Polyomino Game Logic
 * Combine Nonogram hints with Polyomino placement mechanics.
 */

class NonogramGame {
    constructor() {
        this.size = 5;
        this.grid = [];
        this.answer = [];
        this.blocks = [];
        this.levels = [];
        this.currentLevelIdx = 0;

        this.selectedIdx = -1;
        this.rotation = 0; // 0, 90, 180, 270
        this.currentHoverCell = null;
        this.lastHoveredCellEl = null;

        this.init();
    }

    async init() {
        await this.loadLevels();
        this.setupLevel(0);
        this.setupEvents();
    }

    async loadLevels() {
        try {
            const response = await fetch('./data/nonogram-levels.json');
            const data = await response.json();
            this.levels = data.levels;
        } catch (error) {
            console.error('Failed to load levels:', error);
            // Fallback to minimal level if fetch fails
            this.levels = [{
                id: 1,
                title: "Error Recovery",
                description: "Failed to load levels. Please check your data folder.",
                size: 5,
                answer: [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1]],
                blocks: [{ id: 99, name: "ALPHA-X", shape: [[1, 1], [1, 1]] }]
            }];
        }
    }

    setupLevel(idx) {
        if (idx < 0 || idx >= this.levels.length) return;

        this.currentLevelIdx = idx;
        const levelData = this.levels[idx];

        this.size = levelData.size;
        this.answer = levelData.answer;
        // Map blocks but ensure 'used' property is added
        this.blocks = levelData.blocks.map(b => ({ ...b, used: false }));

        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));

        // Update UI Text
        document.querySelector('h1').innerText = levelData.title;
        document.querySelector('.info-panel p').innerText = levelData.description;
        document.querySelector('.badge-mini').innerText = `LEVEL: ${levelData.id}`;

        // Reset game state
        this.selectedIdx = -1;
        this.rotation = 0;
        this.currentHoverCell = null;
        this.lastHoveredCellEl = null;

        // Re-render
        this.renderGrid();
        this.rowHints = this.calcHints(this.answer);
        this.colHints = this.calcHints(this.transpose(this.answer));
        this.renderHints();
        this.renderInventory();
        this.updateBoard();

        // Hide win overlay if visible
        document.getElementById('winOverlay').style.display = 'none';
    }

    calcHints(matrix) {
        return matrix.map(row => {
            let hints = [];
            let count = 0;
            row.forEach(cell => {
                if (cell === 1) count++;
                else if (count > 0) { hints.push(count); count = 0; }
            });
            if (count > 0) hints.push(count);
            return hints.length ? hints : [0];
        });
    }

    transpose(m) {
        return m[0].map((_, i) => m.map(row => row[i]));
    }

    renderGrid() {
        const container = document.getElementById('mainGrid');
        container.innerHTML = '';
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                cell.onmouseenter = (e) => {
                    this.currentHoverCell = { r, c };
                    this.lastHoveredCellEl = e.target;
                    this.updateGhost();
                };
                cell.onmouseleave = () => {
                    this.currentHoverCell = null;
                    this.lastHoveredCellEl = null;
                    this.updateGhost();
                };
                cell.onclick = () => this.handleGridClick(r, c);
                cell.oncontextmenu = (e) => {
                    e.preventDefault();
                    this.removeBlockAt(r, c);
                };

                container.appendChild(cell);
            }
        }
    }

    renderHints() {
        const rCont = document.getElementById('rowHints');
        const cCont = document.getElementById('colHints');

        rCont.innerHTML = this.rowHints.map((h, i) =>
            `<div class="hint-item" id="row-h-${i}">${h.join(' ')}</div>`
        ).join('');

        cCont.innerHTML = this.colHints.map((h, i) =>
            `<div class="hint-item" id="col-h-${i}">${h.map(n => `<span>${n}</span>`).join('')}</div>`
        ).join('');
    }

    renderInventory() {
        const list = document.getElementById('blockList');
        list.innerHTML = '';
        this.blocks.forEach((block, i) => {
            const slot = document.createElement('div');
            slot.className = `block-slot ${this.selectedIdx === i ? 'selected' : ''}`;
            if (block.used) slot.style.opacity = '0.3';

            slot.innerHTML = `<span>${block.name}</span>`;

            const container = document.createElement('div');
            container.className = 'block-container';
            block.shape.forEach((row, r) => {
                row.forEach((v, c) => {
                    if (v) {
                        const cell = document.createElement('div');
                        cell.className = 'mini-cell';
                        cell.style.left = `${c * 25}px`;
                        cell.style.top = `${r * 25}px`;
                        container.appendChild(cell);
                    }
                });
            });
            slot.appendChild(container);

            if (!block.used) {
                slot.onclick = () => this.selectBlock(i);
            }
            list.appendChild(slot);
        });
    }

    selectBlock(i) {
        if (this.selectedIdx === i) {
            this.selectedIdx = -1;
        } else {
            this.selectedIdx = i;
            this.rotation = 0;
        }
        this.renderInventory();
        this.updateGhost();
    }

    rotate() {
        if (this.selectedIdx === -1) return;
        this.rotation = (this.rotation + 90) % 360;
        this.updateGhost();
    }

    getRotatedShape(shape, angle) {
        let res = shape;
        const steps = angle / 90;
        for (let s = 0; s < steps; s++) {
            res = res[0].map((_, i) => res.map(row => row[i]).reverse());
        }
        return res;
    }

    updateGhost() {
        const ghost = document.getElementById('ghostBlock');
        if (this.selectedIdx === -1 || !this.lastHoveredCellEl) {
            ghost.style.display = 'none';
            return;
        }

        ghost.style.display = 'block';

        // Snap to cellular position
        const rect = this.lastHoveredCellEl.getBoundingClientRect();
        ghost.style.left = `${rect.left}px`;
        ghost.style.top = `${rect.top}px`;

        ghost.innerHTML = '';

        const block = this.blocks[this.selectedIdx];
        const shape = this.getRotatedShape(block.shape, this.rotation);

        shape.forEach((row, r) => {
            row.forEach((v, c) => {
                if (v) {
                    const gc = document.createElement('div');
                    gc.className = 'ghost-cell';
                    gc.style.left = `${c * 70}px`;
                    gc.style.top = `${r * 70}px`;

                    // Check if placement is valid
                    if (this.currentHoverCell) {
                        const targetR = this.currentHoverCell.r + r;
                        const targetC = this.currentHoverCell.c + c;
                        if (targetR >= this.size || targetC >= this.size || this.grid[targetR][targetC] !== 0) {
                            gc.classList.add('invalid');
                        }
                    }

                    ghost.appendChild(gc);
                }
            });
        });
    }

    handleGridClick(r, c) {
        if (this.selectedIdx === -1) return;

        const block = this.blocks[this.selectedIdx];
        const shape = this.getRotatedShape(block.shape, this.rotation);

        // 1. Validation
        for (let rowA = 0; rowA < shape.length; rowA++) {
            for (let colA = 0; colA < shape[0].length; colA++) {
                if (shape[rowA][colA]) {
                    const tr = r + rowA;
                    const tc = c + colA;
                    if (tr >= this.size || tc >= this.size || this.grid[tr][tc] !== 0) {
                        return; // Forbidden
                    }
                }
            }
        }

        // 2. Placement
        shape.forEach((rowA, rIdx) => {
            rowA.forEach((v, cIdx) => {
                if (v) this.grid[r + rIdx][c + cIdx] = block.id;
            });
        });

        block.used = true;
        this.selectedIdx = -1;
        this.renderInventory();
        this.updateBoard();
        this.checkWin();
    }

    removeBlockAt(r, c) {
        const id = this.grid[r][c];
        if (id === 0) return;

        // Reset grid for this ID
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === id) this.grid[i][j] = 0;
            }
        }

        // Release block in inventory
        const block = this.blocks.find(b => b.id === id);
        if (block) block.used = false;

        this.renderInventory();
        this.updateBoard();
        this.checkWin();
    }

    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            if (this.grid[r][c] !== 0) cell.classList.add('filled');
            else cell.classList.remove('filled');
        });

        this.checkHints();
    }

    checkHints() {
        const binaryGrid = this.grid.map(row => row.map(v => v !== 0 ? 1 : 0));
        const currentRows = this.calcHints(binaryGrid);
        const currentCol = this.calcHints(this.transpose(binaryGrid));

        currentRows.forEach((h, i) => {
            const el = document.getElementById(`row-h-${i}`);
            if (JSON.stringify(h) === JSON.stringify(this.rowHints[i])) el.classList.add('complete');
            else el.classList.remove('complete');
        });

        currentCol.forEach((h, i) => {
            const el = document.getElementById(`col-h-${i}`);
            if (JSON.stringify(h) === JSON.stringify(this.colHints[i])) el.classList.add('complete');
            else el.classList.remove('complete');
        });
    }

    checkWin() {
        const binaryGrid = this.grid.map(row => row.map(v => v !== 0 ? 1 : 0));
        const win = JSON.stringify(binaryGrid) === JSON.stringify(this.answer);

        const overlay = document.getElementById('winOverlay');
        if (overlay && win) {
            overlay.style.display = 'flex';

            // Handle Next Level Button
            const nextBtn = document.getElementById('nextLevelBtn');
            const winTitle = overlay.querySelector('h1');
            const winMsg = overlay.querySelector('p');

            if (this.currentLevelIdx < this.levels.length - 1) {
                winTitle.innerText = "REPAIRED";
                winMsg.innerText = "회로가 성공적으로 복구되었습니다. 다음 레벨로 이동하시겠습니까?";
                nextBtn.innerText = "다음 사건 수사하기";
                nextBtn.onclick = () => this.setupLevel(this.currentLevelIdx + 1);
            } else {
                winTitle.innerText = "MISSION COMPLETE";
                winMsg.innerText = "모든 특별 사건을 해결했습니다! 본부의 주디와 닉에게 보고하세요.";
                nextBtn.innerText = "본부 복귀";
                nextBtn.onclick = () => location.href = 'index.html';
            }
        }
    }

    setupEvents() {
        // Ghost movement is now handled by mouseenter in renderGrid

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') this.rotate();
        });

        document.getElementById('resetBtn').onclick = () => this.setupLevel(this.currentLevelIdx);
    }
}

window.onload = () => new NonogramGame();
