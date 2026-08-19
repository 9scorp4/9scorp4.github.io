# Fediverse

**Status: proposal. Nothing here is decided.** Unlike the other docs in this folder, this one is not yet authoritative — it's an assessment of options with a recommendation attached. When decisions get made, the settled parts move into `STACK.md` (architecture) and `ONTOLOGY.md` (vocabulary), and this file shrinks to the reasoning behind them.

## Why this isn't the Instagram question again

The Instagram pipeline treats a platform as a **billboard**: render a card, upload it, schedule it, never look back. There is no inbound channel. `insta-captions.ts` writes captions nobody replies to, and the site never learns anything from having posted.

The fediverse is not a billboard. It is a **correspondence medium** — closer to the visitors' book than to Instagram. Posts get replied to, quoted, and argued with by name. That difference is the whole reason this is worth thinking about, and also the reason a naive port of the Instagram pipeline would be the wrong move.

It matters that `humans.txt` already commits to a position on this:

> Collaboration, by contrast, requires presence: a prompt, a reply, a correction, a loop.

An account that only broadcasts into the fediverse and never answers would be the site contradicting its own stated policy in public, on a network whose culture notices exactly that. **Broadcast-only is not a cheap version of this integration. It's the one version that costs something.**

## Inventory: what's already here

More than expected. Almost nothing needs to be invented — most of it needs to be *aimed differently*.

| Asset | Where | Relevance |
|---|---|---|
| Full-content RSS | `src/pages/feed.xml.ts` | already unifies journal + ahora, resolves wikilinks, sanitizes HTML |
| OG images | `src/integrations/og-images.ts`, Satori | Mastodon renders link previews from `og:*` — already correct |
| Card renderer | `src/lib/insta-templates.tsx` | same Satori pipeline, needs a landscape variant |
| Publish CLI | `cli/commands/buffer/`, `src/lib/buffer-client.ts` | the shape a `jardin fedi` would copy |
| **Cloudflare Worker** | `workers/visitors/` | KV, cron triggers, admin auth, rate limiting, Analytics Engine |
| **Moderation queue** | `handlers/messages.ts` + `visitors sync` | submit → pending → approve → sync to content collection |
| **The graph** | `src/lib/mycelium-graph/` | typed nodes/edges, musical similarity by bpm/key/artist/genre |
| `ahora` collection | `src/content/ahora/` | dated dispatches — structurally already a microblog |

Two of these are the real story:

