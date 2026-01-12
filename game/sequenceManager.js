export class SequenceManager {
    constructor() {
        this.sequenceA = [];
        this.sequenceB = [];
        this.playerSequence = [];
        this.currentIndex = 0;
        this.currentPattern = 'A';
    }

    generateNext(availableCubes) {
        if (availableCubes.length === 0) {
            throw new Error('Aucun cube disponible pour générer la séquence');
        }

        const randomIndex = Math.floor(Math.random() * availableCubes.length);
        const randomCube = availableCubes[randomIndex];
        
        if (this.currentPattern === 'A') {
            this.sequenceA.push(randomCube.id);
        } else {
            this.sequenceB.push(randomCube.id);
        }
        
        this.resetPlayer();
    }

    switchPattern() {
        this.currentPattern = this.currentPattern === 'A' ? 'B' : 'A';
        this.resetPlayer();
    }

    addPlayerInput(cubeId) {
        this.playerSequence.push(cubeId);

        const activeSequence = this.currentPattern === 'A' ? this.sequenceA : this.sequenceB;
        const isCorrect = cubeId === activeSequence[this.currentIndex];
        
        if (!isCorrect) {
            return { correct: false, complete: false };
        }

        this.currentIndex++;

        const isComplete = this.currentIndex >= activeSequence.length;
        
        return { correct: true, complete: isComplete };
    }

    resetPlayer() {
        this.playerSequence = [];
        this.currentIndex = 0;
    }

    getSequence() {
        const activeSequence = this.currentPattern === 'A' ? this.sequenceA : this.sequenceB;
        return [...activeSequence];
    }

    getLength() {
        const activeSequence = this.currentPattern === 'A' ? this.sequenceA : this.sequenceB;
        return activeSequence.length;
    }

    reset() {
        this.sequenceA = [];
        this.sequenceB = [];
        this.currentPattern = 'A';
        this.resetPlayer();
    }
}
