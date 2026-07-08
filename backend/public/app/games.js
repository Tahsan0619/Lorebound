/* ==========================================================================
   LOREBOUND GAME MECHANIC RENDERERS (games.js)
   Challenge Arena uses exactly 3 interaction types per mechanic:
   1. Drag and drop
   2. True / False
   3. Fill in the blanks
   ========================================================================== */

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function truncateAtWord(text, maxLen = 72) {
    if (window.LoreboundLimits?.truncateAtWord) {
        return LoreboundLimits.truncateAtWord(text, maxLen);
    }
    const t = String(text || '').trim();
    if (t.length <= maxLen) return t;
    const slice = t.slice(0, maxLen);
    const sp = slice.lastIndexOf(' ');
    return sp > Math.floor(maxLen * 0.55) ? slice.slice(0, sp).trim() : slice.trim();
}

function escGame(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderTrueFalsePanel(statement, panelId = 'tf-panel') {
    return `
      <div class="${panelId} rapidfire-panel glass-panel">
        <p class="mcq-question" style="text-align:center;font-size:1.05rem;">${escGame(statement)}</p>
        <div class="rapidfire-grid">
          <button type="button" class="rapidfire-btn" data-answer="true"><i class="fa-solid fa-check"></i> TRUE</button>
          <button type="button" class="rapidfire-btn" data-answer="false"><i class="fa-solid fa-xmark"></i> FALSE</button>
        </div>
      </div>`;
}

function bindTrueFalse(container, handler) {
    container.querySelectorAll('.rapidfire-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handler(btn.dataset.answer === 'true', btn);
        });
    });
}

function renderFillBlankPanel(prompt, inputId = 'fill-blank-input') {
    return `
      <div class="fillblank-panel glass-panel">
        <p class="fillblank-prompt">${escGame(prompt)}</p>
        <input type="text" class="fillblank-input" id="${inputId}" placeholder="Type the missing word or phrase" autocomplete="off">
        <button type="button" class="btn btn-primary" id="btn-submit-fillblank"><i class="fa-solid fa-check"></i> Check answer</button>
      </div>`;
}

function bindFillBlank(container, answers, onResult) {
    const input = container.querySelector('.fillblank-input');
    const btn = container.querySelector('#btn-submit-fillblank');
    const check = () => {
        const raw = (input?.value || '').trim();
        if (!raw) {
            input?.classList.add('asmt-input-error');
            setTimeout(() => input?.classList.remove('asmt-input-error'), 900);
            return;
        }
        const normalized = raw.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        const ok = answers.some(a => {
            const target = String(a).toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            return normalized === target || normalized.includes(target) || target.includes(normalized);
        });
        onResult(ok, raw, input);
    };
    btn?.addEventListener('click', check);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
}

