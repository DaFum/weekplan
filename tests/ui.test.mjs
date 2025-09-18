import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

process.env.NODE_ENV = "test";

const dom = new JSDOM(`<!DOCTYPE html><body>
    <div id="streak-value">0</div>
    <div id="day-card" class="tag-karte"><span class="score-value"></span></div>
</body>`, { url: "http://localhost" });

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.Node = dom.window.Node;

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
