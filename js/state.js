const state = {
    tasks: [],
    aktiveWoche: 0,
    pcStundenGesamt: 0,
    wochenZiel: 10,
    sounds: {},
    promptCallback: null,
    coins: 0,
    currentGame: null,
    theme: 'light'
};

const listeners = [];

export function getState() {
    return { ...state };
}

export function updateState(newState) {
    Object.assign(state, newState);
    notifyListeners();
}

export function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

function notifyListeners() {
    for (const listener of listeners) {
        listener(getState());
    }
}
