# Interactions

Patterns for focus, hover, transitions, and touch targets. Read alongside [`PALETTE.md`](PALETTE.md) for colors and type.

## Focus rings

Two ring colors depending on what receives focus:

| Context | Token | Color | Example |
|---------|-------|-------|---------|
| Controls | `--focus-ring-control` | `--fern` | Buttons, form inputs, navigation toggles |
| Content links | `--focus-ring-content` | `--sun` | Journal entries, specimen cards, inline text links |

The rule: if it *does* something (control), fern. If it *goes* somewhere (content), sun.

```css
/* Control pattern */
button:focus-visible {
  outline: 2px solid var(--focus-ring-control);
  outline-offset: var(--focus-offset);
}

/* Content link pattern */
a:focus-visible {
  outline: 2px solid var(--focus-ring-content);
  outline-offset: var(--focus-offset);
}
```

**Never remove focus rings.** Keyboard navigation is non-negotiable.

## Touch targets

Minimum 44×44px touch area, achieved with padding and negative margin to preserve visual layout:

```css
.touch-target {
  padding: var(--touch-padding);  /* 8px 4px */
  margin: var(--touch-margin);    /* -8px -4px */
}
```

This expands the hit area without changing visual spacing. Use on links and buttons that would otherwise be too small.

## Hover semantics

Hover colors are intentional, not arbitrary. Each maps to a content type:

| Hover color | Token | Use for |
|-------------|-------|---------|
| `--terracotta` | `--hover-narrative` | Journal entries, articles, prose content |
| `--fern` | `--hover-control` | Buttons, toggles, navigation, controls |
| `--ink` | `--hover-meta` | Timestamps, metadata, secondary links |

When in doubt: narrative content → terracotta, controls → fern, meta/auxiliary → ink.

```css
/* Journal link */
.journal-link:hover { color: var(--hover-narrative); }

/* Navigation toggle */
.nav-toggle:hover { color: var(--hover-control); }

/* Timestamp link */
.meta-link:hover { color: var(--hover-meta); }
```

## Transitions

Three timing tiers:

| Token | Duration | Use for |
|-------|----------|---------|
| `--transition-micro` | 0.15s | Immediate feedback: hovers, color changes |
| `--transition-state` | 0.2s | UI state changes: toggles, active states |
| `--transition-reveal` | 0.3s | Content appearing: modals, expandables, fades |

```css
/* Hover color change */
a { transition: color var(--transition-micro); }

/* Toggle state */
.toggle { transition: background var(--transition-state); }

/* Modal fade */
.modal { transition: opacity var(--transition-reveal); }
```

**No transitions over 0.3s.** The site should feel responsive, not leisurely.

## Typography for metadata

Two patterns for metadata depending on the information type:

| Type | Style | Token | Examples |
|------|-------|-------|----------|
| Temporal | Serif italic | `--font-serif` + `font-style: italic` | Dates, "3 days ago", seasons |
| Structural | Mono | `--font-mono` | Status codes, slugs, IDs, counts |

```css
/* Temporal metadata */
.date {
  font-family: var(--font-serif);
  font-style: italic;
}

/* Structural metadata */
.status-badge {
  font-family: var(--font-mono);
  font-size: 0.85em;
}
```

The distinction: temporal metadata flows with prose rhythm; structural metadata is data, not narrative.

## Modal patterns

Two approaches depending on context:

**Overlay modals** (SpecimenModal pattern):
- Fixed positioning, covers viewport
- Semi-transparent backdrop (`rgba(0,0,0,0.8)`)
- Focus trap required
- Escape key closes
- Use for: full-size images, immersive content

**Inline expandables** (details/summary pattern):
- In-flow, no overlay
- Content pushes siblings
- No focus trap needed
- Use for: progressive disclosure, metadata panels

When choosing: if the content demands full attention, overlay. If it's supplementary, inline.

## Accessibility checklist

For any new interactive component:

- [ ] Focus visible on keyboard navigation
- [ ] Touch target ≥ 44×44px
- [ ] Color not the only indicator (add underline, icon, or shape)
- [ ] Hover state has equivalent focus state
- [ ] Transitions respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}
```

## Quick reference

```css
/* Focus */
outline: 2px solid var(--focus-ring-control);
outline-offset: var(--focus-offset);

/* Touch target expansion */
padding: var(--touch-padding);
margin: var(--touch-margin);

/* Transitions */
transition: color var(--transition-micro);
transition: background var(--transition-state);
transition: opacity var(--transition-reveal);

/* Hover colors */
:hover { color: var(--hover-narrative); }  /* content */
:hover { color: var(--hover-control); }    /* controls */
:hover { color: var(--hover-meta); }       /* metadata */
```
