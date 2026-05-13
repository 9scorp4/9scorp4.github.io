/**
 * Client-side season detection
 *
 * NOTE: This is a duplicate of src/lib/season.ts for client-side use.
 * Server modules cannot be imported into browser scripts.
 */

export type Season = 'primavera' | 'verano' | 'otoño' | 'invierno';

export function getSeason(dateStr: string): Season {
  const date = new Date(dateStr);
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'primavera';
  if (month >= 5 && month <= 7) return 'verano';
  if (month >= 8 && month <= 10) return 'otoño';
  return 'invierno';
}
