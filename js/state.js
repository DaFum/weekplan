// The initial state of the application
let state = {
    tasks: [], // Array of tasks
    aktiveWoche: 0, // The currently active week
    pcStundenGesamt: 0, // Total PC hours
    wochenZiel: 10, // Weekly goal
    sounds: {}, // Sound objects
    promptCallback: null, // Callback for the prompt modal
    coins: 0, // Number of coins
    currentGame: null, // The currently active game
    theme: "light", // The current theme
    audioInitialized: false,

    // Game state
    memory: {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        score: 0,
        matchedSymbols: [],
        checkMatchTimeoutId: null
    },
    quiz: {
        currentQuestion: 0,
        score: 0,
        questions: []
    }
};

// Array to store listeners for state changes
const listeners = [];
let nextListenerId = 0;

/**
 * Returns a copy of the current state.
 * @returns {Object} The current state.
 */
export function getState() {
    return { ...state };
}

/**
 * Updates the internal state and notifies subscribers whose subscribed state parts have changed.
 * @param {Object} newState - An object with the keys to be updated.
 */
export function updateState(newState) {
    const oldState = { ...state };
    state = { ...state, ...newState };
    notifyListeners(newState, oldState);
}

/**
 * Registers a listener for changes to a specific part of the state.
 * @param {string|null} key - The key in the state to listen to. If null, the listener is called on any change.
 * @param {function(Object):void} callback - The function to be called on change.
 * @returns {function():void} A function to unsubscribe.
 */
export function subscribe(key, callback) {
    const id = nextListenerId++;
    listeners.push({ id, key, callback });
    return () => {
        const index = listeners.findIndex(l => l.id === id);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * Notifies listeners whose subscribed data has changed.
 * @param {Object} newState - The object with the new state values.
 * @param {Object} oldState - The object with the old state values.
 */
function notifyListeners(newState, oldState) {
    // Determine which keys have changed
    const changedKeys = Object.keys(newState).filter(key => newState[key] !== oldState[key]);

    if (changedKeys.length === 0) return;

    listeners.forEach(({ key, callback }) => {
        // Notify global listeners (key === null) or listeners for changed keys
        if (key === null || changedKeys.includes(key)) {
            try {
                callback(state);
            } catch (e) {
                console.error(`Error in listener for key "${key}":`, e);
            }
        }
    });
}
