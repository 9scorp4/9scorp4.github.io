# Seasons

The `seasons` command in the visitors' book groups content by the season it was created. An archival counterpart to `el ahora` — where the now-page is the living surface, seasons is the chronicle.

## Grouping logic

Content is assigned to seasons by its date's month:

| Months | Season |
|--------|--------|
| Mar–May | primavera |
| Jun–Aug | verano |
| Sep–Nov | otoño |
| Dec–Feb | invierno |

Northern hemisphere. The garden is in Montréal.

Hemisphere and month boundaries match the seasonal empty states in [`EL_AHORA.md`](EL_AHORA.md). If one moves, the other moves. The `getSeason()` function lives in one place and is shared — see *Implementation* below.

## What gets grouped

- **Journal entries** (by `date` frontmatter) — expanded as titles
- **Specimens** (by `grown` frontmatter) — expanded as titles
- **El ahora entries** (by `date` frontmatter) — collapsed as a single line per season, linking to a filtered archive

Cultivations are excluded. They don't have creation dates, and their lifecycle is status-based (*growing / dormant / wild*), not seasonal.

El ahora entries are collapsed rather than expanded because they're short and many — expanding them would flood the season list and dilute the chronicle. The chronicle is for things you'd want to read; ahora is for things you'd want to *count*.

## Display

Default state — collapsed headers, terse:

```
> primavera (3)
> verano (5)
> otoño (1)
> invierno (2)
```

Empty seasons render *barbecho.* (fallow). Gardens have fallow seasons; that's rotation, not failure. Resist the urge to write *"nothing yet"* — that's a placeholder, not an entry.

## Interaction

Parser-native — this is a CLI, not a click target.

| Input | Behavior |
|-------|----------|
| `seasons` | List collapsed headers |
| `seasons primavera` | Expand just primavera inline |
| `seasons all` | Expand everything |

Click-to-expand stays as a fallback for visitors who don't realize the parser is the path. The parser path is canonical; the click is mercy.

Within an expanded season:

```
v primavera (3)
  · 2026-03-12  cuaderno: notas sobre el deshielo
  · 2026-04-08  specimen: redflag.exe iv
  · 23 ahora entries →
```

Date format: ISO. Type prefix (*cuaderno:* / *specimen:*) clarifies the source. Ahora entries get a count and an arrow link.

## Implementation

Season calculation lives in `src/lib/season.ts` and is imported by both `VisitorsBook.astro` and the el-ahora empty-state component:

```typescript
export type Season = 'primavera' | 'verano' | 'otoño' | 'invierno';

export function getSeason(dateStr: string): Season {
  const month = new Date(dateStr).getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'primavera';
  if (month >= 5 && month <= 7) return 'verano';
  if (month >= 8 && month <= 10) return 'otoño';
  return 'invierno';
}
```

If a hemisphere or calendar change is ever needed, change it here only. Both consumers update automatically.

## When in doubt

Re-read this file. Most decisions are made.

The parser path is canonical; the click is fallback. El ahora collapses; journal and specimens expand. Empty seasons are *barbecho*, not absent. Hemisphere matches `EL_AHORA.md`.

If a decision is genuinely new — a new content type to group, a different display mode — prefer asking the gardener before writing it in. Consistency across the doc family matters more than speed.
