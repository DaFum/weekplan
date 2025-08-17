import { initEventListeners } from './events.js';
import { loadData, saveData } from './storage.js';
import { cleanupOldTasks } from './tasks.js';
import { renderAllUI, updateMotivationsspruch, scrollToCurrentDay } from './ui.js';
import { initGames } from './games.js';
import { updateMetaBar, updateTheme } from './theme.js';
import { updateState, subscribe } from './state.js';
import { initSounds } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
    const savedData = loadData();
    const theme = savedData.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

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

    // Subscribe to state changes
    subscribe(saveData);
    subscribe(state => {
        updateTheme(state.theme);
        renderAllUI(); // Re-render UI on state change
    });

    if (!localStorage.getItem('notifsAsked') && 'Notification' in window) {
        Notification.requestPermission().then(() => localStorage.setItem('notifsAsked', 1));
    }
});
