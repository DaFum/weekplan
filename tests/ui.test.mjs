import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createTestDOM } from "./setup.mjs";

let cleanupDOM;

beforeEach(() => {
    ({ cleanup: cleanupDOM } = createTestDOM(`<!DOCTYPE html><body>
        <div id="streak-value">0</div>
        <div id="day-card" class="tag-karte"><span class="score-value"></span></div>
    </body>`));
});

afterEach(() => {
    cleanupDOM?.();
    cleanupDOM = undefined;
});

test("[UI] updateStreakTracker renders streak for sparse tasks", async () => {
    const { updateStreakTracker } = await import("../js/ui.js");

    const tasks = [null, { date: new Date().toISOString().slice(0, 10), erledigt: true }];
    updateStreakTracker({ tasks });

    const streakEl = document.getElementById("streak-value");
    assert.ok(streakEl);
    assert.equal(Number.parseInt(streakEl.textContent, 10) >= 1, true);
});

test("[UI] updatePunkteAnzeige counts only valid tasks", async () => {
    const { updatePunkteAnzeige } = await import("../js/ui.js");

    const today = new Date().toISOString().slice(0, 10);
    const card = document.getElementById("day-card");
    card.id = today;
    const state = {
        tasks: [null, { date: today, erledigt: true }, { date: today, erledigt: false }]
    };

    updatePunkteAnzeige(state);

    const scoreEl = document.querySelector(".score-value");
    assert.ok(scoreEl);
    assert.equal(scoreEl.textContent.trim(), "1");
});
