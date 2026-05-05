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

## When in doubt

Re-read this file. Most decisions are made. The question that comes up most is *public or secret?* — default to secret. The garden rewards looking around.
