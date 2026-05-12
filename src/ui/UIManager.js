export class UIManager {
    constructor() {
        this.healthBar = document.getElementById('health-bar');
        this.auraBar = document.getElementById('aura-bar');
        this.messageOverlay = document.getElementById('message-overlay');
        this.messageTitle = document.getElementById('message-title');
        this.messageSubtitle = document.getElementById('message-subtitle');
    }

    update(gameState) {
        if (!gameState || !gameState.hero) return;

        // Smoothly interpolate health bar
        const healthPercent = Math.max(0, (gameState.hero.hp / gameState.hero.maxHp) * 100);
        this.healthBar.style.width = `${healthPercent}%`;

        // Smoothly interpolate aura bar
        const auraPercent = Math.max(0, (gameState.hero.aura / gameState.hero.maxAura) * 100);
        this.auraBar.style.width = `${auraPercent}%`;
    }

    showMessage(title, subtitle) {
        this.messageTitle.innerText = title;
        if (subtitle) {
            this.messageSubtitle.innerText = subtitle;
            this.messageSubtitle.style.display = 'block';
        } else {
            this.messageSubtitle.style.display = 'none';
        }
        this.messageOverlay.classList.remove('hidden');
    }

    hideMessage() {
        this.messageOverlay.classList.add('hidden');
    }
}
