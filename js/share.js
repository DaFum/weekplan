// Utilities for exporting and printing the week plan
import { getState } from "./state.js";
import { formatDisplayDate } from "./utils.js";

function createDownload(data, filename) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function formatTaskForExport(task) {
    if (!task) return null;
    return {
        id: task.id,
        name: task.name,
        category: task.kategorie,
        date: task.date,
        erledigt: Boolean(task.erledigt),
        durationInMinutes: task.durationInMinutes ?? 0
    };
}

export function exportWeekPlan() {
    const state = getState();
    const tasks = Array.isArray(state.tasks) ? state.tasks.map(formatTaskForExport).filter(Boolean) : [];
    const payload = {
        generatedAt: new Date().toISOString(),
        aktiveWoche: state.aktiveWoche,
        pcStundenGesamt: state.pcStundenGesamt,
        wochenZiel: state.wochenZiel,
        theme: state.theme,
        tasks
    };
    const filename = `weekplan-${new Date().toISOString().slice(0, 10)}.json`;
    createDownload(JSON.stringify(payload, null, 2), filename);
}

export function printWeekPlan() {
    const originalTitle = document.title;
    const printableTitle = getPrintableTitle();
    if (printableTitle) {
        document.title = printableTitle;
    }
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
}

export function getPrintableTitle() {
    const state = getState();
    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    const upcomingTask = tasks
        .filter(task => !task.erledigt && task.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    if (!upcomingTask) {
        return "Wochen-Power";
    }

    try {
        const date = new Date(upcomingTask.date);
        return `${upcomingTask.name} · ${formatDisplayDate(date)}`;
    } catch (error) {
        console.warn("Could not format upcoming task for printable title", error);
        return "Wochen-Power";
    }
}
