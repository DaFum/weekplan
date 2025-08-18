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

/**
 * Gibt eine flache Kopie des internen Zustands zurück.
 *
 * Liefert ein neues Objekt mit den aktuellen State-Feldern (shallow copy), damit Aufrufer den internen Zustand nicht direkt mutieren.
 * Änderungen am State müssen über die dafür vorgesehenen Funktionen vorgenommen werden.
 * @returns {Object} Eine flache Kopie des aktuellen State-Objekts.
 */
export function getState() {
    return { ...state };
}

/**
 * Aktualisiert den internen Zustand mit den angegebenen Eigenschaften und benachrichtigt alle Abonnenten.
 *
 * Führt eine flache Zusammenführung der übergebenen `newState`-Eigenschaften in das Modul-Scoped `state` durch
 * (vorhandene Felder werden überschrieben) und löst anschließend die Registrierungscallbacks aus.
 *
 * @param {Object} newState - Teilobjekt mit Zustandsfeldern, die hinzugefügt oder überschrieben werden sollen.
 */
export function updateState(newState) {
    Object.assign(state, newState);
    notifyListeners();
}

/**
 * Registriert einen Listener, der bei Zustandsänderungen benachrichtigt wird, und liefert eine Funktion zum Abbestellen.
 * @param {function(Object):void} listener - Callback, das die aktuelle (flache) Zustandkopie als Argument erhält.
 * @return {function():void} Funktion, die beim Aufruf die Registrierung des Listeners entfernt.
 */
export function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    };
}

/**
 * Benachrichtigt alle registrierten Listener synchron mit dem aktuellen State.
 *
 * Ruft jeden in der internen `listeners`-Liste gespeicherten Listener auf und übergibt ihm eine Kopie des aktuellen Zustands (via `getState()`).
 * Aufruf erfolgt synchron; Exceptions, die von einem Listener geworfen werden, werden nicht abgefangen und propagieren weiter.
 */
function notifyListeners() {
    for (const listener of listeners) {
        listener(getState());
    }
}
