import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createTestDOM } from "./setup.mjs";

import { getPunkteFuerTag, getCurrentStreak, toggleTask, sanitizeTaskData } from "../js/tasks.js";
import { updateState, getState } from "../js/state.js";
import { getISODate } from "../js/utils.js";

function isoDaysAgo(days) {
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    base.setDate(base.getDate() - days);
    return getISODate(base);
}

const todayISO = isoDaysAgo(0);
const yesterdayISO = isoDaysAgo(1);

let cleanupDOM;

beforeEach(() => {
    ({ cleanup: cleanupDOM } = createTestDOM("<!DOCTYPE html><body><div id='konfetti-container'></div></body>"));
});

afterEach(() => {
    cleanupDOM?.();
    cleanupDOM = undefined;
    updateState({ tasks: [], sounds: {} });
});

test("[Function] getPunkteFuerTag ignores nullish tasks", () => {
    const tasks = [null, undefined, { date: todayISO, erledigt: true }, { date: todayISO, erledigt: false }];
    assert.equal(getPunkteFuerTag(todayISO, tasks), 1);
});

test("[Function] getCurrentStreak handles sparse arrays", () => {
    const tasks = [
        null,
        { date: todayISO, erledigt: true },
        { date: yesterdayISO, erledigt: true },
        { date: "", erledigt: true },
        { date: "2020-01-01", erledigt: false }
    ];
    assert.equal(getCurrentStreak(tasks), 2);
});

test("[Function] toggleTask skips invalid entries", () => {
    updateState({
        sounds: { complete: { triggerAttackRelease: () => {} } },
        tasks: [null, { id: "task-1", date: todayISO, erledigt: false }]
    });

    toggleTask("task-1");

    const { tasks } = getState();
    assert.equal(tasks[0], null);
    assert.equal(tasks[1].erledigt, true);
});

test("[Security] sanitizeTaskData strips unsupported properties", () => {
    const payload = {
        id: "task-123",
        name: "Test",
        kategorie: "schule",
        date: todayISO,
        durationInMinutes: 30,
        erledigt: true,
        extraneous: "nope",
        __proto__: { poisoned: true }
    };

    const sanitized = sanitizeTaskData(payload);

    assert.equal(Object.getPrototypeOf(sanitized), null);
    assert.equal(sanitized.id, "task-123");
    assert.equal(sanitized.name, "Test");
    assert.equal(sanitized.kategorie, "schule");
    assert.equal(sanitized.date, todayISO);
    assert.equal(sanitized.durationInMinutes, 30);
    assert.equal(sanitized.erledigt, true);
    assert.equal(Object.prototype.poisoned, undefined);
});
