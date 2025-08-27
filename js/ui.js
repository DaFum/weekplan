// Import necessary functions, data, and libraries
import { getState, updateState } from "./state.js";
import { getISODate, getStartOfWeek, formatDisplayDate, formatMinutes, addDays } from "./utils.js";
import { categoryLabels, kategorieDetails, motivationsSprueche } from "./config.js";
import { updateMetaBar } from "./theme.js";
import { getPunkteFuerTag, getCurrentStreak } from "./tasks.js";
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';

// Cache for the last rendered tasks to optimize UI updates
let lastRenderedTasks = [];

/**
 * Executes all initial rendering operations.
 */
export function renderAllUI() {
    const state = getState();
    renderTimeTrackerStructure();
    renderWeeklyGoalTrackerStructure();
    renderStreakTrackerStructure();
    renderPlan(state);
    updateAllTrackers(state);
    updateCoinsDisplay(state);
}

/**
 * Updates the points display for each day card.
 * @param {Object} state - The application state.
 */
export function updatePunkteAnzeige(state) {
    document.querySelectorAll(".tag-karte").forEach(card => {
        const anzeige = card.querySelector(".day-score");
        if (anzeige) anzeige.lastChild.textContent = ` ${getPunkteFuerTag(card.id, state.tasks)}`;
    });
}

/**
 * Updates all trackers in the UI.
 * @param {Object} state - The application state.
 */
function updateAllTrackers(state) {
    updateTimeTracker(state);
    updateWeeklyGoalTracker(state);
    updateStreakTracker(state);
    updatePunkteAnzeige(state);
    updateMetaBar(state);
}

/**
 * Renders the structure of the time tracker.
 */
function renderTimeTrackerStructure() {
    const container = document.getElementById("pc-time-tracker");
    if (!container) return;
    container.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-bold">💻 PC-Spielzeit</h2>
            <button id="pc-time-settings-btn" class="text-secondary hover:text-accent transition p-1 rounded-full hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
        <div class="flex items-center gap-4">
            <div class="relative w-20 h-20">
                <svg class="w-full h-full" viewBox="0 0 36 36">
                    <circle class="text-gray-300 dark:text-gray-600" stroke-width="3" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18" />
                    <circle id="pc-time-progress-ring" class="progress-ring text-green-500" stroke-width="3" stroke-dasharray="94.24777960769379" stroke-dashoffset="94.24777960769379" stroke-linecap="round" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18" style="transform: rotate(-90deg); transform-origin: center;"/>
                </svg>
                <div id="pc-time-progress-text" class="absolute inset-0 flex items-center justify-center text-sm font-bold">0%</div>
            </div>
            <div>
                <div id="pc-time-remaining" class="text-lg font-bold">...</div>
                <div class="text-sm text-secondary">verbleibend</div>
            </div>
        </div>`;
}

/**
 * Updates the time tracker with the current data.
 * @param {Object} state - The application state.
 */
export function updateTimeTracker(state) {
    const { tasks, pcStundenGesamt } = state;
    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 7);
    const usedMinutes = tasks
        .filter(t => t && t.kategorie === "pc" && t.erledigt && t.date >= getISODate(startOfWeek) && t.date < getISODate(endOfWeek))
        .reduce((sum, t) => sum + (t.durationInMinutes || 0), 0);
    const totalMinutes = pcStundenGesamt * 60;
    const remainingMinutes = totalMinutes - usedMinutes;
    const progress = totalMinutes > 0 ? Math.min((usedMinutes / totalMinutes), 1) : 0;
    const ring = document.getElementById("pc-time-progress-ring");
    const r = ring?.r?.baseVal?.value ?? 15;
    const circumference = 2 * Math.PI * r;
    if (ring) {
        ring.style.strokeDasharray = String(circumference);
        ring.style.strokeDashoffset = String(circumference * (1 - progress));
    }
    document.getElementById("pc-time-progress-text").textContent = `${Math.round(progress * 100)}%`;
    document.getElementById("pc-time-remaining").textContent = formatMinutes(remainingMinutes);
}

/**
 * Renders the structure of the weekly goal tracker.
 */
function renderWeeklyGoalTrackerStructure() {
    const container = document.getElementById("weekly-goal-tracker");
    if (!container) return;
    container.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-bold">🎯 Wochenziel</h2>
            <button id="weekly-goal-settings-btn" class="text-secondary hover:text-accent transition p-1 rounded-full hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
        <div id="weekly-goal-text" class="text-lg font-bold mb-2">0 / 0 Aufgaben</div>
        <div class="progress-container bg-gray-200 dark:bg-gray-700">
            <div id="weekly-goal-progress-bar" class="progress-bar bg-blue-500" style="width: 0%"></div>
        </div>`;
}