**The worker is a latent ActivityPub server.** It already has persistent storage, scheduled execution, request auth, and rate limiting. Those are four of the six things an actor needs. The missing two are HTTP Signatures (Workers' WebCrypto does RSASSA-PKCS1-v1_5/SHA-256) and a delivery queue.

**The moderation queue is a latent inbox.** `submit → pending → approve → sync` is exactly the pipeline a fediverse reply needs to travel. If replies ever land in the garden, they don't need a new subsystem — they need a second source into an existing one.

## Three constraints that shape everything

### 1. GitHub Pages cannot be an ActivityPub actor

Not "would be awkward" — cannot. An actor endpoint must return `application/activity+json` under content negotiation on the `Accept` header, and must accept signed `POST`s to an inbox. Static hosting does neither: no content negotiation, no way to set Content-Type on extensionless files, no POST.

One narrow exception is real and useful: **WebFinger works as a static file.** `/.well-known/webfinger` served as plain JSON is enough to alias a handle on this domain to an account hosted on somebody else's instance. Static hosts ignore the `?resource=` query string, which only matters if you want more than one handle. ([precedent](https://gist.github.com/junosuarez/012755df0243ad17d942ddf26eb707a7), [jwz](https://www.jwz.org/blog/2022/11/using-your-own-domain-as-a-mastodon-handle/))

So the fork is: **instance-hosted account (free, social) vs. worker-hosted actor (weeks, sovereign).** Not static-vs-dynamic.

### 2. Identity is domain-bound, and the domain is currently `9scorp4.github.io`

A fediverse handle is `@name@domain`. Whatever domain gets chosen is baked into every follow relationship. `@jardin@9scorp4.github.io` is *valid* but reads as a subdomain of somebody else's product, which is a strange flag to plant for a site whose entire argument is about not being somebody else's feedstock.

Mitigating fact: **Mastodon's `Move`/`alsoKnownAs` migrates followers between accounts.** Starting on an instance is not a trap — followers can be brought along later. Posts cannot; they stay behind. So the cost of starting cheap is *archive discontinuity*, not audience loss. That is an acceptable cost, and it means the sovereign option never has to be decided now.

The unmitigated version: if a custom domain is ever going to happen, it should happen **before** any handle is announced, not after. This is the single most consequential decision in the whole plan and it's the cheapest one to get wrong.

### 3. The robots.txt stance sets an editorial limit

`robots.txt` blocks ~30 AI crawlers and the layout ships `noai, noimageai`. Content posted to the fediverse is federated to every instance that sees it, cached there, and served by servers with no such policy. There is no `Disallow` for that.

This doesn't argue against posting — it argues for **posting teasers, not bodies**. Which happens to be editorially correct anyway: dispatches are short, articles want a link and a card. The boundary and the good taste point the same direction, which is usually a sign the boundary is real.

Small consistency fix regardless of what else happens: `robots.txt` has a "SOCIAL PREVIEWS — for sharing, not scraping" section listing Twitterbot, Discordbot, Slackbot. Mastodon's preview fetcher belongs there. Default-allow already covers it; the entry would be a statement, not a permission.

## Four postures

These are cumulative in capability but *not* a mandatory ladder — B is genuinely optional, and D may never be worth it.

### A — Presence (hours)

An account on an instance. Post by hand. Reply to people. Nothing in the repo changes except three lines of metadata.

- `rel="me"` link so the profile shows the verified-link checkmark back here. The footer already has `rel="me noopener"` on the Instagram link — same pattern.
- `<meta name="fediverse:creator" content="@handle@instance">` in `Garden.astro`. Mastodon 4.3+ renders an author byline on link previews, so anyone sharing a journal entry credits the account automatically. Requires adding the site's domain to the profile's allowed-websites list. ([docs](https://docs.joinmastodon.org/user/profile/), [writeup](https://stefanbohacek.com/blog/make-your-website-or-blog-fediverse-ready/))
- `og:image:alt` is currently missing from the layout. Alt text is a hard cultural norm in the fediverse, not a nicety. Cheap to add, and conspicuous by absence.

**Instance candidates**, given the live coding project: [`social.toplap.org`](https://social.toplap.org/@toplap) is the live coding home — practitioners, researchers, the TidalCycles and Strudel projects themselves. `sonomu.club` is musicians and algorave live coders. `post.lurk.org` is experimental/artistic computing and is arguably the better fit for the *garden's* half — Bateson-adjacent, small-tech, essayistic. `merveilles.town` similar. Worth reading each instance's about page and local timeline for a week before picking; the choice is a neighborhood, not a hosting decision.

**This posture alone captures most of the available value.** Everything below is amplification.

### B — Syndication (a weekend)

`jardin fedi` alongside `jardin buffer`. The Mastodon API is markedly simpler than Buffer's: media upload is one multipart POST, status creation is one JSON POST with a bearer token. No R2 needed — the instance hosts the media. So this is *less* infrastructure than the Instagram path, not more.

Design notes that matter:

- **The unit is the `ahora` dispatch, not the journal entry.** Dispatches are already short, dated, and low-stakes. `buildAhoraContent()` in `feed.xml.ts` already assembles prose + tracks + announcements into one blob — most of the composer exists.
- **Manual trigger, not a cron.** `sync-visitors.yml` runs every 6h and that's correct for inbound. Outbound automation is what makes an account read as a bot. Keep a human in the loop, same as `jardin buffer` today.
- **Alt text required, not optional.** `BufferPostInput.altText` is optional; the fedi equivalent should be non-optional at the type level. Enforce it in the schema and the norm enforces itself.
- **A landscape card variant.** Timeline media is displayed at roughly 16:9; 1080×1080 and 1080×1350 both crop badly.
- **Hashtags actually work here.** There is no algorithm — hashtag follows *are* the discovery mechanism. `insta-captions.ts` already generates hashtags for a platform that mostly ignores them. Same function, different list, and this time it does something.

### C — Portable identity (hours, plus a domain)

Buy a domain. Serve `/.well-known/webfinger` as a static file from `public/`, aliasing `@handle@domain` to the instance-hosted account from posture A. Handle is portable and yours; the account stays on the instance where the community is.

This is the sweet spot: **sovereign identity, community hosting, no ActivityPub implementation.** It also has to be done before announcing a handle, or the migration cost is already paid.

Caveat to verify at build time, not on faith: Astro copies `public/` verbatim including dotfiles, and the Pages deploy bypasses Jekyll — but confirm `.well-known/` actually survives into `dist/` and gets served before relying on it.

### D — Sovereign actor (weeks, ongoing)

Full ActivityPub in the visitors worker: actor document with content negotiation, RSA keypair, `/inbox` with signature verification, follower list in KV, signed delivery with retries on the existing cron.

The honest accounting:

- **What it buys:** the garden itself becomes followable. No instance can defederate you or shut down. Replies land in the worker.
- **What it costs:** signature verification is unforgiving, delivery needs retry logic, moderation becomes your problem, and a single-actor server is a spam target. This is a maintained service, not a feature that ships once.
- **What it doesn't buy:** community. A self-hosted actor that only publishes is a feed with extra steps. The people are on instances.

Recommendation: **not now, possibly never.** Revisit only if inbound volume from posture A justifies owning the inbox. Keep `alsoKnownAs` in mind so the door stays open.

## Recommendation

**A → C → B, and stop.** Presence first, portable identity before announcing anything, syndication only once there's a rhythm worth syndicating. D stays a live option, not a plan.

The ordering matters more than the contents: getting the domain question settled before the handle is announced is worth more than any amount of tooling built afterward.

## The two-audiences problem

The garden is Bateson, second-order cybernetics, trilingual essays. The live coding project is Tidal/Strudel/algorave. These overlap — both are about pattern, feedback, and systems that produce themselves — but they are not the same room, and the fediverse has no algorithm to sort them.

Three options:

1. **One account, hashtag discipline + content warnings.** The fediverse's native answer. CWs let people collapse what they didn't come for; hashtag follows let them find what they did. Lowest maintenance, and the overlap is genuine enough to defend.
2. **Two accounts.** Clean separation, double the tending. Presence is the scarce resource here, and splitting it halves the thing that makes any of this work.
3. **One account, and let the overlap be the point.** Live coding *is* the garden's argument in another medium — a system that produces itself, corrected in public, in real time. The essays already say this; the patches would demonstrate it.

Option 3 is the most interesting and the riskiest. Option 1 is the safe version of it and can become 3 without any migration cost.

## What the fediverse gives that Instagram never did

Three things, in ascending order of how much they matter.

**1. Discovery that isn't a lottery.** Hashtag follows mean `#livecoding` reaches people who asked for `#livecoding`. Cross-posting essays to a room that already reads Bateson is a different proposition than posting them into an engagement feed.

**2. Live coding fits the graph natively.** This is the strongest technical finding.

`buildMusicalEdges()` connects tracks by same-dispatch, adjacent-days, same-artist, similar-BPM, same-key, shared-genre. A live-coded piece **has all of those fields by construction** — you wrote the tempo, you chose the key. The `escuchando` schema (`bpm`, `key`, `openKey`, `timeSignature`, `genre`, `mood`, `energy`) fits a Strudel patch without a single schema change.

So: a `tocando` slot in `ahora`, parallel to `escuchando` and consistent with `cultivando`. A new `NodeType` — `patch`, or `sesión` — rendered distinctly on the canvas. And then **the graph shows what you make sitting inside what you hear**, wired together by tempo and key rather than by category. Nobody has to build the similarity logic; it already runs.

This is the one item on this page that would make the site materially more interesting even if the fediverse part never happened.

**3. Replies can close the loop.** `CLAUDE.md` asks for a corrective channel — *how do i know thou knowest thyself enough in order to make thee grow?* The visitors' book is currently the only inbound path, and it's a console on a page most visitors never open.

Replies from a community that actually practices this stuff are a corrective channel with real signal. And the machinery to receive them is already written: `submit → pending → approve → sync`. Under posture A this is manual (read a reply, decide it belongs, paste it in). Under D it's automatic. Either way it's the same queue.

Note the tension honestly: fediverse replies are already public. Ingesting them into the garden re-publishes them somewhere the author didn't choose, which is a small version of the extraction `humans.txt` objects to. **Ask before quoting.** A `fuente: fediverso` field on the visitors schema plus a link back to the original post is the minimum; explicit consent is the actual answer.

## Measuring it

Current analytics will undercount badly. `SOCIAL_DOMAINS` in `cli/lib/analytics-base.ts` substring-matches `'mastodon'` — which misses `toplap.org`, `sonomu.club`, `post.lurk.org`, `merveilles.town`, and essentially every instance that isn't literally named mastodon.

Better signal, and native to what's already deployed: **count link-preview fetches per unique instance in the worker.** Mastodon fetches a preview once per instance, identifying itself as `Mastodon/4.x.x (+https://instance.tld/)`. Unique instances that fetched a URL ≈ the number of servers where someone posted it. That's a reach metric that doesn't require tracking a single person, which is the only kind this site should want.

## Open questions

Answers to these change the plan materially:

1. **Custom domain — yes or no?** Everything hinges on it, and it's cheapest to answer first.
2. **Does the live coding project have a name, a repo, a public presence yet?** It probably wants to be a `cultivation` regardless of what happens with the fediverse.
3. **Is there already an account, or a home instance in mind?** Existing standing in that community changes the recommendation from "join" to "connect what's already there."
4. **One identity or two?** See above; defaults to one.
5. **Is the goal audience, or correspondence?** Posture A serves correspondence. B serves audience. They are not the same goal and B is not the bigger version of A.
