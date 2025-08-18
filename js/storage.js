export const storage = {
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage is not available, data will not be persisted.", e);
        }
    },
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage is not available, could not load data.", e);
            return null;
        }
    }
};

/**
 * Speichert ausgewählte Teile des übergebenen Anwendungszustands in den persistenten Speicher.
 *
 * Speichert die folgenden Felder von `state` unter dem Schlüssel `'wochenplanerData'` als JSON:
 * `tasks`, `pcStundenGesamt`, `wochenZiel`, `theme`, `coins`.
 * Bei Fehlern während der Serialisierung oder des Speichervorgangs wird der Fehler geloggt; es wird
 * keine Ausnahme weitergeworfen.
 *
 * @param {Object} state - Der Anwendungszustand; erwartet mindestens die Felder `tasks`, `pcStundenGesamt`, `wochenZiel`, `theme` und `coins`.
 */
const STORAGE_KEY = 'wochenplanerData';

export function saveData(state) {
    const dataToSave = {
        tasks: state.tasks,
        pcStundenGesamt: state.pcStundenGesamt,
        wochenZiel: state.wochenZiel,
        theme: state.theme,
        coins: state.coins
    };
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.error("Fehler beim Speichern der Daten:", e);
    }
}

/**
 * Lädt persistierte Anwendungsdaten aus dem lokalen Speicher.
 *
 * Versucht, den JSON-String unter dem Schlüssel 'wochenplanerData' aus dem `storage`
 * zu lesen und zu parsen. Bei Erfolg wird das geparste Objekt zurückgegeben
 * (erwartete Felder: z. B. `tasks`, `pcStundenGesamt`, `wochenZiel`, `theme`, `coins`).
 * Bei fehlenden Daten, JSON-Fehlern oder anderen Fehlern wird ein leeres Objekt
 * zurückgegeben und der Fehler in der Konsole protokolliert.
 *
 * @returns {Object} Das geladene Datenobjekt oder ein leeres Objekt bei Fehler/nicht vorhandenem Eintrag.
 */
export function loadData() {
    try {
        const savedData = storage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Ensure the parsed data is a non-null object
            if (parsedData && typeof parsedData === 'object') {
                return parsedData;
            }
        }
    } catch (e) {
        console.error("Fehler beim Laden der Daten:", e);
    }
    // Return an empty object if data is missing, malformed, or not an object
    return {};
}
