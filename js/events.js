// Import necessary functions from other modules
import { selectTheme } from "./theme.js";
import { showWoche, renderTaskModal } from "./ui.js";
import { createRipple } from "./effects.js";
import { setPcTimeLimit, setWeeklyGoal, toggleTask, deleteTask, saveTask } from "./tasks.js";
import { getState, updateState } from "./state.js";
import { openGame, closeGame, checkQuizAnswer } from "./games.js";
import { exportWeekPlan, printWeekPlan } from "./share.js";

const BODY_ACTIVATION_EVENTS = ["pointerdown", "click"];
const MODAL_IDS = ["task-modal", "prompt-modal", "memory-game-modal", "quiz-game-modal"];

/**
 * Initializes central event handlers for the user interface.
 */
export function initEventListeners() {
    setupAudioInitialization();
    setupDelegatedClicks();
    setupFormSubmissions();
    setupKeyboardShortcuts();
}

/**
 * Ensures the AudioContext is activated on the first user gesture.
 */
function setupAudioInitialization() {
    const startAudio = createAudioActivationHandler();
    BODY_ACTIVATION_EVENTS.forEach(eventName => {
        document.body.addEventListener(eventName, startAudio, { once: true });
    });
}

/**
 * Creates a handler that activates the global AudioContext once.
 * @returns {(event: Event) => Promise<void>} The event handler.
 */
function createAudioActivationHandler() {
    let activated = false;

    const handler = async () => {
        if (activated) return;
        activated = true;
        BODY_ACTIVATION_EVENTS.forEach(eventName => {
            document.body.removeEventListener(eventName, handler);
        });
        await activateAudioContext();
    };

    return handler;
}

/**
 * Attempts to resume Tone.js' AudioContext and updates the application state.
 */
async function activateAudioContext() {
    const tone = window.Tone;
    const contextState = tone?.context?.state;
    if (!tone || !tone.context || contextState === "running") {
        return;
    }

    try {
        await tone.start();
        updateState({ audioInitialized: true });
        console.log("AudioContext started successfully.");
    } catch (error) {
        console.error("Could not start AudioContext:", error);
        updateState({ audioInitialized: false });
    }
}

/**
 * Sets up the global click delegation handler.
 */
function setupDelegatedClicks() {
    document.body.addEventListener("click", handleBodyClick);
}

function setupKeyboardShortcuts() {
    document.addEventListener("keydown", handleGlobalKeydown);
}

/**
 * Handles delegated click events on the document body.
 * @param {MouseEvent} event - The click event.
 */
function handleBodyClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    handleModalButtons(target);
    handleGameButtons(target);
    handleSettingsButtons(target);
    handleHeaderActions(target);
    handleThemeInteractions(event, target);
    handleTaskCardActions(target);
    handleWeekNavigation(target);
    handleQuizOption(target);
    applyRippleEffect(target, event);
}

function handleGlobalKeydown(event) {
    if (event.key === "Escape" && isThemeMenuOpen()) {
        closeThemeMenu();
    }
}

/**
 * Registers submit handlers for forms managed by the application.
 */
function setupFormSubmissions() {
    const taskForm = document.getElementById("task-form");
    if (taskForm instanceof HTMLFormElement) {
        taskForm.addEventListener("submit", saveTask);
    }

    const promptForm = document.getElementById("prompt-form");
    if (promptForm instanceof HTMLFormElement) {
        promptForm.addEventListener("submit", handlePromptSubmit);
    }
}

/**
 * Processes submissions of the numeric prompt modal.
 * @param {SubmitEvent} event - The submit event.
 */
function handlePromptSubmit(event) {
    event.preventDefault();

    const { promptCallback } = getState();
    const inputEl = document.getElementById("prompt-modal-input");

    if (!(inputEl instanceof HTMLInputElement)) {
        closePromptModal();
        return;
    }

    const raw = inputEl.value.trim();
    const value = raw === "" ? NaN : Number(raw);

    if (typeof promptCallback === "function" && Number.isFinite(value) && value >= 0) {
        promptCallback(value);
        closePromptModal();
    } else if (Number.isFinite(value) && value < 0) {
        alert("Bitte geben Sie eine positive Zahl ein.");
    } else {
        closePromptModal();
    }
}

function handleModalButtons(target) {
    if (target.closest("#open-task-modal")) {
        openModal();
    }
    if (target.closest("#close-task-modal") || target.closest("#cancel-task-modal")) {
        closeModal();
    }
    if (target.closest("#close-prompt-modal") || target.closest("#cancel-prompt-modal")) {
        closePromptModal();
    }
}

