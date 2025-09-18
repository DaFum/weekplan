// Import necessary functions and data from other modules
import { getState, updateState } from "./state.js";
import { addCoins } from "./games.js";
import { starteKonfetti } from "./effects.js";
import { closeModal, openPromptModal } from "./modal.js";
import { formatDisplayDate, getISODate, getStartOfWeek, parseLocalISODate } from "./utils.js";

const TASK_NAME_MAX_LENGTH = 100;
const TASK_NAME_ERROR_MESSAGE = "Aufgabenname muss zwischen 1 und 100 Zeichen lang sein.";
const ALLOWED_TASK_FIELDS = new Set([
    "id",
    "name",
    "kategorie",
    "date",
    "durationInMinutes",
    "erledigt"
]);

/**
 * Gets the number of completed tasks for a specific day.
 * @param {string} isoDate - The ISO date string for the day.
 * @param {Array} tasks - The array of tasks.
 * @returns {number} The number of completed tasks for the given day.
 */
export function getPunkteFuerTag(isoDate, tasks) {
    if (!isoDate) return 0;

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return safeTasks.filter(task => (
        task &&
        typeof task === "object" &&
        task.date === isoDate &&
        Boolean(task.erledigt)
    )).length;
}

/**
 * Calculates the current streak of consecutive days with completed tasks.
 * @param {Array} tasks - The array of tasks.
 * @returns {number} The current streak in days.
 */
