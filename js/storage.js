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

export function loadData() {
    let data = {};
    try {
        const savedData = storage.getItem('wochenplanerData');
        if (savedData) {
            data = JSON.parse(savedData);
        }
    } catch (e) {
        console.error("Fehler beim Laden der Daten:", e);
        data = {}; // Reset to empty object on error
    }
    return data;
}
