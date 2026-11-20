# Counter Space

An Amazon affiliate publication covering three air fryers and two meat thermometers,
built around five submitted `link.amazon` short links and Tracking ID `shopnow047c-20`.

**Live:** https://sassnarep3-star.github.io/WinA/

The site is a static build with no runtime dependencies. `node _src/build.mjs` regenerates
every page from the JSON in `data/` and then runs a publication gate that fails on
compliance or fabrication regressions.

---

## Why it is built this way

Before writing anything, the Amazon Associates Operating Agreement and Program Policies
were read and the constraints applied. Three of them shaped the whole design:

| Requirement | Effect on the build |
|---|---|
| OA §5 — must state *"As an Amazon Associate I earn from qualifying purchases."* | Printed verbatim under the masthead on every page, repeated in the footer. The build fails if either disappears. |
| Policies §6(t) — no star ratings or customer reviews without Creatives/PA-API | Ratings and review counts are displayed as **withheld**, with the reason, not left blank. |
| Policies §6(y) — no price tracking or alerting | No prices anywhere. Price fields are marked unverified. |

Two more shaped the writing:

- **FTC Disclosures 101** requires the disclosure to be hard to miss and placed with the
  endorsement — hence the strip under the masthead rather than a footer-only notice.
- **FTC:** *"You can't talk about your experience with a product you haven't tried."* No page
  claims testing. Every guide is written about the decision rather than a verdict.

Nothing on the site is inferred. Where a value could not be confirmed from an official
source it is blank and marked `unverified`; where policy forbids display it is marked
`withheld`. The gate enforces that a spec cannot carry both a value and an unverified status.

---

## Layout

```
archive/              prior sessions' builds, preserved verbatim (not served)
  arena-4a5044b0/     first build; recorded Amazon as unreachable (superseded, FLG-017)
  arena-6bd1be15/     second build; verification log behind FLG-016
  arena-2ca62ce9/     third build; 18-item flag register + source register SRC-01..11
data/                 the single source of truth
  products.json       products, specs, verification status, categories, site config
  policy.json         primary sources + compliance register with quoted clauses
  governance.json     flagged items, campaign ledger, event definitions
  questions.json      22 open questions with what is missing and how to close it
  suggestions.json    16 reviewable suggestions with cost, risk and recommendation
_src/
  build.mjs           renders all pages, sitemap, feed, robots, 404, then gates
  content.mjs         the ten guides
  art.mjs             original SVG schematics and spot drawings (no Program Content)
  pages-content.mjs   about, disclosure, privacy, marketing, SEO prose
  serve.mjs           local preview server (mirrors the /WinA/ subpath)
_worker/
  collector.js        first-party analytics collector, not deployed
assets/css/site.css   design system, plus the reader-polish layer (art frames, bands)
assets/js/site.js     five events + sponsored-link confirmation
assets/img/           favicon and the social card — the only two raster/vector assets served
```

Generated output lives at the repo root so GitHub Pages serves it directly from `main`.

---

## Build

```bash
node _src/build.mjs        # regenerate + validate
node _src/serve.mjs 8080   # preview at http://localhost:8080/WinA/
```

No `npm install` is required. There are no dependencies.

`VALIDATION.md` is rewritten on every build and lists every check with its result.

### The gate

The build exits non-zero if any of these fail:

1. Every page carries the disclosure strip above `<main>`.
2. Every page carries the exact Associate statement required by OA §5.
3. Every page declares a canonical URL.
4. Every Amazon anchor is either a tagged sponsored link **or** a declared
   non-affiliate citation (`data-nonaffiliate`). Ambiguous links fail.
5. No star ratings or review quotes appear anywhere.
6. No spec carries a value while marked `unverified` or `withheld`.
7. Every policy row quotes a clause and links a primary source.
8. All internal links resolve.
9. The sitemap lists every page.

CI runs the same command on every push (`.github/workflows/build.yml`).

