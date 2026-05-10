# Palette

Colors and type. Authoritative — don't introduce new tokens without naming them here first.

For interaction patterns (focus rings, hover states, transitions), see [`INTERACTIONS.md`](INTERACTIONS.md).

## Aesthetic

**Solarpunk-gone-psychedelic.** Warm parchment grounds. Deep botanical accents (forest, ochre, terracotta). One saturated psychedelic punch (magenta). Mucha-with-the-saturation-cranked, not cyberpunk, not generic dark mode.

The palette has three layers: **grounds** (warm parchments — surfaces), **inks** (text, never pure black), **accents** (botanical + the magenta punch).

## Grounds

Warm parchments. Used for surfaces, never as text color.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#efe2c2` | Page background |
| `--paper-deep` | `#e8d9af` | Cards, conservatory tiles, raised surfaces |
| `--paper-deeper` | `#e3d4ae` | Browser chrome, footers, faint headers |
| `--paper-line` | `#c9b886` | Dividers, borders |

## Inks

Body text, captions, quiet UI. Warm walnut throughout — never `#000`, never gray.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#3d2f1a` | Primary body text |
| `--ink-soft` | `#6b5435` | Secondary text, captions, descriptions |
| `--ink-faint` | `#8a7350` | Tertiary text, timestamps, "more →" links |
| `--ink-quiet` | `#5a4423` | Browser chrome text, very low-emphasis labels |

## Botanical accents

The structural color. Most colored UI uses these.

| Token | Hex | Use |
|---|---|---|
| `--fern` | `#2d5a3d` | Primary structural accent — section headers, "growing" status, links |
| `--ochre` | `#c08820` | Secondary warmth — sun rays, "dormant" status, ornaments |
| `--terracotta` | `#a8472a` | Field journal accent (border-left), warm signal, occasional emphasis |

## The psychedelic punch

| Token | Hex | Use |
|---|---|---|
| `--sun` | `#c93f7a` | The single saturated note — sun core, key ornaments, very rare emphasis |

## Rules of thumb

- Body text is `--ink` on `--paper`. **Never `#000` on `#fff`.** The warmth is non-negotiable.
- `--sun` (magenta) appears at most **2–3 times per viewport**. It's the punch, not a fill.
- `--fern` is the closest thing to a "primary brand color" — section headers, default link color, growing status.
- **No gradients.** The palette has enough warmth without them.
- **No glow / box-shadow.** Saturation does the work. Focus rings are the only exception.
- Status icons (▲ ◐ ○ ✕) take their color from the status, not from a generic gray.

## Type

| Role | Family | Weight | Notes |
|---|---|---|---|
| Body | IM Fell DW Pica | 400 / italic | The garden's chosen voice |
| Section banners | Same serif, small caps | 400, letter-spacing 3px | All-caps acceptable here only |
| Display (h1) | Same serif, italic | 400 | The garden's title is in italic; this carries the weight |
| Code (rare) | JetBrains Mono | 400 | Reserved for actual code blocks in field journal |

**No sans-serif anywhere on the page.** Resist the urge.

### Sizes

| Element | Size |
|---|---|
| Display (h1, garden title) | 34px italic |
| Section banners (h2) | 15px small-caps with letter-spacing 3px |
| Body | 18px |
| Specimen title (h3) | 20px |
| Specimen description | 17px |
| Captions | 15–16px |
| Quiet text | 13px |

Line-height **1.75** for body. The type wants room to breathe.

## CSS variables

Drop into `src/styles/tokens.css`:

```css
:root {
  /* grounds */
  --paper:        #efe2c2;
  --paper-deep:   #e8d9af;
  --paper-deeper: #e3d4ae;
  --paper-line:   #c9b886;

  /* inks */
  --ink:       #3d2f1a;
  --ink-soft:  #6b5435;
  --ink-faint: #8a7350;
  --ink-quiet: #5a4423;

  /* botanical accents */
  --fern:       #2d5a3d;
  --ochre:      #c08820;
  --terracotta: #a8472a;

  /* the punch */
  --sun: #c93f7a;

  /* type */
  --font-serif: "IM Fell DW Pica", Georgia, serif;
  --font-mono:  "JetBrains Mono", ui-monospace, monospace;

  /* spacing rhythm */
  --rhythm-sm: 0.5rem;
  --rhythm:    1rem;
  --rhythm-md: 1.5rem;
  --rhythm-lg: 2rem;
}
```

## Accessibility

- `--ink` on `--paper`: contrast ratio ≈ 9.8:1 (passes AAA for body)
- `--ink-soft` on `--paper`: ≈ 5.4:1 (passes AA for body, AAA for large text)
- `--fern` on `--paper`: ≈ 6.1:1 (passes AA, AAA for large)
- `--sun` on `--paper`: ≈ 4.8:1 (passes AA — fine for headings and accents, marginal for body, so don't use it for body)
- Focus rings: `--fern` for controls, `--sun` for content links. See [`INTERACTIONS.md`](INTERACTIONS.md) for the full pattern. Never remove focus rings.

## Dark mode

**Not planned.** The aesthetic is rooted in warm parchment — a "dark mode" would either be unfaithful (just inverting the palette) or require a whole second design system.

If it ever becomes a hard request, the answer is *evening mode* — dimmer parchment (`#3a2e1a` ground, `#efe2c2` ink), deeper inks, never simple inversion. But default to: this site is a daytime garden.

## When you need a new color

You probably don't. Re-read what you have. If you genuinely do:

1. Name it here first, with a use case
2. Verify contrast
3. Verify it doesn't break the warm-vs-saturated balance
4. If it's a one-off, reconsider whether it should just be one of the existing tokens at lower opacity
