export class Projectile {
    constructor(x, y, vx, vy, type, damage, assetManager) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'orb', 'shockwave'
        this.damage = damage;
        this.assetManager = assetManager;
        this.active = true;
        this.lifeTime = 5; // seconds
        
        if (this.type === 'orb') {
            this.width = 30;
            this.height = 30;
        } else if (this.type === 'shockwave') {
            this.width = 60;
            this.height = 40;
        } else {
            this.width = 20;
            this.height = 20;
        }
    }

    update(deltaTime, groundY) {
        if (!this.active) return;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        this.lifeTime -= deltaTime;
        if (this.lifeTime <= 0) {
            this.active = false;
        }

        if (this.type === 'shockwave') {
            // Keep on ground
            this.y = groundY - this.height;
        } else {
            // Destroy if hitting ground
            if (this.y + this.height >= groundY) {
                this.active = false;
            }
        }
    }

    draw(renderer) {
        if (!this.active) return;

        const ctx = renderer.ctx;
        ctx.save();
        
        if (this.type === 'orb') {
            renderer.drawGlowingRect(
                this.x, this.y, 
                this.width, this.height, 
                'rgba(148, 0, 211, 0.6)', // Dark violet
                '#9400d3',
                20
            );
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 - 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'shockwave') {
            renderer.drawGlowingRect(
                this.x, this.y, 
                this.width, this.height, 
                'rgba(255, 50, 50, 0.5)', 
                '#ff3232',
                15
            );
        }

        ctx.restore();
    }
}
