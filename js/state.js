let state = {
    tasks: [],
    aktiveWoche: 0,
    pcStundenGesamt: 0,
    wochenZiel: 10,
    sounds: {},
    promptCallback: null,
    coins: 0,
    currentGame: null,
    theme: "light",

    // Game state
    memory: {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        score: 0,
        matchedSymbols: []
    },
    quiz: {
        currentQuestion: 0,
        score: 0,
        questions: []
    }
};

const listeners = [];
let nextListenerId = 0;

export function getState() {
    return { ...state };
}

/**
 * Aktualisiert den internen Zustand und benachrichtigt gezielt die Abonnenten, deren
 * abonnierte State-Teile sich geändert haben.
 *
 * @param {Object} newState - Ein Objekt mit den zu aktualisierenden Schlüsseln.
 */
export function updateState(newState) {
    const oldState = { ...state };
    state = { ...state, ...newState };
    notifyListeners(newState, oldState);
}

/**
 * Registriert einen Listener für Änderungen an einem bestimmten Teil des States.
 *
 * @param {string|null} key - Der Schlüssel im State, auf den gehört werden soll. Wenn null, wird der Listener bei jeder Änderung aufgerufen.
 * @param {function(Object):void} callback - Die Funktion, die bei Änderungen aufgerufen wird.
 * @returns {function():void} Eine Funktion, um das Abonnement zu beenden.
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
 * Benachrichtigt die Listener, deren abonnierte Daten sich geändert haben.
 *
 * @param {Object} newState - Das Objekt mit den neuen State-Werten.
 */
function notifyListeners(newState, oldState) {
    const changedKeys = Object.keys(newState).filter(key => JSON.stringify(newState[key]) !== JSON.stringify(oldState[key]));

    if (changedKeys.length === 0) return;

    listeners.forEach(({ key, callback }) => {
        // Globale Listener (key === null) oder Listener für geänderte Schlüssel benachrichtigen
        if (key === null || changedKeys.includes(key)) {
            try {
                callback(state);
            } catch (e) {
                console.error(`Fehler im Listener für key "${key}":`, e);
            }
        }
    });
}
