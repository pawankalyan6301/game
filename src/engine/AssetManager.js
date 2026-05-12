export class AssetManager {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    loadImage(key, src) {
        this.totalCount++;
        const img = new Image();
        img.src = src;
        img.onload = () => {
            this.loadedCount++;
            if (this.isLoaded() && this.onLoadComplete) {
                this.onLoadComplete();
            }
        };
        this.images[key] = img;
    }

    isLoaded() {
        return this.loadedCount === this.totalCount;
    }

    getImage(key) {
        return this.images[key];
    }
}
