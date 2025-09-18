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
    theme: "sky", // The current theme
    audioInitialized: false,
    audioInitializing: false,

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
// js/state.js

/**
 * Deep-clones only the JSON-serializable parts of `obj` while
 * preserving any non-cloneable fields (e.g. functions, Tone objects).
 */
function safeDeepClone(obj) {
    // Extract known non-cloneable fields to reattach later.
    const { sounds, promptCallback, ...jsonPart } = obj;

    // Attempt #1: structuredClone
    if (typeof structuredClone === 'function') {
        try {
            const cloned = structuredClone(jsonPart);
            return { ...cloned, sounds, promptCallback };
        } catch (_) {
            // structuredClone failed (e.g. nested uncloneables), fall through
        }
    }

    // Attempt #2: JSON
    try {
        const cloned = JSON.parse(JSON.stringify(jsonPart));
        return { ...cloned, sounds, promptCallback };
    } catch (_) {
        // JSON fallback failed too, last resort: shallow copy of entire state
        return { ...obj };
    }
}

/**
 * Returns a deep copy of the application state for safe reads.
 * Non-serializable parts of the state (sounds, callbacks) are
 * preserved by reference to avoid runtime cloning errors.
 */
export function getState() {
    return safeDeepClone(state);
}

/**
 * Updates the internal state and notifies subscribers whose subscribed state parts have changed.
 * @param {Object} newState - An object with the keys to be updated.
 */
const FORBIDDEN_STATE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function sanitizeStateUpdate(partial) {
    if (!partial || typeof partial !== "object") {
        return {};
    }

    const safeUpdate = Object.create(null);
    for (const [key, value] of Object.entries(partial)) {
        if (typeof key !== "string" || FORBIDDEN_STATE_KEYS.has(key)) {
            continue;
        }
        safeUpdate[key] = value;
    }
    return safeUpdate;
}

export function updateState(newState) {
    const safeNewState = sanitizeStateUpdate(newState);
    if (Object.keys(safeNewState).length === 0) {
        return;
    }

    const oldState = { ...state };
    state = { ...state, ...safeNewState };
    notifyListeners(safeNewState, oldState);
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
    const changedKeys = Object.entries(newState)
        .filter(([key, value]) => value !== oldState[key])
        .map(([key]) => key);

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