/**
 * Updates the weekly goal tracker with the current data.
 * @param {Object} state - The application state.
 */
export function updateWeeklyGoalTracker(state) {
    const { tasks, wochenZiel } = state;
    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 7);
    const tasksDone = tasks.filter(t => t.erledigt && t.date >= getISODate(startOfWeek) && t.date < getISODate(endOfWeek)).length;
    const progress = wochenZiel > 0 ? Math.min((tasksDone / wochenZiel) * 100, 100) : 0;

    document.getElementById("weekly-goal-text").textContent = `${tasksDone} / ${wochenZiel} Aufgaben`;
    document.getElementById("weekly-goal-progress-bar").style.width = `${progress}%`;
}

/**
 * Renders the structure of the streak tracker.
 */
function renderStreakTrackerStructure() {
    const container = document.getElementById("streak-tracker");
    if (!container) return;
    container.innerHTML = `
        <h2 class="text-lg font-bold mb-2">🔥 Streak</h2>
        <div id="streak-value" class="text-3xl font-black text-orange-500">0</div>
        <div class="text-sm text-secondary">Tage in Folge</div>`;
}

/**
 * Updates the streak tracker with the current data.
 * @param {Object} state - The application state.
 */
export function updateStreakTracker(state) {
    document.getElementById("streak-value").textContent = getCurrentStreak(state.tasks);
}

/**
 * Renders the main plan view, including week navigation and day cards.
 * @param {Object} state - The application state.
 */
export function renderPlan(state) {
    const { aktiveWoche } = state;
    const wochenContainer = document.getElementById("wochen-container");
    const wochenNav = document.getElementById("wochen-nav");
    wochenContainer.innerHTML = "";
    wochenNav.innerHTML = "";
    const startOfCurrentWeek = getStartOfWeek(new Date());
    const todayISO = getISODate(new Date());

    for (let week = 0; week < 4; week++) {
        const weekStart = new Date(startOfCurrentWeek); weekStart.setDate(weekStart.getDate() + week * 7);
        const navBtn = document.createElement("button");
        navBtn.innerHTML = `Woche ${week + 1}`;
        navBtn.className = "nav-button";
        navBtn.dataset.weekIndex = week;
        wochenNav.appendChild(navBtn);

        const wochenAnsicht = document.createElement("div");
        wochenAnsicht.id = `woche-${week}`;
        wochenAnsicht.className = "wochen-ansicht hidden";

        const tagesContainer = document.createElement("div");
        tagesContainer.className = "tag-container flex overflow-x-auto pb-4 space-x-4 px-1";

        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(weekStart); currentDate.setDate(currentDate.getDate() + day);
            const isoDate = getISODate(currentDate);
            const isToday = isoDate === todayISO;

            const tagesKarte = document.createElement("div");
            tagesKarte.id = isoDate;
            tagesKarte.className = `tag-karte p-5 rounded-2xl shadow-lg ${isToday ? "today-card" : ""}`;

            tagesKarte.innerHTML = `
                <div class="day-header">
                    <div>
                        <h3 class="day-title">${formatDisplayDate(currentDate).split(",")[0]}</h3>
                        <div class="day-date">${formatDisplayDate(currentDate).split(",")[1]}</div>
                    </div>
                    <div class="day-score"><span class="text-yellow-500">⭐</span> 0</div>
                </div>
                <div id="aufgaben-liste-${isoDate}" class="tasks-container space-y-3"></div>`;
            tagesContainer.appendChild(tagesKarte);
        }
        wochenAnsicht.appendChild(tagesContainer);
        wochenContainer.appendChild(wochenAnsicht);
    }
    renderAllTasks(state.tasks);
    showWoche(aktiveWoche);
    initSortable();
}

/**
 * Shows a specific week in the plan view.
 * @param {number} index - The index of the week to show.
 */
export function showWoche(index) {
    updateState({ aktiveWoche: index });
    document.querySelectorAll(".wochen-ansicht").forEach(el => el.classList.add("hidden"));
    document.getElementById(`woche-${index}`).classList.remove("hidden");
    document.querySelectorAll(".nav-button").forEach(btn => {
        const isActive = parseInt(btn.dataset.weekIndex) === index;
        btn.classList.toggle("bg-indigo-600", isActive);
        btn.classList.toggle("text-white", isActive);
        btn.classList.toggle("bg-accent", !isActive);
        btn.classList.toggle("text-secondary", !isActive);
    });
}

/**
 * Renders all tasks for all days.
 * @param {Array} tasks - The array of tasks.
 */
