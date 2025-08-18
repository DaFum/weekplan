import { wochentage } from './config.js';

export const getISODate = (date) => date.toISOString().split('T')[0];

export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
};

export const formatDisplayDate = (date) => `${wochentage[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;

export const formatMinutes = (minutes) => {
    if (minutes < 0) minutes = 0;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} Std ${m} Min`;
};

/**
 * Mischt ein Array in-place mit dem Fisher–Yates-Algorithmus.
 *
 * Das übergebene Array wird zufällig permutiert (Mutation des Eingabe-Arrays). Verwendet Math.random(), liefert daher nicht-deterministische Ergebnisse.
 *
 * @param {Array<any>} array - Das zu mischende Array; Elemente beliebigen Typs.
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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
    return String(str).replace(/[&<>\"']/g, (ch) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

/**
 * Erzeugt einen Ripple-Effekt in einem Button.
 */
export function createRipple(button, event) {
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
        ripple.remove();
    }
    button.appendChild(circle);
}
