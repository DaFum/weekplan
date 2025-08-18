import { initEventListeners } from './events.js';
import { loadData, saveData } from './storage.js';
import { cleanupOldTasks } from './tasks.js';
import { renderAllUI, updateMotivationsspruch, scrollToCurrentDay } from './ui.js';
import { initGames } from './games.js';
import { updateTheme } from './theme.js';
import { updateState, subscribe, getState } from './state.js';
import { initSounds } from './audio.js';
import { getStartOfWeek, getISODate } from './utils.js';

/**
 * Main application initialization function.
 * This function is called when the DOM is fully loaded.
 */
function initApp() {
    // 1. Load and sanitize data
    let savedData = loadData();
    const initialState = {
        tasks: Array.isArray(savedData.tasks) ? savedData.tasks : [],
        pcStundenGesamt: Number.isFinite(savedData.pcStundenGesamt) ? savedData.pcStundenGesamt : 0,
        wochenZiel: Number.isFinite(savedData.wochenZiel) ? savedData.wochenZiel : 10,
        coins: Number.isFinite(savedData.coins) ? savedData.coins : 0,
        aktiveWoche: Number.isFinite(savedData.aktiveWoche) ? savedData.aktiveWoche : 0,
        theme: savedData.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    };

    // 2. Determine the active week based on the current date
    const startOfCurrentWeek = getStartOfWeek(new Date());
    const todayISO = getISODate(new Date());
    let foundActiveWeek = false;
    for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startOfCurrentWeek);
            currentDate.setDate(currentDate.getDate() + week * 7 + day);
            if (getISODate(currentDate) === todayISO) {
                initialState.aktiveWoche = week;
                foundActiveWeek = true;
                break;
            }
        }
        if (foundActiveWeek) break;
    }

    // 3. Set the initial state of the application
    updateState(initialState);

    // 4. Initialize all modules and subsystems
    initEventListeners();
    initSounds();
    initGames();

    // 5. Perform initial cleanup and UI rendering
    cleanupOldTasks();
    renderAllUI();
    updateMotivationsspruch();
    scrollToCurrentDay();

    // 6. Subscribe to state changes for persistence and UI updates
    subscribe(saveData);
    subscribe(state => {
        updateTheme(state.theme);
        renderAllUI();
    });
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);
