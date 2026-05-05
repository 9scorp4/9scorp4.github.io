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
```

### Visitors worker (Cloudflare)

```bash
cd workers/visitors
npm run dev      # Local worker dev
npm run deploy   # Deploy to Cloudflare
```

### Admin CLI for visitor messages

```bash
npx tsx scripts/visitors-admin.ts list              # List pending messages
npx tsx scripts/visitors-admin.ts approve msg:ID    # Approve a message
npx tsx scripts/visitors-admin.ts reject msg:ID     # Reject a message
```

Requires `.env` with `VISITORS_WORKER_URL` and `VISITORS_ADMIN_TOKEN`.

## Read before editing

Before writing or editing any content, code, or copy:

1. [`docs/ONTOLOGY.md`](docs/ONTOLOGY.md) — vocabulary, section names, statuses, voice register, anti-patterns
2. [`docs/PALETTE.md`](docs/PALETTE.md) — color tokens and type system
3. [`docs/STACK.md`](docs/STACK.md) — framework conventions, file structure, deploy

These exist so we don't re-litigate decisions every session. If a doc is missing something, update the doc — don't drift from it silently.

## Voice (one-line summary)

Sardonic without being mean. Specific over generic. Multilingual where it earns its keep. Quiet jokes preferred over loud ones. Never marketing-speak.

The full voice rules with examples and anti-patterns are in [`docs/ONTOLOGY.md`](docs/ONTOLOGY.md).

## Content collections

- **journal** — field journal entries (markdown with frontmatter in `src/content/journal/`)
- **specimens** — sketch metadata in `src/content/specimens/`, source in `src/sketches/{name}/`
- **cultivations** — project cards in `src/content/cultivations/`
- **ahora** — "the now" dispatches in `src/content/ahora/`
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

## When in doubt

Re-read `ONTOLOGY.md`. Most aesthetic and copy decisions have already been made.

If a decision is genuinely new (not covered in the docs), prefer asking over guessing. This is a small site; consistency matters more than speed.

## Don'ts

- Don't suggest "modern" rewrites — the aesthetic is intentional
- Don't refactor working code "for cleanliness" — wait until the structure actively fights you
- Don't add dependencies casually
- Don't break the trilingual rule (see ONTOLOGY)
- Don't write "as Claude, I..." copy. The site is Nico's voice, not yours.
