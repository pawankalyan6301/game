import { Projectile } from './Projectile.js';

export class Boss {
    constructor(x, y, assetManager, effectContext) {
        this.assetManager = assetManager;
        this.particles = effectContext?.particles;
        this.audio = effectContext?.audio;
        
        this.x = x;
        this.y = y;
        this.width = 150;
        this.height = 250;
        
        // Stats
        this.hp = 1000;
        this.maxHp = 1000;
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        this.speed = 250;
        this.gravity = 2000;
        this.isGrounded = false;
        
        // State
        this.state = 'idle'; // idle, smash_jump, smash_fall, projectile, shockwave, cinematic, dead
        this.facing = -1; // -1 for left, 1 for right
        this.phase = 1;
        this.attackCooldown = 2; // seconds
        this.hurtTimer = 0;
        
        this.projectiles = [];
        this.cinematicTimer = 0;
    }

    takeDamage(amount) {
        if (this.state === 'dead' || this.state === 'cinematic') return false;
        
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'dead';
            
            // Death particles
            if (this.particles) {
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    count: 100,
                    color: '#8b0000',
                    size: 8,
                    life: 2.0,
                    vx: (Math.random() - 0.5) * 800,
                    vy: (Math.random() - 0.5) * 800
                });
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    count: 50,
                    color: '#333',
                    size: 15,
                    life: 3.0,
                    vx: (Math.random() - 0.5) * 400,
                    vy: (Math.random() - 0.5) * 400
                });
            }
            return true;
        }

        // Trigger Phase 2 Cinematic Enrage
        if (this.hp <= this.maxHp / 2 && this.phase === 1) {
            this.phase = 2;
            this.state = 'cinematic';
            this.cinematicTimer = 2.5; // 2.5 seconds of enrage animation
            this.vx = 0;
            this.vy = 0;
            
            if (this.particles) {
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    count: 40,
                    color: '#ff0032',
                    size: 6,
                    glowBlur: 15,
                    glowColor: '#ff0032',
                    life: 1.0,
                    vx: (Math.random() - 0.5) * 500,
                    vy: (Math.random() - 0.5) * 500
                });
            }
        } else {
            this.hurtTimer = 0.1; // short flash
        }
        
        return true;
    }

    update(deltaTime, groundY, hero) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime, groundY);
            if (!this.projectiles[i].active) {
                this.projectiles.splice(i, 1);
            }
        }

        if (this.state === 'dead') return;

        if (this.hurtTimer > 0) {
            this.hurtTimer -= deltaTime;
        }

        // Gravity
        if (this.state !== 'cinematic') {
            this.vy += this.gravity * deltaTime;
        }

        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Ground Collision
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.isGrounded = true;
            
            if (this.state === 'smash_fall') {
                this.state = 'idle';
                this.vx = 0;
                // Create shockwaves
                this.projectiles.push(new Projectile(this.x + this.width, groundY - 40, 500, 0, 'shockwave', 20, this.assetManager));
                this.projectiles.push(new Projectile(this.x - 60, groundY - 40, -500, 0, 'shockwave', 20, this.assetManager));
                
                // Smash particles
                if (this.particles) {
                    this.particles.emit({
                        x: this.x + this.width/2,
                        y: groundY,
                        count: 40,
                        color: '#666',
                        size: 5,
                        life: 0.5,
                        vx: (Math.random() - 0.5) * 600,
                        vy: -Math.random() * 300
                    });
                }
            }
        } else {
            this.isGrounded = false;
        }

        // Boss AI
        if (this.state === 'cinematic') {
            this.cinematicTimer -= deltaTime;
            if (this.cinematicTimer <= 0) {
                this.state = 'idle';
                this.attackCooldown = 0.5;
            } else if (this.particles && Math.random() > 0.5) {
                // Enrage particles pulling in
                this.particles.emit({
                    x: this.x + this.width/2 + (Math.random() - 0.5) * 300,
                    y: this.y + this.height/2 + (Math.random() - 0.5) * 300,
                    count: 1,
                    color: '#ff0032',
                    size: 4,
                    glowBlur: 10,
                    glowColor: '#ff0032',
                    life: 0.5,
                    // Note: true inward gravity would require custom logic in particle system, 
                    // so we just spawn them and let them decay, or aim them inwards
                    vx: 0,
                    vy: 0
                });
            }
            return;
        }

        if (this.state === 'smash_jump') {
            if (this.vy > 0) {
                this.state = 'smash_fall';
                this.vy = 1500; // Fast drop
                this.vx = 0;
            }
            return;
        }

        if (this.state === 'projectile' || this.state === 'shockwave') {
            // These are handled quickly, wait to return to idle
            this.state = 'idle';
        }

        if (hero && this.state === 'idle') {
            const dist = hero.x - this.x;
            this.facing = dist > 0 ? 1 : -1;
            
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown <= 0) {
                this.attackCooldown = this.phase === 1 ? 2.5 : 1.2; // attacks faster in phase 2
                
                // Pick random attack
                const rand = Math.random();
                if (rand < 0.4) {
                    // Smash
                    this.state = 'smash_jump'; 
                    this.vy = -1000; // Jump smash
                    this.vx = this.facing * 350;
                } else if (rand < 0.7) {
                    // Projectile
                    this.state = 'projectile';
                    // Aim at hero
                    const dx = hero.x - this.x;
                    const dy = hero.y - this.y;
                    const angle = Math.atan2(dy, dx);
                    const speed = 600;
                    this.projectiles.push(new Projectile(
                        this.x + this.width/2, this.y + this.height/2, 
                        Math.cos(angle) * speed, Math.sin(angle) * speed, 
                        'orb', 15, this.assetManager
                    ));
                } else {
                    // Ground shockwave stomp (no jump, just spawn shockwave towards hero)
                    this.state = 'shockwave';
                    this.projectiles.push(new Projectile(
                        this.facing === 1 ? this.x + this.width : this.x - 60, 
                        groundY - 40, 
                        this.facing * 500, 0, 
                        'shockwave', 20, this.assetManager
                    ));
                }
            }
        }
    }

    draw(renderer) {
        // Draw projectiles first so they appear behind boss or correctly
        for (let p of this.projectiles) {
            p.draw(renderer);
        }

        if (this.state === 'dead') {
            // Draw dead state (darkened or dissolving)
            const ctx = renderer.ctx;
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height);
            ctx.scale(this.facing, 1);
            ctx.globalAlpha = 0.5;
            renderer.drawGlowingRect(-this.width/2, -50, this.width, 50, '#333', '#111', 10);
            ctx.restore();
            return;
        }

        const ctx = renderer.ctx;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(this.facing, 1);

        if (this.hurtTimer > 0) {
            ctx.filter = 'brightness(200%)';
        }

        // Draw image instead of boxes
        const bossImg = this.assetManager.getImage('boss');
        if (bossImg) {
            ctx.drawImage(
                bossImg,
                -this.width / 2 - 50, -this.height - 20, this.width + 100, this.height + 40
            );
        }
        
        // Enrage effect / Phase 2
        if (this.phase === 2) {
            renderer.drawGlowingRect(
                -this.width / 2, -this.height, 
                this.width, this.height, 
                'rgba(255, 0, 50, 0.2)', 
                '#ff0032', 
                this.state === 'cinematic' ? 80 : 30 // Pulsing glow during cinematic
            );
        }
        
        if (this.state === 'cinematic') {
             // Dark energy swirl
             ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
             ctx.beginPath();
             ctx.arc(0, -this.height/2, this.height, 0, Math.PI * 2);
             ctx.fill();
        }

        ctx.restore();
    }
}
