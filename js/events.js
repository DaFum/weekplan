import { toggleTheme } from './theme.js';
import { createRipple, showWoche } from './ui.js';
import { setPcTimeLimit, setWeeklyGoal, toggleTask, deleteTask, saveTask } from './tasks.js';
import { getState, updateState } from './state.js';
import { getISODate, formatDisplayDate } from './utils.js';
import { getStartOfWeek } from './utils.js';
import { openGame, closeGame, checkQuizAnswer } from './games.js';

export function initEventListeners() {
    document.body.addEventListener('click', function(event) {
        const target = event.target;

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

        // Dynamic elements
        const taskCard = target.closest('.task-card');
        if (taskCard) {
            const taskId = taskCard.dataset.taskId;
            if (target.closest('.task-card-button[aria-label="Bearbeiten"]')) openModal(taskId);
            if (target.closest('.task-card-button[aria-label*="erledigt"]')) toggleTask(taskId);
            if (target.closest('.task-card-button[aria-label="Löschen"]')) deleteTask(taskId);
        }

        const navButton = target.closest('.nav-button');
        if (navButton) {
            showWoche(parseInt(navButton.dataset.weekIndex));
        }

        const quizOption = target.closest('.quiz-option');
        if (quizOption) {
            checkQuizAnswer(parseInt(quizOption.dataset.index));
        }

        const btn = event.target.closest('button');
        if (btn) createRipple(btn, event);
    });

    document.getElementById('task-form').addEventListener('submit', saveTask);
    document.getElementById('prompt-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const { promptCallback } = getState();
        const value = document.getElementById('prompt-modal-input').value;
        if (promptCallback && value !== null && !isNaN(value) && value >= 0) {
            promptCallback(value);
        }
        closePromptModal();
    });
}

export function openModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    form.reset();
    const title = document.getElementById('modal-title');
    const idInput = document.getElementById('task-id');

    if (taskId) {
        const { tasks } = getState();
        const task = tasks.find(t => t.id === taskId);
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
            const currentDate = new Date(startOfWeek); currentDate.setDate(currentDate.getDate() + week * 7 + day);
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

export function closeModal() {
    document.getElementById('task-modal').classList.add('hidden');
    document.body.classList.remove('modal-open');
}

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

export function closePromptModal() {
    document.getElementById('prompt-modal').classList.add('hidden');
    if (!document.getElementById('task-modal').classList.contains('hidden')) {
        // do nothing, task modal is open
    } else {
        document.body.classList.remove('modal-open');
    }
}

export function setupRadioStyling() {
    const radios = document.querySelectorAll('input[name="kategorie"]');
    const durationContainer = document.getElementById('pc-duration-container');
    const update = () => {
        const selected = document.querySelector('input[name="kategorie"]:checked')?.value;
        durationContainer.classList.toggle('hidden', selected !== 'pc');
        radios.forEach(r => {
            const d = r.nextElementSibling;
            const isActive = r.checked;
            d.classList.toggle('active', isActive);
            d.classList.toggle('bg-indigo-600', isActive);
            d.classList.toggle('border-indigo-500', isActive);
            d.classList.toggle('text-white', isActive);
            d.classList.toggle('font-bold', isActive);
            d.classList.toggle('border-border-color', !isActive);
        });
    };
    radios.forEach(radio => radio.addEventListener('change', update));
    update();
}