function handleGameButtons(target) {
    if (target.closest("#open-memory-game")) {
        openGame("memory");
    }
    if (target.closest("#open-quiz-game")) {
        openGame("quiz");
    }
    if (target.closest(".close-game-btn")) {
        closeGame();
    }
}

function handleHeaderActions(target) {
    if (target.closest("#export-plan")) {
        exportWeekPlan();
    }
    if (target.closest("#print-plan")) {
        printWeekPlan();
    }
}

function handleSettingsButtons(target) {
    if (target.closest("#pc-time-settings-btn")) {
        setPcTimeLimit();
    }
    if (target.closest("#weekly-goal-settings-btn")) {
        setWeeklyGoal();
    }
}

function handleThemeInteractions(event, target) {
    const toggleButton = target.closest("#theme-toggle");
    if (toggleButton) {
        event.preventDefault();
        toggleThemeMenu();
        return;
    }

    const themeOption = target.closest(".theme-option");
    if (themeOption instanceof HTMLButtonElement) {
        const { theme } = themeOption.dataset;
        selectTheme(theme ?? "");
        closeThemeMenu();
        return;
    }

    if (isThemeMenuOpen() && !target.closest("#theme-menu")) {
        closeThemeMenu();
    }
}

function handleTaskCardActions(target) {
    const taskCard = target.closest(".task-card");
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;
    if (!taskId) return;

    if (target.closest('.task-card-button[data-action="edit"]')) {
        openModal(taskId);
    }
    if (target.closest('.task-card-button[data-action="toggle"]')) {
        toggleTask(taskId);
    }
    if (target.closest('.task-card-button[data-action="delete"]')) {
        deleteTask(taskId);
    }
}

function handleWeekNavigation(target) {
    const navButton = target.closest(".nav-button");
    if (!navButton) return;

    const idx = Number.parseInt(navButton.dataset.weekIndex ?? "", 10);
    if (Number.isFinite(idx)) {
        showWoche(idx);
    }
}

function handleQuizOption(target) {
    const quizOption = target.closest(".quiz-option");
    if (!quizOption) return;

    const ansIdx = Number.parseInt(quizOption.dataset.index ?? "", 10);
    if (Number.isFinite(ansIdx)) {
        checkQuizAnswer(ansIdx);
    }
}

function applyRippleEffect(target, event) {
    const btn = target.closest("button");
    if (btn && !btn.disabled) {
        createRipple(btn, event);
    }
}

/**
 * Opens the task modal and renders its content.
 * @param {string|null} taskId - Optional: The ID of the task to be edited.
 */
function openModal(taskId = null) {
    renderTaskModal(getState(), taskId);
    showModalElement("task-modal");
    document.getElementById("task-name")?.focus();
}

/**
 * Closes the task modal.
 */
export function closeModal() {
    hideModalElement("task-modal");
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
        input.value = initialValue ?? "";
        input.step = label.toLowerCase().includes("stunden") ? "0.5" : "1";
        input.min = "0";
        input.focus();
        input.select();
    }
    showModalElement("prompt-modal");
}

/**
 * Closes the prompt modal.
 */
function closePromptModal() {
    hideModalElement("prompt-modal");
    // Callback zurücksetzen, um veraltete Referenzen zu vermeiden
    updateState({ promptCallback: null });
}

function showModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function hideModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.add("hidden");
    updateBodyModalState();
}

function updateBodyModalState() {
    const hasOpenModal = MODAL_IDS.some(modalId => {
        const el = document.getElementById(modalId);
        return el && !el.classList.contains("hidden");
    });
    document.body.classList.toggle("modal-open", hasOpenModal);
}

function toggleThemeMenu() {
    const menu = document.getElementById("theme-menu");
    const toggle = document.getElementById("theme-toggle");
    if (!menu) return;
    const shouldOpen = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !shouldOpen);
    if (toggle) {
        toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    }
    if (shouldOpen) {
        const { theme } = getState();
        const activeButton = menu.querySelector(`.theme-option[data-theme="${theme}"]`);
        if (activeButton instanceof HTMLButtonElement) {
            activeButton.focus();
        } else {
            menu.focus();
        }
    }
}

function closeThemeMenu() {
    const menu = document.getElementById("theme-menu");
    const toggle = document.getElementById("theme-toggle");
    if (!menu || menu.classList.contains("hidden")) return;
    menu.classList.add("hidden");
    if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
    }
}

function isThemeMenuOpen() {
    const menu = document.getElementById("theme-menu");
    return Boolean(menu && !menu.classList.contains("hidden"));
}
