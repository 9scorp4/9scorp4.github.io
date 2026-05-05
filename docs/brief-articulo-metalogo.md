# Brief: artículo + metálogo · diptych pattern for *cuaderno de campo*

**For:** Claude Code, working in `9scorp4.github.io` repo
**Author:** nico
**Date:** 2026-05

---

## 1. What we're building

A new sub-genre within the `cuaderno de campo` section: the **diptych entry** — a single page that pairs a long-form prose reflection (the *artículo*) with a Bateson-style metalogue (the *metálogo*) that answers back.

The relationship between the two pieces is not parallel but recursive: the article is the map, the metalogue is the territory talking back. The page should make that relationship visible without explaining it.

This brief covers two things:
1. **Implement the diptych pattern as a reusable template.** Future *cuaderno* entries should be able to use it by authoring two pieces.
2. **Use the included content as the first instance** at slug `lo-que-corrige-el-mapa`.

Follow existing conventions in `CLAUDE.md`, `docs/ONTOLOGY.md`, `docs/PALETTE.md`, and `docs/STACK.md`. Don't deviate from the established voice/aesthetic of the site.

---

## 2. User-facing experience

A reader lands on the entry's URL. They see:

1. **Title** (bilingual, primary title in Spanish or French, secondary in English, matching the existing *cuaderno* convention)
2. **Date and section breadcrumb** (e.g., *cuaderno de campo · 2026-05*)
3. **Preamble line** — one or two italic sentences naming the dual-voice form. For this entry: *"notas de campo en dos voces · field notes in two voices — one writes, one answers back."* This line should be configurable per entry.
4. **The article body** — long-form prose, scrollable, no internal headers, em-dash dividers between sections.
5. **The seam** — a visual transition between article and metalogue. This should feel garden-ish: a botanical glyph, a hand-drawn-style divider, a CSS-only ornament — something that signals *the path opens into a clearing*. It should not be a generic horizontal rule.
6. **The metalogue body** — script format (`I:` and `DOG:` lines), em-dash dividers between movements, no internal headers.
7. **A return marker** at the end — small text linking back to the start of the entry: *"↑ regresar al inicio · back to the top"* or similar. CSS-only, no JS required.

The whole thing is one URL, one page, scrolled top to bottom. No tabs, no toggles, no scroll-triggered animations. Mobile-first.

---

## 3. Reusability requirement

This pattern should be authorable for future entries with minimal friction. The author should be able to:

- Create a new diptych entry by adding content in one place (a single file or a small folder with two clearly-named files — your call).
- Set per-entry preamble, title (primary + secondary), date, tags, and slug via frontmatter.
- Have the page render automatically with the diptych template.

Implementation latitude: you decide whether this is best done as a single MDX file with structural markers, a folder containing two markdown files with a shared metadata file, or a content collection with `article_body` and `metalogue_body` fields. Pick the option that fits Astro idiom and the existing repo structure best. Document the choice in `docs/ONTOLOGY.md` so future entries can follow it.

The diptych is a *type* of *cuaderno* entry, not a separate section. Index pages for *cuaderno* should list diptychs alongside regular entries, with a small visual marker (e.g., a paired-glyph icon) indicating the dual-voice form.

---

## 4. Open implementation decisions

You decide:

- **Content structure**: single MDX file vs. folder with two files vs. content collection with two body fields.
- **Seam component**: a small Astro/SVG component, a CSS-only ornament, or a unicode glyph styled with the site's type tokens. Make it feel native to the *jardín cibernético* aesthetic.
- **Metalogue rendering**: whether to style the dialogue lines with custom CSS (e.g., role labels in small caps, hanging indent for replies) or render them as plain prose. Lean toward minimal styling that respects the script format without over-designing it.
- **Return marker**: anchor link, scroll-to-top button, or end-of-entry footer. Whichever is most consistent with existing nav patterns.
- **Indexing**: how diptychs appear in the *cuaderno* index. A small visual marker is required; the rest is your call.

---

## 5. Acceptance criteria

The implementation is done when:

- [ ] The first diptych entry is live at `/cuaderno/lo-que-corrige-el-mapa` (or whatever the existing slug pattern is for *cuaderno* entries).
- [ ] The page renders the article, the seam, the metalogue, and the return marker in that order, on one URL, scrollable top to bottom.
- [ ] On mobile (375px width), the page reads cleanly without horizontal scroll, oversized type, or broken seam.
- [ ] The diptych template is documented in `docs/ONTOLOGY.md` with an example showing how to author a new entry.
- [ ] The *cuaderno* index page lists this entry with a marker indicating it's a diptych.
- [ ] No new dependencies added unless necessary; if MDX support needs adding, document the addition.
- [ ] `npm run build` succeeds without warnings; `npm run dev` renders the page correctly locally.
- [ ] Existing entries and routes are unaffected.

---

## 6. Content for the first instance

Two source files accompany this brief. Use the body content of each verbatim — do not edit the prose; only adapt frontmatter to match the schema you choose.

- **Article body:** `lo-que-corrige-el-mapa.md` — body becomes the *artículo*.
- **Metalogue body:** `metalogo-como-me-reconoces.md` — body becomes the *metálogo*.

Treat those two files as the canonical source. If anything in this brief contradicts the source files, the source files win for body content; the brief wins for structure, frontmatter, and rendering.

Suggested shared frontmatter for the merged entry (reconcile with whatever schema you pick):

```yaml
title: "Lo que corrige el mapa"
title_secondary: "what corrects the map"
section: cuaderno
type: diptych
date: 2026-05-04
slug: lo-que-corrige-el-mapa
preamble: "notas de campo en dos voces · field notes in two voices — one writes, one answers back"
tags: [bateson, mind, ai, recognition, cybernetics]
status: published
```

The metalogue should display with the subtitle **"cómo me reconoces · how do you recognize me"** and the epigraph *"after Bateson's metalogues — a form in which the structure of the conversation enacts the question being asked."* These already appear in the metalogue source file; preserve them in rendering.

End-of-entry colophon (small italic text after the metalogue, before the return marker):

> *Field journal entry. Half-formed by design. The dog is hypothetical and also, in the sense that matters, not.*

---

## 7. Notes on style and constraint

- **Voice fidelity matters.** Don't auto-format the dialogue with bold role labels or speech bubbles. Don't wrap the seam in ornate framing. Restraint is part of the aesthetic.
- **Bilingual conventions.** Section names and titles follow the existing `primary · secondary` pattern. Don't translate body text; only metadata is bilingual.
- **No JS unless required.** The page should work with JS disabled, except for any minor enhancement (e.g., smooth-scroll on the return marker, which is acceptable but not required).
- **Type and color.** Use existing tokens from `docs/PALETTE.md`. If a new token is needed for the dialogue's role labels (e.g., a slightly muted color for `DOG:` and `I:`), document the addition.

---

## 8. After implementation

When the entry is live and the template is documented, commit with a message that names both the instance and the pattern, e.g.:

```
feat(cuaderno): first diptych entry "lo-que-corrige-el-mapa" + reusable diptych template
```

Update the *cuaderno* index and any sitemap/RSS as appropriate.

That's the brief. The judgment calls are yours; the structure and content are mine. Ask if anything's ambiguous before building.