function makeFillBlankFromText(text, preferredWord = '') {
    const clean = String(text || '').trim();
    const words = clean.split(/\s+/).filter(w => w.replace(/[^a-zA-Z0-9]/g, '').length >= 4);
    let word = preferredWord || words[Math.floor(words.length / 2)] || words[0] || 'concept';
    word = word.replace(/[^a-zA-Z0-9'-]/g, '');
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const masked = pattern.test(clean) ? clean.replace(pattern, '______') : `${clean} (______)`;
    return { prompt: `Fill in the blank: ${masked}`, answer: word, full: clean };
}

function pickDistractors(pool, correct, count = 3) {
    const filtered = pool.filter(x => x !== correct);
    return shuffleArray(filtered).slice(0, count);
}

function gameCorrect(el, streak = 0, colors) {
    window.LoreboundFX?.celebrateCorrect(el, streak, colors);
}

function gameWrong(el) {
    window.LoreboundFX?.celebrateWrong(el);
}

function getGameVisualContext() {
    const state = window.AppState || {};
    return {
        pdfImages: state.pageImages || [],
        sceneType: window.LoreboundScenes?.detectType(
            state.compiledText || state.uploadedText || '',
            state.activeCategory || '',
            state.activeMetadata || {}
        ) || 'history',
    };
}

function pdfThumbForIndex(index) {
    const imgs = window.AppState?.pageImages;
    if (!imgs?.length || !window.LoreboundPdfMedia) return '';
    const url = LoreboundPdfMedia.imageForIndex(imgs, index);
    return url ? `<img class="card-pdf-visual" src="${url}" alt="">` : '';
}

function mountGameShell(container, className, body, variant, options = {}) {
    const ctx = { ...getGameVisualContext(), ...options };
    container.innerHTML = `
      <div class="${className} game-shell">
        <div class="game-scene-host" id="game-scene-host"></div>
        <div class="game-shell-body">${body}</div>
      </div>`;
    const shell = container.querySelector('.game-shell');
    window.LoreboundFX?.mountAmbient(shell, variant);
    const host = shell.querySelector('#game-scene-host');
    if (host && window.LoreboundScenes) {
        shell._sceneInstance = LoreboundScenes.mount(host, ctx.sceneType, { pdfImages: ctx.pdfImages });
    }
    shell._pdfImages = ctx.pdfImages;
    return shell;
}

function advancePhaseAnimated(game, onEnter) {
    if (window.LoreboundFX?.phaseTransition) {
        LoreboundFX.phaseTransition(() => {
            game.phaseIndex++;
            if (game.phaseIndex >= game.phases.length) game.onGameComplete(true);
            else if (onEnter) onEnter();
            else game.render();
        });
    } else {
        game.phaseIndex++;
        if (game.phaseIndex >= game.phases.length) game.onGameComplete(true);
        else if (onEnter) onEnter();
        else game.render();
    }
}

const PHASE_ICONS = {
    dragdrop: 'fa-hand-pointer',
    truefalse: 'fa-scale-balanced',
    fillblank: 'fa-i-cursor',
};

/** Shared HUD strip rendered at top of every game phase */
function renderPhaseHUD(game) {
    const phase = game.phases[game.phaseIndex];
    const pct = Math.round(((game.phaseIndex + 1) / game.phases.length) * 100);
    const icon = PHASE_ICONS[phase.id] || 'fa-gamepad';
    return `
    <div class="game-phase-hud glass-panel">
      <div class="phase-hud-row">
        <span class="phase-badge"><i class="fa-solid ${icon}"></i> Phase ${game.phaseIndex + 1}/${game.phases.length}</span>
        <span class="phase-name">${phase.label}</span>
        <span class="streak-badge ${game.streak >= 3 ? 'hot' : ''}"><i class="fa-solid fa-fire"></i> Streak: ${game.streak}</span>
      </div>
      <div class="phase-progress-track"><div class="phase-progress-fill" style="width:${pct}%"></div></div>
      <p class="phase-instruction">${phase.instruction}</p>
    </div>`;
}

function renderMCQPanel(question, options, panelId = 'mcq-panel') {
    return `
      <div class="process-mcq-panel glass-panel mcq-panel-wide" id="${panelId}">
        <h3><i class="fa-solid fa-circle-question"></i> Challenge</h3>
        <p class="mcq-question">${question}</p>
        <div class="process-options-deck">
          ${options.map((opt, i) => `
            <div class="process-option-card" data-option-index="${i}">
              <span><span class="option-marker">${String.fromCharCode(65 + i)}.</span> ${opt}</span>
              <i class="fa-solid fa-angle-right"></i>
            </div>`).join('')}
        </div>
      </div>`;
}

function bindMCQChoices(container, handler) {
    container.querySelectorAll('.process-option-card').forEach(card => {
        card.addEventListener('click', () => handler(parseInt(card.dataset.optionIndex, 10), card));
    });
}

function renderBlitzDots(total, current) {
    return `<div class="blitz-progress-dots">${Array.from({ length: total }, (_, i) =>
        `<span class="blitz-dot ${i < current ? 'done' : i === current ? 'active' : ''}"></span>`
    ).join('')}</div>`;
}

// --------------------------------------------------------------------------
// 1. TIMELINE BUILDER | 5 phases per level
// --------------------------------------------------------------------------
class TimelineGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.events = [...payload.events].sort((a, b) => a.order - b.order);
        this.levelName = payload.name || 'Timeline Level';
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'dragdrop', label: 'Timeline Build', instruction: 'Drag each event onto the correct timeline slot (or tap card then slot on mobile).' },
            { id: 'truefalse', label: 'Chronology Check', instruction: 'Decide whether each timeline statement is true or false according to the source.' },
            { id: 'fillblank', label: 'Complete the Record', instruction: 'Fill in the missing word from each event title or date clue.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;
        this.hintsLeft = 2;

        this.slots = [];
        this.deck = [];
        this.placedEvents = {};
        this.selectedCardId = null;

        this.trueFalseDrills = this._buildTrueFalseDrills();
        this.tfIndex = 0;
        this.fillBlanks = this._buildFillBlanks();
        this.fillIndex = 0;

        this.init();
    }

    _buildTrueFalseDrills() {
        const drills = [];
        for (let i = 1; i < this.events.length; i++) {
            const current = this.events[i];
            const prev = this.events[i - 1];
            drills.push({
                statement: `"${truncateAtWord(current.title, 60)}" happened before "${truncateAtWord(prev.title, 60)}".`,
                isTrue: false,
                explanation: `Incorrect order. "${truncateAtWord(prev.title, 60)}" (${prev.date}) comes before "${truncateAtWord(current.title, 60)}" (${current.date}).`,
                sourcePassage: current.sourcePassage,
            });
            drills.push({
                statement: `"${truncateAtWord(current.title, 60)}" is dated ${current.date}.`,
                isTrue: true,
                explanation: `Correct. ${current.desc}`,
                sourcePassage: current.sourcePassage,
            });
        }
        return shuffleArray(drills).slice(0, Math.min(6, drills.length));
    }

    _buildFillBlanks() {
        return this.events.map(evt => {
            const fb = makeFillBlankFromText(evt.title);
            return {
                ...fb,
                explanation: `${evt.title} (${evt.date}). ${evt.desc}`,
                sourcePassage: evt.sourcePassage,
            };
        }).slice(0, Math.min(6, this.events.length));
    }

    init() {
        this._enterPhase();
    }

    _enterPhase() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'dragdrop') {
            this.slots = this.events.map((e, index) => ({ index, expectedOrder: e.order, label: `Era ${index + 1}` }));
            this.deck = shuffleArray(this.events);
            this.placedEvents = {};
        }
        if (phase === 'truefalse') this.tfIndex = 0;
        if (phase === 'fillblank') this.fillIndex = 0;
        this.render();
    }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'dragdrop') body += this._renderBuild();
        else if (phase === 'truefalse') body += this._renderTrueFalse();
        else body += this._renderFillBlank();

        mountGameShell(this.container, 'timeline-game-container', body, 'timeline');
        this._bindPhaseEvents();
    }

    _renderBuild() {
        return `
          <div class="timeline-mission-board">
          <div class="timeline-track">
            ${this.slots.map(slot => {
                const placed = this.placedEvents[slot.index];
                return `
                  <div class="timeline-slot ${placed ? 'filled' : 'deploy-target'}" data-slot-index="${slot.index}">
                    <span class="slot-marker">${slot.label}</span>
                    ${placed ? `
                      <div class="placed-card">
                        ${pdfThumbForIndex(slot.index)}
                        <span class="event-date-hint">${placed.date}</span>
                        <div class="event-title">${placed.title}</div>
                        <button class="btn-remove-placed" data-remove-slot="${slot.index}"><i class="fa-solid fa-trash-can"></i></button>
                      </div>` : `<div class="slot-placeholder"><i class="fa-solid fa-crosshairs"></i> Deploy Here</div>`}
                  </div>`;
            }).join('')}
          </div>
          <div class="timeline-deck" id="timeline-event-deck">
            ${this.deck.map((evt, i) => {
                if (Object.values(this.placedEvents).some(pe => pe.id === evt.id)) return '';
                const emoji = evt.emoji || '📅';
                return `
                  <div class="event-card mission-card ${this.selectedCardId === evt.id ? 'active-drag' : ''}" draggable="true" data-event-id="${evt.id}">
                    ${pdfThumbForIndex(i)}
                    <span class="event-emoji">${emoji}</span>
                    <span class="event-date-hint"><i class="fa-solid fa-calendar-days"></i> ${evt.date}</span>
                        <div class="event-title">${escGame(truncateAtWord(evt.title, 80))}</div>
                  </div>`;
            }).join('')}
          </div>
          </div>
          ${this.hintsLeft > 0 ? `<button class="btn-hint glass-panel" id="btn-timeline-hint"><i class="fa-solid fa-lightbulb"></i> Reveal Next Slot (${this.hintsLeft} left)</button>` : ''}`;
    }

    _renderTrueFalse() {
        if (this.tfIndex >= this.trueFalseDrills.length) return '<p class="phase-complete-msg">Chronology check complete!</p>';
        const d = this.trueFalseDrills[this.tfIndex];
        return `<div class="truefalse-wrap">${renderBlitzDots(this.trueFalseDrills.length, this.tfIndex)}${renderTrueFalsePanel(d.statement)}</div>`;
    }

    _renderFillBlank() {
        if (this.fillIndex >= this.fillBlanks.length) return '<p class="phase-complete-msg">Record complete!</p>';
        const f = this.fillBlanks[this.fillIndex];
        return renderFillBlankPanel(f.prompt, 'timeline-fill-input');
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'dragdrop') this._bindBuild();
        else if (phase === 'truefalse') this._bindTrueFalse();
        else this._bindFillBlank();
    }

    _bindBuild() {
        this.container.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('dragstart', e => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', card.dataset.eventId); });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.addEventListener('click', () => {
                this.selectedCardId = this.selectedCardId === card.dataset.eventId ? null : card.dataset.eventId;
                this.render();
            });
        });
        this.container.querySelectorAll('.timeline-slot').forEach(slot => {
            slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-hover'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-hover'));
            slot.addEventListener('drop', e => { e.preventDefault(); slot.classList.remove('drag-hover'); this.handlePlacement(e.dataTransfer.getData('text/plain'), slot.dataset.slotIndex); });
            slot.addEventListener('click', () => { if (this.selectedCardId) { this.handlePlacement(this.selectedCardId, slot.dataset.slotIndex); this.selectedCardId = null; } });
        });
        this.container.querySelectorAll('.btn-remove-placed').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); delete this.placedEvents[btn.dataset.removeSlot]; this.render(); });
        });
        const hintBtn = this.container.querySelector('#btn-timeline-hint');
        if (hintBtn) hintBtn.addEventListener('click', () => this._useHint());
    }

    _useHint() {
        if (this.hintsLeft <= 0) return;
        const nextSlot = this.slots.find(s => !this.placedEvents[s.index]);
        if (!nextSlot) return;
        const correct = this.events.find(e => e.order === nextSlot.index);
        if (!correct) return;
        this.hintsLeft--;
        this.placedEvents[nextSlot.index] = correct;
        this.streak = Math.max(0, this.streak - 1);
        this.onStepFeedback(true, `Hint used: "${correct.title}" belongs in ${nextSlot.label}.`, correct.sourcePassage);
        if (Object.keys(this.placedEvents).length === this.events.length) setTimeout(() => this._advancePhase(), 600);
        else this.render();
    }

    _bindTrueFalse() {
        bindTrueFalse(this.container, (answer, btn) => {
            const d = this.trueFalseDrills[this.tfIndex];
            if (answer === d.isTrue) {
                this.streak++;
                btn.classList.add('correct');
                gameCorrect(btn, this.streak);
                this.onStepFeedback(true, d.explanation, d.sourcePassage);
                this.tfIndex++;
                if (this.tfIndex >= this.trueFalseDrills.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 350);
            } else {
                this.streak = 0;
                btn.classList.add('wrong');
                gameWrong(btn);
                this.onStepFeedback(false, d.explanation, d.sourcePassage);
            }
        });
    }

    _bindFillBlank() {
        const f = this.fillBlanks[this.fillIndex];
        bindFillBlank(this.container, [f.answer], (ok, raw, input) => {
            if (ok) {
                this.streak++;
                gameCorrect(input, this.streak);
                this.onStepFeedback(true, `Correct! ${f.explanation}`, f.sourcePassage);
                this.fillIndex++;
                if (this.fillIndex >= this.fillBlanks.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                gameWrong(input);
                this.onStepFeedback(false, `Not quite. The answer is "${f.answer}". ${f.explanation}`, f.sourcePassage);
            }
        });
    }

    handlePlacement(eventId, slotIndex) {
        const eventObj = this.events.find(e => e.id === eventId);
        if (!eventObj) return;
        const slotIdxInt = parseInt(slotIndex, 10);
        const cardEl = this.container.querySelector(`[data-event-id="${eventId}"]`);
        const slotEl = this.container.querySelector(`[data-slot-index="${slotIndex}"]`);
        const shell = this.container.querySelector('.game-shell');
        if (eventObj.order === slotIdxInt) {
            if (cardEl && slotEl && window.LoreboundScenes) {
                LoreboundScenes.playDeploy(cardEl, slotEl, shell || this.container);
            }
            this.placedEvents[slotIndex] = eventObj;
            this.streak++;
            slotEl?.classList.add('correct-flash');
            gameCorrect(slotEl, this.streak);
            LoreboundScenes?.pulse(shell || this.container);
            this.onStepFeedback(true, `Deployed! ${eventObj.title} occurred in ${eventObj.date}. ${eventObj.desc}`, eventObj.sourcePassage);
            if (Object.keys(this.placedEvents).length === this.events.length) setTimeout(() => this._advancePhase(), 900);
            else setTimeout(() => this.render(), 450);
        } else {
            this.streak = 0;
            gameWrong(cardEl);
            this.onStepFeedback(false, `Wrong position. ${eventObj.title} (${eventObj.date}) does not belong in Era ${slotIdxInt + 1}.`, eventObj.sourcePassage);
        }
    }

    _advancePhase() {
        advancePhaseAnimated(this, () => this._enterPhase());
    }
}

