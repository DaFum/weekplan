import { getState, updateState } from './state.js';
import { renderAllUI } from './ui.js';
import { addCoins } from './games.js';
import { starteKonfetti } from './ui.js';
import { closeModal } from './events.js';
import { formatDisplayDate } from './utils.js';

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

export function deleteTask(taskId) {
    const { tasks } = getState();
    updateState({ tasks: tasks.filter(t => t.id !== taskId) });
}

export function cleanupOldTasks() {
    const { tasks } = getState();
    const startOfCurrentWeekISO = getISODate(getStartOfWeek(new Date()));
    updateState({ tasks: tasks.filter(task => task && task.date && task.date >= startOfCurrentWeekISO) });
}
