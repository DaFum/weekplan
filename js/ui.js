import { getState, updateState } from './state.js';
import { getISODate, getStartOfWeek, formatDisplayDate, formatMinutes } from './utils.js';
import { kategorieDetails } from './config.js';
import { deleteTask } from './tasks.js';
import { updateMetaBar } from './theme.js';

/**
 * Rendert die gesamte Benutzeroberfläche neu.
 */
export function renderAllUI() {
    renderTimeTracker();
    renderWeeklyGoalTracker();
    renderStreakTracker();
    renderPlan();
    updateCoinsDisplay();
    updateMetaBar();
}

/**
 * Rendert die PC-Zeit-Übersicht für die aktuelle Woche.
 */
export function renderTimeTracker() {
    const { tasks, pcStundenGesamt } = getState();
    const container = document.getElementById('pc-time-tracker');
    if (!container) return;

    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const usedMinutes = tasks
        .filter(t => t && t.kategorie === 'pc' && t.erledigt && t.date >= getISODate(startOfWeek) && t.date < getISODate(endOfWeek))
        .reduce((sum, t) => sum + (t.durationInMinutes || 0), 0);

    const totalMinutes = pcStundenGesamt * 60;
    const remainingMinutes = totalMinutes - usedMinutes;
    const progress = totalMinutes > 0 ? Math.min((usedMinutes / totalMinutes), 1) : 0;
    const circumference = 30 * 2 * Math.PI;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-bold">💻 PC-Spielzeit</h2>
            <button id="pc-time-settings-btn" class="text-secondary hover:text-accent transition p-1 rounded-full hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
        <div class="flex items-center gap-4">
            <div class="relative w-20 h-20">
                <svg class="w-full h-full" viewBox="0 0 36 36">
                    <circle class="text-gray-300 dark:text-gray-600" stroke-width="3" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18" />
                    <circle class="progress-ring text-green-500" stroke-width="3" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - progress)}" stroke-linecap="round" stroke="currentColor" fill="transparent" r="15" cx="18" cy="18" style="transform: rotate(-90deg); transform-origin: center;"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center text-sm font-bold">${Math.round(progress * 100)}%</div>
            </div>
            <div>
                <div class="text-lg font-bold">${formatMinutes(remainingMinutes)}</div>
                <div class="text-sm text-secondary">verbleibend</div>
            </div>
        </div>`;
}

/**
 * Rendert den Wochenziel-Tracker.
 */
export function renderWeeklyGoalTracker() {
    const { tasks, wochenZiel } = getState();
    const container = document.getElementById('weekly-goal-tracker');
    if (!container) return;

    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const tasksDone = tasks.filter(t => t.erledigt && t.date >= getISODate(startOfWeek) && t.date < getISODate(endOfWeek)).length;
    const progress = wochenZiel > 0 ? Math.min((tasksDone / wochenZiel) * 100, 100) : 0;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-lg font-bold">🎯 Wochenziel</h2>
            <button id="weekly-goal-settings-btn" class="text-secondary hover:text-accent transition p-1 rounded-full hover:bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
        <div class="text-lg font-bold mb-2">${tasksDone} / ${wochenZiel} Aufgaben</div>
        <div class="progress-container bg-gray-200 dark:bg-gray-700">
            <div class="progress-bar bg-blue-500" style="width: ${progress}%"></div>
        </div>`;
}

/**
 * Rendert den Streak-Tracker.
 */
export function renderStreakTracker() {
    const container = document.getElementById('streak-tracker');
    if (!container) return;
    const streak = getCurrentStreak();
    container.innerHTML = `
        <h2 class="text-lg font-bold mb-2">🔥 Streak</h2>
        <div class="text-3xl font-black text-orange-500">${streak}</div>
        <div class="text-sm text-secondary">Tage in Folge</div>`;
}

/**
 * Rendert den Wochenplan und die Navigation.
 */
