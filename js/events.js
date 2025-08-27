import { toggleTheme } from "./theme.js";
import { createRipple, showWoche, renderTaskModal } from "./ui.js";
import { setPcTimeLimit, setWeeklyGoal, toggleTask, deleteTask, saveTask } from "./tasks.js";
import { getState, updateState } from "./state.js";
import { openGame, closeGame, checkQuizAnswer } from "./games.js";

/**
 * Initialisiert zentrale Event-Handler für die Benutzeroberfläche.
 */
export function initEventListeners() {
    document.body.addEventListener("click", function(event) {
        const target = event.target;

        // Modals
        if (target.closest("#open-task-modal")) openModal();
        if (target.closest("#close-task-modal")) closeModal();
        if (target.closest("#cancel-task-modal")) closeModal();
        if (target.closest("#close-prompt-modal")) closePromptModal();
        if (target.closest("#cancel-prompt-modal")) closePromptModal();

        // Games
        if (target.closest("#open-memory-game")) openGame("memory");
        if (target.closest("#open-quiz-game")) openGame("quiz");
        if (target.closest(".close-game-btn")) closeGame();

        // Settings
        if (target.closest("#pc-time-settings-btn")) setPcTimeLimit();
        if (target.closest("#weekly-goal-settings-btn")) setWeeklyGoal();

        // Theme
        if (target.closest("#theme-toggle")) toggleTheme();

        // Dynamic elements
        const taskCard = target.closest(".task-card");
        if (taskCard) {
            const taskId = taskCard.dataset.taskId;
            if (target.closest('.task-card-button[aria-label="Bearbeiten"]')) openModal(taskId);
            if (target.closest('.task-card-button[aria-label*="erledigt"]')) toggleTask(taskId);
            if (target.closest('.task-card-button[aria-label="Löschen"]')) deleteTask(taskId);
        }

        const navButton = target.closest(".nav-button");
        if (navButton) {
            showWoche(parseInt(navButton.dataset.weekIndex));
        }

        const quizOption = target.closest(".quiz-option");
        if (quizOption) {
            checkQuizAnswer(parseInt(quizOption.dataset.index));
        }

        const btn = event.target.closest("button");
        if (btn) createRipple(btn, event);
    });

        saveTask(event);
    if (taskForm) {
        taskForm.addEventListener("submit", (event) => {
            saveTask(event);
        });
    }

    const promptForm = document.getElementById("prompt-form");
    if (promptForm) {
        promptForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const { promptCallback } = getState();
            const value = document.getElementById("prompt-modal-input").value;
            if (promptCallback && value !== null && !isNaN(value) && value >= 0) {
                promptCallback(value);
            }
            closePromptModal();
        });
    }
}

/**
 * Öffnet das Aufgaben-Modal und rendert seinen Inhalt.
 * @param {string|null} taskId - Optional: ID der zu bearbeitenden Aufgabe.
 */
export function openModal(taskId = null) {
    renderTaskModal(getState(), taskId);
    document.getElementById("task-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
}

/**
 * Schließt das Task-Modal.
 */
export function closeModal() {
    document.getElementById("task-modal").classList.add("hidden");
    document.body.classList.remove("modal-open");
}

/**
 * Öffnet ein numerisches Prompt-Modal.
 */
export function openPromptModal(title, label, initialValue, callback) {
    updateState({ promptCallback: callback });
    document.getElementById("prompt-modal-title").textContent = title;
    document.getElementById("prompt-modal-label").textContent = label;
    const input = document.getElementById("prompt-modal-input");
    input.value = initialValue;
    input.step = label.toLowerCase().includes("stunden") ? "0.5" : "1";
    input.min = "0";
    document.getElementById("prompt-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
}

/**
 * Schließt das Prompt-Modal.
 */
export function closePromptModal() {
    document.getElementById("prompt-modal").classList.add("hidden");
    if (!document.getElementById("task-modal").classList.contains("hidden")) {
        // do nothing, task modal is open
    } else {
        document.body.classList.remove("modal-open");
    }
}
