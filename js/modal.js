import { updateState } from "./state.js";

const MODAL_IDS = ["task-modal", "prompt-modal", "memory-game-modal", "quiz-game-modal"];

export function showModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.remove("hidden");
    document.body.classList.add("modal-open");
}

export function hideModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.add("hidden");
    updateBodyModalState();
}

export function closeModal() {
    hideModalElement("task-modal");
}

export function openPromptModal(title, label, initialValue, callback) {
    updateState({ promptCallback: callback });

    const titleEl = document.getElementById("prompt-modal-title");
    const labelEl = document.getElementById("prompt-modal-label");
    if (titleEl) titleEl.textContent = title;
    if (labelEl) labelEl.textContent = label;

    const input = document.getElementById("prompt-modal-input");
    if (input instanceof HTMLInputElement) {
        input.value = initialValue ?? "";
        input.step = label.toLowerCase().includes("stunden") ? "0.5" : "1";
        input.min = "0";
        input.removeAttribute("aria-invalid");
        input.focus();
        input.select();
    }

    const errorEl = document.getElementById("prompt-modal-error");
    if (errorEl) {
        errorEl.textContent = "";
    }

    showModalElement("prompt-modal");
}

export function closePromptModal() {
    hideModalElement("prompt-modal");
    updateState({ promptCallback: null });

    const input = document.getElementById("prompt-modal-input");
    if (input instanceof HTMLInputElement) {
        input.removeAttribute("aria-invalid");
    }

    const errorEl = document.getElementById("prompt-modal-error");
    if (errorEl) {
        errorEl.textContent = "";
    }
}

function updateBodyModalState() {
    const hasOpenModal = MODAL_IDS.some(modalId => {
        const el = document.getElementById(modalId);
        return el && !el.classList.contains("hidden");
    });
    document.body.classList.toggle("modal-open", hasOpenModal);
}
