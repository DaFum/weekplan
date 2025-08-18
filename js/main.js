import { initEventListeners } from "./events.js";
import { loadData, saveData } from "./storage.js";
import { cleanupOldTasks } from "./tasks.js";
import { renderAllUI, updateMotivationsspruch, scrollToCurrentDay, updateTasksUI, updateTimeTracker, updateWeeklyGoalTracker, updateCoinsDisplay } from "./ui.js";
import { initGames } from "./games.js";
import { updateTheme, updateMetaBar } from "./theme.js";
import { updateState, subscribe } from "./state.js";
import { initSounds } from "./audio.js";

document.addEventListener("DOMContentLoaded", () => {
    const savedData = loadData();
    const theme = savedData.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    updateState({
        ...savedData,
        theme
    });

    initEventListeners();
    initSounds();
    cleanupOldTasks();

    // Initial render
    renderAllUI();
    updateMotivationsspruch();
    scrollToCurrentDay();

    initGames();

    // Subscribe to state changes for persistence and specific UI updates
    subscribe("theme", state => {
        updateTheme(state.theme);
        saveData(state);
    });

    subscribe("tasks", state => {
        updateTasksUI(state);
        updateMetaBar(state);
    // Debounce saveData for frequent task updates
    const debouncedSaveData = debounce(saveData, 300);
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


    if (!localStorage.getItem("notifsAsked") && "Notification" in window) {
        Notification.requestPermission().then(() => localStorage.setItem("notifsAsked", 1));
    }
});
