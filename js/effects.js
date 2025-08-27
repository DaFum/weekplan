// Configuration constants for the confetti effect
const KONFETTI_COUNT = 50; // Number of confetti particles
const KONFETTI_HUE_RANGE = 360; // Hue range for confetti colors
const KONFETTI_SCALE_RANDOM_FACTOR = 0.75; // Random factor for scaling confetti
const KONFETTI_SCALE_MIN = 0.25; // Minimum scale for confetti
const KONFETTI_ANIMATION_DELAY_MAX_S = 3; // Maximum animation delay in seconds
const KONFETTI_BASE_DURATION_MS = 3000; // Base duration of the confetti animation in milliseconds
const KONFETTI_RANDOM_DURATION_MS = 2000; // Random duration to add to the base duration
const KONFETTI_POSITION_PERCENT_RANGE = 100; // Range for positioning confetti in percent
const KONFETTI_TOP_OFFSET_PERCENT = 20; // Top offset for confetti in percent

// Track the last cleanup function
let lastKonfettiCleanup = null;

/**
 * Starts the confetti effect.
 * @param {HTMLElement} container - The container element for the confetti. Defaults to document.body.
 * @returns {function} A cleanup function to remove the confetti.
 */
export function starteKonfetti(container = document.body) {
    // Clean up previous confetti if it exists
    if (lastKonfettiCleanup) {
        lastKonfettiCleanup();
    }

    const timeouts = [];
    const elements = [];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < KONFETTI_COUNT; i++) {
        const konfetti = document.createElement("div");
        konfetti.className = "konfetti"; // CSS class for styling and animation
        konfetti.style.position = "absolute";
        konfetti.style.left = `${Math.random() * KONFETTI_POSITION_PERCENT_RANGE}%`;
        konfetti.style.top = `${Math.random() * KONFETTI_POSITION_PERCENT_RANGE - KONFETTI_TOP_OFFSET_PERCENT}%`;
        konfetti.style.backgroundColor = `hsl(${Math.random() * KONFETTI_HUE_RANGE}, 100%, 50%)`;
        konfetti.style.transform = `scale(${Math.random() * KONFETTI_SCALE_RANDOM_FACTOR + KONFETTI_SCALE_MIN})`;
        konfetti.style.animationDelay = `${Math.random() * KONFETTI_ANIMATION_DELAY_MAX_S}s`;
        fragment.appendChild(konfetti);
        elements.push(konfetti);

        const duration = KONFETTI_BASE_DURATION_MS + Math.random() * KONFETTI_RANDOM_DURATION_MS;
        const timeout = setTimeout(() => {
            konfetti.remove();
        }, duration);
        timeouts.push(timeout);
    }

    container.appendChild(fragment);

    // Create and store the cleanup function
    lastKonfettiCleanup = function cleanup() {
        timeouts.forEach(clearTimeout);
        elements.forEach(el => el.remove());
        lastKonfettiCleanup = null;
    };

    return lastKonfettiCleanup;
}

/**
 * Creates a ripple effect on a button.
 * @param {HTMLElement} button - The button element to apply the ripple effect to.
 * @param {MouseEvent} event - The mouse event that triggered the ripple.
 */
export function createRipple(button, event) {
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();

    // Sicheres Positioning/Clipping
    const comp = getComputedStyle(button);
    if (comp.position === "static") button.style.position = "relative";
    button.style.overflow = "hidden";

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left  = `${event.clientX - rect.left - radius}px`;
    circle.style.top   = `${event.clientY - rect.top - radius}px`;
    circle.style.pointerEvents = "none";
    circle.className   = "ripple";

    // Remove any existing ripple before adding the new one
    button.querySelector(".ripple")?.remove();
    button.appendChild(circle);

    // Clean up after the animation ends
    circle.addEventListener("animationend", () => circle.remove(), { once: true });
}
