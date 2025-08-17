import { getStartOfWeek, getISODate } from './utils.js';
import { getState, updateState } from './state.js';

export function toggleTheme() {
    const state = getState();
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    updateState({ theme: newTheme });
}

export function updateTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    updateThemeIcons(theme);
}

function updateThemeIcons(theme) {
    const isDark = theme === 'dark';
    document.getElementById('theme-icon').textContent = isDark ? '🌙' : '🌞';
}

export function updateMetaBar() {
    const state = getState();
    const { tasks, wochenZiel } = state;
    const start = getStartOfWeek(new Date());
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const done = tasks.filter(t => t.erledigt && t.date >= getISODate(start) && t.date < getISODate(end)).length;
    const percent = wochenZiel > 0
      ? Math.max(0, Math.min(100, Math.round((done / wochenZiel) * 100)))
      : 0;
    document.title = `${percent}% · Wochen-Power`;
    document.getElementById('themeMeta').setAttribute('content', percent >= 100 ? '#10b981' : '#0284c7');
}
