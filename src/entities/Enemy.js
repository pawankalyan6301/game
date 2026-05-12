export class Enemy {
    constructor(x, y, type = 'melee', assetManager, effectContext) {
        this.assetManager = assetManager;
        this.particles = effectContext?.particles;
        this.audio = effectContext?.audio;
        
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 90;
        this.type = type; // melee, ranged, flying
        
        // Stats
        this.hp = 50;
        this.maxHp = 50;
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        this.speed = 150;
        this.gravity = 2000;
        this.isGrounded = false;
        
        // State
        this.state = 'idle'; // idle, chase, attack, hurt, dead
        this.facing = -1; // -1 for left, 1 for right
        this.hurtTimer = 0;
    }

    update(deltaTime, groundY, hero) {
        if (this.state === 'dead') return;

        // Gravity
        if (this.type !== 'flying') {
            this.vy += this.gravity * deltaTime;
        }

        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Ground Collision
        if (this.type !== 'flying' && this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.isGrounded = true;
        }

        if (this.hurtTimer > 0) {
            this.hurtTimer -= deltaTime;
            if (this.hurtTimer <= 0) {
                this.state = 'idle';
            } else {
                this.vx = 0; // stunned
            }
        }

        // Simple AI logic (Chase Hero)
        if (hero && this.state !== 'hurt' && this.state !== 'attack') {
            const dist = hero.x - this.x;
            if (Math.abs(dist) < 500) { // Detection radius
                this.state = 'chase';
                this.facing = dist > 0 ? 1 : -1;
                this.vx = this.facing * this.speed;
            } else {
                this.state = 'idle';
                this.vx = 0;
            }
        }
    }

    draw(renderer) {
        if (this.state === 'dead') return;

        const ctx = renderer.ctx;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(this.facing, 1); // Flip

        if (this.state === 'hurt') {
            ctx.filter = 'brightness(200%)';
        }

        // Draw image instead of boxes
        const enemyImg = this.assetManager.getImage('enemy');
        if (enemyImg) {
            ctx.drawImage(
                enemyImg,
                -this.width / 2 - 20, -this.height - 10, this.width + 40, this.height + 20
            );
        }

        // Red glowing eyes
        renderer.drawGlowingRect(5, -this.height + 20, 10, 5, '#ff0000', '#ff0000', 10);

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.state === 'dead' || this.hurtTimer > 0) return false;
        
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'dead';
            
            // Death particles
            if (this.particles) {
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    count: 30,
                    color: '#ff0000',
                    size: 5,
                    life: 0.8,
                    vx: (Math.random() - 0.5) * 600,
                    vy: (Math.random() - 0.5) * 600
                });
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    count: 20,
                    color: '#333',
                    size: 8,
                    life: 1.2,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200
                });
            }
        } else {
            this.state = 'hurt';
            this.hurtTimer = 0.3; // Stun duration
            
            // Hurt particles
            if (this.particles) {
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    count: 5,
                    color: '#ffaaaa',
                    size: 3,
                    life: 0.3,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200
                });
            }
        }
        return true;
    }
}
