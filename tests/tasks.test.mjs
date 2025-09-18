import test from "node:test";
import assert from "node:assert/strict";

import { createTestDOM } from "./setup.mjs";

createTestDOM("<!DOCTYPE html><body><div id='konfetti-container'></div></body>");

import { getPunkteFuerTag, getCurrentStreak, toggleTask } from "../js/tasks.js";
import { updateState, getState } from "../js/state.js";

const todayISO = new Date().toISOString().slice(0, 10);

test("[Function] getPunkteFuerTag ignores nullish tasks", () => {
    const tasks = [null, undefined, { date: todayISO, erledigt: true }, { date: todayISO, erledigt: false }];
    assert.equal(getPunkteFuerTag(todayISO, tasks), 1);
});

test("[Function] getCurrentStreak handles sparse arrays", () => {
    const tasks = [
        null,
        { date: todayISO, erledigt: true },
        { date: "", erledigt: true },
        { date: "2020-01-01", erledigt: false }
    ];
    assert.equal(getCurrentStreak(tasks) >= 1, true);
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

    // Cleanup
    updateState({ tasks: [] });
});
