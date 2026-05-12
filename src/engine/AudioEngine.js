export class AudioEngine {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.masterGain.gain.value = 0.3; // Default volume
    }

    resume() {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    // A basic synthesized hit sound for impacts
    playHitSound(heavy = false) {
        this.resume();
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        const now = this.context.currentTime;
        
        if (heavy) {
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
            gainNode.gain.setValueAtTime(1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    }

    playDashSound() {
        this.resume();
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        const now = this.context.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
}
