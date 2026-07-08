/**
 * Lorebound API client - connects frontend to Laravel backend
 */
window.LoreboundAPI = {
    base: window.LOREBOUND_API_BASE || '/api/v1',

    sampleSlugs: {
        '1': 'liberation-war-1971',
        '2': 'water-cycle',
        '3': 'green-revolution',
        '4': 'photosynthesis-respiration',
    },

    async request(path, options = {}) {
        const res = await fetch(`${this.base}${path}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || `API error ${res.status}`);
        }
        return data;
    },

    async compileText(text, sourceTitle, model, studyDepth) {
        return this.request('/compile', {
            method: 'POST',
            body: JSON.stringify({
                text,
                source_title: sourceTitle,
                model,
                study_depth: studyDepth || 'deep',
            }),
        });
    },

    async compilePdfText(text, filename, model, studyDepth) {
        return this.request('/compile/pdf', {
            method: 'POST',
            body: JSON.stringify({
                text,
                filename,
                model,
                study_depth: studyDepth || 'deep',
            }),
        });
    },

    async compileSample(sampleKey) {
        const slug = this.sampleSlugs[sampleKey];
        if (!slug) throw new Error('Unknown sample');
        return this.request(`/samples/${slug}/compile`, { method: 'POST' });
    },

    async listCompilations() {
        return this.request('/compilations');
    },

    async getCompilation(uuid) {
        return this.request(`/compilations/${uuid}`);
    },

    async deleteCompilation(uuid) {
        return this.request(`/compilations/${uuid}`, { method: 'DELETE' });
    },

    async saveSession(payload) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async evaluateAnswer(assessment, userAnswer, sourceText, model) {
        return this.request('/evaluate', {
            method: 'POST',
            body: JSON.stringify({
                assessment,
                user_answer: userAnswer,
                source_text: sourceText,
                model,
            }),
        });
    },
};

function apiResultToSample(result) {
    return {
        title: result.title || result.metadata?.topicTitle || result.source_title,
        category: result.category,
        originalText: result.originalText || result.source_text,
        metadata: result.metadata,
        payload: result.payload,
        uuid: result.uuid,
        from_sample: result.from_sample ?? false,
    };
}

window.runApiCompilation = async function (text, sourceTitle, preloadedKey = null, options = {}) {
    const model = document.getElementById('setting-model')?.value;
    const studyDepth = document.getElementById('setting-study-depth')?.value || 'deep';
    let result;
    if (preloadedKey) {
        result = await LoreboundAPI.compileSample(preloadedKey);
    } else if (options.isPdf && options.filename) {
        result = await LoreboundAPI.compilePdfText(text, options.filename, model, studyDepth);
    } else {
        result = await LoreboundAPI.compileText(text, sourceTitle || '', model, studyDepth);
    }
    return apiResultToSample(result);
};
