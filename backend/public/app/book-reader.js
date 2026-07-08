/**
 * Lorebound 3D Book Reader
 * Spine + page-stack on the left; readable content on the right page.
 */
window.LoreboundBookReader = class LoreboundBookReader {
    constructor(host, opts = {}) {
        this.host = host;
        this.title = opts.title || 'Study Guide';
        this.summary = opts.summary || '';
        this.takeaways = opts.takeaways || [];
        this.subtopics = opts.subtopics || [];
        this.onFinish = opts.onFinish || (() => {});
        this.currentPage = 0;
        this.isOpen = false;
        this.flipping = false;
        this.pages = this._buildPages();
        this.render();
        this._bind();
    }

    _esc(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    _buildPages() {
        const pages = [{ kind: 'cover' }];
        pages.push({ kind: 'intro', html: this._introHtml() });
        this.subtopics.forEach((st, i) => {
            pages.push({ kind: 'section', title: st.title, html: this._sectionHtml(st, i) });
        });
        return pages;
    }

    _introHtml() {
        const takeaways = this.takeaways.filter(Boolean);
        const summary = this.summary || `Study guide for ${this.title}.`;
        return `
            <div class="lb-page-inner">
                <span class="lb-page-eyebrow">Overview</span>
                <p class="lb-page-summary">${this._esc(summary)}</p>
                ${takeaways.length ? `
                <h4 class="lb-page-subhead">Key takeaways</h4>
                <ul class="lb-page-list">${takeaways.map(t => `<li>${this._esc(t)}</li>`).join('')}</ul>` : ''}
            </div>`;
    }

    _sectionHtml(st, i) {
        const rep = window.LoreboundRepresentations
            ? LoreboundRepresentations.render(st)
            : `<p>${this._esc(st.explanation || '')}</p>`;
        return `
            <div class="lb-page-inner lb-page-section">
                <span class="lb-page-eyebrow">Section ${i + 1} of ${this.subtopics.length}</span>
                <h3 class="lb-page-title">${this._esc(st.title)}</h3>
                <div class="lb-page-rep">${rep}</div>
            </div>`;
    }

    _spineStackHtml() {
        const total = this.pages.length - 1;
        const behind = Math.max(0, total - this.currentPage);
        const ahead = Math.max(0, this.currentPage - 1);
        let html = '<div class="lb-spine"></div>';
        for (let i = 0; i < Math.min(ahead, 4); i++) {
            html += `<div class="lb-stack-sheet lb-stack-left" style="--i:${i}"></div>`;
        }
        for (let i = 0; i < Math.min(behind, 4); i++) {
            html += `<div class="lb-stack-sheet lb-stack-right" style="--i:${i}"></div>`;
        }
        return html;
    }

    render() {
        const page = this.pages[this.currentPage];
        const isLast = this.currentPage >= this.pages.length - 1;
        const contentPages = this.pages.length - 1;
        const displayPage = this.isOpen ? this.currentPage : 0;

        if (!this.isOpen) {
            this.host.innerHTML = `
            <div class="lb-book-stage">
                <p class="lb-book-hint">Click the cover to open your study guide</p>
                <div class="lb-book-scene lb-book-scene--closed">
                    <div class="lb-book-closed" id="lbBookClosed">
                        <div class="lb-cover-closed">
                            <span class="lb-cover-eyebrow">Lorebound</span>
                            <h2 class="lb-cover-title">${this._esc(this.title)}</h2>
                            <p class="lb-cover-meta">${this.subtopics.length} sections</p>
                        </div>
                        <div class="lb-cover-edge"></div>
                    </div>
                </div>
                <div class="lb-book-controls">
                    <button type="button" class="btn btn-secondary" disabled><i class="fa-solid fa-chevron-left"></i> Prev</button>
                    <span class="lb-book-pagenum">Cover</span>
                    <button type="button" class="btn btn-primary" id="lb-book-next">Open book <i class="fa-solid fa-book-open"></i></button>
                </div>
            </div>`;
            return;
        }

        this.host.innerHTML = `
        <div class="lb-book-stage">
            <p class="lb-book-hint">Page ${this.currentPage} of ${contentPages}. Use arrows to turn.</p>
            <div class="lb-book-scene lb-book-scene--open">
                <div class="lb-book-spine-col">${this._spineStackHtml()}</div>
                <div class="lb-book-page-col">
                    <div class="lb-page-panel" id="lbPagePanel">
                        <div class="lb-paper-content">${page.html || '<p>No content on this page.</p>'}</div>
                    </div>
                </div>
            </div>
            <div class="lb-book-controls">
                <button type="button" class="btn btn-secondary" id="lb-book-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i> Prev
                </button>
                <span class="lb-book-pagenum">${displayPage} / ${contentPages}</span>
                <button type="button" class="btn btn-primary" id="lb-book-next">
                    ${isLast ? 'Start quiz <i class="fa-solid fa-arrow-right"></i>' : 'Next page <i class="fa-solid fa-chevron-right"></i>'}
                </button>
            </div>
        </div>`;
    }

    _bind() {
        this.host.querySelector('#lb-book-prev')?.addEventListener('click', () => this.prev());
        this.host.querySelector('#lb-book-next')?.addEventListener('click', () => this.next());
        this.host.querySelector('#lbBookClosed')?.addEventListener('click', () => this.open());
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.currentPage = 1;
        this.render();
        this._bind();
    }

    next() {
        if (this.flipping) return;
        if (!this.isOpen) {
            this.open();
            return;
        }
        if (this.currentPage >= this.pages.length - 1) {
            this.onFinish();
            return;
        }
        this._animateTurn(this.currentPage + 1);
    }

    prev() {
        if (this.flipping || !this.isOpen) return;
        if (this.currentPage <= 1) {
            this.isOpen = false;
            this.currentPage = 0;
            this.render();
            this._bind();
            return;
        }
        this._animateTurn(this.currentPage - 1, true);
    }

    _animateTurn(targetPage, reverse = false) {
        const panel = this.host.querySelector('#lbPagePanel');
        if (!panel) {
            this.currentPage = targetPage;
            this.render();
            this._bind();
            return;
        }
        this.flipping = true;
        panel.classList.add(reverse ? 'lb-panel-flip-in' : 'lb-panel-flip-out');
        setTimeout(() => {
            this.currentPage = targetPage;
            this.flipping = false;
            this.render();
            this._bind();
            const newPanel = this.host.querySelector('#lbPagePanel');
            newPanel?.classList.add(reverse ? 'lb-panel-flip-out' : 'lb-panel-flip-in');
            setTimeout(() => newPanel?.classList.remove('lb-panel-flip-in', 'lb-panel-flip-out'), 420);
        }, 400);
    }
};
