// Import the weekdays array from the config file
import { wochentage } from "./config.js";

/**
 * Gets the ISO date string (YYYY-MM-DD) from a Date object.
 * @param {Date} date - The date to format.
 * @returns {string} The ISO date string.
 */
export const getISODate = (date) => date.toISOString().split("T")[0];

/**
 * Gets the start of the week for a given date.
 * @param {Date} date - The date to get the start of the week for.
 * @returns {Date} The date of the start of the week.
 */
export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
};

/**
 * Formats a date for display purposes.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string (e.g., "Montag, 01.01").
 */
export const formatDisplayDate = (date) => `${wochentage[date.getDay()]}, ${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;

/**
 * Adds a specified number of days to a date.
 * @param {Date} date - The date to add days to.
 * @param {number} days - The number of days to add.
 * @returns {Date} The new date.
 */
export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Formats a number of minutes into a string (e.g., "1 Std 30 Min").
 * @param {number} minutes - The number of minutes to format.
 * @returns {string} The formatted time string.
 */
export const formatMinutes = (minutes) => {
    const positiveMinutes = Math.max(0, minutes);
    const h = Math.floor(positiveMinutes / 60);
    const m = positiveMinutes % 60;
    return `${h} Std ${m} Min`;
};

/**
 * Creates a shuffled copy of an array using the Fisher-Yates algorithm.
 *
 * The passed array remains unchanged; a new, randomly permuted copy is returned.
 * Uses Math.random(), so the results are non-deterministic.
 *
 * @param {Array<any>} array - The array to be shuffled; elements of any type.
 * @returns {Array<any>} A new, shuffled array.
 */
export function shuffleArray(array) {
    if (!array || !Array.isArray(array)) {
        return [];
    }
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
    function debounced(...args) {
        const later = () => {
            timeout = null;
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    }
    debounced.cancel = () => { clearTimeout(timeout); timeout = null; };
    return debounced;
}
