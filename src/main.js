import { GameLoop } from './engine/GameLoop.js';
import { Renderer } from './engine/Renderer.js';
import { InputManager } from './engine/InputManager.js';
import { UIManager } from './ui/UIManager.js';
import { LevelManager } from './levels/LevelManager.js';
import { AssetManager } from './engine/AssetManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { AudioEngine } from './engine/AudioEngine.js';

// Setup Game Components
const canvas = document.getElementById('game-canvas');
const assetManager = new AssetManager();
const particleSystem = new ParticleSystem();
const audioEngine = new AudioEngine();

// Load Assets
assetManager.loadImage('hero', './assets/hero.png');
assetManager.loadImage('enemy', './assets/enemy.png');
assetManager.loadImage('boss', './assets/boss.png');
assetManager.loadImage('background', './assets/background.png');
const uiManager = new UIManager();
const inputManager = new InputManager();
const renderer = new Renderer(canvas);

// We need gameLoop reference inside LevelManager for hit pause
let gameLoop;
const levelManager = new LevelManager(assetManager, particleSystem, audioEngine, () => gameLoop, renderer);

gameLoop = new GameLoop((deltaTime) => {
    // Update logic
    if (deltaTime > 0) {
        inputManager.update();
        levelManager.update(deltaTime, inputManager);
        particleSystem.update(deltaTime);
    }
    uiManager.update(levelManager.getState());

    // Render logic
    renderer.clear();
    levelManager.draw(renderer, deltaTime);
});

// Start Game Sequence
window.addEventListener('load', () => {
    renderer.resize();
    
    assetManager.onLoadComplete = () => {
        uiManager.showMessage('Sacred Power Lost', 'Press ENTER to begin your journey');
        
        // Wait for enter to start
        const startListener = (e) => {
            if (e.key === 'Enter') {
                window.removeEventListener('keydown', startListener);
                audioEngine.resume(); // Ensure audio context is started
                uiManager.hideMessage();
                levelManager.startIntro();
                gameLoop.start();
            }
        };
        window.addEventListener('keydown', startListener);
    };

    // If already loaded (e.g., cached or very fast)
    if (assetManager.isLoaded()) {
        assetManager.onLoadComplete();
    }
});

window.addEventListener('resize', () => {
    renderer.resize();
});
