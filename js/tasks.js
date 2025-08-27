import { getState, updateState } from "./state.js";
import { addCoins } from "./games.js";
import { starteKonfetti } from "./effects.js";
import { closeModal, openPromptModal } from "./events.js";
import { formatDisplayDate, getISODate, getStartOfWeek } from "./utils.js";

export function getPunkteFuerTag(isoDate, tasks) {
    return tasks.filter(t => t.date === isoDate && t.erledigt).length;
}

export function updatePunkteAnzeige(state) {
    document.querySelectorAll(".tag-karte").forEach(card => {
        const anzeige = card.querySelector(".day-score");
        if (anzeige) anzeige.innerHTML = `<span class="text-yellow-500">⭐</span> ${getPunkteFuerTag(card.id, state.tasks)}`;
    });
}

export function getCurrentStreak(tasks) {
    if (!tasks || tasks.length === 0) return 0;

    const erledigteTage = new Set(tasks.filter(t => t.erledigt).map(t => t.date));
    if (erledigteTage.size === 0) return 0;

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (erledigteTage.has(getISODate(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

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
    const taskId = document.getElementById("task-id").value;
    const kategorie = document.querySelector('input[name="kategorie"]:checked').value;
    const taskData = {
        name: document.getElementById("task-name").value,
        kategorie: kategorie,
        date: document.getElementById("task-date").value,
        durationInMinutes: kategorie === "pc" ? parseInt(document.getElementById("task-duration").value) || 0 : 0
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
        const newId = "task-" + Date.now();
        updateState({ tasks: [...tasks, { ...taskData, id: newId, erledigt: false }] });

        if (Notification.permission === "granted") {
            new Notification(`Neue Aufgabe: ${taskData.name}`, {
                body: `Am ${formatDisplayDate(new Date(taskData.date))}`,
                icon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4cb.png"
            });
        }
    }
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
    const newTasks = tasks.map(task => {
        if (task.id === taskId) {
            const wasErledigt = task.erledigt;
            const newErledigt = !wasErledigt;
            if (newErledigt) {
                sounds.complete.triggerAttackRelease("C4", "0.2");
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

/**
 * Öffnet ein Modal, um das PC-Zeitlimit (in Stunden) für die Woche festzulegen.
 *
 * Ruft `openPromptModal` auf, um den Benutzer nach der Anzahl der Stunden zu fragen.
 * Der aktuelle Wert wird aus dem State (`pcStundenGesamt`) gelesen. Nach der Eingabe
 * wird der State mit dem neuen Wert aktualisiert.
 */
export function setPcTimeLimit() {
    const { pcStundenGesamt } = getState();
    openPromptModal(
        "PC-Zeitlimit festlegen",
        "Wie viele Stunden PC-Zeit pro Woche?",
        pcStundenGesamt,
        (value) => {
            updateState({ pcStundenGesamt: Number(value) });
        }
    );
}

/**
 * Öffnet ein Modal, um das Wochenziel (Anzahl der Aufgaben) festzulegen.
 *
 * Ruft `openPromptModal` auf, um den Benutzer nach der Anzahl der zu erledigenden
 * Aufgaben zu fragen. Der aktuelle Wert wird aus dem State (`wochenZiel`) gelesen.
 * Nach der Eingabe wird der State mit dem neuen Wert aktualisiert.
 */
export function setWeeklyGoal() {
    const { wochenZiel } = getState();
    openPromptModal(
        "Wochenziel festlegen",
        "Wie viele Aufgaben pro Woche?",
        wochenZiel,
        (value) => {
            updateState({ wochenZiel: Number(value) });
        }
    );
}
