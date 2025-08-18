import { toggleTheme } from './theme.js';
import { setPcTimeLimit, setWeeklyGoal, toggleTask, deleteTask, saveTask } from './tasks.js';
import { getState, updateState } from './state.js';
import { getISODate, formatDisplayDate, getStartOfWeek, createRipple } from './utils.js';
import { openGame, closeGame, checkQuizAnswer } from './games.js';

/**
 * Initialisiert zentrale Event-Handler für die Benutzeroberfläche.
 */
export function initEventListeners() {
    document.body.addEventListener('click', function(event) {
        const target = event.target;
        const taskCard = target.closest('.task-card');
        const taskCardButton = target.closest('.task-card-button');
        const navButton = target.closest('.nav-button');
        const quizOption = target.closest('.quiz-option');
        const btn = target.closest('button');

        if (btn) {
            createRipple(btn, event);
        }

        // Modals
        if (target.closest('#open-task-modal')) openModal();
        if (target.closest('#close-task-modal')) closeModal();
        if (target.closest('#cancel-task-modal')) closeModal();
        if (target.closest('#close-prompt-modal')) closePromptModal();
        if (target.closest('#cancel-prompt-modal')) closePromptModal();

        // Games
        if (target.closest('#open-memory-game')) openGame('memory');
        if (target.closest('#open-quiz-game')) openGame('quiz');
        if (target.closest('.close-game-btn')) closeGame();

        // Settings
        if (target.closest('#pc-time-settings-btn')) setPcTimeLimit();
        if (target.closest('#weekly-goal-settings-btn')) setWeeklyGoal();

        // Theme
        if (target.closest('#theme-toggle')) toggleTheme();

        // Task card actions
        if (taskCardButton && taskCard) {
            const taskId = taskCard.dataset.taskId;
            const action = taskCardButton.dataset.action;
            if (action === 'edit') openModal(taskId);
            if (action === 'toggle') toggleTask(taskId);
            if (action === 'delete') deleteTask(taskId);
        }

        // Week navigation
        if (navButton) {
            updateState({ aktiveWoche: parseInt(navButton.dataset.weekIndex) });
        }

        // Quiz answer
        if (quizOption) {
            checkQuizAnswer(parseInt(quizOption.dataset.index));
        }
    });

    document.getElementById('task-form').addEventListener('submit', saveTask);
    document.getElementById('prompt-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const { promptCallback } = getState();
        const raw = document.getElementById('prompt-modal-input').value;
        const value = raw === '' ? null : Number(raw);
        if (promptCallback && Number.isFinite(value) && value >= 0) {
            promptCallback(value);
        }
        closePromptModal();
    });
}

/**
 * Öffnet das Aufgaben-Modal zum Anlegen oder Bearbeiten einer Aufgabe.
 */
export function openModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    if (!modal) return;
    const form = document.getElementById('task-form');
    form.reset();

    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('task-id');

    if (taskId) {
        const { tasks } = getState();
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.warn(`Task mit ID ${taskId} nicht gefunden.`);
            closeModal();
            return;
        }
        title.textContent = "Aufgabe bearbeiten";
        idInput.value = task.id;
        document.getElementById('task-name').value = task.name;
        document.querySelector(`input[name="kategorie"][value="${task.kategorie}"]`).checked = true;
        if (task.kategorie === 'pc') {
            document.getElementById('task-duration').value = task.durationInMinutes;
        }
    } else {
        title.textContent = "Neue Aufgabe erstellen";
        idInput.value = '';
    }

    const taskDateSelect = document.getElementById('task-date');
    taskDateSelect.innerHTML = '';
    const startOfWeek = getStartOfWeek(new Date());
    const todayISO = getISODate(new Date());
    for (let week = 0; week < 4; week++) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `Woche ${week + 1}`;
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(currentDate.getDate() + week * 7 + day);
            const isoDate = getISODate(currentDate);
            const option = document.createElement('option');
            option.value = isoDate;
            option.textContent = formatDisplayDate(currentDate);
            if (taskId) {
                const { tasks } = getState();
                const taskToEdit = tasks.find(t => t.id === taskId);
                if (taskToEdit) {
                    option.selected = (isoDate === taskToEdit.date);
                }
            } else {
                option.selected = (isoDate === todayISO);
            }
            optgroup.appendChild(option);
        }
        taskDateSelect.appendChild(optgroup);
    }

    setupRadioStyling();
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

/**
 * Schließt das Task-Modal.
 */
export function closeModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.classList.remove('modal-open');
}

/**
 * Öffnet ein numerisches Prompt-Modal.
 */
export function openPromptModal(title, label, initialValue, callback) {
    updateState({ promptCallback: callback });
    document.getElementById('prompt-modal-title').textContent = title;
    document.getElementById('prompt-modal-label').textContent = label;
    const input = document.getElementById('prompt-modal-input');
    input.value = initialValue;
    input.step = label.toLowerCase().includes('stunden') ? "0.5" : "1";
    input.min = "0";
    document.getElementById('prompt-modal').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

/**
 * Schließt das Prompt-Modal.
 */
export function closePromptModal() {
    const modal = document.getElementById('prompt-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    if (!document.getElementById('task-modal')?.classList.contains('hidden')) {
        // do nothing, task modal is open
    } else {
        document.body.classList.remove('modal-open');
    }
}

/**
 * Initialisiert das Styling der Kategorie-Radios.
 */
export function setupRadioStyling() {
    const radios = document.querySelectorAll('input[name="kategorie"]');
    const durationContainer = document.getElementById('pc-duration-container');
    const container = document.getElementById('kategorie-selector');

    const update = () => {
        const selected = document.querySelector('input[name="kategorie"]:checked')?.value;
        if (durationContainer) {
            durationContainer.classList.toggle('hidden', selected !== 'pc');
        }
        radios.forEach(r => {
            const d = r.nextElementSibling;
            if (!d) return;
            const isActive = r.checked;
            d.classList.toggle('active', isActive);
            d.classList.toggle('bg-indigo-600', isActive);
            d.classList.toggle('border-indigo-500', isActive);
            d.classList.toggle('text-white', isActive);
            d.classList.toggle('font-bold', isActive);
            d.classList.toggle('border-border-color', !isActive);
        });
    };

    if (container && container.dataset.stylingInit === '1') {
        update();
        return;
    }
    if (container) {
        container.dataset.stylingInit = '1';
    }
    radios.forEach(radio => radio.addEventListener('change', update));
    update();
}
