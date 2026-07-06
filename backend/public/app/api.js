/**
 * Lorebound API client — connects frontend to Laravel backend
 */
window.LoreboundAPI = {
    base: window.LOREBOUND_API_BASE || '/api/v1',

    sampleSlugs: {
        '1': 'internet-computing-revolution',
        '2': 'blood-journey-human-heart',
        '3': 'ocean-plastic-pollution-chain',
        '4': 'renewable-vs-fossil-fuels',
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

    async compileText(text, sourceTitle, model) {
        return this.request('/compile', {
            method: 'POST',
            body: JSON.stringify({ text, source_title: sourceTitle, model }),
        });
    },

    async compilePdfText(text, filename, model) {
        return this.request('/compile/pdf', {
            method: 'POST',
            body: JSON.stringify({ text, filename, model }),
        });
    },

    async compileSample(sampleKey) {
        const slug = this.sampleSlugs[sampleKey];
        if (!slug) throw new Error('Unknown sample');
        return this.request(`/samples/${slug}/compile`, { method: 'POST' });
    },

    async saveSession(payload) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};

function apiResultToSample(result) {
    return {
        title: result.title || result.source_title,
        category: result.category,
        originalText: result.originalText || result.source_text,
        metadata: result.metadata,
        payload: result.payload,
        uuid: result.uuid,
    };
}

window.runApiCompilation = async function (text, sourceTitle, preloadedKey = null) {
    const model = document.getElementById('setting-model')?.value;
    let result;
    if (preloadedKey) {
        result = await LoreboundAPI.compileSample(preloadedKey);
    } else {
        result = await LoreboundAPI.compileText(text, sourceTitle, model);
    }
    return apiResultToSample(result);
};
