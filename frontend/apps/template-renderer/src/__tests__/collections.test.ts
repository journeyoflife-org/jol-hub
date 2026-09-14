/**
 * Collections pure-helper unit tests (STEP 6 — pagination, calendar grid,
 * time splitting). These back the acceptance criteria: "News list paginates
 * correctly (10 items/page)" and "Event calendar shows current month".
 *
 * Run: pnpm --filter @jol-hub/template-renderer test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  paginate,
  buildMonthGrid,
  splitEventsByTime,
  eventsByDate,
  type EventItem,
} from '../lib/collections';

function event(slug: string, startDateTime: string): EventItem {
  return { slug, title: slug, startDateTime };
}

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('splits into 10-item pages (25 items → 3 pages)', () => {
    const result = paginate(items, 1, 10);
    assert.equal(result.totalPages, 3);
    assert.equal(result.total, 25);
    assert.equal(result.items.length, 10);
    assert.equal(result.items[0], 0);
  });

  it('returns the final partial page', () => {
    const result = paginate(items, 3, 10);
    assert.deepEqual(result.items, [20, 21, 22, 23, 24]);
  });

  it('clamps out-of-range pages', () => {
    assert.equal(paginate(items, 99, 10).page, 3);
    assert.equal(paginate(items, 0, 10).page, 1);
    assert.equal(paginate(items, -5, 10).page, 1);
  });

  it('handles an empty collection without dividing by zero', () => {
    const result = paginate([], 1, 10);
    assert.equal(result.total, 0);
    assert.equal(result.totalPages, 1);
    assert.deepEqual(result.items, []);
  });
});

describe('buildMonthGrid', () => {
  it('builds a Monday-first grid for a month starting on Monday (2024-01)', () => {
    const cells = buildMonthGrid(2024, 0);
    assert.equal(cells[0]?.date, '2024-01-01'); // no leading blanks
    assert.equal(cells.length % 7, 0); // rectangular weeks
    assert.ok(cells.some((c) => c.date === '2024-01-31'));
    assert.equal(cells.filter((c) => c.inMonth).length, 31);
  });

  it('adds leading blanks for a month starting mid-week (2024-02 = Thu)', () => {
    const cells = buildMonthGrid(2024, 1);
    // Feb 1 2024 is a Thursday → 3 leading blanks (Mon/Tue/Wed).
    assert.equal(cells[0]?.date, null);
    assert.equal(cells[3]?.date, '2024-02-01');
    assert.equal(cells.filter((c) => c.inMonth).length, 29); // leap year
  });
});

describe('splitEventsByTime', () => {
  const now = new Date('2024-06-15T12:00:00Z');

  it('partitions upcoming vs past and sorts each', () => {
    const events = [
      event('past-late', '2024-06-14T10:00:00Z'),
      event('future-near', '2024-06-16T10:00:00Z'),
      event('past-early', '2024-06-01T10:00:00Z'),
      event('future-far', '2024-07-01T10:00:00Z'),
    ];
    const { upcoming, past } = splitEventsByTime(events, now);
    assert.deepEqual(
      upcoming.map((e) => e.slug),
      ['future-near', 'future-far'], // ascending
    );
    assert.deepEqual(
      past.map((e) => e.slug),
      ['past-late', 'past-early'], // descending (most recent first)
    );
  });

  it('treats an event exactly now as upcoming', () => {
    const { upcoming } = splitEventsByTime([event('now', '2024-06-15T12:00:00Z')], now);
    assert.equal(upcoming.length, 1);
  });
});

describe('eventsByDate', () => {
  it('groups events by ISO date', () => {
    const map = eventsByDate([
      event('a', '2024-06-15T09:00:00Z'),
      event('b', '2024-06-15T18:00:00Z'),
      event('c', '2024-06-16T09:00:00Z'),
    ]);
    assert.equal(map.get('2024-06-15')?.length, 2);
    assert.equal(map.get('2024-06-16')?.length, 1);
    assert.equal(map.get('2024-06-17'), undefined);
  });

  it('skips unparseable dates', () => {
    const map = eventsByDate([event('bad', 'not-a-date')]);
    assert.equal(map.size, 0);
  });
});
