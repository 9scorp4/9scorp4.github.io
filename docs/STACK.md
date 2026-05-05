# Stack

Tech choices, file structure, build, deploy.

## Framework: Astro

[Astro](https://astro.build) for the static site.

### Why Astro

- **Component model** keeps a long-scroll page maintainable as it grows. `<Specimen>`, `<JournalEntry>`, `<Cultivation>` are real components, not template fragments.
- **Content collections** + **markdown with frontmatter** for journal entries — type-safe, schema-validated, easy to add to.
- **Static output** deploys to GitHub Pages without ceremony.
- **Client islands** for the rare interactive bit (visitors' book console, live p5 sketches) without a SPA's overhead.
- **Hand-readable HTML output** — important because this site values being inspectable.

### Why not...

- **Vanilla HTML/CSS/JS**: Works for v0, breaks down around 30+ journal entries. The component model pays off quickly.
- **Eleventy**: Solid alternative, simpler than Astro. If Astro starts feeling heavy in 6 months, Eleventy is the migration path that loses least.
- **Next.js**: SSR + React + bundler complexity for a static site is a category error. No.
- **Hugo / Jekyll**: Fine, but their templating languages are less ergonomic than Astro's component model when each section wants its own UI.

## Structure

```
9scorp4.github.io/
├── README.md
├── CLAUDE.md
├── LICENSE              # CC BY-NC-SA for content
├── LICENSE-CODE         # MIT for code
├── docs/
│   ├── ONTOLOGY.md
│   ├── PALETTE.md
│   └── STACK.md
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   └── fonts/           # self-hosted serif + mono
└── src/
    ├── pages/
    │   ├── index.astro            # the long-scroll
    │   ├── conservatory/
    │   │   └── [specimen].astro   # individual sketch pages
    │   └── journal/
    │       └── [slug].astro       # individual journal entries
    ├── layouts/
    │   └── Garden.astro           # base layout with palette + type imports
    ├── components/
    │   ├── StationHeader.astro    # the trilingual title + sun mandala
    │   ├── SectionHeader.astro    # the small-caps trilingual section banners
    │   ├── Specimen.astro         # conservatory tile
    │   ├── JournalEntry.astro     # field journal teaser
    │   ├── Cultivation.astro      # project card
    │   ├── Library.astro          # the dedication block
    │   └── VisitorsBook.astro     # the console garnish
    ├── content/
    │   ├── config.ts              # collection schemas
    │   ├── journal/               # markdown entries
    │   ├── specimens/             # sketch metadata (yaml frontmatter only)
    │   └── cultivations/          # project metadata
    ├── styles/
    │   ├── tokens.css             # palette + type variables
    │   └── global.css             # base styles, resets
    └── sketches/                  # p5.js source files
```

## Content schemas

`src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    entry: z.number(),
    language: z.enum(['en', 'es', 'fr']).default('en'),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

const specimens = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),         // 'sig-001'
    name: z.string(),
    grown: z.date(),
    sketch: z.string(),     // path to p5 entry point
    description: z.string(),
    status: z.enum(['growing', 'dormant', 'wild', 'composted']),
  }),
});

const cultivations = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    status: z.enum(['growing', 'dormant', 'wild', 'composted']),
    description: z.string(),
    repo: z.string().url().optional(),
  }),
});

export const collections = { journal, specimens, cultivations };
```

## p5 sketches

Each sketch lives in `src/sketches/{name}/` as a self-contained module:

```
src/sketches/redflag/
├── index.js              # p5 instance-mode sketch (export default)
├── thumbnail.png         # static fallback for prefers-reduced-motion
└── README.md             # what it is, parameters, mood
```

### Conventions

- **Instance mode only**: `new p5(sketchFn, container)`. Never global mode.
- **Cleanup is mandatory**: each sketch returns/exports a `cleanup()` that calls `p5.remove()`.
- **Pause when offscreen**: use `IntersectionObserver` to `noLoop()` when the tile leaves the viewport, `loop()` when it returns. Three concurrent sketches is otherwise a small space heater.
- **Honor `prefers-reduced-motion`**: render the static thumbnail instead of the live sketch.
- **Frame budget**: target 30fps for tiles, 60fps for full-page specimens. If you can't hit it, simplify the sketch — don't drop the standard.
- **No external dependencies** beyond p5 itself unless documented in `STACK.md`.

## Visitors' Book Worker

Visitor message submissions go to a Cloudflare Worker with KV storage.

### Architecture

```
workers/visitors/
├── wrangler.toml         # KV bindings, env vars
├── package.json          # Worker-specific deps (zod)
├── tsconfig.json
└── src/
    ├── index.ts          # Routes + handlers
    ├── schema.ts         # Zod validation
    └── email.ts          # Resend notification
```

### Endpoints

- `POST /submit` — public, rate-limited (3/hour/IP)
- `GET /admin/pending` — auth required
- `GET /admin/approved` — auth required
- `POST /admin/approve/:id` — auth required
- `POST /admin/reject/:id` — auth required

### Secrets (via `wrangler secret put`)

- `ADMIN_TOKEN` — bearer token for admin routes
- `RESEND_API_KEY` — from resend.com

### Deploy

```bash
cd workers/visitors
npm install
wrangler deploy
```

First, create a KV namespace:

```bash
wrangler kv:namespace create VISITORS_KV
wrangler kv:namespace create VISITORS_KV --preview
```

Update `wrangler.toml` with the returned IDs.

### Sync Automation

`.github/workflows/sync-visitors.yml` runs every 6 hours to:
1. Fetch approved messages from Worker
2. Write YAML files to `src/content/visitors/`
3. Commit and push if changes exist

GitHub secrets needed:
- `VISITORS_WORKER_URL`
- `VISITORS_ADMIN_TOKEN`

### Environment Variables (Astro site)

Set `PUBLIC_VISITORS_WORKER_URL` in your deployment environment (e.g., GitHub Actions secrets or Netlify env) to enable the `dejar` command.

---

## Deployment

GitHub Actions, deploys from `main` to GitHub Pages.

`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://9scorp4.github.io',
  integrations: [mdx()],
  build: {
    assets: 'assets',
  },
});
```

## Initial dependencies

```json
{
  "dependencies": {
    "astro": "^5",
    "@astrojs/mdx": "^4",
    "p5": "^1.11"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

Resist adding more until something concrete breaks. Specifically, avoid:

- Tailwind (the design system is too specific for utility classes; CSS variables + scoped Astro styles are right)
- A UI component library (the components are bespoke; nothing reusable)
- Analytics SDK (use Plausible's lightweight script *only* if signal becomes useful)
- Animation libraries (CSS transitions + p5 cover everything needed)

## Performance budget

- First contentful paint: < 1s on cold load
- Total above-the-fold weight: < 200KB
- p5 sketches lazy-load on viewport entry
- Self-host fonts (no Google Fonts on the critical path)
- The whole point of static is staying fast. Don't squander it.

## Accessibility floor

- Color contrast: see `PALETTE.md`. AAA for body, AA for accents.
- All p5 sketches have static fallback images for `prefers-reduced-motion`
- Trilingual headers use proper `lang` attributes per language span
- Focus rings: 2px `--fern`, never removed
- The visitors' book console is fully keyboard-navigable but is **not** primary navigation — it's a garnish, an opt-in
- Section navigation works without JS; the console requires JS but the rest of the site doesn't

## What's deliberately not in scope

- **Search**: corpus is small enough to scroll
- **Comments**: visitors' book is the closest thing; cross-link to Threads/email otherwise
- **Newsletter**: out of frame for this site; stays at AnthroposAI if it happens
- **Analytics by default**: privacy-respecting only, and only when a signal is actually wanted
- **A CMS**: markdown files + git is the CMS. Resist.

## In scope but not yet built

- **RSS feed** for the field journal — high signal, low cost. Add when there are 5+ entries.
- **OpenGraph / social previews** for individual journal entries
- **Sitemap.xml** — Astro generates this automatically with the `@astrojs/sitemap` integration

## Migration paths

If Astro becomes the wrong tool:

- **Down to Eleventy**: Move components to Nunjucks templates, content collections to a `_data/` folder. Lose TypeScript safety; gain simplicity.
- **Down to vanilla HTML**: If the site stops growing, freeze it. The static output is already plain HTML; you can just commit `dist/` and stop building.

Plan for the migration you'll actually do, which is probably "stay on Astro and don't touch it."
