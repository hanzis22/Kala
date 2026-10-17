import { describe, expect, it } from 'vitest';
import { formatClock, formatDayDate, formatWeekdayShort } from './format';

describe('format', () => {
  it('formatClock memakai titik dan dua digit', () => {
    expect(formatClock(260)).toBe('04.20');
    expect(formatClock(0)).toBe('00.00');
    expect(formatClock(1439)).toBe('23.59');
  });

  it('formatDayDate seperti mockup', () => {
    expect(formatDayDate('2026-10-17')).toBe('Sabtu, 17 Okt');
  });

  it('formatWeekdayShort', () => {
    expect(formatWeekdayShort('2026-10-17')).toBe('Sab');
    expect(formatWeekdayShort('2026-10-11')).toBe('Min');
  });
});
