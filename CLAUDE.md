# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal observatory site — a long-scroll page with botanical/cybernetic-garden aesthetic, deployed as a static site on GitHub Pages.

The aesthetic is **solarpunk-gone-psychedelic**: warm parchment grounds, deep botanical accents, Mucha-with-a-magenta-sun. NOT cyberpunk. NOT a generic dark-mode portfolio. NOT a marketing site.

The fiction is *un jardín cibernético* — a cybernetic garden. Section names live inside the metaphor (conservatory, field journal, cultivations, library). Stay inside the metaphor when writing UI copy; let the prose itself decide whether to.

## Commands

```bash
npm run dev      # Local dev server
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm run test     # Run tests (vitest)
npm run test:watch  # Watch mode
```

### Garden CLI (jardin)

Unified CLI for garden management. After `npm link` (or via npx):

```bash
npx jardin help                  # Show all commands
npx jardin insta                 # Interactive card generator
npx jardin insta batch           # Batch generate cards
npx jardin buffer                # Interactive publish to Buffer
npx jardin visitors list         # List pending messages
npx jardin bonjour generate      # Generate daily poem
npx jardin music enrich          # Enrich tracks with metadata
npx jardin stats                 # Garden analytics
```

Or via npm scripts: `npm run jardin -- insta` (note the `--` to pass args).

#### insta — Instagram content generation

```bash
jardin insta                  # Interactive: generate cards (default)
jardin insta generate         # Same as above
jardin insta batch            # List unpublished entries in queue
jardin insta batch --last=2   # Generate last N unpublished entries
jardin insta batch --all      # Generate all unpublished entries
jardin insta metalogue        # Generate metalogue carousel from diptych
jardin insta profile          # Generate profile picture
jardin insta intro            # Generate intro carousel
```

Options: `--publish` enables scheduling to Buffer, `--dry-run` previews batch output.

Output goes to `insta-output/`. Cards are 1080×1080 (square) or 1080×1350 (portrait).

##### Batch queue workflow

The batch system uses `cli/batch-queue.yaml` to define what content to generate:

1. **Write journal entry** in `src/content/journal/{slug}/`
2. **Write ahora dispatch** in `src/content/ahora/{date}.md` with `articuloNuevo` linking to the entry
3. **Add to batch queue** in `cli/batch-queue.yaml`:
   ```yaml
   - slug: my-new-entry
     quotes:
       - "First quote from the article..."
       - "Second quote..."
     # For diptychs, add metalogue fragments:
     metalogue:
       - speaker: "FIGURE"
         line: "Dialogue line here..."
   ```
4. **Generate**: `jardin insta batch --last=1`
5. **Publish**: `jardin insta batch --last=1 --publish`

**Policy**: Never run batch generation without first adding entries to `batch-queue.yaml`. The CLI will skip entries not in the queue.

#### buffer — Buffer publishing

```bash
jardin buffer                 # Interactive publish (default)
jardin buffer channels        # List connected channels
```

#### visitors — Visitor message management

```bash
jardin visitors               # List pending (default)
jardin visitors approve <id>  # Approve a message
jardin visitors reject <id>   # Reject a message
jardin visitors approve-all   # Approve all pending
jardin visitors sync          # Sync to content collection
```

#### bonjour — Daily poem management

```bash
jardin bonjour generate       # Generate today's poem
jardin bonjour list           # List recent (--days=N)
jardin bonjour show <date>    # Show poem for date
jardin bonjour favorite <date> # Add to favorites
jardin bonjour prune <date>   # Delete poem
jardin bonjour favorites      # List favorites
jardin bonjour prompt         # Show prompt config
jardin bonjour prompt test    # Test prompt interpolation
```

#### music — Music metadata

```bash
jardin music                  # Enrich tracks (default)
jardin music enrich           # Fetch BPM/key from API
```

#### stats — Garden analytics

```bash
jardin stats                  # Last 7 days
jardin stats --days=30        # Custom range
```

### Legacy aliases

These still work, pointing to the new CLI:

```bash
npm run insta              # → jardin insta generate
npm run insta:publish      # → jardin insta generate --publish
npm run insta:batch        # → jardin insta batch
npm run buffer             # → jardin buffer publish
npm run buffer:channels    # → jardin buffer channels
```

### Visitors worker (Cloudflare)

```bash
cd workers/visitors
npm run dev      # Local worker dev
npm run deploy   # Deploy to Cloudflare
```

### Environment variables

