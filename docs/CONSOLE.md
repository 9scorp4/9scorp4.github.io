# Console Features

Developer/owner-facing tools in the browser console.

## Devtools Greeting

On page load, the console displays a time-based greeting. 12 variants exist, grouped by time of day:

| Time | Temperature | Variants |
|------|-------------|----------|
| 06:00–12:00 | Cool, unhurried | morning quotes |
| 12:00–18:00 | Warmer, quicker | playful reveals |
| 18:00–23:00 | Contemplative | Bateson quotes |
| 23:00–06:00 | Maximum chaos | fake security alerts |

Night variants include fake "security breach" animations that resolve into a friendly greeting.

**Location**: `src/layouts/Garden.astro:90-226`

---

## Diagnostic Tool: `window.garden`

After the greeting (~3.5s delay), a diagnostic API is announced:

```
🌿 diagnostic tools loaded.
try: garden.reflect() · garden.ecology() · garden.xray()
```

### Commands

| Command | Description |
|---------|-------------|
| `garden.surfaces()` | Console table of all surfaces with type and element count |
| `garden.reflect()` | Narrative interpretation of visitor relationship (privacy-first) |
| `garden.ecology()` | Garden health: content counts, last tended, mycelium density |
| `garden.xray()` | Toggle color-coded overlay on all surfaces |
| `garden.explore()` | Interactive walkthrough with keyboard navigation |

### Surfaces

The tool tracks surfaces specific to each page context. Surfaces are DOM elements that are interactive, stateful, or have potential for future features.

#### Garden (main page `/`)

**Interactive**:
- `#mandala-canvas` — p5 generative mandala
- `.specimen[data-clickable="true"]` — specimen tiles
- `#specimen-modal` — full-size viewer
- `.author-trigger[data-author]` — library accordion
- `#console-input` — visitors book CLI

**Stateful**:
- `a.mycelium-link` — hidden portal to micelio

**Potential**:
- `.journal-entry` — field journal teasers
- `.cultivation` — project cards
- `.ahora-entry` — dispatch entries
- `.site-footer` — trilingual sign-off

**Structural**:
- `.station-header` — garden entrance
- `#now`, `#conservatory`, `#journal`, `#cultivations`, `#library`, `#visitors` — section anchors

#### Article pages (`/cuaderno/*`)

**Interactive**:
- `#article`, `.article-body` — article prose (tracks reading)
- `#metalogue` — metalogue section (diptych only)
- `.return-marker` — back to garden link
- `.diptych-nav` — jump to article/metalogue

**Potential**:
- `.seam` — fold between article and metalogue
- `.diptych-colophon` — closing note

**Structural**:
- `.diptych` — diptych container
- `.article-page` — simple article container

#### Micelio (`/micelio`)

**Interactive**:
- `#mycelium-canvas` — d3-force graph (drag nodes, click for details)
- `#mycelium-detail` — song metadata panel

**Potential**:
- `.micelio-footer` — attribution and return link

**Structural**:
- `.micelio-header` — trilingual title block

### `garden.surfaces()`

Prints a table of surfaces present on the current page:

```
🌿 surfaces (garden)
┌─────────┬────────────────────┬─────────────┬───────┐
│ (index) │ name               │ type        │ count │
├─────────┼────────────────────┼─────────────┼───────┤
│    0    │ 'mandala'          │ 'interactive'│   1   │
│    1    │ 'specimens'        │ 'interactive'│   5   │
│   ...   │ ...                │ ...         │ ...   │
└─────────┴────────────────────┴─────────────┴───────┘

not found on this page:
mycelium, specimen-modal

try garden.xray() to see them.
```

Page context appears in header: `garden`, `article`, or `micelio`.

### `garden.reflect()`

Narrative interpretation of the visitor's relationship to the garden. Always begins with a privacy disclaimer:

```
🌿 garden.reflect()

come as you are.
this garden keeps nothing that doesn't stay in your browser.
no cookies. no analytics. no IP tracking. localStorage only.
what you tend here stays here — or clears when you forget.

you've been tending for 12 days, across 7 visits.
a regular presence — the ferns recognize you.

you arrived in the afternoon.
(the alert hours. good for exploring.)

articles read: 3
secrets found: 5 of 12 (the rest are patient)
seed stage: sprouting

the pattern: a visitor who reads, explores, and tends. almost part of the garden by now.
```

If no data exists: "fresh arrival. the garden is still learning your shape."

**Pattern interpretations** vary based on visits, articles read, and secrets found.

### `garden.ecology()`

Garden health metrics fetched from `mycelium-data.json`:

```
🌿 garden.ecology()

fetching mycelium data...

last tended: 2025-01-15 at 14:32 UTC
(the gardener was here recently)

content
  articles:     8
  tracks:       45
  cultivations: 3
  dispatches:   12
  exits:        5

mycelium density
  nodes: 73
  edges: 142
  ratio: 1.95 edges per node
  (well-connected. the roots know each other.)
```

If unreachable: "the mycelium is unreachable. try again when the network clears."

### `garden.xray()`

Toggles visual overlay. Each surface gets:
- Dashed border in type color
- Small label with surface name
- Semi-transparent background
- `pointer-events: none` (doesn't interfere with page)

**Color key** (from `tokens.css`):
- `--fern` (#2d5a3d): Interactive
- `--ochre` (#c08820): Stateful
- `--sun` (#c93f7a): Potential
- `--ink-faint` (#8a7350): Structural

Toggle off: press `Escape`, call `garden.xray(false)`, or call again. Overlays reposition automatically on viewport resize (e.g., when devtools opens/closes).

### `garden.explore()`

Interactive walkthrough mode. Keyboard navigation works when page has focus (click outside console first):

```
🌿 surface diagnostic mode
[3/17] specimens
selector: .specimen[data-clickable="true"]
type: interactive
found: 5 elements

clickable specimen tiles. opens modal with p5 sketch.

n/→ = next · p/← = prev · q/esc = quit
```

**Behavior**:
- Highlights current surface with solid border + background
- Scrolls element into view (respects `prefers-reduced-motion`)
- Console shows selector, type, count, description
- Arrow keys or n/p to navigate
- q/Escape to exit
- Cleans up highlights on exit

**Exit message**: "the surfaces remember."

---

## Voice

The console maintains the garden's voice:
- "surface diagnostic mode" not "welcome to the tour"
- "xray: active" not "overlay enabled!"
- "the surfaces remember" not "thanks for exploring"
- "fresh arrival" not "no data found"

Sardonic, diagnostic, specific. No exclamation points.

---

## Location

All console code lives in `src/layouts/Garden.astro`:
- Devtools greeting: lines 90–226
- Diagnostic tool: lines 227–531

---

## Edge Cases

- **Page detection**: The tool auto-detects page context (`garden`, `article`, `micelio`) from `location.pathname` and shows only relevant surfaces.
- **Empty surfaces**: Some selectors may match 0 elements (e.g., mycelium link before unlock, metalogue on non-diptych articles). These are listed separately in `garden.surfaces()`.
- **Unknown pages**: Pages like `/subscribe` show no surfaces (context: `unknown`).
- **Multiple calls**: `garden.explore()` blocks if already active. `garden.xray()` toggles.
- **Cleanup**: Explore mode removes event listeners and highlight elements on exit.
