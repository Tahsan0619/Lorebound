/**
 * Lorebound depth assessments: 5 written-response types with narrative feedback.
 */
window.LoreboundAssessments = {
    TYPE_LABELS: {
        scenario: 'Scenario Based Question',
        output_prediction: 'Output Prediction',
        compare: 'Compare Two Concepts',
        fact_checker: 'Fact Checker',
        predict_next: 'Predict the Next',
    },

    TYPE_ICONS: {
        scenario: 'fa-person-chalkboard',
        output_prediction: 'fa-arrow-trend-up',
        compare: 'fa-code-compare',
        fact_checker: 'fa-magnifying-glass',
        predict_next: 'fa-forward',
    },

    buildFallback(subtopics, category, title) {
        const st = subtopics?.length ? subtopics : [{ id: 'st-1', title: title, explanation: '', sourcePassage: '' }];
        const types = Object.keys(this.TYPE_LABELS);
        return types.map((type, i) => {
            const a = st[i % st.length];
            const b = st[(i + 1) % st.length];
            return {
                id: `asmt-${type}`,
                type,
                title: this.TYPE_LABELS[type],
                prompt: this._fallbackPrompt(type, a, b, category),
                context: type === 'scenario' ? 'Apply your study notes to a realistic situation.' : '',
                sourcePassage: a.sourcePassage || '',
                evaluationGuide: {
                    keyIdeas: [a.title, a.explanation].filter(Boolean),
                    fullyCorrect: a.explanation || a.sourcePassage || 'Explain the source mechanism clearly with evidence.',
                    partiallyCorrect: 'Touches the topic but misses mechanism or source evidence.',
                    incorrect: 'Contradicts the source, confuses unrelated ideas, or lacks usable reasoning.',
                },
            };
        });
    },

    _fallbackPrompt(type, a, b, category) {
        const ta = a.title || 'the concept';
        const tb = b.title || 'a related idea';
        const prompts = {
            scenario: `Describe a realistic scenario involving "${ta}". Explain what happens and why, using the source material.`,
            output_prediction: `If "${ta}" occurs as described in your notes, what output or consequence would you predict next?`,
            compare: `Compare "${ta}" and "${tb}". How are they similar and different according to what you studied?`,
            fact_checker: `Is this claim true, false, or partially true: "${ta} has no connection to ${tb}"? Explain with evidence.`,
            predict_next: `In this ${category} topic, what is the most likely next step or event after "${ta}"? Justify your answer.`,
        };
        return prompts[type] || `Explain "${ta}" in depth.`;
    },

    renderCard(assessment, index, total) {
        const type = assessment.type || 'scenario';
        const icon = this.TYPE_ICONS[type] || 'fa-pen';
        const label = this.TYPE_LABELS[type] || assessment.title || 'Question';
        return `
        <div class="asmt-panel glass-panel">
            <div class="asmt-header">
                <span class="asmt-type-badge"><i class="fa-solid ${icon}"></i> ${label}</span>
                <span class="asmt-progress">Question ${index + 1} of ${total}</span>
            </div>
            ${assessment.context ? `<p class="asmt-context">${esc(assessment.context)}</p>` : ''}
            <p class="asmt-prompt">${esc(assessment.prompt)}</p>
            <textarea class="asmt-answer-input" id="asmt-answer" rows="6" placeholder="Write your answer in your own words. Explain your reasoning with examples from the notes..."></textarea>
            <div class="asmt-actions">
                <button type="button" class="btn btn-primary" id="btn-submit-asmt">
                    <i class="fa-solid fa-paper-plane"></i> Submit answer
                </button>
            </div>
            <div class="asmt-feedback-host hidden" id="asmt-feedback-host"></div>
        </div>`;
    },

    renderReviewSummary(reflections, topicTitle) {
        if (!reflections?.length) {
            return `<div class="asmt-review-panel glass-panel"><p>No reflections recorded yet.</p></div>`;
        }

        const cards = reflections.map((row, i) => {
            const type = row.assessment?.type || 'scenario';
            const label = this.TYPE_LABELS[type] || row.assessment?.title || `Question ${i + 1}`;
            const fb = row.feedback || {};
            const level = fb.truthLevel || 'partially_true';
            const levelShort = {
                fully_true: 'Well aligned',
                partially_true: 'Partially aligned',
                fully_false: 'Needs rebuilding',
            }[level] || 'Reviewed';

            return `
            <article class="asmt-review-card">
                <header class="asmt-review-card-head">
                    <span class="asmt-type-badge"><i class="fa-solid ${this.TYPE_ICONS[type] || 'fa-pen'}"></i> ${label}</span>
                    <span class="asmt-review-level">${levelShort}</span>
                </header>
                <p class="asmt-review-q"><strong>Question:</strong> ${esc(row.assessment?.prompt)}</p>
                <p class="asmt-review-a"><strong>Your answer:</strong> ${esc(row.userAnswer)}</p>
                <p class="asmt-review-takeaway"><strong>Key takeaway:</strong> ${esc(fb.fullExplanation || fb.whatIsTrue || fb.interpretation)}</p>
            </article>`;
        }).join('');

        return `
        <div class="asmt-review-panel glass-panel">
            <div class="asmt-review-header">
                <h3><i class="fa-solid fa-book-bookmark"></i> Reflection Review: ${esc(topicTitle)}</h3>
                <p>Review what you wrote and what the source teaches before entering the Challenge Arena.</p>
            </div>
            <div class="asmt-review-list">${cards}</div>
            <div class="asmt-review-actions">
                <button type="button" class="btn btn-primary btn-primary-glow" id="btn-finish-review">
                    <span>Continue to Challenge Unlock</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>`;
    },

    renderFeedback(feedback) {
        const level = feedback.truthLevel || 'partially_true';
        const levelLabel = {
            fully_true: 'Strong alignment with the source',
            partially_true: 'Partially aligned. Let us refine your thinking',
            fully_false: 'This idea does not match the source. Let us rebuild it',
        }[level] || 'Review';

        const levelClass = {
            fully_true: 'asmt-fb-true',
            partially_true: 'asmt-fb-partial',
            fully_false: 'asmt-fb-false',
        }[level] || 'asmt-fb-partial';

        return `
        <div class="asmt-feedback ${levelClass}">
            <h4><i class="fa-solid fa-comments"></i> ${levelLabel}</h4>
            <p class="asmt-fb-interpretation">${esc(feedback.interpretation)}</p>
            ${feedback.whatIsTrue ? `<div class="asmt-fb-block true-block"><strong>What is true:</strong><p>${esc(feedback.whatIsTrue)}</p></div>` : ''}
            ${feedback.whatIsFalse ? `<div class="asmt-fb-block false-block"><strong>What needs correction:</strong><p>${esc(feedback.whatIsFalse)}</p></div>` : ''}
            <div class="asmt-fb-block explain-block">
                <strong>Full explanation:</strong>
                <p>${esc(feedback.fullExplanation)}</p>
            </div>
            ${feedback.sourceGrounding ? `<p class="asmt-fb-source"><i class="fa-solid fa-quote-left"></i> ${esc(feedback.sourceGrounding)}</p>` : ''}
        </div>`;
    },

    async evaluate(assessment, userAnswer, sourceText) {
        if (window.LoreboundAPI?.evaluateAnswer) {
            try {
                const res = await LoreboundAPI.evaluateAnswer(assessment, userAnswer, sourceText);
                return res.feedback;
            } catch (e) {
                console.warn('Evaluate API:', e.message);
            }
        }
        return this._heuristicFeedback(assessment, userAnswer);
    },

    _heuristicFeedback(assessment, userAnswer) {
        const answer = String(userAnswer || '').trim();
        const lower = answer.toLowerCase();
        const g = assessment.evaluationGuide || {};
        const keys = (g.keyIdeas || []).map(k => String(k || '').toLowerCase().trim()).filter(Boolean);
        const stop = new Set(['the','and','or','a','an','to','of','in','on','for','is','are','was','were','this','that','with','as','it','be','by','from','at']);
        const tokens = (text) => String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 4 && !stop.has(t));
        const answerTokens = tokens(lower);
        const pool = tokens([assessment.sourcePassage, ...keys].filter(Boolean).join(' '));
        let overlap = 0;
        answerTokens.forEach(t => { if (pool.includes(t)) overlap++; });
        let ideaHits = 0;
        keys.forEach(k => {
            if (!k) return;
            if (lower.includes(k)) { ideaHits++; return; }
            const kt = tokens(k);
            const hitHalf = kt.filter(t => lower.includes(t)).length >= Math.max(1, Math.ceil(kt.length * 0.5));
            if (hitHalf) ideaHits++;
        });
        const vowelRatio = (() => {
            const letters = (lower.match(/[a-z]/g) || []).length;
            const vowels = (lower.match(/[aeiou]/g) || []).length;
            return letters ? vowels / letters : 0;
        })();
        const gibberish = answer.length < 20 || (vowelRatio < 0.18 && !/\b(the|and|because|when|which|from|with|battery|power|source)\b/i.test(answer));
        const promptTokens = tokens(assessment.prompt || '');
        const promptEcho = answerTokens.length
            ? answerTokens.filter(t => promptTokens.includes(t)).length / answerTokens.length
            : 0;
        const hasReasoning = /\b(because|therefore|so that|this means|would|will|leads to|results in|since|thus|hence|for example|such as|compared to|predict|expect|next step|consequence)\b/i.test(answer)
            || /\b(i think|in my view|my answer|this shows|that is why)\b/i.test(answer);
        const isPromptEcho = promptEcho >= 0.72
            || (promptEcho >= 0.55 && !hasReasoning && answer.length < 220);
        const tokenRatio = answerTokens.length ? overlap / answerTokens.length : 0;
        const ideaRatio = keys.length ? ideaHits / keys.length : tokenRatio;
        const score = Math.max(tokenRatio, ideaRatio);
        let level = 'fully_false';
        if (gibberish) level = 'fully_false';
        else if (isPromptEcho) level = 'fully_false';
        else if (score >= 0.45 && promptEcho < 0.5 && hasReasoning && answer.length >= 45) level = 'fully_true';
        else if (score >= 0.18 || (ideaHits >= 1 && hasReasoning && promptEcho < 0.65)) level = 'partially_true';

        const looksLikeLabel = (s) => /answer (references|contradicts|mentions|uses source)/i.test(String(s || ''));
        let explanation = String(g.fullyCorrect || '').trim();
        if (!explanation || looksLikeLabel(explanation)) {
            explanation = String(assessment.sourcePassage || '').trim()
                || 'Re-read the source idea and explain the mechanism in your own words with one concrete example.';
        }

        let whatIsTrue = '';
        let whatIsFalse = '';
        if (level === 'fully_false') {
            whatIsFalse = gibberish
                ? 'The answer does not communicate a real idea from the source. Write a clear explanation in your own words.'
                : (isPromptEcho
                    ? 'You repeated phrases from the question instead of explaining the idea. Restate the concept with your own reasoning and an example.'
                    : 'Important source ideas are missing or the reasoning does not fully match the material.');
        } else if (level === 'fully_true') {
            whatIsTrue = 'Your answer connects to the key ideas from the source and shows coherent reasoning.';
        } else {
            whatIsTrue = 'Some parts of your answer touch the topic, but important mechanism or evidence is still missing.';
            whatIsFalse = 'Strengthen the answer with cause, effect, or evidence from the source, not just copied wording.';
        }

        return {
            interpretation: `You approached this as: "${answer.slice(0, 200)}${answer.length > 200 ? '...' : ''}"`,
            truthLevel: level,
            whatIsTrue,
            whatIsFalse,
            fullExplanation: explanation,
            sourceGrounding: assessment.sourcePassage || '',
            engine: 'heuristic',
        };
    },
};

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildFallbackAssessments(subtopics, category, title) {
    return LoreboundAssessments.buildFallback(subtopics, category, title);
}
