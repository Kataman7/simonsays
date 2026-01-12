export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.notes = [];
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);

            this.generatePentatonicScale();
            
            this.initialized = true;
        } catch (error) {
            console.error('Erreur d\'initialisation audio:', error);
        }
    }

    generatePentatonicScale() {
        const baseFrequency = 392.00;

        const intervals = [0, 2, 4, 7, 9, 12];

        this.notes = intervals.map(interval => {
            return baseFrequency * Math.pow(2, interval / 12);
        });
    }

    playNote(cubeId) {
        if (!this.initialized) {
            this.initialize();
        }

        const now = this.audioContext.currentTime;
        const noteIndex = cubeId % this.notes.length;
        const frequency = this.notes[noteIndex];

        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        const noteGain = this.audioContext.createGain();
        
        const attackTime = 0.05;
        const decayTime = 0.1;
        const sustainLevel = 0.6;
        const releaseTime = 0.3;
        const noteDuration = 0.5;

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(1.0, now + attackTime);
        noteGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        noteGain.gain.setValueAtTime(sustainLevel, now + noteDuration);
        noteGain.gain.linearRampToValueAtTime(0, now + noteDuration + releaseTime);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;

        oscillator.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + noteDuration + releaseTime);

        return {
            oscillator,
            noteGain,
            filter
        };
    }

    playError() {
        if (!this.initialized) {
            this.initialize();
        }

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 80;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        oscillator.connect(gain);
        gain.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }

    async playSuccess() {
        if (!this.initialized) {
            this.initialize();
        }

        const now = this.audioContext.currentTime;
        const frequencies = [523.25, 659.25, 783.99];

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;

            const gain = this.audioContext.createGain();
            const startTime = now + index * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            oscillator.connect(gain);
            gain.connect(this.masterGain);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.initialized = false;
        }
    }
}
