// Import necessary functions from other modules
import { toggleTheme } from "./theme.js";
import { showWoche, renderTaskModal } from "./ui.js";
import { createRipple } from "./effects.js";
import { setPcTimeLimit, setWeeklyGoal, toggleTask, deleteTask, saveTask } from "./tasks.js";
import { getState, updateState } from "./state.js";
import { openGame, closeGame, checkQuizAnswer } from "./games.js";

/**
 * Initializes central event handlers for the user interface.
 */
export function initEventListeners() {
    // Start audio context on the first user gesture to comply with autoplay policies
    const startAudio = async () => {
        // Tone.js is loaded dynamically, so we access it via window
        if (window.Tone && window.Tone.context && window.Tone.context.state !== "running") {
            try {
                await window.Tone.start();
                console.log("AudioContext started successfully.");
                updateState({ audioInitialized: true });
            } catch (e) {
                console.error("Could not start AudioContext:", e);
                updateState({ audioInitialized: false });
            }
        }
    };
    // Using pointerdown for faster response on touch devices
    document.body.addEventListener("pointerdown", startAudio, { once: true });
    document.body.addEventListener("click", startAudio, { once: true });


    // Add a single click event listener to the body for event delegation
    document.body.addEventListener("click", function(event) {
        const target = event.target;

        // Handle modal interactions
        if (target.closest("#open-task-modal")) openModal();
        if (target.closest("#close-task-modal") || target.closest("#cancel-task-modal")) closeModal();
        if (target.closest("#close-prompt-modal") || target.closest("#cancel-prompt-modal")) closePromptModal();

        // Handle game interactions
        if (target.closest("#open-memory-game")) openGame("memory");
        if (target.closest("#open-quiz-game")) openGame("quiz");
        if (target.closest(".close-game-btn")) closeGame();

        // Handle settings interactions
        if (target.closest("#pc-time-settings-btn")) setPcTimeLimit();
        if (target.closest("#weekly-goal-settings-btn")) setWeeklyGoal();

        // Handle theme toggling
        if (target.closest("#theme-toggle")) toggleTheme();

        // Handle task-card actions
        const taskCard = target.closest(".task-card");
        if (taskCard) {
            const taskId = taskCard.dataset.taskId;
            if (!taskId) return;
            if (target.closest('.task-card-button[data-action="edit"]'))   openModal(taskId);
            if (target.closest('.task-card-button[data-action="toggle"]')) toggleTask(taskId);
            if (target.closest('.task-card-button[data-action="delete"]')) deleteTask(taskId);
        }

        // Handle week navigation
        const navButton = target.closest(".nav-button");
        if (navButton) {
            const idx = parseInt(navButton.dataset.weekIndex, 10);
            if (Number.isFinite(idx)) showWoche(idx);
        }

        // Handle quiz answer selection
        const quizOption = target.closest(".quiz-option");
        if (quizOption) {
            const ansIdx = parseInt(quizOption.dataset.index, 10);
            if (Number.isFinite(ansIdx)) checkQuizAnswer(ansIdx);
        }

        // Ripple on buttons
        const btn = target.closest("button");
        if (btn && !btn.disabled) createRipple(btn, event);
    });

    // Add submit event listener to the task form
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
        taskForm.addEventListener("submit", saveTask);
    }

    // Add submit event listener to the prompt form
    const promptForm = document.getElementById("prompt-form");
    if (promptForm) {
        promptForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const { promptCallback } = getState();

            // Guard against missing or non-input element
            const inputEl = document.getElementById("prompt-modal-input");
            if (!(inputEl instanceof HTMLInputElement)) {
                closePromptModal();
                return;
            }

            const raw = inputEl.value;
            const num = raw === "" ? NaN : Number(raw);

            if (typeof promptCallback === "function" && Number.isFinite(num) && num >= 0) {
                promptCallback(num);
                closePromptModal();
            } else if (Number.isFinite(num) && num < 0) {
                alert("Bitte geben Sie eine positive Zahl ein.");
            } else {
                closePromptModal();
            }
        });
    }
}

/**
 * Opens the task modal and renders its content.
 * @param {string|null} taskId - Optional: The ID of the task to be edited.
 */
function openModal(taskId = null) {
    renderTaskModal(getState(), taskId);
    document.getElementById("task-modal")?.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

/**
 * Closes the task modal.
 */
export function closeModal() {
  document.getElementById("task-modal")?.classList.add("hidden");
  const hasOtherOpen = ["prompt-modal", "memory-game-modal", "quiz-game-modal"].some(id => {
    const el = document.getElementById(id);
    return el && !el.classList.contains("hidden");
  });
  if (!hasOtherOpen) document.body.classList.remove("modal-open");
}

/**
 * Opens a numeric prompt modal.
 * @param {string} title - The title of the modal.
 * @param {string} label - The label for the input field.
 * @param {number} initialValue - The initial value for the input field.
 * @param {function} callback - The function to call when the form is submitted.
 */
export function openPromptModal(title, label, initialValue, callback) {
    updateState({ promptCallback: callback });
    const titleEl = document.getElementById("prompt-modal-title");
    const labelEl = document.getElementById("prompt-modal-label");
    if (titleEl) titleEl.textContent = title;
    if (labelEl) labelEl.textContent = label;
    const input = document.getElementById("prompt-modal-input");
    if (input) {
        input.value = initialValue;
        input.step = label.toLowerCase().includes("stunden") ? "0.5" : "1";
        input.min = "0";
    }
    document.getElementById("prompt-modal")?.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

/**
 * Closes the prompt modal.
 */
function closePromptModal() {
    document.getElementById("prompt-modal")?.classList.add("hidden");
    // Callback zurücksetzen, um veraltete Referenzen zu vermeiden
    updateState({ promptCallback: null });
    const stillOpen = ["task-modal", "memory-game-modal", "quiz-game-modal"].some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains("hidden");
    });
    if (!stillOpen) document.body.classList.remove("modal-open");
}
