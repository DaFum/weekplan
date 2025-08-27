// Import necessary functions and data from other modules
import { getStartOfWeek, getISODate } from "./utils.js";
import { getState, updateState } from "./state.js";

/**
 * Toggles the app theme between 'dark' and 'light'.
 *
 * Reads the current theme from the global state and sets the opposite theme
 * using updateState({ theme: newTheme }).
 */
export function toggleTheme() {
    const state = getState();
    const newTheme = state.theme === "dark" ? "light" : "dark";
    updateState({ theme: newTheme });
}

/**
 * Sets the application theme: activates dark mode if `theme === 'dark'`, otherwise deactivates it.
 *
 * Adds or removes the `dark` CSS class to/from document.body and updates the theme icon.
 * @param {string} theme - Expects 'dark' to activate dark mode; any other value switches to light mode.
 */
export function updateTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark", isDark);
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
        toggle.setAttribute("aria-pressed", isDark);
    }
    updateThemeIcons(theme);
}

/**
 * Updates the theme icon in the DOM according to the given theme.
 *
 * Sets the text icon of the element with the ID "theme-icon" to "🌙" for 'dark',
 * otherwise to "🌞".
 *
 * @param {string} theme - Expects the theme name, e.g., 'dark' or 'light'.
 */
function updateThemeIcons(theme) {
    const isDark = theme === "dark";
    const el = document.getElementById("theme-icon");
    if (el) el.textContent = isDark ? "🌙" : "🌞";
}

/**
 * Updates the title and theme-meta color based on weekly progress.
 *
 * Determines the tasks and weekly goal from the global state, counts the tasks completed
 * within the current calendar week, and calculates a percentage (0–100, 0 if wochenZiel <= 0).
 * Then sets document.title to "<percent>% · Wochen-Power" and updates the meta tag with the
 * id "themeMeta" to green ('#10b981') at 100% or more, otherwise blue ('#0284c7').
 */
export function updateMetaBar(state) {
    const { tasks, wochenZiel } = state;
    const start = getStartOfWeek(new Date());
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const done = tasks.filter(t => t.erledigt && t.date >= getISODate(start) && t.date < getISODate(end)).length;
    const percent = wochenZiel > 0
      ? Math.max(0, Math.min(100, Math.round((done / wochenZiel) * 100)))
      : 0;
    document.title = `${percent}% · Wochen-Power`;
    const meta = document.getElementById("themeMeta");
    if (meta) meta.setAttribute("content", percent >= 100 ? "#10b981" : "#0284c7");
}
