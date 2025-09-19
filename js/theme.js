// Import necessary functions and data from other modules
import { getStartOfWeek, getISODate } from './utils.js';
import { updateState } from './state.js';

export const THEME_OPTIONS = [
  { id: 'sky', label: 'Sky', icon: '🌤️' },
  { id: 'dark', label: 'Dark Mode', icon: '🌙' },
  { id: 'pastel', label: 'Pastell', icon: '🧁' },
  { id: 'neon', label: 'Neon', icon: '🎉' },
  { id: 'forest', label: 'Forest', icon: '🌲' },
];

const FALLBACK_THEME = 'sky';

function normalizeTheme(theme) {
  if (theme === 'light') return 'sky'; // backwards compatibility for persisted data
  const availableIds = new Set(THEME_OPTIONS.map((option) => option.id));
  return availableIds.has(theme) ? theme : FALLBACK_THEME;
}

function getThemeDetails(theme) {
  const normalized = normalizeTheme(theme);
  return (
    THEME_OPTIONS.find((option) => option.id === normalized) ?? THEME_OPTIONS[0]
  );
}

/**
 * Sets the theme to the given id if it exists, otherwise falls back to the default theme.
 * @param {string} themeId
 */
export function selectTheme(themeId) {
  const normalized = normalizeTheme(themeId);
  updateState({ theme: normalized });
}

/**
 * Sets the application theme: activates dark mode if `theme === 'dark'`, otherwise deactivates it.
 *
 * Adds or removes the `dark` CSS class to/from document.body and updates the theme icon.
 * @param {string} theme - Expects 'dark' to activate dark mode; any other value switches to light mode.
 */
export function updateTheme(theme) {
  const normalized = normalizeTheme(theme);
  const body = document.body;

  // Remove existing theme classes before applying the new one
  Array.from(body.classList).forEach((cls) => {
    if (cls.startsWith('theme-')) {
      body.classList.remove(cls);
    }
  });

  body.classList.add(`theme-${normalized}`);
  body.classList.toggle('dark', normalized === 'dark');

  updateThemeButton(normalized);
  updateThemeMenu(normalized);
}

/**
 * Updates the theme icon and accessible name in the header button.
 * @param {string} theme
 */
function updateThemeButton(theme) {
  const details = getThemeDetails(theme);
  const iconEl = document.getElementById('theme-icon');
  if (iconEl) {
    iconEl.textContent = details.icon;
  }

  const labelEl = document.getElementById('theme-name');
  if (labelEl) {
    labelEl.textContent = details.label;
  }

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', `Design ändern (${details.label})`);
    toggle.setAttribute('aria-expanded', String(isThemeMenuOpen()));
  }
}

/**
 * Highlights the active theme within the theme menu when it is rendered.
 * @param {string} theme
 */
function updateThemeMenu(theme) {
  const normalized = normalizeTheme(theme);
  document.querySelectorAll('.theme-option').forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const datasetTheme =
      typeof button.dataset.theme === 'string' ? button.dataset.theme : '';
    const isActive = datasetTheme === normalized;
    if (isActive) {
      button.classList.add('active');
      button.setAttribute('aria-checked', 'true');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-checked', 'false');
    }
  });
}

export function isThemeMenuOpen() {
  const menu = document.getElementById('theme-menu');
  return menu ? !menu.classList.contains('hidden') : false;
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
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const done = tasks.filter((task) => {
    const isoDate = task?.date;
    return (
      task?.erledigt &&
      typeof isoDate === 'string' &&
      isoDate >= getISODate(start) &&
      isoDate < getISODate(end)
    );
  }).length;
  const percent =
    wochenZiel > 0
      ? Math.max(0, Math.min(100, Math.round((done / wochenZiel) * 100)))
      : 0;
  document.title = `${percent}% · Wochen-Power`;
  const meta = document.getElementById('themeMeta');
  if (meta)
    meta.setAttribute('content', percent >= 100 ? '#10b981' : '#0284c7');
}