// --------------------------------------------------------------------------
// 2. PROCESS LOOP
// --------------------------------------------------------------------------
class ProcessGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.stages = payload.stages;
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'dragdrop', label: 'Sequence Reorder', instruction: 'Drag stages into the correct process order (top = start).' },
            { id: 'truefalse', label: 'Stage Fact Check', instruction: 'Mark each process claim true or false using your study notes.' },
            { id: 'fillblank', label: 'Stage Labels', instruction: 'Type the missing word to complete each stage name.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;
        this.reorderList = shuffleArray(this.stages.map(s => ({ ...s })));
        this.rapidIndex = 0;
        this.rapidDrills = shuffleArray(this.stages.map(s => ({
            stage: s,
            statement: `${truncateAtWord(s.title, 50)}: ${truncateAtWord(s.desc, 120)}`,
            isTrue: true,
        }))).concat(shuffleArray(this.stages.map(s => {
            const other = pickDistractors(this.stages, s, 1)[0];
            return other ? { stage: s, statement: `${truncateAtWord(other.title, 50)} always happens before ${truncateAtWord(s.title, 50)} in this cycle.`, isTrue: false } : null;
        }).filter(Boolean))).slice(0, Math.min(8, this.stages.length * 2));
        this.fillBlanks = this.stages.map(s => {
            const fb = makeFillBlankFromText(s.title);
            return { ...fb, explanation: `${s.title}: ${s.desc}`, sourcePassage: s.sourcePassage };
        }).slice(0, Math.min(6, this.stages.length));
        this.fillIndex = 0;

        this.init();
    }

    init() { this.render(); }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'dragdrop') body += this._renderReorder();
        else if (phase === 'truefalse') body += this._renderTrueFalse();
        else body += this._renderFillBlank();

        mountGameShell(this.container, 'process-game-container', body, 'process');
        this._bindPhaseEvents();
    }

    _renderTrueFalse() {
        if (this.rapidIndex >= this.rapidDrills.length) return '<p class="phase-complete-msg">Stage fact check complete!</p>';
        const d = this.rapidDrills[this.rapidIndex];
        return `<div class="truefalse-wrap">${renderBlitzDots(this.rapidDrills.length, this.rapidIndex)}${renderTrueFalsePanel(d.statement)}</div>`;
    }

    _renderFillBlank() {
        if (this.fillIndex >= this.fillBlanks.length) return '<p class="phase-complete-msg">All stages labeled!</p>';
        return renderFillBlankPanel(this.fillBlanks[this.fillIndex].prompt, 'process-fill-input');
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'dragdrop') this._bindReorder();
        else if (phase === 'truefalse') this._bindTrueFalse();
        else this._bindFillBlank();
    }

    _bindTrueFalse() {
        bindTrueFalse(this.container, (answer, btn) => {
            const d = this.rapidDrills[this.rapidIndex];
            if (answer === d.isTrue) {
                this.streak++;
                btn.classList.add('correct');
                gameCorrect(btn, this.streak, ['#ff4081', '#f50057']);
                this.onStepFeedback(true, `Correct! ${d.stage.title} - ${d.stage.desc}`, d.stage.sourcePassage);
                this.rapidIndex++;
                if (this.rapidIndex >= this.rapidDrills.length) setTimeout(() => this._advancePhase(), 600);
                else setTimeout(() => this.render(), 350);
            } else {
                this.streak = 0;
                btn.classList.add('wrong');
                gameWrong(btn);
                this.onStepFeedback(false, `Wrong! ${d.stage.rationale || d.stage.desc}`, d.stage.sourcePassage);
            }
        });
    }

    _bindFillBlank() {
        const f = this.fillBlanks[this.fillIndex];
        bindFillBlank(this.container, [f.answer], (ok, raw, input) => {
            if (ok) {
                this.streak++;
                gameCorrect(input, this.streak);
                this.onStepFeedback(true, `Correct! ${f.explanation}`, f.sourcePassage);
                this.fillIndex++;
                if (this.fillIndex >= this.fillBlanks.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                gameWrong(input);
                this.onStepFeedback(false, `Try again. Answer: "${f.answer}". ${f.explanation}`, f.sourcePassage);
            }
        });
    }

    _renderReorder() {
        return `
          <div class="reorder-board glass-panel">
            <p class="reorder-hint"><i class="fa-solid fa-arrows-up-down"></i> Drag to reorder. Position 1 is the cycle entry point.</p>
            <div class="reorder-list" id="process-reorder-list">
              ${this.reorderList.map((s, i) => `
                <div class="reorder-item" draggable="true" data-stage-id="${s.id}" data-current-idx="${i}">
                  <span class="reorder-grip"><i class="fa-solid fa-grip-vertical"></i></span>
                  <span class="reorder-num">${i + 1}</span>
                  <span class="reorder-title">${escGame(truncateAtWord(s.title, 80))}</span>
                </div>`).join('')}
            </div>
            <button class="btn-primary-glow" id="btn-submit-reorder"><i class="fa-solid fa-check-double"></i> Lock Sequence</button>
          </div>`;
    }

    _bindReorder() {
        const list = this.container.querySelector('#process-reorder-list');
        if (!list) return;
        let dragEl = null;
        list.querySelectorAll('.reorder-item').forEach(item => {
            item.addEventListener('dragstart', () => { dragEl = item; item.classList.add('dragging'); });
            item.addEventListener('dragend', () => item.classList.remove('dragging'));
            item.addEventListener('dragover', e => e.preventDefault());
            item.addEventListener('drop', e => {
                e.preventDefault();
                if (!dragEl || dragEl === item) return;
                const items = [...list.querySelectorAll('.reorder-item')];
                const from = items.indexOf(dragEl), to = items.indexOf(item);
                if (from < to) item.after(dragEl); else item.before(dragEl);
                list.querySelectorAll('.reorder-item').forEach((el, i) => el.querySelector('.reorder-num').textContent = i + 1);
            });
        });
        this.container.querySelector('#btn-submit-reorder')?.addEventListener('click', () => {
            const ids = [...list.querySelectorAll('.reorder-item')].map(el => el.dataset.stageId);
            const correct = this.stages.every((s, i) => ids[i] === s.id);
            if (correct) {
                this.streak++;
                gameCorrect(list, this.streak);
                this.onStepFeedback(true, 'Perfect cycle order! You mapped the full process sequence.', this.stages[0].sourcePassage);
                setTimeout(() => this._advancePhase(), 700);
            } else {
                this.streak = 0;
                gameWrong(list);
                this.onStepFeedback(false, 'Sequence incorrect. Trace the process from its natural entry point through each transition.', this.stages[0].sourcePassage);
            }
        });
    }

    _advancePhase() {
        advancePhaseAnimated(this, () => {
            const id = this.phases[this.phaseIndex].id;
            if (id === 'dragdrop') this.reorderList = shuffleArray(this.stages.map(s => ({ ...s })));
            if (id === 'truefalse') this.rapidIndex = 0;
            if (id === 'fillblank') this.fillIndex = 0;
            this.render();
        });
    }
}

