import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseLocalISODate } from '../js/utils.js';

describe('parseLocalISODate', () => {
  it('parses valid ISO date strings in local time', () => {
    const date = parseLocalISODate('2024-03-15');
    assert.ok(date instanceof Date);
    assert.equal(date.getFullYear(), 2024);
    assert.equal(date.getMonth(), 2);
    assert.equal(date.getDate(), 15);
  });

  it('returns null for non-string inputs', () => {
    assert.equal(parseLocalISODate(12345), null);
    assert.equal(parseLocalISODate(undefined), null);
    assert.equal(parseLocalISODate(null), null);
  });

  it('rejects malformed strings', () => {
    assert.equal(parseLocalISODate('2024/03/15'), null);
    assert.equal(parseLocalISODate('15-03-2024'), null);
    assert.equal(parseLocalISODate(''), null);
    assert.equal(parseLocalISODate('2024-3-5'), null);
  });

  it('rejects impossible calendar dates', () => {
    assert.equal(parseLocalISODate('2024-02-30'), null);
    assert.equal(parseLocalISODate('2023-13-01'), null);
    assert.equal(parseLocalISODate('2023-00-10'), null);
  });

  it('parses valid leap-day dates', () => {
    const leapDay = parseLocalISODate('2024-02-29');
    assert.ok(leapDay instanceof Date);
    assert.equal(leapDay.getFullYear(), 2024);
    assert.equal(leapDay.getMonth(), 1);
    assert.equal(leapDay.getDate(), 29);
  });
});
