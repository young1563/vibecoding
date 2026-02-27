/**
 * Nonogram Polyomino Game Logic
 * Combine Nonogram hints with Polyomino placement mechanics.
 */

class NonogramGame {
    constructor() {
        this.size = 5;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0)); // 0: empty, 1+: blockID

        // Target pattern for hints (A balanced 5x5 pattern)
        this.answer = [
            [1, 1, 0, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 1, 1, 0]
        ];

        // Polyomino blocks needed to fill the answer
        // Total fill count should match the answer's 1s (12 cells here)
        this.blocks = [
            { id: 1, name: "ALPHA-2", shape: [[1, 1], [1, 1]], used: false }, // 4 cells
            { id: 2, name: "BETA-4", shape: [[1, 1, 1, 1]], used: false },      // 4 cells
            { id: 3, name: "GAMMA-2", shape: [[1, 1], [1, 1]], used: false }  // 4 cells
        ];

        this.selectedIdx = -1;
        this.rotation = 0; // 0, 90, 180, 270
        this.mousePos = { x: 0, y: 0 };
        this.currentHoverCell = null;

        this.init();
    }

    init() {
        this.rowHints = this.calcHints(this.answer);
        this.colHints = this.calcHints(this.transpose(this.answer));

        this.renderGrid();
        this.renderHints();
        this.renderInventory();
        this.setupEvents();
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

                cell.onmouseenter = () => {
                    this.currentHoverCell = { r, c };
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
        if (this.selectedIdx === -1) {
            ghost.style.display = 'none';
            return;
        }

        ghost.style.display = 'block';
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
        const currentColu = this.calcHints(this.transpose(binaryGrid));

        currentRows.forEach((h, i) => {
            const el = document.getElementById(`row-h-${i}`);
            if (JSON.stringify(h) === JSON.stringify(this.rowHints[i])) el.classList.add('complete');
            else el.classList.remove('complete');
        });

        currentColu.forEach((h, i) => {
            const el = document.getElementById(`col-h-${i}`);
            if (JSON.stringify(h) === JSON.stringify(this.colHints[i])) el.classList.add('complete');
            else el.classList.remove('complete');
        });
    }

    checkWin() {
        const binaryGrid = this.grid.map(row => row.map(v => v !== 0 ? 1 : 0));
        const win = JSON.stringify(binaryGrid) === JSON.stringify(this.answer);

        if (win) {
            document.getElementById('winOverlay').style.display = 'flex';
        }
    }

    setupEvents() {
        window.addEventListener('mousemove', (e) => {
            const ghost = document.getElementById('ghostBlock');
            ghost.style.left = `${e.clientX + 5}px`;
            ghost.style.top = `${e.clientY + 5}px`;
        });

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') this.rotate();
        });

        document.getElementById('resetBtn').onclick = () => location.reload();
    }
}

window.onload = () => new NonogramGame();