// --------------------------------------------------------------------------
// 3. CAUSE-EFFECT CHAIN
// --------------------------------------------------------------------------
class CauseEffectGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.chains = payload.chains;
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'dragdrop', label: 'Causal Linking', instruction: 'Drag each cause to its matching downstream effect.' },
            { id: 'truefalse', label: 'Causal Fact Check', instruction: 'Mark each cause-effect claim true or false.' },
            { id: 'fillblank', label: 'Complete the Chain', instruction: 'Fill in the missing word in each causal statement.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;

        this.shuffledCauses = shuffleArray(this.chains);
        this.matchedEffects = {};
        this.selectedCauseId = null;

        this.trueFalseDrills = shuffleArray(this.chains.flatMap(c => ([
            { statement: `"${truncateAtWord(c.cause, 70)}" leads to "${truncateAtWord(c.effect, 70)}".`, isTrue: true, explanation: c.rationale, sourcePassage: c.sourcePassage },
            { statement: `"${truncateAtWord(c.cause, 70)}" prevents "${truncateAtWord(c.effect, 70)}".`, isTrue: false, explanation: `Incorrect. ${c.rationale}`, sourcePassage: c.sourcePassage },
        ]))).slice(0, Math.min(6, this.chains.length * 2));
        this.tfIndex = 0;
        this.fillBlanks = this.chains.map(c => {
            const fb = makeFillBlankFromText(`${c.cause} leads to ${c.effect}`, c.effect.split(/\s+/).find(w => w.length >= 5) || 'effect');
            return { ...fb, explanation: c.rationale, sourcePassage: c.sourcePassage };
        }).slice(0, Math.min(6, this.chains.length));
        this.fillIndex = 0;

        this.init();
    }

    init() { this.render(); }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'dragdrop') body += this._renderLink();
        else if (phase === 'truefalse') body += this._renderTrueFalse();
        else body += this._renderFillBlank();

        mountGameShell(this.container, 'timeline-game-container', body, 'cause');
        this._bindPhaseEvents();
    }

    _renderTrueFalse() {
        if (this.tfIndex >= this.trueFalseDrills.length) return '<p class="phase-complete-msg">Causal fact check complete!</p>';
        const d = this.trueFalseDrills[this.tfIndex];
        return `<div class="truefalse-wrap">${renderBlitzDots(this.trueFalseDrills.length, this.tfIndex)}${renderTrueFalsePanel(d.statement)}</div>`;
    }

    _renderFillBlank() {
        if (this.fillIndex >= this.fillBlanks.length) return '<p class="phase-complete-msg">Chain complete!</p>';
        return renderFillBlankPanel(this.fillBlanks[this.fillIndex].prompt, 'ce-fill-input');
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'dragdrop') this._bindLink();
        else if (phase === 'truefalse') this._bindTrueFalse();
        else this._bindFillBlank();
    }

    _bindTrueFalse() {
        bindTrueFalse(this.container, (answer, btn) => {
            const d = this.trueFalseDrills[this.tfIndex];
            if (answer === d.isTrue) {
                this.streak++;
                btn.classList.add('correct');
                gameCorrect(btn, this.streak);
                this.onStepFeedback(true, d.explanation, d.sourcePassage);
                this.tfIndex++;
                if (this.tfIndex >= this.trueFalseDrills.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 350);
            } else {
                this.streak = 0;
                btn.classList.add('wrong');
                gameWrong(btn);
                this.onStepFeedback(false, d.explanation, d.sourcePassage);
            }
        });
    }

    _bindFillBlank() {
        const f = this.fillBlanks[this.fillIndex];
        bindFillBlank(this.container, [f.answer], (ok, raw, input) => {
            if (ok) {
                this.streak++;
                gameCorrect(input, this.streak);
                this.onStepFeedback(true, `Correct! ${f.explanation}`, f.sourcePassage);
                this.fillIndex++;
                if (this.fillIndex >= this.fillBlanks.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                gameWrong(input);
                this.onStepFeedback(false, `Answer: "${f.answer}". ${f.explanation}`, f.sourcePassage);
            }
        });
    }

    _renderLink() {
        return `
          <div class="cause-effect-container">
            <div class="cause-effect-column">
              <div class="column-header"><i class="fa-solid fa-bolt"></i> Source Cause</div>
              ${this.shuffledCauses.map(c => {
                if (Object.values(this.matchedEffects).some(m => m.id === c.id)) return `<div class="cause-card matched-ghost">${c.cause}</div>`;
                return `<div class="cause-card ${this.selectedCauseId === c.id ? 'active-drag' : ''}" draggable="true" data-cause-id="${c.id}">${pdfThumbForIndex(this.chains.indexOf(c))}<span>${escGame(truncateAtWord(c.cause, 90))}</span></div>`;
              }).join('')}
            </div>
            <div class="cause-effect-column">
              <div class="column-header"><i class="fa-solid fa-compass"></i> Downstream Effect</div>
              ${this.chains.map(item => {
                const matched = this.matchedEffects[item.id];
                return `
                  <div class="effect-slot ${matched ? 'filled' : ''}" data-effect-id="${item.id}">
                    ${matched ? `
                      <div class="effect-matched-item">
                        <div class="cause-tag">Cause: ${matched.cause}</div>
                        <div class="effect-slot-label"><i class="fa-solid fa-arrow-right"></i> ${item.effect}</div>
                        <button class="btn-disconnect-cause" data-disconnect-effect="${item.id}"><i class="fa-solid fa-trash-can"></i></button>
                      </div>` : `
                      <div class="effect-slot-label">${escGame(truncateAtWord(item.effect, 90))}</div>
                      <div class="slot-placeholder"><i class="fa-solid fa-arrow-down-to-bracket"></i> Drop Cause Here</div>`}
                  </div>`;
              }).join('')}
            </div>
          </div>`;
    }

    _bindLink() {
        this.container.querySelectorAll('.cause-card[draggable]').forEach(card => {
            card.addEventListener('dragstart', e => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', card.dataset.causeId); });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.addEventListener('click', () => { this.selectedCauseId = this.selectedCauseId === card.dataset.causeId ? null : card.dataset.causeId; this.render(); });
        });
        this.container.querySelectorAll('.effect-slot').forEach(slot => {
            slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-hover'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-hover'));
            slot.addEventListener('drop', e => { e.preventDefault(); slot.classList.remove('drag-hover'); this.handleLink(e.dataTransfer.getData('text/plain'), slot.dataset.effectId); });
            slot.addEventListener('click', () => { if (this.selectedCauseId) { this.handleLink(this.selectedCauseId, slot.dataset.effectId); this.selectedCauseId = null; } });
        });
        this.container.querySelectorAll('.btn-disconnect-cause').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); delete this.matchedEffects[btn.dataset.disconnectEffect]; this.render(); });
        });
    }

    handleLink(causeId, effectId) {
        const causeObj = this.chains.find(c => c.id === causeId);
        if (!causeObj) return;
        if (causeObj.id === effectId) {
            this.matchedEffects[effectId] = causeObj;
            this.streak++;
            gameCorrect(this.container, this.streak, ['#26c6da', '#ff9100']);
            this.onStepFeedback(true, `Correct! ${causeObj.cause} leads to: ${causeObj.effect}. ${causeObj.rationale}`, causeObj.sourcePassage);
            if (Object.keys(this.matchedEffects).length === this.chains.length) setTimeout(() => this._advancePhase(), 800);
            else this.render();
        } else {
            this.streak = 0;
            const target = this.chains.find(c => c.id === effectId);
            this.onStepFeedback(false, `Incorrect. "${causeObj.cause}" does not cause "${target.effect}".`, causeObj.sourcePassage);
        }
    }

    _advancePhase() {
        advancePhaseAnimated(this, () => {
            const id = this.phases[this.phaseIndex].id;
            if (id === 'dragdrop') {
                this.shuffledCauses = shuffleArray(this.chains);
                this.matchedEffects = {};
            }
            if (id === 'truefalse') this.tfIndex = 0;
            if (id === 'fillblank') this.fillIndex = 0;
            this.render();
        });
    }
}

