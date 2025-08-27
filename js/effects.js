export function starteKonfetti(container = document.body) {
    const timeouts = [];
    const elements = [];

    for (let i = 0; i < 50; i++) {
        const konfetti = document.createElement("div");
        konfetti.className = "konfetti"; // Assume CSS class handles animation
        konfetti.style.position = "absolute";
        konfetti.style.left = `${Math.random() * 100}%`;
        konfetti.style.top = `${Math.random() * 100 - 20}%`;
        konfetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        konfetti.style.transform = `scale(${Math.random() * 0.75 + 0.25})`;
        konfetti.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(konfetti);
        elements.push(konfetti);

        const timeout = setTimeout(() => {
            konfetti.remove();
        }, 3000 + Math.random() * 2000);
        timeouts.push(timeout);
    }

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
