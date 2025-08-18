import { getStartOfWeek, getISODate } from './utils.js';
import { getState, updateState } from './state.js';

/**
 * Schaltet das App-Theme zwischen 'dark' und 'light'.
 *
 * Liest das aktuelle Theme aus dem globalen Zustand und setzt das entgegengesetzte Theme
 * mittels updateState({ theme: newTheme }).
 */
export function toggleTheme() {
    const state = getState();
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    updateState({ theme: newTheme });
}

/**
 * Setzt das Anwendungs-Theme: aktiviert den Dark-Mode, wenn `theme === 'dark'`, sonst deaktiviert er ihn.
 *
 * Fügt die CSS-Klasse `dark` an document.body hinzu (bei Dark-Mode) bzw. entfernt sie und aktualisiert das Theme-Icon.
 * @param {string} theme - Erwartet `'dark'` zum Aktivieren des Dark-Modes; jeder andere Wert schaltet in den Light-Mode.
 */
export function updateTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    updateThemeIcons(theme);
}

/**
 * Aktualisiert das Theme-Icon im DOM entsprechend des übergebenen Themes.
 *
 * Setzt das Text-Icon des Elements mit der ID "theme-icon" auf "🌙" für `dark`,
 * andernfalls auf "🌞".
 *
 * @param {string} theme - Erwartet den Theme-Namen, z. B. `'dark'` oder `'light'`.
 */
function updateThemeIcons(theme) {
    const isDark = theme === 'dark';
    const iconEl = document.getElementById('theme-icon');
    if (iconEl) iconEl.textContent = isDark ? '🌙' : '🌞';
}

/**
 * Aktualisiert Titel und Theme-Meta-Farbe basierend auf dem Wochenfortschritt.
 *
 * Ermittelt aus dem globalen Zustand die Aufgaben und das Wochenziel, zählt die innerhalb der aktuellen Kalenderwoche erledigten Aufgaben und berechnet daraus einen Prozentwert (0–100, 0 falls wochenZiel <= 0). Setzt anschließend document.title auf "<percent>% · Wochen-Power" und aktualisiert das Meta-Tag mit der id "themeMeta" auf Grün ('#10b981') bei 100% oder mehr, sonst Blau ('#0284c7').
 */
export function updateMetaBar() {
    const state = getState();
    const { tasks, wochenZiel } = state;
    const start = getStartOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const startISO = getISODate(start);
    const endISO = getISODate(end);
    const done = tasks.filter(t => t.erledigt && t.date >= startISO && t.date < endISO).length;
    const percent = wochenZiel > 0
      ? Math.max(0, Math.min(100, Math.round((done / wochenZiel) * 100)))
      : 0;
    document.title = `${percent}% · Wochen-Power`;
    const meta = document.getElementById('themeMeta');
    if (meta) meta.setAttribute('content', percent >= 100 ? '#10b981' : '#0284c7');
}
