export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on base canvas
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#0d0d12'; // Base dark color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    updateCamera(targetX, targetY, deltaTime) {
        // Smooth camera follow
        const lerpSpeed = 5 * deltaTime;
        const targetCamX = targetX - this.canvas.width / 2;
        const targetCamY = targetY - this.canvas.height / 2;
        
        this.camera.x += (targetCamX - this.camera.x) * lerpSpeed;
        this.camera.y += (targetCamY - this.camera.y) * lerpSpeed;

        if (this.shakeTime > 0) {
            this.shakeTime -= deltaTime;
            this.camera.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.y += (Math.random() - 0.5) * this.shakeIntensity;
        }
    }

    beginContext() {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
    }

    endContext() {
        this.ctx.restore();
        
        // Apply cinematic bloom/glow globally
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = 'rgba(252, 163, 17, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Helper for rendering entities with glow
    drawGlowingRect(x, y, w, h, color, glowColor, glowBlur) {
        this.ctx.shadowBlur = glowBlur;
        this.ctx.shadowColor = glowColor;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.shadowBlur = 0; // Reset
    }
}
