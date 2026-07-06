/* ==========================================================================
   LOREBOUND GAME MECHANIC RENDERERS (games.js) — DEEP ENGAGEMENT EDITION
   Multi-phase interactive templates (~30+ min sessions):
   1. TimelineBuilder  — Build → Detective → Sequence Mastery → Era Finale
   2. ProcessLoop      — Navigate → Reorder → Parameter Sim → Chain Lock
   3. CauseEffectChain — Link → Ripple → Order Chain → Inference Boss
   4. ComparisonSorter — Sort → Trap Hunt → Memory Match → Policy Debate
   ========================================================================== */

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickDistractors(pool, correct, count = 3) {
    const filtered = pool.filter(x => x !== correct);
    return shuffleArray(filtered).slice(0, count);
}

/** Shared HUD strip rendered at top of every game phase */
function renderPhaseHUD(game) {
  const pct = Math.round((game.phaseIndex / game.phases.length) * 100);
  return `
    <div class="game-phase-hud glass-panel">
      <div class="phase-hud-row">
        <span class="phase-badge"><i class="fa-solid fa-layer-group"></i> Phase ${game.phaseIndex + 1}/${game.phases.length}</span>
        <span class="phase-name">${game.phases[game.phaseIndex].label}</span>
        <span class="streak-badge ${game.streak >= 3 ? 'hot' : ''}"><i class="fa-solid fa-fire"></i> Streak: ${game.streak}</span>
      </div>
      <div class="phase-progress-track"><div class="phase-progress-fill" style="width:${pct}%"></div></div>
      <p class="phase-instruction">${game.phases[game.phaseIndex].instruction}</p>
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

function celebrateAt(el, colors) {
    if (!window.LoreboundFX) return;
    const r = el?.getBoundingClientRect();
    LoreboundFX.confetti(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top : innerHeight / 3, colors);
}

// --------------------------------------------------------------------------
// 1. TIMELINE BUILDER — 4 phases per level
// --------------------------------------------------------------------------
class TimelineGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.events = [...payload.events].sort((a, b) => a.order - b.order);
        this.levelName = payload.name || 'Timeline Level';
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'build', label: 'Chronology Build', instruction: 'Drag each event into the correct timeline slot. Click a card then a slot on mobile.' },
            { id: 'detective', label: 'Date Detective', instruction: 'Answer chronology questions to prove you understand the sequence.' },
            { id: 'sequence', label: 'Sequence Mastery', instruction: 'Tap events in chronological order — build the timeline from memory.' },
            { id: 'finale', label: 'Era Finale', instruction: 'Place the missing keystone event that bridges two known milestones.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;
        this.hintsLeft = 2;

        this.slots = [];
        this.deck = [];
        this.placedEvents = {};
        this.selectedCardId = null;

        this.drills = this._buildDrills();
        this.drillIndex = 0;
        this.sequenceStep = 0;
        this.sequencePool = shuffleArray(this.events);
        this.finaleIndex = 0;
        this.finales = this._buildFinales();

        this.init();
    }

    _buildDrills() {
        const drills = [];
        for (let i = 1; i < this.events.length; i++) {
            const current = this.events[i];
            const prev = this.events[i - 1];
            const wrong = pickDistractors(this.events.map(e => e.title), prev.title, 3);
            const opts = shuffleArray([prev.title, ...wrong]);
            drills.push({
                question: `Which event happened immediately BEFORE "${current.title}"?`,
                options: opts,
                correctIndex: opts.indexOf(prev.title),
                explanation: `Correct — "${prev.title}" (${prev.date}) precedes "${current.title}" (${current.date}). ${current.desc}`,
                sourcePassage: current.sourcePassage,
            });
        }
        this.events.forEach((evt, i) => {
            if (i === 0) return;
            const wrongDates = pickDistractors(this.events.map(e => e.date), evt.date, 3);
            const opts = shuffleArray([evt.date, ...wrongDates]);
            drills.push({
                question: `What is the correct date for: "${evt.title}"?`,
                options: opts,
                correctIndex: opts.indexOf(evt.date),
                explanation: `"${evt.title}" occurred on ${evt.date}. ${evt.desc}`,
                sourcePassage: evt.sourcePassage,
            });
        });
        return shuffleArray(drills);
    }

    _buildFinales() {
        const finales = [];
        for (let i = 0; i < this.events.length - 2; i++) {
            const before = this.events[i];
            const missing = this.events[i + 1];
            const after = this.events[i + 2];
            const distractors = pickDistractors(this.events.map(e => e.title), missing.title, 3);
            const options = shuffleArray([missing.title, ...distractors]);
            finales.push({
                before, missing, after,
                question: `Between "${before.title}" and "${after.title}", which event fills the gap?`,
                options,
                correctIndex: options.indexOf(missing.title),
                explanation: `The missing link is "${missing.title}" (${missing.date}). ${missing.desc}`,
                sourcePassage: missing.sourcePassage,
            });
        }
        return finales.length ? finales : [{
            before: this.events[0],
            missing: this.events[1] || this.events[0],
            after: this.events[2] || this.events[1],
            question: `Which event belongs in this era timeline?`,
            options: shuffleArray(this.events.map(e => e.title)),
            correctIndex: 0,
            explanation: this.events[0].desc,
            sourcePassage: this.events[0].sourcePassage,
        }];
    }

    init() {
        this._enterPhase();
    }

    _enterPhase() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'build') {
            this.slots = this.events.map((e, index) => ({ index, expectedOrder: e.order, label: `Era ${index + 1}` }));
            this.deck = shuffleArray(this.events);
            this.placedEvents = {};
        }
        if (phase === 'sequence') {
            this.sequenceStep = 0;
            this.sequencePool = shuffleArray(this.events);
        }
        this.render();
    }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'build') body += this._renderBuild();
        else if (phase === 'detective') body += this._renderDetective();
        else if (phase === 'sequence') body += this._renderSequence();
        else body += this._renderFinale();

        this.container.innerHTML = `<div class="timeline-game-container">${body}</div>`;
        this._bindPhaseEvents();
    }

    _renderBuild() {
        return `
          <div class="timeline-track">
            ${this.slots.map(slot => {
                const placed = this.placedEvents[slot.index];
                return `
                  <div class="timeline-slot ${placed ? 'filled' : ''}" data-slot-index="${slot.index}">
                    <span class="slot-marker">${slot.label}</span>
                    ${placed ? `
                      <div class="placed-card">
                        <span class="event-date-hint">${placed.date}</span>
                        <div class="event-title">${placed.title}</div>
                        <button class="btn-remove-placed" data-remove-slot="${slot.index}"><i class="fa-solid fa-trash-can"></i></button>
                      </div>` : `<div class="slot-placeholder"><i class="fa-solid fa-arrow-down-to-bracket"></i> Drop Here</div>`}
                  </div>`;
            }).join('')}
          </div>
          <div class="timeline-deck" id="timeline-event-deck">
            ${this.deck.map(evt => {
                if (Object.values(this.placedEvents).some(pe => pe.id === evt.id)) return '';
                return `
                  <div class="event-card ${this.selectedCardId === evt.id ? 'active-drag' : ''}" draggable="true" data-event-id="${evt.id}">
                    <span class="event-date-hint"><i class="fa-solid fa-calendar-days"></i> ${evt.date}</span>
                    <div class="event-title">${evt.title}</div>
                  </div>`;
            }).join('')}
          </div>
          ${this.hintsLeft > 0 ? `<button class="btn-hint glass-panel" id="btn-timeline-hint"><i class="fa-solid fa-lightbulb"></i> Reveal Next Slot (${this.hintsLeft} left)</button>` : ''}`;
    }

    _renderDetective() {
        if (this.drillIndex >= this.drills.length) return '<p class="phase-complete-msg">Detective phase complete!</p>';
        const d = this.drills[this.drillIndex];
        return renderMCQPanel(d.question, d.options, 'timeline-drill');
    }

    _renderSequence() {
        const nextExpected = this.events[this.sequenceStep];
        const remaining = this.sequencePool.filter(e => !e._picked);
        return `
          <div class="sequence-mastery-board glass-panel">
            <div class="sequence-progress">Event ${this.sequenceStep + 1} of ${this.events.length}</div>
            <p class="sequence-prompt">Tap the event that comes <strong>next</strong> in chronological order:</p>
            <div class="sequence-card-grid">
              ${remaining.map(evt => `
                <button class="sequence-pick-card" data-event-id="${evt.id}">
                  <span class="event-date-hint">${evt.date}</span>
                  <span class="event-title">${evt.title}</span>
                </button>`).join('')}
            </div>
            <div class="sequence-built">
              ${this.events.filter(e => e._picked).map(e => `<span class="built-chip">${e.title}</span>`).join('<i class="fa-solid fa-chevron-right seq-arrow"></i>')}
            </div>
          </div>`;
    }

    _renderFinale() {
        if (this.finaleIndex >= this.finales.length) return '<p class="phase-complete-msg">Finale complete!</p>';
        const f = this.finales[this.finaleIndex];
        return `
          <div class="finale-bridge glass-panel">
            <div class="bridge-timeline">
              <div class="bridge-node"><span>${f.before.date}</span><strong>${f.before.title}</strong></div>
              <div class="bridge-gap"><i class="fa-solid fa-question"></i> MISSING</div>
              <div class="bridge-node"><span>${f.after.date}</span><strong>${f.after.title}</strong></div>
            </div>
            ${renderMCQPanel(f.question, f.options, 'timeline-finale')}
          </div>`;
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'build') this._bindBuild();
        else if (phase === 'detective') this._bindDetective();
        else if (phase === 'sequence') this._bindSequence();
        else this._bindFinale();
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

    _bindDetective() {
        bindMCQChoices(this.container, (idx, card) => {
            const d = this.drills[this.drillIndex];
            if (idx === d.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card);
                this.onStepFeedback(true, d.explanation, d.sourcePassage);
                this.drillIndex++;
                if (this.drillIndex >= this.drills.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, `Not quite. Re-read the timeline logic. ${d.explanation}`, d.sourcePassage);
            }
        });
    }

    _bindSequence() {
        this.container.querySelectorAll('.sequence-pick-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const evt = this.events.find(e => e.id === btn.dataset.eventId);
                const expected = this.events[this.sequenceStep];
                if (evt.id === expected.id) {
                    evt._picked = true;
                    this.streak++;
                    btn.classList.add('correct-pick');
                    celebrateAt(btn, ['#00f2fe', '#9b51e0']);
                    this.onStepFeedback(true, `Correct order! ${evt.title} (${evt.date}) — ${evt.desc}`, evt.sourcePassage);
                    this.sequenceStep++;
                    if (this.sequenceStep >= this.events.length) {
                        this.events.forEach(e => delete e._picked);
                        setTimeout(() => this._advancePhase(), 700);
                    } else setTimeout(() => this.render(), 350);
                } else {
                    this.streak = 0;
                    LoreboundFX?.shake(btn);
                    this.onStepFeedback(false, `Wrong sequence. After "${this.sequenceStep ? this.events[this.sequenceStep - 1].title : 'the start'}", the next event is "${expected.title}".`, expected.sourcePassage);
                }
            });
        });
    }

    _bindFinale() {
        bindMCQChoices(this.container, (idx, card) => {
            const f = this.finales[this.finaleIndex];
            if (idx === f.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card);
                this.onStepFeedback(true, f.explanation, f.sourcePassage);
                this.finaleIndex++;
                if (this.finaleIndex >= this.finales.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, `That bridge event doesn't fit. ${f.explanation}`, f.sourcePassage);
            }
        });
    }

    handlePlacement(eventId, slotIndex) {
        const eventObj = this.events.find(e => e.id === eventId);
        if (!eventObj) return;
        const slotIdxInt = parseInt(slotIndex, 10);
        if (eventObj.order === slotIdxInt) {
            this.placedEvents[slotIndex] = eventObj;
            this.streak++;
            const slot = this.container.querySelector(`[data-slot-index="${slotIndex}"]`);
            slot?.classList.add('correct-flash');
            celebrateAt(slot);
            this.onStepFeedback(true, `Correct! ${eventObj.title} occurred in ${eventObj.date}. ${eventObj.desc}`, eventObj.sourcePassage);
            if (Object.keys(this.placedEvents).length === this.events.length) setTimeout(() => this._advancePhase(), 800);
            else this.render();
        } else {
            this.streak = 0;
            const card = this.container.querySelector(`[data-event-id="${eventId}"]`);
            LoreboundFX?.shake(card);
            this.onStepFeedback(false, `Incorrect. ${eventObj.title} (${eventObj.date}) does not belong in Era ${slotIdxInt + 1}.`, eventObj.sourcePassage);
        }
    }

    _advancePhase() {
        this.phaseIndex++;
        if (this.phaseIndex >= this.phases.length) this.onGameComplete(true);
        else this._enterPhase();
    }
}

