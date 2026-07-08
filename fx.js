/** Lorebound visual FX helpers - enhanced engagement edition */
window.LoreboundFX = {
    _accent() {
        return getComputedStyle(document.documentElement).getPropertyValue('--game-accent').trim() || '#dcf5fc';
    },

    confetti(x, y, colors = ['#dcf5fc', '#dcfcf6', '#dcfcf9', '#ff9100'], count = 28) {
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            const size = 6 + Math.random() * 8;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${x + (Math.random() - 0.5) * 120}px`;
            p.style.top = `${y + (Math.random() - 0.5) * 40}px`;
            p.style.background = colors[i % colors.length];
            p.style.animationDelay = `${Math.random() * 0.25}s`;
            p.style.animationDuration = `${0.9 + Math.random() * 0.8}s`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1800);
        }
    },

    shake(el) {
        if (!el) return;
        el.classList.add('shake-wrong');
        setTimeout(() => el.classList.remove('shake-wrong'), 550);
    },

    screenShake(intensity = 1) {
        const canvas = document.querySelector('.game-renderer-canvas');
        if (!canvas) return;
        canvas.classList.remove('screen-shake');
        void canvas.offsetWidth;
        canvas.classList.add('screen-shake');
        canvas.style.setProperty('--shake-intensity', intensity);
        setTimeout(() => canvas.classList.remove('screen-shake'), 500);
    },

    floatingScore(x, y, text = '+1000', color) {
        const el = document.createElement('div');
        el.className = 'floating-score';
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        if (color) el.style.color = color;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1100);
    },

    ripple(el) {
        if (!el) return;
        const r = document.createElement('span');
        r.className = 'fx-ripple';
        el.style.position = el.style.position || 'relative';
        el.appendChild(r);
        setTimeout(() => r.remove(), 700);
    },

    glowPulse(el) {
        if (!el) return;
        el.classList.add('glow-pulse');
        setTimeout(() => el.classList.remove('glow-pulse'), 800);
    },

    streakBurst(x, y, streak) {
        if (streak < 3) return;
        const colors = streak >= 7 ? ['#ff9100', '#ffeb3b', '#ff4081', '#fff'] :
            streak >= 5 ? ['#ff9100', '#ffeb3b', '#dcfcf6'] : ['#dcfcf9', '#dcf5fc', '#dcfcf6'];
        this.confetti(x, y, colors, streak >= 5 ? 40 : 24);
        if (streak >= 3) this.showComboBanner(streak);
    },

    showComboBanner(streak) {
        const existing = document.querySelector('.combo-banner');
        if (existing) existing.remove();
        const banner = document.createElement('div');
        banner.className = 'combo-banner';
        const label = streak >= 7 ? 'LEGENDARY!' : streak >= 5 ? 'ON FIRE!' : 'COMBO!';
        banner.innerHTML = `<i class="fa-solid fa-fire-flame-curved"></i> ${label} ×${streak}`;
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 1400);
    },

    celebrateCorrect(el, streak = 0, colors) {
        const r = el?.getBoundingClientRect();
        const x = r ? r.left + r.width / 2 : innerWidth / 2;
        const y = r ? r.top + r.height / 2 : innerHeight / 3;
        const palette = colors || [this._accent(), '#dcfcf6', '#dcf5fc'];
        this.confetti(x, y, palette);
        this.floatingScore(x, y - 20, streak >= 5 ? '+1500' : '+1000');
        this.glowPulse(el);
        this.ripple(el);
        this.streakBurst(x, y, streak);
    },

    celebrateWrong(el) {
        this.shake(el);
        this.screenShake(1);
        const r = el?.getBoundingClientRect();
        if (r) this.floatingScore(r.left + r.width / 2, r.top, '−200', '#ff5252');
    },

    phaseTransition(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'phase-transition-overlay';
        overlay.innerHTML = `
            <div class="phase-transition-card">
                <i class="fa-solid fa-bolt"></i>
                <span>Next Challenge</span>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.classList.add('active');
            setTimeout(() => {
                overlay.classList.add('out');
                setTimeout(() => {
                    overlay.remove();
                    if (callback) callback();
                }, 350);
            }, 650);
        }, 30);
    },

    levelUp() {
        const flash = document.createElement('div');
        flash.className = 'level-up-flash';
        flash.innerHTML = `
            <div class="levelup-trophy-circle"><i class="fa-solid fa-trophy"></i></div>
            <div class="levelup-title">LEVEL UP!</div>
            <div class="levelup-subtitle">MASTERY MILESTONE REACHED</div>
            <div class="levelup-xp">+500 XP</div>`;
        document.body.appendChild(flash);
        const cx = innerWidth / 2;
        const cy = innerHeight / 2;
        this.confetti(cx, cy, [this._accent(), '#dcfcf9', '#dcfcf6'], 50);
        setTimeout(() => flash.remove(), 1400);
    },

    victoryBurst() {
        const cx = innerWidth / 2;
        const cy = innerHeight / 3;
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                this.confetti(cx + (wave - 1) * 80, cy, ['#dcf5fc', '#dcfcf6', '#dcfcf9', '#ff9100', '#ffeb3b'], 35);
            }, wave * 200);
        }
    },

    mountAmbient(container, variant = 'timeline') {
        if (!container || container.querySelector('.ambient-layer')) return;
        const layer = document.createElement('div');
        layer.className = `ambient-layer ambient-${variant}`;
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('span');
            p.className = 'ambient-particle';
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = `${Math.random() * 100}%`;
            p.style.animationDelay = `${Math.random() * 4}s`;
            p.style.animationDuration = `${4 + Math.random() * 6}s`;
            layer.appendChild(p);
        }
        container.prepend(layer);
    },

    applyTheme(category, metadata) {
        const theme = metadata?.theme || {};
        const area = document.querySelector('.game-main-area');
        const narrative = document.querySelector('.narrative-content');
        if (!area) return;

        area.classList.remove('theme-timeline', 'theme-process', 'theme-cause', 'theme-comparison', 'themed');
        const map = { Timeline: 'theme-timeline', Process: 'theme-process', CauseEffect: 'theme-cause', Comparison: 'theme-comparison' };
        area.classList.add(map[category] || 'theme-timeline', 'themed');

        const fallbackPrimary = {
            Timeline: '#dcf5fc',
            Process: '#dcfcf6',
            CauseEffect: '#dcfcf9',
            Comparison: '#dcfcf6'
        }[category];
        const primary = theme.primary || fallbackPrimary;
        document.documentElement.style.setProperty('--game-accent', primary);
        if (theme.secondary) document.documentElement.style.setProperty('--game-accent-secondary', theme.secondary);
        if (theme.accent) document.documentElement.style.setProperty('--game-accent-glow', theme.accent);

        if (narrative && primary) {
            narrative.classList.add('themed');
            narrative.style.setProperty('--narrative-glow', `${primary}66`);
        }
    },

    badgeClass(category) {
        return { Timeline: 'timeline-badge', Process: 'cycle-badge', CauseEffect: 'cause-badge', Comparison: 'sorting-badge' }[category] || 'timeline-badge';
    },

    mechanicIcon(category) {
        return { Timeline: 'fa-clock-rotate-left', Process: 'fa-heart-pulse', CauseEffect: 'fa-water', Comparison: 'fa-bolt' }[category] || 'fa-gamepad';
    },
};
