import test from "node:test";
import assert from "node:assert/strict";

import { getState, updateState, sanitizeStateUpdate } from "../js/state.js";

test("[Security] sanitizeStateUpdate filters prototype keys", () => {
    const { coins: originalCoins } = getState();

    const sanitized = sanitizeStateUpdate({
        __proto__: { hacked: true },
        coins: originalCoins + 5
    });

    assert.equal(Object.getPrototypeOf(sanitized), null);
    assert.equal(sanitized.coins, originalCoins + 5);
    assert.equal(Object.prototype.hacked, undefined);
});

test("[Security] updateState ignores prototype pollution payloads", () => {
    const { coins: originalCoins } = getState();

    updateState({ __proto__: { poisoned: true }, coins: originalCoins + 1 });

    const { coins } = getState();
    assert.equal(coins, originalCoins + 1);
    assert.equal(Object.prototype.poisoned, undefined);

    updateState({ coins: originalCoins });
});
