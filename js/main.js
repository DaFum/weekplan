// Import modules
import { initEventListeners } from "./events.js";
import { loadData, saveData } from "./storage.js";
import { cleanupOldTasks } from "./tasks.js";
import { renderAllUI, updateMotivationsspruch, scrollToCurrentDay, updateTasksUI, updateTimeTracker, updateWeeklyGoalTracker, updateCoinsDisplay } from "./ui.js";
import { initGames } from "./games.js";
import { updateTheme, updateMetaBar } from "./theme.js";
import { updateState, subscribe } from "./state.js";
import { initSounds } from "./audio.js";
import { debounce } from "./utils.js";

/**
 * Main entry point of the application.
 * This function is executed when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Load saved data from storage
    const savedData = loadData();
    // Determine the theme based on saved data or system preference
    const theme = savedData.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    // Update the application state with loaded data and theme
    updateState({
        ...savedData,
        theme,
        aktiveWoche: 0
    });

    // Apply the determined theme immediately
    updateTheme(theme);

    // Initialize Audio früh, Listener nach dem ersten Render (Form-Handler brauchen DOM)
    initSounds();

    // Perform the initial render of the UI
    renderAllUI();
    updateMotivationsspruch();
    scrollToCurrentDay();

    // Jetzt, da DOM steht, Events binden
    initEventListeners();

    // Initialize games
    initGames();

    // Create a debounced version of the saveData function for performance
    const debouncedSaveData = debounce(saveData, 300);

    // Subscribe to state changes for persistence and specific UI updates
    subscribe("theme", state => {
        updateTheme(state.theme);
        saveData(state);
    });

    subscribe("tasks", state => {
        updateTasksUI(state);
        updateMetaBar(state);
        debouncedSaveData(state);
    });

    subscribe("pcStundenGesamt", state => {
        updateTimeTracker(state);
        saveData(state);
    });

    subscribe("wochenZiel", state => {
        updateWeeklyGoalTracker(state);
        updateMetaBar(state);
        saveData(state);
    });

    subscribe("coins", state => {
        updateCoinsDisplay(state);
        saveData(state);
    });

    // Clean up old tasks after subscriptions are registered to ensure persistence
    cleanupOldTasks();

    // Request notification permission if not already asked
    if (!localStorage.getItem("notifsAsked") && "Notification" in window) {
        Notification.requestPermission().then(() => localStorage.setItem("notifsAsked", 1));
    }
});
