export class Hero {
    constructor(x, y, assetManager, effectContext) {
        this.assetManager = assetManager;
        this.particles = effectContext?.particles;
        this.audio = effectContext?.audio;
        
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 100;
        
        // Stats
        this.hp = 100;
        this.maxHp = 100;
        this.aura = 100;
        this.maxAura = 100;
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        this.speed = 400;
        this.jumpForce = 800;
        this.gravity = 2000;
        this.isGrounded = false;
        
        // State
        this.state = 'idle'; // idle, run, jump, fall, attack, dash
        this.facing = 1; // 1 for right, -1 for left
        this.attackTimer = 0;
        this.dashTimer = 0;
        
        // Animation visuals (procedural for smooth look without sprites yet)
        this.breathPhase = 0;
        
        // Combat
        this.invincibilityTimer = 0;
        this.hasHitThisAttack = false;
        this.wasGrounded = false;
    }

    handleInput(input) {
        if (this.state === 'attack' || this.state === 'dash') return;

        // Horizontal movement
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.vx = this.speed;
            this.facing = 1;
            this.state = this.isGrounded ? 'run' : this.state;
            
            // Run dust
            if (this.isGrounded && Math.random() > 0.8 && this.particles) {
                this.particles.emit({
                    x: this.x + (this.facing === 1 ? 10 : this.width - 10),
                    y: this.y + this.height,
                    count: 2,
                    color: '#888',
                    size: 3,
                    life: 0.3,
                    vy: -20,
                    vx: -this.facing * 50
                });
            }
        } else if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.vx = -this.speed;
            this.facing = -1;
            this.state = this.isGrounded ? 'run' : this.state;
            
