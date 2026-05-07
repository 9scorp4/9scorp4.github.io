# Libro de Visitas (Visitors' Book CLI)

Interactive CLI console at the bottom of the page. Parser-flavored, terse. Occasionally quotes Bateson.

Reads alongside [`ONTOLOGY.md`](ONTOLOGY.md) (voice, sections), [`SEASONS.md`](SEASONS.md) (the `seasons` command), and [`STACK.md`](STACK.md) (file conventions).

---

## Commands

### Public

Surfaced in the hint strip beneath the input. Aid navigation; serve as a curated entry point.

| Command | Behavior |
|---------|----------|
| `random` | Navigate to random content (weighted toward recent) |
| `about` | Terse bio |
| `about --garden` | Manifesto (*"un jardín cibernético…"*) |
| `qué` | Alias for `about --garden` |
| `seasons` | Season-grouped archive (see [`SEASONS.md`](SEASONS.md)) |
| `buscar [term]` | Search titles/summaries |
| `find [term]` | Alias for `buscar` |
| `dejar nombre="..." mensaje="..."` | Leave a note in the garden |
| `voces` / `voices` | List recent visitor notes |
| `help` / `ayuda` / `aide` | List public commands |

### Secret

Not in the hint, not in `help`. Reward exploration; carry voice without aiding navigation.

| Command | Behavior |
|---------|----------|
| `bateson` | Random Bateson quote |
| `regar` / `water` | *"the garden appreciates it"*, tracks count |
| `semilla` / `seed` | Progressive growth (7 visits to bloom) |
| `ls` | `conservatory/ cuaderno/ cultivations/ library/` |
| `pwd` | `you are in: el jardín` |
| `cd [dir]` | Navigate sections |
| `cd ..` | *"there is no outside."* |
| `clear` | Dismiss output |
| `olvidar` / `forget` | Reset visitor state (with confirmation) |
| `garden` / `jardin` | Visitor stats (visits, waterings, secrets found, seed stage) |
| `bonjour` | Montréal weather + surrealist poem (daily-generated) |
| `hola` | Visit-aware Spanish greeting (tiered by visit count) |
| `hello` | Visit-aware English greeting (tiered by visit count) |

### Visit-aware greetings

`hola` and `hello` recognize returning visitors with three tiers of response:
- **First visit** (`visits === 1`): opening acknowledgment
- **Returning** (2–6 visits): recognition
- **Long-time** (≥7 visits): familiarity

The threshold (7) matches the `seed` bloom threshold.

### Public vs. secret

Public commands aid navigation — they're how someone gets around. Secret commands reward exploration — they carry voice but you don't *need* them. New commands default to secret unless they answer a navigational question a first-time visitor would actually ask.

### Hint vs. help

The hint strip beneath the input shows **≤4 curated commands** — entry points, not coverage. `help` shows the full public list. Both are public; one is curated, one is complete. They drift if not watched: the hint should rotate occasionally; `help` should track every public command.

---

## Interaction

- **Input:** real `<input>`, mono font, custom blinking cursor
- **Submit:** Enter key
- **Dismiss:** Escape key or click dismiss button
- **Focus:** click anywhere in the console box

---

## State

localStorage key: `jardin-visitor`

```typescript
interface VisitorState {
  version: 1;          // bump on schema change
  visits: number;      // total page visits
  lastVisit: string;   // ISO date
  waterings: number;   // water command count
  seedPlanted: boolean;
  seedCount: number;   // 0–7, reveals quote at 7
}
```

### Migration policy

- Bump `version` on any schema change.
- Keep migrations for the last two versions in `src/lib/visitor-state.ts`.
- On read: if `version` is missing or older, run forward migrations to current.
- On unparseable state: discard and reinitialize. The garden doesn't ask where you've been.

### Reset

`olvidar` / `forget` wipes the state with a confirmation prompt.

```
> olvidar
¿forget this garden? (y/n) _
```

On `y`: clear localStorage, render *the garden has forgotten you. it will remember again.*
On `n` or anything else: *"recordando."*

---

## Adding commands

Commands live in the `commands` object in `VisitorsBook.astro`. Each handler receives `args: string` (everything after the command name).

```typescript
commands.newcommand = (args) => {
  showOutput('<p class="output-line">response here</p>');
};
```

Output classes: `output-muted`, `output-fern`, `output-ochre`, `output-sun`, `output-quote`, `output-mono`.

When adding: decide *public or secret* first (see above). If public, add to the `help` list. If it's a primary navigation entry point, consider rotating into the hint.

---

## Bateson quotes

Stored in the `batesonQuotes` array in component frontmatter. Add quotes there. No attribution per quote — the command name *is* the attribution.

---

## Voice

