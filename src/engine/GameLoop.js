export class GameLoop {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.lastTime = performance.now();
        this.running = false;
        this.animationFrameId = null;
        this.hitPauseDuration = 0;
    }

    start() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.loop();
        }
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    triggerHitPause(durationSeconds) {
        this.hitPauseDuration = durationSeconds;
    }

    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        // Cap delta time to 100ms to avoid huge jumps on lag
        let deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); 
        this.lastTime = currentTime;

        if (this.hitPauseDuration > 0) {
            this.hitPauseDuration -= deltaTime;
            // Provide 0 deltaTime to freeze logic but keep rendering
            this.updateCallback(0); 
        } else {
            this.updateCallback(deltaTime);
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}