// --------------------------------------------------------------------------
// 2. PROCESS LOOP — 4 phases per level
// --------------------------------------------------------------------------
class ProcessGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.stages = payload.stages;
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'navigate', label: 'Cycle Navigator', instruction: 'Answer each stage challenge to advance the process loop.' },
            { id: 'reorder', label: 'Sequence Reorder', instruction: 'Drag stages into the correct cyclic order (top = start).' },
            { id: 'simulate', label: 'Parameter Simulation', instruction: 'Tune the system dial to the correct operating condition for each stage.' },
            { id: 'chain', label: 'Chain Lock', instruction: 'Connect each stage output to the correct next-stage input.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;
        this.currentActiveStage = 0;
        this.reorderList = shuffleArray(this.stages.map(s => ({ ...s })));
        this.simIndex = 0;
        this.chainIndex = 0;
        this.chainLinks = this._buildChainLinks();

        this.init();
    }

    _buildChainLinks() {
        return this.stages.slice(0, -1).map((stage, i) => {
            const next = this.stages[i + 1];
            const wrong = pickDistractors(this.stages.map(s => s.title), next.title, 3);
            const options = shuffleArray([next.title, ...wrong]);
            return {
                from: stage,
                to: next,
                question: `After "${stage.title}", which stage receives the flow next?`,
                options,
                correctIndex: options.indexOf(next.title),
                explanation: `Correct — ${stage.title} leads into ${next.title}. ${next.desc}`,
                sourcePassage: next.sourcePassage,
            };
        });
    }

    init() { this.render(); }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'navigate') body += this._renderNavigate();
        else if (phase === 'reorder') body += this._renderReorder();
        else if (phase === 'simulate') body += this._renderSimulate();
        else body += this._renderChain();

        this.container.innerHTML = `<div class="process-game-container">${body}</div>`;
        this._bindPhaseEvents();
    }

    _renderNavigate() {
        const current = this.stages[this.currentActiveStage];
        return `
          <div class="process-loop-visualizer">
            ${this.stages.map((stage, idx) => {
                let cls = idx < this.currentActiveStage ? 'completed' : idx === this.currentActiveStage ? 'active' : '';
                const angle = (idx / this.stages.length) * 2 * Math.PI - Math.PI / 2;
                const r = 120, cx = 160, cy = 160;
                const x = Math.round(cx + r * Math.cos(angle) - 22);
                const y = Math.round(cy + r * Math.sin(angle) - 22);
                return `<div class="process-node ${cls}" style="left:${x}px;top:${y}px" title="${stage.title}">${idx < this.currentActiveStage ? '<i class="fa-solid fa-check"></i>' : idx + 1}</div>`;
            }).join('')}
            <div class="process-center-card">
              <span class="title">Active Stage</span>
              <span class="body">${current.title}</span>
            </div>
          </div>
          ${renderMCQPanel(current.question, current.options)}`;
    }

    _renderReorder() {
        return `
          <div class="reorder-board glass-panel">
            <p class="reorder-hint"><i class="fa-solid fa-arrows-up-down"></i> Drag to reorder — position 1 is the cycle entry point.</p>
            <div class="reorder-list" id="process-reorder-list">
              ${this.reorderList.map((s, i) => `
                <div class="reorder-item" draggable="true" data-stage-id="${s.id}" data-current-idx="${i}">
                  <span class="reorder-grip"><i class="fa-solid fa-grip-vertical"></i></span>
                  <span class="reorder-num">${i + 1}</span>
                  <span class="reorder-title">${s.title}</span>
                </div>`).join('')}
            </div>
            <button class="btn-primary-glow" id="btn-submit-reorder"><i class="fa-solid fa-check-double"></i> Lock Sequence</button>
          </div>`;
    }

    _renderSimulate() {
        const stage = this.stages[this.simIndex];
        const params = stage.simParams || this._defaultSimParams(stage);
        return `
          <div class="sim-panel glass-panel">
            <h3><i class="fa-solid fa-sliders"></i> ${stage.title}</h3>
            <p class="sim-desc">${stage.desc}</p>
            <div class="sim-dial-wrap">
              <label>${params.label}</label>
              <input type="range" id="sim-dial" min="0" max="100" value="50" class="sim-slider">
              <div class="sim-value" id="sim-value">50%</div>
            </div>
            <p class="sim-target-hint"><i class="fa-solid fa-crosshairs"></i> Target zone: ${params.targetMin}–${params.targetMax}%</p>
            <button class="btn-primary-glow" id="btn-submit-sim">Apply Parameters</button>
          </div>`;
    }

    _defaultSimParams(stage) {
        const hash = stage.title.length * 7 + stage.desc.length;
        const target = 35 + (hash % 40);
        return { label: 'System Intensity', targetMin: target - 8, targetMax: target + 8, target };
    }

    _renderChain() {
        if (this.chainIndex >= this.chainLinks.length) return '<p class="phase-complete-msg">Chain locked!</p>';
        const link = this.chainLinks[this.chainIndex];
        return `
          <div class="chain-lock-panel glass-panel">
            <div class="chain-from"><i class="fa-solid fa-circle-dot"></i> ${link.from.title}</div>
            <div class="chain-arrow"><i class="fa-solid fa-arrow-down"></i></div>
            ${renderMCQPanel(link.question, link.options, 'chain-mcq')}
          </div>`;
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'navigate') this._bindNavigate();
        else if (phase === 'reorder') this._bindReorder();
        else if (phase === 'simulate') this._bindSimulate();
        else this._bindChain();
    }

    _bindNavigate() {
        bindMCQChoices(this.container, (idx, card) => {
            const stage = this.stages[this.currentActiveStage];
            if (idx === stage.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card, ['#ff4081', '#f50057']);
                this.onStepFeedback(true, `Correct! ${stage.title} — ${stage.desc}`, stage.sourcePassage);
                this.currentActiveStage++;
                if (this.currentActiveStage >= this.stages.length) setTimeout(() => { this.currentActiveStage = 0; this._advancePhase(); }, 800);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, `Incorrect. ${stage.rationale}`, stage.sourcePassage);
            }
        });
    }

    _bindReorder() {
        const list = this.container.querySelector('#process-reorder-list');
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
                celebrateAt(list);
                this.onStepFeedback(true, 'Perfect cycle order! You mapped the full process sequence.', this.stages[0].sourcePassage);
                setTimeout(() => this._advancePhase(), 700);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(list);
                this.onStepFeedback(false, 'Sequence incorrect. Trace the process from its natural entry point through each transition.', this.stages[0].sourcePassage);
            }
        });
    }

    _bindSimulate() {
        const dial = this.container.querySelector('#sim-dial');
        const valEl = this.container.querySelector('#sim-value');
        dial?.addEventListener('input', () => { valEl.textContent = `${dial.value}%`; });
        this.container.querySelector('#btn-submit-sim')?.addEventListener('click', () => {
            const stage = this.stages[this.simIndex];
            const params = stage.simParams || this._defaultSimParams(stage);
            const val = parseInt(dial.value, 10);
            if (val >= params.targetMin && val <= params.targetMax) {
                this.streak++;
                celebrateAt(dial);
                this.onStepFeedback(true, `Parameters stable for ${stage.title}! ${stage.desc}`, stage.sourcePassage);
                this.simIndex++;
                if (this.simIndex >= this.stages.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(dial);
                this.onStepFeedback(false, `Out of optimal range. Adjust ${params.label} to ${params.targetMin}–${params.targetMax}% for ${stage.title}.`, stage.sourcePassage);
            }
        });
    }

    _bindChain() {
        bindMCQChoices(this.container, (idx, card) => {
            const link = this.chainLinks[this.chainIndex];
            if (idx === link.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card);
                this.onStepFeedback(true, link.explanation, link.sourcePassage);
                this.chainIndex++;
                if (this.chainIndex >= this.chainLinks.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, `Wrong connection. ${link.explanation}`, link.sourcePassage);
            }
        });
    }

    _advancePhase() {
        this.phaseIndex++;
        if (this.phaseIndex >= this.phases.length) this.onGameComplete(true);
        else {
            if (this.phases[this.phaseIndex].id === 'reorder') this.reorderList = shuffleArray(this.stages.map(s => ({ ...s })));
            if (this.phases[this.phaseIndex].id === 'simulate') this.simIndex = 0;
            if (this.phases[this.phaseIndex].id === 'chain') this.chainIndex = 0;
            this.render();
        }
    }
}

