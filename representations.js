/**
 * Lorebound representation catalog: maps subtopic data to the right visual pattern.
 * AI/compiler picks a representation id; renderer falls back by content shape.
 */
window.LoreboundRepresentations = {
    /** Canonical pattern ids the compiler may emit */
    PATTERN_IDS: [
        'prose', 'bullet', 'numbered', 'table', 'definition_list', 'compare_columns',
        'timeline_strip', 'steps', 'stat_grid', 'formula', 'qa_block', 'highlight',
        'checklist', 'flow', 'cause_chain', 'vocabulary', 'pros_cons', 'hierarchy',
        'quote_callout', 'metric_cards', 'concept_map', 'before_after', 'myth_fact',
        'analogy', 'exam_tip',
    ],

    resolvePattern(subtopic) {
        const explicit = String(subtopic?.representation || '').toLowerCase();
        if (explicit && this.PATTERN_IDS.includes(explicit)) return explicit;
        if (subtopic?.table?.headers?.length) return 'table';
        if (subtopic?.steps?.length) return 'steps';
        if (subtopic?.pairs?.length) return 'cause_chain';
        if (subtopic?.bullets?.length) return 'bullet';
        return 'prose';
    },

    render(subtopic) {
        const pattern = this.resolvePattern(subtopic);
        const fn = this._renderers[pattern] || this._renderers.prose;
        return fn.call(this, subtopic);
    },

    _renderers: {
        prose(st) {
            return `
            <div class="rep-block rep-prose">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                ${renderExamples(st)}
                ${renderSource(st)}
            </div>`;
        },

        bullet(st) {
            const bullets = st.bullets?.length ? st.bullets : (st.examples || []);
            return `
            <div class="rep-block rep-bullet">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <ul class="rep-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
                ${renderSource(st)}
            </div>`;
        },

        numbered(st) {
            const items = st.steps?.length ? st.steps : (st.examples || [st.explanation]);
            return `
            <div class="rep-block rep-numbered">
                <ol class="rep-olist">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>
                ${renderSource(st)}
            </div>`;
        },

        table(st) {
            const t = st.table || {};
            const headers = t.headers || ['Item', 'Detail'];
            const rows = t.rows || [];
            return `
            <div class="rep-block rep-table-wrap">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-table-scroll">
                    <table class="rep-table">
                        <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
                        <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                </div>
                ${renderExamples(st)}
                ${renderSource(st)}
            </div>`;
        },

        definition_list(st) {
            const defs = st.bullets?.length
                ? st.bullets.map((b, i) => ({ term: `Term ${i + 1}`, def: b }))
                : (st.examples || []).map((e, i) => ({ term: st.title, def: e }));
            return `
            <div class="rep-block rep-definitions">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <dl class="rep-dl">${defs.map(d => `<dt>${esc(d.term)}</dt><dd>${esc(d.def)}</dd>`).join('')}</dl>
                ${renderSource(st)}
            </div>`;
        },

        compare_columns(st) {
            const pairs = st.pairs || (st.examples || []).slice(0, 2).map((e, i) => ({
                left: i === 0 ? 'Concept A' : 'Concept B',
                right: e,
            }));
            return `
            <div class="rep-block rep-compare">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-compare-grid">
                    ${pairs.map(p => `
                        <div class="rep-compare-col">
                            <span class="rep-compare-label">${esc(p.left || p.a || 'A')}</span>
                            <p>${esc(p.right || p.b || '')}</p>
                        </div>`).join('')}
                </div>
                ${renderSource(st)}
            </div>`;
        },

        timeline_strip(st) {
            const events = st.bullets?.length
                ? st.bullets
                : [st.subtitle, ...(st.examples || [])].filter(Boolean);
            return `
            <div class="rep-block rep-timeline">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-timeline-track">
                    ${events.map((e, i) => `
                        <div class="rep-timeline-node">
                            <span class="rep-timeline-dot">${i + 1}</span>
                            <span class="rep-timeline-text">${esc(e)}</span>
                        </div>`).join('')}
                </div>
                ${renderSource(st)}
            </div>`;
        },

        steps(st) {
            const steps = st.steps?.length ? st.steps : (st.examples || [st.explanation]);
            return `
            <div class="rep-block rep-steps">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-step-list">
                    ${steps.map((s, i) => `
                        <div class="rep-step-item">
                            <span class="rep-step-num">${i + 1}</span>
                            <span class="rep-step-text">${esc(s)}</span>
                        </div>`).join('')}
                </div>
                ${renderSource(st)}
            </div>`;
        },

        cause_chain(st) {
            const pairs = st.pairs || [{ left: st.title, right: st.examples?.[0] || st.subtitle || '' }];
            return `
            <div class="rep-block rep-cause">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-cause-chain">
                    ${pairs.map(p => `
                        <div class="rep-cause-link">
                            <span class="rep-cause-box cause">${esc(p.left)}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                            <span class="rep-cause-box effect">${esc(p.right)}</span>
                        </div>`).join('')}
                </div>
                ${renderSource(st)}
            </div>`;
        },

        stat_grid(st) {
            const stats = (st.examples || []).map((e, i) => ({ label: `Fact ${i + 1}`, value: e }));
            return `
            <div class="rep-block rep-stats">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-stat-grid">
                    ${stats.map(s => `<div class="rep-stat-card"><span>${esc(s.label)}</span><strong>${esc(s.value)}</strong></div>`).join('')}
                </div>
                ${renderSource(st)}
            </div>`;
        },

        highlight(st) {
            return `
            <div class="rep-block rep-highlight">
                <div class="rep-highlight-box">
                    <i class="fa-solid fa-lightbulb"></i>
                    <p>${esc(st.explanation)}</p>
                </div>
                ${renderExamples(st)}
                ${renderSource(st)}
            </div>`;
        },

        checklist(st) {
            const items = st.bullets?.length ? st.bullets : (st.examples || []);
            return `
            <div class="rep-block rep-checklist">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <ul class="rep-checklist-list">
                    ${items.map(i => `<li><i class="fa-regular fa-square"></i> ${esc(i)}</li>`).join('')}
                </ul>
                ${renderSource(st)}
            </div>`;
        },

        exam_tip(st) {
            return `
            <div class="rep-block rep-exam-tip">
                <span class="rep-tip-badge"><i class="fa-solid fa-graduation-cap"></i> Exam tip</span>
                <p>${esc(st.explanation)}</p>
                ${renderExamples(st)}
                ${renderSource(st)}
            </div>`;
        },

        quote_callout(st) {
            return `
            <div class="rep-block rep-quote">
                <blockquote>"${esc(st.sourcePassage || st.explanation)}"</blockquote>
                <p class="rep-explanation">${esc(st.explanation)}</p>
                ${renderExamples(st)}
            </div>`;
        },

        analogy(st) {
            return `
            <div class="rep-block rep-analogy">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <div class="rep-analogy-box">
                    <span>Think of it like:</span>
                    <strong>${esc(st.examples?.[0] || 'a familiar everyday process')}</strong>
                </div>
                ${renderSource(st)}
            </div>`;
        },

        formula(st) {
            return `
            <div class="rep-block rep-formula">
                <p class="rep-explanation">${esc(st.explanation)}</p>
                <pre class="rep-formula-box">${esc(st.examples?.[0] || st.bullets?.[0] || '')}</pre>
                ${renderSource(st)}
            </div>`;
        },

        qa_block(st) {
            return `
            <div class="rep-block rep-qa">
                <p class="rep-q"><strong>Q:</strong> What is ${esc(st.title)}?</p>
                <p class="rep-a"><strong>A:</strong> ${esc(st.explanation)}</p>
                ${renderExamples(st)}
                ${renderSource(st)}
            </div>`;
        },

        flow(st) { return LoreboundRepresentations._renderers.steps(st); },
        vocabulary(st) { return LoreboundRepresentations._renderers.definition_list(st); },
        pros_cons(st) { return LoreboundRepresentations._renderers.compare_columns(st); },
        hierarchy(st) { return LoreboundRepresentations._renderers.numbered(st); },
        metric_cards(st) { return LoreboundRepresentations._renderers.stat_grid(st); },
        concept_map(st) { return LoreboundRepresentations._renderers.bullet(st); },
        before_after(st) { return LoreboundRepresentations._renderers.compare_columns(st); },
        myth_fact(st) { return LoreboundRepresentations._renderers.compare_columns(st); },
    },
};

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderExamples(st) {
    const ex = (st.examples || []).filter(Boolean);
    if (!ex.length) return '';
    return `<div class="rep-examples"><span class="rep-examples-label">Examples</span><ul>${ex.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
}

function renderSource(st) {
    if (!st.sourcePassage) return '';
    return `<div class="rep-source"><i class="fa-solid fa-quote-left"></i> "${esc(st.sourcePassage)}"</div>`;
}

/** Build guide from payload when backend did not supply learningGuide */
function buildLearningGuideFromPayload(category, payload, title, sourceText) {
    const items = extractLearnItems(category, payload);
    const repCycle = ['prose', 'bullet', 'table', 'steps', 'definition_list', 'highlight', 'stat_grid'];
    const subtopics = items.slice(0, 25).map((item, idx) => ({
        id: item.id || `st-${idx + 1}`,
        title: item.title,
        explanation: item.body || item.desc || '',
        examples: [item.subtitle, item.effect].filter(Boolean),
        representation: item.representation || repCycle[idx % repCycle.length],
        emoji: item.emoji || '📘',
        sourcePassage: item.sourcePassage || '',
        pairs: item.effect ? [{ left: item.title, right: item.effect }] : null,
        steps: category === 'Process' ? [item.title] : [],
    }));

    return {
        summary: `Structured study notes for ${title}. Each section below uses a format matched to the content: tables for comparisons, steps for processes, timelines for sequences.`,
        keyTakeaways: subtopics.slice(0, 6).map(s => s.title),
        subtopics: typeof dedupeSubtopics === 'function' ? dedupeSubtopics(subtopics) : subtopics,
    };
}
