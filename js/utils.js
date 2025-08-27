import { wochentage } from "./config.js";

export const getISODate = (date) => date.toISOString().split("T")[0];

export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
};

export const formatDisplayDate = (date) => `${wochentage[date.getDay()]}, ${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;

export const formatMinutes = (minutes) => {
    if (minutes < 0) minutes = 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} Std ${m} Min`;
};

/**
 * Erstellt eine gemischte Kopie eines Arrays mit dem Fisher–Yates-Algorithmus.
 *
 * Das übergebene Array bleibt unverändert; es wird eine neue, zufällig permutierte Kopie zurückgegeben. Verwendet Math.random(), liefert daher nicht-deterministische Ergebnisse.
 *
 * @param {Array<any>} array - Das zu mischende Array; Elemente beliebigen Typs.
 * @returns {Array<any>} Ein neues, gemischtes Array.
 */
export function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Escapiert spezielle Zeichen in einer Eingabe für sichere Einbettung in HTML.
 *
 * Wandelt den übergebenen Wert in einen String und ersetzt die Zeichen
 * &, <, >, " und ' durch ihre HTML-Entities (&amp;, &lt;, &gt;, &quot;, &#39;).
 *
 * @param {any} str - Beliebiger Wert; wird per String() in einen String konvertiert.
 * @returns {string} Der HTML-escaped String.
 */
export function escapeHTML(str) {
    const s = String(str);
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    return s.replace(/[&<>"']/g, ch => map[ch]);
}

/**
 * Returns a debounced version of the given function that delays its invocation until after
 * wait milliseconds have elapsed since the last time it was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} The debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            timeout = null;
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