function renderAllTasks(tasks) {
    lastRenderedTasks = tasks;
    document.querySelectorAll('[id^="aufgaben-liste-"]').forEach(list => {
        list.innerHTML = "";
        const isoDate = list.id.replace("aufgaben-liste-", "");
        const tasksForDay = tasks.filter(t => t.date === isoDate);
        if (tasksForDay.length === 0) {
            list.innerHTML = createEmptyState();
        } else {
            tasksForDay.forEach(task => list.appendChild(createTaskElement(task)));
        }
    });
}

/**
 * Updates the tasks UI based on the changes in the state.
 * @param {Object} state - The application state.
 */
export function updateTasksUI(state) {
    const newTasks = state.tasks;
    const addedTasks = newTasks.filter(newTask => !lastRenderedTasks.some(oldTask => oldTask.id === newTask.id));
    const deletedTasks = lastRenderedTasks.filter(oldTask => !newTasks.some(newTask => newTask.id === oldTask.id));
    const updatedTasks = newTasks.filter(newTask => {
        const oldTask = lastRenderedTasks.find(old => old.id === newTask.id);
        return oldTask && JSON.stringify(newTask) !== JSON.stringify(oldTask);
    });

    addedTasks.forEach(task => addTaskToDOM(task));
    deletedTasks.forEach(task => removeTaskFromDOM(task.id));
    updatedTasks.forEach(task => updateTaskInDOM(task));

    lastRenderedTasks = [...newTasks];
    updateAllTrackers(state);
}

/**
 * Adds a task to the DOM.
 * @param {Object} task - The task object to add.
 */
function addTaskToDOM(task) {
    const list = document.getElementById(`aufgaben-liste-${task.date}`);
    if (!list) return;

    const emptyState = list.querySelector(".empty-tasks");
    if (emptyState) emptyState.remove();

    list.appendChild(createTaskElement(task));
}

/**
 * Removes a task from the DOM.
 * @param {string} taskId - The ID of the task to remove.
 */
function removeTaskFromDOM(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        const list = taskElement.parentElement;
        taskElement.remove();
        if (list && list.children.length === 0) {
            list.innerHTML = createEmptyState();
        }
    }
}

/**
 * Updates a task in the DOM.
 * @param {Object} task - The task object to update.
 */
function updateTaskInDOM(task) {
    const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
    if (taskElement) {
        taskElement.replaceWith(createTaskElement(task));
    }
}

/**
 * Creates the HTML for an empty state message.
 * @returns {string} The HTML string for the empty state.
 */
function createEmptyState() {
    return `<div class="empty-tasks">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="empty-tasks-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="empty-tasks-title">Keine Aufgaben!</p>
                <p class="empty-tasks-text">Füge eine neue Aufgabe hinzu.</p>
            </div>`;
}

/**
 * Initializes the sortable functionality for task lists.
 */
function initSortable() {
    document.querySelectorAll('[id^="aufgaben-liste-"]').forEach(list => {
        if (list.dataset.sortableInit === "1") return;
        new Sortable(list, {
            animation: 150,
            ghostClass: "opacity-50",
            onEnd: (evt) => {
                const { tasks } = getState();
                const newIndex = evt.newIndex;
                const oldIndex = evt.oldIndex;
                const isoDate = list.id.replace("aufgaben-liste-", "");
                const tasksForDay = tasks.filter(t => t && t.date === isoDate);
                const otherTasks = tasks.filter(t => t && t.date !== isoDate);
                const taskToMove = tasksForDay.splice(oldIndex, 1)[0];
                if (taskToMove) {
                    tasksForDay.splice(newIndex, 0, taskToMove);
                }
                updateState({ tasks: [...otherTasks, ...tasksForDay] });
            }
        });
        list.dataset.sortableInit = "1";
    });
}

/**
 * Creates a task element for the DOM.
 * @param {Object} task - The task object.
 * @returns {HTMLElement} The created task element.
 */
function createTaskElement(task) {
    const details = kategorieDetails[task.kategorie] || {
        icon: "📝",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    };
    const element = document.createElement("div");
    element.className = `task-card ${task.erledigt ? "completed" : ""}`;
    element.dataset.taskId = task.id;

    element.innerHTML = `
        <div class="flex items-start">
            <div class="mr-3 text-xl">${details.icon}</div>
            <div class="flex-grow">
                <div class="task-name"></div>
                <div class="flex items-center gap-2 text-sm text-secondary mt-1">
                    <span class="task-category-badge ${details.color}">
                        ${categoryLabels?.[task.kategorie] ?? task.kategorie}
                    </span>
                    ${task.durationInMinutes ? `
                    <span class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" /></svg>
                        ${task.durationInMinutes} Min
                    </span>` : ""}
                </div>
            </div>
        </div>
        <div class="task-actions mt-3 flex justify-end">
            <button data-action="edit" class="task-card-button text-secondary hover:bg-border-color relative overflow-hidden" aria-label="Bearbeiten">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                </svg>
            </button>
            <button data-action="toggle-complete" class="task-card-button ${task.erledigt ? "bg-green-500" : "border-2 border-current"} text-white font-bold text-lg relative overflow-hidden" aria-label="${task.erledigt ? "Erledigt" : "Als erledigt markieren"}">
                ${task.erledigt ? "✓" : ""}
            </button>
            <button data-action="delete" class="task-card-button text-secondary hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600 relative overflow-hidden" aria-label="Löschen">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                </svg>
            </button>
        </div>
    `;
    // Securely set the task name
    element.querySelector(".task-name").textContent = String(task.name ?? "");
    return element;
}

