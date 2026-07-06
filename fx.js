/** Lorebound visual FX helpers */
window.LoreboundFX = {
    confetti(x, y, colors = ['#00f2fe', '#9b51e0', '#00e676', '#ff9100']) {
        for (let i = 0; i < 18; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            p.style.left = `${x + (Math.random() - 0.5) * 80}px`;
            p.style.top = `${y}px`;
            p.style.background = colors[i % colors.length];
            p.style.animationDelay = `${Math.random() * 0.2}s`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1400);
        }
    },

    shake(el) {
        if (!el) return;
        el.classList.add('shake-wrong');
        setTimeout(() => el.classList.remove('shake-wrong'), 500);
    },

    streakBurst(x, y, streak) {
        if (streak < 3) return;
        const colors = streak >= 5 ? ['#ff9100', '#ffeb3b', '#ff4081'] : ['#00e676', '#69f0ae'];
        this.confetti(x, y, colors);
    },

    levelUp() {
        const flash = document.createElement('div');
        flash.className = 'level-up-flash';
        flash.innerHTML = '<i class="fa-solid fa-arrow-up"></i> Phase Complete';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1200);
    },

    applyTheme(category, metadata) {
        const theme = metadata?.theme || {};
        const area = document.querySelector('.game-main-area');
        const narrative = document.querySelector('.narrative-content');
        if (!area) return;

        area.classList.remove('theme-timeline', 'theme-process', 'theme-cause', 'theme-comparison', 'themed');
        const map = { Timeline: 'theme-timeline', Process: 'theme-process', CauseEffect: 'theme-cause', Comparison: 'theme-comparison' };
        area.classList.add(map[category] || 'theme-timeline', 'themed');

        if (theme.primary) {
            document.documentElement.style.setProperty('--game-accent', theme.primary);
        }
        if (narrative && theme.primary) {
            narrative.classList.add('themed');
            narrative.style.setProperty('--narrative-glow', `${theme.primary}66`);
        }
    },

    badgeClass(category) {
        return { Timeline: 'timeline-badge', Process: 'cycle-badge', CauseEffect: 'cause-badge', Comparison: 'sorting-badge' }[category] || 'timeline-badge';
    },

    mechanicIcon(category) {
        return { Timeline: 'fa-clock-rotate-left', Process: 'fa-heart-pulse', CauseEffect: 'fa-water', Comparison: 'fa-bolt' }[category] || 'fa-gamepad';
    },
};