// --------------------------------------------------------------------------
// 3. CAUSE-EFFECT CHAIN — 4 phases per level
// --------------------------------------------------------------------------
class CauseEffectGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.chains = payload.chains;
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'link', label: 'Causal Linking', instruction: 'Drag each cause to its matching downstream effect.' },
            { id: 'ripple', label: 'Ripple Predictor', instruction: 'Given a trigger, predict the direct ecological effect.' },
            { id: 'order', label: 'Chain Assembly', instruction: 'Arrange cause-effect pairs in the order they unfold in the system.' },
            { id: 'inference', label: 'Inference Boss', instruction: 'What happens if an intermediate link in the chain is removed?' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;

        this.shuffledCauses = shuffleArray(this.chains);
        this.matchedEffects = {};
        this.selectedCauseId = null;

        this.rippleIndex = 0;
        this.ripples = this.chains.map(c => {
            const wrong = pickDistractors(this.chains.map(x => x.effect), c.effect, 3);
            const options = shuffleArray([c.effect, ...wrong]);
            return { ...c, options, correctIndex: options.indexOf(c.effect) };
        });

        this.orderList = shuffleArray(this.chains.map(c => ({ ...c })));
        this.inferenceIndex = 0;
        this.inferences = this._buildInferences();

        this.init();
    }

    _buildInferences() {
        if (this.chains.length < 2) return [];
        return this.chains.slice(1).map((chain, i) => {
            const removed = this.chains[i];
            const wrong = pickDistractors([
                'The downstream effects would still occur unchanged',
                'Only unrelated systems would be affected',
                'The chain would accelerate dramatically',
            ], `Downstream effects after "${removed.effect}" may not occur as documented`, 2);
            const correct = `Removing "${removed.cause}" breaks the pathway to "${chain.effect}"`;
            const options = shuffleArray([correct, ...wrong]);
            return {
                question: `If "${removed.cause}" → "${removed.effect}" is blocked, what is the most likely impact on "${chain.effect}"?`,
                options,
                correctIndex: options.indexOf(correct),
                explanation: `Causal chains depend on intermediate links. Without "${removed.cause}", the pathway to "${chain.effect}" is disrupted. ${chain.rationale}`,
                sourcePassage: chain.sourcePassage,
            };
        });
    }

    init() { this.render(); }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'link') body += this._renderLink();
        else if (phase === 'ripple') body += this._renderRipple();
        else if (phase === 'order') body += this._renderOrder();
        else body += this._renderInference();

        this.container.innerHTML = `<div class="timeline-game-container">${body}</div>`;
        this._bindPhaseEvents();
    }

    _renderLink() {
        return `
          <div class="cause-effect-container">
            <div class="cause-effect-column">
              <div class="column-header"><i class="fa-solid fa-bolt"></i> Source Cause</div>
              ${this.shuffledCauses.map(c => {
                if (Object.values(this.matchedEffects).some(m => m.id === c.id)) return `<div class="cause-card matched-ghost">${c.cause}</div>`;
                return `<div class="cause-card ${this.selectedCauseId === c.id ? 'active-drag' : ''}" draggable="true" data-cause-id="${c.id}">${c.cause}</div>`;
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
                      <div class="effect-slot-label">${item.effect}</div>
                      <div class="slot-placeholder"><i class="fa-solid fa-arrow-down-to-bracket"></i> Drop Cause Here</div>`}
                  </div>`;
              }).join('')}
            </div>
          </div>`;
    }

    _renderRipple() {
        if (this.rippleIndex >= this.ripples.length) return '<p class="phase-complete-msg">Ripple analysis complete!</p>';
        const r = this.ripples[this.rippleIndex];
        return `
          <div class="ripple-panel glass-panel">
            <div class="ripple-cause"><i class="fa-solid fa-bolt"></i> ${r.cause}</div>
            ${renderMCQPanel('Which effect does this cause produce?', r.options, 'ripple-mcq')}
          </div>`;
    }

    _renderOrder() {
        return `
          <div class="reorder-board glass-panel">
            <p class="reorder-hint">Drag pairs into the order the causal chain unfolds (top = first trigger).</p>
            <div class="reorder-list" id="ce-reorder-list">
              ${this.orderList.map((c, i) => `
                <div class="reorder-item" draggable="true" data-chain-id="${c.id}" data-current-idx="${i}">
                  <span class="reorder-grip"><i class="fa-solid fa-grip-vertical"></i></span>
                  <span class="reorder-num">${i + 1}</span>
                  <span class="reorder-title"><strong>${c.cause}</strong> → ${c.effect}</span>
                </div>`).join('')}
            </div>
            <button class="btn-primary-glow" id="btn-submit-ce-order"><i class="fa-solid fa-link"></i> Submit Chain Order</button>
          </div>`;
    }

    _renderInference() {
        if (!this.inferences.length || this.inferenceIndex >= this.inferences.length) return '<p class="phase-complete-msg">Inference boss defeated!</p>';
        const inf = this.inferences[this.inferenceIndex];
        return `<div class="inference-panel glass-panel">${renderMCQPanel(inf.question, inf.options, 'inference-mcq')}</div>`;
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'link') this._bindLink();
        else if (phase === 'ripple') this._bindRipple();
        else if (phase === 'order') this._bindOrder();
        else this._bindInference();
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
            celebrateAt(this.container, ['#26c6da', '#ff9100']);
            this.onStepFeedback(true, `Correct! ${causeObj.cause} leads to: ${causeObj.effect}. ${causeObj.rationale}`, causeObj.sourcePassage);
            if (Object.keys(this.matchedEffects).length === this.chains.length) setTimeout(() => this._advancePhase(), 800);
            else this.render();
        } else {
            this.streak = 0;
            const target = this.chains.find(c => c.id === effectId);
            this.onStepFeedback(false, `Incorrect. "${causeObj.cause}" does not cause "${target.effect}".`, causeObj.sourcePassage);
        }
    }

    _bindRipple() {
        bindMCQChoices(this.container, (idx, card) => {
            const r = this.ripples[this.rippleIndex];
            if (idx === r.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card);
                this.onStepFeedback(true, `Correct ripple! ${r.rationale}`, r.sourcePassage);
                this.rippleIndex++;
                if (this.rippleIndex >= this.ripples.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, `Wrong effect. ${r.rationale}`, r.sourcePassage);
            }
        });
    }

    _bindOrder() {
        const list = this.container.querySelector('#ce-reorder-list');
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
        this.container.querySelector('#btn-submit-ce-order')?.addEventListener('click', () => {
            const ids = [...list.querySelectorAll('.reorder-item')].map(el => el.dataset.chainId);
            const correct = this.chains.every((c, i) => ids[i] === c.id);
            if (correct) {
                this.streak++;
                celebrateAt(list);
                this.onStepFeedback(true, 'Chain order locked! You traced the full causal cascade.', this.chains[0].sourcePassage);
                setTimeout(() => this._advancePhase(), 700);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(list);
                this.onStepFeedback(false, 'Order incorrect. Follow the chain from the initial trigger through each downstream effect.', this.chains[0].sourcePassage);
            }
        });
    }

    _bindInference() {
        bindMCQChoices(this.container, (idx, card) => {
            const inf = this.inferences[this.inferenceIndex];
            if (idx === inf.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card);
                this.onStepFeedback(true, inf.explanation, inf.sourcePassage);
                this.inferenceIndex++;
                if (this.inferenceIndex >= this.inferences.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, inf.explanation, inf.sourcePassage);
            }
        });
    }

    _advancePhase() {
        this.phaseIndex++;
        if (this.phaseIndex >= this.phases.length) this.onGameComplete(true);
        else {
            if (this.phases[this.phaseIndex].id === 'link') {
                this.shuffledCauses = shuffleArray(this.chains);
                this.matchedEffects = {};
            }
            if (this.phases[this.phaseIndex].id === 'order') this.orderList = shuffleArray(this.chains.map(c => ({ ...c })));
            this.render();
        }
    }
}

