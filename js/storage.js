// A wrapper for localStorage to handle potential errors
export const storage = {
    /**
     * Sets an item in localStorage.
     * @param {string} key - The key to set.
     * @param {string} value - The value to set.
     */
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage is not available, data will not be persisted.", e);
        }
    },
    /**
     * Gets an item from localStorage.
     * @param {string} key - The key to get.
     * @returns {string|null} The value of the item, or null if not found or an error occurs.
     */
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
 * Saves selected parts of the application state to persistent storage.
 *
 * This function saves the following fields from the `state` object under the key `'wochenplanerData'` as a JSON string:
 * `tasks`, `pcStundenGesamt`, `wochenZiel`, `theme`, `coins`.
 * If an error occurs during serialization or saving, the error is logged, but no exception is thrown.
 *
 * @param {Object} state - The application state, expected to have at least `tasks`, `pcStundenGesamt`, `wochenZiel`, `theme`, and `coins` fields.
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
        console.error("Error saving data:", e);
    }
}

/**
 * Loads persisted application data from local storage.
 *
 * This function attempts to read and parse the JSON string under the key 'wochenplanerData' from `storage`.
 * If successful, it returns the parsed object (expected fields: e.g., `tasks`, `pcStundenGesamt`, `wochenZiel`, `theme`, `coins`).
 * In case of missing data, JSON errors, or other errors, it returns an empty object and logs the error to the console.
 *
 * @returns {Object} The loaded data object or an empty object in case of an error or non-existent entry.
 */
export function loadData() {
    let data = {};
    try {
        const savedData = storage.getItem('wochenplanerData');
        if (savedData) {
            data = JSON.parse(savedData);
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
    
    // Ensure required properties exist with default values (both for success and error cases)
    data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
    data.pcStundenGesamt = typeof data.pcStundenGesamt === 'number' ? data.pcStundenGesamt : 0;
    data.wochenZiel = typeof data.wochenZiel === 'number' ? data.wochenZiel : 10;
    data.coins = typeof data.coins === 'number' ? data.coins : 0;
    
    return data;
}
