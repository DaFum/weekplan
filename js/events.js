// Import necessary functions from other modules
import { selectTheme } from "./theme.js";
import { showWoche, renderTaskModal } from "./ui.js";
import { createRipple } from "./effects.js";
import { setPcTimeLimit, setWeeklyGoal, toggleTask, deleteTask, saveTask } from "./tasks.js";
import { getState, updateState } from "./state.js";
import { openGame, closeGame, checkQuizAnswer } from "./games.js";
import { exportWeekPlan, printWeekPlan } from "./share.js";
import { closeModal, closePromptModal, showModalElement } from "./modal.js";

const BODY_ACTIVATION_EVENTS = ["pointerdown", "click"];

let listenersInitialized = false;
let audioActivationHandler = null;
let audioActivationCompleted = false;
let delegatedClicksInitialized = false;
let formSubmissionsInitialized = false;
let keyboardShortcutsInitialized = false;

/**
 * Initializes central event handlers for the user interface.
 */
export function initEventListeners() {
    if (listenersInitialized) {
        return;
    }

    listenersInitialized = true;
    setupAudioInitialization();
    setupDelegatedClicks();
    setupFormSubmissions();
    setupKeyboardShortcuts();
}

/**
 * Ensures the AudioContext is activated on the first user gesture.
 */
function setupAudioInitialization() {
    if (audioActivationCompleted || audioActivationHandler) {
        return;
    }

    audioActivationHandler = createAudioActivationHandler();
    BODY_ACTIVATION_EVENTS.forEach(eventName => {
        document.body.addEventListener(eventName, audioActivationHandler);
    });
}

/**
 * Creates a handler that activates the global AudioContext once.
 * @returns {(event: Event) => Promise<void>} The event handler.
 */
function createAudioActivationHandler() {
    let activated = false;
    let starting = false;

    const handler = async () => {
        if (activated || starting) return;
        starting = true;
        const success = await activateAudioContext();
        starting = false;

        if (!success) {
            return;
        }

        activated = true;
        audioActivationCompleted = true;
        BODY_ACTIVATION_EVENTS.forEach(eventName => {
            document.body.removeEventListener(eventName, handler);
        });
        audioActivationHandler = null;
    };

    return handler;
}

/**
 * Attempts to resume Tone.js' AudioContext and updates the application state.
 */
async function activateAudioContext() {
    const tone = window.Tone;
    const contextState = tone?.context?.state;
    if (!tone || !tone.context) {
        updateState({ audioInitialized: false });
        return false;
    }

    if (contextState === "running") {
        updateState({ audioInitialized: true });
        return true;
    }

    try {
        await tone.start();
        updateState({ audioInitialized: true });
        console.log("AudioContext started successfully.");
        return true;
    } catch (error) {
        console.error("Could not start AudioContext:", error);
        updateState({ audioInitialized: false });
        return false;
    }
}

/**
 * Sets up the global click delegation handler.
 */
function setupDelegatedClicks() {
    if (delegatedClicksInitialized) {
        return;
    }

    delegatedClicksInitialized = true;
    document.body.addEventListener("click", handleBodyClick);
}

function setupKeyboardShortcuts() {
    if (keyboardShortcutsInitialized) {
        return;
    }

    keyboardShortcutsInitialized = true;
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
    if (formSubmissionsInitialized) {
        return;
    }

    formSubmissionsInitialized = true;
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
    const errorEl = document.getElementById("prompt-modal-error");

    const resetPromptError = () => {
        if (errorEl) {
            errorEl.textContent = "";
        }
        if (inputEl instanceof HTMLInputElement) {
            inputEl.removeAttribute("aria-invalid");
        }
    };

    if (!(inputEl instanceof HTMLInputElement)) {
        closePromptModal();
        return;
    }

    resetPromptError();

    const raw = inputEl.value.trim();
    // Explicitly convert empty input to NaN; 0 is a valid value and should not be treated as NaN.
    const value = raw === "" ? NaN : Number(raw);

    if (typeof promptCallback !== "function") {
        closePromptModal();
        return;
    }

    if (Number.isFinite(value) && value >= 0) {
        promptCallback(value);
        closePromptModal();
        return;
    }

    const message = Number.isFinite(value)
        ? "Bitte geben Sie eine positive Zahl ein."
        : "Bitte geben Sie eine gültige Zahl ein.";

    if (errorEl) {
        errorEl.textContent = message;
    }
    inputEl.setAttribute("aria-invalid", "true");
    inputEl.focus();
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
