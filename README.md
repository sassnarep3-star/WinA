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
  content.mjs         the four guides
  pages-content.mjs   about, disclosure, privacy, marketing, SEO prose
  serve.mjs           local preview server (mirrors the /WinA/ subpath)
_worker/
  collector.js        first-party analytics collector, not deployed
assets/css/site.css   design system
assets/js/site.js     five events + sponsored-link confirmation
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
