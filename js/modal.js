import { updateState } from "./state.js";

/**
 * Reveals a modal dialog by removing the `hidden` class and synchronizing the
 * global body state so background scrolling is disabled while the dialog is
 * open.
 *
 * @param {string} id - The DOM id of the modal container element to show.
 */
export function showModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.remove("hidden");
    updateBodyModalState();
}

/**
 * Hides a modal dialog by adding the `hidden` class and updating the
 * `modal-open` body class to reflect the current open dialog state.
 *
 * @param {string} id - The DOM id of the modal container element to hide.
 */
export function hideModalElement(id) {
    const element = document.getElementById(id);
    if (!element) return;

    element.classList.add("hidden");
    updateBodyModalState();
}

/**
 * Closes the primary task modal dialog.
 */
export function closeModal() {
    hideModalElement("task-modal");
}

/**
 * Opens the prompt modal, primes its input with optional configuration, and
 * stores the provided callback for later execution when the form is
 * submitted.
 *
 * @param {string} title - Title text rendered in the prompt modal header.
 * @param {string} label - Accessible label describing the expected input.
 * @param {string | number | null | undefined} initialValue - Initial value to
 *   populate in the prompt input field.
 * @param {(value: number) => void} callback - Function invoked with the input
 *   value after successful submission.
 * @param {{ step?: number }} [options] - Optional configuration, currently
 *   supporting a custom numeric `step` attribute for the input.
 */
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

/**
 * Closes the prompt modal dialog and clears any transient validation state or
 * stored callback references.
 */
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