---

## Deploying the analytics collector

Analytics are **off** right now. `gov.analytics.enabled` is `false` and the endpoint is
empty, so the client returns immediately and sends nothing. This is deliberate: a client
posting into a void would look like measurement while producing none.

To turn it on:

1. Deploy the worker:
   ```bash
   wrangler deploy _worker/collector.js --name cs-collector \
     --compatibility-date 2026-01-01
   wrangler secret put ALLOWED_ORIGIN   # https://sassnarep3-star.github.io
   ```
2. Bind a KV namespace as `EVENTS` (30-day TTL is set in code).
3. In `_src/build.mjs`, change the `CS_CONFIG` line to emit the real endpoint and set
   `analyticsEnabled: true` — or flip `enabled` in `data/governance.json` and pass the URL
   through the same config.
4. Rebuild and commit.

**Or host the dependency-free collector in this repository instead**, on any host that can run
Node 20+:

```bash
HOST=0.0.0.0 PORT=8080 STATE_DIR=/var/lib/cs DATA_DAYS=30 \
ALLOWED_ORIGINS=https://sassnarep3-star.github.io \
SUMMARY_TOKEN=<a long random string> \
node scripts/analytics-server.mjs
```

It speaks the same payload as the worker — props nested under `p`, exactly as
`assets/js/site.js` sends them — and stores the same row (day, event, path, ASIN, slot, coarse
viewport class). `scripts/analytics-selftest.mjs` starts it on an ephemeral port and asserts the
collector contract end to end, including that a click keeps the ASIN that earned it; it runs in
CI, so the two collectors cannot drift apart unnoticed. (`ALLOWED_ORIGINS` for the server,
`ALLOWED_ORIGIN` for the worker — the names differ because the runtimes differ.)

The five events are defined in `data/governance.json` and documented at `/analytics/`.
The collector stores a day bucket, event name, page path, ASIN and coarse viewport class.
It does not store IP addresses, user agents, referrers, or any identifier.

---

## Editing content

All copy that matters lives in `data/` or `_src/content.mjs`. To add a guide, append an
object to `guides` in `_src/content.mjs` with `slug`, `number`, `title`, `dek`, `category`,
`readingTime`, `topics`, `intro`, `body` and `takeaways`. The build picks it up and adds it
to the sitemap and the feed automatically — that was a requirement, not a convenience.

To add a product, add it to `data/products.json` with a `specs` array where **every** entry
declares a `status`. Use `null` for any value you cannot verify. The gate will reject a
value without a source on a `verified` row, and a value on an `unverified` row.

Guide bodies are raw HTML inside a template literal. Use `{BASE}` where an internal link
needs the site prefix — it is substituted at build time.

---

## Things that are deliberately missing

- **Prices** — no PA-API/Creatives access; §6(y) also forbids price tracking.
- **Ratings and reviews** — §6(t) forbids display without API access.
- **Product photography** — Program Content may not be hot-linked or stored; a different
  appliance's photo would misrepresent the item.
- **Testing claims** — no testing took place.
- **Traffic, conversion and revenue figures** — there is no data yet, so none is presented.

Every gap above is published on the `/flagged/` page with a source link and the specific
action that would close it.

---

## Open actions, in order

1. Confirm one link per product appears in the Associates tracking report
   (**FLG-004** — if the ID is not enrolled, nothing earns).
2. Deploy the collector (**FLG-011**).
3. Verify Search Console and replace the placeholder token (**FLG-009**).
4. Publish one guide a week for eight weeks, then read the query report.

Full detail: `/questions/`, `/suggestions/`, `/summary/`, `/flagged/`.

---

## Coordination

`COORDINATION.md` is the shared task board. **Read it before writing anything.** Four sessions
have already built four different sites on this repo, because each one started a fresh build
instead of extending what was on `main`. The board records how that happened and what it cost.