/**
 * Scrolls the view to the current day.
 */
export function scrollToCurrentDay() {
    const todayEl = document.querySelector(".today-card");
    if (todayEl) {
        const container = todayEl.parentElement;
        if (container.classList.contains("flex")) {
            container.scrollTo({ left: todayEl.offsetLeft - container.getBoundingClientRect().width * 0.05, behavior: "smooth" });
        }
    }
}

/**
 * Updates the coins display.
 * @param {Object} state - The application state.
 */
export function updateCoinsDisplay(state) {
    const el = document.getElementById("coins-count");
    if (el) el.textContent = state.coins;
}

/**
 * Updates the motivational quote.
 */
export const updateMotivationsspruch = () => {
    const el = document.getElementById("motivations-spruch");
    if (el) el.textContent = motivationsSprueche[Math.floor(Math.random() * motivationsSprueche.length)];
}

/**
 * Renders the task modal.
 * @param {Object} state - The application state.
 * @param {string|null} taskId - The ID of the task to edit, or null for a new task.
 */
export function renderTaskModal(state, taskId = null) {
    const { tasks } = state;
    const form = document.getElementById("task-form");
    if (form) form.reset();

    const title = document.getElementById("modal-title");
    const idInput = document.getElementById("task-id");
    const nameInput = document.getElementById("task-name");
    const durationInput = document.getElementById("task-duration");
    const taskDateSelect = document.getElementById("task-date");

    const taskToEdit = taskId && Array.isArray(tasks) ? tasks.find(t => t && t.id === taskId) : null;

    if (taskToEdit) {
        if (title) title.textContent = "Aufgabe bearbeiten";
        if (idInput) idInput.value = taskToEdit.id;
        if (nameInput) nameInput.value = taskToEdit.name;

        if (taskToEdit.kategorie) {
            const radio = document.querySelector(`input[name="kategorie"][value="${taskToEdit.kategorie}"]`);
            if (radio) radio.checked = true;
        }

        if (taskToEdit.kategorie === "pc" && durationInput) {
            durationInput.value = taskToEdit.durationInMinutes;
        }
    } else {
        if (title) title.textContent = "Neue Aufgabe erstellen";
        if (idInput) idInput.value = "";
    }

    if (taskDateSelect) {
        taskDateSelect.innerHTML = "";
        const now = new Date();
        const startOfWeek = getStartOfWeek(now);
        const todayISO = getISODate(now);

        for (let week = 0; week < 4; week++) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = `Woche ${week + 1}`;
            for (let day = 0; day < 7; day++) {
                const currentDate = addDays(startOfWeek, week * 7 + day);
                const isoDate = getISODate(currentDate);
                const option = document.createElement("option");
                option.value = isoDate;
                option.textContent = formatDisplayDate(currentDate);

                if (taskToEdit) {
                    option.selected = (isoDate === taskToEdit.date);
                } else {
                    option.selected = (isoDate === todayISO);
                }
                optgroup.appendChild(option);
            }
            taskDateSelect.appendChild(optgroup);
        }
    }

    if (document.querySelector('input[name="kategorie"]')) {
      setupRadioStyling();
    }
}

/**
 * Sets up the styling for the category radio buttons.
 */
function setupRadioStyling() {
    const radios = document.querySelectorAll('input[name="kategorie"]');
    const durationContainer = document.getElementById("pc-duration-container");
    const update = () => {
        const selected = document.querySelector('input[name="kategorie"]:checked')?.value;
        durationContainer.classList.toggle("hidden", selected !== "pc");
        radios.forEach(r => {
            const d = r.nextElementSibling;
            const isActive = r.checked;
            d.classList.toggle("active", isActive);
            d.classList.toggle("bg-indigo-600", isActive);
            d.classList.toggle("border-indigo-500", isActive);
            d.classList.toggle("text-white", isActive);
            d.classList.toggle("font-bold", isActive);
            d.classList.toggle("border-border-color", !isActive);
        });
    };
    radios.forEach(radio => radio.addEventListener("change", update));
    update();
}
