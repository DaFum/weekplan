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
export function saveData(state) {
    const dataToSave = {
        tasks: state.tasks,
        pcStundenGesamt: state.pcStundenGesamt,
        wochenZiel: state.wochenZiel,
        theme: state.theme,
        coins: state.coins
    };
    try {
        storage.setItem('wochenplanerData', JSON.stringify(dataToSave));
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
    let data = {};
    try {
        const savedData = storage.getItem('wochenplanerData');
        if (savedData) {
            data = JSON.parse(savedData);
            // Ensure required properties exist with default values
            data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
            data.pcStundenGesamt = typeof data.pcStundenGesamt === 'number' ? data.pcStundenGesamt : 0;
            data.wochenZiel = typeof data.wochenZiel === 'number' ? data.wochenZiel : 10;
            data.coins = typeof data.coins === 'number' ? data.coins : 0;
        }
    } catch (e) {
        console.error("Fehler beim Laden der Daten:", e);
        data = {}; // Reset to empty object on error
    }
    return data;
}