If `main` already builds, extend it. Claim your scope on the board and push the claim before
you write code.

### Archives

`archive/` holds three complete prior builds, preserved unchanged. They are real files under
`/archive/...` and are linked from `/flagged/`, but they are excluded from the publication
gate on purpose: the point of an archive is that it stays exactly as it was.

No prior session's finding was deleted. All 18 items from the previous register are folded
into `data/governance.json` as FLG-013…023, each naming the ID it came from.

---

## Second gate and one real fix (session `41096d21`)

Four sessions built four sites on this repo. This one had a fifth parked at `/v2/` and, on
discovering the current `main`, **deleted it rather than ship a fifth**. `scripts/check-site.mjs`
was kept, because a second gate written independently is worth more than the site it was written for.

It immediately found a live defect that the authoring gate could not see.

### Unsponsored Amazon links on evidentiary pages

`_src/build.mjs` scanned Amazon anchors with:

```js
/<a\b[^>]*href="(https:\/\/www\.amazon\.com[^"]*)"[^>]*>/g
```

That pattern only matches `www.amazon.com`. Every `link.amazon/...` anchor was invisible to it —
so `/flagged/`, `/questions/`, `/register/` and `/suggestions/` rendered the five submitted short
links as plain `<a rel="noopener">` and the gate reported "every Amazon anchor is either a tagged
sponsored link or a declared non-affiliate citation" while six of them were neither.

Each of those links opens a live Amazon product page. FTC 16 CFR 255.5 wants the material
connection disclosed next to such a link, and it was not.

Fixed at the source, so it survives regeneration:

1. The anchor sweep now matches `amazon.*`, `link.amazon` and `amzn.to`.
2. `cite()` routes every one of those domains, rather than only `amazon.com`.
3. The suggestions table and governance source column, which built their own anchors, now go
   through `cite()` too.

Submitted short links carry no Associates tag, so they earn nothing and are marked
`rel="nofollow" data-nonaffiliate="true"` — a declared evidence citation. Calling them sponsored
would be a false claim; leaving them undeclared is what the gate now forbids.

### The gate now distinguishes three states, not two

| Rendered as | Meaning | Verdict |
|---|---|---|
| `rel="sponsored"` + `?tag=` | monetised Special Link | pass |
| `rel="nofollow"` + `data-nonaffiliate="true"`, no tag | evidence citation | pass |
| anything else | ambiguous | **fail** |
| sponsored without a tag | earns nothing, misleads | **fail** |
| both sponsored and non-affiliate | contradictory | **fail** |

All three failure modes were confirmed by injecting a deliberately bad anchor and watching the
gate fail, then reverting.

**Current state — all gates green (2026-11-20, after the reader-polish merge):**
`node _src/build.mjs` → 36 pages, 35 in the sitemap, all gates clear;
`node scripts/check-site.mjs` → 36 pages, 1,470 internal links, 141 Amazon links (118 sponsored,
12 declared citations, 13 short-link anchors), zero failures;
`node scripts/compliance-gate.mjs` → 1,652 checks, 0 failing, 1 owner-only warning (FLG-024);
`node scripts/publish-gate.mjs` → 4 checks, 0 failing. Build verified byte-reproducible.

CI now runs both gates plus a stale-artefact check, because this merge did resurrect `shop/`,
`tools/`, `dashboard/` and `guides/` from an older build — exactly the failure the previous
session's note warned about, and it recurred.

### Session arena-59299521-wina (2026-11-20)

