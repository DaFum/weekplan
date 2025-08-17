import { getState, updateState } from './state.js';
import { renderAllUI } from './ui.js';
import { addCoins } from './games.js';
import { starteKonfetti } from './ui.js';
import { closeModal } from './events.js';
import { formatDisplayDate } from './utils.js';

/**
 * Speichert ein Task-Formular: erstellt eine neue Aufgabe oder aktualisiert eine bestehende.
 *
 * Liest die Formularfelder (task-id, kategorie, task-name, task-date und task-duration — letzteres nur bei
 * kategorie === 'pc'), baut ein Task-Objekt und schreibt es in den globalen State.
 * - Bei vorhandener task-id: aktualisiert die gefundene Aufgabe (beibehaltende Felder bleiben erhalten).
 * - Ohne task-id: legt eine neue Aufgabe mit id `'task-' + Date.now()` und `erledigt: false` an.
 * Falls Notification-Berechtigung erteilt ist, wird für neu angelegte Aufgaben eine Browser-Notification
 * mit dem formatierten Datum angezeigt. Nach dem Speichern wird die UI neu gerendert und das Modal geschlossen.
 *
 * @param {Event} event - Submit-Event des Formulars (wird preventDefault() aufgerufen).
 */
export function saveTask(event) {
    event.preventDefault();
    const taskId = document.getElementById('task-id').value;
    const kategorie = document.querySelector('input[name="kategorie"]:checked').value;
    const taskData = {
        name: document.getElementById('task-name').value,
        kategorie: kategorie,
        date: document.getElementById('task-date').value,
        durationInMinutes: kategorie === 'pc' ? parseInt(document.getElementById('task-duration').value) || 0 : 0
    };

    const { tasks } = getState();
    if (taskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const newTasks = [...tasks];
            newTasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
            updateState({ tasks: newTasks });
        }
    } else {
        updateState({ tasks: [...tasks, { ...taskData, id: 'task-' + Date.now(), erledigt: false }] });

        if (Notification.permission === 'granted') {
            new Notification(`Neue Aufgabe: ${taskData.name}`, {
                body: `Am ${formatDisplayDate(new Date(taskData.date))}`,
                icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4cb.png'
            });
        }
    }
    renderAllUI();
    closeModal();
}

/**
 * Schaltet den Erledigt-Status einer Aufgabe um.
 *
 * Wenn die Aufgabe von offen auf erledigt wechselt, werden ein Abschlusssound
 * abgespielt, Konfetti gestartet und 5 Münzen gutgeschrieben. Aktualisiert den
 * globalen State mit der geänderten Aufgabenliste.
 *
 * @param {string} taskId - ID der Aufgabe, deren Status umgeschaltet werden soll.
 */
export function toggleTask(taskId) {
    const { tasks, sounds } = getState();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.erledigt = !task.erledigt;
        if (task.erledigt) {
            sounds.complete.triggerAttackRelease("C4", "0.2");
            starteKonfetti();
            addCoins(5);
        }
        updateState({ tasks: [...tasks] });
    }
}

/**
 * Entfernt eine Aufgabe aus dem Anwendungszustand anhand ihrer ID.
 *
 * Aktualisiert den State, sodass die Aufgabe mit der angegebenen `taskId` aus `tasks` entfernt wird.
 *
 * @param {string} taskId - ID der zu löschenden Aufgabe.
 */
export function deleteTask(taskId) {
    const { tasks } = getState();
    updateState({ tasks: tasks.filter(t => t.id !== taskId) });
}

/**
 * Entfernt im Zustand gespeicherte Aufgaben, deren Datum vor Beginn der aktuellen Woche liegt.
 *
 * Berechnet den ISO-Datumstring für den Beginn der aktuellen Woche und aktualisiert den globalen
 * State so, dass nur Aufgaben mit einem gesetzten `date`-Feld und einem Datum größer-gleich diesem
 * Beginn erhalten bleiben. Aufgaben ohne `date` werden ebenfalls entfernt.
 */
export function cleanupOldTasks() {
    const { tasks } = getState();
    const startOfCurrentWeekISO = getISODate(getStartOfWeek(new Date()));
    updateState({ tasks: tasks.filter(task => task && task.date && task.date >= startOfCurrentWeekISO) });
}
