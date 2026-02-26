/**
 * Zootopia 2: Urban Adventure - Core Merge Logic & Story Integration
 */

class MergeGame {
    constructor() {
        this.boardSize = 7;
        this.slots = [];
        this.selectedItemIndex = null;

        // Game State
        this.energy = 50;
        this.coins = 1250;
        this.level = 1;
        this.xp = 0;
        this.currentEpisodeIndex = 0;

        // Story Data from scenario
        this.episodes = [
            {
                title: "항구의 밀매 현장",
                description: "닉과 주디, 첫 합동 수사! 증거물들을 수집하여 범인을 추적하세요.",
                quests: [
                    { id: "q1", type: "CLUE", level: 3, count: 1, reward: 100, text: "밀수품 리스트 (수갑 Lv.3)" },
                    { id: "q2", type: "GEAR", level: 2, count: 2, reward: 50, text: "통신 장비 점검 (무전기 Lv.2)" }
                ],
                dialogue: [
                    { char: "Judy", text: "닉, 장난 그만치고 이 밀매 현장 좀 봐! 정말 심각해." },
                    { char: "Nick", text: "진정해 당근, 내가 벌써 냄새를 다 맡아놨다고." }
                ]
            },
            {
                title: "100주년 기념 행사",
                description: "동상이 파괴되었어요! 현장을 정리하고 단서를 찾으세요.",
                quests: [
                    { id: "q3", type: "CLUE", level: 4, count: 1, reward: 200, text: "부서진 조각 수집 (배지 Lv.4)" },
                    { id: "q4", type: "GEAR", level: 3, count: 1, reward: 100, text: "현장 복구 망치 (망치 Lv.3)" }
                ],
                dialogue: [
                    { char: "Nick", text: "오... 시장님이 저 동상을 정말 아끼신 걸로 아는데..." },
                    { char: "Judy", text: "지금 그게 문제야? 저 범인들이 달아나고 있잖아!" }
                ]
            },
            {
                title: "교정 프로그램 & 비밀 수사",
                description: "서장님의 불호령! 파트너십을 다지며 몰래 수사를 이어가세요.",
                quests: [
                    { id: "q5", type: "GEAR", level: 4, count: 1, reward: 300, text: "잠입용 차량 (경찰차 Lv.4)" },
                    { id: "q6", type: "CLUE", level: 5, count: 1, reward: 400, text: "비밀 보고서 (경찰관 Lv.5)" }
                ],
                dialogue: [
                    { char: "Judy", text: "서장님은 우리가 안 맞는다고 생각하시는 걸까?" },
                    { char: "Nick", text: "글쎄, 난 지금도 충분히 완벽한데 말이지." }
                ]
            },
            {
                title: "고급 파티 잠입",
                description: "뱀 허물 단서를 발견했습니다. 범인을 추적하세요.",
                quests: [
                    { id: "q7", type: "CLUE", level: 6, count: 1, reward: 500, text: "잠긴 비밀 책 (잠금 해제 Lv.6)" }
                ],
                dialogue: [
                    { char: "Nick", text: "이 파티, 뱀 허물이 가득하군. 뭔가 구린내가 나." },
                    { char: "Judy", text: "저기 고양이 아빠가 납치되고 있어! 빨리 쫓아가야 해!" }
                ]
            },
            {
                title: "교도소 탈출",
                description: "누명을 쓰고 감옥에 갇혔습니다! 비벗과 함께 탈출하세요.",
                quests: [
                    { id: "q8", type: "GEAR", level: 5, count: 1, reward: 600, text: "탈출용 헬기 (헬기 Lv.5)" }
                ],
                dialogue: [
                    { char: "Nick", text: "이런, 우리가 공범이라니 말도 안 돼." },
                    { char: "Judy", text: "닉! 비벗을 믿어보자. 여기서 나가야 진실을 밝힐 수 있어." }
                ]
            },
            {
                title: "늪지대와 파충류족",
                description: "파충류족의 음모를 발견했습니다. 워터 슬라이드로 탈출하세요!",
                quests: [
                    { id: "q9", type: "GEAR", level: 6, count: 1, reward: 700, text: "슬라이드 펌프 (건설기계 Lv.6)" }
                ],
                dialogue: [
                    { char: "Judy", text: "고양이 가족들이 파충류족을 몰아내려 하고 있어!" },
                    { char: "Nick", text: "꽉 잡아 당근, 워터 슬라이드 시간이 왔다!" }
                ]
            },
            {
                title: "절벽의 산장",
                description: "양들에게서 얻은 단서! 증거를 확보하세요.",
                quests: [
                    { id: "q10", type: "CLUE", level: 7, count: 1, reward: 800, text: "증거 서류 (비밀문서 Lv.7)" }
                ],
                dialogue: [
                    { char: "Judy", text: "증거를 챙겨야 해! 이게 가장 중요하다고!" },
                    { char: "Nick", text: "아니, 네 목숨이 더 중요해! 제발 내 말 좀 들어." }
                ]
            },
            {
                title: "사막의 사투",
                description: "마지막 단서 위치를 찾았습니다. 경찰의 포위망을 뚫으세요.",
                quests: [
                    { id: "q11", type: "GEAR", level: 1, count: 5, reward: 900, text: "방어용 모래주머니 (벽돌 Lv.1)" }
                ],
                dialogue: [
                    { char: "Nick", text: "늦어서 미안해 당근. 다시는 널 혼자 두지 않을게." },
                    { char: "Judy", text: "닉! 올 줄 알았어. 이제 마지막이야!" }
                ]
            },
            {
                title: "배신과 역습",
                description: "고양이 아들의 배신! 해독제를 확보하여 재회하세요.",
                quests: [
                    { id: "q12", type: "SNACK", level: 5, count: 1, reward: 1000, text: "특제 해독제 (케이크 Lv.5)" }
                ],
                dialogue: [
                    { char: "Nick", text: "갑판이 기울고 있어! 주디, 내 손을 잡아!" },
                    { char: "Judy", text: "해독제를 먹었어! 이제 우리가 이들을 막을 수 있어." }
                ]
            },
            {
                title: "최종 진실: 기후 설계도",
                description: "뱀의 증조할머니 댁에서 최초의 기후 안정 설계도를 찾으세요.",
                quests: [
                    { id: "q13", type: "CLUE", level: 8, count: 1, reward: 2000, text: "기후 설계도 (설계도 Lv.8)" }
                ],
                dialogue: [
                    { char: "Judy", text: "드디어 찾았어. 주토피아의 모두가 공존할 수 있는 방법!" },
                    { char: "Nick", text: "시장님의 용기가 빛을 발했군. 자, 엔딩 파티다!" }
                ]
            }
        ];

        // Item Definitions
        this.itemTypes = {
            CLUE: {
                name: "수사 단서",
                levels: ["🔦", "📻", "⛓️", "📛", "👮", "🚨", "📖", "📜"],
                maxLevel: 8
            },
            GEAR: {
                name: "장비 & 물건",
                levels: ["🧱", "🔨", "🔧", "🚔", "🚁", "🏗️", "🤖"],
                maxLevel: 7
            },
            SNACK: {
                name: "주토피아 간식",
                levels: ["🥕", "🍎", "🍩", "🍨", "🍰", "🥤"],
                maxLevel: 6
            }
        };

        this.init();
    }

