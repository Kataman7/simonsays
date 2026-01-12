export const GameStates = {
    IDLE: 'idle',
    SHOWING: 'showing',
    WAITING: 'waiting',
    CHECKING: 'checking',
    ROTATING: 'rotating',
    SUCCESS: 'success',
    GAME_OVER: 'game_over'
};

export class GameState {
    constructor() {
        this.currentState = GameStates.IDLE;
        this.listeners = {};
    }

    setState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        this.notifyListeners(newState, oldState);
    }

    getState() {
        return this.currentState;
    }

    is(state) {
        return this.currentState === state;
    }

    canClick() {
        return this.currentState === GameStates.WAITING;
    }

    addListener(callback) {
        const id = Math.random().toString(36);
        this.listeners[id] = callback;
        return id;
    }

    removeListener(id) {
        delete this.listeners[id];
    }

    notifyListeners(newState, oldState) {
        Object.values(this.listeners).forEach(callback => {
            callback(newState, oldState);
        });
    }
}