// --------------------------------------------------------------------------
// 4. COMPARISON SORTER — 4 phases (full deck)
// --------------------------------------------------------------------------
class ComparisonGame {
    constructor(container, payload, onStepFeedback, onGameComplete) {
        this.container = container;
        this.categories = payload.categories;
        this.allCards = payload.cards;
        this.onStepFeedback = onStepFeedback;
        this.onGameComplete = onGameComplete;

        this.phases = [
            { id: 'sort', label: 'Attribute Sort', instruction: 'Swipe or click to sort each attribute into the correct category.' },
            { id: 'trap', label: 'Trap Hunter', instruction: 'Three statements appear — identify the one that does NOT belong.' },
            { id: 'memory', label: 'Memory Match', instruction: 'Flip cards and match each attribute to its category.' },
            { id: 'debate', label: 'Policy Debate', instruction: 'Given a scenario, choose which category\'s framework applies.' },
        ];
        this.phaseIndex = 0;
        this.streak = 0;

        this.deck = shuffleArray(this.allCards);
        this.currentCardIndex = 0;
        this.roundSize = Math.min(10, Math.ceil(this.allCards.length / 2));
        this.sortRound = 0;
        this.maxSortRounds = Math.ceil(this.allCards.length / this.roundSize);

        this.trapIndex = 0;
        this.traps = this._buildTraps();
        this.memoryPairs = this._buildMemoryPairs();
        this.memoryFlipped = [];
        this.memoryMatched = new Set();
        this.memoryLock = false;
        this.debateIndex = 0;
        this.debates = this._buildDebates();

        this.init();
    }