For Instagram/Buffer publishing, add to `.env`:
- `BUFFER_API_KEY`, `BUFFER_CHANNEL_ID` — Buffer API
- `CF_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2 for image hosting

## Read before editing

Before writing or editing any content, code, or copy:

1. [`docs/ONTOLOGY.md`](docs/ONTOLOGY.md) — vocabulary, section names, statuses, voice register, anti-patterns
2. [`docs/PALETTE.md`](docs/PALETTE.md) — color tokens and type system
3. [`docs/STACK.md`](docs/STACK.md) — framework conventions, file structure, deploy

Additional reference:
- [`docs/CONSOLE.md`](docs/CONSOLE.md) — devtools greeting and `window.garden` diagnostic API
- [`docs/EL_AHORA.md`](docs/EL_AHORA.md) — the now section: slot vocabulary, frontmatter schema, rendering rules
- [`docs/INTERACTIONS.md`](docs/INTERACTIONS.md) — focus rings, hover states, transitions, touch targets
- [`docs/SEASONS.md`](docs/SEASONS.md) — seasonal grouping logic for the `seasons` command
- [`docs/VISITORS.md`](docs/VISITORS.md) — visitors' book CLI: commands, secrets, parser behavior

These exist so we don't re-litigate decisions every session. If a doc is missing something, update the doc — don't drift from it silently.

## Voice (one-line summary)

Sardonic without being mean. Specific over generic. Multilingual where it earns its keep. Quiet jokes preferred over loud ones. Never marketing-speak.

The full voice rules with examples and anti-patterns are in [`docs/ONTOLOGY.md`](docs/ONTOLOGY.md).

## Content collections

- **journal** — field journal entries (markdown with frontmatter in `src/content/journal/`)
- **specimens** — sketch metadata in `src/content/specimens/`, source in `src/sketches/{name}/`
- **cultivations** — project cards in `src/content/cultivations/`
- **ahora** — "the now" dispatches in `src/content/ahora/`. Music tracks and article announcements in frontmatter feed the MyceliumCanvas graph.
- **visitors** — approved visitor messages (synced from worker, don't edit directly)

### Diptychs

A **diptych** is a paired journal entry: article + metalogue. Stored as folders:

```
src/content/journal/[slug]/
  index.md           # frontmatter with type: diptych
  _article.md        # prose body
  _metalogue.md      # dialogue body
```

See `ONTOLOGY.md` for the full diptych structure and required frontmatter fields.

## Conventions

- Components: `src/components/`, PascalCase
- Use existing CSS custom properties from `src/styles/tokens.css`
- Sentence case for everything; ALL CAPS only for the small-caps section banners
- No new colors without naming them in `PALETTE.md` first

## Build-time integrations

- **OG images** (`src/integrations/og-images.ts`) — generates 1200×630 social preview images at build time using Satori. Templates in `src/lib/og-image.tsx`.
- **Instagram cards** (`src/lib/insta-templates.tsx`) — same Satori pipeline, different templates: quote, title, status, specimen, intro carousel, metalogue (Bateson-style dialogue cards for diptychs).

## Key interactive components

- **MyceliumCanvas** (`src/components/interactive/MyceliumCanvas.astro`) — force-directed graph unifying music, articles, cultivations, dispatches, and exit links. Uses d3-force. Node types: tracks (circles), articles (rounded squares), cultivations (squares), dispatches (small squares for notable ahora entries), exits (hollow circles at periphery for external URLs). Tracks connect by tempo/key/artist; articles connect by wikilinks; cross-links form through `articuloNuevo` announcements; exits pull outward via radial force. Supports pan/zoom navigation.
- **VisitorsBook** (`src/components/interactive/VisitorsBook.astro`) — terminal-style console with custom parser. Commands: `ayuda`, `escuchar`, `dejar`, `limpiar`.
- **SpecimenModal** — lightbox for full-size p5.js sketches.

## When in doubt

Re-read `ONTOLOGY.md`. Most aesthetic and copy decisions have already been made.

If a decision is genuinely new (not covered in the docs), prefer asking over guessing. This is a small site; consistency matters more than speed.

## CI/CD policy

**Before pushing any changes to `.github/workflows/`:**

1. Read the workflow file(s) you're modifying
2. Verify environment variable names match what the code expects
3. Verify script paths exist and are correct
4. Check that secrets referenced in the workflow exist (or note if new ones are needed)

This applies to the main agent and all subagents. When spawning agents for tasks that touch CI/CD, include this policy in the prompt.

## Don'ts

- Don't suggest "modern" rewrites — the aesthetic is intentional
- Don't refactor working code "for cleanliness" — wait until the structure actively fights you
- Don't add dependencies casually
- Don't break the trilingual rule (see ONTOLOGY)
- Don't write "as Claude, I..." copy. The site is Nico's voice, not yours.
