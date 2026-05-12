import { Hero } from '../entities/Hero.js';
import { Background } from './Background.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';

export class LevelManager {
    constructor(assetManager, particleSystem, audioEngine, getGameLoop, renderer) {
        this.assetManager = assetManager;
        this.particleSystem = particleSystem;
        this.audioEngine = audioEngine;
        this.getGameLoop = getGameLoop;
        this.renderer = renderer;
        
        // Pass effects to entities so they can use them
        const effectContext = { particles: particleSystem, audio: audioEngine };
        
        this.hero = new Hero(200, 500, assetManager, effectContext); // Start position
        this.background = new Background(assetManager);
        this.enemies = [
            new Enemy(800, 500, 'melee', assetManager, effectContext),
            new Boss(1500, 400, assetManager, effectContext)
        ];
        this.isIntro = false;
        
        // Ground level for basic collision
        this.groundY = 600;
    }

    startIntro() {
        this.isIntro = true;
        this.hero.aura = 0; // Starts with no aura, builds up in intro
        setTimeout(() => {
            this.isIntro = false;
            this.hero.aura = this.hero.maxAura; // Fully charged after intro
            this.particleSystem.emit({
                x: this.hero.x + this.hero.width/2,
                y: this.hero.y + this.hero.height/2,
                count: 50,
                color: '#fca311',
                size: 4,
                life: 1.5,
                glowBlur: 10,
                glowColor: '#fca311'
            });
            this.audioEngine.playHitSound(true);
        }, 3000);
    }

    update(deltaTime, inputManager) {
        if (!this.isIntro) {
            this.hero.handleInput(inputManager);
        } else {
            // Intro sequence logic (aura rising)
            this.hero.aura = Math.min(this.hero.maxAura, this.hero.aura + (this.hero.maxAura / 3) * deltaTime);
        }

        this.hero.update(deltaTime, this.groundY);

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(deltaTime, this.groundY, this.hero);
        }

        this.checkCollisions();

        // Parallax background updates based on hero position
        this.background.update(this.hero.x, deltaTime);
    }

    checkCollisions() {
        // Hero attack vs Enemies
        const attackHitbox = this.hero.getAttackHitbox();
        if (attackHitbox) {
            for (let enemy of this.enemies) {
                if (enemy.state !== 'dead' && this.isColliding(attackHitbox, enemy)) {
                    if (enemy.takeDamage(attackHitbox.damage)) {
                        this.hero.hasHitThisAttack = true;
                        
                        // Hit Pause & Shake on successful hit
                        const gameLoop = this.getGameLoop();
                        if (gameLoop) {
                            gameLoop.triggerHitPause(0.1); // 100ms hit pause
                        }
                        if (this.renderer) {
                            this.renderer.shake(15, 0.15); // 15px intensity, 150ms
                        }
                        
                        // Spawn impact particles
                        this.particleSystem.emit({
                            x: enemy.x + enemy.width/2,
                            y: enemy.y + enemy.height/2,
                            count: 20,
                            color: '#fca311',
                            size: 3,
                            life: 0.5,
                            vx: (Math.random() - 0.5) * 500,
                            vy: (Math.random() - 0.5) * 500
                        });
                        this.audioEngine.playHitSound(true);
                    }
                }
            }
        }

        // Enemies vs Hero
        for (let enemy of this.enemies) {
            if (enemy.state === 'dead') continue;
            
            // Body collision (reduced bounding box for fair gameplay)
            const enemyHitbox = {
                x: enemy.x + 20,
                y: enemy.y + 20,
                width: enemy.width - 40,
                height: enemy.height - 20
            };
            const heroHitbox = {
                x: this.hero.x + 10,
                y: this.hero.y + 10,
                width: this.hero.width - 20,
                height: this.hero.height - 10
            };

            if (this.isColliding(heroHitbox, enemyHitbox)) {
                if(this.hero.takeDamage(10)) {
                    this.audioEngine.playHitSound(false);
                    const gameLoop = this.getGameLoop();
                    if (gameLoop) gameLoop.triggerHitPause(0.05); // Short hit pause on hero hurt
                    if (this.renderer) this.renderer.shake(10, 0.1);
                }
            }

            // Projectiles
            if (enemy.projectiles) {
                for (let p of enemy.projectiles) {
                    if (p.active && this.isColliding(heroHitbox, p)) {
                        if (this.hero.takeDamage(p.damage)) {
                            if (p.type === 'orb') p.active = false;
                            this.audioEngine.playHitSound(false);
                        }
                    }
                }
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(renderer, deltaTime) {
        // Center camera on hero with some vertical offset
        renderer.updateCamera(this.hero.x, this.hero.y - 100, deltaTime > 0 ? deltaTime : 0.016);

        // Draw parallax background
        this.background.draw(renderer);

        renderer.beginContext();

        // Draw ground (temporary visual for the floor)
        renderer.ctx.fillStyle = '#111';
        renderer.ctx.fillRect(this.hero.x - 2000, this.groundY, 4000, 1000);
        renderer.ctx.strokeStyle = '#fca311'; // Sacred gold line for the ground
        renderer.ctx.lineWidth = 2;
        renderer.ctx.beginPath();
        renderer.ctx.moveTo(this.hero.x - 2000, this.groundY);
        renderer.ctx.lineTo(this.hero.x + 2000, this.groundY);
        renderer.ctx.stroke();

        // Draw entities
        for (let enemy of this.enemies) {
            enemy.draw(renderer);
        }

        this.hero.draw(renderer);
        
        // Draw particles on top
        this.particleSystem.draw(renderer);

        renderer.endContext();
    }

    getState() {
        return {
            hero: {
                hp: this.hero.hp,
                maxHp: this.hero.maxHp,
                aura: this.hero.aura,
                maxAura: this.hero.maxAura
            }
        };
    }
}
