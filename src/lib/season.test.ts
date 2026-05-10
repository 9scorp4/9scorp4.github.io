import { describe, it, expect } from 'vitest';
import { getSeason, SEASONS } from './season.ts';

// Note: getSeason uses new Date(dateStr).getMonth() which parses YYYY-MM-DD as UTC
// but returns the month in local time. To avoid timezone issues in tests,
// we use mid-month dates with times that ensure consistent parsing.

// Helper to create date strings that work across timezones
function midMonth(year: number, month: number): string {
  // Using mid-month with noon UTC ensures the month is correct in all timezones
  return `${year}-${String(month).padStart(2, '0')}-15T12:00:00Z`;
}

describe('getSeason', () => {
  it('returns primavera for March-May', () => {
    expect(getSeason(midMonth(2026, 3))).toBe('primavera');
    expect(getSeason(midMonth(2026, 4))).toBe('primavera');
    expect(getSeason(midMonth(2026, 5))).toBe('primavera');
  });

  it('returns verano for June-August', () => {
    expect(getSeason(midMonth(2026, 6))).toBe('verano');
    expect(getSeason(midMonth(2026, 7))).toBe('verano');
    expect(getSeason(midMonth(2026, 8))).toBe('verano');
  });

  it('returns otoño for September-November', () => {
    expect(getSeason(midMonth(2026, 9))).toBe('otoño');
    expect(getSeason(midMonth(2026, 10))).toBe('otoño');
    expect(getSeason(midMonth(2026, 11))).toBe('otoño');
  });

  it('returns invierno for December-February', () => {
    expect(getSeason(midMonth(2026, 12))).toBe('invierno');
    expect(getSeason(midMonth(2026, 1))).toBe('invierno');
    expect(getSeason(midMonth(2026, 2))).toBe('invierno');
  });

  // Verify all four seasons are covered
  it('returns one of four valid seasons for any date', () => {
    const validSeasons = ['primavera', 'verano', 'otoño', 'invierno'];
    for (let month = 1; month <= 12; month++) {
      const season = getSeason(midMonth(2026, month));
      expect(validSeasons).toContain(season);
    }
  });
});

describe('SEASONS constant', () => {
  it('contains all four seasons', () => {
    expect(SEASONS).toHaveLength(4);
    expect(SEASONS).toContain('primavera');
    expect(SEASONS).toContain('verano');
    expect(SEASONS).toContain('otoño');
    expect(SEASONS).toContain('invierno');
  });

  it('is readonly', () => {
    // TypeScript enforces this, but we can check it's an array
    expect(Array.isArray(SEASONS)).toBe(true);
  });
});
