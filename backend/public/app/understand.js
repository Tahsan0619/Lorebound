/* ==========================================================================
   LOREBOUND UNDERSTANDING SESSION | Study notes, depth assessments, review, unlock
   ========================================================================== */

function dedupeSubtopics(list) {
    const seen = new Set();
    const out = [];
    for (const st of list) {
        const title = String(st.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const expl = String(st.explanation || st.body || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (!title) continue;
        const key = `${title}::${expl.slice(0, 140)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(st);
    }
    return out;
}

function extractLearnItems(category, payload) {
    if (category === 'Timeline') {
        return payload.levels.flatMap((lvl, li) => (lvl.events || []).map(e => ({
            id: e.id || `evt-${li}-${e.order}`,
            title: e.title,
            subtitle: e.date,
            body: e.desc,
            sourcePassage: e.sourcePassage,
            emoji: e.emoji || '📅',
            levelLabel: lvl.name,
        })));
    }
    if (category === 'Process') {
        return payload.phases.flatMap((ph, pi) => (ph.stages || []).map(s => ({
            id: s.id || `stg-${pi}-${s.title}`,
            title: s.title,
            subtitle: ph.name,
            body: s.desc,
            sourcePassage: s.sourcePassage,
            emoji: '⚙️',
        })));
    }
    if (category === 'CauseEffect') {
        return payload.levels.flatMap((lvl, li) => (lvl.chains || []).map(c => ({
            id: c.id || `ce-${li}-${c.cause}`,
            title: c.cause,
            subtitle: '→ ' + c.effect,
            body: c.rationale,
            sourcePassage: c.sourcePassage,
            emoji: '🔗',
            effect: c.effect,
            levelLabel: lvl.name,
        })));
    }
    return (payload.cards || []).map(c => ({
        id: c.id,
        title: c.text,
        subtitle: c.category,
        body: c.rationale,
        sourcePassage: c.sourcePassage,
        emoji: c.emoji || '🃏',
        category: c.category,
    }));
}

class UnderstandingSession {
    constructor(container, category, payload, learningGuide, title, onStepFeedback, onComplete, options = {}) {
        this.container = container;
        this.category = category;
        this.payload = payload;
        this.title = title || 'This topic';
        this.onStepFeedback = onStepFeedback;
        this.onComplete = onComplete;
        this.sourceText = options.sourceText || '';

        this.guide = learningGuide
            || (typeof buildLearningGuideFromPayload === 'function'
                ? buildLearningGuideFromPayload(category, payload, this.title, '')
                : null);
        this.subtopics = dedupeSubtopics(this.guide?.subtopics || []);
        this.items = this.subtopics.length >= 3
            ? this.subtopics.map(st => ({
                id: st.id,
                title: st.title,
                subtitle: st.examples?.[0] || '',
                body: st.explanation,
                explanation: st.explanation,
                sourcePassage: st.sourcePassage,
                emoji: st.emoji || '📘',
            }))
            : extractLearnItems(category, payload);

        const rawAssessments = options.assessments || this.guide?.assessments;
        this.assessments = (rawAssessments?.length >= 5)
            ? rawAssessments.slice(0, 5)
            : (window.LoreboundAssessments?.buildFallback
                ? LoreboundAssessments.buildFallback(this.subtopics.length ? this.subtopics : this.items, category, this.title)
                : buildFallbackAssessments(this.subtopics.length ? this.subtopics : this.items, category, this.title));

        this.phases = [
            { id: 'notes', label: 'Study Notes', instruction: 'Open the 3D study book. Read every section, including tables, steps, and examples, before the depth check.' },
            { id: 'assess', label: 'Depth Check', instruction: 'Answer each question in your own words. You will receive thoughtful feedback with no grades, only guidance.' },
            { id: 'review', label: 'Reflection Review', instruction: 'Read back your answers and the teaching feedback before unlocking the challenge.' },
            { id: 'unlock', label: 'Ready for Challenge', instruction: 'You have studied the material and reflected on it deeply. The Challenge Arena is now open!' },
        ];
        this.phaseIndex = 0;
        this.assessIndex = 0;
        this.assessCompleted = 0;
        this.notesFinished = false;
        this.reflections = [];

        document.querySelector('.game-main-area')?.classList.add('session-mode-learn');
        document.querySelector('.game-main-area')?.classList.remove('session-mode-challenge');
        this.render();
    }

    render() {
        const phase = this.phases[this.phaseIndex].id;
        let body = this._renderLearnHUD();
        if (phase === 'notes') body += this._renderNotes();
        else if (phase === 'assess') body += this._renderAssess();
        else if (phase === 'review') body += this._renderReview();
        else body += this._renderUnlock();

        mountGameShell(this.container, 'understand-session', body, this.category.toLowerCase().replace('causeeffect', 'cause'));
        this._bindEvents();
    }

    _renderLearnHUD() {
        const phase = this.phases[this.phaseIndex];
        const pct = Math.round(((this.phaseIndex + 1) / this.phases.length) * 100);
        const icons = { notes: 'fa-book-open', assess: 'fa-pen-fancy', review: 'fa-book-bookmark', unlock: 'fa-trophy' };
        const assessLabel = phase.id === 'assess'
            ? `Reflections: ${this.assessCompleted}/${this.assessments.length}`
            : '';
        return `
        <div class="learn-phase-banner glass-panel">
            <div class="learn-banner-row">
                <span class="learn-mode-tag"><i class="fa-solid fa-graduation-cap"></i> Learning Phase</span>
                <span class="learn-phase-tag"><i class="fa-solid ${icons[phase.id] || 'fa-star'}"></i> ${phase.label}</span>
                ${assessLabel ? `<span class="learn-mastery"><i class="fa-solid fa-comments"></i> ${assessLabel}</span>` : ''}
            </div>
            <div class="phase-progress-track"><div class="phase-progress-fill learn-fill" style="width:${pct}%"></div></div>
            <p class="phase-instruction">${phase.instruction}</p>
        </div>`;
    }

    _renderNotes() {
        return `<div class="learn-book-host" id="learn-book-host"></div>`;
    }

    _renderAssess() {
        const assessment = this.assessments[this.assessIndex];
        if (!assessment) return '<p class="phase-complete-msg"><i class="fa-solid fa-spinner fa-spin"></i> Loading next phase...</p>';
        return `<div class="asmt-host" id="asmt-host">${LoreboundAssessments.renderCard(assessment, this.assessIndex, this.assessments.length)}</div>`;
    }

    _renderReview() {
        return `<div class="asmt-review-host">${LoreboundAssessments.renderReviewSummary(this.reflections, this.title)}</div>`;
    }

    _renderUnlock() {
        const count = this.subtopics.length || this.items.length;
        return `
        <div class="learn-unlock-panel glass-panel">
            <div class="learn-unlock-icon"><i class="fa-solid fa-trophy"></i></div>
            <h2>Understanding Complete</h2>
            <p><strong>${this.title}</strong>: you studied <strong>${count}</strong> subtopics and reflected on <strong>${this.assessments.length}</strong> depth questions.</p>
            <div class="learn-unlock-stats">
                <div class="learn-stat"><span>${count}</span><label>Subtopics Studied</label></div>
                <div class="learn-stat"><span>${this.assessments.length}</span><label>Depth Questions</label></div>
                <div class="learn-stat"><span>${this.reflections.length}</span><label>Reflections Saved</label></div>
            </div>
            <p class="learn-unlock-desc">The <strong>Challenge Arena</strong> is now unlocked. Apply what you learned in the full interactive game!</p>
            <button class="btn btn-primary btn-primary-glow" id="btn-enter-challenge">
                <span>Enter Challenge Arena</span>
                <i class="fa-solid fa-gamepad"></i>
            </button>
        </div>`;
    }

    _bindEvents() {
        const phase = this.phases[this.phaseIndex].id;
        if (phase === 'notes') this._bindNotes();
        else if (phase === 'assess') this._bindAssess();
        else if (phase === 'review') this._bindReview();
        else this._bindUnlock();
    }

    _bindNotes() {
        const host = this.container.querySelector('#learn-book-host');
        if (!host || !window.LoreboundBookReader) return;

        this.bookReader = new LoreboundBookReader(host, {
            title: this.title,
            summary: this.guide?.summary || `Study notes for ${this.title}.`,
            takeaways: [...new Set((this.guide?.keyTakeaways || []).filter(Boolean))],
            subtopics: this.subtopics,
            onFinish: () => {
                if (this.notesFinished) return;
                this.notesFinished = true;
                this._advancePhase();
            },
        });
    }

    _bindAssess() {
        const btn = this.container.querySelector('#btn-submit-asmt');
        const input = this.container.querySelector('#asmt-answer');
        if (!btn || !input) return;

        btn.addEventListener('click', async () => {
            const answer = input.value.trim();
            if (answer.length < 10) {
                input.focus();
                input.classList.add('asmt-input-error');
                setTimeout(() => input.classList.remove('asmt-input-error'), 1200);
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reflecting on your answer…';

            const assessment = this.assessments[this.assessIndex];
            const feedback = await LoreboundAssessments.evaluate(assessment, answer, this.sourceText);

            this.reflections.push({ assessment, userAnswer: answer, feedback });

            const host = this.container.querySelector('#asmt-feedback-host');
            if (host) {
                host.classList.remove('hidden');
                host.innerHTML = LoreboundAssessments.renderFeedback(feedback);
            }

            btn.style.display = 'none';
            input.readOnly = true;

            const continueBtn = document.createElement('button');
            continueBtn.type = 'button';
            continueBtn.className = 'btn btn-primary';
            continueBtn.id = 'btn-asmt-continue';
            continueBtn.innerHTML = this.assessIndex + 1 >= this.assessments.length
                ? '<i class="fa-solid fa-check"></i> Review all reflections'
                : '<i class="fa-solid fa-arrow-right"></i> Next question';
            this.container.querySelector('.asmt-actions')?.appendChild(continueBtn);

            this.assessCompleted++;

            continueBtn.addEventListener('click', () => {
                this.assessIndex++;
                if (this.assessIndex >= this.assessments.length) {
                    setTimeout(() => this._advancePhase(), 300);
                } else {
                    this.render();
                }
            });
        });
    }

    _bindReview() {
        this.container.querySelector('#btn-finish-review')?.addEventListener('click', () => {
            this._advancePhase();
        });
    }

    _bindUnlock() {
        this.container.querySelector('#btn-enter-challenge')?.addEventListener('click', () => {
            document.querySelector('.game-main-area')?.classList.remove('session-mode-learn');
            document.querySelector('.game-main-area')?.classList.add('session-mode-challenge');
            window.LoreboundFX?.victoryBurst?.();
            this.onComplete();
        });
    }

    _advancePhase() {
        if (window.LoreboundFX?.phaseTransition) {
            LoreboundFX.phaseTransition(() => {
                this.phaseIndex++;
                if (this.phaseIndex >= this.phases.length) return;
                this.render();
            });
        } else {
            this.phaseIndex++;
            if (this.phaseIndex < this.phases.length) this.render();
        }
    }
}
