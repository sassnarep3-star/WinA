# WinA — The Counter Guide

Publication site for five submitted Amazon listings (three air fryers & ovens, two meat
thermometers), with question-shaped buyer guides and a dashboard of sources, findings,
questions, suggestions and flags.

- **Live site:** https://sassnarep3-star.github.io/WinA/ — GitHub Pages, source `main` `/`
- **Preview edition:** https://sassnarep3-star.github.io/WinA/v2/ — a second, deeper build of the
  same catalogue, kept separate so the owner can compare and choose
- **Data:** `data/*.json` (single source of truth; every row cites an official source; blanks are
  unverified and flagged)

Associates disclosure: **As an Amazon Associate I earn from qualifying purchases.**

---

## Two sites, one repository

| | Main site (root) | Preview edition (`/v2/`) |
|---|---|---|
| Source | `tools/build.py` (Python, no deps) | `v2/src/scripts/build.mjs` (Node, no deps) |
| Registers | `data/*.json` | `v2/src/data/*.json` |
| Pages | 19 | 23 |
| Gate | `scripts/check-site.mjs` | `v2/src/scripts/verify.mjs` + repository gate |
| Shape | Product-led shop with a dashboard | Typographic publication with per-product spec tables |

Both are gated. Nothing ships unless every check passes.

## Build

```bash
python3 tools/build.py            # main site → repo root (the Pages source)
node v2/src/scripts/build.mjs     # preview edition → /v2/
node v2/src/scripts/verify.mjs    # preview edition gate
node scripts/check-site.mjs       # whole-repository gate — the one that decides ship/no-ship
```

`scripts/check-site.mjs` is the important one. It reads the repository **as it will be served** and
fails on: a missing or mis-placed disclosure, an unsponsored Amazon link, a price literal in visible
text, a missing canonical, a broken internal link, a sitemap that does not match the pages, a
malformed JSON-LD block, a third-party asset, an invalid feed, or an affiliate link inside the feed.

Current state: **42 pages, 1,405 internal links, 253 Amazon links (all sponsored), zero failures,
zero warnings.**

## Deploy

Push to `main` → `.github/workflows/pages.yml` runs both builds, both gates, a reproducibility
check, then deploys. The deploy job depends on `verify`, so a failing gate leaves the previous
version live.

## Rules this site follows

1. A fact is published only when a primary source states it, and that source is linked from the
   same row. Otherwise the cell says unverified.
2. Where a listing contradicts itself, the contradiction is printed rather than smoothed over.
3. No prices. Amazon's Program Policies permit price display only when Amazon supplies the data or
   it comes from the Creators/PA API; a static site does neither.
4. Every buyable Amazon link is tagged with the Associates ID and marked `rel="sponsored"`.
5. No claim of hands-on testing. None of the five products has been held by a human.

## Where to start reviewing

1. `dashboard/flagged.html` — what could not be confirmed, and why
2. `v2/flags/index.html` — the same, in the preview edition, with source links
3. `dashboard/suggestions.html` and `v2/suggestions/index.html` — decisions waiting on the owner;
   nothing in either list has been implemented
4. `COORDINATION.md` — every session, its sources, and its verification record

## Archive

`archive/arena-4a5044b0/` and `archive/arena-6bd1be15/` hold earlier root-level sites, preserved
unchanged and not linked from the live site. `robots.txt` disallows `/archive/`.
