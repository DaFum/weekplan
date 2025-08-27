// Konfetti effect configuration
const KONFETTI_COUNT = 50;
const KONFETTI_HUE_RANGE = 360;
const KONFETTI_SCALE_RANDOM_FACTOR = 0.75;
const KONFETTI_SCALE_MIN = 0.25;
const KONFETTI_ANIMATION_DELAY_MAX_S = 3;
const KONFETTI_BASE_DURATION_MS = 3000;
const KONFETTI_RANDOM_DURATION_MS = 2000;
const KONFETTI_POSITION_PERCENT_RANGE = 100;
const KONFETTI_TOP_OFFSET_PERCENT = 20;

export function starteKonfetti(container = document.body) {
    const timeouts = [];
    const elements = [];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < KONFETTI_COUNT; i++) {
        const konfetti = document.createElement("div");
        konfetti.className = "konfetti"; // Assume CSS class handles animation
        konfetti.style.position = "absolute";
        konfetti.style.left = `${Math.random() * KONFETTI_POSITION_PERCENT_RANGE}%`;
        konfetti.style.top = `${Math.random() * KONFETTI_POSITION_PERCENT_RANGE - KONFETTI_TOP_OFFSET_PERCENT}%`;
        konfetti.style.backgroundColor = `hsl(${Math.random() * KONFETTI_HUE_RANGE}, 100%, 50%)`;
        konfetti.style.transform = `scale(${Math.random() * KONFETTI_SCALE_RANDOM_FACTOR + KONFETTI_SCALE_MIN})`;
        konfetti.style.animationDelay = `${Math.random() * KONFETTI_ANIMATION_DELAY_MAX_S}s`;
        fragment.appendChild(konfetti);
        elements.push(konfetti);

        const timeout = setTimeout(() => {
            konfetti.remove();
            const index = timeouts.indexOf(timeout);
            if (index > -1) {
                timeouts.splice(index, 1);
            }
        }, KONFETTI_BASE_DURATION_MS + Math.random() * KONFETTI_RANDOM_DURATION_MS);
        timeouts.push(timeout);
    }

    container.appendChild(fragment);

    return function cleanup() {
        timeouts.forEach(clearTimeout);
        elements.forEach(el => el.remove());
    };
}

export function createRipple(button, event) {
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left  = `${event.clientX - rect.left - radius}px`;
    circle.style.top   = `${event.clientY - rect.top - radius}px`;
    circle.className   = "ripple";

    // Remove any existing ripple before adding the new one
    button.querySelector(".ripple")?.remove();
    button.appendChild(circle);

    // Clean up after the animation ends
    circle.addEventListener("animationend", () => circle.remove(), { once: true });
}
