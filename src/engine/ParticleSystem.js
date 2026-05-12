export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(config) {
        const count = config.count || 1;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: config.x || 0,
                y: config.y || 0,
                vx: config.vx || (Math.random() - 0.5) * 100,
                vy: config.vy || (Math.random() - 0.5) * 100,
                life: config.life || 1,
                maxLife: config.life || 1,
                color: config.color || '#ffffff',
                size: config.size || 2,
                decay: config.decay || 1,
                gravity: config.gravity || 0,
                friction: config.friction || 0.98,
                glowBlur: config.glowBlur || 0,
                glowColor: config.glowColor || 'transparent',
                alpha: 1
            });
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity * deltaTime;
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            p.life -= p.decay * deltaTime;
            p.alpha = Math.max(0, p.life / p.maxLife);
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(renderer) {
        if (this.particles.length === 0) return;
        
        const ctx = renderer.ctx;
        ctx.save();
        
        // Batch rendering optimization: group by color/glow if needed, but for simplicity we iterate
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            
            if (p.glowBlur > 0) {
                ctx.shadowBlur = p.glowBlur;
                ctx.shadowColor = p.glowColor;
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        
        ctx.restore();
    }
}
