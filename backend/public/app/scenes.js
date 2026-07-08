/** Contextual canvas scene animations for learning and challenge games */
window.LoreboundScenes = {
    detectType(text = '', category = '', metadata = {}) {
        const theme = metadata?.theme?.visualScene || metadata?.theme?.scene;
        if (theme) return theme;
        const lower = (text + ' ' + (metadata?.rationale || '')).toLowerCase();
        if (/\b(war|battle|army|independence|liberation|military|conflict|revolution|1971)\b/.test(lower)) return 'war';
        if (/\b(heart|blood|cell|biology|organ|anatomy)\b/.test(lower)) return 'body';
        if (/\b(ocean|marine|plastic|water|ecology|river)\b/.test(lower)) return 'ocean';
        if (/\b(energy|solar|fossil|electric|power grid)\b/.test(lower)) return 'energy';
        if (/\b(computer|internet|network|digital|software|chip)\b/.test(lower)) return 'tech';
        if (category === 'Process') return 'nature';
        if (category === 'CauseEffect') return 'ocean';
        if (category === 'Comparison') return 'energy';
        return 'history';
    },

    mount(container, sceneType, options = {}) {
        if (!container) return null;
        const existing = container.querySelector('.lb-scene-canvas');
        if (existing) existing.remove();

        const wrap = document.createElement('div');
        wrap.className = 'lb-scene-layer';
        const canvas = document.createElement('canvas');
        canvas.className = 'lb-scene-canvas';
        wrap.appendChild(canvas);
        container.prepend(wrap);

        const pdfImg = options.pdfImages?.[0]?.dataUrl;
        if (pdfImg) {
            const img = document.createElement('img');
            img.className = 'lb-scene-pdf-bg';
            img.src = pdfImg;
            img.alt = '';
            wrap.appendChild(img);
        }

        const scene = this._createScene(canvas, sceneType, options);
        scene.start();
        return scene;
    },

    pulse(container) {
        container?.querySelector('.lb-scene-layer')?.classList.add('lb-scene-pulse');
        setTimeout(() => container?.querySelector('.lb-scene-layer')?.classList.remove('lb-scene-pulse'), 600);
    },

    playDeploy(fromEl, toEl, container) {
        if (!fromEl || !toEl || !container) return;
        const layer = container.querySelector('.lb-scene-layer') || container;
        const fly = document.createElement('div');
        fly.className = 'lb-deploy-marker';
        fly.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        const lr = layer.getBoundingClientRect();
        fly.style.left = `${fr.left - lr.left + fr.width / 2}px`;
        fly.style.top = `${fr.top - lr.top + fr.height / 2}px`;
        layer.appendChild(fly);
        requestAnimationFrame(() => {
            fly.style.left = `${tr.left - lr.left + tr.width / 2}px`;
            fly.style.top = `${tr.top - lr.top + tr.height / 2}px`;
            fly.style.opacity = '0';
        });
        setTimeout(() => fly.remove(), 700);
        this.pulse(container);
    },

    _createScene(canvas, type, options) {
        const ctx = canvas.getContext('2d');
        let w = 0;
        let h = 0;
        let frame = 0;
        let raf = 0;
        const particles = [];

        const resize = () => {
            const parent = canvas.parentElement;
            w = canvas.width = parent?.clientWidth || 800;
            h = canvas.height = parent?.clientHeight || 280;
        };

        const palettes = {
            war: { bg: ['#1a0a0a', '#2d1515'], accent: '#ff5252', secondary: '#ffab40' },
            body: { bg: ['#1a0810', '#2d1020'], accent: '#ff4081', secondary: '#f48fb1' },
            ocean: { bg: ['#051520', '#0a2840'], accent: '#26c6da', secondary: '#4fc3f7' },
            energy: { bg: ['#0a1a0a', '#142814'], accent: '#69f0ae', secondary: '#ff8f00' },
            tech: { bg: ['#0a0e1a', '#12182d'], accent: '#00f2fe', secondary: '#7c4dff' },
            nature: { bg: ['#0a140a', '#142814'], accent: '#8bc34a', secondary: '#26c6da' },
            history: { bg: ['#0e0e14', '#1a1a28'], accent: '#00f2fe', secondary: '#9b51e0' },
        };
        const pal = palettes[type] || palettes.history;

        const initParticles = (count) => {
            particles.length = 0;
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * (type === 'war' ? 2.5 : 1.2),
                    vy: (Math.random() - 0.5) * 1.2,
                    r: 1 + Math.random() * 3,
                    c: Math.random() > 0.5 ? pal.accent : pal.secondary,
                    life: Math.random(),
                });
            }
        };

        const drawWar = () => {
            const g = ctx.createLinearGradient(0, 0, 0, h);
            g.addColorStop(0, pal.bg[0]);
            g.addColorStop(1, pal.bg[1]);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(255,82,82,0.08)';
            for (let i = 0; i < 3; i++) {
                const y = h * 0.55 + Math.sin(frame * 0.02 + i) * 12;
                ctx.beginPath();
                ctx.ellipse(w * (0.3 + i * 0.2), y, 80 + i * 20, 25, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.fillStyle = p.c;
                ctx.globalAlpha = 0.4 + Math.sin(frame * 0.05 + p.life) * 0.3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        };

        const drawFlow = () => {
            const g = ctx.createLinearGradient(0, 0, w, h);
            g.addColorStop(0, pal.bg[0]);
            g.addColorStop(1, pal.bg[1]);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = pal.accent;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.35;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                const offset = (frame * 2 + i * 60) % (w + 100);
                ctx.moveTo(offset - 100, h * 0.3 + i * 15);
                ctx.bezierCurveTo(offset, h * 0.2, offset + 50, h * 0.7, offset + 100, h * 0.5);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            particles.forEach(p => {
                p.x += p.vx * 0.8;
                p.y += Math.sin(frame * 0.03 + p.life * 10) * 0.5;
                if (p.x > w) p.x = 0;
                ctx.fillStyle = p.c;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        };

        const tick = () => {
            frame++;
            if (type === 'war' || type === 'history') drawWar();
            else drawFlow();
            raf = requestAnimationFrame(tick);
        };

        return {
            start() {
                resize();
                initParticles(type === 'war' ? 40 : 28);
                tick();
                window.addEventListener('resize', resize);
            },
            stop() {
                cancelAnimationFrame(raf);
                window.removeEventListener('resize', resize);
            },
        };
    },
};