Integrated the `arena/59299521-wina` work into `main` (PR #7):
- Added guide 05 "Instant-read or wireless: which meat thermometer fits your grill?" (`guides/instant-vs-wireless/`) to `_src/content.mjs`.
- Tagged both thermometer products (B0DHZTCNR5 ThermoMaven, B0DZFD6R9Z CHEF iQ Sense) with `instant-vs-wireless` in `data/products.json` so the guide page renders tagged sponsored affiliate links.
- Removed stale flat guide `guides/instant-read-or-wireless.html`.
- Rebuilt with `node _src/build.mjs`: 28 pages, 27 in sitemap, publication gate PASSED (canonical + all Amazon anchors `rel="sponsored"` + `data-affiliate` + `tag=shopnow047c-20`).
- All five affiliate links verified against official Amazon listings 2026-11-20; intended ASINs left blank and flagged (FLG-001/FLG-002).

---

## Commands, gates and where to look

The repository has no dependencies; every command is Node standard library.

| Command | What it does |
| --- | --- |
| `node _src/build.mjs` | Regenerates all 36 pages, the sitemap, the feed and `VALIDATION.md` from `data/`, then runs the publication gate (disclosure, tags, counts, links, archive) |
| `node scripts/check-site.mjs` | Independent structural gate: canonicals, meta, headings, alt text, asset hosts, JSON-LD, every internal link, sitemap parity, RSS |
| `node scripts/compliance-gate.mjs` | Money-and-trust gate: disclosure **order**, three-state link classification, claim bans, register cross-references, schema bans, source staleness |
| `node scripts/compliance-gate.mjs --refresh-sources` | Re-reads every cited policy page and diffs the text we quote; warns past 90 days |
| `node scripts/publish-gate.mjs` | Runs all three, proves the build is reproducible, prints the publish decision and what a human still owes |
| `node scripts/collect.mjs` | Folds `data/inbox/*.json` into the register with provenance; refuses unsourced values, prices and ratings |
| `node scripts/next-topics.mjs` | Ranks candidate guides from a Search Console export in `data/exports/`; refuses to rank without one |
| `node scripts/analytics-server.mjs` | Self-hosted collector, same contract as `_worker/collector.js` (five events, key allow-list, 30-day retention, `/summary`) |
| `node scripts/analytics-selftest.mjs` | Starts the collector on an ephemeral port and asserts its contract end to end; also compares the worker and the server against each other and against the register. Run in CI |

Reading order for a reviewer: **`EXECUTIVE_SUMMARY.md`** (state of the project, one page) →
`ARCHITECTURE.md` (why each piece is built this way, and the two human checkpoints) →
[`/register/`](https://sassnarep3-star.github.io/WinA/register/) (every value with its source and
date) → [`/flagged/`](https://sassnarep3-star.github.io/WinA/flagged/) (29 open and resolved
findings) → [`/suggestions/`](https://sassnarep3-star.github.io/WinA/suggestions/) (what to do next,
by path) → [`COORDINATION.md`](COORDINATION.md) (who did what, and the four-build collision record).

Three gates, deliberately overlapping: each has found something the others could not see, on this
repository, in production. `npm run check` (or `node scripts/publish-gate.mjs --committed`) is what
CI runs, and Pages serves exactly what is in the tree.

---

## Session arena/574fc8eb-wina — archived parallel build (T27, PR #26)

A session that started from the pre-site commit (`df3e953`, when `main` held only this file)
completed a full independent build while other sessions were merging the publication you see above.
Its complete site — publication front page, shelf, five question-shaped guides, analysis,
suggestions review with a records-only path chooser, open questions, executive summary, flagged
page, platform/source register, search — plus its data, generator and compliance gate are preserved
at **`archive/arena-574fc8eb-wina/`**, following this repository's archive convention. The served
root site was not modified by that session.

```bash
python3 archive/arena-574fc8eb-wina/scripts/build_site.py   # rebuild the archive
python3 archive/arena-574fc8eb-wina/scripts/check_site.py   # its compliance gate
```

CI runs both on every push (`.github/workflows/gate.yml`, scoped to the archive). The session's
independent 2026-11-20 verification agrees with `data/links.json` on all five observed
destinations; its session record, verification log and integration decision are appended to
`COORDINATION.md` (T27).