Inherits from [`ONTOLOGY.md`](ONTOLOGY.md). CLI-specific overrides:

The unknown-command handler distinguishes orders from utterances: prose-like input (greetings, questions, long text) nudges toward `dejar` instead of showing "unknown command".

- **Terse:** one line preferred, three max.
- **Lowercase:** the parser doesn't shout.
- **Parser-flavored:** *"cd: not a garden path"*, not *"Directory not found"*.
- **Mono font:** input and command output only; explanatory text uses body type.
- **Occasionally warm, never cute.**

If anything here contradicts `ONTOLOGY.md`, `ONTOLOGY.md` wins — fix this file, or update both.

---

## Submission Pipeline

Visitors can leave notes via the `dejar` command. Notes go through a moderation pipeline:

```
dejar nombre="Ana" mensaje="el mapa no es el territorio"
          │
          ▼
┌─────────────────────────────┐
│  Cloudflare Worker          │
│  POST /submit               │
│  - validate + rate limit    │
│  - store in KV (pending)    │
│  - email via Resend         │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│  Manual approval            │
│  npx tsx scripts/visitors-  │
│  admin.ts approve <id>      │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│  GitHub Action (6h cron)    │
│  - fetch approved from KV   │
│  - write YAML files         │
│  - commit + push            │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│  Site rebuilds              │
│  Messages rendered above    │
│  the console input          │
└─────────────────────────────┘
```

### Response vocabulary

- Success: `nota recibida. awaiting approval.`
- Rate limited: `too many notes. wait an hour.`
- Missing field: `dejar: missing nombre or mensaje`
- Too long: `mensaje: 280 chars max. brevity is a gift.`
- Network error: `the garden is unreachable. try again later.`

### Constraints

- `nombre`: 40 chars max
- `mensaje`: 280 chars max
- Rate limit: 3 submissions per hour per IP

### Admin CLI

```bash
# List pending messages
npx tsx scripts/visitors-admin.ts list

# Approve a message
npx tsx scripts/visitors-admin.ts approve msg:01HXY...

# Reject a message
npx tsx scripts/visitors-admin.ts reject msg:01HXY...

# Approve all pending
npx tsx scripts/visitors-admin.ts approve-all
```

Requires `.env` with `VISITORS_WORKER_URL` and `VISITORS_ADMIN_TOKEN`.

---

## Bonjour Pipeline

The `bonjour` command returns Montréal weather and a surrealist poem.

### Generation

- **Cron triggers** at 04:05 and 05:05 UTC (DST workaround: runs twice, no-ops if poem exists)
- **Groq API** generates poems using `llama-3.1-8b-instant` with temperature 0.95
- **Prompt**: French surrealist style (Desnos, Éluard, Péret), 4–8 lines, lowercase, no title
- **TTL**: Daily poems expire after 26 hours

### Request Flow

```
bonjour
    │
    ▼
┌─────────────────────────────┐
│  GET /bonjour               │
│  - fetch weather (15m cache)│
│  - select phrase            │
│  - select poem (70/30)      │
│  - pick encounter location  │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│  Response                   │
│  { weather, encounter, poem }│
└─────────────────────────────┘
```

### Poem Selection

- **70%**: Today's daily poem
- **30%**: Random from favorites pool (if any)
- **Fallback**: *"le jardin regarde dehors. le ciel est là."*

### Weather

- **Source**: Open-Meteo (free, no API key)
- **Cache**: 15 minutes in KV
- **Failure mode**: Poem shows + "(les chiffres se sont perdus en chemin.)"

### Curation

To manually trigger poem generation (useful after first deploy or to regenerate):

```bash
npx tsx scripts/visitors-admin.ts bonjour generate
```

Good poems can be promoted to the favorites pool for longevity:

```bash
# List recent poems
npx tsx scripts/visitors-admin.ts bonjour list

# Show specific day's poem
npx tsx scripts/visitors-admin.ts bonjour show 2026-05-01

# Promote to favorites
npx tsx scripts/visitors-admin.ts bonjour favorite 2026-05-01

# List favorites
npx tsx scripts/visitors-admin.ts bonjour favorites

# Remove from favorites
npx tsx scripts/visitors-admin.ts bonjour favorites remove fav:XXXXX

# Delete a bad poem (prune)
npx tsx scripts/visitors-admin.ts bonjour prune 2026-05-01
```

### KV Keys

| Key | Content | TTL |
|-----|---------|-----|
| `bonjour:weather:current` | Cached Open-Meteo JSON | 15 min |
| `bonjour:daily:YYYY-MM-DD` | Poem text | 26 hours |
| `bonjour:favorites` | JSON array of favorites | None |

---

## When in doubt

Re-read this file. Most decisions are made. The question that comes up most is *public or secret?* — default to secret. The garden rewards looking around.
