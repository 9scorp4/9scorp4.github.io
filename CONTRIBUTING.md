# Contributing

This is a personal site — *un jardín cibernético*, Nico's cybernetic garden. The repo is public because the site is, and because someone might find the source useful. It isn't structured as a collaborative project, and that's the honest framing to start with.

The issue tracker is open, though, and pull requests get read. Here's the shape of what fits.

## What's welcome

- **Typos, broken links, factual errors** in journal entries or site copy — open an issue or PR; these get merged quickly.
- **Real bugs**: layout breakage, accessibility regressions, sketches that won't render, broken builds. An issue with reproduction steps is ideal; a PR is even better.
- **Accessibility improvements** — focus rings, contrast, keyboard navigation, `prefers-reduced-motion` handling. Outside eyes catch things I miss here. See [`docs/STACK.md`](docs/STACK.md#accessibility-floor) for what's already in place.
- **Pointing out that something is wrong**, even without a fix. "The trilingual headers don't read correctly in screen readers" is valuable on its own.

## What this project isn't shaped for

Not because they're unwelcome as thoughts, but because the project isn't structured to receive them:

- **Feature suggestions** — the site is small on purpose. Search, comments, newsletter integration, new sections — these are deliberately out of scope. See [`docs/STACK.md`](docs/STACK.md#whats-deliberately-not-in-scope).
- **Aesthetic preferences** — the look is intentional. "This would look better minimal / dark / modern" isn't a fix.
- **"Modernization" refactors** — dependency upgrades that aren't fixing something concrete, replacing CSS variables with utility classes, "clean up" passes. The conventions in [`docs/STACK.md`](docs/STACK.md) and [`CLAUDE.md`](CLAUDE.md) are load-bearing.
- **Feedback on the writing itself** — the visitors' book on the site is the right surface for that. Or email.

## Before changing anything

Read these, in order:

1. [`docs/ONTOLOGY.md`](docs/ONTOLOGY.md) — vocabulary, voice, anti-patterns. Most aesthetic decisions live here.
2. [`docs/PALETTE.md`](docs/PALETTE.md) — color and type tokens. New colors get named here first.
3. [`docs/STACK.md`](docs/STACK.md) — file structure, build conventions, what's deliberately out of scope.
4. [`CLAUDE.md`](CLAUDE.md) — orientation for AI coding assistants. A quick high-level pass for human readers too.

## Running locally

```bash
git clone https://github.com/9scorp4/9scorp4.github.io
cd 9scorp4.github.io
npm install
npm run dev
```

The Cloudflare worker for the visitors' book lives in `workers/visitors/` with its own deploy path. You don't need it running for general site work.

## Licensing

Code contributions land under [MIT](LICENSE-CODE). Content contributions — prose corrections in journal entries, dispatch text, anything that becomes part of the site's writing — land under [CC BY-NC-SA 4.0](LICENSE), the same license the rest of the content uses. Opening a PR is agreement to those terms.

---

If you're here because you found a typo or a real bug: thank you, genuinely. If you're here because the source was useful to read: also welcome. The site is mostly a static thing in public, and the repo is mostly that, kept honest.