export function renderPlan() {
    const { aktiveWoche } = getState();
    const wochenContainer = document.getElementById('wochen-container');
    const wochenNav = document.getElementById('wochen-nav');
    if (!wochenContainer || !wochenNav) return;

    wochenContainer.innerHTML = '';
    wochenNav.innerHTML = '';
    const startOfCurrentWeek = getStartOfWeek(new Date());
    const todayISO = getISODate(new Date());

    for (let week = 0; week < 4; week++) {
        const weekStart = new Date(startOfCurrentWeek);
        weekStart.setDate(weekStart.getDate() + week * 7);
        const navBtn = document.createElement('button');
        navBtn.innerHTML = `Woche ${week + 1}`;
        navBtn.className = 'nav-button';
        navBtn.dataset.weekIndex = week;
        wochenNav.appendChild(navBtn);

        const wochenAnsicht = document.createElement('div');
        wochenAnsicht.id = `woche-${week}`;
        wochenAnsicht.className = 'wochen-ansicht'; // Is visible by default now

        const tagesContainer = document.createElement('div');
        tagesContainer.className = 'tag-container flex overflow-x-auto pb-4 space-x-4 px-1';

        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(currentDate.getDate() + day);
            const isoDate = getISODate(currentDate);
            const isToday = isoDate === todayISO;

            const tagesKarte = document.createElement('div');
            tagesKarte.id = isoDate;
            tagesKarte.className = `tag-karte p-5 rounded-2xl shadow-lg ${isToday ? 'today-card' : ''}`;
            tagesKarte.innerHTML = `
                <div class="day-header">
                    <div>
                        <h3 class="day-title">${formatDisplayDate(currentDate).split(',')[0]}</h3>
                        <div class="day-date">${formatDisplayDate(currentDate).split(',')[1]}</div>
                    </div>
                    <div class="day-score"><span class="text-yellow-500">⭐</span> ${getPunkteFuerTag(isoDate)}</div>
                </div>
                <div id="aufgaben-liste-${isoDate}" class="tasks-container space-y-3"></div>`;
            tagesContainer.appendChild(tagesKarte);
        }
        wochenAnsicht.appendChild(tagesContainer);
        wochenContainer.appendChild(wochenAnsicht);
    }

    renderAllTasks();
    showWoche(aktiveWoche);
}

/**
 * Zeigt die korrekte Woche an.
 */
export function showWoche(index) {
    const wochenAnsicht = document.getElementById(`woche-${index}`);
    if (!wochenAnsicht) return;

    document.querySelectorAll('.wochen-ansicht').forEach((el, i) => {
        el.classList.toggle('hidden', i !== index);
    });
    document.querySelectorAll('.nav-button').forEach(btn => {
        const isActive = parseInt(btn.dataset.weekIndex) === index;
        btn.classList.toggle('bg-indigo-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-accent', !isActive);
        btn.classList.toggle('text-secondary', !isActive);
    });
}

/**
 * Rendert alle Aufgabenlisten im DOM und initialisiert Drag & Drop.
 */
export function renderAllTasks() {
    const { tasks } = getState();
    document.querySelectorAll('[id^="aufgaben-liste-"]').forEach(list => {
        list.innerHTML = '';
        const isoDate = list.id.replace('aufgaben-liste-', '');
        const tasksForDay = tasks.filter(t => t.date === isoDate);
        if (tasksForDay.length === 0) {
            list.innerHTML = `
                <div class="empty-tasks">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="empty-tasks-icon">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="empty-tasks-title">Keine Aufgaben!</p>
                    <p class="empty-tasks-text">Füge eine neue Aufgabe hinzu.</p>
                </div>`;
        } else {
            tasksForDay.forEach(task => list.appendChild(createTaskElement(task)));
        }
    });

    document.querySelectorAll('[id^="aufgaben-liste-"]').forEach(list => {
        if (list.dataset.sortableInit === '1') return;
        new Sortable(list, {
            animation: 150,
            ghostClass: 'opacity-50',
            onEnd: (evt) => {
                const { tasks } = getState();
                const newIndex = evt.newIndex;
                const oldIndex = evt.oldIndex;
                const isoDate = list.id.replace('aufgaben-liste-', '');
                const tasksForDay = tasks.filter(t => t && t.date === isoDate);
                const otherTasks = tasks.filter(t => t && t.date !== isoDate);
                const taskToMove = tasksForDay.splice(oldIndex, 1)[0];
                if (taskToMove) {
                    tasksForDay.splice(newIndex, 0, taskToMove);
                }
                updateState({ tasks: [...otherTasks, ...tasksForDay] });
            }
        });
        list.dataset.sortableInit = '1';
    });

    updatePunkteAnzeige();
}

/**
 * Erzeugt ein DOM-Element für eine Aufgabenkarte.
 */
