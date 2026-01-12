export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
    }

    nextLevel() {
        this.currentLevel++;
        this.score += this.currentLevel * 10;
    }

    getLevel() {
        return this.currentLevel;
    }

    getScore() {
        return this.score;
    }

    reset() {
        this.currentLevel = 1;
        this.score = 0;
    }

    getSequenceDelay() {
        return Math.max(150, 1000 - ((this.currentLevel - 1) * 80));
    }
}