export function getCurrentStreak(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) return 0;

    const erledigteTage = new Set(
        tasks
            .filter(task => task && typeof task === "object" && task.erledigt && typeof task.date === "string" && task.date)
            .map(task => task.date)
    );
    if (erledigteTage.size === 0) return 0;

    // Lokale Mitternacht verwenden, damit getISODate (lokal) konsistent ist
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    let streak = 0;

    // If no tasks completed today, check if yesterday had completed tasks
    const today = getISODate(cursor);
    if (!erledigteTage.has(today)) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (erledigteTage.has(getISODate(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

/**
 * Saves a task form: creates a new task or updates an existing one.
 *
 * Reads the form fields (task-id, kategorie, task-name, task-date, and task-duration - the latter only for
 * kategorie === 'pc'), builds a task object, and writes it to the global state.
 * - With a task-id: updates the found task (retaining existing fields).
 * - Without a task-id: creates a new task with id `'task-' + Date.now()` and `erledigt: false`.
 * If notification permission is granted, a browser notification with the formatted date is displayed for newly created tasks.
 * After saving, the UI is re-rendered, and the modal is closed.
 *
 * @param {Event} event - The submit event of the form (preventDefault() is called).
 */
export function saveTask(event) {
    event.preventDefault();

    const { idInput, nameInput, dateInput, durationInput, errorEl } = getTaskFormElements();
    if (!nameInput || !dateInput) return;

    const kategorie = getSelectedCategory();
    if (!kategorie) return;

    const sanitizedName = validateTaskName(nameInput, errorEl);
    if (!sanitizedName) return;

    const dateValue = dateInput.value;
    if (!dateValue) return;

    const taskData = {
        name: sanitizedName,
        kategorie,
        date: dateValue,
        durationInMinutes: parseDurationValue(kategorie, durationInput)
    };

    const taskId = idInput?.value?.trim();
    if (taskId) {
        updateExistingTask(taskId, taskData);
    } else {
        createTask(taskData);
    }

    closeModal();
}

/**
 * Toggles the completion status of a task.
 *
 * If the task changes from open to completed, a completion sound is played,
 * confetti is started, and 5 coins are credited. Updates the global state
 * with the modified task list.
 *
 * @param {string} taskId - The ID of the task whose status is to be toggled.
 */
export function toggleTask(taskId) {
    const { tasks, sounds } = getState();
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const newTasks = safeTasks.map(task => {
        if (!task || typeof task !== "object") {
            return task;
        }

        if (task.id === taskId) {
            const wasErledigt = task.erledigt;
            const newErledigt = !wasErledigt;
            if (newErledigt) {
                // Guard against uninitialized sounds or complete before calling
                if (
                    sounds &&
                    sounds.complete &&
                    typeof sounds.complete.triggerAttackRelease === "function"
                ) {
                    sounds.complete.triggerAttackRelease("C4", "0.2");
                } else {
                    console.warn("Completion sound is not properly initialized.");
                }
                starteKonfetti();
                addCoins(5);
            }
            return { ...task, erledigt: newErledigt };
        }
        return task;
    });
    updateState({ tasks: newTasks });
}

/**
 * Removes a task from the application state by its ID.
 *
 * Updates the state so that the task with the specified `taskId` is removed from `tasks`.
 *
 * @param {string} taskId - The ID of the task to be deleted.
 */
export function deleteTask(taskId) {
    const { tasks } = getState();
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    updateState({ tasks: safeTasks.filter(task => task && task.id !== taskId) });
}

/**
 * Removes tasks stored in the state whose date is before the start of the current week.
 *
 * Calculates the ISO date string for the start of the current week and updates the global
 * state so that only tasks with a set `date` field and a date greater than or equal to this
 * start date are retained. Tasks without a `date` are also removed.
 */
export function cleanupOldTasks() {
    const { tasks } = getState();
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const start = getStartOfWeek(new Date());
    // Lokales YYYY-MM-DD ableiten (ohne UTC-Verschiebung)
    const startOfCurrentWeekISO = getISODate(start);
    updateState({
        tasks: safeTasks.filter(task => (
            task &&
            typeof task.date === "string" &&
            task.date >= startOfCurrentWeekISO
        ))
    });
}

/**
 * Opens a modal to set the PC time limit (in hours) for the week.
 *
 * Calls `openPromptModal` to ask the user for the number of hours.
 * The current value is read from the state (`pcStundenGesamt`). After input,
 * the state is updated with the new value.
 */
export function setPcTimeLimit() {
    const { pcStundenGesamt } = getState();
    openPromptModal(
        "PC-Zeitlimit festlegen",
        "Wie viele Stunden PC-Zeit pro Woche?",
        pcStundenGesamt,
        (value) => {
            const n = Number(value);
            if (Number.isFinite(n) && n >= 0) {
                updateState({ pcStundenGesamt: n });
            }
        },
        { step: 0.5 }
    );
}

/**
 * Opens a modal to set the weekly goal (number of tasks).
 *
 * Calls `openPromptModal` to ask the user for the number of tasks to be completed.
 * The current value is read from the state (`wochenZiel`). After input,
 * the state is updated with the new value.
 */
export function setWeeklyGoal() {
    const { wochenZiel } = getState();
    openPromptModal(
        "Wochenziel festlegen",
        "Wie viele Aufgaben pro Woche?",
        wochenZiel,
        (value) => {
            const n = parseInt(value, 10);
            if (Number.isFinite(n) && n >= 0) {
                updateState({ wochenZiel: n });
            }
        },
        { step: 1 }
    );
}

function getTaskFormElements() {
    const idInput = document.getElementById("task-id");
    const nameInput = document.getElementById("task-name");
    const dateInput = document.getElementById("task-date");
    const durationInput = document.getElementById("task-duration");
    const errorEl = document.getElementById("task-name-error");

    return {
        idInput: idInput instanceof HTMLInputElement ? idInput : null,
        nameInput: nameInput instanceof HTMLInputElement ? nameInput : null,
        dateInput: dateInput instanceof HTMLInputElement ? dateInput : null,
        durationInput: durationInput instanceof HTMLInputElement ? durationInput : null,
        errorEl: errorEl instanceof HTMLElement ? errorEl : null
    };
}

function getSelectedCategory() {
    const selected = document.querySelector('input[name="kategorie"]:checked');
    return selected instanceof HTMLInputElement ? selected.value : null;
}

function validateTaskName(nameInput, errorEl) {
    const value = nameInput.value.trim();
    const isValid = value.length > 0 && value.length <= TASK_NAME_MAX_LENGTH;

    if (!isValid) {
        if (errorEl) errorEl.textContent = TASK_NAME_ERROR_MESSAGE;
        nameInput.setAttribute("aria-invalid", "true");
        return null;
    }

    if (errorEl) errorEl.textContent = "";
    nameInput.removeAttribute("aria-invalid");
    return value;
}

function parseDurationValue(kategorie, durationInput) {
    if (kategorie !== "pc" || !(durationInput instanceof HTMLInputElement)) {
        return 0;
    }

    const parsed = Number.parseInt(durationInput.value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function sanitizeTaskData(taskData) {
    if (!taskData || typeof taskData !== "object") {
        return {};
    }

    const sanitized = Object.create(null);
    for (const [key, value] of Object.entries(taskData)) {
        if (!ALLOWED_TASK_FIELDS.has(key)) {
            continue;
        }
        sanitized[key] = value;
    }
    return sanitized;
}

function updateExistingTask(taskId, taskData) {
    const { tasks } = getState();
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const taskIndex = safeTasks.findIndex(task => task && task.id === taskId);

    if (taskIndex === -1) {
        console.warn(`saveTask: taskId "${taskId}" nicht gefunden.`);
        return;
    }

    const newTasks = [...safeTasks];
    const sanitizedUpdate = sanitizeTaskData(taskData);
    newTasks[taskIndex] = { ...safeTasks[taskIndex], ...sanitizedUpdate };
    updateState({ tasks: newTasks });
}

function createTask(taskData) {
    const { tasks } = getState();
    const safeTasks = Array.isArray(tasks) ? tasks.filter(task => task && typeof task === "object") : [];
    const sanitizedTaskData = sanitizeTaskData(taskData);
    const newTask = { ...sanitizedTaskData, id: `task-${Date.now()}`, erledigt: false };
    updateState({ tasks: [...safeTasks, newTask] });
    notifyAboutNewTask(newTask);
}

function notifyAboutNewTask(task) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
        return;
    }

    try {
        const date = task.date ? parseLocalISODate(task.date) : null;
        const bodyText = date && !Number.isNaN(date.valueOf())
            ? `Am ${formatDisplayDate(date)}`
            : undefined;

        const options = {
            icon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4cb.png"
        };
        if (bodyText) {
            options.body = bodyText;
        }
        new Notification(`Neue Aufgabe: ${task.name}`, options);
    } catch (error) {
        console.warn("Benachrichtigung konnte nicht angezeigt werden.", error);
    }
}