function createTaskElement(task) {
    const details = kategorieDetails[task.kategorie];
    if (!details) {
        console.warn(`Unbekannte Kategorie: ${task.kategorie}`);
        return document.createDocumentFragment(); // Return an empty element
    }
    const element = document.createElement('div');
    element.className = `task-card ${task.erledigt ? 'completed' : ''}`;
    element.dataset.taskId = task.id;

    element.innerHTML = `
        <div class="flex items-start">
            <div class="mr-3 text-xl">${details.icon}</div>
            <div class="flex-grow">
                <div class="task-name">${task.name}</div>
                ${task.kategorie === 'pc' && task.durationInMinutes ? `<span class="task-duration">(${task.durationInMinutes} Min)</span>` : ''}
                <div class="task-category-badge ${details.color}">${{schule: 'Schule', pc: 'PC-Zeit', sonstiges: 'Freizeit'}[task.kategorie] || task.kategorie}</div>
            </div>
        </div>
        <div class="task-actions mt-3 flex justify-end">
            <button class="task-card-button text-secondary hover:bg-border-color relative overflow-hidden" aria-label="Bearbeiten" data-action="edit">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
            </button>
            <button class="task-card-button ${task.erledigt ? 'bg-green-500' : 'border-2 border-current'} text-white font-bold text-lg relative overflow-hidden" aria-label="${task.erledigt ? 'Erledigt' : 'Als erledigt markieren'}" data-action="toggle">
                ${task.erledigt ? '✓' : ''}
            </button>
            <button class="task-card-button text-secondary hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600 relative overflow-hidden" aria-label="Löschen" data-action="delete">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
            </button>
        </div>`;
    return element;
}

/**
 * Gibt die Anzahl der an einem bestimmten Tag erledigten Aufgaben zurück.
 */
export function getPunkteFuerTag(isoDate) {
    const { tasks } = getState();
    return tasks.filter(t => t.date === isoDate && t.erledigt).length;
}

/**
 * Aktualisiert die Punktezahlen in allen Tageskarten.
 */
export function updatePunkteAnzeige() {
    document.querySelectorAll('.tag-karte').forEach(card => {
        const anzeige = card.querySelector('.day-score');
        if (anzeige) anzeige.innerHTML = `<span class="text-yellow-500">⭐</span> ${getPunkteFuerTag(card.id)}`;
    });
}

/**
 * Scrollt die horizontale Tagesliste so, dass der heutige Tag sichtbar wird.
 */
export function scrollToCurrentDay() {
    const todayEl = document.querySelector('.today-card');
    if (todayEl) {
        const container = todayEl.parentElement;
        if(container && container.classList.contains('flex')){
            container.scrollTo({ left: todayEl.offsetLeft - container.getBoundingClientRect().width * 0.05, behavior: 'smooth' });
        }
    }
}


/**
 * Startet eine Konfetti-Animation.
 */
export function starteKonfetti() {
    const { sounds } = getState();
    if (sounds && sounds.confetti && typeof sounds.confetti.triggerAttackRelease === "function") {
        sounds.confetti.triggerAttackRelease("G4", "0.4");
    }
    const container = document.getElementById('konfetti-container');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
        const konfetti = document.createElement('div');
        konfetti.className = 'konfetti-stueck';
        konfetti.style.left = `${Math.random() * 100}vw`;
        konfetti.style.animationDelay = `${Math.random() * 2}s`;
        konfetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
        konfetti.style.transform = `scale(${Math.random() * 0.7 + 0.5})`;
        container.appendChild(konfetti);
        setTimeout(() => konfetti.remove(), 3000);
    }
}

/**
 * Aktualisiert die Münzanzeige.
 */
export function updateCoinsDisplay() {
    const { coins } = getState();
    const el = document.getElementById('coins-count');
    if (el) {
        el.textContent = coins;
    }
}

/**
 * Aktualisiert den Motivationsspruch.
 */
export const updateMotivationsspruch = () => {
    const el = document.getElementById('motivations-spruch');
    if (el) {
        el.textContent = motivationsSprueche[Math.floor(Math.random() * motivationsSprueche.length)];
    }
};

/**
 * Berechnet die aktuelle Tagesserie.
 */
export function getCurrentStreak() {
    const { tasks } = getState();
    const erledigteTasks = tasks.filter(t => t.erledigt && t.date);
    if (erledigteTasks.length === 0) return 0;

    const erledigteDaten = [...new Set(erledigteTasks.map(t => t.date))].sort().reverse();

    let streak = 0;
    let heute = new Date();
    heute.setHours(12, 0, 0, 0);

    for (let i = 0; i < erledigteDaten.length; i++) {
        const datum = new Date(erledigteDaten[i]);
        datum.setHours(12, 0, 0, 0);

        const erwartetesDatum = new Date(heute);
        erwartetesDatum.setDate(heute.getDate() - streak);

        if (datum.getTime() === erwartetesDatum.getTime()) {
            streak++;
        } else {
            // Check if the streak starts today
            const heuteDatum = new Date(heute);
            const ersterTag = new Date(erledigteDaten[0]);
            heuteDatum.setHours(12, 0, 0, 0);
            ersterTag.setHours(12, 0, 0, 0);
            if (ersterTag.getTime() !== heuteDatum.getTime()) {
                // if the most recent day is not today, the streak is 0
                return 0;
            }
            break;
        }
    }
    return streak;
}
