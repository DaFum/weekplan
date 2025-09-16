// Import necessary functions and data from other modules
import { getState, updateState } from "./state.js";
import { addCoins } from "./games.js";
import { starteKonfetti } from "./effects.js";
import { closeModal, openPromptModal } from "./events.js";
import { formatDisplayDate, getISODate, getStartOfWeek } from "./utils.js";

/**
 * Gets the number of completed tasks for a specific day.
 * @param {string} isoDate - The ISO date string for the day.
 * @param {Array} tasks - The array of tasks.
 * @returns {number} The number of completed tasks for the given day.
 */
export function getPunkteFuerTag(isoDate, tasks) {
    return tasks.filter(t => t.date === isoDate && t.erledigt).length;
}

/**
 * Calculates the current streak of consecutive days with completed tasks.
 * @param {Array} tasks - The array of tasks.
 * @returns {number} The current streak in days.
 */
export function getCurrentStreak(tasks) {
    if (!tasks || tasks.length === 0) return 0;

    const erledigteTage = new Set(tasks.filter(t => t.erledigt).map(t => t.date));
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
    const taskId = document.getElementById("task-id").value;
    const katEl = document.querySelector('input[name="kategorie"]:checked');
    const kategorie = katEl?.value;
    const nameEl = document.getElementById("task-name");
    const dateEl = document.getElementById("task-date");
    if (!kategorie || !nameEl?.value || !dateEl?.value) return;

    // Validate and sanitize task name
    const taskName = nameEl.value.trim();
    if (taskName.length === 0 || taskName.length > 100) {
        const errorEl = document.getElementById("task-name-error");
        if (errorEl) {
            errorEl.textContent = "Aufgabenname muss zwischen 1 und 100 Zeichen lang sein.";
        }
        return;
    } else {
        const errorEl = document.getElementById("task-name-error");
        if (errorEl) {
            errorEl.textContent = "";
        }
    }

    const taskData = {
        name: taskName,
        kategorie: kategorie,
        date: dateEl.value,
        durationInMinutes: kategorie === "pc" ? parseInt(document.getElementById("task-duration").value) || 0 : 0
    };

    const { tasks } = getState();
    if (taskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const newTasks = [...tasks];
            newTasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            updateState({ tasks: newTasks });
        } else {
            console.warn(`saveTask: taskId "${taskId}" nicht gefunden.`);
        }
    } else {
        const newId = "task-" + Date.now();
        updateState({ tasks: [...tasks, { ...taskData, id: newId, erledigt: false }] });

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(`Neue Aufgabe: ${taskData.name}`, {
                body: `Am ${formatDisplayDate(new Date(taskData.date))}`,
                icon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4cb.png"
            });
        }
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
    const newTasks = tasks.map(task => {
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
    updateState({ tasks: tasks.filter(t => t.id !== taskId) });
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
    const start = getStartOfWeek(new Date());
    // Lokales YYYY-MM-DD ableiten (ohne UTC-Verschiebung)
    const startOfCurrentWeekISO = getISODate(start);
    updateState({ tasks: tasks.filter(task => task && task.date && task.date >= startOfCurrentWeekISO) });
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
        }
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
        }
    );
}
