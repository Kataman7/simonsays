import { Renderer } from './engine/renderer.js';
import { RayPicker } from './engine/rayPicker.js';
import { AudioManager } from './audio/audioManager.js';
import { CubeModel } from './models/cube.js';
import { GameState, GameStates } from './game/gameState.js';
import { SequenceManager } from './game/sequenceManager.js';
import { LevelManager } from './game/levelManager.js';

class SimonSaysGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.levelDisplay = document.getElementById('level');
        this.messageDisplay = document.getElementById('message');
        this.scoreDisplay = document.getElementById('score');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');

        this.renderer = new Renderer(this.canvas);
        this.cubeModel = new CubeModel(3);
        this.rayPicker = new RayPicker(this.renderer.getCamera(), this.cubeModel);
        this.audioManager = new AudioManager();
        this.gameState = new GameState();
        this.sequenceManager = new SequenceManager();
        this.levelManager = new LevelManager();

        this.faceOrder = [5, 1, 4, 0];
        this.currentFaceIndex = 0;

        this.initialize();
    }

    initialize() {
        this.updateGeometry();

        this.setupEventListeners();

        this.startRenderLoop();

        this.gameState.addListener((newState, oldState) => {
            this.onStateChange(newState, oldState);
        });

        this.updateUI();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        this.startButton.addEventListener('click', () => this.startGame());

        this.restartButton.addEventListener('click', () => this.restartGame());

        window.addEventListener('resize', () => this.handleResize());
    }

    handleClick(event) {
        const pickedCube = this.getPickedCube(event.clientX, event.clientY);

        if (!pickedCube) return;

        if (this.gameState.getState() === 'idle') {
            const logicalId = this.getLogicalIdFromCube(pickedCube);
            this.playNoteAndHighlight(logicalId);
        } else if (this.gameState.canClick()) {
            this.handleCubeClick(pickedCube);
        }
    }

    handleMouseMove(event) {
        const pickedCube = this.getPickedCube(event.clientX, event.clientY);

        if (pickedCube && (this.gameState.getState() === 'idle' || this.gameState.canClick())) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    getPickedCube(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        return this.rayPicker.pick(
            x, y,
            this.canvas.width,
            this.canvas.height,
            this.renderer.getModelMatrix()
        );
    }

    getActiveFace() {
        return this.faceOrder[this.currentFaceIndex];
    }

    getLogicalIdFromCube(cube) {
        return this.cubeModel.calculateLogicalId(
            this.getActiveFace(),
            cube.gridPos.x,
            cube.gridPos.y,
            cube.gridPos.z
        );
    }

    playNoteAndHighlight(logicalId) {
        this.highlightLogicalId(logicalId);
        this.audioManager.playNote(logicalId);
    }

    async handleCubeClick(cube) {
        const activeFace = this.getActiveFace();

        if (!cube.faces.includes(activeFace)) {
            return;
        }

        const logicalId = this.getLogicalIdFromCube(cube);
        
        this.processInput(logicalId);
    }

    async processInput(logicalId) {
        this.playNoteAndHighlight(logicalId);

        const result = this.sequenceManager.addPlayerInput(logicalId);

        if (!result.correct) {
            await this.handleError();
        } else if (result.complete) {
            await this.handleSuccess();
        }
    }

    highlightLogicalId(logicalId) {
        const activeFace = this.getActiveFace();
        
        const matchingCubes = this.cubeModel.cubes.filter(cube => {
            if (!cube.faces.includes(activeFace)) return false;
            
            const id = this.cubeModel.calculateLogicalId(
                activeFace,
                cube.gridPos.x,
                cube.gridPos.y,
                cube.gridPos.z
            );
            return id === logicalId;
        });
        
        matchingCubes.forEach(cube => {
            if (cube.highlightTimeout) {
                clearTimeout(cube.highlightTimeout);
            }
            
            cube.color = [1.0, 1.0, 1.0];
            cube.scale = 1.3;
            
            cube.highlightTimeout = setTimeout(() => {
                cube.color = [...cube.baseColor];
                cube.scale = 1.0;
                cube.highlightTimeout = null;
                this.updateGeometry();
            }, 400);
        });

        this.updateGeometry();
    }

    async startGame() {
        this.startButton.style.display = 'none';
        const soundHint = document.getElementById('soundHint');
        if (soundHint) soundHint.style.display = 'none';
        this.audioManager.initialize();
        this.gameState.setState(GameStates.ROTATING);
        
        await this.startLevel();
    }

    async startLevel() {
        this.updateUI();

        if (this.levelManager.getLevel() > 1) {
            this.gameState.setState(GameStates.ROTATING);
            this.showMessage('Rotation...');
            
            this.currentFaceIndex = (this.currentFaceIndex + 1) % 4;
            
            const currentRotY = this.renderer.targetRotation.y;
            await this.rotateCube(0, currentRotY - Math.PI / 2, 0);
        }
        
        const logicalInputs = Array.from({length: 9}, (_, i) => ({ id: i }));
        
        const currentLength = this.sequenceManager.getLength();
        if (currentLength === 0) {
            this.sequenceManager.generateNext(logicalInputs);
            this.sequenceManager.generateNext(logicalInputs);
            this.sequenceManager.generateNext(logicalInputs);
        } else {
            this.sequenceManager.generateNext(logicalInputs);
        }

        await this.showSequence();

        this.gameState.setState(GameStates.WAITING);
        this.showMessage('À vous de jouer !');
    }

    async nextLevel() {
        this.levelManager.nextLevel();
        await this.startLevel();
    }

    async showSequence() {
        this.gameState.setState(GameStates.SHOWING);
        
        await this.sleep(500);
        
        this.showMessage('Mémorisez la séquence...');

        const sequence = this.sequenceManager.getSequence();
        const delay = this.levelManager.getSequenceDelay();

        for (let i = 0; i < sequence.length; i++) {
            const logicalId = sequence[i];
            
            this.showMessage(`Mémorisez la séquence... (${i + 1}/${sequence.length})`);
            this.playNoteAndHighlight(logicalId);
            await this.sleep(delay);
        }

        await this.sleep(500);
    }

    async handleError() {
        this.gameState.setState(GameStates.GAME_OVER);
        this.audioManager.playError();
        this.showMessage('Perdu !', 'error');
        
        await this.sleep(500);
        
        this.restartButton.style.display = 'inline-block';
    }

    async handleSuccess() {
        this.gameState.setState(GameStates.SUCCESS);
        this.audioManager.playSuccess();
        this.showMessage('Bravo !', 'success');

        await this.sleep(1000);

        this.sequenceManager.switchPattern();
        await this.nextLevel();
    }

    async restartGame() {
        this.restartButton.style.display = 'none';
        
        this.levelManager.reset();
        this.sequenceManager.reset();
        this.cubeModel.resetVisuals();
        this.updateGeometry();
        
        this.currentFaceIndex = 0;
        await this.rotateCube(0, 0, 0);

        this.audioManager.initialize();
        await this.startLevel();
    }

    rotateCube(x, y, z) {
        return new Promise((resolve) => {
            this.renderer.rotateTo(x, y, z, resolve);
        });
    }

    updateGeometry() {
        const geometry = this.cubeModel.generateGeometry();
        this.renderer.updateGeometry(geometry);
    }

    showMessage(text, className = '') {
        this.messageDisplay.textContent = text;
        this.messageDisplay.className = className;
    }

    updateUI() {
        this.levelDisplay.textContent = `Niveau ${this.levelManager.getLevel()}`;
        this.scoreDisplay.textContent = `Score: ${this.levelManager.getScore()}`;
    }

    onStateChange(newState, oldState) {
        if (newState !== 'waiting') {
            this.canvas.style.cursor = 'default';
        }
    }

    handleResize() {
        const width = window.innerWidth * 0.9;
        const height = window.innerHeight * 0.7;
        this.renderer.resize(Math.min(width, 800), Math.min(height, 600));
    }

    startRenderLoop() {
        const render = (currentTime) => {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.renderer.render(deltaTime);

            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.audioManager.dispose();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new SimonSaysGame();
    
    window.addEventListener('beforeunload', () => {
        game.dispose();
    });
});
