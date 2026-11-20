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
  questions.json      27 open questions with what is missing and how to close it
  suggestions.json    28 reviewable suggestions, a design brief, a topic roadmap and a decision log
  special_link_tests.json  one link test per product, blocked on the owner's Associates account
  inbox/  exports/    collector drop-points (ignored; the register keeps what is confirmed)
_src/
  build.mjs           renders all pages, sitemap, feed, robots, 404, then gates
  content.mjs         the seven guides, the finder questions and the artwork captions
  design.mjs          the reader-facing layer: figures, to-scale diagrams, guide furniture
  pages-content.mjs   about, disclosure, privacy, marketing, SEO prose
  serve.mjs           local preview server (mirrors the /WinA/ subpath)
_worker/
  collector.js        first-party analytics collector, not deployed
assets/css/site.css   design system (the T26 layer is appended, so it can be reviewed as one block)
assets/js/site.js     five events + sponsored-link confirmation + the finder (records nothing)
assets/img/           four original illustrations and the favicon — no Amazon or stock imagery
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

**Current state — both gates green:** `node _src/build.mjs` → 27 pages, all gates clear;
`node scripts/check-site.mjs` → 27 pages, 946 internal links, 120 Amazon links (108 sponsored,
12 declared citations), zero failures. Build verified byte-reproducible.

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
| `node _src/build.mjs` | Regenerates all 29 pages, the sitemap, the feed and `VALIDATION.md` from `data/`, then runs the publication's own 9 gates |
| `node scripts/check-site.mjs` | Independent structural gate: canonicals, meta, headings, alt text, asset hosts, JSON-LD, every internal link, sitemap parity, RSS |
| `node scripts/compliance-gate.mjs` | Money-and-trust gate: disclosure **order**, three-state link classification, claim bans, register cross-references, schema bans, source staleness |
| `node scripts/compliance-gate.mjs --refresh-sources` | Re-reads every cited policy page and diffs the text we quote; warns past 90 days |
| `node scripts/publish-gate.mjs` | Runs all three, proves the build is reproducible, prints the publish decision and what a human still owes |
| `node scripts/collect.mjs` | Folds `data/inbox/*.json` into the register with provenance; refuses unsourced values, prices and ratings |
| `node scripts/next-topics.mjs` | Ranks candidate guides from a Search Console export in `data/exports/`; refuses to rank without one |
| `node scripts/analytics-server.mjs` | Self-hosted collector, same contract as `_worker/collector.js` (five events, key allow-list, 30-day retention, `/summary`) |

Reading order for a reviewer: **`EXECUTIVE_SUMMARY.md`** (state of the project, one page) →
`ARCHITECTURE.md` (why each piece is built this way, and the two human checkpoints) →
[`/register/`](https://sassnarep3-star.github.io/WinA/register/) (every value with its source and
date) → [`/flagged/`](https://sassnarep3-star.github.io/WinA/flagged/) (43 open and resolved
findings) → [`/suggestions/`](https://sassnarep3-star.github.io/WinA/suggestions/) (what to do next,
by path) → [`COORDINATION.md`](COORDINATION.md) (who did what, and the four-build collision record).

Three gates, deliberately overlapping: each has found something the others could not see, on this
repository, in production. `npm run check` (or `node scripts/publish-gate.mjs --committed`) is what
CI runs, and Pages serves exactly what is in the tree.

---

## The design layer, and why it is allowed to exist (session `arena-3818c975-wina`, T26)

The site had a written design brief and no design. This section records what closed that gap and the
one constraint that shaped every choice in it.

**The constraint.** Program Content may not be stored or hot-linked outside approved tools, so there
is no licensed route to product photography without Product Advertising API access (FLG-007). The
brief's answer was to stay typographic. Staying typographic is what an audit looks like, so T26 took
the other branch of the same rule instead: **four original illustrations, commissioned for the
publication, drawn on its own palette, and captioned on the page as artwork rather than as product
images**. Nothing on this site depicts an appliance for sale, so no picture can be mistaken for the
item a sponsored link leads to. A build gate enforces it — every `img` must resolve to a real file
under `/assets/img/`, carry descriptive alt text and intrinsic size, and fail if its `src` names
`amazon`, `media-amazon`, or any stock library.

**The visuals that are not decoration.** Two figures are drawn from the register's own verified
numbers: a top-view counter footprint (`158 in²` for the 6-quart against `267 in²` for the 26QT,
"69% more counter") and a stated-capacity comparison. Published measurements appear exactly as
published — `13.38 in`, never `13.4` — and where a brand has not published a figure the diagram draws
a dashed empty box and says why (FLG-028). The cross-check is mechanical: `assertFigure()` refuses to
build if a drawn number is not present in the spec row it cites, so an image cannot survive a data
correction by being wrong in a flattering direction.

**The finder.** Three questions on the front page map to one of the five products with the reason
attached, in the browser, and record nothing — a gate asserts that the finder's script block contains
no `fetch`, beacon, storage or cookie call. Its five answer cards are rendered in the served HTML with
their tagged `rel="sponsored"` anchors precisely because anchors created at run time are invisible to
the compliance gate; with JavaScript off, all five stay visible, which is still an answer.

**The voice rule.** 42 filler phrases that mark a generated marketing page are published on `/about/`
and banned by the build. The rule is quote-aware: naming a banned phrase in order to ban it passes, and
a register quoting somebody else's claim passes, while an unattributed hands-on sentence on a reader
page fails the build — confirmed by injecting one and watching it go red.

**Reviewing it.** Every accepted and deferred item is recorded with a date and a reason in the decision
log on [`/suggestions/`](https://sassnarep3-star.github.io/WinA/suggestions/);
[`/flagged/`](https://sassnarep3-star.github.io/WinA/flagged/) carries FLG-036 to FLG-039, including
the finding that four of the five submitted short links returned Amazon's home page when re-opened on
2026-11-20.

```
node _src/build.mjs              # 32 pages, then the gates: disclosure, links, claims, voice, images, figures
node scripts/check-site.mjs      # independent gate: links, canonicals, feed, a11y, three-state sponsored classification
node scripts/compliance-gate.mjs # 1,220 assertions over the served tree, including "99 tagged links, 0/5 link tests recorded"
node scripts/publish-gate.mjs    # reproducibility + the human checkpoints; --committed is what CI runs
```