    _buildTraps() {
        const traps = [];
        const byCat = {};
        this.allCards.forEach(c => { byCat[c.category] = byCat[c.category] || []; byCat[c.category].push(c); });
        const cats = Object.keys(byCat);
        cats.forEach(cat => {
            const own = byCat[cat];
            const otherCat = cats.find(c => c !== cat);
            if (!own.length || !otherCat || !byCat[otherCat].length) return;
            const trapCard = byCat[otherCat][0];
            const decoys = shuffleArray(own).slice(0, 2);
            const statements = shuffleArray([...decoys.map(d => d.text), trapCard.text]);
            traps.push({
                statements,
                trapText: trapCard.text,
                trapCategory: trapCard.category,
                correctCategory: cat,
                explanation: `"${trapCard.text}" belongs to ${trapCard.category}, not ${cat}. ${trapCard.rationale}`,
                sourcePassage: trapCard.sourcePassage,
            });
        });
        return shuffleArray(traps).slice(0, Math.min(8, traps.length));
    }

    _buildMemoryPairs() {
        const selected = shuffleArray(this.allCards).slice(0, Math.min(8, this.allCards.length));
        const tiles = [];
        selected.forEach((c, i) => {
            const pid = `pair-${i}`;
            tiles.push({ id: `mem-t-${i}`, pairId: pid, display: c.text.substring(0, 70) + (c.text.length > 70 ? '…' : ''), kind: 'text', sourcePassage: c.sourcePassage, rationale: c.rationale });
            tiles.push({ id: `mem-c-${i}`, pairId: pid, display: c.category, kind: 'category', sourcePassage: c.sourcePassage, rationale: c.rationale });
        });
        return shuffleArray(tiles);
    }

