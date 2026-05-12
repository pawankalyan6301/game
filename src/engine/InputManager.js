export class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    update() {
        // Must be called at the end of the frame to store previous state for justPressed logic
        this.previousKeys = { ...this.keys };
    }

    isDown(code) {
        return !!this.keys[code];
    }

    justPressed(code) {
        return !!this.keys[code] && !this.previousKeys[code];
    }

    justReleased(code) {
        return !this.keys[code] && !!this.previousKeys[code];
    }
}
