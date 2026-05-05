/**
 * Season utilities
 *
 * Northern hemisphere seasons, aligned with EL_AHORA.md.
 * If hemisphere or calendar changes, change it here only.
 */

export type Season = 'primavera' | 'verano' | 'otoño' | 'invierno';

export const SEASONS: readonly Season[] = ['primavera', 'verano', 'otoño', 'invierno'] as const;

export function getSeason(dateStr: string): Season {
  const month = new Date(dateStr).getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'primavera';
  if (month >= 5 && month <= 7) return 'verano';
  if (month >= 8 && month <= 10) return 'otoño';
  return 'invierno';
}