    _buildDebates() {
        return this.allCards.slice(0, Math.min(6, this.allCards.length)).map(card => {
            const wrong = this.categories.find(c => c !== card.category);
            const scenarios = [
                `A policymaker cites: "${card.text}" — which energy framework does this support?`,
                `In a classroom debate, a student claims: "${card.text}" — which camp is correct?`,
                `Your briefing note includes: "${card.text}" — classify this claim.`,
            ];
            return {
                question: scenarios[Math.floor(Math.random() * scenarios.length)],
                options: shuffleArray([...this.categories]),
                correctIndex: 0,
                fixCat: card.category,
                explanation: `This statement aligns with ${card.category}. ${card.rationale}`,
                sourcePassage: card.sourcePassage,
            };
        }).map(d => {
            const idx = d.options.indexOf(d.fixCat);
            if (idx > 0) { [d.options[0], d.options[idx]] = [d.options[idx], d.options[0]]; }
            d.correctIndex = 0;
            return d;
        });
    }

    init() { this.render(); }

    _currentSortDeck() {
        const start = this.sortRound * this.roundSize;
        return this.deck.slice(start, start + this.roundSize);
    }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = renderPhaseHUD(this);
        if (phase === 'sort') body += this._renderSort();
        else if (phase === 'trap') body += this._renderTrap();
        else if (phase === 'memory') body += this._renderMemory();
        else body += this._renderDebate();

