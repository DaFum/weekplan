// Import modules
import { initEventListeners } from './events.js';
import { loadData, saveData } from './storage.js';
import { cleanupOldTasks } from './tasks.js';
import {
  renderAllUI,
  updateMotivationsspruch,
  scrollToCurrentDay,
  updateTasksUI,
  updateTimeTracker,
  updateWeeklyGoalTracker,
  updateCoinsDisplay,
} from './ui.js';
import { initGames } from './games.js';
import { updateTheme, updateMetaBar } from './theme.js';
import { updateState, subscribe } from './state.js';
import { initSounds } from './audio.js';
import { debounce } from './utils.js';

/**
 * Loads persisted data and normalises the initial application state.
 * @returns {string} The theme that should be applied immediately.
 */
function hydrateState() {
  const savedData = loadData();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const knownThemes = new Set([
    'sky',
    'dark',
    'pastel',
    'neon',
    'forest',
    'light',
  ]);
  let theme = knownThemes.has(savedData.theme) ? savedData.theme : null;
  if (!theme) {
    theme = prefersDark ? 'dark' : 'sky';
  }

  updateState({
    ...savedData,
    theme: theme === 'light' ? 'sky' : theme,
    aktiveWoche: 0,
  });

  return theme === 'light' ? 'sky' : theme;
}

/**
 * Renders the initial UI and prepares components that require the DOM.
 * @param {string} theme - Theme that should be applied before rendering.
 */
function initializeUI(theme) {
  updateTheme(theme);
  initSounds();
  renderAllUI();
  updateMotivationsspruch();
  scrollToCurrentDay();
}

/**
 * Wires up global event handlers and interactive components.
 */
function initializeInteractions() {
  initEventListeners();
  initGames();
}

/**
 * Registers state subscriptions for UI updates and persistence.
 */
function registerStateSubscriptions() {
  const debouncedSaveData = debounce(saveData, 300);

  subscribe('theme', (state) => {
    updateTheme(state.theme);
    saveData(state);
  });

  subscribe('tasks', (state) => {
    updateTasksUI(state);
    updateMetaBar(state);
    debouncedSaveData(state);
  });

  subscribe('pcStundenGesamt', (state) => {
    updateTimeTracker(state);
    saveData(state);
  });

  subscribe('wochenZiel', (state) => {
    updateWeeklyGoalTracker(state);
    updateMetaBar(state);
    saveData(state);
  });

  subscribe('coins', (state) => {
    updateCoinsDisplay(state);
    saveData(state);
  });
}

/**
 * Requests notification permission once per installation if supported.
 */
function requestNotificationPermission() {
  if (!localStorage.getItem('notifsAsked') && 'Notification' in window) {
    Notification.requestPermission().then(() =>
      localStorage.setItem('notifsAsked', '1')
    );
  }
}

/**
 * Bootstraps the entire application.
 */
function bootstrapApp() {
  const theme = hydrateState();
  initializeUI(theme);
  initializeInteractions();
  registerStateSubscriptions();
  cleanupOldTasks();
  requestNotificationPermission();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp, { once: true });
} else {
  bootstrapApp();
}
