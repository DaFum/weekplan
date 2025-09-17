import { updateState } from "./state.js";

export function showModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.remove("hidden");
    updateBodyModalState();
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

export function openPromptModal(title, label, initialValue, callback, options = {}) {
    updateState({ promptCallback: callback });

    const titleEl = document.getElementById("prompt-modal-title");
    const labelEl = document.getElementById("prompt-modal-label");
    if (titleEl) titleEl.textContent = title;
    if (labelEl) labelEl.textContent = label;

    const input = document.getElementById("prompt-modal-input");
    if (input instanceof HTMLInputElement) {
        input.value = initialValue ?? "";
        if (options.step != null) {
            input.step = String(options.step);
        } else {
            input.step = "1";
        }
        input.min = "0";
        if (!input.hasAttribute("aria-describedby")) {
            input.setAttribute("aria-describedby", "prompt-modal-error");
        }
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
    const hasOpenModal = Array
        .from(document.querySelectorAll('[role="dialog"]'))
        .some(el => !el.classList.contains("hidden"));
    document.body.classList.toggle("modal-open", hasOpenModal);
}