        this.container.innerHTML = `<div class="comparison-container">${body}</div>`;
        this._bindPhaseEvents();
    }

    _renderSort() {
        const roundDeck = this._currentSortDeck();
        const localIdx = this.currentCardIndex - this.sortRound * this.roundSize;
        if (localIdx >= roundDeck.length) {
            if (this.sortRound + 1 < this.maxSortRounds) {
                return `<p class="phase-complete-msg">Round ${this.sortRound + 1} complete! Loading next round...</p>`;
            }
            return '<p class="phase-complete-msg">Sort phase complete!</p>';
        }
        const current = roundDeck[localIdx];
        const next = roundDeck[localIdx + 1];
        return `
          <div class="sort-round-badge">Round ${this.sortRound + 1}/${this.maxSortRounds} • Card ${localIdx + 1}/${roundDeck.length}</div>
          <div class="sorter-deck-area">
            <div class="sorter-card active" id="active-sorter-card">
              <div class="sorter-card-content"><h4>Attribute</h4><p>${current.text}</p></div>
            </div>
            ${next ? `<div class="sorter-card back"><div class="sorter-card-content"><h4>Attribute</h4><p>${next.text}</p></div></div>` : ''}
          </div>
          <div class="sorter-buckets-row">
            <button class="sorter-bucket-btn" id="btn-sort-left" data-category="${this.categories[0]}">
              <i class="fa-solid fa-leaf bucket-icon"></i><span class="bucket-name">${this.categories[0]}</span>
              <span class="bucket-hint">[← or click]</span>
            </button>
            <button class="sorter-bucket-btn" id="btn-sort-right" data-category="${this.categories[1]}">
              <i class="fa-solid fa-fire bucket-icon"></i><span class="bucket-name">${this.categories[1]}</span>
              <span class="bucket-hint">[→ or click]</span>
            </button>
          </div>`;
    }

    _renderTrap() {
        if (this.trapIndex >= this.traps.length) return '<p class="phase-complete-msg">All traps identified!</p>';
        const t = this.traps[this.trapIndex];
        return `
          <div class="trap-panel glass-panel">
            <h3><i class="fa-solid fa-spider"></i> Which statement does NOT belong to ${t.correctCategory}?</h3>
            <div class="trap-options">
              ${t.statements.map((s, i) => `
                <button class="trap-option-card" data-trap-idx="${i}">${s}</button>`).join('')}
            </div>
          </div>`;
    }

    _renderMemory() {
        if (this.memoryMatched.size >= this.memoryPairs.length) return '<p class="phase-complete-msg">Memory matrix cleared!</p>';
        const pairTotal = this.memoryPairs.length / 2;
        return `
          <div class="memory-grid">
            ${this.memoryPairs.map(p => {
                const matched = this.memoryMatched.has(p.id);
                const flipped = this.memoryFlipped.includes(p.id) || matched;
                return `
                  <button class="memory-card ${flipped ? 'flipped' : ''} ${matched ? 'matched' : ''}" data-mem-id="${p.id}">
                    <span class="memory-front"><i class="fa-solid fa-question"></i></span>
                    <span class="memory-back ${p.kind === 'category' ? 'mem-category' : ''}">${p.display}</span>
                  </button>`;
            }).join('')}
          </div>
          <p class="memory-hint">Match each attribute to its category. Pairs found: ${this.memoryMatched.size / 2}/${pairTotal}</p>`;
    }

    _renderDebate() {
        if (this.debateIndex >= this.debates.length) return '<p class="phase-complete-msg">Debate phase won!</p>';
        const d = this.debates[this.debateIndex];
        return `<div class="debate-panel glass-panel">${renderMCQPanel(d.question, d.options, 'debate-mcq')}</div>`;
    }

    _bindPhaseEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'sort') this._bindSort();
        else if (phase === 'trap') this._bindTrap();
        else if (phase === 'memory') this._bindMemory();
        else this._bindDebate();
    }

    _bindSort() {
        const roundDeck = this._currentSortDeck();
        const localIdx = this.currentCardIndex - this.sortRound * this.roundSize;
        if (localIdx >= roundDeck.length) {
            if (this.sortRound + 1 < this.maxSortRounds) {
                setTimeout(() => { this.sortRound++; this.render(); }, 600);
            } else setTimeout(() => this._advancePhase(), 600);
            return;
        }
        const left = this.container.querySelector('#btn-sort-left');
        const right = this.container.querySelector('#btn-sort-right');
        const handler = (cat, dir) => this.handleSort(cat, dir);
        left?.addEventListener('click', () => handler(this.categories[0], 'left'));
        right?.addEventListener('click', () => handler(this.categories[1], 'right'));
        this._sortKeyHandler = e => {
            if (e.key === 'ArrowLeft') handler(this.categories[0], 'left');
            if (e.key === 'ArrowRight') handler(this.categories[1], 'right');
        };
        document.addEventListener('keydown', this._sortKeyHandler);
    }

    handleSort(selectedCategory, swipeDirection) {
        const roundDeck = this._currentSortDeck();
        const localIdx = this.currentCardIndex - this.sortRound * this.roundSize;
        const currentCard = roundDeck[localIdx];
        if (!currentCard) return;
        const cardEl = this.container.querySelector('#active-sorter-card');
        if (cardEl) cardEl.classList.add(swipeDirection === 'left' ? 'swipe-left-anim' : 'swipe-right-anim');
        document.removeEventListener('keydown', this._sortKeyHandler);

        setTimeout(() => {
            const correct = selectedCategory === currentCard.category;
            if (correct) {
                this.streak++;
                celebrateAt(cardEl, ['#69f0ae', '#00e676']);
                this.onStepFeedback(true, `Correct! ${currentCard.text} → ${currentCard.category}. ${currentCard.rationale}`, currentCard.sourcePassage);
            } else {
                this.streak = 0;
                this.onStepFeedback(false, `Incorrect. "${currentCard.text}" belongs to ${currentCard.category}. ${currentCard.rationale}`, currentCard.sourcePassage);
            }
            this.currentCardIndex++;
            const newLocal = this.currentCardIndex - this.sortRound * this.roundSize;
            if (newLocal >= roundDeck.length) {
                if (this.sortRound + 1 < this.maxSortRounds) { this.sortRound++; this.render(); }
                else this._advancePhase();
            } else this.render();
        }, 400);
    }

    _bindTrap() {
        this.container.querySelectorAll('.trap-option-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = this.traps[this.trapIndex];
                const chosen = t.statements[parseInt(btn.dataset.trapIdx, 10)];
                if (chosen === t.trapText) {
                    this.streak++;
                    btn.classList.add('correct-pick');
                    celebrateAt(btn);
                    this.onStepFeedback(true, `Trap spotted! ${t.explanation}`, t.sourcePassage);
                    this.trapIndex++;
                    if (this.trapIndex >= this.traps.length) setTimeout(() => this._advancePhase(), 700);
                    else setTimeout(() => this.render(), 400);
                } else {
                    this.streak = 0;
                    LoreboundFX?.shake(btn);
                    this.onStepFeedback(false, `That's a valid ${t.correctCategory} claim. Find the imposter. ${t.explanation}`, t.sourcePassage);
                }
            });
        });
    }

    _bindMemory() {
        this.container.querySelectorAll('.memory-card:not(.matched)').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.memoryLock) return;
                const id = btn.dataset.memId;
                if (this.memoryFlipped.includes(id) || this.memoryMatched.has(id)) return;
                this.memoryFlipped.push(id);
                btn.classList.add('flipped');
                if (this.memoryFlipped.length === 2) {
                    this.memoryLock = true;
                    const [a, b] = this.memoryFlipped.map(fid => this.memoryPairs.find(p => p.id === fid));
                    setTimeout(() => {
                        if (a.pairId === b.pairId && a.id !== b.id) {
                            this.memoryMatched.add(a.id);
                            this.memoryMatched.add(b.id);
                            this.streak++;
                            celebrateAt(btn);
                            this.onStepFeedback(true, `Match found! ${a.rationale}`, a.sourcePassage);
                            if (this.memoryMatched.size >= this.memoryPairs.length) setTimeout(() => this._advancePhase(), 700);
                        } else if (a.id !== b.id) {
                            this.streak = 0;
                            this.onStepFeedback(false, `No match — try again. ${a.rationale}`, a.sourcePassage);
                        }
                        this.memoryFlipped = [];
                        this.memoryLock = false;
                        this.render();
                    }, 900);
                }
            });
        });
    }

    _bindDebate() {
        bindMCQChoices(this.container, (idx, card) => {
            const d = this.debates[this.debateIndex];
            if (idx === d.correctIndex) {
                this.streak++;
                card.classList.add('correct-pick');
                celebrateAt(card);
                this.onStepFeedback(true, d.explanation, d.sourcePassage);
                this.debateIndex++;
                if (this.debateIndex >= this.debates.length) setTimeout(() => this._advancePhase(), 700);
                else setTimeout(() => this.render(), 400);
            } else {
                this.streak = 0;
                LoreboundFX?.shake(card);
                this.onStepFeedback(false, d.explanation, d.sourcePassage);
            }
        });
    }

    _advancePhase() {
        this.phaseIndex++;
        if (this.phaseIndex >= this.phases.length) this.onGameComplete(true);
        else {
            if (this.phases[this.phaseIndex].id === 'sort') {
                this.currentCardIndex = 0;
                this.sortRound = 0;
            }
            this.render();
        }
    }

    addEventListeners() { this._bindPhaseEvents(); }
}