    init() {
        this.boardElement = document.getElementById('mergeBoard');
        this.spawnerBtn = document.getElementById('spawnerBtn');
        this.energyCounter = document.getElementById('energyCounter').querySelector('.stat-value');
        this.coinCounter = document.getElementById('coinCounter').querySelector('.stat-value');
        this.xpCounter = document.getElementById('xpProgress').querySelector('.stat-value');
        this.questContainer = document.getElementById('activeQuests');
        this.questTitle = document.querySelector('.quest-header span');

        this.createBoard();
        this.setupEventListeners();
        this.loadEpisode(0);

        // Initial items
        for (let i = 0; i < 3; i++) this.spawnRandomItem();
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        this.slots = [];
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            slot.dataset.index = i;
            this.boardElement.appendChild(slot);
            this.slots.push({
                element: slot,
                item: null
            });
        }
    }

    loadEpisode(index) {
        if (index >= this.episodes.length) {
            alert("전체 시나리오 클리어! 평화로운 주토피아를 지켜냈습니다.");
            return;
        }
        this.currentEpisodeIndex = index;
        const episode = this.episodes[index];

        // Update UI
        document.querySelector('.title-group h1').innerHTML = `EPISODE <span style="color: var(--secondary-color)">${index + 1}</span>`;
        document.querySelector('.title-group p').innerText = episode.title;

        this.updateQuestList();
        this.showDialogue(episode.dialogue[0]); // Show first dialogue
    }

    updateQuestList() {
        const episode = this.episodes[this.currentEpisodeIndex];
        this.questContainer.innerHTML = '';
        episode.quests.forEach(q => {
            const typeInfo = this.itemTypes[q.type];
            const itemEmoji = typeInfo.levels[q.level - 1];

            const questItem = document.createElement('div');
            questItem.classList.add('quest-item');
            questItem.style.cursor = "pointer";
            questItem.innerHTML = `
                <div style="font-size: 2rem;">${itemEmoji}</div>
                <div class="quest-info">
                    <h4 style="font-size: 0.9rem;">${q.text}</h4>
                    <p style="font-size: 0.8rem; color: #666;">필요: ${q.count}개</p>
                </div>
                <button class="complete-btn" onclick="game.tryCompleteQuest('${q.id}')" 
                    style="margin-left: auto; padding: 4px 8px; border-radius: 8px; background: var(--secondary-color); color: white; border: none; cursor:pointer;">
                    완료
                </button>
            `;
            this.questContainer.appendChild(questItem);
        });
    }

    showDialogue(dialogue) {
        // Create or Update dialogue box
        let dialBox = document.getElementById('dialogueBox');
        if (!dialBox) {
            dialBox = document.createElement('div');
            dialBox.id = 'dialogueBox';
            dialBox.style = `
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                width: 80%; max-width: 600px; background: white; padding: 20px;
                border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: flex; gap: 20px; align-items: center; border-left: 10px solid var(--primary-color);
                z-index: 1000; animation: slideUp 0.5s ease;
            `;
            document.body.appendChild(dialBox);
        }

        const avatar = dialogue.char === "Judy" ? "🐰" : "🦊";
        const name = dialogue.char === "Judy" ? "주디 홉스" : "닉 와일드";

        dialBox.innerHTML = `
            <div style="font-size: 3rem;">${avatar}</div>
            <div style="flex:1">
                <div style="font-weight: 800; color: var(--primary-color); font-size: 0.8rem; margin-bottom: 5px;">${name}</div>
                <div style="font-size: 1rem; color: var(--text-dark); line-height: 1.4;">"${dialogue.text}"</div>
            </div>
            <div style="font-size: 0.7rem; color: #999;">클릭하여 닫기</div>
        `;

        dialBox.onclick = () => dialBox.remove();

        // Auto remove after 5s
        setTimeout(() => { if (dialBox.parentElement) dialBox.remove(); }, 5000);
    }

    setupEventListeners() {
        this.spawnerBtn.addEventListener('click', () => {
            if (this.energy > 0) {
                this.consumeEnergy();
                this.spawnRandomItem();
            } else {
                this.showDialogue({ char: "Nick", text: "에너지가 없어, 당근. 좀 쉬었다 하자고." });
            }
        });

        this.boardElement.addEventListener('click', (e) => {
            const slotElement = e.target.closest('.slot');
            if (!slotElement) return;
            const index = parseInt(slotElement.dataset.index);
            this.handleSlotClick(index);
        });
    }

    spawnRandomItem() {
        const emptySlots = this.slots.filter(s => s.item === null);
        if (emptySlots.length === 0) return;

        const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        const types = ["CLUE", "TOOL", "SNACK"];
        const randomType = types[Math.floor(Math.random() * types.length)];

        this.setItemToSlot(randomSlot.element.dataset.index, {
            type: randomType,
            level: 1
        });
    }

    setItemToSlot(index, itemData) {
        const slot = this.slots[index];
        slot.item = itemData;

        if (itemData) {
            const itemElement = document.createElement('div');
            itemElement.classList.add('item', 'pop');
            const typeInfo = this.itemTypes[itemData.type];
            itemElement.innerText = typeInfo.levels[itemData.level - 1];

            slot.element.innerHTML = '';
            slot.element.appendChild(itemElement);
        } else {
            slot.element.innerHTML = '';
        }
    }

    handleSlotClick(index) {
        const clickedSlot = this.slots[index];

        if (this.selectedItemIndex === index) {
            this.deselectItem();
            return;
        }

        if (this.selectedItemIndex === null) {
            if (clickedSlot.item) this.selectItem(index);
            return;
        }

        const selectedSlot = this.slots[this.selectedItemIndex];

        if (!clickedSlot.item) {
            this.setItemToSlot(index, selectedSlot.item);
            this.setItemToSlot(this.selectedItemIndex, null);
            this.deselectItem();
        } else if (
            clickedSlot.item.type === selectedSlot.item.type &&
            clickedSlot.item.level === selectedSlot.item.level &&
            clickedSlot.item.level < this.itemTypes[clickedSlot.item.type].maxLevel
        ) {
            const newLevel = clickedSlot.item.level + 1;
            this.setItemToSlot(index, { type: clickedSlot.item.type, level: newLevel });
            this.setItemToSlot(this.selectedItemIndex, null);
            this.deselectItem();
            this.createMergeParticles(index);
            this.addXP(10 * newLevel);
        } else {
            if (clickedSlot.item) this.selectItem(index);
            else this.deselectItem();
        }
    }

    selectItem(index) {
        if (this.selectedItemIndex !== null) this.slots[this.selectedItemIndex].element.classList.remove('selected');
        this.selectedItemIndex = index;
        this.slots[index].element.classList.add('selected');
    }

    deselectItem() {
        if (this.selectedItemIndex !== null) {
            this.slots[this.selectedItemIndex].element.classList.remove('selected');
            this.selectedItemIndex = null;
        }
    }

    tryCompleteQuest(questId) {
        const episode = this.episodes[this.currentEpisodeIndex];
        const quest = episode.quests.find(q => q.id === questId);

        // Find required item on board
        const itemIdx = this.slots.findIndex(s =>
            s.item && s.item.type === quest.type && s.item.level === quest.level
        );

        if (itemIdx !== -1) {
            // Success! Remove item and reward
            this.setItemToSlot(itemIdx, null);
            this.coins += quest.reward;
            this.addXP(50);
            this.updateStats();

            // Remove quest from episode list
            episode.quests = episode.quests.filter(q => q.id !== questId);
            this.updateQuestList();

            // Next Episode check
            if (episode.quests.length === 0) {
                this.showDialogue({ char: "Judy", text: "정말 훌륭해! 다음 단서가 나타났어." });
                setTimeout(() => this.loadEpisode(this.currentEpisodeIndex + 1), 2000);
            } else {
                this.showDialogue({ char: "Nick", text: "나쁘지 않은 솜씨군, 경찰관님." });
            }
        } else {
            this.showDialogue({ char: "Judy", text: "아직 필요한 물건을 찾지 못했어. 조금 더 합쳐봐!" });
        }
    }

    addXP(amount) {
        this.xp += amount;
        if (this.xp >= 100) {
            this.level++;
            this.xp -= 100;
            this.showDialogue({ char: "Nick", text: "축하해, 승진했나 본데?" });
        }
        this.updateStats();
    }

    consumeEnergy() {
        this.energy--;
        this.updateStats();
    }

    updateStats() {
        this.energyCounter.innerText = `${this.energy} / 50`;
        this.coinCounter.innerText = this.coins.toLocaleString();
        this.xpCounter.innerText = `LV. ${this.level}`;
    }

    createMergeParticles(index) {
        const el = this.slots[index].element.firstChild;
        if (el) {
            el.classList.remove('pop');
            void el.offsetWidth;
            el.classList.add('pop');
        }
    }
}

window.addEventListener('load', () => {
    window.game = new MergeGame();
});
