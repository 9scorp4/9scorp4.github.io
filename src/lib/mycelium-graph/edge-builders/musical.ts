/**
 * Musical edge building functions (track↔track connections).
 */

import type { TrackData, EdgeData, EdgeType } from '../types.ts';
import {
  createNodeId,
  daysBetween,
  similarBpm,
  normalizeKey,
  similarDanceability,
  sharedGenre,
} from '../utilities.ts';

/**
 * Build track↔track edges (musical connections)
 */
export function buildMusicalEdges(
  tracks: TrackData[],
  edgeMap: Map<string, EdgeData>
): void {
  const trackList = tracks.map(t => ({
    ...t,
    id: createNodeId(t.artist, t.title),
  }));

  for (let i = 0; i < trackList.length; i++) {
    for (let j = i + 1; j < trackList.length; j++) {
      const a = trackList[i];
      const b = trackList[j];

      if (a.id === b.id) continue;

      const edgeKey = [a.id, b.id].sort().join('|');
      const existing = edgeMap.get(edgeKey) || { weight: 0, reasons: new Set<string>(), edgeType: 'musical' as EdgeType };

      // Same dispatch
      if (a.date.slice(0, 10) === b.date.slice(0, 10)) {
        existing.weight += 1.0;
        existing.reasons.add('same dispatch');
      } else {
        const days = daysBetween(a.date, b.date);
        if (days <= 2) {
          existing.weight += 0.7;
          existing.reasons.add('adjacent days');
        } else if (days <= 7) {
          existing.weight += 0.4;
          existing.reasons.add('same week');
        }
      }

      // Same artist
      if (a.artist.toLowerCase().trim() === b.artist.toLowerCase().trim()) {
        existing.weight += 0.5;
        existing.reasons.add('same artist');
      }

      // Similar BPM
      if (similarBpm(a.bpm, b.bpm)) {
        existing.weight += 0.3;
        existing.reasons.add('similar tempo');
      }

      // Same key
      const keyA = normalizeKey(a.key);
      const keyB = normalizeKey(b.key);
      if (keyA && keyB && keyA === keyB) {
        existing.weight += 0.3;
        existing.reasons.add('same key');
      }

      // Harmonic (Camelot)
      if (a.openKey && b.openKey && a.openKey === b.openKey) {
        existing.weight += 0.3;
        existing.reasons.add('harmonic');
      }

      // Same meter (non-4/4)
      if (a.timeSignature && b.timeSignature && a.timeSignature === b.timeSignature && a.timeSignature !== '4/4') {
        existing.weight += 0.2;
        existing.reasons.add('same meter');
      }

      // Similar danceability
      if (similarDanceability(a.danceability, b.danceability)) {
        existing.weight += 0.2;
        existing.reasons.add('similar groove');
      }

      // Shared genre
      const shared = sharedGenre(a.genre, b.genre);
      if (shared) {
        existing.weight += 0.25;
        existing.reasons.add('genre');
      }

      if (existing.weight > 0) {
        edgeMap.set(edgeKey, existing);
      }
    }
  }
}
