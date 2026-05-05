# Ontology

The conceptual vocabulary of the site. Authoritative for naming, structure, and voice. If something here doesn't match what's on the site, fix the site — or fix this doc. Don't let them drift.

## The frame

The site is a **cybernetic garden** — *un jardín cibernético*. Not a literal garden. Not a literal observatory. Not a station. A botanical/research metaphor where the second-order-cybernetics tradition (Bateson, Maturana, Beer, Pask) gets to be lived inside rather than just cited.

The frame should be **present but light**. Section names lean into the metaphor; prose mostly doesn't, except in the small editorial moments where the lean earns itself. Avoid making every paragraph feel like in-character roleplay — that's costume, not voice.

## Sections

| Slug | Spanish | French | English | What it actually is |
|---|---|---|---|---|
| `now` | el ahora | le présent | the now | Latest dispatch, updated whenever |
| `conservatory` | el invernadero | la serre | the conservatory | Generative sketches |
| `journal` | cuaderno de campo | carnet de terrain | field journal | Long-form notes |
| `cultivations` | los cultivos | les cultures | cultivations | Projects |
| `library` | la biblioteca | la bibliothèque | the library | Influences / dedication |
| `visitors` | libro de visitas | livre d'or | visitors' book | Optional console |

## Trilingual rule of thumb

- **English** carries the explanation (substrate)
- **Spanish** carries the warmth (native)
- **French** carries the place (Montréal)

Don't translate everything. Let each language do specific work. If a phrase only works in one language, leave it in that language — don't force a parallel.

Section banners get all three (`OBSERVATORIO · OBSERVATOIRE · OBSERVATORY`). Body prose picks one. Microcopy can mix freely.

## Statuses (cultivations)

Project states are biological, not industrial.

| Symbol | Status | Meaning |
|---|---|---|
| ▲ | growing | active, currently being worked on |
| ◐ | dormant | paused, will resume |
| ○ | wild | self-tending, doesn't need attention |
| ✕ | composted | abandoned (use sparingly, with grace) |

Never use ACTIVE / IN PROGRESS / SHIPPED / ARCHIVED. Those break the frame.

## Specimens

Each generative sketch is a **specimen**. Numbered in roman (specimen i, ii, iii…), with optional names. The conservatory holds them. New specimens are *grown*, not *built*.

## Field journal entries

Each entry has:
- An entry number (FR-001, FR-002…)
- A date
- A lowercase, sentence-case title
- A one-line summary
- The body

The entry numbers create a sense of accumulation over time. Don't reset them.

### Diptychs

A **diptych** is a paired journal entry: an article followed by a metalogue that answers back. The metalogue is a dialogue form borrowed from Bateson — a conversation whose structure enacts the question being asked.

Diptychs are stored as folders:

```
src/content/journal/[slug]/
  index.md           # frontmatter with type: diptych
  _article.md        # prose body
  _metalogue.md      # dialogue body
```

The underscore prefix tells Astro to skip these as separate entries.

Index frontmatter includes:
- `type: diptych`
- `title_secondary` — bilingual subtitle
- `preamble` — opening line, often Spanish
- `metalogue_title` — e.g., "cómo me reconoces · how do you recognize me"
- `metalogue_epigraph` — attribution or frame
- `colophon` — closing italic note

In the index listing, diptychs are marked with ⁂ (asterism) in ochre.

The seam between article and metalogue uses ❦ (floral heart).

## The library

Authors of the in-absentia documentation. The curation is the first and second generations of cybernetics — the room where Bateson's thinking became possible, and the room he later helped build. Each name is here because the site's form (recursive, observer-included, system-as-living) is downstream of theirs.

**Gregory Bateson** — Anglo-American anthropologist. Ecology of mind, the double bind, *Steps to an Ecology of Mind* (1972), *Mind and Nature* (1979). The site's load-bearing influence; everything else in this list is here partly because Bateson is.

**Stafford Beer** — British operations researcher. Designed the Viable System Model — a recursive anatomy of what any system needs to stay alive. Built Cybersyn in Allende's Chile (1971–73), the only serious attempt to govern a national economy with second-order cybernetics. The applied lineage.

**Humberto Maturana** — Chilean biologist. Co-coined *autopoiesis* with Varela: living systems defined by continuously producing themselves. Later extended into cognition and language. Closest to Bateson in register; if Bateson clicks, Maturana follows.

**Gordon Pask** — British cybernetician. Conversation Theory — learning as a conversation between two agents, or between an agent and itself. Built physical learning machines, theatrical interactive installations. The mechanics-of-understanding wing.

**Norbert Wiener** — American mathematician. Founded cybernetics: the word, the field, the 1948 book. Feedback as the universal mechanism of self-correction. Bateson is downstream of Wiener.

**Heinz von Foerster** — Austrian-American physicist. Ran the Biological Computer Laboratory at Illinois — the room where most of the others actually met. Coined *second-order cybernetics*: the cybernetics of cybernetics, observer included. Connective tissue.

Add others only if their work is load-bearing for the site's content — not name-dropping. Francisco Varela, Donella Meadows, and Mary Catherine Bateson are reasonable future additions.

## Voice

### Register

- Sardonic but never mean
- Specific over generic ("the air outside is the kind of cold that makes your face honest" not "it's cold today")
- Multilingual texture where it earns its keep — not as decoration
- Self-aware without being precious
- Comfortable with ellipsis, willing to leave things unfinished
- Lowercase by default for prose; small-caps only for section banners

### Microcopy by surface

- **404**: in-frame ("this part of the garden is not mapped yet")
- **Errors**: redflag.exe-adjacent — sardonic dialog-like, but warm not industrial
- **Empty states**: descriptive, sometimes wistful ("nothing here yet. spring is later than usual.")
- **Loading**: rare; if needed, honest, no fake-precision percentages
- **Visitors' book responses**: parser-flavored, terse, occasionally quoting Bateson back

### Examples that land

> Final revisions on the thesis. The air outside is the kind of cold that makes your face honest.

> waiting for spring.

> mostly self-tending.

> Bateson said the schizophrenia framing got too much attention. He had a point.

### Anti-patterns

Never write:

- "Hi! I'm Nico, a passionate..." (LinkedIn voice)
- "Welcome to my portfolio!" (hello-world voice)
- "Check out my latest..." (announcement voice)
- "Stay tuned for more!" (newsletter voice)
- "As an AI..." (machine voice)
- "Seamlessly," "delightful," "elevate," "leverage" (marketing voice)
- "A challenging but rewarding journey..." (cover-letter voice)
- Title Case For Everything
- Em dashes pretending to be artistic when commas would work
- Five adjectives where one would do
- Any sentence that begins with "Welcome"

## When voice and frame conflict

Voice wins. The cybernetic-garden frame is a setting for the voice; if the metaphor starts demanding sentences the voice wouldn't say, the metaphor steps back.
