/** Lorebound source limits - keep AI compilation reliable */
window.LoreboundLimits = {
    PDF_MAX_PAGES: 10,
    PDF_MAX_SIZE_MB: 10,
    PDF_VISUAL_PAGES: 6,
    SOURCE_MAX_CHARS: 12000,
    SOURCE_MAX_WORDS: 2000,
    SOURCE_MIN_CHARS: 100,
    SOURCE_MIN_WORDS: 20,

    countWords(text) {
        if (!text || !text.trim()) return 0;
        return text.trim().split(/\s+/).length;
    },

    truncate(text) {
        if (!text) return { text: '', truncated: false, words: 0, chars: 0 };
        let t = text.trim();
        let truncated = false;
        const words = this.countWords(t);
        if (words > this.SOURCE_MAX_WORDS) {
            t = t.split(/\s+/).slice(0, this.SOURCE_MAX_WORDS).join(' ');
            truncated = true;
        }
        if (t.length > this.SOURCE_MAX_CHARS) {
            t = this.truncateAtWord(t, this.SOURCE_MAX_CHARS);
            truncated = true;
        }
        return { text: t, truncated, words: this.countWords(t), chars: t.length };
    },

    /** Cut at last full word before maxLen; never mid-word. */
    truncateAtWord(text, maxLen) {
        const t = String(text || '').trim();
        if (t.length <= maxLen) return t;
        const slice = t.slice(0, maxLen);
        const lastSpace = slice.lastIndexOf(' ');
        if (lastSpace > Math.floor(maxLen * 0.55)) {
            return slice.slice(0, lastSpace).trim();
        }
        return slice.trim();
    },

    shortLabel(text, maxLen = 72) {
        return this.truncateAtWord(String(text || '').trim(), maxLen);
    },

    validate(text) {
        const { text: t, words, chars } = this.truncate(text);
        const errors = [];
        if (chars < this.SOURCE_MIN_CHARS) errors.push(`Need at least ${this.SOURCE_MIN_CHARS} characters.`);
        if (words < this.SOURCE_MIN_WORDS) errors.push(`Need at least ${this.SOURCE_MIN_WORDS} words.`);
        return { ok: errors.length === 0, text: t, words, chars, errors };
    },

    label() {
        return `Max ${this.PDF_MAX_PAGES} PDF pages · ${this.SOURCE_MAX_WORDS.toLocaleString()} words · ${this.SOURCE_MAX_CHARS.toLocaleString()} characters`;
    },
};

function truncateSourceText(text) {
    return LoreboundLimits.truncate(text).text;
}
