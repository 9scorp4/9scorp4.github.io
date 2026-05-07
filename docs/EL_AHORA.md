# El Ahora

The "now" section. A dated status stream in weather-report vocabulary, lived at the top of the garden as the most recent observation, with older entries thinning out below.

This doc is authoritative for everything `el ahora` does. If something here doesn't match what's on the site, fix the site — or fix this doc. Don't drift.

Reads alongside [`ONTOLOGY.md`](ONTOLOGY.md) (voice, section names) and [`STACK.md`](STACK.md) (file conventions). Section header is fixed: *EL AHORA · LE PRÉSENT · THE NOW*.

---

## The shape

Each entry is a dated micro-post in the voice of someone tending the garden — present tense, observational, written from inside the metaphor. Entries draw from a controlled vocabulary of slot labels but are **not required to fill every slot**. Some entries use one slot, some use four. None use all of them, ever. (If they did, they'd look like a CV.)

Default rendering: most recent entry on top in full color; older entries demoted to dim date-stamped lines beneath it. The section accumulates a chronicle without performing one.

---

## The vocabulary

Slots are written in Spanish, lowercase, with no parenthetical translation — the trilingual section header carries the multilingual frame; after that, the entries themselves don't apologize.

| slot | what it holds |
|---|---|
| **temperatura** | the weather in the garden, literal or figurative. state of mind, week, room. |
| **creciendo** | what's actively growing. work, ideas, projects in motion. |
| **durmiendo** | what's gone dormant. deliberately set aside, or just neglected and honest about it. |
| **leyendo** | current reading. books, papers, the occasional Threads spiral. |
| **escuchando** | current listening. music, podcasts, the upstairs neighbors. |
| **specimen nuevo** | when something new lands in the conservatory. linked. |
| **articulo nuevo** | when a new article is added to the field journal. may be a diptych or not. linked. |
| **cultivando** | everything cultivation-related (new, updates, whatever is load-bearing). clicking leads to the cultivation entry on site. |

The terms *artículo nuevo* and *cultivando* were recently added against previous advice to do so. The rationale gives justice of this change: now it will be possible to annouce new content on page load and to associate `el ahora` entries with content from `conservatorio` and `cultivos`. Articles, specimens and cultivations could be mapped to `micelio` through `ahora` dispatches containing songs. Possibilities are endless.

That being said, we may consider refraining from adding more terms going forward, unless we discover an uncovered edge case, which would be honestly surprising. Vocabulary creep is how this section dies.

---

## The empty state

When there are no entries, or the most recent entry is old enough that the garden has visibly stopped being tended, the section falls back to a single italic line — its **empty state**.

The empty state is **seasonal**. The fallback line changes by month, in voice. Starter set (Northern hemisphere, Montréal-aligned — the site lives where the gardener lives):

| months | line |
|---|---|
| December–February | *waiting for spring.* |
| March–May | *el deshielo, por fin.* |
| June–August | *el jardín está alto.* |
| September–November | *los días se acortan.* |

Pick one per season; commit it; don't rotate within a season. The point isn't variety — it's that the garden has a calendar even when nothing else is happening.

**Threshold for falling back to empty state:** six months without a new entry. Below that, the latest entry stays as the lead. Above that, the seasonal line takes over and the entry archive moves below it.

---

## The "always space" principle

This section is designed to survive abandonment.

If updates stop entirely, the empty state holds the space. The page never looks broken, never has a *last updated: 2024* apology, never asks the visitor to forgive a gap. The seasonal fallback is doing the work the entries used to do — the garden has weather even when no one is writing.

This means: **no fixed frequency, no streak counter, no "post weekly" shame loop.** A garden has slow weeks. A garden has slow years. The form accommodates this; the form was *designed for* this. Resist any temptation to add prompts, reminders, or "draft a new ahora entry" surface area. Those exist to prop up sections that don't have the right empty state.

The corollary: **there is always space for new stuff to be added.** The structure is open — a new entry just goes on top, no matter how long it's been. No "i'm back" preamble required. The garden doesn't ask where you've been.

---

## Workflow: adding an entry

Entries live in `src/content/ahora/` as markdown files with frontmatter. One file per entry. Filename is the ISO date: `2026-05-04.md`.

**Frontmatter schema:**

```yaml
---
date: 2026-05-04
---
```

That's it. No `title`. No `tags`. No `slug`. The date is the identity.

**Body** is markdown. Use the slot vocabulary as inline italic labels:

```markdown
*temperatura:* late thaw, finalmente.
*creciendo:* thesis corrections, slowly.
*escuchando:* too much DnB.
```

No heading inside the body. The date renders as the entry header at the section level. Order is reverse-chronological by `date`.

If an entry is just one line and doesn't fit a slot, write it without slots. The vocabulary is a tool, not a requirement:

```markdown
the upstairs neighbors are arguing again. productive afternoon.
```

Both shapes are valid. Mix freely.

---

## Rendering rules

- Most recent entry: full prose styling, full date, top of section.
- Older entries: dim color (use `--color-ink-muted` from `tokens.css`), date inline with body, condensed spacing.
- Show the most recent **3–5 entries** on the section by default. Older ones accessible via `seasons` (which has its own doc once we write it).
- Empty state: italic, centered, single line. Same styling as the current placeholder *waiting for spring.*
- No "view all" button. No pagination. The archive lives in `seasons`.

---

## Anti-patterns

- **Don't fill all slots out of obligation.** An entry with *escuchando: nothing in particular* is a dead entry. Omit the slot.
- **Don't add slots casually.** The vocabulary is small on purpose. Adding a slot means committing to it across future entries — and quietly invalidating older ones that didn't have it.
- **Don't add a "last updated" timestamp anywhere.** The most recent entry's date *is* the timestamp. A second one is just shame.
- **Don't add streaks, counts, "X entries this year."** This isn't Strava.
- **Don't write entries in advance.** This is a present-tense section. Backdating undermines the point.
- **Don't translate the slot labels.** *creciendo* is *creciendo*. The reader figures it out, or they don't, and either is fine.
- **Don't break voice.** No "currently working on…" dashboard-speak. No emoji. No "✨ vibes ✨". Sardonic, specific, dry.
- **Don't make the empty state clever.** It's a single line. It does one thing. If it starts trying to be funny, cut it.

---

## When in doubt

Re-read this file. Most decisions are already made.

If a decision is genuinely new — a new slot, a new empty-state behavior, a structural change — prefer asking the gardener before writing it in. This is a small section; consistency matters more than speed.
