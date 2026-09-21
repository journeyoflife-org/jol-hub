import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MassScheduleBlockSchema, ScheduleBlockSchema } from '../schema';

describe('MassScheduleBlockSchema — RRULE (v2)', () => {
  it('accepts a mass with rrule', () => {
    const result = MassScheduleBlockSchema.safeParse({
      type: 'massSchedule',
      heading: { lt: 'Mišios' },
      masses: [
        {
          day: { lt: 'Sekmadienis', en: 'Sunday' },
          time: '10:00',
          rrule: 'FREQ=WEEKLY;BYDAY=SU',
          validFrom: '2026-01-01',
          language: 'lt',
        },
      ],
    });
    if (!result.success) console.error(result.error);
    assert.ok(result.success);
  });

  it('rejects a mass without rrule', () => {
    const result = MassScheduleBlockSchema.safeParse({
      type: 'massSchedule',
      heading: { lt: 'Mišios' },
      masses: [{ day: { lt: 'Pirmadienis' }, time: '08:00' }],
    });
    assert.ok(!result.success);
  });

  it('validates RRULE format (FREQ= required)', () => {
    const result = MassScheduleBlockSchema.safeParse({
      type: 'massSchedule',
      heading: { lt: 'Mišios' },
      masses: [
        {
          day: { lt: 'Sekmadienis' },
          time: '10:00',
          rrule: 'NOT-A-VALID-RRULE',
        },
      ],
    });
    assert.ok(!result.success);
  });
});

describe('ScheduleBlockSchema — RRULE (v2)', () => {
  it('accepts schedule entries with LocalizedText day and optional rrule', () => {
    const result = ScheduleBlockSchema.safeParse({
      type: 'schedule',
      heading: { lt: 'Tvarkaraštis' },
      entries: [
        {
          day: { lt: 'Pirmadienis', en: 'Monday' },
          times: ['09:00', '18:00'],
          rrule: 'FREQ=WEEKLY;BYDAY=MO',
          validFrom: '2026-01-01',
        },
      ],
    });
    if (!result.success) console.error(result.error);
    assert.ok(result.success);
  });

  it('accepts schedule entries without rrule (optional)', () => {
    const result = ScheduleBlockSchema.safeParse({
      type: 'schedule',
      heading: { lt: 'Tvarkaraštis' },
      entries: [
        {
          day: { lt: 'Antradienis' },
          times: ['10:00'],
        },
      ],
    });
    assert.ok(result.success);
  });
});
