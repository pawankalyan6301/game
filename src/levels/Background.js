export class Background {
    constructor(assetManager) {
        this.assetManager = assetManager;
        // Multi-layered parallax background
        this.layers = [
            { depth: 0.1, color: '#050508', yOffset: -300 }, // Distant mountains
            { depth: 0.3, color: '#0a0a14', yOffset: -100 }, // Mid hills
            { depth: 0.6, color: '#11111a', yOffset: 100 },  // Near ruins
        ];
        
        // Background atmospheric particles (fireflies/magic dust)
        this.particles = [];
        for(let i=0; i<50; i++) {
            this.particles.push({
                x: Math.random() * 2000,
                y: Math.random() * 1000,
                size: Math.random() * 3 + 1,
                speedY: -(Math.random() * 10 + 5),
                speedX: (Math.random() - 0.5) * 10,
                phase: Math.random() * Math.PI * 2
            });
        }
        this.time = 0;
    }

    update(heroX, deltaTime) {
        this.time += deltaTime;
        
        // Update atmospheric particles
        for(let p of this.particles) {
            p.y += p.speedY * deltaTime;
            p.x += (p.speedX + Math.sin(this.time + p.phase) * 10) * deltaTime;
            
            if (p.y < -100) {
                p.y = 1000;
                p.x = heroX + (Math.random() - 0.5) * 2000;
            }
        }
    }

    draw(renderer) {
        const camX = renderer.camera.x;
        const w = renderer.canvas.width;
        const h = renderer.canvas.height;

        renderer.ctx.save();
        
        const bgImg = this.assetManager.getImage('background');
        
        // Draw layers
        this.layers.forEach((layer, index) => {
            const parallaxX = (camX * layer.depth) % (w * 2); // Simple looping logic
            
            if (bgImg && index === 2) { // Use image for the near ruins layer
                renderer.ctx.drawImage(bgImg, -parallaxX, layer.yOffset, w * 2, h);
                renderer.ctx.drawImage(bgImg, -parallaxX + (w * 2), layer.yOffset, w * 2, h);
            } else {
                renderer.ctx.fillStyle = layer.color;
                
                // Draw two copies for seamless looping
                renderer.ctx.beginPath();
                renderer.ctx.rect(-parallaxX, layer.yOffset, w * 2, h);
                renderer.ctx.rect(-parallaxX + (w * 2), layer.yOffset, w * 2, h);
                renderer.ctx.fill();
            }
            
            // Draw background particles between mid and near layers
            if (index === 1) {
                renderer.ctx.save();
                renderer.ctx.fillStyle = 'rgba(76, 201, 240, 0.4)';
                renderer.ctx.shadowBlur = 10;
                renderer.ctx.shadowColor = '#4cc9f0';
                for(let p of this.particles) {
                    const px = p.x - (camX * 0.4); // slightly faster than layer 1, slower than layer 2
                    // Wrap around logic for particles
                    const wrappedX = ((px % (w * 2)) + (w * 2)) % (w * 2) - w/2;
                    renderer.ctx.beginPath();
                    renderer.ctx.arc(wrappedX, p.y, p.size, 0, Math.PI * 2);
                    renderer.ctx.fill();
                }
                renderer.ctx.restore();
            }
        });

        renderer.ctx.restore();
    }
}