// --------------------------------------------------------------------------
// 4. COMPARISON SORTER
// --------------------------------------------------------------------------
class ComparisonGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.categories = payload.categories;
        this.allCards = payload.cards;
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'dragdrop', label: 'Category Sort', instruction: 'Drag each attribute card into the correct category bucket.' },
            { id: 'truefalse', label: 'Category Fact Check', instruction: 'Decide if each statement belongs to the category claimed.' },
            { id: 'fillblank', label: 'Complete the Attribute', instruction: 'Fill in the missing word from each comparison card.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;

        this.sortDeck = shuffleArray(this.allCards).slice(0, Math.min(8, this.allCards.length));
        this.sortIndex = 0;
        this.placedCards = {};

        this.trueFalseDrills = shuffleArray(this.allCards.flatMap(card => ([
            { statement: `"${truncateAtWord(card.text, 100)}" belongs to ${card.category}.`, isTrue: true, explanation: card.rationale, sourcePassage: card.sourcePassage },
            { statement: `"${truncateAtWord(card.text, 100)}" belongs to ${this.categories.find(c => c !== card.category) || 'another group'}.`, isTrue: false, explanation: `Incorrect. ${card.rationale}`, sourcePassage: card.sourcePassage },
        ]))).slice(0, Math.min(6, this.allCards.length * 2));
        this.tfIndex = 0;
        this.fillBlanks = this.allCards.map(c => {
            const fb = makeFillBlankFromText(c.text);
            return { ...fb, explanation: `${c.text} → ${c.category}. ${c.rationale}`, sourcePassage: c.sourcePassage };
        }).slice(0, Math.min(6, this.allCards.length));
        this.fillIndex = 0;

        this.init();
    }

    init() { this.render(); }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'dragdrop') body += this._renderDragSort();
        else if (phase === 'truefalse') body += this._renderTrueFalse();
        else body += this._renderFillBlank();

        mountGameShell(this.container, 'comparison-container', body, 'comparison');
        this._bindPhaseEvents();
    }

    _renderDragSort() {
        if (this.sortIndex >= this.sortDeck.length) return '<p class="phase-complete-msg">All cards sorted!</p>';
        const current = this.sortDeck[this.sortIndex];
        const remaining = this.sortDeck.filter(c => !this.placedCards[c.id]);
        return `
          <div class="comparison-drag-board glass-panel">
            <p class="reorder-hint">Drag the card into the correct category bucket.</p>
            <div class="comparison-card-deck">
              ${remaining.map(c => `
                <div class="comparison-drag-card ${current.id === c.id ? 'active-drag' : ''}" draggable="true" data-card-id="${c.id}">
                  ${escGame(truncateAtWord(c.text, 120))}
                </div>`).join('')}
            </div>
            <div class="comparison-drop-zones">
              ${this.categories.map(cat => `
                <div class="comparison-drop-zone" data-category="${escGame(cat)}">
                  <div class="bucket-name">${escGame(cat)}</div>
                  <div class="slot-placeholder"><i class="fa-solid fa-inbox"></i> Drop here</div>
                </div>`).join('')}
            </div>
          </div>`;
    }

    _renderTrueFalse() {
        if (this.tfIndex >= this.trueFalseDrills.length) return '<p class="phase-complete-msg">Category fact check complete!</p>';
        const d = this.trueFalseDrills[this.tfIndex];
        return `<div class="truefalse-wrap">${renderBlitzDots(this.trueFalseDrills.length, this.tfIndex)}${renderTrueFalsePanel(d.statement)}</div>`;
    }

    _renderFillBlank() {
        if (this.fillIndex >= this.fillBlanks.length) return '<p class="phase-complete-msg">Attributes complete!</p>';
        return renderFillBlankPanel(this.fillBlanks[this.fillIndex].prompt, 'comp-fill-input');
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'dragdrop') this._bindDragSort();
        else if (phase === 'truefalse') this._bindTrueFalse();
        else this._bindFillBlank();
    }

    _bindDragSort() {
        if (this.sortIndex >= this.sortDeck.length) {
            setTimeout(() => this._advancePhase(), 600);
            return;
        }
        const current = this.sortDeck[this.sortIndex];
        this.container.querySelectorAll('.comparison-drag-card').forEach(card => {
            card.addEventListener('dragstart', e => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.cardId);
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });
        this.container.querySelectorAll('.comparison-drop-zone').forEach(zone => {
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-hover'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('drag-hover'));
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('drag-hover');
                const cardId = e.dataTransfer.getData('text/plain');
                const card = this.allCards.find(c => c.id === cardId) || current;
                const selected = zone.dataset.category;
                if (selected === card.category) {
                    this.streak++;
                    this.placedCards[card.id] = true;
                    gameCorrect(zone, this.streak, ['#69f0ae', '#00e676']);
                    this.onStepFeedback(true, `Correct! ${card.text} → ${card.category}. ${card.rationale}`, card.sourcePassage);
                    this.sortIndex++;
                    if (this.sortIndex >= this.sortDeck.length) setTimeout(() => this._advancePhase(), 700);
                    else setTimeout(() => this.render(), 400);
                } else {
                    this.streak = 0;
                    gameWrong(zone);
                    this.onStepFeedback(false, `Incorrect. "${card.text}" belongs to ${card.category}. ${card.rationale}`, card.sourcePassage);
                }
            });
        });
    }

    _bindTrueFalse() {
        bindTrueFalse(this.container, (answer, btn) => {
            const d = this.trueFalseDrills[this.tfIndex];
            if (answer === d.isTrue) {
                this.streak++;
                btn.classList.add('correct');
                gameCorrect(btn, this.streak);
                this.onStepFeedback(true, d.explanation, d.sourcePassage);
                this.tfIndex++;
                if (this.tfIndex >= this.trueFalseDrills.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 350);
            } else {
                this.streak = 0;
                btn.classList.add('wrong');
                gameWrong(btn);
                this.onStepFeedback(false, d.explanation, d.sourcePassage);
            }
        });
    }

    _bindFillBlank() {
        const f = this.fillBlanks[this.fillIndex];
        bindFillBlank(this.container, [f.answer], (ok, raw, input) => {
            if (ok) {
                this.streak++;
                gameCorrect(input, this.streak);
                this.onStepFeedback(true, `Correct! ${f.explanation}`, f.sourcePassage);
                this.fillIndex++;
                if (this.fillIndex >= this.fillBlanks.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                gameWrong(input);
                this.onStepFeedback(false, `Answer: "${f.answer}". ${f.explanation}`, f.sourcePassage);
            }
        });
    }

    _advancePhase() {
        advancePhaseAnimated(this, () => {
            const id = this.phases[this.phaseIndex].id;
            if (id === 'dragdrop') {
                this.sortDeck = shuffleArray(this.allCards).slice(0, Math.min(8, this.allCards.length));
                this.sortIndex = 0;
                this.placedCards = {};
            }
            if (id === 'truefalse') this.tfIndex = 0;
            if (id === 'fillblank') this.fillIndex = 0;
            this.render();
        });
    }

    addEventListeners() { this._bindPhaseEvents(); }
}