            if (this.isGrounded && Math.random() > 0.8 && this.particles) {
                this.particles.emit({
                    x: this.x + (this.facing === 1 ? 10 : this.width - 10),
                    y: this.y + this.height,
                    count: 2,
                    color: '#888',
                    size: 3,
                    life: 0.3,
                    vy: -20,
                    vx: -this.facing * 50
                });
            }
        } else {
            this.vx = 0;
            if (this.isGrounded) this.state = 'idle';
        }

        // Jumping
        if ((input.justPressed('Space') || input.justPressed('ArrowUp') || input.justPressed('KeyW')) && this.isGrounded) {
            this.vy = -this.jumpForce;
            this.isGrounded = false;
            this.state = 'jump';
            
            if (this.particles) {
                this.particles.emit({
                    x: this.x + this.width/2,
                    y: this.y + this.height,
                    count: 10,
                    color: '#ccc',
                    size: 4,
                    life: 0.5,
                    vx: (Math.random() - 0.5) * 200,
                    vy: -Math.random() * 50
                });
            }
        }

        // Attacking
        if (input.justPressed('KeyJ') || input.justPressed('KeyZ')) {
            this.state = 'attack';
            this.attackTimer = 0.3; // 300ms attack
            this.hasHitThisAttack = false;
            this.vx = 0; // stop moving while attacking on ground
            
            if (this.audio) this.audio.playDashSound(); // swoosh sound
            
            // Use aura for stronger attack
            if (this.aura >= 10) {
                this.aura -= 10;
                if (this.particles) {
                    this.particles.emit({
                        x: this.x + this.width/2,
                        y: this.y + this.height/2,
                        count: 15,
                        color: '#4cc9f0',
                        glowColor: '#4cc9f0',
                        glowBlur: 10,
                        size: 3,
                        life: 0.4,
                        vx: this.facing * 200 + (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 200
                    });
                }
            }
        }
        
        // Dashing
        if (input.justPressed('KeyK') || input.justPressed('KeyX') || input.justPressed('ShiftLeft')) {
            if (this.aura >= 20) {
                this.state = 'dash';
                this.dashTimer = 0.2;
                this.vx = this.facing * this.speed * 2.5; // Dash burst
                this.vy = 0; // suspend gravity briefly
                this.aura -= 20;
                
                if (this.audio) this.audio.playDashSound();
                if (this.particles) {
                    this.particles.emit({
                        x: this.x + this.width/2,
                        y: this.y + this.height/2,
                        count: 20,
                        color: '#4cc9f0',
                        glowColor: '#4cc9f0',
                        glowBlur: 10,
                        size: 4,
                        life: 0.4,
                        vx: -this.facing * 300,
                        vy: (Math.random() - 0.5) * 50
                    });
                }
            }
        }
    }

    update(deltaTime, groundY) {
        // State Timers
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= deltaTime;
        }

        if (this.state === 'attack') {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0) {
                this.state = 'idle';
            }
        }

        if (this.state === 'dash') {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) {
                this.state = 'idle';
                this.vx = 0;
            } else if (this.particles && Math.random() > 0.3) {
                // Dash trail
                this.particles.emit({
                    x: this.x + this.width/2 - this.facing * 20,
                    y: this.y + this.height/2 + (Math.random() - 0.5) * 40,
                    count: 1,
                    color: 'rgba(76, 201, 240, 0.5)',
                    size: 6,
                    life: 0.2,
                    vx: 0,
                    vy: 0
                });
            }
        } else {
            // Apply Gravity
            this.vy += this.gravity * deltaTime;
        }

        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Simple Ground Collision
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.vy = 0;
            this.isGrounded = true;
            if (this.state === 'fall') this.state = 'idle';
        } else {
            this.isGrounded = false;
            if (this.state !== 'attack' && this.state !== 'dash') {
                this.state = this.vy > 0 ? 'fall' : 'jump';
            }
        }
        
        // Landing particles
        if (this.isGrounded && !this.wasGrounded && this.particles) {
            this.particles.emit({
                x: this.x + this.width/2,
                y: this.y + this.height,
                count: 15,
                color: '#aaa',
                size: 3,
                life: 0.4,
                vx: (Math.random() - 0.5) * 300,
                vy: -Math.random() * 100
            });
        }
        this.wasGrounded = this.isGrounded;

        // Aura regeneration
        if (this.state !== 'attack' && this.state !== 'dash') {
            this.aura = Math.min(this.maxAura, this.aura + 5 * deltaTime);
        }

        // Animation updates
        this.breathPhase += deltaTime * 5;
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        
        // Divine Aura Effect
        const auraIntensity = this.aura / this.maxAura;
        if (auraIntensity > 0) {
            renderer.drawGlowingRect(
                this.x - 10, this.y - 10, 
                this.width + 20, this.height + 20, 
                `rgba(76, 201, 240, ${0.1 * auraIntensity})`, // Color
                '#4cc9f0', // Glow
                20 * auraIntensity // Blur amount
            );
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(this.facing, 1); // Flip based on direction

        if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Procedural Animation System
        let breathScale = 1;
        let legOffset = 0;
        let armAngle = 0;

        if (this.state === 'idle') {
            breathScale = 1 + Math.sin(this.breathPhase) * 0.02;
        } else if (this.state === 'run') {
            legOffset = Math.sin(this.breathPhase * 2) * 15;
            armAngle = Math.cos(this.breathPhase * 2) * 0.5;
            breathScale = 1 + Math.sin(this.breathPhase * 3) * 0.05;
        } else if (this.state === 'jump') {
            breathScale = 1.1; // Stretch
            legOffset = -10;
            armAngle = -0.5;
        } else if (this.state === 'fall') {
            breathScale = 0.9; // Squash
            legOffset = -5;
            armAngle = 0.5;
        }

        // Draw the image instead of boxes
        const heroImg = this.assetManager.getImage('hero');
        if (heroImg) {
            // Calculate a breathing scale effect for the sprite
            let squash = 1;
            let stretch = 1;
            
            if (this.state === 'idle') {
                squash = 1 + Math.sin(this.breathPhase) * 0.02;
            } else if (this.state === 'run') {
                squash = 1 + Math.sin(this.breathPhase * 3) * 0.05;
                stretch = 1.05;
            } else if (this.state === 'jump') {
                stretch = 1.1; // Stretch vertically
                squash = 0.9;  // Squash horizontally
            } else if (this.state === 'fall') {
                stretch = 0.9;
                squash = 1.1;
            }

            // Calculate the scaled width and height
            const drawW = this.width * 2 * squash; // make image slightly larger than hitbox
            const drawH = this.height * 1.5 * stretch; 
            
            ctx.drawImage(
                heroImg,
                -drawW / 2, -drawH, drawW, drawH
            );
        }

        // Weapon (Ghadha / Mace) glow/trail only during attack
        ctx.save();
        if (this.state === 'attack') {
            // Swing animation
            const swingProgress = 1 - (this.attackTimer / 0.3);
            ctx.rotate(Math.PI * swingProgress - Math.PI / 2);
            
            // Draw Slash Trail
            ctx.fillStyle = 'rgba(76, 201, 240, 0.7)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#4cc9f0';
            ctx.beginPath();
            ctx.arc(0, -this.height*0.5, 90, 0, Math.PI * swingProgress);
            ctx.lineTo(0, -this.height*0.2); // inner radius
            ctx.fill();
        }
        ctx.restore();

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invincibilityTimer > 0 || this.state === 'dash') return false;
        
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.invincibilityTimer = 1.0; // 1 second of i-frames
        
        if (this.particles) {
            this.particles.emit({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                count: 15,
                color: '#ff3333',
                size: 4,
                life: 0.5,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400
            });
        }
        
        return true;
    }

    getAttackHitbox() {
        if (this.state !== 'attack' || this.hasHitThisAttack) return null;
        
        const swingProgress = 1 - (this.attackTimer / 0.3);
        if (swingProgress > 0.2 && swingProgress < 0.8) {
            return {
                x: this.facing === 1 ? this.x + this.width : this.x - 80,
                y: this.y - 20,
                width: 80,
                height: this.height + 40,
                damage: this.aura >= 10 ? 25 : 10 // Basic damage is 10, empowered is 25
            };
        }
        return null;
    }
}
